'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error: unknown) {
        console.error('Error getting initial session:', error);
        setError(error instanceof Error ? error.message : 'Failed to get session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle sign in
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          router.push('/auth/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleAuthError = (error: AuthError | Error) => {
    let message = 'An error occurred';
    
    if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid email or password';
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Please check your email and click the confirmation link';
    } else if (error.message.includes('User already registered')) {
      message = 'An account with this email already exists';
    } else if (error.message.includes('Password should be at least')) {
      message = 'Password must be at least 6 characters long';
    } else if (error.message.includes('Invalid email')) {
      message = 'Please enter a valid email address';
    } else {
      message = error.message;
    }
    
    setError(message);
    setTimeout(() => setError(null), 10000); // Clear error after 10 seconds
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error: unknown) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) throw error;
      
      // Show success message
      setError('Please check your email for a confirmation link');
    } catch (error: unknown) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      setError('Password reset link sent to your email');
    } catch (error: unknown) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error: unknown) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error: unknown) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithGitHub,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};