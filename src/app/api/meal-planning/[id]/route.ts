import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/meal-planning/[id] - Get specific meal plan
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

    const { id } = params;

    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_items(
          *,
          recipe:recipes(*),
          ai_recipe:ai_generated_recipes(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Meal plan not found' },
          { status: 404 }
        );
      }
      
      logger.error('Failed to fetch meal plan', 'meal-planning/[id]/GET', error);
      return NextResponse.json(
        { error: 'Failed to fetch meal plan' },
        { status: 500 }
      );
    }

    // Calculate nutritional stats
    const { data: stats } = await supabase
      .rpc('calculate_meal_plan_stats', { p_meal_plan_id: id });

    logger.info('Successfully fetched meal plan', 'meal-planning/[id]/GET', {
      userId: user.id,
      mealPlanId: id
    });

    return NextResponse.json({
      success: true,
      data: {
        ...mealPlan,
        stats: stats || []
      }
    });

  } catch (error) {
    logger.error('Error in meal plan GET endpoint', 'meal-planning/[id]/GET', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/meal-planning/[id] - Update specific meal plan
export async function PUT(req: NextRequest, { params }: Params) {
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

    const { id } = params;
    const body = await req.json();

    // Check if meal plan exists and belongs to user
    const { data: existingPlan, error: checkError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    const { 
      name, 
      startDate, 
      endDate, 
      preferences,
      nutritionalGoals,
      isActive
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (nutritionalGoals !== undefined) updateData.nutritional_goals = nutritionalGoals;
    if (isActive !== undefined) updateData.is_active = isActive;

    // If setting as active, deactivate other plans
    if (isActive === true) {
      await supabase
        .from('meal_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', id);
    }

    const { data: updatedPlan, error: updateError } = await supabase
      .from('meal_plans')
      .update(updateData)
      .eq('id', id)
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
      logger.error('Failed to update meal plan', 'meal-planning/[id]/PUT', updateError);
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
        meal_plan_id: id,
        action: 'updated',
        details: updateData
      });

    logger.info('Successfully updated meal plan', 'meal-planning/[id]/PUT', {
      userId: user.id,
      mealPlanId: id,
      updates: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: updatedPlan
    });

  } catch (error) {
    logger.error('Error in meal plan update endpoint', 'meal-planning/[id]/PUT', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/meal-planning/[id] - Delete specific meal plan
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

    const { id } = params;

    // Check if meal plan exists and belongs to user
    const { data: existingPlan, error: checkError } = await supabase
      .from('meal_plans')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Log to history before deletion
    await supabase
      .from('meal_plan_history')
      .insert({
        user_id: user.id,
        meal_plan_id: id,
        action: 'deleted',
        details: { 
          deletedAt: new Date().toISOString(),
          planName: existingPlan.name
        }
      });

    // Delete meal plan (items will cascade delete)
    const { error: deleteError } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Failed to delete meal plan', 'meal-planning/[id]/DELETE', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete meal plan' },
        { status: 500 }
      );
    }

    logger.info('Successfully deleted meal plan', 'meal-planning/[id]/DELETE', {
      userId: user.id,
      mealPlanId: id,
      planName: existingPlan.name
    });

    return NextResponse.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    logger.error('Error in meal plan delete endpoint', 'meal-planning/[id]/DELETE', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}