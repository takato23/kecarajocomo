import { parserUtils } from '@/lib/parser/parserUtils';

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  store: string;
  url: string;
  barcode?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class StoreScraper {
  private static instance: StoreScraper;
  private cache = new Map<string, CacheEntry<StoreProduct[]>>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly API_URL = process.env.NEXT_PUBLIC_BUSCAPRECIOS_API || 'https://buscaprecios.onrender.com';

  private constructor() {}

  static getInstance(): StoreScraper {
    if (!StoreScraper.instance) {
      StoreScraper.instance = new StoreScraper();
    }
    return StoreScraper.instance;
  }

  async searchProducts(query: string): Promise<StoreProduct[]> {
    const normalizedQuery = parserUtils.simplifyIngredientQuery(query);
    const cacheKey = `search:${normalizedQuery}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await fetch(`${this.API_URL}/?q=${encodeURIComponent(normalizedQuery)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const products = this.normalizeProducts(data);
      
      this.saveToCache(cacheKey, products);
      return products;
    } catch (error: unknown) {
      console.error('Store scraping error:', error);
      return this.getMockProducts(normalizedQuery);
    }
  }

  async getProductByBarcode(barcode: string): Promise<StoreProduct | null> {
    const cacheKey = `barcode:${barcode}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached && cached.length > 0) {
      return cached[0];
    }
    
    // In real implementation, would call barcode API
    // For now, return null
    return null;
  }

  async searchMultipleProducts(queries: string[]): Promise<Map<string, StoreProduct[]>> {
    const results = new Map<string, StoreProduct[]>();
    
    // Batch process with slight delays to avoid rate limiting
    for (const query of queries) {
      try {
        const products = await this.searchProducts(query);
        results.set(query, products);
        
        // Small delay between requests
        if (queries.indexOf(query) < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: unknown) {
        console.error(`Error searching for ${query}:`, error);
        results.set(query, []);
      }
    }
    
    return results;
  }

  private normalizeProducts(data: any): StoreProduct[] {
    if (!Array.isArray(data)) {
      console.warn('Invalid API response format');
      return [];
    }
    
    return data.map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.nombre || item.name || 'Unknown Product',
      price: parseFloat(item.precio || item.price || 0),
      image: item.imagen || item.image || null,
      store: this.normalizeStoreName(item.tienda || item.store || 'Unknown'),
      url: item.url || '',
      barcode: item.barcode || item.codigo_barra
    })).filter(p => p.price > 0); // Filter out invalid products
  }

  private normalizeStoreName(store: string): string {
    const normalizations: Record<string, string> = {
      'disco': 'Disco',
      'jumbo': 'Jumbo',
      'carrefour': 'Carrefour',
      'coto': 'Coto',
      'dia': 'Día',
      'vea': 'Vea',
      'walmart': 'Walmart',
      'makro': 'Makro',
      'vital': 'Vital',
      'la anonima': 'La Anónima'
    };
    
    const lower = store.toLowerCase().trim();
    return normalizations[lower] || store;
  }

  private getFromCache(key: string): StoreProduct[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private saveToCache(key: string, data: StoreProduct[]) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  private getMockProducts(query: string): StoreProduct[] {
    // Fallback mock data for development/errors
    const mockStores = ['Disco', 'Jumbo', 'Carrefour', 'Coto'];
    
    return mockStores.map((store, index) => ({
      id: `mock-${index}`,
      name: query,
      price: 100 + (index * 20),
      store,
      url: '#',
      image: null
    }));
  }

  // Clear cache method for maintenance
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const storeScraper = StoreScraper.getInstance();