/**
 * Argentine-specific meal planning types
 * Culturally adapted for Argentine culinary traditions
 */

import { z } from 'zod';

// ============================================================================
// BASE TYPES
// ============================================================================

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type ModeType = 'normal' | 'economico' | 'fiesta' | 'dieta';
export type RegionType = 'pampa' | 'patagonia' | 'norte' | 'cuyo' | 'centro' | 'litoral';
export type SeasonType = 'verano' | 'otono' | 'invierno' | 'primavera';
export type DifficultyType = 'facil' | 'medio' | 'dificil';
export type BudgetFlexibility = 'estricto' | 'flexible' | 'sin_limite';
export type CookingSkill = 'principiante' | 'intermedio' | 'avanzado';
export type TraditionLevel = 'baja' | 'media' | 'alta';
export type FrequencyType = 'nunca' | 'ocasional' | 'mensual' | 'quincenal' | 'semanal' | 'diario';
export type PriorityType = 'alta' | 'media' | 'baja';
export type IngredientCategory = 'carnes' | 'verduras' | 'frutas' | 'lacteos' | 'cereales' | 'condimentos' | 'bebidas' | 'otros';

// ============================================================================
// NUTRITION & INGREDIENTS
// ============================================================================

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sodium?: number; // mg
  sugar?: number; // grams
  iron?: number; // mg
  calcium?: number; // mg
  vitaminC?: number; // mg
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  isOptional?: boolean;
  isTraditional?: boolean; // Argentine traditional ingredient
  localName?: string; // Regional variation name
  substitutes?: string[];
  notes?: string;
  cost?: {
    average: number;
    currency: 'ARS';
    lastUpdated: string;
  };
}

export interface PantryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  amount: number;
  unit: string;
  expiryDate?: string;
  cost?: number;
  lastUsed?: string;
  frequency: PriorityType;
  isStaple?: boolean; // Argentine pantry staple (sal, aceite, yerba)
  brand?: string;
  store?: string;
}

// ============================================================================
// RECIPES
// ============================================================================

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: DifficultyType;
  tags: string[];
  region?: RegionType;
  season?: SeasonType;
  
  // Cultural significance
  cultural: {
    isTraditional: boolean;
    occasion?: 'domingo' | 'feriado' | 'dia29' | 'invierno' | 'verano' | 'mate' | 'asado';
    significance?: string;
    family?: 'desayuno_argentino' | 'almuerzo_dominical' | 'merienda_tradicional' | 'cena_familiar';
    region?: RegionType;
  };
  
  // Cost information
  cost: {
    total: number;
    perServing: number;
    currency: 'ARS';
    lastUpdated: string;
    budgetTier: 'economico' | 'medio' | 'premium';
  };
  
  // Technical details
  equipment: string[];
  techniques: string[];
  tips?: string[];
  variations?: {
    name: string;
    description: string;
    changes: string[];
  }[];
  
  // Metadata
  locked?: boolean;
  isFavorite?: boolean;
  rating?: number; // 1-5
  reviews?: number;
  source?: 'ai' | 'user' | 'traditional' | 'imported';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MEALS & PLANNING
// ============================================================================

export interface ArgentineMeal {
  id: string;
  recipe: Recipe;
  servings: number;
  notes?: string;
  locked?: boolean;
  alternatives?: Recipe[];
  cost: number;
  nutrition: NutritionInfo;
  
  // Cultural context
  cultural: {
    timeOfDay: MealType;
    isTraditional: boolean;
    occasion?: string;
  };
  
  // User customizations
  customizations?: {
    ingredientSwaps: { original: string; substitute: string }[];
    portionAdjustments: { ingredient: string; newAmount: number }[];
    notes: string[];
  };
}

export interface ArgentineDayPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
  dayName: string;
  
  // Meals
  desayuno: ArgentineMeal | null;
  almuerzo: ArgentineMeal | null;
  merienda: ArgentineMeal | null;
  cena: ArgentineMeal | null;
  
  // Cultural context
  cultural: {
    isSpecialDay: boolean;
    occasion?: 'domingo' | 'feriado' | 'cumpleanos' | 'dia29' | 'fin_de_semana';
    notes?: string;
    hasMate: boolean;
    hasAsado: boolean;
  };
  
  // Daily aggregations
  dailyNutrition: NutritionInfo;
  dailyCost: number;
  prepTime: number;
  cookTime: number;
  
  // Planning notes
  shoppingNeeded: boolean;
  prepNotes?: string[];
  cookingOrder?: string[];
}

export interface ArgentineWeeklyPlan {
  planId: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  days: ArgentineDayPlan[];
  
  // Aggregations
  weeklyNutrition: NutritionInfo;
  weeklyCost: number;
  totalPrepTime: number;
  totalCookTime: number;
  
  // Metadata
  generatedAt: string;
  lastModified: string;
  mode: ModeType;
  region: RegionType;
  season: SeasonType;
  
  // Cultural requirements
  cultural: {
    hasAsado: boolean;
    hasMate: boolean;
    hasNoquis29: boolean;
    traditionalDishes: number;
    specialOccasions: string[];
    varietyScore: number; // 0-10
    balanceScore: number; // 0-10
  };
  
  // Planning data
  shoppingList?: ShoppingList;
  preferences: UserPreferences;
  feedback?: {
    likes: string[];
    dislikes: string[];
    suggestions: string[];
  };
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserPreferences {
  // Dietary preferences
  dietary: {
    restrictions: string[]; // ['vegetarian', 'gluten-free', 'diabetic', etc.]
    allergies: string[];
    dislikes: string[];
    favorites: string[];
    avoidIngredients: string[];
    preferIngredients: string[];
  };
  
  // Cooking preferences
  cooking: {
    skill: CookingSkill;
    timeAvailable: number; // max minutes per meal
    equipment: string[];
    preferredTechniques: string[];
    avoidTechniques: string[];
    maxDifficulty: DifficultyType;
  };
  
  // Cultural preferences
  cultural: {
    region: RegionType;
    traditionLevel: TraditionLevel; // how much traditional food
    mateFrequency: FrequencyType;
    asadoFrequency: FrequencyType;
    preferLocalIngredients: boolean;
    respectOccasions: boolean; // Follow cultural occasions (29th = ñoquis)
  };
  
  // Family considerations
  family: {
    householdSize: number;
    hasChildren: boolean;
    childrenAges: number[];
    specialNeeds: string[];
    eatingSchedule: {
      desayuno: string; // HH:MM
      almuerzo: string;
      merienda: string;
      cena: string;
    };
  };
  
  // Budget constraints
  budget: {
    weekly: number;
    currency: 'ARS';
    flexibility: BudgetFlexibility;
    maxPerMeal: number;
    prioritizeValue: boolean;
  };
  
  // Shopping preferences
  shopping: {
    preferredStores: string[];
    buysBulk: boolean;
    prefersLocal: boolean;
    hasGarden: boolean;
    shoppingDays: string[];
    avoidWaste: boolean;
  };
  
  // Nutritional goals
  nutrition: {
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    focusAreas: string[]; // ['weight_loss', 'muscle_gain', 'heart_health', etc.]
    allergiesConsidered: boolean;
  };
}

// ============================================================================
// SHOPPING
// ============================================================================

export interface ShoppingListItem {
  id: string;
  name: string;
  category: IngredientCategory;
  amount: number;
  unit: string;
  estimatedCost: number;
  priority: PriorityType;
  inPantry: boolean;
  recipes: string[]; // recipe names that use this ingredient
  checked: boolean;
  
  // Shopping details
  store?: string;
  aisle?: string;
  brand?: string;
  alternatives?: string[];
  notes?: string;
}

export interface ShoppingCategory {
  name: IngredientCategory;
  displayName: string;
  items: ShoppingListItem[];
  subtotal: number;
  aisle?: string;
  priority: PriorityType;
}

export interface ShoppingList {
  id: string;
  weekPlanId: string;
  userId: string;
  
  // Items organization
  items: ShoppingListItem[];
  categories: ShoppingCategory[];
  
  // Cost estimation
  totalCost: number;
  estimatedCost: number;
  budgetVariance: number;
  
  // Shopping optimization
  stores: {
    name: string;
    items: string[];
    subtotal: number;
  }[];
  route?: {
    store: string;
    order: string[];
  };
  
  // Metadata
  generatedAt: string;
  lastUpdated: string;
  isCompleted: boolean;
  completedAt?: string;
}

// ============================================================================
// ANALYTICS & SUMMARIES
// ============================================================================

export interface WeeklyNutritionSummary {
  daily: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  weekly: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  balance: {
    varietyScore: number; // 0-10
    nutritionScore: number; // 0-10
    culturalScore: number; // 0-10
    budgetEfficiency: number; // 0-10
  };
  recommendations: string[];
  achievements: string[];
  warnings: string[];
}

export interface MealPlanRecord {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  plan_data: ArgentineWeeklyPlan;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  version: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Meal Type Schema
export const MealTypeSchema = z.enum(['desayuno', 'almuerzo', 'merienda', 'cena']);

// Mode Schema
export const ModeTypeSchema = z.enum(['normal', 'economico', 'fiesta', 'dieta']);

// Region Schema
export const RegionTypeSchema = z.enum(['pampa', 'patagonia', 'norte', 'cuyo', 'centro', 'litoral']);

// Season Schema
export const SeasonTypeSchema = z.enum(['verano', 'otono', 'invierno', 'primavera']);

// Ingredient Category Schema
export const IngredientCategorySchema = z.enum(['carnes', 'verduras', 'frutas', 'lacteos', 'cereales', 'condimentos', 'bebidas', 'otros']);

// Nutrition Info Schema
export const NutritionInfoSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  iron: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  vitaminC: z.number().min(0).optional(),
});

// Ingredient Schema
export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  amount: z.number().min(0),
  unit: z.string().min(1),
  category: IngredientCategorySchema,
  isOptional: z.boolean().optional(),
  isTraditional: z.boolean().optional(),
  localName: z.string().optional(),
  substitutes: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Recipe Schema
export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().url().optional(),
  ingredients: z.array(IngredientSchema),
  instructions: z.array(z.string().min(1)),
  nutrition: NutritionInfoSchema,
  prepTime: z.number().min(0),
  cookTime: z.number().min(0),
  servings: z.number().min(1).max(20),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  tags: z.array(z.string()),
  region: RegionTypeSchema.optional(),
  season: SeasonTypeSchema.optional(),
  cultural: z.object({
    isTraditional: z.boolean(),
    occasion: z.enum(['domingo', 'feriado', 'dia29', 'invierno', 'verano', 'mate', 'asado']).optional(),
    significance: z.string().optional(),
    family: z.enum(['desayuno_argentino', 'almuerzo_dominical', 'merienda_tradicional', 'cena_familiar']).optional(),
    region: RegionTypeSchema.optional(),
  }),
  cost: z.object({
    total: z.number().min(0),
    perServing: z.number().min(0),
    currency: z.literal('ARS'),
    lastUpdated: z.string(),
    budgetTier: z.enum(['economico', 'medio', 'premium']),
  }),
  equipment: z.array(z.string()),
  techniques: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Argentine Meal Schema
export const ArgentineMealSchema = z.object({
  id: z.string(),
  recipe: RecipeSchema,
  servings: z.number().min(1).max(20),
  notes: z.string().optional(),
  locked: z.boolean().optional(),
  alternatives: z.array(RecipeSchema).optional(),
  cost: z.number().min(0),
  nutrition: NutritionInfoSchema,
  cultural: z.object({
    timeOfDay: MealTypeSchema,
    isTraditional: z.boolean(),
    occasion: z.string().optional(),
  }),
});

// Argentine Day Plan Schema
export const ArgentineDayPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: z.number().min(0).max(6),
  dayName: z.string(),
  desayuno: ArgentineMealSchema.nullable(),
  almuerzo: ArgentineMealSchema.nullable(),
  merienda: ArgentineMealSchema.nullable(),
  cena: ArgentineMealSchema.nullable(),
  cultural: z.object({
    isSpecialDay: z.boolean(),
    occasion: z.string().optional(),
    notes: z.string().optional(),
    hasMate: z.boolean(),
    hasAsado: z.boolean(),
  }),
  dailyNutrition: NutritionInfoSchema,
  dailyCost: z.number().min(0),
  prepTime: z.number().min(0),
  cookTime: z.number().min(0),
});

// Argentine Weekly Plan Schema
export const ArgentineWeeklyPlanSchema = z.object({
  planId: z.string(),
  userId: z.string(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(ArgentineDayPlanSchema).length(7),
  weeklyNutrition: NutritionInfoSchema,
  weeklyCost: z.number().min(0),
  totalPrepTime: z.number().min(0),
  totalCookTime: z.number().min(0),
  generatedAt: z.string(),
  lastModified: z.string(),
  mode: ModeTypeSchema,
  region: RegionTypeSchema,
  season: SeasonTypeSchema,
  cultural: z.object({
    hasAsado: z.boolean(),
    hasMate: z.boolean(),
    hasNoquis29: z.boolean(),
    traditionalDishes: z.number().min(0),
    specialOccasions: z.array(z.string()),
    varietyScore: z.number().min(0).max(10),
    balanceScore: z.number().min(0).max(10),
  }),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo', 
  merienda: 'Merienda',
  cena: 'Cena'
};

export const MEAL_TYPE_TIMES: Record<MealType, string> = {
  desayuno: '07:00 - 10:00',
  almuerzo: '12:00 - 14:30',
  merienda: '16:00 - 18:00',
  cena: '20:00 - 22:00'
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  desayuno: '☕',
  almuerzo: '🍽️',
  merienda: '🧉',
  cena: '🌙'
};

export const REGION_LABELS: Record<RegionType, string> = {
  pampa: 'Región Pampeana',
  patagonia: 'Patagonia',
  norte: 'Norte Argentino',
  cuyo: 'Cuyo',
  centro: 'Centro',
  litoral: 'Litoral'
};

export const MODE_LABELS: Record<ModeType, string> = {
  normal: 'Normal',
  economico: 'Económico',
  fiesta: 'Festivo',
  dieta: 'Dieta'
};

export const SEASON_LABELS: Record<SeasonType, string> = {
  verano: 'Verano',
  otono: 'Otoño',
  invierno: 'Invierno',
  primavera: 'Primavera'
};

// Default nutrition targets for Argentina
export const DEFAULT_NUTRITION_TARGETS = {
  adult: {
    calories: 2000,
    protein: 50, // g
    carbs: 300, // g  
    fat: 65, // g
    fiber: 25, // g
    sodium: 2300, // mg
  },
  child: {
    calories: 1500,
    protein: 35,
    carbs: 200,
    fat: 50,
    fiber: 20,
    sodium: 1500,
  }
};

// Type guards
export const isMealType = (value: string): value is MealType => {
  return ['desayuno', 'almuerzo', 'merienda', 'cena'].includes(value);
};

export const isModeType = (value: string): value is ModeType => {
  return ['normal', 'economico', 'fiesta', 'dieta'].includes(value);
};

export const isRegionType = (value: string): value is RegionType => {
  return ['pampa', 'patagonia', 'norte', 'cuyo', 'centro', 'litoral'].includes(value);
};

export const isSeasonType = (value: string): value is SeasonType => {
  return ['verano', 'otono', 'invierno', 'primavera'].includes(value);
};