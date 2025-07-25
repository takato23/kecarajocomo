'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Clock, 
  Users, 
  Sparkles, 
  Heart, 
  BookOpen,
  Flame,
  Zap,
  Star,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react';

import { GlassCard, GlassRecipeCard, GlassButton, GlassInput } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  cuisine: string;
  tags: string[];
  isAIGenerated?: boolean;
  isFavorite?: boolean;
  macronutrients?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface EnhancedRecipeGridProps {
  recipes: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
  onFavoriteToggle?: (recipeId: string) => void;
  className?: string;
}

const filterCategories = [
  { id: 'all', label: 'Todas', icon: Grid3X3 },
  { id: 'favorites', label: 'Favoritas', icon: Heart },
  { id: 'quick', label: 'Rápidas', icon: Zap },
  { id: 'ai', label: 'IA', icon: Sparkles },
  { id: 'healthy', label: 'Saludables', icon: Flame }
];

const sortOptions = [
  { value: 'rating', label: 'Mejor Valoradas' },
  { value: 'recent', label: 'Más Recientes' },
  { value: 'time', label: 'Tiempo de Preparación' },
  { value: 'difficulty', label: 'Dificultad' },
  { value: 'name', label: 'Nombre A-Z' }
];

const cuisineTypes = [
  'Mexicana', 'Italiana', 'Asiática', 'Mediterránea', 
  'India', 'Americana', 'Francesa', 'Japonesa'
];

const difficultyLevels = ['easy', 'medium', 'hard'];

export const EnhancedRecipeGrid: React.FC<EnhancedRecipeGridProps> = ({
  recipes = [],
  onRecipeClick,
  onFavoriteToggle,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [maxPrepTime, setMaxPrepTime] = useState(120);

  // Mock recipes for demonstration
  const mockRecipes: Recipe[] = [
    {
      id: '1',
      title: 'Tacos de Pollo con Aguacate',
      description: 'Deliciosos tacos con pollo marinado, aguacate fresco y salsa casera',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'easy',
      rating: 4.8,
      cuisine: 'Mexicana',
      tags: ['Pollo', 'Aguacate', 'Rápido'],
      isFavorite: true,
      macronutrients: { calories: 350, protein: 28, carbs: 32, fat: 15 }
    },
    {
      id: '2',
      title: 'Pasta Primavera con Vegetales',
      description: 'Pasta fresca con una mezcla colorida de vegetales de temporada',
      imageUrl: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400',
      prepTime: 10,
      cookTime: 25,
      servings: 3,
      difficulty: 'medium',
      rating: 4.5,
      cuisine: 'Italiana',
      tags: ['Vegetariano', 'Pasta', 'Vegetales'],
      isAIGenerated: true,
      macronutrients: { calories: 420, protein: 12, carbs: 68, fat: 8 }
    },
    {
      id: '3',
      title: 'Salmón a la Plancha con Quinoa',
      description: 'Salmón perfectamente cocinado sobre una cama de quinoa con especias',
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
      prepTime: 8,
      cookTime: 15,
      servings: 2,
      difficulty: 'easy',
      rating: 4.9,
      cuisine: 'Mediterránea',
      tags: ['Pescado', 'Saludable', 'Proteína'],
      macronutrients: { calories: 380, protein: 35, carbs: 22, fat: 18 }
    },
    {
      id: '4',
      title: 'Curry de Lentejas Rojas',
      description: 'Curry aromático y cremoso con lentejas rojas y especias tradicionales',
      imageUrl: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400',
      prepTime: 12,
      cookTime: 30,
      servings: 6,
      difficulty: 'medium',
      rating: 4.6,
      cuisine: 'India',
      tags: ['Vegano', 'Especias', 'Proteína'],
      isAIGenerated: true,
      isFavorite: true,
      macronutrients: { calories: 280, protein: 18, carbs: 45, fat: 6 }
    }
  ];

  const displayRecipes = recipes.length > 0 ? recipes : mockRecipes;

  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = displayRecipes.filter(recipe => {
      // Search query filter
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Category filter
      switch (activeFilter) {
        case 'favorites':
          if (!recipe.isFavorite) return false;
          break;
        case 'quick':
          if ((recipe.prepTime + recipe.cookTime) > 30) return false;
          break;
        case 'ai':
          if (!recipe.isAIGenerated) return false;
          break;
        case 'healthy':
          if (!recipe.macronutrients || recipe.macronutrients.calories > 400) return false;
          break;
      }

      // Cuisine filter
      if (selectedCuisines.length > 0 && !selectedCuisines.includes(recipe.cuisine)) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(recipe.difficulty)) {
        return false;
      }

      // Prep time filter
      if (recipe.prepTime > maxPrepTime) {
        return false;
      }

      return true;
    });

    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'time':
          return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'name':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return 0; // Keep original order for "recent"
      }
    });

    return filtered;
  }, [displayRecipes, searchQuery, activeFilter, selectedCuisines, selectedDifficulties, maxPrepTime, sortBy]);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Search and Controls */}
      <GlassCard variant="medium" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <GlassInput
              placeholder="Buscar recetas, ingredientes o etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-input text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <GlassButton
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </GlassButton>
              <GlassButton
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </GlassButton>
            </div>

            {/* Filters Toggle */}
            <GlassButton
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<SlidersHorizontal className="w-4 h-4" />}
            >
              Filtros
            </GlassButton>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex flex-wrap gap-2 mt-4">
          {filterCategories.map(category => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  activeFilter === category.id
                    ? 'bg-orange-500/20 text-orange-900 dark:text-orange-100 border border-orange-500/30'
                    : 'bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20'
                )}
                onClick={() => setActiveFilter(category.id)}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cuisines */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Tipo de Cocina
                  </h4>
                  <div className="space-y-2">
                    {cuisineTypes.map(cuisine => (
                      <label key={cuisine} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCuisines.includes(cuisine)}
                          onChange={() => handleCuisineToggle(cuisine)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {cuisine}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Dificultad
                  </h4>
                  <div className="space-y-2">
                    {difficultyLevels.map(difficulty => (
                      <label key={difficulty} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDifficulties.includes(difficulty)}
                          onChange={() => handleDifficultyToggle(difficulty)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : 'Difícil'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Prep Time */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Tiempo de Preparación (máx. {maxPrepTime} min)
                  </h4>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={maxPrepTime}
                    onChange={(e) => setMaxPrepTime(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Mostrando {filteredAndSortedRecipes.length} de {displayRecipes.length} recetas
        </p>
      </div>

      {/* Recipe Grid/List */}
      <AnimatePresence mode="wait">
        {filteredAndSortedRecipes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            )}
          >
            {filteredAndSortedRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {viewMode === 'grid' ? (
                  <GlassRecipeCard
                    title={recipe.title}
                    description={recipe.description}
                    imageUrl={recipe.imageUrl}
                    prepTime={recipe.prepTime + recipe.cookTime}
                    difficulty={recipe.difficulty}
                    rating={recipe.rating}
                    tags={recipe.tags}
                    onClick={() => onRecipeClick?.(recipe)}
                  />
                ) : (
                  <GlassCard variant="subtle" className="p-4" interactive>
                    <div className="flex items-center space-x-4">
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {recipe.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {recipe.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                          {recipe.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{recipe.prepTime + recipe.cookTime} min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{recipe.servings} personas</span>
                          </span>
                          <span className="capitalize">{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron recetas
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Intenta ajustar tus filtros o buscar con otros términos.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};