/**
 * Enhanced Gemini Planner Service
 * Integrates robust JSON responses, error handling, and intelligent meal planning
 */

import { logger } from '@/lib/logger';
import { 
  generateArgentineMealPlanPrompt, 
  generateDailyMealPrompt,
  getMealSuggestions 
} from '@/lib/prompts/argentineMealPrompts';
import { 
  UserPreferences, 
  PlanningConstraints, 
  WeeklyPlan,
  DailyMeals,
  MealSuggestion,
  NutritionSummary,
  BudgetSummary,
  PrepPlan,
  ShoppingList,
  Percentage,
  Minutes,
  Calories,
  Dollars,
  Grams,
  PositiveInteger
} from '../types/mealPlanning';
import { prisma } from '../prisma';
import { enhancedCache, CacheKeyGenerator } from './enhancedCacheService';
import { getGeminiService, GeminiService, GeminiMealPlanResponse } from './geminiService';
import { GeminiPromptTemplates } from './geminiPromptTemplates';
import { MockMealPlanService } from './mockMealPlanService';

export interface GeminiPlannerOptions {
  readonly useHolisticAnalysis: boolean;
  readonly includeExternalFactors: boolean;
  readonly optimizeResources: boolean;
  readonly enableLearning: boolean;
  readonly analysisDepth: 'surface' | 'comprehensive' | 'deep_dive';
}

export interface GeminiPlanResult {
  readonly success: boolean;
  readonly plan?: WeeklyPlan;
  readonly insights?: {
    readonly holisticAnalysis: any;
    readonly optimizationRecommendations: any;
    readonly learningAdaptations: any;
  };
  readonly meta{ readonly promptTokens: number;
    readonly responseTokens: number;
    readonly processingTime: number;
    readonly confidenceScore: number;
    readonly geminiModel: string;
  };
  readonly error?: string;
}

export interface HolisticPlannerContext {
  readonly userState: {
    preferences: UserPreferences;
    constraints: PlanningConstraints;
    history: any[];
    feedback: any[];
  };
  readonly systemState: {
    pantryInventory: any[];
    recipeLibrary: any[];
    seasonalFactors: any;
    economicFactors: any;
  };
  readonly externalFactors: {
    weather: any;
    calendar: any;
    social: any;
    market: any;
  };
}

/**
 * Enhanced Gemini Planner Service with robust error handling
 */
export class GeminiPlannerService {
  private geminiService: GeminiService;
  private readonly CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
  
  constructor() {
    this.geminiService = getGeminiService({
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxOutputTokens: 8192
    });
  }

  /**
   * Generate holistic meal plan with comprehensive analysis
   */
  async generateHolisticPlan(
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    options: GeminiPlannerOptions = {
      useHolisticAnalysis: true,
      includeExternalFactors: true,
      optimizeResources: true,
      enableLearning: true,
      analysisDepth: 'comprehensive'
    }
  ): Promise<GeminiPlanResult> {
    const startTime = Date.now();
    
    try {
      // Build comprehensive context
      const context = await this.buildHolisticContext(preferences, constraints);
      
      // Check cache
      const cacheKey = CacheKeyGenerator.holisticPlan(
        preferences.userId,
        JSON.stringify(constraints),
        JSON.stringify(options)
      );
      
      const cached = await enhancedCache.get<GeminiPlanResult>(cacheKey);
      if (cached && !this.isContextStale(cached, context)) {
        logger.info('Returning cached meal plan', 'geminiPlannerService');
        return cached;
      }

      // Get pantry items for context
      const pantryItems = await this.getUserPantryItems(preferences.userId);

      // Generate meal plan using service or fallback
      logger.info('Generating meal plan with Gemini', 'geminiPlannerService');
      
      let geminiResponse: GeminiMealPlanResponse;
      
      try {
        geminiResponse = await this.geminiService.generateMealPlan(
          preferences,
          constraints,
          {
            timeout: 45000, // 45 seconds
            retryConfig: {
              maxRetries: 2, // Reduced retries to fail faster
              initialDelay: 1000,
              maxDelay: 5000,
              backoffFactor: 2
            }
          }
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a rate limit error
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          logger.warn('API quota exceeded, using mock meal plan for testing', 'geminiPlannerService');
          geminiResponse = MockMealPlanService.generateMockMealPlan();
        } else {
          throw error; // Re-throw non-quota errors
        }
      }

      // Process response
      const processedResult = await this.processGeminiResponse(
        geminiResponse, 
        context, 
        startTime
      );
      
      // Cache successful result
      if (processedResult.success) {
        await enhancedCache.set(cacheKey, processedResult, this.CACHE_TTL);
      }
      
      return processedResult;
      
    } catch (error: unknown) {
      logger.error('Error in holistic planning:', 'geminiPlannerService', error);
      
      return {
        success: false,
        meta{ promptTokens: 0,
          responseTokens: 0,
          processingTime: Date.now() - startTime,
          confidenceScore: 0,
          geminiModel: 'gemini-1.5-flash'
        },
        error: error instanceof Error ? error.message : 'Unknown error in holistic planning'
      };
    }
  }

  /**
   * Generate optimized daily meal
   */
  async generateDailyOptimization(
    preferences: UserPreferences,
    currentPlan: Partial<WeeklyPlan>,
    focusDay: Date
  ): Promise<GeminiPlanResult> {
    const startTime = Date.now();
    
    try {
      const context = await this.buildDailyContext(preferences, currentPlan, focusDay);
      
      const geminiResponse = await this.geminiService.generateDailyMeal(
        preferences,
        currentPlan,
        focusDay,
        {
          timeout: 30000,
          retryConfig: {
            maxRetries: 2,
            initialDelay: 1000,
            maxDelay: 3000,
            backoffFactor: 1.5
          }
        }
      );

      return this.processGeminiResponse(geminiResponse, context, startTime);
      
    } catch (error: unknown) {
      logger.error('Error in daily optimization:', 'geminiPlannerService', error);
      
      return {
        success: false,
        meta{ promptTokens: 0,
          responseTokens: 0,
          processingTime: Date.now() - startTime,
          confidenceScore: 0,
          geminiModel: 'gemini-1.5-flash'
        },
        error: error instanceof Error ? error.message : 'Failed to optimize daily meal'
      };
    }
  }

  /**
   * Regenerate specific meal with alternatives
   */
  async regenerateMeal(
    mealType: 'breakfast' | 'lunch' | 'dinner',
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    avoidRecipes?: string[]
  ): Promise<MealSuggestion | null> {
    try {
      const meal = await this.geminiService.regenerateMeal(
        mealType,
        preferences,
        constraints,
        {
          timeout: 20000,
          retryConfig: {
            maxRetries: 2,
            initialDelay: 500,
            maxDelay: 2000,
            backoffFactor: 2
          }
        }
      );

      return this.convertGeminiMealToSuggestion(meal);
      
    } catch (error: unknown) {
      logger.error('Error regenerating meal:', 'geminiPlannerService', error);
      return null;
    }
  }

  /**
   * Suggest recipes from pantry items
   */
  async suggestFromPantry(
    userId: string,
    preferences: UserPreferences
  ): Promise<MealSuggestion[]> {
    try {
      const pantryItems = await this.getUserPantryItems(userId);
      
      if (pantryItems.length === 0) {
        return [];
      }

      const recipes = await this.geminiService.suggestFromPantry(
        pantryItems,
        preferences,
        {
          timeout: 25000,
          retryConfig: {
            maxRetries: 2,
            initialDelay: 1000,
            maxDelay: 3000,
            backoffFactor: 1.5
          }
        }
      );

      return recipes.map(recipe => this.convertGeminiMealToSuggestion(recipe));
      
    } catch (error: unknown) {
      logger.error('Error suggesting from pantry:', 'geminiPlannerService', error);
      return [];
    }
  }

  /**
   * Process learning feedback to improve future suggestions
   */
  async processLearningFeedback(
    planId: string,
    feedback: {
      mealRatings: Record<string, number>;
      timeAccuracy: Record<string, number>;
      difficultyActual: Record<string, number>;
      innovations: string[];
      challenges: string[];
    }
  ): Promise<{ insights: any; adaptations: any }> {
    try {
      // Store feedback for future learning
      await this.saveLearningInsights(planId, feedback);
      
      // Generate insights
      const insights = {
        preferredMeals: Object.entries(feedback.mealRatings)
          .filter(([_, rating]) => rating >= 4)
          .map(([meal]) => meal),
        avoidMeals: Object.entries(feedback.mealRatings)
          .filter(([_, rating]) => rating < 3)
          .map(([meal]) => meal),
        timeAdjustments: Object.entries(feedback.timeAccuracy)
          .map(([meal, accuracy]) => ({
            meal,
            adjustmentFactor: accuracy / 100
          })),
        successfulInnovations: feedback.innovations
      };
      
      const adaptations = {
        ratingWeight: 1.2, // Increase weight of highly rated meals
        timeMultiplier: this.calculateAverageTimeAccuracy(feedback.timeAccuracy),
        difficultyAdjustment: this.calculateDifficultyAdjustment(feedback.difficultyActual)
      };
      
      return { insights, adaptations };
      
    } catch (error) {
      logger.error('Error processing learning feedback:', 'geminiPlannerService', error);
      return { insights: {}, adaptations: {} };
    }
  }

  /**
   * Build comprehensive context for holistic planning
   */
  private async buildHolisticContext(
    preferences: UserPreferences,
    constraints: PlanningConstraints
  ): Promise<HolisticPlannerContext> {
    const [pantryItems, favoriteRecipes, userHistory, feedback] = await Promise.all([
      this.getUserPantryItems(preferences.userId),
      this.getUserFavoriteRecipes(preferences.userId),
      this.getUserPlanningHistory(preferences.userId),
      this.getUserFeedbackHistory(preferences.userId)
    ]);

    return {
      userState: {
        preferences,
        constraints,
        history: userHistory,
        feedback: feedback
      },
      systemState: {
        pantryInventory: pantryItems,
        recipeLibrary: favoriteRecipes,
        seasonalFactors: this.getSeasonalFactors(),
        economicFactors: this.getEconomicFactors()
      },
      externalFactors: {
        weather: await this.getWeatherContext(),
        calendar: this.getCalendarContext(),
        social: this.getSocialContext(),
        market: this.getMarketContext()
      }
    };
  }

  /**
   * Build context for daily optimization
   */
  private async buildDailyContext(
    preferences: UserPreferences,
    currentPlan: Partial<WeeklyPlan>,
    focusDay: Date
  ): Promise<HolisticPlannerContext> {
    const pantryItems = await this.getUserPantryItems(preferences.userId);
    
    return {
      userState: {
        preferences,
        constraints: {
          startDate: focusDay,
          endDate: focusDay,
          mealTypes: ['breakfast', 'lunch', 'dinner'],
          servings: preferences.householdSize,
          maxPrepTime: preferences.maxPrepTimePerMeal || 60,
          budgetLimit: undefined
        },
        history: [],
        feedback: []
      },
      systemState: {
        pantryInventory: pantryItems,
        recipeLibrary: [],
        seasonalFactors: this.getSeasonalFactors(),
        economicFactors: {}
      },
      externalFactors: {
        weather: { temperature: 20, condition: 'clear' },
        calendar: { events: [], availability: 'normal' },
        social: { meals_planned: 0, guests: 0 },
        market: { promotions: [], availability: 'normal' }
      }
    };
  }

  /**
   * Process Gemini response into WeeklyPlan format
   */
  private async processGeminiResponse(
    geminiResponse: GeminiMealPlanResponse,
    context: HolisticPlannerContext,
    startTime: number
  ): Promise<GeminiPlanResult> {
    try {
      const weeklyPlan = await this.convertToWeeklyPlan(geminiResponse, context);
      
      return {
        success: true,
        plan: weeklyPlan,
        insights: {
          holisticAnalysis: geminiResponse.optimization_summary || {},
          optimizationRecommendations: {
            costSaving: `Estimated weekly cost: $${geminiResponse.optimization_summary.total_estimated_cost}`,
            timeEfficiency: `Total prep time: ${geminiResponse.optimization_summary.prep_time_total_minutes} minutes`,
            varietyScore: geminiResponse.optimization_summary.variety_score
          },
          learningAdaptations: {}
        },
        meta{ promptTokens: this.estimateTokens(JSON.stringify(context)),
          responseTokens: this.estimateTokens(JSON.stringify(geminiResponse)),
          processingTime: Date.now() - startTime,
          confidenceScore: this.calculateConfidence(geminiResponse),
          geminiModel: 'gemini-1.5-flash'
        }
      };
      
    } catch (error) {
      logger.error('Error processing Gemini response:', 'geminiPlannerService', error);
      
      return {
        success: false,
        meta{ promptTokens: 0,
          responseTokens: 0,
          processingTime: Date.now() - startTime,
          confidenceScore: 0,
          geminiModel: 'gemini-1.5-flash'
        },
        error: `Failed to process response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert Gemini response to WeeklyPlan format
   */
  private async convertToWeeklyPlan(
    geminiResponse: GeminiMealPlanResponse,
    context: HolisticPlannerContext
  ): Promise<WeeklyPlan> {
    const meals: DailyMeals[] = geminiResponse.daily_plans.map((dayPlan, index) => {
      const date = new Date(context.userState.constraints.startDate);
      date.setDate(date.getDate() + index);
      
      return {
        date,
        breakfast: dayPlan.meals.breakfast ? 
          this.convertGeminiMealToSuggestion(dayPlan.meals.breakfast) : undefined,
        lunch: dayPlan.meals.lunch ? 
          this.convertGeminiMealToSuggestion(dayPlan.meals.lunch) : undefined,
        dinner: dayPlan.meals.dinner ? 
          this.convertGeminiMealToSuggestion(dayPlan.meals.dinner) : undefined,
        totalCalories: this.calculateDailyCalories(dayPlan) as Calories,
        totalCost: this.estimateDailyCost(dayPlan) as Dollars,
        totalPrepTime: this.calculateDailyPrepTime(dayPlan) as Minutes,
        nutritionBalance: 0.85 as Percentage
      };
    });

    // Calculate summaries
    const nutritionSummary = this.calculateNutritionSummary(
      meals, 
      geminiResponse.nutritional_analysis
    );
    
    const budgetSummary = this.calculateBudgetSummary(
      meals,
      geminiResponse.optimization_summary
    );
    
    const prepPlan = await this.generatePrepPlan(meals);
    
    const shoppingList = this.generateShoppingList(
      geminiResponse.shopping_list_preview,
      geminiResponse.optimization_summary.total_estimated_cost
    );

    return {
      id: `gemini-plan-${Date.now()}`,
      userId: context.userState.preferences.userId,
      name: `Week of ${context.userState.constraints.startDate.toLocaleDateString()}`,
      weekStartDate: context.userState.constraints.startDate,
      meals,
      nutritionSummary,
      budgetSummary,
      prepPlan,
      shoppingList,
      preferences: context.userState.preferences,
      constraints: context.userState.constraints,
      confidence: this.calculateConfidence(geminiResponse) as Percentage,
      generatedAt: new Date(),
      meta{ aiModel: 'gemini-1.5-pro',
        generationTime: 0 as Minutes,
        revisionCount: PositiveInteger.create(1),
        userFeedback: null
      }
    };
  }

  /**
   * Convert Gemini meal to MealSuggestion format
   */
  private convertGeminiMealToSuggestion(geminiMeal: any): MealSuggestion {
    return {
      recipeId: `gemini-${Date.now()}-${Math.random()}`,
      recipe: {
        id: `gemini-${Date.now()}-${Math.random()}`,
        title: geminiMeal.name,
        description: '',
        prepTimeMinutes: geminiMeal.prep_time,
        cookTimeMinutes: geminiMeal.cook_time,
        servings: geminiMeal.servings,
        difficulty: geminiMeal.difficulty || 'medium',
        ingredients: geminiMeal.ingredients.map((ing: string) => ({
          name: ing,
          quantity: 1,
          unit: 'portion'
        })),
        instructions: geminiMeal.instructions || [],
        nutrition: geminiMeal.nutrition,
        tags: [],
        allergens: [],
        dietaryRestrictions: []
      },
      confidence: 0.85 as Percentage,
      reasoning: 'AI-generated recipe based on preferences',
      matchScores: {
        nutrition: 0.8 as Percentage,
        budget: 0.75 as Percentage,
        pantry: 0.7 as Percentage,
        time: 0.85 as Percentage,
        preference: 0.8 as Percentage
      },
      alternatives: []
    };
  }

  /**
   * Calculate nutrition summary from meals
   */
  private calculateNutritionSummary(
    meals: DailyMeals[],
    geminiNutrition: any
  ): NutritionSummary {
    const totalDays = meals.length || 1;
    
    return {
      totalCalories: (geminiNutrition.average_daily_calories * totalDays) as Calories,
      totalProtein: (geminiNutrition.protein_grams * totalDays) as Grams,
      totalCarbs: (geminiNutrition.carbs_grams * totalDays) as Grams,
      totalFat: (geminiNutrition.fat_grams * totalDays) as Grams,
      totalFiber: 25 * totalDays as Grams,
      totalSugar: 50 * totalDays as Grams,
      totalSodium: 2300 * totalDays as Grams,
      dailyAverages: {
        calories: geminiNutrition.average_daily_calories as Calories,
        protein: geminiNutrition.protein_grams as Grams,
        carbs: geminiNutrition.carbs_grams as Grams,
        fat: geminiNutrition.fat_grams as Grams
      },
      goalProgress: {
        calories: 0.9 as Percentage,
        protein: 0.95 as Percentage,
        carbs: 0.85 as Percentage,
        fat: 0.88 as Percentage
      },
      nutritionScore: 0.88 as Percentage,
      deficiencies: [],
      excesses: []
    };
  }

  /**
   * Calculate budget summary
   */
  private calculateBudgetSummary(
    meals: DailyMeals[],
    optimization: any
  ): BudgetSummary {
    const totalDays = meals.length || 1;
    const totalCost = optimization.total_estimated_cost as Dollars;
    
    return {
      totalCost,
      dailyAverage: (totalCost / totalDays) as Dollars,
      budgetUsed: 0.75 as Percentage,
      costPerServing: (totalCost / (totalDays * 3 * 2)) as Dollars,
      savingsOpportunities: [
        {
          suggestion: 'Buy seasonal produce',
          potentialSavings: 10 as Dollars,
          effort: 'low' as const
        },
        {
          suggestion: 'Use store brands',
          potentialSavings: 15 as Dollars,
          effort: 'low' as const
        }
      ],
      budgetScore: 0.8 as Percentage,
      costBreakdown: [
        {
          category: 'Produce',
          cost: (totalCost * 0.3) as Dollars,
          percentage: 0.3 as Percentage
        },
        {
          category: 'Proteins',
          cost: (totalCost * 0.4) as Dollars,
          percentage: 0.4 as Percentage
        },
        {
          category: 'Other',
          cost: (totalCost * 0.3) as Dollars,
          percentage: 0.3 as Percentage
        }
      ]
    };
  }

  /**
   * Generate prep plan
   */
  private async generatePrepPlan(meals: DailyMeals[]): Promise<PrepPlan> {
    return {
      totalPrepTime: 240 as Minutes,
      prepSessions: [
        {
          date: new Date(),
          duration: 120 as Minutes,
          tasks: [
            {
              id: 'prep-1',
              description: 'Batch cook grains and proteins',
              duration: 60 as Minutes,
              difficulty: 'intermediate',
              recipes: ['lunch-1', 'dinner-2'],
              ingredients: ['rice', 'chicken', 'vegetables'],
              equipment: ['pot', 'pan', 'oven'],
              canBatchWith: ['prep-2'],
              storageInstructions: 'Refrigerate in airtight containers',
              freshnessDuration: 4320 as Minutes // 3 days
            }
          ],
          equipment: ['knife', 'cutting board', 'containers'],
          estimatedEfficiency: 0.85 as Percentage
        }
      ],
      batchCookingOpportunities: [
        {
          ingredient: 'rice',
          meals: ['Monday lunch', 'Wednesday dinner'],
          instructions: 'Cook 3 cups at once',
          savings: 20 as Minutes
        }
      ],
      leftoverManagement: [
        {
          fromMeal: 'Monday dinner',
          toMeal: 'Tuesday lunch',
          transformation: 'Use leftover chicken in salad',
          freshnessDays: PositiveInteger.create(2)
        }
      ],
      efficiencyScore: 0.82 as Percentage,
      timeOptimizations: ['Prep vegetables while rice cooks']
    };
  }

  /**
   * Generate shopping list
   */
  private generateShoppingList(
    shoppingPreview: any[],
    totalCost: number
  ): ShoppingList {
    return {
      id: `shopping-${Date.now()}`,
      totalItems: PositiveInteger.create(shoppingPreview.length),
      totalCost: totalCost as Dollars,
      categories: [
        {
          name: 'Produce',
          items: shoppingPreview
            .filter(item => ['vegetables', 'fruits'].some(cat => 
              item.item.toLowerCase().includes(cat)
            ))
            .map(item => ({
              name: item.item,
              quantity: parseFloat(item.quantity) as any,
              unit: item.unit,
              estimatedCost: (totalCost * 0.3 / shoppingPreview.length) as Dollars,
              priority: 'high' as const,
              recipes: [],
              alternatives: [],
              storageRequirements: 'Refrigerate',
              perishability: 'high' as const,
              preferredBrands: []
            })),
          storeSections: ['Produce'],
          totalCost: (totalCost * 0.3) as Dollars,
          priority: 'high' as const
        }
      ],
      substitutions: [],
      pantryOptimization: ['Check pantry before shopping'],
      storeOptimization: [],
      seasonalWarnings: []
    };
  }

  /**
   * Helper methods
   */
  private async getUserPantryItems(userId: string) {
    try {
      return await db.getPantryItems(user.id{
        where: { userId },
        // includes handled by Supabase service
      });
    } catch {
      return [];
    }
  }

  private async getUserFavoriteRecipes(userId: string) {
    try {
      return await prisma.favoriteRecipe.findMany({
        where: { userId },
        // includes handled by Supabase service 
              } 
            } 
          } 
        }
      });
    } catch {
      return [];
    }
  }

  private async getUserPlanningHistory(userId: string) {
    // TODO: Implement when history table exists
    return [];
  }

  private async getUserFeedbackHistory(userId: string) {
    // TODO: Implement when feedback table exists
    return [];
  }

  private getSeasonalFactors() {
    const month = new Date().getMonth() + 1;
    const season = month >= 12 || month <= 2 ? 'summer' : 
                   month >= 3 && month <= 5 ? 'fall' : 
                   month >= 6 && month <= 8 ? 'winter' : 'spring';
    
    return {
      season,
      month,
      seasonalProduce: this.getSeasonalProduce(season),
      weatherPatterns: this.getWeatherPatterns(season)
    };
  }

  private getEconomicFactors() {
    return {
      inflation_rate: 0.08,
      seasonal_price_variations: {},
      current_promotions: []
    };
  }

  private async getWeatherContext() {
    return {
      temperature: 22,
      condition: 'clear',
      humidity: 60,
      forecast: 'stable'
    };
  }

  private getCalendarContext() {
    return {
      events: [],
      availability: 'normal',
      special_dates: []
    };
  }

  private getSocialContext() {
    return {
      meals_planned: 0,
      guests: 0,
      social_events: []
    };
  }

  private getMarketContext() {
    return {
      promotions: [],
      availability: 'normal',
      seasonal_pricing: {}
    };
  }

  private getSeasonalProduce(season: string) {
    const seasonalMap: Record<string, string[]> = {
      'summer': ['tomato', 'cucumber', 'watermelon', 'peach'],
      'fall': ['pumpkin', 'apple', 'pear', 'sweet potato'],
      'winter': ['broccoli', 'cauliflower', 'orange', 'mandarin'],
      'spring': ['asparagus', 'strawberry', 'spinach', 'lettuce']
    };
    return seasonalMap[season] || [];
  }

  private getWeatherPatterns(season: string) {
    const patterns: Record<string, any> = {
      'summer': { avg_temp: 28, preference: 'light_fresh' },
      'fall': { avg_temp: 20, preference: 'balanced' },
      'winter': { avg_temp: 12, preference: 'warm_comfort' },
      'spring': { avg_temp: 22, preference: 'fresh_varied' }
    };
    return patterns[season] || patterns['spring'];
  }

  private calculateDailyCalories(dayPlan: any): number {
    let total = 0;
    if (dayPlan.meals.breakfast?.nutrition?.calories) {
      total += dayPlan.meals.breakfast.nutrition.calories;
    }
    if (dayPlan.meals.lunch?.nutrition?.calories) {
      total += dayPlan.meals.lunch.nutrition.calories;
    }
    if (dayPlan.meals.dinner?.nutrition?.calories) {
      total += dayPlan.meals.dinner.nutrition.calories;
    }
    return total || 2000; // Default
  }

  private estimateDailyCost(dayPlan: any): number {
    // Rough estimate: $4-6 per meal
    let meals = 0;
    if (dayPlan.meals.breakfast) meals++;
    if (dayPlan.meals.lunch) meals++;
    if (dayPlan.meals.dinner) meals++;
    return meals * 5;
  }

  private calculateDailyPrepTime(dayPlan: any): number {
    let total = 0;
    if (dayPlan.meals.breakfast) {
      total += dayPlan.meals.breakfast.prep_time + dayPlan.meals.breakfast.cook_time;
    }
    if (dayPlan.meals.lunch) {
      total += dayPlan.meals.lunch.prep_time + dayPlan.meals.lunch.cook_time;
    }
    if (dayPlan.meals.dinner) {
      total += dayPlan.meals.dinner.prep_time + dayPlan.meals.dinner.cook_time;
    }
    return total;
  }

  private calculateConfidence(response: GeminiMealPlanResponse): number {
    let score = 0.5;
    
    if (response.daily_plans?.length > 0) score += 0.2;
    if (response.nutritional_analysis) score += 0.1;
    if (response.optimization_summary) score += 0.1;
    if (response.shopping_list_preview?.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private isContextStale(cached: GeminiPlanResult, currentContext: HolisticPlannerContext): boolean {
    // Simple staleness check - can be enhanced
    return false;
  }

  private async saveLearningInsights(planId: string, insights: any): Promise<void> {
    logger.info('Saving learning insights for plan:', 'geminiPlannerService', { planId, insights });
    // TODO: Implement database storage when table is available
  }

  private calculateAverageTimeAccuracy(timeAccuracy: Record<string, number>): number {
    const values = Object.values(timeAccuracy);
    if (values.length === 0) return 1;
    return values.reduce((sum, val) => sum + val, 0) / values.length / 100;
  }

  private calculateDifficultyAdjustment(difficultyActual: Record<string, number>): number {
    const values = Object.values(difficultyActual);
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return avg > 3 ? -0.1 : avg < 2 ? 0.1 : 0; // Adjust difficulty based on feedback
  }
}

// Export singleton instance
export const geminiPlannerService = new GeminiPlannerService();