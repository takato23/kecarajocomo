/**
 * Tests for NotificationManager
 */

import { NotificationManager } from '../NotificationManager';
import type { NotificationServiceConfig } from '../types';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock browser APIs
const mockNotification = {
  requestPermission: jest.fn(),
  permission: 'default' as NotificationPermission,
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  getVoices: jest.fn().mockReturnValue([]),
};

const mockNavigator = {
  vibrate: jest.fn(),
  userAgent: 'test-agent',
};

// Setup global mocks
beforeAll(() => {
  (global as any).Notification = mockNotification;
  (global as any).speechSynthesis = mockSpeechSynthesis;
  (global as any).navigator = mockNavigator;
  (global as any).Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    volume: 0,
  }));
});

describe('NotificationManager', () => {
  let manager: NotificationManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    manager = new NotificationManager();
  });

  describe('Basic Notifications', () => {
    it('should create and show a notification', async () => {
      const id = await manager.notify('Test Notification', {
        type: 'success',
        metadata: { description: 'Test description' },
      });

      expect(id).toBeTruthy();
      expect(manager.getNotifications()).toHaveLength(1);
      
      const notification = manager.getNotifications()[0];
      expect(notification.title).toBe('Test Notification');
      expect(notification.type).toBe('success');
      expect(notification.message).toBe('Test description');
    });

    it('should show success notification', async () => {
      const { toast } = require('sonner');
      
      await manager.success('Success!', {
        metadata: { description: 'Operation completed' },
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Success!',
        expect.objectContaining({
          description: 'Operation completed',
        })
      );
    });

    it('should show error notification with high priority', async () => {
      const { toast } = require('sonner');
      
      await manager.error('Error!', {
        metadata: { description: 'Something went wrong' },
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Error!',
        expect.objectContaining({
          description: 'Something went wrong',
        })
      );
      
      const notification = manager.getNotifications()[0];
      expect(notification.priority).toBe('high');
    });

    it('should show warning notification', async () => {
      const { toast } = require('sonner');
      
      await manager.warning('Warning!');

      expect(toast.warning).toHaveBeenCalled();
    });

    it('should show info notification', async () => {
      const { toast } = require('sonner');
      
      await manager.info('Info');

      expect(toast).toHaveBeenCalled();
    });
  });

  describe('Notification Channels', () => {
    it('should play audio for notifications', async () => {
      const mockAudio = {
        play: jest.fn().mockResolvedValue(undefined),
        volume: 0.5,
      };
      (global as any).Audio = jest.fn().mockReturnValue(mockAudio);

      await manager.notify('Test', {
        type: 'success',
        channels: ['toast', 'audio'],
      });

      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should speak notification using TTS', async () => {
      const config: Partial<NotificationServiceConfig> = {
        voice: {
          enabled: true,
          language: 'es-MX',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
        },
      };
      
      manager = new NotificationManager(config);
      
      await manager.notify('Hola', {
        channels: ['voice'],
        voice: true,
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should vibrate device for mobile notifications', async () => {
      const config: Partial<NotificationServiceConfig> = {
        mobile: {
          vibrationEnabled: true,
          vibrationPattern: [200, 100, 200],
          pushEnabled: false,
        },
      };
      
      manager = new NotificationManager(config);
      
      await manager.notify('Test', {
        channels: ['vibration'],
        vibrate: true,
      });

      expect(mockNavigator.vibrate).toHaveBeenCalledWith([200, 100, 200]);
    });

    it('should show push notification when permitted', async () => {
      mockNotification.permission = 'granted';
      const mockPushNotification = jest.fn();
      (global as any).Notification = mockPushNotification;

      await manager.notify('Test', {
        channels: ['push'],
      });

      expect(mockPushNotification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          icon: '/icon-192x192.png',
        })
      );
    });
  });

  describe('Notification Management', () => {
    it('should dismiss a notification', async () => {
      const { toast } = require('sonner');
      
      const id = await manager.notify('Test');
      manager.dismiss(id);

      expect(toast.dismiss).toHaveBeenCalledWith(id);
      expect(manager.getNotifications()).toHaveLength(0);
    });

    it('should dismiss all notifications', async () => {
      const { toast } = require('sonner');
      
      await manager.notify('Test 1');
      await manager.notify('Test 2');
      
      manager.dismissAll();

      expect(toast.dismiss).toHaveBeenCalledWith();
      expect(manager.getNotifications()).toHaveLength(0);
    });

    it('should mark notification as read', async () => {
      const id = await manager.notify('Test');
      
      manager.markAsRead(id);
      
      const notification = manager.getNotifications()[0];
      expect(notification.read).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      await manager.notify('Test 1');
      await manager.notify('Test 2');
      
      manager.markAllAsRead();
      
      const notifications = manager.getNotifications();
      expect(notifications.every(n => n.read)).toBe(true);
    });

    it('should get unread count', async () => {
      await manager.notify('Test 1');
      await manager.notify('Test 2');
      const id = await manager.notify('Test 3');
      
      manager.markAsRead(id);
      
      expect(manager.getUnreadCount()).toBe(2);
    });
  });

  describe('Notification Scheduling', () => {
    it('should schedule a notification for future', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      
      const id = await manager.notify('Scheduled', {
        schedule: {
          at: futureDate,
        },
      });

      expect(id).toBeTruthy();
      // Notification should not be shown immediately
      expect(manager.getNotifications()).toHaveLength(0);
    });

    it('should show scheduled notification immediately if time has passed', async () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      
      await manager.notify('Past Scheduled', {
        schedule: {
          at: pastDate,
        },
      });

      expect(manager.getNotifications()).toHaveLength(1);
    });
  });

  describe('Permissions', () => {
    it('should request notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const permissions = await manager.requestPermission();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(permissions.push).toBe('granted');
      expect(permissions.audio).toBe(true);
      expect(permissions.vibration).toBe(true);
    });

    it('should check current permissions', () => {
      mockNotification.permission = 'denied';
      
      const permissions = manager.checkPermissions();
      
      expect(permissions.push).toBe('denied');
      expect(permissions.audio).toBe(true);
      expect(permissions.vibration).toBe(true);
    });
  });

  describe('Do Not Disturb', () => {
    it('should respect Do Not Disturb settings', async () => {
      const config: Partial<NotificationServiceConfig> = {
        privacy: {
          doNotDisturb: true,
          doNotDisturbStart: '22:00',
          doNotDisturbEnd: '08:00',
          allowedDuringDND: ['urgent'],
        },
      };
      
      manager = new NotificationManager(config);
      
      // Mock current time to be within DND hours
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      // Low priority notification should be blocked
      await manager.notify('Low priority', { priority: 'low' });
      expect(manager.getNotifications()).toHaveLength(0);
      
      // Urgent notification should go through
      await manager.notify('Urgent', { priority: 'urgent' });
      expect(manager.getNotifications()).toHaveLength(1);
    });
  });

  describe('History', () => {
    it('should track notification history', async () => {
      await manager.notify('Test 1');
      await manager.notify('Test 2');
      
      const history = manager.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].notification.title).toBe('Test 2'); // Most recent first
      expect(history[0].interacted).toBe(false);
    });

    it('should limit history entries', async () => {
      const history = manager.getHistory(1);
      
      expect(history).toHaveLength(0); // No notifications yet
      
      await manager.notify('Test 1');
      await manager.notify('Test 2');
      
      const limitedHistory = manager.getHistory(1);
      expect(limitedHistory).toHaveLength(1);
      expect(limitedHistory[0].notification.title).toBe('Test 2');
    });

    it('should clear history', async () => {
      await manager.notify('Test');
      
      manager.clearHistory();
      
      const history = manager.getHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig: Partial<NotificationServiceConfig> = {
        defaultDuration: 5000,
        defaultPosition: 'top-center',
      };
      
      manager.updateConfig(newConfig);
      
      const config = manager.getConfig();
      expect(config.defaultDuration).toBe(5000);
      expect(config.defaultPosition).toBe('top-center');
    });

    it('should respect disabled notifications', async () => {
      const config: Partial<NotificationServiceConfig> = {
        enabled: false,
      };
      
      manager = new NotificationManager(config);
      
      const id = await manager.notify('Test');
      
      expect(id).toBe('');
      expect(manager.getNotifications()).toHaveLength(0);
    });
  });

  describe('Persistence', () => {
    it('should save and restore state from localStorage', async () => {
      await manager.notify('Test 1');
      await manager.notify('Test 2');
      
      // Create new manager instance
      const newManager = new NotificationManager();
      
      // Should restore notifications
      expect(newManager.getNotifications()).toHaveLength(2);
    });
  });

  describe('Event Handlers', () => {
    it('should trigger onShow event', async () => {
      const onShow = jest.fn();
      manager.on('onShow', onShow);
      
      await manager.notify('Test');
      
      expect(onShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
        })
      );
    });

    it('should trigger onDismiss event', async () => {
      const onDismiss = jest.fn();
      manager.on('onDismiss', onDismiss);
      
      const id = await manager.notify('Test');
      manager.dismiss(id);
      
      expect(onDismiss).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
        }),
        'programmatic'
      );
    });
  });
});