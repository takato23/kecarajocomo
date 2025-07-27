import { 
  CachedAIService,
  generateCacheKey,
  validateCacheEntry,
  cleanExpiredCache,
  estimateCacheSavings,
  optimizeCacheStrategy
} from '../aiCaching';
import { 
  mockWeeklyPlan,
  mockUserPreferences,
  mockPantryItems
} from '@/__tests__/mocks/fixtures/argentineMealData';
import type { CacheEntry, AIRequestType, CacheStats } from '@/lib/services/types';

// Mock Redis client
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  mget: jest.fn(),
  pipeline: jest.fn(() => ({
    exec: jest.fn()
  }))
};

jest.mock('redis', () => ({
  createClient: () => mockRedisClient
}));

describe('AI Caching Service', () => {
  let cachedAIService: CachedAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    cachedAIService = new CachedAIService({
      redis: mockRedisClient,
      defaultTTL: 3600, // 1 hour
      maxCacheSize: 1000,
      compressionEnabled: true
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys for identical requests', () => {
      const request1 = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123',
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        weekStart: '2024-01-15'
      };

      const request2 = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123',
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        weekStart: '2024-01-15'
      };

      const key1 = generateCacheKey(request1);
      const key2 = generateCacheKey(request2);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^ai_cache:meal_plan_generation:[a-f0-9]{32}$/);
    });

    it('should generate different keys for different requests', () => {
      const request1 = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123',
        preferences: mockUserPreferences,
        weekStart: '2024-01-15'
      };

      const request2 = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123',
        preferences: mockUserPreferences,
        weekStart: '2024-01-22' // Different week
      };

      const key1 = generateCacheKey(request1);
      const key2 = generateCacheKey(request2);

      expect(key1).not.toBe(key2);
    });

    it('should handle different request types', () => {
      const mealPlanKey = generateCacheKey({
        type: 'meal_plan_generation',
        userId: 'user123',
        preferences: mockUserPreferences
      });

      const recipeKey = generateCacheKey({
        type: 'recipe_generation',
        userId: 'user123',
        mealType: 'lunch',
        ingredients: ['carne', 'papa']
      });

      const suggestionKey = generateCacheKey({
        type: 'pantry_suggestions',
        userId: 'user123',
        pantry: mockPantryItems
      });

      expect(mealPlanKey).toContain('meal_plan_generation');
      expect(recipeKey).toContain('recipe_generation');
      expect(suggestionKey).toContain('pantry_suggestions');
    });

    it('should normalize similar preferences', () => {
      const preferences1 = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          region: 'pampa'
        }
      };

      const preferences2 = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          region: 'PAMPA' // Different case
        }
      };

      const key1 = generateCacheKey({
        type: 'meal_plan_generation',
        userId: 'user123',
        preferences: preferences1
      });

      const key2 = generateCacheKey({
        type: 'meal_plan_generation',
        userId: 'user123',
        preferences: preferences2
      });

      expect(key1).toBe(key2); // Should normalize case
    });
  });

  describe('Cache operations', () => {
    it('should cache and retrieve meal plan generation', async () => {
      const request = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123',
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        weekStart: '2024-01-15'
      };

      const response = mockWeeklyPlan;

      // Mock cache miss
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      // First call should miss cache and call AI
      const mockAICall = jest.fn().mockResolvedValue(response);
      const result1 = await cachedAIService.generateMealPlan(request, mockAICall);

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockAICall).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalled();
      expect(result1).toEqual(response);

      // Mock cache hit for second call
      const cachedEntry: CacheEntry = {
        data: response,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        version: '1.0',
        requestHash: 'test-hash',
        usageCount: 1
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedEntry));

      // Second call should hit cache
      const result2 = await cachedAIService.generateMealPlan(request, mockAICall);

      expect(result2).toEqual(response);
      expect(mockAICall).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle cache compression', async () => {
      const largeResponse = {
        ...mockWeeklyPlan,
        days: Array.from({ length: 30 }, (_, i) => ({
          ...mockWeeklyPlan.days[0],
          date: `2024-01-${i + 1}`
        }))
      };

      const request = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123',
        preferences: mockUserPreferences
      };

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const mockAICall = jest.fn().mockResolvedValue(largeResponse);
      await cachedAIService.generateMealPlan(request, mockAICall);

      // Verify that data was compressed before caching
      const setCall = mockRedisClient.set.mock.calls[0];
      const cachedData = JSON.parse(setCall[1]);
      
      expect(cachedData.compressed).toBe(true);
      expect(cachedData.data).not.toEqual(largeResponse); // Should be compressed
    });

    it('should handle different TTL for different request types', async () => {
      const mealPlanRequest = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123'
      };

      const recipeRequest = {
        type: 'recipe_generation' as AIRequestType,
        userId: 'user123',
        mealType: 'lunch'
      };

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const mockAICall = jest.fn().mockResolvedValue({});
      
      await cachedAIService.generateMealPlan(mealPlanRequest, mockAICall);
      await cachedAIService.generateRecipe(recipeRequest, mockAICall);

      const mealPlanSetCall = mockRedisClient.set.mock.calls[0];
      const recipeSetCall = mockRedisClient.set.mock.calls[1];

      // Meal plans should have longer TTL than individual recipes
      expect(mealPlanSetCall[2]).toBeGreaterThan(recipeSetCall[2]);
    });
  });

  describe('validateCacheEntry', () => {
    it('should validate fresh cache entries', () => {
      const entry: CacheEntry = {
        data: mockWeeklyPlan,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        version: '1.0',
        requestHash: 'test-hash',
        usageCount: 1
      };

      const isValid = validateCacheEntry(entry);
      expect(isValid).toBe(true);
    });

    it('should reject expired cache entries', () => {
      const entry: CacheEntry = {
        data: mockWeeklyPlan,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
        version: '1.0',
        requestHash: 'test-hash',
        usageCount: 1
      };

      const isValid = validateCacheEntry(entry);
      expect(isValid).toBe(false);
    });

    it('should reject entries with incompatible versions', () => {
      const entry: CacheEntry = {
        data: mockWeeklyPlan,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        version: '0.9', // Old version
        requestHash: 'test-hash',
        usageCount: 1
      };

      const isValid = validateCacheEntry(entry, '1.0');
      expect(isValid).toBe(false);
    });

    it('should validate entries within usage limits', () => {
      const entry: CacheEntry = {
        data: mockWeeklyPlan,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        version: '1.0',
        requestHash: 'test-hash',
        usageCount: 5
      };

      const isValid = validateCacheEntry(entry, '1.0', 10); // Max usage: 10
      expect(isValid).toBe(true);

      const isInvalid = validateCacheEntry(entry, '1.0', 3); // Max usage: 3
      expect(isInvalid).toBe(false);
    });
  });

  describe('cleanExpiredCache', () => {
    it('should identify and remove expired entries', async () => {
      const expiredKeys = [
        'ai_cache:meal_plan:expired1',
        'ai_cache:recipe:expired2'
      ];

      const validKeys = [
        'ai_cache:meal_plan:valid1',
        'ai_cache:recipe:valid2'
      ];

      mockRedisClient.keys.mockResolvedValue([...expiredKeys, ...validKeys]);
      
      // Mock TTL responses
      mockRedisClient.ttl
        .mockResolvedValueOnce(-2) // expired1
        .mockResolvedValueOnce(-2) // expired2
        .mockResolvedValueOnce(1800) // valid1
        .mockResolvedValueOnce(900); // valid2

      mockRedisClient.del.mockResolvedValue(2);

      const cleaned = await cleanExpiredCache(mockRedisClient);

      expect(cleaned.expiredCount).toBe(2);
      expect(cleaned.deletedKeys).toEqual(expiredKeys);
      expect(mockRedisClient.del).toHaveBeenCalledWith(expiredKeys);
    });

    it('should clean entries by usage patterns', async () => {
      const lowUsageEntries = [
        {
          key: 'ai_cache:meal_plan:low1',
          data: JSON.stringify({
            data: {},
            usageCount: 1,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString() // 7 days old
          })
        },
        {
          key: 'ai_cache:meal_plan:low2', 
          data: JSON.stringify({
            data: {},
            usageCount: 2,
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days old
          })
        }
      ];

      const highUsageEntry = {
        key: 'ai_cache:meal_plan:high1',
        data: JSON.stringify({
          data: {},
          usageCount: 50,
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString() // 7 days old
        })
      };

      mockRedisClient.keys.mockResolvedValue([
        lowUsageEntries[0].key,
        lowUsageEntries[1].key,
        highUsageEntry.key
      ]);

      mockRedisClient.mget.mockResolvedValue([
        lowUsageEntries[0].data,
        lowUsageEntries[1].data,
        highUsageEntry.data
      ]);

      const cleaned = await cleanExpiredCache(mockRedisClient, {
        maxAge: 86400000 * 3, // 3 days
        minUsageThreshold: 5
      });

      expect(cleaned.lowUsageCount).toBe(2);
      expect(cleaned.deletedKeys).toHaveLength(2);
    });
  });

  describe('estimateCacheSavings', () => {
    it('should calculate cost savings accurately', () => {
      const stats: CacheStats = {
        totalRequests: 1000,
        cacheHits: 750,
        cacheMisses: 250,
        avgResponseTime: 150,
        costPerRequest: 0.02, // $0.02 per AI request
        storageCost: 5.0, // $5 per month for Redis
        compressionRatio: 0.6
      };

      const savings = estimateCacheSavings(stats, 30); // 30 days

      expect(savings.aiRequestsSaved).toBe(750);
      expect(savings.costSavings).toBe(15.0); // 750 * $0.02
      expect(savings.netSavings).toBe(10.0); // $15 savings - $5 storage
      expect(savings.roi).toBe(200); // 200% ROI
      expect(savings.hitRate).toBe(0.75); // 75% hit rate
    });

    it('should account for different request types costs', () => {
      const stats: CacheStats = {
        totalRequests: 1000,
        cacheHits: 600,
        cacheMisses: 400,
        avgResponseTime: 200,
        costPerRequest: 0.05, // Higher cost per request
        storageCost: 8.0,
        compressionRatio: 0.7,
        requestTypeBreakdown: {
          meal_plan_generation: { requests: 300, hits: 250, cost: 0.10 },
          recipe_generation: { requests: 500, hits: 300, cost: 0.03 },
          pantry_suggestions: { requests: 200, hits: 50, cost: 0.01 }
        }
      };

      const savings = estimateCacheSavings(stats, 30);

      // Should calculate weighted cost savings
      expect(savings.costSavings).toBeGreaterThan(20); // Should account for expensive meal plan generations
      expect(savings.requestTypeBreakdown).toBeDefined();
    });

    it('should project future savings', () => {
      const stats: CacheStats = {
        totalRequests: 500,
        cacheHits: 300,
        cacheMisses: 200,
        avgResponseTime: 180,
        costPerRequest: 0.03,
        storageCost: 6.0,
        compressionRatio: 0.65
      };

      const monthly = estimateCacheSavings(stats, 30);
      const yearly = estimateCacheSavings(stats, 365);

      expect(yearly.costSavings).toBeCloseTo(monthly.costSavings * 12.17, 1); // ~365/30
      expect(yearly.netSavings).toBeCloseTo(monthly.netSavings * 12.17, 1);
    });
  });

  describe('optimizeCacheStrategy', () => {
    it('should recommend strategy improvements', () => {
      const stats: CacheStats = {
        totalRequests: 1000,
        cacheHits: 400, // Low hit rate
        cacheMisses: 600,
        avgResponseTime: 300,
        costPerRequest: 0.04,
        storageCost: 10.0,
        compressionRatio: 0.8
      };

      const optimization = optimizeCacheStrategy(stats);

      expect(optimization.currentHitRate).toBe(0.4);
      expect(optimization.recommendations).toContain('Increase TTL for frequently used patterns');
      expect(optimization.recommendations).toContain('Implement cache warming');
      expect(optimization.estimatedImprovement.hitRateIncrease).toBeGreaterThan(0);
    });

    it('should suggest cache warming for common patterns', () => {
      const stats: CacheStats = {
        totalRequests: 2000,
        cacheHits: 1200,
        cacheMisses: 800,
        avgResponseTime: 150,
        costPerRequest: 0.03,
        storageCost: 8.0,
        compressionRatio: 0.7,
        commonPatterns: [
          { pattern: 'weekend_asado', frequency: 150, hitRate: 0.3 },
          { pattern: 'weekday_lunch', frequency: 400, hitRate: 0.8 },
          { pattern: 'mate_breakfast', frequency: 600, hitRate: 0.9 }
        ]
      };

      const optimization = optimizeCacheStrategy(stats);

      expect(optimization.warmingCandidates).toContain('weekend_asado');
      expect(optimization.recommendations).toContain('Pre-cache weekend asado variations');
    });

    it('should balance storage costs vs savings', () => {
      const highStorageStats: CacheStats = {
        totalRequests: 500,
        cacheHits: 400,
        cacheMisses: 100,
        avgResponseTime: 100,
        costPerRequest: 0.02,
        storageCost: 15.0, // High storage cost
        compressionRatio: 0.4 // Poor compression
      };

      const optimization = optimizeCacheStrategy(highStorageStats);

      expect(optimization.recommendations).toContain('Improve compression ratios');
      expect(optimization.recommendations).toContain('Reduce cache size');
      expect(optimization.estimatedImprovement.costReduction).toBeGreaterThan(0);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle cache failures gracefully', async () => {
      const request = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123'
      };

      // Mock Redis failure
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));
      
      const mockAICall = jest.fn().mockResolvedValue(mockWeeklyPlan);
      const result = await cachedAIService.generateMealPlan(request, mockAICall);

      expect(mockAICall).toHaveBeenCalled(); // Should fallback to AI call
      expect(result).toEqual(mockWeeklyPlan);
    });

    it('should handle corrupted cache data', async () => {
      const request = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123'
      };

      // Mock corrupted cache data
      mockRedisClient.get.mockResolvedValue('invalid-json-data');
      
      const mockAICall = jest.fn().mockResolvedValue(mockWeeklyPlan);
      const result = await cachedAIService.generateMealPlan(request, mockAICall);

      expect(mockAICall).toHaveBeenCalled(); // Should fallback to AI call
      expect(result).toEqual(mockWeeklyPlan);
    });

    it('should handle cache size limits', async () => {
      // Mock cache size check
      mockRedisClient.keys.mockResolvedValue(Array.from({ length: 1500 }, (_, i) => `key${i}`));
      
      const request = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123'
      };

      mockRedisClient.get.mockResolvedValue(null);
      const mockAICall = jest.fn().mockResolvedValue(mockWeeklyPlan);
      
      await cachedAIService.generateMealPlan(request, mockAICall);

      // Should trigger cache cleanup when approaching size limit
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it('should handle memory pressure scenarios', async () => {
      const largeResponse = {
        ...mockWeeklyPlan,
        extraData: 'x'.repeat(1000000) // 1MB of data
      };

      const request = {
        type: 'meal_plan_generation' as AIRequestType,
        userId: 'user123'
      };

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const mockAICall = jest.fn().mockResolvedValue(largeResponse);
      await cachedAIService.generateMealPlan(request, mockAICall);

      // Should apply aggressive compression for large responses
      const setCall = mockRedisClient.set.mock.calls[0];
      const cachedData = JSON.parse(setCall[1]);
      
      expect(cachedData.compressed).toBe(true);
      expect(setCall[1].length).toBeLessThan(JSON.stringify(largeResponse).length);
    });
  });
});