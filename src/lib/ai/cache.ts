/**
 * AI Service Optimization & Caching Layer
 * Enhanced AI caching, rate limiting, and optimization
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logger } from '@/services/logger';

import { performanceMonitor } from '../analytics/performance';

export interface AIRequest {
  model: string;
  prompt: string;
  parameters?: Record<string, any>;
  userId?: string;
  cached?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: number;
  duration: number;
  cached: boolean;
  requestId: string;
  timestamp: number;
}

export interface CacheEntry {
  response: AIResponse;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
}

class AICache {
  private redis: Redis;
  private ratelimit: Ratelimit;
  private localCache = new Map<string, CacheEntry>();
  private maxLocalCacheSize = 1000;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = Redis.fromEnv();
    
    // Rate limiting: 100 requests per minute per user
    this.ratelimit = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'ai_rate_limit',
    });

    // Cleanup local cache periodically
    this.setupCacheCleanup();
  }

  private setupCacheCleanup() {
    setInterval(() => {
      this.cleanupLocalCache();
    }, 300000); // 5 minutes
  }

  private cleanupLocalCache() {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.localCache.entries()) {
      if (entry.expiresAt < now) {
        this.localCache.delete(key);
      }
    }

    // If still too large, remove least recently used
    if (this.localCache.size > this.maxLocalCacheSize) {
      const entries = Array.from(this.localCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, entries.length - this.maxLocalCacheSize);
      toRemove.forEach(([key]) => this.localCache.delete(key));
    }
  }

  private generateCacheKey(request: AIRequest): string {
    const { model, prompt, parameters } = request;
    const paramStr = parameters ? JSON.stringify(parameters) : '';
    return `ai_cache:${model}:${Buffer.from(prompt + paramStr).toString('base64')}`;
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const { success, reset, remaining } = await this.ratelimit.limit(userId);
    
    if (!success) {
      logger.warn(`Rate limit exceeded for user ${userId}. Reset: ${reset}, Remaining: ${remaining}`, 'Lib:cache');
      return false;
    }
    
    return true;
  }

  async get(request: AIRequest): Promise<AIResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    const now = Date.now();

    // Check local cache first
    const localEntry = this.localCache.get(cacheKey);
    if (localEntry && localEntry.expiresAt > now) {
      localEntry.hits++;
      localEntry.lastAccessed = now;
      
      // Track cache hit
      performanceMonitor.trackAIMetric({
        requestId: localEntry.response.requestId,
        endpoint: 'cache',
        model: request.model,
        tokens: localEntry.response.tokens,
        duration: 0,
        success: true,
        cacheHit: true,
      });
      
      return { ...localEntry.response, cached: true };
    }

    // Check Redis cache
    try {
      const cached = await this.redis.get<CacheEntry>(cacheKey);
      if (cached && cached.expiresAt > now) {
        // Update local cache
        this.localCache.set(cacheKey, {
          ...cached,
          hits: cached.hits + 1,
          lastAccessed: now,
        });

        // Track cache hit
        performanceMonitor.trackAIMetric({
          requestId: cached.response.requestId,
          endpoint: 'cache',
          model: request.model,
          tokens: cached.response.tokens,
          duration: 0,
          success: true,
          cacheHit: true,
        });

        return { ...cached.response, cached: true };
      }
    } catch (error: unknown) {
      logger.error('Redis cache error:', 'Lib:cache', error);
    }

    return null;
  }

  async set(request: AIRequest, response: AIResponse, ttl?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    const now = Date.now();
    const expiresAt = now + ((ttl || this.defaultTTL) * 1000);

    const cacheEntry: CacheEntry = {
      response,
      expiresAt,
      hits: 0,
      lastAccessed: now,
    };

    // Set in local cache
    this.localCache.set(cacheKey, cacheEntry);

    // Set in Redis cache
    try {
      await this.redis.setex(cacheKey, ttl || this.defaultTTL, cacheEntry);
    } catch (error: unknown) {
      logger.error('Redis cache set error:', 'Lib:cache', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear local cache entries matching pattern
    for (const key of this.localCache.keys()) {
      if (key.includes(pattern)) {
        this.localCache.delete(key);
      }
    }

    // Clear Redis cache entries
    try {
      const keys = await this.redis.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error: unknown) {
      logger.error('Redis cache invalidation error:', 'Lib:cache', error);
    }
  }

  async warmup(requests: AIRequest[]): Promise<void> {
    const warmupPromises = requests.map(async (request) => {
      const cached = await this.get(request);
      if (!cached) {
        // Pre-generate response for common requests

      }
    });

    await Promise.all(warmupPromises);
  }

  getStats(): {
    localCacheSize: number;
    hitRate: number;
    totalHits: number;
    totalRequests: number;
  } {
    const entries = Array.from(this.localCache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = entries.length;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      localCacheSize: this.localCache.size,
      hitRate,
      totalHits,
      totalRequests,
    };
  }
}

// AI Request Optimizer
class AIRequestOptimizer {
  private cache = new AICache();

  async optimizeRequest(request: AIRequest): Promise<AIRequest> {
    // Optimize prompt length
    const optimizedPrompt = this.optimizePrompt(request.prompt);
    
    // Optimize parameters
    const optimizedParameters = this.optimizeParameters(request.parameters);

    return {
      ...request,
      prompt: optimizedPrompt,
      parameters: optimizedParameters,
    };
  }

  private optimizePrompt(prompt: string): string {
    // Remove excessive whitespace
    let optimized = prompt.replace(/\s+/g, ' ').trim();
    
    // Remove redundant phrases
    const redundantPhrases = [
      'please',
      'could you',
      'would you mind',
      'if possible',
    ];
    
    redundantPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      optimized = optimized.replace(regex, '');
    });

    // Trim to reasonable length (4000 chars max)
    if (optimized.length > 4000) {
      optimized = optimized.substring(0, 4000) + '...';
    }

    return optimized;
  }

  private optimizeParameters(parameters?: Record<string, any>): Record<string, any> {
    if (!parameters) return {};

    const optimized = { ...parameters };

    // Optimize temperature
    if (optimized.temperature > 1) {
      optimized.temperature = 1;
    } else if (optimized.temperature < 0) {
      optimized.temperature = 0;
    }

    // Optimize max_tokens
    if (optimized.max_tokens > 4000) {
      optimized.max_tokens = 4000;
    }

    return optimized;
  }

  async executeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = performance.now();
    const requestId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check rate limit
      if (request.userId && !(await this.cache.ratelimit.limit(request.userId)).success) {
        throw new Error('Rate limit exceeded');
      }

      // Check cache first
      const cached = await this.cache.get(request);
      if (cached) {
        return cached;
      }

      // Optimize request
      const optimizedRequest = await this.optimizeRequest(request);

      // Execute AI request (this would call your AI service)
      const response = await this.callAIService(optimizedRequest);

      const duration = performance.now() - startTime;
      
      const aiResponse: AIResponse = {
        content: response.content,
        model: request.model,
        tokens: response.tokens,
        duration,
        cached: false,
        requestId,
        timestamp: Date.now(),
      };

      // Cache the response
      await this.cache.set(request, aiResponse);

      // Track performance
      performanceMonitor.trackAIMetric({
        requestId,
        endpoint: 'ai_service',
        model: request.model,
        tokens: response.tokens,
        duration,
        success: true,
        cacheHit: false,
      });

      return aiResponse;
    } catch (error: unknown) {
      const duration = performance.now() - startTime;
      
      // Track error
      performanceMonitor.trackAIMetric({
        requestId,
        endpoint: 'ai_service',
        model: request.model,
        tokens: 0,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheHit: false,
      });

      throw error;
    }
  }

  private async callAIService(request: AIRequest): Promise<{ content: string; tokens: number }> {
    // This would be your actual AI service call
    // For now, return a mock response
    return {
      content: `Mock response for: ${request.prompt.substring(0, 50)}...`,
      tokens: Math.floor(request.prompt.length / 4),
    };
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  async warmupCache(commonRequests: AIRequest[]) {
    await this.cache.warmup(commonRequests);
  }

  async invalidateCache(pattern: string) {
    await this.cache.invalidate(pattern);
  }
}

// Global AI optimizer instance
export const aiOptimizer = new AIRequestOptimizer();

// Helper functions
export function createAIRequest(
  model: string,
  prompt: string,
  options: {
    parameters?: Record<string, any>;
    userId?: string;
    cached?: boolean;
  } = {}
): AIRequest {
  return {
    model,
    prompt,
    parameters: options.parameters,
    userId: options.userId,
    cached: options.cached !== false,
  };
}

export async function generateAIResponse(
  model: string,
  prompt: string,
  options: {
    parameters?: Record<string, any>;
    userId?: string;
    cached?: boolean;
  } = {}
): Promise<AIResponse> {
  const request = createAIRequest(model, prompt, options);
  return await aiOptimizer.executeRequest(request);
}

// React hook for AI optimization
export function useAIOptimizer() {
  return {
    executeRequest: (request: AIRequest) => aiOptimizer.executeRequest(request),
    generateResponse: generateAIResponse,
    getCacheStats: () => aiOptimizer.getCacheStats(),
    warmupCache: (requests: AIRequest[]) => aiOptimizer.warmupCache(requests),
    invalidateCache: (pattern: string) => aiOptimizer.invalidateCache(pattern),
  };
}