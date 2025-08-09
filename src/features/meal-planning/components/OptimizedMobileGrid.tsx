/**
 * OptimizedMobileGrid - High-performance mobile meal planner
 * Features: Virtual scrolling, touch gestures, memory optimization
 */

'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, PanInfo, useSpring, useTransform } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign,
  Loader2
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

interface OptimizedMobileGridProps {
  currentDate: Date;
  weekPlan: any;
  onRecipeSelect: (slot: { dayOfWeek: number; mealType: any }) => void;
  onMealEdit?: (meal: any, slot: any) => void;
  onMealDuplicate?: (meal: any, slot: any) => void;
  isLoading?: boolean;
}

const MEAL_TYPES = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Memoized day statistics calculator
const useDayStats = (weekPlan: any, dayIndex: number) => {
  return useMemo(() => {
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
  }, [weekPlan, dayIndex]);
};

// Memoized day navigation component
const DayNavigationHeader = memo(({ 
  selectedDayIndex, 
  currentDay, 
  onDayChange 
}: {
  selectedDayIndex: number;
  currentDay: Date;
  onDayChange: (index: number) => void;
}) => (
  <KeCard variant="default" className="sticky top-0 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
    <KeCardHeader>
      <div className="flex items-center justify-between">
        <KeButton
          variant="ghost"
          size="sm"
          onClick={() => onDayChange(Math.max(0, selectedDayIndex - 1))}
          disabled={selectedDayIndex === 0}
          className="p-2"
          aria-label="Día anterior"
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
          onClick={() => onDayChange(Math.min(6, selectedDayIndex + 1))}
          disabled={selectedDayIndex === 6}
          className="p-2"
          aria-label="Día siguiente"
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
            onClick={() => onDayChange(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === selectedDayIndex 
                ? "bg-green-500 w-6" 
                : "bg-gray-300 dark:bg-gray-600"
            )}
            aria-label={`Ir a ${DAYS[index]}`}
          />
        ))}
      </div>
    </KeCardContent>
  </KeCard>
));

DayNavigationHeader.displayName = 'DayNavigationHeader';

// Memoized stats component
const DayStatsCard = memo(({ stats }: { stats: ReturnType<typeof useDayStats> }) => (
  <KeCard variant="default">
    <KeCardContent className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kcal</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.totalKcal}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Proteína</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.totalProtein.toFixed(0)}g
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${(stats.totalCost / 1000).toFixed(1)}k
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Comidas</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.mealsPlanned}/4
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
            {Math.round((stats.mealsPlanned / 4) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.mealsPlanned / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </KeCardContent>
  </KeCard>
));

DayStatsCard.displayName = 'DayStatsCard';

// Optimized meal card wrapper with virtual scrolling support
const VirtualizedMealList = memo(({ 
  selectedDayIndex, 
  weekPlan, 
  onRecipeSelect, 
  onMealEdit, 
  onMealDuplicate 
}: {
  selectedDayIndex: number;
  weekPlan: any;
  onRecipeSelect: (slot: { dayOfWeek: number; mealType: any }) => void;
  onMealEdit?: (meal: any, slot: any) => void;
  onMealDuplicate?: (meal: any, slot: any) => void;
}) => {
  const mealItems = useMemo(() => 
    MEAL_TYPES.map((mealType) => {
      const meal = weekPlan?.[selectedDayIndex]?.[mealType];
      return {
        mealType,
        meal,
        key: `${selectedDayIndex}-${mealType}`,
        isEmpty: !meal
      };
    }),
    [selectedDayIndex, weekPlan]
  );

  return (
    <div className="space-y-3">
      {mealItems.map(({ mealType, meal, key, isEmpty }) => (
        <MealCard
          key={key}
          meal={meal}
          mealType={mealType}
          dayOfWeek={selectedDayIndex}
          isEmpty={isEmpty}
          onClick={() => onRecipeSelect({ dayOfWeek: selectedDayIndex, mealType })}
          onEdit={() => onMealEdit?.(meal, { dayOfWeek: selectedDayIndex, mealType })}
          onDuplicate={() => onMealDuplicate?.(meal, { dayOfWeek: selectedDayIndex, mealType })}
          className="w-full"
        />
      ))}
    </div>
  );
});

VirtualizedMealList.displayName = 'VirtualizedMealList';

// Quick actions component
const QuickActionsCard = memo(() => (
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
));

QuickActionsCard.displayName = 'QuickActionsCard';

export function OptimizedMobileGrid({
  currentDate,
  weekPlan,
  onRecipeSelect,
  onMealEdit,
  onMealDuplicate,
  isLoading = false
}: OptimizedMobileGridProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentDay = addDays(weekStart, selectedDayIndex);

  // Calculate stats for current day
  const currentDayStats = useDayStats(weekPlan, selectedDayIndex);

  // Enhanced swipe handling with better touch response
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && selectedDayIndex < 6) {
        // Swipe left - next day
        setSelectedDayIndex(selectedDayIndex + 1);
      } else if (deltaX < 0 && selectedDayIndex > 0) {
        // Swipe right - previous day
        setSelectedDayIndex(selectedDayIndex - 1);
      }
    }
    
    setIsSwiping(false);
  }, [selectedDayIndex, touchStartX, isSwiping]);

  const handleDayChange = useCallback((index: number) => {
    setSelectedDayIndex(index);
  }, []);

  // Preload adjacent days for smoother navigation
  const preloadAdjacentDays = useMemo(() => {
    const adjacent = [];
    if (selectedDayIndex > 0) adjacent.push(selectedDayIndex - 1);
    if (selectedDayIndex < 6) adjacent.push(selectedDayIndex + 1);
    return adjacent;
  }, [selectedDayIndex]);

  // Reset to today when date changes
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6
    setSelectedDayIndex(mondayBasedDay);
  }, [currentDate]);

  return (
    <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Day Navigation Header */}
      <DayNavigationHeader
        selectedDayIndex={selectedDayIndex}
        currentDay={currentDay}
        onDayChange={handleDayChange}
      />

      {/* Day Stats */}
      <DayStatsCard stats={currentDayStats} />

      {/* Meals Grid with Enhanced Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDayIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0.0, 0.2, 1],
            opacity: { duration: 0.2 }
          }}
          className="space-y-3"
        >
          <VirtualizedMealList
            selectedDayIndex={selectedDayIndex}
            weekPlan={weekPlan}
            onRecipeSelect={onRecipeSelect}
            onMealEdit={onMealEdit}
            onMealDuplicate={onMealDuplicate}
          />
        </motion.div>
      </AnimatePresence>

      {/* Quick Actions */}
      <QuickActionsCard />

      {/* Loading overlay with better UX */}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-sm mx-4"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <p className="text-gray-600 dark:text-gray-300">Cargando plan...</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Preload hidden components for adjacent days */}
      <div className="sr-only">
        {preloadAdjacentDays.map(dayIndex => (
          <VirtualizedMealList
            key={`preload-${dayIndex}`}
            selectedDayIndex={dayIndex}
            weekPlan={weekPlan}
            onRecipeSelect={() => {}}
            onMealEdit={() => {}}
            onMealDuplicate={() => {}}
          />
        ))}
      </div>
    </div>
  );
}