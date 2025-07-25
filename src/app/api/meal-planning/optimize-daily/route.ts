import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';
import {
  WeeklyPlan,
  UserPreferencesSchema
} from '@/lib/types/mealPlanning';

// Request validation schema
const OptimizeDailyRequestSchema = z.object({
  preferences: UserPreferencesSchema,
  currentPlan: z.object({
    id: z.string(),
    userId: z.string(),
    meals: z.array(z.any()) // Simplified validation for now
  }).partial(),
  focusDay: z.string().datetime()
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Validate request
    const validationResult = OptimizeDailyRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de solicitud inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { preferences, currentPlan, focusDay } = validationResult.data;

    // Ensure user ID matches session
    if (preferences.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'ID de usuario no coincide' },
        { status: 403 }
      );
    }

    // Convert string to Date
    const focusDate = new Date(focusDay);

    // Generate daily optimization with Gemini
    const result = await geminiPlannerService.generateDailyOptimization(
      preferences,
      currentPlan as Partial<WeeklyPlan>,
      focusDate
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Error al optimizar el plan diario',
          success: false 
        },
        { status: 500 }
      );
    }

    // Return successful result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in daily optimization:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_AI_API_KEY')) {
        return NextResponse.json(
          { error: 'Servicio de IA no configurado correctamente' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'La optimización tomó demasiado tiempo. Por favor, intenta de nuevo.' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}