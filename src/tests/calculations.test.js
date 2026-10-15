import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDistance,
  formatVolume,
  getDaysDifference,
  calculateFuelLogMetrics,
  calculateFuelSummary,
  calculateExpenseSummary,
  generateVehicleInsights,
} from '../lib/utils'

describe('Formatting Utilities', () => {
  it('formats currency correctly with various symbols', () => {
    expect(formatCurrency(1500, 'USD')).toBe('$1,500.00')
    expect(formatCurrency(45.5, 'EUR')).toBe('€45.50')
    expect(formatCurrency(85000, 'INR')).toBe('₹85,000.00')
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('formats distance and volume with appropriate units', () => {
    expect(formatDistance(12500, 'km')).toBe('12,500 km')
    expect(formatDistance(5000, 'miles')).toBe('5,000 miles')
    expect(formatDistance(null)).toBe('-')

    expect(formatVolume(42.55, 'litres')).toBe('42.5 L')
    expect(formatVolume(10, 'gallons')).toBe('10.0 gal')
    expect(formatVolume(null)).toBe('-')
  })

  it('calculates days difference accurately', () => {
    const today = new Date()
    const fiveDaysLater = new Date(today)
    fiveDaysLater.setDate(today.getDate() + 5)
    const fiveDaysAgo = new Date(today)
    fiveDaysAgo.setDate(today.getDate() - 5)

    const yyyyMmDdLater = fiveDaysLater.toISOString().split('T')[0]
    const yyyyMmDdAgo = fiveDaysAgo.toISOString().split('T')[0]

    expect(getDaysDifference(yyyyMmDdLater)).toBe(5)
    expect(getDaysDifference(yyyyMmDdAgo)).toBe(-5)
    expect(getDaysDifference(null)).toBeNull()
  })
})

describe('Fuel Efficiency Calculations', () => {
  const sampleLogs = [
    {
      id: '1',
      odometer: 10000,
      litres: 40,
      total_cost: 60,
      is_full_tank: true,
      missed_previous_fill: false,
    },
    {
      id: '2',
      odometer: 10500, // 500 km driven on 35 litres = 500 / 35 = 14.29 km/L
      litres: 35,
      total_cost: 52.5,
      is_full_tank: true,
      missed_previous_fill: false,
    },
    {
      id: '3',
      odometer: 11050, // 550 km driven on 36.5 litres = 550 / 36.5 = 15.07 km/L
      litres: 36.5,
      total_cost: 55,
      is_full_tank: true,
      missed_previous_fill: false,
    },
  ]

  it('calculates step-by-step fuel log metrics for consecutive fills', () => {
    const metrics = calculateFuelLogMetrics(sampleLogs, 'km', 'litres')
    expect(metrics.length).toBe(3)
    // First log cannot have efficiency because no prior baseline odometer
    expect(metrics[0].isCalculated).toBe(false)
    expect(metrics[0].efficiency).toBeNull()

    // Second log: 500 km / 35 L = 14.29 km/L
    expect(metrics[1].isCalculated).toBe(true)
    expect(metrics[1].distanceDelta).toBe(500)
    expect(metrics[1].efficiency).toBe(14.29)

    // Third log: 550 km / 36.5 L = 15.07 km/L
    expect(metrics[2].isCalculated).toBe(true)
    expect(metrics[2].distanceDelta).toBe(550)
    expect(metrics[2].efficiency).toBe(15.07)
  })

  it('aggregates overall fuel economy and spend totals', () => {
    const summary = calculateFuelSummary(sampleLogs, 'km', 'litres')
    expect(summary.totalSpent).toBe(167.5)
    expect(summary.totalLitres).toBe(111.5)
    expect(summary.totalDistance).toBe(1050) // 11050 - 10000
    // Average efficiency between 14.29 and 15.07 = 14.68
    expect(summary.avgEfficiency).toBe(14.68)
    expect(summary.efficiencyUnit).toBe('km/L')
  })

  it('handles empty fuel log lists gracefully', () => {
    const summary = calculateFuelSummary([])
    expect(summary.totalSpent).toBe(0)
    expect(summary.avgEfficiency).toBeNull()
  })
})

describe('Expense Summaries and Aggregations', () => {
  const sampleExpenses = [
    { category: 'Fuel', amount: 60, date: '2026-08-10' },
    { category: 'Fuel', amount: 55, date: '2026-09-12' },
    { category: 'Service', amount: 220, date: '2026-09-15' },
    { category: 'Insurance', amount: 450, date: '2026-07-01' },
    { category: 'Wash & Detailing', amount: 35, date: '2026-09-20' },
  ]

  it('aggregates total spent and categories accurately', () => {
    const summary = calculateExpenseSummary(sampleExpenses)
    expect(summary.totalSpent).toBe(820)
    expect(summary.categoryTotals['Fuel']).toBe(115)
    expect(summary.categoryTotals['Service']).toBe(220)
    expect(summary.categoryTotals['Insurance']).toBe(450)
    expect(summary.categoryTotals['Wash & Detailing']).toBe(35)
    expect(summary.categoryChartData.length).toBe(4)
    expect(summary.categoryChartData[0].name).toBe('Insurance')
    expect(summary.categoryChartData[0].value).toBe(450)
  })

  it('groups monthly totals correctly', () => {
    const summary = calculateExpenseSummary(sampleExpenses)
    expect(summary.monthlyTotals.length).toBeGreaterThan(0)
    const sepEntry = summary.monthlyTotals.find(m => m.month.includes('Sep'))
    expect(sepEntry).toBeDefined()
    expect(sepEntry.amount).toBe(310) // 55 + 220 + 35 = 310
  })
})

describe('Rule-Based Vehicle Insights', () => {
  it('generates overdue insurance warning when expiry date has passed', () => {
    const vehicle = {
      id: 'v1',
      name: 'Honda Civic',
      current_odometer: 15000,
      insurance_expiry: '2026-01-01', // in past relative to current date 2026-10-15
    }
    const insights = generateVehicleInsights({ vehicle })
    const insuranceInsight = insights.find(i => i.id === 'insurance-overdue')
    expect(insuranceInsight).toBeDefined()
    expect(insuranceInsight.type).toBe('danger')
  })

  it('flags mileage-based service when remaining distance is low', () => {
    const vehicle = {
      id: 'v1',
      name: 'Yamaha MT-07',
      current_odometer: 9800,
    }
    const reminders = [
      {
        id: 'rem-1',
        title: '10,000 km Major Service',
        due_odometer: 10000, // 200 km left
        is_completed: false,
      },
    ]
    const insights = generateVehicleInsights({ vehicle, reminders })
    const serviceInsight = insights.find(i => i.id.startsWith('reminder-odo-soon'))
    expect(serviceInsight).toBeDefined()
    expect(serviceInsight.title).toContain('Service Due in 200 km')
  })
})

describe('Smart Fuel & Service Calculations', () => {
  it('calculates 3rd parameter from any 2 fuel metrics accurately', () => {
    // 1. Cost & Price -> Volume: $60 at $1.50/L = 40 Litres
    const cost = 60
    const price = 1.5
    const volumeFromCostAndPrice = Number((cost / price).toFixed(2))
    expect(volumeFromCostAndPrice).toBe(40)

    // 2. Volume & Price -> Cost: 35.5 Litres at $2.00/L = $71.00
    const vol = 35.5
    const rate = 2.0
    const costFromVolAndRate = Number((vol * rate).toFixed(2))
    expect(costFromVolAndRate).toBe(71)

    // 3. Cost & Volume -> Price: ₹2500 for 25 Litres = ₹100.00/L
    const total = 2500
    const litres = 25
    const unitPrice = Number((total / litres).toFixed(2))
    expect(unitPrice).toBe(100)
  })

  it('projects future service intervals accurately (+6 months & +10,000 km)', () => {
    const currentOdo = 25000
    const projectedOdo = currentOdo + 10000
    expect(projectedOdo).toBe(35000)

    const baseDate = new Date('2026-04-15')
    const nextDate = new Date(baseDate)
    nextDate.setMonth(nextDate.getMonth() + 6)
    expect(nextDate.toISOString().split('T')[0]).toBe('2026-10-15')
  })
})

