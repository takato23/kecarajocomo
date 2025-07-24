import { authService } from '@/features/auth/services/authService';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      update: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
    })),
  },
}));

describe('AuthService', () => {
  const mockSupabase = require('@/lib/supabase').supabase;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a new user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockAuthResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockAuthResponse);

      const result = await authService.signUp(mockUserData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      });

      expect(result).toEqual({
        user: mockAuthResponse.data.user,
        session: mockAuthResponse.data.session,
      });
    });

    it('should handle sign up errors', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockAuthResponse = {
        data: null,
        error: { message: 'Email already registered' },
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockAuthResponse);

      await expect(authService.signUp(mockUserData)).rejects.toThrow('Email already registered');
    });

    it('should validate required fields', async () => {
      const mockUserData = {
        email: '',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(authService.signUp(mockUserData)).rejects.toThrow('Email is required');
    });

    it('should validate password strength', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(authService.signUp(mockUserData)).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockAuthResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);

      const result = await authService.signIn(mockCredentials);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        user: mockAuthResponse.data.user,
        session: mockAuthResponse.data.session,
      });
    });

    it('should handle sign in errors', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockAuthResponse = {
        data: null,
        error: { message: 'Invalid credentials' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);

      await expect(authService.signIn(mockCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should validate required credentials', async () => {
      const mockCredentials = {
        email: '',
        password: 'password123',
      };

      await expect(authService.signIn(mockCredentials)).rejects.toThrow('Email is required');
    });
  });

  describe('signOut', () => {
    it('should sign out a user successfully', async () => {
      const mockAuthResponse = {
        error: null,
      };

      mockSupabase.auth.signOut.mockResolvedValue(mockAuthResponse);

      const result = await authService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should handle sign out errors', async () => {
      const mockAuthResponse = {
        error: { message: 'Sign out failed' },
      };

      mockSupabase.auth.signOut.mockResolvedValue(mockAuthResponse);

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockAuthResponse = {
        data: { user: mockUser },
        error: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue(mockAuthResponse);

      const result = await authService.getCurrentUser();

      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is authenticated', async () => {
      const mockAuthResponse = {
        data: { user: null },
        error: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue(mockAuthResponse);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle get user errors', async () => {
      const mockAuthResponse = {
        data: null,
        error: { message: 'Failed to get user' },
      };

      mockSupabase.auth.getUser.mockResolvedValue(mockAuthResponse);

      await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get user');
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockRefreshToken = 'refresh_token_123';
      const mockAuthResponse = {
        data: {
          session: { access_token: 'new_token_456' },
        },
        error: null,
      };

      mockSupabase.auth.refreshSession.mockResolvedValue(mockAuthResponse);

      const result = await authService.refreshSession(mockRefreshToken);

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: mockRefreshToken,
      });
      expect(result).toEqual(mockAuthResponse.data.session);
    });

    it('should handle refresh session errors', async () => {
      const mockRefreshToken = 'invalid_refresh_token';
      const mockAuthResponse = {
        data: null,
        error: { message: 'Invalid refresh token' },
      };

      mockSupabase.auth.refreshSession.mockResolvedValue(mockAuthResponse);

      await expect(authService.refreshSession(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUserId = '1';
      const mockProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '123-456-7890',
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: mockUserId, ...mockProfileData }],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await authService.updateUserProfile(mockUserId, mockProfileData);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(mockProfileData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', mockUserId);
      expect(result).toEqual({ id: mockUserId, ...mockProfileData });
    });

    it('should handle update profile errors', async () => {
      const mockUserId = '1';
      const mockProfileData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await expect(authService.updateUserProfile(mockUserId, mockProfileData)).rejects.toThrow('Update failed');
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding successfully', async () => {
      const mockUserId = '1';
      const mockOnboardingData = {
        dietaryPreferences: ['vegetarian'],
        nutritionGoals: { calories: 2000 },
        completed: true,
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: mockUserId, onboardingCompleted: true }],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await authService.completeOnboarding(mockUserId, mockOnboardingData);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        dietaryPreferences: ['vegetarian'],
        nutritionGoals: { calories: 2000 },
        onboardingCompleted: true,
      });
      expect(result).toEqual({ id: mockUserId, onboardingCompleted: true });
    });

    it('should handle onboarding completion errors', async () => {
      const mockUserId = '1';
      const mockOnboardingData = {
        dietaryPreferences: ['vegetarian'],
        completed: true,
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Onboarding completion failed' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await expect(authService.completeOnboarding(mockUserId, mockOnboardingData)).rejects.toThrow('Onboarding completion failed');
    });
  });
});