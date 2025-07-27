// =============================================
// MEAL PLANNING TYPE DEFINITIONS
// Hybrid implementation: Enhanced with Summit's Argentine-specific features
// =============================================

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type MealSlotType = 'breakfast' | 'lunch' | 'snack' | 'dinner'; // API compatibility
export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'glutenFree' | 'dairyFree';
export type DietProfile = 'balanced' | 'protein-rich' | 'low-carb' | 'mediterranean' | 'low-fat';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Argentine-specific types from Summit
export type ArgentineRegion = 'NOA' | 'NEA' | 'CABA' | 'PBA' | 'Cuyo' | 'Patagonia';
export type ModeType = 'normal' | 'economico' | 'fiesta' | 'dieta';
export type ShoppingAisle = 'verduleria' | 'carniceria' | 'almacen' | 'panaderia' | 'fiambreria' | 'pescaderia' | 'otros';
export type ArgentineSeason = 'verano' | 'otoño' | 'invierno' | 'primavera';

// =============================================
// CORE DOMAIN TYPES
// =============================================

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  dietaryLabels: DietaryPreference[];
  cuisine?: string;
  tags: string[];
  rating?: number;
  isAiGenerated?: boolean;
  isFavorite?: boolean;
}

export interface Ingredient {
  id?: string;
  name: string;
  amount?: number;
  unit?: string;
  category?: IngredientCategory;
  aisle?: ShoppingAisle; // Argentine-specific shopping location
  notes?: string;
  isOptional?: boolean;
  substitution?: string;
  regionAvailability?: ArgentineRegion[]; // Regional availability
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export type IngredientCategory = 
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'grains'
  | 'pantry'
  | 'spices'
  | 'frozen'
  | 'beverages'
  | 'other';

export interface MealSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  mealType: MealType;
  date: string; // YYYY-MM-DD format
  recipeId?: string;
  customMealName?: string;
  recipe?: Recipe;
  servings: number;
  isLocked: boolean;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekPlan {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  slots: MealSlot[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// UI & DISPLAY TYPES
// =============================================

export interface DayPlan {
  date: string;
  dayOfWeek: number;
  meals: {
    desayuno?: MealSlot;
    almuerzo?: MealSlot;
    merienda?: MealSlot;
    cena?: MealSlot;
  };
  nutritionSummary?: NutritionInfo;
  isToday: boolean;
}

export interface WeekSummary {
  totalMeals: number;
  completedMeals: number;
  uniqueRecipes: number;
  totalServings: number;
  nutritionAverage?: NutritionInfo;
  completionPercentage: number;
}

// =============================================
// USER PREFERENCES
// =============================================

export interface UserPreferences {
  dietaryPreferences: DietaryPreference[];
  dietProfile: DietProfile;
  cuisinePreferences: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  allergies: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  maxCookingTime: number; // minutes
  mealsPerDay: number;
  servingsPerMeal: number;
  budget: BudgetLevel;
  preferVariety: boolean;
  useSeasonalIngredients: boolean;
  considerPantryItems: boolean;
}

// =============================================
// AI PLANNING TYPES
// =============================================

export interface AIPlannerConfig {
  userId: string;
  startDate: string;
  numberOfDays: number;
  mealsPerDay: MealType[];
  preferences: UserPreferences;
  replaceExisting: boolean;
  lockExistingMeals: boolean;
}

export interface AIGeneratedPlan {
  id: string;
  config: AIPlannerConfig;
  weekPlan: WeekPlan;
  shoppingList: ShoppingList;
  nutritionSummary: {
    daily: NutritionInfo;
    weekly: NutritionInfo;
  };
  estimatedCost?: {
    total: number;
    perMeal: number;
    perServing: number;
  };
  generatedAt: string;
  suggestions: string[];
}

// =============================================
// SHOPPING LIST TYPES
// =============================================

export interface ShoppingList {
  id: string;
  userId: string;
  weekPlanId: string;
  items: ShoppingListItem[];
  categories: ShoppingListCategory[];
  estimatedTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  ingredientName: string;
  totalAmount: number;
  unit: string;
  category: IngredientCategory;
  recipeNames: string[]; // Recipes that use this ingredient
  isPurchased: boolean;
  estimatedPrice?: number;
  notes?: string;
  packageInfo?: {
    amount: number;
    unit: string;
    quantity: number;
  };
}

export interface ShoppingListCategory {
  name: IngredientCategory;
  items: ShoppingListItem[];
  subtotal?: number;
}

// =============================================
// STORE TYPES
// =============================================

export interface MealPlanningStore {
  // Core State
  currentWeekPlan: WeekPlan | null;
  recipes: Record<string, Recipe>;
  userPreferences: UserPreferences | null;
  currentDate: Date;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedSlots: string[];
  draggedSlot: MealSlot | null;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  
  // Modal State
  activeModal: 'recipe-select' | 'ai-planner' | 'preferences' | 'shopping-list' | 'recipe-detail' | null;
  selectedMeal: MealSlot | null;
  
  // Offline queue
  offlineQueue: Array<() => Promise<void>>;
  
  // Real-time state
  realtimeStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Actions - Data Management
  loadWeekPlan: (startDate: string) => Promise<void>;
  saveWeekPlan: (weekPlan: WeekPlan) => Promise<void>;
  
  // Actions - Meal Management
  addMealToSlot: (slot: Partial<MealSlot>, recipe: Recipe) => Promise<void>;
  updateMealSlot: (slotId: string, updates: Partial<MealSlot>) => Promise<void>;
  removeMealFromSlot: (slotId: string) => Promise<void>;
  toggleSlotLock: (slotId: string) => Promise<void>;
  
  // Actions - Batch Operations
  generateWeekWithAI: (config: AIPlannerConfig) => Promise<AIGeneratedPlan>;
  clearWeek: () => Promise<void>;
  duplicateWeek: (targetStartDate: string) => Promise<void>;
  
  // Actions - UI
  setCurrentDate: (date: Date) => void;
  setActiveModal: (modal: MealPlanningStore['activeModal']) => void;
  setSelectedMeal: (meal: MealSlot | null) => void;
  toggleSlotSelection: (slotId: string, multi?: boolean) => void;
  
  // Selectors
  getSlotForDay: (dayOfWeek: number, mealType: MealType) => MealSlot | undefined;
  getWeekSummary: () => WeekSummary;
  getDayPlan: (dayOfWeek: number) => DayPlan;
  getShoppingList: () => Promise<ShoppingList>;
  
  // Export functionality
  exportWeekPlanAsJSON: () => String;
  exportWeekPlanAsCSV: () => String;
  exportWeekPlanAsPDF: () => Promise<Blob>;
  downloadWeekPlan: (format: 'json' | 'csv' | 'pdf') => void;
  
  // Real-time sync methods
  setupRealtimeSync: () => Promise<void>;
  cleanupRealtimeSync: () => Promise<void>;
  
  // Offline support methods
  syncOfflineChanges: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Batch operations
  batchUpdateSlots: (updates: Array<{ slotId: string; changes: Partial<MealSlot> }>) => Promise<void>;
}

// =============================================
// COMPONENT PROPS
// =============================================

export interface MealSlotProps {
  slot?: MealSlot;
  dayOfWeek: number;
  mealType: MealType;
  isToday?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onSlotClick?: (slot: MealSlot) => void;
  onRecipeSelect?: (slot: MealSlot) => void;
  onSlotClear?: (slot: MealSlot) => void;
  onSlotLock?: (slot: MealSlot, locked: boolean) => void;
  onAIGenerate?: (slot: Partial<MealSlot>) => void;
}

export interface WeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (direction: 'prev' | 'next' | 'today') => void;
  weekSummary: WeekSummary;
}

// =============================================
// MEAL CONFIGURATION
// =============================================

export interface MealConfig {
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  gradient: string;
  glowColor: string;
  time: string;
}

export const MEAL_CONFIG: Record<MealType, MealConfig> = {
  desayuno: {
    label: 'Desayuno',
    icon: () => null, // Will be replaced with actual icon
    emoji: '☕',
    gradient: 'from-amber-400 via-orange-400 to-yellow-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    time: '7:00 - 10:00'
  },
  almuerzo: {
    label: 'Almuerzo',
    icon: () => null,
    emoji: '☀️',
    gradient: 'from-blue-400 via-cyan-400 to-teal-400',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    time: '12:00 - 14:00'
  },
  merienda: {
    label: 'Merienda',
    icon: () => null,
    emoji: '🍎',
    gradient: 'from-green-400 via-emerald-400 to-lime-400',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    time: '16:00 - 17:00'
  },
  cena: {
    label: 'Cena',
    icon: () => null,
    emoji: '🌙',
    gradient: 'from-purple-400 via-pink-400 to-rose-400',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    time: '19:00 - 21:00'
  }
};

// =============================================
// UTILITY TYPES
// =============================================

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// =============================================
// SUMMIT ENHANCED TYPES - Argentine specific
// =============================================

export interface PlannedMeal {
  slot: MealSlotType;
  time: string;
  recipe: Recipe;
  aiGenerated: boolean;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  days: Array<{
    date: string;
    label: string;
    meals: {
      breakfast: PlannedMeal;
      lunch: PlannedMeal;
      snack: PlannedMeal;
      dinner: PlannedMeal;
    };
  }>;
  metadata: {
    season: ArgentineSeason;
    region: ArgentineRegion;
    mode: ModeType;
    createdAt: string;
  };
  updatedAt?: string;
}

export interface SummitUserPreferences {
  dietary_restrictions: string[];
  favorite_dishes: string[];
  disliked_ingredients: string[];
  household_size: number;
  budget_weekly: number;
  region?: ArgentineRegion;
}

// Utility functions for type conversion
export function mealTypeToSlot(mealType: MealType): MealSlotType {
  const mapping: Record<MealType, MealSlotType> = {
    'desayuno': 'breakfast',
    'almuerzo': 'lunch',
    'merienda': 'snack',
    'cena': 'dinner'
  };
  return mapping[mealType];
}

export function slotToMealType(slot: MealSlotType): MealType {
  const mapping: Record<MealSlotType, MealType> = {
    'breakfast': 'desayuno',
    'lunch': 'almuerzo',
    'snack': 'merienda',
    'dinner': 'cena'
  };
  return mapping[slot];
}