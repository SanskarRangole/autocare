// AutoCare Service Worker for PWA asset caching
const CACHE_NAME = 'autocare-cache-v1'
const STATIC_ASSETS = ['/', '/index.html', '/autocare-logo.jpg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return

  // Do not cache Supabase API calls or signed cloud URLs to protect private documents
  const url = event.request.url
  if (url.includes('.supabase.co') || url.includes('/storage/v1/')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse
      return fetch(event.request).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
      })
    })
  )
})
