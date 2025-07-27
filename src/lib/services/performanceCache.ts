/**
 * Performance Caching Service
 * Advanced caching with memory management, TTL, and mobile optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  maxMemoryMB: number;
  compressionEnabled: boolean;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryWarningThreshold = 0.8;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 200,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxMemoryMB: 50, // 50MB for mobile optimization
      compressionEnabled: true,
      ...config
    };

    this.startCleanupInterval();
    this.setupMemoryMonitoring();
  }

  /**
   * Set cache entry with advanced options
   */
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      compress?: boolean;
    } = {}
  ): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: options.compress && this.config.compressionEnabled 
        ? this.compress(data) 
        : data,
      timestamp: now,
      ttl: options.ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: now,
      priority: options.priority || 'medium'
    };

    // Check memory usage before adding
    if (this.shouldEvictForMemory()) {
      this.evictLeastUseful();
    }

    this.cache.set(key, entry);

    // Evict if over size limit
    if (this.cache.size > this.config.maxSize) {
      this.evictLeastUseful();
    }
  }

  /**
   * Get cache entry with access tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;

    // Decompress if needed
    return this.config.compressionEnabled && this.isCompressed(entry.data)
      ? this.decompress(entry.data)
      : entry.data;
  }

  /**
   * Cache with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T> | T,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      compress?: boolean;
    } = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fallback();
    this.set(key, data, options);
    return data;
  }

  /**
   * Bulk get for multiple keys
   */
  getBulk<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const data = this.get<T>(key);
      if (data !== null) {
        results.set(key, data);
      }
    }
    
    return results;
  }

  /**
   * Bulk set for multiple entries
   */
  setBulk<T>(
    entries: Array<{ key: string; data: T; options?: any }>,
    defaultOptions: any = {}
  ): void {
    for (const { key, data, options } of entries) {
      this.set(key, data, { ...defaultOptions, ...options });
    }
  }

  /**
   * Clear cache with optional pattern matching
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    memoryUsageMB: number;
    hitRate: number;
    topKeys: Array<{ key: string; accessCount: number }>;
  } {
    const entries = Array.from(this.cache.entries());
    const memoryUsage = this.estimateMemoryUsage();
    
    // Calculate hit rate (simplified)
    const totalAccesses = entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0);
    
    // Get top accessed keys
    const topKeys = entries
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      size: this.cache.size,
      memoryUsageMB: memoryUsage,
      hitRate: totalAccesses > 0 ? (totalAccesses / (totalAccesses + entries.length)) : 0,
      topKeys
    };
  }

  /**
   * Preload data for better performance
   */
  async preload<T>(
    keys: string[], 
    loader: (key: string) => Promise<T>,
    options: any = {}
  ): Promise<void> {
    const missingKeys = keys.filter(key => !this.cache.has(key));
    
    if (missingKeys.length === 0) return;

    // Load in parallel with concurrency limit
    const BATCH_SIZE = 5;
    for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
      const batch = missingKeys.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (key) => {
          try {
            const data = await loader(key);
            this.set(key, data, options);
          } catch (error) {
            console.warn(`Failed to preload cache key: ${key}`, error);
          }
        })
      );
    }
  }

  /**
   * Memory-aware eviction
   */
  private evictLeastUseful(): void {
    const entries = Array.from(this.cache.entries());
    
    // Score based on: recency, frequency, priority
    const scored = entries.map(([key, entry]) => {
      const now = Date.now();
      const recencyScore = (now - entry.lastAccessed) / (24 * 60 * 60 * 1000); // days
      const frequencyScore = 1 / (entry.accessCount + 1);
      const priorityScore = entry.priority === 'high' ? 0.1 : 
                           entry.priority === 'medium' ? 0.5 : 1;
      
      return {
        key,
        score: recencyScore + frequencyScore + priorityScore
      };
    });

    // Remove highest scoring (least useful) entries
    scored.sort((a, b) => b.score - a.score);
    const toRemove = Math.ceil(this.cache.size * 0.1); // Remove 10%
    
    for (let i = 0; i < toRemove && i < scored.length; i++) {
      this.cache.delete(scored[i].key);
    }
  }

  /**
   * Check if memory eviction is needed
   */
  private shouldEvictForMemory(): boolean {
    const usage = this.estimateMemoryUsage();
    return usage > this.config.maxMemoryMB * this.memoryWarningThreshold;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      totalSize += this.getStringSize(key);
      totalSize += this.getObjectSize(entry.data);
    }
    
    return totalSize / (1024 * 1024); // Convert to MB
  }

  /**
   * Simple compression (JSON + basic compression)
   */
  private compress(data: any): string {
    try {
      const json = JSON.stringify(data);
      // Simple compression: remove repeated whitespace and common patterns
      return json.replace(/\s+/g, ' ').replace(/,"/g, ',"').replace(/":"/g, '":"');
    } catch {
      return JSON.stringify(data);
    }
  }

  /**
   * Simple decompression
   */
  private decompress(compressed: string): any {
    try {
      return JSON.parse(compressed);
    } catch {
      return compressed;
    }
  }

  /**
   * Check if data is compressed
   */
  private isCompressed(data: any): boolean {
    return typeof data === 'string' && (data.startsWith('{') || data.startsWith('['));
  }

  /**
   * Estimate string size in bytes
   */
  private getStringSize(str: string): number {
    return new Blob([str]).size;
  }

  /**
   * Estimate object size in bytes
   */
  private getObjectSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Setup periodic cleanup
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          if (usageRatio > 0.8) {
            console.warn('High memory usage detected, triggering cache cleanup');
            this.evictLeastUseful();
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Cleanup on destruction
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instances for different cache types
export const mealPlanCache = new PerformanceCache({
  maxSize: 100,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxMemoryMB: 20
});

export const recipeCache = new PerformanceCache({
  maxSize: 300,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  maxMemoryMB: 30
});

export const imageCache = new PerformanceCache({
  maxSize: 50,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxMemoryMB: 15,
  compressionEnabled: false // Images are already compressed
});

export const apiCache = new PerformanceCache({
  maxSize: 200,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxMemoryMB: 10
});

export { PerformanceCache };