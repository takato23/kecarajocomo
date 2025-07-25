'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Sunrise,
  MoreVertical,
  X,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingSpinner } from '@/components/ui/enhanced-loading';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useGeminiMealPlanner } from '../hooks/useGeminiMealPlanner';
import type { MealType } from '../types';

import { MealSlot } from './MealSlot';

const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const mealConfigs = {
  desayuno: {
    label: 'Desayuno',
    icon: Coffee,
    emoji: '☕',
    gradient: 'from-amber-400 via-orange-400 to-yellow-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    time: '7:00 - 10:00'
  },
  almuerzo: {
    label: 'Almuerzo',
    icon: Sun,
    emoji: '☀️',
    gradient: 'from-blue-400 via-cyan-400 to-teal-400',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    time: '12:00 - 14:00'
  },
  merienda: {
    label: 'Merienda',
    icon: Sunrise,
    emoji: '🍎',
    gradient: 'from-green-400 via-emerald-400 to-lime-400',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    time: '16:00 - 17:00'
  },
  cena: {
    label: 'Cena',
    icon: Moon,
    emoji: '🌙',
    gradient: 'from-purple-400 via-pink-400 to-rose-400',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    time: '19:00 - 21:00'
  }
};

interface MealPlannerGridProps {
  onRecipeSelect?: (slot: { dayOfWeek: number; mealType: MealType }) => void;
  onShoppingList?: () => void;
  onExportWeek?: () => void;
}

export default function MealPlannerGrid({
  onRecipeSelect,
  onShoppingList,
  onExportWeek
}: MealPlannerGridProps) {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  
  const {
    currentWeekPlan,
    isLoading,
    error,
    selectedSlots,
    getSlotForDay,
    getWeekSummary,
    setActiveModal,
    toggleSlotSelection,
    updateMealSlot,
    removeMealFromSlot,
    generateWeekWithAI,
    clearWeek,
    userPreferences
  } = useMealPlanningStore();

  const {
    generateWeeklyPlan,
    isGenerating: isGeminiGenerating,
    applyGeneratedPlan,
    lastGeneratedPlan,
    confidence
  } = useGeminiMealPlanner();
  
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(() => new Date().getDay());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const weekSummary = useMemo(() => getWeekSummary(), [getWeekSummary]);

  const handleSlotClick = useCallback((slot: any) => {
    if (slot.recipeId) {
      setActiveModal('recipe-detail');
    } else {
      onRecipeSelect?.({ dayOfWeek: slot.dayOfWeek, mealType: slot.mealType });
    }
  }, [onRecipeSelect, setActiveModal]);

  const handleSlotClear = useCallback(async (slot: any) => {
    await removeMealFromSlot(slot.id);
  }, [removeMealFromSlot]);

  const handleSlotLock = useCallback(async (slot: any, locked: boolean) => {
    await updateMealSlot(slot.id, { isLocked: locked });
  }, [updateMealSlot]);

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
      console.error('Failed to generate AI plan:', error);
      toast.error('Error al generar el plan', {
        description: 'Por favor, intenta de nuevo'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generateWeeklyPlan, applyGeneratedPlan, confidence]);

  const getCurrentDate = useCallback((dayIndex: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    return targetDate;
  }, []);

  const isToday = useCallback((dayIndex: number) => {
    const date = getCurrentDate(dayIndex);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, [getCurrentDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main container with enhanced glassmorphism */}
      <iOS26EnhancedCard
        variant="aurora"
        elevation="high"
        className="relative overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-gradient-shift" />
        </div>
        
        {/* Header */}
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-white/10">
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
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Planificador de Comidas
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {weekSummary.totalMeals} de 28 comidas planificadas
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <iOS26LiquidButton
                variant="glass"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleAIGenerate}
                disabled={isGenerating || isGeminiGenerating}
                className="hidden md:flex"
              >
                {(isGenerating || isGeminiGenerating) ? 'Generando...' : 'Generar Semana'}
              </iOS26LiquidButton>
              
              <iOS26LiquidButton
                variant="glass"
                size="sm"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                onClick={onShoppingList}
              >
                Lista
              </iOS26LiquidButton>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors md:hidden"
              >
                <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Progreso de la semana
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.completionPercentage}%
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${weekSummary.completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
        
        {/* Desktop view */}
        <div className="hidden md:block p-4 md:p-6">
          {/* Days header */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            {DAYS.map((day, index) => (
              <div key={day} className="text-center">
                <motion.div
                  className={cn(
                    "relative px-3 py-2 rounded-xl transition-all duration-300",
                    isToday(index) 
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105" 
                      : "bg-white/10 text-gray-700 dark:text-gray-300"
                  )}
                  whileHover={{ scale: isToday(index) ? 1.05 : 1.02 }}
                >
                  <div className="font-semibold text-sm">{day}</div>
                  <div className="text-xs mt-1">
                    {getCurrentDate(index).getDate()}
                  </div>
                  {isToday(index) && (
                    <motion.div
                      className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-50 blur"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>
            ))}
          </div>
          
          {/* Meal slots grid */}
          <div className="space-y-3">
            {MEAL_TYPES.map((mealType) => {
              const config = mealConfigs[mealType];
              return (
                <div key={mealType}>
                  {/* Meal type header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      "bg-gradient-to-br shadow-md",
                      config.gradient
                    )}>
                      <span className="text-sm">{config.emoji}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {config.label}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {config.time}
                    </span>
                  </div>
                  
                  {/* Meal slots */}
                  <div className="grid grid-cols-7 gap-3">
                    {DAYS.map((_, dayIndex) => {
                      const slot = getSlotForDay(dayIndex === 6 ? 0 : dayIndex + 1, mealType);
                      return (
                        <div key={`${dayIndex}-${mealType}`}>
                          <MealSlot
                            slot={slot}
                            dayOfWeek={dayIndex === 6 ? 0 : dayIndex + 1}
                            mealType={mealType}
                            isToday={isToday(dayIndex)}
                            isSelected={slot ? selectedSlots.includes(slot.id) : false}
                            isHovered={slot ? hoveredSlot === slot.id : false}
                            onSlotClick={handleSlotClick}
                            onRecipeSelect={() => onRecipeSelect?.({ dayOfWeek: dayIndex === 6 ? 0 : dayIndex + 1, mealType })}
                            onSlotClear={handleSlotClear}
                            onSlotLock={handleSlotLock}
                            onAIGenerate={() => onRecipeSelect?.({ dayOfWeek: dayIndex === 6 ? 0 : dayIndex + 1, mealType })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Mobile view */}
        <div className="block md:hidden p-4">
          {/* Day navigation */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>
            
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {DAYS[currentDayIndex]}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getCurrentDate(currentDayIndex).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
              {isToday(currentDayIndex) && (
                <div className="mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full inline-block">
                  Hoy
                </div>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>
          </div>
          
          {/* Day indicator dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {DAYS.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentDayIndex(index)}
                className={cn(
                  "transition-all duration-300",
                  currentDayIndex === index 
                    ? "w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" 
                    : "w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"
                )}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
          
          {/* Current day meals */}
          <div className="space-y-4">
            {MEAL_TYPES.map((mealType) => {
              const config = mealConfigs[mealType];
              const slot = getSlotForDay(currentDayIndex === 6 ? 0 : currentDayIndex + 1, mealType);
              
              return (
                <motion.div
                  key={mealType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      "bg-gradient-to-br shadow-md",
                      config.gradient
                    )}>
                      <span className="text-sm">{config.emoji}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {config.label}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {config.time}
                    </span>
                  </div>
                  
                  <MealSlot
                    slot={slot}
                    dayOfWeek={currentDayIndex === 6 ? 0 : currentDayIndex + 1}
                    mealType={mealType}
                    isToday={isToday(currentDayIndex)}
                    isSelected={slot ? selectedSlots.includes(slot.id) : false}
                    onSlotClick={handleSlotClick}
                    onRecipeSelect={() => onRecipeSelect?.({ dayOfWeek: currentDayIndex === 6 ? 0 : currentDayIndex + 1, mealType })}
                    onSlotClear={handleSlotClear}
                    onSlotLock={handleSlotLock}
                    onAIGenerate={() => onRecipeSelect?.({ dayOfWeek: currentDayIndex === 6 ? 0 : currentDayIndex + 1, mealType })}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Footer stats */}
        <div className="px-4 md:px-6 py-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.totalMeals}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Comidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.uniqueRecipes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Recetas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.totalServings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Porciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.nutritionAverage?.calories || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Calorías</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekSummary.nutritionAverage?.protein || 0}g
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Proteína</div>
            </div>
          </div>
        </div>
      </iOS26EnhancedCard>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 z-50 md:hidden"
          >
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleAIGenerate();
                  setShowMobileMenu(false);
                }}
                disabled={isGenerating || isGeminiGenerating}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">
                  {(isGenerating || isGeminiGenerating) ? 'Generando...' : 'Generar con IA'}
                </span>
              </button>
              
              <button
                onClick={() => {
                  onExportWeek?.();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Exportar</span>
              </button>
              
              <button
                onClick={() => {
                  clearWeek();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">Limpiar semana</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}