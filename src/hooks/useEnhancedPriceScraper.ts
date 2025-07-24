import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

import { enhancedStoreScraper, StoreProduct, ProductGroup } from '@/lib/services/enhancedStoreScraper';

export interface ScraperState {
  isLoading: boolean;
  isWarmingUp: boolean;
  error: string | null;
  progress: string | null;
  products: StoreProduct[];
  productGroups: ProductGroup[];
  cacheHit: boolean;
  responseTime: number;
}

export interface UseEnhancedPriceScraperOptions {
  useCache?: boolean;
  groupProducts?: boolean;
  showNotifications?: boolean;
  onSuccess?: (products: StoreProduct[]) => void;
  onError?: (error: Error) => void;
}

export function useEnhancedPriceScraper(options: UseEnhancedPriceScraperOptions = {}) {
  const {
    useCache = true,
    groupProducts = false,
    showNotifications = true,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<ScraperState>({
    isLoading: false,
    isWarmingUp: false,
    error: null,
    progress: null,
    products: [],
    productGroups: [],
    cacheHit: false,
    responseTime: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  // Search for products with enhanced error handling
  const searchProducts = useCallback(async (query: string) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: null,
      products: [],
      productGroups: [],
      cacheHit: false,
      responseTime: 0
    }));

    startTimeRef.current = Date.now();
    abortControllerRef.current = new AbortController();

    try {
      // Check service status
      const status = enhancedStoreScraper.getServiceStatus();
      if (status.isWarmingUp) {
        setState(prev => ({ ...prev, isWarmingUp: true }));
        if (showNotifications) {
          toast.info('El servicio se está iniciando, esto puede tardar un momento...');
        }
      }

      // Search products
      const products = await enhancedStoreScraper.searchProducts(query, {
        useCache,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
        },
        timeout: 30000
      });

      const responseTime = Date.now() - startTimeRef.current;

      // Group products if requested
      let productGroups: ProductGroup[] = [];
      if (groupProducts && products.length > 0) {
        productGroups = enhancedStoreScraper.groupProductsByVariation(products);
      }

      // Update state with results
      setState(prev => ({
        ...prev,
        isLoading: false,
        isWarmingUp: false,
        products,
        productGroups,
        responseTime,
        cacheHit: responseTime < 100, // Assume cache hit if very fast
        error: null,
        progress: null
      }));

      // Show success notification
      if (showNotifications && products.length > 0) {
        const message = prev.cacheHit 
          ? `Se encontraron ${products.length} productos (desde caché)`
          : `Se encontraron ${products.length} productos`;
        toast.success(message);
      }

      // Call success callback
      onSuccess?.(products);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isWarmingUp: false,
        error: errorMessage,
        progress: null
      }));

      // Show error notification
      if (showNotifications) {
        toast.error('Error al buscar productos', {
          description: errorMessage
        });
      }

      // Call error callback
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      abortControllerRef.current = null;
    }
  }, [useCache, groupProducts, showNotifications, onSuccess, onError]);

  // Search multiple products in batch
  const searchMultipleProducts = useCallback(async (queries: string[]) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: null
    }));

    try {
      const results = await enhancedStoreScraper.searchMultipleProducts(queries, {
        useCache,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      });

      // Flatten all results
      const allProducts: StoreProduct[] = [];
      results.forEach((products) => {
        allProducts.push(...products);
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        products: allProducts,
        error: null,
        progress: null
      }));

      if (showNotifications) {
        toast.success(`Se buscaron ${queries.length} productos`);
      }

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      if (showNotifications) {
        toast.error('Error al buscar múltiples productos');
      }

      throw error;
    }
  }, [useCache, showNotifications]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return enhancedStoreScraper.getCacheStats();
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    enhancedStoreScraper.clearCache();
    if (showNotifications) {
      toast.success('Caché limpiado exitosamente');
    }
  }, [showNotifications]);

  // Get service status
  const getServiceStatus = useCallback(() => {
    return enhancedStoreScraper.getServiceStatus();
  }, []);

  // Cancel ongoing request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: null
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    searchProducts,
    searchMultipleProducts,
    getCacheStats,
    clearCache,
    getServiceStatus,
    cancel
  };
}

// Specialized hook for product comparison
export function usePriceComparison(productName: string, options: UseEnhancedPriceScraperOptions = {}) {
  const scraper = useEnhancedPriceScraper({ ...options, groupProducts: true });
  
  useEffect(() => {
    if (productName) {
      scraper.searchProducts(productName);
    }
  }, [productName]);

  const getCheapestStore = useCallback(() => {
    if (scraper.products.length === 0) return null;
    
    return scraper.products.reduce((cheapest, current) => 
      current.price < cheapest.price ? current : cheapest
    );
  }, [scraper.products]);

  const getPriceRange = useCallback(() => {
    if (scraper.products.length === 0) return null;
    
    const prices = scraper.products.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  }, [scraper.products]);

  const getStoreComparison = useCallback(() => {
    const storeMap = new Map<string, StoreProduct[]>();
    
    scraper.products.forEach(product => {
      if (!storeMap.has(product.store)) {
        storeMap.set(product.store, []);
      }
      storeMap.get(product.store)!.push(product);
    });
    
    return Array.from(storeMap.entries()).map(([store, products]) => ({
      store,
      productCount: products.length,
      avgPrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
      products
    }));
  }, [scraper.products]);

  return {
    ...scraper,
    cheapestStore: getCheapestStore(),
    priceRange: getPriceRange(),
    storeComparison: getStoreComparison()
  };
}