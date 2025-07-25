/**
 * Tests para useGeminiMealPlanner hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { toast } from 'sonner';

import { useGeminiMealPlanner } from '@/features/meal-planning/hooks/useGeminiMealPlanner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';

// Mock dependencies
jest.mock('@/features/auth/hooks/useAuth');
jest.mock('@/features/meal-planning/store/useMealPlanningStore');
jest.mock('sonner');

// Mock fetch
global.fetch = jest.fn();

describe('useGeminiMealPlanner', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockUserPreferences = {
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

  const mockCurrentWeekPlan = {
    id: 'week-1',
    userId: 'user-1',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    slots: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockStoreActions = {
    loadWeekPlan: jest.fn(),
    saveWeekPlan: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser
    });

    (useMealPlanningStore as jest.Mock).mockReturnValue({
      userPreferences: mockUserPreferences,
      currentWeekPlan: mockCurrentWeekPlan,
      currentDate: new Date('2024-01-03'),
      ...mockStoreActions
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        plan: {
          id: 'generated-plan-1',
          userId: 'user-1',
          weekStartDate: new Date('2024-01-01'),
          meals: [
            {
              date: new Date('2024-01-02'),
              breakfast: {
                recipe: {
                  id: 'recipe-1',
                  title: 'Test Breakfast',
                  description: 'Test description',
                  prepTimeMinutes: 10,
                  cookTimeMinutes: 15,
                  servings: 2,
                  difficulty: 'easy',
                  ingredients: [
                    { name: 'Test ingredient', quantity: 1, unit: 'cup' }
                  ]
                },
                confidence: 0.9
              }
            }
          ]
        },
        metadata: {
          confidenceScore: 0.85,
          promptTokens: 1000,
          responseTokens: 500,
          processingTime: 2000,
          geminiModel: 'gemini-2.0-flash-exp'
        }
      })
    });

    (toast.success as jest.Mock).mockImplementation(() => {});
    (toast.error as jest.Mock).mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useGeminiMealPlanner());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastGeneratedPlan).toBe(null);
      expect(result.current.confidence).toBe(0);
    });
  });

  describe('generateWeeklyPlan', () => {
    it('should generate weekly plan successfully', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());

      await act(async () => {
        const planResult = await result.current.generateWeeklyPlan();
        expect(planResult.success).toBe(true);
        expect(planResult.data).toBeDefined();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastGeneratedPlan).toBeDefined();
      expect(result.current.confidence).toBe(0.85);
      expect(toast.success).toHaveBeenCalledWith(
        'Plan de comidas generado exitosamente',
        { description: 'Confianza: 85%' }
      );
    });

    it('should handle unauthenticated user', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      
      const { result } = renderHook(() => useGeminiMealPlanner());

      await act(async () => {
        const planResult = await result.current.generateWeeklyPlan();
        expect(planResult.success).toBe(false);
        expect(planResult.error).toBe('Usuario no autenticado');
        expect(planResult.code).toBe('UNAUTHENTICATED');
      });
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: 'Internal server error'
        })
      });

      const { result } = renderHook(() => useGeminiMealPlanner());

      await act(async () => {
        const planResult = await result.current.generateWeeklyPlan();
        expect(planResult.success).toBe(false);
        expect(planResult.error).toBe('Internal server error');
        expect(planResult.code).toBe('GENERATION_ERROR');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('Internal server error');
      expect(toast.error).toHaveBeenCalledWith(
        'Error al generar el plan',
        { description: 'Internal server error' }
      );
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGeminiMealPlanner());

      await act(async () => {
        const planResult = await result.current.generateWeeklyPlan();
        expect(planResult.success).toBe(false);
        expect(planResult.error).toBe('Network error');
      });
    });

    it('should merge custom preferences correctly', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());

      const customPreferences = {
        cookingSkillLevel: 'advanced' as const,
        weeklyBudget: 800
      };

      await act(async () => {
        await result.current.generateWeeklyPlan(customPreferences);
      });

      expect(fetch).toHaveBeenCalledWith('/api/meal-planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"cookingSkillLevel":"advanced"')
      });
    });

    it('should set loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useGeminiMealPlanner());

      // Start generation
      act(() => {
        result.current.generateWeeklyPlan();
      });

      // Should be loading
      expect(result.current.isGenerating).toBe(true);
      expect(result.current.error).toBe(null);

      // Resolve the promise
      await act(async () => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            plan: { id: 'test-plan' },
            metadata: { confidenceScore: 0.8 }
          })
        });
      });

      // Should no longer be loading
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('optimizeDailyPlan', () => {
    it('should optimize daily plan successfully', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());
      const focusDate = new Date('2024-01-02');

      await act(async () => {
        const planResult = await result.current.optimizeDailyPlan(focusDate);
        expect(planResult.success).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/meal-planning/optimize-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"focusDay":"2024-01-02T00:00:00.000Z"')
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Plan diario optimizado',
        { description: 'Mejoras aplicadas para 2/1/2024' }
      );
    });

    it('should handle missing current plan', async () => {
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreActions,
        userPreferences: mockUserPreferences,
        currentWeekPlan: null,
        currentDate: new Date('2024-01-03')
      });

      const { result } = renderHook(() => useGeminiMealPlanner());
      const focusDate = new Date('2024-01-02');

      await act(async () => {
        const planResult = await result.current.optimizeDailyPlan(focusDate);
        expect(planResult.success).toBe(false);
        expect(planResult.error).toBe('No hay plan de semana actual para optimizar');
        expect(planResult.code).toBe('NO_CURRENT_PLAN');
      });
    });
  });

  describe('regenerateWithFeedback', () => {
    it('should regenerate plan with feedback successfully', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());
      const feedback = 'Necesito más opciones vegetarianas';
      const currentPlan = {
        id: 'current-plan',
        userId: 'user-1',
        weekStartDate: new Date('2024-01-01'),
        meals: []
      };

      await act(async () => {
        const planResult = await result.current.regenerateWithFeedback(feedback, currentPlan);
        expect(planResult.success).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/meal-planning/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"feedback":"Necesito más opciones vegetarianas"')
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Plan regenerado con éxito',
        { description: 'Se aplicaron tus sugerencias al nuevo plan' }
      );
    });
  });

  describe('applyGeneratedPlan', () => {
    it('should apply generated plan successfully', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());
      
      const mockPlan = {
        id: 'test-plan',
        userId: 'user-1',
        weekStartDate: new Date('2024-01-01'),
        meals: [
          {
            date: new Date('2024-01-02'),
            breakfast: {
              recipe: {
                id: 'recipe-1',
                title: 'Test Breakfast',
                description: 'Test description',
                prepTimeMinutes: 10,
                cookTimeMinutes: 15,
                servings: 2,
                difficulty: 'easy',
                ingredients: [
                  { name: 'Test ingredient', quantity: 1, unit: 'cup' }
                ]
              },
              confidence: 0.9
            }
          }
        ]
      };

      await act(async () => {
        await result.current.applyGeneratedPlan(mockPlan);
      });

      expect(mockStoreActions.loadWeekPlan).toHaveBeenCalledWith('2024-01-01');
      expect(mockStoreActions.saveWeekPlan).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Plan aplicado exitosamente',
        { description: 'Las comidas se han agregado a tu calendario' }
      );
    });

    it('should handle invalid plan', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());
      
      const invalidPlan = {
        id: 'invalid-plan',
        userId: 'user-1',
        weekStartDate: new Date('2024-01-01'),
        meals: []
      };

      await act(async () => {
        await result.current.applyGeneratedPlan(invalidPlan);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Plan inválido',
        { description: 'El plan no contiene comidas válidas' }
      );
    });

    it('should handle errors during plan application', async () => {
      mockStoreActions.saveWeekPlan.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() => useGeminiMealPlanner());
      
      const mockPlan = {
        id: 'test-plan',
        userId: 'user-1',
        weekStartDate: new Date('2024-01-01'),
        meals: [
          {
            date: new Date('2024-01-02'),
            breakfast: {
              recipe: {
                id: 'recipe-1',
                title: 'Test Breakfast',
                description: 'Test description',
                prepTimeMinutes: 10,
                cookTimeMinutes: 15,
                servings: 2,
                difficulty: 'easy',
                ingredients: [
                  { name: 'Test ingredient', quantity: 1, unit: 'cup' }
                ]
              },
              confidence: 0.9
            }
          }
        ]
      };

      await act(async () => {
        await result.current.applyGeneratedPlan(mockPlan);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Error al aplicar el plan',
        { description: 'Save failed' }
      );
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useGeminiMealPlanner());

      // First, set an error state
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      await act(async () => {
        await result.current.generateWeeklyPlan();
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Malformed response'
        })
      });

      const { result } = renderHook(() => useGeminiMealPlanner());

      await act(async () => {
        const planResult = await result.current.generateWeeklyPlan();
        expect(planResult.success).toBe(false);
        expect(planResult.error).toBe('Malformed response');
      });
    });

    it('should handle fetch JSON parsing errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('JSON parse error'))
      });

      const { result } = renderHook(() => useGeminiMealPlanner());

      await act(async () => {
        const planResult = await result.current.generateWeeklyPlan();
        expect(planResult.success).toBe(false);
        expect(planResult.error).toContain('HTTP error! status: 500');
      });
    });
  });
});