import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

import { enhancedStoreScraper, StoreProduct } from '@/lib/services/enhancedStoreScraper';
import { parseMultipleIngredients, ParsedIngredient } from '@/lib/services/ingredientParser';

export interface PriceOptimizationResult {
  totalPrice: number;
  totalSavings: number;
  itemsWithPrices: Array<{
    ingredient: ParsedIngredient;
    cheapestOption: StoreProduct | null;
    allOptions: StoreProduct[];
    savings: number;
  }>;
  storeBreakdown: Array<{
    store: string;
    items: number;
    total: number;
  }>;
  missingItems: ParsedIngredient[];
}

export interface UsePriceIntegrationOptions {
  showNotifications?: boolean;
  useCache?: boolean;
}

export function usePriceIntegration(options: UsePriceIntegrationOptions = {}) {
  const {
    showNotifications = true,
    useCache = true
  } = options;

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<PriceOptimizationResult | null>(null);

  /**
   * Optimiza los precios de una lista de ingredientes
   */
  const optimizePrices = useCallback(async (ingredientList: string | string[]): Promise<PriceOptimizationResult> => {
    setIsOptimizing(true);
    
    try {
      // Parse ingredients
      const ingredients = typeof ingredientList === 'string' 
        ? parseMultipleIngredients(ingredientList)
        : ingredientList.flatMap(item => parseMultipleIngredients(item));

      if (showNotifications) {
        toast.info(`Buscando precios para ${ingredients.length} productos...`);
      }

      // Search prices for each ingredient
      const searchPromises = ingredients.map(async (ingredient) => {
        try {
          const products = await enhancedStoreScraper.searchProducts(ingredient.originalText, {
            useCache,
            onProgress: (status) => {
              if (showNotifications && status.includes('warming up')) {
                toast.info('El servicio se está iniciando, esto puede tardar un momento...');
              }
            }
          });

          return {
            ingredient,
            products
          };
        } catch (error: unknown) {
          logger.error(`Error searching for ${ingredient.simplifiedQuery}:`, 'usePriceIntegration', error);
          return {
            ingredient,
            products: []
          };
        }
      });

      const results = await Promise.all(searchPromises);

      // Process results
      const itemsWithPrices: PriceOptimizationResult['itemsWithPrices'] = [];
      const missingItems: ParsedIngredient[] = [];
      const storeMap = new Map<string, { items: number; total: number }>();
      let totalPrice = 0;
      let totalSavings = 0;

      results.forEach(({ ingredient, products }) => {
        if (products.length === 0) {
          missingItems.push(ingredient);
          return;
        }

        // Find cheapest option
        const cheapestOption = products.reduce((min, product) => 
          product.price < min.price ? product : min
        );

        // Calculate savings (difference between most expensive and cheapest)
        const mostExpensive = Math.max(...products.map(p => p.price));
        const savings = mostExpensive - cheapestOption.price;

        // Apply quantity if specified
        const quantity = ingredient.quantity || 1;
        const itemTotal = cheapestOption.price * quantity;
        totalPrice += itemTotal;
        totalSavings += savings * quantity;

        // Update store breakdown
        const storeData = storeMap.get(cheapestOption.store) || { items: 0, total: 0 };
        storeData.items += 1;
        storeData.total += itemTotal;
        storeMap.set(cheapestOption.store, storeData);

        itemsWithPrices.push({
          ingredient,
          cheapestOption,
          allOptions: products,
          savings: savings * quantity
        });
      });

      // Convert store map to array
      const storeBreakdown = Array.from(storeMap.entries())
        .map(([store, data]) => ({
          store,
          items: data.items,
          total: data.total
        }))
        .sort((a, b) => b.total - a.total);

      const result: PriceOptimizationResult = {
        totalPrice,
        totalSavings,
        itemsWithPrices,
        storeBreakdown,
        missingItems
      };

      setLastOptimization(result);

      if (showNotifications) {
        if (missingItems.length > 0) {
          toast.warning(`No se encontraron precios para ${missingItems.length} productos`);
        }
        
        toast.success(
          `Optimización completa: $${totalPrice.toFixed(2)} total, ahorraste $${totalSavings.toFixed(2)}`
        );
      }

      return result;
    } catch (error: unknown) {
      logger.error('Price optimization error:', 'usePriceIntegration', error);
      if (showNotifications) {
        toast.error('Error al optimizar precios');
      }
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, [useCache, showNotifications]);

  /**
   * Encuentra la mejor tienda para comprar todos los productos
   */
  const findBestStore = useCallback(async (ingredientList: string | string[]): Promise<{
    store: string;
    totalPrice: number;
    availability: number;
    missingItems: string[];
  } | null> => {
    try {
      const optimization = await optimizePrices(ingredientList);
      
      // Group products by store
      const storeProducts = new Map<string, {
        available: Set<string>;
        totalPrice: number;
      }>();

      optimization.itemsWithPrices.forEach(({ ingredient, allOptions }) => {
        allOptions.forEach(product => {
          if (!storeProducts.has(product.store)) {
            storeProducts.set(product.store, {
              available: new Set(),
              totalPrice: 0
            });
          }
          
          const storeData = storeProducts.get(product.store)!;
          storeData.available.add(ingredient.simplifiedQuery);
          
          // Add price with quantity
          const quantity = ingredient.quantity || 1;
          storeData.totalPrice += product.price * quantity;
        });
      });

      // Find store with best availability and price
      let bestStore: { store: string; totalPrice: number; availability: number; missingItems: string[] } | null = null;
      const totalItems = optimization.itemsWithPrices.length + optimization.missingItems.length;

      storeProducts.forEach((data, store) => {
        const availability = data.available.size / totalItems;
        const missingItems = optimization.itemsWithPrices
          .filter(({ ingredient }) => !data.available.has(ingredient.simplifiedQuery))
          .map(({ ingredient }) => ingredient.productName);

        if (!bestStore || 
            (availability > bestStore.availability) || 
            (availability === bestStore.availability && data.totalPrice < bestStore.totalPrice)) {
          bestStore = {
            store,
            totalPrice: data.totalPrice,
            availability,
            missingItems
          };
        }
      });

      return bestStore;
    } catch (error: unknown) {
      logger.error('Error finding best store:', 'usePriceIntegration', error);
      return null;
    }
  }, [optimizePrices]);

  /**
   * Genera una ruta optimizada de compras considerando múltiples tiendas
   */
  const generateShoppingRoute = useCallback(async (
    ingredientList: string | string[],
    maxStores: number = 2
  ): Promise<Array<{
    store: string;
    items: Array<{ ingredient: ParsedIngredient; product: StoreProduct }>;
    total: number;
  }>> => {
    try {
      const optimization = await optimizePrices(ingredientList);
      
      // Algorithm to minimize stores while keeping costs low
      const route: Array<{
        store: string;
        items: Array<{ ingredient: ParsedIngredient; product: StoreProduct }>;
        total: number;
      }> = [];

      const remainingItems = new Set(optimization.itemsWithPrices);
      const usedStores = new Set<string>();

      while (remainingItems.size > 0 && usedStores.size < maxStores) {
        let bestStore = '';
        let bestCoverage = 0;
        let bestTotal = Infinity;

        // Find store that covers most remaining items at lowest cost
        const storeCandidates = new Map<string, {
          items: Array<{ ingredient: ParsedIngredient; product: StoreProduct }>;
          total: number;
        }>();

        remainingItems.forEach(item => {
          item.allOptions.forEach(product => {
            if (usedStores.has(product.store)) return;

            if (!storeCandidates.has(product.store)) {
              storeCandidates.set(product.store, { items: [], total: 0 });
            }

            const storeData = storeCandidates.get(product.store)!;
            const quantity = item.ingredient.quantity || 1;
            
            // Check if this item is already in the store's list
            const existingItem = storeData.items.find(
              i => i.ingredient.simplifiedQuery === item.ingredient.simplifiedQuery
            );
            
            if (!existingItem) {
              storeData.items.push({ ingredient: item.ingredient, product });
              storeData.total += product.price * quantity;
            }
          });
        });

        // Select best store
        storeCandidates.forEach((data, store) => {
          const coverage = data.items.length;
          const avgPrice = data.total / coverage;
          
          if (coverage > bestCoverage || 
              (coverage === bestCoverage && avgPrice < bestTotal / bestCoverage)) {
            bestStore = store;
            bestCoverage = coverage;
            bestTotal = data.total;
          }
        });

        if (bestStore && storeCandidates.has(bestStore)) {
          const storeData = storeCandidates.get(bestStore)!;
          route.push({
            store: bestStore,
            items: storeData.items,
            total: storeData.total
          });

          // Remove covered items
          storeData.items.forEach(({ ingredient }) => {
            remainingItems.forEach(item => {
              if (item.ingredient.simplifiedQuery === ingredient.simplifiedQuery) {
                remainingItems.delete(item);
              }
            });
          });

          usedStores.add(bestStore);
        } else {
          break;
        }
      }

      if (showNotifications) {
        const totalStores = route.length;
        const totalPrice = route.reduce((sum, store) => sum + store.total, 0);
        toast.success(
          `Ruta optimizada: ${totalStores} tienda${totalStores > 1 ? 's' : ''}, $${totalPrice.toFixed(2)} total`
        );
      }

      return route;
    } catch (error: unknown) {
      logger.error('Error generating shopping route:', 'usePriceIntegration', error);
      return [];
    }
  }, [optimizePrices, showNotifications]);

  return {
    isOptimizing,
    lastOptimization,
    optimizePrices,
    findBestStore,
    generateShoppingRoute
  };
}