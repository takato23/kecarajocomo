/**
 * Enhanced TypeScript types for meal planning system
 * Provides strict type safety and validation for all meal planning operations
 */

import { z } from 'zod';

// =============================================================================
// BRANDED TYPES FOR RUNTIME SAFETY
// =============================================================================

/**
 * Branded types to prevent mixing of different numeric values
 */
export type PositiveInteger = number & { __brand: 'PositiveInteger' };
export type PositiveNumber = number & { __brand: 'PositiveNumber' };
export type Percentage = number & { __brand: 'Percentage' };
export type Minutes = number & { __brand: 'Minutes' };
export type Calories = number & { __brand: 'Calories' };
export type Grams = number & { __brand: 'Grams' };
export type Dollars = number & { __brand: 'Dollars' };

/**
 * Factory functions for branded types
 */
export const PositiveInteger = {
  create: (value: number): PositiveInteger => {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Value must be a positive integer, got: ${value}`);
    }
    return value as PositiveInteger;
  },
  
  parse: (value: unknown): PositiveInteger => {
    const num = Number(value);
    return PositiveInteger.create(num);
  }
};

export const PositiveNumber = {
  create: (value: number): PositiveNumber => {
    if (typeof value !== 'number' || value <= 0 || !isFinite(value)) {
      throw new Error(`Value must be a positive number, got: ${value}`);
    }
    return value as PositiveNumber;
  },
  
  parse: (value: unknown): PositiveNumber => {
    const num = Number(value);
    return PositiveNumber.create(num);
  }
};

export const Percentage = {
  create: (value: number): Percentage => {
    if (typeof value !== 'number' || value < 0 || value > 100) {
      throw new Error(`Value must be a percentage between 0 and 100, got: ${value}`);
    }
    return value as Percentage;
  },
  
  parse: (value: unknown): Percentage => {
    const num = Number(value);
    return Percentage.create(num);
  }
};

// =============================================================================
// ENUMS AND LITERALS
// =============================================================================

export const MealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = typeof MealTypes[number];

export const DifficultyLevels = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyLevel = typeof DifficultyLevels[number];

export const CookingSkillLevels = ['beginner', 'intermediate', 'advanced'] as const;
export type CookingSkillLevel = typeof CookingSkillLevels[number];

export const DietaryRestrictions = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb',
  'mediterranean', 'low-sodium', 'diabetic-friendly', 'heart-healthy'
] as const;
export type DietaryRestriction = typeof DietaryRestrictions[number];

export const CommonAllergens = [
  'nuts', 'peanuts', 'shellfish', 'fish', 'eggs', 'dairy', 'gluten', 'soy', 'sesame'
] as const;
export type CommonAllergen = typeof CommonAllergens[number];

export const CuisineTypes = [
  'italiana', 'mexicana', 'asiática', 'mediterránea', 'argentina', 'española', 
  'francesa', 'tailandesa', 'india', 'japonesa', 'china', 'peruana', 'brasileña'
] as const;
export type CuisineType = typeof CuisineTypes[number];

export const PlanningStrategies = [
  'budget-focused', 'nutrition-focused', 'time-focused', 'variety-focused', 'pantry-focused'
] as const;
export type PlanningStrategy = typeof PlanningStrategies[number];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schemas for runtime validation
 */
export const NutritionalGoalsSchema = z.object({
  calories: z.number().min(1200).max(4000).optional(),
  protein: z.number().min(50).max(300).optional(),
  carbs: z.number().min(50).max(500).optional(),
  fat: z.number().min(20).max(200).optional(),
  fiber: z.number().min(20).max(100).optional(),
  sugar: z.number().min(0).max(100).optional(),
  sodium: z.number().min(0).max(3000).optional(),
});

export const UserPreferencesSchema = z.object({
  userId: z.string().uuid(),
  dietaryRestrictions: z.array(z.enum(DietaryRestrictions)).default([]),
  allergies: z.array(z.enum(CommonAllergens)).default([]),
  favoriteCuisines: z.array(z.enum(CuisineTypes)).default([]),
  cookingSkillLevel: z.enum(CookingSkillLevels).default('intermediate'),
  householdSize: z.number().int().min(1).max(20),
  weeklyBudget: z.number().min(50).max(1000).optional(),
  preferredMealTypes: z.array(z.enum(MealTypes)).default(['breakfast', 'lunch', 'dinner']),
  avoidIngredients: z.array(z.string()).default([]),
  nutritionalGoals: NutritionalGoalsSchema.default({}),
  planningStrategy: z.enum(PlanningStrategies).default('nutrition-focused'),
  maxPrepTimePerMeal: z.number().min(5).max(240).default(60),
  batchCookingPreference: z.boolean().default(false),
  leftoverTolerance: z.number().min(0).max(1).default(0.5),
});

export const PlanningConstraintsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  maxPrepTime: z.number().min(5).max(240).default(60),
  budgetLimit: z.number().min(10).max(1000).optional(),
  pantryItems: z.array(z.string()).default([]),
  excludeRecipes: z.array(z.string()).default([]),
  mealTypes: z.array(z.enum(MealTypes)).min(1),
  servings: z.number().int().min(1).max(20),
  preferredShoppingDays: z.array(z.number().min(0).max(6)).default([]),
  maxShoppingTrips: z.number().int().min(1).max(7).default(2),
});

export const IngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  category: z.string().optional(),
  estimatedCost: z.number().positive().optional(),
  isOrganic: z.boolean().default(false),
  brandPreference: z.string().optional(),
});

export const RecipeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  prepTimeMinutes: z.number().int().min(0).max(240),
  cookTimeMinutes: z.number().int().min(0).max(480),
  servings: z.number().int().min(1).max(50),
  difficulty: z.enum(DifficultyLevels),
  cuisine: z.enum(CuisineTypes).optional(),
  imageUrl: z.string().url().optional(),
  ingredients: z.array(IngredientSchema).min(1),
  instructions: z.array(z.string()).min(1),
  nutrition: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0).optional(),
    sugar: z.number().min(0).optional(),
    sodium: z.number().min(0).optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  allergens: z.array(z.enum(CommonAllergens)).default([]),
  dietaryRestrictions: z.array(z.enum(DietaryRestrictions)).default([]),
  estimatedCost: z.number().positive().optional(),
  popularity: z.number().min(0).max(1).default(0),
  lastMadeDate: z.date().optional(),
});

// =============================================================================
// CORE INTERFACES (DERIVED FROM SCHEMAS)
// =============================================================================

export type NutritionalGoals = z.infer<typeof NutritionalGoalsSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type PlanningConstraints = z.infer<typeof PlanningConstraintsSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;

// =============================================================================
// MEAL PLANNING SPECIFIC TYPES
// =============================================================================

export interface MealSuggestion {
  readonly recipeId: string;
  readonly recipe: Recipe;
  readonly confidence: Percentage;
  readonly reasoning: string;
  readonly matchScores: {
    readonly nutrition: Percentage;
    readonly budget: Percentage;
    readonly pantry: Percentage;
    readonly time: Percentage;
    readonly preference: Percentage;
  };
  readonly alternatives: ReadonlyArray<{
    readonly recipeId: string;
    readonly reason: string;
    readonly confidence: Percentage;
  }>;
}

export interface DailyMeals {
  readonly date: Date;
  readonly breakfast?: MealSuggestion;
  readonly lunch?: MealSuggestion;
  readonly dinner?: MealSuggestion;
  readonly snacks?: ReadonlyArray<MealSuggestion>;
  readonly totalCalories: Calories;
  readonly totalCost: Dollars;
  readonly totalPrepTime: Minutes;
  readonly nutritionBalance: Percentage;
}

export interface NutritionSummary {
  readonly totalCalories: Calories;
  readonly totalProtein: Grams;
  readonly totalCarbs: Grams;
  readonly totalFat: Grams;
  readonly totalFiber: Grams;
  readonly totalSugar: Grams;
  readonly totalSodium: Grams;
  readonly dailyAverages: {
    readonly calories: Calories;
    readonly protein: Grams;
    readonly carbs: Grams;
    readonly fat: Grams;
  };
  readonly goalProgress: {
    readonly calories: Percentage;
    readonly protein: Percentage;
    readonly carbs: Percentage;
    readonly fat: Percentage;
  };
  readonly nutritionScore: Percentage;
  readonly deficiencies: ReadonlyArray<string>;
  readonly excesses: ReadonlyArray<string>;
}

export interface BudgetSummary {
  readonly totalCost: Dollars;
  readonly dailyAverage: Dollars;
  readonly budgetUsed: Percentage;
  readonly costPerServing: Dollars;
  readonly savingsOpportunities: ReadonlyArray<{
    readonly suggestion: string;
    readonly potentialSavings: Dollars;
    readonly effort: 'low' | 'medium' | 'high';
  }>;
  readonly budgetScore: Percentage;
  readonly costBreakdown: ReadonlyArray<{
    readonly category: string;
    readonly cost: Dollars;
    readonly percentage: Percentage;
  }>;
}

export interface PrepTask {
  readonly id: string;
  readonly description: string;
  readonly duration: Minutes;
  readonly difficulty: DifficultyLevel;
  readonly recipes: ReadonlyArray<string>;
  readonly ingredients: ReadonlyArray<string>;
  readonly equipment: ReadonlyArray<string>;
  readonly canBatchWith: ReadonlyArray<string>;
  readonly storageInstructions: string;
  readonly freshnessDuration: Minutes;
}

export interface PrepSession {
  readonly date: Date;
  readonly duration: Minutes;
  readonly tasks: ReadonlyArray<PrepTask>;
  readonly equipment: ReadonlyArray<string>;
  readonly estimatedEfficiency: Percentage;
}

export interface PrepPlan {
  readonly totalPrepTime: Minutes;
  readonly prepSessions: ReadonlyArray<PrepSession>;
  readonly batchCookingOpportunities: ReadonlyArray<{
    readonly ingredient: string;
    readonly meals: ReadonlyArray<string>;
    readonly instructions: string;
    readonly savings: Minutes;
  }>;
  readonly leftoverManagement: ReadonlyArray<{
    readonly fromMeal: string;
    readonly toMeal: string;
    readonly transformation: string;
    readonly freshnessDays: PositiveInteger;
  }>;
  readonly efficiencyScore: Percentage;
  readonly timeOptimizations: ReadonlyArray<string>;
}

export interface ShoppingItem {
  readonly name: string;
  readonly quantity: PositiveNumber;
  readonly unit: string;
  readonly estimatedCost: Dollars;
  readonly priority: 'high' | 'medium' | 'low';
  readonly recipes: ReadonlyArray<string>;
  readonly alternatives: ReadonlyArray<{
    readonly name: string;
    readonly costDifference: Dollars;
    readonly qualityDifference: Percentage;
  }>;
  readonly storageRequirements: string;
  readonly perishability: 'low' | 'medium' | 'high';
  readonly preferredBrands: ReadonlyArray<string>;
}

export interface ShoppingCategory {
  readonly name: string;
  readonly items: ReadonlyArray<ShoppingItem>;
  readonly storeSections: ReadonlyArray<string>;
  readonly totalCost: Dollars;
  readonly priority: 'high' | 'medium' | 'low';
}

export interface ShoppingList {
  readonly id: string;
  readonly totalItems: PositiveInteger;
  readonly totalCost: Dollars;
  readonly categories: ReadonlyArray<ShoppingCategory>;
  readonly substitutions: ReadonlyArray<{
    readonly originalItem: string;
    readonly alternatives: ReadonlyArray<{
      readonly name: string;
      readonly costDifference: Dollars;
      readonly nutritionDifference: Percentage;
      readonly availability: Percentage;
    }>;
  }>;
  readonly pantryOptimization: ReadonlyArray<string>;
  readonly storeOptimization: ReadonlyArray<{
    readonly storeName: string;
    readonly items: ReadonlyArray<string>;
    readonly estimatedTime: Minutes;
    readonly totalCost: Dollars;
  }>;
  readonly seasonalWarnings: ReadonlyArray<{
    readonly item: string;
    readonly reason: string;
    readonly alternative: string;
  }>;
}

export interface WeeklyPlan {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly weekStartDate: Date;
  readonly meals: ReadonlyArray<DailyMeals>;
  readonly nutritionSummary: NutritionSummary;
  readonly budgetSummary: BudgetSummary;
  readonly prepPlan: PrepPlan;
  readonly shoppingList: ShoppingList;
  readonly confidence: Percentage;
  readonly generatedAt: Date;
  readonly preferences: UserPreferences;
  readonly constraints: PlanningConstraints;
  readonly metadata: {
    readonly aiModel: string;
    readonly generationTime: Minutes;
    readonly revisionCount: PositiveInteger;
    readonly userFeedback: Percentage | null;
  };
}

// =============================================================================
// AI RESPONSE TYPES
// =============================================================================

export interface AIResponseMeal {
  readonly name: string;
  readonly ingredients: ReadonlyArray<string>;
  readonly prep_time: Minutes;
  readonly cook_time: Minutes;
  readonly servings: PositiveInteger;
  readonly difficulty: DifficultyLevel;
  readonly estimated_cost: Dollars;
  readonly nutrition: {
    readonly calories: Calories;
    readonly protein: Grams;
    readonly carbs: Grams;
    readonly fat: Grams;
  };
  readonly pantry_utilization: Percentage;
  readonly reasoning: string;
  readonly instructions: ReadonlyArray<string>;
}

export interface AIResponseDay {
  readonly day: string;
  readonly breakfast?: AIResponseMeal;
  readonly lunch?: AIResponseMeal;
  readonly dinner?: AIResponseMeal;
  readonly snacks?: ReadonlyArray<AIResponseMeal>;
}

export interface AIResponse {
  readonly week_plan: ReadonlyArray<AIResponseDay>;
  readonly optimization_summary: {
    readonly total_budget_used: Dollars;
    readonly pantry_utilization: Percentage;
    readonly nutrition_balance_score: Percentage;
    readonly prep_time_efficiency: Percentage;
    readonly recipe_variety_score: Percentage;
  };
  readonly batch_cooking_opportunities: ReadonlyArray<{
    readonly ingredient: string;
    readonly meals: ReadonlyArray<string>;
    readonly prep_instructions: string;
  }>;
  readonly shopping_list_preview: ReadonlyArray<{
    readonly item: string;
    readonly quantity: PositiveNumber;
    readonly unit: string;
    readonly estimated_cost: Dollars;
    readonly meals: ReadonlyArray<string>;
  }>;
  readonly leftover_suggestions: ReadonlyArray<{
    readonly from_meal: string;
    readonly to_meal: string;
    readonly transformation: string;
  }>;
  readonly nutritional_analysis: {
    readonly daily_averages: ReadonlyArray<{
      readonly day: string;
      readonly calories: Calories;
      readonly protein: Grams;
      readonly carbs: Grams;
      readonly fat: Grams;
    }>;
    readonly goal_achievement: {
      readonly calories: Percentage;
      readonly protein: Percentage;
      readonly carbs: Percentage;
      readonly fat: Percentage;
    };
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isValidMealType(value: unknown): value is MealType {
  return typeof value === 'string' && MealTypes.includes(value as MealType);
}

export function isValidDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === 'string' && DifficultyLevels.includes(value as DifficultyLevel);
}

export function isValidCookingSkillLevel(value: unknown): value is CookingSkillLevel {
  return typeof value === 'string' && CookingSkillLevels.includes(value as CookingSkillLevel);
}

export function isValidDietaryRestriction(value: unknown): value is DietaryRestriction {
  return typeof value === 'string' && DietaryRestrictions.includes(value as DietaryRestriction);
}

export function isValidCommonAllergen(value: unknown): value is CommonAllergen {
  return typeof value === 'string' && CommonAllergens.includes(value as CommonAllergen);
}

export function isValidCuisineType(value: unknown): value is CuisineType {
  return typeof value === 'string' && CuisineTypes.includes(value as CuisineType);
}

export function isValidAIResponse(value: unknown): value is AIResponse {
  try {
    const schema = z.object({
      week_plan: z.array(z.object({
        day: z.string(),
        breakfast: z.object({
          name: z.string(),
          ingredients: z.array(z.string()),
          prep_time: z.number().positive(),
          cook_time: z.number().positive(),
          servings: z.number().int().positive(),
          difficulty: z.enum(DifficultyLevels),
          estimated_cost: z.number().positive(),
          nutrition: z.object({
            calories: z.number().positive(),
            protein: z.number().positive(),
            carbs: z.number().positive(),
            fat: z.number().positive(),
          }),
          pantry_utilization: z.number().min(0).max(1),
          reasoning: z.string(),
          instructions: z.array(z.string()),
        }).optional(),
        lunch: z.any().optional(),
        dinner: z.any().optional(),
        snacks: z.array(z.any()).optional(),
      })),
      optimization_summary: z.object({
        total_budget_used: z.number().positive(),
        pantry_utilization: z.number().min(0).max(1),
        nutrition_balance_score: z.number().min(0).max(1),
        prep_time_efficiency: z.number().min(0).max(1),
        recipe_variety_score: z.number().min(0).max(1),
      }),
      batch_cooking_opportunities: z.array(z.object({
        ingredient: z.string(),
        meals: z.array(z.string()),
        prep_instructions: z.string(),
      })),
      shopping_list_preview: z.array(z.object({
        item: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
        estimated_cost: z.number().positive(),
        meals: z.array(z.string()),
      })),
      leftover_suggestions: z.array(z.object({
        from_meal: z.string(),
        to_meal: z.string(),
        transformation: z.string(),
      })),
      nutritional_analysis: z.object({
        daily_averages: z.array(z.object({
          day: z.string(),
          calories: z.number().positive(),
          protein: z.number().positive(),
          carbs: z.number().positive(),
          fat: z.number().positive(),
        })),
        goal_achievement: z.object({
          calories: z.number().min(0).max(1),
          protein: z.number().min(0).max(1),
          carbs: z.number().min(0).max(1),
          fat: z.number().min(0).max(1),
        }),
      }),
    });

    schema.parse(value);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type MealPlanningResult<T> = {
  readonly success: true;
  readonly data: T;
} | {
  readonly success: false;
  readonly error: string;
  readonly code: string;
};

export type AsyncMealPlanningResult<T> = Promise<MealPlanningResult<T>>;