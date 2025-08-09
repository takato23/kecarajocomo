/**
 * Price Tracker Service
 * Advanced price tracking and comparison engine
 */

import { PrismaClient, Store, Product, Price } from '@prisma/client';
import { logger } from '@/services/logger';

// import { normalizeIngredient } from '@/lib/parser'; // Commented out - not available

const prisma = new PrismaClient();

export interface PriceComparison {
  product: Product & {
    prices: (Price & { store: Store })[];
    lowestPrice?: {
      price: number;
      store: Store;
      priceId: string;
    };
    highestPrice?: {
      price: number;
      store: Store;
      priceId: string;
    };
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    savings: {
      amount: number;
      percentage: number;
    };
  };
}

export interface StoreComparison {
  store: Store;
  totalItems: number;
  totalPrice: number;
  savings: number;
  savingsPercentage: number;
  missingItems: string[];
  priceBreakdown: {
    productId: string;
    productName: string;
    price: number;
    unit: string;
  }[];
}

export interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  createdAt: Date;
}

export interface PriceTrend {
  productId: string;
  storeId: string;
  prices: {
    price: number;
    date: Date;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  forecast?: {
    nextWeek: number;
    confidence: number;
  };
}

export class PriceTracker {
  private alertThresholds = {
    significant: 0.15, // 15% change
    moderate: 0.10,    // 10% change
    minor: 0.05        // 5% change
  };
  
  /**
   * Compare prices across all stores for a single product
   */
  async compareProductPrices(
    productName: string,
    quantity: number = 1,
    unit?: string
  ): Promise<PriceComparison | null> {
    try {
      // Normalize the product name
      const normalized = normalizeIngredient(productName);
      
      // Find the product
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: normalized, mode: 'insensitive' } },
            { normalizedName: { contains: normalized, mode: 'insensitive' } }
          ]
        },
        include: { prices: true }, orderBy: { updatedAt: 'desc' }
      });
      
      if (!product || product.prices.length === 0) {
        return null;
      }
      
      // Calculate adjusted prices based on quantity
      const adjustedPrices = product.prices.map(price => ({
        ...price,
        adjustedPrice: this.calculateAdjustedPrice(price.price, price.unit, quantity, unit)
      }));
      
      // Find lowest and highest prices
      const sortedPrices = adjustedPrices.sort((a, b) => a.adjustedPrice - b.adjustedPrice);
      const lowestPrice = sortedPrices[0];
      const highestPrice = sortedPrices[sortedPrices.length - 1];
      
      // Calculate average price
      const averagePrice = adjustedPrices.reduce((sum, p) => sum + p.adjustedPrice, 0) / adjustedPrices.length;
      
      // Calculate potential savings
      const savings = {
        amount: highestPrice.adjustedPrice - lowestPrice.adjustedPrice,
        percentage: ((highestPrice.adjustedPrice - lowestPrice.adjustedPrice) / highestPrice.adjustedPrice) * 100
      };
      
      return {
        product: {
          ...product,
          lowestPrice: {
            price: lowestPrice.adjustedPrice,
            store: lowestPrice.store,
            priceId: lowestPrice.id
          },
          highestPrice: {
            price: highestPrice.adjustedPrice,
            store: highestPrice.store,
            priceId: highestPrice.id
          },
          averagePrice,
          priceRange: {
            min: lowestPrice.adjustedPrice,
            max: highestPrice.adjustedPrice
          },
          savings
        }
      };
    } catch (error: unknown) {
      logger.error('Error comparing product prices:', 'priceTracker', error);
      return null;
    }
  }
  
  /**
   * Compare total basket prices across stores
   */
  async compareBasketPrices(
    items: { name: string; quantity: number; unit?: string }[]
  ): Promise<StoreComparison[]> {
    try {
      // Get all active stores
      const stores = await prisma.store.findMany({
        where: { active: true }
      });
      
      const comparisons: StoreComparison[] = [];
      
      for (const store of stores) {
        const priceBreakdown: StoreComparison['priceBreakdown'] = [];
        const missingItems: string[] = [];
        let totalPrice = 0;
        
        for (const item of items) {
          const normalized = normalizeIngredient(item.name);
          
          // Find product price at this store
          const price = await prisma.price.findFirst({
            where: {
              storeId: store.id,
              active: true,
              product: {
                OR: [
                  { name: { contains: normalized, mode: 'insensitive' } },
                  { normalizedName: { contains: normalized, mode: 'insensitive' } }
                ]
              }
            },
            // includes handled by Supabase service,
            orderBy: {
              updatedAt: 'desc'
            }
          });
          
          if (price) {
            const adjustedPrice = this.calculateAdjustedPrice(
              price.price,
              price.unit,
              item.quantity,
              item.unit
            );
            
            totalPrice += adjustedPrice;
            priceBreakdown.push({
              productId: price.productId,
              productName: price.product.name,
              price: adjustedPrice,
              unit: price.unit
            });
          } else {
            missingItems.push(item.name);
          }
        }
        
        comparisons.push({
          store,
          totalItems: items.length - missingItems.length,
          totalPrice,
          savings: 0, // Will be calculated after all stores
          savingsPercentage: 0,
          missingItems,
          priceBreakdown
        });
      }
      
      // Calculate savings relative to most expensive option
      if (comparisons.length > 0) {
        const maxPrice = Math.max(...comparisons.map(c => c.totalPrice));
        
        comparisons.forEach(comparison => {
          comparison.savings = maxPrice - comparison.totalPrice;
          comparison.savingsPercentage = (comparison.savings / maxPrice) * 100;
        });
      }
      
      // Sort by total price (cheapest first)
      return comparisons.sort((a, b) => a.totalPrice - b.totalPrice);
    } catch (error: unknown) {
      logger.error('Error comparing basket prices:', 'priceTracker', error);
      return [];
    }
  }
  
  /**
   * Track price trends for a product
   */
  async getProductPriceTrends(
    productId: string,
    days: number = 30
  ): Promise<PriceTrend[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get all prices for the product within the date range
      const prices = await prisma.price.findMany({
        where: {
          productId,
          createdAt: { gte: startDate }
        },
        // includes handled by Supabase service,
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      // Group by store
      const storeGroups = prices.reduce((groups, price) => {
        if (!groups[price.storeId]) {
          groups[price.storeId] = [];
        }
        groups[price.storeId].push({
          price: price.price,
          date: price.createdAt
        });
        return groups;
      }, {} as Record<string, { price: number; date: Date }[]>);
      
      // Calculate trends for each store
      const trends: PriceTrend[] = [];
      
      for (const [storeId, storePrices] of Object.entries(storeGroups)) {
        if (storePrices.length < 2) continue;
        
        const firstPrice = storePrices[0].price;
        const lastPrice = storePrices[storePrices.length - 1].price;
        const changePercentage = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        let trend: PriceTrend['trend'] = 'stable';
        if (changePercentage > 5) trend = 'increasing';
        else if (changePercentage < -5) trend = 'decreasing';
        
        // Simple linear forecast
        const forecast = this.calculatePriceForecast(storePrices);
        
        trends.push({
          productId,
          storeId,
          prices: storePrices,
          trend,
          changePercentage,
          forecast
        });
      }
      
      return trends;
    } catch (error: unknown) {
      logger.error('Error getting price trends:', 'priceTracker', error);
      return [];
    }
  }
  
  /**
   * Set up price alerts
   */
  async createPriceAlert(
    productId: string,
    targetPrice: number,
    userId: string
  ): Promise<PriceAlert> {
    try {
      // Get current lowest price
      const prices = await prisma.price.findMany({
        where: {
          productId,
          active: true
        },
        orderBy: {
          price: 'asc'
        }
      });
      
      const currentPrice = prices[0]?.price || 0;
      const triggered = currentPrice <= targetPrice;
      
      // Here you would typically save this to a PriceAlert table
      // For now, we'll return a mock alert
      const alert: PriceAlert = {
        id: `alert_${Date.now()}`,
        productId,
        targetPrice,
        currentPrice,
        triggered,
        createdAt: new Date()
      };
      
      return alert;
    } catch (error: unknown) {
      logger.error('Error creating price alert:', 'priceTracker', error);
      throw error;
    }
  }
  
  /**
   * Find deals and promotions
   */
  async findDeals(
    category?: string,
    minDiscount: number = 10
  ): Promise<PriceComparison[]> {
    try {
      const deals: PriceComparison[] = [];
      
      // Get products with significant price variations
      const products = await prisma.product.findMany({
        where: category ? { category } : undefined,
        include: {
          prices: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
      
      for (const product of products) {
        if (product.prices.length < 2) continue;
        
        const comparison = await this.compareProductPrices(product.name);
        if (comparison && comparison.product.savings.percentage >= minDiscount) {
          deals.push(comparison);
        }
      }
      
      // Sort by savings percentage
      return deals.sort((a, b) => b.product.savings.percentage - a.product.savings.percentage);
    } catch (error: unknown) {
      logger.error('Error finding deals:', 'priceTracker', error);
      return [];
    }
  }
  
  /**
   * Calculate adjusted price based on units
   */
  private calculateAdjustedPrice(
    price: number,
    priceUnit: string,
    desiredQuantity: number,
    desiredUnit?: string
  ): number {
    // Simple unit conversion logic
    // In a real app, this would be more sophisticated
    const unitConversions: Record<string, Record<string, number>> = {
      kg: { g: 1000, lb: 2.20462 },
      g: { kg: 0.001, oz: 0.035274 },
      L: { ml: 1000, gal: 0.264172 },
      ml: { L: 0.001, fl_oz: 0.033814 }
    };
    
    let adjustedPrice = price * desiredQuantity;
    
    // If units are different, try to convert
    if (desiredUnit && priceUnit !== desiredUnit) {
      const conversion = unitConversions[priceUnit]?.[desiredUnit];
      if (conversion) {
        adjustedPrice = price * desiredQuantity * conversion;
      }
    }
    
    return adjustedPrice;
  }
  
  /**
   * Calculate simple price forecast
   */
  private calculatePriceForecast(
    prices: { price: number; date: Date }[]
  ): { nextWeek: number; confidence: number } | undefined {
    if (prices.length < 3) return undefined;
    
    // Simple linear regression
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices.map(p => p.price);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Forecast for next week (7 days ahead)
    const nextWeek = intercept + slope * (n + 7);
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (ssResidual / ssTotal);
    const confidence = Math.max(0, Math.min(1, rSquared));
    
    return {
      nextWeek: Math.max(0, nextWeek),
      confidence
    };
  }
}