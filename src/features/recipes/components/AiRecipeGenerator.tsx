'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  ChefHat,
  Clock,
  Users,
  Zap,
  RefreshCw,
  Save,
  Edit,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  AIRecipeRequest,
  CuisineType,
  MealType,
  DietaryTag,
  DifficultyLevel,
  RecipeFormData,
} from '../types';
import { useRecipeStore } from '../store/recipeStore';

import { RecipeForm } from './RecipeForm';
import { NutritionBadge } from './NutritionBadge';

interface AiRecipeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: RecipeFormData) => void;
}

export const AiRecipeGenerator: React.FC<AiRecipeGeneratorProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const {
    aiRequest,
    aiResponse,
    isGeneratingAI,
    setAIRequest,
    generateAIRecipe,
    saveAIRecipe,
  } = useRecipeStore();

  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<'claude' | 'gemini'>('claude');
  const [prompt, setPrompt] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<AIRecipeRequest>({
    provider: 'claude',
    servings: 4,
    difficulty: 'medium',
  });

  const cuisineTypes: CuisineType[] = [
    'mexican', 'italian', 'chinese', 'japanese', 'indian',
    'french', 'mediterranean', 'american', 'thai', 'spanish',
  ];

  const mealTypes: MealType[] = [
    'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer',
  ];

  const dietaryTags: DietaryTag[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'nut-free', 'low-carb', 'keto', 'paleo',
  ];

  const styles = ['traditional', 'fusion', 'healthy', 'comfort', 'gourmet'] as const;

  const handleGenerate = async () => {
    const request: AIRecipeRequest = {
      ...selectedOptions,
      prompt: prompt || undefined,
      provider,
    };
    
    setAIRequest(request);
    await generateAIRecipe(request);
  };

  const handleRegenerate = () => {
    if (aiRequest) {
      generateAIRecipe(aiRequest);
    }
  };

  const handleSaveRecipe = async (formData: RecipeFormData) => {
    await saveAIRecipe(formData);
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-4xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg bg-white/20 p-2 backdrop-blur transition-colors hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-3 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Recipe Generator</h2>
                <p className="text-white/80">
                  Create unique recipes with AI assistance
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!aiResponse && !showForm ? (
              // Generation Form
              <div className="space-y-6">
                {/* Provider Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    AI Provider
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setProvider('claude')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 p-3 font-medium transition-colors',
                        provider === 'claude'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <Zap className="h-5 w-5" />
                      Claude
                    </button>
                    <button
                      onClick={() => setProvider('gemini')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 p-3 font-medium transition-colors',
                        provider === 'gemini'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                      Gemini
                    </button>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Describe Your Recipe (Optional)
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A healthy breakfast bowl with quinoa and fresh fruits, inspired by Mediterranean cuisine..."
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Options Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Cuisine Type */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Cuisine Type
                    </label>
                    <select
                      value={selectedOptions.cuisine_type || ''}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        cuisine_type: e.target.value as CuisineType || undefined,
                      })}
                      className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                    >
                      <option value="">Any cuisine</option>
                      {cuisineTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Meal Type */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Meal Type
                    </label>
                    <select
                      value={selectedOptions.meal_type || ''}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        meal_type: e.target.value as MealType || undefined,
                      })}
                      className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                    >
                      <option value="">Any meal</option>
                      {mealTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Servings */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Servings
                    </label>
                    <input
                      type="number"
                      value={selectedOptions.servings || 4}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        servings: parseInt(e.target.value) || 4,
                      })}
                      min="1"
                      max="12"
                      className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Max Cook Time */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Max Cook Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={selectedOptions.max_cook_time || ''}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        max_cook_time: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                      placeholder="Any time"
                      className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Difficulty Level
                    </label>
                    <select
                      value={selectedOptions.difficulty || 'medium'}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        difficulty: e.target.value as DifficultyLevel,
                      })}
                      className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Recipe Style
                    </label>
                    <select
                      value={selectedOptions.style || ''}
                      onChange={(e) => setSelectedOptions({
                        ...selectedOptions,
                        style: e.target.value as any || undefined,
                      })}
                      className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                    >
                      <option value="">Any style</option>
                      {styles.map((style) => (
                        <option key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dietary Tags */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Dietary Preferences
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = selectedOptions.dietary_tags || [];
                          setSelectedOptions({
                            ...selectedOptions,
                            dietary_tags: current.includes(tag)
                              ? current.filter(t => t !== tag)
                              : [...current, tag],
                          });
                        }}
                        className={cn(
                          'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                          selectedOptions.dietary_tags?.includes(tag)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Ingredients */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Available Ingredients (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., chicken, rice, tomatoes (comma separated)"
                    onChange={(e) => setSelectedOptions({
                      ...selectedOptions,
                      available_ingredients: e.target.value
                        .split(',')
                        .map(i => i.trim())
                        .filter(Boolean),
                    })}
                    className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGeneratingAI}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate Recipe
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : showForm && aiResponse ? (
              // Recipe Form
              <RecipeForm
                onSubmit={handleSaveRecipe}
                onCancel={() => setShowForm(false)}
                isAIGenerated
              />
            ) : aiResponse ? (
              // Generated Recipe Preview
              <div className="space-y-6">
                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {aiResponse.recipe.title}
                      </h3>
                      <p className="mt-2 text-gray-600">
                        {aiResponse.recipe.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                      {Math.round(aiResponse.confidence_score * 100)}% match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="text-center">
                      <Clock className="mx-auto mb-1 h-6 w-6 text-gray-600" />
                      <div className="text-sm text-gray-600">Total Time</div>
                      <div className="font-semibold">
                        {aiResponse.recipe.prep_time + aiResponse.recipe.cook_time} min
                      </div>
                    </div>
                    <div className="text-center">
                      <Users className="mx-auto mb-1 h-6 w-6 text-gray-600" />
                      <div className="text-sm text-gray-600">Servings</div>
                      <div className="font-semibold">{aiResponse.recipe.servings}</div>
                    </div>
                    <div className="text-center">
                      <ChefHat className="mx-auto mb-1 h-6 w-6 text-gray-600" />
                      <div className="text-sm text-gray-600">Difficulty</div>
                      <div className="font-semibold capitalize">{aiResponse.recipe.difficulty}</div>
                    </div>
                    <div className="text-center">
                      <Sparkles className="mx-auto mb-1 h-6 w-6 text-gray-600" />
                      <div className="text-sm text-gray-600">AI Provider</div>
                      <div className="font-semibold capitalize">{provider}</div>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold">Ingredients</h4>
                  <div className="space-y-2">
                    {aiResponse.recipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-medium">
                          {ing.quantity} {ing.unit}
                        </span>
                        <span>{ing.name}</span>
                        {ing.notes && <span className="text-gray-600">({ing.notes})</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold">Instructions</h4>
                  <div className="space-y-3">
                    {aiResponse.recipe.instructions.map((inst, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                          {idx + 1}
                        </span>
                        <p className="flex-1">{inst.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutrition */}
                {aiResponse.recipe.nutritional_info && (
                  <div>
                    <h4 className="mb-3 text-lg font-semibold">Nutrition</h4>
                    <NutritionBadge
                      nutrition={aiResponse.recipe.nutritional_info}
                      servings={aiResponse.recipe.servings}
                      variant="compact"
                    />
                  </div>
                )}

                {/* Suggestions */}
                {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 font-semibold text-blue-900">AI Suggestions</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                      {aiResponse.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRegenerate}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Regenerate
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 py-3 font-medium text-primary hover:bg-primary/5"
                  >
                    <Edit className="h-5 w-5" />
                    Edit Recipe
                  </button>
                  <button
                    onClick={() => {
                      if (aiResponse) {
                        handleSaveRecipe(aiResponse.recipe as RecipeFormData);
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white hover:bg-primary/90"
                  >
                    <Save className="h-5 w-5" />
                    Save Recipe
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};