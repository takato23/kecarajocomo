/**
 * Enhanced Gemini AI Service
 * Provides robust JSON responses, error handling, and rate limiting
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai'
import geminiConfig from '@/lib/config/gemini.config';;
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { GeminiPromptTemplates } from './geminiPromptTemplates';
import { GeminiErrorHandler, GeminiErrorCode } from './geminiErrorHandler';

// Response validation schemas
const GeminiMealSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  prep_time: z.number().positive(),
  cook_time: z.number().positive(),
  servings: z.number().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number()
  }).optional(),
  instructions: z.array(z.string()).optional()
});

const GeminiDailyPlanSchema = z.object({
  day: z.number(),
  meals: z.object({
    breakfast: GeminiMealSchema.optional(),
    lunch: GeminiMealSchema.optional(),
    dinner: GeminiMealSchema.optional()
  })
});

const GeminiMealPlanResponseSchema = z.object({
  daily_plans: z.array(GeminiDailyPlanSchema),
  shopping_list_preview: z.array(z.object({
    item: z.string(),
    quantity: z.string(),
    unit: z.string()
  })),
  nutritional_analysis: z.object({
    average_daily_calories: z.number(),
    protein_grams: z.number(),
    carbs_grams: z.number(),
    fat_grams: z.number()
  }),
  optimization_summary: z.object({
    total_estimated_cost: z.number(),
    prep_time_total_minutes: z.number(),
    variety_score: z.number()
  })
});

export type GeminiMealPlanResponse = z.infer<typeof GeminiMealPlanResponseSchema>;

// Configuration
interface GeminiConfig {
  model: geminiConfig.default.model | geminiConfig.default.model | 'gemini-2.0-flash-exp';
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  responseMimeType?: string;
}

const DEFAULT_CONFIG: GeminiConfig = {
  model: geminiConfig.default.model,
  temperature: 0.7,
  maxOutputTokens: 2048
  topP: 0.95,
  topK: 40
};

// Rate limiting
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs - Date.now();
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private rateLimiter: RateLimiter;
  private config: GeminiConfig;

  constructor(apiKey?: string, config?: Partial<GeminiConfig>) {
    const key = apiKey || geminiConfig.getApiKey() || geminiConfig.getApiKey();
    
    if (!key) {
      throw new Error('Gemini API key is required. Set GOOGLE_AI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable.');
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: this.createGenerationConfig()
    });
    this.rateLimiter = new RateLimiter();
  }

  private createGenerationConfig(): GenerationConfig {
    return {
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      topK: this.config.topK
    };
  }

  /**
   * Execute request with retry logic and error handling
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Check rate limit
        const canProceed = await this.rateLimiter.checkLimit();
        if (!canProceed) {
          const resetTime = this.rateLimiter.getResetTime();
          throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(resetTime / 1000)} seconds.`);
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;
        const geminiError = GeminiErrorHandler.handleError(error, 'geminiService');
        GeminiErrorHandler.logError(geminiError, 'executeWithRetry');

        if (!geminiError.retryable || attempt >= retryConfig.maxRetries) {
          throw geminiError;
        }

        const retryDelay = GeminiErrorHandler.getRetryDelay(geminiError, attempt + 1);
        logger.info(`Retrying Gemini request after ${retryDelay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`, 'geminiService');
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError || new Error('Unknown error in Gemini request');
  }

  /**
   * Generate content with timeout and validation
   */
  private async generateContent(prompt: string, timeoutMs: number = 30000): Promise<string> {
    const result = await Promise.race([
      this.model.generateContent(prompt),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Gemini request timeout')), timeoutMs)
      )
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  }

  /**
   * Parse and validate JSON response
   */
  private parseJsonResponse<T>(text: string, schema: z.ZodSchema<T>): T {
    try {
      // Clean up response if needed
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      
      const parsed = JSON.parse(cleanText.trim());
      logger.debug('Parsed response:', 'geminiService', { 
        keys: Object.keys(parsed || {}),
        hasDaily: parsed?.daily_plans ? 'yes' : 'no',
        dailyLength: parsed?.daily_plans?.length || 0
      });
      
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error:', 'geminiService', { 
          errors: error.errors,
          rawText: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        });
        throw new Error(`Invalid response format: ${error.errors.map(e => e.message).join(', ')}`);
      }
      logger.error('JSON parse error:', 'geminiService', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        rawText: text.substring(0, 500) + (text.length > 500 ? '...' : '')
      });
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate meal plan with structured output
   */
  async generateMealPlan(
    preferences: any,
    constraints: any,
    options?: { timeout?: number; retryConfig?: RetryConfig; pantryItems?: any[] }
  ): Promise<GeminiMealPlanResponse> {
    const prompt = GeminiPromptTemplates.createMealPlanPrompt(
      preferences,
      constraints,
      options?.pantryItems
    );
    
    const response = await this.executeWithRetry(
      () => this.generateContent(prompt, options?.timeout),
      options?.retryConfig
    );

    return this.parseJsonResponse(response, GeminiMealPlanResponseSchema);
  }

  /**
   * Generate daily meal optimization
   */
  async generateDailyMeal(
    preferences: any,
    currentPlan: any,
    focusDay: Date,
    options?: { timeout?: number; retryConfig?: RetryConfig }
  ): Promise<GeminiMealPlanResponse> {
    const prompt = this.createDailyMealPrompt(preferences, currentPlan, focusDay);
    
    const response = await this.executeWithRetry(
      () => this.generateContent(prompt, options?.timeout),
      options?.retryConfig
    );

    return this.parseJsonResponse(response, GeminiMealPlanResponseSchema);
  }

  /**
   * Regenerate specific meal
   */
  async regenerateMeal(
    mealType: 'breakfast' | 'lunch' | 'dinner',
    preferences: any,
    constraints: any,
    options?: { timeout?: number; retryConfig?: RetryConfig; avoidRecipes?: string[] }
  ): Promise<z.infer<typeof GeminiMealSchema>> {
    const dayOfWeek = new Date(constraints.startDate).toLocaleDateString('en-US', { weekday: 'long' });
    
    const prompt = GeminiPromptTemplates.createRegenerateMealPrompt(
      mealType,
      dayOfWeek,
      preferences,
      constraints,
      options?.avoidRecipes
    );
    
    const response = await this.executeWithRetry(
      () => this.generateContent(prompt, options?.timeout),
      options?.retryConfig
    );

    // Parse as single meal
    const mealResponse = z.object({
      meal: GeminiMealSchema
    });

    const parsed = this.parseJsonResponse(response, mealResponse);
    return parsed.meal;
  }

  /**
   * Suggest recipes from pantry
   */
  async suggestFromPantry(
    pantryItems: any[],
    preferences: any,
    options?: { timeout?: number; retryConfig?: RetryConfig; mealTypes?: string[] }
  ): Promise<z.infer<typeof GeminiMealSchema>[]> {
    const prompt = GeminiPromptTemplates.createPantryRecipePrompt(
      pantryItems,
      preferences,
      options?.mealTypes
    );
    
    const response = await this.executeWithRetry(
      () => this.generateContent(prompt, options?.timeout),
      options?.retryConfig
    );

    const recipesResponse = z.object({
      recipes: z.array(GeminiMealSchema)
    });

    const parsed = this.parseJsonResponse(response, recipesResponse);
    return parsed.recipes;
  }

  /**
   * Generate shopping list
   */
  async generateShoppingList(
    mealPlan: any,
    pantryItems: any[],
    options?: { 
      timeout?: number; 
      retryConfig?: RetryConfig; 
      budget?: number; 
      preferredStores?: string[] 
    }
  ): Promise<any> {
    const prompt = GeminiPromptTemplates.createShoppingListPrompt(
      mealPlan,
      pantryItems,
      options?.budget,
      options?.preferredStores
    );
    
    const response = await this.executeWithRetry(
      () => this.generateContent(prompt, options?.timeout),
      options?.retryConfig
    );

    const shoppingListSchema = z.object({
      categories: z.array(z.object({
        name: z.string(),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
          estimatedCost: z.number().optional(),
          notes: z.string().optional()
        })),
        categoryTotal: z.number().optional()
      })),
      totalEstimatedCost: z.number(),
      savingTips: z.array(z.string()).optional(),
      alternativeSuggestions: z.record(z.string()).optional()
    });

    return this.parseJsonResponse(response, shoppingListSchema);
  }

  /**
   * Analyze nutritional content
   */
  async analyzeNutrition(
    mealPlan: any,
    nutritionalGoals: any,
    options?: { timeout?: number; retryConfig?: RetryConfig }
  ): Promise<any> {
    const prompt = GeminiPromptTemplates.createNutritionalAnalysisPrompt(
      mealPlan,
      nutritionalGoals
    );
    
    const response = await this.executeWithRetry(
      () => this.generateContent(prompt, options?.timeout),
      options?.retryConfig
    );

    const nutritionSchema = z.object({
      dailyAverages: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        fiber: z.number().optional(),
        sugar: z.number().optional(),
        sodium: z.number().optional()
      }),
      goalComparison: z.record(z.object({
        target: z.number(),
        actual: z.number(),
        difference: z.number(),
        status: z.string()
      })),
      nutritionalHighlights: z.array(z.string()),
      concerns: z.array(z.string()),
      recommendations: z.array(z.string())
    });

    return this.parseJsonResponse(response, nutritionSchema);
  }

  /**
   * Create daily meal prompt
   */
  private createDailyMealPrompt(preferences: any, currentPlan: any, focusDay: Date): string {
    return `Generate optimized meals for ${focusDay.toLocaleDateString()} based on:

PREFERENCES: ${JSON.stringify(preferences)}
CURRENT PLAN CONTEXT: ${JSON.stringify(currentPlan)}

Focus on:
1. Using available pantry items
2. Balancing nutrition with previous days
3. Minimizing prep time for this specific day
4. Considering the day of week (weekday vs weekend)

${GeminiPromptTemplates.BASE_JSON_INSTRUCTION}

Respond with the same JSON structure as a regular meal plan but only for this single day.`;
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export function getGeminiService(config?: Partial<GeminiConfig>): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService(undefined, config);
  }
  return geminiService;
}