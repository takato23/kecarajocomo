'use client';

import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/store';

interface Recipe {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_time: number;
  servings: number;
  created_at: string;
  is_public: boolean;
  cuisine_types: string[];
  meal_types: string[];
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id?: string;
  custom_meal?: string;
  scheduled_time?: string;
  notes?: string;
  recipe?: Recipe;
}

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiration_date?: string;
  category: string;
  location?: string;
  purchase_date?: string;
  cost?: number;
}

interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
  price?: number;
  notes?: string;
}

interface ActivityItem {
  action: string;
  item: string;
  time: string;
  type: 'recipe' | 'meal' | 'pantry' | 'shopping';
  icon?: string;
}

interface DashboardStats {
  recipesCount: number;
  recipesThisWeek: number;
  favoriteRecipesCount: number;
  mealsPlanned: number;
  mealsThisWeek: number;
  completedMealsToday: number;
  pantryItems: number;
  pantryExpiringCount: number;
  pantryLowStockCount: number;
  shoppingItems: number;
  shoppingCompletedToday: number;
  totalEstimatedCost: number;
  recentRecipes: Recipe[];
  todaysMeals: MealPlan[];
  upcomingMeals: MealPlan[];
  expiringItems: PantryItem[];
  recentActivity: ActivityItem[];
  weeklyMealPlan: MealPlan[];
}

interface DashboardError {
  message: string;
  code?: string;
  retry?: () => void;
}

export function useDashboardData() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    recipesCount: 0,
    recipesThisWeek: 0,
    favoriteRecipesCount: 0,
    mealsPlanned: 0,
    mealsThisWeek: 0,
    completedMealsToday: 0,
    pantryItems: 0,
    pantryExpiringCount: 0,
    pantryLowStockCount: 0,
    shoppingItems: 0,
    shoppingCompletedToday: 0,
    totalEstimatedCost: 0,
    recentRecipes: [],
    todaysMeals: [],
    upcomingMeals: [],
    expiringItems: [],
    recentActivity: [],
    weeklyMealPlan: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const weekStart = getStartOfWeek();
      const weekEnd = getEndOfWeek();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Fetch Recipes Data
      const [recipesResult, recentRecipesResult, favoriteRecipesResult] = await Promise.all([
        // Total recipes count
        supabase
          .from('recipes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),

        // Recent recipes (last 5 with full data)
        supabase
          .from('recipes')
          .select(`
            id, name, description, image_url, difficulty, 
            total_time, servings, created_at, is_public,
            cuisine_types, meal_types
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // Favorite recipes count
        supabase
          .from('user_favorite_recipes')
          .select('recipe_id', { count: 'exact' })
          .eq('user_id', user.id)
      ]);

      // Recipes created this week
      const recipesThisWeekResult = await supabase
        .from('recipes')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);

      // 2. Fetch Meal Planning Data
      const [mealsThisWeekResult, todaysMealsResult, upcomingMealsResult, weeklyMealPlanResult] = await Promise.all([
        // Meals planned this week (count)
        supabase
          .from('meal_plans')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('date', weekStart)
          .lte('date', weekEnd),

        // Today's meals with recipe details
        supabase
          .from('meal_plans')
          .select(`
            id, date, meal_type, recipe_id, custom_meal, 
            scheduled_time, notes,
            recipe:recipes(
              name, description, image_url, difficulty,
              total_time, servings, cuisine_types
            )
          `)
          .eq('user_id', user.id)
          .eq('date', todayString)
          .order('scheduled_time'),

        // Upcoming meals (next 3 days)
        supabase
          .from('meal_plans')
          .select(`
            id, date, meal_type, recipe_id, custom_meal,
            scheduled_time, notes,
            recipe:recipes(name, image_url, total_time)
          `)
          .eq('user_id', user.id)
          .gt('date', todayString)
          .lte('date', sevenDaysFromNow)
          .order('date')
          .order('scheduled_time')
          .limit(6),

        // Full weekly meal plan
        supabase
          .from('meal_plans')
          .select(`
            id, date, meal_type, recipe_id, custom_meal,
            scheduled_time, notes,
            recipe:recipes(name, image_url, difficulty, total_time)
          `)
          .eq('user_id', user.id)
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .order('date')
          .order('scheduled_time')
      ]);

      // 3. Fetch Pantry Data
      const [pantryItemsResult, expiringItemsResult, lowStockResult] = await Promise.all([
        // All pantry items with positive quantity
        supabase
          .from('pantry_items')
          .select(`
            id, name, quantity, unit, expiration_date,
            category, location, purchase_date, cost
          `)
          .eq('user_id', user.id)
          .gt('quantity', 0),

        // Items expiring in next 7 days
        supabase
          .from('pantry_items')
          .select(`
            id, name, quantity, unit, expiration_date,
            category, location
          `)
          .eq('user_id', user.id)
          .gt('quantity', 0)
          .not('expiration_date', 'is', null)
          .lte('expiration_date', sevenDaysFromNow)
          .order('expiration_date'),

        // Low stock items (quantity <= 2)
        supabase
          .from('pantry_items')
          .select('id, name, quantity, unit, category')
          .eq('user_id', user.id)
          .lte('quantity', 2)
          .gt('quantity', 0)
      ]);

      // 4. Fetch Shopping Lists Data
      const shoppingListsResult = await supabase
        .from('shopping_lists')
        .select('id, name, is_active')
        .eq('user_id', user.id);

      let shoppingItemsResult = { data: [], count: 0 };
      let totalEstimatedCost = 0;
      let shoppingCompletedToday = 0;

      if (shoppingListsResult.data && shoppingListsResult.data.length > 0) {
        const listIds = shoppingListsResult.data.map(list => list.id);
        
        // Unpurchased items
        shoppingItemsResult = await supabase
          .from('shopping_list_items')
          .select(`
            id, shopping_list_id, name, quantity, unit,
            category, purchased, price, notes
          `, { count: 'exact' })
          .eq('purchased', false)
          .in('shopping_list_id', listIds);

        // Calculate total estimated cost
        const costResult = await supabase
          .from('shopping_list_items')
          .select('price, quantity')
          .eq('purchased', false)
          .in('shopping_list_id', listIds)
          .not('price', 'is', null);

        if (costResult.data) {
          totalEstimatedCost = costResult.data.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
          );
        }

        // Items completed today
        const completedTodayResult = await supabase
          .from('shopping_list_items')
          .select('id', { count: 'exact' })
          .eq('purchased', true)
          .in('shopping_list_id', listIds)
          .gte('updated_at', todayString);

        shoppingCompletedToday = completedTodayResult.count || 0;
      }

      // 5. Generate Recent Activity
      const recentActivity: ActivityItem[] = [];

      // Add recent recipes
      if (recentRecipesResult.data) {
        recentRecipesResult.data.slice(0, 2).forEach(recipe => {
          recentActivity.push({
            action: 'Created recipe',
            item: recipe.name,
            time: formatTimeAgo(recipe.created_at),
            type: 'recipe',
            icon: '🍳'
          });
        });
      }

      // Add recent meal plans
      if (todaysMealsResult.data && todaysMealsResult.data.length > 0) {
        recentActivity.push({
          action: 'Planned today\'s meals',
          item: `${todaysMealsResult.data.length} meals scheduled`,
          time: 'Today',
          type: 'meal',
          icon: '📅'
        });
      }

      // Add pantry updates
      if (pantryItemsResult.data && pantryItemsResult.data.length > 0) {
        recentActivity.push({
          action: 'Updated pantry',
          item: `${pantryItemsResult.data.length} items tracked`,
          time: 'Recently',
          type: 'pantry',
          icon: '📦'
        });
      }

      // Add shopping activity
      if (shoppingCompletedToday > 0) {
        recentActivity.push({
          action: 'Completed shopping',
          item: `${shoppingCompletedToday} items purchased`,
          time: 'Today',
          type: 'shopping',
          icon: '🛒'
        });
      }

      // Calculate completed meals today (simplified logic)
      const completedMealsToday = todaysMealsResult.data?.filter(meal => {
        if (!meal.scheduled_time) return false;
        const mealTime = new Date(`${todayString}T${meal.scheduled_time}`);
        return mealTime < today;
      }).length || 0;

      // Set comprehensive stats
      setStats({
        recipesCount: recipesResult.count || 0,
        recipesThisWeek: recipesThisWeekResult.count || 0,
        favoriteRecipesCount: favoriteRecipesResult.count || 0,
        mealsPlanned: mealsThisWeekResult.count || 0,
        mealsThisWeek: mealsThisWeekResult.count || 0,
        completedMealsToday,
        pantryItems: pantryItemsResult.data?.length || 0,
        pantryExpiringCount: expiringItemsResult.data?.length || 0,
        pantryLowStockCount: lowStockResult.data?.length || 0,
        shoppingItems: shoppingItemsResult.count || 0,
        shoppingCompletedToday,
        totalEstimatedCost,
        recentRecipes: recentRecipesResult.data || [],
        todaysMeals: todaysMealsResult.data || [],
        upcomingMeals: upcomingMealsResult.data || [],
        expiringItems: expiringItemsResult.data || [],
        recentActivity: recentActivity.slice(0, 5),
        weeklyMealPlan: weeklyMealPlanResult.data || []
      });

      setRetryCount(0); // Reset retry count on success

    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      
      const dashboardError: DashboardError = {
        message: err.message || 'Failed to load dashboard data',
        code: err.code,
        retry: () => {
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => fetchDashboardData(), 1000 * Math.pow(2, retryCount));
          }
        }
      };
      
      setError(dashboardError);
    } finally {
      setIsLoading(false);
    }
  }, [user, retryCount]);

  const refreshData = useCallback(() => {
    setRetryCount(0);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel('dashboard-recipes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'recipes', filter: `user_id=eq.${user.id}` },
          () => refreshData()
        ),
      supabase
        .channel('dashboard-meal-plans')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'meal_plans', filter: `user_id=eq.${user.id}` },
          () => refreshData()
        ),
      supabase
        .channel('dashboard-pantry')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'pantry_items', filter: `user_id=eq.${user.id}` },
          () => refreshData()
        )
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, refreshData]);

  return {
    stats,
    isLoading,
    error,
    refreshData,
    retryCount
  };
}

// Helper functions
function getStartOfWeek(): string {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  return startOfWeek.toISOString().split('T')[0];
}

function getEndOfWeek(): string {
  const now = new Date();
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  return endOfWeek.toISOString().split('T')[0];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}