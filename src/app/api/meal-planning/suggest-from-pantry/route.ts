import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';
import { UserPreferences } from '@/lib/types/mealPlanning';

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
    const { preferences } = body;

    // Build user preferences with defaults if not provided
    const userPreferences: UserPreferences = {
      userId: user.id,
      dietaryRestrictions: preferences?.dietaryRestrictions || [],
      allergies: preferences?.allergies || [],
      favoriteCuisines: preferences?.favoriteCuisines || [],
      cookingSkillLevel: preferences?.cookingSkillLevel || 'intermediate',
      householdSize: preferences?.householdSize || 2,
      weeklyBudget: preferences?.weeklyBudget,
      preferredMealTypes: preferences?.preferredMealTypes || ['breakfast', 'lunch', 'dinner'],
      avoidIngredients: preferences?.avoidIngredients || [],
      nutritionalGoals: preferences?.nutritionalGoals || {},
      planningStrategy: preferences?.planningStrategy || 'nutrition-focused',
      maxPrepTimePerMeal: preferences?.maxPrepTimePerMeal || 60,
      batchCookingPreference: preferences?.batchCookingPreference || false,
      leftoverTolerance: preferences?.leftoverTolerance || 0.5
    };

    logger.info('Suggesting recipes from pantry', 'meal-planning/suggest-from-pantry', {
      userId: user.id
    });

    const suggestions = await geminiPlannerService.suggestFromPantry(
      user.id,
      userPreferences
    );

    if (!suggestions || suggestions.length === 0) {
      logger.warn('No recipes suggested from pantry', 'meal-planning/suggest-from-pantry', {
        userId: user.id
      });
      
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No recipes could be suggested with current pantry items'
      });
    }

    logger.info('Successfully suggested recipes from pantry', 'meal-planning/suggest-from-pantry', {
      userId: user.id,
      count: suggestions.length
    });

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    logger.error('Error in pantry recipe suggestion endpoint', 'meal-planning/suggest-from-pantry', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}