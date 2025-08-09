/**
 * Advanced Service Worker for Meal Planning App
 * Features: Intelligent caching, offline support, background sync
 */

const CACHE_NAME = 'meal-planner-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMAGE_CACHE = 'images-v1';
const API_CACHE = 'api-v1';

// Cache strategies by resource type
const CACHE_STRATEGIES = {
  static: 'cache-first',
  dynamic: 'network-first',
  images: 'cache-first',
  api: 'network-first'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  static: 365 * 24 * 60 * 60, // 1 year
  dynamic: 24 * 60 * 60, // 1 day
  images: 30 * 24 * 60 * 60, // 30 days
  api: 5 * 60 // 5 minutes
};

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/meal-planning/generate',
  '/api/recipes/route',
  '/api/pantry/items',
  '/api/user/profile'
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  /_next\/image/,
  /\/images\//
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS.filter(url => url !== null));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different resource types
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'meal-plan-sync') {
    event.waitUntil(syncMealPlans());
  } else if (event.tag === 'recipe-sync') {
    event.waitUntil(syncRecipes());
  }
});

// Push notifications for meal reminders
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New meal plan update!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Meal Plan',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Meal Planner', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/planificador')
    );
  }
});

// Utility functions
function isStaticAsset(request) {
  return request.url.includes('/_next/static/') ||
         request.url.includes('/static/') ||
         STATIC_ASSETS.some(asset => request.url.endsWith(asset));
}

function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url)) ||
         request.destination === 'image';
}

function isAPIRequest(request) {
  return request.url.includes('/api/') ||
         API_ENDPOINTS.some(endpoint => request.url.includes(endpoint));
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy with stale-while-revalidate for images
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      const response = cachedResponse.clone();
      
      // Update cache in background (stale-while-revalidate)
      fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }
      }).catch(() => {
        // Ignore network errors in background update
      });
      
      return response;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Image fetch failed:', error);
    
    // Return a placeholder image for offline scenarios
    return new Response(
      '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Image unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Network-first strategy with cache fallback for API requests
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // Try network first for fresh data
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Only cache GET requests
        if (request.method === 'GET') {
          await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }
    } catch (networkError) {
      console.log('Network failed, trying cache:', networkError);
    }
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add a header to indicate this is from cache
      const response = cachedResponse.clone();
      response.headers.set('X-From-Cache', 'true');
      return response;
    }
    
    // No cache available, return offline response
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This request is not available offline',
          cached: false 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For non-GET requests, return a different error
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This action requires an internet connection',
        retry: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('API request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Service Error', 
        message: 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network-first strategy for dynamic content
async function handleDynamicRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && request.method === 'GET') {
        await cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (networkError) {
      console.log('Network failed for dynamic request, trying cache:', networkError);
    }
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
    
  } catch (error) {
    console.error('Dynamic request failed:', error);
    return new Response('Error', { status: 500 });
  }
}

// Background sync functions
async function syncMealPlans() {
  try {
    const pendingData = await getFromIndexedDB('pending-meal-plans');
    
    for (const data of pendingData) {
      try {
        const response = await fetch('/api/meal-planning/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await removeFromIndexedDB('pending-meal-plans', data.id);
        }
      } catch (error) {
        console.error('Failed to sync meal plan:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncRecipes() {
  try {
    const pendingData = await getFromIndexedDB('pending-recipes');
    
    for (const data of pendingData) {
      try {
        const response = await fetch('/api/recipes/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await removeFromIndexedDB('pending-recipes', data.id);
        }
      } catch (error) {
        console.error('Failed to sync recipe:', error);
      }
    }
  } catch (error) {
    console.error('Recipe sync failed:', error);
  }
}

// IndexedDB utilities for background sync
async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('meal-planner-db', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('meal-planner-db', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

console.log('Service Worker loaded successfully');