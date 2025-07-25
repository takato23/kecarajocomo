import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { geminiMealPlannerAPI } from '@/lib/services/geminiMealPlannerAPI';
import { authOptions } from '@/lib/auth';
import type { UserPreferences, PlanningConstraints } from '@/lib/types/mealPlanning';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener datos del request
    const body = await request.json();
    const { preferences, constraints, pantryItems, contextData } = body;

    // Validar datos básicos
    if (!preferences || !constraints) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Añadir userId del usuario autenticado
    const userPreferences: UserPreferences = {
      ...preferences,
      userId: session.user.id
    };

    // Convertir fechas string a Date objects
    const planningConstraints: PlanningConstraints = {
      ...constraints,
      startDate: new Date(constraints.startDate),
      endDate: new Date(constraints.endDate)
    };

    // Generar plan de comidas
    const result = await geminiMealPlannerAPI.generateWeeklyMealPlan({
      userPreferences,
      constraints: planningConstraints,
      pantryItems,
      contextData
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate meal plan' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in meal planner API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint para generar una receta individual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get('mealType') as 'breakfast' | 'lunch' | 'dinner';
    const servings = parseInt(searchParams.get('servings') || '4');
    const timeAvailable = parseInt(searchParams.get('timeAvailable') || '30');
    const ingredients = searchParams.get('ingredients')?.split(',').filter(Boolean);

    if (!mealType) {
      return NextResponse.json(
        { error: 'mealType is required' },
        { status: 400 }
      );
    }

    // TODO: Obtener preferencias reales del usuario de la DB
    const mockPreferences: UserPreferences = {
      userId: session.user.id,
      dietaryRestrictions: [],
      allergies: [],
      favoriteCuisines: ['argentina', 'italiana'],
      cookingSkillLevel: 'intermediate',
      householdSize: servings,
      weeklyBudget: 10000,
      preferredMealTypes: ['breakfast', 'lunch', 'dinner'],
      avoidIngredients: [],
      nutritionalGoals: {
        calories: 2000,
        protein: 80,
        carbs: 250,
        fat: 70
      }
    };

    const recipe = await geminiMealPlannerAPI.generateSingleRecipe(
      mealType,
      mockPreferences,
      {
        availableIngredients: ingredients,
        timeAvailable,
        servings
      }
    );

    if (!recipe) {
      return NextResponse.json(
        { error: 'Failed to generate recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, recipe });

  } catch (error) {
    console.error('Error generating single recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}