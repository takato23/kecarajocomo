import { parseIngredient } from './ingredientParser';
import { logger } from '@/services/logger';

// Types
export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  store: string;
  url: string;
  barcode?: string;
}

export interface BuscaPreciosResponse {
  failedScrapers?: string[] | null;
  products: Array<{
    id?: string;
    name?: string;
    title?: string;
    price?: number | string;
    image?: string;
    img?: string;
    imagen?: string;
    store?: string;
    tienda?: string;
    comercio?: string;
    link?: string;
    url?: string;
  }>;
  timestamp: string;
}

interface CacheEntry {
  timestamp: number;
  data: StoreProduct[];
}

interface Cache {
  [query: string]: CacheEntry;
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

interface ServiceStatus {
  isWarmingUp: boolean;
  lastSuccessfulRequest: number;
  failureCount: number;
  averageResponseTime: number;
  responseTimes: number[];
}

interface ProductGroup {
  baseProduct: StoreProduct;
  variations: StoreProduct[];
  priceRange: { min: number; max: number; avg: number };
}

interface SearchOptions {
  useCache?: boolean;
  retryConfig?: Partial<RetryConfig>;
  timeout?: number;
  onProgress?: (status: string) => void;
}

// Enhanced StoreScraper with V2 optimizations
export class EnhancedStoreScraper {
  private static instance: EnhancedStoreScraper;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly CACHE_KEY = 'buscaprecios_cache';
  private readonly STATUS_KEY = 'buscaprecios_status';
  private readonly API_URL = process.env.NEXT_PUBLIC_BUSCAPRECIOS_API || 'https://buscaprecios.onrender.com';
  
  // Default retry configuration
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 10000,
    factor: 2
  };

  // Service status tracking
  private serviceStatus: ServiceStatus = {
    isWarmingUp: false,
    lastSuccessfulRequest: 0,
    failureCount: 0,
    averageResponseTime: 0,
    responseTimes: []
  };

  private constructor() {
    this.loadServiceStatus();
    this.cleanupOldCache();
  }

  static getInstance(): EnhancedStoreScraper {
    if (!EnhancedStoreScraper.instance) {
      EnhancedStoreScraper.instance = new EnhancedStoreScraper();
    }
    return EnhancedStoreScraper.instance;
  }

  // Main search method with all V2 optimizations
  async searchProducts(query: string, options: SearchOptions = {}): Promise<StoreProduct[]> {
    const {
      useCache = true,
      retryConfig = {},
      timeout = 30000,
      onProgress
    } = options;

    // Use intelligent parser to simplify the query
    const parsedIngredient = parseIngredient(query);
    const searchQuery = parsedIngredient.simplifiedQuery;
    
    // Log the simplification for debugging
    if (parsedIngredient.originalText !== parsedIngredient.simplifiedQuery) {

    }

    const normalizedQuery = this.normalizeQuery(searchQuery);
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(normalizedQuery);
      if (cached) {
        onProgress?.('Using cached results');
        return cached;
      }
    }

    // Update service status
    const startTime = Date.now();
    this.updateWarmingStatus();
    
    if (this.serviceStatus.isWarmingUp) {
      onProgress?.('Service is warming up, this may take a moment...');
    }

    try {
      const products = await this.fetchWithRetry(
        normalizedQuery,
        { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig },
        timeout,
        onProgress
      );
      
      // Update success metrics
      this.recordSuccessfulRequest(Date.now() - startTime);
      
      // Save to cache
      if (useCache) {
        this.saveToCache(normalizedQuery, products);
      }
      
      return products;
    } catch (error: unknown) {
      this.recordFailedRequest();
      logger.error('Enhanced store scraping error:', 'enhancedStoreScraper', error);
      onProgress?.('Using fallback data due to error');
      return this.getMockProducts(normalizedQuery);
    }
  }

  // Fetch with intelligent retry mechanism
  private async fetchWithRetry(
    query: string,
    retryConfig: RetryConfig,
    timeout: number,
    onProgress?: (status: string) => void
  ): Promise<StoreProduct[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt, retryConfig);
          onProgress?.(`Retrying in ${delay/1000}s... (attempt ${attempt}/${retryConfig.maxRetries})`);
          await this.sleep(delay);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(
          `${this.API_URL}/?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data: BuscaPreciosResponse = await response.json();
        return this.normalizeProducts(data);
        
      } catch (error: unknown) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          onProgress?.('Request timeout, retrying...');
        } else {
          onProgress?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.initialDelay * Math.pow(config.factor, attempt - 1);
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
    return Math.min(jitteredDelay, config.maxDelay);
  }

  // Normalize query for better cache hits
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }

  // Enhanced product normalization with flexible field mapping
  private normalizeProducts(data: BuscaPreciosResponse): StoreProduct[] {
    if (!data.products || !Array.isArray(data.products)) {
      logger.warn('Invalid API response format', 'enhancedStoreScraper');
      return [];
    }
    
    return data.products
      .filter(item => {
        const hasValidName = item.name || item.title;
        const hasValidPrice = item.price !== undefined && item.price !== null;
        return hasValidName && hasValidPrice;
      })
      .map(item => ({
        id: item.id || `product-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name || item.title || 'Producto sin nombre',
        price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
        image: item.image || item.img || item.imagen || undefined,
        store: this.normalizeStoreName(item.store || item.tienda || item.comercio || 'Tienda no especificada'),
        url: item.link || item.url || '#'
      }))
      .filter(p => p.price > 0);
  }

  // Store name normalization
  private normalizeStoreName(store: string): string {
    const normalizations: Record<string, string> = {
      'disco': 'Disco',
      'jumbo': 'Jumbo',
      'carrefour': 'Carrefour',
      'coto': 'Coto',
      'dia': 'Día',
      'día': 'Día',
      'vea': 'Vea',
      'walmart': 'Walmart',
      'makro': 'Makro',
      'vital': 'Vital',
      'la anonima': 'La Anónima',
      'la anónima': 'La Anónima'
    };
    
    const lower = store.toLowerCase().trim();
    return normalizations[lower] || store;
  }

  // Group products by similarity
  groupProductsByVariation(products: StoreProduct[]): ProductGroup[] {
    const groups = new Map<string, ProductGroup>();
    
    products.forEach(product => {
      const baseKey = this.extractBaseProductKey(product.name);
      
      if (!groups.has(baseKey)) {
        groups.set(baseKey, {
          baseProduct: product,
          variations: [],
          priceRange: { min: product.price, max: product.price, avg: product.price }
        });
      } else {
        const group = groups.get(baseKey)!;
        group.variations.push(product);
        
        // Update price range
        const allPrices = [group.baseProduct.price, ...group.variations.map(v => v.price)];
        group.priceRange = {
          min: Math.min(...allPrices),
          max: Math.max(...allPrices),
          avg: allPrices.reduce((a, b) => a + b, 0) / allPrices.length
        };
        
        // Update base product to cheapest
        if (product.price < group.baseProduct.price) {
          group.baseProduct = product;
        }
      }
    });
    
    return Array.from(groups.values());
  }

  // Extract base product key for grouping
  private extractBaseProductKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/\d+\s*(g|gr|kg|ml|l|cc|un|u)\b/gi, '') // Remove quantities
      .replace(/\s+/g, ' ')
      .trim();
  }

  // LocalStorage cache management
  private getFromCache(query: string): StoreProduct[] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return null;
      
      const cache: Cache = JSON.parse(cacheData);
      const entry = cache[query];
      
      if (!entry) return null;
      
      if (Date.now() - entry.timestamp > this.CACHE_TTL) {
        delete cache[query];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      return entry.data;
    } catch (error: unknown) {
      logger.error('Cache read error:', 'enhancedStoreScraper', error);
      return null;
    }
  }

  private saveToCache(query: string, data: StoreProduct[]) {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      const cache: Cache = cacheData ? JSON.parse(cacheData) : {};
      
      cache[query] = {
        timestamp: Date.now(),
        data
      };
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error: unknown) {
      logger.error('Cache write error:', 'enhancedStoreScraper', error);
      // Clear cache if storage is full
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearCache();
      }
    }
  }

  // Clean up old cache entries
  private cleanupOldCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return;
      
      const cache: Cache = JSON.parse(cacheData);
      const now = Date.now();
      let hasChanges = false;
      
      Object.keys(cache).forEach(key => {
        if (now - cache[key].timestamp > this.CACHE_TTL) {
          delete cache[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      }
    } catch (error: unknown) {
      logger.error('Cache cleanup error:', 'enhancedStoreScraper', error);
    }
  }

  // Service status management
  private loadServiceStatus() {
    if (typeof window === 'undefined') return;
    
    try {
      const statusData = localStorage.getItem(this.STATUS_KEY);
      if (statusData) {
        this.serviceStatus = JSON.parse(statusData);
      }
    } catch (error: unknown) {
      logger.error('Status load error:', 'enhancedStoreScraper', error);
    }
  }

  private saveServiceStatus() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STATUS_KEY, JSON.stringify(this.serviceStatus));
    } catch (error: unknown) {
      logger.error('Status save error:', 'enhancedStoreScraper', error);
    }
  }

  private updateWarmingStatus() {
    const timeSinceLastSuccess = Date.now() - this.serviceStatus.lastSuccessfulRequest;
    this.serviceStatus.isWarmingUp = timeSinceLastSuccess > 30 * 60 * 1000; // 30 minutes
  }

  private recordSuccessfulRequest(responseTime: number) {
    this.serviceStatus.lastSuccessfulRequest = Date.now();
    this.serviceStatus.failureCount = 0;
    this.serviceStatus.isWarmingUp = false;
    
    // Update response time metrics
    this.serviceStatus.responseTimes.push(responseTime);
    if (this.serviceStatus.responseTimes.length > 100) {
      this.serviceStatus.responseTimes.shift();
    }
    
    this.serviceStatus.averageResponseTime = 
      this.serviceStatus.responseTimes.reduce((a, b) => a + b, 0) / 
      this.serviceStatus.responseTimes.length;
    
    this.saveServiceStatus();
  }

  private recordFailedRequest() {
    this.serviceStatus.failureCount++;
    this.saveServiceStatus();
  }

  // Public status methods
  getServiceStatus(): ServiceStatus {
    return { ...this.serviceStatus };
  }

  // Utility methods
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMockProducts(query: string): StoreProduct[] {
    const mockStores = ['Disco', 'Jumbo', 'Carrefour', 'Coto'];
    
    return mockStores.map((store, index) => ({
      id: `mock-${index}`,
      name: query,
      price: 100 + (index * 20),
      store,
      url: '#',
      image: undefined
    }));
  }

  // Public utility methods
  clearCache(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  getCacheStats(): { size: number; entries: string[]; totalSize: string } {
    if (typeof window === 'undefined') {
      return { size: 0, entries: [], totalSize: '0 KB' };
    }
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) {
        return { size: 0, entries: [], totalSize: '0 KB' };
      }
      
      const cache: Cache = JSON.parse(cacheData);
      const entries = Object.keys(cache);
      const totalSize = new Blob([cacheData]).size;
      
      return {
        size: entries.length,
        entries,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`
      };
    } catch (error: unknown) {
      return { size: 0, entries: [], totalSize: '0 KB' };
    }
  }

  // Batch search with optimizations
  async searchMultipleProducts(
    queries: string[], 
    options: SearchOptions = {}
  ): Promise<Map<string, StoreProduct[]>> {
    const results = new Map<string, StoreProduct[]>();
    const { onProgress } = options;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      onProgress?.(`Processing ${i + 1}/${queries.length}: ${query}`);
      
      try {
        const products = await this.searchProducts(query, options);
        results.set(query, products);
        
        // Small delay between requests to avoid rate limiting
        if (i < queries.length - 1) {
          await this.sleep(100);
        }
      } catch (error: unknown) {
        logger.error(`Error searching for ${query}:`, 'enhancedStoreScraper', error);
        results.set(query, []);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const enhancedStoreScraper = EnhancedStoreScraper.getInstance();