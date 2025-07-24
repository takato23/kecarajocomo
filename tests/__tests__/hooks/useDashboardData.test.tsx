/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';

// Mock the auth store
jest.mock('@/stores/auth');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useDashboardData', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
  };

  const mockStats = {
    recipesCount: 5,
    recipesThisWeek: 2,
    favoriteRecipesCount: 3,
    mealsPlanned: 10,
    mealsThisWeek: 7,
    completedMealsToday: 2,
    pantryItems: 15,
    pantryExpiringCount: 3,
    pantryLowStockCount: 2,
    shoppingItems: 8,
    shoppingCompletedToday: 1,
    totalEstimatedCost: 45.67,
    recentRecipes: [],
    todaysMeals: [],
    upcomingMeals: [],
    expiringItems: [],
    recentActivity: [],
    weeklyMealPlan: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth store mock
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isInitialized: true,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      signOut: jest.fn(),
    });

    // Setup default Supabase mocks
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockLte = jest.fn().mockReturnThis();
    const mockGt = jest.fn().mockReturnThis();
    const mockNot = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockIn = jest.fn().mockReturnThis();

    const mockFromResponse = {
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      gt: mockGt,
      not: mockNot,
      order: mockOrder,
      limit: mockLimit,
      in: mockIn,
    };

    mockSupabase.from.mockReturnValue(mockFromResponse as any);

    // Mock successful responses
    mockSelect.mockResolvedValue({ data: [], count: 0 });
    mockEq.mockResolvedValue({ data: [], count: 0 });
    mockGte.mockResolvedValue({ data: [], count: 0 });
    mockLte.mockResolvedValue({ data: [], count: 0 });
    mockGt.mockResolvedValue({ data: [], count: 0 });
    mockNot.mockResolvedValue({ data: [], count: 0 });
    mockOrder.mockResolvedValue({ data: [], count: 0 });
    mockLimit.mockResolvedValue({ data: [], count: 0 });
    mockIn.mockResolvedValue({ data: [], count: 0 });

    // Mock real-time subscriptions
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    };
    mockSupabase.channel.mockReturnValue(mockChannel as any);
  });

  it('should initialize with default stats when no user', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isLoading: false,
      isInitialized: true,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stats.recipesCount).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it('should fetch dashboard data when user is present', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    expect(mockSupabase.from).toHaveBeenCalledWith('meal_plans');
    expect(mockSupabase.from).toHaveBeenCalledWith('pantry_items');
    expect(mockSupabase.from).toHaveBeenCalledWith('shopping_lists');
  });

  it('should handle fetch errors with retry logic', async () => {
    const mockError = new Error('Network error');
    mockSupabase.from.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.error?.retry).toBeDefined();
  });

  it('should retry failed requests with exponential backoff', async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Temporary error');
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      };
    });

    const { result } = renderHook(() => useDashboardData());

    // Trigger retry
    await act(async () => {
      if (result.current.error?.retry) {
        result.current.error.retry();
      }
    });

    // Wait for retry to complete
    await waitFor(() => {
      expect(result.current.retryCount).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('should refresh data when refreshData is called', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockSupabase.from.mock.calls.length;

    // Call refreshData
    await act(async () => {
      result.current.refreshData();
    });

    await waitFor(() => {
      expect(mockSupabase.from.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    expect(result.current.retryCount).toBe(0); // Should reset retry count
  });

  it('should set up real-time subscriptions', () => {
    renderHook(() => useDashboardData());

    expect(mockSupabase.channel).toHaveBeenCalledWith('dashboard-recipes');
    expect(mockSupabase.channel).toHaveBeenCalledWith('dashboard-meal-plans');
    expect(mockSupabase.channel).toHaveBeenCalledWith('dashboard-pantry');
  });

  it('should calculate stats correctly from fetched data', async () => {
    // Mock successful data responses
    const mockRecipesData = Array.from({ length: 5 }, (_, i) => ({
      id: `recipe-${i}`,
      name: `Recipe ${i}`,
      created_at: new Date().toISOString(),
    }));

    const mockMealsData = Array.from({ length: 3 }, (_, i) => ({
      id: `meal-${i}`,
      date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      recipe_id: `recipe-${i}`,
    }));

    const mockPantryData = Array.from({ length: 10 }, (_, i) => ({
      id: `pantry-${i}`,
      name: `Item ${i}`,
      quantity: i + 1,
      unit: 'pcs',
    }));

    // Configure mocks to return the test data
    mockSupabase.from.mockImplementation((table: string) => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };

      if (table === 'recipes') {
        mockChain.eq.mockResolvedValue({ data: mockRecipesData, count: 5 });
      } else if (table === 'meal_plans') {
        mockChain.eq.mockResolvedValue({ data: mockMealsData, count: 3 });
      } else if (table === 'pantry_items') {
        mockChain.gt.mockResolvedValue({ data: mockPantryData, count: 10 });
      } else {
        mockChain.eq.mockResolvedValue({ data: [], count: 0 });
      }

      return mockChain as any;
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify that stats are calculated from the mocked data
    expect(result.current.stats.recipesCount).toBeGreaterThan(0);
  });

  it('should handle shopping list calculations correctly', async () => {
    const mockShoppingLists = [
      { id: 'list-1', name: 'Grocery List', is_active: true },
    ];

    const mockShoppingItems = [
      { id: 'item-1', name: 'Milk', quantity: 2, price: 3.50, purchased: false },
      { id: 'item-2', name: 'Bread', quantity: 1, price: 2.00, purchased: false },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };

      if (table === 'shopping_lists') {
        mockChain.eq.mockResolvedValue({ data: mockShoppingLists, count: 1 });
      } else if (table === 'shopping_list_items') {
        if (mockChain.select.mock.calls.some(call => call[0]?.includes('price'))) {
          mockChain.in.mockResolvedValue({ data: mockShoppingItems });
        } else {
          mockChain.in.mockResolvedValue({ data: mockShoppingItems, count: 2 });
        }
      } else {
        mockChain.eq.mockResolvedValue({ data: [], count: 0 });
      }

      return mockChain as any;
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should calculate total estimated cost correctly: (2 * 3.50) + (1 * 2.00) = 9.00
    expect(result.current.stats.totalEstimatedCost).toBe(9.00);
    expect(result.current.stats.shoppingItems).toBe(2);
  });

  it('should generate recent activity correctly', async () => {
    const mockRecentRecipes = [
      {
        id: 'recipe-1',
        name: 'Test Recipe',
        created_at: new Date().toISOString(),
      },
    ];

    const mockTodaysMeals = [
      {
        id: 'meal-1',
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        recipe_id: 'recipe-1',
      },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };

      if (table === 'recipes' && mockChain.limit) {
        mockChain.limit.mockResolvedValue({ data: mockRecentRecipes, count: 1 });
      } else if (table === 'meal_plans') {
        mockChain.order.mockResolvedValue({ data: mockTodaysMeals, count: 1 });
      } else {
        mockChain.eq.mockResolvedValue({ data: [], count: 0 });
      }

      return mockChain as any;
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.recentActivity.length).toBeGreaterThan(0);
    expect(result.current.stats.recentActivity[0].action).toBe('Created recipe');
    expect(result.current.stats.recentActivity[0].item).toBe('Test Recipe');
  });
});