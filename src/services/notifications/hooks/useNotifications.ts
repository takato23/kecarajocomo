'use client';

/**
 * React Hook for Notifications
 * Provides easy integration with React components
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

import { getNotificationManager } from '../NotificationManager';
import type {
  Notification,
  NotificationOptions,
  NotificationServiceConfig,
  NotificationHistoryEntry,
  NotificationPermissions,
  UseNotificationsReturn,
} from '../types';

/**
 * React hook for using the notification service
 */
export function useNotifications(
  config?: Partial<NotificationServiceConfig>
): UseNotificationsReturn {
  const manager = useMemo(() => getNotificationManager(config), []);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    push: 'default',
    audio: true,
    vibration: false,
  });
  const [isDoNotDisturb, setIsDoNotDisturb] = useState(false);

  // Update state when notifications change
  const updateState = useCallback(() => {
    setNotifications(manager.getNotifications());
    setUnreadCount(manager.getUnreadCount());
    setPermissions(manager.checkPermissions());
    
    // Check DND status
    const config = manager.getConfig();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = config.privacy.doNotDisturbStart;
    const end = config.privacy.doNotDisturbEnd;
    
    if (config.privacy.doNotDisturb) {
      if (start > end) {
        setIsDoNotDisturb(currentTime >= start || currentTime < end);
      } else {
        setIsDoNotDisturb(currentTime >= start && currentTime < end);
      }
    } else {
      setIsDoNotDisturb(false);
    }
  }, [manager]);

  // Set up event listeners
  useEffect(() => {
    // Update state on notification events
    const handleUpdate = () => updateState();
    
    manager.on('onShow', handleUpdate);
    manager.on('onDismiss', handleUpdate);
    manager.on('onClick', handleUpdate);
    manager.on('onPermissionChange', (perms) => {
      setPermissions(perms);
    });

    // Initial state
    updateState();

    // Update DND status every minute
    const interval = setInterval(updateState, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [manager, updateState]);

  // Notification methods
  const notify = useCallback(
    async (title: string, options?: NotificationOptions): Promise<string> => {
      const id = await manager.notify(title, options);
      updateState();
      return id;
    },
    [manager, updateState]
  );

  const success = useCallback(
    async (title: string, options?: Omit<NotificationOptions, 'type'>): Promise<string> => {
      const id = await manager.success(title, options);
      updateState();
      return id;
    },
    [manager, updateState]
  );

  const error = useCallback(
    async (title: string, options?: Omit<NotificationOptions, 'type'>): Promise<string> => {
      const id = await manager.error(title, options);
      updateState();
      return id;
    },
    [manager, updateState]
  );

  const warning = useCallback(
    async (title: string, options?: Omit<NotificationOptions, 'type'>): Promise<string> => {
      const id = await manager.warning(title, options);
      updateState();
      return id;
    },
    [manager, updateState]
  );

  const info = useCallback(
    async (title: string, options?: Omit<NotificationOptions, 'type'>): Promise<string> => {
      const id = await manager.info(title, options);
      updateState();
      return id;
    },
    [manager, updateState]
  );

  // Management methods
  const dismiss = useCallback(
    (notificationId: string) => {
      manager.dismiss(notificationId);
      updateState();
    },
    [manager, updateState]
  );

  const dismissAll = useCallback(() => {
    manager.dismissAll();
    updateState();
  }, [manager, updateState]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      manager.markAsRead(notificationId);
      updateState();
    },
    [manager, updateState]
  );

  const markAllAsRead = useCallback(() => {
    manager.markAllAsRead();
    updateState();
  }, [manager, updateState]);

  // Permission methods
  const requestPermission = useCallback(async (): Promise<NotificationPermissions> => {
    const perms = await manager.requestPermission();
    setPermissions(perms);
    return perms;
  }, [manager]);

  const checkPermissions = useCallback((): NotificationPermissions => {
    const perms = manager.checkPermissions();
    setPermissions(perms);
    return perms;
  }, [manager]);

  // History methods
  const getHistory = useCallback(
    (limit?: number): NotificationHistoryEntry[] => {
      return manager.getHistory(limit);
    },
    [manager]
  );

  const clearHistory = useCallback(() => {
    manager.clearHistory();
  }, [manager]);

  // Settings methods
  const updateSettings = useCallback(
    (settings: Partial<NotificationServiceConfig>) => {
      manager.updateConfig(settings);
      updateState();
    },
    [manager, updateState]
  );

  const getSettings = useCallback((): NotificationServiceConfig => {
    return manager.getConfig();
  }, [manager]);

  return {
    // State
    notifications,
    unreadCount,
    permissions,
    isDoNotDisturb,
    
    // Methods
    notify,
    success,
    error,
    warning,
    info,
    
    // Management
    dismiss,
    dismissAll,
    markAsRead,
    markAllAsRead,
    
    // Permissions
    requestPermission,
    checkPermissions,
    
    // History
    getHistory,
    clearHistory,
    
    // Settings
    updateSettings,
    getSettings,
  };
}

/**
 * Hook for showing quick notifications without state management
 */
export function useQuickNotify() {
  const { notify, success, error, warning, info } = useNotifications();
  
  return {
    notify,
    success,
    error,
    warning,
    info,
  };
}