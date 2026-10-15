import { describe, it, expect, beforeEach } from 'vitest'
import {
  createFuelLog,
  getFuelLogs,
  getExpenses,
  deleteFuelLog,
  createVehicle,
  createService,
  getServices,
  clearAllLocalData,
} from '../lib/storage'
import { calculateFuelLogMetrics, calculateFuelSummary } from '../lib/utils'

describe('Quick Fuel & Zero-Friction Automation Tests', () => {
  const testUserId = 'user_automation_test'
  let testVehicle

  beforeEach(async () => {
    await clearAllLocalData()
    testVehicle = await createVehicle({
      user_id: testUserId,
      name: 'Test Swift VXI',
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2023,
      current_odometer: 15000,
      fuel_type: 'Petrol',
      license_plate: 'MH 12 AB 1234',
    })
  })

  it('records quick fuel with amount only as a spending-only entry', async () => {
    const quickLog = await createFuelLog(testUserId, testVehicle.id, {
      date: '2026-10-15',
      total_cost: 500,
      litres: 0,
      is_spending_only: true,
      fuel_brand: 'IOCL',
    })

    expect(quickLog).toBeDefined()
    expect(quickLog.total_cost).toBe(500)
    expect(quickLog.litres).toBe(0)

    // Check linked expense
    const expenses = await getExpenses(testVehicle.id)
    const linked = expenses.find((e) => e.reference_id === quickLog.id)
    expect(linked).toBeDefined()
    expect(linked.category).toBe('Fuel')
    expect(linked.amount).toBe(500)
  })

  it('spending-only fuel entries do not pollute tank-to-tank efficiency calculations', async () => {
    // 1. Initial full fill
    await createFuelLog(testUserId, testVehicle.id, {
      date: '2026-10-01',
      odometer: 15000,
      litres: 35,
      total_cost: 3500,
      is_full_tank: true,
    })

    // 2. Spending-only quick top-up
    await createFuelLog(testUserId, testVehicle.id, {
      date: '2026-10-05',
      odometer: 15000,
      total_cost: 500,
      litres: 0,
      is_spending_only: true,
    })

    // 3. Next full fill
    await createFuelLog(testUserId, testVehicle.id, {
      date: '2026-10-10',
      odometer: 15500,
      litres: 33.3,
      total_cost: 3400,
      is_full_tank: true,
    })

    const logs = await getFuelLogs(testVehicle.id)
    const summary = calculateFuelSummary(logs, 'km', 'litres')

    // Total spent must include the ₹500 spending-only entry
    expect(summary.totalSpent).toBe(3500 + 500 + 3400)

    // Average efficiency must still calculate valid tank-to-tank: 500 km / 33.3 L = ~15.02 km/L
    expect(summary.avgEfficiency).toBeGreaterThan(14.5)
    expect(summary.avgEfficiency).toBeLessThan(15.5)
  })

  it('undoing a fuel log removes both the fuel record and its synchronized expense', async () => {
    const quickLog = await createFuelLog(testUserId, testVehicle.id, {
      date: '2026-10-15',
      total_cost: 1000,
      litres: 10,
      odometer: 15200,
    })

    let expenses = await getExpenses(testVehicle.id)
    expect(expenses.some((e) => e.reference_id === quickLog.id)).toBe(true)

    // Perform Undo
    await deleteFuelLog(quickLog.id)

    const logsAfter = await getFuelLogs(testVehicle.id)
    expect(logsAfter.some((l) => l.id === quickLog.id)).toBe(false)

    expenses = await getExpenses(testVehicle.id)
    expect(expenses.some((e) => e.reference_id === quickLog.id)).toBe(false)
  })

  it('supports repeating a previous service record with updated date and verified cost', async () => {
    const originalService = await createService(testUserId, testVehicle.id, {
      service_type: 'Oil & Filter Change',
      garage: 'Bosch Car Service',
      cost: 2500,
      date: '2026-04-10',
      odometer: 10000,
      notes: 'Synthetic 5W-30 engine oil and oil filter replaced',
    })

    // Simulate Repeat Service action
    const repeatedService = await createService(testUserId, testVehicle.id, {
      service_type: originalService.service_type,
      garage: originalService.garage,
      cost: 2600, // Updated current cost
      date: '2026-10-15',
      odometer: 15000,
      notes: originalService.notes,
    })

    const allServices = await getServices(testVehicle.id)
    expect(allServices.length).toBe(2)
    expect(repeatedService.service_type).toBe('Oil & Filter Change')
    expect(repeatedService.garage).toBe('Bosch Car Service')
    expect(repeatedService.cost).toBe(2600)
  })
})
