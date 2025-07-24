import { createMocks } from 'node-mocks-http';
import { authMiddleware } from '@/features/auth/middleware/authMiddleware';

// Mock the auth service
jest.mock('@/features/auth/services/authService', () => ({
  authService: {
    validateSession: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

describe('authMiddleware', () => {
  const mockAuthService = require('@/features/auth/services/authService').authService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access with valid token', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockAuthService.validateSession.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(mockAuthService.validateSession).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should deny access without authorization header', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Authorization header is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should deny access with invalid token format', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'InvalidFormat',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid token format',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should deny access with invalid token', async () => {
    mockAuthService.validateSession.mockResolvedValue(false);

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(mockAuthService.validateSession).toHaveBeenCalledWith('invalid-token');
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid or expired token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should deny access when user cannot be retrieved', async () => {
    mockAuthService.validateSession.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'User not found',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle auth service errors', async () => {
    mockAuthService.validateSession.mockRejectedValue(new Error('Auth service error'));

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Authentication failed',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle missing Bearer prefix', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'token-without-bearer',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid token format',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle empty token after Bearer', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer ',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid token format',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle case insensitive Bearer prefix', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockAuthService.validateSession.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'bearer valid-token',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(mockAuthService.validateSession).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should attach user to request object', async () => {
    const mockUser = { 
      id: '1', 
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
    };
    
    mockAuthService.validateSession.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(req.user).toEqual(mockUser);
    expect(req.user.id).toBe('1');
    expect(req.user.email).toBe('test@example.com');
    expect(req.user.firstName).toBe('John');
    expect(req.user.lastName).toBe('Doe');
    expect(req.user.role).toBe('user');
  });

  it('should not modify request for OPTIONS method', async () => {
    const { req, res } = createMocks({
      method: 'OPTIONS',
      url: '/api/protected',
    });

    const mockNext = jest.fn();

    await authMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockAuthService.validateSession).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should handle concurrent middleware calls', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockAuthService.validateSession.mockResolvedValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { req: req1, res: res1 } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: { authorization: 'Bearer token1' },
    });

    const { req: req2, res: res2 } = createMocks({
      method: 'GET',
      url: '/api/protected',
      headers: { authorization: 'Bearer token2' },
    });

    const mockNext1 = jest.fn();
    const mockNext2 = jest.fn();

    await Promise.all([
      authMiddleware(req1, res1, mockNext1),
      authMiddleware(req2, res2, mockNext2),
    ]);

    expect(mockNext1).toHaveBeenCalledTimes(1);
    expect(mockNext2).toHaveBeenCalledTimes(1);
    expect(req1.user).toEqual(mockUser);
    expect(req2.user).toEqual(mockUser);
  });
});