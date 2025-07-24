import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/pantry/items/[id]/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockCreateRouteHandlerClient = createRouteHandlerClient as jest.MockedFunction<
  typeof createRouteHandlerClient
>;

describe('/api/pantry/items/[id]', () => {
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

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('fetches a specific pantry item successfully', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockItem = {
        id: 'test-id',
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
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockItem,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('test-id');
      expect(data.data.ingredient_name).toBe('Apples');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('returns 404 when item is not found', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/non-existent');
      const response = await GET(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Pantry item not found');
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
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch pantry item');
    });
  });

  describe('PUT', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 10 }),
      });

      const response = await PUT(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('updates a pantry item successfully', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockUpdatedItem = {
        id: 'test-id',
        user_id: 'test-user-id',
        ingredient_id: 'ing-1',
        ingredient_name: 'Apples',
        quantity: 10,
        unit: 'pieces',
        expiration_date: '2024-12-31',
        location: 'Pantry',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedItem,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'PUT',
        body: JSON.stringify({
          quantity: 10,
          location: 'Pantry',
        }),
      });

      const response = await PUT(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pantry item updated successfully');
      expect(data.data.quantity).toBe(10);
      expect(data.data.location).toBe('Pantry');
      
      // Check that update was called with correct data
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 10,
          location: 'Pantry',
          updated_at: expect.any(String),
        })
      );
    });

    it('ignores id field in update body', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockUpdatedItem = {
        id: 'test-id',
        user_id: 'test-user-id',
        ingredient_id: 'ing-1',
        ingredient_name: 'Apples',
        quantity: 10,
        unit: 'pieces',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedItem,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'different-id', // This should be ignored
          quantity: 10,
        }),
      });

      const response = await PUT(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Check that update was called without the id field
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ id: 'different-id' })
      );
    });

    it('returns 404 when item is not found', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 10 }),
      });

      const response = await PUT(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Pantry item not found');
    });

    it('handles partial updates correctly', async () => {
      const mockUser = { id: 'test-user-id' };
      const mockUpdatedItem = {
        id: 'test-id',
        user_id: 'test-user-id',
        ingredient_id: 'ing-1',
        ingredient_name: 'Apples',
        quantity: 5,
        unit: 'pieces',
        notes: 'Updated notes',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedItem,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'PUT',
        body: JSON.stringify({
          notes: 'Updated notes',
          // Only updating notes, other fields should remain unchanged
        }),
      });

      const response = await PUT(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Check that update was called only with provided fields
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Updated notes',
          updated_at: expect.any(String),
        })
      );
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          quantity: expect.anything(),
          unit: expect.anything(),
        })
      );
    });
  });

  describe('DELETE', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('deletes a pantry item successfully', async () => {
      const mockUser = { id: 'test-user-id' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pantry item deleted successfully');
      expect(data.data).toBeNull();
      
      // Check that delete was called with correct parameters
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('handles database errors during deletion', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/test-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to delete pantry item');
    });
  });
});