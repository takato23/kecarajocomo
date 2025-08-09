import { NextRequest, NextResponse } from 'next/server'
import geminiConfig from '@/lib/config/gemini.config';;
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    // Check for API key
    const apiKey = geminiConfig.getApiKey() || geminiConfig.getApiKey();
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not found',
        env: {
          hasGoogleAI: !!geminiConfig.getApiKey(),
          hasGoogleGemini: !!geminiConfig.getApiKey(),
        }
      }, { status: 500 });
    }

    // Try to initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: geminiConfig.default.model });

    // Simple test prompt
    const result = await model.generateContent('Di "Hola, soy Gemini y estoy funcionando!" en español argentino.');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: text,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test Gemini',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}