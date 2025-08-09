/**
 * Ingredient Price Service
 * Provides real-time and average pricing for ingredients
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logger } from '@/services/logger';

import type { Database } from '@/types/database';

export interface IngredientPriceInfo {
  ingredientId: string;
  averagePrice: number;
  lowestPrice?: number;
  highestPrice?: number;
  lastUpdated?: Date;
  pricePerUnit: number;
  unit: string;
}

export class IngredientPriceService {
  private supabase;
  private priceCache: Map<string, { price: IngredientPriceInfo; timestamp: number }>;
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    this.supabase = createClientComponentClient<Database>();
    this.priceCache = new Map();
  }
  
  /**
   * Get average price for an ingredient
   */
  async getIngredientPrice(ingredientId: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.priceCache.get(ingredientId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.price.averagePrice;
      }
      
      // First, check if the ingredient has an average_price set
      const { data: ingredient, error: ingredientError } = await this.supabase
        .from('ingredients')
        .select('average_price, name, category')
        .eq('id', ingredientId)
        .single();
        
      if (ingredientError) throw ingredientError;
      
      // If there's a stored average price, use it
      if (ingredient?.average_price) {
        this.updateCache(ingredientId, {
          ingredientId,
          averagePrice: ingredient.average_price,
          pricePerUnit: ingredient.average_price,
          unit: 'unidad'
        });
        return ingredient.average_price;
      }
      
      // Otherwise, calculate based on category and recent receipt data
      const estimatedPrice = await this.estimatePriceByCategory(
        ingredient?.category || 'general',
        ingredient?.name || ''
      );
      
      // Update the ingredient with the estimated price
      if (estimatedPrice > 0) {
        await this.supabase
          .from('ingredients')
          .update({ average_price: estimatedPrice })
          .eq('id', ingredientId);
      }
      
      this.updateCache(ingredientId, {
        ingredientId,
        averagePrice: estimatedPrice,
        pricePerUnit: estimatedPrice,
        unit: 'unidad'
      });
      
      return estimatedPrice;
      
    } catch (error) {
      logger.error('Error getting ingredient price:', 'ingredientPriceService', error);
      // Return a reasonable default based on category
      return this.getDefaultPriceByCategory(ingredientId);
    }
  }
  
  /**
   * Get price info with details (average, lowest, highest)
   */
  async getDetailedPriceInfo(ingredientId: string): Promise<IngredientPriceInfo> {
    try {
      // Check cache
      const cached = this.priceCache.get(ingredientId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.price;
      }
      
      // Get ingredient info
      const { data: ingredient } = await this.supabase
        .from('ingredients')
        .select('*')
        .eq('id', ingredientId)
        .single();
        
      if (!ingredient) {
        throw new Error('Ingredient not found');
      }
      
      // Calculate prices from recent receipts
      const priceData = await this.analyzePricesFromReceipts(
        ingredient.name,
        ingredient.name_normalized
      );
      
      const priceInfo: IngredientPriceInfo = {
        ingredientId,
        averagePrice: priceData.average || ingredient.average_price || 0,
        lowestPrice: priceData.lowest,
        highestPrice: priceData.highest,
        lastUpdated: new Date(),
        pricePerUnit: priceData.average || ingredient.average_price || 0,
        unit: 'unidad'
      };
      
      this.updateCache(ingredientId, priceInfo);
      
      return priceInfo;
      
    } catch (error) {
      logger.error('Error getting detailed price info:', 'ingredientPriceService', error);
      return {
        ingredientId,
        averagePrice: 0,
        pricePerUnit: 0,
        unit: 'unidad'
      };
    }
  }
  
  /**
   * Analyze prices from recent receipts
   */
  private async analyzePricesFromReceipts(
    name: string,
    normalizedName: string
  ): Promise<{ average: number; lowest?: number; highest?: number }> {
    try {
      // Get recent receipts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: receipts } = await this.supabase
        .from('scanned_receipts')
        .select('detected_items, purchase_date')
        .gte('purchase_date', thirtyDaysAgo.toISOString())
        .order('purchase_date', { ascending: false })
        .limit(100);
        
      if (!receipts || receipts.length === 0) {
        return { average: 0 };
      }
      
      // Extract prices for this ingredient
      const prices: number[] = [];
      
      receipts.forEach(receipt => {
        const items = receipt.detected_items as any[];
        if (Array.isArray(items)) {
          items.forEach(item => {
            // Match by name (case insensitive)
            if (
              item.name?.toLowerCase().includes(name.toLowerCase()) ||
              item.name?.toLowerCase().includes(normalizedName.toLowerCase())
            ) {
              if (item.price && item.price > 0) {
                prices.push(item.price);
              }
            }
          });
        }
      });
      
      if (prices.length === 0) {
        return { average: 0 };
      }
      
      // Calculate statistics
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const lowest = Math.min(...prices);
      const highest = Math.max(...prices);
      
      return { average, lowest, highest };
      
    } catch (error) {
      logger.error('Error analyzing receipt prices:', 'ingredientPriceService', error);
      return { average: 0 };
    }
  }
  
  /**
   * Estimate price based on category
   */
  private async estimatePriceByCategory(
    category: string,
    name: string
  ): Promise<number> {
    // Category-based price estimates (in your local currency)
    const categoryPrices: Record<string, number> = {
      'lácteos': 150,
      'carnes': 500,
      'pescados': 600,
      'verduras': 80,
      'frutas': 100,
      'panadería': 120,
      'enlatados': 180,
      'bebidas': 150,
      'congelados': 250,
      'condimentos': 200,
      'cereales': 220,
      'pasta': 180,
      'snacks': 150,
      'huevos': 300,
      'aceites': 400,
      'legumbres': 200,
      'general': 150
    };
    
    const categoryLower = category.toLowerCase();
    let basePrice = categoryPrices[categoryLower] || categoryPrices['general'];
    
    // Adjust based on specific items
    const premiumItems = ['orgánico', 'premium', 'importado', 'gourmet'];
    const budgetItems = ['genérico', 'económico', 'básico'];
    
    const nameLower = name.toLowerCase();
    if (premiumItems.some(item => nameLower.includes(item))) {
      basePrice *= 1.5;
    } else if (budgetItems.some(item => nameLower.includes(item))) {
      basePrice *= 0.7;
    }
    
    return Math.round(basePrice);
  }
  
  /**
   * Get default price by category (fallback)
   */
  private getDefaultPriceByCategory(ingredientId: string): number {
    // Simple fallback prices
    return 100; // Default price
  }
  
  /**
   * Update cache
   */
  private updateCache(ingredientId: string, price: IngredientPriceInfo): void {
    this.priceCache.set(ingredientId, {
      price,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }
  
  /**
   * Get multiple ingredient prices at once (batch)
   */
  async getBatchPrices(ingredientIds: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    
    // Check cache first for all items
    const uncachedIds: string[] = [];
    
    for (const id of ingredientIds) {
      const cached = this.priceCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        prices.set(id, cached.price.averagePrice);
      } else {
        uncachedIds.push(id);
      }
    }
    
    // Fetch uncached items
    if (uncachedIds.length > 0) {
      const { data: ingredients } = await this.supabase
        .from('ingredients')
        .select('id, average_price, category, name')
        .in('id', uncachedIds);
        
      if (ingredients) {
        for (const ingredient of ingredients) {
          const price = ingredient.average_price || 
            await this.estimatePriceByCategory(ingredient.category, ingredient.name);
            
          prices.set(ingredient.id, price);
          
          // Update cache
          this.updateCache(ingredient.id, {
            ingredientId: ingredient.id,
            averagePrice: price,
            pricePerUnit: price,
            unit: 'unidad'
          });
        }
      }
    }
    
    return prices;
  }
}

// Singleton instance
let ingredientPriceService: IngredientPriceService | null = null;

export function getIngredientPriceService(): IngredientPriceService {
  if (!ingredientPriceService) {
    ingredientPriceService = new IngredientPriceService();
  }
  return ingredientPriceService;
}