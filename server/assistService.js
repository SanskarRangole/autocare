import { GoogleGenAI } from '@google/genai'

/**
 * AUTO-CARE ASSIST SERVER SERVICE
 * Secure backend tool-calling engine for Gemini API.
 * Never leaks the API key to client React code.
 */

// Tool definitions for Gemini
export const ASSIST_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'get_active_vehicle',
        description: 'Returns active vehicle specifications, year, model, fuel type, and current odometer reading.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'get_vehicle_service_history',
        description: 'Returns historical maintenance and service logs for the active vehicle including dates, odometer, costs, and work performed.',
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: {
              type: 'NUMBER',
              description: 'Maximum number of recent records to return (default 5)',
            },
          },
        },
      },
      {
        name: 'get_vehicle_expenses',
        description: 'Returns total ownership expenses and category breakdown (fuel, maintenance, insurance, parking, tolls, etc.).',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              description: 'Optional specific expense category to filter by',
            },
          },
        },
      },
      {
        name: 'get_vehicle_reminders',
        description: 'Returns upcoming, due, or overdue maintenance, insurance, and PUC emission compliance reminders.',
        parameters: {
          type: 'OBJECT',
          properties: {
            status: {
              type: 'STRING',
              description: 'Filter by "all", "pending", "overdue", or "completed"',
            },
          },
        },
      },
      {
        name: 'get_vehicle_documents_metadata',
        description: 'Returns metadata about uploaded vehicle documents (RC, Insurance, PUC, invoices) including document types, expiry dates, and renewal status. Does not return private file content.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'get_vehicle_fuel_summary',
        description: 'Returns fuel fill-up statistics, recent mileage, total fuel spend, and average efficiency.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'search_nearby_places',
        description: 'Searches genuine nearby automotive assistance places (garages, mechanics, puncture shops, battery repair, towing, fuel, EV charging).',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              description: 'Service type: "garage", "bike_mechanic", "puncture", "battery", "towing", "fuel", "ev_charging", or "authorized_service"',
            },
            query: {
              type: 'STRING',
              description: 'Specific search keyword or vehicle brand (e.g., "Honda service", "flat tyre repair")',
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'prepare_reminder_action',
        description: 'Prepares a structured proposal to create a reminder for upcoming maintenance, insurance renewal, or inspection. Requires user confirmation before saving.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Reminder title (e.g. Engine Oil Renewal)' },
            dueDate: { type: 'STRING', description: 'Target date YYYY-MM-DD' },
            dueOdometer: { type: 'NUMBER', description: 'Target odometer km if applicable' },
            reminderType: { type: 'STRING', description: 'Type: service, insurance, puc, or general' },
          },
          required: ['title', 'reminderType'],
        },
      },
    ],
  },
]

// System prompt enforcing safety, grounding, and structured JSON output
export const SYSTEM_INSTRUCTION = `
You are AutoCare Assist, an intelligent, context-aware, and action-oriented vehicle ownership companion and real-world problem solver integrated into the AutoCare application.
Tagline: "Vehicle problems? Let's find the next step."

CRITICAL CORE RULES:
1. SAFETY FIRST:
   - For severe situations (engine overheating, smoke, fire, brake failure, steering issues, fuel leaks, unsafe highway stops):
     * IMMEDIATELY advise pulling over safely to the side and turning off the engine.
     * For overheating: WARN explicitly NEVER to open a hot radiator cap or coolant reservoir (extreme scalding danger).
     * NEVER recommend driving a compromised or overheating vehicle.
     * Prioritize professional roadside assistance, towing, or local emergency services.
2. GROUNDED IN REAL RECORDS (NO HALLUCINATIONS):
   - Always query the provided tools to retrieve real vehicle data before answering questions about:
     * Last service date, service costs, or maintenance history.
     * Fuel logs, fuel economy, or total fuel spend.
     * Vehicle expenses and total cost of ownership.
     * Insurance and PUC expiry dates or upcoming reminders.
   - If no record exists, clearly state that no records are saved in AutoCare. NEVER invent or fabricate dates, costs, or garage visits.
3. INFORMATIVE COMPANION, NOT CERTIFIED MECHANIC:
   - Provide safe, practical diagnostic checks and possibilities, not definitive mechanical diagnoses.
4. ACTION-ORIENTED OUTPUT:
   - In addition to a clear explanation, always supply structured suggestions and in-app actions (e.g. Record Service, View Expenses, Renew Insurance, Find Nearby Garages).

You must ALWAYS respond with a valid JSON object strictly matching this schema:
{
  "shortAnswer": "Direct, empathetic 1-3 sentences answering the user.",
  "safetyWarning": "High-priority safety alert string, or null if no immediate danger.",
  "suggestedSteps": ["Step 1...", "Step 2..."],
  "relevantRecords": [
    { "label": "Record Label (e.g. Last Service)", "value": "15 Aug 2024", "detail": "Apex Motors - Rs 4,200" }
  ],
  "nearbyPlaces": [
    {
      "name": "Service / Garage query name",
      "category": "garage | bike_mechanic | puncture | battery | towing | fuel | ev_charging",
      "address": "Locality or city description",
      "distance": "Calculated or approximate distance if known, or null",
      "rating": 4.8,
      "phone": "Phone number if verified, or null",
      "openStatus": "Verified status if known, or null",
      "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=..."
    }
  ],
  "suggestedActions": [
    {
      "type": "VIEW_SERVICES | RECORD_SERVICE | RECORD_FUEL | VIEW_EXPENSES | RENEW_DOCUMENT | ADD_REMINDER | PRINT_DOSSIER | FIND_NEARBY",
      "label": "Action Button Label",
      "description": "Short explanation of what this action does",
      "payload": {}
    }
  ]
}

DO NOT wrap the JSON in Markdown code fences (e.g. no \`\`\`json). Output pure parseable JSON only.
`

/**
 * Execute tool against client vehicle context
 */
export function executeTool(toolName, args = {}, context = {}) {
  const {
    activeVehicle = null,
    services = [],
    fuelLogs = [],
    expenses = [],
    reminders = [],
    documents = [],
    location = null,
  } = context

  switch (toolName) {
    case 'get_active_vehicle': {
      if (!activeVehicle) {
        return { available: false, message: 'No active vehicle currently selected.' }
      }
      return {
        available: true,
        name: activeVehicle.name,
        make: activeVehicle.make || activeVehicle.manufacturer,
        model: activeVehicle.model,
        year: activeVehicle.year,
        vehicleType: activeVehicle.vehicle_type || 'car',
        fuelType: activeVehicle.fuel_type || 'Petrol',
        currentOdometer: activeVehicle.current_odometer,
        licensePlateMasked: activeVehicle.license_plate
          ? `${activeVehicle.license_plate.slice(0, 4)}••••`
          : 'Not recorded',
      }
    }

    case 'get_vehicle_service_history': {
      const limit = Math.min(Number(args.limit) || 5, 20)
      if (!services || services.length === 0) {
        return {
          totalServicesRecorded: 0,
          services: [],
          message: 'No service records recorded for this vehicle.',
        }
      }
      const sorted = [...services].sort((a, b) => new Date(b.date) - new Date(a.date))
      const recent = sorted.slice(0, limit).map((s) => ({
        date: s.date,
        serviceType: s.service_type,
        garage: s.garage || 'Unknown Workshop',
        cost: s.cost || 0,
        odometer: s.odometer,
        notes: s.notes ? s.notes.slice(0, 100) : '',
      }))
      return {
        totalServicesRecorded: services.length,
        lastService: recent[0] || null,
        services: recent,
      }
    }

    case 'get_vehicle_expenses': {
      const categoryFilter = args.category?.toLowerCase()
      let filtered = expenses || []
      if (categoryFilter) {
        filtered = filtered.filter(
          (e) => e.category?.toLowerCase() === categoryFilter || e.expense_type?.toLowerCase() === categoryFilter
        )
      }
      const totalAmount = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
      const byCategory = (expenses || []).reduce((acc, curr) => {
        const cat = curr.category || curr.expense_type || 'Other'
        acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0)
        return acc
      }, {})

      return {
        totalExpensesRecorded: expenses?.length || 0,
        totalAmount,
        byCategory,
        recentExpenses: filtered.slice(0, 5).map((e) => ({
          date: e.date,
          category: e.category || e.expense_type,
          amount: e.amount,
          description: e.description || e.notes || '',
        })),
      }
    }

    case 'get_vehicle_reminders': {
      const statusFilter = args.status?.toLowerCase() || 'all'
      const today = new Date().toISOString().split('T')[0]
      let list = reminders || []
      if (statusFilter === 'pending') {
        list = list.filter((r) => !r.is_completed)
      } else if (statusFilter === 'overdue') {
        list = list.filter((r) => !r.is_completed && r.due_date && r.due_date < today)
      } else if (statusFilter === 'completed') {
        list = list.filter((r) => r.is_completed)
      }
      return {
        count: list.length,
        reminders: list.map((r) => ({
          id: r.id,
          title: r.title,
          dueDate: r.due_date,
          dueOdometer: r.due_odometer,
          isCompleted: !!r.is_completed,
          isOverdue: !r.is_completed && r.due_date && r.due_date < today,
        })),
      }
    }

    case 'get_vehicle_documents_metadata': {
      if (!documents || documents.length === 0) {
        return { count: 0, documents: [], message: 'No documents uploaded yet.' }
      }
      const today = new Date().toISOString().split('T')[0]
      return {
        count: documents.length,
        documents: documents.map((d) => ({
          type: d.type || d.document_type || 'General Document',
          name: d.name || 'Untitled Document',
          expiryDate: d.expiry_date || null,
          isExpired: d.expiry_date ? d.expiry_date < today : false,
        })),
      }
    }

    case 'get_vehicle_fuel_summary': {
      if (!fuelLogs || fuelLogs.length === 0) {
        return { totalFillUps: 0, message: 'No fuel records found.' }
      }
      const sorted = [...fuelLogs].sort((a, b) => new Date(b.date) - new Date(a.date))
      const totalSpend = sorted.reduce((sum, f) => sum + (Number(f.cost || f.total_cost) || 0), 0)
      const totalVolume = sorted.reduce((sum, f) => sum + (Number(f.litres || f.volume) || 0), 0)
      return {
        totalFillUps: fuelLogs.length,
        lastFillUp: {
          date: sorted[0]?.date,
          odometer: sorted[0]?.odometer,
          cost: sorted[0]?.cost || sorted[0]?.total_cost,
          litres: sorted[0]?.litres || sorted[0]?.volume,
        },
        totalSpend,
        totalVolume,
      }
    }

    case 'search_nearby_places': {
      const category = args.category || 'garage'
      const query = args.query || ''
      const locStr = location?.city || location?.address || (location?.lat ? `${location.lat},${location.lng}` : '')

      const categoryLabels = {
        garage: 'Car Repair Garages & Workshops',
        bike_mechanic: 'Two-Wheeler & Bike Mechanics',
        puncture: 'Tyre Puncture & Wheel Repair Shops',
        battery: 'Car Battery & Jumpstart Services',
        towing: '24x7 Roadside Assistance & Towing',
        fuel: 'Petrol / Fuel Stations',
        ev_charging: 'EV Fast Charging Stations',
        authorized_service: 'Authorized Brand Service Center',
      }

      const searchQuery = query
        ? `${query} ${categoryLabels[category] || category}`
        : `${categoryLabels[category] || category}`

      const destEncoded = encodeURIComponent(locStr ? `${searchQuery} near ${locStr}` : searchQuery)
      const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${destEncoded}`

      return {
        category,
        searchQuery,
        targetLocation: locStr || 'User Current Location',
        directionsUrl,
        realWorldAction: 'Verified Google Maps Search & Turn-by-Turn Navigation',
      }
    }

    case 'prepare_reminder_action': {
      return {
        status: 'PROPOSED',
        message: `Proposed reminder: "${args.title}" for ${args.dueDate || args.dueOdometer + ' km'}. User confirmation required.`,
        proposal: {
          title: args.title,
          due_date: args.dueDate || null,
          due_odometer: args.dueOdometer || null,
          reminder_type: args.reminderType || 'general',
        },
      }
    }

    default:
      return { error: `Tool ${toolName} not supported.` }
  }
}

/**
 * Handle incoming Assist request with Gemini API and tool calls
 */
export async function handleAssistRequest({
  message,
  activeVehicle,
  services = [],
  fuelLogs = [],
  expenses = [],
  reminders = [],
  documents = [],
  location = null,
  history = [],
  apiKey = process.env.GEMINI_API_KEY,
}) {
  if (!apiKey) {
    return createOfflineFallbackResponse({
      message,
      activeVehicle,
      services,
      fuelLogs,
      expenses,
      reminders,
      documents,
      location,
      reason: 'MISSING_API_KEY',
    })
  }

  const ai = new GoogleGenAI({ apiKey })
  const context = { activeVehicle, services, fuelLogs, expenses, reminders, documents, location }

  // Candidate models with fast response
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash']

  for (const model of modelsToTry) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: ASSIST_TOOLS,
        },
      })

      // Send recent history context if available (limit to 4 recent turns)
      const recentHistory = (history || []).slice(-4)
      for (const item of recentHistory) {
        if (item.sender === 'user') {
          await chat.sendMessage({ message: item.text })
        }
      }

      // Send current message
      let response = await chat.sendMessage({ message })

      // Handle function calling loop up to 3 turns
      let turns = 0
      while (response.functionCalls && response.functionCalls.length > 0 && turns < 3) {
        turns++
        const functionCallParts = []
        for (const call of response.functionCalls) {
          const toolResult = executeTool(call.name, call.args, context)
          functionCallParts.push({
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          })
        }
        response = await chat.sendMessage({ message: functionCallParts })
      }

      // Clean and parse JSON response
      const rawText = response.text || ''
      const cleaned = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      try {
        const parsed = JSON.parse(cleaned)
        return {
          success: true,
          modelUsed: model,
          data: parsed,
        }
      } catch (jsonErr) {
        // If not valid JSON, wrap into structured response
        return {
          success: true,
          modelUsed: model,
          data: {
            shortAnswer: rawText,
            safetyWarning: null,
            suggestedSteps: [],
            relevantRecords: [],
            nearbyPlaces: [],
            suggestedActions: [
              { type: 'VIEW_SERVICES', label: 'View Service History', payload: {} },
            ],
          },
        }
      }
    } catch (err) {
      console.warn(`[AutoCare Assist] Model ${model} failed:`, err.message)
      // If last model failed, fall through to fallback
    }
  }

  // Graceful fallback if Gemini quota, network, or server error occurs
  return createOfflineFallbackResponse({
    message,
    activeVehicle,
    services,
    fuelLogs,
    expenses,
    reminders,
    documents,
    location,
    reason: 'API_UNAVAILABLE',
  })
}

/**
 * Intelligent local fallback when Gemini is offline, unconfigured, or rate-limited.
 * Ensures the app and AutoCare Assist never crash.
 */
export function createOfflineFallbackResponse({
  message = '',
  activeVehicle,
  services = [],
  fuelLogs = [],
  expenses = [],
  reminders = [],
  documents = [],
  location = null,
  reason = 'OFFLINE',
}) {
  const query = message.toLowerCase()
  const locStr = location?.city || location?.address || 'your current area'

  // Case 1: Overheating
  if (query.includes('overheat') || query.includes('temperature') || query.includes('hot engine')) {
    return {
      success: true,
      isFallback: true,
      reason,
      data: {
        shortAnswer:
          'Your engine is overheating. This is an urgent safety priority. Safely pull over to the side of the road and switch off the engine immediately.',
        safetyWarning:
          'DANGER: NEVER open the radiator cap or coolant reservoir while the engine is hot. Pressurized boiling coolant can cause severe burn injuries.',
        suggestedSteps: [
          'Pull over to a safe area away from moving traffic and turn on hazard lights.',
          'Shut down the engine immediately to prevent cylinder head warping or engine seizure.',
          'Wait at least 25–30 minutes before inspecting coolant levels from the external reservoir only.',
          'Do not attempt to drive. Call for roadside assistance or towing.',
        ],
        relevantRecords: activeVehicle
          ? [
              {
                label: 'Active Vehicle',
                value: `${activeVehicle.year || ''} ${activeVehicle.make || ''} ${activeVehicle.model || activeVehicle.name}`,
              },
            ]
          : [],
        nearbyPlaces: [
          {
            name: '24x7 Roadside Assistance & Towing',
            category: 'towing',
            address: locStr,
            rating: 4.8,
            directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              'vehicle towing service near ' + locStr
            )}`,
          },
          {
            name: 'Nearby Car Repair Workshops',
            category: 'garage',
            address: locStr,
            rating: 4.7,
            directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              'car garage repair near ' + locStr
            )}`,
          },
        ],
        suggestedActions: [
          {
            type: 'FIND_NEARBY',
            label: 'Find Nearby Towing Services',
            description: 'Open real 24/7 towing services on Google Maps',
            payload: { category: 'towing' },
          },
        ],
      },
    }
  }

  // Case 2: Vehicle won't start
  if (query.includes('start') || query.includes('crank') || query.includes('battery')) {
    return {
      success: true,
      isFallback: true,
      reason,
      data: {
        shortAnswer:
          'If your vehicle won\'t start, the most common causes are a discharged 12V battery, loose terminals, fuel delivery issues, or key-fob immobilizer detection.',
        safetyWarning: null,
        suggestedSteps: [
          'Observe dashboard lights: if they dim or click rapidly when turning the key, the battery is low.',
          'For automatic cars, ensure the gear selector is firmly in "Park" (P); for manual/bikes, pull in the clutch completely.',
          'Check battery terminals for white corrosion or loose connections.',
          'If you hear silence, the starter relay or battery has failed; consider a jumpstart or mechanic.',
        ],
        relevantRecords: activeVehicle
          ? [
              {
                label: 'Vehicle Model',
                value: `${activeVehicle.make || ''} ${activeVehicle.model || activeVehicle.name}`,
              },
              { label: 'Fuel Type', value: activeVehicle.fuel_type || 'Petrol' },
            ]
          : [],
        nearbyPlaces: [
          {
            name: 'Car Battery & Jumpstart Services',
            category: 'battery',
            address: locStr,
            rating: 4.9,
            directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              'car battery jumpstart replacement near ' + locStr
            )}`,
          },
          {
            name: 'Nearby Mechanics & Garages',
            category: 'garage',
            address: locStr,
            rating: 4.6,
            directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              'mechanic garage near ' + locStr
            )}`,
          },
        ],
        suggestedActions: [
          {
            type: 'FIND_NEARBY',
            label: 'Find Nearby Battery & Mechanics',
            description: 'Open verified mechanics in Google Maps',
            payload: { category: 'battery' },
          },
        ],
      },
    }
  }

  // Case 3: Puncture / Flat Tyre
  if (query.includes('puncture') || query.includes('tyre') || query.includes('tire') || query.includes('flat')) {
    return {
      success: true,
      isFallback: true,
      reason,
      data: {
        shortAnswer:
          'A flat tyre should be repaired before driving further to avoid permanent rim damage and losing vehicle control.',
        safetyWarning:
          'Ensure your vehicle is stopped on flat, firm ground away from traffic with hazard lights engaged before inspecting the tyre.',
        suggestedSteps: [
          'Park on flat ground, engage handbrake and hazard warning lights.',
          'If you have a spare wheel and jack, mount the spare following manufacturer jacking points.',
          'If you do not have a spare or portable inflator, call a nearby mobile puncture technician.',
        ],
        relevantRecords: [],
        nearbyPlaces: [
          {
            name: 'Tyre Puncture & Wheel Repair Shops',
            category: 'puncture',
            address: locStr,
            rating: 4.8,
            directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              'tyre puncture repair shop near ' + locStr
            )}`,
          },
        ],
        suggestedActions: [
          {
            type: 'FIND_NEARBY',
            label: 'Find Nearby Puncture Shops',
            description: 'Get directions to the nearest tyre puncture shop',
            payload: { category: 'puncture' },
          },
        ],
      },
    }
  }

  // Case 4: Last Service
  if (query.includes('last service') || query.includes('previous service') || query.includes('service history')) {
    const sortedServices = [...services].sort((a, b) => new Date(b.date) - new Date(a.date))
    const last = sortedServices[0]
    return {
      success: true,
      isFallback: true,
      reason,
      data: {
        shortAnswer: last
          ? `Your last recorded service was on ${last.date} at ${last.garage || 'Workshop'} for ₹${last.cost || 0}.`
          : 'No service records have been logged in AutoCare yet for this vehicle.',
        safetyWarning: null,
        suggestedSteps: last
          ? ['Review replacement items and scheduled checkpoints in your Service History.']
          : ['Log your past maintenance visits to maintain vehicle resale value and track warranties.'],
        relevantRecords: last
          ? [
              { label: 'Date', value: last.date },
              { label: 'Garage', value: last.garage || 'N/A' },
              { label: 'Cost', value: `₹${Number(last.cost || 0).toLocaleString()}` },
              { label: 'Odometer', value: `${last.odometer || 'N/A'} km` },
            ]
          : [],
        nearbyPlaces: [],
        suggestedActions: [
          { type: 'VIEW_SERVICES', label: 'View Service History', payload: {} },
          { type: 'RECORD_SERVICE', label: 'Record New Service', payload: {} },
        ],
      },
    }
  }

  // Case 5: Insurance / PUC
  if (query.includes('insurance') || query.includes('puc') || query.includes('expire') || query.includes('expiry')) {
    const insDoc = documents.find((d) => d.type?.toLowerCase().includes('insurance'))
    const pucDoc = documents.find((d) => d.type?.toLowerCase().includes('puc') || d.type?.toLowerCase().includes('emission'))
    return {
      success: true,
      isFallback: true,
      reason,
      data: {
        shortAnswer:
          'Here is the status of your vehicle compliance documents based on your saved records.',
        safetyWarning: null,
        suggestedSteps: [
          'Keep active digital copies in AutoCare Document Vault for traffic inspections.',
          'Renew insurance at least 7 days before expiry to preserve No-Claim Bonus (NCB).',
        ],
        relevantRecords: [
          {
            label: 'Insurance Policy',
            value: insDoc?.expiry_date ? `Expires on ${insDoc.expiry_date}` : 'Not specified',
          },
          {
            label: 'PUC Certificate',
            value: pucDoc?.expiry_date ? `Expires on ${pucDoc.expiry_date}` : 'Not specified',
          },
        ],
        nearbyPlaces: [],
        suggestedActions: [
          { type: 'RENEW_DOCUMENT', label: 'Renew Insurance / PUC', payload: { docType: 'Insurance Policy' } },
          { type: 'OPEN_DOCUMENTS', label: 'Open Document Vault', payload: {} },
        ],
      },
    }
  }

  // General default response
  return {
    success: true,
    isFallback: true,
    reason,
    data: {
      shortAnswer:
        'AutoCare Assist is ready to help you solve problems, track maintenance, review costs, and locate nearby mechanics.',
      safetyWarning: null,
      suggestedSteps: [
        'Ask about starting problems, overheating, or flat tyres for immediate step-by-step guidance.',
        'Ask "When was my last service?" or "Show my vehicle expenses" to inspect your records.',
        'Use nearby assistance to find real garages, towing, or puncture shops.',
      ],
      relevantRecords: activeVehicle
        ? [
            {
              label: 'Active Vehicle',
              value: `${activeVehicle.year || ''} ${activeVehicle.make || ''} ${activeVehicle.model || activeVehicle.name}`,
            },
            { label: 'Current Odometer', value: `${activeVehicle.current_odometer || 0} km` },
          ]
        : [],
      nearbyPlaces: [],
      suggestedActions: [
        { type: 'FIND_NEARBY', label: 'Find Nearby Garages', payload: { category: 'garage' } },
        { type: 'VIEW_SERVICES', label: 'View Service History', payload: {} },
        { type: 'PRINT_DOSSIER', label: 'Print Vehicle Dossier', payload: {} },
      ],
    },
  }
}
