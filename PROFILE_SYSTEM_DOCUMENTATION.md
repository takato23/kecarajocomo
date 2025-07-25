# Profile System Documentation

## Overview

The KeCarajoComér Profile System is a comprehensive, production-ready solution for managing user profiles, preferences, and gamification in a culinary application. This system provides advanced features including real-time synchronization, auto-save functionality, conflict resolution, performance monitoring, and analytics tracking.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [API Reference](#api-reference)
4. [Migration Guide](#migration-guide)
5. [Performance Optimization](#performance-optimization)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Deployment Checklist](#deployment-checklist)
8. [Troubleshooting](#troubleshooting)

## Architecture

### System Overview

```
┌─── User Interface Layer ───────────────────────────────────┐
│  ProfileHub (Gamified)    │  ProfileView (Simple)         │
│  • Gamification          │  • Basic Profile Management    │
│  • Advanced Tabs         │  • Auto-save                   │
│  • Performance Optimized │  • iOS 26 Design System        │
└─────────────────────────────────────────────────────────────┘
                                    │
┌─── Integration Layer ──────────────────────────────────────┐
│                ProfileSystemIntegrator                     │
│  • Centralized coordination                               │
│  • Real-time synchronization                              │
│  • Performance monitoring                                 │
│  • Analytics tracking                                     │
│  • Error handling & recovery                              │
└─────────────────────────────────────────────────────────────┘
                                    │
┌─── Service Layer ──────────────────────────────────────────┐
│  ProfileManager    │  AutoSave Hook  │  Gamification Hook │
│  • Data persistence  • Conflict res.  • Achievement sys.  │
│  • Validation        • Offline support • Progress tracking │
│  • CRUD operations   • Recovery        • Leaderboards     │
└─────────────────────────────────────────────────────────────┘
                                    │
┌─── Data Layer ─────────────────────────────────────────────┐
│  Supabase Database  │  Local Storage  │  IndexedDB Cache  │
│  • Primary storage   • Auto-save cache • Performance cache │
│  • Real-time sync    • Offline support • Analytics buffer │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Performance First**: Sub-3-second load times, optimized bundle sizes
2. **User Experience**: Seamless interactions, visual feedback, error recovery
3. **Data Integrity**: Conflict resolution, offline support, auto-save
4. **Scalability**: Modular architecture, lazy loading, efficient caching
5. **Monitoring**: Real-time analytics, performance tracking, error reporting

## Core Components

### 1. ProfileHub (Advanced Interface)

**Location**: `src/components/profile/ProfileHub.tsx`

**Features**:
- Gamified experience with achievements, streaks, and leaderboards
- 9 specialized tabs (Overview, Progress, Achievements, etc.)
- Performance optimized with React.memo and lazy loading
- Real-time progress tracking
- Responsive design with mobile-first approach

**Usage**:
```tsx
import { ProfileHub } from '@/components/profile/ProfileHub';

function App() {
  return <ProfileHub />;
}
```

**Performance Optimizations**:
- Lazy-loaded tab components
- Memoized sub-components
- Optimized re-rendering
- Intelligent caching

### 2. ProfileView (Simple Interface)

**Location**: `src/components/profile/ProfileView.tsx`

**Features**:
- Streamlined profile management
- Auto-save with conflict resolution
- iOS 26 design system integration
- Offline support with recovery
- Accessibility compliant

**Usage**:
```tsx
import { ProfileView } from '@/components/profile/ProfileView';

function ProfilePage() {
  return <ProfileView />;
}
```

**Auto-save Configuration**:
```tsx
const autoSave = useAutoSave(profile, {
  onSave: handleSave,
  onValidate: handleValidation,
  onConflict: handleConflictResolution,
  config: {
    debounceMs: 2000,
    maxRetries: 3,
    enableLocalStorage: true,
    enableConflictDetection: true
  }
});
```

### 3. ProfileSystemIntegrator

**Location**: `src/lib/profile/ProfileSystemIntegrator.ts`

**Features**:
- Centralized system coordination
- Real-time synchronization
- Performance monitoring
- Analytics tracking
- Error handling and recovery
- Migration assistance

**Usage**:
```tsx
import { getProfileSystemIntegrator, useProfileSystemIntegrator } from '@/lib/profile/ProfileSystemIntegrator';

// Initialize system
const integrator = getProfileSystemIntegrator({
  enableRealTimeSync: true,
  enableAnalytics: true,
  enableGamification: true
});

await integrator.initialize();

// Use in React component
function MyComponent() {
  const { integrator, state, health } = useProfileSystemIntegrator();
  
  const handleUpdate = async (updates) => {
    await integrator.updateUserProfile(userId, updates);
  };
  
  return (
    <div>
      <div>System Status: {state.syncStatus}</div>
      <div>Health: {health.status}</div>
    </div>
  );
}
```

### 4. Gamification System

**Components**:
- `ProfileProgress`: Visual progress tracking
- `ProfileAchievements`: Achievement management
- `ProfileStreaks`: Streak tracking
- `ProfileLeaderboard`: Social leaderboards

**Hook Usage**:
```tsx
import { useProfileGamification } from '@/hooks/useProfileGamification';

function GamifiedComponent() {
  const { metrics, suggestions, celebrateCompletion } = useProfileGamification();
  
  return (
    <div>
      <div>Overall Progress: {metrics.overall}%</div>
      <div>Level: {metrics.level}</div>
      <div>Points: {metrics.totalPoints}</div>
    </div>
  );
}
```

## API Reference

### ProfileSystemIntegrator Methods

#### `initialize(): Promise<void>`
Initializes the profile system with all subsystems.

#### `getCompleteUserProfile(userId: string)`
Returns complete profile data including analytics and metrics.

**Returns**:
```typescript
{
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  householdMembers: HouseholdMember[];
  completionMetrics: ProfileCompletionMetrics;
  analytics: ProfileAnalytics;
}
```

#### `updateUserProfile(userId: string, updates: Partial<UserProfile>, options?)`
Updates user profile with conflict resolution.

**Options**:
- `skipConflictResolution?: boolean`
- `force?: boolean`
- `source?: string`

#### `batchUpdateProfiles(updates, onProgress?)`
Batch update for migration scenarios.

#### `getSystemHealth()`
Returns system health metrics and performance data.

#### `forceSynchronization(): Promise<void>`
Forces immediate synchronization of all pending changes.

### Events

The system emits various events for monitoring and integration:

```typescript
integrator.on('profile:updated', ({ userId, profile }) => {
  console.log('Profile updated:', userId);
});

integrator.on('profile:conflict', ({ userId, conflicts }) => {
  console.log('Conflicts detected:', conflicts);
});

integrator.on('system:health', ({ health }) => {
  console.log('System health:', health.status);
});

integrator.on('analytics:event', ({ event, data }) => {
  // Send to analytics service
  analytics.track(event, data);
});
```

## Migration Guide

### Migrating from Legacy Profile System

1. **Install Dependencies**
```bash
npm install react-error-boundary framer-motion
```

2. **Update Route Files**
Replace existing profile routes with the new optimized versions:

```tsx
// Old: src/app/(app)/profile/page.tsx
export default function ProfilePage() {
  return <OldProfileComponent />;
}

// New: Enhanced with error boundaries and performance
export default function ProfilePage() {
  return (
    <ErrorBoundary FallbackComponent={ProfileErrorFallback}>
      <Suspense fallback={<ProfileLoadingFallback />}>
        <ProfileHub />
      </Suspense>
    </ErrorBoundary>
  );
}
```

3. **Initialize System Integration**
```tsx
// In your app initialization
import { getProfileSystemIntegrator } from '@/lib/profile/ProfileSystemIntegrator';

const integrator = getProfileSystemIntegrator({
  enableRealTimeSync: true,
  enableAnalytics: true,
  enableGamification: true
});

await integrator.initialize();
```

4. **Migrate User Data**
```tsx
// Batch migration example
const migrationData = await getLegacyUserData();
const updates = migrationData.map(user => ({
  userId: user.id,
  data: transformLegacyData(user)
}));

const results = await integrator.batchUpdateProfiles(updates, (progress, userId) => {
  console.log(`Migration progress: ${progress}% - User: ${userId}`);
});

console.log(`Migration complete: ${results.successful} successful, ${results.failed.length} failed`);
```

### Data Transformation

Legacy data structure transformation:

```typescript
function transformLegacyData(legacyUser: any): Partial<UserProfile> {
  return {
    // Map legacy fields to new structure
    householdSize: legacyUser.family_size || 1,
    monthlyBudget: legacyUser.budget || 0,
    dietaryRestrictions: legacyUser.diet_restrictions || [],
    allergies: legacyUser.food_allergies || [],
    preferredCuisines: legacyUser.favorite_cuisines || [],
    cookingSkillLevel: legacyUser.cooking_level || 3,
    
    // New fields with defaults
    stats: {
      profileViews: 0,
      lastActive: new Date(),
      completionPercentage: 0
    },
    
    // Timestamps
    createdAt: legacyUser.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

## Performance Optimization

### Key Metrics

- **Initial Load**: < 3 seconds on 3G
- **Profile Update**: < 500ms response time
- **Bundle Size**: < 500KB initial, < 2MB total
- **Memory Usage**: < 100MB on mobile

### Optimization Strategies

#### 1. Code Splitting and Lazy Loading
```tsx
// Lazy load tab components
const ProfileOverview = lazy(() => import('./ProfileOverview'));
const DietaryPreferences = lazy(() => import('./DietaryPreferences'));

// Use Suspense boundaries
<Suspense fallback={<TabContentSkeleton />}>
  <ProfileOverview />
</Suspense>
```

#### 2. React Performance Optimizations
```tsx
// Memoize components
const StatsCard = React.memo(({ value, label, prefix }) => (
  <Card>
    <CardContent>
      <div>{prefix}{value}</div>
      <p>{label}</p>
    </CardContent>
  </Card>
));

// Memoize expensive calculations
const completionPercentage = useMemo(() => {
  return calculateCompletion(profile, preferences);
}, [profile, preferences]);

// Callback optimization
const handleUpdate = useCallback((updates) => {
  updateProfile(updates);
}, [updateProfile]);
```

#### 3. Data Optimization
```tsx
// Efficient data fetching
const { profile, preferences, metrics } = await Promise.all([
  profileManager.getUserProfile(userId),
  profileManager.getUserPreferences(userId),
  profileManager.getProfileCompletionMetrics(userId)
]);

// Intelligent caching
const cachedData = useMemo(() => {
  return computeExpensiveData(profile);
}, [profile.updatedAt]); // Only recompute when data actually changes
```

#### 4. Bundle Optimization
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        profile: {
          test: /[\\/]components[\\/]profile[\\/]/,
          name: 'profile',
          chunks: 'all',
        },
      },
    },
  },
};
```

### Performance Monitoring

```tsx
// Built-in performance tracking
const integrator = getProfileSystemIntegrator({
  enablePerformanceMonitoring: true
});

// Monitor key metrics
integrator.on('performance:metric', ({ metric, value, timestamp }) => {
  if (value > PERFORMANCE_THRESHOLDS[metric]) {
    console.warn(`Performance threshold exceeded: ${metric} = ${value}ms`);
    
    // Send to monitoring service
    monitoring.recordMetric(metric, value, timestamp);
  }
});
```

## Analytics & Monitoring

### Built-in Analytics

The system automatically tracks:

- Profile completion progress
- User engagement patterns
- Feature usage statistics
- Performance metrics
- Error rates and patterns

### Custom Analytics Integration

```tsx
// Google Analytics integration
integrator.on('analytics:event', ({ event, data }) => {
  gtag('event', event, {
    event_category: 'Profile',
    event_label: data.userId,
    value: data.completionPercentage,
    custom_map: {
      load_time: data.loadTime,
      source: data.source
    }
  });
});

// Custom analytics service
integrator.on('analytics:event', ({ event, data }) => {
  analyticsService.track(event, {
    userId: data.userId,
    properties: data,
    timestamp: data.timestamp
  });
});
```

### Monitoring Dashboard

Key metrics to monitor:

1. **User Metrics**
   - Profile completion rates
   - Feature adoption
   - User retention
   - Engagement scores

2. **Performance Metrics**
   - Load times
   - Update response times
   - Error rates
   - Cache hit rates

3. **System Health**
   - Sync success rates
   - Conflict resolution rates
   - Offline usage patterns
   - Recovery success rates

## Deployment Checklist

### Pre-deployment Verification

- [ ] **Performance Tests**
  - [ ] Load time < 3s on 3G
  - [ ] Update response time < 500ms
  - [ ] Memory usage < 100MB mobile
  - [ ] Bundle size within limits

- [ ] **Functionality Tests**
  - [ ] All profile fields save correctly
  - [ ] Auto-save works offline
  - [ ] Conflict resolution handles edge cases
  - [ ] Gamification updates properly
  - [ ] Analytics events fire correctly

- [ ] **Accessibility Tests**
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatibility
  - [ ] WCAG 2.1 AA compliance
  - [ ] Color contrast ratios meet standards

- [ ] **Browser Compatibility**
  - [ ] Chrome (latest 2 versions)
  - [ ] Firefox (latest 2 versions)
  - [ ] Safari (latest 2 versions)
  - [ ] Edge (latest 2 versions)
  - [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Configuration Checklist

- [ ] **Environment Variables**
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
  NEXT_PUBLIC_ENABLE_GAMIFICATION=true
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
  ```

- [ ] **Database Setup**
  - [ ] Profile tables created
  - [ ] Indexes optimized
  - [ ] RLS policies configured
  - [ ] Backup strategy in place

- [ ] **Monitoring Setup**
  - [ ] Error tracking configured (Sentry)
  - [ ] Performance monitoring active
  - [ ] Analytics integration verified
  - [ ] Alerts configured for critical metrics

### Production Settings

```typescript
// Production configuration
const integrator = getProfileSystemIntegrator({
  enableRealTimeSync: true,
  syncIntervalMs: 30000,
  enableOfflineMode: true,
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableGamification: true,
  enableAutoSave: true,
  enableConflictResolution: true,
  migrationBatchSize: 10
});
```

### Rollout Strategy

1. **Canary Deployment** (5% of users)
   - Monitor error rates
   - Verify performance metrics
   - Check user feedback

2. **Gradual Rollout** (25% → 50% → 100%)
   - Monitor system health
   - Verify scalability
   - Address any issues

3. **Monitoring Phase** (2 weeks)
   - Daily health checks
   - Performance optimization
   - User feedback analysis

## Troubleshooting

### Common Issues

#### 1. Auto-save Not Working

**Symptoms**: Changes not being saved automatically

**Debugging**:
```tsx
// Check auto-save state
console.log('Auto-save state:', autoSave.saveState);
console.log('Pending changes:', autoSave.hasPendingChanges);
console.log('Last error:', autoSave.lastError);

// Check network connectivity
console.log('Online:', navigator.onLine);

// Verify validation
const validationResult = autoSave.validateData(profile);
console.log('Validation:', validationResult);
```

**Solutions**:
- Check network connectivity
- Verify validation rules
- Clear localStorage cache
- Force manual save

#### 2. Profile Conflicts

**Symptoms**: Conflict resolution dialogs appearing frequently

**Debugging**:
```tsx
integrator.on('profile:conflict', ({ userId, conflicts }) => {
  console.log('Conflicts detected:', conflicts);
  console.log('User ID:', userId);
  console.log('Conflict types:', conflicts.map(c => c.type));
});
```

**Solutions**:
- Review concurrent user sessions
- Adjust conflict detection sensitivity
- Implement better merge strategies
- Use force update when appropriate

#### 3. Performance Issues

**Symptoms**: Slow loading, high memory usage

**Debugging**:
```tsx
// Monitor performance metrics
integrator.on('performance:metric', ({ metric, value }) => {
  if (value > thresholds[metric]) {
    console.warn(`Performance issue: ${metric} = ${value}ms`);
  }
});

// Check system health
const health = integrator.getSystemHealth();
console.log('System health:', health);
```

**Solutions**:
- Enable React DevTools Profiler
- Check for memory leaks
- Optimize component re-renders
- Review data fetching patterns

#### 4. Gamification Not Updating

**Symptoms**: Progress, achievements not updating

**Debugging**:
```tsx
const { metrics, suggestions } = useProfileGamification();
console.log('Gamification metrics:', metrics);
console.log('Suggestions:', suggestions);

// Check profile completion
const completion = calculateProfileCompletion(profile, preferences);
console.log('Completion calculation:', completion);
```

**Solutions**:
- Verify profile data completeness
- Check gamification hook dependencies
- Clear achievement cache
- Force metrics recalculation

### Error Recovery

#### Automatic Recovery
The system includes built-in recovery mechanisms:

- **Auto-retry**: Failed operations retry with exponential backoff
- **Data recovery**: Local storage backup for unsaved changes
- **Graceful degradation**: System continues working with reduced functionality
- **Conflict resolution**: Automated merge strategies for common conflicts

#### Manual Recovery
For critical issues:

```tsx
// Clear all profile-related cache
localStorage.removeItem('profile-autosave');
localStorage.removeItem('profile-gamification');
localStorage.removeItem('profile-analytics');

// Force system reinitialization
await integrator.shutdown();
const newIntegrator = getProfileSystemIntegrator();
await newIntegrator.initialize();

// Force data synchronization
await newIntegrator.forceSynchronization();
```

### Getting Help

1. **Check System Health**
   ```tsx
   const health = integrator.getSystemHealth();
   const state = integrator.getSystemState();
   ```

2. **Enable Debug Mode**
   ```tsx
   const integrator = getProfileSystemIntegrator({
     enablePerformanceMonitoring: true,
     enableErrorTracking: true
   });
   ```

3. **Review Logs**
   - Browser console errors
   - Network requests
   - Performance metrics
   - Analytics events

4. **Contact Support**
   Include the following information:
   - System health report
   - Browser and device information
   - Steps to reproduce
   - Error messages and stack traces

---

## Conclusion

The KeCarajoComér Profile System provides a comprehensive, production-ready solution for user profile management with advanced features like gamification, real-time synchronization, and performance monitoring. This documentation should serve as your complete reference for implementation, deployment, and maintenance.

For additional support or questions, please refer to the troubleshooting section or contact the development team.