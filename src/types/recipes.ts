// Core recipe types for kecarajocomer recipe module
import { Ingredient } from './pantry';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  images?: string[]; // Multiple images support
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  nutrition?: NutritionInfo;
  cook_time: number; // minutes
  prep_time: number; // minutes
  total_time: number; // computed: prep_time + cook_time
  servings: number;
  difficulty: DifficultyLevel;
  cuisine_type?: CuisineType;
  category: RecipeCategory;
  tags: string[];
  dietary_info: DietaryInfo;
  ai_generated: boolean;
  source?: RecipeSource;
  created_by: string;
  favorited_by?: string[]; // User IDs who favorited
  rating?: number; // Average rating 1-5
  rating_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient?: Ingredient; // Populated via join
  quantity: number;
  unit: string;
  preparation?: string; // 'picado', 'rallado', 'cocido', etc.
  optional: boolean;
  notes?: string;
  order: number; // Display order
}

export interface RecipeInstruction {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  duration?: number; // minutes for this step
  temperature?: number; // °C
  image_url?: string;
  notes?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  cholesterol?: number; // mg
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
  calculated_at: Date;
}

export type DifficultyLevel = 'facil' | 'intermedio' | 'dificil' | 'experto';

export type CuisineType = 
  | 'mexicana'
  | 'italiana'
  | 'asiatica'
  | 'mediterranea'
  | 'americana'
  | 'francesa'
  | 'india'
  | 'japonesa'
  | 'china'
  | 'tailandesa'
  | 'peruana'
  | 'argentina'
  | 'fusion'
  | 'internacional';

export type RecipeCategory =
  | 'desayuno'
  | 'almuerzo'
  | 'cena'
  | 'snack'
  | 'postre'
  | 'bebida'
  | 'aperitivo'
  | 'ensalada'
  | 'sopa'
  | 'pasta'
  | 'pizza'
  | 'sandwich'
  | 'parrilla'
  | 'vegetariano'
  | 'vegano'
  | 'sin_gluten';

export interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  gluten_free: boolean;
  dairy_free: boolean;
  nut_free: boolean;
  low_carb: boolean;
  keto: boolean;
  paleo: boolean;
  allergies: string[]; // Custom allergen list
}

export interface RecipeSource {
  type: 'manual' | 'imported' | 'ai_generated';
  url?: string; // Original URL if imported
  book?: string; // Cookbook name
  author?: string;
  imported_at?: Date;
}

// Recipe search and filtering
export interface RecipeSearchParams {
  query?: string;
  category?: RecipeCategory;
  cuisine_type?: CuisineType;
  difficulty?: DifficultyLevel;
  max_cook_time?: number;
  max_prep_time?: number;
  ingredients?: string[]; // Ingredient IDs or names
  exclude_ingredients?: string[];
  dietary_restrictions?: DietaryInfo;
  tags?: string[];
  only_favorites?: boolean;
  only_can_make?: boolean; // Based on pantry availability
  rating_min?: number;
  created_by?: string;
  sort_by?: RecipeSortBy;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export type RecipeSortBy = 
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'cook_time'
  | 'prep_time'
  | 'difficulty'
  | 'rating'
  | 'popularity'
  | 'pantry_match';

// Recipe parsing and import
export interface ParsedRecipe {
  name: string;
  description?: string;
  ingredients: ParsedIngredient[];
  instructions: string[];
  cook_time?: number;
  prep_time?: number;
  servings?: number;
  source_url?: string;
  confidence: number; // 0-1 parsing confidence
  warnings: string[]; // Parsing issues or assumptions
}

export interface ParsedIngredient {
  raw_text: string;
  name: string;
  quantity?: number;
  unit?: string;
  preparation?: string;
  optional: boolean;
  confidence: number;
  suggestions: IngredientSuggestion[];
}

export interface IngredientSuggestion {
  ingredient: Ingredient;
  score: number;
  match_type: 'exact' | 'partial' | 'category' | 'phonetic';
}

// Recipe form data
export interface RecipeFormData {
  name: string;
  description: string;
  image?: File;
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
  cook_time: number;
  prep_time: number;
  servings: number;
  difficulty: DifficultyLevel;
  cuisine_type?: CuisineType;
  category: RecipeCategory;
  tags: string[];
  dietary_info: DietaryInfo;
  source?: RecipeSource;
}

export interface RecipeIngredientInput {
  ingredient_name: string;
  ingredient_id?: string;
  quantity: number;
  unit: string;
  preparation?: string;
  optional: boolean;
  notes?: string;
}

export interface RecipeInstructionInput {
  instruction: string;
  duration?: number;
  temperature?: number;
  image?: File;
  notes?: string;
}

// AI recipe generation
export interface RecipeGenerationRequest {
  preferences: UserRecipePreferences;
  constraints: RecipeConstraints;
  context?: RecipeGenerationContext;
}

export interface UserRecipePreferences {
  cuisine_types: CuisineType[];
  dietary_restrictions: DietaryInfo;
  favorite_ingredients: string[];
  disliked_ingredients: string[];
  skill_level: DifficultyLevel;
  preferred_cook_time: number;
  nutrition_goals?: NutritionGoals;
}

export interface RecipeConstraints {
  required_ingredients?: string[];
  available_ingredients?: string[]; // From pantry
  max_cook_time?: number;
  max_prep_time?: number;
  servings?: number;
  budget_range?: 'bajo' | 'medio' | 'alto';
  kitchen_equipment?: string[];
}

export interface RecipeGenerationContext {
  meal_type: RecipeCategory;
  season: 'primavera' | 'verano' | 'otono' | 'invierno';
  occasion?: 'diario' | 'especial' | 'fiesta' | 'romantico';
  group_size: number;
  time_of_day: 'manana' | 'tarde' | 'noche';
}

export interface NutritionGoals {
  calories?: { min?: number; max?: number };
  protein?: { min?: number; max?: number };
  carbs?: { min?: number; max?: number };
  fat?: { min?: number; max?: number };
  fiber?: { min?: number };
  sodium?: { max?: number };
}

// Pantry integration
export interface PantryCompatibility {
  can_make: boolean;
  missing_ingredients: RecipeIngredient[];
  available_ingredients: RecipeIngredient[];
  substitutions: IngredientSubstitution[];
  compatibility_score: number; // 0-1
}

export interface IngredientSubstitution {
  original: RecipeIngredient;
  substitute: Ingredient;
  ratio: number; // Conversion ratio
  confidence: number;
  notes?: string;
}

// Recipe statistics and analytics
export interface RecipeStats {
  total_recipes: number;
  by_category: Record<RecipeCategory, number>;
  by_cuisine: Record<CuisineType, number>;
  by_difficulty: Record<DifficultyLevel, number>;
  average_cook_time: number;
  average_rating: number;
  most_popular: Recipe[];
  trending: Recipe[];
  seasonal_recommendations: Recipe[];
}

// Cooking Assistant
export interface CookingSession {
  id: string;
  recipe_id: string;
  recipe: Recipe;
  user_id: string;
  current_step: number;
  started_at: Date;
  estimated_completion: Date;
  paused_at?: Date;
  completed_at?: Date;
  notes?: string[];
  timers: CookingTimer[];
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
}

export interface CookingTimer {
  id: string;
  name: string;
  duration: number; // seconds
  started_at: Date;
  ends_at: Date;
  completed: boolean;
  step_number?: number;
}

export interface VoiceCommand {
  type: 'next_step' | 'previous_step' | 'repeat' | 'timer' | 'pause' | 'resume';
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

// Real-time events
export interface RecipeRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'recipes' | 'recipe_ingredients' | 'recipe_instructions' | 'user_recipe_favorites';
  record: Recipe | RecipeIngredient | RecipeInstruction;
  old_record?: Recipe | RecipeIngredient | RecipeInstruction;
  timestamp: Date;
}

// UI state management
export interface RecipeUIState {
  view_mode: 'grid' | 'list' | 'detailed';
  sort_by: RecipeSortBy;
  sort_order: 'asc' | 'desc';
  filters: RecipeSearchParams;
  search_query: string;
  selected_recipe?: string;
  favorites_only: boolean;
  can_make_only: boolean;
  current_cooking_session?: string;
}

// Import/Export
export interface RecipeImportResult {
  success: boolean;
  recipe?: Recipe;
  errors: string[];
  warnings: string[];
  parsed_data: ParsedRecipe;
}

export interface RecipeExportFormat {
  format: 'json' | 'pdf' | 'text' | 'html';
  include_images: boolean;
  include_nutrition: boolean;
  language: 'es' | 'en';
}

// Recipe categories with metadata
export const RECIPE_CATEGORIES: Record<RecipeCategory, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  desayuno: {
    label: 'Desayuno',
    icon: '🌅',
    color: 'yellow',
    description: 'Comidas para empezar el día'
  },
  almuerzo: {
    label: 'Almuerzo',
    icon: '🌞',
    color: 'orange',
    description: 'Comidas del mediodía'
  },
  cena: {
    label: 'Cena',
    icon: '🌙',
    color: 'blue',
    description: 'Comidas de la noche'
  },
  snack: {
    label: 'Snack',
    icon: '🍿',
    color: 'purple',
    description: 'Aperitivos y botanas'
  },
  postre: {
    label: 'Postre',
    icon: '🍰',
    color: 'pink',
    description: 'Dulces y postres'
  },
  bebida: {
    label: 'Bebida',
    icon: '🥤',
    color: 'blue',
    description: 'Bebidas y cocteles'
  },
  aperitivo: {
    label: 'Aperitivo',
    icon: '🧀',
    color: 'yellow',
    description: 'Entradas y aperitivos'
  },
  ensalada: {
    label: 'Ensalada',
    icon: '🥗',
    color: 'green',
    description: 'Ensaladas y platos frescos'
  },
  sopa: {
    label: 'Sopa',
    icon: '🍲',
    color: 'red',
    description: 'Sopas y caldos'
  },
  pasta: {
    label: 'Pasta',
    icon: '🍝',
    color: 'yellow',
    description: 'Platos de pasta'
  },
  pizza: {
    label: 'Pizza',
    icon: '🍕',
    color: 'red',
    description: 'Pizzas y flatbreads'
  },
  sandwich: {
    label: 'Sandwich',
    icon: '🥪',
    color: 'brown',
    description: 'Sandwiches y wraps'
  },
  parrilla: {
    label: 'Parrilla',
    icon: '🔥',
    color: 'red',
    description: 'Comidas a la parrilla'
  },
  vegetariano: {
    label: 'Vegetariano',
    icon: '🌱',
    color: 'green',
    description: 'Platos vegetarianos'
  },
  vegano: {
    label: 'Vegano',
    icon: '🥬',
    color: 'green',
    description: 'Platos veganos'
  },
  sin_gluten: {
    label: 'Sin Gluten',
    icon: '🌾',
    color: 'orange',
    description: 'Recetas libres de gluten'
  }
};

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  facil: {
    label: 'Fácil',
    icon: '⭐',
    color: 'green',
    description: 'Ideal para principiantes'
  },
  intermedio: {
    label: 'Intermedio',
    icon: '⭐⭐',
    color: 'yellow',
    description: 'Requiere algo de experiencia'
  },
  dificil: {
    label: 'Difícil',
    icon: '⭐⭐⭐',
    color: 'orange',
    description: 'Para cocineros experimentados'
  },
  experto: {
    label: 'Experto',
    icon: '⭐⭐⭐⭐',
    color: 'red',
    description: 'Nivel profesional'
  }
};

export const CUISINE_TYPES: Record<CuisineType, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  mexicana: {
    label: 'Mexicana',
    icon: '🌮',
    color: 'red',
    description: 'Cocina tradicional mexicana'
  },
  italiana: {
    label: 'Italiana',
    icon: '🍝',
    color: 'green',
    description: 'Cocina italiana clásica'
  },
  asiatica: {
    label: 'Asiática',
    icon: '🥢',
    color: 'red',
    description: 'Sabores asiáticos variados'
  },
  mediterranea: {
    label: 'Mediterránea',
    icon: '🫒',
    color: 'blue',
    description: 'Cocina del mediterráneo'
  },
  americana: {
    label: 'Americana',
    icon: '🍔',
    color: 'blue',
    description: 'Comida americana clásica'
  },
  francesa: {
    label: 'Francesa',
    icon: '🥖',
    color: 'blue',
    description: 'Alta cocina francesa'
  },
  india: {
    label: 'India',
    icon: '🍛',
    color: 'orange',
    description: 'Especias y sabores de India'
  },
  japonesa: {
    label: 'Japonesa',
    icon: '🍣',
    color: 'red',
    description: 'Cocina japonesa auténtica'
  },
  china: {
    label: 'China',
    icon: '🥟',
    color: 'red',
    description: 'Tradición culinaria china'
  },
  tailandesa: {
    label: 'Tailandesa',
    icon: '🌶️',
    color: 'green',
    description: 'Sabores picantes de Tailandia'
  },
  peruana: {
    label: 'Peruana',
    icon: '🐟',
    color: 'yellow',
    description: 'Cocina peruana moderna'
  },
  argentina: {
    label: 'Argentina',
    icon: '🥩',
    color: 'blue',
    description: 'Asados y cocina argentina'
  },
  fusion: {
    label: 'Fusión',
    icon: '🌍',
    color: 'purple',
    description: 'Mezcla de tradiciones culinarias'
  },
  internacional: {
    label: 'Internacional',
    icon: '🌎',
    color: 'gray',
    description: 'Cocina internacional variada'
  }
};