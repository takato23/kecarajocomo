import { createMocks } from 'node-mocks-http';
import { GET, PUT, DELETE } from '@/app/api/pantry/expiration-alerts/[id]/route';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

describe('/api/pantry/expiration-alerts/[id]', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pantry/expiration-alerts/[id]', () => {
    it('should return specific expiration alert', async () => {
      const mockAlert = {
        id: 1,
        itemId: 1,
        alertDate: new Date().toISOString(),
        message: 'Milk expires tomorrow',
        read: false
      };

      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue(mockAlert),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts/1',
      });

      const response = await GET(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAlert);
    });

    it('should return 404 for non-existent alert', async () => {
      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue(null),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts/999',
      });

      const response = await GET(req as any, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Expiration alert not found'
      });
    });

    it('should handle invalid alert ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts/invalid',
      });

      const response = await GET(req as any, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid alert ID'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/expiration-alerts/1',
      });

      const response = await GET(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to get expiration alert'
      });
    });
  });

  describe('PUT /api/pantry/expiration-alerts/[id]', () => {
    it('should update expiration alert', async () => {
      const mockUpdateAlert = jest.fn();
      const mockUpdatedAlert = {
        id: 1,
        itemId: 1,
        alertDate: new Date().toISOString(),
        message: 'Updated message',
        read: true
      };

      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue({ id: 1 }),
        updateExpirationAlert: mockUpdateAlert.mockReturnValue(mockUpdatedAlert),
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/expiration-alerts/1',
        body: {
          message: 'Updated message',
          read: true
        },
      });

      const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Expiration alert updated successfully',
        alert: mockUpdatedAlert
      });

      expect(mockUpdateAlert).toHaveBeenCalledWith(1, {
        message: 'Updated message',
        read: true
      });
    });

    it('should handle updating non-existent alert', async () => {
      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue(null),
        updateExpirationAlert: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/expiration-alerts/999',
        body: {
          message: 'Updated message'
        },
      });

      const response = await PUT(req as any, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Expiration alert not found'
      });
    });

    it('should handle invalid alert ID', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/expiration-alerts/invalid',
        body: {
          message: 'Updated message'
        },
      });

      const response = await PUT(req as any, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid alert ID'
      });
    });

    it('should handle empty update data', async () => {
      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue({ id: 1 }),
        updateExpirationAlert: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/expiration-alerts/1',
        body: {},
      });

      const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'No update data provided'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/expiration-alerts/1',
        body: {
          message: 'Updated message'
        },
      });

      const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to update expiration alert'
      });
    });
  });

  describe('DELETE /api/pantry/expiration-alerts/[id]', () => {
    it('should delete expiration alert', async () => {
      const mockDeleteAlert = jest.fn();

      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue({ id: 1 }),
        deleteExpirationAlert: mockDeleteAlert.mockReturnValue(true),
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/expiration-alerts/1',
      });

      const response = await DELETE(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Expiration alert deleted successfully'
      });

      expect(mockDeleteAlert).toHaveBeenCalledWith(1);
    });

    it('should handle deleting non-existent alert', async () => {
      mockUsePantryStore.mockReturnValue({
        getExpirationAlert: jest.fn().mockReturnValue(null),
        deleteExpirationAlert: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/expiration-alerts/999',
      });

      const response = await DELETE(req as any, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Expiration alert not found'
      });
    });

    it('should handle invalid alert ID', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/expiration-alerts/invalid',
      });

      const response = await DELETE(req as any, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid alert ID'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/expiration-alerts/1',
      });

      const response = await DELETE(req as any, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to delete expiration alert'
      });
    });
  });
});