import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/pantry/items/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
  cookies: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/pantry/items', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return pantry items for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockItems = [
        {
          id: 'item-1',
          user_id: 'user-123',
          ingredient_id: 'ing-1',
          quantity: 2,
          unit: 'kg',
          expiration_date: '2024-12-31',
          location: 'fridge',
          ingredients: {
            id: 'ing-1',
            name: 'Tomatoes',
            category: 'vegetable',
            unit: 'kg',
          },
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      };
      
      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(mockSupabase.from).toHaveBeenCalledWith('pantry_items');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };
      
      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch pantry items');
    });
  });

  describe('POST', () => {
    it('should create a new pantry item', async () => {
      const mockUser = { id: 'user-123' };
      const newItem = {
        ingredient_id: 'ing-2',
        quantity: 1,
        unit: 'L',
        expiration_date: '2024-12-31',
        location: 'pantry',
      };
      const createdItem = {
        id: 'item-2',
        user_id: 'user-123',
        ...newItem,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdItem, error: null }),
      };
      
      mockSupabase.from.mockReturnValue(mockInsert);

      const { req } = createMocks({
        method: 'POST',
        body: newItem,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdItem);
      expect(mockInsert.insert).toHaveBeenCalledWith({
        ...newItem,
        user_id: 'user-123',
      });
    });

    it('should validate required fields', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const invalidItem = {
        quantity: 1,
        // missing ingredient_id and unit
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidItem,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should handle duplicate item errors', async () => {
      const mockUser = { id: 'user-123' };
      const newItem = {
        ingredient_id: 'ing-2',
        quantity: 1,
        unit: 'L',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: '23505', message: 'Duplicate key value' } 
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockInsert);

      const { req } = createMocks({
        method: 'POST',
        body: newItem,
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Item already exists in pantry');
    });
  });
});