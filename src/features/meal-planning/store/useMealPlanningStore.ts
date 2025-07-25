'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import type {
  MealPlanningStore,
  WeekPlan,
  MealSlot,
  Recipe,
  UserPreferences,
  WeekSummary,
  DayPlan,
  AIPlannerConfig,
  AIGeneratedPlan,
  ShoppingList,
  MealType
} from '../types';

// Mock data for development
const mockRecipes: Record<string, Recipe> = {
  'tortilla-espanola': {
    id: 'tortilla-espanola',
    name: 'Tortilla Española',
    description: 'Clásica tortilla de patatas con cebolla',
    image: 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=400',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Patatas', amount: 6, unit: 'unidades', category: 'produce' },
      { id: '2', name: 'Huevos', amount: 6, unit: 'unidades', category: 'dairy' },
      { id: '3', name: 'Cebolla', amount: 1, unit: 'unidad', category: 'produce' },
      { id: '4', name: 'Aceite de oliva', amount: 100, unit: 'ml', category: 'pantry' }
    ],
    instructions: [
      'Pelar y cortar las patatas en rodajas finas',
      'Calentar aceite en una sartén grande',
      'Freír las patatas hasta que estén doradas',
      'Batir los huevos y mezclar con las patatas',
      'Cocinar la tortilla por ambos lados'
    ],
    nutrition: {
      calories: 320,
      protein: 18,
      carbs: 24,
      fat: 15
    },
    dietaryLabels: ['vegetarian'],
    cuisine: 'Española',
    tags: ['desayuno', 'almuerzo', 'tradicional'],
    rating: 4.8,
    isAiGenerated: false,
    isFavorite: true
  },
  'ensalada-mediterranea': {
    id: 'ensalada-mediterranea',
    name: 'Ensalada Mediterránea',
    description: 'Fresca ensalada con tomate, pepino y feta',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Tomates cherry', amount: 200, unit: 'g', category: 'produce' },
      { id: '2', name: 'Pepino', amount: 1, unit: 'unidad', category: 'produce' },
      { id: '3', name: 'Queso feta', amount: 100, unit: 'g', category: 'dairy' },
      { id: '4', name: 'Aceitunas negras', amount: 50, unit: 'g', category: 'pantry' }
    ],
    instructions: [
      'Cortar los tomates por la mitad',
      'Cortar el pepino en rodajas',
      'Desmenuzar el queso feta',
      'Mezclar todos los ingredientes',
      'Aliñar con aceite de oliva y limón'
    ],
    nutrition: {
      calories: 250,
      protein: 12,
      carbs: 20,
      fat: 18
    },
    dietaryLabels: ['vegetarian', 'glutenFree'],
    cuisine: 'Mediterránea',
    tags: ['cena', 'saludable', 'fresco'],
    rating: 4.5,
    isAiGenerated: false,
    isFavorite: false
  }
};

const mockUserPreferences: UserPreferences = {
  dietaryPreferences: ['omnivore'],
  dietProfile: 'balanced',
  cuisinePreferences: ['mediterránea', 'española'],
  excludedIngredients: [],
  preferredIngredients: [],
  allergies: [],
  cookingSkill: 'intermediate',
  maxCookingTime: 60,
  mealsPerDay: 3,
  servingsPerMeal: 2,
  budget: 'medium',
  preferVariety: true,
  useSeasonalIngredients: true,
  considerPantryItems: true
};

// Cache management
const CACHE_KEY_PREFIX = 'meal-plan-cache-';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedWeekPlan {
  data: WeekPlan;
  timestamp: number;
}

const getCachedWeekPlan = (startDate: string): WeekPlan | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${startDate}`);
    if (!cached) return null;
    
    const { data, timestamp }: CachedWeekPlan = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${startDate}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

const setCachedWeekPlan = (startDate: string, data: WeekPlan) => {
  try {
    const cacheData: CachedWeekPlan = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${startDate}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

const clearCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const useMealPlanningStore = create<MealPlanningStore>()(
  devtools(
    (set, get) => ({
      // Core State
      currentWeekPlan: null,
      recipes: mockRecipes,
      userPreferences: mockUserPreferences,
      currentDate: new Date(),
      
      // UI State
      isLoading: false,
      error: null,
      selectedSlots: [],
      draggedSlot: null,
      
      // Modal State
      activeModal: null,
      selectedMeal: null,

      // Actions - Data Management
      loadWeekPlan: async (startDate: string) => {
        set({ isLoading: true, error: null });
        try {
          // Check cache first
          const cached = getCachedWeekPlan(startDate);
          if (cached) {
            set({ currentWeekPlan: cached, isLoading: false });
            return;
          }

          // Mock API call - in production, this would fetch from backend
          const endDate = format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');
          
          // Create empty week plan
          const weekPlan: WeekPlan = {
            id: `week-${startDate}`,
            userId: 'current-user', // Would come from auth
            startDate,
            endDate,
            slots: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Generate empty slots for the week
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = format(addDays(new Date(startDate), dayOffset), 'yyyy-MM-dd');
            const dayOfWeek = addDays(new Date(startDate), dayOffset).getDay();
            
            const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
            
            mealTypes.forEach(mealType => {
              weekPlan.slots.push({
                id: `${date}-${mealType}`,
                dayOfWeek,
                mealType,
                date,
                servings: get().userPreferences?.servingsPerMeal || 2,
                isLocked: false,
                isCompleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            });
          }

          // Cache the week plan
          setCachedWeekPlan(startDate, weekPlan);
          
          set({ currentWeekPlan: weekPlan, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load week plan', isLoading: false });
        }
      },

      saveWeekPlan: async (weekPlan: WeekPlan) => {
        set({ isLoading: true, error: null });
        try {
          // Mock API call - in production, this would save to backend
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const updatedWeekPlan = { 
            ...weekPlan, 
            updatedAt: new Date().toISOString() 
          };
          
          // Update cache
          setCachedWeekPlan(weekPlan.startDate, updatedWeekPlan);
          
          set({ 
            currentWeekPlan: updatedWeekPlan, 
            isLoading: false 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to save week plan', isLoading: false });
        }
      },

      // Actions - Meal Management
      addMealToSlot: async (slotData: Partial<MealSlot>, recipe: Recipe) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          const updatedSlots = currentWeekPlan.slots.map(slot => {
            if (slot.dayOfWeek === slotData.dayOfWeek && slot.mealType === slotData.mealType) {
              return {
                ...slot,
                recipeId: recipe.id,
                recipe,
                customMealName: undefined,
                updatedAt: new Date().toISOString()
              };
            }
            return slot;
          });

          const updatedWeekPlan = {
            ...currentWeekPlan,
            slots: updatedSlots,
            updatedAt: new Date().toISOString()
          };

          set({ currentWeekPlan: updatedWeekPlan });
          await get().saveWeekPlan(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add meal to slot' });
        }
      },

      updateMealSlot: async (slotId: string, updates: Partial<MealSlot>) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          const updatedSlots = currentWeekPlan.slots.map(slot =>
            slot.id === slotId 
              ? { ...slot, ...updates, updatedAt: new Date().toISOString() }
              : slot
          );

          const updatedWeekPlan = {
            ...currentWeekPlan,
            slots: updatedSlots,
            updatedAt: new Date().toISOString()
          };

          set({ currentWeekPlan: updatedWeekPlan });
          await get().saveWeekPlan(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update meal slot' });
        }
      },

      removeMealFromSlot: async (slotId: string) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          const updatedSlots = currentWeekPlan.slots.map(slot =>
            slot.id === slotId 
              ? { 
                  ...slot, 
                  recipeId: undefined,
                  recipe: undefined,
                  customMealName: undefined,
                  updatedAt: new Date().toISOString()
                }
              : slot
          );

          const updatedWeekPlan = {
            ...currentWeekPlan,
            slots: updatedSlots,
            updatedAt: new Date().toISOString()
          };

          set({ currentWeekPlan: updatedWeekPlan });
          await get().saveWeekPlan(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove meal from slot' });
        }
      },

      toggleSlotLock: async (slotId: string) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        const slot = currentWeekPlan.slots.find(s => s.id === slotId);
        if (!slot) return;

        await get().updateMealSlot(slotId, { isLocked: !slot.isLocked });
      },

      // Actions - Batch Operations
      generateWeekWithAI: async (config: AIPlannerConfig): Promise<AIGeneratedPlan> => {
        set({ isLoading: true, error: null });
        try {
          // Mock AI generation - in production, this would call AI service
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { currentWeekPlan, recipes } = get();
          if (!currentWeekPlan) throw new Error('No current week plan');

          // Simple mock: assign random recipes to slots
          const recipeList = Object.values(recipes);
          const updatedSlots = currentWeekPlan.slots.map(slot => {
            if (slot.isLocked) return slot; // Don't modify locked slots
            
            const randomRecipe = recipeList[Math.floor(Math.random() * recipeList.length)];
            return {
              ...slot,
              recipeId: randomRecipe.id,
              recipe: randomRecipe,
              updatedAt: new Date().toISOString()
            };
          });

          const aiGeneratedPlan: AIGeneratedPlan = {
            id: `ai-plan-${Date.now()}`,
            config,
            weekPlan: {
              ...currentWeekPlan,
              slots: updatedSlots
            },
            shoppingList: {
              id: `shopping-${Date.now()}`,
              userId: config.userId,
              weekPlanId: currentWeekPlan.id,
              items: [],
              categories: [],
              estimatedTotal: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            nutritionSummary: {
              daily: { calories: 2000, protein: 100, carbs: 250, fat: 70 },
              weekly: { calories: 14000, protein: 700, carbs: 1750, fat: 490 }
            },
            generatedAt: new Date().toISOString(),
            suggestions: [
              'Considera agregar más variedad de verduras',
              'Incluye más proteínas magras en tu dieta',
              'Balancea mejor los carbohidratos'
            ]
          };

          set({ currentWeekPlan: aiGeneratedPlan.weekPlan, isLoading: false });
          return aiGeneratedPlan;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to generate AI plan', isLoading: false });
          throw error;
        }
      },

      clearWeek: async () => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          const clearedSlots = currentWeekPlan.slots.map(slot => ({
            ...slot,
            recipeId: undefined,
            recipe: undefined,
            customMealName: undefined,
            isCompleted: false,
            updatedAt: new Date().toISOString()
          }));

          const updatedWeekPlan = {
            ...currentWeekPlan,
            slots: clearedSlots,
            updatedAt: new Date().toISOString()
          };

          // Clear cache for this week
          localStorage.removeItem(`${CACHE_KEY_PREFIX}${currentWeekPlan.startDate}`);
          
          set({ currentWeekPlan: updatedWeekPlan });
          await get().saveWeekPlan(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to clear week' });
        }
      },

      duplicateWeek: async (targetStartDate: string) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          // Load or create target week
          await get().loadWeekPlan(targetStartDate);
          
          // Copy meals from current week to target week
          // Implementation would depend on specific requirements
          
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to duplicate week' });
        }
      },

      // Actions - UI
      setCurrentDate: (date: Date) => {
        set({ currentDate: date });
        
        // Auto-load week plan for the new date
        const startDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        get().loadWeekPlan(startDate);
      },

      setActiveModal: (modal) => set({ activeModal: modal }),

      setSelectedMeal: (meal) => set({ selectedMeal: meal }),

      toggleSlotSelection: (slotId: string, multi = false) => {
        const { selectedSlots } = get();
        
        if (!multi) {
          set({ selectedSlots: [slotId] });
          return;
        }

        const isSelected = selectedSlots.includes(slotId);
        if (isSelected) {
          set({ selectedSlots: selectedSlots.filter(id => id !== slotId) });
        } else {
          set({ selectedSlots: [...selectedSlots, slotId] });
        }
      },

      // Selectors
      getSlotForDay: (dayOfWeek: number, mealType: MealType) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return undefined;
        
        return currentWeekPlan.slots.find(
          slot => slot.dayOfWeek === dayOfWeek && slot.mealType === mealType
        );
      },

      getWeekSummary: (): WeekSummary => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) {
          return {
            totalMeals: 0,
            completedMeals: 0,
            uniqueRecipes: 0,
            totalServings: 0,
            completionPercentage: 0
          };
        }

        const filledSlots = currentWeekPlan.slots.filter(slot => slot.recipeId);
        const totalMeals = filledSlots.length;
        const completedMeals = currentWeekPlan.slots.filter(slot => slot.isCompleted).length;
        const uniqueRecipes = new Set(filledSlots.map(slot => slot.recipeId)).size;
        const totalServings = filledSlots.reduce((sum, slot) => sum + slot.servings, 0);
        
        const totalCalories = filledSlots.reduce((sum, slot) => {
          return sum + (slot.recipe?.nutrition?.calories || 0) * slot.servings;
        }, 0);
        
        const totalProtein = filledSlots.reduce((sum, slot) => {
          return sum + (slot.recipe?.nutrition?.protein || 0) * slot.servings;
        }, 0);

        return {
          totalMeals,
          completedMeals,
          uniqueRecipes,
          totalServings,
          nutritionAverage: totalMeals > 0 ? {
            calories: Math.round(totalCalories / totalMeals),
            protein: Math.round(totalProtein / totalMeals),
            carbs: 0, // Would calculate from actual data
            fat: 0    // Would calculate from actual data
          } : undefined,
          completionPercentage: Math.round((totalMeals / 28) * 100) // 28 = 7 days × 4 meals
        };
      },

      getDayPlan: (dayOfWeek: number): DayPlan => {
        const { currentWeekPlan, currentDate } = get();
        
        const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        const targetDate = addDays(startOfCurrentWeek, dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const dateStr = format(targetDate, 'yyyy-MM-dd');

        const daySlots = currentWeekPlan?.slots.filter(slot => slot.dayOfWeek === dayOfWeek) || [];
        
        const meals = {
          desayuno: daySlots.find(slot => slot.mealType === 'desayuno'),
          almuerzo: daySlots.find(slot => slot.mealType === 'almuerzo'),
          merienda: daySlots.find(slot => slot.mealType === 'merienda'),
          cena: daySlots.find(slot => slot.mealType === 'cena')
        };

        return {
          date: dateStr,
          dayOfWeek,
          meals,
          isToday: isSameDay(targetDate, new Date())
        };
      },

      getShoppingList: async (): Promise<ShoppingList> => {
        // Mock implementation - would generate from current week plan
        return {
          id: `shopping-${Date.now()}`,
          userId: 'current-user',
          weekPlanId: get().currentWeekPlan?.id || '',
          items: [],
          categories: [],
          estimatedTotal: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    }),
    {
      name: 'meal-planning-store',
      version: 1
    }
  )
);