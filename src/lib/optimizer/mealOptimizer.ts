/**
 * Multi-objective meal plan optimizer
 * Optimizes for: cost, nutrition, pantry usage, seasonality, and variety
 */

import {
  ArgentineWeeklyPlan,
  ArgentineDayPlan,
  Recipe,
  MealType,
  PantryItem,
  UserPreferences,
  ModeType,
} from '@/types/meal-planning/argentine';
import { getSeasonalIngredients, getIngredientPrice } from '@/lib/utils/seasonality';
import { logger } from '@/lib/logger';

interface OptimizationContext {
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
  season: string;
  budget?: number;
}

interface OptimizationScore {
  cost: number;          // 0-1, lower is better
  nutrition: number;     // 0-1, higher is better
  pantryUsage: number;   // 0-1, higher is better
  seasonality: number;   // 0-1, higher is better
  variety: number;       // 0-1, higher is better
  cultural: number;      // 0-1, higher is better (preserves cultural rules)
  total: number;         // Weighted sum
}

// Mode-specific weights for multi-objective optimization
const MODE_WEIGHTS = {
  economico: {
    cost: 0.35,
    nutrition: 0.15,
    pantryUsage: 0.25,
    seasonality: 0.15,
    variety: 0.05,
    cultural: 0.05,
  },
  dieta: {
    cost: 0.10,
    nutrition: 0.40,
    pantryUsage: 0.15,
    seasonality: 0.15,
    variety: 0.15,
    cultural: 0.05,
  },
  fiesta: {
    cost: 0.05,
    nutrition: 0.15,
    pantryUsage: 0.10,
    seasonality: 0.10,
    variety: 0.25,
    cultural: 0.35,
  },
  normal: {
    cost: 0.20,
    nutrition: 0.20,
    pantryUsage: 0.20,
    seasonality: 0.15,
    variety: 0.15,
    cultural: 0.10,
  },
};

/**
 * Optimize a weekly meal plan
 */
export async function optimizeWeeklyPlan(
  plan: ArgentineWeeklyPlan,
  context: OptimizationContext
): Promise<ArgentineWeeklyPlan> {
  const startTime = Date.now();
  
  logger.info('[Optimizer] Starting optimization', {
    mode: context.mode,
    season: context.season,
    pantryItems: context.pantry.length,
  });

  // Clone the plan to avoid mutations
  let optimizedPlan = JSON.parse(JSON.stringify(plan)) as ArgentineWeeklyPlan;
  
  // Optimize each day
  for (let dayIndex = 0; dayIndex < optimizedPlan.days.length; dayIndex++) {
    const day = optimizedPlan.days[dayIndex];
    
    // Skip Sunday (preserve asado tradition)
    if (new Date(day.date).getDay() === 0) {
      continue;
    }
    
    // Skip 29th (preserve ñoquis tradition)
    if (new Date(day.date).getDate() === 29) {
      continue;
    }
    
    // Optimize each meal
    for (const mealType of ['almuerzo', 'cena'] as MealType[]) {
      const currentMeal = day.meals[mealType];
      if (!currentMeal?.recipe) continue;
      
      // Calculate current score
      const currentScore = calculateRecipeScore(
        currentMeal.recipe,
        context,
        optimizedPlan,
        dayIndex,
        mealType
      );
      
      // Try to find better alternatives if score is low
      if (currentScore.total < 0.7) {
        const betterRecipe = await findBetterRecipe(
          currentMeal.recipe,
          context,
          optimizedPlan,
          dayIndex,
          mealType,
          currentScore
        );
        
        if (betterRecipe) {
          logger.info('[Optimizer] Found better recipe', {
            dayIndex,
            mealType,
            oldRecipe: currentMeal.recipe.name,
            newRecipe: betterRecipe.name,
            oldScore: currentScore.total,
            newScore: calculateRecipeScore(
              betterRecipe,
              context,
              optimizedPlan,
              dayIndex,
              mealType
            ).total,
          });
          
          // Update the plan
          optimizedPlan.days[dayIndex].meals[mealType] = {
            ...currentMeal,
            recipe: betterRecipe,
            recipeId: betterRecipe.id,
          };
        }
      }
    }
  }
  
  const duration = Date.now() - startTime;
  logger.info('[Optimizer] Optimization complete', {
    duration,
    mode: context.mode,
  });
  
  return optimizedPlan;
}

/**
 * Calculate optimization score for a recipe
 */
function calculateRecipeScore(
  recipe: Recipe,
  context: OptimizationContext,
  plan: ArgentineWeeklyPlan,
  dayIndex: number,
  mealType: MealType
): OptimizationScore {
  const weights = MODE_WEIGHTS[context.mode];
  
  // Cost score (0-1, lower is better)
  const costScore = calculateCostScore(recipe, context);
  
  // Nutrition score (0-1, higher is better)
  const nutritionScore = calculateNutritionScore(recipe, context);
  
  // Pantry usage score (0-1, higher is better)
  const pantryScore = calculatePantryScore(recipe, context);
  
  // Seasonality score (0-1, higher is better)
  const seasonalityScore = calculateSeasonalityScore(recipe, context);
  
  // Variety score (0-1, higher is better)
  const varietyScore = calculateVarietyScore(recipe, plan, dayIndex);
  
  // Cultural score (0-1, higher is better)
  const culturalScore = calculateCulturalScore(recipe, dayIndex, mealType);
  
  // Calculate weighted total
  const total = 
    (1 - costScore) * weights.cost +
    nutritionScore * weights.nutrition +
    pantryScore * weights.pantryUsage +
    seasonalityScore * weights.seasonality +
    varietyScore * weights.variety +
    culturalScore * weights.cultural;
  
  return {
    cost: costScore,
    nutrition: nutritionScore,
    pantryUsage: pantryScore,
    seasonality: seasonalityScore,
    variety: varietyScore,
    cultural: culturalScore,
    total,
  };
}

/**
 * Calculate cost score for a recipe
 */
function calculateCostScore(recipe: Recipe, context: OptimizationContext): number {
  let totalCost = 0;
  
  for (const ingredient of recipe.ingredients) {
    const price = getIngredientPrice(ingredient.name, context.season);
    const quantity = ingredient.quantity || 1;
    totalCost += price * quantity;
  }
  
  // Normalize to 0-1 (assuming $500 ARS per serving is expensive)
  const costPerServing = totalCost / (recipe.servings || 2);
  const maxCost = context.mode === 'economico' ? 300 : 500;
  
  return Math.min(costPerServing / maxCost, 1);
}

/**
 * Calculate nutrition score for a recipe
 */
function calculateNutritionScore(recipe: Recipe, context: OptimizationContext): number {
  if (!recipe.nutrition) return 0.5; // Neutral if no data
  
  const { calories, protein, carbs, fat } = recipe.nutrition;
  const perServing = recipe.servings || 2;
  
  // Calculate per-serving values
  const caloriesPerServing = calories / perServing;
  const proteinPerServing = protein / perServing;
  const carbsPerServing = carbs / perServing;
  const fatPerServing = fat / perServing;
  
  // Mode-specific targets
  if (context.mode === 'dieta') {
    // Prefer lower calories, higher protein
    const calorieScore = 1 - Math.min(caloriesPerServing / 600, 1);
    const proteinScore = Math.min(proteinPerServing / 30, 1);
    const carbScore = 1 - Math.min(carbsPerServing / 60, 1);
    const fatScore = 1 - Math.min(fatPerServing / 20, 1);
    
    return (calorieScore * 0.3 + proteinScore * 0.4 + carbScore * 0.2 + fatScore * 0.1);
  } else {
    // Normal balanced nutrition
    const calorieScore = caloriesPerServing >= 400 && caloriesPerServing <= 800 ? 1 : 0.5;
    const proteinScore = proteinPerServing >= 20 ? 1 : proteinPerServing / 20;
    const balanceScore = Math.abs(0.5 - carbsPerServing / (carbsPerServing + fatPerServing + proteinPerServing));
    
    return (calorieScore * 0.4 + proteinScore * 0.3 + (1 - balanceScore) * 0.3);
  }
}

/**
 * Calculate pantry usage score
 */
function calculatePantryScore(recipe: Recipe, context: OptimizationContext): number {
  if (!context.pantry.length) return 0.5;
  
  let pantryMatches = 0;
  let totalIngredients = recipe.ingredients.length;
  
  for (const ingredient of recipe.ingredients) {
    const inPantry = context.pantry.some(
      item => item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
              ingredient.name.toLowerCase().includes(item.name.toLowerCase())
    );
    if (inPantry) pantryMatches++;
  }
  
  return pantryMatches / totalIngredients;
}

/**
 * Calculate seasonality score
 */
function calculateSeasonalityScore(recipe: Recipe, context: OptimizationContext): number {
  const seasonalIngredients = getSeasonalIngredients(context.season);
  let seasonalMatches = 0;
  
  for (const ingredient of recipe.ingredients) {
    if (seasonalIngredients.some(si => 
      ingredient.name.toLowerCase().includes(si.toLowerCase()) ||
      si.toLowerCase().includes(ingredient.name.toLowerCase())
    )) {
      seasonalMatches++;
    }
  }
  
  return seasonalMatches / recipe.ingredients.length;
}

/**
 * Calculate variety score (penalize repetition)
 */
function calculateVarietyScore(
  recipe: Recipe,
  plan: ArgentineWeeklyPlan,
  currentDayIndex: number
): number {
  let repetitions = 0;
  const lookbackDays = 3;
  const lookforwardDays = 3;
  
  // Check previous and next days for similar recipes
  for (let i = Math.max(0, currentDayIndex - lookbackDays); 
       i < Math.min(plan.days.length, currentDayIndex + lookforwardDays + 1); 
       i++) {
    if (i === currentDayIndex) continue;
    
    const day = plan.days[i];
    for (const meal of Object.values(day.meals)) {
      if (meal.recipe && areSimilarRecipes(recipe, meal.recipe)) {
        repetitions++;
      }
    }
  }
  
  // More repetitions = lower score
  return Math.max(0, 1 - (repetitions * 0.25));
}

/**
 * Check if two recipes are similar
 */
function areSimilarRecipes(r1: Recipe, r2: Recipe): boolean {
  // Same name
  if (r1.name === r2.name) return true;
  
  // Very similar names
  const name1 = r1.name.toLowerCase();
  const name2 = r2.name.toLowerCase();
  if (name1.includes(name2) || name2.includes(name1)) return true;
  
  // Same main protein
  const proteins = ['carne', 'pollo', 'cerdo', 'pescado', 'verdura'];
  for (const protein of proteins) {
    if (name1.includes(protein) && name2.includes(protein)) return true;
  }
  
  return false;
}

/**
 * Calculate cultural appropriateness score
 */
function calculateCulturalScore(
  recipe: Recipe,
  dayIndex: number,
  mealType: MealType
): number {
  let score = 0.8; // Base score
  
  // Mate in breakfast/merienda
  if ((mealType === 'desayuno' || mealType === 'merienda') && 
      recipe.name.toLowerCase().includes('mate')) {
    score = 1.0;
  }
  
  // Traditional dishes get bonus
  const traditional = ['milanesa', 'asado', 'empanada', 'locro', 'pastel de papa', 
                      'ñoquis', 'tarta', 'guiso', 'puchero', 'choripan'];
  if (traditional.some(t => recipe.name.toLowerCase().includes(t))) {
    score = Math.min(score + 0.2, 1.0);
  }
  
  return score;
}

/**
 * Find a better recipe alternative
 */
async function findBetterRecipe(
  currentRecipe: Recipe,
  context: OptimizationContext,
  plan: ArgentineWeeklyPlan,
  dayIndex: number,
  mealType: MealType,
  currentScore: OptimizationScore
): Promise<Recipe | null> {
  // In a real implementation, this would query a recipe database
  // or use AI to generate alternatives
  // For now, we'll return null (keep current recipe)
  
  // TODO: Implement recipe database lookup or AI generation
  
  return null;
}