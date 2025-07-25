'use client';

import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/SupabaseAuthProvider';

export interface UserPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  cuisine_preferences: string[];
  nutrition_goals: {
    daily_calories?: number;
    protein_target?: number;
    carbs_target?: number;
    fat_target?: number;
  };
  household_size: number;
  cooking_skill: 'beginner' | 'intermediate' | 'advanced';
  time_constraints: {
    weekday_max_minutes: number;
    weekend_max_minutes: number;
  };
  budget_level: 'low' | 'medium' | 'high';
  preferred_meal_times: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
}

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        
        // Fetch user profile from Supabase
        const { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          // If profile doesn't exist, create default preferences
          if (fetchError.code === 'PGRST116') {
            const defaultPreferences: UserPreferences = {
              dietary_restrictions: [],
              allergies: [],
              cuisine_preferences: [],
              nutrition_goals: {},
              household_size: 1,
              cooking_skill: 'beginner',
              time_constraints: {
                weekday_max_minutes: 30,
                weekend_max_minutes: 60,
              },
              budget_level: 'medium',
              preferred_meal_times: {},
            };

            // Create new profile with default preferences
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                dietary_restrictions: defaultPreferences.dietary_restrictions,
                allergies: defaultPreferences.allergies,
                favorite_cuisines: defaultPreferences.cuisine_preferences,
                cooking_skill_level: defaultPreferences.cooking_skill,
                household_size: defaultPreferences.household_size,
                preferences: {
                  nutrition_goals: defaultPreferences.nutrition_goals,
                  time_constraints: defaultPreferences.time_constraints,
                  budget_level: defaultPreferences.budget_level,
                  preferred_meal_times: defaultPreferences.preferred_meal_times,
                },
              })
              .select()
              .single();

            if (createError) {
              throw createError;
            }

            setPreferences(defaultPreferences);
          } else {
            throw fetchError;
          }
        } else {
          // Map database fields to UserPreferences interface
          const userPreferences: UserPreferences = {
            dietary_restrictions: profile.dietary_restrictions || [],
            allergies: profile.allergies || [],
            cuisine_preferences: profile.favorite_cuisines || [],
            nutrition_goals: profile.preferences?.nutrition_goals || {},
            household_size: profile.household_size || 1,
            cooking_skill: profile.cooking_skill_level || 'beginner',
            time_constraints: profile.preferences?.time_constraints || {
              weekday_max_minutes: 30,
              weekend_max_minutes: 60,
            },
            budget_level: profile.preferences?.budget_level || 'medium',
            preferred_meal_times: profile.preferences?.preferred_meal_times || {},
          };

          setPreferences(userPreferences);
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreferences();
  }, [user]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare the update payload
      const updatePayload: any = {};

      // Map UserPreferences fields to database columns
      if (updates.dietary_restrictions !== undefined) {
        updatePayload.dietary_restrictions = updates.dietary_restrictions;
      }
      if (updates.allergies !== undefined) {
        updatePayload.allergies = updates.allergies;
      }
      if (updates.cuisine_preferences !== undefined) {
        updatePayload.favorite_cuisines = updates.cuisine_preferences;
      }
      if (updates.cooking_skill !== undefined) {
        updatePayload.cooking_skill_level = updates.cooking_skill;
      }
      if (updates.household_size !== undefined) {
        updatePayload.household_size = updates.household_size;
      }

      // Handle nested preferences
      const currentPreferences = preferences || {
        dietary_restrictions: [],
        allergies: [],
        cuisine_preferences: [],
        nutrition_goals: {},
        household_size: 1,
        cooking_skill: 'beginner',
        time_constraints: {
          weekday_max_minutes: 30,
          weekend_max_minutes: 60,
        },
        budget_level: 'medium',
        preferred_meal_times: {},
      };

      const preferencesUpdate = {
        nutrition_goals: updates.nutrition_goals !== undefined 
          ? updates.nutrition_goals 
          : currentPreferences.nutrition_goals,
        time_constraints: updates.time_constraints !== undefined 
          ? updates.time_constraints 
          : currentPreferences.time_constraints,
        budget_level: updates.budget_level !== undefined 
          ? updates.budget_level 
          : currentPreferences.budget_level,
        preferred_meal_times: updates.preferred_meal_times !== undefined 
          ? updates.preferred_meal_times 
          : currentPreferences.preferred_meal_times,
      };

      updatePayload.preferences = preferencesUpdate;
      updatePayload.updated_at = new Date().toISOString();

      // Update preferences in Supabase
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
  };
};