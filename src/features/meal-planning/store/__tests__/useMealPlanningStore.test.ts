import { act, renderHook } from '@testing-library/react';
import { useMealPlanningStore } from '../useMealPlanningStore';
import { MealPlanService } from '@/lib/supabase/meal-plans';
import { supabase } from '@/lib/supabase/client';
import { format, startOfWeek, addDays } from 'date-fns';
import type { WeekPlan, MealSlot, Recipe, UserPreferences, MealType } from '../../types';

// Mock dependencies
jest.mock('@/lib/supabase/meal-plans');
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    removeChannel: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useMealPlanningStore', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockStartDate = '2024-01-15';
  const mockEndDate = '2024-01-21';
  
  const mockWeekPlan: WeekPlan = {
    id: 'week-2024-01-15',
    userId: mockUser.id,
    startDate: mockStartDate,
    endDate: mockEndDate,
    slots: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRecipe: Recipe = {
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'A test recipe',
    image: 'https://example.com/image.jpg',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { id: '1', name: 'Ingredient 1', amount: 100, unit: 'g', category: 'produce' },
    ],
    instructions: ['Step 1', 'Step 2'],
    nutrition: { calories: 250, protein: 20, carbs: 30, fat: 10 },
    dietaryLabels: ['vegetarian'],
    cuisine: 'Test Cuisine',
    tags: ['test'],
    rating: 4.5,
    isAiGenerated: false,
    isFavorite: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset store state
    const { setState } = useMealPlanningStore;
    setState({
      currentWeekPlan: null,
      isLoading: false,
      error: null,
      selectedSlots: [],
      activeModal: null,
      currentDate: new Date('2024-01-15'),
    });

    // Setup default auth mock
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('loadWeekPlan', () => {
    it('should load week plan from cache if available', async () => {
      const cachedPlan = {
        data: mockWeekPlan,
        timestamp: Date.now(),
      };
      localStorageMock.setItem(
        `meal-plan-cache-${mockStartDate}`,
        JSON.stringify(cachedPlan)
      );

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan(mockStartDate);
      });

      expect(result.current.currentWeekPlan).toEqual(mockWeekPlan);
      expect(result.current.isLoading).toBe(false);
      expect(MealPlanService.getWeekPlan).not.toHaveBeenCalled();
    });

    it('should load week plan from database when cache is expired', async () => {
      const expiredCachedPlan = {
        data: mockWeekPlan,
        timestamp: Date.now() - (1000 * 60 * 60 * 2), // 2 hours ago
      };
      localStorageMock.setItem(
        `meal-plan-cache-${mockStartDate}`,
        JSON.stringify(expiredCachedPlan)
      );

      (MealPlanService.getWeekPlan as jest.Mock).mockResolvedValue({
        data: mockWeekPlan,
        error: null,
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan(mockStartDate);
      });

      expect(MealPlanService.getWeekPlan).toHaveBeenCalledWith(
        mockUser.id,
        mockStartDate,
        mockEndDate
      );
      expect(result.current.currentWeekPlan).toEqual(mockWeekPlan);
    });

    it('should create empty week plan when none exists', async () => {
      (MealPlanService.getWeekPlan as jest.Mock).mockResolvedValue({
        data: { slots: [] },
        error: null,
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan(mockStartDate);
      });

      expect(result.current.currentWeekPlan).toBeTruthy();
      expect(result.current.currentWeekPlan?.slots).toHaveLength(28); // 7 days * 4 meals
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle authentication errors', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan(mockStartDate);
      });

      expect(result.current.error).toBe('Usuario no autenticado');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database error';
      (MealPlanService.getWeekPlan as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.loadWeekPlan(mockStartDate);
      });

      expect(result.current.error).toBe('Failed to load week plan');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('saveWeekPlan', () => {
    beforeEach(() => {
      useMealPlanningStore.setState({ currentWeekPlan: mockWeekPlan });
    });

    it('should save week plan to database', async () => {
      (MealPlanService.saveWeekPlan as jest.Mock).mockResolvedValue({
        data: mockWeekPlan,
        error: null,
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.saveWeekPlan(mockWeekPlan);
      });

      expect(MealPlanService.saveWeekPlan).toHaveBeenCalledWith(
        mockUser.id,
        mockStartDate,
        mockEndDate,
        mockWeekPlan
      );
      expect(result.current.currentWeekPlan?.updatedAt).toBeTruthy();
    });

    it('should update cache after save', async () => {
      (MealPlanService.saveWeekPlan as jest.Mock).mockResolvedValue({
        data: mockWeekPlan,
        error: null,
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.saveWeekPlan(mockWeekPlan);
      });

      const cached = localStorageMock.getItem(`meal-plan-cache-${mockStartDate}`);
      expect(cached).toBeTruthy();
      
      const parsedCache = JSON.parse(cached!);
      expect(parsedCache.data.id).toBe(mockWeekPlan.id);
    });

    it('should handle save errors', async () => {
      const errorMessage = 'Save failed';
      (MealPlanService.saveWeekPlan as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.saveWeekPlan(mockWeekPlan);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('addMealToSlot', () => {
    const mockSlot: MealSlot = {
      id: 'slot-1',
      dayOfWeek: 1,
      mealType: 'almuerzo' as MealType,
      date: '2024-01-15',
      servings: 2,
      isLocked: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      const weekPlanWithSlots = {
        ...mockWeekPlan,
        slots: [mockSlot],
      };
      useMealPlanningStore.setState({ currentWeekPlan: weekPlanWithSlots });
    });

    it('should add recipe to slot', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.addMealToSlot(
          { dayOfWeek: 1, mealType: 'almuerzo' as MealType },
          mockRecipe
        );
      });

      const updatedSlot = result.current.currentWeekPlan?.slots[0];
      expect(updatedSlot?.recipeId).toBe(mockRecipe.id);
      expect(updatedSlot?.recipe).toEqual(mockRecipe);
    });

    it('should clear custom meal name when adding recipe', async () => {
      const slotWithCustomMeal = {
        ...mockSlot,
        customMealName: 'Custom Meal',
      };
      
      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: [slotWithCustomMeal],
        },
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.addMealToSlot(
          { dayOfWeek: 1, mealType: 'almuerzo' as MealType },
          mockRecipe
        );
      });

      const updatedSlot = result.current.currentWeekPlan?.slots[0];
      expect(updatedSlot?.customMealName).toBeUndefined();
    });

    it('should not update if week plan is not loaded', async () => {
      useMealPlanningStore.setState({ currentWeekPlan: null });
      
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.addMealToSlot(
          { dayOfWeek: 1, mealType: 'almuerzo' as MealType },
          mockRecipe
        );
      });

      expect(result.current.currentWeekPlan).toBeNull();
    });
  });

  describe('removeMealFromSlot', () => {
    const slotWithRecipe: MealSlot = {
      id: 'slot-1',
      dayOfWeek: 1,
      mealType: 'almuerzo' as MealType,
      date: '2024-01-15',
      servings: 2,
      recipeId: mockRecipe.id,
      recipe: mockRecipe,
      isLocked: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: [slotWithRecipe],
        },
      });
    });

    it('should remove recipe from slot', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.removeMealFromSlot('slot-1');
      });

      const updatedSlot = result.current.currentWeekPlan?.slots[0];
      expect(updatedSlot?.recipeId).toBeUndefined();
      expect(updatedSlot?.recipe).toBeUndefined();
    });

    it('should clear custom meal name', async () => {
      const slotWithCustomMeal = {
        ...slotWithRecipe,
        customMealName: 'Custom Meal',
      };
      
      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: [slotWithCustomMeal],
        },
      });

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.removeMealFromSlot('slot-1');
      });

      const updatedSlot = result.current.currentWeekPlan?.slots[0];
      expect(updatedSlot?.customMealName).toBeUndefined();
    });
  });

  describe('toggleSlotLock', () => {
    const unlocked: MealSlot = {
      id: 'slot-1',
      dayOfWeek: 1,
      mealType: 'almuerzo' as MealType,
      date: '2024-01-15',
      servings: 2,
      isLocked: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: [unlocked],
        },
      });
    });

    it('should toggle lock state', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.toggleSlotLock('slot-1');
      });

      expect(result.current.currentWeekPlan?.slots[0].isLocked).toBe(true);

      await act(async () => {
        await result.current.toggleSlotLock('slot-1');
      });

      expect(result.current.currentWeekPlan?.slots[0].isLocked).toBe(false);
    });
  });

  describe('clearWeek', () => {
    beforeEach(() => {
      const slotsWithRecipes = Array.from({ length: 7 }, (_, day) => ({
        id: `slot-${day}`,
        dayOfWeek: day,
        mealType: 'almuerzo' as MealType,
        date: format(addDays(new Date(mockStartDate), day), 'yyyy-MM-dd'),
        servings: 2,
        recipeId: mockRecipe.id,
        recipe: mockRecipe,
        isLocked: false,
        isCompleted: day < 3, // Some completed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: slotsWithRecipes,
        },
      });
    });

    it('should clear all meals from week', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.clearWeek();
      });

      const slots = result.current.currentWeekPlan?.slots || [];
      expect(slots.every(slot => !slot.recipeId)).toBe(true);
      expect(slots.every(slot => !slot.recipe)).toBe(true);
      expect(slots.every(slot => !slot.isCompleted)).toBe(true);
    });

    it('should clear cache for the week', async () => {
      localStorageMock.setItem(
        `meal-plan-cache-${mockStartDate}`,
        JSON.stringify({ data: mockWeekPlan, timestamp: Date.now() })
      );

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.clearWeek();
      });

      expect(localStorageMock.getItem(`meal-plan-cache-${mockStartDate}`)).toBeNull();
    });
  });

  describe('getWeekSummary', () => {
    it('should calculate week summary correctly', () => {
      const slotsWithMeals = [
        {
          id: 'slot-1',
          dayOfWeek: 1,
          mealType: 'almuerzo' as MealType,
          date: '2024-01-15',
          servings: 2,
          recipeId: 'recipe-1',
          recipe: { ...mockRecipe, id: 'recipe-1' },
          isLocked: false,
          isCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'slot-2',
          dayOfWeek: 2,
          mealType: 'cena' as MealType,
          date: '2024-01-16',
          servings: 4,
          recipeId: 'recipe-2',
          recipe: { ...mockRecipe, id: 'recipe-2', nutrition: { calories: 300, protein: 25, carbs: 35, fat: 12 } },
          isLocked: false,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'slot-3',
          dayOfWeek: 3,
          mealType: 'almuerzo' as MealType,
          date: '2024-01-17',
          servings: 2,
          isLocked: false,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: slotsWithMeals,
        },
      });

      const { result } = renderHook(() => useMealPlanningStore());
      const summary = result.current.getWeekSummary();

      expect(summary.totalMeals).toBe(2);
      expect(summary.completedMeals).toBe(1);
      expect(summary.uniqueRecipes).toBe(2);
      expect(summary.totalServings).toBe(6);
      expect(summary.completionPercentage).toBe(7); // 2/28 * 100
      expect(summary.nutritionAverage?.calories).toBe(550); // (250*2 + 300*4) / 2
      expect(summary.nutritionAverage?.protein).toBe(55); // (20*2 + 25*4) / 2
    });

    it('should handle empty week plan', () => {
      useMealPlanningStore.setState({ currentWeekPlan: null });

      const { result } = renderHook(() => useMealPlanningStore());
      const summary = result.current.getWeekSummary();

      expect(summary.totalMeals).toBe(0);
      expect(summary.completedMeals).toBe(0);
      expect(summary.uniqueRecipes).toBe(0);
      expect(summary.totalServings).toBe(0);
      expect(summary.completionPercentage).toBe(0);
      expect(summary.nutritionAverage).toBeUndefined();
    });
  });

  describe('exportWeekPlanAsCSV', () => {
    beforeEach(() => {
      const slots = [
        {
          id: 'slot-1',
          dayOfWeek: 1, // Monday
          mealType: 'almuerzo' as MealType,
          date: '2024-01-15',
          servings: 2,
          recipeId: mockRecipe.id,
          recipe: mockRecipe,
          isLocked: false,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots,
        },
      });
    });

    it('should export week plan as CSV', () => {
      const { result } = renderHook(() => useMealPlanningStore());
      const csv = result.current.exportWeekPlanAsCSV();

      expect(csv).toContain('Day,Meal Type,Recipe Name,Servings,Prep Time,Cook Time');
      expect(csv).toContain('Lunes,Almuerzo,Test Recipe,2,15,30');
    });

    it('should handle slots without recipes', () => {
      const emptySlot = {
        id: 'slot-2',
        dayOfWeek: 2,
        mealType: 'cena' as MealType,
        date: '2024-01-16',
        servings: 2,
        isLocked: false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useMealPlanningStore.setState({
        currentWeekPlan: {
          ...mockWeekPlan,
          slots: [emptySlot],
        },
      });

      const { result } = renderHook(() => useMealPlanningStore());
      const csv = result.current.exportWeekPlanAsCSV();

      expect(csv).toBe('Day,Meal Type,Recipe Name,Servings,Prep Time,Cook Time');
    });
  });

  describe('offline support', () => {
    it('should queue actions when offline', async () => {
      const { result } = renderHook(() => useMealPlanningStore());

      act(() => {
        result.current.setOnlineStatus(false);
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should sync offline changes when coming online', async () => {
      const mockAction = jest.fn();
      
      const { result } = renderHook(() => useMealPlanningStore());

      // Add action to offline queue
      act(() => {
        useMealPlanningStore.setState({
          offlineQueue: [mockAction],
          isOnline: false,
        });
      });

      // Come back online
      await act(async () => {
        result.current.setOnlineStatus(true);
      });

      expect(mockAction).toHaveBeenCalled();
      expect(result.current.offlineQueue).toHaveLength(0);
    });
  });

  describe('real-time sync', () => {
    it('should setup real-time subscription', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.setupRealtimeSync();
      });

      expect(supabase.channel).toHaveBeenCalledWith(`meal-plans:${mockUser.id}`);
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should cleanup real-time subscription', async () => {
      const mockChannel = { unsubscribe: jest.fn() };
      
      const { result } = renderHook(() => useMealPlanningStore());

      await act(async () => {
        await result.current.cleanupRealtimeSync();
      });

      expect(result.current.realtimeStatus).toBe('disconnected');
    });
  });
});