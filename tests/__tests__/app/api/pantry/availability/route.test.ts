import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/pantry/availability/route';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

describe('/api/pantry/availability', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pantry/availability', () => {
    it('should return availability for requested items', async () => {
      const mockPantryItems = [
        { id: 1, name: 'Chicken', quantity: 2, unit: 'lbs' },
        { id: 2, name: 'Rice', quantity: 1, unit: 'cup' },
        { id: 3, name: 'Onions', quantity: 3, unit: 'pieces' }
      ];

      mockUsePantryStore.mockReturnValue({
        items: mockPantryItems,
        getItemByName: jest.fn((name) => mockPantryItems.find(item => item.name.toLowerCase() === name.toLowerCase()))
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/availability?items=chicken,rice,tomatoes',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        availability: {
          chicken: { available: true, quantity: 2, unit: 'lbs' },
          rice: { available: true, quantity: 1, unit: 'cup' },
          tomatoes: { available: false, quantity: 0, unit: null }
        }
      });
    });

    it('should handle missing items query parameter', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/availability',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Items parameter is required'
      });
    });

    it('should handle empty items list', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/availability?items=',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Items parameter is required'
      });
    });

    it('should handle single item request', async () => {
      const mockPantryItems = [
        { id: 1, name: 'Eggs', quantity: 12, unit: 'pieces' }
      ];

      mockUsePantryStore.mockReturnValue({
        items: mockPantryItems,
        getItemByName: jest.fn((name) => mockPantryItems.find(item => item.name.toLowerCase() === name.toLowerCase()))
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/availability?items=eggs',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        availability: {
          eggs: { available: true, quantity: 12, unit: 'pieces' }
        }
      });
    });

    it('should handle case-insensitive item names', async () => {
      const mockPantryItems = [
        { id: 1, name: 'Milk', quantity: 1, unit: 'liter' }
      ];

      mockUsePantryStore.mockReturnValue({
        items: mockPantryItems,
        getItemByName: jest.fn((name) => mockPantryItems.find(item => item.name.toLowerCase() === name.toLowerCase()))
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/availability?items=MILK,milk,MiLk',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.availability.MILK.available).toBe(true);
      expect(data.availability.milk.available).toBe(true);
      expect(data.availability.MiLk.available).toBe(true);
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/availability?items=chicken',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to check item availability'
      });
    });
  });
});