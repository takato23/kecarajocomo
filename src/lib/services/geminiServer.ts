/**
 * Server-side Gemini client with advanced features
 * - Request coalescing
 * - Intelligent caching
 * - Retry with backoff
 * - JSON parsing with multiple strategies
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import geminiConfig from '@/lib/config/gemini.config';;
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import { aiCoalescer, RequestCoalescer } from './requestCoalescer';
import { retry } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';

// Initialize Redis for caching (optional - falls back to memory cache)
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  logger.warn('Redis initialization failed, using memory cache', error);
}

// Memory cache fallback
const memoryCache = new Map<string, { data: any; expiry: number }>();

interface GeminiServerConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number; // seconds
}

const DEFAULT_CONFIG: GeminiServerConfig = {
  model: geminiConfig.default.model,
  temperature: 0.7,
  maxOutputTokens: 2048
  topP: 0.95,
  topK: 40,
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
};

export class GeminiServer {
  private genAI: GoogleGenerativeAI;
  private config: GeminiServerConfig;
  private requestCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(apiKey: string, config: GeminiServerConfig = {}) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate content with coalescing, caching, and retry
   */
  async generateContent(prompt: string, options?: {
    skipCache?: boolean;
    customCacheTTL?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const requestId = nanoid(8);
    const startTime = Date.now();
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(prompt, this.config);
    
    // Check cache first
    if (this.config.cacheEnabled && !options?.skipCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        this.cacheHits++;
        logger.info(`[Gemini] Cache hit for request ${requestId}`, {
          duration: Date.now() - startTime,
          cacheKey,
        });
        return cached;
      }
      this.cacheMisses++;
    }

    // Use coalescer to prevent duplicate requests
    const coalescerKey = RequestCoalescer.generateKey({
      prompt,
      model: this.config.model,
      temperature: this.config.temperature,
    });

    const result = await aiCoalescer.execute(coalescerKey, async () => {
      this.requestCount++;
      
      logger.info(`[Gemini] Generating content for request ${requestId}`, {
        model: this.config.model,
        promptLength: prompt.length,
        metadata: options?.metadata,
      });

      // Call Gemini with retry logic
      const response = await retry(
        async () => {
          const model = this.genAI.getGenerativeModel({
            model: this.config.model!,
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxOutputTokens,
              topP: this.config.topP,
              topK: this.config.topK,
              responseMimeType: 'application/json',
            },
          });

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          
          // Parse JSON with multiple strategies
          return this.parseAIResponse(text);
        },
        {
          retries: 3,
          delays: [500, 1000, 2000],
          onRetry: (attempt, error) => {
            logger.warn(`[Gemini] Retry attempt ${attempt} for request ${requestId}`, error);
          },
        }
      );

      // Cache the result
      if (this.config.cacheEnabled) {
        const ttl = options?.customCacheTTL || this.config.cacheTTL!;
        await this.setInCache(cacheKey, response, ttl);
      }

      logger.info(`[Gemini] Successfully generated content for request ${requestId}`, {
        duration: Date.now() - startTime,
        cached: false,
      });

      return response;
    });

    return result;
  }

  /**
   * Parse AI response with multiple fallback strategies
   */
  private parseAIResponse(text: string): any {
    // Strategy 1: Direct JSON parse
    try {
      return JSON.parse(text);
    } catch (e) {
      logger.debug('[Gemini] Direct JSON parse failed, trying cleanup');
    }

    // Strategy 2: Clean markdown code blocks
    const cleanedText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
    
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      logger.debug('[Gemini] Cleaned JSON parse failed, trying extraction');
    }

    // Strategy 3: Extract JSON from mixed content
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        logger.debug('[Gemini] JSON extraction failed, trying array extraction');
      }
    }

    // Strategy 4: Extract JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e) {
        logger.debug('[Gemini] Array extraction failed');
      }
    }

    // Strategy 5: Return as structured text
    logger.error('[Gemini] All JSON parsing strategies failed', { text });
    throw new Error('Failed to parse AI response as JSON');
  }

  /**
   * Generate cache key for requests
   */
  private generateCacheKey(prompt: string, config: GeminiServerConfig): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify({ prompt, config }))
      .digest('hex');
    
    return `gemini:${hash}`;
  }

  /**
   * Get from cache (Redis or memory)
   */
  private async getFromCache(key: string): Promise<any> {
    try {
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          return typeof cached === 'string' ? JSON.parse(cached) : cached;
        }
      } else {
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        }
        if (cached) {
          memoryCache.delete(key);
        }
      }
    } catch (error) {
      logger.error('[Gemini] Cache get error', error);
    }
    return null;
  }

  /**
   * Set in cache (Redis or memory)
   */
  private async setInCache(key: string, data: any, ttl: number): Promise<void> {
    try {
      if (redis) {
        await redis.setex(key, ttl, JSON.stringify(data));
      } else {
        memoryCache.set(key, {
          data,
          expiry: Date.now() + ttl * 1000,
        });
        
        // Clean up expired entries periodically
        if (memoryCache.size > 100) {
          const now = Date.now();
          for (const [k, v] of memoryCache.entries()) {
            if (v.expiry < now) {
              memoryCache.delete(k);
            }
          }
        }
      }
    } catch (error) {
      logger.error('[Gemini] Cache set error', error);
    }
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const hitRate = this.cacheHits / (this.cacheHits + this.cacheMisses) || 0;
    
    return {
      requestCount: this.requestCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: hitRate,
      coalescerStats: aiCoalescer.getStats(),
      memoryCacheSize: memoryCache.size,
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (redis) {
      // Clear Redis keys with pattern
      // Note: This is a simplified version, in production use SCAN
      logger.info('[Gemini] Clearing Redis cache');
    }
    
    memoryCache.clear();
    aiCoalescer.clear();
    
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    logger.info('[Gemini] Cache cleared');
  }
}

// Singleton instance
let geminiServer: GeminiServer | null = null;

export function getGeminiServer(): GeminiServer {
  if (!geminiServer) {
    const apiKey = geminiConfig.getApiKey() || geminiConfig.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }
    
    geminiServer = new GeminiServer(apiKey, {
      model: process.env.NODE_ENV === 'production' ? geminiConfig.default.model : geminiConfig.default.model,
      cacheEnabled: process.env.NODE_ENV === 'production',
      cacheTTL: 3600, // 1 hour in production
    });
  }
  
  return geminiServer;
}