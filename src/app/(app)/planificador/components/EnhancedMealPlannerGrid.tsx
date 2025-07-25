'use client';

import React, { useState } from 'react';
import { Plus, Clock, Heart, Users, Calendar, Sparkles, ChefHat, Zap, Star, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';


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
  };
}

interface MealSlot {
  id: string;
  dayOfWeek: number;
  mealType: string;
  recipeId?: string;
  servings: number;
}

interface WeekPlan {
  id: string;
  slots: MealSlot[];
}

interface EnhancedMealPlannerGridProps {
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

export default function EnhancedMealPlannerGrid({
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
}: EnhancedMealPlannerGridProps) {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const mealTypes = ['desayuno', 'almuerzo', 'cena', 'snack'];
  const mealLabels = {
    desayuno: 'Desayuno',
    almuerzo: 'Almuerzo', 
    cena: 'Cena',
    snack: 'Snack'
  };

  // State for mobile day navigation
  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today;
  });

  const getSlotForDay = (dayIndex: number, mealType: string) => {
    return weekPlan.slots.find(slot => slot.dayOfWeek === dayIndex && slot.mealType === mealType);
  };

  const renderMealSlot = (dayIndex: number, mealType: string) => {
    const slot = getSlotForDay(dayIndex, mealType);
    const recipe = slot?.recipeId ? recipes[slot.recipeId] : null;
    const isSelected = slot ? selectedSlots.includes(slot.id) : false;
    const todayClass = isToday(dayIndex) ? 'ring-2 ring-blue-400/50' : '';

    if (!slot || !recipe) {
      return (
        <div 
          key={`${dayIndex}-${mealType}`}
          className={cn(
            "w-full h-full min-h-[40px] md:min-h-[70px] lg:min-h-[80px] flex flex-col items-center justify-center rounded-2xl cursor-pointer group relative overflow-hidden",
            isSelected && "ring-1 ring-blue-400/30",
            todayClass
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            transition: 'none'
          }}
          onClick={() => onAIGenerate({ dayOfWeek: dayIndex, mealType } as MealSlot)}
        >
          
          <div className="relative text-center z-10">
            <div className={cn(
              "w-5 h-5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl mx-auto mb-0.5 flex items-center justify-center shadow-md bg-gradient-to-br",
              getMealIconBg(mealType)
            )}>
              <Plus className="w-2.5 h-2.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white drop-shadow-sm" />
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 hidden sm:block"
               style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              Agregar
            </p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:block mt-0.5"
               style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              {mealLabels[mealType as keyof typeof mealLabels]}
            </p>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 block sm:hidden"
               style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              {mealLabels[mealType as keyof typeof mealLabels]}
            </p>
          </div>
        </div>
      );
    }

    const difficultyColor = {
      'easy': 'text-green-500',
      'medium': 'text-yellow-500', 
      'hard': 'text-red-500'
    }[recipe.difficulty || 'easy'] || 'text-gray-600 dark:text-gray-400';

    return (
      <div 
        key={slot.id}
        className={cn(
          "w-full h-full min-h-[40px] md:min-h-[70px] lg:min-h-[80px] p-1 md:p-2.5 cursor-pointer rounded-2xl group relative overflow-hidden",
          isSelected && "ring-1 ring-blue-400/30",
          todayClass
        )}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          transition: 'none'
        }}
        onClick={() => onSlotClick(slot)}
      >
        {/* Indicador superior estilo iOS */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r rounded-t-3xl shadow-sm",
          getMealGradient(mealType)
        )} />
        
        {/* Glow effect premium */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
        
        {/* Contenido principal */}
        <div className="h-full flex flex-col justify-between relative z-10 pt-1">
          {/* Header con título y rating */}
          <div className="flex-1 min-h-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 leading-tight line-clamp-1 sm:line-clamp-2 flex-1 pr-1"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                {recipe.name}
              </h4>
              {recipe.rating && (
                <div className="flex items-center gap-1 ml-2 bg-yellow-50/80 px-2 py-1 rounded-2xl backdrop-blur-sm">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-bold text-yellow-700"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    {recipe.rating}
                  </span>
                </div>
              )}
            </div>
            
            {/* Info row premium - tiempo y calorías - oculto en mobile small */}
            <div className="hidden sm:flex items-center gap-2 mb-2">
              {recipe.prepTime && (
                <div className="flex items-center gap-1 bg-gray-50/90 backdrop-blur-sm px-2 py-1 rounded-2xl border border-black/5">
                  <Clock className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    {recipe.prepTime + (recipe.cookTime || 0)}m
                  </span>
                </div>
              )}
              {recipe.nutrition?.calories && (
                <div className="bg-blue-50/90 backdrop-blur-sm text-blue-700 px-2 py-1 rounded-2xl border border-blue-200/50">
                  <span className="text-xs font-bold"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    {recipe.nutrition.calories} cal
                  </span>
                </div>
              )}
            </div>

            {/* Tags de dieta premium - oculto en mobile small */}
            {recipe.dietaryLabels && recipe.dietaryLabels.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1 mb-2">
                {recipe.dietaryLabels.slice(0, 1).map((label, idx) => (
                  <span key={idx} 
                        className="text-xs bg-green-50/90 text-green-700 px-2 py-1 rounded-2xl font-bold backdrop-blur-sm border border-green-200/50"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer premium - simplificado en mobile */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 bg-gray-50/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl border border-black/5">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-700 dark:text-gray-300" />
                <span className="text-xs font-bold text-gray-700"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                  {recipe.servings || slot.servings}
                </span>
              </div>
              <div className={cn("p-0.5 sm:p-1 rounded-lg sm:rounded-xl", difficultyColor === 'text-green-500' ? 'bg-green-50' : difficultyColor === 'text-yellow-500' ? 'bg-yellow-50' : 'bg-red-50')}>
                <ChefHat className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", difficultyColor)} />
              </div>
            </div>
            
            {/* Acciones hover premium - ocultas en mobile pequeño */}
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button className="p-2 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all border border-black/5 shadow-sm">
                <Edit2 className="w-3 h-3 text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors" />
              </button>
              <button className="p-2 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all border border-black/5 shadow-sm">
                <Heart className={cn(
                  "w-3 h-3 transition-all",
                  recipe.isFavorite ? "text-red-500 fill-current scale-110" : "text-gray-500 dark:text-gray-400 hover:text-red-500 hover:scale-110"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Generated badge premium */}
        {recipe.isAiGenerated && (
          <div className="absolute top-3 right-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white p-2 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20"
               style={{ boxShadow: '0 4px 16px rgba(147, 51, 234, 0.3)' }}>
            <Zap className="w-3 h-3" />
          </div>
        )}
      </div>
    );
  };

  const getMealGradient = (mealType: string) => {
    const gradients = {
      desayuno: 'from-amber-200 to-orange-300',
      almuerzo: 'from-blue-200 to-cyan-300', 
      cena: 'from-purple-200 to-pink-300',
      snack: 'from-green-200 to-emerald-300'
    };
    return gradients[mealType as keyof typeof gradients] || 'from-gray-200 to-gray-300';
  };

  const getMealIconBg = (mealType: string) => {
    const backgrounds = {
      desayuno: 'from-amber-400 to-orange-500',
      almuerzo: 'from-blue-400 to-cyan-500', 
      cena: 'from-purple-400 to-pink-500',
      snack: 'from-green-400 to-emerald-500'
    };
    return backgrounds[mealType as keyof typeof backgrounds] || 'from-gray-400 to-gray-500';
  };

  const getCurrentDate = (dayIndex: number) => {
    const date = new Date(currentWeek);
    const dayOfWeek = date.getDay();
    const diff = dayIndex - dayOfWeek;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const isToday = (dayIndex: number) => {
    const date = getCurrentDate(dayIndex);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="relative">
      {/* Glow effect behind the calendar */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-60 dark:opacity-20" />
      
      <div className="relative rounded-3xl overflow-hidden" 
           style={{ 
           background: isDarkMode ? 'rgba(24, 24, 27, 0.4)' : 'rgba(255, 255, 255, 0.1)',
           backdropFilter: 'blur(50px)',
           WebkitBackdropFilter: 'blur(50px)',
           border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.25)',
           boxShadow: isDarkMode ? `
             inset 2px 2px 4px rgba(255, 255, 255, 0.05),
             inset -2px -2px 4px rgba(0, 0, 0, 0.3),
             8px 8px 20px rgba(0, 0, 0, 0.5),
             0 0 20px rgba(139, 92, 246, 0.05)
           ` : `
             inset 8px 8px 16px rgba(255, 255, 255, 0.5),
             inset -8px -8px 16px rgba(0, 0, 0, 0.05),
             20px 20px 40px rgba(0, 0, 0, 0.15),
             -8px -8px 16px rgba(255, 255, 255, 0.8),
             0 0 60px rgba(139, 92, 246, 0.1)
           `,
           transform: 'perspective(1500px) rotateX(2deg) translateZ(0)'
         }}>
      {/* Header estilo iOS */}
      <div className="px-5 py-4 border-b"
           style={{
             background: 'rgba(255, 255, 255, 0.08)',
             backdropFilter: 'blur(30px)',
             WebkitBackdropFilter: 'blur(30px)',
             borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
             boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3)'
           }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            Planificador
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={onGenerateWeek}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                boxShadow: `
                  inset 1px 1px 2px rgba(255, 255, 255, 0.3),
                  inset -1px -1px 2px rgba(0, 0, 0, 0.2),
                  4px 4px 10px rgba(0, 0, 0, 0.2),
                  -1px -1px 3px rgba(255, 255, 255, 0.1)
                `,
                transform: 'perspective(800px) rotateX(8deg)'
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Generar con IA</span>
              <span className="inline sm:hidden">IA</span>
            </button>
            <button 
              onClick={onShoppingList}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl transition-all duration-200 active:scale-95 border border-black/5 dark:border-white/10 hover:scale-105"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                boxShadow: `
                  inset 2px 2px 5px rgba(255, 255, 255, 0.8),
                  inset -2px -2px 5px rgba(0, 0, 0, 0.1),
                  4px 4px 10px rgba(0, 0, 0, 0.15),
                  -1px -1px 3px rgba(255, 255, 255, 0.9)
                `,
                transform: 'perspective(800px) rotateX(8deg)'
              }}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Vista Desktop: Grid tradicional */}
      <div className="hidden md:block p-2 md:p-3">
        <div className="space-y-3">
          {/* Header row estilo iOS */}
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {days.map((day, index) => (
              <div key={day} className="text-center">
                <div className={cn(
                  "relative text-sm font-bold px-2 py-1.5 rounded-xl shadow-sm",
                  isToday(index) 
                    ? "text-white scale-105" 
                    : "text-gray-800 dark:text-gray-200"
                )}
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                  background: isToday(index) 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(99, 102, 241, 0.9))'
                    : 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  border: `1px solid ${isToday(index) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                  boxShadow: isToday(index)
                    ? `
                      inset 2px 2px 4px rgba(255, 255, 255, 0.4),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.1),
                      0 0 20px rgba(59, 130, 246, 0.5),
                      4px 4px 8px rgba(0, 0, 0, 0.2)
                    `
                    : `
                      inset 3px 3px 6px rgba(255, 255, 255, 0.5),
                      inset -3px -3px 6px rgba(0, 0, 0, 0.05),
                      3px 3px 8px rgba(0, 0, 0, 0.1)
                    `
                }}
                >
                  <div className="hidden sm:block">{day.slice(0, 3)}</div>
                  <div className="block sm:hidden">{day.slice(0, 1)}</div>
                  {isToday(index) && (
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur opacity-40 -z-10" />
                  )}
                </div>
                <div className={cn(
                  "text-xs font-bold mt-1",
                  isToday(index) 
                    ? "text-blue-600 scale-105" 
                    : "text-gray-700 dark:text-gray-300"
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
                >
                  {getCurrentDate(index).getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Meal rows sin etiquetas laterales */}
          {mealTypes.map((mealType) => (
            <div key={mealType} className="space-y-1">
              {/* Título opcional de la comida (solo visible en pantallas grandes si se desea) */}
              <div className="hidden xl:block">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                  <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", getMealIconBg(mealType))} />
                  {mealLabels[mealType as keyof typeof mealLabels]}
                </h4>
              </div>
              
              {/* Grid de slots para esta comida */}
              <div className="grid grid-cols-7 gap-2 md:gap-3">
                {days.map((_, dayIndex) => (
                  <div key={`${dayIndex}-${mealType}`} className="w-full">
                    {renderMealSlot(dayIndex, mealType)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vista Mobile: Un día a la vez */}
      <div className="block md:hidden">
        <div className="p-3">
          {/* Day Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1))}
              className="p-2 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.3), inset -2px -2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <ChevronLeft className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                {days[currentDayIndex]}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {getCurrentDate(currentDayIndex).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </p>
            </div>

            <button
              onClick={() => setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1))}
              className="p-2 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.3), inset -2px -2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <ChevronRight className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            </button>
          </div>

          {/* Day Dots Indicator */}
          <div className="flex justify-center gap-1.5 mb-4">
            {days.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentDayIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentDayIndex === index 
                    ? "w-6 bg-gradient-to-r from-blue-500 to-purple-500" 
                    : "bg-gray-300"
                )}
              />
            ))}
          </div>

          {/* Current Day Meals */}
          <div className="space-y-3">
            {mealTypes.map((mealType) => (
              <div key={mealType} 
                   className="relative rounded-2xl p-4"
                   style={{
                     background: 'rgba(255, 255, 255, 0.12)',
                     backdropFilter: 'blur(30px)',
                     WebkitBackdropFilter: 'blur(30px)',
                     border: '1px solid rgba(255, 255, 255, 0.25)',
                     boxShadow: `
                       inset 6px 6px 12px rgba(255, 255, 255, 0.4),
                       inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                       10px 10px 25px rgba(0, 0, 0, 0.12),
                       -4px -4px 10px rgba(255, 255, 255, 0.7)
                     `,
                   }}>
                {/* Meal Type Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full bg-gradient-to-r", getMealIconBg(mealType))} />
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
                      {mealLabels[mealType as keyof typeof mealLabels]}
                    </h3>
                  </div>
                  {/* Quick actions could go here */}
                </div>

                {/* Meal Slot */}
                <div className="h-24">
                  {renderMealSlot(currentDayIndex, mealType)}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Quick Actions */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={onGenerateWeek}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl"
              style={{ 
                boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.3), inset -2px -2px 4px rgba(0, 0, 0, 0.2), 4px 4px 10px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Sparkles className="w-4 h-4" />
              Generar con IA
            </button>
            <button 
              onClick={onShoppingList}
              className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 rounded-2xl"
              style={{ 
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.5), inset -2px -2px 4px rgba(0, 0, 0, 0.05), 4px 4px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Stats premium estilo iPhone - solo en desktop */}
      <div className="hidden md:block p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 pt-3 border-t border-black/5">
          <div className="text-center p-3 rounded-2xl hover:scale-105 transition-all duration-300"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: `
                   inset 6px 6px 12px rgba(255, 255, 255, 0.5),
                   inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                   12px 12px 30px rgba(59, 130, 246, 0.15),
                   -4px -4px 8px rgba(255, 255, 255, 0.8)
                 `,
                 transform: 'perspective(1000px) rotateX(5deg)'
               }}>
            <div className="text-2xl font-black bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
              {weekPlan.slots.filter(s => s.recipeId).length}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              Comidas
            </div>
          </div>
          <div className="text-center p-3 rounded-2xl hover:scale-105 transition-all duration-300"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: `
                   inset 6px 6px 12px rgba(255, 255, 255, 0.5),
                   inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                   12px 12px 30px rgba(147, 51, 234, 0.15),
                   -4px -4px 8px rgba(255, 255, 255, 0.8)
                 `,
                 transform: 'perspective(1000px) rotateX(5deg)'
               }}>
            <div className="text-2xl font-black bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
              {new Set(weekPlan.slots.filter(s => s.recipeId).map(s => s.recipeId)).size}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              Recetas
            </div>
          </div>
          <div className="text-center p-3 rounded-2xl hover:scale-105 transition-all duration-300"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: `
                   inset 6px 6px 12px rgba(255, 255, 255, 0.5),
                   inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                   12px 12px 30px rgba(34, 197, 94, 0.15),
                   -4px -4px 8px rgba(255, 255, 255, 0.8)
                 `,
                 transform: 'perspective(1000px) rotateX(5deg)'
               }}>
            <div className="text-2xl font-black bg-gradient-to-br from-green-500 to-green-600 bg-clip-text text-transparent"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
              {weekPlan.slots.reduce((sum, slot) => sum + slot.servings, 0)}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              Porciones
            </div>
          </div>
          <div className="text-center p-3 rounded-2xl hover:scale-105 transition-all duration-300"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(30px)',
                 WebkitBackdropFilter: 'blur(30px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 boxShadow: `
                   inset 6px 6px 12px rgba(255, 255, 255, 0.5),
                   inset -6px -6px 12px rgba(0, 0, 0, 0.05),
                   12px 12px 30px rgba(249, 115, 22, 0.15),
                   -4px -4px 8px rgba(255, 255, 255, 0.8)
                 `,
                 transform: 'perspective(1000px) rotateX(5deg)'
               }}>
            <div className="text-2xl font-black bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
              {Math.round((weekPlan.slots.filter(s => s.recipeId).length / 28) * 100)}%
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1"
                 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              Completo
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}