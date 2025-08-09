/**
 * Shopping List Utilities for Argentine Meal Planning
 * Aggregates ingredients, handles pricing, and optimizes shopping routes
 */

import { ArgentineWeeklyPlan, ShoppingList, ShoppingListItem, ShoppingCategory, PantryItem, IngredientCategory } from '@/types/meal-planning/argentine';
import { nanoid } from 'nanoid';

// ============================================================================
// CATEGORY MAPPINGS FOR ARGENTINE SUPERMARKETS
// ============================================================================

const CATEGORY_MAPPING: Record<IngredientCategory, { displayName: string; aisle: string; priority: number }> = {
  carnes: { displayName: 'Carnes y Fiambres', aisle: 'Carnicería', priority: 1 },
  verduras: { displayName: 'Frutas y Verduras', aisle: 'Verdulería', priority: 2 },
  frutas: { displayName: 'Frutas', aisle: 'Verdulería', priority: 2 },
  lacteos: { displayName: 'Lácteos', aisle: 'Lácteos', priority: 3 },
  cereales: { displayName: 'Cereales y Granos', aisle: 'Almacén', priority: 4 },
  condimentos: { displayName: 'Condimentos y Especias', aisle: 'Almacén', priority: 5 },
  bebidas: { displayName: 'Bebidas', aisle: 'Bebidas', priority: 6 },
  otros: { displayName: 'Otros', aisle: 'Varios', priority: 7 }
};

// Argentine supermarket optimization - typical shopping route
const OPTIMAL_SHOPPING_ORDER: IngredientCategory[] = [
  'otros',      // Limpieza y artículos secos primero
  'cereales',   // Almacén - productos secos
  'condimentos', // Condimentos y especias
  'bebidas',    // Bebidas
  'carnes',     // Carnicería - productos con refrigeración
  'lacteos',    // Lácteos - refrigerados
  'verduras',   // Verduras
  'frutas'      // Frutas - última para evitar aplastamiento
];

// ============================================================================
// INGREDIENT AGGREGATION
// ============================================================================

interface IngredientAggregation {
  [key: string]: {
    name: string;
    category: IngredientCategory;
    totalAmount: number;
    unit: string;
    recipes: string[];
    estimatedCost: number;
    priority: 'alta' | 'media' | 'baja';
  };
}

/**
 * Aggregates ingredients from all meals in the weekly plan
 */
export function aggregateIngredients(weeklyPlan: ArgentineWeeklyPlan, pantry: PantryItem[]): IngredientAggregation {
  const aggregated: IngredientAggregation = {};
  const pantryItems = new Set(pantry.map(item => item.name.toLowerCase()));

  // Process each day's meals
  weeklyPlan.days.forEach(day => {
    const meals = [day.desayuno, day.almuerzo, day.merienda, day.cena].filter(Boolean);
    
    meals.forEach(meal => {
      if (!meal) return;
      
      meal.recipe.ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase().trim();
        const totalAmount = ingredient.amount * meal.servings;
        
        // Skip if ingredient is already in pantry with sufficient quantity
        const pantryItem = pantry.find(item => item.name.toLowerCase() === key);
        if (pantryItem && pantryItem.amount >= totalAmount) {
          return; // Skip this ingredient
        }
        
        // Calculate needed amount (subtract pantry amount if exists)
        const neededAmount = pantryItem 
          ? Math.max(0, totalAmount - pantryItem.amount)
          : totalAmount;
        
        if (neededAmount <= 0) return;
        
        if (aggregated[key]) {
          // Ingredient already exists, add to it
          aggregated[key].totalAmount += neededAmount;
          if (!aggregated[key].recipes.includes(meal.recipe.name)) {
            aggregated[key].recipes.push(meal.recipe.name);
          }
        } else {
          // New ingredient
          aggregated[key] = {
            name: ingredient.name,
            category: ingredient.category,
            totalAmount: neededAmount,
            unit: ingredient.unit,
            recipes: [meal.recipe.name],
            estimatedCost: estimateCost(ingredient.name, neededAmount, ingredient.unit),
            priority: determinePriority(ingredient.category, ingredient.isOptional)
          };
        }
      });
    });
  });

  return aggregated;
}

/**
 * Estimates cost based on Argentine market prices (simplified)
 */
function estimateCost(name: string, amount: number, unit: string): number {
  // Simplified pricing model - in production this would use real price data
  const pricePerUnit: Record<string, number> = {
    // Carnes (per kg)
    'carne': 2500,
    'pollo': 1200,
    'cerdo': 2000,
    'pescado': 1800,
    
    // Verduras (per kg)
    'tomate': 400,
    'cebolla': 300,
    'papa': 250,
    'zanahoria': 350,
    
    // Lácteos
    'leche': 200, // per liter
    'queso': 1500, // per kg
    'manteca': 800,
    
    // Cereales
    'arroz': 180,
    'fideos': 250,
    'harina': 150,
    
    // Condimentos
    'sal': 100,
    'aceite': 600, // per liter
    'vinagre': 300,
    
    // Default fallback
    'default': 200
  };
  
  const nameKey = name.toLowerCase();
  const unitPrice = pricePerUnit[nameKey] || pricePerUnit['default'];
  
  // Convert units to standard (kg or liter)
  let standardAmount = amount;
  if (unit === 'g' || unit === 'gramos') {
    standardAmount = amount / 1000;
  } else if (unit === 'ml' || unit === 'cc') {
    standardAmount = amount / 1000;
  }
  
  return Math.round(unitPrice * standardAmount);
}

/**
 * Determines shopping priority based on category and optionality
 */
function determinePriority(category: IngredientCategory, isOptional?: boolean): 'alta' | 'media' | 'baja' {
  if (isOptional) return 'baja';
  
  switch (category) {
    case 'carnes':
    case 'verduras':
    case 'lacteos':
      return 'alta';
    case 'cereales':
    case 'frutas':
      return 'media';
    default:
      return 'baja';
  }
}

// ============================================================================
// SHOPPING LIST GENERATION
// ============================================================================

/**
 * Generates a complete shopping list from weekly plan and pantry
 */
export function aggregateShoppingList(weeklyPlan: ArgentineWeeklyPlan, pantry: PantryItem[]): ShoppingList {
  const aggregated = aggregateIngredients(weeklyPlan, pantry);
  
  // Convert to shopping list items
  const items: ShoppingListItem[] = Object.values(aggregated).map(ingredient => ({
    id: nanoid(),
    name: ingredient.name,
    category: ingredient.category,
    amount: ingredient.totalAmount,
    unit: ingredient.unit,
    estimatedCost: ingredient.estimatedCost,
    priority: ingredient.priority,
    inPantry: false,
    recipes: ingredient.recipes,
    checked: false,
    aisle: CATEGORY_MAPPING[ingredient.category]?.aisle,
    alternatives: generateAlternatives(ingredient.name, ingredient.category)
  }));

  // Group by categories
  const categories: ShoppingCategory[] = OPTIMAL_SHOPPING_ORDER.map(categoryKey => {
    const categoryItems = items.filter(item => item.category === categoryKey);
    const subtotal = categoryItems.reduce((sum, item) => sum + item.estimatedCost, 0);
    
    if (categoryItems.length === 0) return null;
    
    return {
      name: categoryKey,
      displayName: CATEGORY_MAPPING[categoryKey].displayName,
      items: categoryItems.sort((a, b) => {
        // Sort by priority first, then by cost (descending)
        const priorityOrder = { alta: 0, media: 1, baja: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.estimatedCost - a.estimatedCost;
      }),
      subtotal,
      aisle: CATEGORY_MAPPING[categoryKey].aisle,
      priority: categoryItems.some(item => item.priority === 'alta') ? 'alta' : 
                categoryItems.some(item => item.priority === 'media') ? 'media' : 'baja'
    };
  }).filter(Boolean) as ShoppingCategory[];

  const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  
  // Optimize for common Argentine supermarket chains
  const stores = optimizeForStores(categories, totalCost);
  
  return {
    id: nanoid(),
    weekPlanId: weeklyPlan.planId,
    userId: weeklyPlan.userId,
    items,
    categories,
    totalCost,
    estimatedCost: Math.round(totalCost * 1.1), // Add 10% buffer
    budgetVariance: calculateBudgetVariance(totalCost, weeklyPlan.preferences?.budget?.weekly),
    stores,
    route: generateOptimalRoute(categories),
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isCompleted: false
  };
}

/**
 * Generates alternatives for common ingredients
 */
function generateAlternatives(name: string, category: IngredientCategory): string[] {
  const alternatives: Record<string, string[]> = {
    // Carnes
    'carne': ['carne picada', 'bifes', 'roast beef'],
    'pollo': ['muslos de pollo', 'pechuga', 'pollo entero'],
    
    // Verduras
    'tomate': ['tomate perita', 'tomate cherry', 'puré de tomate'],
    'cebolla': ['cebolla morada', 'cebollita de verdeo', 'echalotes'],
    
    // Lácteos
    'queso': ['queso cremoso', 'queso rallado', 'queso fresco'],
    'leche': ['leche descremada', 'leche entera', 'leche en polvo'],
    
    // Cereales
    'arroz': ['arroz largo fino', 'arroz integral', 'arroz yamaní'],
    'fideos': ['fideos secos', 'fideos frescos', 'pasta integral']
  };
  
  const nameKey = name.toLowerCase();
  return alternatives[nameKey] || [];
}

/**
 * Optimizes shopping for popular Argentine supermarket chains
 */
function optimizeForStores(categories: ShoppingCategory[], totalCost: number) {
  const storeOptions = [
    {
      name: 'Supermercado (Carrefour/Jumbo)',
      items: categories.flatMap(cat => cat.items.map(item => item.name)),
      subtotal: totalCost,
      benefits: ['Todo en un lugar', 'Variedad de marcas', 'Ofertas semanales']
    },
    {
      name: 'Mayorista (Makro/Vital)',
      items: categories.filter(cat => ['carnes', 'cereales', 'condimentos'].includes(cat.name))
                      .flatMap(cat => cat.items.map(item => item.name)),
      subtotal: Math.round(totalCost * 0.85), // 15% discount for bulk
      benefits: ['Mejores precios', 'Productos en cantidad', 'Ideal para familias']
    },
    {
      name: 'Mercado/Verdulería + Carnicería',
      items: categories.filter(cat => ['verduras', 'frutas', 'carnes'].includes(cat.name))
                      .flatMap(cat => cat.items.map(item => item.name)),
      subtotal: Math.round(totalCost * 0.7), // Better prices for fresh items
      benefits: ['Productos más frescos', 'Precios competitivos', 'Apoyo al comercio local']
    }
  ];
  
  return storeOptions;
}

/**
 * Generates optimal shopping route within supermarket
 */
function generateOptimalRoute(categories: ShoppingCategory[]) {
  const availableCategories = categories.map(cat => cat.name);
  const route = OPTIMAL_SHOPPING_ORDER.filter(cat => availableCategories.includes(cat));
  
  return {
    store: 'Supermercado',
    order: route.map(cat => CATEGORY_MAPPING[cat].displayName)
  };
}

/**
 * Calculates budget variance
 */
function calculateBudgetVariance(estimatedCost: number, weeklyBudget?: number): number {
  if (!weeklyBudget) return 0;
  return ((estimatedCost - weeklyBudget) / weeklyBudget) * 100;
}

// ============================================================================
// SHOPPING LIST UTILITIES
// ============================================================================

/**
 * Adds an item to the shopping list
 */
export function addItemToShoppingList(
  shoppingList: ShoppingList, 
  item: Omit<ShoppingListItem, 'id'>
): ShoppingList {
  const newItem: ShoppingListItem = {
    ...item,
    id: nanoid()
  };
  
  return {
    ...shoppingList,
    items: [...shoppingList.items, newItem],
    totalCost: shoppingList.totalCost + item.estimatedCost,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Removes an item from the shopping list
 */
export function removeItemFromShoppingList(
  shoppingList: ShoppingList, 
  itemId: string
): ShoppingList {
  const item = shoppingList.items.find(i => i.id === itemId);
  if (!item) return shoppingList;
  
  return {
    ...shoppingList,
    items: shoppingList.items.filter(i => i.id !== itemId),
    totalCost: shoppingList.totalCost - item.estimatedCost,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Toggles item completion status
 */
export function toggleItemCompletion(
  shoppingList: ShoppingList, 
  itemId: string
): ShoppingList {
  const items = shoppingList.items.map(item => 
    item.id === itemId 
      ? { ...item, checked: !item.checked }
      : item
  );
  
  const completedItems = items.filter(item => item.checked).length;
  const isCompleted = completedItems === items.length;
  
  return {
    ...shoppingList,
    items,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : undefined,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Gets shopping progress statistics
 */
export function getShoppingProgress(shoppingList: ShoppingList) {
  const total = shoppingList.items.length;
  const completed = shoppingList.items.filter(item => item.checked).length;
  const completedCost = shoppingList.items
    .filter(item => item.checked)
    .reduce((sum, item) => sum + item.estimatedCost, 0);
  
  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    completedCost,
    remainingCost: shoppingList.totalCost - completedCost
  };
}