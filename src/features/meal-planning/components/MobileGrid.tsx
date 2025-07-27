/**
 * MobileGrid - Vista móvil del planificador (navegación por día)
 * Mobile-first, swipe navigation, KeCard design system
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { 
  KeCard, 
  KeCardHeader, 
  KeCardTitle, 
  KeCardContent,
  KeButton,
  KeBadge
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { MealCard } from './MealCard';

interface MobileGridProps {
  currentDate: Date;
  weekPlan: any; // TODO: Type this properly
  onRecipeSelect: (slot: { dayOfWeek: number; mealType: any }) => void;
  onMealEdit?: (meal: any, slot: any) => void;
  onMealDuplicate?: (meal: any, slot: any) => void;
  isLoading?: boolean;
}

const MEAL_TYPES = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function MobileGrid({
  currentDate,
  weekPlan,
  onRecipeSelect,
  onMealEdit,
  onMealDuplicate,
  isLoading = false
}: MobileGridProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentDay = addDays(weekStart, selectedDayIndex);

  // Swipe navigation
  const handleDaySwipe = (info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1);
    } else if (info.offset.x < -threshold && selectedDayIndex < 6) {
      setSelectedDayIndex(selectedDayIndex + 1);
    }
  };

  // Calculate day stats
  const getDayStats = (dayIndex: number) => {
    const dayMeals = MEAL_TYPES.map(mealType => 
      weekPlan?.[dayIndex]?.[mealType]
    ).filter(Boolean);

    const totalKcal = dayMeals.reduce((sum, meal) => 
      sum + (meal?.macros?.kcal || 0), 0
    );
    const totalProtein = dayMeals.reduce((sum, meal) => 
      sum + (meal?.macros?.protein_g || 0), 0
    );
    const totalCost = dayMeals.reduce((sum, meal) => 
      sum + (meal?.cost_estimate_ars || 0), 0
    );

    return {
      totalKcal,
      totalProtein,
      totalCost,
      mealsPlanned: dayMeals.length
    };
  };

  const currentDayStats = getDayStats(selectedDayIndex);

  return (
    <div className="space-y-4">
      {/* Day Navigation Header */}
      <KeCard variant="default" className="sticky top-0 z-10">
        <KeCardHeader>
          <div className="flex items-center justify-between">
            <KeButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
              disabled={selectedDayIndex === 0}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </KeButton>

            <div className="text-center flex-1">
              <KeCardTitle className="text-lg">
                {DAYS[selectedDayIndex]}
              </KeCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(currentDay, "d 'de' MMMM", { locale: es })}
              </p>
            </div>

            <KeButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDayIndex(Math.min(6, selectedDayIndex + 1))}
              disabled={selectedDayIndex === 6}
              className="p-2"
            >
              <ChevronRight className="w-5 h-5" />
            </KeButton>
          </div>
        </KeCardHeader>

        {/* Day dots indicator */}
        <KeCardContent className="pt-0">
          <div className="flex justify-center gap-1">
            {DAYS.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === selectedDayIndex 
                    ? "bg-green-500 w-6" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
        </KeCardContent>
      </KeCard>

      {/* Day Stats */}
      <KeCard variant="default">
        <KeCardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kcal</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentDayStats.totalKcal}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Proteína</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentDayStats.totalProtein.toFixed(0)}g
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${(currentDayStats.totalCost / 1000).toFixed(1)}k
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Comidas</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentDayStats.mealsPlanned}/4
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Planificación del día
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((currentDayStats.mealsPlanned / 4) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentDayStats.mealsPlanned / 4) * 100}%` }}
              />
            </div>
          </div>
        </KeCardContent>
      </KeCard>

      {/* Meals Grid with Swipe */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDayIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => handleDaySwipe(info)}
          className="space-y-3"
        >
          {MEAL_TYPES.map((mealType) => {
            const meal = weekPlan?.[selectedDayIndex]?.[mealType];
            
            return (
              <MealCard
                key={`${selectedDayIndex}-${mealType}`}
                meal={meal}
                mealType={mealType}
                dayOfWeek={selectedDayIndex}
                isEmpty={!meal}
                onClick={() => onRecipeSelect({ dayOfWeek: selectedDayIndex, mealType })}
                onEdit={() => onMealEdit?.(meal, { dayOfWeek: selectedDayIndex, mealType })}
                onDuplicate={() => onMealDuplicate?.(meal, { dayOfWeek: selectedDayIndex, mealType })}
                className="w-full"
              />
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Quick Actions */}
      <KeCard variant="outline">
        <KeCardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <KeButton
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="w-full"
            >
              Generar día con IA
            </KeButton>
            
            <KeButton
              variant="outline"
              size="sm"
              leftIcon={<Calendar className="w-4 h-4" />}
              className="w-full"
            >
              Copiar a otro día
            </KeButton>
          </div>
        </KeCardContent>
      </KeCard>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando plan...</p>
          </div>
        </div>
      )}
    </div>
  );
}