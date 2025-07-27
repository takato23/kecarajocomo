import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/meal-planning/[id]/items - Get meal plan items
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: mealPlanId } = params;
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date');
    const mealType = searchParams.get('mealType');

    // Verify user owns the meal plan
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('meal_plan_items')
      .select(`
        *,
        recipe:recipes(*),
        ai_recipe:ai_generated_recipes(*)
      `)
      .eq('meal_plan_id', mealPlanId)
      .order('date', { ascending: true })
      .order('meal_type', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    }

    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    const { data: items, error } = await query;

    if (error) {
      logger.error('Failed to fetch meal plan items', 'meal-planning/[id]/items/GET', error);
      return NextResponse.json(
        { error: 'Failed to fetch meal plan items' },
        { status: 500 }
      );
    }

    logger.info('Successfully fetched meal plan items', 'meal-planning/[id]/items/GET', {
      userId: user.id,
      mealPlanId,
      count: items?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: items || []
    });

  } catch (error) {
    logger.error('Error in meal plan items GET endpoint', 'meal-planning/[id]/items/GET', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/meal-planning/[id]/items - Add or update meal plan items
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: mealPlanId } = params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing or invalid items array' },
        { status: 400 }
      );
    }

    // Verify user owns the meal plan
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, start_date, end_date')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Validate dates are within plan range
    const planStart = new Date(plan.start_date);
    const planEnd = new Date(plan.end_date);
    
    for (const item of items) {
      if (!item.date || !item.mealType) {
        return NextResponse.json(
          { error: 'Each item must have date and mealType' },
          { status: 400 }
        );
      }

      const itemDate = new Date(item.date);
      if (itemDate < planStart || itemDate > planEnd) {
        return NextResponse.json(
          { error: `Item date ${item.date} is outside meal plan range` },
          { status: 400 }
        );
      }
    }

    // Process items - use upsert to handle duplicates
    const processedItems = [];

    for (const item of items) {
      const itemData = {
        meal_plan_id: mealPlanId,
        recipe_id: item.recipeId || null,
        date: item.date,
        meal_type: item.mealType,
        servings: item.servings || 1,
        is_completed: item.isCompleted || false,
        custom_recipe: item.customRecipe || null,
        nutritional_info: item.nutritionalInfo || {},
        notes: item.notes || null
      };

      const { data: upsertedItem, error: upsertError } = await supabase
        .from('meal_plan_items')
        .upsert(itemData, {
          onConflict: 'meal_plan_id,date,meal_type',
          returning: 'representation'
        })
        .select(`
          *,
          recipe:recipes(*),
          ai_recipe:ai_generated_recipes(*)
        `)
        .single();

      if (upsertError) {
        logger.error('Failed to upsert meal plan item', 'meal-planning/[id]/items/POST', upsertError);
        continue;
      }

      processedItems.push(upsertedItem);
    }

    // Log to history
    await supabase
      .from('meal_plan_history')
      .insert({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        action: 'items_updated',
        details: { 
          itemsCount: processedItems.length,
          dates: [...new Set(items.map(i => i.date))]
        }
      });

    logger.info('Successfully updated meal plan items', 'meal-planning/[id]/items/POST', {
      userId: user.id,
      mealPlanId,
      itemsProcessed: processedItems.length
    });

    return NextResponse.json({
      success: true,
      data: processedItems
    });

  } catch (error) {
    logger.error('Error in meal plan items POST endpoint', 'meal-planning/[id]/items/POST', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/meal-planning/[id]/items - Delete meal plan items
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: mealPlanId } = params;
    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    const date = searchParams.get('date');
    const mealType = searchParams.get('mealType');

    // Verify user owns the meal plan
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Build delete query
    let query = supabase
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', mealPlanId);

    if (itemId) {
      query = query.eq('id', itemId);
    } else if (date && mealType) {
      query = query.eq('date', date).eq('meal_type', mealType);
    } else {
      return NextResponse.json(
        { error: 'Must provide either itemId or both date and mealType' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      logger.error('Failed to delete meal plan items', 'meal-planning/[id]/items/DELETE', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete meal plan items' },
        { status: 500 }
      );
    }

    // Log to history
    await supabase
      .from('meal_plan_history')
      .insert({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        action: 'items_deleted',
        details: { itemId, date, mealType }
      });

    logger.info('Successfully deleted meal plan items', 'meal-planning/[id]/items/DELETE', {
      userId: user.id,
      mealPlanId,
      criteria: { itemId, date, mealType }
    });

    return NextResponse.json({
      success: true,
      message: 'Meal plan items deleted successfully'
    });

  } catch (error) {
    logger.error('Error in meal plan items DELETE endpoint', 'meal-planning/[id]/items/DELETE', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}