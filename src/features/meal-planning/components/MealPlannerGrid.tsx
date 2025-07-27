'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logger } from '@/services/logger';
import {
  Calendar,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import { startOfWeek, format } from 'date-fns';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { 
  KeCard, 
  KeCardHeader, 
  KeCardTitle, 
  KeCardContent,
  KeButton 
} from '@/components/ui';
import { useAuth } from '@/components/auth/AuthProvider';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useGeminiMealPlanner } from '../hooks/useGeminiMealPlanner';
import type { MealType } from '../types';

import { MobileGrid } from './MobileGrid';
import { DesktopGrid } from './DesktopGrid';
import { MealPlannerSkeleton } from './MealPlannerSkeleton';
import { MealPlannerError } from './MealPlannerError';
const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

interface MealPlannerGridProps {
  onRecipeSelect?: (slot: { dayOfWeek: number; mealType: MealType }) => void;
  onShoppingList?: () => void;
  onExportWeek?: () => void;
}

// Hook to detect mobile screen
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Adapter function to convert store data to MealCard format
function adaptMealDataForGrid(currentWeekPlan: any, getSlotForDay: any) {
  const weekPlan: any = {};
  
  // Handle null currentWeekPlan
  if (!currentWeekPlan) {
    // Return empty structure
    for (let day = 0; day < 7; day++) {
      weekPlan[day] = {};
      MEAL_TYPES.forEach((mealType) => {
        weekPlan[day][mealType] = null;
      });
    }
    return weekPlan;
  }
  
  for (let day = 0; day < 7; day++) {
    weekPlan[day] = {};
    
    MEAL_TYPES.forEach((mealType) => {
      const slot = getSlotForDay(day, mealType);
      
      if (slot?.recipe) {
        weekPlan[day][mealType] = {
          id: slot.recipeId,
          title: slot.recipe.name || 'Receta sin nombre',
          ingredients: slot.recipe.ingredients || [],
          macros: {
            kcal: slot.recipe.nutrition?.calories || 0,
            protein_g: slot.recipe.nutrition?.protein || 0,
            carbs_g: slot.recipe.nutrition?.carbs || 0,
            fat_g: slot.recipe.nutrition?.fat || 0
          },
          time_minutes: (slot.recipe.prepTime || 0) + (slot.recipe.cookTime || 0),
          cost_estimate_ars: slot.estimatedCost || 0,
          image_url: slot.recipe.image,
          tags: slot.recipe.tags || []
        };
      }
    });
  }
  
  return weekPlan;
}

export default function MealPlannerGrid({
  onRecipeSelect,
  onShoppingList,
  onExportWeek
}: MealPlannerGridProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const {
    currentWeekPlan,
    isLoading,
    error,
    getSlotForDay,
    getWeekSummary,
    setActiveModal,
    updateMealSlot,
    removeMealFromSlot,
    clearWeek,
    loadWeekPlan
  } = useMealPlanningStore();

  const {
    generateWeeklyPlan,
    isGenerating: isGeminiGenerating,
    applyGeneratedPlan,
    confidence,
    generateSingleMeal
  } = useGeminiMealPlanner();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const currentDate = new Date();

  // Load week plan on mount
  useEffect(() => {
    const loadInitialWeekPlan = async () => {
      try {
        const startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        await loadWeekPlan(startDate);
      } catch (error) {
        logger.error('Failed to load initial week plan:', 'MealPlannerGrid', error);
      } finally {
        setIsInitializing(false);
      }
    };

    loadInitialWeekPlan();
  }, [loadWeekPlan]); // Include loadWeekPlan in deps

  const weekSummary = useMemo(() => getWeekSummary(), [getWeekSummary]);
  
  // Adapt data for the grid components
  const adaptedWeekPlan = useMemo(() => 
    adaptMealDataForGrid(currentWeekPlan, getSlotForDay), 
    [currentWeekPlan, getSlotForDay]
  );

  // AI Generate Week handler
  const handleAIGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateWeeklyPlan();
      
      if (result.success && result.data) {
        await applyGeneratedPlan(result.data);
        toast.success('Plan de comidas generado con IA', {
          description: `Confianza: ${Math.round(confidence * 100)}%`
        });
      } else {
        toast.error('Error al generar el plan', {
          description: result.error || 'Ocurrió un error desconocido'
        });
      }
    } catch (error) {
      logger.error('Failed to generate AI plan:', 'MealPlannerGrid', error);
      toast.error('Error al generar el plan', {
        description: 'Por favor, intenta de nuevo'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generateWeeklyPlan, applyGeneratedPlan, confidence]);

  // Meal edit handler
  const handleMealEdit = useCallback((meal: any, slot: any) => {
    // TODO: Implement meal edit modal
    toast.info('Función de edición en desarrollo');
  }, []);

  // Meal duplicate handler
  const handleMealDuplicate = useCallback((meal: any, slot: any) => {
    // TODO: Implement meal duplication
    toast.info('Función de duplicación en desarrollo');
  }, []);

  // Show skeleton on initial load or when loading without existing data
  if (isInitializing || (isLoading && !currentWeekPlan)) {
    return <MealPlannerSkeleton />;
  }

  if (error) {
    return <MealPlannerError error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats Card */}
      <KeCard variant="default">
        <KeCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Calendar className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <KeCardTitle className="text-xl">
                  Planificador de Comidas
                </KeCardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {weekSummary.totalMeals} de 28 comidas planificadas
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <KeButton
                variant="outline"
                size="sm"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                onClick={onShoppingList}
                className="hidden md:flex"
              >
                Lista de compras
              </KeButton>
            </div>
          </div>
        </KeCardHeader>

        <KeCardContent>
          {/* AI Generate Button or Login Prompt */}
          {!authUser ? (
            <div className="mb-6">
              <KeButton
                variant="outline"
                size="lg"
                leftIcon={<LogIn className="w-5 h-5" />}
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Inicia sesión para generar planes con IA
              </KeButton>
            </div>
          ) : weekSummary.totalMeals < 14 && (
            <div className="mb-6">
              <KeButton
                variant="primary"
                size="lg"
                leftIcon={<Sparkles className="w-5 h-5" />}
                onClick={handleAIGenerate}
                disabled={isGenerating || isGeminiGenerating}
                loading={isGenerating || isGeminiGenerating}
                className="w-full"
              >
                {(isGenerating || isGeminiGenerating) 
                  ? 'Generando plan con IA...' 
                  : 'Generar Plan de Semana con IA'
                }
              </KeButton>
            </div>
          )}

          {/* Confidence indicator */}
          {confidence > 0 && (
            <div className="mb-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Plan generado por IA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="font-medium">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Progreso de la semana
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                animate={{ width: `${weekSummary.completionPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Week Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Comidas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekSummary.totalMeals}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Recetas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekSummary.uniqueRecipes}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Calorías</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekSummary.nutritionAverage?.calories || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Proteína</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekSummary.nutritionAverage?.protein || 0}g
              </p>
            </div>
          </div>
        </KeCardContent>
      </KeCard>

      {/* Responsive Grid */}
      {isMobile ? (
        <MobileGrid
          currentDate={currentDate}
          weekPlan={adaptedWeekPlan}
          onRecipeSelect={onRecipeSelect}
          onMealEdit={handleMealEdit}
          onMealDuplicate={handleMealDuplicate}
          isLoading={isGenerating || isGeminiGenerating}
        />
      ) : (
        <DesktopGrid
          currentDate={currentDate}
          weekPlan={adaptedWeekPlan}
          onRecipeSelect={onRecipeSelect}
          onMealEdit={handleMealEdit}
          onMealDuplicate={handleMealDuplicate}
          isLoading={isGenerating || isGeminiGenerating}
        />
      )}
    </div>
  );
}