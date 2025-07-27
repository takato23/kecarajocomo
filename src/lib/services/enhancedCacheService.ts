/**
 * Enhanced Caching Service
 * Multi-layered caching system with intelligent invalidation and performance optimization
 */

import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

export interface CacheConfig {
  readonly redis?: {
    readonly url: string;
    readonly maxRetriesPerRequest?: number;
    readonly retryDelayOnFailover?: number;
    readonly enableReadyCheck?: boolean;
  };
  readonly memory?: {
    readonly maxSize: number;
    readonly ttl: number;
  };
  readonly compression?: {
    readonly enabled: boolean;
    readonly threshold: number;
  };
  readonly metrics?: {
    readonly enabled: boolean;
    readonly flushInterval: number;
  };
}

export interface CacheMetrics {
  readonly hits: number;
  readonly misses: number;
  readonly sets: number;
  readonly deletes: number;
  readonly errors: number;
  readonly avgResponseTime: number;
  readonly memoryUsage: number;
  readonly redisConnected: boolean;
}

export interface CacheItem<T> {
  readonly data: T;
  readonly metadata: {
    readonly key: string;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    readonly accessCount: number;
    readonly lastAccessed: Date;
    readonly size: number;
    readonly compressed: boolean;
  };
}

export interface CachePattern {
  readonly prefix: string;
  readonly ttl: number;
  readonly invalidationRules?: ReadonlyArray<string>;
  readonly compressionEnabled?: boolean;
  readonly warmupStrategy?: 'lazy' | 'eager' | 'scheduled';
}

/**
 * Enhanced Cache Service with multi-layered architecture
 */
/**
 * Simple in-memory cache implementation
 */
interface InMemoryCacheItem<T> {
  data: T;
  expiry: number;
}

export class EnhancedCacheService {
  private readonly redis: Redis | null = null;
  private readonly memoryCache: Map<string, InMemoryCacheItem<any>> = new Map();
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly metrics: CacheMetrics;
  private readonly compressionEnabled: boolean;
  private readonly compressionThreshold: number;
  private readonly patterns: Map<string, CachePattern> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    // Initialize Redis if configured
    if (config.redis?.url) {
      try {
        this.redis = new Redis({
          ...config.redis,
          maxRetriesPerRequest: config.redis.maxRetriesPerRequest || 3,
          retryDelayOnFailover: config.redis.retryDelayOnFailover || 1000,
          enableReadyCheck: config.redis.enableReadyCheck !== false,
          lazyConnect: true
        });

        this.redis.on('error', (error) => {
          logger.warn('Redis connection error:', 'enhancedCacheService', error);
          this.metrics.errors++;
        });

        this.redis.on('connect', () => {

        });
      } catch (error: unknown) {
        logger.warn('Failed to initialize Redis:', 'enhancedCacheService', error);
      }
    }

    // Initialize memory cache
    this.maxSize = config.memory?.maxSize || 1000;
    this.ttl = config.memory?.ttl || 1000 * 60 * 15; // 15 minutes

    // Initialize compression
    this.compressionEnabled = config.compression?.enabled || true;
    this.compressionThreshold = config.compression?.threshold || 1024; // 1KB

    // Initialize metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      redisConnected: false
    };

    // Start metrics collection
    if (config.metrics?.enabled !== false) {
      this.startMetricsCollection(config.metrics?.flushInterval || 60000);
    }

    // Initialize cache patterns
    this.initializeCachePatterns();
  }

  /**
   * Get item from cache with multi-layer strategy
   */
  async get<T>(key: string, options?: { skipMemory?: boolean; skipRedis?: boolean }): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // L1: Memory cache (fastest)
      if (!options?.skipMemory) {
        const memoryResult = this.memoryCache.get(key);
        if (memoryResult && memoryResult.expiry > Date.now()) {
          this.metrics.hits++;
          this.updateMetrics(Date.now() - startTime);
          return memoryResult.data;
        } else if (memoryResult) {
          // Expired, remove it
          this.memoryCache.delete(key);
        }
      }

      // L2: Redis cache (network)
      if (this.redis && !options?.skipRedis) {
        const redisResult = await this.redis.get(key);
        if (redisResult) {
          const parsed = await this.deserializeData(redisResult);
          
          // Populate memory cache for next access
          if (!options?.skipMemory) {
            this.setMemoryCache(key, parsed, this.getTTLForKey(key));
          }
          
          this.metrics.hits++;
          this.updateMetrics(Date.now() - startTime);
          return parsed;
        }
      }

      this.metrics.misses++;
      this.updateMetrics(Date.now() - startTime);
      return null;
      
    } catch (error: unknown) {
      this.metrics.errors++;
      logger.error('Cache get error:', 'enhancedCacheService', error);
      return null;
    }
  }

  /**
   * Set item in cache with multi-layer strategy
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const effectiveTTL = ttl || this.getTTLForKey(key);
      
      // Set in memory cache
      this.setMemoryCache(key, data, effectiveTTL);
      
      // Set in Redis if available
      if (this.redis) {
        const serialized = await this.serializeData(data);
        await this.redis.setex(key, Math.ceil(effectiveTTL / 1000), serialized);
      }
      
      this.metrics.sets++;
      this.updateMetrics(Date.now() - startTime);
      
    } catch (error: unknown) {
      this.metrics.errors++;
      logger.error('Cache set error:', 'enhancedCacheService', error);
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Delete from memory cache
      this.memoryCache.delete(key);
      
      // Delete from Redis
      if (this.redis) {
        await this.redis.del(key);
      }
      
      this.metrics.deletes++;
      this.updateMetrics(Date.now() - startTime);
      
    } catch (error: unknown) {
      this.metrics.errors++;
      logger.error('Cache delete error:', 'enhancedCacheService', error);
    }
  }

  /**
   * Get multiple items from cache
   */
  async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    // Try to get from memory cache first
    const memoryHits = new Set<string>();
    for (const key of keys) {
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult) {
        results.set(key, memoryResult.data);
        memoryHits.add(key);
      }
    }
    
    // Get remaining keys from Redis
    const redisKeys = keys.filter(key => !memoryHits.has(key));
    if (redisKeys.length > 0 && this.redis) {
      try {
        const redisResults = await this.redis.mget(...redisKeys);
        
        for (let i = 0; i < redisKeys.length; i++) {
          const redisResult = redisResults[i];
          if (redisResult) {
            const parsed = await this.deserializeData(redisResult);
            results.set(redisKeys[i], parsed);
            
            // Populate memory cache
            this.setMemoryCache(redisKeys[i], parsed, this.getTTLForKey(redisKeys[i]));
          }
        }
      } catch (error: unknown) {
        logger.error('Redis mget error:', 'enhancedCacheService', error);
      }
    }
    
    return results;
  }

  /**
   * Set multiple items in cache
   */
  async setMultiple<T>(items: Map<string, T>, ttl?: number): Promise<void> {
    const promises = Array.from(items.entries()).map(([key, value]) => 
      this.set(key, value, ttl)
    );
    
    await Promise.all(promises);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Clear memory cache entries matching pattern
      for (const key of this.memoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          this.memoryCache.delete(key);
        }
      }
      
      // Clear Redis entries matching pattern
      if (this.redis) {
        const redisKeys = await this.redis.keys(pattern);
        if (redisKeys.length > 0) {
          await this.redis.del(...redisKeys);
        }
      }
      
    } catch (error: unknown) {
      logger.error('Cache invalidate pattern error:', 'enhancedCacheService', error);
    }
  }

  /**
   * Warm up cache with data
   */
  async warmUp(data: Map<string, any>): Promise<void> {
    const promises = Array.from(data.entries()).map(([key, value]) => 
      this.set(key, value)
    );
    
    await Promise.all(promises);

  }

  /**
   * Get cache statistics
   */
  getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      memoryUsage: this.memoryCache.size,
      redisConnected: this.redis?.status === 'ready'
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear Redis cache
      if (this.redis) {
        await this.redis.flushdb();
      }

    } catch (error: unknown) {
      logger.error('Cache clear error:', 'enhancedCacheService', error);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      
      if (this.redis) {
        await this.redis.quit();
      }

    } catch (error: unknown) {
      logger.error('Cache shutdown error:', 'enhancedCacheService', error);
    }
  }

  /**
   * Initialize cache patterns for different data types
   */
  private initializeCachePatterns(): void {
    // User data patterns
    this.patterns.set('user:*', {
      prefix: 'user:',
      ttl: 1000 * 60 * 30, // 30 minutes
      invalidationRules: ['user:profile:*', 'user:preferences:*'],
      compressionEnabled: false
    });

    // Recipe patterns
    this.patterns.set('recipe:*', {
      prefix: 'recipe:',
      ttl: 1000 * 60 * 60 * 2, // 2 hours
      invalidationRules: ['recipe:list:*', 'recipe:search:*'],
      compressionEnabled: true
    });

    // Meal planning patterns
    this.patterns.set('meal-plan:*', {
      prefix: 'meal-plan:',
      ttl: 1000 * 60 * 60 * 2, // 2 hours
      invalidationRules: ['meal-plan:weekly:*', 'meal-plan:suggestions:*'],
      compressionEnabled: true
    });

    // Pantry patterns
    this.patterns.set('pantry:*', {
      prefix: 'pantry:',
      ttl: 1000 * 60 * 15, // 15 minutes
      invalidationRules: ['pantry:items:*', 'pantry:categories:*'],
      compressionEnabled: false
    });

    // AI responses patterns
    this.patterns.set('ai:*', {
      prefix: 'ai:',
      ttl: 1000 * 60 * 60 * 4, // 4 hours
      invalidationRules: ['ai:recipe:*', 'ai:meal-plan:*'],
      compressionEnabled: true
    });

    // Shopping patterns
    this.patterns.set('shopping:*', {
      prefix: 'shopping:',
      ttl: 1000 * 60 * 60, // 1 hour
      invalidationRules: ['shopping:list:*', 'shopping:prices:*'],
      compressionEnabled: true
    });

    // Analytics patterns
    this.patterns.set('analytics:*', {
      prefix: 'analytics:',
      ttl: 1000 * 60 * 60 * 24, // 24 hours
      invalidationRules: ['analytics:user:*', 'analytics:usage:*'],
      compressionEnabled: true
    });
  }

  /**
   * Set item in memory cache
   */
  private setMemoryCache<T>(key: string, data: T, ttl: number): void {
    // Clean up if we're at max size
    if (this.memoryCache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Get TTL for key based on patterns
   */
  private getTTLForKey(key: string): number {
    for (const [pattern, config] of this.patterns) {
      if (this.matchesPattern(key, pattern)) {
        return config.ttl;
      }
    }
    
    return 1000 * 60 * 15; // Default 15 minutes
  }

  /**
   * Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * Serialize data for storage
   */
  private async serializeData(data: any): Promise<string> {
    try {
      const json = JSON.stringify(data);
      
      if (this.compressionEnabled && json.length > this.compressionThreshold) {
        // In a real implementation, you'd use a compression library like zlib
        // For now, we'll just return the JSON
        return json;
      }
      
      return json;
    } catch (error: unknown) {
      throw new Error(`Failed to serialize data: ${error}`);
    }
  }

  /**
   * Deserialize data from storage
   */
  private async deserializeData(data: string): Promise<any> {
    try {
      return JSON.parse(data);
    } catch (error: unknown) {
      throw new Error(`Failed to deserialize data: ${error}`);
    }
  }

  /**
   * Calculate data size in bytes
   */
  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Update metrics
   */
  private updateMetrics(responseTime: number): void {
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(interval: number): void {
    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics();
      
      // Log metrics or send to monitoring service

      // Reset counters
      this.metrics.hits = 0;
      this.metrics.misses = 0;
      this.metrics.sets = 0;
      this.metrics.deletes = 0;
      this.metrics.errors = 0;
      
    }, interval);
  }

  /**
   * Get current metrics
   */
  getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      memoryUsage: this.memoryCache.size,
      redisConnected: this.redis?.status === 'ready' || false
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    if (this.redis) {
      await this.redis.flushdb();
    }
  }

  /**
   * Cleanup and close connections
   */
  async cleanup(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

/**
 * Cache key generators for different data types
 */
export class CacheKeyGenerator {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userProfile(userId: string): string {
    return `user:profile:${userId}`;
  }

  static userPreferences(userId: string): string {
    return `user:preferences:${userId}`;
  }

  static recipe(recipeId: string): string {
    return `recipe:${recipeId}`;
  }

  static recipeList(filters?: string): string {
    return `recipe:list:${filters || 'all'}`;
  }

  static recipeSearch(query: string): string {
    return `recipe:search:${encodeURIComponent(query)}`;
  }

  static mealPlan(userId: string, weekStart: string): string {
    return `meal-plan:${userId}:${weekStart}`;
  }

  static mealPlanSuggestions(userId: string): string {
    return `meal-plan:suggestions:${userId}`;
  }

  static pantryItems(userId: string): string {
    return `pantry:items:${userId}`;
  }

  static pantryCategories(userId: string): string {
    return `pantry:categories:${userId}`;
  }

  static aiResponse(type: string, hash: string): string {
    return `ai:${type}:${hash}`;
  }

  static shoppingList(userId: string, date: string): string {
    return `shopping:list:${userId}:${date}`;
  }

  static priceTracking(productId: string): string {
    return `shopping:prices:${productId}`;
  }

  static analytics(type: string, period: string): string {
    return `analytics:${type}:${period}`;
  }

  static temporary(key: string): string {
    return `temp:${key}`;
  }

  static holisticPlan(userId: string, constraintsHash: string, optionsHash: string): string {
    return `holistic-plan:${userId}:${constraintsHash}:${optionsHash}`;
  }

  static geminiAnalysis(analysisType: string, contextHash: string): string {
    return `gemini:${analysisType}:${contextHash}`;
  }

  static learningInsights(userId: string, planId: string): string {
    return `learning:insights:${userId}:${planId}`;
  }

  static externalFactors(factorType: string, date: string): string {
    return `external:${factorType}:${date}`;
  }
}

/**
 * Cache decorators for automatic caching
 */
export function Cacheable(ttl?: number, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator ? keyGenerator(...args) : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await enhancedCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await enhancedCache.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 */
export function InvalidateCache(patterns: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Invalidate cache patterns
      for (const pattern of patterns) {
        await enhancedCache.invalidatePattern(pattern);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

// Export singleton instance
export const enhancedCache = new EnhancedCacheService({
  redis: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : undefined,
  memory: {
    maxSize: 2000,
    ttl: 1000 * 60 * 15
  },
  compression: {
    enabled: true,
    threshold: 1024
  },
  metrics: {
    enabled: true,
    flushInterval: 60000
  }
});

// Initialize cache on startup
if (typeof window === 'undefined') {
  // Server-side only
  process.on('SIGINT', async () => {
    await enhancedCache.shutdown();
    process.exit(0);
  });
}