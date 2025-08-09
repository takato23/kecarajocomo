'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { logger } from '@/lib/logger';
import { MealPlanService } from '@/lib/supabase/meal-plans';
import { supabase } from '@/lib/supabase/client';
import { debounce } from 'lodash';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Import performance cache
import { mealPlanCache, recipeCache, apiCache } from '@/lib/services/performanceCache';

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

// Real-time subscription management
let realtimeChannel: RealtimeChannel | null = null;

// Performance-optimized debounced save
const debouncedSave = debounce(async (weekPlan: WeekPlan) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await MealPlanService.saveWeekPlan(
      user.id,
      weekPlan.startDate,
      format(addDays(new Date(weekPlan.startDate), 6), 'yyyy-MM-dd'),
      weekPlan
    );
    
    if (!result.error) {
      // Update cache after successful save
      mealPlanCache.set(`week-plan-${weekPlan.startDate}`, weekPlan, {
        ttl: 15 * 60 * 1000, // 15 minutes
        priority: 'high'
      });
    }
    
    if (result.error) {
      logger.error('Error in debounced save:', 'meal-planning:useMealPlanningStoreOptimized', result.error);
    }
  } catch (error) {
    logger.error('Error in debounced save:', 'meal-planning:useMealPlanningStoreOptimized', error);
  }
}, 1500); // Reduced from 2000ms for better responsiveness

export const useMealPlanningStoreOptimized = create<MealPlanningStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
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
      isOnline: true,
      isSyncing: false,
      lastSyncedAt: null,
      
      // Modal State
      activeModal: null,
      selectedMeal: null,
      
      // Offline queue
      offlineQueue: [],
      
      // Real-time state
      realtimeStatus: 'disconnected',

      // Actions - Data Management with Performance Caching
      loadWeekPlan: async (startDate: string) => {
        set({ isLoading: true, error: null });
        try {
          // Check performance cache first
          const cacheKey = `week-plan-${startDate}`;
          const cached = await mealPlanCache.getOrSet(
            cacheKey,
            async () => {
              // Get current user
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                throw new Error('Usuario no autenticado');
              }

              const endDate = format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');
              
              // Try to load from Supabase
              const result = await MealPlanService.getWeekPlan(user.id, startDate, endDate);
              
              if (result.data && result.data.slots.length > 0) {
                logger.info('Loaded meal plan from Supabase', 'MealPlanningStoreOptimized', { weekPlan: result.data });
                return result.data;
              }
              
              // Create empty week plan if none exists
              const weekPlan: WeekPlan = {
                id: `week-${startDate}`,
                userId: user.id,
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

              return weekPlan;
            },
            {
              ttl: 15 * 60 * 1000, // 15 minutes
              priority: 'high'
            }
          );

          set({ currentWeekPlan: cached, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load week plan', isLoading: false });
        }
      },

      saveWeekPlan: async (weekPlan: WeekPlan) => {
        set({ isLoading: true, error: null });
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('Usuario no autenticado');
          }

          // Calculate end date
          const endDate = format(addDays(new Date(weekPlan.startDate), 6), 'yyyy-MM-dd');
          
          // Save to Supabase
          const result = await MealPlanService.saveWeekPlan(
            user.id,
            weekPlan.startDate,
            endDate,
            weekPlan
          );
          
          if (result.error) {
            throw result.error;
          }
          
          const updatedWeekPlan = { 
            ...weekPlan, 
            updatedAt: new Date().toISOString() 
          };
          
          // Update performance cache
          mealPlanCache.set(`week-plan-${weekPlan.startDate}`, updatedWeekPlan, {
            ttl: 15 * 60 * 1000,
            priority: 'high'
          });
          
          set({ 
            currentWeekPlan: updatedWeekPlan, 
            isLoading: false 
          });
          
          logger.info('Meal plan saved to Supabase', 'MealPlanningStoreOptimized', { weekPlan });
        } catch (error) {
          logger.error('Failed to save meal plan', 'MealPlanningStoreOptimized', error);
          set({ error: error instanceof Error ? error.message : 'Failed to save week plan', isLoading: false });
        }
      },

      // Actions - Meal Management with Optimistic Updates
      addMealToSlot: async (slotData: Partial<MealSlot>, recipe: Recipe) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          // Optimistic update for immediate UI feedback
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

          // Immediate UI update
          set(state => {
            state.currentWeekPlan = updatedWeekPlan;
          });

          // Cache the recipe
          recipeCache.set(`recipe-${recipe.id}`, recipe, {
            ttl: 60 * 60 * 1000, // 1 hour
            priority: 'medium'
          });

          // Update meal plan cache
          mealPlanCache.set(`week-plan-${currentWeekPlan.startDate}`, updatedWeekPlan, {
            ttl: 15 * 60 * 1000,
            priority: 'high'
          });
          
          // Use debounced save for better performance
          debouncedSave(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add meal to slot' });
        }
      },

      updateMealSlot: async (slotId: string, updates: Partial<MealSlot>) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          // Optimistic update
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

          // Immediate UI update
          set(state => {
            state.currentWeekPlan = updatedWeekPlan;
          });

          // Update cache
          mealPlanCache.set(`week-plan-${currentWeekPlan.startDate}`, updatedWeekPlan, {
            ttl: 15 * 60 * 1000,
            priority: 'high'
          });
          
          // Use debounced save for better performance
          debouncedSave(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update meal slot' });
        }
      },

      removeMealFromSlot: async (slotId: string) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;

        try {
          // Optimistic update
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

          // Immediate UI update
          set(state => {
            state.currentWeekPlan = updatedWeekPlan;
          });

          // Update cache
          mealPlanCache.set(`week-plan-${currentWeekPlan.startDate}`, updatedWeekPlan, {
            ttl: 15 * 60 * 1000,
            priority: 'high'
          });
          
          // Use debounced save for better performance
          debouncedSave(updatedWeekPlan);
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

      // Actions - Batch Operations with Performance Optimization
      generateWeekWithAI: async (config: AIPlannerConfig): Promise<AIGeneratedPlan> => {
        set({ isLoading: true, error: null });
        try {
          // Check if we have a cached AI plan for this config
          const cacheKey = `ai-plan-${JSON.stringify(config).slice(0, 100)}`;
          
          const aiGeneratedPlan = await apiCache.getOrSet(
            cacheKey,
            async () => {
              // Mock AI generation - in production, this would call AI service
              await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 2000ms
              
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

              return {
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
            },
            {
              ttl: 10 * 60 * 1000, // 10 minutes for AI plans
              priority: 'medium'
            }
          );

          // Update cache with generated plan
          mealPlanCache.set(`week-plan-${aiGeneratedPlan.weekPlan.startDate}`, aiGeneratedPlan.weekPlan, {
            ttl: 15 * 60 * 1000,
            priority: 'high'
          });

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
          mealPlanCache.clear(`week-plan-${currentWeekPlan.startDate}`);
          
          set(state => {
            state.currentWeekPlan = updatedWeekPlan;
          });
          
          // Use debounced save for better performance
          debouncedSave(updatedWeekPlan);
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

      // Selectors with memoization
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

        // Use cached summary if available
        const cacheKey = `week-summary-${currentWeekPlan.id}-${currentWeekPlan.updatedAt}`;
        return mealPlanCache.get(cacheKey) || (() => {
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

          const summary = {
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

          // Cache the summary
          mealPlanCache.set(cacheKey, summary, {
            ttl: 5 * 60 * 1000, // 5 minutes
            priority: 'low'
          });

          return summary;
        })();
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
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) {
          throw new Error('No current week plan available');
        }

        try {
          // Check cache first
          const cacheKey = `shopping-list-${currentWeekPlan.id}`;
          const cached = apiCache.get<ShoppingList>(cacheKey);
          if (cached) {
            return cached;
          }

          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Call the shopping list generation API
          const response = await fetch('/api/shopping/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              weekPlanId: currentWeekPlan.id,
              options: {
                organizeByStore: true,
                groupByCategory: true,
                prioritizeByExpiration: true,
                includePriceComparisons: true,
                suggestAlternatives: true,
                optimizeRoute: false
              }
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate shopping list');
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to generate shopping list');
          }

          // Cache the result
          apiCache.set(cacheKey, result.data.shoppingList, {
            ttl: 10 * 60 * 1000, // 10 minutes
            priority: 'medium'
          });

          return result.data.shoppingList;
        } catch (error) {
          logger.error('Error generating shopping list', 'MealPlanningStoreOptimized', error);
          
          // Fallback: return basic shopping list
          return {
            id: `shopping-${Date.now()}`,
            userId: 'current-user',
            weekPlanId: currentWeekPlan.id,
            items: [],
            categories: [],
            estimatedTotal: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      },

      // Export functionality
      exportWeekPlanAsJSON: (): string => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) {
          throw new Error('No current week plan to export');
        }
        
        return JSON.stringify(currentWeekPlan, null, 2);
      },

      exportWeekPlanAsCSV: (): string => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) {
          throw new Error('No current week plan to export');
        }

        const csv = ['Day,Meal Type,Recipe Name,Servings,Prep Time,Cook Time'];
        
        currentWeekPlan.slots.forEach(slot => {
          if (slot.recipe) {
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayName = dayNames[slot.dayOfWeek];
            const mealTypeNames = {
              'desayuno': 'Desayuno',
              'almuerzo': 'Almuerzo', 
              'merienda': 'Merienda',
              'cena': 'Cena'
            };
            
            csv.push([
              dayName,
              mealTypeNames[slot.mealType],
              slot.recipe.name,
              slot.servings.toString(),
              slot.recipe.prepTime?.toString() || '0',
              slot.recipe.cookTime?.toString() || '0'
            ].join(','));
          }
        });

        return csv.join('\n');
      },

      exportWeekPlanAsPDF: async (): Promise<Blob> => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) {
          throw new Error('No current week plan to export');
        }

        // Simple HTML to PDF conversion using browser print
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Plan de Comidas - ${currentWeekPlan.startDate}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              .day { margin: 20px 0; page-break-inside: avoid; }
              .day h2 { color: #666; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
              .meal { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
              .meal-type { font-weight: bold; color: #555; }
              .recipe-name { font-size: 18px; margin: 5px 0; }
              .recipe-details { color: #777; font-size: 14px; }
              .no-meal { color: #999; font-style: italic; }
            </style>
          </head>
          <body>
            <h1>Plan de Comidas</h1>
            <p style="text-align: center; color: #666;">Semana del ${currentWeekPlan.startDate} al ${currentWeekPlan.endDate}</p>
            
            ${Array.from({ length: 7 }, (_, dayIndex) => {
              const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              const daySlots = currentWeekPlan.slots.filter(slot => slot.dayOfWeek === dayIndex);
              const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
              const mealTypeNames = {
                'desayuno': 'Desayuno',
                'almuerzo': 'Almuerzo', 
                'merienda': 'Merienda',
                'cena': 'Cena'
              };

              return `
                <div class="day">
                  <h2>${dayNames[dayIndex]}</h2>
                  ${mealTypes.map(mealType => {
                    const slot = daySlots.find(s => s.mealType === mealType);
                    if (slot?.recipe) {
                      return `
                        <div class="meal">
                          <div class="meal-type">${mealTypeNames[mealType]}</div>
                          <div class="recipe-name">${slot.recipe.name}</div>
                          <div class="recipe-details">
                            Porciones: ${slot.servings} | 
                            Prep: ${slot.recipe.prepTime || 0} min | 
                            Cocción: ${slot.recipe.cookTime || 0} min
                          </div>
                        </div>
                      `;
                    } else {
                      return `
                        <div class="meal">
                          <div class="meal-type">${mealTypeNames[mealType]}</div>
                          <div class="no-meal">Sin asignar</div>
                        </div>
                      `;
                    }
                  }).join('')}
                </div>
              `;
            }).join('')}
          </body>
          </html>
        `;

        // Create a blob with HTML content
        return new Blob([html], { type: 'text/html' });
      },

      // Real-time sync methods
      setupRealtimeSync: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Clean up existing subscription
          if (realtimeChannel) {
            await supabase.removeChannel(realtimeChannel);
          }
          
          // Set up new subscription
          realtimeChannel = supabase
            .channel(`meal-plans:${user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'meal_plans',
                filter: `user_id=eq.${user.id}`
              },
              async (payload) => {
                logger.info('Real-time update received', 'MealPlanningStoreOptimized', { payload });
                
                // Clear cache and reload current week plan if it's affected
                const { currentWeekPlan } = get();
                if (currentWeekPlan && payload.new) {
                  // Clear cache first
                  mealPlanCache.clear(`week-plan-${currentWeekPlan.startDate}`);
                  
                  const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
                  await get().loadWeekPlan(startDate);
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'planned_meals'
              },
              async (payload) => {
                logger.info('Real-time meal update received', 'MealPlanningStoreOptimized', { payload });
                
                // Clear cache and reload if it affects current plan
                const { currentWeekPlan } = get();
                if (currentWeekPlan) {
                  mealPlanCache.clear(`week-plan-${currentWeekPlan.startDate}`);
                  const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
                  await get().loadWeekPlan(startDate);
                }
              }
            )
            .subscribe((status) => {
              set({ realtimeStatus: status });
              logger.info('Real-time subscription status', 'MealPlanningStoreOptimized', { status });
            });
            
        } catch (error) {
          logger.error('Error setting up real-time sync', 'MealPlanningStoreOptimized', error);
        }
      },
      
      cleanupRealtimeSync: async () => {
        if (realtimeChannel) {
          await supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
          set({ realtimeStatus: 'disconnected' });
        }
      },
      
      // Offline support methods
      syncOfflineChanges: async () => {
        const { offlineQueue, isOnline } = get();
        if (!isOnline || offlineQueue.length === 0) return;
        
        set({ isSyncing: true });
        
        try {
          for (const action of offlineQueue) {
            await action();
          }
          
          set({
            offlineQueue: [],
            lastSyncedAt: new Date().toISOString(),
            isSyncing: false
          });
          
          logger.info('Offline changes synced successfully', 'MealPlanningStoreOptimized');
        } catch (error) {
          logger.error('Error syncing offline changes', 'MealPlanningStoreOptimized', error);
          set({ isSyncing: false });
        }
      },
      
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        if (isOnline) {
          get().syncOfflineChanges();
        }
      },
      
      // Batch operations with performance optimization
      batchUpdateSlots: async (updates: Array<{ slotId: string; changes: Partial<MealSlot> }>) => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) return;
        
        try {
          const updatedSlots = currentWeekPlan.slots.map(slot => {
            const update = updates.find(u => u.slotId === slot.id);
            if (update) {
              return { ...slot, ...update.changes, updatedAt: new Date().toISOString() };
            }
            return slot;
          });
          
          const updatedWeekPlan = {
            ...currentWeekPlan,
            slots: updatedSlots,
            updatedAt: new Date().toISOString()
          };
          
          // Immediate UI update
          set(state => {
            state.currentWeekPlan = updatedWeekPlan;
          });

          // Update cache
          mealPlanCache.set(`week-plan-${currentWeekPlan.startDate}`, updatedWeekPlan, {
            ttl: 15 * 60 * 1000,
            priority: 'high'
          });
          
          // Use debounced save for batch updates
          debouncedSave(updatedWeekPlan);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to batch update slots' });
        }
      },
      
      downloadWeekPlan: (format: 'json' | 'csv' | 'pdf') => {
        const { currentWeekPlan } = get();
        if (!currentWeekPlan) {
          throw new Error('No current week plan to download');
        }

        const fileName = `plan-comidas-${currentWeekPlan.startDate}`;
        
        switch (format) {
          case 'json': {
            const jsonData = get().exportWeekPlanAsJSON();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            break;
          }
          case 'csv': {
            const csvData = get().exportWeekPlanAsCSV();
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            break;
          }
          case 'pdf': {
            get().exportWeekPlanAsPDF().then(blob => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${fileName}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            });
            break;
          }
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      }
      }))
    ),
    {
      name: 'meal-planning-store-optimized',
      version: 3 // Increased version for performance optimizations
    }
  )
);

// Subscribe to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    useMealPlanningStoreOptimized.getState().setupRealtimeSync();
  } else if (event === 'SIGNED_OUT') {
    useMealPlanningStoreOptimized.getState().cleanupRealtimeSync();
    // Clear caches on logout
    mealPlanCache.clear();
    recipeCache.clear();
    apiCache.clear();
  }
});

// Handle online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useMealPlanningStoreOptimized.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useMealPlanningStoreOptimized.getState().setOnlineStatus(false);
  });

  // Preload critical data on initial load
  window.addEventListener('load', () => {
    const store = useMealPlanningStoreOptimized.getState();
    const today = new Date();
    const startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    // Preload current week plan
    store.loadWeekPlan(startDate);
    
    // Preload next week plan for smoother navigation
    const nextWeekStart = format(startOfWeek(addDays(today, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    setTimeout(() => {
      store.loadWeekPlan(nextWeekStart);
    }, 1000);
  });
}