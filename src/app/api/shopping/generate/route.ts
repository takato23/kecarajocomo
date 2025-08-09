/**
 * Shopping List Generation API Route
 * Handles automatic shopping list generation from meal plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger';
import { autoShoppingListGenerator } from '@/services/shopping/AutoShoppingListGenerator';
import { MealPlanService } from '@/lib/supabase/meal-plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, weekPlanId, options } = await request.json();

    if (!userId || !weekPlanId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    logger.info('Generating shopping list', 'api/shopping/generate', {
      userId,
      weekPlanId,
      options
    });

    // Get the week plan
    const weekPlanResult = await MealPlanService.getWeekPlanById(weekPlanId);
    if (!weekPlanResult.data) {
      return NextResponse.json(
        { error: 'Week plan not found' },
        { status: 404 }
      );
    }

    // Get user's pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (pantryError) {
      logger.error('Error fetching pantry items', 'api/shopping/generate', pantryError);
      return NextResponse.json(
        { error: 'Error fetching pantry data' },
        { status: 500 }
      );
    }

    // Generate shopping list
    const generation = await autoShoppingListGenerator.generateFromMealPlan(
      weekPlanResult.data,
      pantryItems || [],
      userId,
      options || {
        organizeByStore: true,
        groupByCategory: true,
        prioritizeByExpiration: true,
        includePriceComparisons: true,
        suggestAlternatives: true,
        optimizeRoute: false
      }
    );

    // Save the generated shopping list to database
    const { data: savedList, error: saveError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        week_plan_id: weekPlanId,
        name: `Lista para semana ${weekPlanResult.data.startDate}`,
        data: generation.shoppingList,
        summary: generation.summary,
        optimizations: generation.optimizations,
        budget: generation.summary.estimatedCost,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving shopping list', 'api/shopping/generate', saveError);
      return NextResponse.json(
        { error: 'Error saving shopping list' },
        { status: 500 }
      );
    }

    // Save individual shopping items
    if (generation.shoppingList.items.length > 0) {
      const shoppingItems = generation.shoppingList.items.map(item => ({
        list_id: savedList.id,
        name: item.ingredientName,
        quantity: item.totalAmount,
        unit: item.unit,
        category: item.category,
        estimated_price: item.estimatedPrice,
        recipe_names: item.recipeNames,
        checked: item.isPurchased,
        notes: item.notes,
        position: 0 // Will be updated based on order
      }));

      const { error: itemsError } = await supabase
        .from('shopping_items')
        .insert(shoppingItems);

      if (itemsError) {
        logger.error('Error saving shopping items', 'api/shopping/generate', itemsError);
        // Continue anyway, the main list was saved
      }
    }

    logger.info('Shopping list generated successfully', 'api/shopping/generate', {
      listId: savedList.id,
      totalItems: generation.summary.totalItems,
      estimatedCost: generation.summary.estimatedCost
    });

    return NextResponse.json({
      success: true,
      data: {
        ...generation,
        shoppingList: {
          ...generation.shoppingList,
          id: savedList.id
        }
      }
    });

  } catch (error) {
    logger.error('Error in shopping list generation API', 'api/shopping/generate', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const listId = searchParams.get('listId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('shopping_lists')
      .select(`
        *,
        shopping_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (listId) {
      query = query.eq('id', listId).single();
    } else {
      query = query.eq('is_active', true).limit(10);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching shopping lists', 'api/shopping/generate', error);
      return NextResponse.json(
        { error: 'Error fetching shopping lists' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Error in shopping list fetch API', 'api/shopping/generate', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}