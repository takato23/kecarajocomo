import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { geminiPlannerService } from '@/lib/services/geminiPlannerService';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planId, feedback } = body;

    // Validate required fields
    if (!planId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: planId and feedback' },
        { status: 400 }
      );
    }

    // Validate feedback structure
    const requiredFeedbackFields = ['mealRatings', 'timeAccuracy', 'difficultyActual', 'innovations', 'challenges'];
    const missingFields = requiredFeedbackFields.filter(field => !(field in feedback));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing feedback fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    logger.info('Processing meal plan feedback', 'meal-planning/feedback', {
      userId: user.id,
      planId,
      ratingCount: Object.keys(feedback.mealRatings).length
    });

    const result = await geminiPlannerService.processLearningFeedback(
      planId,
      feedback
    );

    logger.info('Successfully processed meal plan feedback', 'meal-planning/feedback', {
      userId: user.id,
      planId,
      insightsCount: Object.keys(result.insights).length
    });

    return NextResponse.json({
      success: true,
      insights: result.insights,
      adaptations: result.adaptations,
      message: 'Feedback processed successfully. Future meal plans will be improved based on your preferences.'
    });

  } catch (error) {
    logger.error('Error in feedback processing endpoint', 'meal-planning/feedback', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}