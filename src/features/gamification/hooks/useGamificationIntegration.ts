import { useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';

import { useAppStore } from '@/store';
import { useXPSystem } from '../store/gamificationStore';
import { XPEventType } from '../types';
import { progressTrackingService } from '../services/progressTrackingService';

interface GamificationIntegrationHook {
  // Core tracking functions
  trackRecipeCreated: (recipeId: string, recipeName: string, difficulty?: string) => Promise<void>;
  trackRecipeCooked: (recipeId: string, recipeName: string, cookingTime?: number, estimatedTime?: number) => Promise<void>;
  trackMealPlanned: (mealType: string, recipeId?: string) => Promise<void>;
  trackMealCompleted: (mealType: string, recipeId?: string) => Promise<void>;
  trackPantryUpdated: (itemsAdded: number, itemsRemoved: number) => Promise<void>;
  trackShoppingCompleted: (itemCount: number) => Promise<void>;
  trackNutritionGoalMet: (goalType: string, value: number) => Promise<void>;
  trackRecipeShared: (recipeId: string, recipeName: string, platform?: string) => Promise<void>;
  trackRecipeRated: (recipeId: string, rating: number) => Promise<void>;
  trackDailyLogin: () => Promise<void>;
  
  // Streak tracking
  trackCookingStreak: () => Promise<void>;
  trackMealPlanningStreak: () => Promise<void>;
  trackNutritionStreak: () => Promise<void>;
  trackPantryManagementStreak: () => Promise<void>;
  
  // Batch tracking for multiple events
  trackBatchEvents: (events: Array<{ type: XPEventType; metadata: Record<string, any> }>) => Promise<void>;
}

export function useGamificationIntegration(): GamificationIntegrationHook {
  const user = useAppStore((state) => state.user.profile);
  const { awardXP } = useXPSystem();

  // Helper function to track events
  const trackEvent = useCallback(async (eventType: XPEventType, metadata: Record<string, any> = {}) => {
    if (!user?.id) return;

    try {
      // Award XP through the store
      await awardXP(eventType, metadata);
      
      // Track progress
      await progressTrackingService.trackEvent(user.id, eventType, metadata);
    } catch (error: unknown) {
      logger.error('Failed to track gamification event:', 'useGamificationIntegration', error);
    }
  }, [user?.id, awardXP]);

  // Recipe tracking
  const trackRecipeCreated = useCallback(async (recipeId: string, recipeName: string, difficulty?: string) => {
    await trackEvent(XPEventType.RECIPE_CREATED, {
      recipeId,
      recipeName,
      difficulty,
      firstTime: true // Can be determined by checking if user has created recipes before
    });
  }, [trackEvent]);

  const trackRecipeCooked = useCallback(async (
    recipeId: string, 
    recipeName: string, 
    cookingTime?: number, 
    estimatedTime?: number
  ) => {
    await trackEvent(XPEventType.RECIPE_COOKED, {
      recipeId,
      recipeName,
      cookingTime,
      estimatedTime,
      efficient: cookingTime && estimatedTime ? cookingTime < estimatedTime : false
    });
  }, [trackEvent]);

  // Meal planning tracking
  const trackMealPlanned = useCallback(async (mealType: string, recipeId?: string) => {
    await trackEvent(XPEventType.MEAL_PLANNED, {
      mealType,
      recipeId,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackMealCompleted = useCallback(async (mealType: string, recipeId?: string) => {
    await trackEvent(XPEventType.MEAL_COMPLETED, {
      mealType,
      recipeId,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Pantry tracking
  const trackPantryUpdated = useCallback(async (itemsAdded: number, itemsRemoved: number) => {
    await trackEvent(XPEventType.PANTRY_UPDATED, {
      itemsAdded,
      itemsRemoved,
      totalItems: itemsAdded + itemsRemoved,
      action: itemsAdded > 0 ? 'added' : 'removed'
    });
  }, [trackEvent]);

  // Shopping tracking
  const trackShoppingCompleted = useCallback(async (itemCount: number) => {
    await trackEvent(XPEventType.SHOPPING_COMPLETED, {
      itemCount,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Nutrition tracking
  const trackNutritionGoalMet = useCallback(async (goalType: string, value: number) => {
    await trackEvent(XPEventType.NUTRITION_GOAL_MET, {
      goalType,
      value,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Social tracking
  const trackRecipeShared = useCallback(async (recipeId: string, recipeName: string, platform?: string) => {
    await trackEvent(XPEventType.RECIPE_SHARED, {
      recipeId,
      recipeName,
      platform,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackRecipeRated = useCallback(async (recipeId: string, rating: number) => {
    await trackEvent(XPEventType.RECIPE_RATED, {
      recipeId,
      rating,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Daily login tracking
  const trackDailyLogin = useCallback(async () => {
    await trackEvent(XPEventType.DAILY_LOGIN, {
      timestamp: new Date().toISOString(),
      loginDate: new Date().toDateString()
    });
  }, [trackEvent]);

  // Streak tracking
  const trackCookingStreak = useCallback(async () => {
    await trackEvent(XPEventType.STREAK_CONTINUED, {
      streakType: 'cooking',
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackMealPlanningStreak = useCallback(async () => {
    await trackEvent(XPEventType.STREAK_CONTINUED, {
      streakType: 'meal_planning',
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackNutritionStreak = useCallback(async () => {
    await trackEvent(XPEventType.STREAK_CONTINUED, {
      streakType: 'nutrition_goals',
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackPantryManagementStreak = useCallback(async () => {
    await trackEvent(XPEventType.STREAK_CONTINUED, {
      streakType: 'pantry_management',
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Batch tracking for multiple events
  const trackBatchEvents = useCallback(async (events: Array<{ type: XPEventType; metadata: Record<string, any> }>) => {
    for (const event of events) {
      await trackEvent(event.type, event.metadata);
    }
  }, [trackEvent]);

  // Track daily login on user session start
  useEffect(() => {
    if (user?.id) {
      // Check if user has already logged in today
      const today = new Date().toDateString();
      const lastLogin = localStorage.getItem(`last_login_${user.id}`);
      
      if (lastLogin !== today) {
        trackDailyLogin();
        localStorage.setItem(`last_login_${user.id}`, today);
      }
    }
  }, [user?.id, trackDailyLogin]);

  return {
    trackRecipeCreated,
    trackRecipeCooked,
    trackMealPlanned,
    trackMealCompleted,
    trackPantryUpdated,
    trackShoppingCompleted,
    trackNutritionGoalMet,
    trackRecipeShared,
    trackRecipeRated,
    trackDailyLogin,
    trackCookingStreak,
    trackMealPlanningStreak,
    trackNutritionStreak,
    trackPantryManagementStreak,
    trackBatchEvents
  };
}

// Helper hook for specific feature integration
export function useRecipeGamification() {
  const { trackRecipeCreated, trackRecipeCooked, trackRecipeShared, trackRecipeRated } = useGamificationIntegration();

  return {
    onRecipeCreated: trackRecipeCreated,
    onRecipeCooked: trackRecipeCooked,
    onRecipeShared: trackRecipeShared,
    onRecipeRated: trackRecipeRated
  };
}

export function useMealPlanningGamification() {
  const { trackMealPlanned, trackMealCompleted, trackMealPlanningStreak } = useGamificationIntegration();

  return {
    onMealPlanned: trackMealPlanned,
    onMealCompleted: trackMealCompleted,
    onStreakContinued: trackMealPlanningStreak
  };
}

export function usePantryGamification() {
  const { trackPantryUpdated, trackPantryManagementStreak } = useGamificationIntegration();

  return {
    onPantryUpdated: trackPantryUpdated,
    onStreakContinued: trackPantryManagementStreak
  };
}

export function useNutritionGamification() {
  const { trackNutritionGoalMet, trackNutritionStreak } = useGamificationIntegration();

  return {
    onNutritionGoalMet: trackNutritionGoalMet,
    onStreakContinued: trackNutritionStreak
  };
}

export function useShoppingGamification() {
  const { trackShoppingCompleted } = useGamificationIntegration();

  return {
    onShoppingCompleted: trackShoppingCompleted
  };
}