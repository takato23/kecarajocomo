import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { EnhancedStoreScraper } from '../enhancedStoreScraper';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('EnhancedStoreScraper', () => {
  let scraper: EnhancedStoreScraper;
  
  beforeEach(() => {
    scraper = EnhancedStoreScraper.getInstance();
    mockFetch.mockClear();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('searchProducts', () => {
    it('should normalize query for better cache hits', async () => {
      const mockResponse = {
        products: [
          {
            id: '1',
            name: 'Leche Descremada',
            price: 100,
            store: 'Disco',
            url: 'https://disco.com/leche'
          }
        ],
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await scraper.searchProducts('LECHE   Descremada!!!');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('leche%20descremada')
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Leche Descremada');
    });

    it('should use cache when available', async () => {
      const mockResponse = {
        products: [
          {
            id: '1',
            name: 'Pan Integral',
            price: 150,
            store: 'Jumbo'
          }
        ],
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call - should hit API
      await scraper.searchProducts('pan integral');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const cachedResults = await scraper.searchProducts('pan integral');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
      expect(cachedResults).toHaveLength(1);
      expect(cachedResults[0].name).toBe('Pan Integral');
    });

    it('should handle flexible field mapping', async () => {
      const mockResponse = {
        products: [
          {
            title: 'Producto 1', // name field missing
            price: '100.50', // string price
            imagen: 'img1.jpg', // different image field
            tienda: 'carrefour' // different store field
          },
          {
            name: 'Producto 2',
            price: 200,
            img: 'img2.jpg',
            comercio: 'Coto'
          }
        ],
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await scraper.searchProducts('producto');
      
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Producto 1');
      expect(results[0].price).toBe(100.5);
      expect(results[0].image).toBe('img1.jpg');
      expect(results[0].store).toBe('Carrefour');
      
      expect(results[1].name).toBe('Producto 2');
      expect(results[1].store).toBe('Coto');
    });

    it('should implement retry with exponential backoff', async () => {
      // Fail twice, then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            products: [{ id: '1', name: 'Test', price: 100, store: 'Disco' }]
          })
        });

      const startTime = Date.now();
      const results = await scraper.searchProducts('test', {
        retryConfig: {
          maxRetries: 3,
          initialDelay: 100,
          maxDelay: 1000,
          factor: 2
        }
      });

      const elapsed = Date.now() - startTime;
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(1);
      expect(elapsed).toBeGreaterThan(150); // At least one retry delay
    });

    it('should detect and report warming up status', async () => {
      const status = scraper.getServiceStatus();
      expect(status.isWarmingUp).toBe(false); // Initially false

      // Simulate old last successful request
      const oldStatus = {
        isWarmingUp: false,
        lastSuccessfulRequest: Date.now() - 40 * 60 * 1000, // 40 minutes ago
        failureCount: 0,
        averageResponseTime: 0,
        responseTimes: []
      };
      
      localStorage.setItem('buscaprecios_status', JSON.stringify(oldStatus));
      
      // Create new instance to load status
      const newScraper = EnhancedStoreScraper.getInstance();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [] })
      });

      await newScraper.searchProducts('test');
      
      const newStatus = newScraper.getServiceStatus();
      expect(newStatus.isWarmingUp).toBe(false); // Should be false after successful request
    });

    it('should handle API errors gracefully with fallback', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      const results = await scraper.searchProducts('test', {
        retryConfig: { maxRetries: 0 }
      });

      expect(results).toHaveLength(4); // Mock products
      expect(results[0].id).toContain('mock');
    });
  });

  describe('groupProductsByVariation', () => {
    it('should group similar products correctly', () => {
      const products = [
        { id: '1', name: 'Leche Entera 1L', price: 100, store: 'Disco', url: '#' },
        { id: '2', name: 'Leche Entera 500ml', price: 60, store: 'Jumbo', url: '#' },
        { id: '3', name: 'Leche Descremada 1L', price: 110, store: 'Carrefour', url: '#' },
        { id: '4', name: 'Pan Integral', price: 150, store: 'Coto', url: '#' }
      ];

      const groups = scraper.groupProductsByVariation(products);
      
      expect(groups).toHaveLength(3); // 3 different base products
      
      const lecheEnteraGroup = groups.find(g => g.baseProduct.name.includes('Leche Entera'));
      expect(lecheEnteraGroup).toBeDefined();
      expect(lecheEnteraGroup!.variations).toHaveLength(1);
      expect(lecheEnteraGroup!.priceRange.min).toBe(60);
      expect(lecheEnteraGroup!.priceRange.max).toBe(100);
    });

    it('should select cheapest as base product', () => {
      const products = [
        { id: '1', name: 'Arroz 1kg', price: 200, store: 'Disco', url: '#' },
        { id: '2', name: 'Arroz 1kg', price: 180, store: 'Jumbo', url: '#' },
        { id: '3', name: 'Arroz 1kg', price: 190, store: 'Carrefour', url: '#' }
      ];

      const groups = scraper.groupProductsByVariation(products);
      
      expect(groups).toHaveLength(1);
      expect(groups[0].baseProduct.price).toBe(180); // Cheapest
      expect(groups[0].baseProduct.store).toBe('Jumbo');
    });
  });

  describe('Cache Management', () => {
    it('should clean up expired cache entries', async () => {
      const oldCache = {
        'query1': {
          timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes old
          data: []
        },
        'query2': {
          timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes old
          data: []
        }
      };

      localStorage.setItem('buscaprecios_cache', JSON.stringify(oldCache));
      
      // Create new instance to trigger cleanup
      const newScraper = EnhancedStoreScraper.getInstance();
      
      // Give cleanup time to run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const cache = JSON.parse(localStorage.getItem('buscaprecios_cache') || '{}');
      expect(Object.keys(cache)).toHaveLength(1);
      expect(cache['query2']).toBeDefined();
      expect(cache['query1']).toBeUndefined();
    });

    it('should provide accurate cache statistics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [{ id: '1', name: 'Test', price: 100, store: 'Disco' }]
        })
      });

      await scraper.searchProducts('test1');
      await scraper.searchProducts('test2');
      
      const stats = scraper.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('test1');
      expect(stats.entries).toContain('test2');
      expect(stats.totalSize).toMatch(/\d+\.\d+ KB/);
    });
  });

  describe('Service Status Tracking', () => {
    it('should track response times accurately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [{ id: '1', name: 'Test', price: 100, store: 'Disco' }]
        })
      });

      await scraper.searchProducts('test1');
      await scraper.searchProducts('test2');
      
      const status = scraper.getServiceStatus();
      
      expect(status.responseTimes).toHaveLength(2);
      expect(status.averageResponseTime).toBeGreaterThan(0);
      expect(status.failureCount).toBe(0);
      expect(status.lastSuccessfulRequest).toBeGreaterThan(0);
    });

    it('should track failure count', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      try {
        await scraper.searchProducts('test', {
          retryConfig: { maxRetries: 0 }
        });
      } catch {}

      const status = scraper.getServiceStatus();
      expect(status.failureCount).toBe(1);
    });
  });

  describe('Batch Operations', () => {
    it('should handle multiple product searches', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async (url) => {
        callCount++;
        const query = new URL(url).searchParams.get('q');
        return {
          ok: true,
          json: async () => ({
            products: [{
              id: `${callCount}`,
              name: query || 'Unknown',
              price: 100 * callCount,
              store: 'Disco'
            }]
          })
        };
      });

      const queries = ['leche', 'pan', 'arroz'];
      const results = await scraper.searchMultipleProducts(queries);
      
      expect(results.size).toBe(3);
      expect(results.get('leche')).toHaveLength(1);
      expect(results.get('pan')).toHaveLength(1);
      expect(results.get('arroz')).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle failures in batch operations', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ products: [{ id: '1', name: 'Leche', price: 100, store: 'Disco' }] })
        })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ products: [{ id: '3', name: 'Arroz', price: 150, store: 'Jumbo' }] })
        });

      const queries = ['leche', 'pan', 'arroz'];
      const results = await scraper.searchMultipleProducts(queries, {
        retryConfig: { maxRetries: 0 }
      });
      
      expect(results.size).toBe(3);
      expect(results.get('leche')).toHaveLength(1);
      expect(results.get('pan')).toHaveLength(0); // Failed, returns empty array
      expect(results.get('arroz')).toHaveLength(1);
    });
  });
});