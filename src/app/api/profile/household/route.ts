import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    logger.error('Error fetching household members:', 'API:route', error);
    return NextResponse.json(
      { error: 'Failed to fetch household members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('household_members')
      .insert({
        user_id: user.id,
        name: body.name,
        relationship: body.relationship || null,
        age: body.age || null,
        dietary_restrictions: body.dietaryRestrictions || [],
        allergies: body.allergies || [],
        preferences: body.preferences || {})
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error('Error adding household member:', 'API:route', error);
    return NextResponse.json(
      { error: 'Failed to add household member' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Update household member
    const { data, error } = await supabase
      .from('household_members')
      .update({
        name: body.name,
        relationship: body.relationship,
        age: body.age,
        dietary_restrictions: body.dietaryRestrictions,
        allergies: body.allergies,
        preferences: body.preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('user_id', user.id) // Ensure user owns this member
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error('Error updating household member:', 'API:route', error);
    return NextResponse.json(
      { error: 'Failed to update household member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('id', memberId)
      .eq('user_id', user.id); // Ensure user owns this member
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error deleting household member:', 'API:route', error);
    return NextResponse.json(
      { error: 'Failed to delete household member' },
      { status: 500 }
    );
  }
}