import { logger } from '@/services/logger';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js'; // Use our optimized service worker

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost
        navigator.serviceWorker.ready.then(() => {
          logger.info('Service worker ready in localhost', 'serviceWorkerRegistration');
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }

      // Setup online/offline listeners
      setupConnectivityListeners(config);
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      logger.info('Service worker registered successfully', 'serviceWorkerRegistration');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older content
              logger.info('New content available, please refresh', 'serviceWorkerRegistration');

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              logger.info('Content is cached for offline use', 'serviceWorkerRegistration');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000);
    })
    .catch((error) => {
      logger.error('Error during service worker registration:', 'serviceWorkerRegistration', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      logger.info('No internet connection found. App is running in offline mode.', 'serviceWorkerRegistration');
    });
}

function setupConnectivityListeners(config?: Config) {
  window.addEventListener('online', () => {
    logger.info('App is now online', 'serviceWorkerRegistration');
    if (config?.onOnline) {
      config.onOnline();
    }
    
    // Trigger background sync when coming back online
    registerBackgroundSync('meal-plan-sync');
    registerBackgroundSync('recipe-sync');
  });

  window.addEventListener('offline', () => {
    logger.info('App is now offline', 'serviceWorkerRegistration');
    if (config?.onOffline) {
      config.onOffline();
    }
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        logger.error(error.message, 'serviceWorkerRegistration');
      });
  }
}

// Enhanced utility functions for offline support
export function isOnline(): boolean {
  return navigator.onLine;
}

export function addOfflineListener(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

export function addOnlineListener(callback: () => void): () => void {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

// Enhanced background sync registration
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      logger.info(`Background sync registered for ${tag}`, 'serviceWorkerRegistration');
    } catch (error: unknown) {
      logger.error('Background sync registration failed:', 'serviceWorkerRegistration', error);
    }
  }
}

// Request notification permission with better UX
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    logger.info(`Notification permission: ${permission}`, 'serviceWorkerRegistration');
    return permission;
  }
  return 'denied';
}

// Enhanced push notification subscription
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Request permission first
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        return null;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      logger.info('Push notification subscription successful', 'serviceWorkerRegistration');
      return subscription;
    } catch (error) {
      logger.error('Push notification subscription failed:', 'serviceWorkerRegistration', error);
      return null;
    }
  }
  return null;
}

// Cache management utilities
export async function clearCache(cachePattern?: string): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const deletionPromises = cacheNames
        .filter(name => !cachePattern || name.includes(cachePattern))
        .map(name => caches.delete(name));
      
      await Promise.all(deletionPromises);
      logger.info(`Cleared ${deletionPromises.length} caches`, 'serviceWorkerRegistration');
    } catch (error) {
      logger.error('Cache clearing failed:', 'serviceWorkerRegistration', error);
    }
  }
}

export async function getCacheSize(): Promise<number> {
  if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      logger.error('Cache size estimation failed:', 'serviceWorkerRegistration', error);
      return 0;
    }
  }
  return 0;
}

// Performance monitoring
export function monitorPerformance() {
  if ('performance' in window) {
    // Monitor navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          
          logger.info('Performance metrics', 'serviceWorkerRegistration', {
            loadTime: `${loadTime}ms`,
            domContentLoaded: `${domContentLoaded}ms`,
            transferSize: `${navigation.transferSize} bytes`
          });
        }
      }, 0);
    });

    // Monitor resource timing
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 1000) { // Log slow resources (>1s)
          logger.warn('Slow resource detected', 'serviceWorkerRegistration', {
            name: entry.name,
            duration: `${entry.duration}ms`,
            type: entry.entryType
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource', 'navigation'] });
    } catch (error) {
      logger.error('Performance observer failed:', 'serviceWorkerRegistration', error);
    }
  }
}

// IndexedDB management for offline data
export class OfflineStorage {
  private dbName = 'meal-planner-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('pending-meal-plans')) {
          db.createObjectStore('pending-meal-plans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending-recipes')) {
          db.createObjectStore('pending-recipes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cached-data')) {
          db.createObjectStore('cached-data', { keyPath: 'key' });
        }
      };
    });
  }

  async store(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async remove(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Global offline storage instance
export const offlineStorage = new OfflineStorage();