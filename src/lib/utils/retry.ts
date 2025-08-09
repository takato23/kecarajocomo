/**
 * Retry utilities for robust error handling
 * Handles network requests and other async operations with exponential backoff
 */

import { logger } from '@/lib/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') return true;
    if (error?.status >= 500 && error?.status < 600) return true;
    if (error?.message?.includes('fetch')) return true;
    return false;
  }
};

/**
 * Retries an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 0) {
        logger.info('Operation succeeded after retry', 'retry', { 
          attempt,
          totalAttempts: attempt + 1
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      logger.warn('Operation failed', 'retry', { 
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't retry if this is the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }
      
      // Don't retry if the error doesn't meet retry conditions
      if (!opts.retryCondition(error)) {
        logger.info('Error does not meet retry conditions', 'retry', { error });
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );
      
      logger.info('Retrying operation', 'retry', { 
        attempt: attempt + 1,
        delay,
        nextAttempt: attempt + 2
      });
      
      await sleep(delay);
    }
  }
  
  logger.error('Operation failed after all retries', 'retry', { 
    maxRetries: opts.maxRetries,
    error: lastError
  });
  
  throw lastError;
}

/**
 * Utility function to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries a fetch request with specific handling for HTTP errors
 */
export async function retryFetch(
  url: string, 
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = {
    ...DEFAULT_RETRY_OPTIONS,
    retryCondition: (error: any) => {
      // Retry on network errors and 5xx server errors
      if (error instanceof TypeError) return true; // Network error
      if (error?.status >= 500 && error?.status < 600) return true;
      if (error?.status === 429) return true; // Rate limit
      return false;
    },
    ...retryOptions
  };
  
  return retry(async () => {
    const response = await fetch(url, options);
    
    // Check if response is ok
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).response = response;
      throw error;
    }
    
    return response;
  }, opts);
}

/**
 * Retries an async operation with a circuit breaker pattern
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private operation: () => Promise<T>,
    private options: {
      failureThreshold?: number;
      resetTimeout?: number;
      retryOptions?: RetryOptions;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      ...options
    };
  }
  
  async execute(): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout!) {
        this.state = 'half-open';
        logger.info('Circuit breaker moving to half-open state', 'CircuitBreaker');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = this.state === 'half-open' 
        ? await this.operation()
        : await retry(this.operation, this.options.retryOptions);
      
      // Success - reset circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        logger.info('Circuit breaker reset to closed state', 'CircuitBreaker');
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.options.failureThreshold!) {
        this.state = 'open';
        logger.warn('Circuit breaker opened due to failures', 'CircuitBreaker', { 
          failures: this.failures,
          threshold: this.options.failureThreshold
        });
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
  
  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker manually reset', 'CircuitBreaker');
  }
}