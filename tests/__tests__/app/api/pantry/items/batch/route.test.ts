import { NextRequest } from 'next/server';
import { POST, DELETE } from '@/app/api/pantry/items/batch/route';
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

describe('/api/pantry/items/batch', () => {
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

  describe('POST', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'add',
          items: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('returns 400 for invalid operation type', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'invalid-operation',
          items: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid batch operation');
    });

    describe('Batch Add', () => {
      it('adds multiple items successfully', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Mock ingredient lookup
        const mockIngredientQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn()
            .mockResolvedValueOnce({ data: null, error: null }) // First item - no existing ingredient
            .mockResolvedValueOnce({ data: { id: 'ing-2' }, error: null }), // Second item - existing ingredient
        };

        // Mock ingredient creation
        const mockIngredientCreateQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-ing-1' },
            error: null,
          }),
        };

        // Mock pantry item creation
        const mockPantryQuery = {
          insert: jest.fn()
            .mockResolvedValueOnce({ error: null }) // First item
            .mockResolvedValueOnce({ error: null }), // Second item
        };

        let ingredientCallCount = 0;
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'ingredients') {
            // Return lookup query for first two calls, create query for third
            if (ingredientCallCount < 2) {
              ingredientCallCount++;
              return mockIngredientQuery;
            } else {
              return mockIngredientCreateQuery;
            }
          }
          if (table === 'pantry_items') return mockPantryQuery;
          return null;
        });

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'add',
            items: [
              {
                ingredient_name: 'New Item',
                quantity: 5,
                unit: 'pieces',
                category: 'Produce',
              },
              {
                ingredient_name: 'Existing Item',
                quantity: 2,
                unit: 'kg',
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(2);
        expect(data.data.failed).toBe(0);
        expect(data.data.errors).toHaveLength(0);
        expect(data.message).toContain('Processed: 2, Failed: 0');
      });

      it('handles validation errors for missing fields', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'add',
            items: [
              {
                ingredient_name: 'Valid Item',
                quantity: 5,
                unit: 'pieces',
              },
              {
                // Missing required fields
                ingredient_name: 'Invalid Item',
              },
            ],
          }),
        });

        // Mock for valid item
        const mockIngredientQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'ing-1' }, error: null }),
        };

        const mockPantryQuery = {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'ingredients') return mockIngredientQuery;
          if (table === 'pantry_items') return mockPantryQuery;
          return null;
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.data.processed).toBe(1);
        expect(data.data.failed).toBe(1);
        expect(data.data.errors).toHaveLength(1);
        expect(data.data.errors[0].error).toBe('Missing required fields');
      });

      it('applies global fields from operation', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const mockIngredientQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'ing-1' }, error: null }),
        };

        const mockPantryQuery = {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'ingredients') return mockIngredientQuery;
          if (table === 'pantry_items') return mockPantryQuery;
          return null;
        });

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'add',
            location: 'Refrigerator', // Global location
            expiration_date: '2024-12-31', // Global expiration
            items: [
              {
                ingredient_name: 'Item 1',
                quantity: 5,
                unit: 'pieces',
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        // Check that global fields were applied
        expect(mockPantryQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            location: 'Refrigerator',
            expiration_date: '2024-12-31',
          })
        );
      });
    });

    describe('Batch Update', () => {
      it('updates multiple items successfully', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'update',
            items: [
              {
                id: 'item-1',
                quantity: 10,
              },
              {
                id: 'item-2',
                location: 'Pantry',
                notes: 'Updated notes',
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(2);
        expect(data.data.failed).toBe(0);
      });

      it('handles missing item IDs in update', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'update',
            items: [
              {
                // Missing ID
                quantity: 10,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.data.processed).toBe(0);
        expect(data.data.failed).toBe(1);
        expect(data.data.errors[0].error).toBe('Missing item ID');
      });
    });

    describe('Batch Delete', () => {
      it('deletes multiple items successfully', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const mockQuery = {
          delete: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'delete',
            items: [
              { id: 'item-1' },
              { id: 'item-2' },
              { id: 'item-3' },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(3);
        expect(data.data.failed).toBe(0);
        expect(mockQuery.in).toHaveBeenCalledWith('id', ['item-1', 'item-2', 'item-3']);
      });

      it('handles empty item list for delete', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'delete',
            items: [],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.data.errors[0].error).toBe('No valid item IDs provided');
      });
    });

    describe('Batch Move', () => {
      it('moves multiple items to new location', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'move',
            location: 'Freezer',
            items: [
              { id: 'item-1' },
              { id: 'item-2' },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(2);
        expect(data.data.failed).toBe(0);
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            location: 'Freezer',
            updated_at: expect.any(String),
          })
        );
      });

      it('handles missing location for move operation', async () => {
        const mockUser = { id: 'test-user-id' };
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
          method: 'POST',
          body: JSON.stringify({
            operation: 'move',
            // Missing location
            items: [
              { id: 'item-1' },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.data.errors[0].error).toBe('Target location not specified');
      });
    });
  });

  describe('DELETE', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
        method: 'DELETE',
        body: JSON.stringify({
          item_ids: ['item-1'],
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('deletes multiple items successfully', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
        method: 'DELETE',
        body: JSON.stringify({
          item_ids: ['item-1', 'item-2', 'item-3'],
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Successfully deleted 3 items');
      expect(mockQuery.in).toHaveBeenCalledWith('id', ['item-1', 'item-2', 'item-3']);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('validates item_ids parameter', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
        method: 'DELETE',
        body: JSON.stringify({
          item_ids: [], // Empty array
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid item IDs');
    });

    it('handles database errors during deletion', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Database error') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/items/batch', {
        method: 'DELETE',
        body: JSON.stringify({
          item_ids: ['item-1'],
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to delete pantry items');
    });
  });
});