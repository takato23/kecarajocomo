import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getUser } from '@/lib/auth/supabase-auth';
import { pantryMealPlanningService } from '@/lib/services/pantryMealPlanningService';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      start_date,
      end_date,
      preferences = {},
      optimization_focus = 'waste_reduction'
    } = body;

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    const dateRange = {
      start_date: new Date(start_date),
      end_date: new Date(end_date)
    };

    logger.info('Generating pantry-optimized meal plan', 'meal-planning/pantry-optimized', {
      userId: user.id,
      dateRange: `${start_date} to ${end_date}`,
      preferences
    });

    const mealPlan = await pantryMealPlanningService.generatePantryOptimizedPlan(
      user.id,
      preferences,
      dateRange
    );

    return NextResponse.json({
      success: true,
      meal_plan: mealPlan,
      optimization_focus,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating pantry-optimized meal plan:', 'meal-planning/pantry-optimized', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate pantry-optimized meal plan'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for expiring ingredient suggestions
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const daysAhead = parseInt(searchParams.get('days_ahead') || '3');
    const action = searchParams.get('action') || 'expiring_suggestions';

    if (action === 'expiring_suggestions') {
      logger.info('Getting expiring ingredient suggestions', 'meal-planning/pantry-optimized', {
        userId: user.id,
        daysAhead
      });

      const suggestions = await pantryMealPlanningService.suggestRecipesForExpiringItems(
        user.id,
        daysAhead
      );

      return NextResponse.json({
        success: true,
        suggestions,
        days_ahead: daysAhead,
        generated_at: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Error in GET pantry-optimized endpoint:', 'meal-planning/pantry-optimized', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pantry suggestions'
      },
      { status: 500 }
    );
  }
}