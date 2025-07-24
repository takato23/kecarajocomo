'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

import { cn } from '@/lib/utils';

import { useRecipeStore } from '../store/recipeStore';
import { CuisineType, DietaryTag, DifficultyLevel, MealType } from '../types';

interface IngredientSearchBarProps {
  onSearch?: () => void;
  className?: string;
}

export const IngredientSearchBar: React.FC<IngredientSearchBarProps> = ({
  onSearch,
  className,
}) => {
  const {
    filters,
    searchQuery,
    selectedTags,
    setFilters,
    setSearchQuery,
    addSelectedTag,
    removeSelectedTag,
    clearFilters,
    searchRecipes,
  } = useRecipeStore();

  const [showFilters, setShowFilters] = useState(false);
  const [includeIngredients, setIncludeIngredients] = useState<string>('');
  const [excludeIngredients, setExcludeIngredients] = useState<string>('');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      search: searchQuery,
      ingredients_include: includeIngredients
        .split(',')
        .map(i => i.trim())
        .filter(Boolean),
      ingredients_exclude: excludeIngredients
        .split(',')
        .map(i => i.trim())
        .filter(Boolean),
    };
    setFilters(newFilters);
    if (onSearch) onSearch();
    searchRecipes();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearFilters();
    setIncludeIngredients('');
    setExcludeIngredients('');
    if (onSearch) onSearch();
    searchRecipes();
  };

  const cuisineTypes: CuisineType[] = [
    'mexican', 'italian', 'chinese', 'japanese', 'indian',
    'french', 'mediterranean', 'american', 'thai', 'spanish'
  ];

  const mealTypes: MealType[] = [
    'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer'
  ];

  const dietaryTags: DietaryTag[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'nut-free', 'low-carb', 'keto', 'paleo'
  ];

  const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard'];

  const activeFilterCount = [
    filters.cuisine_types?.length || 0,
    filters.meal_types?.length || 0,
    filters.dietary_tags?.length || 0,
    filters.difficulty?.length || 0,
    filters.ingredients_include?.length || 0,
    filters.ingredients_exclude?.length || 0,
    filters.max_cook_time ? 1 : 0,
    filters.max_prep_time ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={cn('relative', className)}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search recipes by name, ingredients, or tags..."
            className="w-full rounded-lg border bg-white py-3 pl-10 pr-10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-white px-4 py-3 font-medium transition-colors',
            showFilters ? 'border-primary text-primary' : 'hover:bg-gray-50'
          )}
        >
          <Filter className="h-5 w-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        <button
          onClick={handleSearch}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {tag}
              <button
                onClick={() => removeSelectedTag(tag)}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Dropdown */}
      {showFilters && (
        <div
          ref={filterRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-white p-6 shadow-xl"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ingredients */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Include Ingredients
                </label>
                <input
                  type="text"
                  value={includeIngredients}
                  onChange={(e) => setIncludeIngredients(e.target.value)}
                  placeholder="e.g., chicken, tomato, basil (comma separated)"
                  className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Exclude Ingredients
                </label>
                <input
                  type="text"
                  value={excludeIngredients}
                  onChange={(e) => setExcludeIngredients(e.target.value)}
                  placeholder="e.g., nuts, dairy (comma separated)"
                  className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Time Constraints */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Max Prep Time (minutes)
                </label>
                <input
                  type="number"
                  value={filters.max_prep_time || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    max_prep_time: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="e.g., 30"
                  className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Max Cook Time (minutes)
                </label>
                <input
                  type="number"
                  value={filters.max_cook_time || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    max_cook_time: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="e.g., 60"
                  className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Filter Categories */}
          <div className="mt-6 space-y-4">
            {/* Cuisine Types */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Cuisine Type</h4>
              <div className="flex flex-wrap gap-2">
                {cuisineTypes.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => {
                      const current = filters.cuisine_types || [];
                      setFilters({
                        ...filters,
                        cuisine_types: current.includes(cuisine)
                          ? current.filter(c => c !== cuisine)
                          : [...current, cuisine]
                      });
                    }}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      filters.cuisine_types?.includes(cuisine)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Types */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Meal Type</h4>
              <div className="flex flex-wrap gap-2">
                {mealTypes.map((meal) => (
                  <button
                    key={meal}
                    onClick={() => {
                      const current = filters.meal_types || [];
                      setFilters({
                        ...filters,
                        meal_types: current.includes(meal)
                          ? current.filter(m => m !== meal)
                          : [...current, meal]
                      });
                    }}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      filters.meal_types?.includes(meal)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Dietary Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {dietaryTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const current = filters.dietary_tags || [];
                      setFilters({
                        ...filters,
                        dietary_tags: current.includes(tag)
                          ? current.filter(t => t !== tag)
                          : [...current, tag]
                      });
                    }}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      filters.dietary_tags?.includes(tag)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Difficulty</h4>
              <div className="flex flex-wrap gap-2">
                {difficultyLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      const current = filters.difficulty || [];
                      setFilters({
                        ...filters,
                        difficulty: current.includes(level)
                          ? current.filter(d => d !== level)
                          : [...current, level]
                      });
                    }}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      filters.difficulty?.includes(level)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generated Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ai-generated"
                checked={filters.ai_generated || false}
                onChange={(e) => setFilters({
                  ...filters,
                  ai_generated: e.target.checked || undefined
                })}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="ai-generated" className="text-sm font-medium text-gray-700">
                Only AI-generated recipes
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => {
                clearFilters();
                setIncludeIngredients('');
                setExcludeIngredients('');
                setShowFilters(false);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                handleSearch();
                setShowFilters(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};