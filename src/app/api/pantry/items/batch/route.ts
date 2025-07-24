import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { 
  BatchPantryOperation, 
  BatchOperationResult, 
  PantryAPIResponse 
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

    const operation: BatchPantryOperation = await request.json();

    let result: BatchOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    switch (operation.operation) {
      case 'add':
        result = await handleBatchAdd(supabase, user.id, operation);
        break;
      case 'update':
        result = await handleBatchUpdate(supabase, user.id, operation);
        break;
      case 'delete':
        result = await handleBatchDelete(supabase, user.id, operation);
        break;
      case 'move':
        result = await handleBatchMove(supabase, user.id, operation);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid batch operation' },
          { status: 400 }
        );
    }

    const response: PantryAPIResponse<BatchOperationResult> = {
      data: result,
      success: result.success,
      message: `Batch ${operation.operation} completed. Processed: ${result.processed}, Failed: ${result.failed}`,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/pantry/items/batch:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { item_ids }: { item_ids: string[] } = await request.json();

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid item IDs' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .in('id', item_ids)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting pantry items:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete pantry items' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<null> = {
      data: null,
      success: true,
      message: `Successfully deleted ${item_ids.length} items`,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in DELETE /api/pantry/items/batch:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for batch operations
async function handleBatchAdd(
  supabase: any,
  userId: string,
  operation: BatchPantryOperation
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const item of operation.items) {
    try {
      // Validate required fields
      if (!item.ingredient_name || !item.quantity || !item.unit) {
        result.failed++;
        result.errors.push({
          item_id: item.id || 'unknown',
          error: 'Missing required fields',
        });
        continue;
      }

      // Check if ingredient exists
      let ingredientId = item.ingredient_id;
      
      if (!ingredientId) {
        const { data: existingIngredient } = await supabase
          .from('ingredients')
          .select('id')
          .eq('name', item.ingredient_name.trim())
          .single();

        if (existingIngredient) {
          ingredientId = existingIngredient.id;
        } else {
          // Create new ingredient
          const { data: newIngredient, error: ingredientError } = await supabase
            .from('ingredients')
            .insert({
              name: item.ingredient_name.trim(),
              category: item.category || 'Other',
              default_unit: item.unit,
              common_units: [item.unit],
            })
            .select('id')
            .single();

          if (ingredientError) {
            result.failed++;
            result.errors.push({
              item_id: item.id || 'unknown',
              error: 'Failed to create ingredient',
            });
            continue;
          }

          ingredientId = newIngredient.id;
        }
      }

      // Create pantry item
      const pantryItem = {
        user_id: userId,
        ingredient_id: ingredientId,
        ingredient_name: item.ingredient_name.trim(),
        quantity: item.quantity,
        unit: item.unit,
        expiration_date: item.expiration_date || operation.expiration_date || null,
        location: item.location || operation.location || null,
        category: item.category || null,
        cost: item.cost || null,
        notes: item.notes || null,
        purchase_date: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('pantry_items')
        .insert(pantryItem);

      if (error) {
        result.failed++;
        result.errors.push({
          item_id: item.id || 'unknown',
          error: 'Failed to create pantry item',
        });
      } else {
        result.processed++;
      }
    } catch (error: unknown) {
      result.failed++;
      result.errors.push({
        item_id: item.id || 'unknown',
        error: 'Unexpected error during creation',
      });
    }
  }

  result.success = result.failed === 0;
  return result;
}

async function handleBatchUpdate(
  supabase: any,
  userId: string,
  operation: BatchPantryOperation
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const item of operation.items) {
    try {
      if (!item.id) {
        result.failed++;
        result.errors.push({
          item_id: 'unknown',
          error: 'Missing item ID',
        });
        continue;
      }

      // Build update object
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (item.ingredient_name !== undefined) updates.ingredient_name = item.ingredient_name;
      if (item.quantity !== undefined) updates.quantity = item.quantity;
      if (item.unit !== undefined) updates.unit = item.unit;
      if (item.expiration_date !== undefined || operation.expiration_date) {
        updates.expiration_date = item.expiration_date || operation.expiration_date || null;
      }
      if (item.location !== undefined || operation.location) {
        updates.location = item.location || operation.location || null;
      }
      if (item.category !== undefined) updates.category = item.category || null;
      if (item.cost !== undefined) updates.cost = item.cost || null;
      if (item.notes !== undefined) updates.notes = item.notes || null;

      const { error } = await supabase
        .from('pantry_items')
        .update(updates)
        .eq('id', item.id)
        .eq('user_id', userId);

      if (error) {
        result.failed++;
        result.errors.push({
          item_id: item.id,
          error: 'Failed to update pantry item',
        });
      } else {
        result.processed++;
      }
    } catch (error: unknown) {
      result.failed++;
      result.errors.push({
        item_id: item.id || 'unknown',
        error: 'Unexpected error during update',
      });
    }
  }

  result.success = result.failed === 0;
  return result;
}

async function handleBatchDelete(
  supabase: any,
  userId: string,
  operation: BatchPantryOperation
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  const itemIds = operation.items
    .map((item) => item.id)
    .filter((id): id is string => id !== undefined);

  if (itemIds.length === 0) {
    result.success = false;
    result.errors.push({
      item_id: 'unknown',
      error: 'No valid item IDs provided',
    });
    return result;
  }

  try {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .in('id', itemIds)
      .eq('user_id', userId);

    if (error) {
      result.failed = itemIds.length;
      result.errors.push({
        item_id: 'batch',
        error: 'Failed to delete items',
      });
    } else {
      result.processed = itemIds.length;
    }
  } catch (error: unknown) {
    result.failed = itemIds.length;
    result.errors.push({
      item_id: 'batch',
      error: 'Unexpected error during deletion',
    });
  }

  result.success = result.failed === 0;
  return result;
}

async function handleBatchMove(
  supabase: any,
  userId: string,
  operation: BatchPantryOperation
): Promise<BatchOperationResult> {
  const result: BatchOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  if (!operation.location) {
    result.success = false;
    result.errors.push({
      item_id: 'batch',
      error: 'Target location not specified',
    });
    return result;
  }

  const itemIds = operation.items
    .map((item) => item.id)
    .filter((id): id is string => id !== undefined);

  if (itemIds.length === 0) {
    result.success = false;
    result.errors.push({
      item_id: 'unknown',
      error: 'No valid item IDs provided',
    });
    return result;
  }

  try {
    const { error } = await supabase
      .from('pantry_items')
      .update({
        location: operation.location,
        updated_at: new Date().toISOString(),
      })
      .in('id', itemIds)
      .eq('user_id', userId);

    if (error) {
      result.failed = itemIds.length;
      result.errors.push({
        item_id: 'batch',
        error: 'Failed to move items',
      });
    } else {
      result.processed = itemIds.length;
    }
  } catch (error: unknown) {
    result.failed = itemIds.length;
    result.errors.push({
      item_id: 'batch',
      error: 'Unexpected error during move',
    });
  }

  result.success = result.failed === 0;
  return result;
}