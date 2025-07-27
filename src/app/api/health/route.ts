import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables are properly set
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;  
    const hasGemini = !!(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Check if we're exposing any sensitive keys (security check)
    const exposedKeys = [];
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) exposedKeys.push('NEXT_PUBLIC_OPENAI_API_KEY');
    if (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) exposedKeys.push('NEXT_PUBLIC_ANTHROPIC_API_KEY');
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) exposedKeys.push('NEXT_PUBLIC_GEMINI_API_KEY');
    if (process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY) exposedKeys.push('NEXT_PUBLIC_GOOGLE_AI_API_KEY');

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        openai: hasOpenAI ? 'configured' : 'missing',
        anthropic: hasAnthropic ? 'configured' : 'missing', 
        gemini: hasGemini ? 'configured' : 'missing',
        supabase: hasSupabase ? 'configured' : 'missing'
      },
      security: {
        exposed_keys: exposedKeys,
        is_secure: exposedKeys.length === 0
      },
      proxy_endpoints: [
        '/api/ai/proxy',
        '/api/ai/recipes/proxy'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}