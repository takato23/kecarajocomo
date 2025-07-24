'use client';

/**
 * useMealPlanning Hook
 * Specialized hook for AI-powered meal planning
 */

import { useState, useCallback } from 'react';

import {
  MealPlanRequest,
  GeneratedMealPlan,
  PantryItem,
  UserPreferences,
  PlannedMeal,
  ShoppingRecommendation,
} from '../types';

import { useAIService } from './useAIService';

export interface UseMealPlanningOptions {
  onPlanGenerated?: (plan: GeneratedMealPlan) => void;
  onError?: (error: Error) => void;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'auto';
}

export interface UseMealPlanningReturn {
  isGenerating: boolean;
  error: Error | null;
  currentPlan: GeneratedMealPlan | null;
  
  generateWeeklyPlan: (options: WeeklyPlanOptions) => Promise<GeneratedMealPlan>;
  generateDailyPlan: (date: Date, preferences: UserPreferences) => Promise<PlannedMeal[]>;
  optimizePlan: (plan: GeneratedMealPlan, constraints: OptimizationConstraints) => Promise<GeneratedMealPlan>;
  generateShoppingList: (plan: GeneratedMealPlan, pantryItems: PantryItem[]) => Promise<ShoppingRecommendation[]>;
  suggestMealSwap: (meal: PlannedMeal, preferences: UserPreferences) => Promise<PlannedMeal>;
  reset: () => void;
}

export interface WeeklyPlanOptions {
  startDate?: Date;
  days?: number;
  peopleCount: number;
  preferences: UserPreferences;
  pantryItems: PantryItem[];
  budget?: number;
  includeLeftovers?: boolean;
  avoidRepetition?: boolean;
}

export interface OptimizationConstraints {
  maxBudget?: number;
  targetCalories?: number;
  minimizeCookingTime?: boolean;
  maximizeVariety?: boolean;
  prioritizeExpiring?: boolean;
}

export function useMealPlanning(options: UseMealPlanningOptions = {}): UseMealPlanningReturn {
  const [currentPlan, setCurrentPlan] = useState<GeneratedMealPlan | null>(null);
  
  const aiService = useAIService({
    provider: options.provider,
    onError: options.onError,
    onSuccess: (response) => {
      if ('meals' in response && 'shoppingList' in response) {
        setCurrentPlan(response as GeneratedMealPlan);
        options.onPlanGenerated?.(response as GeneratedMealPlan);
      }
    },
  });

  const generateWeeklyPlan = useCallback(async (planOptions: WeeklyPlanOptions): Promise<GeneratedMealPlan> => {
    const request: MealPlanRequest = {
      days: planOptions.days || 7,
      peopleCount: planOptions.peopleCount,
      preferences: planOptions.preferences,
      pantryItems: planOptions.pantryItems,
      budget: planOptions.budget,
      includeLeftovers: planOptions.includeLeftovers ?? true,
      avoidRepetition: planOptions.avoidRepetition ?? true,
    };

    const plan = await aiService.generateMealPlan(request);
    
    // Set start and end dates
    const startDate = planOptions.startDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (planOptions.days || 7) - 1);
    
    const enrichedPlan = {
      ...plan,
      startDate,
      endDate,
    };
    
    setCurrentPlan(enrichedPlan);
    return enrichedPlan;
  }, [aiService]);

  const generateDailyPlan = useCallback(async (
    date: Date,
    preferences: UserPreferences
  ): Promise<PlannedMeal[]> => {
    const prompt = `Create a meal plan for one day (${date.toDateString()}) including breakfast, lunch, and dinner.

Preferences: ${JSON.stringify(preferences)}

Provide 3 meals with recipe names and basic details in JSON format.`;

    const response = await aiService.generateJSON<PlannedMeal[]>(
      { prompt, format: 'json' },
      undefined
    );

    return response.data.map(meal => ({
      ...meal,
      date,
    }));
  }, [aiService]);

  const optimizePlan = useCallback(async (
    plan: GeneratedMealPlan,
    constraints: OptimizationConstraints
  ): Promise<GeneratedMealPlan> => {
    const prompt = `Optimize this meal plan based on the following constraints:

Current plan: ${JSON.stringify(plan)}

Constraints:
${constraints.maxBudget ? `- Maximum budget: $${constraints.maxBudget}` : ''}
${constraints.targetCalories ? `- Target daily calories: ${constraints.targetCalories}` : ''}
${constraints.minimizeCookingTime ? '- Minimize total cooking time' : ''}
${constraints.maximizeVariety ? '- Maximize cuisine and ingredient variety' : ''}
${constraints.prioritizeExpiring ? '- Prioritize using expiring ingredients' : ''}

Provide an optimized meal plan in the same format.`;

    const response = await aiService.generateJSON<GeneratedMealPlan>(
      { prompt, format: 'json' },
      undefined
    );

    const optimizedPlan = {
      ...response.data,
      id: `${plan.id}-optimized`,
      aiGenerated: true,
    };

    setCurrentPlan(optimizedPlan);
    return optimizedPlan;
  }, [aiService]);

  const generateShoppingList = useCallback(async (
    plan: GeneratedMealPlan,
    pantryItems: PantryItem[]
  ): Promise<ShoppingRecommendation[]> => {
    const recommendations = await aiService.generateShoppingRecommendations(
      pantryItems,
      { mealPlan: plan }
    );

    return recommendations;
  }, [aiService]);

  const suggestMealSwap = useCallback(async (
    meal: PlannedMeal,
    preferences: UserPreferences
  ): Promise<PlannedMeal> => {
    const prompt = `Suggest an alternative meal to replace this one:

Current meal: ${JSON.stringify(meal)}
User preferences: ${JSON.stringify(preferences)}

The alternative should:
- Be different but equally nutritious
- Fit the same meal type (${meal.mealType})
- Respect dietary preferences
- Have similar preparation complexity

Provide the alternative meal in JSON format.`;

    const response = await aiService.generateJSON<PlannedMeal>(
      { prompt, format: 'json' },
      undefined
    );

    return {
      ...response.data,
      date: meal.date,
      mealType: meal.mealType,
    };
  }, [aiService]);

  const reset = useCallback(() => {
    setCurrentPlan(null);
    aiService.reset();
  }, [aiService]);

  return {
    isGenerating: aiService.isLoading,
    error: aiService.error,
    currentPlan,
    
    generateWeeklyPlan,
    generateDailyPlan,
    optimizePlan,
    generateShoppingList,
    suggestMealSwap,
    reset,
  };
}