import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => set({ user }),
      
      setLoading: (isLoading) => set({ isLoading }),

      initialize: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            set({ user: session.user });
          }

          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                set({ user: session?.user || null });
              } else if (event === 'SIGNED_OUT') {
                set({ user: null });
              }
            }
          );

          // Clean up subscription on unmount
          if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
              subscription.unsubscribe();
            });
          }

          set({ isInitialized: true });
        } catch (error: unknown) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await supabase.auth.signOut();
          set({ user: null });
        } catch (error: unknown) {
          console.error('Sign out error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user data
    }
  )
);