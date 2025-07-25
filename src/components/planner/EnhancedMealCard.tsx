'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Sparkles,
  ImageOff
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Types
export interface MealPlanEntry {
  id: string;
  userId: string;
  planDate: string;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  recipeId?: string;
  customMealName?: string;
  notes?: string;
  servings?: number;
  recipe?: {
    id: string;
    name: string;
    description?: string;
    preparationTime?: number;
    imageUrl?: string;
    isAIGenerated?: boolean;
    ingredients?: string[];
    macronutrients?: {
      proteins?: number;
      carbs?: number;
      fats?: number;
      calories?: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface EnhancedMealCardProps {
  meal: MealPlanEntry;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  onEdit?: (meal: MealPlanEntry) => void;
  onDelete?: (mealId: string) => void;
  onCopy?: (meal: MealPlanEntry) => void;
  onViewDetails?: (meal: MealPlanEntry) => void;
  className?: string;
}

const mealTypeStyles = {
  breakfast: {
    gradient: 'from-amber-400/20 to-orange-400/20',
    badge: 'bg-amber-100 text-amber-800',
    icon: '🌅'
  },
  lunch: {
    gradient: 'from-emerald-400/20 to-teal-400/20',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: '🍽️'
  },
  snack: {
    gradient: 'from-purple-400/20 to-pink-400/20',
    badge: 'bg-purple-100 text-purple-800',
    icon: '🍎'
  },
  dinner: {
    gradient: 'from-indigo-400/20 to-blue-400/20',
    badge: 'bg-indigo-100 text-indigo-800',
    icon: '🌙'
  }
};

export const EnhancedMealCard: React.FC<EnhancedMealCardProps> = React.memo(({
  meal,
  mealType,
  onEdit,
  onDelete,
  onCopy,
  onViewDetails,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const style = mealTypeStyles[mealType];
  const mealName = meal.customMealName || meal.recipe?.name || 'Sin nombre';
  const hasImage = meal.recipe?.imageUrl && !imageError;
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn("group relative", className)}
    >
      <iOS26LiquidCard
        variant="subtle"
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-br",
          style.gradient,
          "transition-all duration-300 ease-in-out",
          "hover:shadow-lg hover:shadow-black/10"
        )}
      >
        {/* Header with image or icon */}
        <div className="relative h-24 -mx-6 -mt-6 mb-4 overflow-hidden">
          {hasImage ? (
            <div className="relative h-full w-full">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-t-2xl" />
              )}
              <img
                src={meal.recipe?.imageUrl}
                alt={mealName}
                className={cn(
                  "h-full w-full object-cover rounded-t-2xl",
                  "transition-all duration-300",
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ) : (
            <div className={cn(
              "flex items-center justify-center h-full",
              "bg-gradient-to-br",
              style.gradient
            )}>
              {imageError ? (
                <ImageOff className="w-8 h-8 text-gray-400" />
              ) : (
                <span className="text-3xl">{style.icon}</span>
              )}
            </div>
          )}
          
          {/* Action menu - visible on hover */}
          <div className={cn(
            "absolute top-2 right-2 opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200"
          )}>
            <div className="relative">
              <iOS26LiquidButton
                variant="ghost"
                size="sm"
                className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </iOS26LiquidButton>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50"
                  >
                    <div className="py-1">
                      {onViewDetails && (
                        <button
                          onClick={() => {
                            onViewDetails(meal);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalles
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(meal);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </button>
                      )}
                      {onCopy && (
                        <button
                          onClick={() => {
                            onCopy(meal);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(meal.id);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Title and AI badge */}
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-base leading-tight text-gray-900">
              {mealName}
            </h3>
            {meal.recipe?.isAIGenerated && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <Sparkles className="w-3 h-3" />
                <span>IA</span>
              </div>
            )}
          </div>

          {/* Description */}
          {meal.recipe?.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {meal.recipe.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {meal.recipe?.preparationTime && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{meal.recipe.preparationTime} min</span>
              </div>
            )}
            {meal.servings && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{meal.servings} personas</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {meal.notes && (
            <div className="text-xs text-gray-500 italic">
              "{meal.notes}"
            </div>
          )}

          {/* Meal type badge */}
          <div className="flex justify-end">
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              style.badge
            )}>
              {style.icon} {mealType === 'breakfast' ? 'Desayuno' : 
                        mealType === 'lunch' ? 'Almuerzo' : 
                        mealType === 'snack' ? 'Merienda' : 'Cena'}
            </span>
          </div>
        </div>
      </iOS26LiquidCard>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.meal.id === nextProps.meal.id &&
    prevProps.meal.updatedAt === nextProps.meal.updatedAt &&
    prevProps.mealType === nextProps.mealType
  );
});

EnhancedMealCard.displayName = 'EnhancedMealCard';