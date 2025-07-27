/**
 * Client-side API wrapper for Gemini endpoints
 * Handles all communication with server-side AI endpoints
 */

import { z } from 'zod';
import {
  ArgentineWeeklyPlan,
  Recipe,
  MealType,
  UserPreferences,
  PantryItem,
  ModeType,
} from '@/types/meal-planning/argentine';
import { retry } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';

// Response schemas for validation
const WeeklyPlanResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(), // We'll trust the server validation
  meta: z.object({
    source: z.string(),
    processingTimeMs: z.number().optional(),
    cacheHit: z.boolean().optional(),
    coalescerHit: z.boolean().optional(),
  }).optional(),
});

const RecipeResponseSchema = z.object({
  success: z.boolean(),
  recipe: z.any(),
  meta: z.any().optional(),
});

const AlternativesResponseSchema = z.object({
  success: z.boolean(),
  alternatives: z.array(z.any()),
  meta: z.any().optional(),
});

interface APIRequestOptions {
  signal?: AbortSignal;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

/**
 * Call weekly plan generation API
 */
export async function callWeeklyPlanAPI(
  params: {
    weekStart: string;
    preferences: UserPreferences;
    pantry: PantryItem[];
    mode: ModeType;
  },
  options?: APIRequestOptions
): Promise<ArgentineWeeklyPlan> {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  logger.info(`[API Client] Requesting weekly plan ${requestId}`, {
    weekStart: params.weekStart,
    mode: params.mode,
    pantryItems: params.pantry.length,
  });

  const response = await retry(
    async () => {
      const res = await fetch('/api/ai/meal-plan/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Priority': options?.priority || 'normal',
        },
        body: JSON.stringify({
          ...params,
          metadata: options?.metadata,
        }),
        signal: options?.signal,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`API error: ${res.status} - ${error}`);
      }

      const data = await res.json();
      const validated = WeeklyPlanResponseSchema.parse(data);
      
      if (!validated.success) {
        throw new Error('API returned unsuccessful response');
      }

      logger.info(`[API Client] Weekly plan received ${requestId}`, {
        source: validated.meta?.source,
        cacheHit: validated.meta?.cacheHit,
        coalescerHit: validated.meta?.coalescerHit,
        processingTime: validated.meta?.processingTimeMs,
      });

      return validated.data as ArgentineWeeklyPlan;
    },
    {
      retries: 2,
      delays: [1000, 2000],
      onRetry: (attempt) => {
        logger.warn(`[API Client] Retrying weekly plan request ${requestId}, attempt ${attempt}`);
      },
    }
  );

  return response;
}

/**
 * Call meal regeneration API
 */
export async function callRegenerateAPI(
  params: {
    weekPlan: ArgentineWeeklyPlan;
    dayIndex: number;
    mealType: MealType;
    preferences: UserPreferences;
    pantry: PantryItem[];
    mode: ModeType;
  },
  options?: APIRequestOptions
): Promise<Recipe> {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  logger.info(`[API Client] Requesting meal regeneration ${requestId}`, {
    dayIndex: params.dayIndex,
    mealType: params.mealType,
    mode: params.mode,
  });

  const response = await retry(
    async () => {
      const res = await fetch('/api/ai/meal-plan/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Priority': options?.priority || 'normal',
        },
        body: JSON.stringify({
          ...params,
          metadata: options?.metadata,
        }),
        signal: options?.signal,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`API error: ${res.status} - ${error}`);
      }

      const data = await res.json();
      const validated = RecipeResponseSchema.parse(data);
      
      if (!validated.success) {
        throw new Error('API returned unsuccessful response');
      }

      logger.info(`[API Client] Recipe received ${requestId}`, {
        meta: validated.meta,
      });

      return validated.recipe as Recipe;
    },
    {
      retries: 2,
      delays: [500, 1000],
      onRetry: (attempt) => {
        logger.warn(`[API Client] Retrying regenerate request ${requestId}, attempt ${attempt}`);
      },
    }
  );

  return response;
}

/**
 * Call alternatives API
 */
export async function callAlternativesAPI(
  params: {
    weekPlan: ArgentineWeeklyPlan;
    dayIndex: number;
    mealType: MealType;
    preferences: UserPreferences;
    pantry: PantryItem[];
    mode: ModeType;
    count?: number;
  },
  options?: APIRequestOptions
): Promise<Recipe[]> {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  logger.info(`[API Client] Requesting alternatives ${requestId}`, {
    dayIndex: params.dayIndex,
    mealType: params.mealType,
    count: params.count || 5,
  });

  const response = await retry(
    async () => {
      const res = await fetch('/api/ai/meal-plan/alternatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Priority': options?.priority || 'low',
        },
        body: JSON.stringify({
          ...params,
          count: params.count || 5,
          metadata: options?.metadata,
        }),
        signal: options?.signal,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`API error: ${res.status} - ${error}`);
      }

      const data = await res.json();
      const validated = AlternativesResponseSchema.parse(data);
      
      if (!validated.success) {
        throw new Error('API returned unsuccessful response');
      }

      logger.info(`[API Client] Alternatives received ${requestId}`, {
        count: validated.alternatives.length,
        meta: validated.meta,
      });

      return validated.alternatives as Recipe[];
    },
    {
      retries: 1,
      delays: [1000],
      onRetry: (attempt) => {
        logger.warn(`[API Client] Retrying alternatives request ${requestId}, attempt ${attempt}`);
      },
    }
  );

  return response;
}

/**
 * Check if API is healthy
 */
export async function checkAPIHealth(): Promise<{
  healthy: boolean;
  geminiAvailable: boolean;
  cacheAvailable: boolean;
  stats?: any;
}> {
  try {
    const res = await fetch('/api/ai/health');
    if (!res.ok) {
      return { healthy: false, geminiAvailable: false, cacheAvailable: false };
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    logger.error('[API Client] Health check failed', error);
    return { healthy: false, geminiAvailable: false, cacheAvailable: false };
  }
}