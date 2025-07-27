// Auth Service with Supabase Integration

import { createClient, SupabaseClient, Session as SupabaseSession, User } from '@supabase/supabase-js';
import { logger } from '@/services/logger';

import { 
  AuthUser, 
  AuthError, 
  SignInFormData, 
  SignUpFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
  UserProfile,
  UserPreferences,
  Session
} from '../types';

export class AuthService {
  private supabase: SupabaseClient;
  private static instance: AuthService;

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Sign In Methods
  async signInWithEmail({ email, password, remember = true }: SignInFormData): Promise<{ user: AuthUser; session: Session | null }> {

    try {

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {

        throw new AuthError(error.message, error.code, error.status);
      }
      if (!data.user) {

        throw new AuthError('No user returned from sign in');
      }

      // Set secure session
      await this.setSecureSession(data.session);

      return {
        user: this.mapUser(data.user),
        session: this.mapSession(data.session)
      };
    } catch (error: unknown) {

      if (error instanceof AuthError) throw error;
      throw new AuthError('Failed to sign in', 'SIGNIN_ERROR', 500);
    }
  }

  async signInWithOAuth(provider: 'google' | 'github' | 'twitter') {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false
        }
      });

      if (error) throw new AuthError(error.message, error.code, error.status);
      
      return data;
    } catch (error: unknown) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Failed to initiate OAuth', 'OAUTH_ERROR', 500);
    }
  }

  // Sign Up
  async signUp({ email, password, name }: SignUpFormData): Promise<AuthUser> {

    try {
      // Simple signup without email confirmation for now
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      });

      if (error) {
        logger.error('Supabase signup error details:', 'authService', {
          message: error.message,
          code: error.code,
          status: error.status,
          details: error
        });
        throw new AuthError(error.message, error.code || 'SIGNUP_ERROR', error.status || 500);
      }
      
      if (!data.user) {
        logger.error('No user in response data:', 'authService', data);
        throw new AuthError('No user returned from sign up', 'SIGNUP_ERROR', 500);
      }

      return this.mapUser(data.user);
    } catch (error: unknown) {
      logger.error('Signup failed with error:', 'authService', error);
      if (error instanceof AuthError) throw error;
      throw new AuthError('Failed to sign up', 'SIGNUP_ERROR', 500);
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw new AuthError(error.message, error.code, error.status);
      
      // Clear secure session
      await this.clearSecureSession();
    } catch (error: unknown) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Failed to sign out', 'SIGNOUT_ERROR', 500);
    }
  }

  // Password Reset
  async resetPassword({ email }: ResetPasswordFormData): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw new AuthError(error.message, error.code, error.status);
    } catch (error: unknown) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Failed to send reset email', 'RESET_ERROR', 500);
    }
  }

  async updatePassword({ password }: UpdatePasswordFormData): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password
      });

      if (error) throw new AuthError(error.message, error.code, error.status);
    } catch (error: unknown) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Failed to update password', 'UPDATE_PASSWORD_ERROR', 500);
    }
  }

  // Session Management
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (process.env.NODE_ENV === 'development') {

      }
      
      return this.mapSession(session);
    } catch (error: unknown) {
      logger.error('Failed to get session:', 'authService', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Only return user if there's also a valid session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (process.env.NODE_ENV === 'development') {

      }
      
      if (session?.user) {
        return this.mapUser(session.user);
      }
      
      return null;
    } catch (error: unknown) {
      logger.error('Failed to get current user:', 'authService', error);
      return null;
    }
  }

  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      
      if (error) throw new AuthError(error.message, error.code, error.status);
      if (!session) return null;

      await this.setSecureSession(session);
      return this.mapSession(session);
    } catch (error: unknown) {
      logger.error('Failed to refresh session:', 'authService', error);
      return null;
    }
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      logger.error('Failed to get user profile:', 'authService', error);
      return null;
    }
  }

  async createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...profile,
          onboarding_completed: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      throw new AuthError('Failed to create user profile', 'PROFILE_CREATE_ERROR', 500);
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      throw new AuthError('Failed to update user profile', 'PROFILE_UPDATE_ERROR', 500);
    }
  }

  // User Preferences Management
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
      return data;
    } catch (error: unknown) {
      logger.error('Failed to get user preferences:', 'authService', error);
      return null;
    }
  }

  async saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // First try to get existing preferences
      const { data: existing } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing preferences
        const { data, error } = await this.supabase
          .from('user_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new preferences
        const { data, error } = await this.supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error: unknown) {
      logger.error('SaveUserPreferences error details:', 'authService', error);
      throw new AuthError('Failed to save user preferences', 'PREFERENCES_SAVE_ERROR', 500);
    }
  }

  // Auth State Changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, supabaseSession) => {
      const mappedSession = this.mapSession(supabaseSession);
      callback(event, mappedSession);
    });
  }

  // Private Methods
  private async setSecureSession(session: SupabaseSession | null): Promise<void> {
    if (!session) return;
    
    // Skip secure session for now - using Supabase client-side session management
    if (process.env.NODE_ENV === 'development') {

    }
  }

  private async clearSecureSession(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (error: unknown) {
        logger.error('Failed to clear secure session:', 'authService', error);
      }
    }
  }

  private mapUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.display_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at || user.created_at)
    };
  }

  private mapSession(session: SupabaseSession | null): Session | null {
    if (!session) return null;
    
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type,
      user: this.mapUser(session.user)
    };
  }

  // Utility Methods
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}