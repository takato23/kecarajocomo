import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

import type { PantryItem, UpdatePantryItemForm, PantryAPIResponse } from '@/features/pantry/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { data: item, error } = await supabase
      .from('pantry_items')
      .select(`
        *,
        ingredients:ingredient_id (
          name,
          category,
          default_unit,
          common_units,
          average_shelf_life_days,
          storage_instructions
        )
      `)
      .eq('id', (await context.params).id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Pantry item not found' },
          { status: 404 }
        );
      }
      logger.error('Error fetching pantry item:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry item' },
        { status: 500 }
      );
    }

    const transformedItem: PantryItem = {
      id: item.id,
      user_id: item.user_id,
      ingredient_id: item.ingredient_id,
      ingredient_name: item.ingredient_name || item.ingredients?.name || 'Unknown',
      quantity: item.quantity,
      unit: item.unit,
      expiration_date: item.expiration_date ? new Date(item.expiration_date) : undefined,
      location: item.location,
      category: item.category || item.ingredients?.category,
      purchase_date: item.purchase_date ? new Date(item.purchase_date) : undefined,
      cost: item.cost,
      notes: item.notes,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
    };

    const response: PantryAPIResponse<PantryItem> = {
      data: transformedItem,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in GET /api/pantry/items/[id]:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const body: Partial<UpdatePantryItemForm> = await request.json();

    // Remove id from body to prevent update
    const { id, ...updateData } = body;

    // Build update object, only including fields that are provided
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.ingredient_name !== undefined) {
      updates.ingredient_name = updateData.ingredient_name;
    }
    if (updateData.quantity !== undefined) {
      updates.quantity = updateData.quantity;
    }
    if (updateData.unit !== undefined) {
      updates.unit = updateData.unit;
    }
    if (updateData.expiration_date !== undefined) {
      updates.expiration_date = updateData.expiration_date || null;
    }
    if (updateData.location !== undefined) {
      updates.location = updateData.location || null;
    }
    if (updateData.category !== undefined) {
      updates.category = updateData.category || null;
    }
    if (updateData.cost !== undefined) {
      updates.cost = updateData.cost || null;
    }
    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes || null;
    }

    // Update the pantry item
    const { data: updatedItem, error } = await supabase
      .from('pantry_items')
      .update(updates)
      .eq('id', (await context.params).id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Pantry item not found' },
          { status: 404 }
        );
      }
      logger.error('Error updating pantry item:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update pantry item' },
        { status: 500 }
      );
    }

    const transformedItem: PantryItem = {
      id: updatedItem.id,
      user_id: updatedItem.user_id,
      ingredient_id: updatedItem.ingredient_id,
      ingredient_name: updatedItem.ingredient_name,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      expiration_date: updatedItem.expiration_date ? new Date(updatedItem.expiration_date) : undefined,
      location: updatedItem.location,
      category: updatedItem.category,
      purchase_date: updatedItem.purchase_date ? new Date(updatedItem.purchase_date) : undefined,
      cost: updatedItem.cost,
      notes: updatedItem.notes,
      created_at: new Date(updatedItem.created_at),
      updated_at: new Date(updatedItem.updated_at),
    };

    const response: PantryAPIResponse<PantryItem> = {
      data: transformedItem,
      success: true,
      message: 'Pantry item updated successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in PUT /api/pantry/items/[id]:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', (await context.params).id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error deleting pantry item:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete pantry item' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<null> = {
      data: null,
      success: true,
      message: 'Pantry item deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in DELETE /api/pantry/items/[id]:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}