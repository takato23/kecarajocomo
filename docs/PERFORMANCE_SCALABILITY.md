# Performance & Scalability Strategies - kecarajocomer

## Overview

Comprehensive performance optimization and scalability strategies for building a "utopically perfect" meal planning application. Focus on achieving exceptional user experience with sub-3s load times and seamless interactions at scale.

## Performance Goals

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5s
- **TBT (Total Blocking Time)**: < 300ms

### Application Metrics
- **Initial Load**: < 3s on 3G, < 1s on 4G
- **Route Transitions**: < 300ms
- **API Response**: < 200ms (p95)
- **Search Results**: < 100ms
- **AI Generation**: < 5s with streaming

## Frontend Performance

### Next.js 15 Optimizations

```typescript
// next.config.js
export default {
  experimental: {
    ppr: true, // Partial Pre-rendering
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/*'],
  },
  images: {
    domains: ['images.kecarajocomer.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

### Code Splitting Strategy

```typescript
// Dynamic imports for heavy components
const RecipeGenerator = dynamic(
  () => import('@/components/features/RecipeGenerator'),
  {
    loading: () => <RecipeGeneratorSkeleton />,
    ssr: false,
  }
);

const NutritionAnalyzer = dynamic(
  () => import('@/components/features/NutritionAnalyzer'),
  {
    loading: () => <LoadingSpinner />,
  }
);

// Route-based code splitting
export default function RecipePage() {
  return (
    <Suspense fallback={<RecipePageSkeleton />}>
      <RecipeContent />
    </Suspense>
  );
}
```

### Image Optimization

```typescript
// lib/image-optimization.ts
export class ImageOptimizer {
  static getOptimizedUrl(
    src: string,
    width: number,
    quality: number = 80
  ): string {
    // Use Vercel Image Optimization API
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: quality.toString(),
    });
    
    return `/api/image?${params}`;
  }

  static generateSrcSet(src: string): string {
    const widths = [640, 750, 828, 1080, 1200, 1920];
    return widths
      .map(w => `${this.getOptimizedUrl(src, w)} ${w}w`)
      .join(', ');
  }

  static async preloadCriticalImages(urls: string[]): Promise<void> {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.getOptimizedUrl(url, 1200);
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });
  }
}

// Progressive image loading component
export function ProgressiveImage({ src, alt, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(
    ImageOptimizer.getOptimizedUrl(src, 20, 10) // Tiny placeholder
  );

  useEffect(() => {
    const img = new Image();
    img.src = ImageOptimizer.getOptimizedUrl(src, props.width || 800);
    img.onload = () => {
      setCurrentSrc(img.src);
      setIsLoaded(true);
    };
  }, [src, props.width]);

  return (
    <div className="relative overflow-hidden">
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        className={cn(
          props.className,
          'transition-all duration-700',
          !isLoaded && 'blur-xl scale-110'
        )}
      />
    </div>
  );
}
```

### Bundle Optimization

```typescript
// Webpack configuration for optimal bundles
export const webpackConfig = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        framework: {
          name: 'framework',
          test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
          priority: 40,
          enforce: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
        },
        lib: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `npm.${packageName.replace('@', '')}`;
          },
          priority: 10,
        },
      },
    },
    runtimeChunk: {
      name: 'runtime',
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'],
          },
          mangle: {
            safari10: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
};
```

## State Management Performance

### Zustand Optimization

```typescript
// stores/recipe-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Sliced store for better performance
const useRecipeStore = create(
  subscribeWithSelector((set, get) => ({
    // State slices
    recipes: new Map(),
    filters: {
      search: '',
      mealType: '',
      tags: [],
    },
    
    // Memoized getters
    getFilteredRecipes: () => {
      const { recipes, filters } = get();
      const recipeArray = Array.from(recipes.values());
      
      return recipeArray.filter(recipe => {
        if (filters.search && !recipe.name.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        if (filters.mealType && !recipe.mealTypes.includes(filters.mealType)) {
          return false;
        }
        if (filters.tags.length && !filters.tags.some(tag => recipe.tags.includes(tag))) {
          return false;
        }
        return true;
      });
    },
    
    // Batched updates
    updateFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters }
      }));
    },
    
    // Optimized updates
    addRecipes: (newRecipes) => {
      set((state) => {
        const updated = new Map(state.recipes);
        newRecipes.forEach(recipe => {
          updated.set(recipe.id, recipe);
        });
        return { recipes: updated };
      });
    },
  }))
);

// Selective subscriptions
export function useFilteredRecipes() {
  return useRecipeStore(
    (state) => state.getFilteredRecipes(),
    shallow
  );
}

export function useRecipeFilters() {
  return useRecipeStore(
    (state) => state.filters,
    shallow
  );
}
```

### React Query Configuration

```typescript
// lib/react-query.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        if (error.status === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Prefetch critical data
export async function prefetchDashboardData(userId: string) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['meal-plan', 'active', userId],
      queryFn: () => fetchActiveMealPlan(userId),
      staleTime: 30 * 60 * 1000, // 30 minutes
    }),
    queryClient.prefetchQuery({
      queryKey: ['pantry', 'summary', userId],
      queryFn: () => fetchPantrySummary(userId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['recipes', 'recent'],
      queryFn: () => fetchRecentRecipes(),
    }),
  ]);
}

// Optimistic updates
export function useOptimisticRecipeSave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: saveRecipe,
    onMutate: async (recipeId) => {
      await queryClient.cancelQueries(['saved-recipes']);
      
      const previous = queryClient.getQueryData(['saved-recipes']);
      
      queryClient.setQueryData(['saved-recipes'], (old) => [
        ...old,
        { id: recipeId, savedAt: new Date() }
      ]);
      
      return { previous };
    },
    onError: (err, recipeId, context) => {
      queryClient.setQueryData(['saved-recipes'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['saved-recipes']);
    },
  });
}
```

## Database Performance

### Query Optimization

```sql
-- Composite indexes for common queries
CREATE INDEX idx_recipes_search ON recipes 
USING gin(to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_planned_meals_composite ON planned_meals
(meal_plan_id, date, meal_type);

CREATE INDEX idx_pantry_user_expiry ON pantry_items
(user_id, expiration_date) 
WHERE expiration_date IS NOT NULL;

-- Partial indexes for filtered queries
CREATE INDEX idx_recipes_public_recent ON recipes
(created_at DESC) 
WHERE is_public = true;

CREATE INDEX idx_active_meal_plans ON meal_plans
(user_id, week_start) 
WHERE is_active = true;

-- Function-based indexes
CREATE INDEX idx_recipes_total_time ON recipes
((prep_time + cook_time));
```

### Connection Pooling

```typescript
// lib/database/connection-pool.ts
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Supabase client with connection pooling
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-connection-pool': 'true',
      },
    },
  }
);

// Direct pool for complex queries
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Query with timeout
export async function queryWithTimeout<T>(
  query: string,
  params: any[],
  timeoutMs: number = 5000
): Promise<T[]> {
  const client = await pgPool.connect();
  
  try {
    await client.query('SET statement_timeout = $1', [timeoutMs]);
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### Data Pagination

```typescript
// lib/pagination.ts
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginateQuery<T>(
  table: string,
  params: PaginationParams,
  filters?: Record<string, any>
): Promise<PaginatedResponse<T>> {
  const offset = (params.page - 1) * params.limit;
  
  // Build query
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
  }
  
  // Apply sorting
  if (params.sortBy) {
    query = query.order(params.sortBy, { 
      ascending: params.sortOrder === 'asc' 
    });
  }
  
  // Apply pagination
  query = query.range(offset, offset + params.limit - 1);
  
  const { data, count, error } = await query;
  
  if (error) throw error;
  
  return {
    data: data as T[],
    meta: {
      page: params.page,
      limit: params.limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / params.limit),
      hasNext: offset + params.limit < (count || 0),
      hasPrev: params.page > 1,
    },
  };
}

// Cursor-based pagination for real-time data
export async function cursorPaginate<T>(
  table: string,
  cursor: string | null,
  limit: number = 20
): Promise<{ data: T[]; nextCursor: string | null }> {
  let query = supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1);
  
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? items[items.length - 1].created_at : null;
  
  return {
    data: items as T[],
    nextCursor,
  };
}
```

## Caching Strategy

### Multi-Layer Caching

```typescript
// lib/caching/cache-manager.ts
export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly maxMemorySize = 100 * 1024 * 1024; // 100MB
  private currentMemorySize = 0;

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check memory cache
    const memoryHit = this.getFromMemory(key);
    if (memoryHit && !this.isExpired(memoryHit)) {
      return memoryHit.data as T;
    }

    // Check browser cache (if client-side)
    if (typeof window !== 'undefined') {
      const browserHit = await this.getFromBrowser(key);
      if (browserHit && !this.isExpired(browserHit)) {
        this.setMemory(key, browserHit.data, options);
        return browserHit.data as T;
      }
    }

    // Check CDN cache (for static resources)
    if (options.cdn) {
      const cdnHit = await this.getFromCDN(key);
      if (cdnHit) {
        return cdnHit as T;
      }
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Update all cache layers
    await this.setAllLayers(key, data, options);
    
    return data;
  }

  private async setAllLayers<T>(
    key: string,
    data: T,
    options: CacheOptions
  ): Promise<void> {
    const ttl = options.ttl || 3600; // 1 hour default
    
    // Memory cache
    this.setMemory(key, data, options);
    
    // Browser cache
    if (typeof window !== 'undefined') {
      await this.setBrowser(key, data, ttl);
    }
    
    // Edge cache headers for CDN
    if (options.cdn) {
      this.setCDNHeaders(options.cdnMaxAge || ttl);
    }
  }

  private setMemory<T>(key: string, data: T, options: CacheOptions): void {
    const size = this.estimateSize(data);
    
    // Evict if necessary
    while (this.currentMemorySize + size > this.maxMemorySize) {
      this.evictOldest();
    }
    
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + (options.ttl || 3600) * 1000,
      size,
      lastAccess: Date.now(),
    });
    
    this.currentMemorySize += size;
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccess < oldestTime) {
        oldest = key;
        oldestTime = entry.lastAccess;
      }
    }
    
    if (oldest) {
      const entry = this.memoryCache.get(oldest)!;
      this.currentMemorySize -= entry.size;
      this.memoryCache.delete(oldest);
    }
  }
}

// Cache configuration by resource type
export const cacheConfig = {
  recipes: {
    ttl: 3600, // 1 hour
    cdn: true,
    cdnMaxAge: 86400, // 24 hours
  },
  userPreferences: {
    ttl: 300, // 5 minutes
    cdn: false,
  },
  mealPlans: {
    ttl: 600, // 10 minutes
    cdn: false,
  },
  staticAssets: {
    ttl: 2592000, // 30 days
    cdn: true,
    cdnMaxAge: 31536000, // 1 year
  },
};
```

### Service Worker Caching

```javascript
// public/sw.js
const CACHE_NAME = 'kecarajocomer-v1';
const STATIC_CACHE = 'kecarajocomer-static-v1';
const API_CACHE = 'kecarajocomer-api-v1';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
];

// Install and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default network-first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
```

## Edge Computing

### Vercel Edge Functions

```typescript
// app/api/recipes/search/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = ['iad1', 'sfo1'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mealType = searchParams.get('mealType');
  
  // Edge-side caching
  const cacheKey = `search:${query}:${mealType}`;
  const cached = await getFromEdgeCache(cacheKey);
  
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  }
  
  // Perform search
  const results = await searchRecipes(query, { mealType });
  
  // Cache results
  await setEdgeCache(cacheKey, JSON.stringify(results), 300);
  
  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'Cache-Control': 'public, s-maxage=300',
    },
  });
}

// Edge-optimized search function
async function searchRecipes(
  query: string,
  filters: any
): Promise<Recipe[]> {
  // Use Vercel KV for edge-side caching
  const kv = await getKVNamespace();
  
  // Check bloom filter for existence
  const bloomKey = `bloom:recipes:${query}`;
  const exists = await kv.get(bloomKey);
  
  if (!exists) {
    return [];
  }
  
  // Perform actual search
  const results = await fetch(`${process.env.SUPABASE_URL}/rest/v1/recipes`, {
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query,
      filters,
    }),
  });
  
  return results.json();
}
```

### Geolocation-Based Optimization

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get user's location
  const country = request.geo?.country || 'US';
  const region = request.geo?.region || 'unknown';
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Add location info for backend
  requestHeaders.set('x-user-country', country);
  requestHeaders.set('x-user-region', region);
  
  // Route to nearest data center
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Set location-based cache headers
  if (['US', 'CA'].includes(country)) {
    response.headers.set('x-vercel-region', 'iad1');
  } else if (['GB', 'FR', 'DE'].includes(country)) {
    response.headers.set('x-vercel-region', 'lhr1');
  } else {
    response.headers.set('x-vercel-region', 'auto');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Real-time Performance

### WebSocket Optimization

```typescript
// lib/realtime/connection-manager.ts
export class RealtimeConnectionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async subscribeToChannel(
    channelName: string,
    options: ChannelOptions
  ): Promise<RealtimeChannel> {
    // Reuse existing channel if possible
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    // Create optimized channel
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: true },
          presence: { key: options.userId },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced');
      })
      .on('broadcast', { event: options.event }, (payload) => {
        this.handleBroadcast(channelName, payload);
      });

    // Implement connection pooling
    if (this.channels.size >= 10) {
      // Close least recently used channel
      this.closeLRUChannel();
    }

    // Subscribe with error handling
    await this.subscribeWithRetry(channel);
    
    this.channels.set(channelName, channel);
    return channel;
  }

  private async subscribeWithRetry(
    channel: RealtimeChannel
  ): Promise<void> {
    try {
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
        }
      });
    } catch (error) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        await this.delay(this.reconnectDelay);
        this.reconnectDelay *= 2; // Exponential backoff
        return this.subscribeWithRetry(channel);
      }
      throw error;
    }
  }

  // Batch updates for performance
  private updateBuffer: Map<string, any[]> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;

  queueUpdate(channel: string, update: any): void {
    if (!this.updateBuffer.has(channel)) {
      this.updateBuffer.set(channel, []);
    }
    
    this.updateBuffer.get(channel)!.push(update);
    
    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        this.flushUpdates();
      }, 50); // Batch updates every 50ms
    }
  }

  private async flushUpdates(): Promise<void> {
    for (const [channel, updates] of this.updateBuffer) {
      const ch = this.channels.get(channel);
      if (ch) {
        await ch.send({
          type: 'broadcast',
          event: 'batch-update',
          payload: { updates },
        });
      }
    }
    
    this.updateBuffer.clear();
    this.updateTimer = null;
  }
}
```

## Monitoring & Analytics

### Performance Monitoring

```typescript
// lib/monitoring/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, Metric[]> = new Map();
  private observer: PerformanceObserver;

  constructor() {
    // Web Vitals monitoring
    this.initializeWebVitals();
    
    // Custom performance observer
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processEntry(entry);
      }
    });
    
    this.observer.observe({ 
      entryTypes: ['navigation', 'resource', 'measure'] 
    });
  }

  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getLCP, getFCP, getTTFB }) => {
      getCLS(this.sendMetric);
      getFID(this.sendMetric);
      getLCP(this.sendMetric);
      getFCP(this.sendMetric);
      getTTFB(this.sendMetric);
    });
  }

  private sendMetric = (metric: any): void => {
    // Send to analytics
    if (window.analytics) {
      window.analytics.track('Web Vitals', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
      });
    }

    // Send to monitoring service
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        timestamp: Date.now(),
      }),
      keepalive: true,
    });
  };

  // Custom performance marks
  mark(name: string): void {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string): void {
    try {
      performance.measure(name, startMark, endMark);
    } catch (e) {
      console.error('Performance measurement failed:', e);
    }
  }

  // API performance tracking
  async trackAPICall<T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startMark = `api-start-${Date.now()}`;
    const endMark = `api-end-${Date.now()}`;
    
    this.mark(startMark);
    
    try {
      const result = await operation();
      this.mark(endMark);
      this.measure(`API: ${endpoint}`, startMark, endMark);
      return result;
    } catch (error) {
      this.mark(endMark);
      this.measure(`API-Error: ${endpoint}`, startMark, endMark);
      throw error;
    }
  }
}

// Initialize global monitor
export const perfMonitor = new PerformanceMonitor();
```

### Custom Analytics

```typescript
// lib/analytics/event-tracker.ts
export class EventTracker {
  private queue: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchSize = 20;
  private readonly batchDelay = 1000;

  track(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        userId: this.getUserId(),
        page: window.location.pathname,
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    };

    this.queue.push(analyticsEvent);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch (error) {
      // Re-queue events on failure
      this.queue.unshift(...events);
      console.error('Analytics flush failed:', error);
    }
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, tags?: Record<string, string>): void {
    this.track('performance_metric', {
      metric,
      value,
      tags,
      unit: this.getUnit(metric),
    });
  }

  // Track errors with context
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }
}

export const analytics = new EventTracker();
```

## Scalability Architecture

### Microservices Design

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway
  gateway:
    image: kecarajocomer/gateway:latest
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - recipe-service
      - meal-service
      - ai-service

  # Recipe Service
  recipe-service:
    image: kecarajocomer/recipe-service:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Meal Planning Service
  meal-service:
    image: kecarajocomer/meal-service:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 2

  # AI Service
  ai-service:
    image: kecarajocomer/ai-service:latest
    environment:
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 2G

  # Cache Layer
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    deploy:
      replicas: 1

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=secret
    ports:
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  redis-data:
  rabbitmq-data:
```

### Load Balancing Strategy

```typescript
// lib/load-balancer/service-discovery.ts
export class ServiceDiscovery {
  private services: Map<string, ServiceInstance[]> = new Map();
  private healthChecker: HealthChecker;

  async getHealthyInstance(serviceName: string): Promise<ServiceInstance> {
    const instances = this.services.get(serviceName) || [];
    const healthy = await this.filterHealthy(instances);
    
    if (healthy.length === 0) {
      throw new Error(`No healthy instances for ${serviceName}`);
    }
    
    // Round-robin with weighted distribution
    return this.selectInstance(healthy);
  }

  private async filterHealthy(
    instances: ServiceInstance[]
  ): Promise<ServiceInstance[]> {
    const healthChecks = await Promise.all(
      instances.map(async (instance) => ({
        instance,
        healthy: await this.healthChecker.check(instance),
      }))
    );
    
    return healthChecks
      .filter(({ healthy }) => healthy)
      .map(({ instance }) => instance);
  }

  private selectInstance(instances: ServiceInstance[]): ServiceInstance {
    // Calculate total weight
    const totalWeight = instances.reduce(
      (sum, instance) => sum + instance.weight,
      0
    );
    
    // Random weighted selection
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }
    
    return instances[0];
  }
}

// Circuit breaker for resilience
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Auto-Scaling Configuration

```typescript
// infrastructure/auto-scaling.ts
export const autoScalingConfig = {
  recipe_service: {
    min: 2,
    max: 10,
    metrics: [
      {
        type: 'cpu',
        target: 70,
        scaleUp: 80,
        scaleDown: 50,
      },
      {
        type: 'memory',
        target: 80,
        scaleUp: 85,
        scaleDown: 60,
      },
      {
        type: 'requests_per_second',
        target: 1000,
        scaleUp: 1200,
        scaleDown: 800,
      },
    ],
    cooldown: {
      scaleUp: 300, // 5 minutes
      scaleDown: 600, // 10 minutes
    },
  },
  
  ai_service: {
    min: 1,
    max: 5,
    metrics: [
      {
        type: 'queue_length',
        target: 10,
        scaleUp: 15,
        scaleDown: 5,
      },
      {
        type: 'response_time',
        target: 3000,
        scaleUp: 4000,
        scaleDown: 2000,
      },
    ],
  },
};

// Kubernetes HPA configuration
export const hpaConfig = `
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: recipe-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recipe-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: "1k"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
`;
```

## Cost Optimization

### Resource Optimization

```typescript
// lib/optimization/resource-optimizer.ts
export class ResourceOptimizer {
  // Optimize image delivery
  async optimizeImageDelivery(
    imageUrl: string,
    context: ImageContext
  ): Promise<string> {
    const device = this.detectDevice(context.userAgent);
    const connection = this.detectConnection(context);
    
    // Adaptive image quality
    const quality = this.calculateQuality(device, connection);
    
    // Responsive sizing
    const dimensions = this.calculateDimensions(device, context.viewport);
    
    // Format selection
    const format = this.selectFormat(device, context.acceptHeader);
    
    return this.buildOptimizedUrl(imageUrl, {
      quality,
      width: dimensions.width,
      height: dimensions.height,
      format,
      // Enable progressive loading for slow connections
      progressive: connection.speed < 1000,
    });
  }

  // Database query optimization
  async optimizeQuery(query: string, context: QueryContext): Promise<string> {
    // Analyze query plan
    const plan = await this.analyzeQueryPlan(query);
    
    // Suggest indexes
    const indexSuggestions = this.suggestIndexes(plan);
    
    // Optimize joins
    const optimizedJoins = this.optimizeJoins(plan);
    
    // Add query hints
    const hints = this.generateQueryHints(plan, context);
    
    return this.buildOptimizedQuery(query, {
      indexes: indexSuggestions,
      joins: optimizedJoins,
      hints,
    });
  }

  // Memory usage optimization
  optimizeMemoryUsage(): void {
    if (typeof window === 'undefined') return;

    // Monitor memory usage
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          const memory = (performance as any).memory;
          if (memory && memory.usedJSHeapSize > 100 * 1024 * 1024) {
            this.triggerMemoryCleanup();
          }
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  private triggerMemoryCleanup(): void {
    // Clear unused caches
    if ('caches' in window) {
      this.cleanupOldCaches();
    }
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear large data structures
    this.clearUnusedData();
  }
}
```

### Cost Monitoring

```typescript
// lib/monitoring/cost-monitor.ts
export class CostMonitor {
  private costs: Map<string, CostMetric> = new Map();

  async trackResourceUsage(
    resource: string,
    usage: number,
    unit: string
  ): Promise<void> {
    const cost = this.calculateCost(resource, usage, unit);
    
    this.costs.set(resource, {
      usage,
      unit,
      cost,
      timestamp: Date.now(),
    });

    // Alert if cost exceeds threshold
    if (cost > this.getThreshold(resource)) {
      await this.sendCostAlert(resource, cost);
    }
  }

  async generateCostReport(): Promise<CostReport> {
    const report: CostReport = {
      total: 0,
      breakdown: {},
      recommendations: [],
    };

    for (const [resource, metric] of this.costs) {
      report.breakdown[resource] = metric.cost;
      report.total += metric.cost;
    }

    // Generate recommendations
    report.recommendations = await this.generateRecommendations();

    return report;
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze usage patterns
    const patterns = await this.analyzeUsagePatterns();

    // Database recommendations
    if (patterns.database.unutilizedIndexes > 5) {
      recommendations.push(
        `Remove ${patterns.database.unutilizedIndexes} unused indexes to save storage costs`
      );
    }

    // CDN recommendations
    if (patterns.cdn.cacheHitRate < 0.8) {
      recommendations.push(
        `Improve CDN cache hit rate from ${patterns.cdn.cacheHitRate * 100}% to reduce bandwidth costs`
      );
    }

    // Compute recommendations
    if (patterns.compute.idleTime > 0.3) {
      recommendations.push(
        `Reduce compute idle time from ${patterns.compute.idleTime * 100}% to improve efficiency`
      );
    }

    return recommendations;
  }
}
```

## Summary

This comprehensive performance and scalability strategy ensures kecarajocomer delivers exceptional user experience at any scale. Key achievements:

1. **Frontend Performance**: Sub-3s load times with optimized bundles and caching
2. **Backend Scalability**: Microservices architecture with auto-scaling
3. **Database Optimization**: Indexed queries and connection pooling
4. **Edge Computing**: Global CDN with edge functions
5. **Real-time Features**: Optimized WebSocket connections
6. **Cost Efficiency**: Resource monitoring and optimization

The architecture is designed to handle millions of users while maintaining fast response times and low operational costs.