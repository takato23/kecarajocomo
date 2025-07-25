'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Users, Star, Lock, X } from 'lucide-react';

import { Badge } from '@/components/design-system/Badge';
import { cn } from '@/lib/utils';

import type { MealSlot as MealSlotType, RecipeInfo } from '../types/planner';

// =============================================
// PROPS & INTERFACES
// =============================================

interface MealSlotProps {
  slot: MealSlotType;
  recipe?: RecipeInfo;
  isSelected?: boolean;
  isDragTarget?: boolean;
  isDropTarget?: boolean;
  showMealType?: boolean;
  compact?: boolean;
  
  // Callbacks
  onClick?: (slot: MealSlotType) => void;
  onRecipeSelect?: (slot: MealSlotType) => void;
  onClear?: (slot: MealSlotType) => void;
  onLock?: (slot: MealSlotType, locked: boolean) => void;
  
  // Drag & Drop
  onDragStart?: (slot: MealSlotType, event: React.DragEvent) => void;
  onDragEnd?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
}

// =============================================
// MEAL TYPE CONFIGURATION
// =============================================

const MEAL_CONFIG = {
  desayuno: {
    color: 'food-golden',
    icon: '☀️',
    label: 'Desayuno',
    timeRange: '6:00 - 10:00'
  },
  almuerzo: {
    color: 'food-warm',
    icon: '🌅',
    label: 'Almuerzo', 
    timeRange: '12:00 - 15:00'
  },
  merienda: {
    color: 'food-fresh',
    icon: '🌆',
    label: 'Merienda',
    timeRange: '16:00 - 18:00'
  },
  cena: {
    color: 'food-rich',
    icon: '🌙',
    label: 'Cena',
    timeRange: '19:00 - 22:00'
  }
} as const;

// =============================================
// MAIN COMPONENT
// =============================================

export const MealSlot: React.FC<MealSlotProps> = ({
  slot,
  recipe,
  isSelected = false,
  isDragTarget = false,
  isDropTarget = false,
  showMealType = true,
  compact = false,
  onClick,
  onRecipeSelect,
  onClear,
  onLock,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const mealConfig = MEAL_CONFIG[slot.mealType];
  const isEmpty = !slot.recipeId || !recipe;
  const isLocked = slot.isLocked || false;
  
  // =============================================
  // EVENT HANDLERS
  // =============================================
  
  const handleClick = useCallback(() => {
    if (isLocked) return;
    onClick?.(slot);
  }, [slot, isLocked, onClick]);
  
  const handleAddRecipe = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    onRecipeSelect?.(slot);
  }, [slot, isLocked, onRecipeSelect]);
  
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    onClear?.(slot);
  }, [slot, isLocked, onClear]);
  
  const handleLockToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLock?.(slot, !isLocked);
  }, [slot, isLocked, onLock]);
  
  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (isEmpty || isLocked) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(slot));
    onDragStart?.(slot, e);
  }, [slot, isEmpty, isLocked, onDragStart]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isLocked) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e);
  }, [isLocked, onDragOver]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (isLocked) return;
    
    e.preventDefault();
    onDrop?.(e);
  }, [isLocked, onDrop]);
  
  // =============================================
  // ANIMATIONS
  // =============================================
  
  const cardVariants = {
    idle: { 
      scale: 1, 
      rotate: 0,
      zIndex: 1
    },
    hover: { 
      scale: compact ? 1.02 : 1.03,
      rotate: 0.5,
      zIndex: 2
    },
    selected: {
      scale: 1.05,
      rotate: 1,
      zIndex: 3
    },
    dragging: {
      scale: 1.1,
      rotate: 3,
      zIndex: 100
    },
    dropTarget: {
      scale: 1.02,
      borderColor: `var(--color-${mealConfig.color}-500)`,
      backgroundColor: `var(--color-${mealConfig.color}-50)`
    }
  };
  
  const currentVariant = isDragTarget ? 'dragging' 
    : isDropTarget ? 'dropTarget'
    : isSelected ? 'selected'
    : isHovered ? 'hover' 
    : 'idle';
  
  // =============================================
  // RENDER HELPERS
  // =============================================
  
  const renderMealTypeIndicator = () => {
    if (!showMealType) return null;
    
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{mealConfig.icon}</span>
        <div className="flex-1">
          <Badge 
            variant={mealConfig.color as any}
            size="sm"
            className="text-xs font-medium"
          >
            {mealConfig.label}
          </Badge>
        </div>
        {isLocked && (
          <Lock 
            size={14} 
            className="text-gray-400"
            onClick={handleLockToggle}
          />
        )}
      </div>
    );
  };
  
  const renderEmptyState = () => (
    <div className="text-center py-4">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAddRecipe}
        className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
          "border-2 border-dashed transition-colors cursor-pointer",
          `border-${mealConfig.color}-300 hover:border-${mealConfig.color}-500`,
          `hover:bg-${mealConfig.color}-50`,
          isLocked && "opacity-50 cursor-not-allowed"
        )}
      >
        <Plus 
          size={20} 
          className={`text-${mealConfig.color}-500`}
        />
      </motion.div>
      
      {!compact && (
        <p className="text-xs text-gray-500 mt-2">
          {isLocked ? 'Bloqueado' : 'Agregar receta'}
        </p>
      )}
    </div>
  );
  
  const renderRecipeContent = () => {
    if (!recipe) return null;
    
    return (
      <div className="space-y-3">
        {/* Recipe image/placeholder */}
        <div className="relative">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-20 object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className={cn(
              "w-full h-20 rounded-lg flex items-center justify-center",
              `bg-gradient-to-br from-${mealConfig.color}-100 to-${mealConfig.color}-200`
            )}>
              <span className="text-2xl">{mealConfig.icon}</span>
            </div>
          )}
          
          {/* AI Generated badge */}
          {recipe.isAiGenerated && (
            <Badge
              variant="info"
              size="xs"
              className="absolute top-1 right-1"
            >
              AI
            </Badge>
          )}
        </div>
        
        {/* Recipe info */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm line-clamp-2">
            {recipe.name}
          </h4>
          
          {!compact && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {recipe.prepTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{recipe.prepTime + recipe.cookTime}min</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{slot.servings}</span>
              </div>
              
              {recipe.rating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-current text-yellow-400" />
                  <span>{recipe.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Dietary labels */}
          {!compact && recipe.dietaryLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.dietaryLabels.slice(0, 2).map(label => (
                <Badge 
                  key={label}
                  variant="outline" 
                  size="xs"
                  className="text-xs"
                >
                  {label}
                </Badge>
              ))}
              {recipe.dietaryLabels.length > 2 && (
                <Badge variant="outline" size="xs" className="text-xs">
                  +{recipe.dietaryLabels.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderActionButtons = () => {
    if (!showActions || isEmpty || isLocked) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute top-2 right-2 flex gap-1"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClear}
          className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 
                     flex items-center justify-center text-red-600 transition-colors"
        >
          <X size={12} />
        </motion.button>
      </motion.div>
    );
  };
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <motion.div
      variants={cardVariants}
      initial="idle"
      animate={currentVariant}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <iOS26LiquidCard
        variant="medium"
        interactive={!isLocked}
        shimmer={isHovered && !isEmpty}
        glow={isSelected}
        className={cn(
          "relative transition-all duration-200 cursor-pointer",
          compact ? "p-3" : "p-4",
          isSelected && `ring-2 ring-${mealConfig.color}-400`,
          isDropTarget && `bg-${mealConfig.color}-50/50`,
          isDragTarget && "opacity-60",
          isLocked && "opacity-75 cursor-not-allowed",
          isEmpty ? "min-h-[120px]" : compact ? "min-h-[140px]" : "min-h-[180px]"
        )}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        
        // Drag & Drop props
        draggable={!isEmpty && !isLocked}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Meal type indicator */}
        {renderMealTypeIndicator()}
        
        {/* Main content */}
        {isEmpty ? renderEmptyState() : renderRecipeContent()}
        
        {/* Action buttons overlay */}
        <AnimatePresence>
          {renderActionButtons()}
        </AnimatePresence>
        
        {/* Drop target indicator */}
        <AnimatePresence>
          {isDropTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 rounded-2xl border-2 border-dashed pointer-events-none",
                `border-${mealConfig.color}-400 bg-${mealConfig.color}-100/20`
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  `bg-${mealConfig.color}-500 text-white`
                )}>
                  <Plus size={16} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className={cn(
            "absolute -top-1 -right-1 w-4 h-4 rounded-full",
            `bg-${mealConfig.color}-500 border-2 border-white`
          )} />
        )}
      </iOS26LiquidCard>
    </motion.div>
  );
};

export default MealSlot;