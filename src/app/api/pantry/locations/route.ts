import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

import type { PantryLocation, PantryAPIResponse } from '@/features/pantry/types';

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

    const { data: locations, error } = await supabase
      .from('pantry_locations')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      logger.error('Error fetching pantry locations:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry locations' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<PantryLocation[]> = {
      data: locations || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Unexpected error in GET /api/pantry/locations:', 'API:route', error);
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

    const body: Omit<PantryLocation, 'id' | 'user_id'> = await request.json();

    // Validate required fields
    if (!body.name || !body.temperature_zone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if location name already exists for this user
    const { data: existingLocation } = await supabase
      .from('pantry_locations')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', body.name.trim())
      .single();

    if (existingLocation) {
      return NextResponse.json(
        { success: false, message: 'Location name already exists' },
        { status: 400 }
      );
    }

    const location = {
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      temperature_zone: body.temperature_zone,
    };

    const { data: newLocation, error } = await supabase
      .from('pantry_locations')
      .insert(location)
      .select()
      .single();

    if (error) {
      logger.error('Error creating pantry location:', 'API:route', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create pantry location' },
        { status: 500 }
      );
    }

    const response: PantryAPIResponse<PantryLocation> = {
      data: newLocation,
      success: true,
      message: 'Pantry location created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    logger.error('Unexpected error in POST /api/pantry/locations:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}