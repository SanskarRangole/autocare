import { describe, it, expect, beforeEach } from 'vitest'
import {
  signIn,
  signUp,
  getVehicles,
  createVehicle,
  getServices,
  createService,
  getFuelLogs,
  createFuelLog,
  getExpenses,
  getReminders,
  createReminder,
  toggleReminderStatus,
  getVehicleTimeline,
  clearAllLocalData,
} from '../lib/storage'
import {
  calculateFuelSummary,
  calculateExpenseSummary,
  generateVehicleInsights,
} from '../lib/utils'

describe('End-to-End User Journey', () => {
  const testEmail = `driver_${Date.now()}@example.com`
  let user = null
  let car = null

  beforeEach(async () => {
    await clearAllLocalData()
  })

  it('completes the entire vehicle lifecycle journey', async () => {
    // 1. User Registration & Login
    const authResult = await signUp({
      email: testEmail,
      password: 'SecurePassword123!',
      fullName: 'Jordan Pilot',
    })
    user = authResult.user
    expect(user).toBeDefined()
    expect(user.email).toBe(testEmail)

    // 2. Add a new Vehicle (2022 Mazda CX-5)
    car = await createVehicle(user.id, {
      name: 'Mazda CX-5 GT',
      type: 'suv',
      make: 'Mazda',
      model: 'CX-5',
      year: 2022,
      license_plate: 'MZ-889-GT',
      current_odometer: 30000,
      fuel_type: 'Petrol',
      insurance_expiry: '2026-11-15',
      puc_expiry: '2026-10-20',
    })

    expect(car.id).toBeDefined()
    expect(car.name).toBe('Mazda CX-5 GT')

    const userVehicles = await getVehicles(user.id)
    expect(userVehicles.length).toBe(1)
    expect(userVehicles[0].id).toBe(car.id)

    // 3. Log a Service Record (30,000 km Major Service)
    const service = await createService(user.id, car.id, {
      date: '2026-08-10',
      odometer: 30000,
      service_type: 'Full Synthetic Oil & Filter Service',
      garage: 'Mazda Dealership',
      cost: 140,
      notes: 'Castrol Edge 0W-20 with OEM Mazda filter.',
    })
    expect(service.id).toBeDefined()
    expect(service.cost).toBe(140)

    const services = await getServices(car.id)
    expect(services.length).toBe(1)

    // 4. Verify Automatic Expense Synchronization (no double counting)
    let expenses = await getExpenses(car.id)
    expect(expenses.length).toBe(1)
    expect(expenses[0].reference_type).toBe('service')
    expect(expenses[0].reference_id).toBe(service.id)
    expect(Number(expenses[0].amount)).toBe(140)

    // 5. Log Consecutive Fuel Refills to calculate Fuel Efficiency
    const fuel1 = await createFuelLog(user.id, car.id, {
      date: '2026-08-15',
      odometer: 30000,
      litres: 45,
      total_cost: 72,
      is_full_tank: true,
    })
    expect(fuel1.id).toBeDefined()

    const fuel2 = await createFuelLog(user.id, car.id, {
      date: '2026-08-29',
      odometer: 30600, // 600 km driven on 42 litres = 14.29 km/L
      litres: 42,
      total_cost: 67.2,
      is_full_tank: true,
    })
    expect(fuel2.id).toBeDefined()

    const fuelLogs = await getFuelLogs(car.id)
    expect(fuelLogs.length).toBe(2)

    // Check fuel summary metrics
    const fuelSummary = calculateFuelSummary(fuelLogs)
    expect(fuelSummary.totalSpent).toBe(139.2)
    expect(fuelSummary.avgEfficiency).toBe(14.29)

    // Verify expenses updated with both fuel entries
    expenses = await getExpenses(car.id)
    // 1 service expense + 2 fuel expenses = 3 total expenses
    expect(expenses.length).toBe(3)
    const expenseSummary = calculateExpenseSummary(expenses)
    expect(expenseSummary.totalSpent).toBe(140 + 72 + 67.2)

    // 6. Maintenance Reminders & Completion
    const reminder = await createReminder(user.id, car.id, {
      title: 'Tire Pressure & Rotation',
      category: 'service',
      due_odometer: 35000,
      due_date: '2026-12-01',
      notes: 'Check tread depth and torque lug nuts.',
    })
    expect(reminder.is_completed).toBe(false)

    // Mark completed
    const updatedReminder = await toggleReminderStatus(reminder.id, true)
    expect(updatedReminder.is_completed).toBe(true)
    expect(updatedReminder.completed_date).toBeDefined()

    // 7. Verify Chronological Vehicle Timeline
    const timeline = await getVehicleTimeline(car.id)
    expect(timeline.length).toBeGreaterThanOrEqual(4)
    // Timeline should have items for services, fuels, and completed reminders
    const hasServiceEvent = timeline.some(t => t.type === 'service')
    const hasFuelEvent = timeline.some(t => t.type === 'fuel')
    const hasReminderEvent = timeline.some(t => t.type === 'reminder')
    expect(hasServiceEvent).toBe(true)
    expect(hasFuelEvent).toBe(true)
    expect(hasReminderEvent).toBe(true)

    // 8. Generate Rule-Based Insights
    const insights = generateVehicleInsights({
      vehicle: car,
      services,
      fuelLogs,
      reminders: [reminder],
      expenses,
    })
    expect(insights.length).toBeGreaterThan(0)
    const hasFuelInsight = insights.some(i => i.id === 'fuel-efficiency-good')
    expect(hasFuelInsight).toBe(true)
  })
})
