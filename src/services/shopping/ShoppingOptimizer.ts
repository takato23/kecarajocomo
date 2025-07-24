import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/types/database';

import type { HolisticFoodSystem } from '../core/HolisticSystem';
import type { MealPlan } from '../planner/MealPlanner';
import type { PantryItem } from '../pantry/PantryManager';
import { getGeminiService } from '../ai/GeminiService';
import { getProfileManager } from '../profile/ProfileManager';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedPrice: number;
  store?: string;
  aisle?: string;
  checked: boolean;
  priority: 'essential' | 'recommended' | 'optional';
  notes?: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  items: ShoppingItem[];
  totalEstimated: number;
  optimizedRoute?: StoreRoute[];
  relatedMealPlan?: string;
  status: 'active' | 'completed' | 'archived';
}

export interface StoreRoute {
  storeName: string;
  address?: string;
  items: ShoppingItem[];
  estimatedTotal: number;
  estimatedTime: number;
  aisleOrder: string[];
}

export interface OptimizationParams {
  budget?: number;
  preferredStores?: string[];
  optimizeFor: 'price' | 'time' | 'quality' | 'balanced';
  includeAlternatives?: boolean;
}

/**
 * Optimizador de Listas de Compras Inteligente
 */
export class ShoppingOptimizer {
  private supabase;
  private geminiService;
  private profileManager;
  
  constructor(private system: HolisticFoodSystem) {
    this.supabase = createClientComponentClient<Database>();
    this.geminiService = getGeminiService();
    this.profileManager = getProfileManager(system);
  }
  
  /**
   * Generar lista de compras inteligente desde plan de comidas
   */
  async generateSmartList(params: {
    mealPlan?: MealPlan;
    pantryItems: PantryItem[];
    budget?: number;
    userId: string;
    optimization?: OptimizationParams;
  }): Promise<ShoppingList> {
    try {

      // 0. Obtener perfil del usuario para restricciones y presupuesto
      const userProfile = await this.profileManager.getUserProfile(params.userId);
      const userBudget = params.budget || (userProfile?.monthlyBudget ? userProfile.monthlyBudget / 4 : 50000);
      
      // 1. Obtener items necesarios
      const requiredItems = params.mealPlan 
        ? this.extractItemsFromMealPlan(params.mealPlan)
        : await this.generateEssentialsList(params.pantryItems);
      
      // 2. Filtrar items que ya tenemos
      const neededItems = this.filterExistingItems(requiredItems, params.pantryItems);
      
      // 3. Filtrar items según restricciones dietéticas y alergias
      const safeItems = await this.filterByDietaryRestrictions(
        neededItems,
        userProfile?.dietaryRestrictions || [],
        userProfile?.allergies || []
      );
      
      // 4. Categorizar y priorizar
      const categorizedItems = await this.categorizeAndPrioritize(safeItems);
      
      // 5. Optimizar precios y tiendas con presupuesto del usuario
      const optimizedItems = await this.optimizeItemsWithAI(
        categorizedItems,
        {
          ...params.optimization,
          budget: userBudget,
          optimizeFor: params.optimization?.optimizeFor || 'balanced'
        }
      );
      
      // 6. Generar rutas optimizadas
      const optimizedRoutes = await this.generateOptimizedRoutes(
        optimizedItems,
        params.optimization?.preferredStores || userProfile?.preferredStores
      );
      
      // 7. Crear lista final
      const shoppingList: ShoppingList = {
        id: this.generateListId(),
        userId: params.userId,
        name: `Lista ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: optimizedItems,
        totalEstimated: this.calculateTotal(optimizedItems),
        optimizedRoute: optimizedRoutes,
        relatedMealPlan: params.mealPlan?.id,
        status: 'active'
      };
      
      // 8. Validar contra presupuesto
      if (shoppingList.totalEstimated > userBudget) {
        console.warn(`⚠️ Lista excede presupuesto: $${shoppingList.totalEstimated} > $${userBudget}`);
        // Marcar items opcionales si excede presupuesto
        this.adjustForBudget(shoppingList.items, userBudget);
      }
      
      // 9. Guardar en base de datos
      await this.saveList(shoppingList);

      return shoppingList;
      
    } catch (error: unknown) {
      console.error('Error generando lista:', error);
      throw new Error('Error al generar lista de compras');
    }
  }
  
  /**
   * Agregar item manual a la lista
   */
  async addItemToList(
    listId: string,
    item: Partial<ShoppingItem>
  ): Promise<ShoppingItem> {
    try {
      const newItem: ShoppingItem = {
        id: this.generateItemId(),
        name: item.name || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'unidad',
        category: item.category || 'Otros',
        estimatedPrice: item.estimatedPrice || 0,
        checked: false,
        priority: item.priority || 'recommended',
        notes: item.notes,
        ...item
      };
      
      // TODO: Actualizar en base de datos
      
      return newItem;
      
    } catch (error: unknown) {
      console.error('Error agregando item:', error);
      throw new Error('Error al agregar item');
    }
  }
  
  /**
   * Marcar item como comprado
   */
  async checkItem(listId: string, itemId: string, checked: boolean): Promise<void> {
    try {
      // TODO: Actualizar en base de datos

    } catch (error: unknown) {
      console.error('Error actualizando item:', error);
      throw error;
    }
  }
  
  /**
   * Obtener listas del usuario
   */
  async getUserLists(userId: string, status?: string): Promise<ShoppingList[]> {
    try {
      // TODO: Implementar query real
      // Por ahora retornamos lista vacía
      return [];
    } catch (error: unknown) {
      console.error('Error obteniendo listas:', error);
      return [];
    }
  }
  
  /**
   * Extraer items del plan de comidas
   */
  private extractItemsFromMealPlan(mealPlan: MealPlan): ShoppingItem[] {
    const itemsMap = new Map<string, ShoppingItem>();
    
    // Agregar items de la lista de compras del plan
    for (const item of mealPlan.shoppingList) {
      const key = item.ingredient.toLowerCase();
      
      if (itemsMap.has(key)) {
        const existing = itemsMap.get(key)!;
        existing.quantity += item.quantity;
      } else {
        itemsMap.set(key, {
          id: this.generateItemId(),
          name: item.ingredient,
          quantity: item.quantity,
          unit: item.unit,
          category: 'Sin categoría',
          estimatedPrice: item.estimatedCost || 0,
          checked: false,
          priority: 'essential'
        });
      }
    }
    
    return Array.from(itemsMap.values());
  }
  
  /**
   * Generar lista de esenciales basada en despensa
   */
  private async generateEssentialsList(pantryItems: PantryItem[]): Promise<ShoppingItem[]> {
    const essentials: ShoppingItem[] = [];
    
    // Items vencidos o por vencer
    const expiredItems = pantryItems.filter(
      item => item.status === 'expired' || item.status === 'expiring_soon'
    );
    
    for (const item of expiredItems) {
      essentials.push({
        id: this.generateItemId(),
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit,
        category: item.category || 'Sin categoría',
        estimatedPrice: 0,
        checked: false,
        priority: 'essential',
        notes: `Reemplazar - ${item.status === 'expired' ? 'Vencido' : 'Por vencer'}`
      });
    }
    
    // Items con stock bajo
    const lowStockItems = pantryItems.filter(item => item.status === 'low_stock');
    
    for (const item of lowStockItems) {
      essentials.push({
        id: this.generateItemId(),
        name: item.name,
        quantity: Math.max(2, item.quantity * 2),
        unit: item.unit,
        category: item.category || 'Sin categoría',
        estimatedPrice: 0,
        checked: false,
        priority: 'recommended',
        notes: 'Stock bajo'
      });
    }
    
    return essentials;
  }
  
  /**
   * Filtrar items que ya tenemos
   */
  private filterExistingItems(
    required: ShoppingItem[],
    pantryItems: PantryItem[]
  ): ShoppingItem[] {
    return required.filter(reqItem => {
      const pantryItem = pantryItems.find(
        p => p.name.toLowerCase() === reqItem.name.toLowerCase() &&
             p.status !== 'expired'
      );
      
      if (!pantryItem) return true;
      
      // Si tenemos menos de lo necesario, ajustar cantidad
      if (pantryItem.quantity < reqItem.quantity) {
        reqItem.quantity -= pantryItem.quantity;
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Categorizar y priorizar items
   */
  private async categorizeAndPrioritize(items: ShoppingItem[]): Promise<ShoppingItem[]> {
    try {
      // Usar IA para categorizar mejor
      const prompt = `
        Categoriza estos productos de supermercado:
        ${items.map(i => i.name).join(', ')}
        
        Asigna cada uno a una categoría: Lácteos, Carnes, Verduras, Frutas, Panadería, Bebidas, Limpieza, etc.
        
        Responde con un JSON objeto donde las keys son los nombres de productos y los valores son las categorías.
      `;
      
      // Por ahora usar categorización simple
      return items.map(item => ({
        ...item,
        category: this.guessCategory(item.name)
      }));
      
    } catch (error: unknown) {
      console.error('Error categorizando:', error);
      return items;
    }
  }
  
  /**
   * Optimizar items con IA
   */
  private async optimizeItemsWithAI(
    items: ShoppingItem[],
    optimization: OptimizationParams & { budget?: number }
  ): Promise<ShoppingItem[]> {
    try {
      // Estimar precios si no los tienen
      for (const item of items) {
        if (!item.estimatedPrice) {
          item.estimatedPrice = this.estimatePrice(item);
        }
      }
      
      // Si hay presupuesto, ajustar prioridades
      if (optimization.budget) {
        const currentTotal = this.calculateTotal(items);
        const budgetRatio = optimization.budget / currentTotal;
        
        if (budgetRatio < 1) {
          // Si excede presupuesto, marcar items según ratio
          items.forEach(item => {
            if (budgetRatio < 0.7 && item.priority === 'optional') {
              item.priority = 'optional';
              item.notes = '💡 Considerar alternativas más económicas';
            } else if (budgetRatio < 0.85 && item.priority === 'recommended') {
              item.notes = '💰 Revisar necesidad según presupuesto';
            }
          });
        }
      }
      
      // Sugerir alternativas si está habilitado
      if (optimization.includeAlternatives) {
        // TODO: Usar IA para sugerir alternativas más baratas
      }
      
      // Ordenar por prioridad y categoría
      return items.sort((a, b) => {
        const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.category.localeCompare(b.category);
      });
      
    } catch (error: unknown) {
      console.error('Error optimizando:', error);
      return items;
    }
  }
  
  /**
   * Generar rutas optimizadas por tienda
   */
  private async generateOptimizedRoutes(
    items: ShoppingItem[],
    preferredStores?: string[]
  ): Promise<StoreRoute[]> {
    // Por ahora, agrupar todo en una tienda genérica
    const defaultStore: StoreRoute = {
      storeName: preferredStores?.[0] || 'Supermercado',
      items: items,
      estimatedTotal: this.calculateTotal(items),
      estimatedTime: Math.round(items.length * 2 + 15), // 2 min por item + 15 min base
      aisleOrder: this.getAisleOrder()
    };
    
    return [defaultStore];
  }
  
  /**
   * Categorización simple
   */
  private guessCategory(name: string): string {
    const lower = name.toLowerCase();
    
    const categories: Record<string, string[]> = {
      'Lácteos': ['leche', 'queso', 'yogur', 'manteca', 'crema'],
      'Carnes': ['carne', 'pollo', 'cerdo', 'pescado', 'milanesa'],
      'Verduras': ['lechuga', 'tomate', 'cebolla', 'papa', 'zanahoria'],
      'Frutas': ['manzana', 'banana', 'naranja', 'pera', 'uva'],
      'Panadería': ['pan', 'facturas', 'galletas', 'tostadas'],
      'Bebidas': ['agua', 'jugo', 'gaseosa', 'cerveza', 'vino'],
      'Limpieza': ['detergente', 'lavandina', 'esponja', 'jabón'],
      'Almacén': ['arroz', 'fideos', 'aceite', 'sal', 'azúcar']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return category;
      }
    }
    
    return 'Otros';
  }
  
  /**
   * Estimar precio de item
   */
  private estimatePrice(item: ShoppingItem): number {
    // Precios base por categoría (ARS)
    const basePrices: Record<string, number> = {
      'Lácteos': 800,
      'Carnes': 2500,
      'Verduras': 300,
      'Frutas': 400,
      'Panadería': 600,
      'Bebidas': 500,
      'Limpieza': 700,
      'Almacén': 400,
      'Otros': 500
    };
    
    const basePrice = basePrices[item.category] || 500;
    return Math.round(basePrice * item.quantity);
  }
  
  /**
   * Obtener orden de pasillos típico
   */
  private getAisleOrder(): string[] {
    return [
      'Verduras y Frutas',
      'Panadería',
      'Lácteos',
      'Carnes',
      'Almacén',
      'Bebidas',
      'Limpieza',
      'Caja'
    ];
  }
  
  /**
   * Calcular total estimado
   */
  private calculateTotal(items: ShoppingItem[]): number {
    return items.reduce((total, item) => total + item.estimatedPrice, 0);
  }
  
  /**
   * Guardar lista en base de datos
   */
  private async saveList(list: ShoppingList): Promise<void> {
    // TODO: Implementar guardado en Supabase

  }
  
  /**
   * Utilidades
   */
  private generateListId(): string {
    return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Filtrar items según restricciones dietéticas y alergias
   */
  private async filterByDietaryRestrictions(
    items: ShoppingItem[],
    dietaryRestrictions: string[],
    allergies: string[]
  ): Promise<ShoppingItem[]> {
    if (dietaryRestrictions.length === 0 && allergies.length === 0) {
      return items;
    }
    
    return items.filter(item => {
      const itemLower = item.name.toLowerCase();
      
      // Filtrar por alergias
      for (const allergy of allergies) {
        if (this.containsAllergen(itemLower, allergy)) {

          return false;
        }
      }
      
      // Filtrar por restricciones dietéticas
      for (const restriction of dietaryRestrictions) {
        if (!this.compliesWithRestriction(itemLower, restriction)) {

          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Verificar si un item contiene un alérgeno
   */
  private containsAllergen(itemName: string, allergy: string): boolean {
    const allergenKeywords: Record<string, string[]> = {
      'Gluten': ['harina', 'pan', 'pasta', 'galletas', 'cerveza', 'trigo'],
      'Lácteos': ['leche', 'queso', 'yogur', 'manteca', 'crema', 'helado'],
      'Frutos secos': ['nuez', 'almendra', 'maní', 'castaña', 'pistacho'],
      'Mariscos': ['camarón', 'langostino', 'cangrejo', 'mejillón', 'almeja'],
      'Huevos': ['huevo', 'mayonesa', 'flan', 'merengue'],
      'Soja': ['soja', 'tofu', 'miso', 'tempeh']
    };
    
    const keywords = allergenKeywords[allergy] || [allergy.toLowerCase()];
    return keywords.some(keyword => itemName.includes(keyword));
  }
  
  /**
   * Verificar si un item cumple con una restricción dietética
   */
  private compliesWithRestriction(itemName: string, restriction: string): boolean {
    const restrictionRules: Record<string, string[]> = {
      'Vegetariano': ['carne', 'pollo', 'pescado', 'jamón', 'chorizo', 'salame'],
      'Vegano': ['carne', 'pollo', 'pescado', 'huevo', 'leche', 'queso', 'miel', 'yogur'],
      'Sin gluten': ['harina', 'pan', 'pasta', 'galletas', 'cerveza', 'trigo'],
      'Kosher': ['cerdo', 'mariscos', 'jamón'],
      'Sin azúcar': ['azúcar', 'dulce', 'chocolate', 'caramelo', 'torta', 'helado']
    };
    
    const forbidden = restrictionRules[restriction] || [];
    return !forbidden.some(keyword => itemName.includes(keyword));
  }
  
  /**
   * Ajustar lista según presupuesto
   */
  private adjustForBudget(items: ShoppingItem[], budget: number): void {
    let currentTotal = this.calculateTotal(items);
    
    // Primero marcar items opcionales
    items.forEach(item => {
      if (item.priority === 'optional' && currentTotal > budget) {
        item.notes = `⚠️ Excede presupuesto - ${item.notes || ''}`.trim();
      }
    });
    
    // Si aún excede, marcar recomendados
    if (currentTotal > budget) {
      items.forEach(item => {
        if (item.priority === 'recommended' && currentTotal > budget) {
          item.notes = `⚠️ Considerar omitir - ${item.notes || ''}`.trim();
          currentTotal -= item.estimatedPrice;
        }
      });
    }
  }
  
  /**
   * Compartir lista por WhatsApp
   */
  async shareListWhatsApp(list: ShoppingList): Promise<string> {
    const text = this.formatListForSharing(list);
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/?text=${encodedText}`;
  }
  
  /**
   * Formatear lista para compartir
   */
  private formatListForSharing(list: ShoppingList): string {
    let text = `🛒 *${list.name}*\n\n`;
    
    // Agrupar por categoría
    const byCategory = list.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);
    
    for (const [category, items] of Object.entries(byCategory)) {
      text += `*${category}*\n`;
      for (const item of items) {
        const check = item.checked ? '✅' : '⬜';
        text += `${check} ${item.name} - ${item.quantity} ${item.unit}\n`;
        if (item.notes) {
          text += `   📝 ${item.notes}\n`;
        }
      }
      text += '\n';
    }
    
    text += `💰 *Total Estimado: $${list.totalEstimated.toLocaleString()}*`;
    
    return text;
  }
}

// Singleton
let shoppingOptimizer: ShoppingOptimizer | null = null;

export function getShoppingOptimizer(system: HolisticFoodSystem): ShoppingOptimizer {
  if (!shoppingOptimizer) {
    shoppingOptimizer = new ShoppingOptimizer(system);
  }
  return shoppingOptimizer;
}