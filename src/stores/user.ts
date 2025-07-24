import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { supabase } from '@/lib/supabase/client';
import type { UserProfile, UserPreferences } from '@/types/profile';
import { 
  transformProfileFromDB, 
  transformProfileToDB, 
  transformPreferencesFromDB, 
  transformPreferencesToDB 
} from '@/utils/profile-transformers';

interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      preferences: null,
      isLoading: false,
      error: null,

      fetchProfile: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) throw error;
          
          const transformedProfile = transformProfileFromDB(data);
          set({ profile: transformedProfile, isLoading: false });
        } catch (error: unknown) {
          set({ 
            error: error.message || 'Failed to fetch profile', 
            isLoading: false 
          });
        }
      },

      fetchPreferences: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) throw error;
          
          const transformedPreferences = transformPreferencesFromDB(data);
          set({ preferences: transformedPreferences, isLoading: false });
        } catch (error: unknown) {
          set({ 
            error: error.message || 'Failed to fetch preferences', 
            isLoading: false 
          });
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const profile = get().profile;
        if (!profile) return;

        set({ isLoading: true, error: null });
        
        try {
          // Transform camelCase to snake_case for database
          const dbUpdates = transformProfileToDB(updates);
          
          const { data, error } = await supabase
            .from('user_profiles')
            .update(dbUpdates)
            .eq('id', profile.id)
            .select()
            .single();

          if (error) throw error;
          
          const transformedProfile = transformProfileFromDB(data);
          set({ profile: transformedProfile, isLoading: false });
        } catch (error: unknown) {
          set({ 
            error: error.message || 'Failed to update profile', 
            isLoading: false 
          });
        }
      },

      updatePreferences: async (updates: Partial<UserPreferences>) => {
        const preferences = get().preferences;
        if (!preferences) return;

        set({ isLoading: true, error: null });
        
        try {
          // Transform camelCase to snake_case for database
          const dbUpdates = transformPreferencesToDB(updates);
          
          const { data, error } = await supabase
            .from('user_preferences')
            .update(dbUpdates)
            .eq('user_id', preferences.userId)
            .select()
            .single();

          if (error) throw error;
          
          const transformedPreferences = transformPreferencesFromDB(data);
          set({ preferences: transformedPreferences, isLoading: false });
        } catch (error: unknown) {
          set({ 
            error: error.message || 'Failed to update preferences', 
            isLoading: false 
          });
        }
      },

      reset: () => {
        set({
          profile: null,
          preferences: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        profile: state.profile,
        preferences: state.preferences,
      }),
    }
  )
);