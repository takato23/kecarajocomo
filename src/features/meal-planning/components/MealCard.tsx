/**
 * MealCard - Tarjeta optimizada para mostrar comidas en el planificador
 * Drag & Drop, macros, costo, tiempo - Design system KeCard
 */

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Zap, 
  Beef, 
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';

import { 
  KeCard, 
  KeCardHeader, 
  KeCardTitle, 
  KeCardContent, 
  KeCardFooter,
  KeBadge,
  KeButton
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface MealData {
  id?: string;
  title: string;
  ingredients?: Array<{
    name: string;
    quantity: number;
    unit: string;
    from_pantry?: boolean;
  }>;
  macros?: {
    kcal: number;
    protein_g: number;
    carbs_g?: number;
    fat_g?: number;
  };
  time_minutes: number;
  cost_estimate_ars?: number;
  image_url?: string;
  tags?: string[];
}

interface MealCardProps {
  meal?: MealData;
  mealType: 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
  dayOfWeek: number;
  isEmpty?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  className?: string;
}

const mealTypeConfig = {
  desayuno: {
    label: 'Desayuno',
    emoji: '☕',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20'
  },
  almuerzo: {
    label: 'Almuerzo', 
    emoji: '☀️',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  merienda: {
    label: 'Merienda',
    emoji: '🍎', 
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  cena: {
    label: 'Cena',
    emoji: '🌙',
    color: 'from-purple-400 to-pink-500', 
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  }
};

export const MealCard = memo<MealCardProps>(({
  meal,
  mealType,
  dayOfWeek,
  isEmpty = false,
  isDragging = false,
  isDropTarget = false,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  className
}) => {
  const config = mealTypeConfig[mealType];

  // Empty card state
  if (isEmpty || !meal) {
    return (
      <KeCard
        variant="outline"
        className={cn(
          "min-h-[120px] cursor-pointer transition-all duration-200",
          "border-dashed border-2 hover:border-green-300 dark:hover:border-green-600",
          isDropTarget && "border-green-400 bg-green-50/50 dark:bg-green-900/20 scale-105",
          config.bgColor,
          className
        )}
        onClick={onClick}
      >
        <KeCardContent className="flex flex-col items-center justify-center h-full py-6">
          <div className="text-4xl mb-2 opacity-60">
            {config.emoji}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Agregar {config.label.toLowerCase()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Tap para elegir receta
          </p>
        </KeCardContent>
      </KeCard>
    );
  }

  return (
    <motion.div
      layout
      initial={false}
      animate={{ 
        scale: isDragging ? 0.95 : 1,
        opacity: isDragging ? 0.8 : 1,
        rotate: isDragging ? 5 : 0
      }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
    >
      <KeCard
        variant="default"
        hoverable={!isDragging}
        clickable
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-200",
          isDragging && "shadow-xl shadow-green-500/20 z-50",
          isDropTarget && "ring-2 ring-green-400 ring-offset-2"
        )}
        onClick={onClick}
      >
        {/* Header con título y tipo */}
        <KeCardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{config.emoji}</span>
                <KeBadge 
                  variant="secondary" 
                  size="sm"
                  className={cn("bg-gradient-to-r text-white", config.color)}
                >
                  {config.label}
                </KeBadge>
              </div>
              <KeCardTitle className="text-sm font-semibold truncate">
                {meal.title}
              </KeCardTitle>
            </div>

            {/* Menu button */}
            <KeButton
              variant="ghost"
              size="sm"
              className="p-1 h-auto min-h-0 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Show context menu
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </KeButton>
          </div>
        </KeCardHeader>

        {/* Content con métricas */}
        <KeCardContent className="space-y-3">
          {/* Macros row */}
          {meal.macros && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-orange-500" />
                <span className="font-medium">{meal.macros.kcal} kcal</span>
              </div>
              <div className="flex items-center gap-1">
                <Beef className="w-3 h-3 text-red-500" />
                <span className="font-medium">{meal.macros.protein_g}g prot</span>
              </div>
            </div>
          )}

          {/* Time and cost row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{meal.time_minutes} min</span>
            </div>
            {meal.cost_estimate_ars && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-500" />
                <span>${(meal.cost_estimate_ars / 1000).toFixed(1)}k</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meal.tags.slice(0, 2).map((tag, index) => (
                <KeBadge 
                  key={index} 
                  variant="default" 
                  size="sm"
                  className="text-xs"
                >
                  {tag}
                </KeBadge>
              ))}
              {meal.tags.length > 2 && (
                <KeBadge variant="default" size="sm" className="text-xs">
                  +{meal.tags.length - 2}
                </KeBadge>
              )}
            </div>
          )}

          {/* Ingredients preview */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p className="truncate">
                {meal.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
                {meal.ingredients.length > 3 && '...'}
              </p>
            </div>
          )}
        </KeCardContent>

        {/* Actions footer (mobile only) */}
        <KeCardFooter className="pt-3 block md:hidden">
          <div className="flex gap-2">
            <KeButton
              variant="ghost"
              size="sm"
              leftIcon={<Edit className="w-3 h-3" />}
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Editar
            </KeButton>
            <KeButton
              variant="ghost" 
              size="sm"
              leftIcon={<Copy className="w-3 h-3" />}
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              Copiar
            </KeButton>
          </div>
        </KeCardFooter>

        {/* Hover overlay (desktop) */}
        <div className="absolute inset-0 bg-green-500/10 opacity-0 hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center">
          <div className="flex gap-2">
            <KeButton
              variant="secondary"
              size="sm"
              leftIcon={<Edit className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Editar
            </KeButton>
            <KeButton
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              Copiar
            </KeButton>
          </div>
        </div>

        {/* Drag handle indicator */}
        {isDragging && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </KeCard>
    </motion.div>
  );
});

MealCard.displayName = 'MealCard';