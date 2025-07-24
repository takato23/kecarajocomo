/**
 * Storage Services Export
 * Centralized export point for all storage-related services
 */

// Main service
export { UnifiedStorageService, getStorageService } from './UnifiedStorageService';

// Types
export * from './types';

// Providers (for advanced usage)
export { StorageProviderInterface } from './providers/StorageProviderInterface';
export { LocalStorageProvider } from './providers/LocalStorageProvider';
export { SupabaseStorageProvider } from './providers/SupabaseStorageProvider';
export { MemoryStorageProvider } from './providers/MemoryStorageProvider';

// Managers (for advanced usage)
export { CacheManager } from './CacheManager';
export { SyncManager } from './SyncManager';
export { OfflineManager } from './OfflineManager';

// React hooks
export { useStorage } from './hooks/useStorage';
export { useFile } from './hooks/useFile';
export { useSync } from './hooks/useSync';
export { useOffline } from './hooks/useOffline';

// Constants
export const STORAGE_PROVIDERS = {
  SUPABASE: 'supabase',
  LOCAL: 'local',
  MEMORY: 'memory',
} as const;

export const DEFAULT_STORAGE_CONFIG = {
  provider: 'local' as const,
  localStorage: {
    prefix: 'kcc_',
    encrypt: false,
    compress: false,
  },
  cache: {
    maxSize: 50, // MB
    ttl: 3600000, // 1 hour
    strategy: 'lru' as const,
  },
} as const;

// Utility functions
export { createStorageKey, parseStorageKey } from './utils';

// Pre-configured storage instances for common use cases
export const userPreferencesStorage = () => getStorageService({
  ...DEFAULT_STORAGE_CONFIG,
  localStorage: {
    ...DEFAULT_STORAGE_CONFIG.localStorage,
    prefix: 'kcc_prefs_',
  },
});

export const tempStorage = () => getStorageService({
  provider: 'memory',
  cache: {
    maxSize: 10,
    ttl: 300000, // 5 minutes
    strategy: 'lru',
  },
});

export const mediaStorage = () => getStorageService({
  provider: 'supabase',
  cache: {
    maxSize: 100,
    ttl: 86400000, // 24 hours
    strategy: 'lru',
  },
});