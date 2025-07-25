import { OfflineQueue } from '@/lib/offline/OfflineQueue';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';

export interface AutoSaveConfig {
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelayMs: number;
  /** Enable local storage backup */
  enableLocalStorage: boolean;
  /** Enable conflict detection */
  enableConflictDetection: boolean;
  /** Backup storage key prefix */
  storageKeyPrefix?: string;
}

export interface SaveProgress {
  /** Current step */
  step: number;
  /** Total steps */
  total: number;
  /** Current operation description */
  operation: string;
  /** Progress percentage (0-100) */
  percentage: number;
}

interface PendingSave<T> {
  data: T;
  timestamp: number;
  retryCount: number;
  originalTimestamp: number;
}

/**
 * Manages automatic saving with debouncing, retries, and conflict resolution
 */
export class AutoSaveManager<T> {
  private saveFunction: ((data: T) => Promise<void>) | null = null;
  private stateCallback: ((state: SaveState) => void) | null = null;
  private conflictCallback: ((localData: T, serverData: T) => Promise<T>) | null = null;
  
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentSave: Promise<void> | null = null;
  private pendingSave: PendingSave<T> | null = null;
  private lastSavedData: string | null = null;
  private lastSavedTimestamp: number = 0;
  
  private retryTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  
  private storageKey = 'autosave';
  private offlineQueue: OfflineQueue | null = null;

  constructor(private config: AutoSaveConfig) {
    this.offlineQueue = new OfflineQueue();
  }

  /**
   * Initialize the auto-save manager
   */
  initialize(
    saveFunction: (data: T) => Promise<void>,
    stateCallback: (state: SaveState) => void,
    storageKey: string
  ): void {
    this.saveFunction = saveFunction;
    this.stateCallback = stateCallback;
    this.storageKey = storageKey;
    
    // Load any existing backup data
    this.loadBackupData();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  /**
   * Schedule an auto-save with debouncing
   */
  scheduleAutoSave(data: T): void {
    if (this.isDestroyed || !this.saveFunction) return;

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Create or update pending save
    this.pendingSave = {
      data,
      timestamp: Date.now(),
      retryCount: 0,
      originalTimestamp: this.pendingSave?.originalTimestamp || Date.now()
    };

    // Create backup in local storage
    this.createBackup(data);

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.executeSave();
    }, this.config.debounceMs);
  }

  /**
   * Force immediate save without debouncing
   */
  async forceSave(data: T): Promise<void> {
    if (this.isDestroyed || !this.saveFunction) return;

    // Clear any pending debounced save
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Update pending save
    this.pendingSave = {
      data,
      timestamp: Date.now(),
      retryCount: 0,
      originalTimestamp: Date.now()
    };

    // Execute save immediately
    await this.executeSave();
  }

  /**
   * Execute the actual save operation
   */
  private async executeSave(): Promise<void> {
    if (!this.pendingSave || !this.saveFunction || this.isDestroyed) return;

    // Prevent concurrent saves
    if (this.currentSave) {
      await this.currentSave;
    }

    const saveData = this.pendingSave;
    this.stateCallback?.('saving');

    this.currentSave = this.performSave(saveData);
    
    try {
      await this.currentSave;
    } finally {
      this.currentSave = null;
    }
  }

  /**
   * Perform the save operation with retry logic
   */
  private async performSave(saveData: PendingSave<T>): Promise<void> {
    try {
      // Check for conflicts if enabled
      if (this.config.enableConflictDetection && this.conflictCallback) {
        await this.checkForConflicts(saveData.data);
      }

      // Execute the save function
      await this.saveFunction!(saveData.data);

      // Save successful
      this.handleSaveSuccess(saveData);
      
    } catch (error) {
      await this.handleSaveError(saveData, error);
    }
  }

  /**
   * Handle successful save
   */
  private handleSaveSuccess(saveData: PendingSave<T>): void {
    this.lastSavedData = JSON.stringify(saveData.data);
    this.lastSavedTimestamp = Date.now();
    this.pendingSave = null;
    
    // Clear backup
    this.clearBackup();
    
    this.stateCallback?.('saved');
  }

  /**
   * Handle save error with retry logic
   */
  private async handleSaveError(saveData: PendingSave<T>, error: unknown): Promise<void> {
    console.error('Error en auto-save:', error);
    
    // Check if we should retry
    if (saveData.retryCount < this.config.maxRetries) {
      // Increment retry count
      saveData.retryCount++;
      saveData.timestamp = Date.now();
      
      // Schedule retry
      this.scheduleRetry(saveData);
      
    } else {
      // Max retries reached - check if we should queue offline
      if (!navigator.onLine && this.offlineQueue) {
        try {
          await this.offlineQueue.enqueue(`${this.storageKey}_failed`, {
            data: saveData.data,
            timestamp: saveData.originalTimestamp,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          this.stateCallback?.('offline');
        } catch (queueError) {
          console.error('Error enqueueing failed save:', queueError);
          this.stateCallback?.('error');
        }
      } else {
        this.stateCallback?.('error');
      }
    }
  }

  /**
   * Schedule a retry attempt
   */
  private scheduleRetry(saveData: PendingSave<T>): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const delay = this.config.retryDelayMs * Math.pow(2, saveData.retryCount - 1); // Exponential backoff
    
    this.retryTimer = setTimeout(() => {
      if (!this.isDestroyed && this.pendingSave?.timestamp === saveData.timestamp) {
        this.executeSave();
      }
    }, delay);
  }

  /**
   * Check for data conflicts
   */
  private async checkForConflicts(localData: T): Promise<void> {
    if (!this.conflictCallback || !this.lastSavedData) return;

    const currentDataStr = JSON.stringify(localData);
    
    // Simple conflict detection based on last saved data
    // In a real implementation, this would check server-side timestamps
    const timeSinceLastSave = Date.now() - this.lastSavedTimestamp;
    const hasSignificantChanges = currentDataStr !== this.lastSavedData;
    
    // Simulate conflict detection (replace with actual server-side check)
    if (hasSignificantChanges && timeSinceLastSave > 30000) { // 30 seconds
      // Potential conflict detected
      try {
        // Get server data (this would be an actual API call)
        const serverData = await this.getServerData();
        
        if (serverData && JSON.stringify(serverData) !== this.lastSavedData) {
          // Conflict confirmed
          this.stateCallback?.('conflict');
          const resolvedData = await this.conflictCallback(localData, serverData);
          
          // Update the pending save with resolved data
          if (this.pendingSave) {
            this.pendingSave.data = resolvedData;
          }
        }
      } catch (error) {
        console.error('Error checking for conflicts:', error);
        // Continue with save anyway
      }
    }
  }

  /**
   * Get server data for conflict detection
   * This is a placeholder - implement actual server call
   */
  private async getServerData(): Promise<T | null> {
    // Placeholder implementation
    // In real usage, this would fetch current server data
    return null;
  }

  /**
   * Create backup in local storage
   */
  private createBackup(data: T): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;

    try {
      const backupKey = `${this.config.storageKeyPrefix || 'autosave'}_${this.storageKey}_backup`;
      const backupData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Load backup data from local storage
   */
  private loadBackupData(): T | null {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return null;

    try {
      const backupKey = `${this.config.storageKeyPrefix || 'autosave'}_${this.storageKey}_backup`;
      const backupStr = localStorage.getItem(backupKey);
      
      if (backupStr) {
        const backup = JSON.parse(backupStr);
        
        // Check if backup is recent (within 24 hours)
        const age = Date.now() - backup.timestamp;
        if (age < 24 * 60 * 60 * 1000) {
          return backup.data;
        }
      }
    } catch (error) {
      console.error('Error loading backup:', error);
    }
    
    return null;
  }

  /**
   * Clear backup from local storage
   */
  private clearBackup(): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;

    try {
      const backupKey = `${this.config.storageKeyPrefix || 'autosave'}_${this.storageKey}_backup`;
      localStorage.removeItem(backupKey);
    } catch (error) {
      console.error('Error clearing backup:', error);
    }
  }

  /**
   * Get backup data if available
   */
  getBackupData(): T | null {
    return this.loadBackupData();
  }

  /**
   * Clear any pending changes
   */
  clearPendingChanges(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.pendingSave = null;
    this.clearBackup();
  }

  /**
   * Handle online event
   */
  private async handleOnline(): Promise<void> {
    if (this.offlineQueue) {
      try {
        const hasItems = await this.offlineQueue.hasQueuedItems();
        if (hasItems) {
          this.stateCallback?.('saving');
          await this.offlineQueue.processQueue();
          this.stateCallback?.('saved');
        }
      } catch (error) {
        console.error('Error processing offline queue:', error);
        this.stateCallback?.('error');
      }
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    // Any pending saves will be queued when they fail
  }

  /**
   * Set conflict resolution callback
   */
  set onConflict(callback: (localData: T, serverData: T) => Promise<T>) {
    this.conflictCallback = callback;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.isDestroyed = true;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
  }
}