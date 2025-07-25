'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Star, 
  Lock, 
  X, 
  Sparkles,
  ChefHat,
  Flame,
  Heart,
  Leaf,
  Fish,
  Beef,
  Timer,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

import { Badge } from '@/components/design-system/Badge';
import { cn } from '@/lib/utils';
import { iOS26EnhancedCard, iOS26LiquidButton } from '@/components/ios26';

import type { MealSlot as MealSlotType, RecipeInfo } from '../types/planner';


// =============================================
// ENHANCED PROPS & INTERFACES
// =============================================

interface EnhancedMealSlotProps {
  slot: MealSlotType;
  recipe?: RecipeInfo;
  dayName: string;
  dateLabel: string;
  isToday?: boolean;
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
  onAIGenerate?: (slot: MealSlotType) => void;
  
  // Drag & Drop
  onDragStart?: (slot: MealSlotType, event: React.DragEvent) => void;
  onDragEnd?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
}

// =============================================
// ENHANCED MEAL TYPE CONFIGURATION
// =============================================

const MEAL_CONFIG = {
  desayuno: {
    color: 'golden',
    gradient: 'from-amber-400/20 to-yellow-500/20',
    icon: '☀️',
    label: 'Desayuno',
    timeRange: '6:00 - 10:00',
    bgPattern: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
    borderGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)] dark:shadow-[0_0_10px_rgba(251,191,36,0.1)]',
    liquidVariant: 'sunset' as const
  },
  almuerzo: {
    color: 'warm',
    gradient: 'from-orange-400/20 to-red-500/20',
    icon: '🌅',
    label: 'Almuerzo', 
    timeRange: '12:00 - 15:00',
    bgPattern: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
    borderGlow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)] dark:shadow-[0_0_10px_rgba(249,115,22,0.1)]',
    liquidVariant: 'sunset' as const
  },
  merienda: {
    color: 'fresh',
    gradient: 'from-emerald-400/20 to-teal-500/20',
    icon: '🌆',
    label: 'Merienda',
    timeRange: '16:00 - 18:00',
    bgPattern: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
    borderGlow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)] dark:shadow-[0_0_10px_rgba(34,197,94,0.1)]',
    liquidVariant: 'forest' as const
  },
  cena: {
    color: 'rich',
    gradient: 'from-purple-400/20 to-indigo-500/20',
    icon: '🌙',
    label: 'Cena',
    timeRange: '19:00 - 22:00',
    bgPattern: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50',
    borderGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)] dark:shadow-[0_0_10px_rgba(168,85,247,0.1)]',
    liquidVariant: 'aurora' as const
  }
} as const;

// =============================================
// NUTRITION ICONS
// =============================================

const getNutritionIcon = (label: string) => {
  const icons: Record<string, React.ReactNode> = {
    'vegetariano': <Leaf size={12} className="text-green-600" />,
    'vegano': <Leaf size={12} className="text-green-700" />,
    'sin_gluten': <AlertCircle size={12} className="text-orange-600" />,
    'pescado': <Fish size={12} className="text-blue-600" />,
    'carne': <Beef size={12} className="text-red-600" />,
    'bajo_calorias': <TrendingUp size={12} className="text-green-500" />,
    'alto_proteina': <Flame size={12} className="text-red-500" />
  };
  return icons[label.toLowerCase()] || null;
};

// =============================================
// MAIN ENHANCED COMPONENT
// =============================================

export const EnhancedMealSlot: React.FC<EnhancedMealSlotProps> = ({
  slot,
  recipe,
  dayName,
  dateLabel,
  isToday = false,
  isSelected = false,
  isDragTarget = false,
  isDropTarget = false,
  showMealType = true,
  compact = false,
  onClick,
  onRecipeSelect,
  onClear,
  onLock,
  onAIGenerate,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mealConfig = MEAL_CONFIG[slot.mealType];
  const isEmpty = !slot.recipeId || !recipe;
  const isLocked = slot.isLocked || false;
  
  // =============================================
  // MOUSE TRACKING FOR LIQUID EFFECT
  // =============================================
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  }, []);
  
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
  
  const handleAIGenerate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    onAIGenerate?.(slot);
  }, [slot, isLocked, onAIGenerate]);
  
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
      rotateX: 0,
      rotateY: 0,
      z: 0
    },
    hover: { 
      scale: compact ? 1.02 : 1.03,
      z: 20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    selected: {
      scale: 1.05,
      z: 30,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    dragging: {
      scale: 1.1,
      rotate: 5,
      z: 100,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };
  
  const currentVariant = isDragTarget ? 'dragging' 
    : isSelected ? 'selected'
    : isHovered ? 'hover' 
    : 'idle';
  
  // =============================================
  // RENDER HELPERS
  // =============================================
  
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {!compact && (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {dayName}
          </div>
        )}
        <Badge 
          variant={isToday ? 'success' : 'neutral'}
          size="xs"
          className={cn(
            "text-xs",
            isToday && "animate-pulse"
          )}
        >
          {dateLabel}
        </Badge>
      </div>
      
      {isLocked && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLockToggle}
          className="cursor-pointer"
        >
          <Lock size={14} className="text-gray-500 dark:text-gray-400" />
        </motion.div>
      )}
    </div>
  );
  
  const renderMealTypeIndicator = () => {
    if (!showMealType) return null;
    
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
            "bg-gradient-to-br",
            mealConfig.gradient,
            "backdrop-blur-sm border border-white/20",
            isHovered && "animate-pulse"
          )}>
            {mealConfig.icon}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {mealConfig.label}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {mealConfig.timeRange}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="space-y-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br",
            mealConfig.gradient,
            "backdrop-blur-md border-2 border-dashed border-white/40",
            "cursor-pointer transition-all",
            isLocked && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleAddRecipe}
        >
          <Plus size={24} className="text-white" />
        </motion.div>
        
        {!compact && (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isLocked ? 'Bloqueado' : 'Sin receta asignada'}
            </p>
            
            <div className="flex gap-2 justify-center">
              <iOS26LiquidButton
                variant="glass"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={handleAddRecipe}
                disabled={isLocked}
                className="text-xs"
              >
                Elegir
              </iOS26LiquidButton>
              
              <iOS26LiquidButton
                variant="glass"
                size="sm"
                leftIcon={<Sparkles size={14} />}
                onClick={handleAIGenerate}
                disabled={isLocked}
                className="text-xs"
                glow
              >
                Generar IA
              </iOS26LiquidButton>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
  
  const renderRecipeContent = () => {
    if (!recipe) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Recipe image with overlay */}
        <div className="relative overflow-hidden rounded-xl">
          {recipe.image ? (
            <div className="relative h-32">
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Rating overlay */}
              {recipe.rating && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium text-white">
                    {recipe.rating.toFixed(1)}
                  </span>
                </div>
              )}
              
              {/* AI Generated badge */}
              {recipe.isAiGenerated && (
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="info"
                    size="xs"
                    leftIcon={<Sparkles size={10} />}
                    className="backdrop-blur-md bg-blue-500/80"
                  >
                    IA
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "w-full h-32 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              mealConfig.gradient,
              "relative overflow-hidden"
            )}>
              <ChefHat size={48} className="text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-shimmer" />
            </div>
          )}
        </div>
        
        {/* Recipe info */}
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 text-base">
              {recipe.name}
            </h4>
            {recipe.description && !compact && (
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mt-1">
                {recipe.description}
              </p>
            )}
          </div>
          
          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs">
            {recipe.prepTime > 0 && (
              <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Timer size={12} />
                <span>{recipe.prepTime + recipe.cookTime}min</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
              <Users size={12} />
              <span>{slot.servings}</span>
            </div>
            
            {recipe.difficulty && (
              <Badge
                variant={
                  recipe.difficulty === 'easy' ? 'success' :
                  recipe.difficulty === 'medium' ? 'warning' : 'error'
                }
                size="xs"
              >
                {recipe.difficulty === 'easy' ? 'Fácil' :
                 recipe.difficulty === 'medium' ? 'Media' : 'Difícil'}
              </Badge>
            )}
          </div>
          
          {/* Dietary labels with icons */}
          {!compact && recipe.dietaryLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.dietaryLabels.slice(0, 3).map(label => (
                <Badge 
                  key={label}
                  variant="glass" 
                  size="xs"
                  leftIcon={getNutritionIcon(label)}
                  className="backdrop-blur-sm bg-white/60"
                >
                  {label}
                </Badge>
              ))}
              {recipe.dietaryLabels.length > 3 && (
                <Badge variant="glass" size="xs" className="backdrop-blur-sm bg-white/60">
                  +{recipe.dietaryLabels.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Nutrition preview */}
          {!compact && recipe.nutrition && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-300">Cal</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {recipe.nutrition.calories}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-300">Prot</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {recipe.nutrition.protein}g
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-300">Carb</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {recipe.nutrition.carbs}g
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-300">Grasa</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {recipe.nutrition.fat}g
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };
  
  const renderActionButtons = () => {
    if (!showActions || isEmpty || isLocked) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="absolute top-3 right-3 flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClear}
          className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-600/80 
                     backdrop-blur-sm flex items-center justify-center 
                     text-white transition-all shadow-lg"
        >
          <X size={16} />
        </motion.button>
        
        {recipe?.isFavorite && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 rounded-lg bg-yellow-500/80 
                       backdrop-blur-sm flex items-center justify-center 
                       text-white shadow-lg"
          >
            <Heart size={16} className="fill-current" />
          </motion.div>
        )}
      </motion.div>
    );
  };
  
  // =============================================
  // MAIN RENDER
  // =============================================
  
  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="idle"
      animate={currentVariant}
      whileHover="hover"
      whileTap={isDragTarget ? undefined : "tap"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative group perspective-1000"
      style={{
        transformStyle: 'preserve-3d'
      }}
    >
      <iOS26EnhancedCard
        variant={mealConfig.liquidVariant}
        elevation={isHovered ? 'floating' : 'medium'}
        interactive={true}
        liquidEffect={true}
        glowEffect={isSelected || isDropTarget}
        morphEffect={isHovered}
        gradient={true}
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          "transform-gpu",
          compact ? "p-4" : "p-5",
          isSelected && `ring-2 ring-${mealConfig.color}-400 ring-opacity-60`,
          isDropTarget && `ring-2 ring-${mealConfig.color}-500 ring-opacity-80`,
          isDragTarget && "opacity-40 scale-95",
          isLocked && "cursor-not-allowed",
          isEmpty ? "min-h-[200px]" : compact ? "min-h-[260px]" : "min-h-[380px]",
          isToday && mealConfig.borderGlow,
          "hover:transform hover:translate-z-2"
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
        style={{
          '--mouse-x': `${mousePosition.x}%`,
          '--mouse-y': `${mousePosition.y}%`,
        } as React.CSSProperties}
      >
        {/* Background pattern */}
        <div className={cn(
          "absolute inset-0 opacity-5 rounded-3xl",
          mealConfig.bgPattern
        )} />
        
        {/* Interactive light effect */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-3xl"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, 
                        rgba(255,255,255,0.1) 0%, 
                        transparent 40%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          {renderHeader()}
          
          {/* Meal type indicator */}
          {renderMealTypeIndicator()}
          
          {/* Main content */}
          {isEmpty ? renderEmptyState() : renderRecipeContent()}
        </div>
        
        {/* Action buttons overlay */}
        <AnimatePresence>
          {renderActionButtons()}
        </AnimatePresence>
        
        {/* Drop target indicator */}
        <AnimatePresence>
          {isDropTarget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute inset-0 rounded-3xl border-2 border-dashed pointer-events-none",
                `border-${mealConfig.color}-400`,
                "bg-gradient-to-br",
                mealConfig.gradient,
                "backdrop-blur-sm"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    `bg-${mealConfig.color}-500`,
                    "text-white shadow-xl"
                  )}
                >
                  <Plus size={32} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Today indicator */}
        {isToday && (
          <div className="absolute -top-2 -right-2">
            <div className="relative">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                `bg-${mealConfig.color}-500`,
                "text-white text-xs font-bold animate-pulse"
              )}>
                HOY
              </div>
              <div className={cn(
                "absolute inset-0 rounded-full",
                `bg-${mealConfig.color}-400`,
                "animate-ping"
              )} />
            </div>
          </div>
        )}
      </iOS26EnhancedCard>
    </motion.div>
  );
};

export default EnhancedMealSlot;