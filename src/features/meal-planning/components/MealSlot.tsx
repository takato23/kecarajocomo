'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';
import {
  Plus,
  Lock,
  Unlock,
  Sparkles,
  MoreVertical,
  X,
  RefreshCw,
  Clock,
  Users,
  ChefHat,
  Star,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/enhanced-loading';
import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';

import type { MealSlot as MealSlotType, MealType, Recipe } from '../types';
import { MEAL_CONFIG } from '../types';
import { useGeminiMealPlanner } from '../hooks/useGeminiMealPlanner';

interface MealSlotProps {
  slot?: MealSlotType;
  dayOfWeek: number;
  mealType: MealType;
  isToday?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  isGeneratingAI?: boolean;
  onSlotClick?: (slot: MealSlotType) => void;
  onRecipeSelect?: () => void;
  onSlotClear?: (slot: MealSlotType) => void;
  onSlotLock?: (slot: MealSlotType, locked: boolean) => void;
  onAIGenerate?: () => void;
}

export function MealSlot({
  slot,
  dayOfWeek,
  mealType,
  isToday = false,
  isSelected = false,
  isHovered = false,
  isGeneratingAI = false,
  onSlotClick,
  onRecipeSelect,
  onSlotClear,
  onSlotLock,
  onAIGenerate
}: MealSlotProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { regenerateWithFeedback } = useGeminiMealPlanner();
  
  const config = MEAL_CONFIG[mealType];
  const hasRecipe = !!slot?.recipe;
  const isLocked = slot?.isLocked || false;
  const isCompleted = slot?.isCompleted || false;

  const handleRegenerate = async () => {
    if (!slot || !slot.recipe) return;
    
    setIsRegenerating(true);
    setShowMenu(false);
    
    try {
      const feedback = `Please suggest a different ${mealType} recipe for ${dayOfWeek}`;
      const result = await regenerateWithFeedback(feedback, {
        id: slot.id,
        userId: slot.id,
        weekStartDate: slot.date,
        weekEndDate: slot.date,
        preferences: {},
        constraints: {},
        meals: []
      } as any);
      
      if (result.success) {
        toast.success('Receta regenerada exitosamente');
      } else {
        toast.error('Error al regenerar la receta');
      }
    } catch (error) {
      logger.error('Failed to regenerate:', 'MealSlot', error);
      toast.error('Error al regenerar la receta');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLockToggle = () => {
    if (slot && onSlotLock) {
      onSlotLock(slot, !isLocked);
      setShowMenu(false);
    }
  };

  const handleClear = () => {
    if (slot && onSlotClear) {
      onSlotClear(slot);
      setShowMenu(false);
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        <iOS26EnhancedCard
          variant={isToday ? 'aurora' : 'glass'}
          elevation={isSelected ? 'high' : 'medium'}
          glowEffect={isToday}
          interactive
          className={cn(
            "relative h-32 cursor-pointer transition-all duration-300",
            "hover:shadow-lg",
            "md:h-32 h-36", // Taller on mobile for better touch targets
            isToday && "ring-2 ring-blue-400/50",
            isSelected && "ring-2 ring-purple-400",
            isCompleted && "opacity-75"
          )}
          onClick={() => {
            if (hasRecipe && slot && onSlotClick) {
              onSlotClick(slot);
            } else if (!hasRecipe && onRecipeSelect) {
              onRecipeSelect();
            }
          }}
        >
          {/* Background gradient */}
          <div
            className={cn(
              "absolute inset-0 opacity-10 rounded-3xl",
              "bg-gradient-to-br",
              config.gradient
            )}
            style={{
              boxShadow: isHovered ? `0 0 20px ${config.glowColor}` : undefined
            }}
          />

          {/* Lock indicator */}
          {isLocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 left-2 z-10"
            >
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          )}

          {/* Menu button and AI regenerate button */}
          {hasRecipe && (
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              {/* AI Regenerate button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRegenerate();
                }}
                disabled={isRegenerating || isGeneratingAI}
                className="w-6 h-6 bg-purple-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-purple-600/80 transition-colors disabled:opacity-50"
                title="Regenerar con IA"
              >
                {isRegenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                  </motion.div>
                ) : (
                  <RefreshCw className="w-3 h-3 text-white" />
                )}
              </motion.button>
              
              {/* Menu button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <MoreVertical className="w-3 h-3 text-white" />
              </motion.button>
            </div>
          )}

          {/* Content */}
          <div className="h-full flex flex-col p-3">
            {hasRecipe && slot?.recipe ? (
              <>
                {/* Recipe image */}
                {slot.recipe.image && (
                  <div className="absolute inset-0 opacity-20">
                    <img
                      src={slot.recipe.image}
                      alt={slot.recipe.name}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                )}

                {/* Recipe details */}
                <div className="relative z-10 flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                    {slot.recipe.name}
                  </h4>
                  
                  {/* Recipe meta */}
                  <div className="flex items-center gap-2 mt-1">
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <Clock className="w-3 h-3" />
                          <span>{slot.recipe.prepTime + slot.recipe.cookTime}m</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tiempo total de preparación</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <Users className="w-3 h-3" />
                          <span>{slot.servings}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Porciones</p>
                      </TooltipContent>
                    </Tooltip>

                    {slot.recipe.isAiGenerated && (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-3 h-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generado por IA</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Difficulty badge */}
                  <div className="flex items-center gap-1 mt-2">
                    <ChefHat className="w-3 h-3 text-gray-500" />
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      slot.recipe.difficulty === 'easy' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      slot.recipe.difficulty === 'medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      slot.recipe.difficulty === 'hard' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {slot.recipe.difficulty === 'easy' && 'Fácil'}
                      {slot.recipe.difficulty === 'medium' && 'Media'}
                      {slot.recipe.difficulty === 'hard' && 'Difícil'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 text-white" />
                </motion.div>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  Agregar comida
                </p>
                
                {/* AI Generate button for empty slots */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAIGenerate && !isGeneratingAI) onAIGenerate();
                  }}
                  disabled={isGeneratingAI}
                  className="mt-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full hover:from-purple-600 hover:to-pink-600 transition-all font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAI ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>{isGeneratingAI ? '...' : 'IA'}</span>
                </motion.button>
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {(isRegenerating || isGeneratingAI) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20"
            >
              <LoadingSpinner size="sm" />
              <p className="text-white text-xs mt-2 font-medium">
                {isGeneratingAI ? 'Generando con IA...' : 'Regenerando...'}
              </p>
            </motion.div>
          )}
        </iOS26EnhancedCard>

        {/* Dropdown menu */}
        <AnimatePresence>
          {showMenu && hasRecipe && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute top-10 right-0 z-50 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="py-1">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar con IA
                </button>
                
                <button
                  onClick={handleLockToggle}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  {isLocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Desbloquear
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Bloquear
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleClear}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <X className="w-4 h-4" />
                  Quitar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error tooltip */}
        {slot && !slot.recipe && slot.customMealName && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 right-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Comida personalizada sin receta</p>
            </TooltipContent>
          </Tooltip>
        )}
      </motion.div>
    </TooltipProvider>
  );
}