import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { ExpirationAlert, PantryAPIResponse } from '@/features/pantry/types';

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

    const searchParams = request.nextUrl.searchParams;
    const includeExpired = searchParams.get('include_expired') === 'true';
    const includeDismissed = searchParams.get('include_dismissed') === 'true';

    // Get pantry items with expiration dates
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id)
      .not('expiration_date', 'is', null);

    // Only include items expiring within a reasonable timeframe unless specifically requested
    if (!includeExpired) {
      query = query.gte('expiration_date', now.toISOString());
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching pantry items for alerts:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch expiration alerts' },
        { status: 500 }
      );
    }

    // Generate expiration alerts
    const alerts: ExpirationAlert[] = items
      ?.map((item) => {
        const expirationDate = new Date(item.expiration_date);
        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let alertType: 'warning' | 'urgent' | 'expired';
        let shouldInclude = true;

        if (daysUntilExpiration < 0) {
          alertType = 'expired';
          // Only include expired items if requested
          shouldInclude = includeExpired;
        } else if (daysUntilExpiration <= 2) {
          alertType = 'urgent';
        } else if (daysUntilExpiration <= 7) {
          alertType = 'warning';
        } else {
          // Items expiring more than 7 days out don't need alerts
          return null;
        }

        if (!shouldInclude) {
          return null;
        }

        return {
          id: `alert-${item.id}`,
          pantry_item_id: item.id,
          item_name: item.ingredient_name,
          expiration_date: expirationDate,
          days_until_expiration: daysUntilExpiration,
          alert_type: alertType,
          dismissed: false, // Real implementation would check dismissed status from DB
          created_at: now,
        };
      })
      .filter((alert): alert is ExpirationAlert => alert !== null) || [];

    // Sort by urgency (expired first, then by days until expiration)
    alerts.sort((a, b) => {
      if (a.alert_type === 'expired' && b.alert_type !== 'expired') return -1;
      if (a.alert_type !== 'expired' && b.alert_type === 'expired') return 1;
      if (a.alert_type === 'urgent' && b.alert_type === 'warning') return -1;
      if (a.alert_type === 'warning' && b.alert_type === 'urgent') return 1;
      return a.days_until_expiration - b.days_until_expiration;
    });

    const response: PantryAPIResponse<ExpirationAlert[]> = {
      data: alerts,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/pantry/expiration-alerts:', error);
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

    const { action, item_ids }: { action: 'snooze' | 'dismiss', item_ids: string[] } = await request.json();

    if (!action || !item_ids || !Array.isArray(item_ids)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      );
    }

    // For now, we'll just return success since we don't have a dedicated alerts table
    // In a full implementation, you'd update the alert status in the database
    let message = '';
    
    switch (action) {
      case 'dismiss':
        message = `Dismissed ${item_ids.length} alert(s)`;
        break;
      case 'snooze':
        message = `Snoozed ${item_ids.length} alert(s) for 24 hours`;
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
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
    console.error('Unexpected error in POST /api/pantry/expiration-alerts:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}