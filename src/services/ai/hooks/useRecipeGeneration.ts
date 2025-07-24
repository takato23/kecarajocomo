'use client';

/**
 * useRecipeGeneration Hook
 * Specialized hook for AI-powered recipe generation
 */

import { useState, useCallback } from 'react';

import {
  AIRecipeRequest,
  GeneratedRecipe,
  PantryItem,
  UserPreferences,
  RecipeConstraints,
  MealType,
  RecipeDifficulty,
} from '../types';

import { useAIService } from './useAIService';

export interface UseRecipeGenerationOptions {
  onRecipeGenerated?: (recipe: GeneratedRecipe) => void;
  onError?: (error: Error) => void;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'auto';
}

export interface UseRecipeGenerationReturn {
  isGenerating: boolean;
  error: Error | null;
  lastRecipe: GeneratedRecipe | null;
  
  generateRecipe: (options: RecipeGenerationOptions) => Promise<GeneratedRecipe>;
  generateFromPantry: (pantryItems: PantryItem[], preferences?: UserPreferences) => Promise<GeneratedRecipe>;
  generateByMealType: (mealType: MealType, preferences?: UserPreferences) => Promise<GeneratedRecipe>;
  suggestVariations: (recipe: GeneratedRecipe, count?: number) => Promise<GeneratedRecipe[]>;
  reset: () => void;
}

export interface RecipeGenerationOptions {
  ingredients?: string[];
  pantryItems?: PantryItem[];
  preferences?: UserPreferences;
  mealType?: MealType;
  cuisine?: string;
  difficulty?: RecipeDifficulty;
  servings?: number;
  maxTime?: number;
  constraints?: RecipeConstraints;
  prompt?: string;
}

export function useRecipeGeneration(options: UseRecipeGenerationOptions = {}): UseRecipeGenerationReturn {
  const [lastRecipe, setLastRecipe] = useState<GeneratedRecipe | null>(null);
  
  const aiService = useAIService({
    provider: options.provider,
    onError: options.onError,
    onSuccess: (response) => {
      if ('ingredients' in response && 'instructions' in response) {
        setLastRecipe(response as GeneratedRecipe);
        options.onRecipeGenerated?.(response as GeneratedRecipe);
      }
    },
  });

  const generateRecipe = useCallback(async (genOptions: RecipeGenerationOptions): Promise<GeneratedRecipe> => {
    const request: AIRecipeRequest = {
      ingredients: genOptions.ingredients,
      pantryItems: genOptions.pantryItems,
      preferences: genOptions.preferences,
      mealType: genOptions.mealType,
      cuisine: genOptions.cuisine,
      difficulty: genOptions.difficulty,
      servings: genOptions.servings,
      maxTime: genOptions.maxTime,
      constraints: genOptions.constraints,
    };

    const recipe = await aiService.generateRecipe(request);
    setLastRecipe(recipe);
    return recipe;
  }, [aiService]);

  const generateFromPantry = useCallback(async (
    pantryItems: PantryItem[],
    preferences?: UserPreferences
  ): Promise<GeneratedRecipe> => {
    // Extract ingredient names from pantry items
    const ingredients = pantryItems.map(item => item.name);
    
    return generateRecipe({
      ingredients,
      pantryItems,
      preferences,
      prompt: 'Create a recipe using primarily these pantry ingredients',
    });
  }, [generateRecipe]);

  const generateByMealType = useCallback(async (
    mealType: MealType,
    preferences?: UserPreferences
  ): Promise<GeneratedRecipe> => {
    return generateRecipe({
      mealType,
      preferences,
      prompt: `Create a delicious ${mealType} recipe`,
    });
  }, [generateRecipe]);

  const suggestVariations = useCallback(async (
    recipe: GeneratedRecipe,
    count: number = 3
  ): Promise<GeneratedRecipe[]> => {
    const prompt = `Based on this recipe: "${recipe.name}", suggest ${count} variations with different ingredients, flavors, or cooking methods. Each should be distinct but related.

Original ingredients: ${recipe.ingredients.map(i => i.name).join(', ')}
Original cuisine: ${recipe.cuisine}

Provide ${count} complete recipe variations in JSON array format.`;

    const response = await aiService.generateJSON<GeneratedRecipe[]>(
      { prompt, format: 'json' },
      undefined
    );

    return response.data.map((variation, index) => ({
      ...variation,
      id: `${recipe.id}-variation-${index}`,
      aiGenerated: true,
      confidence: 0.8,
    }));
  }, [aiService]);

  const reset = useCallback(() => {
    setLastRecipe(null);
    aiService.reset();
  }, [aiService]);

  return {
    isGenerating: aiService.isLoading,
    error: aiService.error,
    lastRecipe,
    
    generateRecipe,
    generateFromPantry,
    generateByMealType,
    suggestVariations,
    reset,
  };
}