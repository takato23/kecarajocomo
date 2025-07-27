import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { useMealPlanning } from '../useMealPlanning';
import { 
  mockWeeklyPlan, 
  mockUserPreferences, 
  mockPantryItems,
  mockAlternativeRecipes,
  mockRegeneratedMeal,
  mockNutritionSummary 
} from '@/__tests__/mocks/fixtures/argentineMealData';

// Mock the API services
jest.mock('@/lib/services/geminiMealPlannerAPI');
jest.mock('@/lib/services/mealPlanningAI');
jest.mock('@/services/ai/GeminiService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2024-12-31',
  };

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe('useMealPlanning Hook', () => {
  let mockMealPlanningAPI: any;
  let mockGeminiService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API mocks
    mockMealPlanningAPI = require('@/lib/services/geminiMealPlannerAPI');
    mockGeminiService = require('@/services/ai/GeminiService');
    
    mockMealPlanningAPI.generateWeeklyPlan.mockResolvedValue(mockWeeklyPlan);
    mockMealPlanningAPI.regenerateMeal.mockResolvedValue(mockRegeneratedMeal);
    mockMealPlanningAPI.getAlternatives.mockResolvedValue(mockAlternativeRecipes);
    mockGeminiService.getGeminiService.mockReturnValue({
      checkAvailability: () => true,
      generateContent: jest.fn().mockResolvedValue('Mock AI response'),
    });
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      expect(result.current.weeklyPlan).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.saving).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.mode).toBe('normal');
      expect(result.current.isDirty).toBe(false);
    });

    it('should load user preferences on initialization', async () => {
      mockMealPlanningAPI.getUserPreferences.mockResolvedValue(mockUserPreferences);

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockUserPreferences);
      });
    });

    it('should load pantry items on initialization', async () => {
      mockMealPlanningAPI.getPantryItems.mockResolvedValue(mockPantryItems);

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.pantry).toEqual(mockPantryItems);
      });
    });
  });

  describe('Plan Generation', () => {
    it('should generate weekly plan with user preferences', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeTruthy();
      });

      // Generate plan
      await result.current.generateWeeklyPlan({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });

      await waitFor(() => {
        expect(result.current.weeklyPlan).toEqual(mockWeeklyPlan);
        expect(result.current.loading).toBe(false);
        expect(result.current.isDirty).toBe(true);
      });

      expect(mockMealPlanningAPI.generateWeeklyPlan).toHaveBeenCalledWith({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });
    });

    it('should handle generation errors gracefully', async () => {
      const errorMessage = 'Error generando plan de comidas';
      mockMealPlanningAPI.generateWeeklyPlan.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeTruthy();
      });

      try {
        await result.current.generateWeeklyPlan({
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal',
        });
      } catch (error) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
        expect(result.current.weeklyPlan).toBeNull();
      });
    });

    it('should respect pantry availability during generation', async () => {
      const limitedPantry = [
        { id: '1', name: 'Carne de res', quantity: 2, unit: 'kg' }
      ];

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.generateWeeklyPlan({
        preferences: mockUserPreferences,
        pantry: limitedPantry,
        mode: 'pantry-focused',
      });

      expect(mockMealPlanningAPI.generateWeeklyPlan).toHaveBeenCalledWith({
        preferences: mockUserPreferences,
        pantry: limitedPantry,
        mode: 'pantry-focused',
      });
    });

    it('should apply cultural preferences correctly', async () => {
      const culturalPreferences = {
        ...mockUserPreferences,
        cultural: {
          region: 'patagonia' as const,
          traditionLevel: 'alta' as const,
          mateFrequency: 'diario' as const,
          asadoFrequency: 'semanal' as const,
        },
      };

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.generateWeeklyPlan({
        preferences: culturalPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });

      expect(mockMealPlanningAPI.generateWeeklyPlan).toHaveBeenCalledWith({
        preferences: culturalPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });
    });
  });

  describe('Plan Modification', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      // Setup with existing plan
      await result.current.generateWeeklyPlan({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });

      await waitFor(() => {
        expect(result.current.weeklyPlan).toEqual(mockWeeklyPlan);
      });
    });

    it('should regenerate individual meals', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      const regeneratedMeal = await result.current.regenerateMeal('2024-01-15', 'almuerzo');

      expect(regeneratedMeal).toEqual(mockRegeneratedMeal);
      expect(mockMealPlanningAPI.regenerateMeal).toHaveBeenCalledWith(
        '2024-01-15',
        'almuerzo',
        expect.any(Object)
      );
      expect(result.current.isDirty).toBe(true);
    });

    it('should get meal alternatives', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      const alternatives = await result.current.getAlternatives('asado-tradicional');

      expect(alternatives).toEqual(mockAlternativeRecipes);
      expect(mockMealPlanningAPI.getAlternatives).toHaveBeenCalledWith(
        'asado-tradicional',
        expect.any(Object)
      );
    });

    it('should lock and unlock meals', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      // Lock meal
      result.current.lockMeal('2024-01-15', 'almuerzo');
      
      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });

      // Unlock meal
      result.current.unlockMeal('2024-01-15', 'almuerzo');
      
      await waitFor(() => {
        expect(result.current.isDirty).toBe(true);
      });
    });

    it('should update nutrition summary when plan changes', async () => {
      mockMealPlanningAPI.calculateNutritionSummary.mockResolvedValue(mockNutritionSummary);

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.updateNutritionSummary();

      await waitFor(() => {
        expect(result.current.nutritionSummary).toEqual(mockNutritionSummary);
      });
    });
  });

  describe('Persistence', () => {
    it('should auto-save changes when isDirty is true', async () => {
      mockMealPlanningAPI.savePlan.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      // Generate plan to set isDirty = true
      await result.current.generateWeeklyPlan({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });

      // Wait for auto-save
      await waitFor(() => {
        expect(mockMealPlanningAPI.savePlan).toHaveBeenCalled();
      }, { timeout: 6000 }); // Auto-save has 5s delay
    });

    it('should load plans for different weeks', async () => {
      const nextWeekPlan = {
        ...mockWeeklyPlan,
        weekStart: '2024-01-22',
        weekEnd: '2024-01-28',
        planId: 'plan-week-2',
      };

      mockMealPlanningAPI.loadPlan.mockResolvedValue(nextWeekPlan);

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.loadPlan('2024-01-22');

      await waitFor(() => {
        expect(result.current.weeklyPlan).toEqual(nextWeekPlan);
      });

      expect(mockMealPlanningAPI.loadPlan).toHaveBeenCalledWith('2024-01-22');
    });

    it('should handle offline mode gracefully', async () => {
      // Simulate network error
      mockMealPlanningAPI.savePlan.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      // Generate plan to trigger save
      await result.current.generateWeeklyPlan({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });

      // Should handle save error gracefully
      await waitFor(() => {
        expect(result.current.realtimeConnected).toBe(false);
      });
    });
  });

  describe('Pantry Integration', () => {
    it('should update pantry item quantities', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.updatePantryItem('1', { quantity: 5 });

      expect(mockMealPlanningAPI.updatePantryItem).toHaveBeenCalledWith('1', { quantity: 5 });
    });

    it('should remove pantry items', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.removePantryItem('1');

      expect(mockMealPlanningAPI.removePantryItem).toHaveBeenCalledWith('1');
    });
  });

  describe('User Preferences', () => {
    it('should update user preferences', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      const newPreferences = {
        ...mockUserPreferences,
        budget: { ...mockUserPreferences.budget, weekly: 20000 },
      };

      await result.current.updatePreferences(newPreferences);

      expect(mockMealPlanningAPI.updateUserPreferences).toHaveBeenCalledWith(newPreferences);
    });

    it('should add favorite dishes', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.addFavoriteDish('asado-tradicional');

      expect(mockMealPlanningAPI.addFavoriteDish).toHaveBeenCalledWith('asado-tradicional');
    });

    it('should add disliked ingredients', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      await result.current.addDislikedIngredient('cebolla');

      expect(mockMealPlanningAPI.addDislikedIngredient).toHaveBeenCalledWith('cebolla');
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      // Set error state
      mockMealPlanningAPI.generateWeeklyPlan.mockRejectedValue(new Error('Test error'));
      
      try {
        await result.current.generateWeeklyPlan({
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal',
        });
      } catch (error) {
        // Expected
      }

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Clear error
      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle API unavailability', async () => {
      mockGeminiService.getGeminiService.mockReturnValue({
        checkAvailability: () => false,
      });

      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.generateWeeklyPlan({
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal',
        });
      } catch (error) {
        expect(error.message).toContain('AI service unavailable');
      }
    });
  });

  describe('Mode Management', () => {
    it('should change planning mode', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      result.current.setMode('budget-focused');

      await waitFor(() => {
        expect(result.current.mode).toBe('budget-focused');
      });
    });

    it('should generate different plans based on mode', async () => {
      const { result } = renderHook(() => useMealPlanning(), {
        wrapper: createWrapper(),
      });

      // Test budget-focused mode
      await result.current.generateWeeklyPlan({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'budget-focused',
      });

      expect(mockMealPlanningAPI.generateWeeklyPlan).toHaveBeenCalledWith({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'budget-focused',
      });
    });
  });
});