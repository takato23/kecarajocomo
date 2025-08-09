/**
 * Database Optimization & Caching Layer
 * Advanced database performance optimization with intelligent caching
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger';

import { performanceMonitor } from '../analytics/performance';

export interface QueryCache {
  result: any;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export interface QueryStats {
  query: string;
  duration: number;
  rows: number;
  cached: boolean;
  timestamp: number;
}

export interface DatabaseConfig {
  enableCache: boolean;
  defaultTTL: number;
  maxCacheSize: number;
  slowQueryThreshold: number;
}

class DatabaseOptimizer {
  private cache = new Map<string, QueryCache>();
  private queryStats: QueryStats[] = [];
  private config: DatabaseConfig;
  private supabase: any;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      enableCache: true,
      defaultTTL: 300, // 5 minutes
      maxCacheSize: 1000,
      slowQueryThreshold: 1000, // 1 second
      ...config,
    };

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    this.setupCleanup();
  }

  private setupCleanup() {
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 300000);

    // Clean up stats every hour
    setInterval(() => {
      this.cleanupStats();
    }, 3600000);
  }

  private cleanupCache() {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }

    // If still too large, remove least recently used
    if (this.cache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private cleanupStats() {
    // Keep only last 1000 stats
    if (this.queryStats.length > 1000) {
      this.queryStats = this.queryStats.slice(-1000);
    }
  }

  private generateCacheKey(table: string, query: any): string {
    return `${table}:${JSON.stringify(query)}`;
  }

  private shouldCache(query: any): boolean {
    if (!this.config.enableCache) return false;
    
    // Don't cache mutations
    if (query.method && ['insert', 'update', 'delete', 'upsert'].includes(query.method)) {
      return false;
    }

    return true;
  }

  async query<T>(
    table: string,
    queryFn: (client: any) => Promise<{ data: T; error: any }>,
    options: { ttl?: number; skipCache?: boolean } = {}
  ): Promise<{ data: T; error: any; cached?: boolean }> {
    const startTime = performance.now();
    const queryKey = this.generateCacheKey(table, queryFn.toString());

    try {
      // Check cache first
      if (this.shouldCache(queryFn) && !options.skipCache) {
        const cached = this.cache.get(queryKey);
        if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
          cached.hits++;
          
          // Track cache hit
          performanceMonitor.trackDatabaseMetric({
            query: table,
            duration: 0,
            rows: Array.isArray(cached.result.data) ? cached.result.data.length : 1,
            cached: true,
          });

          return { ...cached.result, cached: true };
        }
      }

      // Execute query
      const result = await queryFn(this.supabase);
      const duration = performance.now() - startTime;

      // Track query performance
      const stats: QueryStats = {
        query: table,
        duration,
        rows: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
        cached: false,
        timestamp: Date.now(),
      };

      this.queryStats.push(stats);

      // Track in performance monitor
      performanceMonitor.trackDatabaseMetric({
        query: table,
        duration,
        rows: stats.rows,
        cached: false,
      });

      // Log slow queries
      if (duration > this.config.slowQueryThreshold) {
        logger.warn(`Slow query detected: ${table} took ${duration}ms`, 'Lib:optimization');
      }

      // Cache successful queries
      if (this.shouldCache(queryFn) && !result.error) {
        const cacheEntry: QueryCache = {
          result,
          timestamp: Date.now(),
          ttl: options.ttl || this.config.defaultTTL,
          hits: 0,
          size: JSON.stringify(result).length,
        };

        this.cache.set(queryKey, cacheEntry);
      }

      return { ...result, cached: false };
    } catch (error: unknown) {
      const duration = performance.now() - startTime;

      // Track error
      performanceMonitor.trackDatabaseMetric({
        query: table,
        duration,
        rows: 0,
        cached: false,
      });

      logger.error(`Database query error for ${table}:`, 'Lib:optimization', error);
      throw error;
    }
  }

  // Optimized query builders
  async selectOptimized<T>(
    table: string,
    columns: string | string[],
    filters?: Record<string, any>,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      ascending?: boolean;
      ttl?: number;
    } = {}
  ): Promise<{ data: T[]; error: any; cached?: boolean }> {
    return this.query(
      table,
      (client) => {
        let query = client.from(table);

        if (typeof columns === 'string') {
          query = query.select(columns);
        } else if (Array.isArray(columns)) {
          query = query.select(columns.join(', '));
        } else {
          query = query.select('*');
        }

        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (value !== null && value !== undefined) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (options.orderBy) {
          query = query.order(options.orderBy, { ascending: options.ascending ?? true });
        }

        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        return query;
      },
      { ttl: options.ttl }
    );
  }

  async insertOptimized<T>(
    table: string,
    data: T | T[],
    options: {
      onConflict?: string;
      returning?: string;
    } = {}
  ): Promise<{ data: T; error: any }> {
    // Invalidate related cache entries
    this.invalidateCache(table);

    return this.query(
      table,
      (client) => {
        let query = client.from(table).insert(data);

        if (options.onConflict) {
          query = query.onConflict(options.onConflict);
        }

        if (options.returning) {
          query = query.select(options.returning);
        }

        return query;
      },
      { skipCache: true }
    );
  }

  async updateOptimized<T>(
    table: string,
    data: Partial<T>,
    filters: Record<string, any>,
    options: {
      returning?: string;
    } = {}
  ): Promise<{ data: T; error: any }> {
    // Invalidate related cache entries
    this.invalidateCache(table);

    return this.query(
      table,
      (client) => {
        let query = client.from(table).update(data);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        if (options.returning) {
          query = query.select(options.returning);
        }

        return query;
      },
      { skipCache: true }
    );
  }

  async deleteOptimized(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: any; error: any }> {
    // Invalidate related cache entries
    this.invalidateCache(table);

    return this.query(
      table,
      (client) => {
        let query = client.from(table).delete();

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        return query;
      },
      { skipCache: true }
    );
  }

  // Batch operations
  async batchInsert<T>(
    table: string,
    data: T[],
    batchSize: number = 100
  ): Promise<{ data: T[]; error: any }> {
    const batches = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    const results = await Promise.all(
      batches.map(batch => this.insertOptimized(table, batch))
    );

    const allData = results.reduce((acc, result) => {
      if (result.data) {
        acc.push(...(Array.isArray(result.data) ? result.data : [result.data]));
      }
      return acc;
    }, [] as T[]);

    const errors = results.filter(result => result.error);
    
    return {
      data: allData,
      error: errors.length > 0 ? errors : null,
    };
  }

  // Cache management
  invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Analytics
  getStats() {
    const recentStats = this.queryStats.slice(-100);
    const totalQueries = recentStats.length;
    const cachedQueries = recentStats.filter(s => s.cached).length;
    const averageDuration = recentStats.reduce((sum, s) => sum + s.duration, 0) / totalQueries;
    const slowQueries = recentStats.filter(s => s.duration > this.config.slowQueryThreshold).length;

    return {
      totalQueries,
      cachedQueries,
      cacheHitRate: totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0,
      averageDuration,
      slowQueries,
      slowQueryRate: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        hits: entry.hits,
        size: entry.size,
        age: Date.now() - entry.timestamp,
      })),
    };
  }

  getSlowQueries(limit: number = 10) {
    return this.queryStats
      .filter(s => s.duration > this.config.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Query optimization suggestions
  analyzeQueries() {
    const stats = this.getStats();
    const suggestions = [];

    if (stats.slowQueryRate > 10) {
      suggestions.push({
        type: 'performance',
        message: `${stats.slowQueryRate.toFixed(1)}% of queries are slow. Consider adding indexes or optimizing query patterns.`,
        priority: 'high',
      });
    }

    if (stats.cacheHitRate < 30) {
      suggestions.push({
        type: 'caching',
        message: `Cache hit rate is ${stats.cacheHitRate.toFixed(1)}%. Consider increasing TTL or identifying cacheable queries.`,
        priority: 'medium',
      });
    }

    if (stats.cacheSize > this.config.maxCacheSize * 0.8) {
      suggestions.push({
        type: 'memory',
        message: `Cache is ${((stats.cacheSize / this.config.maxCacheSize) * 100).toFixed(1)}% full. Consider increasing cache size or reducing TTL.`,
        priority: 'low',
      });
    }

    return suggestions;
  }
}

// Global database optimizer instance
export const dbOptimizer = new DatabaseOptimizer();

// Helper functions
export function createOptimizedClient(config?: Partial<DatabaseConfig>) {
  return new DatabaseOptimizer(config);
}

// React hook for database optimization
export function useDatabaseOptimizer() {
  return {
    query: (table: string, queryFn: any, options?: any) => 
      dbOptimizer.query(table, queryFn, options),
    select: (table: string, columns: any, filters?: any, options?: any) => 
      dbOptimizer.selectOptimized(table, columns, filters, options),
    insert: (table: string, data: any, options?: any) => 
      dbOptimizer.insertOptimized(table, data, options),
    update: (table: string, data: any, filters: any, options?: any) => 
      dbOptimizer.updateOptimized(table, data, filters, options),
    delete: (table: string, filters: any) => 
      dbOptimizer.deleteOptimized(table, filters),
    batchInsert: (table: string, data: any[], batchSize?: number) => 
      dbOptimizer.batchInsert(table, data, batchSize),
    getStats: () => dbOptimizer.getStats(),
    getSlowQueries: (limit?: number) => dbOptimizer.getSlowQueries(limit),
    analyzeQueries: () => dbOptimizer.analyzeQueries(),
    invalidateCache: (pattern: string) => dbOptimizer.invalidateCache(pattern),
    clearCache: () => dbOptimizer.clearCache(),
  };
}