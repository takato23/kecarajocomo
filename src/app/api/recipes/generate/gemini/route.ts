import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    // Get API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No API key found'
      }, { status: 500 });
    }

    // Get request body
    const body = await req.json();
    const { prompt, ingredients, dietaryRestrictions } = body;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create recipe generation prompt
    const recipePrompt = `
Genera una receta argentina basada en:
${prompt ? `Descripción: ${prompt}` : ''}
${ingredients ? `Ingredientes disponibles: ${ingredients.join(', ')}` : ''}
${dietaryRestrictions ? `Restricciones dietéticas: ${dietaryRestrictions.join(', ')}` : ''}

Responde SOLO con un JSON válido con esta estructura:
{
  "name": "Nombre de la receta",
  "description": "Descripción breve",
  "prepTime": 20,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "medium",
  "ingredients": [
    { "name": "ingrediente", "amount": "cantidad", "unit": "unidad" }
  ],
  "instructions": [
    "Paso 1...",
    "Paso 2..."
  ],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 30,
    "fat": 15
  }
}

Haz una receta típica argentina.`;

    const result = await model.generateContent(recipePrompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const recipe = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      recipe: recipe
    });

  } catch (error: any) {
    console.error('Error generating recipe:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to generate recipe'
    }, { status: 500 });
  }
}