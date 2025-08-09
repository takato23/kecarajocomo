import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

import type { PantryLocation, PantryAPIResponse } from '@/features/pantry/types';

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

    const params = await context.params;
    const { data: location, error } = await supabase
      .from('pantry_locations')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Pantry location not found' },
          { status: 404 }
        );
      }
      logger.error('Error fetching pantry location:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry location' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<PantryLocation> = {
      data: location,
      success: true,
      message: 'Pantry location retrieved successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in GET /api/pantry/locations/[id]:', 'API:route', error);
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

    const body: Partial<PantryLocation> = await request.json();

    // Build update object
    const updates: Partial<PantryLocation> = {};

    if (body.name !== undefined) {
      updates.name = body.name.trim();
      
      // Check if new name conflicts with existing location
      if (updates.name) {
        const { data: existingLocation } = await supabase
          .from('pantry_locations')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', updates.name)
          .neq('id', (await context.params).id)
          .single();

        if (existingLocation) {
          return NextResponse.json(
            { success: false, message: 'Location name already exists' },
            { status: 400 }
          );
        }
      }
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }
    if (body.temperature_zone !== undefined) {
      updates.temperature_zone = body.temperature_zone;
    }

    const { data: updatedLocation, error } = await supabase
      .from('pantry_locations')
      .update(updates)
      .eq('id', (await context.params).id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Pantry location not found' },
          { status: 404 }
        );
      }
      logger.error('Error updating pantry location:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update pantry location' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<PantryLocation> = {
      data: updatedLocation,
      success: true,
      message: 'Pantry location updated successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in PUT /api/pantry/locations/[id]:', 'API:route', error);
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

    // Check if location is being used by any pantry items
    const { count: itemsUsingLocation, error: countError } = await supabase
      .from('pantry_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('location', (await context.params).id);

    if (countError) {
      logger.error('Error checking location usage:', 'API:route', countError);
      return NextResponse.json(
        { success: false, message: 'Failed to check location usage' },
        { status: 500 }
      );
    }

    if (itemsUsingLocation && itemsUsingLocation > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete location. ${itemsUsingLocation} items are using this location.` 
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('pantry_locations')
      .delete()
      .eq('id', (await context.params).id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error deleting pantry location:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete pantry location' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<null> = {
      data: null,
      success: true,
      message: 'Pantry location deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in DELETE /api/pantry/locations/[id]:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}