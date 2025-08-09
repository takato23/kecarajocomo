import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hook to use Supabase client with proper typing
 */
export function useSupabase(): SupabaseClient {
  return supabase;
}

/**
 * Hook for Supabase authentication helpers
 */
export function useSupabaseAuth() {
  const getUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }, []);
  
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);
  
  const onAuthStateChange = useCallback((callback: (event: string, session: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }, []);
  
  return {
    getUser,
    signOut,
    onAuthStateChange
  };
}