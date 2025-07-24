import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { checkPantryAvailability, generateShoppingList } from '@/features/pantry/utils/mealPlanIntegration';
import type { 
  PantryAPIResponse, 
  PantryAvailability, 
  RecipeIngredient, 
  ShoppingListItem,
  PantryItem 
} from '@/features/pantry/types';

export async function GET(request: NextRequest) {
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

    // Get user's pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id);

    if (pantryError) {
      console.error('Error fetching pantry items:', pantryError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry items' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<{ items: PantryItem[] }> = {
      data: { items: pantryItems || [] },
      success: true,
      message: 'Pantry items retrieved successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/pantry/availability:', error);
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
      console.error('Error fetching pantry items:', pantryError);
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
      },
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
    console.error('Unexpected error in POST /api/pantry/availability:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}