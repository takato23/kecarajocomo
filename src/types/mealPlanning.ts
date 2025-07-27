/**
 * TypeScript Types for Argentine Meal Planning System
 * 
 * Comprehensive type definitions for the meal planning functionality
 * including API responses, database models, and client interfaces.
 */

import { z } from 'zod';

// Core Argentine meal planning types
export type ArgentineSeason = 'verano' | 'otoño' | 'invierno' | 'primavera';
export type ArgentineRegion = 'buenosAires' | 'interior' | 'litoral' | 'cuyo' | 'patagonia' | 'noroeste';
export type BudgetLevel = 'economico' | 'moderado' | 'amplio';
export type CookingTimeLevel = 'rapido' | 'normal' | 'elaborado';
export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type DifficultyLevel = 'facil' | 'medio' | 'dificil';

// Meal context interface
export interface ArgentineMealContext {
  season: ArgentineSeason;
  region: ArgentineRegion;
  budget: BudgetLevel;
  cookingTime: CookingTimeLevel;
  familySize: number;
  dietaryRestrictions?: string[];
}

// Individual meal interfaces
export interface SimpleMeal {
  name: string;
  items: string[];
  prep_time: number;
  mate: boolean;
  cost_estimate?: number;
}

export interface ComplexMeal {
  name: string;
  main: string;
  guarnicion?: string;
  ingredients: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: DifficultyLevel;
  instructions?: string[];
  cost_estimate?: number;
  nutritional_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
}

export type AnyMeal = SimpleMeal | ComplexMeal;

// Daily meal plan interface
export interface DailyMealPlan {
  dayName: string;
  date: string;
  meals: {
    desayuno: SimpleMeal;
    almuerzo: ComplexMeal;
    merienda: SimpleMeal;
    cena: ComplexMeal;
  };
  nutritionalInfo: {
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
}

// Shopping list interfaces
export interface ShoppingItem {
  item: string;
  cantidad: string;
  unidad?: string;
  estimated_cost?: number;
}

export interface ShoppingItemWithCut extends ShoppingItem {
  corte?: string;
}

export interface ShoppingList {
  verduleria: ShoppingItem[];
  carniceria: ShoppingItemWithCut[];
  almacen: ShoppingItem[];
  panaderia: ShoppingItem[];
  lacteos: ShoppingItem[];
}

// Weekly meal plan interface
export interface WeeklyMealPlan {
  weekStart: string;
  weekEnd: string;
  days: DailyMealPlan[];
  shoppingList: ShoppingList;
  nutritionalSummary: {
    averageDailyCalories: number;
    weeklyProtein: number;
    weeklyCarbs: number;
    weeklyFat: number;
    balanceScore: number;
  };
  budgetAnalysis: {
    estimatedWeeklyCost: number;
    costPerPerson: number;
    savingTips: string[];
  };
  culturalValidation: {
    includesMate: boolean;
    includesAsado: boolean;
    includesPasta: boolean;
    includesMilanesas: boolean;
    authenticity_score: number;
  };
}

// API request interfaces
export interface WeeklyMealPlanRequest {
  weekStart: string;
  context: ArgentineMealContext;
  pantryItems?: PantryItem[];
  preferences?: {
    favoriteDishes?: string[];
    dislikedIngredients?: string[];
    mealComplexity?: 'simple' | 'moderate' | 'complex';
  };
}

export interface RegenerateMealRequest {
  weekStart: string;
  dayIndex: number;
  mealType: MealType;
  context: ArgentineMealContext;
  currentMeal: {
    name: string;
    main?: string;
    items?: string[];
    ingredients?: string[];
  };
  avoidIngredients?: string[];
  currentWeekPlan?: {
    days: any[];
  };
  preferences?: {
    preferredStyle?: 'tradicional' | 'moderno' | 'fusion';
    spiceLevel?: 'suave' | 'medio' | 'picante';
    complexity?: 'simple' | 'moderate' | 'complex';
  };
}

export interface MealAlternativesRequest {
  mealType: MealType;
  currentMeal: {
    name: string;
    main?: string;
    ingredients?: string[];
    difficulty?: DifficultyLevel;
  };
  context: ArgentineMealContext;
  preferences?: {
    preferredDifficulty?: DifficultyLevel;
    avoidIngredients?: string[];
    favoriteIngredients?: string[];
    cookingStyle?: 'tradicional' | 'moderno' | 'fusion';
    healthFocus?: 'ninguno' | 'bajo_sodio' | 'bajo_grasa' | 'alto_proteina' | 'vegetariano';
  };
  pantryItems?: PantryItem[];
  alternativesCount?: number;
}

// Meal alternative interface
export interface MealAlternative {
  name: string;
  category: 'similar' | 'seasonal' | 'budget_friendly' | 'quick' | 'healthier' | 'regional';
  description: string;
  main_ingredient: string;
  prep_time: number;
  cook_time?: number;
  difficulty: DifficultyLevel;
  estimated_cost: number;
  why_recommended: string;
  ingredients: string[];
  cultural_relevance: string;
  seasonal_score: number;
  budget_score: number;
  nutrition_highlights?: string[];
  cooking_tips?: string[];
}

// Alternatives response interface
export interface MealAlternativesResponse {
  currentMeal: {
    name: string;
    analysis: {
      cultural_authenticity: number;
      seasonal_appropriateness: number;
      budget_alignment: number;
      difficulty_rating: DifficultyLevel;
      health_score: number;
    };
  };
  alternatives: MealAlternative[];
  categorizedSuggestions: {
    similar: string[];
    seasonal: string[];
    budget_friendly: string[];
    quick: string[];
    healthier: string[];
    regional: string[];
  };
  contextualRecommendations: {
    best_for_season: string;
    best_for_budget: string;
    quickest_option: string;
    most_authentic: string;
    healthiest_option: string;
  };
  pantryUtilization?: {
    usable_items: string[];
    suggested_recipes: string[];
    missing_ingredients: string[];
  };
}

// Regenerated meal response interface
export interface RegeneratedMealResponse {
  dayName: string;
  mealType: MealType;
  meal: AnyMeal;
  alternatives: Array<{
    name: string;
    reason: string;
    difficulty: DifficultyLevel;
  }>;
  reasoning: {
    why_changed: string;
    cultural_relevance: string;
    seasonal_appropriateness: string;
    budget_considerations: string;
  };
}

// Pantry item interface
export interface PantryItem {
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  category?: string;
  location?: string;
}

// User preferences interface
export interface UserPreferences {
  dietary_restrictions?: string[];
  cuisine_preferences?: string[];
  household_size?: number;
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
  meal_prep_time?: CookingTimeLevel;
  budget_preference?: BudgetLevel;
  favorite_ingredients?: string[];
  disliked_ingredients?: string[];
  nutrition_goals?: {
    type: 'balanced' | 'weight_loss' | 'muscle_gain' | 'heart_healthy';
    daily_calories?: number;
    protein_target?: number;
  };
  regional_preference?: ArgentineRegion;
}

// Database model interfaces
export interface MealPlanRecord {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  plan_data: WeeklyMealPlan;
  context: ArgentineMealContext;
  cultural_validation?: any;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesRecord {
  id: string;
  user_id: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    processingTimeMs?: number;
    generatedAt?: string;
    [key: string]: any;
  };
}

export interface ApiError {
  error: string;
  details?: any;
  code?: string;
  status?: number;
}

// Validation result interfaces
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export interface CulturalValidationResult extends ValidationResult {
  includesMate: boolean;
  includesAsado: boolean;
  includesPasta: boolean;
  includesMilanesas: boolean;
  authenticity_score: number;
}

// Performance and metrics interfaces
export interface MealPlanningMetrics {
  generation_time_ms: number;
  ai_model_used: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  cache_hit: boolean;
  cultural_score: number;
  user_satisfaction?: number;
}

export interface SystemHealthMetrics {
  api_response_time: number;
  database_latency: number;
  ai_service_availability: boolean;
  cache_hit_rate: number;
  error_rate: number;
}

// Client-side state interfaces
export interface MealPlannerState {
  currentWeek: string;
  isLoading: boolean;
  currentPlan?: WeeklyMealPlan;
  editingMeal?: {
    dayIndex: number;
    mealType: MealType;
    alternatives?: MealAlternative[];
  };
  preferences: ArgentineMealContext;
  pantryItems: PantryItem[];
  error?: string;
}

// Form interfaces
export interface MealPlannerFormData {
  weekStart: string;
  season: ArgentineSeason;
  region: ArgentineRegion;
  budget: BudgetLevel;
  cookingTime: CookingTimeLevel;
  familySize: number;
  dietaryRestrictions: string[];
  includePantryItems: boolean;
}

// Utility type helpers
export type MealByType<T extends MealType> = T extends 'desayuno' | 'merienda' 
  ? SimpleMeal 
  : ComplexMeal;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Zod schemas for runtime validation
export const ArgentineMealContextSchema = z.object({
  season: z.enum(['verano', 'otoño', 'invierno', 'primavera']),
  region: z.enum(['buenosAires', 'interior', 'litoral', 'cuyo', 'patagonia', 'noroeste']),
  budget: z.enum(['economico', 'moderado', 'amplio']),
  cookingTime: z.enum(['rapido', 'normal', 'elaborado']),
  familySize: z.number().min(1).max(12),
  dietaryRestrictions: z.array(z.string()).optional(),
});

export const SimpleMealSchema = z.object({
  name: z.string(),
  items: z.array(z.string()),
  prep_time: z.number().positive(),
  mate: z.boolean(),
  cost_estimate: z.number().optional(),
});

export const ComplexMealSchema = z.object({
  name: z.string(),
  main: z.string(),
  guarnicion: z.string().optional(),
  ingredients: z.array(z.string()),
  prep_time: z.number().positive(),
  cook_time: z.number().positive(),
  servings: z.number().positive(),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  instructions: z.array(z.string()).optional(),
  cost_estimate: z.number().optional(),
  nutritional_info: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number().optional(),
  }).optional(),
});

export const WeeklyMealPlanSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  days: z.array(z.object({
    dayName: z.string(),
    date: z.string(),
    meals: z.object({
      desayuno: SimpleMealSchema,
      almuerzo: ComplexMealSchema,
      merienda: SimpleMealSchema,
      cena: ComplexMealSchema,
    }),
    nutritionalInfo: z.object({
      totalCalories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number().optional(),
    }),
  })),
  shoppingList: z.object({
    verduleria: z.array(z.object({
      item: z.string(),
      cantidad: z.string(),
      unidad: z.string().optional(),
      estimated_cost: z.number().optional(),
    })),
    carniceria: z.array(z.object({
      item: z.string(),
      cantidad: z.string(),
      corte: z.string().optional(),
      estimated_cost: z.number().optional(),
    })),
    almacen: z.array(z.object({
      item: z.string(),
      cantidad: z.string(),
      estimated_cost: z.number().optional(),
    })),
    panaderia: z.array(z.object({
      item: z.string(),
      cantidad: z.string(),
      estimated_cost: z.number().optional(),
    })),
    lacteos: z.array(z.object({
      item: z.string(),
      cantidad: z.string(),
      estimated_cost: z.number().optional(),
    })),
  }),
  nutritionalSummary: z.object({
    averageDailyCalories: z.number(),
    weeklyProtein: z.number(),
    weeklyCarbs: z.number(),
    weeklyFat: z.number(),
    balanceScore: z.number(),
  }),
  budgetAnalysis: z.object({
    estimatedWeeklyCost: z.number(),
    costPerPerson: z.number(),
    savingTips: z.array(z.string()),
  }),
  culturalValidation: z.object({
    includesMate: z.boolean(),
    includesAsado: z.boolean(),
    includesPasta: z.boolean(),
    includesMilanesas: z.boolean(),
    authenticity_score: z.number(),
  }),
});

// Export schema types
export type ArgentineMealContextType = z.infer<typeof ArgentineMealContextSchema>;
export type SimpleMealType = z.infer<typeof SimpleMealSchema>;
export type ComplexMealType = z.infer<typeof ComplexMealSchema>;
export type WeeklyMealPlanType = z.infer<typeof WeeklyMealPlanSchema>;