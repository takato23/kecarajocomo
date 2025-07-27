/**
 * Argentine Meal Plan Slice - Zustand store for meal planning with cultural specifics
 * Handles state persistence with localStorage and Supabase sync
 */

import { StateCreator } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES - Argentine-specific meal planning types
// ============================================================================

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type ModeType = 'normal' | 'economico' | 'fiesta' | 'dieta';
export type RegionType = 'pampa' | 'patagonia' | 'norte' | 'cuyo' | 'centro' | 'litoral';
export type SeasonType = 'verano' | 'otono' | 'invierno' | 'primavera';

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
  difficulty: 'facil' | 'medio' | 'dificil';
  tags: string[];
  region?: RegionType;
  season?: SeasonType;
  cultural: {
    isTraditional: boolean;
    occasion?: 'domingo' | 'feriado' | 'dia29' | 'invierno' | 'verano';
    significance?: string;
  };
  cost: {
    total: number;
    perServing: number;
    currency: 'ARS';
  };
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: 'carnes' | 'verduras' | 'frutas' | 'lacteos' | 'cereales' | 'condimentos' | 'bebidas' | 'otros';
  isOptional?: boolean;
  notes?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber?: number; // g
  sodium?: number; // mg
}

export interface ArgentineMeal {
  recipe: Recipe;
  servings: number;
  notes?: string;
  locked?: boolean;
  alternatives?: Recipe[];
  cost: number;
  nutrition: NutritionInfo;
}

export interface ArgentineDayPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
  dayName: string;
  desayuno: ArgentineMeal | null;
  almuerzo: ArgentineMeal | null;
  merienda: ArgentineMeal | null;
  cena: ArgentineMeal | null;
  cultural: {
    isSpecialDay: boolean;
    occasion?: string;
    notes?: string;
  };
  dailyNutrition: NutritionInfo;
  dailyCost: number;
}

export interface ArgentineWeeklyPlan {
  planId: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  days: ArgentineDayPlan[];
  weeklyNutrition: NutritionInfo;
  weeklyCost: number;
  generatedAt: string;
  lastModified: string;
  mode: ModeType;
  region: RegionType;
  season: SeasonType;
  cultural: {
    hasAsado: boolean;
    hasMate: boolean;
    hasNoquis29: boolean;
    specialOccasions: string[];
  };
}

export interface UserPreferences {
  dietary: {
    restrictions: string[]; // ['vegetarian', 'gluten-free', etc.]
    allergies: string[];
    dislikes: string[];
    favorites: string[];
  };
  cooking: {
    skill: 'principiante' | 'intermedio' | 'avanzado';
    timeAvailable: number; // max minutes per meal
    equipment: string[];
    preferredTechniques: string[];
  };
  cultural: {
    region: RegionType;
    traditionLevel: 'baja' | 'media' | 'alta'; // how much traditional food
    mateFrequency: 'nunca' | 'ocasional' | 'diario';
    asadoFrequency: 'nunca' | 'mensual' | 'quincenal' | 'semanal';
  };
  family: {
    householdSize: number;
    hasChildren: boolean;
    ageRanges: string[];
    specialNeeds: string[];
  };
  budget: {
    weekly: number;
    currency: 'ARS';
    flexibility: 'estricto' | 'flexible' | 'sin_limite';
  };
  shopping: {
    preferredStores: string[];
    buysBulk: boolean;
    prefersLocal: boolean;
    hasGarden: boolean;
  };
}

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  unit: string;
  expiryDate?: string;
  cost?: number;
  lastUsed?: string;
  frequency: 'alta' | 'media' | 'baja';
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  unit: string;
  estimatedCost: number;
  priority: 'alta' | 'media' | 'baja';
  inPantry: boolean;
  recipes: string[]; // recipe names that use this ingredient
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  weekPlanId: string;
  items: ShoppingListItem[];
  totalCost: number;
  generatedAt: string;
  categories: {
    name: string;
    items: ShoppingListItem[];
    subtotal: number;
  }[];
}

export interface WeeklyNutritionSummary {
  daily: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  weekly: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  balance: {
    varietyScore: number; // 0-10
    nutritionScore: number; // 0-10
    culturalScore: number; // 0-10
  };
  recommendations: string[];
}

export interface MealPlanRecord {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  plan_data: ArgentineWeeklyPlan;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ZUSTAND STORE STATE & ACTIONS
// ============================================================================

export interface MealPlanState {
  // Core state
  weeklyPlan: ArgentineWeeklyPlan | null;
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
  weekKey: string; // userId:weekStart for uniqueness
  isDirty: boolean; // has unsaved changes
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Sync state
  lastSyncedAt: string | null;
  syncInProgress: boolean;
  offlineChanges: any[];
}

export interface MealPlanActions {
  // Core actions
  setWeeklyPlan: (plan: ArgentineWeeklyPlan | null) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setMode: (mode: ModeType) => void;
  setWeekKey: (key: string) => void;
  setDirty: (dirty: boolean) => void;
  
  // Pantry management
  upsertPantryItem: (item: PantryItem) => void;
  removePantryItem: (itemId: string) => void;
  updatePantryItem: (itemId: string, updates: Partial<PantryItem>) => void;
  
  // Preferences
  addFavoriteDish: (dish: string) => void;
  addDislikedIngredient: (ingredient: string) => void;
  updateCulturalPreferences: (cultural: Partial<UserPreferences['cultural']>) => void;
  updateBudgetPreferences: (budget: Partial<UserPreferences['budget']>) => void;
  
  // Utilities
  clearError: () => void;
  resetState: () => void;
}

export type MealPlanSlice = MealPlanState & MealPlanActions;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  dietary: {
    restrictions: [],
    allergies: [],
    dislikes: [],
    favorites: ['asado', 'empanadas', 'milanesas', 'pasta']
  },
  cooking: {
    skill: 'intermedio',
    timeAvailable: 60,
    equipment: ['horno', 'estufa', 'microondas'],
    preferredTechniques: ['plancha', 'horno', 'hervor']
  },
  cultural: {
    region: 'pampa',
    traditionLevel: 'media',
    mateFrequency: 'diario',
    asadoFrequency: 'quincenal'
  },
  family: {
    householdSize: 2,
    hasChildren: false,
    ageRanges: ['adulto'],
    specialNeeds: []
  },
  budget: {
    weekly: 15000,
    currency: 'ARS',
    flexibility: 'flexible'
  },
  shopping: {
    preferredStores: ['supermercado'],
    buysBulk: false,
    prefersLocal: true,
    hasGarden: false
  }
};

const DEFAULT_PANTRY: PantryItem[] = [
  {
    id: 'sal',
    name: 'Sal',
    category: 'condimentos',
    amount: 1,
    unit: 'kg',
    frequency: 'alta'
  },
  {
    id: 'aceite',
    name: 'Aceite',
    category: 'condimentos', 
    amount: 1,
    unit: 'litro',
    frequency: 'alta'
  },
  {
    id: 'yerba',
    name: 'Yerba mate',
    category: 'bebidas',
    amount: 500,
    unit: 'g',
    frequency: 'alta'
  }
];

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

export const createMealPlanSlice: StateCreator<
  MealPlanSlice,
  [['zustand/subscribeWithSelector', never], ['zustand/persist', unknown], ['zustand/immer', never]],
  [],
  MealPlanSlice
> = (set, get) => ({
  // Initial state
  weeklyPlan: null,
  preferences: DEFAULT_PREFERENCES,
  pantry: DEFAULT_PANTRY,
  mode: 'normal',
  weekKey: '',
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSyncedAt: null,
  syncInProgress: false,
  offlineChanges: [],

  // Core actions
  setWeeklyPlan: (plan) => set((state) => {
    state.weeklyPlan = plan;
    if (plan) {
      state.isDirty = true;
      state.error = null;
    }
  }),

  setPreferences: (preferences) => set((state) => {
    state.preferences = { ...state.preferences, ...preferences };
    state.isDirty = true;
  }),

  setMode: (mode) => set((state) => {
    state.mode = mode;
    state.isDirty = true;
  }),

  setWeekKey: (key) => set((state) => {
    state.weekKey = key;
  }),

  setDirty: (dirty) => set((state) => {
    state.isDirty = dirty;
  }),

  // Pantry management
  upsertPantryItem: (item) => set((state) => {
    const existingIndex = state.pantry.findIndex(p => p.id === item.id);
    if (existingIndex >= 0) {
      state.pantry[existingIndex] = item;
    } else {
      state.pantry.push(item);
    }
    state.isDirty = true;
  }),

  removePantryItem: (itemId) => set((state) => {
    state.pantry = state.pantry.filter(item => item.id !== itemId);
    state.isDirty = true;
  }),

  updatePantryItem: (itemId, updates) => set((state) => {
    const item = state.pantry.find(p => p.id === itemId);
    if (item) {
      Object.assign(item, updates);
      state.isDirty = true;
    }
  }),

  // Preferences management
  addFavoriteDish: (dish) => set((state) => {
    if (!state.preferences.dietary.favorites.includes(dish)) {
      state.preferences.dietary.favorites.push(dish);
      state.isDirty = true;
    }
  }),

  addDislikedIngredient: (ingredient) => set((state) => {
    if (!state.preferences.dietary.dislikes.includes(ingredient)) {
      state.preferences.dietary.dislikes.push(ingredient);
      state.isDirty = true;
    }
  }),

  updateCulturalPreferences: (cultural) => set((state) => {
    state.preferences.cultural = { ...state.preferences.cultural, ...cultural };
    state.isDirty = true;
  }),

  updateBudgetPreferences: (budget) => set((state) => {
    state.preferences.budget = { ...state.preferences.budget, ...budget };
    state.isDirty = true;
  }),

  // Utilities
  clearError: () => set((state) => {
    state.error = null;
  }),

  resetState: () => set((state) => {
    state.weeklyPlan = null;
    state.preferences = DEFAULT_PREFERENCES;
    state.pantry = DEFAULT_PANTRY;
    state.mode = 'normal';
    state.weekKey = '';
    state.isDirty = false;
    state.isLoading = false;
    state.isSaving = false;
    state.error = null;
    state.lastSyncedAt = null;
    state.syncInProgress = false;
    state.offlineChanges = [];
  })
});

// ============================================================================
// PERSISTENCE CONFIG
// ============================================================================

export const mealPlanPersistConfig = {
  name: 'kecarajocomer-meal-plan',
  version: 1,
  partialize: (state: MealPlanSlice) => ({
    preferences: state.preferences,
    pantry: state.pantry,
    mode: state.mode,
    lastSyncedAt: state.lastSyncedAt,
    // Don't persist weeklyPlan - it should be loaded fresh from server
  }),
  onRehydrateStorage: () => (state?: MealPlanSlice) => {
    if (state) {
      logger.info('Meal plan state rehydrated from localStorage', 'MealPlanSlice');
      // Could trigger a background sync here
    }
  },
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const MealTypeSchema = z.enum(['desayuno', 'almuerzo', 'merienda', 'cena']);
export const ModeTypeSchema = z.enum(['normal', 'economico', 'fiesta', 'dieta']);
export const RegionTypeSchema = z.enum(['pampa', 'patagonia', 'norte', 'cuyo', 'centro', 'litoral']);

export const ArgentineMealSchema = z.object({
  recipe: z.any(), // Recipe schema would be defined separately
  servings: z.number().min(1).max(20),
  notes: z.string().optional(),
  locked: z.boolean().optional(),
  alternatives: z.array(z.any()).optional(),
  cost: z.number().min(0),
  nutrition: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
  })
});

export const ArgentineWeeklyPlanSchema = z.object({
  planId: z.string(),
  userId: z.string(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(z.any()), // ArgentineDayPlan schema
  mode: ModeTypeSchema,
  region: RegionTypeSchema,
  generatedAt: z.string(),
  lastModified: z.string(),
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { MealPlanSlice as default };