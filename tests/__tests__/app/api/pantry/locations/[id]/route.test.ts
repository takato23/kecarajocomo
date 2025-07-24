import { createMocks } from 'node-mocks-http';
import { GET, PUT, DELETE } from '@/app/api/pantry/locations/[id]/route';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

describe('/api/pantry/locations/[id]', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pantry/locations/[id]', () => {
    it('should return specific location', async () => {
      const mockLocation = {
        id: 1,
        name: 'Kitchen',
        description: 'Main kitchen area',
        itemCount: 5
      };

      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue(mockLocation),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations/1',
      });

      const response = await GET(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockLocation);
    });

    it('should return 404 for non-existent location', async () => {
      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue(null),
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations/999',
      });

      const response = await GET(req as any, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Location not found'
      });
    });

    it('should handle invalid location ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations/invalid',
      });

      const response = await GET(req as any, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid location ID'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations/1',
      });

      const response = await GET(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to get location'
      });
    });
  });

  describe('PUT /api/pantry/locations/[id]', () => {
    it('should update location', async () => {
      const mockUpdateLocation = jest.fn();
      const mockUpdatedLocation = {
        id: 1,
        name: 'Updated Kitchen',
        description: 'Updated description'
      };

      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue({ id: 1 }),
        updateLocation: mockUpdateLocation.mockReturnValue(mockUpdatedLocation),
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/locations/1',
        body: {
          name: 'Updated Kitchen',
          description: 'Updated description'
        },
      });

      const response = await PUT(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Location updated successfully',
        location: mockUpdatedLocation
      });

      expect(mockUpdateLocation).toHaveBeenCalledWith(1, {
        name: 'Updated Kitchen',
        description: 'Updated description'
      });
    });

    it('should handle updating non-existent location', async () => {
      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue(null),
        updateLocation: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/locations/999',
        body: {
          name: 'Updated Name'
        },
      });

      const response = await PUT(req as any, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Location not found'
      });
    });

    it('should handle invalid location ID', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/locations/invalid',
        body: {
          name: 'Updated Name'
        },
      });

      const response = await PUT(req as any, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid location ID'
      });
    });

    it('should handle empty update data', async () => {
      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue({ id: 1 }),
        updateLocation: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/locations/1',
        body: {},
      });

      const response = await PUT(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'No update data provided'
      });
    });

    it('should handle duplicate location names', async () => {
      const mockUpdateLocation = jest.fn().mockImplementation(() => {
        throw new Error('Location with this name already exists');
      });

      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue({ id: 1 }),
        updateLocation: mockUpdateLocation,
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/locations/1',
        body: {
          name: 'Kitchen'
        },
      });

      const response = await PUT(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Location with this name already exists'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/pantry/locations/1',
        body: {
          name: 'Updated Name'
        },
      });

      const response = await PUT(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to update location'
      });
    });
  });

  describe('DELETE /api/pantry/locations/[id]', () => {
    it('should delete location', async () => {
      const mockDeleteLocation = jest.fn();

      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue({ id: 1 }),
        deleteLocation: mockDeleteLocation.mockReturnValue(true),
        getItemsByLocation: jest.fn().mockReturnValue([]),
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/locations/1',
      });

      const response = await DELETE(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Location deleted successfully'
      });

      expect(mockDeleteLocation).toHaveBeenCalledWith(1);
    });

    it('should prevent deletion of location with items', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1', locationId: 1 },
        { id: 2, name: 'Item 2', locationId: 1 }
      ];

      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue({ id: 1 }),
        getItemsByLocation: jest.fn().mockReturnValue(mockItems),
        deleteLocation: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/locations/1',
      });

      const response = await DELETE(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Cannot delete location with items. Please move or remove all items first.'
      });
    });

    it('should handle deleting non-existent location', async () => {
      mockUsePantryStore.mockReturnValue({
        getLocationById: jest.fn().mockReturnValue(null),
        deleteLocation: jest.fn(),
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/locations/999',
      });

      const response = await DELETE(req as any, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Location not found'
      });
    });

    it('should handle invalid location ID', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/locations/invalid',
      });

      const response = await DELETE(req as any, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid location ID'
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/pantry/locations/1',
      });

      const response = await DELETE(req as any, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to delete location'
      });
    });
  });
});