'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeumorphicMealSlotProps {
  dayIndex: number;
  mealType: string;
  isDarkMode: boolean;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  todayClass: boolean;
}

export const NeumorphicMealSlot: React.FC<NeumorphicMealSlotProps> = ({
  dayIndex,
  mealType,
  isDarkMode,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
  todayClass
}) => {
  return (
    <motion.div
      className="w-full h-full"
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={cn(
          "relative w-full h-full min-h-[100px] md:min-h-[140px] rounded-3xl cursor-pointer group",
          "transition-all duration-500",
          "bg-gray-100 dark:bg-gray-800",
          todayClass && "ring-2 ring-blue-400/30"
        )}
        style={{
          boxShadow: isDarkMode 
            ? 'inset 6px 6px 12px #1a1a1a, inset -6px -6px 12px #2a2a2a'
            : 'inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff'
        }}
        onClick={onClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      >
        {/* Neumorphic inner shadow on hover */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{
            boxShadow: isHovered ? (isDarkMode 
              ? 'inset 3px 3px 6px #1a1a1a, inset -3px -3px 6px #2a2a2a'
              : 'inset 3px 3px 6px #bebebe, inset -3px -3px 6px #ffffff') : 'none'
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4 z-10">
          <motion.div
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3",
              "bg-gray-100 dark:bg-gray-800 transition-all duration-300"
            )}
            style={{
              boxShadow: isDarkMode 
                ? '5px 5px 10px #1a1a1a, -5px -5px 10px #2a2a2a'
                : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff'
            }}
            animate={{
              boxShadow: isHovered ? (isDarkMode 
                ? '2px 2px 5px #1a1a1a, -2px -2px 5px #2a2a2a'
                : '2px 2px 5px #bebebe, -2px -2px 5px #ffffff') : (isDarkMode 
                ? '5px 5px 10px #1a1a1a, -5px -5px 10px #2a2a2a'
                : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff')
            }}
          >
            <Plus className={cn(
              "w-6 h-6 md:w-7 md:h-7 transition-colors duration-300",
              "text-gray-500 dark:text-gray-400",
              isHovered && "text-gray-700 dark:text-gray-300"
            )} />
          </motion.div>
          
          <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            Agregar comida
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              y: isHovered ? 0 : 5
            }}
            className="flex items-center gap-1 mt-2"
          >
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
            </motion.div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Generar con IA
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Filled slot with neumorphic design
export const NeumorphicFilledSlot: React.FC<{
  recipe: any;
  slot: any;
  isDarkMode: boolean;
  isHovered: boolean;
  isSelected: boolean;
  todayClass: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  onEdit: () => void;
  onClear: () => void;
}> = ({
  recipe,
  slot,
  isDarkMode,
  isHovered,
  isSelected,
  todayClass,
  onHoverStart,
  onHoverEnd,
  onClick,
  onEdit,
  onClear
}) => {
  return (
    <motion.div
      className="w-full h-full"
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={cn(
          "relative w-full h-full min-h-[100px] md:min-h-[140px] rounded-3xl cursor-pointer group",
          "transition-all duration-500",
          "bg-gray-100 dark:bg-gray-800",
          isSelected && "ring-2 ring-blue-400/50",
          todayClass && "ring-2 ring-blue-400/30"
        )}
        style={{
          boxShadow: isDarkMode 
            ? '8px 8px 16px #1a1a1a, -8px -8px 16px #2a2a2a'
            : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff'
        }}
        onClick={onClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      >
        {/* Content */}
        <div className="relative h-full p-3 md:p-4 z-10">
          <div className="h-full flex flex-col">
            <h4 className="font-semibold text-xs md:text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
              {recipe.name}
            </h4>
            
            {recipe.rating && (
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {recipe.rating}
                </span>
              </div>
            )}
            
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                {recipe.prepTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {recipe.prepTime}m
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {slot.servings}
                  </span>
                </div>
              </div>
              
              {/* Hover actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="flex items-center gap-1"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    "bg-gray-100 dark:bg-gray-800"
                  )}
                  style={{
                    boxShadow: isDarkMode 
                      ? '3px 3px 6px #1a1a1a, -3px -3px 6px #2a2a2a'
                      : '3px 3px 6px #bebebe, -3px -3px 6px #ffffff'
                  }}
                >
                  <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    "bg-gray-100 dark:bg-gray-800"
                  )}
                  style={{
                    boxShadow: isDarkMode 
                      ? '3px 3px 6px #1a1a1a, -3px -3px 6px #2a2a2a'
                      : '3px 3px 6px #bebebe, -3px -3px 6px #ffffff'
                  }}
                >
                  <X className="w-3 h-3 text-red-500" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* AI badge */}
        {recipe.isAiGenerated && (
          <div className="absolute top-2 right-2">
            <div
              className={cn(
                "p-1.5 rounded-lg",
                "bg-gradient-to-br from-purple-500 to-pink-500"
              )}
            >
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Add these imports to the main file
import { Star, Clock, Users, Edit2, X, Zap } from 'lucide-react';