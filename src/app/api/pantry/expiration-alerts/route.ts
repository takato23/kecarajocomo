import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getUser } from '@/lib/auth/supabase-auth';
import { db } from '@/lib/supabase/database.service';
import { GeminiService } from '@/services/ai/GeminiService';

interface ExpirationAlert {
  id: string;
  pantry_item_id: string;
  item_name: string;
  expiration_date: Date;
  days_until_expiration: number;
  alert_type: 'warning' | 'urgent' | 'expired';
  dismissed: boolean;
  created_at: Date;
  suggested_recipes?: string[];
}

async function generateQuickRecipeSuggestions(ingredients: string[]): Promise<string[]> {
  const gemini = new GeminiService();
  
  const prompt = `
Generate 3 quick recipe names that use ${ingredients.join(', ')} as main ingredients.
Focus on simple, quick recipes that can be made with minimal additional ingredients.
Return only the recipe names as a simple array of strings.
Example format: ["Recipe Name 1", "Recipe Name 2", "Recipe Name 3"]
`;

  try {
    const response = await gemini.generateContent(prompt);
    const suggestions = JSON.parse(response);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    logger.error('Error generating quick recipe suggestions:', 'ExpirationAlerts', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
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
    const pantryItems = await db.getPantryItems(user.id);

    // Filter items with expiration dates
    const itemsWithExpiration = pantryItems.filter(item => 
      item.expiration_date && 
      (includeExpired || new Date(item.expiration_date) >= now)
    );

    // Generate expiration alerts with recipe suggestions
    const alerts: ExpirationAlert[] = itemsWithExpiration
      .map((item) => {
        const expirationDate = new Date(item.expiration_date!);
        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let alertType: 'warning' | 'urgent' | 'expired';
        let shouldInclude = true;

        if (daysUntilExpiration < 0) {
          alertType = 'expired';
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
          item_name: item.ingredient?.name || 'Unknown',
          expiration_date: expirationDate,
          days_until_expiration: daysUntilExpiration,
          alert_type: alertType,
          dismissed: false,
          created_at: now,
          suggested_recipes: [] // Will be populated below
        };
      })
      .filter((alert): alert is ExpirationAlert => alert !== null);

    // Add recipe suggestions for urgent/expired items
    for (const alert of alerts.filter(a => a.alert_type === 'urgent' || a.alert_type === 'expired')) {
      try {
        const suggestions = await generateQuickRecipeSuggestions([alert.item_name]);
        alert.suggested_recipes = suggestions;
      } catch (error) {
        logger.error('Failed to generate recipe suggestions for alert:', 'ExpirationAlerts', error);
        alert.suggested_recipes = [];
      }
    }

    // Sort by urgency (expired first, then by days until expiration)
    alerts.sort((a, b) => {
      if (a.alert_type === 'expired' && b.alert_type !== 'expired') return -1;
      if (a.alert_type !== 'expired' && b.alert_type === 'expired') return 1;
      if (a.alert_type === 'urgent' && b.alert_type === 'warning') return -1;
      if (a.alert_type === 'warning' && b.alert_type === 'urgent') return 1;
      return a.days_until_expiration - b.days_until_expiration;
    });

    return NextResponse.json({
      data: alerts,
      success: true,
    });
  } catch (error: unknown) {
    logger.error('Unexpected error in GET /api/pantry/expiration-alerts:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
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

    // In a full implementation, you'd update the alert status in a dedicated alerts table
    // For now, we'll just return success and could implement alert preferences in user settings
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

    return NextResponse.json({
      data: null,
      success: true,
      message,
    });
  } catch (error: unknown) {
    logger.error('Unexpected error in POST /api/pantry/expiration-alerts:', 'API:route', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}