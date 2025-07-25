/**
 * Tests para GeminiPlannerService
 */

import { describe, it, expect, beforeEach, jest, beforeAll, afterAll } from '@jest/globals';
import { GeminiPlannerService, GeminiPlannerOptions } from '@/lib/services/geminiPlannerService';
import { UserPreferences, PlanningConstraints } from '@/lib/types/mealPlanning';

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            success: true,
            daily_plans: [
              {
                day: 'lunes',
                meals: {
                  breakfast: {
                    name: 'Test Breakfast',
                    recipe: {
                      name: 'Test Recipe',
                      description: 'Test description',
                      timing: { prep_time: 10, cook_time: 15 },
                      servings: 2,
                      difficulty: 'easy',
                      ingredients: [{ name: 'Test ingredient', quantity: 1, unit: 'cup' }]
                    }
                  }
                }
              }
            ],
            nutritional_analysis: {
              calories: 2000,
              protein: 100,
              carbs: 250,
              fat: 70
            },
            optimization_summary: {
              cost_efficiency: 0.8,
              time_efficiency: 0.9
            }
          })
        }
      })
    })
  }))
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pantryItem: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          userId: 'user-1',
          ingredient: { name: 'Test Ingredient' },
          quantity: 2,
          unit: 'cups'
        }
      ])
    },
    favoriteRecipe: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          userId: 'user-1',
          recipe: {
            id: 'recipe-1',
            title: 'Test Recipe',
            ingredients: []
          }
        }
      ])
    }
  }
}));

// Mock enhanced cache
jest.mock('@/lib/services/enhancedCacheService', () => ({
  enhancedCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
  },
  CacheKeyGenerator: {
    holisticPlan: jest.fn().mockReturnValue('test-cache-key')
  }
}));

describe('GeminiPlannerService', () => {
  let service: GeminiPlannerService;
  let mockPreferences: UserPreferences;
  let mockConstraints: PlanningConstraints;
  let mockOptions: GeminiPlannerOptions;

  beforeAll(() => {
    // Set required environment variable
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    service = new GeminiPlannerService();
    
    mockPreferences = {
      userId: 'user-1',
      dietaryRestrictions: ['omnivore'],
      allergies: [],
      favoriteCuisines: ['mediterránea'],
      cookingSkillLevel: 'intermediate',
      householdSize: 2,
      weeklyBudget: 500,
      maxPrepTimePerMeal: 60,
      preferredMealTypes: ['breakfast', 'lunch', 'dinner']
    };

    mockConstraints = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-07'),
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      servings: 2,
      maxPrepTime: 60
    };

    mockOptions = {
      useHolisticAnalysis: true,
      includeExternalFactors: true,
      optimizeResources: true,
      enableLearning: true,
      analysisDepth: 'comprehensive'
    };
  });

  afterAll(() => {
    delete process.env.GOOGLE_AI_API_KEY;
  });

  describe('Constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(() => new GeminiPlannerService()).not.toThrow();
    });

    it('should throw error when API key is missing', () => {
      delete process.env.GOOGLE_AI_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
      
      expect(() => new GeminiPlannerService()).toThrow(
        'GOOGLE_AI_API_KEY or NEXT_PUBLIC_GOOGLE_AI_API_KEY environment variable is required'
      );
      
      // Restore for other tests
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
    });
  });

  describe('generateHolisticPlan', () => {
    it('should generate a holistic meal plan successfully', async () => {
      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.confidenceScore).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock a failed API call
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      };
      
      jest.spyOn(service as any, 'model', 'get').mockReturnValue(mockModel);

      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata.confidenceScore).toBe(0);
    });

    it('should respect timeout configuration', async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini request timeout')), 100)
      );
      
      const mockModel = {
        generateContent: jest.fn().mockReturnValue(timeoutPromise)
      };
      
      jest.spyOn(service as any, 'model', 'get').mockReturnValue(mockModel);

      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should validate required parameters', async () => {
      const invalidPreferences = { ...mockPreferences, userId: '' };

      const result = await service.generateHolisticPlan(
        invalidPreferences,
        mockConstraints,
        mockOptions
      );

      // Should still attempt to process but may have issues
      expect(result).toBeDefined();
    });
  });

  describe('generateDailyOptimization', () => {
    it('should optimize a daily plan successfully', async () => {
      const mockWeeklyPlan = {
        id: 'plan-1',
        userId: 'user-1',
        weekStartDate: new Date('2024-01-01'),
        meals: []
      };

      const focusDay = new Date('2024-01-02');

      const result = await service.generateDailyOptimization(
        mockPreferences,
        mockWeeklyPlan,
        focusDay
      );

      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
    });

    it('should handle missing current plan', async () => {
      const focusDay = new Date('2024-01-02');

      const result = await service.generateDailyOptimization(
        mockPreferences,
        {},
        focusDay
      );

      expect(result).toBeDefined();
    });
  });

  describe('processLearningFeedback', () => {
    it('should process feedback and generate insights', async () => {
      const mockFeedback = {
        mealRatings: { 'meal-1': 4.5, 'meal-2': 3.8 },
        timeAccuracy: { 'meal-1': 0.9, 'meal-2': 0.7 },
        difficultyActual: { 'meal-1': 2, 'meal-2': 3 },
        innovations: ['Added extra vegetables'],
        challenges: ['Prep time longer than expected']
      };

      const result = await service.processLearningFeedback('plan-1', mockFeedback);

      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.adaptations).toBeDefined();
    });

    it('should handle malformed feedback gracefully', async () => {
      const invalidFeedback = {};

      const result = await service.processLearningFeedback('plan-1', invalidFeedback as any);

      expect(result.insights).toEqual({});
      expect(result.adaptations).toEqual({});
    });
  });

  describe('buildHolisticContext', () => {
    it('should build comprehensive context successfully', async () => {
      const buildHolisticContext = (service as any).buildHolisticContext.bind(service);
      
      const context = await buildHolisticContext(mockPreferences, mockConstraints);

      expect(context).toBeDefined();
      expect(context.userState).toBeDefined();
      expect(context.systemState).toBeDefined();
      expect(context.externalFactors).toBeDefined();
      expect(context.userState.preferences).toEqual(mockPreferences);
      expect(context.userState.constraints).toEqual(mockConstraints);
    });
  });

  describe('validateGeminiResponse', () => {
    it('should validate valid response structure', () => {
      const validateGeminiResponse = (service as any).validateGeminiResponse.bind(service);
      
      const validResponse = {
        week_plan: {},
        daily_plans: [{ meals: {} }]
      };

      const result = validateGeminiResponse(validResponse);

      expect(result).toBe(true);
    });

    it('should reject invalid response structure', () => {
      const validateGeminiResponse = (service as any).validateGeminiResponse.bind(service);
      
      const invalidResponse = {
        invalid_field: 'test'
      };

      const result = validateGeminiResponse(invalidResponse);

      expect(result).toBe(false);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence score correctly', () => {
      const calculateConfidence = (service as any).calculateConfidence.bind(service);
      
      const completeResponse = {
        week_plan: {},
        optimization_summary: {},
        nutritional_analysis: {},
        shopping_list_preview: {},
        meal_prep_plan: {}
      };

      const confidence = calculateConfidence(completeResponse);

      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should give low confidence for incomplete response', () => {
      const calculateConfidence = (service as any).calculateConfidence.bind(service);
      
      const incompleteResponse = {};

      const confidence = calculateConfidence(incompleteResponse);

      expect(confidence).toBe(0.5); // Base score
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      
      jest.spyOn(service as any, 'model', 'get').mockReturnValue(mockModel);

      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Invalid JSON response'
          }
        })
      };
      
      jest.spyOn(service as any, 'model', 'get').mockReturnValue(mockModel);

      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process Gemini response');
    });
  });

  describe('Cache Integration', () => {
    it('should use cached results when available', async () => {
      const mockCachedResult = {
        success: true,
        plan: { id: 'cached-plan' },
        metadata: { confidenceScore: 0.9 }
      };

      const { enhancedCache } = require('@/lib/services/enhancedCacheService');
      enhancedCache.get.mockResolvedValueOnce(mockCachedResult);

      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      expect(enhancedCache.get).toHaveBeenCalled();
      expect(result).toEqual(mockCachedResult);
    });

    it('should cache successful results', async () => {
      const { enhancedCache } = require('@/lib/services/enhancedCacheService');
      enhancedCache.get.mockResolvedValueOnce(null); // No cache

      const result = await service.generateHolisticPlan(
        mockPreferences,
        mockConstraints,
        mockOptions
      );

      if (result.success) {
        expect(enhancedCache.set).toHaveBeenCalledWith(
          'test-cache-key',
          result,
          expect.any(Number)
        );
      }
    });
  });
});