/**
 * REAL-WORLD NEARBY ASSISTANCE & GOOGLE MAPS INTEGRATION
 * Supports geolocation permissions, Google Maps routing & directions links,
 * and category-specific search without fabricating fake shop listings.
 */

export const ASSISTANCE_CATEGORIES = [
  {
    id: 'garage',
    label: 'Car Garages',
    iconName: 'Wrench',
    query: 'car garage repair workshop',
    desc: 'General maintenance, diagnostics, and mechanical repairs',
  },
  {
    id: 'bike_mechanic',
    label: 'Bike Mechanics',
    iconName: 'Bike',
    query: 'motorcycle two wheeler mechanic service',
    desc: 'Motorcycle & scooter tune-ups, chain, and engine repairs',
  },
  {
    id: 'puncture',
    label: 'Puncture Repair',
    iconName: 'Disc',
    query: 'tyre puncture repair shop wheel alignment',
    desc: 'Flat tyre repairs, air pressure, and tubeless patching',
  },
  {
    id: 'battery',
    label: 'Battery & Jumpstart',
    iconName: 'Zap',
    query: 'car battery jumpstart replacement dealer',
    desc: 'Dead battery jumpstart, alternator test, and replacements',
  },
  {
    id: 'towing',
    label: 'Towing Services',
    iconName: 'Truck',
    query: '24x7 vehicle towing recovery service roadside assistance',
    desc: 'Flatbed recovery and accident breakdown assistance',
  },
  {
    id: 'fuel',
    label: 'Fuel Stations',
    iconName: 'Fuel',
    query: 'petrol diesel fuel station pump',
    desc: 'Nearest operating fuel and petrol stations',
  },
  {
    id: 'ev_charging',
    label: 'EV Charging',
    iconName: 'BatteryCharging',
    query: 'electric vehicle EV fast charging station',
    desc: 'CCS2, Type 2, and fast DC charging points',
  },
  {
    id: 'authorized_service',
    label: 'Authorized Service',
    iconName: 'ShieldCheck',
    query: 'authorized dealership service center',
    desc: 'OEM brand warranty service and genuine spares',
  },
]

/**
 * Request user's current GPS location via browser API
 */
export async function getCurrentUserLocation() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        })
      },
      (err) => {
        let msg = 'Unable to retrieve location.'
        if (err.code === 1) msg = 'Location permission was denied. You can enter your city or locality manually.'
        if (err.code === 2) msg = 'Location position is currently unavailable.'
        if (err.code === 3) msg = 'Location request timed out.'
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}

/**
 * Build a genuine Google Maps Search URL
 */
export function buildGoogleMapsSearchUrl(query, location = null) {
  let target = query.trim()
  if (location) {
    if (typeof location === 'string' && location.trim()) {
      target = `${target} near ${location.trim()}`
    } else if (location.lat && location.lng) {
      target = `${target} near ${location.lat},${location.lng}`
    }
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`
}

/**
 * Build a genuine Google Maps Turn-by-Turn Directions URL
 */
export function buildGoogleMapsDirectionsUrl(destination, origin = null) {
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
  if (origin) {
    if (typeof origin === 'string') {
      url += `&origin=${encodeURIComponent(origin)}`
    } else if (origin.lat && origin.lng) {
      url += `&origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}`
    }
  }
  return url
}

/**
 * Calculate distance between two coordinates using Haversine formula (km)
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}
