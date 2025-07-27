/**
 * DesktopGrid - Vista desktop del planificador (grid 7x4)
 * Drag & Drop, design system KeCard, responsive
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Beef
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

interface DesktopGridProps {
  currentDate: Date;
  weekPlan: any; // TODO: Type this properly
  onRecipeSelect: (slot: { dayOfWeek: number; mealType: any }) => void;
  onMealEdit?: (meal: any, slot: any) => void;
  onMealDuplicate?: (meal: any, slot: any) => void;
  isLoading?: boolean;
}

const MEAL_TYPES = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function DesktopGrid({
  currentDate,
  weekPlan,
  onRecipeSelect,
  onMealEdit,
  onMealDuplicate,
  isLoading = false
}: DesktopGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Calculate week stats
  const getWeekStats = () => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCost = 0;
    let mealsPlanned = 0;

    for (let day = 0; day < 7; day++) {
      for (const mealType of MEAL_TYPES) {
        const meal = weekPlan?.[day]?.[mealType];
        if (meal) {
          totalKcal += meal.macros?.kcal || 0;
          totalProtein += meal.macros?.protein_g || 0;
          totalCost += meal.cost_estimate_ars || 0;
          mealsPlanned++;
        }
      }
    }

    return {
      totalKcal,
      totalProtein,
      totalCost,
      mealsPlanned,
      totalSlots: 28,
      completionPercentage: Math.round((mealsPlanned / 28) * 100)
    };
  };

  const weekStats = getWeekStats();

  return (
    <div className="space-y-6">
      {/* Week Stats Header */}
      <KeCard variant="default">
        <KeCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <KeCardTitle className="text-xl">
                Planificación Semanal
              </KeCardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
              </p>
            </div>
            
            <div className="flex gap-3">
              <KeButton
                variant="primary"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generar semana con IA
              </KeButton>
            </div>
          </div>
        </KeCardHeader>

        <KeCardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kcal Totales</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekStats.totalKcal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                ~{Math.round(weekStats.totalKcal / 7)} por día
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Beef className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Proteína</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekStats.totalProtein.toFixed(0)}g
              </p>
              <p className="text-xs text-gray-500">
                ~{Math.round(weekStats.totalProtein / 7)}g por día
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo Estimado</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(weekStats.totalCost / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-gray-500">
                ~${(weekStats.totalCost / 7000).toFixed(1)}k por día
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progreso</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekStats.completionPercentage}%
              </p>
              <p className="text-xs text-gray-500">
                {weekStats.mealsPlanned}/28 comidas
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${weekStats.completionPercentage}%` }}
              />
            </div>
          </div>
        </KeCardContent>
      </KeCard>

      {/* 7x4 Grid */}
      <KeCard variant="default" className="overflow-hidden">
        <KeCardContent className="p-0">
          <div className="grid grid-cols-8 min-h-[600px]">
            {/* Header row with meal types */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border-r border-b border-gray-200 dark:border-gray-700"></div>
            {MEAL_TYPES.map((mealType) => (
              <div 
                key={mealType}
                className="bg-gray-50 dark:bg-gray-800/50 border-r border-b border-gray-200 dark:border-gray-700 p-3 text-center"
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {mealType}
                </p>
              </div>
            ))}

            {/* Grid rows - Days */}
            {DAYS.map((dayName, dayIndex) => (
              <div key={dayIndex} className="contents">
                {/* Day label */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border-r border-b border-gray-200 dark:border-gray-700 p-3 flex flex-col justify-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {dayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(addDays(weekStart, dayIndex), 'd/M')}
                  </p>
                </div>

                {/* Meal slots */}
                {MEAL_TYPES.map((mealType, mealIndex) => {
                  const slotKey = `${dayIndex}-${mealType}`;
                  const meal = weekPlan?.[dayIndex]?.[mealType];
                  const isHovered = hoveredSlot === slotKey;

                  return (
                    <div
                      key={slotKey}
                      className="border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-[140px] relative"
                      onMouseEnter={() => setHoveredSlot(slotKey)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      <MealCard
                        meal={meal}
                        mealType={mealType}
                        dayOfWeek={dayIndex}
                        isEmpty={!meal}
                        isDropTarget={isHovered}
                        onClick={() => onRecipeSelect({ dayOfWeek: dayIndex, mealType })}
                        onEdit={() => onMealEdit?.(meal, { dayOfWeek: dayIndex, mealType })}
                        onDuplicate={() => onMealDuplicate?.(meal, { dayOfWeek: dayIndex, mealType })}
                        className="h-full"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </KeCardContent>
      </KeCard>

      {/* Quick Actions */}
      <div className="flex gap-4 justify-center">
        <KeButton
          variant="outline"
          leftIcon={<Calendar className="w-4 h-4" />}
        >
          Duplicar semana
        </KeButton>
        
        <KeButton
          variant="outline"
          leftIcon={<Clock className="w-4 h-4" />}
        >
          Limpiar semana
        </KeButton>
        
        <KeButton
          variant="secondary"
          leftIcon={<TrendingUp className="w-4 h-4" />}
        >
          Ver análisis nutricional
        </KeButton>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Generando plan semanal...</p>
          </div>
        </div>
      )}
    </div>
  );
}