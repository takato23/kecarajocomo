import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useMealPlannerStore } from '../store/mealPlannerStore';
import { Recipe, MealPlan, WeeklyPlan, UserPreferences } from '../types';

export const useSupabaseMealPlanner = () => {
  const supabase = createClientComponentClient();
  const {
    recipes,
    currentWeekPlan,
    userPreferences,
    addRecipe,
    updateUserPreferences,
  } = useMealPlannerStore();

  // Load user preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        updateUserPreferences(data);
      }
    };

    loadUserPreferences();
  }, [supabase, updateUserPreferences]);

  // Save user preferences
  const saveUserPreferences = async (preferences: UserPreferences) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      updateUserPreferences(preferences);
    }

    return { error };
  };

  // Load recipes
  const loadRecipes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      data.forEach((recipe) => addRecipe(recipe));
    }

    return { data, error };
  };

  // Save recipe
  const saveRecipe = async (recipe: Recipe) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        ...recipe,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (data && !error) {
      addRecipe(data);
    }

    return { data, error };
  };

  // Save weekly plan
  const saveWeeklyPlan = async (plan: WeeklyPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('weekly_plans')
      .insert({
        ...plan,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (data && !error) {
      // Save associated daily plans
      for (const dailyPlan of plan.dailyPlans) {
        await supabase.from('daily_plans').insert({
          ...dailyPlan,
          weekly_plan_id: data.id,
          user_id: user.id,
        });
      }
    }

    return { data, error };
  };

  // Load current week plan
  const loadCurrentWeekPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('weekly_plans')
      .select(`
        *,
        daily_plans (
          *,
          meals:planned_meals (
            *,
            recipe:recipes (*)
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('week_start', startOfWeek.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return { data, error };
  };

  return {
    saveUserPreferences,
    loadRecipes,
    saveRecipe,
    saveWeeklyPlan,
    loadCurrentWeekPlan,
  };
};