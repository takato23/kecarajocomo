'use client';

import React, { useState } from 'react';
import {
  Clock,
  Users,
  ChefHat,
  Star,
  Heart,
  Share2,
  Printer,
  Edit,
  Play,
  Check,
  X,
  Sparkles,
  Flame,
  Timer,
  Plus,
  Minus,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { Recipe, CookingSession } from '../types';
import { useRecipeStore } from '../store/recipeStore';

import { NutritionBadge } from './NutritionBadge';

interface RecipeDetailProps {
  recipe: Recipe;
  onEdit?: () => void;
  onClose?: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onEdit,
  onClose,
}) => {
  const { startCookingSession, completeCookingSession, rateRecipe, addToFavorites } = useRecipeStore();
  
  const [activeTab, setActiveTab] = useState<'instructions' | 'nutrition' | 'reviews'>('instructions');
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [cookingSession, setCookingSession] = useState<CookingSession | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [userRating, setUserRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const adjustedServings = recipe.servings * servingsMultiplier;

  const handleStartCooking = async () => {
    const session = await startCookingSession(recipe.id);
    setCookingSession(session);
  };

  const handleCompleteCooking = async () => {
    if (!cookingSession) return;
    
    await completeCookingSession(cookingSession.id, {
      completed_at: new Date().toISOString(),
      recipe_id: recipe.id,
    });
    
    setCookingSession(null);
    setCompletedSteps(new Set());
    setShowRatingModal(true);
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const handleRate = async (rating: number) => {
    setUserRating(rating);
    await rateRecipe(recipe.id, rating);
    setShowRatingModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
            {recipe.ai_generated && (
              <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                <Sparkles className="h-4 w-4" />
                AI Generated
              </span>
            )}
          </div>
          <p className="text-lg text-gray-600">{recipe.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => addToFavorites(recipe.id)}
            className="rounded-lg p-2 hover:bg-gray-100"
            title="Add to favorites"
          >
            <Heart className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="rounded-lg p-2 hover:bg-gray-100"
            title="Share recipe"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handlePrint}
            className="rounded-lg p-2 hover:bg-gray-100"
            title="Print recipe"
          >
            <Printer className="h-5 w-5 text-gray-600" />
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded-lg p-2 hover:bg-gray-100"
              title="Edit recipe"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image */}
      {recipe.image_url && (
        <div className="mb-6 overflow-hidden rounded-lg">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-96 w-full object-cover"
          />
        </div>
      )}

      {/* Recipe Info */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <div className="text-sm text-gray-600">Prep Time</div>
          <div className="font-semibold">{recipe.prep_time} min</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <Flame className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <div className="text-sm text-gray-600">Cook Time</div>
          <div className="font-semibold">{recipe.cook_time} min</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <Timer className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <div className="text-sm text-gray-600">Total Time</div>
          <div className="font-semibold">{recipe.total_time} min</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <Users className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <div className="text-sm text-gray-600">Servings</div>
          <div className="font-semibold">{recipe.servings}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <ChefHat className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <div className="text-sm text-gray-600">Difficulty</div>
          <div className={cn('rounded px-2 py-1 text-sm font-semibold', getDifficultyColor(recipe.difficulty))}>
            {recipe.difficulty}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-yellow-400" />
          <div className="text-sm text-gray-600">Rating</div>
          <div className="font-semibold">{recipe.rating?.toFixed(1) || 'N/A'}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
          {getCuisineEmoji(recipe.cuisine_type)} {recipe.cuisine_type}
        </span>
        {recipe.meal_types.map((type) => (
          <span key={type} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
            {type}
          </span>
        ))}
        {recipe.dietary_tags.map((tag) => (
          <span key={tag} className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
            {tag}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('instructions')}
            className={cn(
              'border-b-2 py-2 px-1 text-sm font-medium',
              activeTab === 'instructions'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Instructions
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={cn(
              'border-b-2 py-2 px-1 text-sm font-medium',
              activeTab === 'nutrition'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Nutrition
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'border-b-2 py-2 px-1 text-sm font-medium',
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            Reviews ({recipe.times_cooked || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'instructions' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ingredients</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setServingsMultiplier(Math.max(0.5, servingsMultiplier - 0.5))}
                    className="rounded p-1 hover:bg-gray-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium">
                    {adjustedServings} servings
                  </span>
                  <button
                    onClick={() => setServingsMultiplier(servingsMultiplier + 0.5)}
                    className="rounded p-1 hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary"
                      disabled={!cookingSession}
                    />
                    <div className="flex-1">
                      <span className="font-medium">
                        {(ingredient.quantity * servingsMultiplier).toFixed(1)} {ingredient.unit}
                      </span>{' '}
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="block text-sm text-gray-500">{ingredient.notes}</span>
                      )}
                      {ingredient.optional && (
                        <span className="text-xs text-gray-500">(optional)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {!cookingSession ? (
                <button
                  onClick={handleStartCooking}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary/90"
                >
                  <Play className="h-5 w-5" />
                  Start Cooking
                </button>
              ) : (
                <button
                  onClick={handleCompleteCooking}
                  disabled={completedSteps.size !== recipe.instructions.length}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
                >
                  <Check className="h-5 w-5" />
                  Complete Cooking
                </button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Instructions</h3>
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-4 rounded-lg p-4',
                    cookingSession && 'cursor-pointer hover:bg-gray-50',
                    completedSteps.has(instruction.step_number) && 'bg-green-50'
                  )}
                  onClick={() => cookingSession && handleStepComplete(instruction.step_number)}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                      completedSteps.has(instruction.step_number)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {completedSteps.has(instruction.step_number) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      instruction.step_number
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'text-gray-700',
                      completedSteps.has(instruction.step_number) && 'line-through'
                    )}>
                      {instruction.text}
                    </p>
                    {instruction.time_minutes && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <Timer className="h-4 w-4" />
                        {instruction.time_minutes} minutes
                      </div>
                    )}
                    {instruction.temperature && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Flame className="h-4 w-4" />
                        {instruction.temperature.value}°{instruction.temperature.unit === 'celsius' ? 'C' : 'F'}
                      </div>
                    )}
                    {instruction.tips && instruction.tips.length > 0 && (
                      <div className="mt-2 rounded bg-blue-50 p-2 text-sm text-blue-700">
                        💡 {instruction.tips.join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="mx-auto max-w-2xl">
          <NutritionBadge
            nutrition={recipe.nutritional_info}
            servings={adjustedServings}
            variant="full"
          />
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-gray-600">
              This recipe has been cooked {recipe.times_cooked || 0} times.
            </p>
            {recipe.rating && (
              <div className="mt-4 flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-6 w-6',
                      star <= Math.round(recipe.rating!)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
                <span className="ml-2 text-lg font-medium">{recipe.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">How was {recipe.title}?</h3>
            <div className="mb-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition-colors',
                      star <= userRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    )}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRatingModal(false)}
              className="w-full rounded-lg bg-gray-100 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};