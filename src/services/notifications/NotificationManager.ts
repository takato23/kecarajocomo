/**
 * Notification Manager
 * Core notification management and delivery system
 */

import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

import type {
  Notification,
  NotificationOptions,
  NotificationServiceConfig,
  NotificationType,
  NotificationChannel,
  QueuedNotification,
  NotificationHistoryEntry,
  NotificationPermissions,
  NotificationEvents,
  NotificationPriority,
} from './types';

// Default configuration
const DEFAULT_CONFIG: NotificationServiceConfig = {
  enabled: true,
  defaultDuration: 4000,
  defaultPosition: 'bottom-right',
  maxQueueSize: 100,
  channels: {
    toast: true,
    banner: false,
    push: false,
    audio: true,
    voice: false,
    vibration: true,
    native: false,
  },
  sounds: {
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3',
    info: '/sounds/info.mp3',
    default: '/sounds/notification.mp3',
  },
  voice: {
    enabled: false,
    language: 'es-MX',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  },
  mobile: {
    vibrationEnabled: true,
    vibrationPattern: [200, 100, 200],
    pushEnabled: false,
  },
  privacy: {
    doNotDisturb: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    allowedDuringDND: ['urgent', 'high'],
  },
};

export class NotificationManager {
  private config: NotificationServiceConfig;
  private notifications: Map<string, Notification>;
  private queue: QueuedNotification[];
  private history: NotificationHistoryEntry[];
  private events: Partial<NotificationEvents>;
  private audioCache: Map<string, HTMLAudioElement>;
  private speechSynthesis: SpeechSynthesis | null;
  private vibrationAPI: boolean;
  private isProcessingQueue: boolean;

  constructor(config: Partial<NotificationServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.notifications = new Map();
    this.queue = [];
    this.history = [];
    this.events = {};
    this.audioCache = new Map();
    this.speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.vibrationAPI = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    this.isProcessingQueue = false;

    // Initialize from localStorage
    this.loadFromStorage();
    
    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Create and show a notification
   */
  async notify(
    title: string,
    options: NotificationOptions = {}
  ): Promise<string> {
    // Check if notifications are enabled
    if (!this.config.enabled) {
      return '';
    }

    // Check Do Not Disturb
    if (this.isDoNotDisturb() && !this.shouldShowDuringDND(options.priority)) {
      return '';
    }

    // Create notification object
    const notification: Notification = {
      id: uuidv4(),
      type: options.type || 'info',
      title,
      message: options.metadata?.description || options.metadata?.message,
      priority: options.priority || 'medium',
      channels: options.channels || this.getDefaultChannels(options),
      timestamp: new Date().toISOString(),
      read: false,
      metadata: options.metadata,
    };

    // Add to notifications map
    this.notifications.set(notification.id, notification);

    // Handle scheduling
    if (options.schedule) {
      await this.scheduleNotification(notification, options);
      return notification.id;
    }

    // Add to queue or show immediately
    if (this.shouldQueue(options)) {
      this.addToQueue(notification, options);
    } else {
      await this.showNotification(notification, options);
    }

    return notification.id;
  }

  /**
   * Show a success notification
   */
  async success(title: string, options: Omit<NotificationOptions, 'type'> = {}): Promise<string> {
    return this.notify(title, { ...options, type: 'success' });
  }

  /**
   * Show an error notification
   */
  async error(title: string, options: Omit<NotificationOptions, 'type'> = {}): Promise<string> {
    return this.notify(title, { ...options, type: 'error', priority: options.priority || 'high' });
  }

  /**
   * Show a warning notification
   */
  async warning(title: string, options: Omit<NotificationOptions, 'type'> = {}): Promise<string> {
    return this.notify(title, { ...options, type: 'warning' });
  }

  /**
   * Show an info notification
   */
  async info(title: string, options: Omit<NotificationOptions, 'type'> = {}): Promise<string> {
    return this.notify(title, { ...options, type: 'info' });
  }

  /**
   * Show notification through various channels
   */
  private async showNotification(
    notification: Notification,
    options: NotificationOptions
  ): Promise<void> {
    const channels = notification.channels;

    // Show toast notification
    if (channels.includes('toast')) {
      this.showToast(notification, options);
    }

    // Play audio
    if (channels.includes('audio') && options.sound !== false) {
      this.playSound(notification.type, options.sound);
    }

    // Text-to-speech
    if (channels.includes('voice') || options.voice) {
      this.speakNotification(notification, options);
    }

    // Vibration
    if (channels.includes('vibration') && this.vibrationAPI && options.vibrate !== false) {
      this.vibrate(options.vibrate);
    }

    // Push notification
    if (channels.includes('push')) {
      await this.showPushNotification(notification, options);
    }

    // Native notification
    if (channels.includes('native')) {
      await this.showNativeNotification(notification, options);
    }

    // Add to history
    this.addToHistory(notification, channels);

    // Trigger event
    this.events.onShow?.(notification);

    // Save to storage
    this.saveToStorage();
  }

  /**
   * Show toast notification using Sonner
   */
  private showToast(notification: Notification, options: NotificationOptions): void {
    const toastOptions = {
      description: notification.message,
      duration: options.duration || this.config.defaultDuration,
      position: options.position || this.config.defaultPosition,
      dismissible: options.dismissible !== false,
      action: options.action ? {
        label: options.action.label,
        onClick: () => {
          options.action!.action();
          this.events.onAction?.(notification, 'action');
        },
      } : undefined,
      onDismiss: () => {
        this.events.onDismiss?.(notification, 'user');
      },
      onClick: () => {
        this.events.onClick?.(notification);
      },
    };

    // Show toast based on type
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      default:
        toast(notification.title, toastOptions);
    }
  }

  /**
   * Play notification sound
   */
  private async playSound(type: NotificationType, sound?: boolean | string): Promise<void> {
    if (!this.config.channels.audio) return;

    try {
      const soundFile = typeof sound === 'string' 
        ? sound 
        : this.config.sounds[type] || this.config.sounds.default;

      // Get or create audio element
      let audio = this.audioCache.get(soundFile);
      if (!audio) {
        audio = new Audio(soundFile);
        audio.volume = 0.5;
        this.audioCache.set(soundFile, audio);
      }

      // Play sound
      await audio.play();
    } catch (error: unknown) {
      logger.warn('Failed to play notification sound:', 'NotificationManager', error);
    }
  }

  /**
   * Speak notification using TTS
   */
  private speakNotification(notification: Notification, options: NotificationOptions): void {
    if (!this.speechSynthesis || !this.config.voice.enabled) return;

    try {
      const voiceOptions = typeof options.voice === 'object' ? options.voice : {};
      const text = voiceOptions.text || `${notification.title}. ${notification.message || ''}`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceOptions.language || this.config.voice.language;
      utterance.rate = voiceOptions.rate || this.config.voice.rate;
      utterance.pitch = voiceOptions.pitch || this.config.voice.pitch;
      utterance.volume = voiceOptions.volume || this.config.voice.volume;

      // Find matching voice if specified
      if (voiceOptions.voice) {
        const voices = this.speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === voiceOptions.voice);
        if (voice) utterance.voice = voice;
      }

      this.speechSynthesis.speak(utterance);
    } catch (error: unknown) {
      logger.warn('Failed to speak notification:', 'NotificationManager', error);
    }
  }

  /**
   * Trigger device vibration
   */
  private vibrate(pattern?: boolean | number[]): void {
    if (!this.vibrationAPI || !this.config.mobile.vibrationEnabled) return;

    try {
      const vibrationPattern = Array.isArray(pattern) 
        ? pattern 
        : this.config.mobile.vibrationPattern;
      
      navigator.vibrate(vibrationPattern);
    } catch (error: unknown) {
      logger.warn('Failed to vibrate device:', 'NotificationManager', error);
    }
  }

  /**
   * Show push notification
   */
  private async showPushNotification(
    notification: Notification,
    options: NotificationOptions
  ): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const pushNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: options.tag || notification.id,
        data: notification,
        requireInteraction: options.persistent,
      });

      pushNotification.onclick = () => {
        window.focus();
        this.events.onClick?.(notification);
        pushNotification.close();
      };
    } catch (error: unknown) {
      logger.warn('Failed to show push notification:', 'NotificationManager', error);
    }
  }

  /**
   * Show native notification (platform-specific)
   */
  private async showNativeNotification(
    notification: Notification,
    options: NotificationOptions
  ): Promise<void> {
    // This would integrate with platform-specific notification APIs
    // For now, fallback to push notification
    await this.showPushNotification(notification, options);
  }

  /**
   * Schedule a notification
   */
  private async scheduleNotification(
    notification: Notification,
    options: NotificationOptions
  ): Promise<void> {
    if (!options.schedule) return;

    const scheduledTime = new Date(options.schedule.at);
    const now = new Date();

    if (scheduledTime <= now) {
      // Show immediately if scheduled time has passed
      await this.showNotification(notification, options);
      return;
    }

    // Add to queue with scheduled time
    const queuedNotification: QueuedNotification = {
      notification,
      options,
      scheduledTime,
      attempts: 0,
    };

    this.queue.push(queuedNotification);
    this.queue.sort((a, b) => 
      (a.scheduledTime?.getTime() || 0) - (b.scheduledTime?.getTime() || 0)
    );

    // Save queue
    this.saveToStorage();
  }

  /**
   * Add notification to queue
   */
  private addToQueue(notification: Notification, options: NotificationOptions): void {
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove oldest non-scheduled notification
      const index = this.queue.findIndex(item => !item.scheduledTime);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }
    }

    this.queue.push({
      notification,
      options,
      attempts: 0,
    });
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return;

    this.isProcessingQueue = true;
    const now = new Date();

    try {
      // Process scheduled notifications
      while (this.queue.length > 0) {
        const item = this.queue[0];
        
        // Check if it's time to show scheduled notification
        if (item.scheduledTime && item.scheduledTime > now) {
          break; // Wait for scheduled time
        }

        // Remove from queue
        this.queue.shift();

        // Show notification
        try {
          await this.showNotification(item.notification, item.options);
        } catch (error: unknown) {
          logger.error('Failed to show queued notification:', 'NotificationManager', error);
          
          // Retry logic
          item.attempts++;
          if (item.attempts < 3) {
            item.lastAttempt = now;
            this.queue.push(item); // Add back to end of queue
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every second
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  /**
   * Get default channels based on options and config
   */
  private getDefaultChannels(options: NotificationOptions): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Always include toast if enabled
    if (this.config.channels.toast) {
      channels.push('toast');
    }

    // Add audio for important notifications
    if (this.config.channels.audio && 
        (options.priority === 'high' || options.priority === 'urgent')) {
      channels.push('audio');
    }

    // Add voice if explicitly requested
    if (options.voice && this.config.channels.voice) {
      channels.push('voice');
    }

    // Add vibration for mobile
    if (options.vibrate && this.config.channels.vibration) {
      channels.push('vibration');
    }

    return channels.length > 0 ? channels : ['toast'];
  }

  /**
   * Check if should queue notification
   */
  private shouldQueue(options: NotificationOptions): boolean {
    // Queue if there are many active toasts
    if (options.channels?.includes('toast')) {
      // This is a simplified check - in production, you'd track active toasts
      return false;
    }
    return false;
  }

  /**
   * Check if in Do Not Disturb mode
   */
  private isDoNotDisturb(): boolean {
    if (!this.config.privacy.doNotDisturb) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = this.config.privacy.doNotDisturbStart;
    const end = this.config.privacy.doNotDisturbEnd;

    // Handle overnight DND (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }

  /**
   * Check if notification should show during DND
   */
  private shouldShowDuringDND(priority?: NotificationPriority): boolean {
    if (!priority) return false;
    return this.config.privacy.allowedDuringDND.includes(priority);
  }

  /**
   * Add notification to history
   */
  private addToHistory(notification: Notification, channels: NotificationChannel[]): void {
    const entry: NotificationHistoryEntry = {
      notification,
      deliveredAt: new Date(),
      channels,
      interacted: false,
    };

    this.history.unshift(entry);

    // Limit history size
    if (this.history.length > 1000) {
      this.history = this.history.slice(0, 1000);
    }
  }

  /**
   * Dismiss a notification
   */
  dismiss(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Dismiss toast
    toast.dismiss(notificationId);

    // Remove from notifications
    this.notifications.delete(notificationId);

    // Trigger event
    this.events.onDismiss?.(notification, 'programmatic');

    // Save state
    this.saveToStorage();
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    // Dismiss all toasts
    toast.dismiss();

    // Clear notifications
    this.notifications.clear();

    // Save state
    this.saveToStorage();
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveToStorage();
  }

  /**
   * Get notification history
   */
  getHistory(limit?: number): NotificationHistoryEntry[] {
    return limit ? this.history.slice(0, limit) : [...this.history];
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<NotificationPermissions> {
    const permissions: NotificationPermissions = {
      push: 'default',
      audio: true,
      vibration: this.vibrationAPI,
    };

    // Request push notification permission
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        permissions.push = permission;
      } catch (error: unknown) {
        logger.error('Failed to request notification permission:', 'NotificationManager', error);
      }
    }

    // Audio permission is usually granted by default
    // Vibration API doesn't require permission

    this.events.onPermissionChange?.(permissions);
    return permissions;
  }

  /**
   * Check current permissions
   */
  checkPermissions(): NotificationPermissions {
    return {
      push: 'Notification' in window ? Notification.permission : 'default',
      audio: true, // Usually granted by default
      vibration: this.vibrationAPI,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NotificationServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationServiceConfig {
    return { ...this.config };
  }

  /**
   * Set event listeners
   */
  on<K extends keyof NotificationEvents>(
    event: K,
    handler: NotificationEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        notifications: Array.from(this.notifications.entries()),
        queue: this.queue,
        history: this.history.slice(0, 100), // Save only recent history
        config: this.config,
      };

      localStorage.setItem('notification-manager', JSON.stringify(state));
    } catch (error: unknown) {
      logger.warn('Failed to save notification state:', 'NotificationManager', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('notification-manager');
      if (!saved) return;

      const state = JSON.parse(saved);
      
      // Restore notifications
      if (state.notifications) {
        this.notifications = new Map(state.notifications);
      }

      // Restore queue
      if (state.queue) {
        this.queue = state.queue.map((item: any) => ({
          ...item,
          scheduledTime: item.scheduledTime ? new Date(item.scheduledTime) : undefined,
          lastAttempt: item.lastAttempt ? new Date(item.lastAttempt) : undefined,
        }));
      }

      // Restore history
      if (state.history) {
        this.history = state.history.map((entry: any) => ({
          ...entry,
          deliveredAt: new Date(entry.deliveredAt),
          interactionTime: entry.interactionTime ? new Date(entry.interactionTime) : undefined,
        }));
      }

      // Restore config
      if (state.config) {
        this.config = { ...this.config, ...state.config };
      }
    } catch (error: unknown) {
      logger.warn('Failed to load notification state:', 'NotificationManager', error);
      localStorage.removeItem('notification-manager');
    }
  }
}

// Singleton instance
let notificationManager: NotificationManager | null = null;

/**
 * Get notification manager instance
 */
export function getNotificationManager(
  config?: Partial<NotificationServiceConfig>
): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager(config);
  }
  return notificationManager;
}