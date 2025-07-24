import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/pantry/items/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockCreateRouteHandlerClient = createRouteHandlerClient as jest.MockedFunction<
  typeof createRouteHandlerClient
>;

describe('/api/pantry/items', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockCreateRouteHandlerClient.mockReturnValue(mockSupabase);
  });

  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('fetches pantry items successfully', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockItems = [
        {
          id: '1',
          user_id: 'test-user-id',
          ingredient_id: 'ing-1',
          ingredient_name: 'Apples',
          quantity: 5,
          unit: 'pieces',
          expiration_date: '2024-12-31',
          location: 'Refrigerator',
          category: 'Produce',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          ingredients: {
            name: 'Apples',
            category: 'Produce',
          },
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockItems,
          error: null,
          count: 1,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].ingredient_name).toBe('Apples');
      expect(data.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 1,
        pages: 1,
      });
    });

    it('applies filters correctly', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/pantry/items?category=Produce&location=Refrigerator&expiring_within_days=7&search_term=apple'
      );
      const response = await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith('ingredients.category', 'Produce');
      expect(mockQuery.eq).toHaveBeenCalledWith('location', 'Refrigerator');
      expect(mockQuery.lte).toHaveBeenCalled();
      expect(mockQuery.or).toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
          count: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch pantry items');
    });

    it('handles pagination correctly', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 100,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/pantry/items?page=2&limit=20'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(mockQuery.range).toHaveBeenCalledWith(20, 39); // offset: 20, limit: 20
      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        pages: 5,
      });
    });
  });

  describe('POST', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_name: 'Apples',
          quantity: 5,
          unit: 'pieces',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('validates required fields', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_name: 'Apples',
          // Missing quantity and unit
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
    });

    it('creates a new pantry item with existing ingredient', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockIngredient = { id: 'ing-1' };
      const mockNewItem = {
        id: 'item-1',
        user_id: 'test-user-id',
        ingredient_id: 'ing-1',
        ingredient_name: 'Apples',
        quantity: 5,
        unit: 'pieces',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock ingredient lookup
      const mockIngredientQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockIngredient,
          error: null,
        }),
      };

      // Mock pantry item creation
      const mockPantryQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNewItem,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ingredients') return mockIngredientQuery;
        if (table === 'pantry_items') return mockPantryQuery;
        return null;
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_name: 'Apples',
          quantity: 5,
          unit: 'pieces',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pantry item created successfully');
      expect(data.data.ingredient_name).toBe('Apples');
      expect(data.data.quantity).toBe(5);
    });

    it('creates a new ingredient if it does not exist', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockNewIngredient = { id: 'new-ing-1' };
      const mockNewItem = {
        id: 'item-1',
        user_id: 'test-user-id',
        ingredient_id: 'new-ing-1',
        ingredient_name: 'New Fruit',
        quantity: 3,
        unit: 'kg',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock ingredient lookup (not found)
      const mockIngredientLookupQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Mock ingredient creation
      const mockIngredientCreateQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNewIngredient,
          error: null,
        }),
      };

      // Mock pantry item creation
      const mockPantryQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNewItem,
          error: null,
        }),
      };

      let ingredientCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ingredients') {
          ingredientCallCount++;
          if (ingredientCallCount === 1) return mockIngredientLookupQuery;
          if (ingredientCallCount === 2) return mockIngredientCreateQuery;
        }
        if (table === 'pantry_items') return mockPantryQuery;
        return null;
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_name: 'New Fruit',
          quantity: 3,
          unit: 'kg',
          category: 'Produce',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockIngredientCreateQuery.insert).toHaveBeenCalledWith({
        name: 'New Fruit',
        category: 'Produce',
        default_unit: 'kg',
        common_units: ['kg'],
      });
    });

    it('handles database errors during item creation', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock ingredient lookup
      const mockIngredientQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'ing-1' },
          error: null,
        }),
      };

      // Mock pantry item creation with error
      const mockPantryQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ingredients') return mockIngredientQuery;
        if (table === 'pantry_items') return mockPantryQuery;
        return null;
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_name: 'Apples',
          quantity: 5,
          unit: 'pieces',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to create pantry item');
    });
  });
});