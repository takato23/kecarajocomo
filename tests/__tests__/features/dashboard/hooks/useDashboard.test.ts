import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

// Mock the dashboard store
jest.mock('@/features/dashboard/store/dashboardStore', () => ({
  useDashboardStore: jest.fn(),
}));

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

// Mock the recipes store
jest.mock('@/features/recipes/store/recipeStore', () => ({
  useRecipeStore: jest.fn(),
}));

describe('useDashboard', () => {
  const mockUseDashboardStore = require('@/features/dashboard/store/dashboardStore').useDashboardStore;
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;
  const mockUseRecipeStore = require('@/features/recipes/store/recipeStore').useRecipeStore;

  const mockDashboardStore = {
    stats: {
      totalRecipes: 15,
      totalPantryItems: 25,
      upcomingMeals: 3,
      wasteReduction: 12,
    },
    insights: [
      { type: 'warning', message: 'You have 3 items expiring soon' },
      { type: 'success', message: 'You saved $15 this week' },
    ],
    isLoading: false,
    error: null,
    fetchDashboardData: jest.fn(),
    refreshData: jest.fn(),
  };

  const mockPantryStore = {
    items: [
      { id: 1, name: 'Milk', expiryDate: '2024-01-15', quantity: 1 },
      { id: 2, name: 'Bread', expiryDate: '2024-01-20', quantity: 2 },
    ],
    stats: {
      totalItems: 25,
      expiringItems: 3,
      lowStockItems: 2,
    },
    getExpiringItems: jest.fn(),
    fetchStats: jest.fn(),
  };

  const mockRecipeStore = {
    recipes: [
      { id: 1, name: 'Chicken Salad', category: 'lunch' },
      { id: 2, name: 'Pasta', category: 'dinner' },
    ],
    recentRecipes: [
      { id: 1, name: 'Chicken Salad', category: 'lunch' },
    ],
    fetchRecipes: jest.fn(),
    getRecentRecipes: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardStore.mockReturnValue(mockDashboardStore);
    mockUsePantryStore.mockReturnValue(mockPantryStore);
    mockUseRecipeStore.mockReturnValue(mockRecipeStore);
  });

  it('should return dashboard data', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.stats).toEqual(mockDashboardStore.stats);
    expect(result.current.insights).toEqual(mockDashboardStore.insights);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return pantry data', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.pantryStats).toEqual(mockPantryStore.stats);
    expect(result.current.pantryItems).toEqual(mockPantryStore.items);
  });

  it('should return recipe data', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.recipes).toEqual(mockRecipeStore.recipes);
    expect(result.current.recentRecipes).toEqual(mockRecipeStore.recentRecipes);
  });

  it('should fetch dashboard data on mount', async () => {
    renderHook(() => useDashboard());

    await waitFor(() => {
      expect(mockDashboardStore.fetchDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  it('should fetch pantry stats on mount', async () => {
    renderHook(() => useDashboard());

    await waitFor(() => {
      expect(mockPantryStore.fetchStats).toHaveBeenCalledTimes(1);
    });
  });

  it('should fetch recipes on mount', async () => {
    renderHook(() => useDashboard());

    await waitFor(() => {
      expect(mockRecipeStore.fetchRecipes).toHaveBeenCalledTimes(1);
    });
  });

  it('should return refresh function', () => {
    const { result } = renderHook(() => useDashboard());

    expect(typeof result.current.refreshData).toBe('function');
  });

  it('should call refresh on all stores when refreshData is called', async () => {
    const { result } = renderHook(() => useDashboard());

    await result.current.refreshData();

    expect(mockDashboardStore.refreshData).toHaveBeenCalledTimes(1);
    expect(mockPantryStore.fetchStats).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
    expect(mockRecipeStore.fetchRecipes).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  it('should return expiring items', () => {
    const mockExpiringItems = [
      { id: 1, name: 'Milk', expiryDate: '2024-01-15', quantity: 1 },
    ];

    mockPantryStore.getExpiringItems.mockReturnValue(mockExpiringItems);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.expiringItems).toEqual(mockExpiringItems);
    expect(mockPantryStore.getExpiringItems).toHaveBeenCalledWith(7); // 7 days by default
  });

  it('should return loading state when any store is loading', () => {
    mockUseDashboardStore.mockReturnValue({
      ...mockDashboardStore,
      isLoading: true,
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return error state when any store has error', () => {
    mockUseDashboardStore.mockReturnValue({
      ...mockDashboardStore,
      error: 'Dashboard error',
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.error).toBe('Dashboard error');
  });

  it('should handle multiple errors', () => {
    mockUseDashboardStore.mockReturnValue({
      ...mockDashboardStore,
      error: 'Dashboard error',
    });

    mockUsePantryStore.mockReturnValue({
      ...mockPantryStore,
      error: 'Pantry error',
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.error).toBe('Dashboard error'); // First error wins
  });

  it('should return computed dashboard summary', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.summary).toEqual({
      totalRecipes: 15,
      totalPantryItems: 25,
      upcomingMeals: 3,
      wasteReduction: 12,
      expiringItems: 3,
      lowStockItems: 2,
    });
  });

  it('should return dashboard actions', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.actions).toEqual({
      refreshData: expect.any(Function),
      fetchDashboardData: mockDashboardStore.fetchDashboardData,
      getExpiringItems: mockPantryStore.getExpiringItems,
    });
  });

  it('should handle custom expiring items time window', () => {
    const mockExpiringItems = [
      { id: 1, name: 'Milk', expiryDate: '2024-01-15', quantity: 1 },
    ];

    mockPantryStore.getExpiringItems.mockReturnValue(mockExpiringItems);

    const { result } = renderHook(() => useDashboard({ expiringDays: 3 }));

    expect(mockPantryStore.getExpiringItems).toHaveBeenCalledWith(3);
    expect(result.current.expiringItems).toEqual(mockExpiringItems);
  });

  it('should handle auto-refresh', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useDashboard({ autoRefresh: true, refreshInterval: 5000 }));

    // Fast-forward time by 5 seconds
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(mockDashboardStore.refreshData).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('should clean up auto-refresh on unmount', () => {
    jest.useFakeTimers();

    const { unmount } = renderHook(() => useDashboard({ autoRefresh: true, refreshInterval: 5000 }));

    unmount();

    // Fast-forward time by 5 seconds
    jest.advanceTimersByTime(5000);

    // Should not have called refresh after unmount
    expect(mockDashboardStore.refreshData).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should return filtered insights by type', () => {
    const { result } = renderHook(() => useDashboard());

    const warningInsights = result.current.getInsightsByType('warning');
    const successInsights = result.current.getInsightsByType('success');

    expect(warningInsights).toEqual([
      { type: 'warning', message: 'You have 3 items expiring soon' },
    ]);

    expect(successInsights).toEqual([
      { type: 'success', message: 'You saved $15 this week' },
    ]);
  });

  it('should return empty array for unknown insight type', () => {
    const { result } = renderHook(() => useDashboard());

    const unknownInsights = result.current.getInsightsByType('unknown');

    expect(unknownInsights).toEqual([]);
  });

  it('should handle missing stats gracefully', () => {
    mockUseDashboardStore.mockReturnValue({
      ...mockDashboardStore,
      stats: null,
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.stats).toBeNull();
    expect(result.current.summary).toEqual({
      totalRecipes: 0,
      totalPantryItems: 0,
      upcomingMeals: 0,
      wasteReduction: 0,
      expiringItems: 3,
      lowStockItems: 2,
    });
  });
});