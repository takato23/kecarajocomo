# Auto-Save System for Profile Management

## Overview

The auto-save system provides comprehensive automatic saving functionality with debouncing, offline support, conflict resolution, and recovery mechanisms. It consists of four main components:

## Components

### 1. `useAutoSave` Hook (`src/hooks/useAutoSave.ts`)

The main hook that provides auto-save functionality for any component.

**Features:**
- Debounced auto-saving (configurable delay)
- Offline queuing with automatic sync when back online
- Conflict detection and resolution
- Local storage backup for recovery
- Validation before saving
- Manual save capabilities
- Progress tracking

**Usage:**
```typescript
const autoSave = useAutoSave(initialData, {
  onSave: async (data) => {
    await saveToServer(data);
  },
  onValidate: (data) => {
    return data.isValid ? true : 'Error message';
  },
  config: {
    debounceMs: 2000,
    maxRetries: 3,
    enableLocalStorage: true
  },
  enableOffline: true,
  storageKey: 'my-data'
});

// Update data and trigger auto-save
autoSave.updateData(newData);

// Force immediate save
await autoSave.forceSave();

// Manual save without debounce
await autoSave.manualSave();
```

### 2. `AutoSaveIndicator` Component (`src/components/profile/AutoSaveIndicator.tsx`)

Visual indicators for save states with different variants.

**States:**
- `idle`: No changes
- `saving`: Currently saving
- `saved`: Successfully saved
- `error`: Save failed
- `offline`: Saved offline, pending sync
- `conflict`: Conflict detected

**Variants:**
- `AutoSaveIndicator`: Standard indicator with text and actions
- `AutoSaveHeader`: Header variant with connection status
- `AutoSaveProgress`: Progress bar for long operations

**Usage:**
```typescript
<AutoSaveIndicator
  state={autoSave.saveState}
  lastSaved={lastSaved}
  onRetry={autoSave.retryFailedSaves}
  onResolveConflict={handleConflict}
/>
```

### 3. `AutoSaveManager` Service (`src/services/profile/AutoSaveManager.ts`)

Core auto-save logic with advanced features.

**Features:**
- Debounced saving with exponential backoff retry
- Conflict detection and resolution
- Local storage backup
- Progress tracking
- Resource cleanup

**Configuration:**
```typescript
const config: AutoSaveConfig = {
  debounceMs: 1000,           // Debounce delay
  maxRetries: 3,              // Max retry attempts
  retryDelayMs: 2000,         // Base retry delay
  enableLocalStorage: true,   // Local backup
  enableConflictDetection: true
};
```

### 4. `OfflineQueue` Service (`src/lib/offline/OfflineQueue.ts`)

Manages offline operations with persistent storage.

**Features:**
- Persistent queue in localStorage
- Priority-based processing
- Automatic processing when back online
- Configurable retry logic
- Queue statistics and cleanup

**Usage:**
```typescript
const queue = new OfflineQueue();

// Register processors
queue.registerProcessor('profile_*', profileProcessor);

// Enqueue operation
await queue.enqueue('profile_save', data, { priority: 1 });

// Process queue when online
await queue.processQueue();
```

## Implementation Example

The `ProfileView` component demonstrates full integration:

```typescript
export function ProfileView() {
  const [profile, setProfile] = useState(initialProfile);
  
  // Auto-save setup
  const autoSave = useAutoSave(profile, {
    onSave: async (data) => {
      await profileManager.upsertProfile(userId, data);
      setLastSaved(new Date());
    },
    onValidate: (data) => {
      // Validation logic
      return data.householdSize > 0 ? true : 'Invalid size';
    },
    onConflict: async (local, server) => {
      // Conflict resolution strategy
      return { ...server, ...local };
    },
    config: {
      debounceMs: 2000,
      maxRetries: 3,
      enableLocalStorage: true
    },
    enableOffline: true
  });

  // Update with auto-save
  const updateProfile = (newData) => {
    setProfile(newData);
    autoSave.updateData(newData);
  };

  return (
    <div>
      <AutoSaveHeader
        state={autoSave.saveState}
        lastSaved={lastSaved}
        onRetry={autoSave.retryFailedSaves}
      />
      
      {/* Form inputs that trigger updateProfile */}
      <input 
        value={profile.name}
        onChange={(e) => updateProfile({
          ...profile,
          name: e.target.value
        })}
      />
    </div>
  );
}
```

## Offline Queue Processors

Specialized processors handle different types of operations:

```typescript
// Initialize processors
import { initializeOfflineProcessors } from '@/lib/offline/OfflineQueueProcessors';

const offlineQueue = new OfflineQueue();
initializeOfflineProcessors(offlineQueue);

// Processors handle:
// - profile_save*: Full profile saves
// - dietary_restrictions*: Diet updates
// - allergies*: Allergy updates
// - profile_batch*: Batch operations
```

## Configuration Options

### Auto-Save Hook Options
```typescript
interface UseAutoSaveOptions<T> {
  config?: Partial<AutoSaveConfig>;
  onSave: (data: T) => Promise<void>;
  onValidate?: (data: T) => boolean | string;
  onStateChange?: (state: SaveState) => void;
  enableOffline?: boolean;
  storageKey?: string;
  enableConflictDetection?: boolean;
  onConflict?: (localData: T, serverData: T) => Promise<T>;
}
```

### Auto-Save Manager Config
```typescript
interface AutoSaveConfig {
  debounceMs: number;                    // Debounce delay
  maxRetries: number;                    // Max retry attempts
  retryDelayMs: number;                  // Base retry delay
  enableLocalStorage: boolean;           // Local backup
  enableConflictDetection: boolean;      // Conflict detection
  storageKeyPrefix?: string;             // Storage key prefix
}
```

### Offline Queue Config
```typescript
interface QueueConfig {
  storagePrefix: string;                 // Storage key prefix
  defaultMaxAttempts: number;            // Default max attempts
  retryDelayMultiplier: number;          // Retry delay multiplier
  maxQueueSize: number;                  // Maximum queue size
  autoProcess: boolean;                  // Auto-process when online
}
```

## Best Practices

### 1. Data Validation
Always validate data before saving:
```typescript
const validateProfile = (data: UserProfile): boolean | string => {
  if (!data.householdSize || data.householdSize < 1) {
    return 'Household size must be at least 1';
  }
  if (data.monthlyBudget < 0) {
    return 'Budget cannot be negative';
  }
  return true;
};
```

### 2. Conflict Resolution
Implement smart conflict resolution:
```typescript
const resolveConflict = async (local: UserProfile, server: UserProfile) => {
  // Prefer local user inputs, server system data
  return {
    ...server,           // Server system data
    ...local,            // Local user changes
    updatedAt: server.updatedAt // Server timestamp
  };
};
```

### 3. Error Handling
Handle errors gracefully:
```typescript
const handleSave = async (data: UserProfile) => {
  try {
    await profileManager.upsertProfile(userId, data);
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      // Will be queued for offline processing
      throw error;
    } else {
      // Handle other errors
      toast.error('Save failed: ' + error.message);
      throw error;
    }
  }
};
```

### 4. Performance Optimization
- Use appropriate debounce delays (1-3 seconds)
- Enable local storage for recovery
- Clean up on component unmount
- Monitor queue size and cleanup old items

### 5. User Experience
- Show clear save states
- Provide manual save options
- Handle offline scenarios gracefully
- Offer data recovery when appropriate

## Monitoring and Debugging

### Save State Monitoring
```typescript
autoSave.onStateChange = (state) => {
  console.log('Save state changed:', state);
  // Log to analytics, update UI, etc.
};
```

### Queue Statistics
```typescript
const stats = await offlineQueue.getQueueStats();
console.log(`Pending: ${stats.pending}, Failed: ${stats.failed}`);
```

### Recovery Data
```typescript
const recoveryData = autoSave.getRecoveryData();
if (recoveryData) {
  // Show recovery prompt to user
}
```

## Testing

Test different scenarios:
- Normal save operations
- Network interruptions
- Browser refresh/close
- Concurrent edits
- Data validation failures
- Storage quota exceeded

This auto-save system provides a robust, user-friendly experience with comprehensive error handling and offline support.