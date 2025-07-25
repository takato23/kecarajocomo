import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';

// Request validation schema
const RegenerateRequestSchema = z.object({
  feedback: z.string().min(1).max(1000),
  currentPlan: z.object({
    id: z.string(),
    userId: z.string(),
    preferences: z.any(),
    constraints: z.any(),
    meals: z.array(z.any())
  }),
  userId: z.string()
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
    const validationResult = RegenerateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de solicitud inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { feedback, currentPlan, userId } = validationResult.data;

    // Ensure user ID matches session
    if (userId !== session.user.id || currentPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'ID de usuario no coincide' },
        { status: 403 }
      );
    }

    // Extract preferences and constraints from current plan
    const preferences = currentPlan.preferences || {
      userId: session.user.id,
      householdSize: 2,
      cookingSkillLevel: 'intermediate' as const,
      dietaryRestrictions: [],
      allergies: [],
      favoriteCuisines: []
    };

    const constraints = currentPlan.constraints || {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      mealTypes: ['breakfast', 'lunch', 'dinner'] as const,
      servings: 2,
      maxPrepTime: 60
    };

    // Add feedback to the preferences to guide regeneration
    const enhancedPreferences = {
      ...preferences,
      regenerationFeedback: feedback
    };

    // Generate new plan with feedback consideration
    const result = await geminiPlannerService.generateHolisticPlan(
      enhancedPreferences,
      constraints,
      {
        useHolisticAnalysis: true,
        includeExternalFactors: true,
        optimizeResources: true,
        enableLearning: true,
        analysisDepth: 'comprehensive'
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Error al regenerar el plan',
          success: false 
        },
        { status: 500 }
      );
    }

    // Process learning feedback if available
    if (result.plan && currentPlan.id) {
      try {
        await geminiPlannerService.processLearningFeedback(
          currentPlan.id,
          {
            mealRatings: {},
            timeAccuracy: {},
            difficultyActual: {},
            innovations: [],
            challenges: [feedback] // Use feedback as a challenge to address
          }
        );
      } catch (learningError) {
        // Log but don't fail the request
        console.error('Error processing learning feedback:', learningError);
      }
    }

    // Return successful result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in plan regeneration:', error);
    
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
          { error: 'La regeneración tomó demasiado tiempo. Por favor, intenta de nuevo.' },
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