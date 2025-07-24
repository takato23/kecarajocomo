/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePantry, usePantryUI, useFilteredPantryItems } from '@/hooks/usePantry';
import { usePantryStore } from '@/stores/pantry';
import * as database from '@/lib/pantry/database';
import * as parser from '@/lib/pantry/parser';

// Mock the database module
jest.mock('@/lib/pantry/database', () => ({
  fetchUserPantryItems: jest.fn(),
  addPantryItem: jest.fn(),
  updatePantryItem: jest.fn(),
  deletePantryItem: jest.fn(),
  addMultiplePantryItems: jest.fn(),
  getOrCreateIngredient: jest.fn(),
  subscribeToPantryChanges: jest.fn(),
}));

// Mock the parser module
jest.mock('@/lib/pantry/parser', () => ({
  parseMultipleIngredients: jest.fn(),
  categorizeIngredient: jest.fn(),
}));

// Mock the store
jest.mock('@/stores/pantry', () => ({
  usePantryStore: jest.fn(),
}));

const mockUsePantryStore = usePantryStore as jest.MockedFunction<typeof usePantryStore>;

const mockItem = {
  id: '1',
  user_id: 'user1',
  ingredient_id: 'ing1',
  ingredient: {
    id: 'ing1',
    name: 'Tomate',
    normalized_name: 'tomate',
    category: 'verduras' as const,
    common_names: ['tomate'],
    created_at: new Date(),
    updated_at: new Date(),
  },
  quantity: 5,
  unit: 'pcs',
  location: 'despensa',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockStats = {
  total_items: 1,
  categories: { verduras: 1 } as any,
  expiring_soon: 0,
  expired: 0,
  low_stock: 0,
  items_by_location: { despensa: 1 },
};

const mockStoreState = {
  items: [mockItem],
  stats: mockStats,
  isLoading: false,
  error: null,
  setItems: jest.fn(),
  addItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  setLoading: jest.fn(),
  calculateStats: jest.fn(),
  getOrCreateIngredient: jest.fn(),
  getExpiringItems: jest.fn(),
  getLowStockItems: jest.fn(),
  getItemsByCategory: jest.fn(),
  uiState: {
    view_mode: 'grid' as const,
    sort_by: 'name' as const,
    sort_order: 'asc' as const,
    search_query: '',
    show_expired: false,
    show_low_stock: false,
  },
  setUIState: jest.fn(),
  resetFilters: jest.fn(),
};

describe('usePantry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePantryStore.mockReturnValue(mockStoreState as any);
  });

  test('should fetch items on mount when userId is provided', async () => {
    const mockFetchUserPantryItems = database.fetchUserPantryItems as jest.MockedFunction<typeof database.fetchUserPantryItems>;
    mockFetchUserPantryItems.mockResolvedValue([mockItem]);

    const { result } = renderHook(() => usePantry('user1'));

    expect(result.current.isLoading).toBe(false);
    
    await waitFor(() => {
      expect(mockFetchUserPantryItems).toHaveBeenCalledWith('user1');
    });
  });

  test('should not fetch items when userId is not provided', () => {
    const mockFetchUserPantryItems = database.fetchUserPantryItems as jest.MockedFunction<typeof database.fetchUserPantryItems>;
    
    renderHook(() => usePantry());

    expect(mockFetchUserPantryItems).not.toHaveBeenCalled();
  });

  test('should add item to pantry', async () => {
    const mockAddPantryItem = database.addPantryItem as jest.MockedFunction<typeof database.addPantryItem>;
    const mockGetOrCreateIngredient = database.getOrCreateIngredient as jest.MockedFunction<typeof database.getOrCreateIngredient>;
    const mockCategorizeIngredient = parser.categorizeIngredient as jest.MockedFunction<typeof parser.categorizeIngredient>;
    
    mockCategorizeIngredient.mockReturnValue('verduras');
    mockGetOrCreateIngredient.mockResolvedValue(mockItem.ingredient!);
    mockAddPantryItem.mockResolvedValue(mockItem);

    const { result } = renderHook(() => usePantry('user1'));

    const formData = {
      ingredient_name: 'Tomate',
      quantity: 5,
      unit: 'pcs',
      location: 'despensa',
    };

    await act(async () => {
      await result.current.addItemToPantry(formData);
    });

    expect(mockCategorizeIngredient).toHaveBeenCalledWith('Tomate');
    expect(mockGetOrCreateIngredient).toHaveBeenCalledWith('Tomate', 'verduras');
    expect(mockAddPantryItem).toHaveBeenCalled();
    expect(mockStoreState.addItem).toHaveBeenCalledWith(mockItem);
  });

  test('should add multiple items from voice input', async () => {
    const mockParseMultipleIngredients = parser.parseMultipleIngredients as jest.MockedFunction<typeof parser.parseMultipleIngredients>;
    const mockGetOrCreateIngredient = database.getOrCreateIngredient as jest.MockedFunction<typeof database.getOrCreateIngredient>;
    const mockAddMultiplePantryItems = database.addMultiplePantryItems as jest.MockedFunction<typeof database.addMultiplePantryItems>;
    const mockCategorizeIngredient = parser.categorizeIngredient as jest.MockedFunction<typeof parser.categorizeIngredient>;

    const parsedItems = [
      {
        raw_text: 'tomate',
        extracted_name: 'tomate',
        normalized_name: 'tomate',
        quantity: 2,
        unit: 'pcs',
        confidence: 0.9,
        suggestions: [],
      },
    ];

    mockParseMultipleIngredients.mockReturnValue(parsedItems);
    mockCategorizeIngredient.mockReturnValue('verduras');
    mockGetOrCreateIngredient.mockResolvedValue(mockItem.ingredient!);
    mockAddMultiplePantryItems.mockResolvedValue([mockItem]);

    const { result } = renderHook(() => usePantry('user1'));

    await act(async () => {
      await result.current.addMultipleItemsToPantry(parsedItems);
    });

    expect(mockParseMultipleIngredients).not.toHaveBeenCalled(); // Not called in this function
    expect(mockAddMultiplePantryItems).toHaveBeenCalled();
    expect(mockStoreState.addItem).toHaveBeenCalledWith(mockItem);
  });

  test('should update pantry item', async () => {
    const mockUpdatePantryItem = database.updatePantryItem as jest.MockedFunction<typeof database.updatePantryItem>;
    mockUpdatePantryItem.mockResolvedValue({ ...mockItem, quantity: 10 });

    const { result } = renderHook(() => usePantry('user1'));

    await act(async () => {
      await result.current.updatePantryItem('1', { quantity: 10 });
    });

    expect(mockUpdatePantryItem).toHaveBeenCalledWith('1', { quantity: 10 });
    expect(mockStoreState.updateItem).toHaveBeenCalledWith('1', { quantity: 10 });
  });

  test('should delete pantry item', async () => {
    const mockDeletePantryItem = database.deletePantryItem as jest.MockedFunction<typeof database.deletePantryItem>;
    mockDeletePantryItem.mockResolvedValue();

    const { result } = renderHook(() => usePantry('user1'));

    await act(async () => {
      await result.current.deletePantryItem('1');
    });

    expect(mockDeletePantryItem).toHaveBeenCalledWith('1');
    expect(mockStoreState.deleteItem).toHaveBeenCalledWith('1');
  });

  test('should update quantity quickly', async () => {
    const mockUpdatePantryItem = database.updatePantryItem as jest.MockedFunction<typeof database.updatePantryItem>;
    mockUpdatePantryItem.mockResolvedValue({ ...mockItem, quantity: 6 });

    const { result } = renderHook(() => usePantry('user1'));

    await act(async () => {
      await result.current.updateQuantity('1', 6);
    });

    expect(mockUpdatePantryItem).toHaveBeenCalledWith('1', { quantity: 6 });
  });

  test('should process voice input', async () => {
    const mockParseMultipleIngredients = parser.parseMultipleIngredients as jest.MockedFunction<typeof parser.parseMultipleIngredients>;
    const mockGetOrCreateIngredient = database.getOrCreateIngredient as jest.MockedFunction<typeof database.getOrCreateIngredient>;
    const mockAddMultiplePantryItems = database.addMultiplePantryItems as jest.MockedFunction<typeof database.addMultiplePantryItems>;
    const mockCategorizeIngredient = parser.categorizeIngredient as jest.MockedFunction<typeof parser.categorizeIngredient>;

    const parsedItems = [
      {
        raw_text: 'tomate y cebolla',
        extracted_name: 'tomate',
        normalized_name: 'tomate',
        quantity: 1,
        unit: 'pcs',
        confidence: 0.9,
        suggestions: [],
      },
    ];

    mockParseMultipleIngredients.mockReturnValue(parsedItems);
    mockCategorizeIngredient.mockReturnValue('verduras');
    mockGetOrCreateIngredient.mockResolvedValue(mockItem.ingredient!);
    mockAddMultiplePantryItems.mockResolvedValue([mockItem]);

    const { result } = renderHook(() => usePantry('user1'));

    await act(async () => {
      await result.current.processVoiceInput('tomate y cebolla');
    });

    expect(mockParseMultipleIngredients).toHaveBeenCalledWith('tomate y cebolla');
    expect(mockAddMultiplePantryItems).toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    const mockAddPantryItem = database.addPantryItem as jest.MockedFunction<typeof database.addPantryItem>;
    mockAddPantryItem.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => usePantry('user1'));

    const formData = {
      ingredient_name: 'Tomate',
      quantity: 5,
      unit: 'pcs',
    };

    await expect(
      act(async () => {
        await result.current.addItemToPantry(formData);
      })
    ).rejects.toThrow('Database error');
  });

  test('should subscribe to realtime changes', () => {
    const mockSubscribeToPantryChanges = database.subscribeToPantryChanges as jest.MockedFunction<typeof database.subscribeToPantryChanges>;
    const mockUnsubscribe = jest.fn();
    mockSubscribeToPantryChanges.mockReturnValue({ unsubscribe: mockUnsubscribe } as any);

    const { unmount } = renderHook(() => usePantry('user1'));

    expect(mockSubscribeToPantryChanges).toHaveBeenCalledWith('user1', expect.any(Function));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test('should return correct data and functions', () => {
    const { result } = renderHook(() => usePantry('user1'));

    expect(result.current.items).toEqual([mockItem]);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.addItemToPantry).toBe('function');
    expect(typeof result.current.updatePantryItem).toBe('function');
    expect(typeof result.current.deletePantryItem).toBe('function');
  });
});

describe('usePantryUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePantryStore.mockReturnValue(mockStoreState as any);
  });

  test('should provide UI state and update functions', () => {
    const { result } = renderHook(() => usePantryUI());

    expect(result.current.uiState).toEqual(mockStoreState.uiState);
    expect(typeof result.current.updateFilter).toBe('function');
    expect(typeof result.current.toggleSort).toBe('function');
    expect(typeof result.current.setViewMode).toBe('function');
  });

  test('should update filter', () => {
    const { result } = renderHook(() => usePantryUI());

    act(() => {
      result.current.updateFilter('search_query', 'tomato');
    });

    expect(mockStoreState.setUIState).toHaveBeenCalledWith({ search_query: 'tomato' });
  });

  test('should toggle sort order', () => {
    const { result } = renderHook(() => usePantryUI());

    act(() => {
      result.current.toggleSort();
    });

    expect(mockStoreState.setUIState).toHaveBeenCalledWith({ sort_order: 'desc' });
  });

  test('should set view mode', () => {
    const { result } = renderHook(() => usePantryUI());

    act(() => {
      result.current.setViewMode('list');
    });

    expect(mockStoreState.setUIState).toHaveBeenCalledWith({ view_mode: 'list' });
  });

  test('should set search query', () => {
    const { result } = renderHook(() => usePantryUI());

    act(() => {
      result.current.setSearch('tomato');
    });

    expect(mockStoreState.setUIState).toHaveBeenCalledWith({ search_query: 'tomato' });
  });

  test('should toggle filter', () => {
    const { result } = renderHook(() => usePantryUI());

    act(() => {
      result.current.toggleFilter('show_expired');
    });

    expect(mockStoreState.setUIState).toHaveBeenCalledWith({ show_expired: true });
  });

  test('should reset filters', () => {
    const { result } = renderHook(() => usePantryUI());

    act(() => {
      result.current.resetFilters();
    });

    expect(mockStoreState.resetFilters).toHaveBeenCalled();
  });
});

describe('useFilteredPantryItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return filtered items based on store state', () => {
    const mockFilteredStoreState = {
      ...mockStoreState,
      items: [mockItem],
      uiState: {
        ...mockStoreState.uiState,
        search_query: '',
      },
    };

    mockUsePantryStore.mockImplementation((selector: any) => {
      return selector(mockFilteredStoreState);
    });

    const { result } = renderHook(() => useFilteredPantryItems());

    expect(result.current).toEqual([mockItem]);
  });

  test('should filter items by search query', () => {
    const mockFilteredStoreState = {
      ...mockStoreState,
      items: [mockItem],
      uiState: {
        ...mockStoreState.uiState,
        search_query: 'nonexistent',
      },
    };

    mockUsePantryStore.mockImplementation((selector: any) => {
      return selector(mockFilteredStoreState);
    });

    const { result } = renderHook(() => useFilteredPantryItems());

    expect(result.current).toEqual([]);
  });

  test('should sort items correctly', () => {
    const secondItem = {
      ...mockItem,
      id: '2',
      ingredient: {
        ...mockItem.ingredient!,
        name: 'Apio',
      },
    };

    const mockFilteredStoreState = {
      ...mockStoreState,
      items: [mockItem, secondItem],
      uiState: {
        ...mockStoreState.uiState,
        sort_by: 'name' as const,
        sort_order: 'asc' as const,
      },
    };

    mockUsePantryStore.mockImplementation((selector: any) => {
      return selector(mockFilteredStoreState);
    });

    const { result } = renderHook(() => useFilteredPantryItems());

    expect(result.current[0].ingredient?.name).toBe('Apio');
    expect(result.current[1].ingredient?.name).toBe('Tomate');
  });
});