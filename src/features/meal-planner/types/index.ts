// Unified types for the meal planner
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  image?: string;
  nutritionalInfo?: NutritionalInfo;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  optional?: boolean;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  date: Date;
  meals: PlannedMeal[];
  totalNutrition?: NutritionalInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlannedMeal {
  id: string;
  recipeId: string;
  recipe?: Recipe;
  mealType: MealType;
  servings: number;
  notes?: string;
  isCompleted?: boolean;
  customizations?: MealCustomization[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export interface MealCustomization {
  ingredientId: string;
  action: 'add' | 'remove' | 'substitute';
  substituteIngredient?: Ingredient;
  amount?: number;
  unit?: string;
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  dailyPlans: MealPlan[];
  shoppingList?: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  ingredientId: string;
  ingredient: Ingredient;
  totalAmount: number;
  unit: string;
  recipes: string[]; // Recipe names that use this ingredient
  purchased?: boolean;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  dislikedIngredients: string[];
  preferredCuisines: string[];
  cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  maxCookingTime?: number;
  servingSize: number;
  nutritionalGoals?: NutritionalGoals;
}

export interface NutritionalGoals {
  dailyCalories?: { min?: number; max?: number };
  dailyProtein?: { min?: number; max?: number };
  dailyCarbs?: { min?: number; max?: number };
  dailyFat?: { min?: number; max?: number };
}

export interface AIGenerationParams {
  preferences: UserPreferences;
  pantryItems?: Ingredient[];
  mealType?: MealType;
  specificRequirements?: string;
  avoidRecipes?: string[]; // Recipe IDs to avoid
  includeIngredients?: string[];
  excludeIngredients?: string[];
  maxPrepTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface AIGenerationResult {
  recipe: Recipe;
  reasoning?: string;
  alternatives?: Recipe[];
  nutritionalAnalysis?: string;
  substitutionSuggestions?: MealCustomization[];
}