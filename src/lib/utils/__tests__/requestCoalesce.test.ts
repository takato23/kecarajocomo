import { coalesce } from '../requestCoalesce';

// Helper to create delayed promises
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create a promise that resolves to a specific value after a delay
const delayedResolve = <T>(value: T, ms: number = 100): Promise<T> => 
  delay(ms).then(() => value);

// Helper to create a promise that rejects after a delay
const delayedReject = (error: Error, ms: number = 100): Promise<never> => 
  delay(ms).then(() => Promise.reject(error));

describe('Request Coalescing System', () => {
  beforeEach(() => {
    // Clear any inflight requests between tests
    // Note: This assumes the module exports the inflight map for testing
    // In production, you might need to add a test-only method to clear state
    jest.clearAllMocks();
  });

  describe('Basic coalescing functionality', () => {
    it('should return the same promise for concurrent requests with same key', async () => {
      const producer = jest.fn(() => delayedResolve('test-result', 50));
      
      // Start multiple requests concurrently
      const promise1 = coalesce('test-key', producer);
      const promise2 = coalesce('test-key', producer);
      const promise3 = coalesce('test-key', producer);
      
      // All should reference the same promise
      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);
      
      // Producer should only be called once
      expect(producer).toHaveBeenCalledTimes(1);
      
      // All promises should resolve to the same value
      const results = await Promise.all([promise1, promise2, promise3]);
      expect(results).toEqual(['test-result', 'test-result', 'test-result']);
    });

    it('should call producer separately for different keys', async () => {
      const producer1 = jest.fn(() => delayedResolve('result-1', 50));
      const producer2 = jest.fn(() => delayedResolve('result-2', 50));
      
      const promise1 = coalesce('key-1', producer1);
      const promise2 = coalesce('key-2', producer2);
      
      expect(promise1).not.toBe(promise2);
      expect(producer1).toHaveBeenCalledTimes(1);
      expect(producer2).toHaveBeenCalledTimes(1);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('result-1');
      expect(result2).toBe('result-2');
    });

    it('should allow new requests after TTL expires', async () => {
      const producer = jest.fn()
        .mockImplementationOnce(() => delayedResolve('first-result', 10))
        .mockImplementationOnce(() => delayedResolve('second-result', 10));
      
      // First request
      const result1 = await coalesce('test-key', producer, 100); // 100ms TTL
      expect(result1).toBe('first-result');
      expect(producer).toHaveBeenCalledTimes(1);
      
      // Immediate second request should use cached promise
      const promise2 = coalesce('test-key', producer, 100);
      const result2 = await promise2;
      expect(result2).toBe('first-result'); // Same result from cache
      expect(producer).toHaveBeenCalledTimes(1); // Producer not called again
      
      // Wait for TTL to expire
      await delay(150);
      
      // New request after TTL should call producer again
      const result3 = await coalesce('test-key', producer, 100);
      expect(result3).toBe('second-result');
      expect(producer).toHaveBeenCalledTimes(2);
    });

    it('should handle producer that returns non-promise values', async () => {
      const producer = jest.fn(() => 'immediate-result');
      
      const result = await coalesce('test-key', producer);
      expect(result).toBe('immediate-result');
      expect(producer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from producer', async () => {
      const error = new Error('Producer failed');
      const producer = jest.fn(() => delayedReject(error, 50));
      
      const promise1 = coalesce('test-key', producer);
      const promise2 = coalesce('test-key', producer);
      
      await expect(promise1).rejects.toThrow('Producer failed');
      await expect(promise2).rejects.toThrow('Producer failed');
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('should allow new requests after failed request', async () => {
      const error = new Error('First attempt failed');
      const producer = jest.fn()
        .mockImplementationOnce(() => delayedReject(error, 10))
        .mockImplementationOnce(() => delayedResolve('success-result', 10));
      
      // First request fails
      await expect(coalesce('test-key', producer)).rejects.toThrow('First attempt failed');
      expect(producer).toHaveBeenCalledTimes(1);
      
      // Wait a bit for cleanup
      await delay(20);
      
      // Second request should succeed
      const result = await coalesce('test-key', producer);
      expect(result).toBe('success-result');
      expect(producer).toHaveBeenCalledTimes(2);
    });

    it('should clean up failed requests from inflight map', async () => {
      const producer1 = jest.fn(() => delayedReject(new Error('Failed'), 10));
      const producer2 = jest.fn(() => delayedResolve('success', 10));
      
      // First request fails
      await expect(coalesce('test-key', producer1)).rejects.toThrow('Failed');
      
      // Small delay to allow cleanup
      await delay(20);
      
      // Second request with same key should call new producer
      const result = await coalesce('test-key', producer2);
      expect(result).toBe('success');
      expect(producer1).toHaveBeenCalledTimes(1);
      expect(producer2).toHaveBeenCalledTimes(1);
    });
  });

  describe('TTL (Time To Live) functionality', () => {
    it('should respect default TTL', async () => {
      const producer = jest.fn()
        .mockImplementationOnce(() => delayedResolve('first', 10))
        .mockImplementationOnce(() => delayedResolve('second', 10));
      
      // First request
      const result1 = await coalesce('test-key', producer);
      expect(result1).toBe('first');
      
      // Request within default TTL (30000ms) should reuse
      const result2 = await coalesce('test-key', producer);
      expect(result2).toBe('first');
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('should respect custom TTL', async () => {
      const producer = jest.fn()
        .mockImplementationOnce(() => delayedResolve('first', 10))
        .mockImplementationOnce(() => delayedResolve('second', 10));
      
      const shortTTL = 50; // 50ms
      
      // First request
      const result1 = await coalesce('test-key', producer, shortTTL);
      expect(result1).toBe('first');
      
      // Wait for TTL to expire
      await delay(60);
      
      // Request after TTL should call producer again
      const result2 = await coalesce('test-key', producer, shortTTL);
      expect(result2).toBe('second');
      expect(producer).toHaveBeenCalledTimes(2);
    });

    it('should handle zero TTL (always call producer)', async () => {
      const producer = jest.fn()
        .mockImplementationOnce(() => delayedResolve('first', 10))
        .mockImplementationOnce(() => delayedResolve('second', 10));
      
      // First request
      const result1 = await coalesce('test-key', producer, 0);
      expect(result1).toBe('first');
      
      // Second request with zero TTL should call producer again
      const result2 = await coalesce('test-key', producer, 0);
      expect(result2).toBe('second');
      expect(producer).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cleanup behavior', () => {
    it('should clean up inflight requests after completion', async () => {
      const producer = jest.fn(() => delayedResolve('result', 50));
      
      // Start request
      const promise = coalesce('test-key', producer);
      
      // Request should be inflight
      const samPromise = coalesce('test-key', producer);
      expect(promise).toBe(samPromise);
      
      // Wait for completion
      await promise;
      
      // Small delay for cleanup
      await delay(10);
      
      // New request should create new promise
      const producer2 = jest.fn(() => delayedResolve('new-result', 10));
      const newPromise = coalesce('test-key', producer2);
      expect(newPromise).not.toBe(promise);
      
      const newResult = await newPromise;
      expect(newResult).toBe('new-result');
    });

    it('should clean up inflight requests after rejection', async () => {
      const producer = jest.fn(() => delayedReject(new Error('Failed'), 50));
      
      // Start request
      const promise = coalesce('test-key', producer);
      
      // Wait for failure
      await expect(promise).rejects.toThrow('Failed');
      
      // Small delay for cleanup
      await delay(10);
      
      // New request should create new promise
      const producer2 = jest.fn(() => delayedResolve('success', 10));
      const newPromise = coalesce('test-key', producer2);
      expect(newPromise).not.toBe(promise);
      
      const result = await newPromise;
      expect(result).toBe('success');
    });
  });

  describe('Real-world AI request scenarios', () => {
    it('should coalesce identical meal plan generation requests', async () => {
      const mockAICall = jest.fn(() => 
        delayedResolve({
          userId: 'user123',
          weekStart: '2024-01-15',
          days: [
            { date: '2024-01-15', meals: { breakfast: 'Mate con tostadas' } }
          ]
        }, 1000) // Simulate 1 second AI call
      );
      
      const requestKey = 'meal-plan:user123:2024-01-15:normal';
      
      // Multiple concurrent requests for same meal plan
      const promises = [
        coalesce(requestKey, mockAICall),
        coalesce(requestKey, mockAICall),
        coalesce(requestKey, mockAICall)
      ];
      
      const results = await Promise.all(promises);
      
      // All should get same result
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      
      // AI should only be called once
      expect(mockAICall).toHaveBeenCalledTimes(1);
      
      // Result should be well-formed meal plan
      expect(results[0].userId).toBe('user123');
      expect(results[0].weekStart).toBe('2024-01-15');
    });

    it('should handle different users requesting same week separately', async () => {
      const mockAICall1 = jest.fn(() => 
        delayedResolve({ userId: 'user1', plan: 'plan-for-user1' }, 500)
      );
      const mockAICall2 = jest.fn(() => 
        delayedResolve({ userId: 'user2', plan: 'plan-for-user2' }, 500)
      );
      
      const promise1 = coalesce('meal-plan:user1:2024-01-15', mockAICall1);
      const promise2 = coalesce('meal-plan:user2:2024-01-15', mockAICall2);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1.userId).toBe('user1');
      expect(result2.userId).toBe('user2');
      expect(mockAICall1).toHaveBeenCalledTimes(1);
      expect(mockAICall2).toHaveBeenCalledTimes(1);
    });

    it('should handle recipe regeneration requests', async () => {
      const mockRecipeCall = jest.fn(() =>
        delayedResolve({
          id: 'new-recipe',
          name: 'Milanesas Napolitanas',
          ingredients: ['milanesas', 'jamón', 'queso'],
          cookTime: 25
        }, 800)
      );
      
      const requestKey = 'regenerate:user123:day2:lunch:milanesas';
      
      // Multiple requests to regenerate same meal
      const promise1 = coalesce(requestKey, mockRecipeCall);
      const promise2 = coalesce(requestKey, mockRecipeCall);
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toEqual(result2);
      expect(result1.name).toBe('Milanesas Napolitanas');
      expect(mockRecipeCall).toHaveBeenCalledTimes(1);
    });

    it('should handle AI timeouts and retries', async () => {
      const timeoutError = new Error('AI request timeout');
      const mockAICall = jest.fn()
        .mockImplementationOnce(() => delayedReject(timeoutError, 100))
        .mockImplementationOnce(() => delayedResolve({ success: true, retried: true }, 100));
      
      const requestKey = 'meal-plan:user123:2024-01-15';
      
      // First request times out
      await expect(coalesce(requestKey, mockAICall)).rejects.toThrow('AI request timeout');
      
      // Wait for cleanup
      await delay(20);
      
      // Retry should succeed
      const result = await coalesce(requestKey, mockAICall);
      expect(result.success).toBe(true);
      expect(result.retried).toBe(true);
      expect(mockAICall).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory management', () => {
    it('should not accumulate inflight requests indefinitely', async () => {
      const producers = Array.from({ length: 100 }, (_, i) => 
        jest.fn(() => delayedResolve(`result-${i}`, 10))
      );
      
      // Create many different requests
      const promises = producers.map((producer, i) => 
        coalesce(`key-${i}`, producer, 50)
      );
      
      // Wait for all to complete
      await Promise.all(promises);
      
      // Wait for cleanup
      await delay(20);
      
      // New requests should not conflict with completed ones
      const newProducer = jest.fn(() => delayedResolve('new-result', 10));
      const newResult = await coalesce('key-0', newProducer); // Reuse first key
      
      expect(newResult).toBe('new-result');
      expect(newProducer).toHaveBeenCalledTimes(1);
    });

    it('should handle high frequency requests efficiently', async () => {
      const producer = jest.fn(() => delayedResolve('shared-result', 100));
      
      // Create many concurrent requests
      const promises = Array.from({ length: 50 }, () => 
        coalesce('high-frequency-key', producer)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All should have same result
      expect(results.every(r => r === 'shared-result')).toBe(true);
      
      // Producer called only once
      expect(producer).toHaveBeenCalledTimes(1);
      
      // Should complete in reasonable time (close to single request time)
      expect(endTime - startTime).toBeLessThan(200); // Single request + some overhead
    });
  });

  describe('Edge cases', () => {
    it('should handle producer that throws synchronously', async () => {
      const producer = jest.fn(() => {
        throw new Error('Synchronous error');
      });
      
      await expect(coalesce('test-key', producer)).rejects.toThrow('Synchronous error');
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined/null keys', async () => {
      const producer1 = jest.fn(() => delayedResolve('result1', 10));
      const producer2 = jest.fn(() => delayedResolve('result2', 10));
      
      const result1 = await coalesce(undefined as any, producer1);
      const result2 = await coalesce(null as any, producer2);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(producer1).toHaveBeenCalledTimes(1);
      expect(producer2).toHaveBeenCalledTimes(1);
    });

    it('should handle very long TTL values', async () => {
      const producer = jest.fn(() => delayedResolve('result', 10));
      const veryLongTTL = Number.MAX_SAFE_INTEGER;
      
      const result1 = await coalesce('test-key', producer, veryLongTTL);
      const result2 = await coalesce('test-key', producer, veryLongTTL);
      
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('should handle negative TTL values', async () => {
      const producer = jest.fn()
        .mockImplementationOnce(() => delayedResolve('first', 10))
        .mockImplementationOnce(() => delayedResolve('second', 10));
      
      // Negative TTL should behave like zero TTL
      const result1 = await coalesce('test-key', producer, -1000);
      const result2 = await coalesce('test-key', producer, -1000);
      
      expect(result1).toBe('first');
      expect(result2).toBe('second');
      expect(producer).toHaveBeenCalledTimes(2);
    });
  });
});