const CACHE_NAME = 'family-brain-v4-1.0.0'
const STATIC_CACHE_URLS = [
  '/',
  '/today',
  '/planning',
  '/sops',
  '/offline.html',
  '/manifest.json'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .catch((error) => {
        console.error('Error caching static resources:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Cache successful responses for future use
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Network failed - try to serve offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
            }
          })
      })
  )
})

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    event.waitUntil(
      // Sync data when connection is restored
      syncData()
    )
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Schedule',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Family Brain', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Open the app to today view
    event.waitUntil(
      clients.openWindow('/today')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Sync function for background data updates
async function syncData() {
  try {
    // Implement your data sync logic here
    // For example, sync schedule updates, completed items, etc.
    console.log('Syncing data in background...')
    
    // Example: Send pending updates to the server
    const cache = await caches.open(CACHE_NAME)
    const pendingRequests = await cache.match('/pending-updates')
    
    if (pendingRequests) {
      const data = await pendingRequests.json()
      // Process pending updates
      console.log('Processing pending updates:', data)
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

console.log('Service Worker loaded')