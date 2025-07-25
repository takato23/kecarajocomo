'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Star, Clock, Users, Flame } from 'lucide-react';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import type { MealType, Recipe } from '../types';

interface RecipeSelectionModalProps {
  slot: { dayOfWeek: number; mealType: MealType };
  onClose: () => void;
}

export function RecipeSelectionModal({ slot, onClose }: RecipeSelectionModalProps) {
  const { recipes, addMealToSlot } = useMealPlanningStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const recipeList = Object.values(recipes);
  
  const filteredRecipes = recipeList.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.tags.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'desayuno', label: 'Desayuno' },
    { id: 'almuerzo', label: 'Almuerzo' },
    { id: 'cena', label: 'Cena' },
    { id: 'saludable', label: 'Saludable' },
    { id: 'rápido', label: 'Rápido' },
  ];

  const handleRecipeSelect = async (recipe: Recipe) => {
    await addMealToSlot(slot, recipe);
    onClose();
  };

  return (
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
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Seleccionar Receta
              </h2>
              <p className="text-white/60 text-sm">
                {slot.mealType} • {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][slot.dayOfWeek]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Categories */}
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRecipeSelect(recipe)}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
              >
                {recipe.image && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-3">
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <h3 className="font-semibold text-white mb-2 line-clamp-2">
                  {recipe.name}
                </h3>
                
                {recipe.description && (
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-white/70">
                  <div className="flex items-center gap-3">
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
                    {recipe.nutrition?.calories && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        <span>{recipe.nutrition.calories}</span>
                      </div>
                    )}
                  </div>
                  
                  {recipe.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>{recipe.rating}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60">No se encontraron recetas</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}