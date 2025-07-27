import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getUser } from '@/lib/auth/supabase-auth';
import { db } from '@/lib/supabase/database.service';

interface IngredientAvailability {
  ingredient_name: string;
  required_quantity: number;
  available_quantity: number;
  unit: string;
  availability_percentage: number;
  sufficient: boolean;
  shortage: number;
}

interface RecipeAvailability {
  recipe_id: string;
  recipe_name: string;
  overall_availability: number;
  can_make: boolean;
  ingredients: IngredientAvailability[];
  missing_ingredients: string[];
  servings_possible: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipe_ids, servings = 1 } = body;

    if (!recipe_ids || !Array.isArray(recipe_ids)) {
      return NextResponse.json(
        { error: 'recipe_ids array is required' },
        { status: 400 }
      );
    }

    // Get user's pantry items
    const pantryItems = await db.getPantryItems(user.id);

    // Create pantry availability map
    const pantryMap = new Map<string, { quantity: number; unit: string }>();
    pantryItems.forEach(item => {
      const ingredientName = item.ingredient?.name?.toLowerCase();
      if (ingredientName) {
        const existing = pantryMap.get(ingredientName);
        if (existing && existing.unit === item.unit) {
          existing.quantity += item.quantity;
        } else {
          pantryMap.set(ingredientName, {
            quantity: item.quantity,
            unit: item.unit
          });
        }
      }
    });

    const recipeAvailabilities: RecipeAvailability[] = [];

    // Check availability for each recipe
    for (const recipeId of recipe_ids) {
      try {
        const recipe = await db.getRecipeById(recipeId, user.id);
        if (!recipe) {
          logger.warn(`Recipe ${recipeId} not found for user ${user.id}`);
          continue;
        }

        const ingredientAvailabilities: IngredientAvailability[] = [];
        let totalAvailabilityScore = 0;
        let missingIngredients: string[] = [];
        let maxServingsPossible = servings;

        if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
          for (const recipeIngredient of recipe.recipe_ingredients) {
            const ingredientName = recipeIngredient.ingredient?.name?.toLowerCase();
            if (ingredientName) {
              const requiredQuantity = recipeIngredient.quantity * servings;
              const available = pantryMap.get(ingredientName);
              const availableQuantity = available?.quantity || 0;
              
              const availabilityPercentage = requiredQuantity > 0 
                ? Math.min(100, (availableQuantity / requiredQuantity) * 100)
                : 100;
              
              const sufficient = availableQuantity >= requiredQuantity;
              const shortage = Math.max(0, requiredQuantity - availableQuantity);

              // Calculate how many servings are possible with this ingredient
              const servingsPossibleForIngredient = recipeIngredient.quantity > 0
                ? Math.floor(availableQuantity / recipeIngredient.quantity)
                : servings;

              maxServingsPossible = Math.min(maxServingsPossible, servingsPossibleForIngredient);

              if (!sufficient) {
                missingIngredients.push(ingredientName);
              }

              ingredientAvailabilities.push({
                ingredient_name: ingredientName,
                required_quantity: requiredQuantity,
                available_quantity: availableQuantity,
                unit: recipeIngredient.unit,
                availability_percentage: Math.round(availabilityPercentage),
                sufficient,
                shortage
              });

              totalAvailabilityScore += availabilityPercentage;
            }
          }
        }

        const overallAvailability = ingredientAvailabilities.length > 0 
          ? Math.round(totalAvailabilityScore / ingredientAvailabilities.length)
          : 0;

        const canMake = missingIngredients.length === 0 && overallAvailability >= 100;

        recipeAvailabilities.push({
          recipe_id: recipeId,
          recipe_name: recipe.title,
          overall_availability: overallAvailability,
          can_make: canMake,
          ingredients: ingredientAvailabilities,
          missing_ingredients: missingIngredients,
          servings_possible: Math.max(0, maxServingsPossible)
        });

      } catch (error) {
        logger.error(`Error checking availability for recipe ${recipeId}:`, 'meal-planning/check-availability', error);
      }
    }

    return NextResponse.json({
      availabilities: recipeAvailabilities,
      pantry_summary: {
        total_items: pantryItems.length,
        total_ingredients: pantryMap.size
      }
    });

  } catch (error) {
    logger.error('Error checking pantry availability:', 'meal-planning/check-availability', error);
    return NextResponse.json(
      { error: 'Failed to check pantry availability' },
      { status: 500 }
    );
  }
}

// GET endpoint to check availability for a specific recipe
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const recipeId = searchParams.get('recipe_id');
    const servings = parseInt(searchParams.get('servings') || '1');

    if (!recipeId) {
      return NextResponse.json(
        { error: 'recipe_id parameter is required' },
        { status: 400 }
      );
    }

    // Use the POST endpoint logic for a single recipe
    const response = await fetch(request.url.replace('/check-availability', '/check-availability'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe_ids: [recipeId],
        servings
      })
    });

    const data = await response.json();
    
    // Return just the single recipe availability
    if (data.availabilities && data.availabilities.length > 0) {
      return NextResponse.json(data.availabilities[0]);
    } else {
      return NextResponse.json(
        { error: 'Recipe not found or no availability data' },
        { status: 404 }
      );
    }

  } catch (error) {
    logger.error('Error in GET pantry availability:', 'meal-planning/check-availability', error);
    return NextResponse.json(
      { error: 'Failed to check recipe availability' },
      { status: 500 }
    );
  }
}