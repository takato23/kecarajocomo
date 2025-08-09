import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';

import { GeminiPantryService } from '../../services/geminiPantryService';
import { PantryItem, PantryStats } from '../../types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, 
      pantryItems, 
      pantryStats, 
      userPreferences,
      missingIngredients,
      upcomingMeals,
      usageHistory 
    } = body;

    switch (action) {
      case 'insights':
        const insights = await GeminiPantryService.generatePantryInsights(
          pantryItems as PantryItem[],
          pantryStats as PantryStats,
          userPreferences
        );
        return NextResponse.json({ insights });

      case 'predict_expiration':
        const predictions = await GeminiPantryService.predictExpirationDates(
          pantryItems as PantryItem[]
        );
        return NextResponse.json({ predictions });

      case 'substitutions':
        const substitutions = await GeminiPantryService.generateIngredientSubstitutions(
          missingIngredients as string[],
          pantryItems as PantryItem[]
        );
        return NextResponse.json({ substitutions });

      case 'optimization_plan':
        const plan = await GeminiPantryService.createOptimizationPlan(
          pantryItems as PantryItem[],
          pantryStats as PantryStats,
          usageHistory
        );
        return NextResponse.json({ plan });

      case 'shopping_recommendations':
        const recommendations = await GeminiPantryService.generateShoppingRecommendations(
          pantryItems as PantryItem[],
          upcomingMeals
        );
        return NextResponse.json({ recommendations });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    logger.error('Error in pantry intelligence API:', 'pantry:route', error);
    return NextResponse.json(
      { error: 'Failed to process pantry intelligence request' },
      { status: 500 }
    );
  }
}