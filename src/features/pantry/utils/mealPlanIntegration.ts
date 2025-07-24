import type { 
  PantryItem, 
  PantryAvailability, 
  RecipeIngredient,
  ShoppingListItem,
  ConversionResult,
  UnitConversion 
} from '../types';

// Common unit conversions for cooking ingredients
const UNIT_CONVERSIONS: UnitConversion[] = [
  // Weight conversions
  { from_unit: 'kg', to_unit: 'g', conversion_factor: 1000, ingredient_specific: false },
  { from_unit: 'lbs', to_unit: 'oz', conversion_factor: 16, ingredient_specific: false },
  { from_unit: 'g', to_unit: 'kg', conversion_factor: 0.001, ingredient_specific: false },
  { from_unit: 'oz', to_unit: 'lbs', conversion_factor: 0.0625, ingredient_specific: false },
  
  // Volume conversions
  { from_unit: 'l', to_unit: 'ml', conversion_factor: 1000, ingredient_specific: false },
  { from_unit: 'ml', to_unit: 'l', conversion_factor: 0.001, ingredient_specific: false },
  { from_unit: 'gal', to_unit: 'qt', conversion_factor: 4, ingredient_specific: false },
  { from_unit: 'qt', to_unit: 'pt', conversion_factor: 2, ingredient_specific: false },
  { from_unit: 'pt', to_unit: 'cups', conversion_factor: 2, ingredient_specific: false },
  { from_unit: 'cups', to_unit: 'fl oz', conversion_factor: 8, ingredient_specific: false },
  { from_unit: 'fl oz', to_unit: 'tbsp', conversion_factor: 2, ingredient_specific: false },
  { from_unit: 'tbsp', to_unit: 'tsp', conversion_factor: 3, ingredient_specific: false },
  
  // Common cooking conversions
  { from_unit: 'cups', to_unit: 'tbsp', conversion_factor: 16, ingredient_specific: false },
  { from_unit: 'cups', to_unit: 'tsp', conversion_factor: 48, ingredient_specific: false },
];

/**
 * Convert between units using common conversion factors
 */
export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string
): ConversionResult | null {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    return {
      original_quantity: quantity,
      original_unit: fromUnit,
      converted_quantity: quantity,
      converted_unit: toUnit,
      conversion_factor: 1,
    };
  }

  // Find direct conversion
  const directConversion = UNIT_CONVERSIONS.find(
    conv => conv.from_unit === fromUnit && conv.to_unit === toUnit
  );

  if (directConversion) {
    return {
      original_quantity: quantity,
      original_unit: fromUnit,
      converted_quantity: quantity * directConversion.conversion_factor,
      converted_unit: toUnit,
      conversion_factor: directConversion.conversion_factor,
    };
  }

  // Find reverse conversion
  const reverseConversion = UNIT_CONVERSIONS.find(
    conv => conv.from_unit === toUnit && conv.to_unit === fromUnit
  );

  if (reverseConversion) {
    return {
      original_quantity: quantity,
      original_unit: fromUnit,
      converted_quantity: quantity / reverseConversion.conversion_factor,
      converted_unit: toUnit,
      conversion_factor: 1 / reverseConversion.conversion_factor,
    };
  }

  // No conversion found
  return null;
}

/**
 * Check pantry availability for recipe ingredients
 */
export function checkPantryAvailability(
  recipeIngredients: RecipeIngredient[],
  pantryItems: PantryItem[]
): PantryAvailability[] {
  return recipeIngredients.map((ingredient) => {
    // Find matching pantry items (by name, could be improved with ingredient ID matching)
    const matchingItems = pantryItems.filter(
      item => item.ingredient_name.toLowerCase().includes(ingredient.ingredient_name.toLowerCase()) ||
              ingredient.ingredient_name.toLowerCase().includes(item.ingredient_name.toLowerCase())
    );

    if (matchingItems.length === 0) {
      return {
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        required_quantity: ingredient.quantity,
        required_unit: ingredient.unit,
        available_quantity: 0,
        available_unit: ingredient.unit,
        sufficient: false,
      };
    }

    // Calculate total available quantity (in recipe's unit)
    let totalAvailable = 0;
    let conversionRatio = 1;

    for (const item of matchingItems) {
      const conversion = convertUnits(item.quantity, item.unit, ingredient.unit);
      if (conversion) {
        totalAvailable += conversion.converted_quantity;
        conversionRatio = conversion.conversion_factor;
      } else {
        // If no conversion possible, assume same unit (best effort)
        totalAvailable += item.quantity;
      }
    }

    return {
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      required_quantity: ingredient.quantity,
      required_unit: ingredient.unit,
      available_quantity: totalAvailable,
      available_unit: ingredient.unit,
      sufficient: totalAvailable >= ingredient.quantity,
      conversion_ratio: conversionRatio,
    };
  });
}

/**
 * Generate shopping list from recipe ingredients not available in pantry
 */
export function generateShoppingList(
  recipeIngredients: RecipeIngredient[],
  pantryAvailability: PantryAvailability[],
  existingShoppingList: ShoppingListItem[] = []
): ShoppingListItem[] {
  const shoppingItems: ShoppingListItem[] = [];

  recipeIngredients.forEach((ingredient, index) => {
    const availability = pantryAvailability[index];
    
    if (!availability.sufficient) {
      const neededQuantity = availability.required_quantity - availability.available_quantity;
      
      // Check if item already exists in shopping list
      const existingItem = existingShoppingList.find(
        item => item.ingredient_name.toLowerCase() === ingredient.ingredient_name.toLowerCase()
      );

      if (existingItem) {
        // Update existing item quantity
        const conversion = convertUnits(
          existingItem.quantity,
          existingItem.unit,
          ingredient.unit
        );
        
        const existingInRecipeUnit = conversion ? conversion.converted_quantity : existingItem.quantity;
        const totalNeeded = Math.max(neededQuantity, existingInRecipeUnit);
        
        shoppingItems.push({
          ...existingItem,
          quantity: totalNeeded,
          unit: ingredient.unit,
        });
      } else {
        // Add new item
        shoppingItems.push({
          id: `shopping-${ingredient.ingredient_id}`,
          ingredient_id: ingredient.ingredient_id,
          ingredient_name: ingredient.ingredient_name,
          quantity: Math.ceil(neededQuantity * 1.1), // Add 10% buffer
          unit: ingredient.unit,
          category: 'Other', // Could be improved with ingredient category mapping
          priority: ingredient.optional ? 'low' : 'medium',
          checked: false,
        });
      }
    }
  });

  return shoppingItems;
}

/**
 * Consume ingredients from pantry when cooking a recipe
 */
export function consumeIngredientsFromPantry(
  recipeIngredients: RecipeIngredient[],
  pantryItems: PantryItem[],
  servings: number = 1
): {
  consumed: Array<{ pantryItemId: string; consumedQuantity: number }>;
  remaining: PantryItem[];
} {
  const consumed: Array<{ pantryItemId: string; consumedQuantity: number }> = [];
  const remaining: PantryItem[] = [...pantryItems];

  recipeIngredients.forEach((ingredient) => {
    const neededQuantity = ingredient.quantity * servings;
    let remainingNeeded = neededQuantity;

    // Find matching pantry items
    const matchingIndexes = remaining
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => 
        item.ingredient_name.toLowerCase().includes(ingredient.ingredient_name.toLowerCase()) ||
        ingredient.ingredient_name.toLowerCase().includes(item.ingredient_name.toLowerCase())
      );

    // Consume from pantry items (FIFO - oldest expiration dates first)
    matchingIndexes
      .sort((a, b) => {
        const aExp = a.item.expiration_date ? new Date(a.item.expiration_date).getTime() : Infinity;
        const bExp = b.item.expiration_date ? new Date(b.item.expiration_date).getTime() : Infinity;
        return aExp - bExp;
      })
      .forEach(({ item, index }) => {
        if (remainingNeeded <= 0) return;

        const conversion = convertUnits(item.quantity, item.unit, ingredient.unit);
        const availableInRecipeUnit = conversion ? conversion.converted_quantity : item.quantity;

        if (availableInRecipeUnit > 0) {
          const toConsume = Math.min(availableInRecipeUnit, remainingNeeded);
          const toConsumeInPantryUnit = conversion ? toConsume / conversion.conversion_factor : toConsume;

          consumed.push({
            pantryItemId: item.id,
            consumedQuantity: toConsumeInPantryUnit,
          });

          // Update remaining quantity
          const newQuantity = item.quantity - toConsumeInPantryUnit;
          if (newQuantity > 0.001) { // Keep item if significant quantity remains
            remaining[index] = {
              ...item,
              quantity: newQuantity,
            };
          } else {
            // Remove item if quantity is negligible
            remaining.splice(index, 1);
          }

          remainingNeeded -= toConsume;
        }
      });
  });

  return { consumed, remaining };
}

/**
 * Suggest recipes based on available pantry items
 */
export function suggestRecipesFromPantry(
  pantryItems: PantryItem[],
  availableRecipes: Array<{ id: string; name: string; ingredients: RecipeIngredient[] }>
): Array<{
  recipe: { id: string; name: string; ingredients: RecipeIngredient[] };
  matchScore: number;
  availableIngredients: number;
  totalIngredients: number;
  missingIngredients: string[];
}> {
  return availableRecipes
    .map((recipe) => {
      const availability = checkPantryAvailability(recipe.ingredients, pantryItems);
      const availableCount = availability.filter(a => a.sufficient).length;
      const totalCount = recipe.ingredients.length;
      const missingIngredients = availability
        .filter(a => !a.sufficient)
        .map(a => a.ingredient_name);

      return {
        recipe,
        matchScore: availableCount / totalCount,
        availableIngredients: availableCount,
        totalIngredients: totalCount,
        missingIngredients,
      };
    })
    .filter(suggestion => suggestion.matchScore > 0.3) // At least 30% ingredients available
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate recipe cost based on pantry item costs
 */
export function calculateRecipeCost(
  recipeIngredients: RecipeIngredient[],
  pantryItems: PantryItem[],
  servings: number = 1
): {
  totalCost: number;
  itemCosts: Array<{
    ingredient: string;
    cost: number;
    fromPantry: boolean;
  }>;
} {
  const itemCosts: Array<{ ingredient: string; cost: number; fromPantry: boolean }> = [];
  let totalCost = 0;

  recipeIngredients.forEach((ingredient) => {
    const neededQuantity = ingredient.quantity * servings;
    
    // Find matching pantry items with cost information
    const matchingItems = pantryItems.filter(
      item => 
        item.cost &&
        (item.ingredient_name.toLowerCase().includes(ingredient.ingredient_name.toLowerCase()) ||
         ingredient.ingredient_name.toLowerCase().includes(item.ingredient_name.toLowerCase()))
    );

    let ingredientCost = 0;
    let foundInPantry = false;

    if (matchingItems.length > 0) {
      // Calculate cost based on pantry items
      const totalPantryCost = matchingItems.reduce((sum, item) => sum + (item.cost || 0), 0);
      const totalPantryQuantity = matchingItems.reduce((sum, item) => {
        const conversion = convertUnits(item.quantity, item.unit, ingredient.unit);
        return sum + (conversion ? conversion.converted_quantity : item.quantity);
      }, 0);

      if (totalPantryQuantity > 0) {
        const costPerUnit = totalPantryCost / totalPantryQuantity;
        ingredientCost = costPerUnit * neededQuantity;
        foundInPantry = true;
      }
    }

    // If not found in pantry or no cost info, estimate cost
    if (!foundInPantry) {
      // Basic cost estimation (could be improved with market data)
      const estimatedCostPerUnit = {
        'cups': 0.50,
        'tbsp': 0.10,
        'tsp': 0.05,
        'lbs': 3.00,
        'oz': 0.25,
        'pieces': 0.30,
      }[ingredient.unit] || 0.20;

      ingredientCost = estimatedCostPerUnit * neededQuantity;
    }

    itemCosts.push({
      ingredient: ingredient.ingredient_name,
      cost: ingredientCost,
      fromPantry: foundInPantry,
    });

    totalCost += ingredientCost;
  });

  return { totalCost, itemCosts };
}

/**
 * Update pantry items after shopping
 */
export function updatePantryFromShopping(
  currentPantry: PantryItem[],
  shoppingItems: ShoppingListItem[],
  userId: string
): PantryItem[] {
  const updatedPantry = [...currentPantry];

  shoppingItems
    .filter(item => item.checked)
    .forEach((shoppingItem) => {
      // Find existing pantry item
      const existingIndex = updatedPantry.findIndex(
        pantryItem => pantryItem.ingredient_name.toLowerCase() === shoppingItem.ingredient_name.toLowerCase()
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        const existingItem = updatedPantry[existingIndex];
        const conversion = convertUnits(
          shoppingItem.quantity,
          shoppingItem.unit,
          existingItem.unit
        );

        updatedPantry[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + (conversion ? conversion.converted_quantity : shoppingItem.quantity),
          updated_at: new Date(),
        };
      } else {
        // Add new pantry item
        const newPantryItem: PantryItem = {
          id: `pantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          ingredient_id: shoppingItem.ingredient_id,
          ingredient_name: shoppingItem.ingredient_name,
          quantity: shoppingItem.quantity,
          unit: shoppingItem.unit,
          category: shoppingItem.category,
          cost: shoppingItem.estimated_cost,
          created_at: new Date(),
          updated_at: new Date(),
        };

        updatedPantry.push(newPantryItem);
      }
    });

  return updatedPantry;
}