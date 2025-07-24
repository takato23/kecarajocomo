'use client';

import type { Database } from '@/lib/supabase/types';

import { RecipeCard } from './RecipeCard';

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipeGridProps {
  recipes: (Recipe & {
    averageRating?: number;
    totalRatings?: number;
    isFavorite?: boolean;
  })[];
  onFavoriteToggle?: (recipeId: string) => void;
  isLoading?: boolean;
}

export function RecipeGrid({ recipes, onFavoriteToggle, isLoading }: RecipeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="flex gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍳</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No recipes found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or create your first recipe!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  );
}