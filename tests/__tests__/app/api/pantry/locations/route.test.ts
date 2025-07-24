import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/pantry/locations/route';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

describe('/api/pantry/locations', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pantry/locations', () => {
    it('should return all pantry locations', async () => {
      const mockLocations = [
        { id: 1, name: 'Kitchen', description: 'Main kitchen area' },
        { id: 2, name: 'Fridge', description: 'Refrigerator' },
        { id: 3, name: 'Pantry', description: 'Dry goods storage' }
      ];

      mockUsePantryStore.mockReturnValue({
        locations: mockLocations,
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        locations: mockLocations
      });
    });

    it('should return empty array when no locations exist', async () => {
      mockUsePantryStore.mockReturnValue({
        locations: [],
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        locations: []
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/pantry/locations',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to get pantry locations'
      });
    });
  });

  describe('POST /api/pantry/locations', () => {
    it('should create new pantry location', async () => {
      const mockAddLocation = jest.fn();
      const mockNewLocation = {
        id: 4,
        name: 'Freezer',
        description: 'Frozen goods storage'
      };

      mockUsePantryStore.mockReturnValue({
        addLocation: mockAddLocation.mockReturnValue(mockNewLocation),
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/locations',
        body: {
          name: 'Freezer',
          description: 'Frozen goods storage'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        message: 'Location created successfully',
        location: mockNewLocation
      });

      expect(mockAddLocation).toHaveBeenCalledWith({
        name: 'Freezer',
        description: 'Frozen goods storage'
      });
    });

    it('should handle missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/locations',
        body: {
          description: 'Missing name'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Location name is required'
      });
    });

    it('should handle empty location name', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/locations',
        body: {
          name: '',
          description: 'Empty name'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Location name is required'
      });
    });

    it('should handle duplicate location names', async () => {
      const mockAddLocation = jest.fn().mockImplementation(() => {
        throw new Error('Location with this name already exists');
      });

      mockUsePantryStore.mockReturnValue({
        addLocation: mockAddLocation,
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/locations',
        body: {
          name: 'Kitchen',
          description: 'Duplicate kitchen'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Location with this name already exists'
      });
    });

    it('should create location with name only', async () => {
      const mockAddLocation = jest.fn();
      const mockNewLocation = {
        id: 5,
        name: 'Basement',
        description: ''
      };

      mockUsePantryStore.mockReturnValue({
        addLocation: mockAddLocation.mockReturnValue(mockNewLocation),
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/locations',
        body: {
          name: 'Basement'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.location.name).toBe('Basement');
      expect(mockAddLocation).toHaveBeenCalledWith({
        name: 'Basement',
        description: undefined
      });
    });

    it('should handle store errors', async () => {
      mockUsePantryStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/pantry/locations',
        body: {
          name: 'Test Location'
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to create location'
      });
    });
  });
});