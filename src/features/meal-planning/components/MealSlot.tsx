'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  Heart,
  Users,
  Edit2,
  X,
  Lock,
  Unlock,
  Sparkles,
  Flame,
  Star
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

import type { MealSlotProps } from '../types';

export function MealSlot({
  slot,
  dayOfWeek,
  mealType,
  isToday,
  isSelected,
  isHovered,
  onSlotClick,
  onRecipeSelect,
  onSlotClear,
  onSlotLock,
  onAIGenerate
}: MealSlotProps) {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';

  const recipe = slot?.recipe;
  const hasRecipe = Boolean(recipe);

  if (!hasRecipe) {
    // Empty slot
    return (
      <motion.div
        className={cn(
          "relative group h-24 md:h-28 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
          isToday && "ring-2 ring-blue-400/50"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onAIGenerate?.({ dayOfWeek, mealType })}
      >
        {/* Glass effect background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl" />
        <div className="absolute inset-[1px] bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm rounded-[15px]" />
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center p-3">
          <motion.div
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:bg-white/20 transition-colors"
            whileHover={{ rotate: 90 }}
          >
            <Plus className="w-4 h-4 text-white/60" />
          </motion.div>
          <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
            Agregar comida
          </p>
        </div>
      </motion.div>
    );
  }

  // Filled slot
  return (
    <motion.div
      className={cn(
        "relative group h-24 md:h-28 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
        isToday && "ring-2 ring-blue-400/50",
        isSelected && "ring-2 ring-purple-400/70 scale-105",
        slot?.isLocked && "ring-2 ring-yellow-400/50"
      )}
      whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSlotClick?.(slot)}
    >
      {/* Background image or gradient */}
      {recipe.image ? (
        <div className="absolute inset-0">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/80 via-gray-600/60 to-gray-700/80" />
      )}

      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm" />

      {/* Lock indicator */}
      {slot?.isLocked && (
        <div className="absolute top-2 left-2 p-1 bg-yellow-500/20 backdrop-blur-sm rounded-lg">
          <Lock className="w-3 h-3 text-yellow-400" />
        </div>
      )}

      {/* AI Generated indicator */}
      {recipe.isAiGenerated && (
        <div className="absolute top-2 right-2 p-1 bg-purple-500/20 backdrop-blur-sm rounded-lg">
          <Sparkles className="w-3 h-3 text-purple-400" />
        </div>
      )}

      {/* Content */}
      <div className="relative h-full p-3 flex flex-col justify-between">
        {/* Top section - Title and rating */}
        <div>
          <h4 className="text-sm font-semibold text-white line-clamp-2 mb-1">
            {recipe.name}
          </h4>
          {recipe.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-white/80">{recipe.rating}</span>
            </div>
          )}
        </div>

        {/* Bottom section - Stats and actions */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2 text-xs text-white/70">
            {recipe.nutrition?.calories && (
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                <span>{recipe.nutrition.calories}</span>
              </div>
            )}
            {recipe.prepTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{recipe.prepTime}m</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{recipe.servings}</span>
              </div>
            )}
          </div>

          {/* Action buttons - show on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onRecipeSelect?.(slot);
              }}
              className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <Edit2 className="w-3 h-3 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onSlotLock?.(slot, !slot?.isLocked);
              }}
              className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              {slot?.isLocked ? (
                <Unlock className="w-3 h-3 text-white" />
              ) : (
                <Lock className="w-3 h-3 text-white" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onSlotClear?.(slot);
              }}
              className="p-1.5 bg-red-500/20 backdrop-blur-sm rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Favorite indicator */}
      {recipe.isFavorite && (
        <div className="absolute bottom-2 left-2 p-1 bg-red-500/20 backdrop-blur-sm rounded-lg">
          <Heart className="w-3 h-3 text-red-400 fill-current" />
        </div>
      )}

      {/* Completion indicator */}
      {slot?.isCompleted && (
        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm">
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  );
}