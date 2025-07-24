import { createMocks } from 'node-mocks-http';
import { GET, POST, DELETE } from '@/features/auth/api/session/route';

// Mock the auth service
jest.mock('@/features/auth/services/authService', () => ({
  getCurrentUser: jest.fn(),
  refreshSession: jest.fn(),
  signOut: jest.fn(),
  validateSession: jest.fn(),
}));

describe('/api/auth/session', () => {
  const mockAuthService = require('@/features/auth/services/authService');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/session', () => {
    it('should return current user session', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        preferences: {
          dietary: ['vegetarian'],
          cuisine: ['Italian']
        }
      };

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/auth/session',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        user: mockUser,
        authenticated: true
      });

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith('valid-token');
    });

    it('should return unauthenticated for invalid token', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/auth/session',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        user: null,
        authenticated: false
      });
    });

    it('should handle missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/auth/session',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        user: null,
        authenticated: false
      });
    });

    it('should handle auth service errors', async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth service error'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/auth/session',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to get session'
      });
    });
  });

  describe('POST /api/auth/session', () => {
    it('should refresh session successfully', async () => {
      const mockRefreshedSession = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      mockAuthService.refreshSession.mockResolvedValue(mockRefreshedSession);

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/auth/session',
        body: {
          refreshToken: 'valid-refresh-token'
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Session refreshed successfully',
        session: mockRefreshedSession
      });

      expect(mockAuthService.refreshSession).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should handle invalid refresh token', async () => {
      mockAuthService.refreshSession.mockRejectedValue(new Error('Invalid refresh token'));

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/auth/session',
        body: {
          refreshToken: 'invalid-refresh-token'
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Invalid refresh token'
      });
    });

    it('should handle missing refresh token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/auth/session',
        body: {}
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Refresh token is required'
      });
    });

    it('should handle auth service errors', async () => {
      mockAuthService.refreshSession.mockRejectedValue(new Error('Service error'));

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/auth/session',
        body: {
          refreshToken: 'valid-refresh-token'
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to refresh session'
      });
    });
  });

  describe('DELETE /api/auth/session', () => {
    it('should sign out successfully', async () => {
      mockAuthService.signOut.mockResolvedValue(true);

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/auth/session',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Signed out successfully'
      });

      expect(mockAuthService.signOut).toHaveBeenCalledWith('valid-token');
    });

    it('should handle missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/auth/session',
      });

      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authorization token is required'
      });
    });

    it('should handle invalid token', async () => {
      mockAuthService.signOut.mockRejectedValue(new Error('Invalid token'));

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/auth/session',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Invalid token'
      });
    });

    it('should handle auth service errors', async () => {
      mockAuthService.signOut.mockRejectedValue(new Error('Service error'));

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/auth/session',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      const response = await DELETE(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to sign out'
      });
    });
  });
});