/**
 * AUTOCARE ASSIST CLIENT
 * Dispatches queries to the secure server endpoint /api/assist
 * with sanitized vehicle records and error resiliency.
 */

export const QUICK_ACTIONS = [
  { id: 'start', label: "My vehicle won't start", icon: 'AlertTriangle', emergency: false },
  { id: 'garages', label: 'Find nearby garages', icon: 'Wrench', emergency: false },
  { id: 'puncture', label: 'Find puncture repair', icon: 'Disc', emergency: false },
  { id: 'overheat', label: 'My engine is overheating', icon: 'Flame', emergency: true },
  { id: 'maintenance', label: 'Check upcoming maintenance', icon: 'Calendar', emergency: false },
  { id: 'service-bill', label: 'Explain my service bill', icon: 'Receipt', emergency: false },
  { id: 'fuel-stations', label: 'Find nearby fuel stations', icon: 'Fuel', emergency: false },
  { id: 'compliance', label: 'Check my insurance and PUC', icon: 'ShieldAlert', emergency: false },
  { id: 'last-service', label: 'Show my last service', icon: 'Clock', emergency: false },
  { id: 'expenses', label: 'Calculate vehicle expenses', icon: 'PieChart', emergency: false },
]

/**
 * Send query to the secure server assistant endpoint
 */
export async function sendAssistMessage({
  message,
  activeVehicle = null,
  services = [],
  fuelLogs = [],
  expenses = [],
  reminders = [],
  documents = [],
  location = null,
  history = [],
}) {
  // Sanitize vehicle data for privacy and security
  const sanitizedVehicle = activeVehicle
    ? {
        id: activeVehicle.id,
        name: activeVehicle.name,
        make: activeVehicle.make || activeVehicle.manufacturer,
        model: activeVehicle.model,
        year: activeVehicle.year,
        fuel_type: activeVehicle.fuel_type,
        vehicle_type: activeVehicle.vehicle_type,
        current_odometer: activeVehicle.current_odometer,
        license_plate: activeVehicle.license_plate
          ? `${activeVehicle.license_plate.slice(0, 4)}••••`
          : undefined,
      }
    : null

  // Send only document metadata, never binary file payloads
  const sanitizedDocs = (documents || []).map((d) => ({
    type: d.type || d.document_type,
    name: d.name,
    expiry_date: d.expiry_date,
  }))

  const payload = {
    message,
    activeVehicle: sanitizedVehicle,
    services: (services || []).slice(0, 15),
    fuelLogs: (fuelLogs || []).slice(0, 15),
    expenses: (expenses || []).slice(0, 20),
    reminders: (reminders || []).slice(0, 10),
    documents: sanitizedDocs,
    location,
    history: (history || []).slice(-6),
  }

  try {
    const res = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `Server responded with status ${res.status}`)
    }

    const json = await res.json()
    return json
  } catch (err) {
    console.warn('[Assist Client Error]', err.message)

    // Fallback response if network or server drops
    return {
      success: true,
      isFallback: true,
      errorNotice: err.message,
      data: {
        shortAnswer:
          'AutoCare Assist experienced a temporary network interruption. Here is local guidance based on your query.',
        safetyWarning: message.toLowerCase().includes('overheat')
          ? 'Pull over immediately and shut off the engine. Do NOT open the radiator cap.'
          : null,
        suggestedSteps: [
          'Verify your network connection or check if the local server is running.',
          'Review your vehicle records directly using the AutoCare tabs below.',
        ],
        relevantRecords: activeVehicle
          ? [
              {
                label: 'Active Vehicle',
                value: `${activeVehicle.name} (${activeVehicle.current_odometer || 0} km)`,
              },
            ]
          : [],
        nearbyPlaces: [],
        suggestedActions: [
          { type: 'VIEW_SERVICES', label: 'View Service History', payload: {} },
          { type: 'FIND_NEARBY', label: 'Find Nearby Assistance', payload: {} },
        ],
      },
    }
  }
}
