import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/pantry/expiration-alerts/route';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

describe('/api/pantry/expiration-alerts', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pantry/expiration-alerts', () => {
    it('should return expiring items', async () => {
      const mockItems = [
        { 
          id: 1, 
          name: 'Milk', 
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quantity: 1 
        },
        { 
          id: 2, 
          name: 'Bread', 
          expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          quantity: 1 
        },
        { 
          id: 3, 
          name: 'Pasta', 
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 1 
        }
      ];

      mockUsePantryStore.mockReturnValue({
        items: mockItems,
        getExpiringItems: jest.fn().mockReturnValue(mockItems.slice(0, 2)),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expiringItems).toHaveLength(2);
      expect(data.expiringItems[0].name).toBe('Milk');
      expect(data.expiringItems[1].name).toBe('Bread');
    });

    it('should return empty array when no items are expiring', async () => {
      mockUsePantryStore.mockReturnValue({
        items: [],
        getExpiringItems: jest.fn().mockReturnValue([]),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expiringItems).toHaveLength(0);
    });

    it('should handle custom expiration window', async () => {
      const mockItems = [
        { 
          id: 1, 
          name: 'Yogurt', 
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 1 
        }
      ];

      mockUsePantryStore.mockReturnValue({
        items: mockItems,
        getExpiringItems: jest.fn().mockReturnValue(mockItems),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts?days=7',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expiringItems).toHaveLength(1);
      expect(data.expiringItems[0].name).toBe('Yogurt');
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to get expiration alerts'
      });
    });
  });

  describe('POST /api/pantry/expiration-alerts', () => {
    it('should create expiration alert', async () => {
      const mockAddAlert = jest.fn();
      const mockAlert = {
        id: 1,
        itemId: 1,
        alertDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        message: 'Milk expires tomorrow',
        read: false
      };

      mockUsePantryStore.mockReturnValue({
        addExpirationAlert: mockAddAlert.mockReturnValue(mockAlert),
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/expiration-alerts',
        body: {
          itemId: 1,
          alertDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'Milk expires tomorrow'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        message: 'Expiration alert created successfully',
        alert: mockAlert
      });

      expect(mockAddAlert).toHaveBeenCalledWith({
        itemId: 1,
        alertDate: expect.any(String),
        message: 'Milk expires tomorrow'
      });
    });

    it('should handle missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/expiration-alerts',
        body: {
          itemId: 1
          // Missing alertDate and message
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'itemId, alertDate, and message are required'
      });
    });

    it('should handle invalid item ID', async () => {
      mockUsePantryStore.mockReturnValue({
        getItemById: jest.fn().mockReturnValue(null),
        addExpirationAlert: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/expiration-alerts',
        body: {
          itemId: 999,
          alertDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'Invalid item alert'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Item with ID 999 not found'
      });
    });

    it('should handle invalid alert date', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/expiration-alerts',
        body: {
          itemId: 1,
          alertDate: 'invalid-date',
          message: 'Test message'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid alert date format'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/expiration-alerts',
        body: {
          itemId: 1,
          alertDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'Test message'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to create expiration alert'
      });
    });
  });
});