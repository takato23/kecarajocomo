/**
 * Price Comparator Service
 * Real-time price comparison with caching and optimization
 */

import { Store } from '@prisma/client';

import { PriceTracker, PriceComparison, StoreComparison } from './priceTracker';

interface CachedComparison {
  data: PriceComparison | StoreComparison[];
  timestamp: number;
  key: string;
}

interface OptimizedRoute {
  stores: Store[];
  totalDistance: number;
  estimatedTime: number;
  totalSavings: number;
}

export class PriceComparator {
  private priceTracker: PriceTracker;
  private cache: Map<string, CachedComparison>;
  private cacheTimeout: number = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    this.priceTracker = new PriceTracker();
    this.cache = new Map();
  }
  
  /**
   * Smart price comparison with caching
   */
  async compareWithCache(
    productName: string,
    quantity: number = 1,
    unit?: string
  ): Promise<PriceComparison | null> {
    const cacheKey = `product:${productName}:${quantity}:${unit || 'default'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as PriceComparison;
    }
    
    // Fetch fresh data
    const comparison = await this.priceTracker.compareProductPrices(productName, quantity, unit);
    
    // Cache the result
    if (comparison) {
      this.cache.set(cacheKey, {
        data: comparison,
        timestamp: Date.now(),
        key: cacheKey
      });
    }
    
    return comparison;
  }
  
  /**
   * Compare basket with smart grouping by store proximity
   */
  async compareBasketOptimized(
    items: { name: string; quantity: number; unit?: string }[],
    userLocation?: { lat: number; lng: number }
  ): Promise<{
    comparisons: StoreComparison[];
    optimizedRoute?: OptimizedRoute;
    totalPotentialSavings: number;
  }> {
    const cacheKey = `basket:${items.map(i => `${i.name}:${i.quantity}`).join(',')}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      const comparisons = cached.data as StoreComparison[];
      return {
        comparisons,
        totalPotentialSavings: this.calculateTotalSavings(comparisons)
      };
    }
    
    // Get fresh comparisons
    const comparisons = await this.priceTracker.compareBasketPrices(items);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: comparisons,
      timestamp: Date.now(),
      key: cacheKey
    });
    
    // Calculate optimized shopping route if location provided
    let optimizedRoute: OptimizedRoute | undefined;
    if (userLocation && comparisons.length > 0) {
      optimizedRoute = this.calculateOptimizedRoute(comparisons, userLocation);
    }
    
    const totalPotentialSavings = this.calculateTotalSavings(comparisons);
    
    return {
      comparisons,
      optimizedRoute,
      totalPotentialSavings
    };
  }
  
  /**
   * Find substitute products with better prices
   */
  async findSubstitutes(
    productName: string,
    maxPriceDifference: number = 20 // percentage
  ): Promise<PriceComparison[]> {
    const substitutes: PriceComparison[] = [];
    
    // Define substitute mappings
    const substituteMap: Record<string, string[]> = {
      'mantequilla': ['margarina', 'aceite de coco'],
      'azúcar': ['miel', 'stevia', 'azúcar morena'],
      'leche': ['leche de almendra', 'leche de soja', 'leche de avena'],
      'harina': ['harina integral', 'harina de almendra'],
      'pollo': ['pavo', 'tofu'],
      'carne molida': ['pavo molido', 'lentejas'],
      'pasta': ['pasta integral', 'espirales de calabacín'],
      'arroz': ['quinoa', 'couscous', 'arroz integral']
    };
    
    const normalizedProduct = productName.toLowerCase();
    const possibleSubstitutes = substituteMap[normalizedProduct] || [];
    
    // Get original product price
    const originalComparison = await this.priceTracker.compareProductPrices(productName);
    if (!originalComparison) return substitutes;
    
    const originalPrice = originalComparison.product.lowestPrice?.price || 0;
    
    // Check each substitute
    for (const substitute of possibleSubstitutes) {
      const substituteComparison = await this.priceTracker.compareProductPrices(substitute);
      if (!substituteComparison) continue;
      
      const substitutePrice = substituteComparison.product.lowestPrice?.price || 0;
      const priceDifference = ((substitutePrice - originalPrice) / originalPrice) * 100;
      
      if (Math.abs(priceDifference) <= maxPriceDifference) {
        substitutes.push(substituteComparison);
      }
    }
    
    // Sort by price (cheapest first)
    return substitutes.sort((a, b) => 
      (a.product.lowestPrice?.price || 0) - (b.product.lowestPrice?.price || 0)
    );
  }
  
  /**
   * Get personalized deals based on purchase history
   */
  async getPersonalizedDeals(
    userId: string,
    preferences?: {
      categories?: string[];
      brands?: string[];
      dietary?: string[];
    }
  ): Promise<PriceComparison[]> {
    // This would typically analyze user's purchase history
    // For now, we'll use preferences to filter deals
    
    const allDeals = await this.priceTracker.findDeals();
    
    if (!preferences) return allDeals.slice(0, 10);
    
    // Filter based on preferences
    const filteredDeals = allDeals.filter(deal => {
      const product = deal.product;
      
      // Category filter
      if (preferences.categories && preferences.categories.length > 0) {
        if (!preferences.categories.includes(product.category || '')) {
          return false;
        }
      }
      
      // Brand filter
      if (preferences.brands && preferences.brands.length > 0) {
        if (!preferences.brands.includes(product.brand || '')) {
          return false;
        }
      }
      
      // Dietary filter (would need dietary tags on products)
      // For now, we'll skip this
      
      return true;
    });
    
    return filteredDeals.slice(0, 10);
  }
  
  /**
   * Calculate total potential savings
   */
  private calculateTotalSavings(comparisons: StoreComparison[]): number {
    if (comparisons.length === 0) return 0;
    
    const minPrice = Math.min(...comparisons.map(c => c.totalPrice));
    const maxPrice = Math.max(...comparisons.map(c => c.totalPrice));
    
    return maxPrice - minPrice;
  }
  
  /**
   * Calculate optimized shopping route
   */
  private calculateOptimizedRoute(
    comparisons: StoreComparison[],
    userLocation: { lat: number; lng: number }
  ): OptimizedRoute {
    // This is a simplified version
    // In reality, you'd use a routing API like Google Maps
    
    // For now, let's just find the best combination of stores
    // that minimizes total cost while considering distance
    
    const maxStores = 3; // Visit at most 3 stores
    const bestStores = comparisons
      .slice(0, maxStores)
      .map(c => c.store);
    
    // Mock distance calculation
    const totalDistance = bestStores.length * 2.5; // km average
    const estimatedTime = totalDistance * 4; // minutes (15km/h average)
    
    const totalSavings = comparisons[0].savings;
    
    return {
      stores: bestStores,
      totalDistance,
      estimatedTime,
      totalSavings
    };
  }
  
  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheTimeout) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    oldestEntry: number;
    hitRate: number;
  } {
    let oldestTimestamp = Date.now();
    
    this.cache.forEach(entry => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });
    
    return {
      size: this.cache.size,
      oldestEntry: Date.now() - oldestTimestamp,
      hitRate: 0 // Would need to track hits/misses for this
    };
  }
}