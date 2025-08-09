import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';
import { UserPreferences, PlanningConstraints } from '@/lib/types/mealPlanning';

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
    const { mealType, preferences, constraints, avoidRecipes } = body;

    // Validate required fields
    if (!mealType || !preferences || !constraints) {
      return NextResponse.json(
        { error: 'Missing required fields: mealType, preferences, and constraints' },
        { status: 400 }
      );
    }

    // Validate meal type
    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid meal type. Must be breakfast, lunch, or dinner' },
        { status: 400 }
      );
    }

    // Ensure user ID is set
    const userPreferences: UserPreferences = {
      ...preferences,
      userId: user.id
    };

    const planningConstraints: PlanningConstraints = {
      ...constraints,
      startDate: new Date(constraints.startDate),
      endDate: new Date(constraints.endDate)
    };

    logger.info('Regenerating meal', 'meal-planning/regenerate', {
      userId: user.id,
      mealType,
      avoidRecipes: avoidRecipes?.length || 0
    });

    const meal = await geminiPlannerService.regenerateMeal(
      mealType as 'breakfast' | 'lunch' | 'dinner',
      userPreferences,
      planningConstraints,
      avoidRecipes
    );

    if (!meal) {
      logger.error('Failed to regenerate meal', 'meal-planning/regenerate');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to regenerate meal'
        },
        { status: 500 }
      );
    }

    logger.info('Successfully regenerated meal', 'meal-planning/regenerate', {
      userId: user.id,
      mealType,
      mealName: meal.recipe.title
    });

    return NextResponse.json({
      success: true,
      meal
    });

  } catch (error) {
    logger.error('Error in meal regeneration endpoint', 'meal-planning/regenerate', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}