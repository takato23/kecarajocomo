'use client';

import React, { useState } from 'react';
import { 
  Heart,
  Clock,
  Users,
  Star,
  ChefHat,
  Bookmark,
  Share2,
  Play,
  Eye,
  Plus,
  TrendingUp
} from 'lucide-react';
import Image from 'next/image';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Recipe {
  id: string;
  name: string;
  description: string;
  image?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'fácil' | 'intermedio' | 'difícil';
  rating: number;
  reviewCount: number;
  category: string;
  cuisine: string;
  tags: string[];
  isFavorite: boolean;
  isBookmarked: boolean;
  author: string;
  calories?: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  instructions: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  emoji?: string;
  createdAt: Date;
  trending?: boolean;
}

interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'default' | 'compact' | 'detailed';
  onToggleFavorite?: (recipe: Recipe) => void;
  onToggleBookmark?: (recipe: Recipe) => void;
  onView?: (recipe: Recipe) => void;
  onCook?: (recipe: Recipe) => void;
  onAddToPlan?: (recipe: Recipe) => void;
  onShare?: (recipe: Recipe) => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'fácil': return 'bg-green-100 text-green-800 border-green-200';
    case 'intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'difícil': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCuisineEmoji = (cuisine: string) => {
  const cuisineEmojis: Record<string, string> = {
    'mexicano': '🌮',
    'italiano': '🍝',
    'japonés': '🍣',
    'chino': '🥢',
    'indio': '🍛',
    'francés': '🥐',
    'español': '🥘',
    'americano': '🍔',
    'tailandés': '🍜',
    'mediterráneo': '🫒',
    'árabe': '🧆',
    'peruano': '🌶️'
  };
  return cuisineEmojis[cuisine.toLowerCase()] || '🍽️';
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  variant = 'default',
  onToggleFavorite,
  onToggleBookmark,
  onView,
  onCook,
  onAddToPlan,
  onShare
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(recipe);
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.(recipe);
  };

  const handleView = () => {
    onView?.(recipe);
  };

  if (variant === 'compact') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleView}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* Recipe Image/Emoji */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-2xl">
              {recipe.emoji || getCuisineEmoji(recipe.cuisine)}
            </div>
            
            {/* Recipe Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{recipe.name}</h3>
                <button onClick={handleToggleFavorite} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                </button>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {recipe.prepTime + recipe.cookTime}min
                </span>
                <span className="flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-400" />
                  {recipe.rating}
                </span>
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {recipe.servings}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 shadow-lg">
      {/* Trending Badge */}
      {recipe.trending && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" />
          Trending
        </div>
      )}

      {/* Recipe Image */}
      <div className="relative h-48 bg-gradient-to-r from-orange-400 to-red-500 overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-white">
            {recipe.emoji || getCuisineEmoji(recipe.cuisine)}
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onView?.(recipe); }}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onCook?.(recipe); }}>
              <Play className="w-4 h-4 mr-1" />
              Cocinar
            </Button>
          </div>
        </div>

        {/* Top Actions */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleToggleFavorite}
            className={`w-8 h-8 rounded-full ${recipe.isFavorite ? 'bg-red-500 text-white' : 'bg-white bg-opacity-90 text-gray-600'} flex items-center justify-center shadow-md hover:scale-110 transition-transform`}
            aria-label={recipe.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleToggleBookmark}
            className={`w-8 h-8 rounded-full ${recipe.isBookmarked ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-90 text-gray-600'} flex items-center justify-center shadow-md hover:scale-110 transition-transform`}
            aria-label={recipe.isBookmarked ? "Quitar de guardados" : "Guardar receta"}
          >
            <Bookmark className={`w-4 h-4 ${recipe.isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Recipe Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {recipe.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">{recipe.rating}</span>
              <span className="text-xs text-gray-500">({recipe.reviewCount})</span>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
            {recipe.description}
          </p>
        </div>

        {/* Recipe Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-center">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {recipe.prepTime + recipe.cookTime}min
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          
          <div className="text-center">
            <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {recipe.servings}
            </div>
            <div className="text-xs text-gray-500">Porciones</div>
          </div>
          
          <div className="text-center">
            <ChefHat className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {recipe.difficulty}
            </div>
            <div className="text-xs text-gray-500">Nivel</div>
          </div>
        </div>

        {/* Tags and Category */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getCuisineEmoji(recipe.cuisine)} {recipe.cuisine}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          </div>
          
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nutrition Info */}
        {recipe.nutritionInfo && (
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">
              Información Nutricional (por porción)
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-white">{recipe.nutritionInfo.calories}</div>
                <div className="text-gray-500">kcal</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-white">{recipe.nutritionInfo.protein}g</div>
                <div className="text-gray-500">proteína</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-white">{recipe.nutritionInfo.carbs}g</div>
                <div className="text-gray-500">carbos</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-white">{recipe.nutritionInfo.fat}g</div>
                <div className="text-gray-500">grasa</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => onAddToPlan?.(recipe)} aria-label="Agregar al planificador">
              <Plus className="w-4 h-4 mr-1" />
              Planificar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onShare?.(recipe)} aria-label="Compartir receta">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            por {recipe.author}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { RecipeCard as default };