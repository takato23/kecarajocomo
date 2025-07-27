// Types for Meal Planning API

// Database Models
export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  preferences: Record<string, any>;
  nutritional_goals: Record<string, any>;
  created_at: string;
  updated_at: string;
  meal_plan_items?: MealPlanItem[];
  stats?: NutritionalStats[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id?: string;
  date: string;
  meal_type: MealType;
  servings: number;
  is_completed: boolean;
  custom_recipe?: Record<string, any>;
  nutritional_info: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  recipe?: Recipe;
  ai_recipe?: AIGeneratedRecipe;
}

export interface AIGeneratedRecipe {
  id: string;
  user_id: string;
  recipe_data: Record<string, any>;
  name: string;
  description?: string;
  meal_type?: string;
  dietary_tags: string[];
  cuisine?: string;
  prep_time?: number;
  cook_time?: number;
  servings: number;
  difficulty?: string;
  nutritional_info: Record<string, any>;
  is_public: boolean;
  usage_count: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: any[];
  instructions: any[];
  prep_time?: number;
  cook_time?: number;
  servings: number;
  difficulty?: string;
  cuisine?: string;
  meal_type?: string;
  nutritional_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NutritionalStats {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  meal_count: number;
}

// Enums
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type ActionType = 'created' | 'updated' | 'completed' | 'deleted' | 'activated' | 'items_updated' | 'items_deleted';

// API Request/Response Types
export interface GetMealPlansParams {
  startDate?: string;
  endDate?: string;
  active?: string;
}

export interface CreateMealPlanRequest {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  preferences?: Record<string, any>;
  nutritionalGoals?: Record<string, any>;
  items?: MealPlanItemInput[];
  setActive?: boolean;
}

export interface UpdateMealPlanRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  preferences?: Record<string, any>;
  nutritionalGoals?: Record<string, any>;
  isActive?: boolean;
}

export interface MealPlanItemInput {
  recipeId?: string;
  date: string;
  mealType: MealType;
  servings?: number;
  isCompleted?: boolean;
  customRecipe?: Record<string, any>;
  nutritionalInfo?: Record<string, any>;
  notes?: string;
}

export interface CreateMealPlanItemsRequest {
  items: MealPlanItemInput[];
}

export interface GetMealPlanItemsParams {
  date?: string;
  mealType?: MealType;
}

export interface DeleteMealPlanItemsParams {
  itemId?: string;
  date?: string;
  mealType?: MealType;
}

export interface SetActiveMealPlanRequest {
  mealPlanId: string;
}

export interface CreateAIRecipeRequest {
  recipeData: Record<string, any>;
  name: string;
  description?: string;
  mealType?: string;
  dietaryTags?: string[];
  cuisine?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  nutritionalInfo?: Record<string, any>;
  isPublic?: boolean;
}

export interface UpdateAIRecipeRequest {
  recipeData?: Record<string, any>;
  name?: string;
  description?: string;
  mealType?: string;
  dietaryTags?: string[];
  cuisine?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  nutritionalInfo?: Record<string, any>;
  isPublic?: boolean;
  rating?: number;
}

export interface GetAIRecipesParams {
  public?: string;
  mealType?: string;
  cuisine?: string;
  tags?: string;
}

// Generate meal plan request (from existing generate endpoint)
export interface GenerateMealPlanRequest {
  preferences: {
    userId?: string;
    dietaryRestrictions?: string[];
    allergens?: string[];
    cuisinePreferences?: string[];
    mealTypes?: string[];
    budgetRange?: {
      min: number;
      max: number;
    };
    nutritionGoals?: Record<string, any>;
  };
  constraints: {
    startDate: string;
    endDate: string;
    maxPrepTime?: number;
    pantryItems?: any[];
    excludeIngredients?: string[];
  };
  options?: {
    useHolisticAnalysis?: boolean;
    includeExternalFactors?: boolean;
    optimizeResources?: boolean;
    enableLearning?: boolean;
    analysisDepth?: 'surface' | 'comprehensive' | 'deep_dive';
  };
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerateMealPlanResponse {
  success: boolean;
  plan?: any;
  insights?: {
    holisticAnalysis: any;
    optimizationRecommendations: any;
    learningAdaptations: any;
  };
  metadata?: {
    confidenceScore: number;
    processingTime: number;
  };
  error?: string;
}

// Extended types for meal plan with relations
export interface MealPlanWithItems extends MealPlan {
  meal_plan_items: MealPlanItem[];
  stats?: NutritionalStats[];
}

export interface MealPlanItemWithRecipe extends MealPlanItem {
  recipe?: Recipe;
  ai_recipe?: AIGeneratedRecipe;
}

// History tracking
export interface MealPlanHistory {
  id: string;
  user_id: string;
  meal_plan_id: string;
  action: ActionType;
  details: Record<string, any>;
  created_at: string;
}

// Database function results
export interface ActiveMealPlanResult {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  preferences: Record<string, any>;
  nutritional_goals: Record<string, any>;
}