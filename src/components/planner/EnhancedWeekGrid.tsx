'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Trash2,
  Coffee,
  Utensils,
  Apple,
  Moon
} from 'lucide-react';
import { format, isToday, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';

import { EnhancedMealCard, type MealPlanEntry } from './EnhancedMealCard';

interface EnhancedWeekGridProps {
  currentDate: Date;
  weekDays: Date[];
  plannedMealsByDay: Record<string, Record<string, MealPlanEntry[]>>;
  onNavigateWeek: (direction: 'prev' | 'next' | 'current') => void;
  onAddMeal: (date: Date, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => void;
  onEditMeal: (meal: MealPlanEntry) => void;
  onDeleteMeal: (mealId: string) => void;
  onCopyMeal: (meal: MealPlanEntry) => void;
  onViewMealDetails: (meal: MealPlanEntry) => void;
  onGenerateAI: (date: Date, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => void;
  onClearDay: (date: Date) => void;
  onSelectDay?: (date: Date) => void;
  isLoading?: boolean;
  className?: string;
}

const mealTypes = [
  { key: 'breakfast', label: 'Desayuno', icon: Coffee, emoji: '🌅' },
  { key: 'lunch', label: 'Almuerzo', icon: Utensils, emoji: '🍽️' },
  { key: 'snack', label: 'Merienda', icon: Apple, emoji: '🍎' },
  { key: 'dinner', label: 'Cena', icon: Moon, emoji: '🌙' }
] as const;

const EmptyMealSlot: React.FC<{
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  onAdd: (date: Date, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => void;
  onGenerateAI: (date: Date, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => void;
}> = ({ date, mealType, onAdd, onGenerateAI }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center p-4 min-h-[120px] border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
  >
    <div className="flex space-x-2">
      <iOS26LiquidButton
        variant="ghost"
        size="sm"
        onClick={() => onAdd(date, mealType)}
        className="text-gray-500 hover:text-gray-700"
      >
        <Plus className="w-4 h-4" />
      </iOS26LiquidButton>
      <iOS26LiquidButton
        variant="ghost"
        size="sm"
        onClick={() => onGenerateAI(date, mealType)}
        className="text-purple-500 hover:text-purple-700"
      >
        <Sparkles className="w-4 h-4" />
      </iOS26LiquidButton>
    </div>
    <p className="text-xs text-gray-400 mt-2 text-center">
      No hay comidas programadas
    </p>
  </motion.div>
);

export const EnhancedWeekGrid: React.FC<EnhancedWeekGridProps> = ({
  currentDate,
  weekDays,
  plannedMealsByDay,
  onNavigateWeek,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onCopyMeal,
  onViewMealDetails,
  onGenerateAI,
  onClearDay,
  onSelectDay,
  isLoading = false,
  className
}) => {
  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = addDays(currentWeekStart, 6);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <iOS26LiquidButton
            variant="ghost"
            size="sm"
            onClick={() => onNavigateWeek('prev')}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </iOS26LiquidButton>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentWeekStart, 'dd MMM', { locale: es })} - {format(currentWeekEnd, 'dd MMM yyyy', { locale: es })}
            </h2>
          </div>
          
          <iOS26LiquidButton
            variant="ghost"
            size="sm"
            onClick={() => onNavigateWeek('next')}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </iOS26LiquidButton>
        </div>
        
        <iOS26LiquidButton
          variant="secondary"
          size="sm"
          onClick={() => onNavigateWeek('current')}
          className="flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Hoy</span>
        </iOS26LiquidButton>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const dayMeals = plannedMealsByDay[dateKey] || {};
            const isDayToday = isToday(day);
            
            return (
              <div key={dateKey} className="space-y-4">
                {/* Day header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "text-center",
                      isDayToday && "text-orange-600 font-semibold"
                    )}>
                      <div className="text-sm font-medium">
                        {format(day, 'EEE', { locale: es })}
                      </div>
                      <div className="text-lg">
                        {format(day, 'dd')}
                      </div>
                      {isDayToday && (
                        <div className="text-xs text-orange-600">Hoy</div>
                      )}
                    </div>
                    
                    {/* Clear day button - visible on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <iOS26LiquidButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onClearDay(day)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </iOS26LiquidButton>
                    </div>
                  </div>
                </div>

                {/* Meal slots */}
                <div className="space-y-3">
                  {mealTypes.map(({ key, label, icon: Icon, emoji }) => {
                    const meals = dayMeals[key] || [];
                    
                    return (
                      <div key={key} className="space-y-2">
                        {/* Meal type header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{emoji}</span>
                            <span className="text-xs font-medium text-gray-600">{label}</span>
                          </div>
                          <div className="flex space-x-1">
                            <iOS26LiquidButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onAddMeal(day, key as any)}
                              className="p-1"
                            >
                              <Plus className="w-3 h-3" />
                            </iOS26LiquidButton>
                            <iOS26LiquidButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onGenerateAI(day, key as any)}
                              className="p-1 text-purple-500 hover:text-purple-700"
                            >
                              <Sparkles className="w-3 h-3" />
                            </iOS26LiquidButton>
                          </div>
                        </div>

                        {/* Meals */}
                        <AnimatePresence mode="popLayout">
                          {meals.length > 0 ? (
                            meals.map((meal) => (
                              <EnhancedMealCard
                                key={meal.id}
                                meal={meal}
                                mealType={key as any}
                                onEdit={onEditMeal}
                                onDelete={onDeleteMeal}
                                onCopy={onCopyMeal}
                                onViewDetails={onViewMealDetails}
                                className="w-full"
                              />
                            ))
                          ) : (
                            <EmptyMealSlot
                              date={day}
                              mealType={key as any}
                              onAdd={onAddMeal}
                              onGenerateAI={onGenerateAI}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden space-y-4">
        {weekDays.map((day) => {
          const dateKey = formatDateKey(day);
          const dayMeals = plannedMealsByDay[dateKey] || {};
          const isDayToday = isToday(day);
          
          return (
            <iOS26LiquidCard
              key={dateKey}
              variant="subtle"
              className="p-4 space-y-4"
            >
              {/* Day header */}
              <div 
                className={cn(
                  "flex items-center justify-between cursor-pointer",
                  isDayToday && "text-orange-600"
                )}
                onClick={() => onSelectDay?.(day)}
              >
                <div>
                  <div className="text-lg font-semibold">
                    {format(day, 'EEEE dd', { locale: es })}
                  </div>
                  {isDayToday && (
                    <div className="text-sm text-orange-600">Hoy</div>
                  )}
                </div>
                <iOS26LiquidButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearDay(day);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </iOS26LiquidButton>
              </div>

              {/* Meals in 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                {mealTypes.map(({ key, label, emoji }) => {
                  const meals = dayMeals[key] || [];
                  
                  return (
                    <div key={key} className="space-y-2">
                      {/* Meal type header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">{emoji}</span>
                          <span className="text-xs font-medium text-gray-600">{label}</span>
                        </div>
                        <div className="flex space-x-1">
                          <iOS26LiquidButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddMeal(day, key as any)}
                            className="p-1"
                          >
                            <Plus className="w-3 h-3" />
                          </iOS26LiquidButton>
                          <iOS26LiquidButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onGenerateAI(day, key as any)}
                            className="p-1 text-purple-500"
                          >
                            <Sparkles className="w-3 h-3" />
                          </iOS26LiquidButton>
                        </div>
                      </div>

                      {/* Meals */}
                      <AnimatePresence mode="popLayout">
                        {meals.length > 0 ? (
                          meals.map((meal) => (
                            <EnhancedMealCard
                              key={meal.id}
                              meal={meal}
                              mealType={key as any}
                              onEdit={onEditMeal}
                              onDelete={onDeleteMeal}
                              onCopy={onCopyMeal}
                              onViewDetails={onViewMealDetails}
                              className="w-full"
                            />
                          ))
                        ) : (
                          <EmptyMealSlot
                            date={day}
                            mealType={key as any}
                            onAdd={onAddMeal}
                            onGenerateAI={onGenerateAI}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </iOS26LiquidCard>
          );
        })}
      </div>
    </div>
  );
};