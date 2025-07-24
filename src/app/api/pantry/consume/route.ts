import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { consumeIngredientsFromPantry } from '@/features/pantry/utils/mealPlanIntegration';
import type { 
  PantryAPIResponse, 
  RecipeIngredient,
  PantryItem 
} from '@/features/pantry/types';

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
      servings: number;
      recipe_id?: string;
      recipe_name?: string;
      dry_run?: boolean; // If true, just calculate what would be consumed without updating
    } = await request.json();

    if (!body.recipe_ingredients || !Array.isArray(body.recipe_ingredients)) {
      return NextResponse.json(
        { success: false, message: 'Invalid recipe ingredients' },
        { status: 400 }
      );
    }

    if (!body.servings || body.servings < 1) {
      return NextResponse.json(
        { success: false, message: 'Invalid servings count' },
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

    // Calculate consumption
    const { consumed, remaining } = consumeIngredientsFromPantry(
      body.recipe_ingredients,
      transformedPantryItems,
      body.servings
    );

    // If dry run, just return the calculation
    if (body.dry_run) {
      const response: PantryAPIResponse<{
        consumed: typeof consumed;
        items_to_update: number;
        items_to_remove: number;
        fully_consumed_items: string[];
      }> = {
        data: {
          consumed,
          items_to_update: consumed.filter(c => {
            const originalItem = transformedPantryItems.find(item => item.id === c.pantryItemId);
            return originalItem && (originalItem.quantity - c.consumedQuantity) > 0;
          }).length,
          items_to_remove: consumed.filter(c => {
            const originalItem = transformedPantryItems.find(item => item.id === c.pantryItemId);
            return originalItem && (originalItem.quantity - c.consumedQuantity) <= 0;
          }).length,
          fully_consumed_items: consumed
            .filter(c => {
              const originalItem = transformedPantryItems.find(item => item.id === c.pantryItemId);
              return originalItem && (originalItem.quantity - c.consumedQuantity) <= 0;
            })
            .map(c => {
              const originalItem = transformedPantryItems.find(item => item.id === c.pantryItemId);
              return originalItem?.ingredient_name || 'Unknown';
            }),
        },
        success: true,
        message: 'Consumption calculated (dry run)',
      };

      return NextResponse.json(response);
    }

    // Actually update the pantry items
    const updatePromises: any[] = [];
    const itemsToRemove: string[] = [];

    consumed.forEach(({ pantryItemId, consumedQuantity }) => {
      const originalItem = transformedPantryItems.find(item => item.id === pantryItemId);
      if (!originalItem) return;

      const newQuantity = originalItem.quantity - consumedQuantity;

      if (newQuantity <= 0.001) {
        // Remove item if quantity is negligible
        itemsToRemove.push(pantryItemId);
      } else {
        // Update item quantity
        updatePromises.push(
          supabase
            .from('pantry_items')
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pantryItemId)
            .eq('user_id', user.id)
            .select()
        );
      }
    });

    // Remove fully consumed items
    if (itemsToRemove.length > 0) {
      updatePromises.push(
        supabase
          .from('pantry_items')
          .delete()
          .in('id', itemsToRemove)
          .eq('user_id', user.id)
          .select()
      );
    }

    // Execute all updates
    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.error('Errors updating pantry after consumption:', errors);
      return NextResponse.json(
        { success: false, message: 'Failed to update pantry items' },
        { status: 500 }
      );
    }

    // Log cooking event (optional - for analytics)
    if (body.recipe_id || body.recipe_name) {
      try {
        await supabase.from('cooking_events').insert({
          user_id: user.id,
          recipe_id: body.recipe_id,
          recipe_name: body.recipe_name || 'Unknown Recipe',
          servings: body.servings,
          ingredients_consumed: consumed.length,
          cooked_at: new Date().toISOString(),
        });
      } catch (error: unknown) {
        // Don't fail the request if logging fails
        console.error('Failed to log cooking event:', error);
      }
    }

    const response: PantryAPIResponse<{
      consumed: typeof consumed;
      items_updated: number;
      items_removed: number;
      fully_consumed_items: string[];
    }> = {
      data: {
        consumed,
        items_updated: updatePromises.length - (itemsToRemove.length > 0 ? 1 : 0),
        items_removed: itemsToRemove.length,
        fully_consumed_items: itemsToRemove.map(id => {
          const item = transformedPantryItems.find(item => item.id === id);
          return item?.ingredient_name || 'Unknown';
        }),
      },
      success: true,
      message: `Successfully consumed ingredients for ${body.servings} serving${body.servings !== 1 ? 's' : ''}`,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/pantry/consume:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}