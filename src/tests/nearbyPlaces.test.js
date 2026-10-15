import { describe, it, expect } from 'vitest'
import {
  buildGoogleMapsSearchUrl,
  buildGoogleMapsDirectionsUrl,
  calculateHaversineDistanceKm,
  ASSISTANCE_CATEGORIES,
} from '../lib/nearbyPlaces'

describe('Real-World Nearby Assistance & Google Maps Integration', () => {
  it('buildGoogleMapsSearchUrl creates proper search link with city', () => {
    const url = buildGoogleMapsSearchUrl('car garage workshop', 'Indiranagar, Bangalore')
    expect(url).toContain('https://www.google.com/maps/search/?api=1')
    expect(url).toContain('car%20garage%20workshop%20near%20Indiranagar%2C%20Bangalore')
  })

  it('buildGoogleMapsSearchUrl creates proper search link with lat/lng coordinates', () => {
    const url = buildGoogleMapsSearchUrl('tyre puncture repair', { lat: 12.9716, lng: 77.5946 })
    expect(url).toContain('https://www.google.com/maps/search/?api=1')
    expect(url).toContain('12.9716%2C77.5946')
  })

  it('buildGoogleMapsDirectionsUrl builds turn-by-turn routing query', () => {
    const url = buildGoogleMapsDirectionsUrl('Apex Honda Workshop, Bangalore', { lat: 12.97, lng: 77.59 })
    expect(url).toContain('https://www.google.com/maps/dir/?api=1')
    expect(url).toContain('destination=Apex%20Honda%20Workshop%2C%20Bangalore')
    expect(url).toContain('origin=12.97%2C77.59')
  })

  it('calculateHaversineDistanceKm computes accurate distance between coordinates', () => {
    // Distance between Bangalore (12.9716, 77.5946) and Mysore (12.2958, 76.6394) is ~128 km
    const dist = calculateHaversineDistanceKm(12.9716, 77.5946, 12.2958, 76.6394)
    expect(dist).toBeGreaterThan(120)
    expect(dist).toBeLessThan(140)
  })

  it('all required assistance categories are supported', () => {
    const ids = ASSISTANCE_CATEGORIES.map((c) => c.id)
    expect(ids).toContain('garage')
    expect(ids).toContain('bike_mechanic')
    expect(ids).toContain('puncture')
    expect(ids).toContain('battery')
    expect(ids).toContain('towing')
    expect(ids).toContain('fuel')
    expect(ids).toContain('ev_charging')
    expect(ids).toContain('authorized_service')
  })
})
