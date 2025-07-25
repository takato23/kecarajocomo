'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  Users,
  Calendar,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Sunrise,
  Star,
  X,
  ShoppingCart
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { iOS26EnhancedCard, iOS26LiquidButton } from '@/components/ios26';

// Tipos simples
interface Recipe {
  id: string;
  name: string;
  image?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  rating?: number;
}

interface MealSlot {
  id: string;
  dayOfWeek: number;
  mealType: string;
  recipeId?: string;
  servings: number;
}

interface SimpleDragDropGridProps {
  weekPlan: { slots: MealSlot[] };
  recipes: Record<string, Recipe>;
  currentWeek: Date;
  onRecipeAssign: (recipeId: string, dayIndex: number, mealType: string) => void;
  onSlotClear: (slot: MealSlot) => void;
  onGenerateWeek: () => void;
  onShoppingList: () => void;
}

const MEAL_CONFIG = {
  desayuno: {
    label: 'Desayuno',
    icon: Coffee,
    emoji: '☕',
    gradient: 'from-amber-400 to-orange-400',
    time: '7:00 - 10:00'
  },
  almuerzo: {
    label: 'Almuerzo',
    icon: Sun,
    emoji: '☀️',
    gradient: 'from-blue-400 to-cyan-400',
    time: '12:00 - 14:00'
  },
  cena: {
    label: 'Cena',
    icon: Moon,
    emoji: '🌙',
    gradient: 'from-purple-400 to-pink-400',
    time: '19:00 - 21:00'
  },
  snack: {
    label: 'Snack',
    icon: Sunrise,
    emoji: '🍎',
    gradient: 'from-green-400 to-emerald-400',
    time: '16:00 - 17:00'
  }
};

export default function SimpleDragDropGrid({
  weekPlan,
  recipes,
  currentWeek,
  onRecipeAssign,
  onSlotClear,
  onGenerateWeek,
  onShoppingList
}: SimpleDragDropGridProps) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mealTypes = ['desayuno', 'almuerzo', 'cena', 'snack'];
  
  const [draggedRecipe, setDraggedRecipe] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const getSlotForDay = useCallback((dayIndex: number, mealType: string) => {
    return weekPlan.slots.find(slot => slot.dayOfWeek === dayIndex && slot.mealType === mealType);
  }, [weekPlan.slots]);

  const filledSlots = weekPlan.slots.filter(slot => slot.recipeId).length;
  const progress = Math.round((filledSlots / 28) * 100);

  // Drag handlers simples
  const handleDragStart = (recipeId: string) => {
    setDraggedRecipe(recipeId);
  };

  const handleDragEnd = () => {
    setDraggedRecipe(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlot(slotId);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number, mealType: string) => {
    e.preventDefault();
    if (draggedRecipe) {
      onRecipeAssign(draggedRecipe, dayIndex, mealType);
    }
    setDraggedRecipe(null);
    setDragOverSlot(null);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Panel de recetas - Simple lista */}
      <div className="w-80 hidden lg:block">
        <iOS26EnhancedCard variant="ocean" elevation="medium" className="h-full">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Recetas
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Arrastra al calendario
            </p>
          </div>
          
          <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
            {Object.values(recipes).map((recipe) => (
              <motion.div
                key={recipe.id}
                draggable
                onDragStart={() => handleDragStart(recipe.id)}
                onDragEnd={handleDragEnd}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-3 rounded-xl cursor-move transition-all",
                  "bg-white/10 hover:bg-white/20 backdrop-blur-md",
                  "border border-white/20",
                  draggedRecipe === recipe.id && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {recipe.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {recipe.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {recipe.rating}
                          </span>
                        </div>
                      )}
                      {recipe.prepTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {recipe.prepTime}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </iOS26EnhancedCard>
      </div>

      {/* Grid principal */}
      <div className="flex-1">
        <iOS26EnhancedCard variant="aurora" elevation="high">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Planificador Semanal
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filledSlots} de 28 comidas • {progress}% completado
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <iOS26LiquidButton
                  variant="glass"
                  size="sm"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={onGenerateWeek}
                >
                  Generar con IA
                </iOS26LiquidButton>
                
                <iOS26LiquidButton
                  variant="glass"
                  size="sm"
                  leftIcon={<ShoppingCart className="w-4 h-4" />}
                  onClick={onShoppingList}
                >
                  Lista de Compras
                </iOS26LiquidButton>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* Grid de comidas */}
          <div className="p-6">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {days.map((day, index) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Slots de comidas */}
            {mealTypes.map((mealType) => (
              <div key={mealType} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "text-sm font-medium text-gray-800 dark:text-gray-200"
                  )}>
                    {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].emoji} {MEAL_CONFIG[mealType as keyof typeof MEAL_CONFIG].label}
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {days.map((_, dayIndex) => {
                    const slot = getSlotForDay(dayIndex, mealType);
                    const recipe = slot?.recipeId ? recipes[slot.recipeId] : null;
                    const slotId = `${dayIndex}-${mealType}`;
                    const isOver = dragOverSlot === slotId;

                    return (
                      <motion.div
                        key={slotId}
                        onDragOver={(e) => handleDragOver(e, slotId)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dayIndex, mealType)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "relative h-20 rounded-lg transition-all cursor-pointer",
                          "border-2 border-dashed",
                          recipe 
                            ? "bg-white/10 border-white/20" 
                            : "bg-white/5 border-white/10",
                          isOver && "border-blue-500 bg-blue-500/10",
                          "hover:border-white/30"
                        )}
                      >
                        {recipe ? (
                          <div className="relative h-full p-2 group">
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                              {recipe.name}
                            </div>
                            <button
                              onClick={() => slot && onSlotClear(slot)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </iOS26EnhancedCard>
      </div>
    </div>
  );
}