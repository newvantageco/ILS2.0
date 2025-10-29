// Service Worker for Offline PWA Capabilities
// Implements offline-first strategy for critical PMS features

const CACHE_VERSION = 'ils-v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Critical routes to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// API routes that should be cached for offline viewing
const CACHEABLE_API_ROUTES = [
  '/api/ecp/test-rooms',
  '/api/patients',
  '/api/prescriptions',
  '/api/examinations',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.includes('ils-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - implement offline-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from the same origin
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  event.respondWith(
    cacheFirstStrategy(request)
  );
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// Network-first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Add offline indicator header
        const headers = new Headers(cachedResponse.headers);
        headers.append('X-Offline-Response', 'true');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers,
        });
      }
    }

    // For POST/PUT/DELETE requests, queue for later sync
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      console.log('[Service Worker] Queuing offline request:', request.url);
      // Store request for background sync
      await queueOfflineRequest(request);
      
      return new Response(
        JSON.stringify({
          offline: true,
          message: 'Request queued for sync when online',
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    throw error;
  }
}

// Queue offline requests for background sync
async function queueOfflineRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now(),
    };

    const cache = await caches.open('offline-requests');
    const queueRequest = new Request('/offline-queue/' + requestData.timestamp);
    cache.put(queueRequest, new Response(JSON.stringify(requestData)));
  } catch (error) {
    console.error('[Service Worker] Failed to queue request:', error);
  }
}

// Background sync event - sync queued requests when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-requests') {
    console.log('[Service Worker] Syncing offline requests...');
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync queued offline requests
async function syncOfflineRequests() {
  try {
    const cache = await caches.open('offline-requests');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const requestData = await response.json();

        // Replay the request
        await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body || undefined,
        });

        // Remove from queue on success
        await cache.delete(request);
        console.log('[Service Worker] Synced:', requestData.url);
      } catch (error) {
        console.error('[Service Worker] Failed to sync request:', error);
        // Keep in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ILS Notification', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[Service Worker] Loaded');
