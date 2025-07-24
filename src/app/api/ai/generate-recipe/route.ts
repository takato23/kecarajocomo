import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { UnifiedAIService } from '@/services/ai';
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
    
    // Validate required fields
    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    // Generate recipe using AI
    const aiService = new UnifiedAIService();
    const generatedRecipe = await aiService.generateRecipe({
      ingredients: body.ingredients,
      preferences: {
        dietary: body.dietaryRestrictions,
        cuisine: body.cuisinePreference,
        difficulty: body.difficulty,
        servings: body.servings,
        maxCookTime: body.maxTime,
      }
    });

    // Optionally save to database if requested
    if (body.save) {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          ...generatedRecipe,
          user_id: session.user.id,
          is_public: false,
          source: 'ai_generated',
        })
        .select()
        .single();

      if (recipeError) {
        console.error('Failed to save recipe:', recipeError);
      } else {
        generatedRecipe.id = recipe.id;
      }
    }

    return NextResponse.json({ recipe: generatedRecipe });
  } catch (error: unknown) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}