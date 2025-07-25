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

    // Get user's pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select(`
        *,
        ingredient:ingredients(name)
      `)
      .eq('user_id', session.user.id);

    if (pantryError) {
      return NextResponse.json({ error: pantryError.message }, { status: 500 });
    }

    if (!pantryItems || pantryItems.length === 0) {
      return NextResponse.json(
        { error: 'No items found in pantry' },
        { status: 400 }
      );
    }

    // Extract ingredient names
    const ingredientNames = pantryItems
      .map(item => item.ingredient?.name)
      .filter(Boolean) as string[];

    // Get recipe suggestions from AI service
    const aiService = getAIService();
    const suggestions = await aiService.suggestRecipesFromPantry(ingredientNames);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to suggest recipes';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}