/**
 * Optimized Gemini Client for Argentine Meal Planning
 * 
 * This service provides specialized meal planning functionality with:
 * - Argentine cuisine expertise
 * - Context-aware prompting
 * - Performance optimization
 * - Robust error handling
 * - Structured response validation
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai'
import geminiConfig from '@/lib/config/gemini.config';;
import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { ArgentineMealContext } from '@/lib/prompts/argentineMealPrompts';

// Configuration interfaces
interface GeminiMealPlannerConfig {
  model: geminiConfig.default.model | geminiConfig.default.model | 'gemini-2.0-flash-exp';
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  enableCaching: boolean;
  retryAttempts: number;
  timeoutMs: number;
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors: string[];
}

// Performance and reliability configurations
const PERFORMANCE_CONFIGS = {
  fast: {
    model: geminiConfig.default.model as const,
    temperature: 0.7,
    maxOutputTokens: 2048
    topP: 0.9,
    topK: 32,
    enableCaching: true,
    retryAttempts: 2,
    timeoutMs: 20000,
  },
  balanced: {
    model: geminiConfig.default.model as const,
    temperature: 0.7,
    maxOutputTokens: 2048
    topP: 0.95,
    topK: 40,
    enableCaching: true,
    retryAttempts: 3,
    timeoutMs: 35000,
  },
  quality: {
    model: geminiConfig.default.model as const,
    temperature: 0.65,
    maxOutputTokens: 2048
    topP: 0.95,
    topK: 40,
    enableCaching: false,
    retryAttempts: 3,
    timeoutMs: 45000,
  },
} as const;

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'Rate limit exceeded',
    'Service temporarily unavailable',
    'Timeout',
    'Network error',
    'Internal server error',
  ],
};

// Response caching for performance
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Rate limiter for API requests
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

// Performance metrics tracking
class PerformanceMetrics {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  recordRequest(startTime: number, success: boolean, fromCache: boolean = false): void {
    const responseTime = Date.now() - startTime;
    
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0,
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0 ?
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
    };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

// Main Gemini client class
export class GeminiMealPlannerClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiMealPlannerConfig;
  private cache: ResponseCache;
  private rateLimiter: RateLimiter;
  private metrics: PerformanceMetrics;
  private retryConfig: RetryConfig;

  constructor(
    apiKey?: string, 
    profileType: keyof typeof PERFORMANCE_CONFIGS = 'balanced',
    customConfig?: Partial<GeminiMealPlannerConfig>
  ) {
    const key = apiKey || geminiConfig.getApiKey() || geminiConfig.getApiKey();
    
    if (!key) {
      throw new Error(
        'Gemini API key is required. Set GOOGLE_AI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable.'
      );
    }

    // Merge configuration
    this.config = { ...PERFORMANCE_CONFIGS[profileType], ...customConfig };
    this.retryConfig = DEFAULT_RETRY_CONFIG;

    // Initialize services
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: this.createGenerationConfig(),
    });
    
    this.cache = new ResponseCache();
    this.rateLimiter = new RateLimiter();
    this.metrics = new PerformanceMetrics();

    logger.info('GeminiMealPlannerClient initialized', 'geminiMealPlannerClient', {
      model: this.config.model,
      profile: profileType,
      cachingEnabled: this.config.enableCaching,
    });
  }

  private createGenerationConfig(): GenerationConfig {
    return {
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      topK: this.config.topK,
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(prompt: string, context: ArgentineMealContext): string {
    const contextHash = JSON.stringify({
      season: context.season,
      region: context.region,
      budget: context.budget,
      cookingTime: context.cookingTime,
      familySize: context.familySize,
      dietaryRestrictions: context.dietaryRestrictions?.sort(),
    });
    
    // Create a simple hash of the prompt and context
    const hash = btoa(prompt.substring(0, 100) + contextHash)
      .replace(/[+/=]/g, '')
      .substring(0, 16);
    
    return `meal_plan_${hash}`;
  }

  /**
   * Execute request with retry logic and performance tracking
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryConfig: RetryConfig = this.retryConfig
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Check rate limit
        const canProceed = await this.rateLimiter.checkLimit();
        if (!canProceed) {
          const resetTime = this.rateLimiter.getResetTime();
          throw new Error(`Rate limit exceeded. Wait ${Math.ceil(resetTime / 1000)} seconds.`);
        }

        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const isRetryable = retryConfig.retryableErrors.some(retryableError =>
          lastError!.message.toLowerCase().includes(retryableError.toLowerCase())
        );

        if (!isRetryable || attempt >= retryConfig.maxRetries) {
          throw lastError;
        }

        logger.warn(`Retrying Gemini request after ${delay}ms`, 'geminiMealPlannerClient', {
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          error: lastError.message,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelayMs);
      }
    }

    throw lastError || new Error('Unknown error in Gemini request');
  }

  /**
   * Generate content with timeout and validation
   */
  private async generateContent(prompt: string): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), this.config.timeoutMs)
    );

    const result = await Promise.race([
      this.model.generateContent(prompt),
      timeoutPromise,
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  }

  /**
   * Parse and validate JSON response with better error handling
   */
  private parseJsonResponse<T>(text: string, schema: z.ZodSchema<T>): T {
    try {
      // Clean up response
      let cleanText = text.trim();
      
      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      
      // Remove any trailing commas that might cause issues
      cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');
      
      const parsed = JSON.parse(cleanText.trim());
      
      // Validate with schema
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Response validation error:', 'geminiMealPlannerClient', { 
          errors: error.errors,
          sample: text.substring(0, 200),
        });
        throw new Error(`Invalid response format: ${error.errors.map(e => e.message).join(', ')}`);
      }
      
      logger.error('JSON parsing error:', 'geminiMealPlannerClient', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sample: text.substring(0, 200),
      });
      throw new Error('Failed to parse response as valid JSON');
    }
  }

  /**
   * Generate weekly meal plan with caching and performance optimization
   */
  async generateWeeklyMealPlan<T>(
    prompt: string,
    context: ArgentineMealContext,
    schema: z.ZodSchema<T>,
    options?: {
      bypassCache?: boolean;
      customTimeout?: number;
      priority?: 'fast' | 'balanced' | 'quality';
    }
  ): Promise<T> {
    const startTime = Date.now();
    let fromCache = false;

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(prompt, context);
      if (this.config.enableCaching && !options?.bypassCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          fromCache = true;
          this.metrics.recordRequest(startTime, true, true);
          logger.debug('Serving meal plan from cache', 'geminiMealPlannerClient', { cacheKey });
          return cached;
        }
      }

      // Adjust configuration based on priority
      if (options?.priority && options.priority !== 'balanced') {
        const priorityConfig = PERFORMANCE_CONFIGS[options.priority];
        this.model = this.genAI.getGenerativeModel({
          model: priorityConfig.model,
          generationConfig: {
            temperature: priorityConfig.temperature,
            maxOutputTokens: priorityConfig.maxOutputTokens,
            topP: priorityConfig.topP,
            topK: priorityConfig.topK,
          },
        });
      }

      // Generate response
      const response = await this.executeWithRetry(() => this.generateContent(prompt));
      const parsedResponse = this.parseJsonResponse(response, schema);

      // Cache successful response
      if (this.config.enableCaching) {
        const ttl = options?.priority === 'fast' ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10 or 5 minutes
        this.cache.set(cacheKey, parsedResponse, ttl);
      }

      this.metrics.recordRequest(startTime, true, fromCache);
      
      logger.info('Weekly meal plan generated successfully', 'geminiMealPlannerClient', {
        processingTimeMs: Date.now() - startTime,
        fromCache,
        model: this.config.model,
        cacheSize: this.cache.size(),
      });

      return parsedResponse;
    } catch (error) {
      this.metrics.recordRequest(startTime, false, fromCache);
      
      logger.error('Weekly meal plan generation failed', 'geminiMealPlannerClient', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
        context: {
          season: context.season,
          budget: context.budget,
          familySize: context.familySize,
        },
      });
      
      throw error;
    }
  }

  /**
   * Generate single meal with faster response
   */
  async generateSingleMeal<T>(
    prompt: string,
    context: ArgentineMealContext,
    schema: z.ZodSchema<T>,
    options?: {
      mealType?: string;
      customTimeout?: number;
    }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Use fast configuration for single meals
      const fastModel = this.genAI.getGenerativeModel({
        model: geminiConfig.default.model,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048
          topP: 0.9,
          topK: 32,
        },
      });

      const timeoutMs = options?.customTimeout || 20000; // 20 second timeout for single meals
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      );

      const result = await Promise.race([
        fastModel.generateContent(prompt),
        timeoutPromise,
      ]);

      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      const parsedResponse = this.parseJsonResponse(text, schema);

      logger.info('Single meal generated successfully', 'geminiMealPlannerClient', {
        processingTimeMs: Date.now() - startTime,
        mealType: options?.mealType || 'unknown',
        model: geminiConfig.default.model,
      });

      return parsedResponse;
    } catch (error) {
      logger.error('Single meal generation failed', 'geminiMealPlannerClient', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
        mealType: options?.mealType || 'unknown',
      });
      
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Clear cache and reset metrics
   */
  reset(): void {
    this.cache.clear();
    this.metrics.reset();
    logger.info('GeminiMealPlannerClient reset', 'geminiMealPlannerClient');
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: any;
    lastError?: string;
  }> {
    try {
      const metrics = this.getMetrics();
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (metrics.successRate < 95) {
        status = 'degraded';
      }
      if (metrics.successRate < 80) {
        status = 'unhealthy';
      }
      
      return {
        status,
        metrics,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: this.getMetrics(),
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance with environment-based configuration
let geminiClient: GeminiMealPlannerClient | null = null;

export function getGeminiMealPlannerClient(
  profile: keyof typeof PERFORMANCE_CONFIGS = 'balanced'
): GeminiMealPlannerClient {
  if (!geminiClient) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const selectedProfile = isDevelopment ? 'fast' : profile;
    
    geminiClient = new GeminiMealPlannerClient(undefined, selectedProfile);
  }
  return geminiClient;
}

// Export types for use in other modules
export type { GeminiMealPlannerConfig, RetryConfig };
export { PERFORMANCE_CONFIGS };