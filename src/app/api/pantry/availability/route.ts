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

    // Get recipe details
    const recipe = await db.getRecipeById(recipeId, user.id);
    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
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

    const recipeAvailability: RecipeAvailability = {
      recipe_id: recipeId,
      recipe_name: recipe.title,
      overall_availability: overallAvailability,
      can_make: canMake,
      ingredients: ingredientAvailabilities,
      missing_ingredients: missingIngredients,
      servings_possible: Math.max(0, maxServingsPossible)
    };

    return NextResponse.json(recipeAvailability);
  } catch (error: unknown) {
    logger.error('Unexpected error in GET /api/pantry/availability:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: {
      recipe_ingredients: RecipeIngredient[];
      generate_shopping_list?: boolean;
      existing_shopping_list?: ShoppingListItem[];
    } = await request.json();

    if (!body.recipe_ingredients || !Array.isArray(body.recipe_ingredients)) {
      return NextResponse.json(
        { success: false, message: 'Invalid recipe ingredients' },
        { status: 400 }
      );
    }

    // Get user's pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id);

    if (pantryError) {
      logger.error('Error fetching pantry items:', 'API:route', pantryError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry items' },
        { status: 500 }
      );
    }

    // Transform pantry items to the expected format
    const transformedPantryItems: PantryItem[] = pantryItems?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      ingredient_id: item.ingredient_id,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      expiration_date: item.expiration_date ? new Date(item.expiration_date) : undefined,
      location: item.location,
      category: item.category,
      purchase_date: item.purchase_date ? new Date(item.purchase_date) : undefined,
      cost: item.cost,
      notes: item.notes,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
    })) || [];

    // Check availability
    const availability = checkPantryAvailability(body.recipe_ingredients, transformedPantryItems);

    let shoppingList: ShoppingListItem[] | undefined;
    if (body.generate_shopping_list) {
      shoppingList = generateShoppingList(
        body.recipe_ingredients,
        availability,
        body.existing_shopping_list
      );
    }

    const responseData: {
      availability: PantryAvailability[];
      shopping_list?: ShoppingListItem[];
      summary: {
        total_ingredients: number;
        available_ingredients: number;
        missing_ingredients: number;
        availability_percentage: number;
      };
    } = {
      availability,
      summary: {
        total_ingredients: availability.length,
        available_ingredients: availability.filter(a => a.sufficient).length,
        missing_ingredients: availability.filter(a => !a.sufficient).length,
        availability_percentage: Math.round(
          (availability.filter(a => a.sufficient).length / availability.length) * 100
        ),
      };

    if (shoppingList) {
      responseData.shopping_list = shoppingList;
    }

    const response: PantryAPIResponse<typeof responseData> = {
      data: responseData,
      success: true,
      message: 'Pantry availability checked successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in POST /api/pantry/availability:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}