import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/server';

// Types for AI providers and requests
interface AIProxyRequest {
  provider: 'openai' | 'anthropic' | 'gemini';
  method: string;
  data: any;
  model?: string;
}

interface AIProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<AIProxyResponse>> {
  try {
    // Verify authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { provider, method, data, model }: AIProxyRequest = await req.json();

    // Validate required fields
    if (!provider || !method || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: provider, method, data' },
        { status: 400 }
      );
    }

    let response;

    switch (provider) {
      case 'openai':
        response = await handleOpenAI(method, data, model);
        break;
      case 'anthropic':
        response = await handleAnthropic(method, data, model);
        break;
      case 'gemini':
        response = await handleGemini(method, data, model);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    logger.error('AI Proxy Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleOpenAI(method: string, data: any, model?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(`https://api.openai.com/v1/${method}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      ...data
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return await response.json();
}

async function handleAnthropic(method: string, data: any, model?: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch(`https://api.anthropic.com/v1/${method}`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-sonnet-20240229',
      ...data
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  return await response.json();
}

async function handleGemini(method: string, data: any, model?: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const modelName = model || 'gemini-pro';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  return await response.json();
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // Max 30 requests per minute per user

  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}