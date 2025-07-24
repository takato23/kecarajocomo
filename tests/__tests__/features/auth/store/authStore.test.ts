import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AuthService } from '@/features/auth/services/authService';
import { AuthUser, Session, UserProfile, UserPreferences } from '@/features/auth/types';

// Mock the AuthService
jest.mock('@/features/auth/services/authService', () => ({
  AuthService: {
    getInstance: jest.fn(),
  },
}));

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  ...jest.requireActual('zustand/middleware'),
  persist: jest.fn((fn) => fn),
}));

describe('AuthStore', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockUser: AuthUser;
  let mockSession: Session;
  let mockProfile: UserProfile;
  let mockPreferences: UserPreferences;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock data
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    };

    mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      user: mockUser,
    };

    mockProfile = {
      id: 'profile-123',
      user_id: 'user-123',
      display_name: 'Test User',
      onboarding_completed: false,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    };

    mockPreferences = {
      id: 'prefs-123',
      user_id: 'user-123',
      dietary_restrictions: [],
      allergies: [],
      cuisine_preferences: [],
      cooking_skill_level: 'beginner' as any,
      household_size: 2,
      cooking_time_preference: 'quick' as any,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
    };

    // Mock the AuthService
    mockAuthService = {
      getSession: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithEmail: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      getUserProfile: jest.fn(),
      getUserPreferences: jest.fn(),
      updateUserProfile: jest.fn(),
      saveUserPreferences: jest.fn(),
      onAuthStateChange: jest.fn(),
    } as any;

    (AuthService.getInstance as jest.Mock).mockReturnValue(mockAuthService);
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.preferences).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('initialize', () => {
    it('initializes successfully with valid session and user', async () => {
      mockAuthService.getSession.mockResolvedValue(mockSession);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);
      mockAuthService.getUserPreferences.mockResolvedValue(mockPreferences);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.preferences).toEqual(mockPreferences);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles initialization with no session', async () => {
      mockAuthService.getSession.mockResolvedValue(null);
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles user without session by signing out', async () => {
      mockAuthService.getSession.mockResolvedValue(null);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.signOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isInitialized).toBe(true);
    });

    it('handles initialization errors', async () => {
      const error = new Error('Network error');
      mockAuthService.getSession.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.error).toBe('Failed to initialize authentication');
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('does not initialize twice', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First initialization
      await act(async () => {
        await result.current.initialize();
      });

      // Second initialization should be skipped
      await act(async () => {
        await result.current.initialize();
      });

      expect(mockAuthService.getSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('signIn', () => {
    it('signs in successfully', async () => {
      const signInData = { email: 'test@example.com', password: 'password123' };
      mockAuthService.signInWithEmail.mockResolvedValue({ user: mockUser, session: mockSession });
      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);
      mockAuthService.getUserPreferences.mockResolvedValue(mockPreferences);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn(signInData);
      });

      expect(mockAuthService.signInWithEmail).toHaveBeenCalledWith(signInData);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.preferences).toEqual(mockPreferences);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles sign in errors', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.signInWithEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signIn({ email: 'test@example.com', password: 'wrong' });
        } catch (e: unknown) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      
      mockAuthService.signInWithEmail.mockReturnValue(signInPromise);

      const { result } = renderHook(() => useAuthStore());

      // Start sign in
      act(() => {
        result.current.signIn({ email: 'test@example.com', password: 'password123' });
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Complete sign in
      await act(async () => {
        resolveSignIn({ user: mockUser, session: mockSession });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('signs up successfully', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Test User',
        acceptTerms: true,
      };
      
      mockAuthService.signUp.mockResolvedValue(mockUser);
      mockAuthService.getSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp(signUpData);
      });

      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpData);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles sign up errors', async () => {
      const error = new Error('Email already exists');
      mockAuthService.signUp.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp({
            email: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            name: 'Test User',
            acceptTerms: true,
          });
        } catch (e: unknown) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Email already exists');
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('signs out successfully', async () => {
      mockAuthService.signOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set some initial state
      act(() => {
        result.current.user = mockUser;
        result.current.session = mockSession;
        result.current.profile = mockProfile;
        result.current.preferences = mockPreferences;
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.preferences).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('handles sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockAuthService.signOut.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (e: unknown) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Sign out failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('refreshes session successfully', async () => {
      const newSession = { ...mockSession, access_token: 'new-token' };
      mockAuthService.refreshSession.mockResolvedValue(newSession);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.session).toEqual(newSession);
    });

    it('signs out when session cannot be refreshed', async () => {
      mockAuthService.refreshSession.mockResolvedValue(null);
      mockAuthService.signOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('handles refresh errors', async () => {
      const error = new Error('Refresh failed');
      mockAuthService.refreshSession.mockRejectedValue(error);
      mockAuthService.signOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });
  });

  describe('loadUserData', () => {
    it('loads user data successfully', async () => {
      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);
      mockAuthService.getUserPreferences.mockResolvedValue(mockPreferences);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadUserData('user-123');
      });

      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockAuthService.getUserPreferences).toHaveBeenCalledWith('user-123');
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.preferences).toEqual(mockPreferences);
    });

    it('handles load user data errors', async () => {
      const error = new Error('Failed to load profile');
      mockAuthService.getUserProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadUserData('user-123');
      });

      // Should handle error gracefully without setting state
      expect(result.current.profile).toBeNull();
      expect(result.current.preferences).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const profileUpdates = { display_name: 'Updated Name' };
      const updatedProfile = { ...mockProfile, ...profileUpdates };
      
      mockAuthService.updateUserProfile.mockResolvedValue(updatedProfile);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        result.current.user = mockUser;
        result.current.profile = mockProfile;
      });

      await act(async () => {
        await result.current.updateProfile(profileUpdates);
      });

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(mockUser.id, profileUpdates);
      expect(result.current.profile).toEqual(updatedProfile);
      expect(result.current.isLoading).toBe(false);
    });

    it('does not update profile when no user or profile', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile({ display_name: 'Updated Name' });
      });

      expect(mockAuthService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('handles update profile errors', async () => {
      const error = new Error('Update failed');
      mockAuthService.updateUserProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        result.current.user = mockUser;
        result.current.profile = mockProfile;
      });

      await act(async () => {
        try {
          await result.current.updateProfile({ display_name: 'Updated Name' });
        } catch (e: unknown) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Update failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('updates preferences successfully', async () => {
      const preferencesUpdates = { household_size: 3 };
      const updatedPreferences = { ...mockPreferences, ...preferencesUpdates };
      
      mockAuthService.saveUserPreferences.mockResolvedValue(updatedPreferences);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        result.current.user = mockUser;
      });

      await act(async () => {
        await result.current.updatePreferences(preferencesUpdates);
      });

      expect(mockAuthService.saveUserPreferences).toHaveBeenCalledWith(mockUser.id, preferencesUpdates);
      expect(result.current.preferences).toEqual(updatedPreferences);
      expect(result.current.isLoading).toBe(false);
    });

    it('does not update preferences when no user', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updatePreferences({ household_size: 3 });
      });

      expect(mockAuthService.saveUserPreferences).not.toHaveBeenCalled();
    });

    it('handles update preferences errors', async () => {
      const error = new Error('Update failed');
      mockAuthService.saveUserPreferences.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        result.current.user = mockUser;
      });

      await act(async () => {
        try {
          await result.current.updatePreferences({ household_size: 3 });
        } catch (e: unknown) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Update failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set error state
      act(() => {
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('selectors', () => {
    it('selectIsAuthenticated returns true when user and session exist', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.user = mockUser;
        result.current.session = mockSession;
      });

      const { selectIsAuthenticated } = require('@/features/auth/store/authStore');
      expect(selectIsAuthenticated(result.current)).toBe(true);
    });

    it('selectIsAuthenticated returns false when user or session missing', () => {
      const { result } = renderHook(() => useAuthStore());

      const { selectIsAuthenticated } = require('@/features/auth/store/authStore');
      expect(selectIsAuthenticated(result.current)).toBe(false);
    });

    it('selectIsOnboarded returns true when profile onboarding is completed', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.profile = { ...mockProfile, onboarding_completed: true };
      });

      const { selectIsOnboarded } = require('@/features/auth/store/authStore');
      expect(selectIsOnboarded(result.current)).toBe(true);
    });

    it('selectNeedsOnboarding returns true when authenticated but not onboarded', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.user = mockUser;
        result.current.session = mockSession;
        result.current.profile = { ...mockProfile, onboarding_completed: false };
      });

      const { selectNeedsOnboarding } = require('@/features/auth/store/authStore');
      expect(selectNeedsOnboarding(result.current)).toBe(true);
    });
  });
});