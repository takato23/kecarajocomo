'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter, 
  Sparkles, 
  Clock, 
  Users, 
  Star,
  ChefHat,
  Plus,
  Loader2,
  Heart,
  Utensils,
  Flame,
  Leaf
} from 'lucide-react';
import { toast } from 'sonner';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useRecipeStore } from '@/features/recipes/store/recipeStore';
import type { Recipe, MealSlot, DietaryPreference, MealType } from '../types';

interface RecipeSelectionModalProps {
  slot: {
    dayOfWeek: number;
    mealType: MealType;
    date?: string;
  };
  onClose: () => void;
}

const dietaryIcons: Record<DietaryPreference, any> = {
  vegetarian: Leaf,
  vegan: Leaf,
  glutenFree: Utensils,
  dairyFree: Utensils,
  omnivore: Utensils,
  pescatarian: Utensils,
  keto: Flame,
  paleo: Flame
};

export function RecipeSelectionModal({ slot, onClose }: RecipeSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<DietaryPreference[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'ai'>('all');
  
  const { recipes: mealPlanningRecipes, addMealToSlot } = useMealPlanningStore();
  const { 
    recipes: recipeStoreRecipes,
    favoriteRecipes,
    isLoading,
    searchRecipes,
    generateAIRecipe
  } = useRecipeStore();

  // Combine recipes from both stores
  const allRecipes = useMemo(() => {
    const combinedMap = new Map<string, Recipe>();
    
    // Add meal planning recipes
    Object.values(mealPlanningRecipes).forEach(recipe => {
      combinedMap.set(recipe.id, recipe);
    });
    
    // Add recipe store recipes (may override meal planning ones)
    recipeStoreRecipes.forEach(recipe => {
      // Convert recipe store format to meal planning format if needed
      const convertedRecipe: Recipe = {
        id: recipe.id,
        name: recipe.title,
        description: recipe.description,
        image: recipe.featured_image_url || recipe.images?.[0]?.url,
        prepTime: recipe.prep_time_minutes || 0,
        cookTime: recipe.cook_time_minutes || 0,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'medium',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        nutrition: recipe.nutrition_info ? {
          calories: recipe.nutrition_info.calories || 0,
          protein: recipe.nutrition_info.protein || 0,
          carbs: recipe.nutrition_info.carbs || 0,
          fat: recipe.nutrition_info.fat || 0,
          fiber: recipe.nutrition_info.fiber,
          sugar: recipe.nutrition_info.sugar,
          sodium: recipe.nutrition_info.sodium
        } : undefined,
        dietaryLabels: recipe.dietary_tags as DietaryPreference[] || [],
        cuisine: recipe.cuisine_type,
        tags: recipe.tags || [],
        rating: recipe.average_rating,
        isAiGenerated: recipe.ai_generated,
        isFavorite: favoriteRecipes.some(fav => fav.id === recipe.id)
      };
      combinedMap.set(recipe.id, convertedRecipe);
    });
    
    return Array.from(combinedMap.values());
  }, [mealPlanningRecipes, recipeStoreRecipes, favoriteRecipes]);

  // Filter recipes based on search and filters
  const filteredRecipes = useMemo(() => {
    let filtered = allRecipes;
    
    // Filter by tab
    if (activeTab === 'favorites') {
      filtered = filtered.filter(recipe => recipe.isFavorite);
    } else if (activeTab === 'ai') {
      filtered = filtered.filter(recipe => recipe.isAiGenerated);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(query)) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query))
      );
    }
    
    // Filter by dietary preferences
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedFilters.every(filter => recipe.dietaryLabels.includes(filter))
      );
    }
    
    return filtered;
  }, [allRecipes, searchQuery, selectedFilters, activeTab]);

  // Handle recipe selection
  const handleSelectRecipe = useCallback(async (recipe: Recipe) => {
    await addMealToSlot(slot, recipe);
    toast.success(`${recipe.name} agregado al planificador`);
    onClose();
  }, [addMealToSlot, slot, onClose]);

  // Handle AI generation
  const handleGenerateAI = useCallback(async () => {
    setIsGenerating(true);
    try {
      const mealTypePrompts = {
        desayuno: 'un desayuno saludable y nutritivo',
        almuerzo: 'un almuerzo equilibrado y satisfactorio',
        merienda: 'una merienda ligera y energética',
        cena: 'una cena reconfortante pero ligera'
      };
      
      await generateAIRecipe({
        prompt: `Genera ${mealTypePrompts[slot.mealType]} para Argentina`,
        dietary_tags: selectedFilters,
        cuisine_type: 'Argentino',
        servings: 2,
        difficulty: 'medium',
        use_pantry: true,
        preferences: {
          max_prep_time: 30,
          max_cook_time: 45
        }
      });
      
      toast.success('Receta generada con IA exitosamente');
      setActiveTab('ai');
    } catch (error) {
      toast.error('Error al generar la receta con IA');
    } finally {
      setIsGenerating(false);
    }
  }, [generateAIRecipe, slot.mealType, selectedFilters]);

  // Toggle dietary filter
  const toggleFilter = useCallback((filter: DietaryPreference) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="w-full max-w-5xl max-h-[90vh] bg-gray-900/90 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Seleccionar Receta</h2>
                {slot.date && (
                  <p className="text-sm text-gray-400 mt-1">
                    {slot.mealType} • {new Date(slot.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                Todas las Recetas
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'favorites'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favoritas
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generadas por IA
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar recetas..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                />
              </div>

              {/* Generate AI Button */}
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar con IA
                  </>
                )}
              </button>
            </div>

            {/* Dietary Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(['vegetarian', 'vegan', 'glutenFree', 'dairyFree', 'keto', 'paleo'] as DietaryPreference[]).map(filter => {
                const Icon = dietaryIcons[filter];
                const isSelected = selectedFilters.includes(filter);
                
                return (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipe Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-16">
                <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No se encontraron recetas</p>
                <p className="text-sm text-gray-500 mt-2">
                  Prueba con otros filtros o genera una nueva con IA
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                  <motion.button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all text-left"
                  >
                    {/* Image */}
                    <div className="aspect-video relative overflow-hidden bg-gray-800">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      
                      {/* Overlay Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white/90 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {recipe.prepTime + recipe.cookTime} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {recipe.servings}
                            </span>
                          </div>
                          {recipe.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              {recipe.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                        <div className="flex flex-wrap gap-1">
                          {recipe.isAiGenerated && (
                            <span className="px-2 py-1 bg-purple-500/90 backdrop-blur-sm text-white text-xs rounded-lg flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              IA
                            </span>
                          )}
                          {recipe.dietaryLabels.slice(0, 2).map(label => {
                            const Icon = dietaryIcons[label];
                            return (
                              <span key={label} className="px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-lg flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {label}
                              </span>
                            );
                          })}
                        </div>
                        {recipe.isFavorite && (
                          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 line-clamp-1">{recipe.name}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{recipe.description}</p>
                      
                      {/* Nutrition Preview */}
                      {recipe.nutrition && (
                        <div className="mt-3 flex gap-3 text-xs text-gray-500">
                          <span>{recipe.nutrition.calories} cal</span>
                          <span>{recipe.nutrition.protein}g prot</span>
                          <span>{recipe.nutrition.carbs}g carb</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}