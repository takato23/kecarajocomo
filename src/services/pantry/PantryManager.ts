import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/types/database';

import type { HolisticFoodSystem } from '../core/HolisticSystem';
import type { ScannedItem } from '../scanner/ReceiptScanner';

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
  
  constructor(private system: HolisticFoodSystem) {
    this.supabase = createClientComponentClient<Database>();
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
      
      // Calcular valor estimado
      stats.estimatedValue = items.reduce((total, item) => {
        // TODO: Obtener precio promedio del ingrediente
        return total + (item.quantity * 100); // Placeholder
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
        return existing;
      }
      
      // Crear nuevo ingrediente
      const { data: newIngredient, error: createError } = await this.supabase
        .from('ingredients')
        .insert({
          name: item.name,
          name_normalized: normalized,
          category: item.category || 'Sin categoría',
          common_units: JSON.stringify([item.unit]),
          average_price: item.price,
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
   * Obtener sugerencias de compra basadas en uso
   */
  async getShoppingSuggestions(userId: string): Promise<Array<{
    name: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedQuantity: number;
  }>> {
    try {
      const items = await this.getPantryItems(userId);
      const suggestions = [];
      
      // Items expirados o por expirar
      const expiredOrExpiring = items.filter(
        i => i.status === 'expired' || i.status === 'expiring_soon'
      );
      
      for (const item of expiredOrExpiring) {
        suggestions.push({
          name: item.name,
          reason: item.status === 'expired' ? 'Producto vencido' : 'Próximo a vencer',
          priority: 'high' as const,
          estimatedQuantity: this.estimateRepurchaseQuantity(item)
        });
      }
      
      // Items con stock bajo
      const lowStock = items.filter(i => i.status === 'low_stock');
      
      for (const item of lowStock) {
        suggestions.push({
          name: item.name,
          reason: 'Stock bajo',
          priority: 'medium' as const,
          estimatedQuantity: this.estimateRepurchaseQuantity(item)
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
}

// Singleton
let pantryManager: PantryManager | null = null;

export function getPantryManager(system: HolisticFoodSystem): PantryManager {
  if (!pantryManager) {
    pantryManager = new PantryManager(system);
  }
  return pantryManager;
}