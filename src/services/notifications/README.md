# Notifications Service

A unified notification system for KeCarajoComer that supports multiple channels and platforms.

## Features

- 🔔 **Multi-Channel Support**: Toast, banner, push, audio, voice (TTS), vibration, and native notifications
- 📱 **Cross-Platform**: Works on mobile (iOS/Android) and desktop browsers
- 🎯 **Priority Levels**: Low, medium, high, and urgent priorities with smart routing
- ⏰ **Scheduling**: Schedule notifications for future delivery with recurring options
- 🔇 **Do Not Disturb**: Respect user preferences with configurable quiet hours
- 🎤 **Voice Integration**: Text-to-speech support with multiple languages
- 📊 **Analytics**: Track notification engagement and effectiveness
- 💾 **Persistence**: Notifications survive page reloads
- 🎨 **Customizable**: Extensive configuration options

## Installation

The notification service is already integrated into the project. To use it in your components:

```typescript
import { useNotifications } from '@/services/notifications';
```

## Basic Usage

### Quick Notifications

```typescript
import { useQuickNotify } from '@/services/notifications';

function MyComponent() {
  const { success, error, warning, info } = useQuickNotify();

  const handleSave = async () => {
    try {
      await saveData();
      success('Guardado exitosamente');
    } catch (err) {
      error('Error al guardar', {
        metadata: { description: err.message }
      });
    }
  };
}
```

### Full Notification Management

```typescript
import { useNotifications } from '@/services/notifications';

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    notify,
    dismiss,
    markAsRead,
    requestPermission,
  } = useNotifications();

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

  // Show a complex notification
  const showReminder = () => {
    notify('Tiempo de cocinar!', {
      type: 'reminder',
      priority: 'high',
      channels: ['toast', 'audio', 'voice'],
      voice: {
        text: 'Es hora de preparar el almuerzo',
        language: 'es-MX',
      },
      action: {
        label: 'Ver recetas',
        action: () => navigate('/recipes'),
      },
      schedule: {
        at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });
  };

  return (
    <div>
      <Badge count={unreadCount} />
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => dismiss(notification.id)}
          onRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
}
```

## Notification Types

- `success` - Positive actions (green)
- `error` - Errors and failures (red)
- `warning` - Warnings and cautions (yellow)
- `info` - General information (blue)
- `reminder` - Time-based reminders
- `expiration` - Food expiration alerts
- `achievement` - Gamification rewards
- `social` - Social interactions

## Priority Levels

- `low` - Non-critical, dismissible
- `medium` - Standard notifications
- `high` - Important, may include sound
- `urgent` - Critical, bypasses DND, persistent

## Channels

### Toast
Standard in-app notifications using Sonner:
```typescript
notify('Message', { channels: ['toast'] });
```

### Audio
Play notification sounds:
```typescript
notify('Alert!', { 
  channels: ['audio'],
  sound: '/sounds/custom.mp3' // or true for default
});
```

### Voice (TTS)
Text-to-speech announcements:
```typescript
notify('Reminder', {
  channels: ['voice'],
  voice: {
    text: 'Tu temporizador ha terminado',
    language: 'es-MX',
    rate: 1.2,
  }
});
```

### Vibration
Mobile device vibration:
```typescript
notify('Alert', {
  channels: ['vibration'],
  vibrate: [200, 100, 200] // Pattern in ms
});
```

### Push Notifications
Native browser/mobile notifications:
```typescript
notify('New Recipe', {
  channels: ['push'],
  persistent: true,
});
```

## Scheduling

### One-time Schedule
```typescript
notify('Cook dinner', {
  schedule: {
    at: new Date('2024-01-15 18:00'),
    timezone: 'America/Mexico_City',
  }
});
```

### Recurring Notifications
```typescript
notify('Daily reminder', {
  recurring: {
    interval: 'daily',
    time: '09:00',
    days: [1, 2, 3, 4, 5], // Monday-Friday
    endDate: new Date('2024-12-31'),
  }
});
```

## Configuration

### Global Settings
```typescript
const { updateSettings } = useNotifications();

updateSettings({
  defaultDuration: 5000,
  defaultPosition: 'bottom-right',
  channels: {
    toast: true,
    audio: true,
    voice: false,
    vibration: true,
  },
  privacy: {
    doNotDisturb: true,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    allowedDuringDND: ['urgent'],
  },
  voice: {
    enabled: true,
    language: 'es-MX',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
  },
});
```

## Do Not Disturb

DND mode prevents non-urgent notifications during specified hours:

```typescript
// Check DND status
const { isDoNotDisturb } = useNotifications();

// Only urgent notifications bypass DND
notify('Urgent!', { priority: 'urgent' });
```

## History and Analytics

```typescript
const { getHistory, clearHistory } = useNotifications();

// Get notification history
const history = getHistory(50); // Last 50 notifications

// Analyze engagement
const engaged = history.filter(h => h.interacted).length;
const engagementRate = (engaged / history.length) * 100;
```

## Permission Management

```typescript
const { permissions, requestPermission } = useNotifications();

// Check current permissions
if (permissions.push !== 'granted') {
  const result = await requestPermission();
  if (result.push === 'granted') {
    console.log('Push notifications enabled!');
  }
}
```

## Event Handlers

```typescript
import { getNotificationManager } from '@/services/notifications';

const manager = getNotificationManager();

// Listen to notification events
manager.on('onShow', (notification) => {
  console.log('Notification shown:', notification);
});

manager.on('onClick', (notification) => {
  console.log('Notification clicked:', notification);
});

manager.on('onDismiss', (notification, reason) => {
  console.log('Notification dismissed:', reason);
});
```

## Best Practices

1. **Request Permission Early**: Ask for notification permission during onboarding
2. **Use Appropriate Priorities**: Reserve urgent for critical alerts
3. **Respect User Preferences**: Honor DND and notification settings
4. **Provide Value**: Make notifications actionable and relevant
5. **Test Across Platforms**: Verify behavior on different devices
6. **Handle Offline**: Notifications are queued when offline
7. **Localize Content**: Use appropriate language for voice/text

## Integration Examples

### Pantry Expiration Alerts
```typescript
function useExpirationAlerts() {
  const { notify } = useNotifications();
  
  const checkExpirations = async () => {
    const expiring = await getExpiringItems();
    
    expiring.forEach(item => {
      notify(`${item.name} expira pronto!`, {
        type: 'expiration',
        priority: item.daysLeft <= 1 ? 'high' : 'medium',
        channels: ['toast', 'push'],
        action: {
          label: 'Ver detalles',
          action: () => navigate(`/pantry/${item.id}`),
        },
      });
    });
  };
}
```

### Cooking Timer
```typescript
function CookingTimer({ duration, recipe }) {
  const { notify } = useNotifications();
  
  const startTimer = () => {
    setTimeout(() => {
      notify('¡Tiempo!', {
        type: 'reminder',
        priority: 'high',
        channels: ['toast', 'audio', 'voice', 'vibration'],
        voice: {
          text: `El temporizador para ${recipe.name} ha terminado`,
        },
        vibrate: [500, 200, 500],
        persistent: true,
      });
    }, duration);
  };
}
```

### Achievement Unlocked
```typescript
function useAchievements() {
  const { notify } = useNotifications();
  
  const unlockAchievement = (achievement) => {
    notify('¡Logro desbloqueado!', {
      type: 'achievement',
      priority: 'medium',
      channels: ['toast', 'audio'],
      sound: '/sounds/achievement.mp3',
      metadata: {
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
      },
    });
  };
}
```

## Troubleshooting

### Notifications Not Showing
1. Check browser permissions: `Notification.permission`
2. Verify service is enabled in settings
3. Check if in DND mode
4. Ensure notifications aren't disabled in config

### Voice Not Working
1. Check browser TTS support: `'speechSynthesis' in window`
2. Verify voice is enabled in settings
3. Check language availability
4. Ensure volume is not muted

### Push Notifications Issues
1. HTTPS is required for push notifications
2. Service worker must be registered
3. Check browser compatibility
4. Verify permission is granted

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
|---------|--------|---------|--------|------|------------|----------------|
| Toast | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audio | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Voice | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Push | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ |
| Vibration | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

⚠️ = Partial support or requires user interaction
❌ = Not supported