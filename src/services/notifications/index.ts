/**
 * Notifications Service Export
 * Centralized export point for all notification-related services
 */

// Main service
export { NotificationManager, getNotificationManager } from './NotificationManager';

// Types
export * from './types';

// React hooks
export { useNotifications, useQuickNotify } from './hooks/useNotifications';

// Re-export Toaster from sonner for convenience
export { Toaster } from 'sonner';

// Convenience exports for easy migration
import { getNotificationManager } from './NotificationManager';

// Create a default instance
const defaultManager = getNotificationManager();

// Export convenience methods
export const notify = defaultManager.notify.bind(defaultManager);
export const success = defaultManager.success.bind(defaultManager);
export const error = defaultManager.error.bind(defaultManager);
export const warning = defaultManager.warning.bind(defaultManager);
export const info = defaultManager.info.bind(defaultManager);

// Export default instance for advanced usage
export { defaultManager };

// Constants
export const NOTIFICATION_TYPES = [
  'success',
  'error',
  'warning',
  'info',
  'reminder',
  'expiration',
  'achievement',
  'social',
] as const;

export const NOTIFICATION_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const NOTIFICATION_CHANNELS = [
  'toast',
  'banner',
  'push',
  'audio',
  'voice',
  'vibration',
  'native',
] as const;