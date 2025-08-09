import type { 
  WeekPlan, 
  ShoppingList, 
  ShoppingListItem, 
  ShoppingListCategory,
  IngredientCategory,
  Ingredient 
} from '../types';
import { logger } from '@/services/logger';

/**
 * Generates a shopping list from a week plan
 * Consolidates ingredients from all recipes and groups by category
 */
export function generateShoppingList(
  weekPlan: WeekPlan,
  pantryItems: string[] = []
): ShoppingList {
  const ingredientMap = new Map<string, ShoppingListItem>();
  const recipeIngredientMap = new Map<string, string[]>();
  
  // Process all meal slots
  weekPlan.slots.forEach(slot => {
    if (!slot.recipe || !slot.recipe.ingredients) return;
    
    slot.recipe.ingredients.forEach(ingredient => {
      const key = normalizeIngredientName(ingredient.name);
      
      // Track which recipes use this ingredient
      if (!recipeIngredientMap.has(key)) {
        recipeIngredientMap.set(key, []);
      }
      recipeIngredientMap.get(key)!.push(slot.recipe!.name);
      
      // Aggregate quantities
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        
        // Try to combine quantities if units match
        if (existing.unit === ingredient.unit) {
          existing.totalAmount += ingredient.amount * slot.servings;
        } else {
          // Different units - create a note about the additional quantity
          const additionalNote = `${ingredient.amount * slot.servings} ${ingredient.unit}`;
          existing.notes = existing.notes 
            ? `${existing.notes}, ${additionalNote}` 
            : additionalNote;
        }
      } else {
        // New ingredient
        ingredientMap.set(key, {
          id: `item-${key}`,
          ingredientName: ingredient.name,
          totalAmount: ingredient.amount * slot.servings,
          unit: ingredient.unit,
          category: ingredient.category,
          recipeNames: [],
          isPurchased: false,
          notes: ingredient.notes
        });
      }
    });
  });
  
  // Add recipe names to items
  ingredientMap.forEach((item, key) => {
    item.recipeNames = [...new Set(recipeIngredientMap.get(key) || [])];
  });
  
  // Filter out pantry items if provided
  const itemsToShop = Array.from(ingredientMap.values()).filter(
    item => !pantryItems.includes(normalizeIngredientName(item.ingredientName))
  );
  
  // Group by category
  const categories = groupByCategory(itemsToShop);
  
  // Calculate estimated total (mock for now - could integrate with pricing service)
  const estimatedTotal = calculateEstimatedTotal(itemsToShop);
  
  return {
    id: `shopping-${Date.now()}`,
    userId: weekPlan.userId,
    weekPlanId: weekPlan.id,
    items: itemsToShop,
    categories,
    estimatedTotal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Groups shopping list items by category
 */
function groupByCategory(items: ShoppingListItem[]): ShoppingListCategory[] {
  const categoryMap = new Map<IngredientCategory, ShoppingListItem[]>();
  
  items.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, []);
    }
    categoryMap.get(item.category)!.push(item);
  });
  
  const categories: ShoppingListCategory[] = [];
  const categoryOrder: IngredientCategory[] = [
    'produce',
    'meat',
    'dairy',
    'grains',
    'pantry',
    'spices',
    'frozen',
    'beverages',
    'other'
  ];
  
  categoryOrder.forEach(category => {
    const items = categoryMap.get(category);
    if (items && items.length > 0) {
      categories.push({
        name: category,
        items: items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
        subtotal: items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
      });
    }
  });
  
  return categories;
}

/**
 * Normalizes ingredient names for comparison
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Calculates estimated total cost
 * This is a mock implementation - in production would use pricing service
 */
function calculateEstimatedTotal(items: ShoppingListItem[]): number {
  // Mock pricing logic - assign random prices for demo
  return items.reduce((total, item) => {
    // Mock price calculation based on category and amount
    const basePrice = getBasePriceByCategory(item.category);
    const estimatedPrice = basePrice * (item.totalAmount || 1);
    item.estimatedPrice = Math.round(estimatedPrice * 100) / 100;
    return total + item.estimatedPrice;
  }, 0);
}

/**
 * Gets base price by category (mock implementation)
 */
function getBasePriceByCategory(category: IngredientCategory): number {
  const basePrices: Record<IngredientCategory, number> = {
    produce: 2.5,
    meat: 8.0,
    dairy: 3.5,
    grains: 2.0,
    pantry: 4.0,
    spices: 5.0,
    frozen: 4.5,
    beverages: 3.0,
    other: 3.0
  };
  
  return basePrices[category] || 3.0;
}

/**
 * Converts units for better consolidation
 */
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number | null {
  const conversions: Record<string, Record<string, number>> = {
    // Volume conversions
    'ml': { 'l': 0.001, 'cup': 0.00422675, 'tbsp': 0.0676280, 'tsp': 0.202884 },
    'l': { 'ml': 1000, 'cup': 4.22675, 'tbsp': 67.628, 'tsp': 202.884 },
    'cup': { 'ml': 236.588, 'l': 0.236588, 'tbsp': 16, 'tsp': 48 },
    'tbsp': { 'ml': 14.7868, 'l': 0.0147868, 'cup': 0.0625, 'tsp': 3 },
    'tsp': { 'ml': 4.92892, 'l': 0.00492892, 'cup': 0.0208333, 'tbsp': 0.333333 },
    
    // Weight conversions
    'g': { 'kg': 0.001, 'oz': 0.035274, 'lb': 0.00220462 },
    'kg': { 'g': 1000, 'oz': 35.274, 'lb': 2.20462 },
    'oz': { 'g': 28.3495, 'kg': 0.0283495, 'lb': 0.0625 },
    'lb': { 'g': 453.592, 'kg': 0.453592, 'oz': 16 }
  };
  
  // Same unit
  if (fromUnit === toUnit) return amount;
  
  // Direct conversion available
  if (conversions[fromUnit]?.[toUnit]) {
    return amount * conversions[fromUnit][toUnit];
  }
  
  // Try reverse conversion
  if (conversions[toUnit]?.[fromUnit]) {
    return amount / conversions[toUnit][fromUnit];
  }
  
  // No conversion available
  return null;
}

/**
 * Suggests package sizes for shopping
 */
export function suggestPackageSizes(item: ShoppingListItem): ShoppingListItem['packageInfo'] {
  // Common package sizes by category
  const packageSizes: Record<IngredientCategory, Array<{ amount: number; unit: string }>> = {
    produce: [
      { amount: 1, unit: 'kg' },
      { amount: 500, unit: 'g' },
      { amount: 1, unit: 'unidad' }
    ],
    meat: [
      { amount: 1, unit: 'kg' },
      { amount: 500, unit: 'g' },
      { amount: 250, unit: 'g' }
    ],
    dairy: [
      { amount: 1, unit: 'l' },
      { amount: 500, unit: 'ml' },
      { amount: 250, unit: 'g' }
    ],
    grains: [
      { amount: 1, unit: 'kg' },
      { amount: 500, unit: 'g' }
    ],
    pantry: [
      { amount: 1, unit: 'kg' },
      { amount: 500, unit: 'g' },
      { amount: 1, unit: 'l' }
    ],
    spices: [
      { amount: 100, unit: 'g' },
      { amount: 50, unit: 'g' }
    ],
    frozen: [
      { amount: 1, unit: 'kg' },
      { amount: 500, unit: 'g' }
    ],
    beverages: [
      { amount: 1, unit: 'l' },
      { amount: 2, unit: 'l' }
    ],
    other: [
      { amount: 1, unit: 'unidad' }
    ]
  };
  
  const availableSizes = packageSizes[item.category] || packageSizes.other;
  
  // Find the best package size
  for (const size of availableSizes) {
    const convertedAmount = convertUnit(item.totalAmount, item.unit, size.unit);
    if (convertedAmount !== null) {
      const quantity = Math.ceil(convertedAmount / size.amount);
      return {
        amount: size.amount,
        unit: size.unit,
        quantity
      };
    }
  }
  
  // Default to current unit
  return {
    amount: item.totalAmount,
    unit: item.unit,
    quantity: 1
  };
}

/**
 * Optimizes shopping list by suggesting substitutions and consolidations
 */
export function optimizeShoppingList(shoppingList: ShoppingList): ShoppingList {
  const optimizedItems = shoppingList.items.map(item => {
    // Add package size suggestions
    const packageInfo = suggestPackageSizes(item);
    
    return {
      ...item,
      packageInfo
    };
  });
  
  return {
    ...shoppingList,
    items: optimizedItems,
    categories: groupByCategory(optimizedItems)
  };
}