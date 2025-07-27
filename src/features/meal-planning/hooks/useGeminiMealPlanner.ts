'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { fetchJsonWithErrorHandling } from '@/lib/error/ApiErrorHandler';
import { useErrorReporting } from '@/components/error/FeatureErrorBoundary';
import { 
  UserPreferences, 
  PlanningConstraints, 
  WeeklyPlan,
  MealPlanningResult
} from '@/lib/types/mealPlanning';
import { 
  GeminiPlannerOptions, 
  GeminiPlanResult 
} from '@/lib/services/geminiPlannerService';

import { useMealPlanningStore } from '../store/useMealPlanningStore';

interface UseGeminiMealPlannerResult {
  // State
  isGenerating: boolean;
  error: string | null;
  lastGeneratedPlan: WeeklyPlan | null;
  confidence: number;
  
  // Actions
  generateWeeklyPlan: (
    preferences?: Partial<UserPreferences>,
    constraints?: Partial<PlanningConstraints>,
    options?: Partial<GeminiPlannerOptions>
  ) => Promise<MealPlanningResult<WeeklyPlan>>;
  
  optimizeDailyPlan: (
    date: Date,
    preferences?: Partial<UserPreferences>
  ) => Promise<MealPlanningResult<WeeklyPlan>>;
  
  regenerateWithFeedback: (
    feedback: string,
    currentPlan: WeeklyPlan
  ) => Promise<MealPlanningResult<WeeklyPlan>>;
  
  applyGeneratedPlan: (plan: WeeklyPlan) => Promise<void>;
  
  generateSingleMeal: (
    dayOfWeek: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'desayuno' | 'almuerzo' | 'cena',
    preferences?: Partial<UserPreferences>
  ) => Promise<MealPlanningResult<any>>;
  
  clearError: () => void;
}

export function useGeminiMealPlanner(): UseGeminiMealPlannerResult {
  const { user } = useAuth();
  const { reportError } = useErrorReporting('MealPlanner');
  const { 
    userPreferences, 
    currentWeekPlan, 
    loadWeekPlan,
    saveWeekPlan,
    currentDate 
  } = useMealPlanningStore();

  // Helper function to get request options with credentials
  const getRequestOptions = (body: any): RequestInit => {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This ensures cookies are sent
      body: JSON.stringify(body)
    };
  };
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedPlan, setLastGeneratedPlan] = useState<WeeklyPlan | null>(null);
  const [confidence, setConfidence] = useState(0);

  const generateWeeklyPlan = useCallback(async (
    customPreferences?: Partial<UserPreferences>,
    customConstraints?: Partial<PlanningConstraints>,
    options: Partial<GeminiPlannerOptions> = {}
  ): Promise<MealPlanningResult<WeeklyPlan>> => {
    if (!user) {
      toast.error('Inicia sesión para generar planes de comida', {
        description: 'Necesitas estar autenticado para usar esta función'
      });
      return {
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Merge preferences
      const finalPreferences: UserPreferences = {
        ...userPreferences,
        ...customPreferences,
        userId: user.id
      };

      // Create constraints based on current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const finalConstraints: PlanningConstraints = {
        startDate: startOfWeek,
        endDate: endOfWeek,
        mealTypes: ['breakfast', 'lunch', 'dinner'],
        servings: finalPreferences.householdSize || 2,
        maxPrepTime: 60,
        ...customConstraints
      };

      // Call the API with credentials and error handling
      const requestBody = {
        preferences: finalPreferences,
        constraints: finalConstraints,
        options: {
          useHolisticAnalysis: true,
          includeExternalFactors: true,
          optimizeResources: true,
          enableLearning: true,
          analysisDepth: 'comprehensive',
          ...options
        }
      };
      
      const response = await fetchJsonWithErrorHandling<any>('/api/meal-planning/generate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        context: {
          feature: 'meal-planning',
          action: 'generate-weekly-plan',
          userId: user.id,
          preferences: finalPreferences,
        },
        customRetry: {
          maxAttempts: 2, // Reduced for AI calls
          baseDelay: 2000, // Longer delay for AI processing
        }
      });

      const result: GeminiPlanResult = response;

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to generate meal plan');
      }

      setLastGeneratedPlan(result.plan);
      setConfidence(result.metadata.confidenceScore);

      toast.success('Plan de comidas generado exitosamente', {
        description: `Confianza: ${Math.round(result.metadata.confidenceScore * 100)}%`
      });

      return {
        success: true,
        data: result.plan
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      toast.error('Error al generar el plan', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'GENERATION_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, userPreferences, currentDate]);

  const optimizeDailyPlan = useCallback(async (
    date: Date,
    customPreferences?: Partial<UserPreferences>
  ): Promise<MealPlanningResult<WeeklyPlan>> => {
    if (!user || !currentWeekPlan) {
      return {
        success: false,
        error: 'No hay plan de semana actual para optimizar',
        code: 'NO_CURRENT_PLAN'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      const finalPreferences: UserPreferences = {
        ...userPreferences,
        ...customPreferences,
        userId: user.id
      };

      const requestBody = {
        preferences: finalPreferences,
        currentPlan: currentWeekPlan,
        focusDay: date.toISOString()
      };
      const response = await fetch('/api/meal-planning/optimize-daily', getRequestOptions(requestBody));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: GeminiPlanResult = await response.json();

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to optimize daily plan');
      }

      setLastGeneratedPlan(result.plan);
      setConfidence(result.metadata.confidenceScore);

      toast.success('Plan diario optimizado', {
        description: `Mejoras aplicadas para ${date.toLocaleDateString('es-ES')}`
      });

      return {
        success: true,
        data: result.plan
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      toast.error('Error al optimizar el plan diario', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'OPTIMIZATION_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, userPreferences, currentWeekPlan]);

  const regenerateWithFeedback = useCallback(async (
    feedback: string,
    currentPlan: WeeklyPlan
  ): Promise<MealPlanningResult<WeeklyPlan>> => {
    if (!user) {
      return {
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = {
        feedback,
        currentPlan,
        userId: user.id
      };
      const response = await fetch('/api/meal-planning/regenerate', getRequestOptions(requestBody));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: GeminiPlanResult = await response.json();

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to regenerate plan');
      }

      setLastGeneratedPlan(result.plan);
      setConfidence(result.metadata.confidenceScore);

      toast.success('Plan regenerado con éxito', {
        description: 'Se aplicaron tus sugerencias al nuevo plan'
      });

      return {
        success: true,
        data: result.plan
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      toast.error('Error al regenerar el plan', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'REGENERATION_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const applyGeneratedPlan = useCallback(async (plan: WeeklyPlan) => {
    if (!plan || !plan.meals || plan.meals.length === 0) {
      toast.error('Plan inválido', {
        description: 'El plan no contiene comidas válidas'
      });
      return;
    }

    try {
      // Convert the WeeklyPlan format to the store's WeekPlan format
      const weekStartDate = plan.weekStartDate;
      const weekStartDateStr = weekStartDate instanceof Date 
        ? weekStartDate.toISOString().split('T')[0]
        : weekStartDate;

      // Load the week plan for the target date
      await loadWeekPlan(weekStartDateStr);

      // Apply meals to slots
      if (currentWeekPlan) {
        const updatedSlots = currentWeekPlan.slots.map(slot => {
          // Find matching meal from the generated plan
          const dayMeal = plan.meals.find(m => {
            const mealDate = new Date(m.date);
            const slotDate = new Date(slot.date);
            return mealDate.toDateString() === slotDate.toDateString();
          });

          if (!dayMeal) return slot;

          // Map meal types
          let meal = null;
          if (slot.mealType === 'desayuno' && dayMeal.breakfast) {
            meal = dayMeal.breakfast;
          } else if (slot.mealType === 'almuerzo' && dayMeal.lunch) {
            meal = dayMeal.lunch;
          } else if (slot.mealType === 'cena' && dayMeal.dinner) {
            meal = dayMeal.dinner;
          }

          if (!meal || !meal.recipe) return slot;

          return {
            ...slot,
            recipeId: meal.recipe.id,
            recipe: {
              id: meal.recipe.id,
              name: meal.recipe.title,
              description: meal.recipe.description || '',
              prepTime: meal.recipe.prepTimeMinutes,
              cookTime: meal.recipe.cookTimeMinutes,
              servings: meal.recipe.servings,
              difficulty: meal.recipe.difficulty,
              ingredients: meal.recipe.ingredients.map(ing => ({
                id: Math.random().toString(),
                name: ing.name,
                amount: ing.quantity,
                unit: ing.unit,
                category: ing.category || 'other'
              })),
              instructions: meal.recipe.instructions || [],
              nutrition: meal.recipe.nutrition,
              dietaryLabels: meal.recipe.dietaryRestrictions || [],
              tags: meal.recipe.tags || [],
              cuisine: meal.recipe.cuisine || 'Internacional',
              rating: meal.confidence || 0,
              isAiGenerated: true,
              isFavorite: false,
              image: meal.recipe.imageUrl
            },
            updatedAt: new Date().toISOString()
          };
        });

        const updatedWeekPlan = {
          ...currentWeekPlan,
          slots: updatedSlots,
          updatedAt: new Date().toISOString()
        };

        await saveWeekPlan(updatedWeekPlan);

        toast.success('Plan aplicado exitosamente', {
          description: 'Las comidas se han agregado a tu calendario'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al aplicar el plan', {
        description: errorMessage
      });
    }
  }, [currentWeekPlan, loadWeekPlan, saveWeekPlan]);

  const generateSingleMeal = useCallback(async (
    dayOfWeek: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'desayuno' | 'almuerzo' | 'cena',
    customPreferences?: Partial<UserPreferences>
  ): Promise<MealPlanningResult<any>> => {
    if (!user) {
      return {
        success: false,
        error: 'Usuario no autenticado',
        code: 'UNAUTHENTICATED'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Map Spanish meal types to English
      const mealTypeMap = {
        'desayuno': 'breakfast',
        'almuerzo': 'lunch', 
        'cena': 'dinner',
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner'
      };

      const englishMealType = mealTypeMap[mealType] || mealType;
      
      // For now, we'll generate a full weekly plan and extract just the requested meal
      // In the future, this could be optimized to generate just a single meal
      const preferences: UserPreferences = {
        ...userPreferences,
        ...customPreferences,
        userId: user.id
      };

      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - currentDate.getDay() + dayOfWeek);
      
      const constraints: PlanningConstraints = {
        startDate: targetDate,
        endDate: targetDate,
        mealTypes: [englishMealType as any],
        servings: preferences.householdSize || 2,
        maxPrepTime: 60
      };

      const result = await generateWeeklyPlan(preferences, constraints);
      
      if (result.success && result.data) {
        // Extract the specific meal from the generated plan
        const dailyMeal = result.data.meals.find(m => {
          const mealDate = new Date(m.date);
          return mealDate.toDateString() === targetDate.toDateString();
        });
        
        if (dailyMeal) {
          const meal = dailyMeal[englishMealType as keyof typeof dailyMeal];
          if (meal) {
            toast.success('Comida generada con IA', {
              description: `${meal.recipe?.title} agregada a tu ${mealType}`
            });
            
            return {
              success: true,
              data: meal
            };
          }
        }
      }

      throw new Error('No se pudo generar la comida específica');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      toast.error('Error al generar la comida', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'SINGLE_MEAL_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, userPreferences, currentDate, generateWeeklyPlan]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    lastGeneratedPlan,
    confidence,
    generateWeeklyPlan,
    optimizeDailyPlan,
    regenerateWithFeedback,
    applyGeneratedPlan,
    generateSingleMeal,
    clearError
  };
}