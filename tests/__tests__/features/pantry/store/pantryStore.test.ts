import { act, renderHook, waitFor } from '@testing-library/react';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { createMockPantryItem } from '../../../utils/test-utils';
import type { PantryItem, AddPantryItemForm, UpdatePantryItemForm, PantryStats, PantryLocation, ExpirationAlert, PantryFilter, BatchPantryOperation, PantryAnalysis } from '@/features/pantry/types';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('pantryStore', () => {
  beforeEach(() => {
    // Reset store and mocks
    const { result } = renderHook(() => usePantryStore());
    act(() => {
      result.current.reset();
    });
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Item Management', () => {
    it('fetches items successfully', async () => {
      const mockItems = [
        createMockPantryItem({ id: '1', ingredient_name: 'Apples' }),
        createMockPantryItem({ id: '2', ingredient_name: 'Bananas' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockItems }),
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].ingredient_name).toBe('Apples');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch items error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch' }),
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.error).toBe('Failed to fetch pantry items');
      expect(result.current.isLoading).toBe(false);
    });

    it('adds a new item', async () => {
      const newItem = createMockPantryItem({ id: 'new-1', ingredient_name: 'Carrots' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => newItem,
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        const item = await result.current.addItem({
          ingredient_name: 'Carrots',
          quantity: 5,
          unit: 'pieces',
        });
        expect(item.id).toBe('new-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].ingredient_name).toBe('Carrots');
      expect(result.current.isDirty).toBe(true);
    });

    it('updates an existing item', async () => {
      const existingItem = createMockPantryItem({ id: '1', ingredient_name: 'Apples', quantity: 5 });
      const updatedItem = { ...existingItem, quantity: 10 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedItem,
      });

      const { result } = renderHook(() => usePantryStore());
      
      // Set initial item
      act(() => {
        result.current.items = [existingItem];
      });

      await act(async () => {
        await result.current.updateItem({ id: '1', quantity: 10 });
      });

      expect(result.current.items[0].quantity).toBe(10);
      expect(result.current.isDirty).toBe(true);
    });

    it('deletes an item', async () => {
      const item = createMockPantryItem({ id: '1', ingredient_name: 'Apples' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => usePantryStore());
      
      // Set initial item
      act(() => {
        result.current.items = [item];
      });

      await act(async () => {
        await result.current.deleteItem('1');
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.isDirty).toBe(true);
    });

    it('deletes multiple items', async () => {
      const items = [
        createMockPantryItem({ id: '1', ingredient_name: 'Apples' }),
        createMockPantryItem({ id: '2', ingredient_name: 'Bananas' }),
        createMockPantryItem({ id: '3', ingredient_name: 'Carrots' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => usePantryStore());
      
      // Set initial items
      act(() => {
        result.current.items = items;
      });

      await act(async () => {
        await result.current.deleteItems(['1', '2']);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('3');
    });
  });

  describe('Filtering and Searching', () => {
    it('filters items by search term', () => {
      const items = [
        createMockPantryItem({ id: '1', ingredient_name: 'Apples' }),
        createMockPantryItem({ id: '2', ingredient_name: 'Bananas' }),
        createMockPantryItem({ id: '3', ingredient_name: 'Carrots' }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
      });

      const searchResults = result.current.searchItems('app');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].ingredient_name).toBe('Apples');
    });

    it('filters items by category', () => {
      const items = [
        createMockPantryItem({ id: '1', category: 'Produce' }),
        createMockPantryItem({ id: '2', category: 'Dairy' }),
        createMockPantryItem({ id: '3', category: 'Produce' }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
        result.current.setFilter({ category: 'Produce' });
      });

      const filtered = result.current.getFilteredItems();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => item.category === 'Produce')).toBe(true);
    });

    it('filters items by expiration', () => {
      const now = new Date();
      const items = [
        createMockPantryItem({ 
          id: '1', 
          expiration_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days
        }),
        createMockPantryItem({ 
          id: '2', 
          expiration_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days
        }),
        createMockPantryItem({ 
          id: '3', 
          expiration_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days
        }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
        result.current.setFilter({ expiring_within_days: 7 });
      });

      const filtered = result.current.getFilteredItems();
      expect(filtered).toHaveLength(2); // Items expiring in 2 and 5 days
    });

    it('sorts items correctly', () => {
      const items = [
        createMockPantryItem({ id: '1', ingredient_name: 'Carrots', quantity: 5 }),
        createMockPantryItem({ id: '2', ingredient_name: 'Apples', quantity: 10 }),
        createMockPantryItem({ id: '3', ingredient_name: 'Bananas', quantity: 3 }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
        result.current.setFilter({ sort_by: 'name', sort_order: 'asc' });
      });

      const sorted = result.current.getFilteredItems();
      expect(sorted[0].ingredient_name).toBe('Apples');
      expect(sorted[1].ingredient_name).toBe('Bananas');
      expect(sorted[2].ingredient_name).toBe('Carrots');
    });

    it('clears filters', () => {
      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.setFilter({ 
          category: 'Produce', 
          search_term: 'apple',
          expiring_within_days: 7 
        });
        result.current.clearFilter();
      });

      expect(result.current.filter.category).toBeUndefined();
      expect(result.current.filter.search_term).toBeUndefined();
      expect(result.current.filter.expiring_within_days).toBeUndefined();
    });
  });

  describe('Selection Management', () => {
    it('selects and deselects items', () => {
      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.selectItem('1');
      });

      expect(result.current.selectedItems).toContain('1');

      act(() => {
        result.current.selectItem('1'); // Toggle off
      });

      expect(result.current.selectedItems).not.toContain('1');
    });

    it('selects all items', () => {
      const items = [
        createMockPantryItem({ id: '1' }),
        createMockPantryItem({ id: '2' }),
        createMockPantryItem({ id: '3' }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
        result.current.selectAll();
      });

      expect(result.current.selectedItems).toHaveLength(3);
      expect(result.current.selectedItems).toEqual(['1', '2', '3']);
    });

    it('clears selection', () => {
      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.selectedItems = ['1', '2', '3'];
        result.current.clearSelection();
      });

      expect(result.current.selectedItems).toHaveLength(0);
    });
  });

  describe('Expiration Management', () => {
    it('gets expiring items', () => {
      const now = new Date();
      const items = [
        createMockPantryItem({ 
          id: '1', 
          expiration_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days
        }),
        createMockPantryItem({ 
          id: '2', 
          expiration_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days
        }),
        createMockPantryItem({ 
          id: '3', 
          expiration_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Expired
        }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
      });

      const expiringIn7Days = result.current.getExpiringItems(7);
      expect(expiringIn7Days).toHaveLength(1);
      expect(expiringIn7Days[0].id).toBe('1');
    });

    it('gets expired items', () => {
      const now = new Date();
      const items = [
        createMockPantryItem({ 
          id: '1', 
          expiration_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // Future
        }),
        createMockPantryItem({ 
          id: '2', 
          expiration_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Expired
        }),
        createMockPantryItem({ 
          id: '3', 
          expiration_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // Expired
        }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
      });

      const expired = result.current.getExpiredItems();
      expect(expired).toHaveLength(2);
      expect(expired.map(i => i.id)).toEqual(['2', '3']);
    });

    it('checks expirations and creates alerts', () => {
      const now = new Date();
      const items = [
        createMockPantryItem({ 
          id: '1',
          ingredient_name: 'Milk',
          expiration_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day - urgent
        }),
        createMockPantryItem({ 
          id: '2',
          ingredient_name: 'Bread',
          expiration_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Expired
        }),
        createMockPantryItem({ 
          id: '3',
          ingredient_name: 'Cheese',
          expiration_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days - warning
        }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
        result.current.checkExpirations();
      });

      expect(result.current.expirationAlerts).toHaveLength(3);
      
      const urgentAlert = result.current.expirationAlerts.find(a => a.pantry_item_id === '1');
      expect(urgentAlert?.alert_type).toBe('urgent');
      
      const expiredAlert = result.current.expirationAlerts.find(a => a.pantry_item_id === '2');
      expect(expiredAlert?.alert_type).toBe('expired');
      
      const warningAlert = result.current.expirationAlerts.find(a => a.pantry_item_id === '3');
      expect(warningAlert?.alert_type).toBe('warning');
    });
  });

  describe('Consumption Tracking', () => {
    it('consumes partial quantity of an item', async () => {
      const item = createMockPantryItem({ id: '1', quantity: 10 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...item, quantity: 7 }),
      });

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = [item];
      });

      await act(async () => {
        await result.current.consumeItem('1', 3);
      });

      expect(result.current.items[0].quantity).toBe(7);
    });

    it('deletes item when fully consumed', async () => {
      const item = createMockPantryItem({ id: '1', quantity: 3 });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = [item];
      });

      await act(async () => {
        await result.current.consumeItem('1', 3);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Batch Operations', () => {
    it('performs batch add operation', async () => {
      const batchResult = {
        success: true,
        processed: 2,
        failed: 0,
        errors: [],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => batchResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        const res = await result.current.batchOperation({
          operation: 'add',
          items: [
            { ingredient_name: 'Apple', quantity: 5, unit: 'pieces' },
            { ingredient_name: 'Banana', quantity: 3, unit: 'pieces' },
          ],
        });
        
        expect(res.processed).toBe(2);
        expect(res.failed).toBe(0);
      });
    });
  });

  describe('Statistics and Analysis', () => {
    it('fetches stats', async () => {
      const mockStats = {
        totalItems: 10,
        expiringItems: 3,
        expiredItems: 1,
        categories: { 'Produce': 5, 'Dairy': 5 },
        totalValue: 50.00,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(result.current.stats).toEqual(mockStats);
    });

    it('fetches analysis', async () => {
      const mockAnalysis = {
        waste_analysis: {
          expired_items_last_month: 5,
          waste_value: 25.00,
          most_wasted_categories: ['Produce'],
        },
        usage_patterns: {
          most_used_ingredients: ['Eggs', 'Milk'],
          seasonal_trends: { 'Fresh Produce': 1.2 },
          shopping_frequency: 7,
        },
        optimization_suggestions: {
          bulk_buy_recommendations: ['Rice'],
          storage_improvements: ['Use airtight containers'],
          recipe_suggestions: ['Stir fry with leftover vegetables'],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchAnalysis();
      });

      expect(result.current.analysis).toEqual(mockAnalysis);
    });
  });

  describe('Location Management', () => {
    it('fetches locations successfully', async () => {
      const mockLocations: PantryLocation[] = [
        {
          id: '1',
          name: 'Refrigerator',
          description: 'Main fridge',
          temperature_zone: 'refrigerator',
          user_id: 'user1',
        },
        {
          id: '2',
          name: 'Pantry',
          description: 'Dry goods storage',
          temperature_zone: 'pantry',
          user_id: 'user1',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ locations: mockLocations }),
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch locations error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error).toBe('Failed to fetch locations');
      expect(result.current.locations).toEqual([]);
    });

    it('adds a location', async () => {
      const newLocation = {
        name: 'Freezer',
        description: 'Frozen items storage',
        temperature_zone: 'freezer' as const,
      };

      const mockResponse = {
        id: '3',
        user_id: 'user1',
        ...newLocation,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.addLocation(newLocation);
      });

      expect(result.current.locations).toContainEqual(mockResponse);
      expect(result.current.error).toBeNull();
    });

    it('updates a location', async () => {
      const existingLocation: PantryLocation = {
        id: '1',
        name: 'Refrigerator',
        temperature_zone: 'refrigerator',
        user_id: 'user1',
      };

      const updates = {
        name: 'Main Refrigerator',
        description: 'Updated description',
      };

      const updatedLocation = { ...existingLocation, ...updates };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedLocation,
      });

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.locations = [existingLocation];
      });

      await act(async () => {
        await result.current.updateLocation('1', updates);
      });

      expect(result.current.locations[0]).toEqual(updatedLocation);
      expect(result.current.error).toBeNull();
    });

    it('deletes a location', async () => {
      const existingLocation: PantryLocation = {
        id: '1',
        name: 'Refrigerator',
        temperature_zone: 'refrigerator',
        user_id: 'user1',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.locations = [existingLocation];
      });

      await act(async () => {
        await result.current.deleteLocation('1');
      });

      expect(result.current.locations).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Expiration Alerts', () => {
    it('fetches expiration alerts', async () => {
      const mockAlerts: ExpirationAlert[] = [
        {
          id: '1',
          pantry_item_id: 'item1',
          item_name: 'Milk',
          expiration_date: new Date('2024-01-15'),
          days_until_expiration: 2,
          alert_type: 'warning',
          dismissed: false,
          created_at: new Date(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchExpirationAlerts();
      });

      expect(result.current.expirationAlerts).toEqual(mockAlerts);
    });

    it('dismisses an alert', async () => {
      const existingAlert: ExpirationAlert = {
        id: '1',
        pantry_item_id: 'item1',
        item_name: 'Milk',
        expiration_date: new Date('2024-01-15'),
        days_until_expiration: 2,
        alert_type: 'warning',
        dismissed: false,
        created_at: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.expirationAlerts = [existingAlert];
      });

      await act(async () => {
        await result.current.dismissAlert('1');
      });

      expect(result.current.expirationAlerts[0].dismissed).toBe(true);
    });
  });

  describe('Sync Operations', () => {
    it('syncs all data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ locations: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ totalItems: 0, expiringItems: 0, expiredItems: 0, categories: {} }),
        });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.syncData();
      });

      expect(fetch).toHaveBeenCalledWith('/api/pantry/items');
      expect(fetch).toHaveBeenCalledWith('/api/pantry/locations');
      expect(fetch).toHaveBeenCalledWith('/api/pantry/expiration-alerts');
      expect(fetch).toHaveBeenCalledWith('/api/pantry/stats');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles API errors with specific messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.error).toBe('Failed to fetch pantry items');
      expect(result.current.isLoading).toBe(false);
    });

    it('handles add item errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await expect(result.current.addItem({
          ingredient_name: 'Test',
          quantity: 1,
          unit: 'piece',
        })).rejects.toThrow();
      });

      expect(result.current.error).toBe('Failed to add pantry item');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Complex Filtering', () => {
    it('combines multiple filters correctly', () => {
      const items = [
        createMockPantryItem({ 
          id: '1', 
          ingredient_name: 'Milk',
          category: 'Dairy',
          location: 'Refrigerator',
          expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        }),
        createMockPantryItem({ 
          id: '2', 
          ingredient_name: 'Bread',
          category: 'Grains',
          location: 'Pantry',
          expiration_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }),
        createMockPantryItem({ 
          id: '3', 
          ingredient_name: 'Cheese',
          category: 'Dairy',
          location: 'Refrigerator',
          expiration_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        }),
      ];

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.items = items;
        result.current.setFilter({
          category: 'Dairy',
          location: 'Refrigerator',
          expiring_within_days: 7,
          search_term: 'milk',
        });
      });

      const filtered = result.current.getFilteredItems();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].ingredient_name).toBe('Milk');
    });

    it('handles sorting with null values', () => {
      const items = [
        createMockPantryItem({ 
          id: '1', 
          ingredient_name: 'Milk',
          expiration_date: new Date('2024-01-15'),
        }),
        createMockPantryItem({ 
          id: '2', 
          ingredient_name: 'Bread',
          expiration_date: undefined,
        }),
        createMockPantryItem({ 
          id: '3', 
          ingredient_name: 'Cheese',
          expiration_date: new Date('2024-01-10'),
        }),
      ];

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.items = items;
        result.current.setFilter({ sort_by: 'expiration_date', sort_order: 'asc' });
      });

      const sorted = result.current.getFilteredItems();
      expect(sorted[0].ingredient_name).toBe('Cheese');
      expect(sorted[1].ingredient_name).toBe('Milk');
      expect(sorted[2].ingredient_name).toBe('Bread'); // null dates should be last
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles empty search results', () => {
      const items = [
        createMockPantryItem({ id: '1', ingredient_name: 'Milk' }),
        createMockPantryItem({ id: '2', ingredient_name: 'Bread' }),
      ];

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.items = items;
      });

      const results = result.current.searchItems('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('handles large item sets efficiently', () => {
      const items = Array.from({ length: 1000 }, (_, i) => 
        createMockPantryItem({ 
          id: `${i}`, 
          ingredient_name: `Item ${i}`,
          category: i % 2 === 0 ? 'Produce' : 'Dairy',
        })
      );

      const { result } = renderHook(() => usePantryStore());

      act(() => {
        result.current.items = items;
        result.current.setFilter({ category: 'Produce' });
      });

      const filtered = result.current.getFilteredItems();
      expect(filtered).toHaveLength(500);
    });

    it('handles consumption of non-existent items', async () => {
      const { result } = renderHook(() => usePantryStore());

      await act(async () => {
        await result.current.consumeItem('nonexistent', 1);
      });

      // Should not throw error and should not make API calls
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('gets items by category', () => {
      const items = [
        createMockPantryItem({ id: '1', category: 'Produce' }),
        createMockPantryItem({ id: '2', category: 'Dairy' }),
        createMockPantryItem({ id: '3', category: 'Produce' }),
        createMockPantryItem({ id: '4', category: undefined }),
      ];

      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = items;
      });

      const byCategory = result.current.getItemsByCategory();
      
      expect(byCategory['Produce']).toHaveLength(2);
      expect(byCategory['Dairy']).toHaveLength(1);
      expect(byCategory['Uncategorized']).toHaveLength(1);
    });

    it('resets store state', () => {
      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.items = [createMockPantryItem()];
        result.current.selectedItems = ['1', '2'];
        result.current.filter = { category: 'Produce' };
        result.current.error = 'Some error';
        
        result.current.reset();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.selectedItems).toHaveLength(0);
      expect(result.current.filter.category).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('marks store as dirty', () => {
      const { result } = renderHook(() => usePantryStore());
      
      act(() => {
        result.current.markDirty();
      });

      expect(result.current.isDirty).toBe(true);
    });
  });
});