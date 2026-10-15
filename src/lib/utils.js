import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines tailwind class names safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Currency symbol and formatting
 */
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
}

export function formatCurrency(amount, currency = 'USD') {
  const num = Number(amount) || 0
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' '
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Distance formatting
 */
export function formatDistance(distance, unit = 'km') {
  if (distance === null || distance === undefined || distance === '') return '-'
  const num = Number(distance) || 0
  return `${num.toLocaleString()} ${unit}`
}

/**
 * Volume formatting
 */
export function formatVolume(volume, unit = 'litres') {
  if (volume === null || volume === undefined || volume === '') return '-'
  const num = Number(volume) || 0
  return `${num.toFixed(1)} ${unit === 'gallons' ? 'gal' : 'L'}`
}

/**
 * Format Date nicely
 */
export function formatDate(dateString, formatStr = 'MMM d, yyyy') {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Days difference between today and a target date
 * Returns positive if in future, negative if in past (overdue)
 */
export function getDaysDifference(targetDateString) {
  if (!targetDateString) return null
  try {
    const target = new Date(targetDateString)
    const today = new Date()
    // Reset time portions for accurate day comparison
    target.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

/**
 * Calculate Fuel Economy (km/L or MPG) from chronological fuel logs
 * Formula: for consecutive full tank refills,
 * Distance = Current Odo - Previous Odo
 * Efficiency = Distance / Litres filled
 */
export function calculateFuelLogMetrics(fuelLogs = [], distanceUnit = 'km', volumeUnit = 'litres') {
  if (!fuelLogs || fuelLogs.length === 0) return []

  // Sort ascending by odometer
  const sorted = [...fuelLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer))

  return sorted.map((log, index) => {
    let distanceDelta = null
    let efficiency = null
    let isCalculated = false

    if (index > 0) {
      const prev = sorted[index - 1]
      const odoDelta = Number(log.odometer) - Number(prev.odometer)

      // Only calculate efficiency if distance delta is positive and both are full tank (or regular sequence)
      if (odoDelta > 0 && Number(log.litres) > 0 && !log.missed_previous_fill) {
        distanceDelta = odoDelta
        isCalculated = true
        // If distance is km and volume is litres: km/L
        // If distance is miles and volume is gallons: MPG
        efficiency = odoDelta / Number(log.litres)
      }
    }

    return {
      ...log,
      distanceDelta,
      efficiency: efficiency ? Number(efficiency.toFixed(2)) : null,
      isCalculated,
      unitLabel: distanceUnit === 'miles' ? 'mpg' : 'km/L',
    }
  })
}

/**
 * Calculate overall fuel statistics
 */
export function calculateFuelSummary(fuelLogs = [], distanceUnit = 'km', volumeUnit = 'litres') {
  if (!fuelLogs || fuelLogs.length === 0) {
    return {
      totalSpent: 0,
      totalLitres: 0,
      totalDistance: 0,
      avgEfficiency: null,
      avgCostPerUnit: null,
      avgCostPerDistance: null,
      efficiencyUnit: distanceUnit === 'miles' ? 'mpg' : 'km/L',
    }
  }

  const enrichedLogs = calculateFuelLogMetrics(fuelLogs, distanceUnit, volumeUnit)
  const totalSpent = fuelLogs.reduce((sum, f) => sum + (Number(f.total_cost) || 0), 0)
  const totalLitres = fuelLogs.reduce((sum, f) => sum + (Number(f.litres) || 0), 0)

  // Calculate efficiency from logs that have valid efficiency
  const validEfficiencies = enrichedLogs.filter(l => l.efficiency !== null && l.efficiency > 0)
  const avgEfficiency = validEfficiencies.length > 0
    ? Number((validEfficiencies.reduce((s, l) => s + l.efficiency, 0) / validEfficiencies.length).toFixed(2))
    : null

  const avgCostPerUnit = totalLitres > 0 ? Number((totalSpent / totalLitres).toFixed(2)) : null

  // Total distance driven across fuel logs
  let totalDistance = 0
  if (fuelLogs.length >= 2) {
    const minOdo = Math.min(...fuelLogs.map(f => Number(f.odometer) || 0))
    const maxOdo = Math.max(...fuelLogs.map(f => Number(f.odometer) || 0))
    totalDistance = Math.max(0, maxOdo - minOdo)
  }

  const avgCostPerDistance = totalDistance > 0 ? Number((totalSpent / totalDistance).toFixed(2)) : null

  return {
    totalSpent,
    totalLitres: Number(totalLitres.toFixed(1)),
    totalDistance,
    avgEfficiency,
    avgCostPerUnit,
    avgCostPerDistance,
    efficiencyUnit: distanceUnit === 'miles' ? 'mpg' : 'km/L',
  }
}

/**
 * Calculate Expense summary & aggregations for charts
 */
export function calculateExpenseSummary(expenses = []) {
  if (!expenses || expenses.length === 0) {
    return {
      totalSpent: 0,
      categoryTotals: {},
      monthlyTotals: [],
      categoryChartData: [],
    }
  }

  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  // Category totals
  const categoryTotals = {}
  expenses.forEach(e => {
    const cat = e.category || 'Other'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0)
  })

  // Chart data for categories
  const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  })).sort((a, b) => b.value - a.value)

  // Monthly totals (last 12 months)
  const monthMap = {}
  expenses.forEach(e => {
    if (!e.date) return
    const d = new Date(e.date)
    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!monthMap[key]) {
      monthMap[key] = { key, label, total: 0 }
    }
    monthMap[key].total += (Number(e.amount) || 0)
  })

  const monthlyTotals = Object.values(monthMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6) // Recent 6 months for clean dashboard view
    .map(m => ({
      month: m.label,
      amount: Number(m.total.toFixed(2)),
    }))

  return {
    totalSpent,
    categoryTotals,
    categoryChartData,
    monthlyTotals,
  }
}

/**
 * Generate Rule-Based Insights
 */
export function generateVehicleInsights({ vehicle, services = [], fuelLogs = [], reminders = [], expenses = [] }) {
  const insights = []

  if (!vehicle) return insights

  // 1. Insurance expiry insight
  if (vehicle.insurance_expiry) {
    const daysLeft = getDaysDifference(vehicle.insurance_expiry)
    if (daysLeft !== null) {
      if (daysLeft < 0) {
        insights.push({
          id: 'insurance-overdue',
          type: 'danger',
          title: 'Insurance Policy Expired',
          description: `Your insurance expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago (${formatDate(vehicle.insurance_expiry)}). Renew immediately to remain legally compliant.`,
          actionLink: '#reminders',
        })
      } else if (daysLeft <= 15) {
        insights.push({
          id: 'insurance-due-soon',
          type: 'warning',
          title: 'Insurance Renewal Approaching',
          description: `Insurance for ${vehicle.name} is due in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${formatDate(vehicle.insurance_expiry)}).`,
          actionLink: '#reminders',
        })
      }
    }
  }

  // 2. PUC / Emission expiry insight
  if (vehicle.puc_expiry) {
    const daysLeft = getDaysDifference(vehicle.puc_expiry)
    if (daysLeft !== null) {
      if (daysLeft < 0) {
        insights.push({
          id: 'puc-overdue',
          type: 'danger',
          title: 'PUC / Emission Test Expired',
          description: `Pollution Certificate expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago. Avoid traffic fines by obtaining a new certificate.`,
          actionLink: '#documents',
        })
      } else if (daysLeft <= 10) {
        insights.push({
          id: 'puc-due-soon',
          type: 'warning',
          title: 'PUC Test Due Soon',
          description: `Emission check expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${formatDate(vehicle.puc_expiry)}).`,
          actionLink: '#documents',
        })
      }
    }
  }

  // 3. Maintenance Reminders check
  const activeReminders = reminders.filter(r => !r.is_completed)
  for (const rem of activeReminders) {
    if (rem.due_date) {
      const days = getDaysDifference(rem.due_date)
      if (days !== null && days < 0) {
        insights.push({
          id: `reminder-overdue-${rem.id}`,
          type: 'danger',
          title: `Overdue: ${rem.title}`,
          description: `Scheduled maintenance was due on ${formatDate(rem.due_date)}.`,
          actionLink: '#reminders',
        })
      } else if (days !== null && days <= 7) {
        insights.push({
          id: `reminder-soon-${rem.id}`,
          type: 'warning',
          title: `Due in ${days} days: ${rem.title}`,
          description: `Scheduled for ${formatDate(rem.due_date)}.`,
          actionLink: '#reminders',
        })
      }
    }

    if (rem.due_odometer && vehicle.current_odometer) {
      const remainingDistance = Number(rem.due_odometer) - Number(vehicle.current_odometer)
      if (remainingDistance <= 0) {
        insights.push({
          id: `reminder-odo-overdue-${rem.id}`,
          type: 'danger',
          title: `Mileage Service Overdue: ${rem.title}`,
          description: `Target was ${rem.due_odometer.toLocaleString()} km, current is ${vehicle.current_odometer.toLocaleString()} km.`,
          actionLink: '#services',
        })
      } else if (remainingDistance <= 500) {
        insights.push({
          id: `reminder-odo-soon-${rem.id}`,
          type: 'warning',
          title: `Service Due in ${remainingDistance.toLocaleString()} km`,
          description: `${rem.title} is scheduled at ${rem.due_odometer.toLocaleString()} km.`,
          actionLink: '#services',
        })
      }
    }
  }

  // 4. Fuel Efficiency insights
  if (fuelLogs.length >= 2) {
    const fuelSummary = calculateFuelSummary(fuelLogs)
    if (fuelSummary.avgEfficiency) {
      insights.push({
        id: 'fuel-efficiency-good',
        type: 'info',
        title: `Average Fuel Economy: ${fuelSummary.avgEfficiency} ${fuelSummary.efficiencyUnit}`,
        description: `Calculated from ${fuelLogs.length} fill-ups over ${fuelSummary.totalDistance.toLocaleString()} km. Regular tire pressure checks help maintain peak economy.`,
        actionLink: '#fuel',
      })
    }
  } else if (fuelLogs.length === 1) {
    insights.push({
      id: 'fuel-more-data-needed',
      type: 'info',
      title: 'Log One More Full Tank for Mileage Calculation',
      description: 'AutoCare needs at least 2 consecutive fuel entries to compute your vehicle’s exact fuel efficiency.',
      actionLink: '#fuel',
    })
  }

  // 5. Total cost of ownership insight
  const totalCost = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  if (totalCost > 0 && vehicle.current_odometer > 0) {
    const costPerKm = (totalCost / Number(vehicle.current_odometer)).toFixed(2)
    insights.push({
      id: 'cost-of-ownership',
      type: 'info',
      title: 'Cost per Distance Metric',
      description: `Lifetime recorded operating cost is ~${costPerKm} per km driven (fuel, service, and maintenance included).`,
      actionLink: '#expenses',
    })
  }

  return insights
}
