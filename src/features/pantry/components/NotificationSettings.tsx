'use client';

import React from 'react';
import { Bell, BellOff, Clock, AlertTriangle, Settings } from 'lucide-react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Heading, Text } from '@/components/design-system/Typography';
import { Badge } from '@/components/design-system/Badge';

import { usePantryNotifications } from '../hooks/usePantryNotifications';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const {
    hasPermission,
    settings,
    urgentCount,
    expiredCount,
    requestPermission,
    updateSettings,
    checkAndNotify,
  } = usePantryNotifications();

  const handleToggleNotifications = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (granted) {
        updateSettings({ enabled: true });
      }
    } else {
      updateSettings({ enabled: !settings.enabled });
    }
  };

  const intervalOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '8 hours' },
    { value: 1440, label: '24 hours' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <Heading as="h3" size="lg" className="text-lg font-semibold text-gray-900">
            Notification Settings
          </Heading>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Permission Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasPermission ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <Heading as="h3" size="lg" className="font-medium text-gray-900">
                Browser Notifications
              </Heading>
              <Text size="sm" className="text-gray-600">
                {hasPermission 
                  ? 'Notifications are enabled for this browser'
                  : 'Enable notifications to get alerts about expiring items'
                }
              </Text>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={hasPermission && settings.enabled ? 'success' : 'neutral'}>
              {hasPermission && settings.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Button
              variant={hasPermission && settings.enabled ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleToggleNotifications}
            >
              {hasPermission && settings.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Current Alerts Status */}
      {(urgentCount > 0 || expiredCount > 0) && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <Heading as="h3" size="lg" className="font-medium text-orange-900">
                  Active Alerts
                </Heading>
                <Text size="sm" className="text-orange-700">
                  {expiredCount > 0 && `${expiredCount} expired item${expiredCount !== 1 ? 's' : ''}`}
                  {expiredCount > 0 && urgentCount > 0 && ', '}
                  {urgentCount > 0 && `${urgentCount} expiring soon`}
                </Text>
              </div>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={checkAndNotify}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Test Notification
            </Button>
          </div>
        </Card>
      )}

      {/* Notification Types */}
      {hasPermission && (
        <Card className="p-4">
          <Heading as="h3" size="lg" className="font-medium text-gray-900 mb-4">
            Alert Types
          </Heading>
          
          <div className="space-y-4">
            {/* Expired Items */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <Text size="base" className="font-medium text-gray-900">
                    Expired Items
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    Notify when items have passed their expiration date
                  </Text>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.expiredItems}
                  onChange={(e) => updateSettings({ expiredItems: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Urgent Items */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <Text size="base" className="font-medium text-gray-900">
                    Urgent Items
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    Notify when items expire within 1-2 days
                  </Text>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.urgentItems}
                  onChange={(e) => updateSettings({ urgentItems: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Warning Items */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <Text size="base" className="font-medium text-gray-900">
                    Weekly Reminders
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    Notify when items expire within 3-7 days
                  </Text>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.warningItems}
                  onChange={(e) => updateSettings({ warningItems: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Check Frequency */}
      {hasPermission && settings.enabled && (
        <Card className="p-4">
          <Heading as="h3" size="lg" className="font-medium text-gray-900 mb-4">
            Check Frequency
          </Heading>
          
          <div className="space-y-2">
            <Text size="sm" className="text-gray-600 mb-3">
              How often should we check for expiring items?
            </Text>
            
            <select
              value={settings.checkInterval}
              onChange={(e) => updateSettings({ checkInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {intervalOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <Text size="xs" className="text-gray-500 text-xs mt-2">
              Note: More frequent checks may impact battery life on mobile devices
            </Text>
          </div>
        </Card>
      )}

      {/* Browser Support Info */}
      {typeof window !== 'undefined' && !('Notification' in window) && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <Heading as="h3" size="lg" className="font-medium text-yellow-900">
                Browser Not Supported
              </Heading>
              <Text size="sm" className="text-yellow-700">
                Your browser doesn't support notifications. Try using a modern browser like Chrome, Firefox, Safari, or Edge.
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <Heading as="h3" size="lg" className="font-medium text-blue-900 mb-2">
          💡 Tips for Better Notifications
        </Heading>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Keep the app tab open in your browser for real-time notifications</li>
          <li>• Add this site to your home screen on mobile for app-like notifications</li>
          <li>• Enable sound in your browser settings for audio alerts</li>
          <li>• Test notifications to make sure they're working properly</li>
        </ul>
      </Card>
    </div>
  );
}