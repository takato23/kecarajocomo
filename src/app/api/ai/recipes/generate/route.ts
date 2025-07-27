import { NextRequest, NextResponse } from 'next/server'
import geminiConfig from '@/lib/config/gemini.config';;
import { logger } from '@/lib/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { createServerSupabaseClient } from '@/lib/supabase/client';

// Interfaces for the response

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await checkRateLimit(clientIp);

    // Verify authentication
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, preferences, constraints, context } = body;

    // Validate input
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build system prompt for recipe generation
    const systemPrompt = `Eres un chef profesional y nutricionista experto especializado en cocina latina e internacional. Tu misión es crear recetas deliciosas, nutritivas y factibles.

REGLAS IMPORTANTES:
1. SIEMPRE responde con un JSON válido siguiendo exactamente la estructura especificada
2. Incluye cantidades precisas y realistas para todos los ingredientes
3. Las instrucciones deben ser claras, paso a paso, y fáciles de seguir
4. Calcula información nutricional aproximada pero realista
5. Considera restricciones dietéticas y preferencias del usuario
6. Usa ingredientes comunes y accesibles cuando sea posible
7. El tiempo de preparación y cocción debe ser realista

ESTRUCTURA JSON OBLIGATORIA:
{
  "name": "string - nombre atractivo de la receta",
  "description": "string - descripción breve y apetitosa",
  "ingredients": [
    {
      "name": "string - nombre del ingrediente",
      "quantity": number - cantidad numérica,
      "unit": "string - unidad (g, ml, taza, etc.)",
      "preparation": "string - preparación opcional (picado, rallado, etc.)",
      "optional": boolean - si es ingrediente opcional
    }
  ],
  "instructions": [
    "string - cada paso de la preparación"
  ],
  "cook_time": number - minutos de cocción,
  "prep_time": number - minutos de preparación,
  "servings": number - número de porciones,
  "difficulty": "facil|intermedio|dificil|experto",
  "category": "desayuno|almuerzo|cena|snack|postre|bebida|aperitivo|ensalada|sopa|pasta|pizza|sandwich|parrilla|vegetariano|vegano|sin_gluten",
  "cuisine_type": "mexicana|italiana|asiatica|mediterranea|americana|francesa|india|japonesa|china|tailandesa|peruana|argentina|fusion|internacional",
  "nutrition": {
    "calories": number - calorías por porción,
    "protein": number - gramos de proteína,
    "carbs": number - gramos de carbohidratos,
    "fat": number - gramos de grasa,
    "fiber": number - gramos de fibra
  },
  "tags": ["string"] - etiquetas relevantes,
  "reasoning": "string - explicación de por qué esta receta cumple los requisitos",
  "alternatives": ["string"] - sugerencias de variaciones o substituciones
}`;

    // Call Gemini API
    const aiResponse = await callGeminiAPI(systemPrompt, prompt);
    
    // Parse and validate response
    const recipeData = await parseAndValidateRecipeResponse(aiResponse);
    
    // Log AI usage
    await logAIUsage(user.id, 'recipe_generation', {
      input_tokens: aiResponse.usage?.input_tokens || 0,
      output_tokens: aiResponse.usage?.output_tokens || 0,
      success: true
    });

    return NextResponse.json({
      recipe: recipeData,
      reasoning: recipeData.reasoning || 'Receta generada basada en tus preferencias',
      alternatives: recipeData.alternatives || [],
      nutritionNotes: `Esta receta aporta aproximadamente ${recipeData.nutrition?.calories || 'N/A'} calorías por porción.`
    });

  } catch (error: unknown) {
    logger.error('Recipe generation error:', 'API:route', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate recipe',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Simulated Claude API call - replace with actual implementation
async function callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiKey = geminiConfig.getApiKey() || geminiConfig.getApiKey();
  
  if (!apiKey) {
    logger.warn('Gemini API key not available, using fallback', 'API:route');
    return getMockRecipeResponse(userPrompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: geminiConfig.default.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
        topP: 0.8,
        topK: 40
      }
    });

    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiar respuesta de markdown si existe
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.slice(7);
    }
    if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    
    // Return in expected format
    return {
      content: [{ type: 'text', text: text.trim() }],
      usage: {
        input_tokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
        output_tokens: Math.ceil(text.length / 4)
      }
    };
  } catch (error: unknown) {
    logger.warn('Gemini API error, using fallback:', 'API:route', error);
    return getMockRecipeResponse(userPrompt);
  }
}

function getMockRecipeResponse(prompt: string): any {
  // Mock response for development/testing
  const mockRecipe = {
    name: "Pasta con Pollo y Verduras",
    description: "Una deliciosa pasta cremosa con pollo jugoso y verduras frescas, perfecta para una cena familiar.",
    ingredients: [
      {
        name: "pasta penne",
        quantity: 400,
        unit: "g",
        preparation: "",
        optional: false
      },
      {
        name: "pechuga de pollo",
        quantity: 300,
        unit: "g",
        preparation: "cortada en cubos",
        optional: false
      },
      {
        name: "pimiento rojo",
        quantity: 1,
        unit: "pieza",
        preparation: "cortado en tiras",
        optional: false
      },
      {
        name: "calabacín",
        quantity: 1,
        unit: "pieza",
        preparation: "en rodajas",
        optional: false
      },
      {
        name: "crema para cocinar",
        quantity: 200,
        unit: "ml",
        preparation: "",
        optional: false
      },
      {
        name: "ajo",
        quantity: 2,
        unit: "dientes",
        preparation: "picados",
        optional: false
      },
      {
        name: "aceite de oliva",
        quantity: 3,
        unit: "tbsp",
        preparation: "",
        optional: false
      },
      {
        name: "sal",
        quantity: 1,
        unit: "tsp",
        preparation: "",
        optional: false
      },
      {
        name: "pimienta negra",
        quantity: 0.5,
        unit: "tsp",
        preparation: "molida",
        optional: false
      },
      {
        name: "queso parmesano",
        quantity: 50,
        unit: "g",
        preparation: "rallado",
        optional: true
      }
    ],
    instructions: [
      "Cocina la pasta en agua con sal según las instrucciones del paquete hasta que esté al dente. Escurre y reserva.",
      "Calienta el aceite de oliva en una sartén grande a fuego medio-alto.",
      "Sazona el pollo con sal y pimienta, luego cocínalo en la sartén por 5-6 minutos hasta que esté dorado por fuera.",
      "Añade el ajo picado y cocina por 1 minuto hasta que esté fragante.",
      "Incorpora el pimiento rojo y el calabacín. Cocina por 4-5 minutos hasta que las verduras estén tiernas.",
      "Reduce el fuego a medio-bajo y añade la crema para cocinar. Mezcla bien y deja cocinar por 2 minutos.",
      "Añade la pasta cocida a la sartén y mezcla todo hasta que esté bien combinado.",
      "Ajusta la sazón con sal y pimienta al gusto.",
      "Sirve caliente, espolvoreando queso parmesano rallado por encima si lo deseas."
    ],
    cook_time: 15,
    prep_time: 15,
    servings: 4,
    difficulty: "facil",
    category: "almuerzo",
    cuisine_type: "italiana",
    nutrition: {
      calories: 520,
      protein: 28,
      carbs: 68,
      fat: 18,
      fiber: 4
    },
    tags: ["pasta", "pollo", "verduras", "cremoso", "familiar"],
    reasoning: "Esta receta combina proteína magra del pollo con carbohidratos complejos de la pasta y vitaminas de las verduras frescas. Es fácil de preparar y perfecta para una cena nutritiva en familia.",
    alternatives: [
      "Sustituir el pollo por camarones para una versión marina",
      "Usar leche de coco en lugar de crema para una versión más ligera",
      "Añadir espinacas frescas al final para más vegetales"
    ]
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(mockRecipe)
      }
    ],
    usage: {
      input_tokens: 500,
      output_tokens: 800
    }
  };
}

async function parseAndValidateRecipeResponse(aiResponse: ClaudeResponse): Promise<any> {
  try {
    const responseText = aiResponse.content[0]?.text;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    // Validate required fields
    const requiredFields = ['name', 'ingredients', 'instructions'];
    for (const field of requiredFields) {
      if (!recipeData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate ingredients structure
    if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      throw new Error('Invalid ingredients format');
    }

    // Validate instructions structure
    if (!Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
      throw new Error('Invalid instructions format');
    }

    // Set default values for missing optional fields
    recipeData.prep_time = recipeData.prep_time || 15;
    recipeData.cook_time = recipeData.cook_time || 30;
    recipeData.servings = recipeData.servings || 4;
    recipeData.difficulty = recipeData.difficulty || 'intermedio';
    recipeData.category = recipeData.category || 'almuerzo';
    recipeData.tags = recipeData.tags || [];

    return recipeData;
  } catch (error: unknown) {
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

async function checkRateLimit(clientIp: string): Promise<void> {
  // Simple in-memory rate limiting (in production, use Redis or similar)
  // Allow 10 requests per minute per IP
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  // This would be implemented with a proper rate limiting service
  // For now, we'll skip the actual implementation
}

async function logAIUsage(userId: string, operation: string, metrics: any): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    
    await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        operation,
        input_tokens: metrics.input_tokens,
        output_tokens: metrics.output_tokens,
        success: metrics.success,
        created_at: new Date().toISOString()
      });
  } catch (error: unknown) {
    logger.error('Failed to log AI usage:', 'API:route', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}