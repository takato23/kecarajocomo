/**
 * Sync Manager
 * Handles synchronization between storage providers
 */

import { UnifiedStorageService } from './UnifiedStorageService';
import { logger } from '@/services/logger';
import {
  SyncOptions,
  SyncStatus,
  SyncConflict,
  StorageItem,
  StorageProvider,
} from './types';

export class SyncManager {
  private storage: UnifiedStorageService;
  private syncOptions: SyncOptions = {
    conflictResolution: 'remote',
    batchSize: 100,
    syncInterval: 30000, // 30 seconds
    retryAttempts: 3,
  };
  private syncStatus: SyncStatus = {
    pending: 0,
    conflicts: 0,
    errors: [],
    syncing: false,
  };
  private syncTimer: NodeJS.Timeout | null = null;
  private enabled = false;

  constructor(storage: UnifiedStorageService) {
    this.storage = storage;
  }

  async enable(options: SyncOptions = {}): Promise<void> {
    this.syncOptions = { ...this.syncOptions, ...options };
    this.enabled = true;

    // Start sync timer
    if (this.syncOptions.syncInterval && this.syncOptions.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        this.sync().catch(err => {
          logger.error('Auto-sync error:', 'SyncManager', err);
          this.syncStatus.errors.push(err.message);
        });
      }, this.syncOptions.syncInterval);
    }

    // Initial sync
    await this.sync();
  }

  async disable(): Promise<void> {
    this.enabled = false;
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async sync(): Promise<void> {
    if (!this.enabled || this.syncStatus.syncing) return;

    this.syncStatus.syncing = true;
    this.storage.emit('sync:start');

    try {
      const providers = this.storage.getAvailableProviders();
      const currentProvider = this.storage.getCurrentProvider();
      
      // Find the remote provider (Supabase)
      const remoteProvider: StorageProvider = 'supabase';
      const localProvider: StorageProvider = 'local';
      
      if (!providers.includes(remoteProvider) || !providers.includes(localProvider)) {
        throw new Error('Both local and remote providers must be available for sync');
      }

      // Get all items from both providers
      await this.storage.switchProvider(localProvider);
      const localItems = await this.storage.query({});
      
      await this.storage.switchProvider(remoteProvider);
      const remoteItems = await this.storage.query({});

      // Create maps for easier comparison
      const localMap = new Map(localItems.map(item => [item.key, item]));
      const remoteMap = new Map(remoteItems.map(item => [item.key, item]));

      const conflicts: SyncConflict[] = [];
      let synced = 0;

      // Process items
      for (const [key, localItem] of localMap) {
        const remoteItem = remoteMap.get(key);
        
        if (!remoteItem) {
          // Item exists only locally - upload
          await this.uploadItem(localItem);
          synced++;
        } else {
          // Item exists in both - check for conflicts
          const conflict = this.detectConflict(localItem, remoteItem);
          if (conflict) {
            const resolved = await this.resolveConflict(conflict);
            if (resolved) synced++;
          }
          remoteMap.delete(key); // Mark as processed
        }
      }

      // Download items that exist only remotely
      for (const [key, remoteItem] of remoteMap) {
        await this.downloadItem(remoteItem);
        synced++;
      }

      // Restore original provider
      await this.storage.switchProvider(currentProvider);

      this.syncStatus = {
        lastSync: new Date(),
        pending: 0,
        conflicts: conflicts.length,
        errors: [],
        syncing: false,
      };

      this.storage.emit('sync:complete', { synced, conflicts: conflicts.length });
    } catch (error: unknown) {
      this.syncStatus.syncing = false;
      this.syncStatus.errors.push(error.message);
      this.storage.emit('sync:error', error);
      throw error;
    }
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private detectConflict(local: StorageItem, remote: StorageItem): SyncConflict | null {
    const localUpdated = local.metadata?.updatedAt || new Date(0);
    const remoteUpdated = remote.metadata?.updatedAt || new Date(0);

    // No conflict if values are the same
    if (JSON.stringify(local.value) === JSON.stringify(remote.value)) {
      return null;
    }

    // No conflict if one is clearly newer
    const timeDiff = Math.abs(localUpdated.getTime() - remoteUpdated.getTime());
    if (timeDiff > 1000) { // More than 1 second difference
      return null;
    }

    return {
      key: local.key,
      localValue: local.value,
      remoteValue: remote.value,
      localUpdated,
      remoteUpdated,
    };
  }

  private async resolveConflict(conflict: SyncConflict): Promise<boolean> {
    switch (this.syncOptions.conflictResolution) {
      case 'local':
        // Keep local version
        await this.storage.switchProvider('supabase');
        await this.storage.set(conflict.key, conflict.localValue);
        return true;

      case 'remote':
        // Keep remote version
        await this.storage.switchProvider('local');
        await this.storage.set(conflict.key, conflict.remoteValue);
        return true;

      case 'merge':
        // Attempt to merge (for objects)
        if (typeof conflict.localValue === 'object' && typeof conflict.remoteValue === 'object') {
          const merged = { ...conflict.remoteValue, ...conflict.localValue };
          await this.storage.switchProvider('supabase');
          await this.storage.set(conflict.key, merged);
          await this.storage.switchProvider('local');
          await this.storage.set(conflict.key, merged);
          return true;
        }
        // Fall back to remote if can't merge
        await this.storage.switchProvider('local');
        await this.storage.set(conflict.key, conflict.remoteValue);
        return true;

      case 'manual':
        // Store conflict for manual resolution
        this.syncStatus.conflicts++;
        return false;

      default:
        return false;
    }
  }

  private async uploadItem(item: StorageItem): Promise<void> {
    await this.storage.switchProvider('supabase');
    await this.storage.set(item.key, item.value, item.metadata);
  }

  private async downloadItem(item: StorageItem): Promise<void> {
    await this.storage.switchProvider('local');
    await this.storage.set(item.key, item.value, item.metadata);
  }
}