import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { claudeService } from '@/lib/ai/claude';
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

    // Generate meal plan using Claude
    const mealPlan = await claudeService.generateMealPlan({
      days: body.days || 7,
      peopleCount: body.peopleCount || preferences?.household_size || 2,
      dietaryRestrictions: body.dietaryRestrictions || preferences?.dietary_restrictions || [],
      cuisinePreferences: body.cuisinePreferences || preferences?.cuisine_preferences || [],
      budget: body.budget || 'medium',
      nutritionGoals: body.nutritionGoals || [preferences?.nutrition_goals?.type || 'balanced'],
    });

    return NextResponse.json({ mealPlan });
  } catch (error: unknown) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}