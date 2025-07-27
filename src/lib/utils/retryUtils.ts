/**
 * Retry Utilities with Exponential Backoff
 * 
 * Provides robust retry mechanisms for API calls and async operations
 * with configurable backoff strategies and error handling.
 */

import { logger } from '@/lib/logger';

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean;
  retryableErrors?: string[];
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalTimeMs: number;
  errors: Error[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitter: true,
  retryableErrors: [
    'timeout',
    'network error',
    'connection error',
    'rate limit',
    'service unavailable',
    'internal server error',
    'bad gateway',
    'gateway timeout',
  ],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Check if an error is retryable based on configuration
 */
export function isRetryableError(error: Error, options: RetryOptions): boolean {
  const errorMessage = error.message.toLowerCase();
  
  // Check retryable error messages
  if (options.retryableErrors) {
    for (const retryableError of options.retryableErrors) {
      if (errorMessage.includes(retryableError.toLowerCase())) {
        return true;
      }
    }
  }

  // Check HTTP status codes if available
  if ('status' in error && typeof error.status === 'number' && options.retryableStatusCodes) {
    return options.retryableStatusCodes.includes(error.status);
  }

  // Check for fetch Response errors
  if ('response' in error && error.response && typeof error.response === 'object') {
    const response = error.response as any;
    if (response.status && options.retryableStatusCodes) {
      return options.retryableStatusCodes.includes(response.status);
    }
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  backoffFactor: number,
  maxDelayMs: number,
  jitter: boolean = true
): number {
  const baseDelay = Math.min(initialDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);
  
  if (jitter) {
    // Add random jitter up to 10% of the base delay to prevent thundering herd
    const jitterAmount = baseDelay * 0.1 * Math.random();
    return Math.floor(baseDelay + jitterAmount);
  }
  
  return baseDelay;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();
  const errors: Error[] = [];
  
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const result = await fn();
      const totalTimeMs = Date.now() - startTime;
      
      if (attempt > 0) {
        logger.info('Retry operation succeeded', 'retryUtils', {
          attempts: attempt + 1,
          totalTimeMs,
          finalAttempt: true,
        });
      }
      
      return {
        result,
        attempts: attempt + 1,
        totalTimeMs,
        errors,
      };
    } catch (error) {
      const currentError = error instanceof Error ? error : new Error(String(error));
      errors.push(currentError);
      
      // Check if this is the last attempt
      if (attempt === config.maxAttempts - 1) {
        const totalTimeMs = Date.now() - startTime;
        logger.error('Retry operation failed after all attempts', 'retryUtils', {
          maxAttempts: config.maxAttempts,
          totalTimeMs,
          errors: errors.map(e => e.message),
          lastError: currentError.message,
        });
        throw currentError;
      }
      
      // Check if error is retryable
      if (!isRetryableError(currentError, config)) {
        logger.warn('Non-retryable error encountered', 'retryUtils', {
          error: currentError.message,
          attempt: attempt + 1,
          maxAttempts: config.maxAttempts,
        });
        throw currentError;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        config.initialDelayMs,
        config.backoffFactor,
        config.maxDelayMs,
        config.jitter
      );
      
      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt + 1, currentError);
      }
      
      logger.warn('Retrying operation after delay', 'retryUtils', {
        attempt: attempt + 1,
        maxAttempts: config.maxAttempts,
        delayMs: delay,
        error: currentError.message,
      });
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected retry loop exit');
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  const retryPromise = retryWithBackoff(fn, retryOptions);
  
  return Promise.race([retryPromise, timeoutPromise]);
}

/**
 * Circuit breaker pattern for retry operations
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeMs: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
  
  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Bulk retry operation for multiple async functions
 */
export async function retryBulkOperations<T>(
  operations: Array<() => Promise<T>>,
  options: Partial<RetryOptions> = {},
  concurrency: number = 3
): Promise<Array<{ success: boolean; result?: T; error?: Error; attempts: number }>> {
  const results: Array<{ success: boolean; result?: T; error?: Error; attempts: number }> = [];
  
  // Process operations in batches based on concurrency limit
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (operation, index) => {
      try {
        const retryResult = await retryWithBackoff(operation, options);
        return {
          index: i + index,
          success: true as const,
          result: retryResult.result,
          attempts: retryResult.attempts,
        };
      } catch (error) {
        return {
          index: i + index,
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error)),
          attempts: options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts,
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Add results in correct order
    for (const result of batchResults) {
      results[result.index] = {
        success: result.success,
        result: result.success ? result.result : undefined,
        error: result.success ? undefined : result.error,
        attempts: result.attempts,
      };
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  logger.info('Bulk retry operations completed', 'retryUtils', {
    totalOperations: operations.length,
    successful: successCount,
    failed: failureCount,
    successRate: (successCount / operations.length) * 100,
  });
  
  return results;
}

/**
 * Utility for creating retryable functions with pre-configured options
 */
export function createRetryableFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: Partial<RetryOptions> = {}
) {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  return async (...args: T): Promise<R> => {
    const result = await retryWithBackoff(() => fn(...args), config);
    return result.result;
  };
}

/**
 * Exponential backoff for rate-limited APIs
 */
export async function exponentialBackoffDelay(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): Promise<void> {
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
  const jitter = Math.random() * 0.1 * delay; // 10% jitter
  await sleep(delay + jitter);
}

// Pre-configured retry functions for common use cases
export const retryAPICall = createRetryableFunction(
  async (fn: () => Promise<any>) => fn(),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  }
);

export const retryDatabaseOperation = createRetryableFunction(
  async (fn: () => Promise<any>) => fn(),
  {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    retryableErrors: ['connection error', 'timeout', 'lock timeout'],
  }
);

export const retryFileOperation = createRetryableFunction(
  async (fn: () => Promise<any>) => fn(),
  {
    maxAttempts: 3,
    initialDelayMs: 200,
    maxDelayMs: 2000,
    retryableErrors: ['ENOENT', 'EACCES', 'EMFILE', 'ENFILE'],
  }
);

// Export types
export type { RetryOptions, RetryResult };