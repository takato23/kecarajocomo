import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { PantryAPIResponse } from '@/features/pantry/types';

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
    const pantryItemId = params.id.replace('alert-', '');

    // Verify the pantry item belongs to the user
    const { data: item, error: itemError } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('id', pantryItemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, message: 'Pantry item not found' },
        { status: 404 }
      );
    }

    // Create alert data based on expiration date
    const alertData = {
      id: `alert-${item.id}`,
      pantry_item_id: item.id,
      item_name: item.ingredient_name,
      expiration_date: item.expiration_date,
      days_until_expiration: item.expiration_date ? 
        Math.ceil((new Date(item.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      alert_type: item.expiration_date ? 
        (new Date(item.expiration_date) < new Date() ? 'expired' : 
         Math.ceil((new Date(item.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3 ? 'urgent' : 'warning') : 'warning',
      dismissed: false,
      created_at: new Date()
    };

    const response: PantryAPIResponse<typeof alertData> = {
      data: alertData,
      success: true,
      message: 'Alert retrieved successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/pantry/expiration-alerts/[id]:', error);
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

    const params = await context.params;
    const pantryItemId = params.id.replace('alert-', '');

    // Verify the pantry item belongs to the user
    const { data: item, error: itemError } = await supabase
      .from('pantry_items')
      .select('id')
      .eq('id', pantryItemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, message: 'Pantry item not found' },
        { status: 404 }
      );
    }

    // In a full implementation, you would delete from an alerts table
    // For now, we'll just return success since alert deletion is handled client-side
    const response: PantryAPIResponse<null> = {
      data: null,
      success: true,
      message: 'Alert deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in DELETE /api/pantry/expiration-alerts/[id]:', error);
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

    const { dismissed, snoozed_until }: { dismissed?: boolean, snoozed_until?: string } = await request.json();

    // Extract pantry item ID from alert ID (format: "alert-{item_id}")
    const params = await context.params;
    const pantryItemId = params.id.replace('alert-', '');

    // Verify the pantry item belongs to the user
    const { data: item, error: itemError } = await supabase
      .from('pantry_items')
      .select('id')
      .eq('id', pantryItemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, message: 'Pantry item not found' },
        { status: 404 }
      );
    }

    // In a full implementation, you would update an alerts table
    // For now, we'll just return success since the alert dismissal is handled client-side
    let message = '';
    
    if (dismissed) {
      message = 'Alert dismissed successfully';
    } else if (snoozed_until) {
      message = 'Alert snoozed successfully';
    } else {
      return NextResponse.json(
        { success: false, message: 'No valid action provided' },
        { status: 400 }
      );
    }

    const response: PantryAPIResponse<null> = {
      data: null,
      success: true,
      message,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in PUT /api/pantry/expiration-alerts/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}