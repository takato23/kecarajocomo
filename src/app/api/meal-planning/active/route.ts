import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// GET /api/meal-planning/active - Get active meal plan
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

    // Get active meal plan using the database function
    const { data: activePlan, error: rpcError } = await supabase
      .rpc('get_active_meal_plan', { p_user_id: user.id })
      .single();

    if (rpcError && rpcError.code !== 'PGRST116') {
      logger.error('Failed to fetch active meal plan', 'meal-planning/active/GET', rpcError);
      return NextResponse.json(
        { error: 'Failed to fetch active meal plan' },
        { status: 500 }
      );
    }

    if (!activePlan) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active meal plan found'
      });
    }

    // Fetch complete plan with items
    const { data: fullPlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_items(
          *,
          recipe:recipes(*),
          ai_recipe:ai_generated_recipes(*)
        )
      `)
      .eq('id', activePlan.id)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch complete active meal plan', 'meal-planning/active/GET', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch complete meal plan' },
        { status: 500 }
      );
    }

    // Calculate nutritional stats
    const { data: stats } = await supabase
      .rpc('calculate_meal_plan_stats', { p_meal_plan_id: activePlan.id });

    logger.info('Successfully fetched active meal plan', 'meal-planning/active/GET', {
      userId: user.id,
      mealPlanId: activePlan.id,
      name: activePlan.name
    });

    return NextResponse.json({
      success: true,
      data: {
        ...fullPlan,
        stats: stats || []
      }
    });

  } catch (error) {
    logger.error('Error in active meal plan GET endpoint', 'meal-planning/active/GET', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/meal-planning/active - Set active meal plan
export async function PUT(req: NextRequest) {
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
    const { mealPlanId } = body;

    if (!mealPlanId) {
      return NextResponse.json(
        { error: 'Missing mealPlanId' },
        { status: 400 }
      );
    }

    // Verify user owns the meal plan
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, name')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Deactivate all other plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .neq('id', mealPlanId);

    // Activate the specified plan
    const { data: updatedPlan, error: updateError } = await supabase
      .from('meal_plans')
      .update({ is_active: true })
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .select(`
        *,
        meal_plan_items(
          *,
          recipe:recipes(*)
        )
      `)
      .single();

    if (updateError) {
      logger.error('Failed to set active meal plan', 'meal-planning/active/PUT', updateError);
      return NextResponse.json(
        { error: 'Failed to set active meal plan' },
        { status: 500 }
      );
    }

    // Log to history
    await supabase
      .from('meal_plan_history')
      .insert({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        action: 'activated',
        details: { planName: plan.name }
      });

    logger.info('Successfully set active meal plan', 'meal-planning/active/PUT', {
      userId: user.id,
      mealPlanId,
      planName: plan.name
    });

    return NextResponse.json({
      success: true,
      data: updatedPlan
    });

  } catch (error) {
    logger.error('Error in active meal plan PUT endpoint', 'meal-planning/active/PUT', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}