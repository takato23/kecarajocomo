import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Recipe, 
  MealPlan, 
  PlannedMeal, 
  WeeklyPlan, 
  UserPreferences,
  AIGenerationParams,
  AIGenerationResult,
  MealType,
  ShoppingListItem
} from '../types';

interface MealPlannerState {
  // State
  recipes: Recipe[];
  currentWeekPlan: WeeklyPlan | null;
  savedMealPlans: MealPlan[];
  userPreferences: UserPreferences | null;
  isGenerating: boolean;
  generationProgress: number;
  selectedDate: Date;
  
  // Recipe Management
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  
  // Meal Planning
  addMealToPlan: (date: Date, meal: PlannedMeal) => void;
  removeMealFromPlan: (date: Date, mealId: string) => void;
  updatePlannedMeal: (date: Date, mealId: string, updates: Partial<PlannedMeal>) => void;
  
  // Weekly Planning
  generateWeeklyPlan: (params: AIGenerationParams) => Promise<WeeklyPlan>;
  saveWeeklyPlan: (plan: WeeklyPlan) => void;
  loadWeeklyPlan: (planId: string) => void;
  
  // AI Generation
  generateRecipe: (params: AIGenerationParams) => Promise<AIGenerationResult>;
  regenerateMeal: (date: Date, mealType: MealType, params?: AIGenerationParams) => Promise<void>;
  
  // Shopping List
  generateShoppingList: (startDate: Date, endDate: Date) => ShoppingListItem[];
  markIngredientPurchased: (ingredientId: string, purchased: boolean) => void;
  
  // User Preferences
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // UI State
  setSelectedDate: (date: Date) => void;
  setGenerationProgress: (progress: number) => void;
}

const initialState = {
  recipes: [],
  currentWeekPlan: null,
  savedMealPlans: [],
  userPreferences: null,
  isGenerating: false,
  generationProgress: 0,
  selectedDate: new Date(),
};

export const useMealPlannerStore = create<MealPlannerState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Recipe Management
        addRecipe: (recipe) => 
          set((state) => ({ 
            recipes: [...state.recipes, recipe] 
          })),

        updateRecipe: (id, updates) =>
          set((state) => ({
            recipes: state.recipes.map((r) => 
              r.id === id ? { ...r, ...updates } : r
            ),
          })),

        deleteRecipe: (id) =>
          set((state) => ({
            recipes: state.recipes.filter((r) => r.id !== id),
          })),

        // Meal Planning
        addMealToPlan: (date, meal) =>
          set((state) => {
            const dateStr = date.toISOString().split('T')[0];
            const weekPlan = state.currentWeekPlan;
            
            if (!weekPlan) return state;

            const updatedDailyPlans = weekPlan.dailyPlans.map((plan) => {
              const planDate = new Date(plan.date).toISOString().split('T')[0];
              if (planDate === dateStr) {
                return {
                  ...plan,
                  meals: [...plan.meals, meal],
                };
              }
              return plan;
            });

            return {
              currentWeekPlan: {
                ...weekPlan,
                dailyPlans: updatedDailyPlans,
              },
            };
          }),

        removeMealFromPlan: (date, mealId) =>
          set((state) => {
            const dateStr = date.toISOString().split('T')[0];
            const weekPlan = state.currentWeekPlan;
            
            if (!weekPlan) return state;

            const updatedDailyPlans = weekPlan.dailyPlans.map((plan) => {
              const planDate = new Date(plan.date).toISOString().split('T')[0];
              if (planDate === dateStr) {
                return {
                  ...plan,
                  meals: plan.meals.filter((m) => m.id !== mealId),
                };
              }
              return plan;
            });

            return {
              currentWeekPlan: {
                ...weekPlan,
                dailyPlans: updatedDailyPlans,
              },
            };
          }),

        updatePlannedMeal: (date, mealId, updates) =>
          set((state) => {
            const dateStr = date.toISOString().split('T')[0];
            const weekPlan = state.currentWeekPlan;
            
            if (!weekPlan) return state;

            const updatedDailyPlans = weekPlan.dailyPlans.map((plan) => {
              const planDate = new Date(plan.date).toISOString().split('T')[0];
              if (planDate === dateStr) {
                return {
                  ...plan,
                  meals: plan.meals.map((m) =>
                    m.id === mealId ? { ...m, ...updates } : m
                  ),
                };
              }
              return plan;
            });

            return {
              currentWeekPlan: {
                ...weekPlan,
                dailyPlans: updatedDailyPlans,
              },
            };
          }),

        // Weekly Planning
        generateWeeklyPlan: async (params) => {
          set({ isGenerating: true, generationProgress: 0 });
          
          try {
            // Import the AI service dynamically to avoid circular dependencies
            const { aiMealPlannerService } = await import('../services/aiMealPlannerService');
            
            set({ generationProgress: 20 });
            
            const weekStart = new Date();
            const weekPlan = await aiMealPlannerService.generateWeeklyMealPlan(
              params,
              weekStart
            );
            
            set({ generationProgress: 80 });
            
            // Add generated recipes to the store
            weekPlan.dailyPlans.forEach((plan) => {
              plan.meals.forEach((meal) => {
                if (meal.recipe) {
                  get().addRecipe(meal.recipe);
                }
              });
            });

            set({ 
              currentWeekPlan: weekPlan, 
              isGenerating: false,
              generationProgress: 100
            });

            return weekPlan;
          } catch (error) {
            set({ isGenerating: false, generationProgress: 0 });
            throw error;
          }
        },

        saveWeeklyPlan: (plan) =>
          set((state) => ({
            savedMealPlans: [...state.savedMealPlans, ...plan.dailyPlans],
          })),

        loadWeeklyPlan: (planId) => {
          // Implementation to load a saved plan
        },

        // AI Generation
        generateRecipe: async (params) => {
          set({ isGenerating: true });
          
          try {
            // Import the AI service dynamically to avoid circular dependencies
            const { aiMealPlannerService } = await import('../services/aiMealPlannerService');
            
            const result = await aiMealPlannerService.generateRecipe(params);
            
            // Add the generated recipe to the store
            get().addRecipe(result.recipe);

            set({ isGenerating: false });
            return result;
          } catch (error) {
            set({ isGenerating: false });
            throw error;
          }
        },

        regenerateMeal: async (date, mealType, params) => {
          const { generateRecipe, addMealToPlan } = get();
          
          const result = await generateRecipe(params || {
            preferences: get().userPreferences || {
              dietaryRestrictions: [],
              allergies: [],
              dislikedIngredients: [],
              preferredCuisines: [],
              cookingSkillLevel: 'intermediate',
              servingSize: 2,
            },
            mealType,
          });

          const plannedMeal: PlannedMeal = {
            id: `meal-${Date.now()}`,
            recipeId: result.recipe.id,
            recipe: result.recipe,
            mealType,
            servings: result.recipe.servings || 2,
          };

          addMealToPlan(date, plannedMeal);
        },

        // Shopping List
        generateShoppingList: (startDate, endDate) => {
          const { currentWeekPlan } = get();
          if (!currentWeekPlan) return [];

          const ingredientMap = new Map<string, ShoppingListItem>();

          currentWeekPlan.dailyPlans.forEach((plan) => {
            const planDate = new Date(plan.date);
            if (planDate >= startDate && planDate <= endDate) {
              plan.meals.forEach((meal) => {
                if (meal.recipe) {
                  meal.recipe.ingredients.forEach((ingredient) => {
                    const key = ingredient.id;
                    const existing = ingredientMap.get(key);

                    if (existing) {
                      existing.totalAmount += ingredient.amount * meal.servings;
                      existing.recipes.push(meal.recipe!.name);
                    } else {
                      ingredientMap.set(key, {
                        ingredientId: ingredient.id,
                        ingredient,
                        totalAmount: ingredient.amount * meal.servings,
                        unit: ingredient.unit,
                        recipes: [meal.recipe!.name],
                        purchased: false,
                      });
                    }
                  });
                }
              });
            }
          });

          return Array.from(ingredientMap.values());
        },

        markIngredientPurchased: (ingredientId, purchased) => {
          // Implementation for marking ingredients as purchased
        },

        // User Preferences
        updateUserPreferences: (preferences) =>
          set((state) => ({
            userPreferences: state.userPreferences
              ? { ...state.userPreferences, ...preferences }
              : preferences as UserPreferences,
          })),

        // UI State
        setSelectedDate: (date) => set({ selectedDate: date }),
        setGenerationProgress: (progress) => set({ generationProgress: progress }),
      }),
      {
        name: 'meal-planner-storage',
        partialize: (state) => ({
          recipes: state.recipes,
          currentWeekPlan: state.currentWeekPlan,
          savedMealPlans: state.savedMealPlans,
          userPreferences: state.userPreferences,
        }),
      }
    )
  )
);