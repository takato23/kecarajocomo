/**
 * Optimized Supabase Client for Meal Planning
 * 
 * Provides enhanced Supabase client with:
 * - Connection pooling
 * - Query optimization
 * - Caching strategies
 * - Error handling
 * - Performance monitoring
 * - Edge Function support
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { measureOperation } from '@/lib/utils/performanceMetrics';
import { retryWithBackoff } from '@/lib/utils/retryUtils';
import type { Database } from './types';

// Client configuration options
interface SupabaseClientConfig {
  useConnectionPooling?: boolean;
  enableRealtime?: boolean;
  enableAuth?: boolean;
  maxRetries?: number;
  queryTimeout?: number;
  cacheResults?: boolean;
  enableMetrics?: boolean;
}

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Default configuration
const DEFAULT_CONFIG: SupabaseClientConfig = {
  useConnectionPooling: true,
  enableRealtime: false, // Disabled by default for performance
  enableAuth: true,
  maxRetries: 3,
  queryTimeout: 10000, // 10 seconds
  cacheResults: true,
  enableMetrics: true,
};

// Environment variables validation
function validateEnvironmentVariables(): {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { url, anonKey, serviceRoleKey };
}

// Query cache implementation
class QueryCache {
  private cache = new Map<string, QueryCacheEntry>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 1000;

  set(key: string, data: any, ttl?: number): void {
    // Cleanup old entries if cache is too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.maxSize * 0.2); // Remove 20% of entries
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Enhanced Supabase client wrapper
class OptimizedSupabaseClient {
  private client: SupabaseClient<Database>;
  private config: SupabaseClientConfig;
  private queryCache: QueryCache;
  private isServerSide: boolean;

  constructor(client: SupabaseClient<Database>, config: SupabaseClientConfig = {}) {
    this.client = client;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryCache = new QueryCache();
    this.isServerSide = typeof window === 'undefined';
  }

  /**
   * Execute query with optimization and monitoring
   */
  async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<any>,
    options?: {
      useCache?: boolean;
      cacheTtl?: number;
      cacheKey?: string;
      skipMetrics?: boolean;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = options?.cacheKey || `${operation}_${JSON.stringify(queryFn.toString().slice(0, 100))}`;

    // Check cache first
    if (this.config.cacheResults && options?.useCache !== false) {
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        if (this.config.enableMetrics && !options?.skipMetrics) {
          logger.debug('Query served from cache', 'supabaseClient', {
            operation,
            cacheKey,
            cacheHit: true,
          });
        }
        return cached;
      }
    }

    // Execute query with metrics
    const executeWithMetrics = async () => {
      if (this.config.enableMetrics && !options?.skipMetrics) {
        return await measureOperation(
          `supabase_${operation}`,
          queryFn,
          { operation, isServerSide: this.isServerSide }
        );
      } else {
        return await queryFn();
      }
    };

    // Execute with retry logic
    const result = await retryWithBackoff(executeWithMetrics, {
      maxRetries: this.config.maxRetries || 3,
      initialDelayMs: 1000,
      retryableErrors: ['network error', 'timeout', 'connection error'],
    });

    // Cache successful results
    if (this.config.cacheResults && options?.useCache !== false && result.data) {
      this.queryCache.set(cacheKey, result, options?.cacheTtl);
    }

    const duration = Date.now() - startTime;
    
    if (this.config.enableMetrics && !options?.skipMetrics) {
      logger.debug('Query executed successfully', 'supabaseClient', {
        operation,
        duration,
        cacheHit: false,
        hasData: !!result.data,
        hasError: !!result.error,
      });
    }

    return result;
  }

  /**
   * Optimized meal plans operations
   */
  async getMealPlan(userId: string, weekStart: string) {
    return this.executeQuery(
      'get_meal_plan',
      () => this.client
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single(),
      {
        useCache: true,
        cacheTtl: 10 * 60 * 1000, // 10 minutes
        cacheKey: `meal_plan_${userId}_${weekStart}`,
      }
    );
  }

  async upsertMealPlan(mealPlan: any) {
    // Invalidate related cache entries
    this.queryCache.invalidate(`meal_plan_${mealPlan.user_id}`);
    
    return this.executeQuery(
      'upsert_meal_plan',
      () => this.client
        .from('meal_plans')
        .upsert(mealPlan, { onConflict: 'user_id,week_start' })
        .select(),
      { useCache: false }
    );
  }

  async getUserMealPlans(userId: string, limit: number = 10) {
    return this.executeQuery(
      'get_user_meal_plans',
      () => this.client
        .from('meal_plans')
        .select('id, week_start, week_end, created_at, updated_at')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(limit),
      {
        useCache: true,
        cacheTtl: 5 * 60 * 1000, // 5 minutes
        cacheKey: `user_meal_plans_${userId}_${limit}`,
      }
    );
  }

  /**
   * Optimized user preferences operations
   */
  async getUserPreferences(userId: string) {
    return this.executeQuery(
      'get_user_preferences',
      () => this.client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
      {
        useCache: true,
        cacheTtl: 15 * 60 * 1000, // 15 minutes
        cacheKey: `user_preferences_${userId}`,
      }
    );
  }

  async updateUserPreferences(userId: string, preferences: any) {
    // Invalidate cache
    this.queryCache.invalidate(`user_preferences_${userId}`);
    
    return this.executeQuery(
      'update_user_preferences',
      () => this.client
        .from('user_preferences')
        .upsert({ user_id: userId, ...preferences }, { onConflict: 'user_id' })
        .select(),
      { useCache: false }
    );
  }

  /**
   * Optimized pantry operations
   */
  async getPantryItems(userId: string) {
    return this.executeQuery(
      'get_pantry_items',
      () => this.client
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      {
        useCache: true,
        cacheTtl: 2 * 60 * 1000, // 2 minutes (shorter cache for dynamic data)
        cacheKey: `pantry_items_${userId}`,
      }
    );
  }

  async addPantryItem(item: any) {
    // Invalidate cache
    this.queryCache.invalidate(`pantry_items_${item.user_id}`);
    
    return this.executeQuery(
      'add_pantry_item',
      () => this.client
        .from('pantry_items')
        .insert(item)
        .select(),
      { useCache: false }
    );
  }

  /**
   * Batch operations for improved performance
   */
  async batchInsert(tableName: string, items: any[]) {
    return this.executeQuery(
      `batch_insert_${tableName}`,
      () => this.client
        .from(tableName)
        .insert(items)
        .select(),
      { useCache: false }
    );
  }

  /**
   * Realtime subscriptions (when enabled)
   */
  subscribeTo(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    if (!this.config.enableRealtime) {
      logger.warn('Realtime not enabled for this client', 'supabaseClient');
      return null;
    }

    const channel = this.client
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Health check for the database connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { error } = await this.client
        .from('meal_plans')
        .select('id')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'unhealthy',
          latency,
          error: error.message,
        };
      }
      
      const status = latency < 1000 ? 'healthy' : latency < 3000 ? 'degraded' : 'unhealthy';
      
      return { status, latency };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cache management
   */
  clearCache(pattern?: string): void {
    this.queryCache.invalidate(pattern);
    logger.info('Cache cleared', 'supabaseClient', { pattern });
  }

  getCacheStats() {
    return this.queryCache.getStats();
  }

  /**
   * Get the underlying Supabase client for direct access
   */
  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  /**
   * Configuration management
   */
  updateConfig(newConfig: Partial<SupabaseClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Supabase client config updated', 'supabaseClient', { newConfig });
  }

  getConfig(): SupabaseClientConfig {
    return { ...this.config };
  }
}

// Client factory functions
let browserClient: OptimizedSupabaseClient | null = null;
let serverClient: OptimizedSupabaseClient | null = null;

/**
 * Get optimized browser client (singleton)
 */
export function getOptimizedBrowserClient(config?: SupabaseClientConfig): OptimizedSupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = validateEnvironmentVariables();
    
    const supabaseClient = createBrowserClient<Database>(url, anonKey, {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; ${options.sameSite || 'lax'}; ${options.secure ? 'secure' : ''}`;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
      },
    });

    browserClient = new OptimizedSupabaseClient(supabaseClient, {
      ...config,
      enableRealtime: config?.enableRealtime ?? true, // Enable realtime for browser
    });
  }
  
  return browserClient;
}

/**
 * Get optimized server client for API routes and server components
 */
export function getOptimizedServerClient(request?: NextRequest, response?: NextResponse, config?: SupabaseClientConfig): OptimizedSupabaseClient {
  const { url, anonKey } = validateEnvironmentVariables();
  
  const supabaseClient = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        const cookieStore = cookies();
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          const cookieStore = cookies();
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle cookie setting errors gracefully
          logger.warn('Failed to set cookie', 'supabaseClient', { name, error });
        }
      },
      remove(name: string, options: any) {
        try {
          const cookieStore = cookies();
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          logger.warn('Failed to remove cookie', 'supabaseClient', { name, error });
        }
      },
    },
  });

  return new OptimizedSupabaseClient(supabaseClient, {
    ...config,
    enableRealtime: false, // Disable realtime for server-side
    cacheResults: true, // Enable caching for server-side performance
  });
}

/**
 * Get service role client for administrative operations
 */
export function getServiceRoleClient(config?: SupabaseClientConfig): OptimizedSupabaseClient | null {
  const { url, serviceRoleKey } = validateEnvironmentVariables();
  
  if (!serviceRoleKey) {
    logger.warn('Service role key not available', 'supabaseClient');
    return null;
  }

  const supabaseClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return new OptimizedSupabaseClient(supabaseClient, {
    ...config,
    enableAuth: false, // Service role doesn't need auth
    enableRealtime: false,
    maxRetries: 5, // Higher retry count for administrative operations
  });
}

/**
 * Edge runtime compatible client
 */
export function getEdgeClient(config?: SupabaseClientConfig): OptimizedSupabaseClient {
  const { url, anonKey } = validateEnvironmentVariables();
  
  const supabaseClient = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: fetch,
    },
  });

  return new OptimizedSupabaseClient(supabaseClient, {
    ...config,
    enableRealtime: false,
    cacheResults: false, // Disable caching in edge runtime
    enableMetrics: false, // Disable metrics in edge runtime for performance
  });
}

// Utility functions
export function createCacheKey(operation: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);
  
  return `${operation}_${btoa(JSON.stringify(sortedParams)).slice(0, 16)}`;
}

export function warmupCache(client: OptimizedSupabaseClient, userId: string): Promise<void[]> {
  // Preload commonly accessed data
  const warmupOperations = [
    () => client.getUserPreferences(userId),
    () => client.getPantryItems(userId),
    () => client.getUserMealPlans(userId, 5),
  ];

  return Promise.all(
    warmupOperations.map(operation => 
      operation().catch(error => 
        logger.warn('Cache warmup failed', 'supabaseClient', { error })
      )
    )
  );
}

// Export types
export type { Database };
export { OptimizedSupabaseClient };
export type { SupabaseClientConfig };