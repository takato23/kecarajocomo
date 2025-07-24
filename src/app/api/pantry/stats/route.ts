import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { PantryStats, PantryAPIResponse } from '@/features/pantry/types';

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

    // Get total items count
    const { count: totalItems, error: countError } = await supabase
      .from('pantry_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting pantry items:', countError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pantry stats' },
        { status: 500 }
      );
    }

    // Get items grouped by category
    const { data: categoryData, error: categoryError } = await supabase
      .from('pantry_items')
      .select('category')
      .eq('user_id', user.id);

    if (categoryError) {
      console.error('Error fetching category data:', categoryError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch category stats' },
        { status: 500 }
      );
    }

    // Process categories
    const categories: Record<string, number> = {};
    categoryData?.forEach((item) => {
      const category = item.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });

    // Get expiring and expired items
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Items expiring within 7 days
    const { count: expiringItems, error: expiringError } = await supabase
      .from('pantry_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('expiration_date', now.toISOString())
      .lte('expiration_date', oneWeekFromNow.toISOString());

    if (expiringError) {
      console.error('Error counting expiring items:', expiringError);
    }

    // Expired items
    const { count: expiredItems, error: expiredError } = await supabase
      .from('pantry_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lt('expiration_date', now.toISOString());

    if (expiredError) {
      console.error('Error counting expired items:', expiredError);
    }

    // Calculate total value if cost data is available
    const { data: costData, error: costError } = await supabase
      .from('pantry_items')
      .select('cost')
      .eq('user_id', user.id)
      .not('cost', 'is', null);

    let totalValue: number | undefined;
    if (!costError && costData) {
      totalValue = costData.reduce((sum, item) => sum + (item.cost || 0), 0);
    }

    const stats: PantryStats = {
      totalItems: totalItems || 0,
      expiringItems: expiringItems || 0,
      expiredItems: expiredItems || 0,
      categories,
      totalValue,
    };

    const response: PantryAPIResponse<PantryStats> = {
      data: stats,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/pantry/stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}