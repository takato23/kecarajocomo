/**
 * Notifications Service Types
 * Unified notification system types for all platforms
 */

// Notification types
export type NotificationType = 
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'reminder'
  | 'expiration'
  | 'achievement'
  | 'social';

// Priority levels
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Delivery channels
export type NotificationChannel = 
  | 'toast'
  | 'banner'
  | 'push'
  | 'audio'
  | 'voice'
  | 'vibration'
  | 'native';

// Display positions
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

// Base notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  timestamp: string;
  read: boolean;
  metadata?: Record<string, any>;
}

// Notification options
export interface NotificationOptions {
  // Display options
  type?: NotificationType;
  priority?: NotificationPriority;
  duration?: number; // milliseconds
  position?: ToastPosition;
  persistent?: boolean;
  
  // Channel-specific options
  channels?: NotificationChannel[];
  voice?: boolean | VoiceOptions;
  vibrate?: boolean | number[]; // vibration pattern
  sound?: boolean | string; // sound file or true for default
  
  // Interaction options
  action?: NotificationAction;
  dismissible?: boolean;
  
  // Scheduling options
  schedule?: ScheduleOptions;
  recurring?: RecurringOptions;
  
  // Additional metadata
  metadata?: Record<string, any>;
  groupId?: string; // for grouping related notifications
  tag?: string; // for replacing notifications
}

// Voice notification options
export interface VoiceOptions {
  text?: string; // custom text to speak
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string; // specific voice to use
}

// Notification actions
export interface NotificationAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'default' | 'primary' | 'danger';
}

// Schedule options
export interface ScheduleOptions {
  at: Date | string; // when to show
  timezone?: string;
}

// Recurring notification options
export interface RecurringOptions {
  interval: 'daily' | 'weekly' | 'monthly' | 'custom';
  customInterval?: number; // milliseconds for custom
  days?: number[]; // 0-6 for weekly
  time?: string; // HH:mm format
  endDate?: Date;
  maxOccurrences?: number;
}

// Notification queue item
export interface QueuedNotification {
  notification: Notification;
  options: NotificationOptions;
  scheduledTime?: Date;
  attempts: number;
  lastAttempt?: Date;
}

// Service configuration
export interface NotificationServiceConfig {
  // General settings
  enabled: boolean;
  defaultDuration: number;
  defaultPosition: ToastPosition;
  maxQueueSize: number;
  
  // Channel settings
  channels: {
    toast: boolean;
    banner: boolean;
    push: boolean;
    audio: boolean;
    voice: boolean;
    vibration: boolean;
    native: boolean;
  };
  
  // Sound settings
  sounds: {
    success: string;
    error: string;
    warning: string;
    info: string;
    default: string;
  };
  
  // Voice settings
  voice: {
    enabled: boolean;
    language: string;
    rate: number;
    pitch: number;
    volume: number;
  };
  
  // Platform-specific settings
  mobile: {
    vibrationEnabled: boolean;
    vibrationPattern: number[];
    pushEnabled: boolean;
  };
  
  // Privacy settings
  privacy: {
    doNotDisturb: boolean;
    doNotDisturbStart: string; // HH:mm
    doNotDisturbEnd: string; // HH:mm
    allowedDuringDND: NotificationPriority[]; // only these priorities during DND
  };
}

// Notification history entry
export interface NotificationHistoryEntry {
  notification: Notification;
  deliveredAt: Date;
  channels: NotificationChannel[];
  interacted: boolean;
  interactionType?: 'click' | 'dismiss' | 'action';
  interactionTime?: Date;
}

// Analytics data
export interface NotificationAnalytics {
  totalSent: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  interactionRate: number;
  averageTimeToInteraction: number;
  dismissRate: number;
}

// Permission status
export interface NotificationPermissions {
  push: 'granted' | 'denied' | 'default';
  audio: boolean;
  vibration: boolean;
}

// Events
export interface NotificationEvents {
  onShow: (notification: Notification) => void;
  onDismiss: (notification: Notification, reason: 'user' | 'timeout' | 'programmatic') => void;
  onClick: (notification: Notification) => void;
  onAction: (notification: Notification, action: string) => void;
  onPermissionChange: (permissions: NotificationPermissions) => void;
  onError: (error: Error, notification?: Notification) => void;
}

// React hook return type
export interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  permissions: NotificationPermissions;
  isDoNotDisturb: boolean;
  
  // Methods
  notify: (title: string, options?: NotificationOptions) => Promise<string>;
  success: (title: string, options?: Omit<NotificationOptions, 'type'>) => Promise<string>;
  error: (title: string, options?: Omit<NotificationOptions, 'type'>) => Promise<string>;
  warning: (title: string, options?: Omit<NotificationOptions, 'type'>) => Promise<string>;
  info: (title: string, options?: Omit<NotificationOptions, 'type'>) => Promise<string>;
  
  // Management
  dismiss: (notificationId: string) => void;
  dismissAll: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  
  // Permissions
  requestPermission: () => Promise<NotificationPermissions>;
  checkPermissions: () => NotificationPermissions;
  
  // History
  getHistory: (limit?: number) => NotificationHistoryEntry[];
  clearHistory: () => void;
  
  // Settings
  updateSettings: (settings: Partial<NotificationServiceConfig>) => void;
  getSettings: () => NotificationServiceConfig;
}