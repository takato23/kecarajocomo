import { logger } from '@/services/logger';

/**
 * PWA Service for managing service worker and offline capabilities
 */

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface CacheStatus {
  [cacheName: string]: {
    size: number;
    maxSize: string | number;
  };
}

export class PWAService {
  private static instance: PWAService;
  private installPrompt: PWAInstallPrompt | null = null;
  private serviceWorker: ServiceWorker | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private async init() {
    if (typeof window !== 'undefined') {
      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupOnlineOfflineHandlers();
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {

            this.handleServiceWorkerUpdate(newWorker);
          }
        });

        // Get active service worker
        if (registration.active) {
          this.serviceWorker = registration.active;
        }

        // Listen for controlled change
        navigator.serviceWorker.addEventListener('controllerchange', () => {

          // Temporarily disable automatic reload
          // window.location.reload();
        });

      } catch (error: unknown) {
        logger.error('[PWA] Service worker registration failed:', 'Lib:pwa', error);
      }
    } else if (process.env.NODE_ENV === 'development') {

    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        // New content is available
        this.showUpdateNotification();
      }
    });
  }

  /**
   * Show update notification to user
   */
  private showUpdateNotification(): void {
    if (confirm('A new version is available. Reload to update?')) {
      this.skipWaiting();
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  public skipWaiting(): void {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Setup PWA install prompt
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as any;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    // Handle app installed
    window.addEventListener('appinstalled', () => {

      this.installPrompt = null;
      
      // Track installation
      this.trackEvent('pwa_installed');
    });
  }

  /**
   * Setup online/offline handlers
   */
  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {

      this.handleOnline();
    });

    window.addEventListener('offline', () => {

      this.handleOffline();
    });
  }

  /**
   * Handle coming back online
   */
  private handleOnline(): void {
    // Update UI
    document.body.classList.remove('offline');
    document.body.classList.add('online');
    
    // Sync pending data
    this.syncPendingData();
    
    // Update last sync time
    localStorage.setItem('lastSyncTime', new Date().toISOString());
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('pwa-online'));
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    // Update UI
    document.body.classList.remove('online');
    document.body.classList.add('offline');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('pwa-offline'));
  }

  /**
   * Sync pending data when back online
   */
  private async syncPendingData(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.ready;
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && 'sync' in registration) {
          await (registration as any).sync.register('sync-pending-data');

        }
      } catch (error: unknown) {
        logger.error('[PWA] Background sync registration failed:', 'Lib:pwa', error);
      }
    }
  }

  /**
   * Install PWA
   */
  public async installPWA(): Promise<boolean> {
    if (!this.installPrompt) {

      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        this.trackEvent('pwa_install_accepted');
        return true;
      } else {
        this.trackEvent('pwa_install_dismissed');
        return false;
      }
    } catch (error: unknown) {
      logger.error('[PWA] Install failed:', 'Lib:pwa', error);
      return false;
    }
  }

  /**
   * Check if PWA is installable
   */
  public isInstallable(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Check if app is running as PWA
   */
  public isRunningAsPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get cache status
   */
  public async getCacheStatus(): Promise<CacheStatus> {
    if (!this.serviceWorker) {
      return {};
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.serviceWorker!.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Cache recipe for offline access
   */
  public cacheRecipe(recipe: any): void {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'CACHE_RECIPE',
        recipe
      });
    }
  }

  /**
   * Cache pantry data for offline access
   */
  public cachePantryData(data: any): void {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'CACHE_PANTRY_DATA',
        data
      });
    }
  }

  /**
   * Show network status to user
   */
  public showNetworkStatus(): void {
    const status = this.isOnline() ? 'online' : 'offline';
    const message = this.isOnline() 
      ? 'You are back online!' 
      : 'You are offline. Some features may be limited.';
    
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
      this.isOnline() ? 'bg-green-500' : 'bg-orange-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Add to home screen guidance
   */
  public showAddToHomeScreenGuidance(): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    
    if (isIOS) {
      message = 'To install this app on your iOS device, tap the share button and then "Add to Home Screen".';
    } else if (isAndroid) {
      message = 'To install this app on your Android device, tap the menu button and then "Add to Home Screen".';
    } else {
      message = 'To install this app, look for the install button in your browser\'s address bar.';
    }

  }

  /**
   * Track PWA events
   */
  private trackEvent(eventName: string, properties?: any): void {
    // Analytics integration would go here

    // Example: Send to Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', eventName, properties);
    }
  }

  /**
   * Get app info
   */
  public getAppInfo(): {
    isOnline: boolean;
    isInstallable: boolean;
    isRunningAsPWA: boolean;
    supportsNotifications: boolean;
    supportsBackgroundSync: boolean;
  } {
    return {
      isOnline: this.isOnline(),
      isInstallable: this.isInstallable(),
      isRunningAsPWA: this.isRunningAsPWA(),
      supportsNotifications: 'Notification' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.trackEvent('notification_permission_requested', { result: permission });
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Show notification
   */
  public showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        ...options
      });
    }
  }

  /**
   * Clear all caches (for debugging)
   */
  public async clearAllCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

    }
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance();