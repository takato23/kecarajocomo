import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { 
  PantryItem, 
  AddPantryItemForm, 
  PantryAPIResponse 
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

    // Parse query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const expiringWithinDays = searchParams.get('expiring_within_days');
    const searchTerm = searchParams.get('search_term');
    const sortBy = searchParams.get('sort_by') || 'expiration_date';
    const sortOrder = searchParams.get('sort_order') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
      .eq('user_id', user.id);

    // Apply filters
    if (category) {
      query = query.eq('ingredients.category', category);
    }

    if (location) {
      query = query.eq('location', location);
    }

    if (expiringWithinDays) {
      const days = parseInt(expiringWithinDays);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      query = query.lte('expiration_date', cutoffDate.toISOString());
    }

    if (searchTerm) {
      query = query.or(`
        ingredient_name.ilike.%${searchTerm}%,
        category.ilike.%${searchTerm}%,
        location.ilike.%${searchTerm}%,
        notes.ilike.%${searchTerm}%
      `);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      console.error('Error fetching pantry items:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry items' },
        { status: 500 }
      );
    }

    // Transform data to include ingredient information
    const transformedItems: PantryItem[] = items?.map((item: any) => ({
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
    })) || [];

    const response: PantryAPIResponse<PantryItem[]> = {
      data: transformedItems,
      success: true,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/pantry/items:', error);
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

    const body: AddPantryItemForm = await request.json();

    // Validate required fields
    if (!body.ingredient_name || !body.quantity || !body.unit) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if ingredient exists, if not create it
    let ingredientId = null;
    
    const { data: existingIngredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('name', body.ingredient_name.trim())
      .single();

    if (existingIngredient) {
      ingredientId = existingIngredient.id;
    } else {
      // Create new ingredient
      const { data: newIngredient, error: ingredientError } = await supabase
        .from('ingredients')
        .insert({
          name: body.ingredient_name.trim(),
          category: body.category || 'Other',
          default_unit: body.unit,
          common_units: [body.unit],
        })
        .select('id')
        .single();

      if (ingredientError) {
        console.error('Error creating ingredient:', ingredientError);
        return NextResponse.json(
          { success: false, message: 'Failed to create ingredient' },
          { status: 500 }
        );
      }

      ingredientId = newIngredient.id;
    }

    // Create pantry item
    const pantryItem = {
      user_id: user.id,
      ingredient_id: ingredientId,
      ingredient_name: body.ingredient_name.trim(),
      quantity: body.quantity,
      unit: body.unit,
      expiration_date: body.expiration_date || null,
      location: body.location || null,
      category: body.category || null,
      cost: body.cost || null,
      notes: body.notes || null,
      purchase_date: new Date().toISOString(),
    };

    const { data: newItem, error } = await supabase
      .from('pantry_items')
      .insert(pantryItem)
      .select()
      .single();

    if (error) {
      console.error('Error creating pantry item:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create pantry item' },
        { status: 500 }
      );
    }

    const transformedItem: PantryItem = {
      id: newItem.id,
      user_id: newItem.user_id,
      ingredient_id: newItem.ingredient_id,
      ingredient_name: newItem.ingredient_name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      expiration_date: newItem.expiration_date ? new Date(newItem.expiration_date) : undefined,
      location: newItem.location,
      category: newItem.category,
      purchase_date: newItem.purchase_date ? new Date(newItem.purchase_date) : undefined,
      cost: newItem.cost,
      notes: newItem.notes,
      created_at: new Date(newItem.created_at),
      updated_at: new Date(newItem.updated_at),
    };

    const response: PantryAPIResponse<PantryItem> = {
      data: transformedItem,
      success: true,
      message: 'Pantry item created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/pantry/items:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}