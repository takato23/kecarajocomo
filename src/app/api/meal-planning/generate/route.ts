import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';
import {
  UserPreferencesSchema,
  PlanningConstraintsSchema
} from '@/lib/types/mealPlanning';
import { GeminiPlannerOptions } from '@/lib/services/geminiPlannerService';

// Request validation schema
const GeneratePlanRequestSchema = z.object({
  preferences: UserPreferencesSchema,
  constraints: PlanningConstraintsSchema,
  options: z.object({
    useHolisticAnalysis: z.boolean().default(true),
    includeExternalFactors: z.boolean().default(true),
    optimizeResources: z.boolean().default(true),
    enableLearning: z.boolean().default(true),
    analysisDepth: z.enum(['surface', 'comprehensive', 'deep_dive']).default('comprehensive')
  }).optional()
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
    const validationResult = GeneratePlanRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de solicitud inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { preferences, constraints, options } = validationResult.data;

    // Ensure user ID matches session
    if (preferences.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'ID de usuario no coincide' },
        { status: 403 }
      );
    }

    // Generate plan with Gemini
    const result = await geminiPlannerService.generateHolisticPlan(
      preferences,
      constraints,
      options as GeminiPlannerOptions
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Error al generar el plan',
          success: false 
        },
        { status: 500 }
      );
    }

    // Return successful result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in meal planning generation:', error);
    
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
          { error: 'La generación del plan tomó demasiado tiempo. Por favor, intenta de nuevo.' },
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