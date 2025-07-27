/**
 * Request Coalescer - Deduplicates concurrent identical requests
 * Prevents multiple identical API calls when users spam or multiple components request same data
 */

import { nanoid } from 'nanoid';

import { logger } from '@/services/logger';
interface CoalescedRequest<T> {
  id: string;
  key: string;
  promise: Promise<T>;
  timestamp: number;
  subscribers: number;
}

class RequestCoalescer {
  private requests = new Map<string, CoalescedRequest<any>>();
  private readonly ttl: number;

  constructor(ttl = 5000) { // 5 second default TTL
    this.ttl = ttl;
  }

  /**
   * Execute a request or return existing promise if identical request is in-flight
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    // Check for existing request
    const existing = this.requests.get(key);
    
    if (existing && Date.now() - existing.timestamp < (options?.ttl || this.ttl)) {
      logger.info(`[Coalescer] Reusing existing request for key: ${key}`);
      existing.subscribers++;
      return existing.promise;
    }

    // Create new request
    const id = nanoid(8);
    logger.info(`[Coalescer] Creating new request ${id} for key: ${key}`);
    
    const promise = fn()
      .then(result => {
        // Clean up after success
        setTimeout(() => this.cleanup(key), 100);
        return result;
      })
      .catch(error => {
        // Clean up immediately on error
        this.cleanup(key);
        throw error;
      });

    const request: CoalescedRequest<T> = {
      id,
      key,
      promise,
      timestamp: Date.now(),
      subscribers: 1,
    };

    this.requests.set(key, request);
    return promise;
  }

  /**
   * Generate cache key for meal planning requests
   */
  static generateKey(params: Record<string, any>): string {
    // Sort keys for consistent hashing
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, any>);
    
    return JSON.stringify(sorted);
  }

  /**
   * Clean up completed requests
   */
  private cleanup(key: string): void {
    const request = this.requests.get(key);
    if (request) {
      logger.info(`[Coalescer] Cleaning up request ${request.id}`);
      this.requests.delete(key);
    }
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      activeRequests: this.requests.size,
      requests: Array.from(this.requests.entries()).map(([key, req]) => ({
        key,
        id: req.id,
        age: Date.now() - req.timestamp,
        subscribers: req.subscribers,
      })),
    };
  }

  /**
   * Clear all cached requests
   */
  clear(): void {
    logger.info(`[Coalescer] Clearing ${this.requests.size} cached requests`);
    this.requests.clear();
  }
}

// Singleton instances for different request types
export const mealPlanCoalescer = new RequestCoalescer(5000); // 5s TTL
export const recipeCoalescer = new RequestCoalescer(3000);   // 3s TTL
export const aiCoalescer = new RequestCoalescer(10000);      // 10s TTL for expensive AI calls

// Export class for testing
export { RequestCoalescer };