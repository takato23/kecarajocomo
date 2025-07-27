/**
 * Main Zustand store for Argentine meal planning
 * Integrates all slices with persistence and middleware
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createMealPlanSlice, mealPlanPersistConfig } from './slices/mealPlanSlice';
import type { MealPlanSlice } from './slices/mealPlanSlice';
import { logger } from '@/lib/logger';

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

type StoreState = MealPlanSlice;

/**
 * Main Zustand store with all meal planning functionality
 */
export const useMealPlanStore = create<StoreState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get, store) => ({
          ...createMealPlanSlice(set, get, store),
        }))
      ),
      {
        ...mealPlanPersistConfig,
        onRehydrateStorage: () => (state) => {
          if (state) {
            logger.info('Meal plan store rehydrated', 'useMealPlanStore', {
              hasWeeklyPlan: !!state.weeklyPlan,
              mode: state.mode,
              pantryItems: state.pantry.length,
              preferencesSet: !!state.preferences
            });
          }
        },
      }
    ),
    {
      name: 'meal-plan-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// ============================================================================
// STORE SUBSCRIPTIONS
// ============================================================================

// Subscribe to weekly plan changes for analytics
useMealPlanStore.subscribe(
  (state) => state.weeklyPlan,
  (weeklyPlan, prevWeeklyPlan) => {
    if (weeklyPlan && weeklyPlan !== prevWeeklyPlan) {
      logger.debug('Weekly plan updated', 'useMealPlanStore', {
        planId: weeklyPlan.planId,
        weekStart: weeklyPlan.weekStart,
        mode: weeklyPlan.mode,
        region: weeklyPlan.region
      });
    }
  }
);

// Subscribe to errors for logging
useMealPlanStore.subscribe(
  (state) => state.error,
  (error) => {
    if (error) {
      logger.error('Store error occurred', 'useMealPlanStore', { error });
    }
  }
);

// Subscribe to dirty state for auto-save coordination
useMealPlanStore.subscribe(
  (state) => state.isDirty,
  (isDirty, prevIsDirty) => {
    if (isDirty && !prevIsDirty) {
      logger.debug('Store marked as dirty - auto-save will trigger', 'useMealPlanStore');
    } else if (!isDirty && prevIsDirty) {
      logger.debug('Store saved - no longer dirty', 'useMealPlanStore');
    }
  }
);

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

/**
 * Selector for getting current week plan summary
 */
export const selectWeekSummary = (state: StoreState) => {
  if (!state.weeklyPlan) return null;
  
  const totalMeals = state.weeklyPlan.days.flatMap(day => 
    [day.desayuno, day.almuerzo, day.merienda, day.cena].filter(Boolean)
  ).length;
  
  const totalCost = state.weeklyPlan.weeklyCost;
  const avgCostPerMeal = totalMeals > 0 ? totalCost / totalMeals : 0;
  
  const traditionalMeals = state.weeklyPlan.days.flatMap(day =>
    [day.desayuno, day.almuerzo, day.merienda, day.cena]
      .filter(Boolean)
      .filter(meal => meal!.recipe.cultural.isTraditional)
  ).length;
  
  return {
    totalMeals,
    totalCost: Math.round(totalCost),
    avgCostPerMeal: Math.round(avgCostPerMeal),
    traditionalMeals,
    traditionalPercentage: totalMeals > 0 ? Math.round((traditionalMeals / totalMeals) * 100) : 0,
    cultural: state.weeklyPlan.cultural,
    nutritionScore: state.weeklyPlan.cultural.balanceScore
  };
};

/**
 * Selector for getting shopping list summary
 */
export const selectShoppingListSummary = (state: StoreState) => {
  if (!state.weeklyPlan?.shoppingList) return null;
  
  const { items, totalCost } = state.weeklyPlan.shoppingList;
  const completedItems = items.filter(item => item.checked).length;
  const completionPercentage = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;
  
  const categoryTotals = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, cost: 0 };
    }
    acc[item.category].count++;
    acc[item.category].cost += item.estimatedCost;
    return acc;
  }, {} as Record<string, { count: number; cost: number }>);
  
  return {
    totalItems: items.length,
    completedItems,
    completionPercentage,
    totalCost: Math.round(totalCost),
    categoryTotals,
    isCompleted: state.weeklyPlan.shoppingList.isCompleted
  };
};

/**
 * Selector for getting current day plan
 */
export const selectCurrentDayPlan = (state: StoreState) => {
  if (!state.weeklyPlan) return null;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return state.weeklyPlan.days.find(day => day.date === todayStr) || null;
};

/**
 * Selector for getting next meal recommendation
 */
export const selectNextMeal = (state: StoreState) => {
  const currentDay = selectCurrentDayPlan(state);
  if (!currentDay) return null;
  
  const currentHour = new Date().getHours();
  
  if (currentHour >= 7 && currentHour < 11) {
    return { type: 'desayuno', meal: currentDay.desayuno };
  } else if (currentHour >= 12 && currentHour < 15) {
    return { type: 'almuerzo', meal: currentDay.almuerzo };
  } else if (currentHour >= 16 && currentHour < 19) {
    return { type: 'merienda', meal: currentDay.merienda };
  } else if (currentHour >= 20 && currentHour < 23) {
    return { type: 'cena', meal: currentDay.cena };
  }
  
  return null;
};

/**
 * Selector for getting budget status
 */
export const selectBudgetStatus = (state: StoreState) => {
  if (!state.weeklyPlan || !state.preferences.budget.weekly) return null;
  
  const weeklyBudget = state.preferences.budget.weekly;
  const actualCost = state.weeklyPlan.weeklyCost;
  const remainingBudget = weeklyBudget - actualCost;
  const budgetUsedPercentage = Math.round((actualCost / weeklyBudget) * 100);
  
  let status: 'under' | 'on_track' | 'over' | 'critical' = 'on_track';
  if (budgetUsedPercentage <= 80) status = 'under';
  else if (budgetUsedPercentage <= 100) status = 'on_track';
  else if (budgetUsedPercentage <= 120) status = 'over';
  else status = 'critical';
  
  return {
    weeklyBudget,
    actualCost: Math.round(actualCost),
    remainingBudget: Math.round(remainingBudget),
    budgetUsedPercentage,
    status,
    dailyAverage: Math.round(actualCost / 7),
    dailyBudget: Math.round(weeklyBudget / 7)
  };
};

// ============================================================================
// STORE ACTIONS HELPERS
// ============================================================================

/**
 * Helper to get store state
 */
export const getStoreState = () => useMealPlanStore.getState();

/**
 * Helper to check if store has been initialized
 */
export const isStoreInitialized = () => {
  const state = getStoreState();
  return !!(state.preferences && state.pantry.length > 0);
};

/**
 * Helper to reset store to initial state
 */
export const resetStore = () => {
  const state = getStoreState();
  state.resetState();
  logger.info('Store reset to initial state', 'useMealPlanStore');
};

/**
 * Helper to get store metrics
 */
export const getStoreMetrics = () => {
  const state = getStoreState();
  
  return {
    hasWeeklyPlan: !!state.weeklyPlan,
    pantryItems: state.pantry.length,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isDirty: state.isDirty,
    hasError: !!state.error,
    mode: state.mode,
    weekKey: state.weekKey,
    lastSyncedAt: state.lastSyncedAt
  };
};

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  // Add store to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).mealPlanStore = {
      getState: getStoreState,
      reset: resetStore,
      metrics: getStoreMetrics,
      selectors: {
        weekSummary: () => selectWeekSummary(getStoreState()),
        shoppingList: () => selectShoppingListSummary(getStoreState()),
        currentDay: () => selectCurrentDayPlan(getStoreState()),
        nextMeal: () => selectNextMeal(getStoreState()),
        budget: () => selectBudgetStatus(getStoreState())
      }
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useMealPlanStore;