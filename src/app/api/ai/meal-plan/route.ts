import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { getAIService } from '@/services/ai';
import type { Database } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Generate meal plan using AI service
    const aiService = getAIService();
    const mealPlan = await aiService.generateMealPlan({
      days: body.days || 7,
      peopleCount: body.peopleCount || preferences?.household_size || 2,
      dietary: body.dietaryRestrictions || preferences?.dietary_restrictions || [],
      cuisines: body.cuisinePreferences || preferences?.cuisine_preferences || [],
      budget: body.budget || 'medium',
      goals: body.nutritionGoals || [preferences?.nutrition_goals?.type || 'balanced'],
    });

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate meal plan';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}