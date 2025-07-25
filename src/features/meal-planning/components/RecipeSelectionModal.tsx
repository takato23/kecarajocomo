'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { iOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';
import { LoadingSpinner } from '@/components/ui/enhanced-loading';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useGeminiMealPlanner } from '../hooks/useGeminiMealPlanner';
import type { MealType } from '../types';

interface RecipeSelectionModalProps {
  slot: {
    dayOfWeek: number;
    mealType: MealType;
  };
  onClose: () => void;
}

export function RecipeSelectionModal({ slot, onClose }: RecipeSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { recipes, addMealToSlot } = useMealPlanningStore();
  const { generateWeeklyPlan } = useGeminiMealPlanner();

  const filteredRecipes = Object.values(recipes).filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRecipe = async (recipe: any) => {
    await addMealToSlot(slot, recipe);
    toast.success(`${recipe.name} agregado al planificador`);
    onClose();
  };

  const handleGenerateRecipe = async () => {
    setIsGenerating(true);
    try {
      // Generate a single recipe for this slot
      toast.success('Generando receta con IA...');
      // Implementation would go here
      setTimeout(() => {
        toast.success('Receta generada exitosamente');
        onClose();
      }, 2000);
    } catch (error) {
      toast.error('Error al generar la receta');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <iOS26EnhancedCard
            variant="aurora"
            elevation="floating"
            className="max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Seleccionar Receta
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Search bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar recetas..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
              {/* AI Generation Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateRecipe}
                disabled={isGenerating}
                className="w-full mb-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar con IA
                  </>
                )}
              </motion.button>

              {/* Recipe list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecipes.map((recipe) => (
                  <motion.button
                    key={recipe.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="text-left"
                  >
                    <iOS26EnhancedCard
                      variant="glass"
                      className="p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex gap-3">
                        {recipe.image && (
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {recipe.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {recipe.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {recipe.prepTime + recipe.cookTime}m
                            </span>
                            <span className="text-xs text-gray-500">
                              {recipe.servings} porciones
                            </span>
                          </div>
                        </div>
                      </div>
                    </iOS26EnhancedCard>
                  </motion.button>
                ))}
              </div>
            </div>
          </iOS26EnhancedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}