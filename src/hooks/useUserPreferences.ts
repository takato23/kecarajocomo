'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // TODO: Fetch user preferences from Supabase
    // For now, return mock data
    const mockPreferences: UserPreferences = {
      dietary_restrictions: ['vegetarian'],
      allergies: ['nuts'],
      cuisine_preferences: ['italian', 'mexican', 'asian'],
      nutrition_goals: {
        daily_calories: 2000,
        protein_target: 50,
        carbs_target: 250,
        fat_target: 65,
      },
      household_size: 4,
      cooking_skill: 'intermediate',
      time_constraints: {
        weekday_max_minutes: 45,
        weekend_max_minutes: 90,
      },
      budget_level: 'medium',
      preferred_meal_times: {
        breakfast: '08:00',
        lunch: '12:30',
        dinner: '19:00',
      },
    };

    setTimeout(() => {
      setPreferences(mockPreferences);
      setIsLoading(false);
    }, 500);
  }, []);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      setIsLoading(true);
      // TODO: Update preferences in Supabase
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
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