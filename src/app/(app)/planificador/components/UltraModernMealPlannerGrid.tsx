'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Plus,
  Clock,
  Heart,
  Users,
  Calendar,
  Sparkles,
  ChefHat,
  Zap,
  Star,
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Utensils,
  BarChart3,
  Flame,
  Timer,
  Award,
  Coffee,
  Sun,
  Moon,
  Sunrise,
  MoreVertical,
  Lock,
  Unlock,
  X,
  ShoppingCart,
  FileText,
  Share2
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { iOS26EnhancedCard, iOS26LiquidButton } from '@/components/ios26';
import { NeumorphicMealSlot, NeumorphicFilledSlot } from './NeumorphicMealSlot';

interface Recipe {
  id: string;
  name: string;
  image?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number;
  isFavorite?: boolean;
  isAiGenerated?: boolean;
  dietaryLabels?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface MealSlot {
  id: string;
  dayOfWeek: number;
  mealType: string;
  recipeId?: string;
  servings: number;
  isLocked?: boolean;
}

interface WeekPlan {
  id: string;
  slots: MealSlot[];
}

interface UltraModernMealPlannerGridProps {
  weekPlan: WeekPlan;
  recipes: Record<string, Recipe>;
  currentWeek: Date;
  selectedSlots: string[];
  onSlotClick: (slot: MealSlot) => void;
  onSlotSelect: (slotId: string, multi?: boolean) => void;
  onRecipeSelect: (slot: MealSlot) => void;
  onSlotClear: (slot: MealSlot) => void;
  onSlotLock: (slot: MealSlot, locked: boolean) => void;
  onAIGenerate: (slot: MealSlot) => void;
  onGenerateWeek: () => void;
  onClearWeek: () => void;
  onExportWeek: () => void;
  onShoppingList: () => void;
  // Drag & Drop props
  draggedSlot?: MealSlot;
  dropTarget?: any;
  onDragStart: (slot: MealSlot, event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDragOver: (position: any, event: React.DragEvent) => void;
  onDrop: (position: any, event: React.DragEvent) => void;
}

const MEAL_CONFIG = {
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
  cena: {
    label: 'Cena',
    icon: Moon,
    emoji: '🌙',
    gradient: 'from-purple-400 via-pink-400 to-rose-400',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    time: '19:00 - 21:00'
  },
  snack: {
    label: 'Snack',
    icon: Sunrise,
    emoji: '🍎',
    gradient: 'from-green-400 via-emerald-400 to-lime-400',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    time: '16:00 - 17:00'
  }
};

export default function UltraModernMealPlannerGrid({
  weekPlan,
  recipes,
  currentWeek,
  selectedSlots,
  onSlotClick,
  onSlotSelect,
  onRecipeSelect,
  onSlotClear,
  onSlotLock,
  onAIGenerate,
  onGenerateWeek,
  onClearWeek,
  onExportWeek,
  onShoppingList
}: UltraModernMealPlannerGridProps) {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const mealTypes = ['desayuno', 'almuerzo', 'cena', 'snack'];
  
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(() => new Date().getDay());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const getSlotForDay = useCallback((dayIndex: number, mealType: string) => {
    return weekPlan.slots.find(slot => slot.dayOfWeek === dayIndex && slot.mealType === mealType);
  }, [weekPlan.slots]);

  const getCurrentDate = useCallback((dayIndex: number) => {
    const date = new Date(currentWeek);
    const dayOfWeek = date.getDay();
    const diff = dayIndex - dayOfWeek;
    date.setDate(date.getDate() + diff);
    return date;
  }, [currentWeek]);

  const isToday = useCallback((dayIndex: number) => {
    const date = getCurrentDate(dayIndex);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, [getCurrentDate]);

  const weekStats = useMemo(() => {
    const filledSlots = weekPlan.slots.filter(slot => slot.recipeId);
    const totalRecipes = filledSlots.length;
    const uniqueRecipes = new Set(filledSlots.map(slot => slot.recipeId)).size;
    const totalServings = filledSlots.reduce((sum, slot) => sum + slot.servings, 0);
    
    const totalCalories = filledSlots.reduce((sum, slot) => {
      const recipe = slot.recipeId ? recipes[slot.recipeId] : undefined;
      return sum + (recipe?.nutrition?.calories || 0) * slot.servings;
    }, 0);
    
    const totalProtein = filledSlots.reduce((sum, slot) => {
      const recipe = slot.recipeId ? recipes[slot.recipeId] : undefined;
      return sum + (recipe?.nutrition?.protein || 0) * slot.servings;
    }, 0);
    
    return {
      totalRecipes,
      uniqueRecipes,
      totalServings,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      completionPercentage: Math.round((totalRecipes / 28) * 100)
    };
  }, [weekPlan.slots, recipes]);

  const renderMealSlot = (dayIndex: number, mealType: string) => {
    const slot = getSlotForDay(dayIndex, mealType);
    const recipe = slot?.recipeId ? recipes[slot.recipeId] : null;
    const isSelected = slot ? selectedSlots.includes(slot.id) : false;
    const isHovered = slot ? hoveredSlot === slot.id : false;
    const mealConfig = MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG];
    const todayClass = isToday(dayIndex);

    if (!slot || !recipe) {
      // Empty slot - Neumorphic design
      return (
        <NeumorphicMealSlot
          key={`${dayIndex}-${mealType}`}
          dayIndex={dayIndex}
          mealType={mealType}
          isDarkMode={isDarkMode}
          isHovered={hoveredSlot === `empty-${dayIndex}-${mealType}`}
          onHoverStart={() => setHoveredSlot(`empty-${dayIndex}-${mealType}`)}
          onHoverEnd={() => setHoveredSlot(null)}
          onClick={() => onAIGenerate({ dayOfWeek: dayIndex, mealType } as MealSlot)}
          todayClass={todayClass}
        />
      );
    }

    // Filled slot - Neumorphic design
    return (
      <NeumorphicFilledSlot
        key={slot.id}
        recipe={recipe}
        slot={slot}
        isDarkMode={isDarkMode}
        isHovered={isHovered}
        isSelected={isSelected}
        todayClass={todayClass}
        onHoverStart={() => setHoveredSlot(slot.id)}
        onHoverEnd={() => setHoveredSlot(null)}
        onClick={() => onSlotClick(slot)}
        onEdit={() => onRecipeSelect(slot)}
        onClear={() => onSlotClear(slot)}
      />
    );
  };

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
                  {weekStats.totalRecipes} de 28 comidas planificadas
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <iOS26LiquidButton
                variant="glass"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={onGenerateWeek}
                className="hidden md:flex"
              >
                Generar Semana
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
                {weekStats.completionPercentage}%
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${weekStats.completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
        
        {/* Desktop view */}
        <div className="hidden md:block p-4 md:p-6">
          {/* Days header */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            {days.map((day, index) => (
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
            {mealTypes.map((mealType) => (
              <div key={mealType}>
                {/* Meal type header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br shadow-md",
                    MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].gradient
                  )}>
                    <span className="text-sm">
                      {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].emoji}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].label}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].time}
                  </span>
                </div>
                
                {/* Meal slots */}
                <div className="grid grid-cols-7 gap-3">
                  {days.map((_, dayIndex) => (
                    <div key={`${dayIndex}-${mealType}`}>
                      {renderMealSlot(dayIndex, mealType)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                {days[currentDayIndex]}
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
            {days.map((_, index) => (
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
            {mealTypes.map((mealType) => (
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
                    MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].gradient
                  )}>
                    <span className="text-sm">
                      {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].emoji}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].label}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].time}
                  </span>
                </div>
                
                {renderMealSlot(currentDayIndex, mealType)}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Footer stats */}
        <div className="px-4 md:px-6 py-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekStats.totalRecipes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Comidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekStats.uniqueRecipes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Recetas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekStats.totalServings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Porciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekStats.totalCalories}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Calorías</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weekStats.totalProtein}g
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
                  onGenerateWeek();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Generar con IA</span>
              </button>
              
              <button
                onClick={() => {
                  onExportWeek();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Exportar</span>
              </button>
              
              <button
                onClick={() => {
                  onClearWeek();
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

/* Add this to your global styles */
const styles = `
@keyframes gradient-shift {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-50%, -50%);
  }
  100% {
    transform: translate(0, 0);
  }
}

.animate-gradient-shift {
  animation: gradient-shift 20s ease infinite;
  background-size: 200% 200%;
}
`;