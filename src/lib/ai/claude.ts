// Legacy Claude service - Redirects to unified AI service
// This file is kept for backward compatibility during migration
// TODO: Remove this file once all imports are updated

import { UnifiedAIService } from '@/services/ai';

const aiService = new UnifiedAIService();

export interface ClaudeResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface RecipeGenerationParams {
  ingredients: string[];
  dietaryRestrictions?: string[];
  cuisinePreference?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  servings?: number;
  maxTime?: number;
}

export interface MealPlanGenerationParams {
  days: number;
  peopleCount: number;
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  budget?: 'low' | 'medium' | 'high';
  nutritionGoals?: string[];
}

export class ClaudeService {
  async generateRecipe(params: RecipeGenerationParams): Promise<any> {
    console.warn('Deprecated: Use UnifiedAIService.generateRecipe() instead');
    return aiService.generateRecipe({
      ingredients: params.ingredients,
      preferences: {
        dietary: params.dietaryRestrictions,
        cuisine: params.cuisinePreference,
        difficulty: params.difficulty,
        servings: params.servings,
        maxCookTime: params.maxTime
      }
    });
  }

  async suggestRecipeModification(recipe: any, requirements: string): Promise<string> {
    console.warn('Deprecated: Use UnifiedAIService.improveRecipe() instead');
    return aiService.improveRecipe(recipe, requirements);
  }

  async generateMealPlan(params: MealPlanGenerationParams): Promise<any> {
    console.warn('Deprecated: Use UnifiedAIService.generateMealPlan() instead');
    return aiService.generateMealPlan({
      days: params.days,
      peopleCount: params.peopleCount,
      dietary: params.dietaryRestrictions,
      cuisines: params.cuisinePreferences,
      budget: params.budget,
      goals: params.nutritionGoals
    });
  }

  async analyzeNutrition(ingredients: any[]): Promise<any> {
    console.warn('Deprecated: Use UnifiedAIService.analyzeNutrition() instead');
    return aiService.analyzeNutrition(ingredients);
  }

  async suggestSubstitutions(ingredient: string, reason?: string): Promise<string[]> {
    console.warn('Deprecated: Use UnifiedAIService.suggestSubstitutions() instead');
    const result = await aiService.suggestSubstitutions(ingredient, reason);
    return Array.isArray(result) ? result : result.split('\n').filter(line => line.trim());
  }

  async generateShoppingTips(items: string[]): Promise<string> {
    console.warn('Deprecated: Use UnifiedAIService.generateShoppingTips() instead');
    return aiService.generateShoppingTips(items);
  }

  async suggestRecipesFromPantry(pantryItems: string[]): Promise<any[]> {
    console.warn('Deprecated: Use UnifiedAIService.suggestRecipesFromPantry() instead');
    return aiService.suggestRecipesFromPantry(pantryItems);
  }
}

export const claudeService = new ClaudeService();