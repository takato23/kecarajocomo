import { v4 as uuidv4 } from 'uuid';

import {
  RecipeV2,
  ShoppingListV2,
  ShoppingListItem,
  ShoppingListCategory,
  IngredientCategory,
  IngredientV2
} from '../types';

// =============================================
// CONSTANTS
// =============================================

// Common unit conversions to standardize measurements
const UNIT_CONVERSIONS: Record<string, { unit: string; factor: number }> = {
  // Weight conversions to grams
  'kg': { unit: 'g', factor: 1000 },
  'kilogramo': { unit: 'g', factor: 1000 },
  'kilogramos': { unit: 'g', factor: 1000 },
  'lb': { unit: 'g', factor: 453.592 },
  'libra': { unit: 'g', factor: 453.592 },
  'libras': { unit: 'g', factor: 453.592 },
  'oz': { unit: 'g', factor: 28.3495 },
  'onza': { unit: 'g', factor: 28.3495 },
  'onzas': { unit: 'g', factor: 28.3495 },
  
  // Volume conversions to ml
  'l': { unit: 'ml', factor: 1000 },
  'litro': { unit: 'ml', factor: 1000 },
  'litros': { unit: 'ml', factor: 1000 },
  'taza': { unit: 'ml', factor: 250 },
  'tazas': { unit: 'ml', factor: 250 },
  'cup': { unit: 'ml', factor: 236.588 },
  'cups': { unit: 'ml', factor: 236.588 },
  'cucharada': { unit: 'ml', factor: 15 },
  'cucharadas': { unit: 'ml', factor: 15 },
  'tbsp': { unit: 'ml', factor: 15 },
  'cucharadita': { unit: 'ml', factor: 5 },
  'cucharaditas': { unit: 'ml', factor: 5 },
  'tsp': { unit: 'ml', factor: 5 },
  
  // Keep as-is
  'g': { unit: 'g', factor: 1 },
  'gramo': { unit: 'g', factor: 1 },
  'gramos': { unit: 'g', factor: 1 },
  'ml': { unit: 'ml', factor: 1 },
  'mililitro': { unit: 'ml', factor: 1 },
  'mililitros': { unit: 'ml', factor: 1 },
  'unidad': { unit: 'unidad', factor: 1 },
  'unidades': { unit: 'unidad', factor: 1 },
  'diente': { unit: 'unidad', factor: 1 },
  'dientes': { unit: 'unidad', factor: 1 },
  'hoja': { unit: 'unidad', factor: 1 },
  'hojas': { unit: 'unidad', factor: 1 },
  'rama': { unit: 'unidad', factor: 1 },
  'ramas': { unit: 'unidad', factor: 1 }
};

// Common package sizes in Argentina
const PACKAGE_SIZES: Record<string, { amount: number; unit: string }[]> = {
  // Dairy
  'leche': [
    { amount: 1000, unit: 'ml' },
    { amount: 500, unit: 'ml' }
  ],
  'yogur': [
    { amount: 200, unit: 'g' },
    { amount: 500, unit: 'g' },
    { amount: 1000, unit: 'g' }
  ],
  'queso': [
    { amount: 200, unit: 'g' },
    { amount: 500, unit: 'g' }
  ],
  'manteca': [
    { amount: 200, unit: 'g' },
    { amount: 100, unit: 'g' }
  ],
  
  // Grains & Pasta
  'arroz': [
    { amount: 1000, unit: 'g' },
    { amount: 500, unit: 'g' }
  ],
  'fideos': [
    { amount: 500, unit: 'g' }
  ],
  'pasta': [
    { amount: 500, unit: 'g' }
  ],
  'harina': [
    { amount: 1000, unit: 'g' },
    { amount: 500, unit: 'g' }
  ],
  
  // Proteins
  'pollo': [
    { amount: 1000, unit: 'g' },
    { amount: 2000, unit: 'g' }
  ],
  'carne': [
    { amount: 500, unit: 'g' },
    { amount: 1000, unit: 'g' }
  ],
  'pescado': [
    { amount: 500, unit: 'g' },
    { amount: 1000, unit: 'g' }
  ],
  'huevos': [
    { amount: 6, unit: 'unidad' },
    { amount: 12, unit: 'unidad' },
    { amount: 30, unit: 'unidad' }
  ],
  
  // Canned goods
  'tomate en lata': [
    { amount: 400, unit: 'g' },
    { amount: 800, unit: 'g' }
  ],
  'atún': [
    { amount: 170, unit: 'g' }
  ],
  
  // Oil & Condiments
  'aceite': [
    { amount: 900, unit: 'ml' },
    { amount: 1500, unit: 'ml' }
  ],
  'sal': [
    { amount: 500, unit: 'g' },
    { amount: 1000, unit: 'g' }
  ],
  'azúcar': [
    { amount: 1000, unit: 'g' },
    { amount: 500, unit: 'g' }
  ]
};

// Ingredient name normalization map
const INGREDIENT_NORMALIZATIONS: Record<string, string> = {
  // Vegetables
  'tomate': 'tomate',
  'tomates': 'tomate',
  'cebolla': 'cebolla',
  'cebollas': 'cebolla',
  'ajo': 'ajo',
  'papa': 'papa',
  'papas': 'papa',
  'zanahoria': 'zanahoria',
  'zanahorias': 'zanahoria',
  
  // Proteins
  'pechuga de pollo': 'pollo',
  'muslo de pollo': 'pollo',
  'pollo entero': 'pollo',
  'carne picada': 'carne picada',
  'carne molida': 'carne picada',
  'bife': 'carne',
  'asado': 'carne',
  
  // Dairy
  'leche entera': 'leche',
  'leche descremada': 'leche',
  'queso rallado': 'queso',
  'queso cremoso': 'queso',
  'mozzarella': 'queso mozzarella',
  
  // Grains
  'arroz blanco': 'arroz',
  'arroz integral': 'arroz',
  'fideos largos': 'fideos',
  'fideos cortos': 'fideos',
  'espagueti': 'fideos',
  'macarrones': 'fideos'
};

// =============================================
// INTELLIGENT SHOPPING PARSER
// =============================================

class IntelligentShoppingParser {
  /**
   * Convert recipes to an organized shopping list
   */
  convertRecipesToShoppingList(
    recipes: RecipeV2[],
    userId: string,
    weekStartDate: string
  ): ShoppingListV2 {
    const consolidatedIngredients = this.consolidateIngredients(recipes);
    const categorizedItems = this.categorizeItems(consolidatedIngredients);
    const optimizedItems = this.optimizePackageSizes(categorizedItems);
    
    const shoppingList: ShoppingListV2 = {
      id: uuidv4(),
      userId,
      weekStartDate,
      items: optimizedItems,
      categories: this.groupByCategory(optimizedItems),
      estimatedTotal: this.estimateTotal(optimizedItems),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return shoppingList;
  }

  /**
   * Consolidate ingredients from multiple recipes
   */
  private consolidateIngredients(recipes: RecipeV2[]): Map<string, {
    totalAmount: number;
    unit: string;
    category: IngredientCategory;
    recipes: string[];
    originalIngredients: IngredientV2[];
  }> {
    const consolidated = new Map<string, any>();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        // Normalize ingredient name
        const normalizedName = this.normalizeIngredientName(ingredient.name);
        
        // Convert units to standard
        const { amount, unit } = this.standardizeUnit(ingredient.amount, ingredient.unit);
        
        if (consolidated.has(normalizedName)) {
          const existing = consolidated.get(normalizedName);
          
          // If units match, add amounts
          if (existing.unit === unit) {
            existing.totalAmount += amount;
            existing.recipes.push(recipe.name);
            existing.originalIngredients.push(ingredient);
          } else {
            // Create a new entry with unit suffix if units don't match
            const keyWithUnit = `${normalizedName} (${unit})`;
            if (consolidated.has(keyWithUnit)) {
              const existingWithUnit = consolidated.get(keyWithUnit);
              existingWithUnit.totalAmount += amount;
              existingWithUnit.recipes.push(recipe.name);
              existingWithUnit.originalIngredients.push(ingredient);
            } else {
              consolidated.set(keyWithUnit, {
                totalAmount: amount,
                unit,
                category: ingredient.category,
                recipes: [recipe.name],
                originalIngredients: [ingredient]
              });
            }
          }
        } else {
          consolidated.set(normalizedName, {
            totalAmount: amount,
            unit,
            category: ingredient.category,
            recipes: [recipe.name],
            originalIngredients: [ingredient]
          });
        }
      });
    });
    
    return consolidated;
  }

  /**
   * Normalize ingredient names for better consolidation
   */
  private normalizeIngredientName(name: string): string {
    const lowercased = name.toLowerCase().trim();
    
    // Check if we have a specific normalization
    for (const [pattern, normalized] of Object.entries(INGREDIENT_NORMALIZATIONS)) {
      if (lowercased.includes(pattern)) {
        return normalized;
      }
    }
    
    // Remove common modifiers
    const cleaned = lowercased
      .replace(/fresco|fresca|frescos|frescas/g, '')
      .replace(/grande|grandes|pequeño|pequeña|pequeños|pequeñas/g, '')
      .replace(/maduro|madura|maduros|maduras/g, '')
      .replace(/picado|picada|picados|picadas/g, '')
      .replace(/rallado|rallada|rallados|ralladas/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned;
  }

  /**
   * Standardize units for better consolidation
   */
  private standardizeUnit(amount: number, unit: string): { amount: number; unit: string } {
    const lowercasedUnit = unit.toLowerCase().trim();
    const conversion = UNIT_CONVERSIONS[lowercasedUnit];
    
    if (conversion) {
      return {
        amount: amount * conversion.factor,
        unit: conversion.unit
      };
    }
    
    return { amount, unit: lowercasedUnit };
  }

  /**
   * Convert consolidated ingredients to shopping list items
   */
  private categorizeItems(
    consolidatedIngredients: Map<string, any>
  ): ShoppingListItem[] {
    const items: ShoppingListItem[] = [];
    
    consolidatedIngredients.forEach((data, name) => {
      const item: ShoppingListItem = {
        id: uuidv4(),
        ingredientName: this.capitalizeIngredient(name),
        totalAmount: Math.ceil(data.totalAmount), // Round up to avoid shortages
        unit: data.unit,
        category: data.category,
        recipes: [...new Set(data.recipes)], // Remove duplicates
        isPurchased: false,
        notes: this.generateNotes(data.originalIngredients)
      };
      
      items.push(item);
    });
    
    return items;
  }

  /**
   * Optimize package sizes for shopping
   */
  private optimizePackageSizes(items: ShoppingListItem[]): ShoppingListItem[] {
    return items.map(item => {
      const packageSizes = this.findPackageSizes(item.ingredientName);
      
      if (packageSizes.length > 0) {
        const optimalPackage = this.calculateOptimalPackage(
          item.totalAmount,
          item.unit,
          packageSizes
        );
        
        if (optimalPackage) {
          item.packageSize = optimalPackage;
        }
      }
      
      // Estimate price based on ingredient and amount
      item.estimatedPrice = this.estimateItemPrice(item);
      
      return item;
    });
  }

  /**
   * Find available package sizes for an ingredient
   */
  private findPackageSizes(ingredientName: string): { amount: number; unit: string }[] {
    const normalized = ingredientName.toLowerCase();
    
    for (const [key, sizes] of Object.entries(PACKAGE_SIZES)) {
      if (normalized.includes(key)) {
        return sizes;
      }
    }
    
    return [];
  }

  /**
   * Calculate optimal package combination
   */
  private calculateOptimalPackage(
    requiredAmount: number,
    unit: string,
    availableSizes: { amount: number; unit: string }[]
  ): { amount: number; unit: string; quantity: number } | undefined {
    // Filter compatible package sizes
    const compatibleSizes = availableSizes.filter(size => size.unit === unit);
    
    if (compatibleSizes.length === 0) return undefined;
    
    // Sort by size descending
    compatibleSizes.sort((a, b) => b.amount - a.amount);
    
    // Find the optimal package
    for (const size of compatibleSizes) {
      const quantity = Math.ceil(requiredAmount / size.amount);
      const waste = (quantity * size.amount) - requiredAmount;
      const wastePercentage = waste / requiredAmount;
      
      // Accept if waste is less than 20%
      if (wastePercentage < 0.2) {
        return {
          amount: size.amount,
          unit: size.unit,
          quantity
        };
      }
    }
    
    // If no optimal found, use the smallest package
    const smallestSize = compatibleSizes[compatibleSizes.length - 1];
    return {
      amount: smallestSize.amount,
      unit: smallestSize.unit,
      quantity: Math.ceil(requiredAmount / smallestSize.amount)
    };
  }

  /**
   * Group items by category
   */
  private groupByCategory(items: ShoppingListItem[]): ShoppingListCategory[] {
    const categories = new Map<IngredientCategory, ShoppingListItem[]>();
    
    items.forEach(item => {
      if (!categories.has(item.category)) {
        categories.set(item.category, []);
      }
      categories.get(item.category)!.push(item);
    });
    
    const categoryList: ShoppingListCategory[] = [];
    categories.forEach((items, name) => {
      categoryList.push({
        name,
        items,
        subtotal: items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
      });
    });
    
    // Sort categories by shopping order
    const categoryOrder: IngredientCategory[] = [
      'produce', 'meat', 'dairy', 'grains', 'pantry', 'frozen', 'beverages', 'spices', 'other'
    ];
    
    categoryList.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.name);
      const indexB = categoryOrder.indexOf(b.name);
      return indexA - indexB;
    });
    
    return categoryList;
  }

  /**
   * Generate helpful notes for shopping
   */
  private generateNotes(ingredients: IngredientV2[]): string | undefined {
    const notes: string[] = [];
    
    // Check for optional ingredients
    const optional = ingredients.filter(ing => ing.isOptional);
    if (optional.length > 0) {
      notes.push(`Opcional: ${optional.map(ing => ing.name).join(', ')}`);
    }
    
    // Check for specific notes
    const specificNotes = ingredients
      .filter(ing => ing.notes)
      .map(ing => ing.notes!);
    
    if (specificNotes.length > 0) {
      notes.push(...specificNotes);
    }
    
    return notes.length > 0 ? notes.join('. ') : undefined;
  }

  /**
   * Capitalize ingredient names properly
   */
  private capitalizeIngredient(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Estimate item price (in Argentine pesos)
   */
  private estimateItemPrice(item: ShoppingListItem): number {
    // Basic price estimates per unit
    const priceEstimates: Record<string, Record<string, number>> = {
      produce: { g: 0.5, unidad: 50 },
      meat: { g: 2.5, unidad: 500 },
      dairy: { ml: 0.3, g: 1.5, unidad: 100 },
      grains: { g: 0.2, unidad: 150 },
      pantry: { g: 0.3, ml: 0.2, unidad: 80 },
      spices: { g: 5, unidad: 200 },
      frozen: { g: 1.5, unidad: 250 },
      beverages: { ml: 0.2, unidad: 150 },
      other: { g: 1, ml: 0.5, unidad: 100 }
    };
    
    const categoryPrices = priceEstimates[item.category] || priceEstimates.other;
    const unitPrice = categoryPrices[item.unit] || categoryPrices.unidad || 1;
    
    if (item.packageSize) {
      return item.packageSize.quantity * item.packageSize.amount * unitPrice;
    }
    
    return Math.round(item.totalAmount * unitPrice);
  }

  /**
   * Estimate total cost
   */
  private estimateTotal(items: ShoppingListItem[]): number {
    return items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  }
}

// Export singleton instance
export const intelligentShoppingParser = new IntelligentShoppingParser();