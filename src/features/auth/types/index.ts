// Authentication & Onboarding Types

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  onboarding_completed: boolean;
  onboarding_step?: OnboardingStep;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  dietary_restrictions: DietaryRestriction[];
  allergies: string[];
  cuisine_preferences: CuisineType[];
  cooking_skill_level: CookingSkillLevel;
  household_size: number;
  weekly_budget?: number;
  preferred_meal_times?: MealTimePreferences;
  nutrition_goals?: NutritionGoals;
  cooking_time_preference: CookingTimePreference;
  created_at: Date;
  updated_at: Date;
}

export interface NutritionGoals {
  daily_calories?: number;
  protein_percentage?: number;
  carbs_percentage?: number;
  fat_percentage?: number;
  fiber_grams?: number;
  sodium_mg?: number;
  sugar_grams?: number;
  custom_goals?: CustomNutritionGoal[];
}

export interface CustomNutritionGoal {
  nutrient: string;
  amount: number;
  unit: string;
  comparison: 'min' | 'max' | 'exact';
}

export interface MealTimePreferences {
  breakfast?: string; // e.g., "07:00"
  lunch?: string;     // e.g., "12:30"
  dinner?: string;    // e.g., "19:00"
  snacks?: boolean;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  data: Partial<OnboardingData>;
  isLoading: boolean;
  error?: string;
}

export interface OnboardingData {
  profile: Partial<UserProfile>;
  preferences: Partial<UserPreferences>;
  pantryItems: PantryItem[];
  initialMealPlan?: WeeklyMealPlan;
}

export interface PantryItem {
  id?: string;
  name: string;
  category: PantryCategory;
  quantity?: number;
  unit?: string;
  expiration_date?: Date;
}

export interface WeeklyMealPlan {
  id: string;
  user_id: string;
  week_start: Date;
  meals: PlannedMeal[];
  created_at: Date;
}

export interface PlannedMeal {
  id: string;
  date: Date;
  meal_type: MealType;
  recipe_id?: string;
  recipe?: Recipe;
  custom_meal?: string;
  servings: number;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: RecipeDifficulty;
  cuisine_type?: CuisineType;
  dietary_tags: DietaryRestriction[];
  image_url?: string;
}

// Enums and Constants

export enum OnboardingStep {
  WELCOME = 'welcome',
  PROFILE_SETUP = 'profile_setup',
  DIETARY_PREFERENCES = 'dietary_preferences',
  COOKING_PREFERENCES = 'cooking_preferences',
  NUTRITION_GOALS = 'nutrition_goals',
  PANTRY_SETUP = 'pantry_setup',
  MEAL_PLAN_PREVIEW = 'meal_plan_preview',
  COMPLETION = 'completion'
}

export enum DietaryRestriction {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  NUT_FREE = 'nut_free',
  KOSHER = 'kosher',
  HALAL = 'halal',
  LOW_CARB = 'low_carb',
  KETO = 'keto',
  PALEO = 'paleo',
  PESCATARIAN = 'pescatarian'
}

export enum CuisineType {
  ITALIAN = 'italian',
  MEXICAN = 'mexican',
  CHINESE = 'chinese',
  JAPANESE = 'japanese',
  INDIAN = 'indian',
  THAI = 'thai',
  GREEK = 'greek',
  AMERICAN = 'american',
  MEDITERRANEAN = 'mediterranean',
  FRENCH = 'french',
  KOREAN = 'korean',
  VIETNAMESE = 'vietnamese'
}

export enum CookingSkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum CookingTimePreference {
  QUICK = 'quick', // < 30 min
  MODERATE = 'moderate', // 30-60 min
  LEISURELY = 'leisurely' // > 60 min
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

export enum RecipeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum PantryCategory {
  PROTEINS = 'proteins',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  CONDIMENTS = 'condiments',
  SPICES = 'spices',
  OILS = 'oils',
  CANNED_GOODS = 'canned_goods',
  FROZEN = 'frozen',
  BAKING = 'baking',
  SNACKS = 'snacks',
  BEVERAGES = 'beverages'
}

// Auth Error Types
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Session Types
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

// Form Types
export interface SignInFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  acceptTerms: boolean;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
}