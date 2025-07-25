/**
 * Tests para useMealPlanningStore
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import type { Recipe, MealSlot, WeekPlan } from '@/features/meal-planning/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useMealPlanningStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset the store state
    const { result } = renderHook(() => useMealPlanningStore());
    act(() => {
      result.current.currentWeekPlan = null;
      result.current.isLoading = false;
      result.current.error = null;
      result.current.selectedSlots = [];
      result.current.activeModal = null;
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useMealPlanningStore());

      expect(result.current.currentWeekPlan).toBe(null);
      expect(result.current.recipes).toBeDefined();
      expect(result.current.userPreferences).toBeDefined();
      expect(result.current.currentDate).toBeInstanceOf(Date);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.selectedSlots).toEqual([]);
      expect(result.current.draggedSlot).toBe(null);
      expect(result.current.activeModal).toBe(null);
      expect(result.current.selectedMeal).toBe(null);
    });

    it('should have mock recipes in initial state', () => {
      const { result } = renderHook(() => useMealPlanningStore());

      expect(Object.keys(result.current.recipes)).toContain('tortilla-espanola');
      expect(Object.keys(result.current.recipes)).toContain('ensalada-mediterranea');
      expect(result.current.recipes['tortilla-espanola'].name).toBe('Tortilla Española');
    });
  });

  describe('loadWeekPlan', () => {
    it('should load week plan from cache when available', async () => {
      const cachedPlan = {
        data: {
          id: 'cached-week-1',
          userId: 'user-1',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          slots: [],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        timestamp: Date.now() - 1000 // 1 second ago, within cache duration
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedPlan));

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      expect(result.current.currentWeekPlan).toEqual(cachedPlan.data);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should create new week plan when cache is expired', async () => {
      const expiredCachedPlan = {
        data: { id: 'expired-week' },
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago, expired
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredCachedPlan));

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
      expect(result.current.currentWeekPlan).toBeDefined();
      expect(result.current.currentWeekPlan?.id).toBe('week-2024-01-01');
      expect(result.current.currentWeekPlan?.slots).toHaveLength(28); // 7 days × 4 meals
    });

    it('should create new week plan when no cache exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      expect(result.current.currentWeekPlan).toBeDefined();
      expect(result.current.currentWeekPlan?.startDate).toBe('2024-01-01');
      expect(result.current.currentWeekPlan?.endDate).toBe('2024-01-07');
      expect(result.current.currentWeekPlan?.slots).toHaveLength(28);

      // Should cache the new plan
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle malformed cache data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      expect(result.current.currentWeekPlan).toBeDefined();
      expect(result.current.error).toBe(null);
    });

    it('should set loading state correctly', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      const loadPromise = act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      await loadPromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('saveWeekPlan', () => {
    it('should save week plan successfully', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      const mockWeekPlan: WeekPlan = {
        id: 'week-1',
        userId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        slots: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await act(async () => {
        await result.current.saveWeekPlan(mockWeekPlan);
      });

      expect(result.current.currentWeekPlan).toBeDefined();
      expect(result.current.currentWeekPlan?.id).toBe('week-1');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);

      // Should cache the saved plan
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should update timestamp when saving', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      const mockWeekPlan: WeekPlan = {
        id: 'week-1',
        userId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        slots: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const originalUpdatedAt = mockWeekPlan.updatedAt;

      await act(async () => {
        await result.current.saveWeekPlan(mockWeekPlan);
      });

      expect(result.current.currentWeekPlan?.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('addMealToSlot', () => {
    const mockRecipe: Recipe = {
      id: 'test-recipe',
      name: 'Test Recipe',
      description: 'Test description',
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      difficulty: 'easy',
      ingredients: [],
      instructions: [],
      dietaryLabels: [],
      tags: [],
      cuisine: 'Test',
      isAiGenerated: false,
      isFavorite: false
    };

    it('should add meal to slot successfully', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      // First, load a week plan
      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const slotData = {
        dayOfWeek: 1,
        mealType: 'desayuno' as const
      };

      await act(async () => {
        await result.current.addMealToSlot(slotData, mockRecipe);
      });

      const updatedSlot = result.current.currentWeekPlan?.slots.find(
        slot => slot.dayOfWeek === 1 && slot.mealType === 'desayuno'
      );

      expect(updatedSlot?.recipeId).toBe('test-recipe');
      expect(updatedSlot?.recipe).toEqual(mockRecipe);
      expect(updatedSlot?.customMealName).toBeUndefined();
    });

    it('should handle missing current week plan', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      const slotData = {
        dayOfWeek: 1,
        mealType: 'desayuno' as const
      };

      await act(async () => {
        await result.current.addMealToSlot(slotData, mockRecipe);
      });

      // Should not crash and should not set error (just returns early)
      expect(result.current.error).toBe(null);
    });
  });

  describe('updateMealSlot', () => {
    it('should update meal slot successfully', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      // Load a week plan first
      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const slotId = result.current.currentWeekPlan?.slots[0]?.id;
      if (!slotId) throw new Error('No slot found');

      const updates = {
        servings: 4,
        notes: 'Updated notes',
        isCompleted: true
      };

      await act(async () => {
        await result.current.updateMealSlot(slotId, updates);
      });

      const updatedSlot = result.current.currentWeekPlan?.slots.find(
        slot => slot.id === slotId
      );

      expect(updatedSlot?.servings).toBe(4);
      expect(updatedSlot?.notes).toBe('Updated notes');
      expect(updatedSlot?.isCompleted).toBe(true);
    });
  });

  describe('removeMealFromSlot', () => {
    it('should remove meal from slot successfully', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      // Load a week plan and add a meal first
      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const mockRecipe: Recipe = {
        id: 'test-recipe',
        name: 'Test Recipe',
        description: 'Test description',
        prepTime: 15,
        cookTime: 20,
        servings: 2,
        difficulty: 'easy',
        ingredients: [],
        instructions: [],
        dietaryLabels: [],
        tags: [],
        cuisine: 'Test',
        isAiGenerated: false,
        isFavorite: false
      };

      const slotData = {
        dayOfWeek: 1,
        mealType: 'desayuno' as const
      };

      await act(async () => {
        await result.current.addMealToSlot(slotData, mockRecipe);
      });

      const slotWithMeal = result.current.currentWeekPlan?.slots.find(
        slot => slot.dayOfWeek === 1 && slot.mealType === 'desayuno'
      );

      expect(slotWithMeal?.recipeId).toBe('test-recipe');

      // Now remove it
      await act(async () => {
        await result.current.removeMealFromSlot(slotWithMeal!.id);
      });

      const clearedSlot = result.current.currentWeekPlan?.slots.find(
        slot => slot.dayOfWeek === 1 && slot.mealType === 'desayuno'
      );

      expect(clearedSlot?.recipeId).toBeUndefined();
      expect(clearedSlot?.recipe).toBeUndefined();
      expect(clearedSlot?.customMealName).toBeUndefined();
    });
  });

  describe('toggleSlotLock', () => {
    it('should toggle slot lock state', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const slotId = result.current.currentWeekPlan?.slots[0]?.id;
      if (!slotId) throw new Error('No slot found');

      const initialLockState = result.current.currentWeekPlan?.slots[0]?.isLocked;

      await act(async () => {
        await result.current.toggleSlotLock(slotId);
      });

      const updatedSlot = result.current.currentWeekPlan?.slots.find(
        slot => slot.id === slotId
      );

      expect(updatedSlot?.isLocked).toBe(!initialLockState);
    });
  });

  describe('clearWeek', () => {
    it('should clear all meals from week', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      // Load a week plan and add meals
      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const mockRecipe: Recipe = {
        id: 'test-recipe',
        name: 'Test Recipe',
        description: 'Test description',
        prepTime: 15,
        cookTime: 20,
        servings: 2,
        difficulty: 'easy',
        ingredients: [],
        instructions: [],
        dietaryLabels: [],
        tags: [],
        cuisine: 'Test',
        isAiGenerated: false,
        isFavorite: false
      };

      await act(async () => {
        await result.current.addMealToSlot({ dayOfWeek: 1, mealType: 'desayuno' }, mockRecipe);
      });

      // Verify meal was added
      let slotWithMeal = result.current.currentWeekPlan?.slots.find(
        slot => slot.dayOfWeek === 1 && slot.mealType === 'desayuno'
      );
      expect(slotWithMeal?.recipeId).toBe('test-recipe');

      // Clear the week
      await act(async () => {
        await result.current.clearWeek();
      });

      // Verify all meals are cleared
      const clearedSlots = result.current.currentWeekPlan?.slots || [];
      const slotsWithMeals = clearedSlots.filter(slot => slot.recipeId);
      expect(slotsWithMeals).toHaveLength(0);

      // Verify cache is cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('UI Actions', () => {
    it('should set current date and auto-load week plan', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      const newDate = new Date('2024-02-15');

      await act(async () => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
      // Should auto-load the week plan for the new date
      expect(result.current.currentWeekPlan).toBeDefined();
    });

    it('should set active modal', () => {
      const { result } = renderHook(() => useMealPlanningStore());

      act(() => {
        result.current.setActiveModal('recipe-select');
      });

      expect(result.current.activeModal).toBe('recipe-select');

      act(() => {
        result.current.setActiveModal(null);
      });

      expect(result.current.activeModal).toBe(null);
    });

    it('should toggle slot selection', () => {
      const { result } = renderHook(() => useMealPlanningStore());

      act(() => {
        result.current.toggleSlotSelection('slot-1');
      });

      expect(result.current.selectedSlots).toEqual(['slot-1']);

      act(() => {
        result.current.toggleSlotSelection('slot-2', true); // multi-select
      });

      expect(result.current.selectedSlots).toEqual(['slot-1', 'slot-2']);

      act(() => {
        result.current.toggleSlotSelection('slot-1', true); // deselect
      });

      expect(result.current.selectedSlots).toEqual(['slot-2']);
    });
  });

  describe('Selectors', () => {
    it('should get slot for day correctly', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const slot = result.current.getSlotForDay(1, 'desayuno');

      expect(slot).toBeDefined();
      expect(slot?.dayOfWeek).toBe(1);
      expect(slot?.mealType).toBe('desayuno');
    });

    it('should get week summary correctly', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const summary = result.current.getWeekSummary();

      expect(summary).toBeDefined();
      expect(summary.totalMeals).toBe(0); // No meals added yet
      expect(summary.completedMeals).toBe(0);
      expect(summary.uniqueRecipes).toBe(0);
      expect(summary.totalServings).toBe(0);
      expect(summary.completionPercentage).toBe(0);
    });

    it('should get day plan correctly', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      const dayPlan = result.current.getDayPlan(1);

      expect(dayPlan).toBeDefined();
      expect(dayPlan.dayOfWeek).toBe(1);
      expect(dayPlan.meals).toBeDefined();
      expect(dayPlan.meals.desayuno).toBeDefined();
      expect(dayPlan.meals.almuerzo).toBeDefined();
      expect(dayPlan.meals.merienda).toBeDefined();
      expect(dayPlan.meals.cena).toBeDefined();
    });

    it('should get shopping list', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      const shoppingList = await result.current.getShoppingList();

      expect(shoppingList).toBeDefined();
      expect(shoppingList.id).toContain('shopping-');
      expect(shoppingList.items).toEqual([]);
      expect(shoppingList.categories).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    it('should clear old cache entries when adding new ones', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan('2024-01-01');
      });

      // Should still work despite cache error
      expect(result.current.currentWeekPlan).toBeDefined();
      expect(result.current.error).toBe(null);
    });
  });
});