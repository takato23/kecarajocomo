import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

import type { PantryAnalysis, PantryAPIResponse } from '@/features/pantry/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id);

    if (pantryError) {
      logger.error('Error fetching pantry items:', 'API:route', pantryError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry items' },
        { status: 500 }
      );
    }

    // Get cooking events for usage patterns (if table exists)
    let cookingEvents: any[] = [];
    try {
      const { data: events } = await supabase
        .from('cooking_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('cooked_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days
      
      cookingEvents = events || [];
    } catch (error: unknown) {
      // Table might not exist yet, continue without cooking events

    }

    // Analyze pantry data
    const analysis = generatePantryAnalysis(pantryItems || [], cookingEvents);

    const response: PantryAPIResponse<PantryAnalysis> = {
      data: analysis,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in GET /api/pantry/analysis:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePantryAnalysis(pantryItems: any[], cookingEvents: any[]): PantryAnalysis {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Analyze expired items
  const expiredItems = pantryItems.filter(item => {
    if (!item.expiration_date) return false;
    return new Date(item.expiration_date) < now;
  });

  const recentlyExpiredItems = expiredItems.filter(item => {
    const expiredDate = new Date(item.expiration_date);
    return expiredDate >= oneMonthAgo;
  });

  // Calculate waste value
  const wasteValue = recentlyExpiredItems.reduce((sum, item) => {
    return sum + (item.cost || 0);
  }, 0);

  // Analyze categories with most waste
  const expiredByCategory: Record<string, number> = {};
  recentlyExpiredItems.forEach(item => {
    const category = item.category || 'Uncategorized';
    expiredByCategory[category] = (expiredByCategory[category] || 0) + 1;
  });

  const mostWastedCategories = Object.entries(expiredByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  // Analyze usage patterns
  const ingredientUsage: Record<string, number> = {};
  cookingEvents.forEach(event => {
    // This would ideally track actual ingredient consumption
    // For now, we'll use recipe frequency as a proxy
    if (event.recipe_name) {
      ingredientUsage[event.recipe_name] = (ingredientUsage[event.recipe_name] || 0) + 1;
    });

  const mostUsedIngredients = Object.entries(ingredientUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ingredient]) => ingredient);

  // Calculate shopping frequency
  const shoppingFrequency = Math.max(1, Math.round(cookingEvents.length / 12)); // Assume shopping every 2 weeks

  // Generate seasonal trends (simplified)
  const currentMonth = now.getMonth();
  const seasonalTrends: Record<string, number> = {
    'Fresh Produce': currentMonth >= 2 && currentMonth <= 8 ? 1.2 : 0.8, // Higher in spring/summer
    'Canned Goods': currentMonth >= 9 || currentMonth <= 2 ? 1.1 : 0.9, // Higher in fall/winter
    'Dairy': 1.0, // Consistent year-round
    'Meat & Seafood': 1.0, // Consistent year-round
  };

  // Generate optimization suggestions
  const bulkBuyRecommendations: string[] = [];
  const storageImprovements: string[] = [];
  const recipeSuggestions: string[] = [];

  // Analyze pantry composition for recommendations
  const categoryCount: Record<string, number> = {};
  pantryItems.forEach(item => {
    const category = item.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  // Bulk buy recommendations based on frequently used categories
  Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .forEach(([category]) => {
      if (category === 'Pantry Staples') {
        bulkBuyRecommendations.push('Rice, pasta, and cooking oils in bulk');
      } else if (category === 'Spices & Herbs') {
        bulkBuyRecommendations.push('Whole spices for better flavor and longevity');
      } else if (category === 'Canned Goods') {
        bulkBuyRecommendations.push('Canned tomatoes and beans when on sale');
      });

  // Storage improvements based on expired items
  if (mostWastedCategories.includes('Produce')) {
    storageImprovements.push('Store produce properly: apples in fridge, potatoes in cool, dark place');
    storageImprovements.push('Use produce bags with air holes for better ventilation');
  }
  if (mostWastedCategories.includes('Dairy')) {
    storageImprovements.push('Keep dairy in main body of fridge, not door');
    storageImprovements.push('Check fridge temperature (should be 37-40°F)');
  }
  if (mostWastedCategories.includes('Bread')) {
    storageImprovements.push('Freeze bread you won\'t use within 2-3 days');
  }

  // Recipe suggestions based on expiring items
  const expiringSoon = pantryItems.filter(item => {
    if (!item.expiration_date) return false;
    const daysUntilExpiration = Math.ceil(
      (new Date(item.expiration_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  });

  expiringSoon.slice(0, 3).forEach(item => {
    const ingredient = item.ingredient_name.toLowerCase();
    if (ingredient.includes('banana')) {
      recipeSuggestions.push('Banana bread or smoothies');
    } else if (ingredient.includes('apple')) {
      recipeSuggestions.push('Apple crisp or sauce');
    } else if (ingredient.includes('potato')) {
      recipeSuggestions.push('Roasted potatoes or mashed potatoes');
    } else if (ingredient.includes('carrot')) {
      recipeSuggestions.push('Carrot soup or roasted vegetables');
    } else {
      recipeSuggestions.push(`Recipes using ${item.ingredient_name}`);
    });

  return {
    waste_analysis: {
      expired_items_last_month: recentlyExpiredItems.length,
      waste_value: wasteValue,
      most_wasted_categories: mostWastedCategories,
    },
    usage_patterns: {
      most_used_ingredients: mostUsedIngredients,
      seasonal_trends: seasonalTrends,
      shopping_frequency: shoppingFrequency,
    },
    optimization_suggestions: {
      bulk_buy_recommendations: bulkBuyRecommendations.length > 0 
        ? bulkBuyRecommendations 
        : ['Consider buying non-perishables in bulk for savings'],
      storage_improvements: storageImprovements.length > 0 
        ? storageImprovements 
        : ['Organize pantry with oldest items in front', 'Keep pantry at consistent temperature'],
      recipe_suggestions: recipeSuggestions.length > 0 
        ? recipeSuggestions 
        : ['Try new recipes with ingredients you have on hand'],
    };
}