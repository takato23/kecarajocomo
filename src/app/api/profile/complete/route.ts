import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch complete profile with all related data
    const [profileResult, preferencesResult, householdResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('household_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
    ]);
    
    // Check for errors
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      throw profileResult.error;
    }
    if (preferencesResult.error && preferencesResult.error.code !== 'PGRST116') {
      throw preferencesResult.error;
    }
    if (householdResult.error && householdResult.error.code !== 'PGRST116') {
      throw householdResult.error;
    }
    
    return NextResponse.json({
      profile: profileResult.data,
      preferences: preferencesResult.data,
      household: householdResult.data || []
    });
  } catch (error: unknown) {
    logger.error('Error fetching complete profile:', 'API:route', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}