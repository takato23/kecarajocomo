// =============================================
// UNIFIED MEAL PLANNING TYPE DEFINITIONS
// Complete type system for KeCarajoComer meal planning
// =============================================

import { Database } from '../database';

// Re-export database types for convenience
export type DbMealPlan = Database['public']['Tables']['meal_plans']['Row'];
export type DbMealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
export type DbMealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

export type DbMealPlanItem = Database['public']['Tables']['meal_plan_items']['Row'];
export type DbMealPlanItemInsert = Database['public']['Tables']['meal_plan_items']['Insert'];
export type DbMealPlanItemUpdate = Database['public']['Tables']['meal_plan_items']['Update'];

// =============================================
// CORE ENUMS & CONSTANTS
// =============================================

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum DietaryPreference {
  OMNIVORE = 'omnivore',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  PESCATARIAN = 'pescatarian',
  KETO = 'keto',
  PALEO = 'paleo',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free'
}

export enum CookingDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// =============================================
// NUTRITION TYPES
// =============================================

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  cholesterol?: number; // mg
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

export interface NutritionTarget {
  daily: NutritionInfo;
  perMeal: Record<MealType, Partial<NutritionInfo>>;
  tolerance: number; // percentage
}

// =============================================
// RECIPE TYPES (Unified with existing system)
// =============================================

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  prep_time: number; // minutes
  cook_time: number; // minutes
  servings: number;
  difficulty: CookingDifficulty;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  dietary_tags: DietaryPreference[];
  cuisine?: string;
  tags: string[];
  rating?: number;
  is_ai_generated?: boolean;
  is_favorite?: boolean;
  video_url?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name: string;
  amount: number;
  unit: string;
  notes?: string;
  is_optional?: boolean;
  substitutions?: string[];
}

// =============================================
// MEAL PLAN TYPES
// =============================================

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: PlanStatus;
  preferences?: MealPlanPreferences;
  nutrition_targets?: NutritionTarget;
  items: MealPlanItem[];
  shopping_list?: ShoppingList;
  statistics?: MealPlanStatistics;
  created_at: string;
  updated_at: string;
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  date: string; // ISO date
  meal_type: MealType;
  recipe_id?: string;
  recipe?: Recipe;
  custom_meal?: CustomMeal;
  servings: number;
  notes?: string;
  is_completed: boolean;
  is_locked: boolean;
  nutrition?: NutritionInfo;
  created_at: string;
  updated_at: string;
}

export interface CustomMeal {
  name: string;
  description?: string;
  ingredients?: string[];
  nutrition?: NutritionInfo;
}

export interface MealPlanPreferences {
  dietary_preferences: DietaryPreference[];
  excluded_ingredients: string[];
  preferred_cuisines: string[];
  cooking_time_limit: number; // minutes
  budget_per_meal?: number;
  variety_level: 'low' | 'medium' | 'high';
  use_pantry_items: boolean;
  seasonal_preferences: boolean;
}

export interface MealPlanStatistics {
  total_meals: number;
  completed_meals: number;
  unique_recipes: number;
  average_nutrition: NutritionInfo;
  total_cost?: number;
  prep_time_total: number;
  cook_time_total: number;
  completion_rate: number;
}

// =============================================
// SHOPPING LIST TYPES
// =============================================

export interface ShoppingList {
  id: string;
  meal_plan_id: string;
  items: ShoppingListItem[];
  categories: ShoppingListCategory[];
  estimated_total?: number;
  optimized_route?: ShoppingRoute;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  ingredient_name: string;
  total_amount: number;
  unit: string;
  category: string;
  recipes: string[]; // Recipe names using this ingredient
  is_purchased: boolean;
  is_pantry_item: boolean;
  estimated_price?: number;
  store_location?: string;
  notes?: string;
}

export interface ShoppingListCategory {
  name: string;
  items: ShoppingListItem[];
  subtotal?: number;
  aisle?: string;
}

export interface ShoppingRoute {
  store_name: string;
  route: string[]; // Ordered list of aisles/sections
  estimated_time: number; // minutes
}

// =============================================
// AI GENERATION TYPES
// =============================================

export interface MealPlanGenerationRequest {
  user_id: string;
  start_date: string;
  end_date: string;
  meal_types: MealType[];
  preferences: MealPlanPreferences;
  nutrition_targets?: NutritionTarget;
  existing_plan_id?: string;
  regenerate_options?: {
    preserve_locked: boolean;
    preserve_completed: boolean;
    specific_dates?: string[];
    specific_meal_types?: MealType[];
  };
}

export interface MealPlanGenerationResponse {
  meal_plan: MealPlan;
  suggestions: string[];
  warnings?: string[];
  alternatives?: Recipe[];
  generation_metadata: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    generation_time: number;
  };
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    version: string;
    [key: string]: any;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =============================================
// UI COMPONENT TYPES
// =============================================

export interface MealSlotProps {
  item?: MealPlanItem;
  date: string;
  mealType: MealType;
  isToday?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
  onSelect?: () => void;
  onUpdate?: (updates: Partial<MealPlanItem>) => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onLockToggle?: () => void;
}

export interface MealPlanCalendarProps {
  mealPlan: MealPlan;
  currentDate?: Date;
  onDateSelect?: (date: string) => void;
  onItemUpdate?: (itemId: string, updates: Partial<MealPlanItem>) => void;
  onItemDelete?: (itemId: string) => void;
  isLoading?: boolean;
}

// =============================================
// STORE TYPES
// =============================================

export interface MealPlanningState {
  // Core data
  activePlan: MealPlan | null;
  plans: Record<string, MealPlan>;
  recipes: Record<string, Recipe>;
  
  // UI state
  selectedDate: string | null;
  selectedMealType: MealType | null;
  selectedItemId: string | null;
  isGenerating: boolean;
  isSyncing: boolean;
  
  // Error handling
  errors: Record<string, string>;
  
  // Actions
  loadActivePlan: () => Promise<void>;
  loadPlan: (planId: string) => Promise<void>;
  createPlan: (request: MealPlanGenerationRequest) => Promise<MealPlan>;
  updatePlanItem: (itemId: string, updates: Partial<MealPlanItem>) => Promise<void>;
  deletePlanItem: (itemId: string) => Promise<void>;
  regenerateMeal: (itemId: string) => Promise<void>;
  generateShoppingList: (planId: string) => Promise<ShoppingList>;
  
  // UI actions
  selectDate: (date: string | null) => void;
  selectMealType: (mealType: MealType | null) => void;
  selectItem: (itemId: string | null) => void;
  
  // Selectors
  getItemsForDate: (date: string) => MealPlanItem[];
  getStatistics: () => MealPlanStatistics | null;
  getNutritionForDate: (date: string) => NutritionInfo | null;
}

// =============================================
// UTILITY TYPES
// =============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// =============================================
// TYPE GUARDS
// =============================================

export const isMealPlan = (obj: any): obj is MealPlan => {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string';
};

export const isRecipe = (obj: any): obj is Recipe => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const hasCustomMeal = (item: MealPlanItem): item is MealPlanItem & { custom_meal: CustomMeal } => {
  return item.custom_meal !== null && item.custom_meal !== undefined;
};

// =============================================
// CONSTANTS
// =============================================

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Desayuno',
  [MealType.LUNCH]: 'Almuerzo',
  [MealType.DINNER]: 'Cena',
  [MealType.SNACK]: 'Merienda'
};

export const MEAL_TYPE_TIMES: Record<MealType, string> = {
  [MealType.BREAKFAST]: '07:00 - 10:00',
  [MealType.LUNCH]: '12:00 - 14:00',
  [MealType.DINNER]: '19:00 - 21:00',
  [MealType.SNACK]: '16:00 - 17:00'
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  [MealType.BREAKFAST]: '☕',
  [MealType.LUNCH]: '🍽️',
  [MealType.DINNER]: '🌙',
  [MealType.SNACK]: '🍎'
};

export const DEFAULT_NUTRITION_TARGETS: NutritionTarget = {
  daily: {
    calories: 2000,
    protein: 50,
    carbs: 300,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300
  },
  perMeal: {
    [MealType.BREAKFAST]: { calories: 400, protein: 15, carbs: 60 },
    [MealType.LUNCH]: { calories: 600, protein: 20, carbs: 80 },
    [MealType.DINNER]: { calories: 700, protein: 25, carbs: 90 },
    [MealType.SNACK]: { calories: 300, protein: 10, carbs: 40 }
  },
  tolerance: 0.1 // 10%
};