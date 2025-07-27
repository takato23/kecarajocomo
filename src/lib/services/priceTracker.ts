import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '@/services/logger';

import { db } from '@/lib/supabase/database.service';

export interface PriceInfo {
  productId: string;
  storeId: string;
  storeName?: string;
  price: number;
  recordedAt: Date;
}

export interface PriceTrend {
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface ProductWithLowestPrice {
  productId: string;
  productName: string;
  lowestPrice: number;
  store: string;
  savings: number; // compared to average
}

export class PriceTracker {
  private static instance: PriceTracker;
  
  private constructor() {}
  
  static getInstance(): PriceTracker {
    if (!PriceTracker.instance) {
      PriceTracker.instance = new PriceTracker();
    }
    return PriceTracker.instance;
  }

  async trackPrice(
    productId: string, 
    storeId: string, 
    price: number,
    source: 'scraper' | 'manual' | 'receipt' = 'scraper'
  ): Promise<void> {
    try {
      await prisma.priceHistory.create({
        { productId,
          storeId,
          price: new Decimal(price),
          source
        }
      });
    } catch (error: unknown) {
      logger.error('Error tracking price:', 'priceTracker', error);
      throw error;
    }
  }

  async trackPrices(prices: Array<{
    productId: string;
    storeId: string;
    price: number;
    source?: 'scraper' | 'manual' | 'receipt';
  }>): Promise<void> {
    try {
      await prisma.priceHistory.createMany({
        data: prices.map(p => ({
          productId: p.productId,
          storeId: p.storeId,
          price: new Decimal(p.price),
          source: p.source || 'scraper'
        }))
      });
    } catch (error: unknown) {
      logger.error('Error tracking multiple prices:', 'priceTracker', error);
      throw error;
    }
  }

  async getPriceHistory(productId: string, days: number = 30): Promise<PriceInfo[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    try {
      const history = await prisma.priceHistory.findMany({
        where: {
          productId,
          recordedAt: { gte: since }
        },
        orderBy: { recordedAt: 'desc' },
        // includes handled by Supabase service
      });
      
      return history.map(h => ({
        productId: h.productId,
        storeId: h.storeId,
        storeName: h.store.name,
        price: h.price.toNumber(),
        recordedAt: h.recordedAt
      }));
    } catch (error: unknown) {
      logger.error('Error fetching price history:', 'priceTracker', error);
      return [];
    }
  }

  async getLowestPrice(productId: string): Promise<PriceInfo | null> {
    const recent = await this.getPriceHistory(productId, 7);
    
    if (recent.length === 0) return null;
    
    return recent.reduce((lowest, current) => 
      current.price < lowest.price ? current : lowest
    );
  }

  async getLowestPrices(productIds: string[]): Promise<Map<string, PriceInfo>> {
    const lowestPrices = new Map<string, PriceInfo>();
    
    // Batch fetch for efficiency
    const since = new Date();
    since.setDate(since.getDate() - 7);
    
    try {
      const history = await prisma.priceHistory.findMany({
        where: {
          productId: { in: productIds },
          recordedAt: { gte: since }
        },
        // includes handled by Supabase service,
        orderBy: { price: 'asc' }
      });
      
      // Group by product and get lowest for each
      history.forEach(h => {
        const productId = h.productId;
        if (!lowestPrices.has(productId)) {
          lowestPrices.set(productId, {
            productId: h.productId,
            storeId: h.storeId,
            storeName: h.store.name,
            price: h.price.toNumber(),
            recordedAt: h.recordedAt
          });
        }
      });
    } catch (error: unknown) {
      logger.error('Error fetching lowest prices:', 'priceTracker', error);
    }
    
    return lowestPrices;
  }

  async getPriceTrends(productId: string, days: number = 30): Promise<PriceTrend> {
    const history = await this.getPriceHistory(productId, days);
    
    if (history.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        percentageChange: 0
      };
    }
    
    const prices = history.map(h => h.price);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Calculate trend based on recent vs older prices
    const midPoint = Math.floor(history.length / 2);
    const recentPrices = history.slice(0, midPoint);
    const olderPrices = history.slice(midPoint);
    
    if (recentPrices.length === 0 || olderPrices.length === 0) {
      return {
        average,
        min,
        max,
        trend: 'stable',
        percentageChange: 0
      };
    }
    
    const recentAvg = recentPrices.reduce((a, b) => a + b.price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b.price, 0) / olderPrices.length;
    
    const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentageChange > 5) trend = 'up';
    else if (percentageChange < -5) trend = 'down';
    
    return {
      average,
      min,
      max,
      trend,
      percentageChange
    };
  }

  async compareStores(productId: string): Promise<Array<{
    store: string;
    averagePrice: number;
    lastPrice: number;
    priceCount: number;
  }>> {
    const history = await this.getPriceHistory(productId, 30);
    
    // Group by store
    const storeData = new Map<string, number[]>();
    history.forEach(h => {
      const storePrices = storeData.get(h.storeId) || [];
      storePrices.push(h.price);
      storeData.set(h.storeId, storePrices);
    });
    
    // Calculate stats per store
    const comparison = Array.from(storeData.entries()).map(([storeId, prices]) => {
      const storeName = history.find(h => h.storeId === storeId)?.storeName || storeId;
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const lastPrice = prices[0]; // Most recent
      
      return {
        store: storeName,
        averagePrice,
        lastPrice,
        priceCount: prices.length
      };
    });
    
    // Sort by average price
    return comparison.sort((a, b) => a.averagePrice - b.averagePrice);
  }

  async findPriceAlerts(userId: string, threshold: number = 20): Promise<Array<{
    productName: string;
    previousPrice: number;
    currentPrice: number;
    percentageChange: number;
    store: string;
  }>> {
    // This would check user's tracked products for significant price changes
    // For now, return empty array
    return [];
  }
}

// Export singleton instance
export const priceTracker = PriceTracker.getInstance();