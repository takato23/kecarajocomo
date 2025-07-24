// Re-export shared types from planner
export type { 
  NutritionalInfo, 
  Ingredient, 
  IngredientCategory 
} from '../../planner/types';

// Recipe-specific types
export type CuisineType = 
  | 'mexican'
  | 'italian'
  | 'chinese'
  | 'japanese'
  | 'indian'
  | 'french'
  | 'mediterranean'
  | 'american'
  | 'thai'
  | 'spanish'
  | 'other';

export type DietaryTag = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'low-carb'
  | 'keto'
  | 'paleo'
  | 'whole30'
  | 'sugar-free'
  | 'low-sodium'
  | 'high-protein';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'appetizer';

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: Instruction[];
  prep_time: number; // minutes
  cook_time: number; // minutes
  total_time: number; // minutes
  servings: number;
  cuisine_type: CuisineType;
  meal_types: MealType[];
  dietary_tags: DietaryTag[];
  difficulty: DifficultyLevel;
  nutritional_info: DetailedNutritionalInfo;
  image_url?: string;
  video_url?: string;
  source_url?: string;
  ai_generated: boolean;
  ai_provider?: 'claude' | 'gemini';
  rating?: number;
  times_cooked?: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string; // e.g., "finely chopped", "room temperature"
  optional: boolean;
  group?: string; // e.g., "For the sauce", "For the marinade"
}

export interface Instruction {
  step_number: number;
  text: string;
  time_minutes?: number;
  temperature?: {
    value: number;
    unit: 'celsius' | 'fahrenheit';
  };
  tips?: string[];
  image_url?: string;
}

export interface DetailedNutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  fiber?: number;
  sugar?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
}

// Search and filter types
export interface RecipeFilters {
  search?: string;
  cuisine_types?: CuisineType[];
  meal_types?: MealType[];
  dietary_tags?: DietaryTag[];
  difficulty?: DifficultyLevel[];
  max_cook_time?: number;
  max_prep_time?: number;
  ingredients_include?: string[];
  ingredients_exclude?: string[];
  min_rating?: number;
  ai_generated?: boolean;
  user_id?: string;
  is_public?: boolean;
}

export interface RecipeSortOptions {
  field: 'created_at' | 'title' | 'rating' | 'cook_time' | 'prep_time' | 'times_cooked';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface RecipeSearchResult {
  recipes: Recipe[];
  total: number;
  page: number;
  total_pages: number;
}

// AI Generation types
export interface AIRecipeRequest {
  prompt?: string;
  cuisine_type?: CuisineType;
  meal_type?: MealType;
  dietary_tags?: DietaryTag[];
  available_ingredients?: string[];
  exclude_ingredients?: string[];
  servings?: number;
  max_cook_time?: number;
  difficulty?: DifficultyLevel;
  style?: 'traditional' | 'fusion' | 'healthy' | 'comfort' | 'gourmet';
  provider: 'claude' | 'gemini';
}

export interface AIRecipeResponse {
  recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  confidence_score: number;
  suggestions?: string[];
  alternatives?: string[];
}

// Nutrition API types
export interface NutritionAnalysisRequest {
  ingredients: RecipeIngredient[];
  servings: number;
}

export interface NutritionAnalysisResponse {
  nutritional_info: DetailedNutritionalInfo;
  warnings?: string[]; // e.g., "High in sodium", "Contains allergens"
  health_score?: number; // 0-100
}

// User interaction types
export interface RecipeRating {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}

export interface CookingSession {
  id: string;
  recipe_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
  modifications?: string[];
  rating?: number;
}

export interface RecipeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  recipe_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Form types for UI
export interface RecipeFormData {
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: Instruction[];
  prep_time: number;
  cook_time: number;
  servings: number;
  cuisine_type: CuisineType;
  meal_types: MealType[];
  dietary_tags: DietaryTag[];
  difficulty: DifficultyLevel;
  image_url?: string;
  video_url?: string;
  source_url?: string;
  is_public: boolean;
}

export interface IngredientFormData {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  optional: boolean;
  group?: string;
}

export interface InstructionFormData {
  text: string;
  time_minutes?: number;
  temperature?: {
    value: number;
    unit: 'celsius' | 'fahrenheit';
  };
  tips?: string[];
}