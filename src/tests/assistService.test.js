import { describe, it, expect } from 'vitest'
import {
  executeTool,
  createOfflineFallbackResponse,
} from '../../server/assistService.js'

describe('AutoCare Assist Tool Registry & Execution', () => {
  const mockVehicle = {
    id: 'veh-123',
    name: 'Honda City ZX',
    make: 'Honda',
    model: 'City',
    year: 2022,
    fuel_type: 'Petrol',
    vehicle_type: 'car',
    current_odometer: 18450,
    license_plate: 'KA01AB1234',
  }

  const mockServices = [
    {
      id: 'srv-1',
      date: '2024-08-15',
      service_type: 'Regular Service',
      garage: 'Apex Honda Hub',
      cost: 4200,
      odometer: 15400,
      notes: 'Replaced engine oil and air filter',
    },
    {
      id: 'srv-2',
      date: '2024-01-10',
      service_type: 'Wheel Alignment',
      garage: 'Bridgestone Tyre Point',
      cost: 1100,
      odometer: 10200,
    },
  ]

  const mockExpenses = [
    { id: 'exp-1', category: 'Maintenance', amount: 4200, date: '2024-08-15' },
    { id: 'exp-2', category: 'Fuel', amount: 2500, date: '2024-09-01' },
    { id: 'exp-3', category: 'Toll', amount: 350, date: '2024-09-05' },
  ]

  const mockReminders = [
    {
      id: 'rem-1',
      title: 'Engine Oil Replacement',
      due_date: '2025-02-15',
      due_odometer: 25000,
      is_completed: false,
    },
    {
      id: 'rem-2',
      title: 'Insurance Renewal',
      due_date: '2024-01-01', // overdue
      is_completed: false,
    },
  ]

  const mockDocs = [
    { type: 'Registration Certificate (RC)', name: 'RC Card', expiry_date: null },
    { type: 'Insurance Policy', name: 'Comprehensive Cover', expiry_date: '2025-06-30' },
  ]

  const mockFuel = [
    { date: '2024-09-01', odometer: 18000, cost: 2500, litres: 24.5 },
    { date: '2024-08-10', odometer: 17500, cost: 2300, litres: 22.8 },
  ]

  it('get_active_vehicle returns sanitized vehicle specs and masks license plate', () => {
    const res = executeTool('get_active_vehicle', {}, { activeVehicle: mockVehicle })
    expect(res.available).toBe(true)
    expect(res.make).toBe('Honda')
    expect(res.model).toBe('City')
    expect(res.currentOdometer).toBe(18450)
    expect(res.licensePlateMasked).toBe('KA01••••')
  })

  it('get_active_vehicle handles empty vehicle state gracefully', () => {
    const res = executeTool('get_active_vehicle', {}, { activeVehicle: null })
    expect(res.available).toBe(false)
    expect(res.message).toContain('No active vehicle')
  })

  it('get_vehicle_service_history returns sorted services and last service summary', () => {
    const res = executeTool('get_vehicle_service_history', { limit: 1 }, { services: mockServices })
    expect(res.totalServicesRecorded).toBe(2)
    expect(res.lastService.date).toBe('2024-08-15')
    expect(res.lastService.garage).toBe('Apex Honda Hub')
    expect(res.services.length).toBe(1)
  })

  it('get_vehicle_expenses sums amounts and calculates byCategory breakdown', () => {
    const res = executeTool('get_vehicle_expenses', {}, { expenses: mockExpenses })
    expect(res.totalExpensesRecorded).toBe(3)
    expect(res.totalAmount).toBe(7050)
    expect(res.byCategory['Maintenance']).toBe(4200)
    expect(res.byCategory['Fuel']).toBe(2500)
  })

  it('get_vehicle_reminders categorizes reminders and detects overdue items', () => {
    const res = executeTool('get_vehicle_reminders', { status: 'all' }, { reminders: mockReminders })
    expect(res.count).toBe(2)
    const overdue = res.reminders.find((r) => r.id === 'rem-2')
    expect(overdue.isOverdue).toBe(true)
  })

  it('get_vehicle_documents_metadata returns expiry metadata without exposing raw files', () => {
    const res = executeTool('get_vehicle_documents_metadata', {}, { documents: mockDocs })
    expect(res.count).toBe(2)
    expect(res.documents[1].type).toBe('Insurance Policy')
    expect(res.documents[1].expiryDate).toBe('2025-06-30')
    expect(res.documents[1]).not.toHaveProperty('file')
    expect(res.documents[1]).not.toHaveProperty('base64')
  })

  it('get_vehicle_fuel_summary aggregates total fuel spend and last fill details', () => {
    const res = executeTool('get_vehicle_fuel_summary', {}, { fuelLogs: mockFuel })
    expect(res.totalFillUps).toBe(2)
    expect(res.totalSpend).toBe(4800)
    expect(res.lastFillUp.date).toBe('2024-09-01')
  })

  it('search_nearby_places builds Google Maps search and directions query', () => {
    const res = executeTool(
      'search_nearby_places',
      { category: 'puncture', query: 'flat tyre' },
      { location: { city: 'Bangalore' } }
    )
    expect(res.category).toBe('puncture')
    expect(res.directionsUrl).toContain('maps/search/?api=1')
    expect(res.directionsUrl).toContain('Bangalore')
  })

  it('prepare_reminder_action returns structured proposal requiring user consent', () => {
    const res = executeTool('prepare_reminder_action', {
      title: 'Brake Pad Inspection',
      dueDate: '2025-04-10',
      reminderType: 'service',
    })
    expect(res.status).toBe('PROPOSED')
    expect(res.proposal.title).toBe('Brake Pad Inspection')
    expect(res.message).toContain('User confirmation required')
  })
})

describe('AutoCare Assist Safety & Grounded Fallbacks', () => {
  it('overheating query triggers high-urgency safety warning and forbids opening hot cap', () => {
    const res = createOfflineFallbackResponse({
      message: 'My engine is overheating with steam',
      activeVehicle: { name: 'Hyundai Creta' },
    })
    expect(res.data.safetyWarning).toContain('NEVER open the radiator cap')
    expect(res.data.suggestedSteps[0]).toContain('Pull over')
    expect(res.data.nearbyPlaces[0].category).toBe('towing')
  })

  it('puncture query suggests safe stopping location and nearby tyre repair', () => {
    const res = createOfflineFallbackResponse({
      message: 'I have a flat tyre puncture',
      location: { city: 'Mumbai' },
    })
    expect(res.data.safetyWarning).toContain('hazard lights')
    expect(res.data.nearbyPlaces[0].category).toBe('puncture')
  })

  it('last service query grounds answer in actual records without hallucinating', () => {
    const services = [
      { date: '2024-06-20', garage: 'Speedy Garage', cost: 3200, odometer: 12000 },
    ]
    const res = createOfflineFallbackResponse({
      message: 'When was my last service?',
      services,
    })
    expect(res.data.shortAnswer).toContain('2024-06-20')
    expect(res.data.shortAnswer).toContain('Speedy Garage')
    expect(res.data.relevantRecords[0].value).toBe('2024-06-20')
  })

  it('last service query states unavailable when no records exist', () => {
    const res = createOfflineFallbackResponse({
      message: 'When was my last service?',
      services: [],
    })
    expect(res.data.shortAnswer).toContain('No service records have been logged')
    expect(res.data.relevantRecords.length).toBe(0)
  })
})
