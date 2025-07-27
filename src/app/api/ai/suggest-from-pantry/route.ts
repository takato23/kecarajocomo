import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { getUser } from '@/lib/auth/supabase-auth';
import { db } from '@/lib/supabase/database.service';
import { GeminiService } from '@/services/ai/GeminiService';

interface AvailableIngredient {
  name: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
}

interface RecipePreferences {
  mealType: string;
  difficulty: string;
  maxCookTime: number;
  dietary: string[];
  servings: number;
}

async function generatePantryBasedRecipes(
  ingredients: AvailableIngredient[],
  preferences: RecipePreferences
) {
  const gemini = new GeminiService();
  
  const prompt = `
Based on the following available pantry ingredients, suggest 3-5 recipes that can be made:

Available Ingredients:
${ingredients.map(ing => `- ${ing.name} (${ing.quantity} ${ing.unit})`).join('\n')}

Preferences:
- Meal Type: ${preferences.mealType}
- Difficulty: ${preferences.difficulty}
- Max Cook Time: ${preferences.maxCookTime} minutes
- Dietary Restrictions: ${preferences.dietary.join(', ') || 'None'}
- Servings: ${preferences.servings}

For each recipe, provide:
1. Recipe name
2. Description (2-3 sentences)
3. Ingredients needed from pantry (with quantities)
4. Additional ingredients needed (if any)
5. Prep time and cook time
6. Difficulty level
7. Brief cooking instructions
8. Percentage of ingredients available from pantry

Prioritize recipes that:
- Use ingredients close to expiration first
- Require minimal additional ingredients
- Match the specified preferences
- Are practical and achievable

Return the response as a JSON array of recipe objects.
`;

  try {
    const response = await gemini.generateContent(prompt);
    return JSON.parse(response);
  } catch (error) {
    logger.error('Error generating pantry recipes:', 'PantryService', error);
    throw new Error('Failed to generate recipe suggestions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's pantry items
    const pantryItems = await db.getPantryItems(user.id);

    if (!pantryItems || pantryItems.length === 0) {
      return NextResponse.json(
        { error: 'No items found in pantry' },
        { status: 400 }
      );
    }

    // Extract ingredient names and quantities
    const availableIngredients = pantryItems.map(item => ({
      name: item.ingredient?.name || '',
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expiration_date
    })).filter(item => item.name);

    // Get optional request body for preferences
    const body = await request.json().catch(() => ({}));
    const { 
      mealType = 'any',
      difficulty = 'any',
      maxCookTime = 60,
      dietary = [],
      servings = 4
    } = body;

    // Get recipe suggestions using AI service
    const suggestions = await generatePantryBasedRecipes(
      availableIngredients,
      {
        mealType,
        difficulty,
        maxCookTime,
        dietary,
        servings
      }
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    logger.error('Recipe suggestion error:', 'API:route', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to suggest recipes';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}