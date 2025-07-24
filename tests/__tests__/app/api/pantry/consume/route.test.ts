import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/pantry/consume/route';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

describe('/api/pantry/consume', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pantry/consume', () => {
    it('should consume items successfully', async () => {
      const mockUpdateItem = jest.fn();
      const mockItem = { id: 1, name: 'Chicken', quantity: 5, unit: 'lbs' };

      mockUsePantryStore.mockReturnValue({
        items: [mockItem],
        getItemById: jest.fn().mockReturnValue(mockItem),
        updateItem: mockUpdateItem,
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: [
            { id: 1, quantityUsed: 2 }
          ]
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Items consumed successfully',
        consumedItems: [
          { id: 1, name: 'Chicken', quantityUsed: 2, remainingQuantity: 3 }
        ]
      });

      expect(mockUpdateItem).toHaveBeenCalledWith(1, { quantity: 3 });
    });

    it('should handle consuming multiple items', async () => {
      const mockUpdateItem = jest.fn();
      const mockItems = [
        { id: 1, name: 'Chicken', quantity: 5, unit: 'lbs' },
        { id: 2, name: 'Rice', quantity: 3, unit: 'cups' }
      ];

      mockUsePantryStore.mockReturnValue({
        items: mockItems,
        getItemById: jest.fn((id) => mockItems.find(item => item.id === id)),
        updateItem: mockUpdateItem,
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: [
            { id: 1, quantityUsed: 2 },
            { id: 2, quantityUsed: 1 }
          ]
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consumedItems).toHaveLength(2);
      expect(mockUpdateItem).toHaveBeenCalledTimes(2);
    });

    it('should handle consuming all quantity of an item', async () => {
      const mockUpdateItem = jest.fn();
      const mockRemoveItem = jest.fn();
      const mockItem = { id: 1, name: 'Bread', quantity: 1, unit: 'loaf' };

      mockUsePantryStore.mockReturnValue({
        items: [mockItem],
        getItemById: jest.fn().mockReturnValue(mockItem),
        updateItem: mockUpdateItem,
        removeItem: mockRemoveItem,
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: [
            { id: 1, quantityUsed: 1 }
          ]
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consumedItems[0].remainingQuantity).toBe(0);
      expect(mockRemoveItem).toHaveBeenCalledWith(1);
    });

    it('should handle invalid item ID', async () => {
      mockUsePantryStore.mockReturnValue({
        items: [],
        getItemById: jest.fn().mockReturnValue(null),
        updateItem: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: [
            { id: 999, quantityUsed: 2 }
          ]
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Item with ID 999 not found'
      });
    });

    it('should handle consuming more than available quantity', async () => {
      const mockItem = { id: 1, name: 'Milk', quantity: 1, unit: 'liter' };

      mockUsePantryStore.mockReturnValue({
        items: [mockItem],
        getItemById: jest.fn().mockReturnValue(mockItem),
        updateItem: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: [
            { id: 1, quantityUsed: 5 }
          ]
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Cannot consume 5 of Milk, only 1 available'
      });
    });

    it('should handle missing request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Items array is required'
      });
    });

    it('should handle empty items array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: []
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Items array is required'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/consume',
        body: {
          items: [{ id: 1, quantityUsed: 1 }]
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to consume items'
      });
    });
  });
});