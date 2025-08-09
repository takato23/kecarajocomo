import { NextRequest } from 'next/server';
import { POST } from '../generate/route';
import { createClient } from '@/lib/supabase/server';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';
import { logger } from '@/lib/logger';
import type { UserPreferences, PlanningConstraints } from '@/lib/types/mealPlanning';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/services/geminiPlannerService', () => ({
  geminiPlannerService: {
    generateHolisticPlan: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({})),
}));

describe('POST /api/meal-planning/generate', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  
  const mockPreferences: UserPreferences = {
    userId: mockUser.id,
    dietaryPreferences: ['omnivore'],
    dietProfile: 'balanced',
    cuisinePreferences: ['mediterranean'],
    excludedIngredients: [],
    preferredIngredients: [],
    allergies: [],
    cookingSkill: 'intermediate',
    maxCookingTime: 60,
    mealsPerDay: 3,
    servingsPerMeal: 2,
    budget: 'medium',
    preferVariety: true,
    useSeasonalIngredients: true,
    considerPantryItems: true,
  };

  const mockConstraints: PlanningConstraints = {
    startDate: '2024-01-15',
    endDate: '2024-01-21',
    availableTime: 60,
    includeLeftovers: true,
    excludeRecipeIds: [],
  };

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should return 400 if preferences are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: preferences and constraints');
    });

    it('should return 400 if constraints are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: preferences and constraints');
    });
  });

  describe('Successful Generation', () => {
    const mockPlanResult = {
      success: true,
      plan: {
        id: 'plan-123',
        userId: mockUser.id,
        weekPlan: {
          id: 'week-123',
          startDate: '2024-01-15',
          endDate: '2024-01-21',
          slots: [],
        },
        shoppingList: {
          items: [],
          categories: [],
          estimatedTotal: 100,
        },
        nutritionSummary: {
          daily: { calories: 2000, protein: 100, carbs: 250, fat: 70 },
          weekly: { calories: 14000, protein: 700, carbs: 1750, fat: 490 },
        },
      },
      insights: {
        seasonalRecommendations: ['Use fresh tomatoes'],
        budgetOptimizations: ['Buy in bulk'],
        nutritionalBalance: ['Good protein distribution'],
      },
      metadata: {
        confidenceScore: 0.95,
        processingTime: '2.5s',
        optimizationLevel: 'high',
      },
    };

    beforeEach(() => {
      (geminiPlannerService.generateHolisticPlan as jest.Mock).mockResolvedValue(mockPlanResult);
    });

    it('should generate meal plan successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.plan).toEqual(mockPlanResult.plan);
      expect(data.insights).toEqual(mockPlanResult.insights);
      expect(data.metadata).toEqual(mockPlanResult.metadata);
    });

    it('should merge user ID into preferences', async () => {
      const preferencesWithoutUserId = { ...mockPreferences };
      delete (preferencesWithoutUserId as any).userId;

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: preferencesWithoutUserId,
          constraints: mockConstraints,
        }),
      });

      await POST(request);

      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser.id }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should convert date strings to Date objects', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      await POST(request);

      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          startDate: new Date(mockConstraints.startDate),
          endDate: new Date(mockConstraints.endDate),
        }),
        expect.any(Object)
      );
    });

    it('should use default options if not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      await POST(request);

      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          useHolisticAnalysis: true,
          includeExternalFactors: true,
          optimizeResources: true,
          enableLearning: true,
          analysisDepth: 'comprehensive',
        })
      );
    });

    it('should merge custom options', async () => {
      const customOptions = {
        analysisDepth: 'quick',
        useHolisticAnalysis: false,
      };

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
          options: customOptions,
        }),
      });

      await POST(request);

      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          useHolisticAnalysis: false,
          includeExternalFactors: true,
          optimizeResources: true,
          enableLearning: true,
          analysisDepth: 'quick',
        })
      );
    });

    it('should log successful generation', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      await POST(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Generating weekly meal plan',
        'meal-planning/generate',
        expect.objectContaining({
          userId: mockUser.id,
          dateRange: expect.stringContaining('2024-01-15'),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Successfully generated meal plan',
        'meal-planning/generate',
        expect.objectContaining({
          userId: mockUser.id,
          confidence: 0.95,
          processingTime: '2.5s',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle generation failure', async () => {
      (geminiPlannerService.generateHolisticPlan as jest.Mock).mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
      });

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('AI service unavailable');
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      (geminiPlannerService.generateHolisticPlan as jest.Mock).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unexpected error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error in meal plan generation endpoint',
        'meal-planning/generate',
        error
      );
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unexpected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty preferences', async () => {
      const emptyPreferences = {};
      
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: emptyPreferences,
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser.id }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle very large date ranges', async () => {
      const longRangeConstraints = {
        ...mockConstraints,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: mockPreferences,
          constraints: longRangeConstraints,
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalled();
    });

    it('should handle special characters in preferences', async () => {
      const specialPreferences = {
        ...mockPreferences,
        excludedIngredients: ['<script>alert("xss")</script>', 'egg & dairy'],
        cuisinePreferences: ['español', '中文', 'français'],
      };

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          preferences: specialPreferences,
          constraints: mockConstraints,
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(geminiPlannerService.generateHolisticPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          excludedIngredients: specialPreferences.excludedIngredients,
          cuisinePreferences: specialPreferences.cuisinePreferences,
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});