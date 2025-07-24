import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Server-side Supabase client (for API routes)
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
};

// OAuth providers
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
};

export const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
};

// Real-time subscriptions
export const subscribeToTable = <T = any>(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = filter
    ? supabase.channel(`${table}:${filter}`).on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        callback
      )
    : supabase.channel(table).on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      );

  channel.subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

// Error handling helper
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    // Handle specific Supabase errors
    if (error.message.includes('duplicate key')) {
      return 'This item already exists';
    }
    if (error.message.includes('violates foreign key')) {
      return 'Related data not found';
    }
    if (error.message.includes('JWT')) {
      return 'Your session has expired. Please sign in again';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};