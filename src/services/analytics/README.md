# Analytics Service

A unified analytics system for KeCarajoComer with multi-provider support, privacy controls, and comprehensive tracking capabilities.

## Features

- 📊 **Multi-Provider Support**: PostHog, Segment, Google Analytics, Mixpanel
- 🔐 **Privacy-First**: GDPR compliant with consent management
- 📈 **Performance Tracking**: Web Vitals and custom metrics
- 🎯 **Event Tracking**: User actions, conversions, and engagement
- 🔍 **Error Tracking**: Automatic error capture and reporting
- 🎤 **Voice Analytics**: Track voice command usage and success
- 📱 **Cross-Platform**: Works on web and mobile
- 🚀 **Optimized**: Batching, sampling, and efficient data collection

## Installation

The analytics service is already integrated into the project. To use it in your components:

```typescript
import { useAnalytics } from '@/services/analytics';
```

## Basic Usage

### Quick Event Tracking

```typescript
import { track, ANALYTICS_EVENTS } from '@/services/analytics';

// Track a simple event
track(ANALYTICS_EVENTS.RECIPE_VIEW, {
  recipe_id: '123',
  recipe_name: 'Tacos al Pastor',
  source: 'search',
});
```

### React Hook Usage

```typescript
import { useAnalytics } from '@/services/analytics';

function RecipeCard({ recipe }) {
  const { track, startTimer } = useAnalytics();

  const handleView = () => {
    // Track view event
    track('recipe_view', {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      category: recipe.category,
    });

    // Measure interaction time
    const endTimer = startTimer('recipe_interaction');
    
    // End timer when user leaves
    return () => endTimer();
  };

  return <div onClick={handleView}>{recipe.name}</div>;
}
```

## Event Tracking

### Standard Events

```typescript
const { track } = useAnalytics();

// User events
track('user_signup', { method: 'email' });
track('user_login', { method: 'google' });

// Feature usage
track('pantry_item_add', {
  item_name: 'Tomatoes',
  quantity: 5,
  unit: 'kg',
  method: 'barcode_scan',
});

// Conversions
track('recipe_save', {
  recipe_id: '123',
  recipe_difficulty: 'easy',
  prep_time: 30,
});
```

### Page Views

```typescript
const { page } = useAnalytics();

// Track page view
page('Recipe Details', {
  recipe_id: '123',
  category: 'Mexican',
});

// Automatic page tracking is enabled by default
```

### User Identification

```typescript
const { identify } = useAnalytics();

// Identify user after login
identify(user.id, {
  email: user.email,
  name: user.name,
  plan: 'premium',
  created_at: user.createdAt,
});
```

## Performance Tracking

### Web Vitals

```typescript
import { usePerformanceTracking } from '@/services/analytics';

function App() {
  // Automatically tracks Core Web Vitals
  usePerformanceTracking();
  
  return <YourApp />;
}
```

### Custom Performance Metrics

```typescript
const { trackPerformance, startTimer } = useAnalytics();

// Track custom metrics
trackPerformance({
  customMetrics: {
    api_latency: 245,
    render_time: 120,
    data_fetch_time: 180,
  }
});

// Time specific operations
const endTimer = startTimer('recipe_generation');
const recipe = await generateRecipe();
endTimer(); // Automatically tracks duration
```

## Error Tracking

### Automatic Error Capture

```typescript
import { useErrorTracking } from '@/services/analytics';

function App() {
  // Automatically captures unhandled errors
  useErrorTracking();
  
  return <YourApp />;
}
```

### Manual Error Tracking

```typescript
const { trackError } = useAnalytics();

try {
  await riskyOperation();
} catch (error) {
  trackError(error, {
    context: 'recipe_generation',
    user_action: 'generate_ai_recipe',
    ingredients: ingredients.length,
  });
}
```

## Voice Analytics

Track voice command usage and effectiveness:

```typescript
const { trackVoiceCommand } = useAnalytics();

// Track successful command
trackVoiceCommand({
  command: 'add eggs to pantry',
  language: 'es-MX',
  confidence: 0.95,
  duration: 2500,
  success: true,
});

// Track failed command
trackVoiceCommand({
  command: 'unclear input',
  language: 'es-MX',
  confidence: 0.3,
  duration: 1500,
  success: false,
  errorReason: 'low_confidence',
});
```

## Feature Usage Tracking

Track detailed feature usage:

```typescript
import { useFeatureTracking, FEATURES } from '@/services/analytics';

function BarcodeScanner() {
  const { trackAction, trackDuration } = useFeatureTracking(FEATURES.SCANNER);

  const handleScan = async () => {
    trackAction('scan_start', 'barcode');
    
    const startTime = Date.now();
    const result = await scanBarcode();
    
    trackDuration('scan_complete', Date.now() - startTime, {
      success: result.success,
      product_type: result.productType,
    });
  };
}
```

## Privacy and Consent

### Consent Management

```typescript
const { hasConsent, optIn, optOut, setConsent } = useAnalytics();

// Check consent status
if (!hasConsent) {
  // Show consent banner
  const userChoice = await showConsentBanner();
  
  if (userChoice) {
    optIn(); // User accepted
  } else {
    optOut(); // User declined
  }
}

// Programmatically set consent
setConsent(true); // Enable tracking
setConsent(false); // Disable tracking
```

### Privacy Configuration

```typescript
import { getAnalyticsService } from '@/services/analytics';

// Configure privacy settings
const analytics = getAnalyticsService({
  privacy: {
    anonymizeIP: true,
    respectDoNotTrack: true,
    requireConsent: true,
    excludedEvents: ['sensitive_event'],
    excludedProperties: ['password', 'email', 'phone'],
  },
});
```

## Configuration

### Basic Configuration

```typescript
const { updateConfig } = useAnalytics();

updateConfig({
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
});
```

### Provider Configuration

```typescript
import { getAnalyticsService } from '@/services/analytics';

const analytics = getAnalyticsService({
  providers: [
    {
      provider: 'posthog',
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost: 'https://app.posthog.com',
      options: {
        autocapture: false,
        capture_pageview: false,
      },
    },
    {
      provider: 'segment',
      apiKey: process.env.NEXT_PUBLIC_SEGMENT_KEY,
    },
  ],
});
```

### Performance Settings

```typescript
updateConfig({
  performance: {
    trackWebVitals: true,
    trackResourceTiming: false,
    trackLongTasks: false,
    sampleRate: 0.1, // Sample 10% of users
  },
});
```

### Error Tracking Settings

```typescript
updateConfig({
  errorTracking: {
    enabled: true,
    captureConsoleErrors: false,
    captureUnhandledRejections: true,
    captureResourceErrors: false,
    sanitizeErrorMessages: true,
  },
});
```

## Advanced Usage

### Session Management

```typescript
const { startSession, endSession, sessionId } = useAnalytics();

// Manual session control
startSession(); // Start new session
endSession(); // End current session

// Session is automatically managed, but you can control it manually
```

### Debug Mode

```typescript
const { debug } = useAnalytics();

// Enable debug logging
debug(true);

// All events will be logged to console
track('test_event', { data: 'value' });
// Console: Analytics Event: { ... }
```

### Custom Event Types

```typescript
// Define custom events with TypeScript
type CustomEvents = 
  | 'recipe_shared'
  | 'meal_plan_exported'
  | 'shopping_list_printed';

const trackCustom = (event: CustomEvents, properties?: Record<string, any>) => {
  track(event, properties);
};

// Use with type safety
trackCustom('recipe_shared', {
  recipe_id: '123',
  share_method: 'whatsapp',
});
```

## Integration Examples

### Recipe Interaction Tracking

```typescript
function RecipeDetail({ recipe }) {
  const { track, startTimer } = useAnalytics();
  const [viewTime, setViewTime] = useState<() => void>();

  useEffect(() => {
    // Track view
    track('recipe_view', {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
    });

    // Start interaction timer
    const endTimer = startTimer('recipe_interaction');
    setViewTime(() => endTimer);

    return () => {
      // End timer on unmount
      if (viewTime) viewTime();
    };
  }, [recipe.id]);

  const handleCook = () => {
    track('recipe_cook_start', {
      recipe_id: recipe.id,
      servings: recipe.servings,
    });
  };

  const handleSave = () => {
    track('recipe_save', {
      recipe_id: recipe.id,
      source: 'detail_page',
    });
  };

  return (
    <div>
      <h1>{recipe.name}</h1>
      <button onClick={handleCook}>Cocinar</button>
      <button onClick={handleSave}>Guardar</button>
    </div>
  );
}
```

### Shopping List Analytics

```typescript
function ShoppingList() {
  const { track } = useAnalytics();
  const { items, checkItem } = useShoppingList();

  const handleItemCheck = (item) => {
    track('shopping_item_check', {
      item_name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
    });
    
    checkItem(item.id);
  };

  const handleExport = () => {
    track('shopping_list_export', {
      item_count: items.length,
      total_price: items.reduce((sum, item) => sum + item.price, 0),
      export_format: 'pdf',
    });
  };

  return (
    <div>
      {items.map(item => (
        <ShoppingItem
          key={item.id}
          item={item}
          onCheck={() => handleItemCheck(item)}
        />
      ))}
      <button onClick={handleExport}>Exportar PDF</button>
    </div>
  );
}
```

### Gamification Tracking

```typescript
function useGamificationTracking() {
  const { track } = useAnalytics();

  const trackAchievement = (achievement) => {
    track('achievement_unlock', {
      achievement_id: achievement.id,
      achievement_name: achievement.name,
      points_earned: achievement.points,
      total_points: getUserTotalPoints(),
    });
  };

  const trackLevelUp = (newLevel) => {
    track('user_level_up', {
      new_level: newLevel,
      time_to_level: getTimeSinceLastLevel(),
    });
  };

  return { trackAchievement, trackLevelUp };
}
```

## Best Practices

1. **Event Naming**: Use consistent, descriptive event names
   - Good: `recipe_view`, `pantry_item_add`
   - Bad: `view`, `add`

2. **Property Naming**: Use snake_case for properties
   - Good: `recipe_id`, `user_name`
   - Bad: `recipeId`, `userName`

3. **Avoid PII**: Don't track personally identifiable information
   - Use user IDs instead of emails
   - Hash sensitive data if needed

4. **Batch Events**: Let the service handle batching
   - Don't manually batch events
   - Configure batch size appropriately

5. **Use Constants**: Define event names as constants
   ```typescript
   const EVENTS = {
     RECIPE_VIEW: 'recipe_view',
     RECIPE_SAVE: 'recipe_save',
   } as const;
   ```

6. **Track Context**: Include relevant context in events
   ```typescript
   track('item_add', {
     item_name: 'Milk',
     category: 'Dairy',
     source: 'barcode_scan', // How it was added
     screen: 'pantry', // Where in the app
   });
   ```

## Troubleshooting

### Events Not Tracking

1. Check if analytics is enabled
2. Verify consent has been given
3. Check Do Not Track settings
4. Ensure providers are configured correctly
5. Look for errors in console (enable debug mode)

### Performance Issues

1. Reduce batch size for faster sending
2. Increase flush interval to reduce requests
3. Use sampling for high-traffic events
4. Disable resource timing if not needed

### Provider Issues

1. Verify API keys are correct
2. Check network requests in DevTools
3. Ensure provider scripts are loaded
4. Look for CORS or CSP issues

## Privacy Compliance

### GDPR Compliance

- Requires explicit consent before tracking
- Provides opt-out mechanism
- Anonymizes IP addresses
- Allows data deletion requests

### Cookie Usage

- Uses localStorage for session persistence
- Falls back gracefully if storage is blocked
- Respects cookie consent preferences

### Data Retention

- Configure retention in provider dashboards
- Implement data deletion workflows
- Document what data is collected

## Testing

### Mock Analytics in Tests

```typescript
jest.mock('@/services/analytics', () => ({
  useAnalytics: () => ({
    track: jest.fn(),
    page: jest.fn(),
    identify: jest.fn(),
    trackError: jest.fn(),
  }),
  track: jest.fn(),
}));
```

### Verify Events

```typescript
import { track } from '@/services/analytics';

test('tracks recipe view', () => {
  const { getByText } = render(<RecipeCard recipe={mockRecipe} />);
  
  fireEvent.click(getByText(mockRecipe.name));
  
  expect(track).toHaveBeenCalledWith('recipe_view', {
    recipe_id: mockRecipe.id,
    recipe_name: mockRecipe.name,
  });
});
```

## Performance Considerations

- Events are batched automatically
- Minimal impact on app performance
- Async operations don't block UI
- Efficient memory usage with queue limits
- Automatic cleanup on page unload