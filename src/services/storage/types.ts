/**
 * Storage Service Types and Interfaces
 * Unified types for all storage-related functionality
 */

// Storage providers
export type StorageProvider = 'supabase' | 'local' | 'memory';

// Storage configuration
export interface StorageConfig {
  provider?: StorageProvider;
  supabaseUrl?: string;
  supabaseKey?: string;
  localStorage?: {
    prefix?: string;
    encrypt?: boolean;
    compress?: boolean;
  };
  cache?: {
    maxSize?: number; // MB
    ttl?: number; // milliseconds
    strategy?: 'lru' | 'fifo' | 'lfu';
  };
}

// Basic storage operations
export interface StorageItem<T = any> {
  key: string;
  value: T;
  metadata?: StorageMetadata;
}

export interface StorageMetadata {
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags?: string[];
  version?: number;
  checksum?: string;
}

// File storage types
export interface FileUploadOptions {
  bucket?: string;
  path?: string;
  fileName?: string;
  contentType?: string;
  public?: boolean;
  metadata?: Record<string, any>;
  onProgress?: (progress: UploadProgress) => void;
  resize?: ImageResizeOptions;
  compress?: boolean;
  maxSize?: number; // bytes
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  publicUrl?: string;
  bucket: string;
  path: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Query types
export interface StorageQuery {
  prefix?: string;
  tags?: string[];
  after?: Date;
  before?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'key' | 'createdAt' | 'updatedAt' | 'size';
  order?: 'asc' | 'desc';
}

// Cache types
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  size: number;
  hits: number;
  lastAccessed: Date;
  expiresAt?: Date;
}

// Sync types
export interface SyncOptions {
  conflictResolution?: 'local' | 'remote' | 'merge' | 'manual';
  batchSize?: number;
  syncInterval?: number; // milliseconds
  retryAttempts?: number;
}

export interface SyncStatus {
  lastSync?: Date;
  pending: number;
  conflicts: number;
  errors: string[];
  syncing: boolean;
}

export interface SyncConflict<T = any> {
  key: string;
  localValue: T;
  remoteValue: T;
  localUpdated: Date;
  remoteUpdated: Date;
}

// Offline support
export interface OfflineQueue {
  operations: QueuedOperation[];
  retryCount: Map<string, number>;
}

export interface QueuedOperation {
  id: string;
  type: 'set' | 'delete' | 'upload';
  key: string;
  value?: any;
  options?: any;
  timestamp: Date;
  retries: number;
}

// Storage events
export interface StorageEvents {
  'change': { key: string; value: any; operation: 'set' | 'delete' };
  'sync:start': void;
  'sync:complete': { synced: number; conflicts: number };
  'sync:error': Error;
  'offline': void;
  'online': void;
  'cache:evict': { keys: string[] };
}

// Error types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public provider?: StorageProvider,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export type StorageErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'INVALID_KEY'
  | 'INVALID_VALUE'
  | 'ENCRYPTION_ERROR'
  | 'SYNC_CONFLICT'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN';

// User preferences storage
export interface UserPreferencesStorage {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
    sounds: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    personalization: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
  customSettings: Record<string, any>;
}

// App state storage
export interface AppStateStorage {
  lastSync: Date;
  version: string;
  migrations: string[];
  features: Record<string, boolean>;
  cache: {
    size: number;
    entries: number;
    lastCleared: Date;
  };
}

// Media storage
export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // for video/audio
  format?: string;
  thumbnail?: string;
  blurhash?: string;
  alt?: string;
  caption?: string;
}

export interface MediaUploadResult extends FileInfo {
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  metadata: MediaMetadata;
}