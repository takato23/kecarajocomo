/**
 * Safe JSON parsing utilities
 * Handles errors gracefully and provides type safety
 */

import { logger } from '@/lib/logger';

/**
 * Safely parses JSON string with error handling and optional validation
 */
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    logger.error('JSON parsing failed', 'safeJsonParse', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : '')
    });
    return fallback;
  }
}

/**
 * Safely stringifies an object to JSON
 */
export function safeJsonStringify(
  obj: any,
  fallback: string = '{}'
): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    logger.error('JSON stringification failed', 'safeJsonStringify', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      objectType: typeof obj
    });
    return fallback;
  }
}

/**
 * Safely parses JSON with schema validation using Zod
 */
export function safeJsonParseWithValidation<T>(
  jsonString: string | null | undefined,
  schema: { parse: (data: any) => T },
  fallback: T | null = null
): T | null {
  const parsed = safeJsonParse(jsonString, null);
  
  if (parsed === null) {
    return fallback;
  }

  try {
    return schema.parse(parsed);
  } catch (error) {
    logger.error('JSON validation failed', 'safeJsonParseWithValidation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data: parsed
    });
    return fallback;
  }
}