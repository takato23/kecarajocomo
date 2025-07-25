import { useState } from 'react';

import type { UserPreferences, PlanningConstraints } from '@/lib/types/mealPlanning';

export interface UseMealPlannerOptions {
  onSuccess?: (plan: any) => void;
  onError?: (error: string) => void;
}

export function useGeminiMealPlanner(options?: UseMealPlannerOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);

  /**
   * Genera un plan semanal completo
   */
  const generateWeeklyPlan = async (
    preferences: Partial<UserPreferences>,
    constraints: Partial<PlanningConstraints>,
    additionalData?: {
      pantryItems?: string[];
      contextData?: {
        season: string;
        weather?: string;
        specialOccasions?: string[];
      };
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meal-planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences,
          constraints,
          pantryItems: additionalData?.pantryItems,
          contextData: additionalData?.contextData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meal plan');
      }

      if (data.success && data.weekPlan) {
        setMealPlan(data.weekPlan);
        options?.onSuccess?.(data.weekPlan);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Genera una receta individual
   */
  const generateSingleRecipe = async (
    mealType: 'breakfast' | 'lunch' | 'dinner',
    options?: {
      servings?: number;
      timeAvailable?: number;
      ingredients?: string[];
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        mealType,
        ...(options?.servings && { servings: options.servings.toString() }),
        ...(options?.timeAvailable && { timeAvailable: options.timeAvailable.toString() }),
        ...(options?.ingredients && { ingredients: options.ingredients.join(',') }),
      });

      const response = await fetch(`/api/meal-planner/generate?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipe');
      }

      return data.recipe;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Regenera una comida específica del plan
   */
  const regenerateMeal = async (
    dayIndex: number,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    preferences?: {
      avoidIngredients?: string[];
      preferredIngredients?: string[];
      maxPrepTime?: number;
    }
  ) => {
    if (!mealPlan) return;

    setIsLoading(true);
    setError(null);

    try {
      const newRecipe = await generateSingleRecipe(mealType, {
        servings: 4, // TODO: Get from user preferences
        timeAvailable: preferences?.maxPrepTime || 30,
        ingredients: preferences?.preferredIngredients
      });

      if (newRecipe) {
        // Actualizar el plan con la nueva receta
        const updatedPlan = { ...mealPlan };
        updatedPlan.days[dayIndex].meals[mealType] = newRecipe;
        setMealPlan(updatedPlan);
        options?.onSuccess?.(updatedPlan);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Optimiza la lista de compras
   */
  const optimizeShoppingList = async (budget?: number) => {
    if (!mealPlan?.shoppingList) return;

    // TODO: Implementar optimización de lista de compras
    // Budget optimization logic would go here
  };

  return {
    // Estado
    isLoading,
    error,
    mealPlan,
    
    // Acciones
    generateWeeklyPlan,
    generateSingleRecipe,
    regenerateMeal,
    optimizeShoppingList,
    
    // Utilidades
    clearError: () => setError(null),
    clearPlan: () => setMealPlan(null),
  };
}