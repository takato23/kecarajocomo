// Auth Store with Zustand

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { logger } from '@/services/logger';

import { AuthService } from '../services/authService';
import { 
  AuthUser, 
  Session, 
  UserProfile, 
  UserPreferences,
  SignInFormData,
  SignUpFormData
} from '../types';

interface AuthState {
  // State
  user: AuthUser | null;
  session: Session | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (data: SignInFormData) => Promise<void>;
  signUp: (data: SignUpFormData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

const authService = AuthService.getInstance();

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        session: null,
        profile: null,
        preferences: null,
        isLoading: false,
        isInitialized: false,
        error: null,

        // Initialize auth state
        initialize: async () => {
          if (get().isInitialized) return;

          set({ isLoading: true, error: null });

          try {
            // Get current session
            const session = await authService.getSession();
            const user = await authService.getCurrentUser();
            
            if (process.env.NODE_ENV === 'development') {

            }
            
            if (session?.user && user) {
              set({ 
                session, 
                user,
                isInitialized: true 
              });

              // Load user data in background
              get().loadUserData(user.id);
            } else if (user && !session) {
              // User exists but no valid session - this is the problem case
              if (process.env.NODE_ENV === 'development') {

              }
              
              // Force sign out to clear any stale tokens
              await authService.signOut();
              
              set({ 
                user: null,
                session: null,
                isInitialized: true 
              });
            } else {
              set({ isInitialized: true });
            }
          } catch (error: unknown) {
            logger.error('Auth initialization error:', 'auth:authStore', error);
            set({ 
              error: 'Failed to initialize authentication',
              isInitialized: true 
            });
          } finally {
            set({ isLoading: false });
          }

          // Listen for auth state changes
          authService.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              const user = await authService.getCurrentUser();
              if (user) {
                set({ session, user });
                get().loadUserData(user.id);
              }
            } else if (event === 'SIGNED_OUT') {
              set({ 
                user: null, 
                session: null, 
                profile: null, 
                preferences: null 
              });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session });
            }
          });
        },

        // Sign In
        signIn: async (data: SignInFormData) => {
          set({ isLoading: true, error: null });

          try {
            const { user, session } = await authService.signInWithEmail(data);
            
            if (process.env.NODE_ENV === 'development') {

            }

            set({ user, session });

            // Load user data
            await get().loadUserData(user.id);
          } catch (error: unknown) {
            set({ error: error.message || 'Failed to sign in' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign Up
        signUp: async (data: SignUpFormData) => {
          set({ isLoading: true, error: null });

          try {
            const user = await authService.signUp(data);
            const session = await authService.getSession();

            set({ user, session });
          } catch (error: unknown) {
            set({ error: error.message || 'Failed to sign up' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign Out
        signOut: async () => {
          set({ isLoading: true, error: null });

          try {
            await authService.signOut();
            
            set({ 
              user: null, 
              session: null, 
              profile: null, 
              preferences: null 
            });
          } catch (error: unknown) {
            set({ error: error.message || 'Failed to sign out' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Refresh Session
        refreshSession: async () => {
          try {
            const session = await authService.refreshSession();
            
            if (session) {
              set({ session });
            } else {
              // Session expired, sign out
              get().signOut();
            }
          } catch (error: unknown) {
            logger.error('Failed to refresh session:', 'auth:authStore', error);
            get().signOut();
          }
        },

        // Load User Data
        loadUserData: async (userId: string) => {
          try {
            const [profile, preferences] = await Promise.all([
              authService.getUserProfile(userId),
              authService.getUserPreferences(userId)
            ]);

            set({ profile, preferences });
          } catch (error: unknown) {
            logger.error('Failed to load user data:', 'auth:authStore', error);
          }
        },

        // Update Profile
        updateProfile: async (updates: Partial<UserProfile>) => {
          const { user, profile } = get();
          if (!user || !profile) return;

          set({ isLoading: true, error: null });

          try {
            const updatedProfile = await authService.updateUserProfile(user.id, updates);
            set({ profile: updatedProfile });
          } catch (error: unknown) {
            set({ error: error.message || 'Failed to update profile' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Update Preferences
        updatePreferences: async (updates: Partial<UserPreferences>) => {
          const { user } = get();
          if (!user) return;

          set({ isLoading: true, error: null });

          try {
            const updatedPreferences = await authService.saveUserPreferences(user.id, updates);
            set({ preferences: updatedPreferences });
          } catch (error: unknown) {
            set({ error: error.message || 'Failed to update preferences' });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Clear Error
        clearError: () => set({ error: null })
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          // Don't persist user without session for security
          // user: state.user,
          isInitialized: state.isInitialized
        })
      }
    )
  )
);

// Selectors
export const selectIsAuthenticated = (state: AuthState) => !!state.user && !!state.session;
export const selectIsOnboarded = (state: AuthState) => state.profile?.onboarding_completed || false;
export const selectNeedsOnboarding = (state: AuthState) => 
  selectIsAuthenticated(state) && !selectIsOnboarded(state);