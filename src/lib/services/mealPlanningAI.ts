import { GoogleGenerativeAI } from '@google/generative-ai';

import { prisma } from '../prisma';
import { 
  MealPlanningError, 
  MealPlanningErrorFactory, 
  MealPlanningErrorCodes, 
  RetryHandler,
  ErrorReporter
} from '../errors/MealPlanningError';
import {
  UserPreferences,
  PlanningConstraints,
  WeeklyPlan,
  MealSuggestion,
  AsyncMealPlanningResult,
  UserPreferencesSchema,
  PlanningConstraintsSchema,
  PositiveInteger,
  Minutes
} from '../types/mealPlanning';

import { enhancedCache, CacheKeyGenerator } from './enhancedCacheService';

// Remove old interface definitions as they're now imported from types

// Remove old interface definitions as they're now imported from types

// Remove old interface definitions as they're now imported from types

/**
 * Enhanced Meal Planning AI Service
 * Provides intelligent meal planning with comprehensive error handling and type safety
 */
export class EnhancedMealPlanningAI {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor() {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw MealPlanningErrorFactory.aiServiceUnavailable(
        new Error('GOOGLE_AI_API_KEY environment variable is required')
      );
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp', // Actualizado a Flash 2.0 para mejor rendimiento y menor costo
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.9,
          topK: 40,
        }
      });
    } catch (error: unknown) {
      throw MealPlanningErrorFactory.aiServiceUnavailable(error as Error);
    }
  }

  /**
   * Generate a comprehensive weekly meal plan
   * @param preferences User dietary preferences and constraints
   * @param constraints Planning constraints and requirements
   * @returns Promise<WeeklyPlan> Complete weekly meal plan
   */
  async generateWeeklyPlan(
    preferences: UserPreferences, 
    constraints: PlanningConstraints
  ): AsyncMealPlanningResult<WeeklyPlan> {
    try {
      // Validate inputs
      this.validatePreferences(preferences);
      this.validateConstraints(constraints);
      
      const cacheKey = CacheKeyGenerator.mealPlan(
        preferences.userId, 
        constraints.startDate.toISOString().split('T')[0]
      );
      
      // Check enhanced cache first
      const cached = await enhancedCache.get<WeeklyPlan>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Execute with retry logic
      const result = await RetryHandler.withRetry(
        async () => this.generateWeeklyPlanInternal(preferences, constraints),
        this.MAX_RETRIES,
        this.RETRY_DELAY
      );
      
      // Cache the result with enhanced caching
      await enhancedCache.set(cacheKey, result, this.CACHE_TTL);
      
      return { success: true, data: result };
      
    } catch (error: unknown) {
      ErrorReporter.report(error as MealPlanningError, { 
        userId: preferences.userId,
        operation: 'generateWeeklyPlan'
      });
      
      if (error instanceof MealPlanningError) {
        return { success: false, error: error.message, code: error.code };
      }
      
      return { 
        success: false, 
        error: 'Failed to generate weekly meal plan', 
        code: MealPlanningErrorCodes.AI_SERVICE_UNAVAILABLE 
      };
    }
  }

  /**
   * Internal method to generate weekly plan with enhanced error handling
   */
  private async generateWeeklyPlanInternal(
    preferences: UserPreferences, 
    constraints: PlanningConstraints
  ): Promise<WeeklyPlan> {
    const startTime = Date.now();
    
    try {
      // Get user's pantry items with error handling
      const pantryItems = await this.getUserPantryItemsSafe(preferences.userId);
      
      // Get user's favorite recipes with error handling
      const favoriteRecipes = await this.getUserFavoriteRecipesSafe(preferences.userId);
      
      // Generate meal suggestions using AI with validation
      const mealSuggestions = await this.generateMealSuggestionsWithValidation(
        preferences, 
        constraints, 
        pantryItems, 
        favoriteRecipes
      );
      
      // Create weekly plan structure
      const weeklyPlan = await this.createWeeklyPlanStructure(
        preferences,
        constraints,
        mealSuggestions
      );
      
      // Calculate summaries in parallel for better performance
      const [nutritionSummary, budgetSummary, prepPlan, shoppingList] = await Promise.all([
        this.calculateNutritionSummary(weeklyPlan.meals, preferences),
        this.calculateBudgetSummary(weeklyPlan.meals, preferences),
        this.generatePrepPlan(weeklyPlan.meals),
        this.generateShoppingList(weeklyPlan.meals, pantryItems)
      ]);
      
      // Build complete plan
      const completePlan: WeeklyPlan = {
        ...weeklyPlan,
        nutritionSummary,
        budgetSummary,
        prepPlan,
        shoppingList,
        confidence: this.calculateOverallConfidence({
          ...weeklyPlan,
          nutritionSummary,
          budgetSummary,
          prepPlan,
          shoppingList
        }),
        metadata: {
          aiModel: 'gemini-1.5-flash',
          generationTime: (Date.now() - startTime) as Minutes,
          revisionCount: PositiveInteger.create(1),
          userFeedback: null
        }
      };
      
      return completePlan;
      
    } catch (error: unknown) {
      if (error instanceof MealPlanningError) {
        throw error;
      }
      
      throw new MealPlanningError(
        'Failed to generate weekly meal plan',
        MealPlanningErrorCodes.AI_SERVICE_UNAVAILABLE,
        { originalError: error },
        undefined,
        true
      );
    }
  }

  /**
   * Validate user preferences
   */
  private validatePreferences(preferences: UserPreferences): void {
    try {
      UserPreferencesSchema.parse(preferences);
    } catch (error: unknown) {
      throw MealPlanningErrorFactory.invalidPreferences(
        error instanceof Error ? { validation: error.message } : { validation: 'Invalid preferences' }
      );
    }
  }

  /**
   * Validate planning constraints
   */
  private validateConstraints(constraints: PlanningConstraints): void {
    try {
      PlanningConstraintsSchema.parse(constraints);
      
      // Additional business logic validation
      if (constraints.endDate <= constraints.startDate) {
        throw new Error('End date must be after start date');
      }
      
      if (constraints.mealTypes.length === 0) {
        throw new Error('At least one meal type must be specified');
      }
      
    } catch (error: unknown) {
      throw new MealPlanningError(
        'Invalid planning constraints',
        MealPlanningErrorCodes.INVALID_CONSTRAINTS,
        { validation: error instanceof Error ? error.message : 'Invalid constraints' },
        undefined,
        false
      );
    }
  }

  /**
   * Generate meal suggestions with enhanced prompt engineering
   */
  private async generateMealSuggestionsWithValidation(
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    pantryItems: any[],
    favoriteRecipes: any[]
  ): Promise<MealSuggestion[]> {
    try {
      // Use enhanced prompt engineering
      const { promptEngineering } = await import('./promptEngineering');
      const promptResult = promptEngineering.generateMealPlanningPrompt(
        preferences,
        constraints,
        pantryItems,
        favoriteRecipes
      );

      if (!promptResult.success) {
        throw new MealPlanningError(
          'Failed to generate meal planning prompt',
          MealPlanningErrorCodes.INVALID_PREFERENCES,
          { errors: promptResult.errors }
        );
      }

      // Generate AI response with timeout
      const result = await Promise.race([
        this.model.generateContent(promptResult.prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI request timeout')), 30000)
        )
      ]);

      const response = await (result as any).response;
      const text = response.text();
      
      // Validate AI response
      const { isValidAIResponse } = await import('../types/mealPlanning');
      
      try {
        const jsonData = JSON.parse(text);
        
        if (!isValidAIResponse(jsonData)) {
          throw MealPlanningErrorFactory.aiResponseInvalid(jsonData, 'Invalid response structure');
        }
        
        return this.processMealSuggestions(jsonData);
      } catch (parseError: unknown) {
        console.error('Error parsing AI response:', parseError);
        throw MealPlanningErrorFactory.aiResponseInvalid(text, 'JSON parsing failed');
      }
      
    } catch (error: unknown) {
      if (error instanceof MealPlanningError) {
        throw error;
      }
      
      // Fallback to database recipes
      console.warn('AI meal suggestion failed, using fallback strategy:', error);
      return this.generateFallbackMealSuggestions(preferences, constraints);
    }
  }

  private async processMealSuggestions(aiResponse: any): Promise<MealSuggestion[]> {
    const suggestions: MealSuggestion[] = [];
    
    for (const dayMeals of aiResponse.meals) {
      for (const mealType of ['breakfast', 'lunch', 'dinner']) {
        const meal = dayMeals[mealType];
        if (meal) {
          suggestions.push({
            recipeId: `ai-${Date.now()}-${mealType}`,
            recipe: {
              id: `ai-${Date.now()}-${mealType}`,
              title: meal.name,
              description: meal.reasoning || '',
              prepTimeMinutes: meal.prep_time || 30,
              cookTimeMinutes: meal.cook_time || 30,
              servings: meal.servings || 4,
              difficulty: meal.difficulty || 'medium',
              ingredients: meal.ingredients.map((name: string) => ({
                name,
                quantity: 1,
                unit: 'porción'
              }))
            },
            confidence: 0.8,
            reasoning: meal.reasoning || '',
            nutritionMatch: 0.8,
            budgetMatch: 0.7,
            pantryMatch: meal.pantry_match || 0.6,
            timeMatch: 0.8,
            preferenceMatch: 0.7
          });
        }
      }
    }
    
    return suggestions;
  }

  private async generateFallbackMealSuggestions(
    preferences: UserPreferences,
    constraints: PlanningConstraints
  ): Promise<MealSuggestion[]> {
    // Get existing recipes from database that match preferences
    const recipes = await prisma.recipe.findMany({
      where: {
        AND: [
          { prepTimeMinutes: { lte: constraints.maxPrepTime } },
          { servings: { gte: constraints.servings } },
          // Add more filters based on preferences
        ]
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      },
      take: 21 // 3 meals × 7 days
    });

    return recipes.map(recipe => ({
      recipeId: recipe.id,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description || '',
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl,
        ingredients: recipe.ingredients.map(ri => ({
          name: ri.ingredient.name,
          quantity: ri.quantity,
          unit: ri.unit
        }))
      },
      confidence: 0.6,
      reasoning: 'Receta seleccionada de la base de datos',
      nutritionMatch: 0.6,
      budgetMatch: 0.6,
      pantryMatch: 0.5,
      timeMatch: 0.7,
      preferenceMatch: 0.6
    }));
  }

  /**
   * Get user's pantry items with error handling and caching
   */
  private async getUserPantryItemsSafe(userId: string): Promise<any[]> {
    try {
      return await prisma.pantryItem.findMany({
        where: { userId },
        include: {
          ingredient: true
        }
      });
    } catch (error: unknown) {
      console.warn('Failed to fetch pantry items:', error);
      return [];
    }
  }

  /**
   * Get user's favorite recipes with error handling and caching
   */
  private async getUserFavoriteRecipesSafe(userId: string): Promise<any[]> {
    try {
      return await prisma.favoriteRecipe.findMany({
        where: { userId },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true
                }
              }
            }
          }
        }
      });
    } catch (error: unknown) {
      console.warn('Failed to fetch favorite recipes:', error);
      return [];
    }
  }

  private async createWeeklyPlanStructure(
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    mealSuggestions: MealSuggestion[]
  ): Promise<WeeklyPlan> {
    const weeklyPlan: WeeklyPlan = {
      id: `plan-${Date.now()}`,
      userId: preferences.userId,
      weekStartDate: constraints.startDate,
      meals: [],
      nutritionSummary: {} as any,
      budgetSummary: {} as any,
      prepPlan: {} as any,
      shoppingList: {} as any,
      confidence: 0,
      generatedAt: new Date()
    };

    // Create daily meals structure
    for (let i = 0; i < 7; i++) {
      const date = new Date(constraints.startDate);
      date.setDate(date.getDate() + i);
      
      const dailyMeals: any = {
        date,
        breakfast: mealSuggestions[i * 3],
        lunch: mealSuggestions[i * 3 + 1],
        dinner: mealSuggestions[i * 3 + 2]
      };
      
      weeklyPlan.meals.push(dailyMeals);
    }

    return weeklyPlan;
  }

  private async calculateNutritionSummary(
    meals: any[],
    preferences: UserPreferences
  ): Promise<any> {
    // This would calculate nutrition based on recipe ingredients
    // For now, return a mock summary
    return {
      totalCalories: 14000,
      totalProtein: 420,
      totalCarbs: 1750,
      totalFat: 466,
      dailyAverages: {
        calories: 2000,
        protein: 60,
        carbs: 250,
        fat: 66
      },
      goalProgress: {
        calories: 85,
        protein: 90,
        carbs: 80,
        fat: 75
      },
      nutritionScore: 85
    };
  }

  private async calculateBudgetSummary(
    meals: any[],
    preferences: UserPreferences
  ): Promise<any> {
    // This would calculate costs based on current ingredient prices
    // For now, return a mock summary
    return {
      totalCost: 87.50,
      dailyAverage: 12.50,
      budgetUsed: 75,
      costPerServing: 5.25,
      savingsOpportunities: [
        'Compra tomates en temporada',
        'Usa más legumbres para proteína',
        'Aprovecha ofertas de pollo'
      ],
      budgetScore: 80
    };
  }

  private async generatePrepPlan(meals: any[]): Promise<any> {
    // This would analyze recipes and create an optimal prep plan
    // For now, return a mock prep plan
    return {
      totalPrepTime: 270, // 4.5 hours
      prepSessions: [
        {
          date: new Date(),
          duration: 120,
          tasks: [
            {
              id: 'prep-1',
              description: 'Cortar verduras para la semana',
              duration: 45,
              difficulty: 'easy',
              recipes: ['lunch-1', 'dinner-2'],
              ingredients: ['cebolla', 'zanahoria', 'apio']
            }
          ],
          equipment: ['cuchillo', 'tabla de cortar']
        }
      ],
      batchCookingOpportunities: [
        'Cocinar arroz integral para 3 comidas',
        'Preparar pollo marinado para 2 días'
      ],
      leftoverManagement: [
        'Usar pollo sobrante para ensalada del martes',
        'Convertir vegetales asados en sopa'
      ],
      efficiencyScore: 85
    };
  }

  private async generateShoppingList(
    meals: any[],
    pantryItems: any[]
  ): Promise<any> {
    // This would generate a smart shopping list
    // For now, return a mock shopping list
    return {
      id: `shopping-${Date.now()}`,
      totalItems: 25,
      totalCost: 87.50,
      categories: [
        {
          name: 'Verduras',
          items: [
            {
              name: 'Tomates',
              quantity: 2,
              unit: 'kg',
              estimatedCost: 8.50,
              priority: 'high',
              recipes: ['ensalada-1', 'pasta-2'],
              alternatives: ['tomates cherry', 'tomates enlatados']
            }
          ],
          storeSections: ['Verdulería']
        }
      ],
      substitutions: [
        {
          originalItem: 'Carne de res',
          alternatives: [
            {
              name: 'Pollo',
              costDifference: -5.00,
              nutritionDifference: -0.1,
              availability: 0.9
            }
          ]
        }
      ],
      pantryOptimization: [
        'Ya tienes arroz, no necesitas comprar',
        'Usa las lentejas antes de que venzan'
      ]
    };
  }

  private calculateOverallConfidence(plan: WeeklyPlan): number {
    // Calculate confidence based on various factors
    const nutritionScore = plan.nutritionSummary.nutritionScore || 0;
    const budgetScore = plan.budgetSummary.budgetScore || 0;
    const efficiencyScore = plan.prepPlan.efficiencyScore || 0;
    
    return (nutritionScore + budgetScore + efficiencyScore) / 3 / 100;
  }

  // Additional methods for recipe recommendations, meal optimization, etc.
  
  async suggestRecipes(constraints: PlanningConstraints): Promise<MealSuggestion[]> {
    // Implementation for recipe suggestions
    return [];
  }

  async optimizeMealPrep(meals: any[]): Promise<any> {
    // Implementation for meal prep optimization
    return {} as any;
  }

  async analyzeNutrition(plan: WeeklyPlan): Promise<any> {
    // Implementation for nutrition analysis
    return {} as any;
  }
}

// Export singleton instance
export const mealPlanningAI = new EnhancedMealPlanningAI();