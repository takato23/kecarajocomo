'use client';

import React from 'react';
import { 
  Clock, 
  Users, 
  ChefHat, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PlannedMeal, MealType } from '../types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MealCardProps {
  meal: PlannedMeal;
  onEdit?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onToggleComplete?: () => void;
  className?: string;
  compact?: boolean;
}

const MEAL_TYPE_CONFIG: Record<MealType, { icon: string; color: string; bgColor: string }> = {
  breakfast: { 
    icon: '🌅', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20' 
  },
  lunch: { 
    icon: '☀️', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20' 
  },
  dinner: { 
    icon: '🌙', 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20' 
  },
  snack: { 
    icon: '🍿', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20' 
  },
  dessert: { 
    icon: '🍰', 
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20' 
  },
};

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onEdit,
  onDelete,
  onRegenerate,
  onToggleComplete,
  className,
  compact = false,
}) => {
  const { recipe, mealType, isCompleted } = meal;
  const config = MEAL_TYPE_CONFIG[mealType];

  if (!recipe) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "p-3 rounded-lg border transition-all",
          config.bgColor,
          isCompleted && "opacity-60",
          className
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-sm truncate",
              isCompleted && "line-through"
            )}>
              {recipe.name}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {recipe.prepTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTime}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {meal.servings}
              </span>
            </div>
          </div>
          {onToggleComplete && (
            <button
              onClick={onToggleComplete}
              className="p-1 hover:bg-background/50 rounded transition-colors"
            >
              {isCompleted ? (
                <X className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative bg-card border rounded-lg overflow-hidden transition-all",
        "hover:shadow-lg hover:border-primary/50",
        isCompleted && "opacity-60",
        className
      )}
    >
      {/* Header */}
      <div className={cn("p-4", config.bgColor)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <span className={cn("text-sm font-medium capitalize", config.color)}>
                {mealType}
              </span>
              <h3 className={cn(
                "font-semibold text-lg",
                isCompleted && "line-through"
              )}>
                {recipe.name}
              </h3>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 hover:bg-background/50 rounded transition-colors"
                title="Regenerate meal"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-background/50 rounded transition-colors"
                title="Edit meal"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-background/50 rounded transition-colors text-destructive"
                title="Remove meal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image */}
      {recipe.image && (
        <div className="relative h-48 w-full">
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {recipe.prepTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.prepTime + (recipe.cookTime || 0)}m total</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{meal.servings} servings</span>
          </div>
          {recipe.difficulty && (
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span className="capitalize">{recipe.difficulty}</span>
            </div>
          )}
        </div>

        {/* Nutrition Summary */}
        {recipe.nutritionalInfo && (
          <div className="flex items-center gap-4 pt-2 border-t text-xs">
            <span>{recipe.nutritionalInfo.calories} cal</span>
            <span>{recipe.nutritionalInfo.protein}g protein</span>
            <span>{recipe.nutritionalInfo.carbs}g carbs</span>
            <span>{recipe.nutritionalInfo.fat}g fat</span>
          </div>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-accent rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Customizations */}
        {meal.customizations && meal.customizations.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium mb-1">Customizations:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {meal.customizations.map((custom, index) => (
                <li key={index}>
                  • {custom.action} {custom.substituteIngredient?.name || 'ingredient'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complete Button */}
        {onToggleComplete && (
          <button
            onClick={onToggleComplete}
            className={cn(
              "w-full mt-2 py-2 rounded-lg font-medium transition-all",
              isCompleted
                ? "bg-accent text-accent-foreground hover:bg-accent/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isCompleted ? 'Mark as Planned' : 'Mark as Completed'}
          </button>
        )}
      </div>
    </motion.div>
  );
};