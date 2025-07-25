'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
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
  Coffee,
  Sun,
  Moon,
  Sunrise,
  MoreVertical,
  Lock,
  X,
  ShoppingCart,
  FileText,
  Grip
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { iOS26EnhancedCard, iOS26LiquidButton } from '@/components/ios26';
import { DragDropContainer, DraggableItem, DropZone } from '@/components/drag-drop/DragDropSystem';

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

interface DragDropMealPlannerGridProps {
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
  onRecipeDrop: (recipeId: string, dayIndex: number, mealType: string) => void;
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

// Recipe Card Component for Dragging
const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  return (
    <div className="flex flex-col h-full">
      {recipe.image && (
        <div className="relative h-24 mb-2 rounded-lg overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
        {recipe.name}
      </h4>
      <div className="flex items-center gap-2 mt-auto">
        {recipe.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-600 dark:text-gray-400">{recipe.rating}</span>
          </div>
        )}
        {recipe.prepTime && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {recipe.prepTime + (recipe.cookTime || 0)}m
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function DragDropMealPlannerGrid({
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
  onShoppingList,
  onRecipeDrop
}: DragDropMealPlannerGridProps) {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const mealTypes = ['desayuno', 'almuerzo', 'cena', 'snack'];
  
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(() => new Date().getDay());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragEnd = (item: any, info: any) => {
    setIsDragging(false);
    // Handle drag end logic
  };

  const renderMealSlot = (dayIndex: number, mealType: string) => {
    const slot = getSlotForDay(dayIndex, mealType);
    const recipe = slot?.recipeId ? recipes[slot.recipeId] : null;
    const isSelected = slot ? selectedSlots.includes(slot.id) : false;
    const isHovered = slot ? hoveredSlot === slot.id : false;
    const mealConfig = MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG];
    const todayClass = isToday(dayIndex);
    const dropZoneId = `${dayIndex}-${mealType}`;

    if (!slot || !recipe) {
      // Empty slot - Drop Zone
      return (
        <DropZone
          key={dropZoneId}
          zone={{
            id: dropZoneId,
            accepts: ['recipe'],
            onDrop: (item) => {
              if (item.data?.recipeId) {
                onRecipeDrop(item.data.recipeId, dayIndex, mealType);
              }
            },
            isOccupied: false
          }}
          className={cn(
            "h-full min-h-[100px] md:min-h-[140px]",
            todayClass && "ring-2 ring-blue-400/50"
          )}
        >
          <div className="relative h-full flex flex-col items-center justify-center">
            <motion.div
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-2",
                "bg-gradient-to-br shadow-lg",
                mealConfig.gradient
              )}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </motion.div>
            
            <p className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">
              Arrastra aquí
            </p>
            
            <motion.button
              onClick={() => onAIGenerate({ dayOfWeek: dayIndex, mealType } as MealSlot)}
              className="flex items-center gap-1 mt-2 px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-600 dark:text-purple-400">
                Generar IA
              </span>
            </motion.button>
          </div>
        </DropZone>
      );
    }

    // Filled slot - Draggable Item
    return (
      <DraggableItem
        key={slot.id}
        item={{
          id: slot.id,
          type: 'recipe',
          data: { recipeId: slot.recipeId, slot },
          content: (
            <div
              className={cn(
                "relative w-full h-full min-h-[100px] md:min-h-[140px]",
                isSelected && "ring-2 ring-blue-400/50",
                todayClass && "ring-2 ring-blue-400/50"
              )}
              onClick={() => onSlotClick(slot)}
              onMouseEnter={() => setHoveredSlot(slot.id)}
              onMouseLeave={() => setHoveredSlot(null)}
            >
              {/* Recipe image background */}
              {recipe.image && (
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl overflow-hidden">
                  <img
                    src={recipe.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-30 rounded-2xl",
                  mealConfig.gradient
                )}
              />
              
              {/* Top accent bar */}
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-2xl",
                  mealConfig.gradient
                )}
              />
              
              {/* Content */}
              <div className="relative h-full flex flex-col p-3 md:p-4 z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                      {recipe.name}
                    </h4>
                    {recipe.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {recipe.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Lock indicator */}
                  {slot.isLocked && (
                    <div className="p-1 rounded-lg bg-gray-100/80 dark:bg-gray-800/80">
                      <Lock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Info badges */}
                <div className="flex flex-wrap gap-1 mt-auto">
                  {recipe.prepTime && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/80">
                      <Clock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {recipe.prepTime + (recipe.cookTime || 0)}m
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/80">
                    <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {slot.servings}
                    </span>
                  </div>
                </div>
                
                {/* Hover actions */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-2 right-2 flex items-center gap-1"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecipeSelect(slot);
                        }}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg"
                      >
                        <Edit2 className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClear(slot);
                        }}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* AI badge */}
                {recipe.isAiGenerated && (
                  <div className="absolute top-2 right-2">
                    <motion.div
                      className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Zap className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          )
        }}
        onDragEnd={handleDragEnd}
        className="w-full h-full cursor-move"
      />
    );
  };

  // Recipe Sidebar for dragging
  const recipeSidebar = (
    <div className="hidden lg:block w-64 h-full">
      <iOS26EnhancedCard
        variant="ocean"
        elevation="medium"
        className="h-full overflow-hidden"
      >
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Grip className="w-5 h-5" />
            Recetas Disponibles
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Arrastra las recetas al calendario
          </p>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          {Object.values(recipes).map((recipe) => (
            <DraggableItem
              key={recipe.id}
              item={{
                id: recipe.id,
                type: 'recipe',
                data: { recipeId: recipe.id },
                content: <RecipeCard recipe={recipe} />
              }}
              onDragEnd={handleDragEnd}
              className="cursor-move"
            />
          ))}
        </div>
      </iOS26EnhancedCard>
    </div>
  );

  return (
    <DragDropContainer>
      <div className="flex gap-4">
        {/* Recipe Sidebar */}
        {recipeSidebar}
        
        {/* Main Grid */}
        <div className="flex-1">
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
          </iOS26EnhancedCard>
        </div>
      </div>
    </DragDropContainer>
  );
}