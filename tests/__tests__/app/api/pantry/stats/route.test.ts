import { NextRequest } from 'next/server';
import { GET } from '@/app/api/pantry/stats/route';
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

describe('/api/pantry/stats', () => {
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

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('fetches pantry stats successfully', async () => {
      const mockUser = { id: 'test-user-id' };
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock queries
      const mockQueries = {
        totalItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            count: 25,
            error: null,
          }),
        },
        categoryData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              { category: 'Produce' },
              { category: 'Produce' },
              { category: 'Produce' },
              { category: 'Dairy' },
              { category: 'Dairy' },
              { category: null }, // Uncategorized
            ],
            error: null,
          }),
        },
        expiringItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({
            count: 5,
            error: null,
          }),
        },
        expiredItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({
            count: 2,
            error: null,
          }),
        },
        costData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockResolvedValue({
            data: [
              { cost: 10.50 },
              { cost: 15.25 },
              { cost: 8.00 },
            ],
            error: null,
          }),
        },
      };

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => {
        const queries = [
          mockQueries.totalItems,
          mockQueries.categoryData,
          mockQueries.expiringItems,
          mockQueries.expiredItems,
          mockQueries.costData,
        ];
        return queries[callIndex++];
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        totalItems: 25,
        expiringItems: 5,
        expiredItems: 2,
        categories: {
          'Produce': 3,
          'Dairy': 2,
          'Uncategorized': 1,
        },
        totalValue: 33.75,
      });

      // Verify query parameters
      expect(mockQueries.expiringItems.gte).toHaveBeenCalledWith(
        'expiration_date',
        now.toISOString()
      );
      expect(mockQueries.expiringItems.lte).toHaveBeenCalledWith(
        'expiration_date',
        oneWeekFromNow.toISOString()
      );
      expect(mockQueries.expiredItems.lt).toHaveBeenCalledWith(
        'expiration_date',
        now.toISOString()
      );
    });

    it('handles partial data when some queries fail', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock queries with some failures
      const mockQueries = {
        totalItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            count: 10,
            error: null,
          }),
        },
        categoryData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              { category: 'Produce' },
              { category: 'Dairy' },
            ],
            error: null,
          }),
        },
        expiringItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({
            count: null,
            error: new Error('Query failed'),
          }),
        },
        expiredItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({
            count: null,
            error: new Error('Query failed'),
          }),
        },
        costData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Query failed'),
          }),
        },
      };

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => {
        const queries = [
          mockQueries.totalItems,
          mockQueries.categoryData,
          mockQueries.expiringItems,
          mockQueries.expiredItems,
          mockQueries.costData,
        ];
        return queries[callIndex++];
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        totalItems: 10,
        expiringItems: 0, // Defaults to 0 on error
        expiredItems: 0, // Defaults to 0 on error
        categories: {
          'Produce': 1,
          'Dairy': 1,
        },
        totalValue: undefined, // Undefined when cost query fails
      });
    });

    it('handles error in total items count', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch pantry stats');
    });

    it('handles error in category data fetch', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // First query succeeds, second fails
      const mockQueries = {
        totalItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            count: 10,
            error: null,
          }),
        },
        categoryData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        },
      };

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => {
        const queries = [mockQueries.totalItems, mockQueries.categoryData];
        return queries[callIndex++];
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch category stats');
    });

    it('handles items without categories correctly', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock queries
      const mockQueries = {
        totalItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            count: 5,
            error: null,
          }),
        },
        categoryData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              { category: null },
              { category: null },
              { category: 'Produce' },
              { category: '' }, // Empty string should also be uncategorized
              { category: 'Produce' },
            ],
            error: null,
          }),
        },
        expiringItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        },
        expiredItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        },
        costData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
      };

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => {
        const queries = [
          mockQueries.totalItems,
          mockQueries.categoryData,
          mockQueries.expiringItems,
          mockQueries.expiredItems,
          mockQueries.costData,
        ];
        return queries[callIndex++];
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toEqual({
        'Uncategorized': 3, // null and empty string items
        'Produce': 2,
      });
    });

    it('calculates total value correctly', async () => {
      const mockUser = { id: 'test-user-id' };
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock queries
      const mockQueries = {
        totalItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            count: 5,
            error: null,
          }),
        },
        categoryData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
        expiringItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        },
        expiredItems: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        },
        costData: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockResolvedValue({
            data: [
              { cost: 10.99 },
              { cost: 5.50 },
              { cost: 0 }, // Should include zero values
              { cost: 20.01 },
            ],
            error: null,
          }),
        },
      };

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => {
        const queries = [
          mockQueries.totalItems,
          mockQueries.categoryData,
          mockQueries.expiringItems,
          mockQueries.expiredItems,
          mockQueries.costData,
        ];
        return queries[callIndex++];
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalValue).toBe(36.50);
    });
  });
});