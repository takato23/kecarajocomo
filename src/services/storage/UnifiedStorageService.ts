/**
 * Unified Storage Service
 * Consolidates Supabase, local storage, and media handling
 */

import { EventEmitter } from 'events';
import { logger } from '@/services/logger';

import {
  StorageProvider,
  StorageConfig,
  StorageItem,
  StorageMetadata,
  StorageQuery,
  FileUploadOptions,
  FileInfo,
  SyncOptions,
  SyncStatus,
  StorageError,
  StorageErrorCode,
  QueuedOperation,
} from './types';
import { SupabaseStorageProvider } from './providers/SupabaseStorageProvider';
import { LocalStorageProvider } from './providers/LocalStorageProvider';
import { MemoryStorageProvider } from './providers/MemoryStorageProvider';
import { StorageProviderInterface } from './providers/StorageProviderInterface';
import { CacheManager } from './CacheManager';
import { SyncManager } from './SyncManager';
import { OfflineManager } from './OfflineManager';

export class UnifiedStorageService extends EventEmitter {
  private static instance: UnifiedStorageService;
  
  private providers: Map<StorageProvider, StorageProviderInterface>;
  private config: Required<StorageConfig>;
  private cacheManager: CacheManager;
  private syncManager: SyncManager;
  private offlineManager: OfflineManager;
  private currentProvider: StorageProvider;
  private isOnline = true;

  private constructor(config: StorageConfig = {}) {
    super();
    
    this.config = {
      provider: 'local',
      localStorage: {
        prefix: 'kcc_',
        encrypt: false,
        compress: false,
        ...config.localStorage,
      },
      cache: {
        maxSize: 50, // 50MB
        ttl: 3600000, // 1 hour
        strategy: 'lru',
        ...config.cache,
      },
      ...config,
    };

    this.providers = new Map();
    this.initializeProviders();

    this.cacheManager = new CacheManager(this.config.cache!);
    this.syncManager = new SyncManager(this);
    this.offlineManager = new OfflineManager();

    this.currentProvider = this.config.provider!;
    this.setupNetworkHandling();
  }

  static getInstance(config?: StorageConfig): UnifiedStorageService {
    if (!UnifiedStorageService.instance) {
      UnifiedStorageService.instance = new UnifiedStorageService(config);
    }
    return UnifiedStorageService.instance;
  }

  private initializeProviders(): void {
    // Initialize local storage (always available)
    this.providers.set('local', new LocalStorageProvider(this.config.localStorage!));

    // Initialize memory storage (always available)
    this.providers.set('memory', new MemoryStorageProvider());

    // Initialize Supabase if configured
    if (this.config.supabaseUrl && this.config.supabaseKey) {
      this.providers.set('supabase', new SupabaseStorageProvider({
        url: this.config.supabaseUrl,
        key: this.config.supabaseKey,
      }));
    }
  }

  /**
   * Get item from storage
   */
  async get<T = any>(key: string, options?: { useCache?: boolean }): Promise<T | null> {
    try {
      // Check cache first
      if (options?.useCache !== false) {
        const cached = await this.cacheManager.get<T>(key);
        if (cached) return cached;
      }

      const provider = this.getActiveProvider();
      const result = await provider.get<T>(key);

      // Update cache
      if (result !== null && options?.useCache !== false) {
        await this.cacheManager.set(key, result);
      }

      return result;
    } catch (error: unknown) {
      throw this.handleError(error, 'get', key);
    }
  }

  /**
   * Set item in storage
   */
  async set<T = any>(
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<void> {
    try {
      const provider = this.getActiveProvider();
      
      // If offline, queue the operation
      if (!this.isOnline && provider === this.providers.get('supabase')) {
        await this.offlineManager.queue({
          type: 'set',
          key,
          value,
          options: metadata,
        });
        // Still save locally
        await this.providers.get('local')!.set(key, value, metadata);
        return;
      }

      await provider.set(key, value, metadata);

      // Update cache
      await this.cacheManager.set(key, value);

      // Emit change event
      this.emit('change', { key, value, operation: 'set' });
    } catch (error: unknown) {
      throw this.handleError(error, 'set', key);
    }
  }

  /**
   * Delete item from storage
   */
  async delete(key: string): Promise<void> {
    try {
      const provider = this.getActiveProvider();
      
      // If offline, queue the operation
      if (!this.isOnline && provider === this.providers.get('supabase')) {
        await this.offlineManager.queue({
          type: 'delete',
          key,
        });
        // Still delete locally
        await this.providers.get('local')!.delete(key);
        return;
      }

      await provider.delete(key);

      // Remove from cache
      await this.cacheManager.delete(key);

      // Emit change event
      this.emit('change', { key, value: undefined, operation: 'delete' });
    } catch (error: unknown) {
      throw this.handleError(error, 'delete', key);
    }
  }

  /**
   * Query items from storage
   */
  async query<T = any>(query: StorageQuery): Promise<StorageItem<T>[]> {
    try {
      const provider = this.getActiveProvider();
      return await provider.query<T>(query);
    } catch (error: unknown) {
      throw this.handleError(error, 'query');
    }
  }

  /**
   * Clear all storage
   */
  async clear(options?: { keepCache?: boolean }): Promise<void> {
    try {
      const provider = this.getActiveProvider();
      await provider.clear();

      if (!options?.keepCache) {
        await this.cacheManager.clear();
      }

      this.emit('change', { key: '*', value: undefined, operation: 'delete' });
    } catch (error: unknown) {
      throw this.handleError(error, 'clear');
    }
  }

  /**
   * Get storage size information
   */
  async getSize(): Promise<{ used: number; limit?: number }> {
    try {
      const provider = this.getActiveProvider();
      const providerSize = await provider.getSize();
      const cacheSize = await this.cacheManager.getSize();

      return {
        used: providerSize.used + cacheSize,
        limit: providerSize.limit,
      };
    } catch (error: unknown) {
      throw this.handleError(error, 'getSize');
    }
  }

  /**
   * Upload file
   */
  async uploadFile(
    file: File | Blob,
    options: FileUploadOptions = {}
  ): Promise<FileInfo> {
    try {
      const provider = this.getActiveProvider();
      
      // Validate file
      if (options.maxSize && file.size > options.maxSize) {
        throw new StorageError(
          `File size ${file.size} exceeds maximum ${options.maxSize}`,
          'INVALID_VALUE'
        );
      }

      // If offline and using Supabase, queue the operation
      if (!this.isOnline && provider === this.providers.get('supabase')) {
        const localResult = await this.providers.get('local')!.uploadFile(file, options);
        
        await this.offlineManager.queue({
          type: 'upload',
          key: localResult.path,
          value: file,
          options,
        });
        
        return localResult;
      }

      // Process image if resize options provided
      let processedFile = file;
      if (options.resize && file.type.startsWith('image/')) {
        processedFile = await this.resizeImage(file, options.resize);
      }

      // Upload file
      const result = await provider.uploadFile(processedFile, options);

      // Generate thumbnails if image
      if (file.type.startsWith('image/') && options.resize) {
        // This would be handled by the provider or a separate service
      }

      return result;
    } catch (error: unknown) {
      throw this.handleError(error, 'uploadFile');
    }
  }

  /**
   * Download file
   */
  async downloadFile(path: string): Promise<Blob> {
    try {
      const provider = this.getActiveProvider();
      return await provider.downloadFile(path);
    } catch (error: unknown) {
      throw this.handleError(error, 'downloadFile', path);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const provider = this.getActiveProvider();
      await provider.deleteFile(path);
    } catch (error: unknown) {
      throw this.handleError(error, 'deleteFile', path);
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(path: string, options?: { download?: boolean; expiresIn?: number }): Promise<string> {
    try {
      const provider = this.getActiveProvider();
      return await provider.getFileUrl(path, options);
    } catch (error: unknown) {
      throw this.handleError(error, 'getFileUrl', path);
    }
  }

  /**
   * Enable sync between providers
   */
  async enableSync(options: SyncOptions = {}): Promise<void> {
    await this.syncManager.enable(options);
  }

  /**
   * Disable sync
   */
  async disableSync(): Promise<void> {
    await this.syncManager.disable();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncManager.getStatus();
  }

  /**
   * Manually trigger sync
   */
  async sync(): Promise<void> {
    await this.syncManager.sync();
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = this.offlineManager.getQueue();
    
    for (const operation of queue.operations) {
      try {
        await this.executeQueuedOperation(operation);
        await this.offlineManager.remove(operation.id);
      } catch (error: unknown) {
        await this.offlineManager.incrementRetry(operation.id);
        logger.error('Failed to process queued operation:', 'UnifiedStorageService', error);
      }
    }
  }

  /**
   * Switch storage provider
   */
  async switchProvider(provider: StorageProvider): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new StorageError(
        `Provider ${provider} is not available`,
        'PROVIDER_ERROR',
        provider
      );
    }

    // Sync before switching
    if (this.syncManager.isEnabled()) {
      await this.syncManager.sync();
    }

    this.currentProvider = provider;
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): StorageProvider {
    return this.currentProvider;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): StorageProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize providers if needed
    if (config.supabaseUrl || config.supabaseKey) {
      this.initializeProviders();
    }

    // Update cache manager config
    if (config.cache) {
      this.cacheManager.updateConfig(config.cache);
    }
  }

  // Private helper methods

  private getActiveProvider(): StorageProviderInterface {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new StorageError(
        `Provider ${this.currentProvider} is not initialized`,
        'PROVIDER_ERROR',
        this.currentProvider
      );
    }
    return provider;
  }

  private async resizeImage(file: File | Blob, options: any): Promise<Blob> {
    // This would use a library like sharp or browser-image-compression
    // For now, return the original file
    return file;
  }

  private async executeQueuedOperation(operation: QueuedOperation): Promise<void> {
    const provider = this.providers.get('supabase');
    if (!provider) return;

    switch (operation.type) {
      case 'set':
        await provider.set(operation.key, operation.value, operation.options);
        break;
      case 'delete':
        await provider.delete(operation.key);
        break;
      case 'upload':
        await provider.uploadFile(operation.value, operation.options);
        break;
    }
  }

  private setupNetworkHandling(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });

    // Set initial state
    this.isOnline = navigator.onLine;
  }

  private handleError(error: any, operation: string, key?: string): Error {
    if (error instanceof StorageError) {
      return error;
    }

    const message = error.message || `Storage ${operation} failed`;
    const code = this.mapErrorCode(error);
    
    return new StorageError(
      key ? `${message} for key: ${key}` : message,
      code,
      this.currentProvider,
      error
    );
  }

  private mapErrorCode(error: any): StorageErrorCode {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('permission') || message.includes('unauthorized')) return 'PERMISSION_DENIED';
    if (message.includes('quota') || message.includes('storage full')) return 'QUOTA_EXCEEDED';
    if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
    if (message.includes('invalid key')) return 'INVALID_KEY';
    if (message.includes('invalid value')) return 'INVALID_VALUE';
    
    return 'UNKNOWN';
  }
}

// Export singleton getter
export const getStorageService = (config?: StorageConfig) => 
  UnifiedStorageService.getInstance(config);