import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/**
 * Ensures that a user has profile and preferences records.
 * Creates default records if they don't exist.
 */
export async function ensureUserProfile(user: User) {
  if (!user?.id) {
    throw new Error('User ID is required');
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Create profile if it doesn't exist
  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'user',
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        language: 'es',
        theme: 'light',
        stats: {
          recipesCreated: 0,
          mealsPlanned: 0,
          recipesRated: 0,
          streakDays: 0,
          joinedDate: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }
  }

  // Check if preferences exist
  const { data: existingPreferences } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Create preferences if they don't exist
  if (!existingPreferences) {
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        dietary_restrictions: [],
        allergies: [],
        cuisine_preferences: [],
        cooking_skill_level: 'intermediate',
        household_size: 1,
        budget: {
          weekly: 100,
          monthly: 400,
          currency: 'USD'
        },
        nutrition_goals: [],
        cooking_preferences: {
          timeAvailable: { weekday: 30, weekend: 60 },
          cookingMethods: [],
          kitchenTools: []
        },
        planning_preferences: {
          planningHorizon: 'weekly',
          mealTypes: ['breakfast', 'lunch', 'dinner'],
          batchCooking: false,
          leftoverStrategy: 'incorporate',
          varietyPreference: 'medium'
        },
        shopping_preferences: {
          preferredStores: [],
          shoppingDay: 6,
          deliveryPreferences: []
        },
        notification_settings: {
          mealReminders: true,
          shoppingReminders: true,
          expirationAlerts: true,
          recipeSuggestions: true,
          planningPrompts: true,
          notificationTimes: {}
        }
      });

    if (preferencesError) {
      console.error('Error creating preferences:', preferencesError);
      throw preferencesError;
    }
  }

  return { success: true };
}