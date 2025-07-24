'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';

interface RecipeFiltersProps {
  filters: {
    search?: string;
    cuisineTypes?: string[];
    mealTypes?: string[];
    difficulty?: string[];
    maxTime?: number;
    tags?: string[];
  };
  onFiltersChange: (filters: any) => void;
}

const CUISINE_TYPES = [
  { value: 'italian', label: 'Italian', icon: '🇮🇹' },
  { value: 'mexican', label: 'Mexican', icon: '🇲🇽' },
  { value: 'chinese', label: 'Chinese', icon: '🇨🇳' },
  { value: 'japanese', label: 'Japanese', icon: '🇯🇵' },
  { value: 'indian', label: 'Indian', icon: '🇮🇳' },
  { value: 'thai', label: 'Thai', icon: '🇹🇭' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🌊' },
  { value: 'american', label: 'American', icon: '🇺🇸' },
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
  { value: 'dessert', label: 'Dessert', icon: '🍰' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'hard', label: 'Hard', color: 'red' },
];

export function RecipeFilters({ filters, onFiltersChange }: RecipeFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const current = filters[key as keyof typeof filters] as string[] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    onFiltersChange({ ...filters, [key]: updated });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(
    v => v && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent flex items-center gap-2"
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-lime-500 text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Cuisine Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Cuisine</h3>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_TYPES.map(cuisine => (
                    <button
                      key={cuisine.value}
                      onClick={() => toggleArrayFilter('cuisineTypes', cuisine.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.cuisineTypes?.includes(cuisine.value)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine.icon} {cuisine.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Meal Type</h3>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map(meal => (
                    <button
                      key={meal.value}
                      onClick={() => toggleArrayFilter('mealTypes', meal.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.mealTypes?.includes(meal.value)
                          ? 'bg-lime-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {meal.icon} {meal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Difficulty</h3>
                <div className="flex gap-2">
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => toggleArrayFilter('difficulty', level.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.difficulty?.includes(level.value)
                          ? `bg-${level.color}-500 text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Time */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Max Time: {filters.maxTime || 120} minutes
                </h3>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={filters.maxTime || 120}
                  onChange={(e) => onFiltersChange({ ...filters, maxTime: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>15m</span>
                  <span>3h</span>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}