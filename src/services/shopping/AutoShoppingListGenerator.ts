/**
 * Automatic Shopping List Generator
 * Generates optimized shopping lists from meal plans with pantry inventory analysis
 */

import { logger } from '@/services/logger';
import { shoppingListService } from '@/lib/services/shoppingListService';
import { PriceTracker } from '@/services/pricing/priceTracker';
import type { 
  WeekPlan, 
  ShoppingList, 
  ShoppingListItem, 
  Recipe, 
  Ingredient,
  IngredientCategory 
} from '@/features/meal-planning/types';
import type { PantryItem } from '@/features/pantry/types';

export interface ShoppingListGeneration {
  shoppingList: ShoppingList;
  summary: {
    totalItems: number;
    estimatedCost: number;
    pantryUsage: number;
    missingItems: string[];
    priceComparisons: StoreComparison[];
    suggestions: string[];
  };
  optimizations: {
    bulkBuyOpportunities: BulkBuyOpportunity[];
    substitutionSuggestions: SubstitutionSuggestion[];
    seasonalRecommendations: string[];
  };
}

export interface StoreComparison {
  storeId: string;
  storeName: string;
  totalCost: number;
  availableItems: number;
  missingItems: string[];
  estimatedSavings: number;
  distanceFromUser?: number;
  deliveryOptions?: {
    available: boolean;
    cost: number;
    timeSlots: string[];
  };
}

export interface BulkBuyOpportunity {
  ingredientName: string;
  currentQuantity: number;
  suggestedQuantity: number;
  unitCost: number;
  bulkCost: number;
  savings: number;
  reason: string;
}

export interface SubstitutionSuggestion {
  originalIngredient: string;
  substitute: string;
  reason: string;
  costDifference: number;
  nutritionalImpact: 'positive' | 'neutral' | 'negative';
}

export interface PantryAnalysis {
  available: PantryIngredient[];
  insufficient: PantryIngredient[];
  missing: string[];
  expiringItems: PantryIngredient[];
}

export interface PantryIngredient {
  name: string;
  availableQuantity: number;
  requiredQuantity: number;
  unit: string;
  expirationDate?: Date;
  location?: string;
}

export interface ShoppingOptimization {
  organizeByStore: boolean;
  groupByCategory: boolean;
  prioritizeByExpiration: boolean;
  includePriceComparisons: boolean;
  suggestAlternatives: boolean;
  optimizeRoute: boolean;
}

export class AutoShoppingListGenerator {
  private priceTracker: PriceTracker;
  private defaultStores = [
    { id: 'carrefour', name: 'Carrefour', category: 'hypermarket' },
    { id: 'coto', name: 'Coto', category: 'supermarket' },
    { id: 'dia', name: 'Día', category: 'discount' },
    { id: 'jumbo', name: 'Jumbo', category: 'hypermarket' },
    { id: 'vea', name: 'Vea', category: 'supermarket' }
  ];

  constructor() {
    this.priceTracker = new PriceTracker();
  }

  /**
   * Generate optimized shopping list from meal plan
   */
  async generateFromMealPlan(
    weekPlan: WeekPlan,
    pantryItems: PantryItem[],
    userId: string,
    options: ShoppingOptimization = {
      organizeByStore: true,
      groupByCategory: true,
      prioritizeByExpiration: true,
      includePriceComparisons: true,
      suggestAlternatives: true,
      optimizeRoute: false
    }
  ): Promise<ShoppingListGeneration> {
    try {
      logger.info('Generating shopping list from meal plan', 'AutoShoppingListGenerator', {
        weekPlanId: weekPlan.id,
        slotsCount: weekPlan.slots.length,
        pantryItemsCount: pantryItems.length
      });

      // Step 1: Extract all ingredients from meal plan
      const requiredIngredients = this.extractIngredientsFromMealPlan(weekPlan);
      
      // Step 2: Analyze pantry inventory
      const pantryAnalysis = this.analyzePantryInventory(requiredIngredients, pantryItems);
      
      // Step 3: Calculate missing items and quantities
      const missingItems = this.calculateMissingItems(pantryAnalysis);
      
      // Step 4: Generate price comparisons if requested
      const priceComparisons = options.includePriceComparisons 
        ? await this.generatePriceComparisons(missingItems)
        : [];
      
      // Step 5: Create optimized shopping list
      const shoppingList = await this.createShoppingList(
        missingItems,
        userId,
        weekPlan.id,
        options
      );
      
      // Step 6: Generate optimizations
      const optimizations = await this.generateOptimizations(
        missingItems,
        pantryAnalysis,
        priceComparisons
      );
      
      // Step 7: Calculate summary
      const summary = this.calculateSummary(
        shoppingList,
        pantryAnalysis,
        priceComparisons,
        optimizations
      );

      const result: ShoppingListGeneration = {
        shoppingList,
        summary,
        optimizations
      };

      logger.info('Shopping list generated successfully', 'AutoShoppingListGenerator', {
        totalItems: summary.totalItems,
        estimatedCost: summary.estimatedCost,
        storeComparisons: priceComparisons.length
      });

      return result;
    } catch (error) {
      logger.error('Error generating shopping list', 'AutoShoppingListGenerator', error);
      throw error;
    }
  }

  /**
   * Extract all ingredients from meal plan recipes
   */
  private extractIngredientsFromMealPlan(weekPlan: WeekPlan): Map<string, Ingredient & { totalQuantity: number }> {
    const ingredientsMap = new Map<string, Ingredient & { totalQuantity: number }>();

    weekPlan.slots.forEach(slot => {
      if (slot.recipe) {
        slot.recipe.ingredients.forEach(ingredient => {
          const key = this.normalizeIngredientName(ingredient.name);
          const scaledAmount = (ingredient.amount || 1) * slot.servings / slot.recipe!.servings;
          
          if (ingredientsMap.has(key)) {
            const existing = ingredientsMap.get(key)!;
            existing.totalQuantity += scaledAmount;
          } else {
            ingredientsMap.set(key, {
              ...ingredient,
              totalQuantity: scaledAmount
            });
          }
        });
      }
    });

    return ingredientsMap;
  }

  /**
   * Analyze pantry inventory against required ingredients
   */
  private analyzePantryInventory(
    requiredIngredients: Map<string, Ingredient & { totalQuantity: number }>,
    pantryItems: PantryItem[]
  ): PantryAnalysis {
    const available: PantryIngredient[] = [];
    const insufficient: PantryIngredient[] = [];
    const missing: string[] = [];
    const expiringItems: PantryIngredient[] = [];

    const now = new Date();
    const expirationThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    requiredIngredients.forEach((ingredient, ingredientKey) => {
      // Find matching pantry items
      const matchingPantryItems = pantryItems.filter(item => 
        this.normalizeIngredientName(item.ingredient_name) === ingredientKey
      );

      if (matchingPantryItems.length === 0) {
        missing.push(ingredient.name);
        return;
      }

      // Calculate total available quantity
      const totalAvailable = matchingPantryItems.reduce((sum, item) => sum + item.quantity, 0);
      const requiredQuantity = ingredient.totalQuantity;

      const pantryIngredient: PantryIngredient = {
        name: ingredient.name,
        availableQuantity: totalAvailable,
        requiredQuantity,
        unit: ingredient.unit || 'unidades'
      };

      // Check for expiring items
      matchingPantryItems.forEach(item => {
        if (item.expiration_date && new Date(item.expiration_date) <= expirationThreshold) {
          expiringItems.push({
            ...pantryIngredient,
            expirationDate: new Date(item.expiration_date),
            location: item.location
          });
        }
      });

      if (totalAvailable >= requiredQuantity) {
        available.push(pantryIngredient);
      } else {
        insufficient.push(pantryIngredient);
      }
    });

    return { available, insufficient, missing, expiringItems };
  }

  /**
   * Calculate items that need to be purchased
   */
  private calculateMissingItems(pantryAnalysis: PantryAnalysis): ShoppingListItem[] {
    const missingItems: ShoppingListItem[] = [];

    // Add completely missing items
    pantryAnalysis.missing.forEach((ingredientName, index) => {
      missingItems.push({
        id: `missing-${index}`,
        ingredientName,
        totalAmount: 1,
        unit: 'unidades',
        category: this.categorizeIngredient(ingredientName),
        recipeNames: [],
        isPurchased: false,
        notes: 'No disponible en despensa'
      });
    });

    // Add insufficient items (need more quantity)
    pantryAnalysis.insufficient.forEach((ingredient, index) => {
      const neededQuantity = ingredient.requiredQuantity - ingredient.availableQuantity;
      missingItems.push({
        id: `insufficient-${index}`,
        ingredientName: ingredient.name,
        totalAmount: neededQuantity,
        unit: ingredient.unit,
        category: this.categorizeIngredient(ingredient.name),
        recipeNames: [],
        isPurchased: false,
        notes: `Cantidad insuficiente (disponible: ${ingredient.availableQuantity} ${ingredient.unit})`
      });
    });

    return missingItems;
  }

  /**
   * Generate price comparisons across stores
   */
  private async generatePriceComparisons(missingItems: ShoppingListItem[]): Promise<StoreComparison[]> {
    const comparisons: StoreComparison[] = [];

    for (const store of this.defaultStores) {
      let totalCost = 0;
      let availableItems = 0;
      const storeComparison: StoreComparison = {
        storeId: store.id,
        storeName: store.name,
        totalCost: 0,
        availableItems: 0,
        missingItems: [],
        estimatedSavings: 0
      };

      for (const item of missingItems) {
        try {
          const priceComparison = await this.priceTracker.compareProductPrices(
            item.ingredientName,
            item.totalAmount,
            item.unit
          );

          if (priceComparison) {
            const storePrice = priceComparison.product.prices.find(p => p.store.id === store.id);
            if (storePrice) {
              totalCost += storePrice.price * item.totalAmount;
              availableItems++;
            } else {
              storeComparison.missingItems.push(item.ingredientName);
            }
          } else {
            storeComparison.missingItems.push(item.ingredientName);
          }
        } catch (error) {
          logger.warn('Error getting price for item', 'AutoShoppingListGenerator', {
            item: item.ingredientName,
            store: store.name,
            error
          });
          storeComparison.missingItems.push(item.ingredientName);
        }
      }

      storeComparison.totalCost = totalCost;
      storeComparison.availableItems = availableItems;
      comparisons.push(storeComparison);
    }

    // Calculate savings relative to most expensive option
    const maxCost = Math.max(...comparisons.map(c => c.totalCost));
    comparisons.forEach(comparison => {
      comparison.estimatedSavings = maxCost - comparison.totalCost;
    });

    // Sort by total cost (cheapest first)
    return comparisons.sort((a, b) => a.totalCost - b.totalCost);
  }

  /**
   * Create optimized shopping list
   */
  private async createShoppingList(
    missingItems: ShoppingListItem[],
    userId: string,
    weekPlanId: string,
    options: ShoppingOptimization
  ): Promise<ShoppingList> {
    // Group items by category if requested
    const organizedItems = options.groupByCategory 
      ? this.groupItemsByCategory(missingItems)
      : missingItems;

    // Sort by priority if requested
    const sortedItems = options.prioritizeByExpiration
      ? this.sortItemsByPriority(organizedItems)
      : organizedItems;

    // Create shopping list
    const shoppingList: ShoppingList = {
      id: `shopping-${Date.now()}`,
      userId,
      weekPlanId,
      items: sortedItems,
      categories: this.createCategoriesFromItems(sortedItems),
      estimatedTotal: this.calculateEstimatedTotal(sortedItems),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return shoppingList;
  }

  /**
   * Generate shopping optimizations
   */
  private async generateOptimizations(
    missingItems: ShoppingListItem[],
    pantryAnalysis: PantryAnalysis,
    priceComparisons: StoreComparison[]
  ): Promise<ShoppingListGeneration['optimizations']> {
    const optimizations = {
      bulkBuyOpportunities: await this.findBulkBuyOpportunities(missingItems),
      substitutionSuggestions: this.generateSubstitutionSuggestions(missingItems, pantryAnalysis),
      seasonalRecommendations: this.generateSeasonalRecommendations(missingItems)
    };

    return optimizations;
  }

  /**
   * Find bulk buying opportunities
   */
  private async findBulkBuyOpportunities(missingItems: ShoppingListItem[]): Promise<BulkBuyOpportunity[]> {
    const opportunities: BulkBuyOpportunity[] = [];

    for (const item of missingItems) {
      // Check if bulk buying makes sense (simplified logic)
      if (item.totalAmount > 1 && item.totalAmount < 5) {
        const bulkQuantity = Math.ceil(item.totalAmount * 1.5);
        const estimatedUnitCost = item.estimatedPrice || 10; // Default price
        const bulkUnitCost = estimatedUnitCost * 0.9; // 10% bulk discount
        const savings = (estimatedUnitCost - bulkUnitCost) * bulkQuantity;

        if (savings > 50) { // Minimum savings threshold
          opportunities.push({
            ingredientName: item.ingredientName,
            currentQuantity: item.totalAmount,
            suggestedQuantity: bulkQuantity,
            unitCost: estimatedUnitCost,
            bulkCost: bulkUnitCost,
            savings,
            reason: 'Ahorro por compra en cantidad'
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Generate substitution suggestions
   */
  private generateSubstitutionSuggestions(
    missingItems: ShoppingListItem[],
    pantryAnalysis: PantryAnalysis
  ): SubstitutionSuggestion[] {
    const suggestions: SubstitutionSuggestion[] = [];

    // Simple substitution logic based on common ingredient replacements
    const substitutionMap: Record<string, { substitute: string; reason: string }> = {
      'manteca': { substitute: 'aceite vegetal', reason: 'Alternativa más saludable' },
      'crema de leche': { substitute: 'leche descremada + maicena', reason: 'Opción más económica' },
      'queso parmesano': { substitute: 'queso rallado común', reason: 'Más económico y disponible' },
      'vino blanco': { substitute: 'caldo de verduras', reason: 'Sin alcohol, mismo sabor' }
    };

    missingItems.forEach(item => {
      const normalizedName = this.normalizeIngredientName(item.ingredientName);
      if (substitutionMap[normalizedName]) {
        const sub = substitutionMap[normalizedName];
        suggestions.push({
          originalIngredient: item.ingredientName,
          substitute: sub.substitute,
          reason: sub.reason,
          costDifference: -20, // Estimated 20% savings
          nutritionalImpact: 'neutral'
        });
      }
    });

    return suggestions;
  }

  /**
   * Generate seasonal recommendations
   */
  private generateSeasonalRecommendations(missingItems: ShoppingListItem[]): string[] {
    const recommendations: string[] = [];
    const currentMonth = new Date().getMonth();
    
    // Argentine seasons mapping
    const seasons = {
      summer: [11, 0, 1, 2], // Dec, Jan, Feb, Mar
      autumn: [3, 4, 5],      // Apr, May, Jun
      winter: [6, 7, 8],      // Jul, Aug, Sep
      spring: [9, 10]         // Oct, Nov
    };

    let currentSeason = 'summer';
    for (const [season, months] of Object.entries(seasons)) {
      if (months.includes(currentMonth)) {
        currentSeason = season;
        break;
      }
    }

    // Season-specific recommendations
    const seasonalTips: Record<string, string[]> = {
      summer: [
        'Aprovecha frutas de estación como durazno, melón y sandía',
        'Prefiere comidas frescas y ensaladas',
        'Los tomates están en su mejor momento'
      ],
      autumn: [
        'Es temporada de peras, manzanas y cítricos',
        'Aprovecha las calabazas y zapallitos',
        'Buen momento para legumbres secas'
      ],
      winter: [
        'Ideales las verduras de hoja verde',
        'Cítricos en su mejor momento',
        'Perfecto para sopas y guisos'
      ],
      spring: [
        'Espárragos y habas frescas disponibles',
        'Buena época para hierbas aromáticas',
        'Primeras frutas de estación'
      ]
    };

    return seasonalTips[currentSeason] || [];
  }

  /**
   * Calculate shopping list summary
   */
  private calculateSummary(
    shoppingList: ShoppingList,
    pantryAnalysis: PantryAnalysis,
    priceComparisons: StoreComparison[],
    optimizations: ShoppingListGeneration['optimizations']
  ): ShoppingListGeneration['summary'] {
    const pantryUsagePercentage = pantryAnalysis.available.length / 
      (pantryAnalysis.available.length + pantryAnalysis.insufficient.length + pantryAnalysis.missing.length) * 100;

    const suggestions: string[] = [
      ...optimizations.seasonalRecommendations,
      `Aprovecha ${pantryAnalysis.available.length} ingredientes de tu despensa`,
    ];

    if (pantryAnalysis.expiringItems.length > 0) {
      suggestions.push(`Usa primero ${pantryAnalysis.expiringItems.length} items que vencen pronto`);
    }

    if (optimizations.bulkBuyOpportunities.length > 0) {
      suggestions.push(`${optimizations.bulkBuyOpportunities.length} oportunidades de ahorro comprando en cantidad`);
    }

    return {
      totalItems: shoppingList.items.length,
      estimatedCost: shoppingList.estimatedTotal || 0,
      pantryUsage: Math.round(pantryUsagePercentage),
      missingItems: pantryAnalysis.missing,
      priceComparisons,
      suggestions
    };
  }

  /**
   * Utility methods
   */
  private normalizeIngredientName(name: string): string {
    return name.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  private categorizeIngredient(name: string): IngredientCategory {
    const categories: Record<string, IngredientCategory> = {
      'carne': 'meat',
      'pollo': 'meat',
      'pescado': 'meat',
      'huevo': 'dairy',
      'leche': 'dairy',
      'queso': 'dairy',
      'yogur': 'dairy',
      'tomate': 'produce',
      'cebolla': 'produce',
      'ajo': 'produce',
      'zanahoria': 'produce',
      'papa': 'produce',
      'arroz': 'grains',
      'pasta': 'grains',
      'harina': 'grains',
      'pan': 'grains',
      'aceite': 'pantry',
      'sal': 'spices',
      'pimienta': 'spices'
    };

    const normalizedName = this.normalizeIngredientName(name);
    for (const [key, category] of Object.entries(categories)) {
      if (normalizedName.includes(key)) {
        return category;
      }
    }

    return 'other';
  }

  private groupItemsByCategory(items: ShoppingListItem[]): ShoppingListItem[] {
    const categoryOrder: IngredientCategory[] = [
      'produce', 'meat', 'dairy', 'grains', 'pantry', 'spices', 'frozen', 'beverages', 'other'
    ];

    return items.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      return aIndex - bIndex;
    });
  }

  private sortItemsByPriority(items: ShoppingListItem[]): ShoppingListItem[] {
    // Sort by estimated price (high to low) to prioritize expensive items
    return items.sort((a, b) => (b.estimatedPrice || 0) - (a.estimatedPrice || 0));
  }

  private createCategoriesFromItems(items: ShoppingListItem[]): ShoppingList['categories'] {
    const categoryMap = new Map<IngredientCategory, ShoppingListItem[]>();

    items.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      categoryMap.get(item.category)!.push(item);
    });

    return Array.from(categoryMap.entries()).map(([category, categoryItems]) => ({
      name: category,
      items: categoryItems,
      subtotal: categoryItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
    }));
  }

  private calculateEstimatedTotal(items: ShoppingListItem[]): number {
    return items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  }
}

export const autoShoppingListGenerator = new AutoShoppingListGenerator();