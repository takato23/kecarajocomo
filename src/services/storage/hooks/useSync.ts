/**
 * useSync Hook
 * React hook for managing storage synchronization
 */

import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';

import { getStorageService } from '../UnifiedStorageService';
import { SyncOptions, SyncStatus } from '../types';

export interface UseSyncOptions extends SyncOptions {
  autoSync?: boolean;
  onSyncComplete?: (synced: number, conflicts: number) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (conflicts: any[]) => void;
}

export interface UseSyncReturn {
  // State
  status: SyncStatus;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  
  // Actions
  sync: () => Promise<void>;
  enableSync: (options?: SyncOptions) => Promise<void>;
  disableSync: () => Promise<void>;
  
  // Utilities
  resolvePendingOperations: () => Promise<void>;
  clearSyncErrors: () => void;
}

export function useSync(options: UseSyncOptions = {}): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>({
    pending: 0,
    conflicts: 0,
    errors: [],
    syncing: false,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const storageService = getStorageService();

  // Set up event listeners
  useEffect(() => {
    const handleSyncStart = () => {
      setStatus(prev => ({ ...prev, syncing: true }));
    };

    const handleSyncComplete = (event: any) => {
      setStatus(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date(),
      }));
      setLastSyncTime(new Date());
      options.onSyncComplete?.(event.synced, event.conflicts);
    };

    const handleSyncError = (error: Error) => {
      setStatus(prev => ({
        ...prev,
        syncing: false,
        errors: [...prev.errors, error.message],
      }));
      options.onSyncError?.(error);
    };

    storageService.on('sync:start', handleSyncStart);
    storageService.on('sync:complete', handleSyncComplete);
    storageService.on('sync:error', handleSyncError);

    // Update status periodically
    const interval = setInterval(() => {
      const currentStatus = storageService.getSyncStatus();
      setStatus(currentStatus);
      if (currentStatus.lastSync) {
        setLastSyncTime(currentStatus.lastSync);
      }
    }, 1000);

    return () => {
      storageService.off('sync:start', handleSyncStart);
      storageService.off('sync:complete', handleSyncComplete);
      storageService.off('sync:error', handleSyncError);
      clearInterval(interval);
    };
  }, [storageService, options]);

  // Auto-sync setup
  useEffect(() => {
    if (options.autoSync) {
      enableSync(options).catch(err => {
        logger.error('Failed to enable auto-sync:', 'useSync', err);
      });
    }
    
    return () => {
      if (options.autoSync) {
        disableSync().catch(err => {
          logger.error('Failed to disable auto-sync:', 'useSync', err);
        });
      }
    };
  }, [options.autoSync]);

  const sync = useCallback(async (): Promise<void> => {
    try {
      await storageService.sync();
    } catch (error: unknown) {
      logger.error('Sync failed:', 'useSync', error);
      throw error;
    }
  }, [storageService]);

  const enableSync = useCallback(async (syncOptions?: SyncOptions): Promise<void> => {
    try {
      await storageService.enableSync({
        ...options,
        ...syncOptions,
      });
    } catch (error: unknown) {
      logger.error('Failed to enable sync:', 'useSync', error);
      throw error;
    }
  }, [storageService, options]);

  const disableSync = useCallback(async (): Promise<void> => {
    try {
      await storageService.disableSync();
    } catch (error: unknown) {
      logger.error('Failed to disable sync:', 'useSync', error);
      throw error;
    }
  }, [storageService]);

  const resolvePendingOperations = useCallback(async (): Promise<void> => {
    try {
      // Force a sync to resolve pending operations
      await sync();
    } catch (error: unknown) {
      logger.error('Failed to resolve pending operations:', 'useSync', error);
      throw error;
    }
  }, [sync]);

  const clearSyncErrors = useCallback((): void => {
    setStatus(prev => ({ ...prev, errors: [] }));
  }, []);

  return {
    // State
    status,
    isSyncing: status.syncing,
    lastSyncTime,
    
    // Actions
    sync,
    enableSync,
    disableSync,
    
    // Utilities
    resolvePendingOperations,
    clearSyncErrors,
  };
}