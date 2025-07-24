const CACHE_NAME = 'kecarajocomer-v1';
const DYNAMIC_CACHE = 'kecarajocomer-dynamic-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {

        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {

            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then((status) => {
      event.ports[0].postMessage(status);
    });
  }

  if (event.data && event.data.type === 'CACHE_RECIPE') {
    cacheRecipe(event.data.recipe);
  }

  if (event.data && event.data.type === 'CACHE_PANTRY_DATA') {
    cachePantryData(event.data.data);
  }
});

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    let totalSize = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    status[cacheName] = {
      size: totalSize,
      maxSize: '50MB'
    };
  }

  return status;
}

// Cache recipe for offline access
async function cacheRecipe(recipe) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const recipeUrl = `/api/recipes/${recipe.id}`;
  
  try {
    const response = await fetch(recipeUrl);
    if (response.ok) {
      await cache.put(recipeUrl, response);

    }
  } catch (error) {
    console.error('[SW] Failed to cache recipe:', error);
  }
}

// Cache pantry data
async function cachePantryData(data) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const pantryUrl = '/api/pantry';
  
  try {
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(pantryUrl, response);

  } catch (error) {
    console.error('[SW] Failed to cache pantry data:', error);
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Implement data sync logic here

}