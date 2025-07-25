import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { startOfWeek, endOfWeek, format, isToday, getDay, addDays } from 'date-fns';

import { 
  PlannedMealV2, 
  PlanningV2Store, 
  MealType,
  DayPlanV2
} from '../types';
import { planningV2Service } from '../services/planningV2Service';
import { aiPlannerLogic } from '../logic/aiPlannerLogic';
import { intelligentShoppingParser } from '../logic/intelligentShoppingParser';

// =============================================
// HELPER FUNCTIONS
// =============================================

const getMealTypesOrder = (): MealType[] => ['desayuno', 'almuerzo', 'merienda', 'cena'];

const createEmptyDayPlan = (date: Date): DayPlanV2 => ({
  date: format(date, 'yyyy-MM-dd'),
  dayOfWeek: getDay(date),
  meals: {},
  isToday: isToday(date)
});

const groupMealsByDate = (meals: PlannedMealV2[]): Record<string, Record<MealType, PlannedMealV2>> => {
  return meals.reduce((acc, meal) => {
    if (!acc[meal.planDate]) {
      acc[meal.planDate] = {} as Record<MealType, PlannedMealV2>;
    }
    acc[meal.planDate][meal.mealType] = meal;
    return acc;
  }, {} as Record<string, Record<MealType, PlannedMealV2>>);
};

const calculateNutritionSummary = (meals: PlannedMealV2[]) => {
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  meals.forEach(meal => {
    if (meal.recipe?.nutrition) {
      nutrition.calories += meal.recipe.nutrition.calories || 0;
      nutrition.protein += meal.recipe.nutrition.protein || 0;
      nutrition.carbs += meal.recipe.nutrition.carbs || 0;
      nutrition.fat += meal.recipe.nutrition.fat || 0;
      nutrition.fiber += meal.recipe.nutrition.fiber || 0;
      nutrition.sugar += meal.recipe.nutrition.sugar || 0;
      nutrition.sodium += meal.recipe.nutrition.sodium || 0;
    }
  });

  return nutrition;
};

// =============================================
// ZUSTAND STORE
// =============================================

export const usePlanningV2Store = create<PlanningV2Store>()(
  devtools(
    persist(
      immer((set, get) => ({
        // =============================================
        // STATE
        // =============================================
        plannedMeals: [],
        currentDate: new Date(),
        selectedWeek: null,
        isLoading: false,
        error: null,
        
        // UI State
        activeModal: null,
        selectedMeal: null,
        draggedMeal: null,

        // =============================================
        // ACTIONS - CRUD
        // =============================================
        
        fetchWeekMeals: async (startDate: string, endDate: string) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const userId = 'current-user-id'; // TODO: Get from auth context
            const response = await planningV2Service.getMealsForWeek(userId, startDate, endDate);
            
            if (response.success && response.data) {
              set(state => {
                state.plannedMeals = response.data!;
                state.isLoading = false;
                
                // Build week summary
                const weekStart = new Date(startDate);
                const weekEnd = new Date(endDate);
                const days: DayPlanV2[] = [];
                
                // Create all days in the week
                for (let i = 0; i < 7; i++) {
                  const currentDay = addDays(weekStart, i);
                  const dayPlan = createEmptyDayPlan(currentDay);
                  days.push(dayPlan);
                }
                
                // Group meals by date
                const mealsByDate = groupMealsByDate(response.data!);
                
                // Assign meals to days
                days.forEach(day => {
                  const dayMeals = mealsByDate[day.date];
                  if (dayMeals) {
                    day.meals = dayMeals;
                    day.nutritionSummary = calculateNutritionSummary(Object.values(dayMeals));
                  }
                });
                
                // Calculate week summary
                const totalMeals = response.data!.length;
                const completedMeals = response.data!.filter(m => m.isCompleted).length;
                
                state.selectedWeek = {
                  startDate,
                  endDate,
                  days,
                  totalMeals,
                  completedMeals,
                  nutritionAverage: calculateNutritionSummary(response.data!)
                };
              });
            } else {
              throw new Error(response.error || 'Failed to fetch meals');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        addMeal: async (meal) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const response = await planningV2Service.createMeal(meal);
            
            if (response.success && response.data) {
              set(state => {
                state.plannedMeals.push(response.data!);
                state.isLoading = false;
              });
              
              // Refresh week if the meal is in current week
              const { startDate, endDate } = get().selectedWeek || {};
              if (startDate && endDate) {
                await get().fetchWeekMeals(startDate, endDate);
              }
            } else {
              throw new Error(response.error || 'Failed to add meal');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        updateMeal: async (id, updates) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const response = await planningV2Service.updateMeal(id, updates);
            
            if (response.success && response.data) {
              set(state => {
                const index = state.plannedMeals.findIndex(m => m.id === id);
                if (index !== -1) {
                  state.plannedMeals[index] = { ...state.plannedMeals[index], ...updates };
                }
                state.isLoading = false;
              });
              
              // Refresh week
              const { startDate, endDate } = get().selectedWeek || {};
              if (startDate && endDate) {
                await get().fetchWeekMeals(startDate, endDate);
              }
            } else {
              throw new Error(response.error || 'Failed to update meal');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        deleteMeal: async (id) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const response = await planningV2Service.deleteMeal(id);
            
            if (response.success) {
              set(state => {
                state.plannedMeals = state.plannedMeals.filter(m => m.id !== id);
                state.isLoading = false;
              });
              
              // Refresh week
              const { startDate, endDate } = get().selectedWeek || {};
              if (startDate && endDate) {
                await get().fetchWeekMeals(startDate, endDate);
              }
            } else {
              throw new Error(response.error || 'Failed to delete meal');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        // =============================================
        // ACTIONS - BATCH OPERATIONS
        // =============================================
        
        addMultipleMeals: async (meals) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const response = await planningV2Service.createMultipleMeals(meals);
            
            if (response.success && response.data) {
              set(state => {
                state.plannedMeals.push(...response.data!);
                state.isLoading = false;
              });
              
              // Refresh week
              const { startDate, endDate } = get().selectedWeek || {};
              if (startDate && endDate) {
                await get().fetchWeekMeals(startDate, endDate);
              }
            } else {
              throw new Error(response.error || 'Failed to add meals');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        clearWeek: async (startDate, endDate) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const userId = 'current-user-id'; // TODO: Get from auth context
            const response = await planningV2Service.clearWeek(userId, startDate, endDate);
            
            if (response.success) {
              await get().fetchWeekMeals(startDate, endDate);
            } else {
              throw new Error(response.error || 'Failed to clear week');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        copyWeek: async (sourceStartDate, targetStartDate) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const userId = 'current-user-id'; // TODO: Get from auth context
            const response = await planningV2Service.copyWeek(userId, sourceStartDate, targetStartDate);
            
            if (response.success) {
              const targetEndDate = format(endOfWeek(new Date(targetStartDate)), 'yyyy-MM-dd');
              await get().fetchWeekMeals(targetStartDate, targetEndDate);
            } else {
              throw new Error(response.error || 'Failed to copy week');
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        // =============================================
        // ACTIONS - UI
        // =============================================
        
        setCurrentDate: (date) => {
          set(state => { 
            state.currentDate = date;
          });
          
          // Fetch week for new date
          const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
          const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd');
          get().fetchWeekMeals(weekStart, weekEnd);
        },

        setActiveModal: (modal) => {
          set(state => { state.activeModal = modal; });
        },

        setSelectedMeal: (meal) => {
          set(state => { state.selectedMeal = meal; });
        },

        setDraggedMeal: (meal) => {
          set(state => { state.draggedMeal = meal; });
        },

        // =============================================
        // ACTIONS - AI PLANNING
        // =============================================
        
        generateAIPlan: async (config) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const plan = await aiPlannerLogic.generateMealPlan(config);
            set(state => { state.isLoading = false; });
            return plan;
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
            throw error;
          }
        },

        applyAIPlan: async (plan) => {
          set(state => { state.isLoading = true; state.error = null; });
          
          try {
            const mealsToCreate = plan.meals.map(meal => ({
              userId: meal.userId,
              planDate: meal.planDate,
              mealType: meal.mealType,
              recipeId: meal.recipeId,
              customMealName: meal.customMealName,
              recipe: meal.recipe,
              notes: meal.notes,
              servings: meal.servings,
              isCompleted: false
            }));
            
            await get().addMultipleMeals(mealsToCreate);
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Unknown error';
              state.isLoading = false;
            });
          }
        },

        // =============================================
        // SELECTORS
        // =============================================
        
        getMealsByDate: (date) => {
          return get().plannedMeals.filter(meal => meal.planDate === date);
        },

        getMealBySlot: (date, mealType) => {
          return get().plannedMeals.find(
            meal => meal.planDate === date && meal.mealType === mealType
          );
        },

        getWeekSummary: () => {
          return get().selectedWeek;
        },

        getShoppingList: async (startDate, endDate) => {
          const meals = get().plannedMeals.filter(
            meal => meal.planDate >= startDate && meal.planDate <= endDate
          );
          
          const recipes = meals
            .map(meal => meal.recipe)
            .filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== undefined);
          
          return intelligentShoppingParser.convertRecipesToShoppingList(
            recipes,
            'current-user-id',
            startDate
          );
        }
      })),
      {
        name: 'planning-v2-storage',
        partialize: (state) => ({
          currentDate: state.currentDate
        })
      }
    ),
    {
      name: 'PlanningV2Store'
    }
  )
);