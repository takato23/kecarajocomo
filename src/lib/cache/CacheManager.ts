import { EventEmitter } from 'events';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheOptions {
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
  defaultTTL?: number; // Default time to live in milliseconds
  enableLocalStorage?: boolean;
  storagePrefix?: string;
  version?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
  hitRate: number;
}

export class CacheManager<T = any> extends EventEmitter {
  private memoryCache: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entries: 0,
    hitRate: 0,
  };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    super();
    this.options = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      enableLocalStorage: true,
      storagePrefix: 'cache_',
      version: '1.0.0',
      ...options,
    };

    this.startCleanupInterval();
    this.loadFromLocalStorage();
  }

  // Get item from cache with stale-while-revalidate support
  async get(
    key: string,
    options?: {
      allowStale?: boolean;
      revalidate?: () => Promise<T>;
    }
  ): Promise<T | null> {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      this.emit('cache:miss', { key });
      return null;
    }

    const now = Date.now();
    const isExpired = entry.expiresAt && entry.expiresAt < now;

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = now;

    if (!isExpired) {
      this.stats.hits++;
      this.updateHitRate();
      this.emit('cache:hit', { key });
      return entry.data;
    }

    // Stale-while-revalidate pattern
    if (options?.allowStale && options.revalidate) {
      this.stats.hits++;
      this.updateHitRate();
      this.emit('cache:stale', { key });

      // Revalidate in background
      options.revalidate()
        .then((freshData) => {
          this.set(key, freshData, { ttl: this.options.defaultTTL });
          this.emit('cache:revalidated', { key });
        })
        .catch((error) => {
          this.emit('cache:revalidation-error', { key, error });
        });

      return entry.data;
    }

    // Data is expired and no stale allowed
    this.delete(key);
    this.stats.misses++;
    this.updateHitRate();
    this.emit('cache:miss', { key });
    return null;
  }

  // Set item in cache
  set(
    key: string,
    data: T,
    options?: {
      ttl?: number;
      version?: string;
    }
  ): void {
    const size = this.calculateSize(data);
    const ttl = options?.ttl ?? this.options.defaultTTL;
    const version = options?.version ?? this.options.version;

    // Check if we need to evict entries
    this.enforceConstraints(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version,
      expiresAt: ttl > 0 ? Date.now() + ttl : undefined,
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
    };

    this.memoryCache.set(key, entry);
    this.stats.size += size;
    this.stats.entries = this.memoryCache.size;

    // Save to localStorage if enabled
    if (this.options.enableLocalStorage) {
      this.saveToLocalStorage(key, entry);
    }

    this.emit('cache:set', { key, size });
  }

  // Delete item from cache
  delete(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    this.memoryCache.delete(key);
    this.stats.size -= entry.size;
    this.stats.entries = this.memoryCache.size;

    if (this.options.enableLocalStorage) {
      this.removeFromLocalStorage(key);
    }

    this.emit('cache:delete', { key });
    return true;
  }

  // Clear entire cache
  clear(): void {
    const previousSize = this.stats.size;
    const previousEntries = this.stats.entries;

    this.memoryCache.clear();
    this.stats.size = 0;
    this.stats.entries = 0;

    if (this.options.enableLocalStorage) {
      this.clearLocalStorage();
    }

    this.emit('cache:clear', { previousSize, previousEntries });
  }

  // Invalidate entries matching a pattern
  invalidate(pattern: string | RegExp): number {
    let invalidated = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }

    this.emit('cache:invalidate', { pattern: pattern.toString(), count: invalidated });
    return invalidated;
  }

  // Warm cache with initial data
  async warm(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    const startTime = Date.now();
    let warmedCount = 0;

    for (const { key, data, ttl } of entries) {
      this.set(key, data, { ttl });
      warmedCount++;
    }

    const duration = Date.now() - startTime;
    this.emit('cache:warm', { count: warmedCount, duration });
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache performance metrics
  getPerformanceMetrics() {
    const entries = Array.from(this.memoryCache.entries());
    const now = Date.now();

    const metrics = {
      totalSize: this.stats.size,
      totalEntries: this.stats.entries,
      hitRate: this.stats.hitRate,
      averageEntrySize: this.stats.entries > 0 ? this.stats.size / this.stats.entries : 0,
      oldestEntry: Math.min(...entries.map(([, e]) => e.timestamp)),
      newestEntry: Math.max(...entries.map(([, e]) => e.timestamp)),
      mostAccessed: entries.sort((a, b) => b[1].accessCount - a[1].accessCount)[0],
      leastRecentlyUsed: entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0],
      expirationStats: {
        expired: entries.filter(([, e]) => e.expiresAt && e.expiresAt < now).length,
        expiringSoon: entries.filter(
          ([, e]) => e.expiresAt && e.expiresAt > now && e.expiresAt < now + 60000
        ).length,
      },
    };

    return metrics;
  }

  // Calculate size of data
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Approximate size in bytes
    } catch {
      return 0;
    }
  }

  // Enforce cache constraints
  private enforceConstraints(newEntrySize: number): void {
    // Check if new entry exceeds max size
    if (newEntrySize > this.options.maxSize) {
      throw new Error(`Entry size ${newEntrySize} exceeds max cache size ${this.options.maxSize}`);
    }

    // Evict entries if necessary
    while (
      (this.stats.size + newEntrySize > this.options.maxSize ||
        this.memoryCache.size >= this.options.maxEntries) &&
      this.memoryCache.size > 0
    ) {
      this.evictLRU();
    }
  }

  // Evict least recently used entry
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruLastAccessed = Infinity;

    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed < lruLastAccessed) {
        lruLastAccessed = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
      this.emit('cache:evict', { key: lruKey, reason: 'LRU' });
    }
  }

  // Update hit rate
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.emit('cache:cleanup', { count: cleanedCount });
    }
  }

  // Start cleanup interval
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run every minute
  }

  // Save to localStorage
  private saveToLocalStorage(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `${this.options.storagePrefix}${key}`;
      const serialized = JSON.stringify(entry);
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      this.emit('cache:storage-error', { key, error });
    }
  }

  // Remove from localStorage
  private removeFromLocalStorage(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `${this.options.storagePrefix}${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      this.emit('cache:storage-error', { key, error });
    }
  }

  // Clear localStorage
  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.options.storagePrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      this.emit('cache:storage-error', { error });
    }
  }

  // Load from localStorage
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      let loadedCount = 0;

      for (const storageKey of keys) {
        if (storageKey.startsWith(this.options.storagePrefix)) {
          const key = storageKey.substring(this.options.storagePrefix.length);
          const serialized = localStorage.getItem(storageKey);
          
          if (serialized) {
            const entry = JSON.parse(serialized) as CacheEntry<T>;
            
            // Check version compatibility
            if (entry.version === this.options.version) {
              this.memoryCache.set(key, entry);
              this.stats.size += entry.size;
              loadedCount++;
            } else {
              // Remove outdated entries
              localStorage.removeItem(storageKey);
            }
          }
        }
      }

      this.stats.entries = this.memoryCache.size;
      if (loadedCount > 0) {
        this.emit('cache:loaded', { count: loadedCount });
      }
    } catch (error) {
      this.emit('cache:storage-error', { error });
    }
  }

  // Destroy cache manager
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.removeAllListeners();
  }
}

// Export cache manager factory
export function createCacheManager<T>(options?: CacheOptions): CacheManager<T> {
  return new CacheManager<T>(options);
}