import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// GET /api/meal-planning - Get meal plans by date range
export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isActive = searchParams.get('active');

    // Build query
    let query = supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_items(
          *,
          recipe:recipes(*)
        )
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    // Apply filters
    if (startDate && endDate) {
      query = query
        .gte('end_date', startDate)
        .lte('start_date', endDate);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: mealPlans, error } = await query;

    if (error) {
      logger.error('Failed to fetch meal plans', 'meal-planning/GET', error);
      return NextResponse.json(
        { error: 'Failed to fetch meal plans' },
        { status: 500 }
      );
    }

    logger.info('Successfully fetched meal plans', 'meal-planning/GET', {
      userId: user.id,
      count: mealPlans?.length || 0,
      filters: { startDate, endDate, isActive }
    });

    return NextResponse.json({
      success: true,
      data: mealPlans || []
    });

  } catch (error) {
    logger.error('Error in meal plans GET endpoint', 'meal-planning/GET', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/meal-planning - Create or update meal plan
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { 
      id,
      name, 
      startDate, 
      endDate, 
      preferences,
      nutritionalGoals,
      items,
      setActive
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    let mealPlanId = id;

    // If setActive is true, deactivate other plans
    if (setActive) {
      await supabase
        .from('meal_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', mealPlanId || '00000000-0000-0000-0000-000000000000');
    }

    // Create or update meal plan
    if (mealPlanId) {
      // Update existing plan
      const { error: updateError } = await supabase
        .from('meal_plans')
        .update({
          name,
          start_date: startDate,
          end_date: endDate,
          preferences: preferences || {},
          nutritional_goals: nutritionalGoals || {},
          is_active: setActive || false
        })
        .eq('id', mealPlanId)
        .eq('user_id', user.id);

      if (updateError) {
        logger.error('Failed to update meal plan', 'meal-planning/POST', updateError);
        return NextResponse.json(
          { error: 'Failed to update meal plan' },
          { status: 500 }
        );
      }

      // Log to history
      await supabase
        .from('meal_plan_history')
        .insert({
          user_id: user.id,
          meal_plan_id: mealPlanId,
          action: 'updated',
          details: { name, startDate, endDate }
        });

    } else {
      // Create new plan
      const { data: newPlan, error: insertError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          name,
          start_date: startDate,
          end_date: endDate,
          preferences: preferences || {},
          nutritional_goals: nutritionalGoals || {},
          is_active: setActive || false
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create meal plan', 'meal-planning/POST', insertError);
        return NextResponse.json(
          { error: 'Failed to create meal plan' },
          { status: 500 }
        );
      }
      
      mealPlanId = newPlan.id;

      // Log to history
      await supabase
        .from('meal_plan_history')
        .insert({
          user_id: user.id,
          meal_plan_id: mealPlanId,
          action: 'created',
          details: { name, startDate, endDate }
        });
    }

    // Handle meal plan items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items if updating
      if (id) {
        await supabase
          .from('meal_plan_items')
          .delete()
          .eq('meal_plan_id', mealPlanId);
      }

      // Insert new items
      const itemsToInsert = items.map(item => ({
        meal_plan_id: mealPlanId,
        recipe_id: item.recipeId,
        date: item.date,
        meal_type: item.mealType,
        servings: item.servings || 1,
        is_completed: item.isCompleted || false,
        custom_recipe: item.customRecipe || null,
        nutritional_info: item.nutritionalInfo || {},
        notes: item.notes || null
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('meal_plan_items')
          .insert(itemsToInsert);

        if (itemsError) {
          logger.error('Failed to insert meal plan items', 'meal-planning/POST', itemsError);
          return NextResponse.json(
            { error: 'Failed to save meal plan items' },
            { status: 500 }
          );
        }
      }
    }

    // Fetch the complete meal plan with items
    const { data: mealPlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_items(
          *,
          recipe:recipes(*)
        )
      `)
      .eq('id', mealPlanId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch saved meal plan', 'meal-planning/POST', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch saved meal plan' },
        { status: 500 }
      );
    }

    logger.info('Successfully saved meal plan', 'meal-planning/POST', {
      userId: user.id,
      mealPlanId,
      action: id ? 'updated' : 'created'
    });

    return NextResponse.json({
      success: true,
      data: mealPlan
    });

  } catch (error) {
    logger.error('Error in meal plan save endpoint', 'meal-planning/POST', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/meal-planning - Delete meal plan
export async function DELETE(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing meal plan ID' },
        { status: 400 }
      );
    }

    // Log to history before deletion
    await supabase
      .from('meal_plan_history')
      .insert({
        user_id: user.id,
        meal_plan_id: id,
        action: 'deleted',
        details: { deletedAt: new Date().toISOString() }
      });

    // Delete meal plan (items will cascade delete)
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete meal plan', 'meal-planning/DELETE', error);
      return NextResponse.json(
        { error: 'Failed to delete meal plan' },
        { status: 500 }
      );
    }

    logger.info('Successfully deleted meal plan', 'meal-planning/DELETE', {
      userId: user.id,
      mealPlanId: id
    });

    return NextResponse.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    logger.error('Error in meal plan delete endpoint', 'meal-planning/DELETE', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}