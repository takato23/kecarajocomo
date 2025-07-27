import type { Recipe, UserPreferences, MealType, MealSlot } from '../types';
import { logger } from '@/services/logger';

/**
 * Scores a recipe based on user preferences
 */
export function scoreRecipe(
  recipe: Recipe,
  preferences: UserPreferences,
  context?: {
    mealType?: MealType;
    existingMeals?: Recipe[];
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    pantryItems?: string[];
  }
): number {
  let score = 0;
  
  // Dietary preference matching (highest weight)
  const dietaryMatch = calculateDietaryMatch(recipe, preferences);
  score += dietaryMatch * 30;
  
  // Cooking time preference
  if (recipe.cookTime + recipe.prepTime <= preferences.maxCookingTime) {
    score += 20;
  } else {
    score -= 10;
  }
  
  // Cooking skill matching
  const skillMatch = calculateSkillMatch(recipe, preferences);
  score += skillMatch * 15;
  
  // Cuisine preference
  if (recipe.cuisine && preferences.cuisinePreferences.includes(recipe.cuisine.toLowerCase())) {
    score += 15;
  }
  
  // Ingredient preferences
  const ingredientScore = calculateIngredientScore(recipe, preferences);
  score += ingredientScore * 10;
  
  // Context-based scoring
  if (context) {
    // Variety bonus (avoid repetition)
    if (context.existingMeals && preferences.preferVariety) {
      const varietyScore = calculateVarietyScore(recipe, context.existingMeals);
      score += varietyScore * 10;
    }
    
    // Seasonal ingredients bonus
    if (context.season && preferences.useSeasonalIngredients) {
      const seasonalScore = calculateSeasonalScore(recipe, context.season);
      score += seasonalScore * 5;
    }
    
    // Pantry items bonus
    if (context.pantryItems && preferences.considerPantryItems) {
      const pantryScore = calculatePantryScore(recipe, context.pantryItems);
      score += pantryScore * 5;
    }
  }
  
  // Rating bonus
  if (recipe.rating) {
    score += (recipe.rating / 5) * 10;
  }
  
  // Favorite bonus
  if (recipe.isFavorite) {
    score += 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates dietary preference match
 */
function calculateDietaryMatch(recipe: Recipe, preferences: UserPreferences): number {
  if (!recipe.dietaryLabels || recipe.dietaryLabels.length === 0) {
    return 0.5; // Neutral score for unlabeled recipes
  }
  
  const userDiets = preferences.dietaryPreferences;
  const recipeDiets = recipe.dietaryLabels;
  
  // Check if recipe violates any dietary restrictions
  for (const diet of userDiets) {
    if (diet === 'vegan' && !recipeDiets.includes('vegan')) {
      // Recipe must be vegan for vegan users
      return 0;
    }
    if (diet === 'vegetarian' && !recipeDiets.includes('vegetarian') && !recipeDiets.includes('vegan')) {
      // Recipe must be at least vegetarian
      return 0;
    }
    // Add more dietary restriction checks as needed
  }
  
  // Calculate positive match
  const matchCount = recipeDiets.filter(diet => userDiets.includes(diet)).length;
  return matchCount / Math.max(userDiets.length, 1);
}

/**
 * Calculates cooking skill match
 */
function calculateSkillMatch(recipe: Recipe, preferences: UserPreferences): number {
  const skillLevels = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3
  };
  
  const userSkill = skillLevels[preferences.cookingSkill];
  const recipeSkill = skillLevels[recipe.difficulty === 'easy' ? 'beginner' : 
                                 recipe.difficulty === 'medium' ? 'intermediate' : 'advanced'];
  
  // Perfect match
  if (userSkill === recipeSkill) return 1;
  
  // User can handle easier recipes
  if (userSkill > recipeSkill) return 0.8;
  
  // Recipe is slightly harder
  if (userSkill === recipeSkill - 1) return 0.5;
  
  // Recipe is too hard
  return 0.2;
}

/**
 * Calculates ingredient preference score
 */
function calculateIngredientScore(recipe: Recipe, preferences: UserPreferences): number {
  const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
  let score = 1;
  
  // Check for excluded ingredients
  for (const excluded of preferences.excludedIngredients) {
    if (ingredients.some(i => i.includes(excluded.toLowerCase()))) {
      return 0; // Completely exclude recipes with unwanted ingredients
    }
  }
  
  // Check for allergies
  for (const allergy of preferences.allergies) {
    if (ingredients.some(i => i.includes(allergy.toLowerCase()))) {
      return 0; // Completely exclude recipes with allergens
    }
  }
  
  // Bonus for preferred ingredients
  let preferredCount = 0;
  for (const preferred of preferences.preferredIngredients) {
    if (ingredients.some(i => i.includes(preferred.toLowerCase()))) {
      preferredCount++;
    }
  }
  
  if (preferences.preferredIngredients.length > 0) {
    score += (preferredCount / preferences.preferredIngredients.length) * 0.5;
  }
  
  return Math.min(1, score);
}

/**
 * Calculates variety score to avoid repetition
 */
function calculateVarietyScore(recipe: Recipe, existingMeals: Recipe[]): number {
  // Check for exact duplicates
  if (existingMeals.some(meal => meal.id === recipe.id)) {
    return -0.5; // Penalty for exact duplicate
  }
  
  // Check for similar cuisines
  const cuisineCounts = existingMeals.reduce((acc, meal) => {
    if (meal.cuisine) {
      acc[meal.cuisine] = (acc[meal.cuisine] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  if (recipe.cuisine && cuisineCounts[recipe.cuisine] >= 3) {
    return -0.3; // Too much of the same cuisine
  }
  
  // Check for similar main ingredients
  const mainIngredients = extractMainIngredients(recipe);
  const existingMainIngredients = existingMeals.flatMap(extractMainIngredients);
  const overlap = mainIngredients.filter(i => existingMainIngredients.includes(i)).length;
  
  if (overlap > mainIngredients.length * 0.5) {
    return -0.2; // Too similar to existing meals
  }
  
  return 1; // Good variety
}

/**
 * Extracts main ingredients (simplified version)
 */
function extractMainIngredients(recipe: Recipe): string[] {
  return recipe.ingredients
    .filter(i => i.amount > 50 || i.category === 'meat' || i.category === 'produce')
    .map(i => i.name.toLowerCase())
    .slice(0, 3);
}

/**
 * Calculates seasonal ingredient score
 */
function calculateSeasonalScore(recipe: Recipe, season: string): number {
  // Simplified seasonal ingredient mapping
  const seasonalIngredients: Record<string, string[]> = {
    spring: ['espárragos', 'guisantes', 'fresas', 'espinacas', 'alcachofas'],
    summer: ['tomate', 'pepino', 'melón', 'sandía', 'pimiento', 'berenjena'],
    fall: ['calabaza', 'manzana', 'pera', 'setas', 'granada'],
    winter: ['col', 'brócoli', 'naranja', 'mandarina', 'puerro', 'coliflor']
  };
  
  const seasonal = seasonalIngredients[season] || [];
  const ingredients = recipe.ingredients.map(i => i.name.toLowerCase());
  
  const seasonalCount = ingredients.filter(i => 
    seasonal.some(s => i.includes(s))
  ).length;
  
  return seasonalCount > 0 ? Math.min(1, seasonalCount / 3) : 0;
}

/**
 * Calculates pantry utilization score
 */
function calculatePantryScore(recipe: Recipe, pantryItems: string[]): number {
  const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
  const pantryLower = pantryItems.map(i => i.toLowerCase());
  
  const pantryUsed = recipeIngredients.filter(i => 
    pantryLower.some(p => i.includes(p) || p.includes(i))
  ).length;
  
  return Math.min(1, pantryUsed / Math.max(recipeIngredients.length, 1));
}

/**
 * Suggests recipes for a specific meal slot
 */
export function suggestRecipesForSlot(
  recipes: Record<string, Recipe>,
  preferences: UserPreferences,
  slot: {
    mealType: MealType;
    dayOfWeek: number;
  },
  existingWeekPlan?: MealSlot[],
  options?: {
    maxSuggestions?: number;
    minScore?: number;
    excludeIds?: string[];
  }
): Recipe[] {
  const {
    maxSuggestions = 5,
    minScore = 30,
    excludeIds = []
  } = options || {};
  
  // Get existing recipes from the week
  const existingRecipes = existingWeekPlan
    ?.filter(s => s.recipe)
    .map(s => s.recipe!);
  
  // Score all recipes
  const scoredRecipes = Object.values(recipes)
    .filter(recipe => !excludeIds.includes(recipe.id))
    .map(recipe => ({
      recipe,
      score: scoreRecipe(recipe, preferences, {
        mealType: slot.mealType,
        existingMeals: existingRecipes,
        season: getCurrentSeason(),
        pantryItems: [] // Could be populated from pantry service
      })
    }))
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score);
  
  // Filter by meal type if recipes have meal type tags
  const mealTypeFiltered = scoredRecipes.filter(item => {
    const tags = item.recipe.tags || [];
    return tags.includes(slot.mealType) || tags.length === 0;
  });
  
  const finalList = mealTypeFiltered.length > 0 ? mealTypeFiltered : scoredRecipes;
  
  return finalList
    .slice(0, maxSuggestions)
    .map(item => item.recipe);
}

/**
 * Gets current season based on date
 */
function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Generates a balanced meal plan for the week
 */
export function generateBalancedMealPlan(
  recipes: Record<string, Recipe>,
  preferences: UserPreferences,
  slots: Array<{ dayOfWeek: number; mealType: MealType }>,
  options?: {
    lockedSlots?: string[];
    targetCaloriesPerDay?: number;
    balanceNutrition?: boolean;
  }
): Map<string, Recipe> {
  const mealPlan = new Map<string, Recipe>();
  const usedRecipeIds = new Set<string>();
  
  // Sort slots by day and meal type for better planning
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    const mealOrder = { desayuno: 0, almuerzo: 1, merienda: 2, cena: 3 };
    return mealOrder[a.mealType] - mealOrder[b.mealType];
  });
  
  // Plan each slot
  for (const slot of sortedSlots) {
    const slotKey = `${slot.dayOfWeek}-${slot.mealType}`;
    
    // Skip locked slots
    if (options?.lockedSlots?.includes(slotKey)) continue;
    
    // Get existing meals for variety calculation
    const plannedMeals = Array.from(mealPlan.values());
    
    // Suggest recipes
    const suggestions = suggestRecipesForSlot(
      recipes,
      preferences,
      slot,
      [], // Could pass existing week plan here
      {
        excludeIds: Array.from(usedRecipeIds),
        maxSuggestions: 10
      }
    );
    
    if (suggestions.length > 0) {
      // Pick from top suggestions with some randomness for variety
      const topCount = Math.min(3, suggestions.length);
      const selected = suggestions[Math.floor(Math.random() * topCount)];
      
      mealPlan.set(slotKey, selected);
      
      // Avoid using the same recipe twice in the week
      if (preferences.preferVariety) {
        usedRecipeIds.add(selected.id);
      }
    }
  }
  
  return mealPlan;
}