'use client';

import React from 'react';
import { 
  Clock, 
  Users, 
  ChefHat, 
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import { useRecipeStore } from '../store/recipeStore';
import { Recipe, DietaryTag } from '../types';

import { NutritionBadge } from './NutritionBadge';

interface RecipeListProps {
  onRecipeClick: (recipe: Recipe) => void;
  onCreateClick: () => void;
  viewMode?: 'grid' | 'list';
}

export const RecipeList: React.FC<RecipeListProps> = ({
  onRecipeClick,
  onCreateClick,
  viewMode = 'grid',
}) => {
  const {
    isLoading,
    filters,
    sortOptions,
    pagination,
    getFilteredRecipes,
    getTotalPages,
    setPagination,
  } = useRecipeStore();

  const recipes = getFilteredRecipes();
  const totalPages = getTotalPages();
  
  // Paginate recipes
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedRecipes = recipes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination({ ...pagination, page });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCuisineEmoji = (cuisine: string) => {
    const cuisineEmojis: Record<string, string> = {
      mexican: '🌮',
      italian: '🍝',
      chinese: '🥟',
      japanese: '🍱',
      indian: '🍛',
      french: '🥐',
      mediterranean: '🥗',
      american: '🍔',
      thai: '🍜',
      spanish: '🥘',
      other: '🍽️',
    };
    return cuisineEmojis[cuisine] || '🍽️';
  };

  const getDietaryBadge = (tag: DietaryTag) => {
    const colors: Record<DietaryTag, string> = {
      vegetarian: 'bg-green-100 text-green-700',
      vegan: 'bg-green-100 text-green-700',
      'gluten-free': 'bg-yellow-100 text-yellow-700',
      'dairy-free': 'bg-blue-100 text-blue-700',
      'nut-free': 'bg-orange-100 text-orange-700',
      'low-carb': 'bg-purple-100 text-purple-700',
      keto: 'bg-purple-100 text-purple-700',
      paleo: 'bg-amber-100 text-amber-700',
      whole30: 'bg-indigo-100 text-indigo-700',
      'sugar-free': 'bg-pink-100 text-pink-700',
      'low-sodium': 'bg-cyan-100 text-cyan-700',
      'high-protein': 'bg-red-100 text-red-700',
    };
    return colors[tag] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (paginatedRecipes.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <ChefHat className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No recipes found</h3>
        <p className="mb-6 text-gray-600">Try adjusting your filters or create a new recipe</p>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4" />
          Create New Recipe
        </button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {paginatedRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onRecipeClick(recipe)}
            className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex gap-4">
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{recipe.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                  </div>
                  {recipe.ai_generated && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </span>
                  )}
                </div>
                
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500">
                    {getCuisineEmoji(recipe.cuisine_type)} {recipe.cuisine_type}
                  </span>
                  <span className={cn('rounded px-2 py-0.5 text-xs font-medium', getDifficultyColor(recipe.difficulty))}>
                    {recipe.difficulty}
                  </span>
                  {recipe.dietary_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={cn('rounded px-2 py-0.5 text-xs font-medium', getDietaryBadge(tag))}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recipe.total_time} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipe.servings} servings
                  </span>
                  {recipe.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {recipe.rating.toFixed(1)}
                    </span>
                  )}
                  <NutritionBadge
                    nutrition={recipe.nutritional_info}
                    variant="minimal"
                    className="ml-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded p-2 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="rounded p-2 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onRecipeClick(recipe)}
            className="group cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ChefHat className="h-12 w-12 text-gray-300" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute left-2 top-2 flex gap-2">
                <span className={cn('rounded px-2 py-1 text-xs font-medium', getDifficultyColor(recipe.difficulty))}>
                  {recipe.difficulty}
                </span>
                {recipe.ai_generated && (
                  <span className="flex items-center gap-1 rounded bg-purple-500 px-2 py-1 text-xs font-medium text-white">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                )}
              </div>
              
              {recipe.rating && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-white/90 px-2 py-1 backdrop-blur">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{recipe.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-4">
              <h3 className="mb-1 font-semibold text-gray-900 line-clamp-2">
                {recipe.title}
              </h3>
              
              <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                {recipe.description}
              </p>
              
              {/* Tags */}
              <div className="mb-3 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">
                  {getCuisineEmoji(recipe.cuisine_type)} {recipe.cuisine_type}
                </span>
                {recipe.dietary_tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className={cn('rounded px-1.5 py-0.5 text-xs font-medium', getDietaryBadge(tag))}
                  >
                    {tag}
                  </span>
                ))}
                {recipe.dietary_tags.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{recipe.dietary_tags.length - 2}
                  </span>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recipe.total_time}m
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {recipe.servings}
                </span>
                <span className="font-medium text-gray-700">
                  {recipe.nutritional_info.calories} cal
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="rounded p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Page numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded text-sm font-medium',
                    pagination.page === pageNum
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
            className="rounded p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};