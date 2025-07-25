import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/types/database';

import type { HolisticFoodSystem } from '../core/HolisticSystem';
import type { ScannedItem } from '../scanner/ReceiptScanner';
import { getIngredientPriceService } from '../pricing/ingredientPriceService';

export interface PantryItem {
  id: string;
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  purchase_date: Date;
  expiration_date: Date | null;
  status: 'fresh' | 'expiring_soon' | 'expired' | 'low_stock';
  location: 'fridge' | 'freezer' | 'pantry' | 'other';
  category?: string;
  brand?: string;
  usage_history: Array<{
    date: Date;
    quantity: number;
    reason: string;
  }>;
}

export interface PantryStats {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  lowStockItems: number;
  estimatedValue: number;
  mostUsedCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Gestor Inteligente de Despensa con ML
 */
export class PantryManager {
  private supabase;
  private priceService;
  
  constructor(private system: HolisticFoodSystem) {
    this.supabase = createClientComponentClient<Database>();
    this.priceService = getIngredientPriceService();
  }
  
  /**
   * Agregar items desde ticket escaneado
   */
  async addItemsFromReceipt(
    scannedItems: ScannedItem[],
    userId: string,
    purchaseDate: Date = new Date()
  ): Promise<PantryItem[]> {
    try {

      const pantryItems: PantryItem[] = [];
      
      for (const item of scannedItems) {
        // 1. Buscar o crear ingrediente en base de datos
        const ingredient = await this.findOrCreateIngredient(item);
        
        // 2. Calcular fecha de expiración estimada
        const expirationDate = this.estimateExpirationDate(
          item.name, 
          item.category,
          purchaseDate
        );
        
        // 3. Crear item en despensa
        const { data, error } = await this.supabase
          .from('pantry_items')
          .insert({
            user_id: userId,
            ingredient_id: ingredient.id,
            quantity: item.quantity,
            unit: item.unit,
            purchase_date: purchaseDate.toISOString(),
            expiration_date: expirationDate?.toISOString() || null,
            status: 'fresh',
            location: this.suggestLocation(item.category),
            usage_history: JSON.stringify([])
          })
          .select()
          .single();
          
        if (error) throw error;
        
        pantryItems.push({
          ...data,
          name: item.name,
          category: item.category,
          brand: item.brand,
          purchase_date: new Date(data.purchase_date),
          expiration_date: data.expiration_date ? new Date(data.expiration_date) : null,
          usage_history: []
        });
      }

      return pantryItems;
      
    } catch (error: unknown) {
      console.error('Error agregando items:', error);
      throw new Error('Error al agregar items a despensa');
    }
  }
  
  /**
   * Obtener items de despensa
   */
  async getPantryItems(userId: string, options?: {
    location?: string;
    status?: string;
    category?: string;
  }): Promise<PantryItem[]> {
    try {
      let query = this.supabase
        .from('pantry_items')
        .select(`
          *,
          ingredients (*)
        `)
        .eq('user_id', userId)
        .order('expiration_date', { ascending: true });
        
      if (options?.location) {
        query = query.eq('location', options.location);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Procesar y enriquecer items
      const enrichedItems = await Promise.all(
        data.map(async (item) => {
          const status = await this.calculateItemStatus(item);
          return {
            ...item,
            name: item.ingredients?.name || 'Desconocido',
            category: item.ingredients?.category,
            status,
            purchase_date: new Date(item.purchase_date),
            expiration_date: item.expiration_date ? new Date(item.expiration_date) : null,
            usage_history: JSON.parse(item.usage_history || '[]')
          };
        })
      );
      
      return enrichedItems;
      
    } catch (error: unknown) {
      console.error('Error obteniendo items:', error);
      throw new Error('Error al obtener items de despensa');
    }
  }
  
  /**
   * Actualizar cantidad de item
   */
  async updateItemQuantity(
    itemId: string,
    newQuantity: number,
    reason: string = 'manual_update'
  ): Promise<void> {
    try {
      // Obtener item actual
      const { data: currentItem, error: fetchError } = await this.supabase
        .from('pantry_items')
        .select('*')
        .eq('id', itemId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Actualizar historial de uso
      const usageHistory = JSON.parse(currentItem.usage_history || '[]');
      usageHistory.push({
        date: new Date().toISOString(),
        quantity: currentItem.quantity - newQuantity,
        reason
      });
      
      // Actualizar item
      const { error: updateError } = await this.supabase
        .from('pantry_items')
        .update({
          quantity: newQuantity,
          usage_history: JSON.stringify(usageHistory),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
        
      if (updateError) throw updateError;

    } catch (error: unknown) {
      console.error('Error actualizando cantidad:', error);
      throw new Error('Error al actualizar cantidad');
    }
  }
  
  /**
   * Eliminar item de despensa
   */
  async removeItem(itemId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('pantry_items')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;

    } catch (error: unknown) {
      console.error('Error eliminando item:', error);
      throw new Error('Error al eliminar item');
    }
  }
  
  /**
   * Obtener estadísticas de despensa
   */
  async getPantryStats(userId: string): Promise<PantryStats> {
    try {
      const items = await this.getPantryItems(userId);
      
      const stats: PantryStats = {
        totalItems: items.length,
        expiringItems: items.filter(i => i.status === 'expiring_soon').length,
        expiredItems: items.filter(i => i.status === 'expired').length,
        lowStockItems: items.filter(i => i.status === 'low_stock').length,
        estimatedValue: 0,
        mostUsedCategories: []
      };
      
      // Calcular valor estimado con precios reales
      const ingredientIds = items.map(item => item.ingredient_id);
      const prices = await this.priceService.getBatchPrices(ingredientIds);
      
      stats.estimatedValue = items.reduce((total, item) => {
        const price = prices.get(item.ingredient_id) || 0;
        return total + (item.quantity * price);
      }, 0);
      
      // Calcular categorías más usadas
      const categoryCount = new Map<string, number>();
      items.forEach(item => {
        const category = item.category || 'Sin categoría';
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
      
      stats.mostUsedCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / items.length) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return stats;
      
    } catch (error: unknown) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error('Error al obtener estadísticas');
    }
  }
  
  /**
   * Buscar o crear ingrediente
   */
  private async findOrCreateIngredient(item: ScannedItem) {
    try {
      // Normalizar nombre para búsqueda
      const normalized = this.normalizeIngredientName(item.name);
      
      // Buscar ingrediente existente
      const { data: existing, error: searchError } = await this.supabase
        .from('ingredients')
        .select('*')
        .eq('name_normalized', normalized)
        .single();
        
      if (!searchError && existing) {
        // Update price if we have a new one from the receipt
        if (item.price && item.price > 0) {
          await this.updateIngredientPrice(existing.id, item.price);
        }
        return existing;
      }
      
      // Crear nuevo ingrediente con precio inicial si está disponible
      const { data: newIngredient, error: createError } = await this.supabase
        .from('ingredients')
        .insert({
          name: item.name,
          name_normalized: normalized,
          category: item.category || 'Sin categoría',
          common_units: JSON.stringify([item.unit]),
          average_price: item.price || null, // Store price if available from receipt
          nutrition: JSON.stringify({})
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      return newIngredient;
      
    } catch (error: unknown) {
      console.error('Error con ingrediente:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar precio promedio del ingrediente
   */
  private async updateIngredientPrice(ingredientId: string, newPrice: number): Promise<void> {
    try {
      // Get current average price
      const { data: ingredient } = await this.supabase
        .from('ingredients')
        .select('average_price')
        .eq('id', ingredientId)
        .single();
        
      if (!ingredient) return;
      
      let updatedPrice = newPrice;
      
      // If there's an existing average, calculate weighted average
      if (ingredient.average_price && ingredient.average_price > 0) {
        // Weight recent prices more heavily (70% new, 30% old)
        updatedPrice = (newPrice * 0.7) + (ingredient.average_price * 0.3);
      }
      
      // Update the ingredient price
      await this.supabase
        .from('ingredients')
        .update({ 
          average_price: Math.round(updatedPrice),
          updated_at: new Date().toISOString()
        })
        .eq('id', ingredientId);
        
    } catch (error: unknown) {
      console.error('Error updating ingredient price:', error);
    }
  }
  
  /**
   * Normalizar nombre de ingrediente
   */
  private normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  }
  
  /**
   * Estimar fecha de expiración
   */
  private estimateExpirationDate(
    name: string, 
    category?: string,
    purchaseDate: Date = new Date()
  ): Date | null {
    // Base de conocimiento de vida útil por categoría
    const shelfLife: Record<string, number> = {
      'lácteos': 7,
      'carnes': 3,
      'pescados': 2,
      'verduras': 5,
      'frutas': 7,
      'panadería': 3,
      'enlatados': 365,
      'bebidas': 180,
      'congelados': 90,
      'condimentos': 365,
      'cereales': 180,
      'pasta': 365,
      'snacks': 90
    };
    
    const categoryLower = category?.toLowerCase() || '';
    const days = shelfLife[categoryLower] || 30; // Default 30 días
    
    const expirationDate = new Date(purchaseDate);
    expirationDate.setDate(expirationDate.getDate() + days);
    
    return expirationDate;
  }
  
  /**
   * Sugerir ubicación basada en categoría
   */
  private suggestLocation(category?: string): PantryItem['location'] {
    const locationMap: Record<string, PantryItem['location']> = {
      'lácteos': 'fridge',
      'carnes': 'fridge',
      'pescados': 'fridge',
      'verduras': 'fridge',
      'frutas': 'fridge',
      'congelados': 'freezer',
      'helados': 'freezer',
      'enlatados': 'pantry',
      'cereales': 'pantry',
      'pasta': 'pantry',
      'condimentos': 'pantry'
    };
    
    const categoryLower = category?.toLowerCase() || '';
    return locationMap[categoryLower] || 'pantry';
  }
  
  /**
   * Calcular estado del item
   */
  private async calculateItemStatus(item: any): Promise<PantryItem['status']> {
    // Si no hay fecha de expiración, basarse en cantidad
    if (!item.expiration_date) {
      return item.quantity < 2 ? 'low_stock' : 'fresh';
    }
    
    const now = new Date();
    const expiration = new Date(item.expiration_date);
    const daysUntilExpiration = Math.floor(
      (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiration < 0) {
      return 'expired';
    } else if (daysUntilExpiration <= 3) {
      return 'expiring_soon';
    } else if (item.quantity < 2) {
      return 'low_stock';
    }
    
    return 'fresh';
  }
  
  /**
   * Obtener información de precio de un item
   */
  async getItemPriceInfo(itemId: string): Promise<{
    currentPrice: number;
    averagePrice: number;
    lowestPrice?: number;
    highestPrice?: number;
    pricePerUnit: number;
    totalValue: number;
  } | null> {
    try {
      const { data: item, error } = await this.supabase
        .from('pantry_items')
        .select('*, ingredients(*)')
        .eq('id', itemId)
        .single();
        
      if (error || !item) return null;
      
      const priceInfo = await this.priceService.getDetailedPriceInfo(item.ingredient_id);
      
      return {
        currentPrice: priceInfo.averagePrice,
        averagePrice: priceInfo.averagePrice,
        lowestPrice: priceInfo.lowestPrice,
        highestPrice: priceInfo.highestPrice,
        pricePerUnit: priceInfo.pricePerUnit,
        totalValue: priceInfo.averagePrice * item.quantity
      };
      
    } catch (error: unknown) {
      console.error('Error getting item price info:', error);
      return null;
    }
  }
  
  /**
   * Obtener sugerencias de compra basadas en uso
   */
  async getShoppingSuggestions(userId: string): Promise<Array<{
    name: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedQuantity: number;
    estimatedPrice?: number;
  }>> {
    try {
      const items = await this.getPantryItems(userId);
      const suggestions = [];
      
      // Items expirados o por expirar
      const expiredOrExpiring = items.filter(
        i => i.status === 'expired' || i.status === 'expiring_soon'
      );
      
      // Get prices for all items
      const ingredientIds = [...expiredOrExpiring, ...items.filter(i => i.status === 'low_stock')]
        .map(item => item.ingredient_id);
      const prices = await this.priceService.getBatchPrices(ingredientIds);
      
      for (const item of expiredOrExpiring) {
        const quantity = this.estimateRepurchaseQuantity(item);
        const pricePerUnit = prices.get(item.ingredient_id) || 0;
        
        suggestions.push({
          name: item.name,
          reason: item.status === 'expired' ? 'Producto vencido' : 'Próximo a vencer',
          priority: 'high' as const,
          estimatedQuantity: quantity,
          estimatedPrice: quantity * pricePerUnit
        });
      }
      
      // Items con stock bajo
      const lowStock = items.filter(i => i.status === 'low_stock');
      
      for (const item of lowStock) {
        const quantity = this.estimateRepurchaseQuantity(item);
        const pricePerUnit = prices.get(item.ingredient_id) || 0;
        
        suggestions.push({
          name: item.name,
          reason: 'Stock bajo',
          priority: 'medium' as const,
          estimatedQuantity: quantity,
          estimatedPrice: quantity * pricePerUnit
        });
      }
      
      // TODO: Agregar predicciones basadas en patrones de uso
      
      return suggestions;
      
    } catch (error: unknown) {
      console.error('Error generando sugerencias:', error);
      return [];
    }
  }
  
  /**
   * Estimar cantidad de recompra
   */
  private estimateRepurchaseQuantity(item: PantryItem): number {
    // Analizar historial de uso
    const avgUsage = item.usage_history.reduce(
      (sum, use) => sum + use.quantity, 0
    ) / Math.max(item.usage_history.length, 1);
    
    // Recomendar para 2 semanas de uso promedio
    return Math.ceil(avgUsage * 14) || item.quantity || 1;
  }
  
  /**
   * Obtener tendencia del valor de la despensa
   */
  async getPantryValueTrend(userId: string, days: number = 30): Promise<{
    dates: string[];
    values: number[];
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
  }> {
    try {
      // Get pantry items with their history
      const items = await this.getPantryItems(userId);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Create daily snapshots
      const dailyValues = new Map<string, number>();
      const currentDate = new Date(startDate);
      
      // Get current prices for all ingredients
      const ingredientIds = items.map(item => item.ingredient_id);
      const prices = await this.priceService.getBatchPrices(ingredientIds);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let dailyValue = 0;
        
        // Calculate value for this date
        items.forEach(item => {
          const purchaseDate = new Date(item.purchase_date);
          
          // Only count items that were in pantry on this date
          if (purchaseDate <= currentDate) {
            const price = prices.get(item.ingredient_id) || 0;
            
            // Adjust quantity based on usage history
            let quantity = item.quantity;
            item.usage_history.forEach(usage => {
              const usageDate = new Date(usage.date);
              if (usageDate <= currentDate) {
                quantity += usage.quantity; // usage quantities are negative
              }
            });
            
            if (quantity > 0) {
              dailyValue += quantity * price;
            }
          }
        });
        
        dailyValues.set(dateStr, dailyValue);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Convert to arrays
      const dates = Array.from(dailyValues.keys());
      const values = Array.from(dailyValues.values());
      
      // Calculate trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      let percentageChange = 0;
      
      if (values.length >= 2) {
        const firstValue = values[0] || 1;
        const lastValue = values[values.length - 1] || 1;
        percentageChange = ((lastValue - firstValue) / firstValue) * 100;
        
        if (percentageChange > 5) trend = 'increasing';
        else if (percentageChange < -5) trend = 'decreasing';
      }
      
      return {
        dates,
        values,
        trend,
        percentageChange
      };
      
    } catch (error: unknown) {
      console.error('Error getting pantry value trend:', error);
      return {
        dates: [],
        values: [],
        trend: 'stable',
        percentageChange: 0
      };
    }
  }
}

// Singleton
let pantryManager: PantryManager | null = null;

export function getPantryManager(system: HolisticFoodSystem): PantryManager {
  if (!pantryManager) {
    pantryManager = new PantryManager(system);
  }
  return pantryManager;
}