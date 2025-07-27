import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/services/logger';

import { usePantryStore } from '../store/pantryStore';

interface NotificationSettings {
  enabled: boolean;
  expiredItems: boolean;
  urgentItems: boolean;
  warningItems: boolean;
  checkInterval: number; // minutes
}

interface UseNotificationsReturn {
  hasPermission: boolean;
  settings: NotificationSettings;
  urgentCount: number;
  expiredCount: number;
  requestPermission: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  checkAndNotify: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  expiredItems: true,
  urgentItems: true,
  warningItems: false,
  checkInterval: 60, // Check every hour
};

export function usePantryNotifications(): UseNotificationsReturn {
  const { 
    expirationAlerts, 
    fetchExpirationAlerts,
    getExpiredItems,
    getExpiringItems,
  } = usePantryStore();

  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pantry-notification-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pantry-notification-settings', JSON.stringify(settings));
    }
  }, [settings]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error: unknown) {
      logger.error('Error requesting notification permission:', 'usePantryNotifications', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const showNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (!hasPermission || typeof window === 'undefined') return;

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png', // Adjust path as needed
        badge: '/icon-192x192.png',
        tag: 'pantry-expiration',
        ...options,
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click to focus app
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error: unknown) {
      logger.error('Error showing notification:', 'usePantryNotifications', error);
    }
  }, [hasPermission]);

  const checkAndNotify = useCallback(() => {
    if (!settings.enabled || !hasPermission) return;

    const expiredItems = getExpiredItems();
    const urgentItems = getExpiringItems(2);
    const warningItems = getExpiringItems(7).filter(item => {
      const days = Math.ceil(
        (new Date(item.expiration_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return days > 2; // Only items expiring in 3-7 days
    });

    // Notify about expired items
    if (settings.expiredItems && expiredItems.length > 0) {
      const title = expiredItems.length === 1 
        ? `${expiredItems[0].ingredient_name} has expired!`
        : `${expiredItems.length} items have expired!`;
      
      showNotification(title, {
        body: expiredItems.length === 1 
          ? 'Check your pantry and consider removing this item.'
          : 'Check your pantry for expired items.',
        icon: '/icon-192x192.png',
      });
    }

    // Notify about urgent items (expiring in 1-2 days)
    if (settings.urgentItems && urgentItems.length > 0) {
      const nonExpiredUrgent = urgentItems.filter(item => 
        new Date(item.expiration_date!) >= new Date()
      );

      if (nonExpiredUrgent.length > 0) {
        const title = nonExpiredUrgent.length === 1 
          ? `${nonExpiredUrgent[0].ingredient_name} expires soon!`
          : `${nonExpiredUrgent.length} items expire soon!`;
        
        showNotification(title, {
          body: nonExpiredUrgent.length === 1 
            ? 'Use it soon or consider freezing it.'
            : 'Check your pantry for items that need to be used soon.',
          icon: '/icon-192x192.png',
        });
      }
    }

    // Notify about warning items (expiring in 3-7 days)
    if (settings.warningItems && warningItems.length > 0) {
      const title = warningItems.length === 1 
        ? `${warningItems[0].ingredient_name} expires this week`
        : `${warningItems.length} items expire this week`;
      
      showNotification(title, {
        body: 'Plan your meals to use these ingredients.',
        icon: '/icon-192x192.png',
      });
    }
  }, [
    settings, 
    hasPermission, 
    getExpiredItems, 
    getExpiringItems, 
    showNotification
  ]);

  // Set up periodic checking
  useEffect(() => {
    if (!settings.enabled || !hasPermission) return;

    const interval = setInterval(() => {
      fetchExpirationAlerts();
      checkAndNotify();
    }, settings.checkInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.checkInterval, hasPermission, fetchExpirationAlerts, checkAndNotify]);

  const urgentCount = getExpiringItems(2).filter(item => 
    new Date(item.expiration_date!) >= new Date()
  ).length;
  
  const expiredCount = getExpiredItems().length;

  return {
    hasPermission,
    settings,
    urgentCount,
    expiredCount,
    requestPermission,
    updateSettings,
    checkAndNotify,
  };
}