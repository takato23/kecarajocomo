import { NextRequest, NextResponse } from 'next/server'
import geminiConfig from '@/lib/config/gemini.config';;
import { logger } from '@/lib/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
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
    const { 
      occasion, // breakfast, lunch, dinner, snack
      timeAvailable = 30,
      servings = 2,
      useOnlyPantry = false,
      count = 3
    } = body;

    // Get user profile and preferences
    const [profileResult, preferencesResult, pantryResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('display_name, bio, cooking_persona')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_preferences')
        .select('dietary_restrictions, allergies, cuisine_preferences, favorite_ingredients, disliked_ingredients')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('pantry_items')
        .select('name, quantity, unit, category, expiration_date')
        .eq('user_id', user.id)
    ]);

    const profile = profileResult.data;
    const preferences = preferencesResult.data;
    const pantryItems = pantryResult.data || [];

    const cookingPersonaDescriptions = {
      beginner: 'Principiante entusiasta que prefiere recetas simples con instrucciones claras',
      home_cook: 'Cocinero casero con experiencia en recetas familiares tradicionales',
      foodie: 'Foodie aventurero que disfruta experimentar con sabores y técnicas nuevas',
      health_conscious: 'Consciente de la salud, prioriza nutrición y ingredientes naturales'
    };

    // Build system prompt for personalized suggestions
    const systemPrompt = `Eres un chef personal experto que conoce íntimamente los gustos y preferencias de tu cliente. Tu objetivo es sugerir recetas perfectamente personalizadas que se adapten a su estilo de cocina, preferencias y restricciones.

PERFIL DEL USUARIO:
- Nombre: ${profile?.display_name || 'Usuario'}
- Estilo de cocina: ${cookingPersonaDescriptions[profile?.cooking_persona || 'beginner']}
- Bio: ${profile?.bio || 'No especificada'}

REGLAS IMPORTANTES:
1. TODAS las recetas deben adaptarse al estilo de cocina del usuario
2. NUNCA incluir ingredientes de alergias o restricciones
3. Priorizar ingredientes favoritos cuando sea posible
4. Evitar ingredientes que no le gustan al usuario
5. Considerar el tiempo disponible para cocinar
6. Si useOnlyPantry es true, usar SOLO ingredientes de la despensa
7. Responder con un JSON válido siguiendo la estructura especificada

ESTRUCTURA JSON OBLIGATORIA:
{
  "recipes": [
    {
      "name": "string - nombre atractivo y personalizado",
      "description": "string - descripción apetitosa adaptada al usuario",
      "personalization_notes": "string - por qué esta receta es perfecta para este usuario",
      "ingredients": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string",
          "preparation": "string",
          "optional": boolean,
          "available_in_pantry": boolean
        }
      ],
      "instructions": ["string - instrucciones adaptadas al nivel del usuario"],
      "cook_time": number,
      "prep_time": number,
      "servings": number,
      "difficulty": "string - apropiada para el nivel del usuario",
      "category": "string",
      "cuisine_type": "string",
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number
      },
      "tags": ["string"],
      "chef_tips": ["string - consejos personalizados según el nivel del usuario"],
      "variations": ["string - variaciones que podrían gustarle al usuario"]
    }
  ],
  "personalization_summary": "string - resumen de cómo se personalizaron las sugerencias"
}`;

    // Build user prompt
    const userPrompt = `SOLICITUD DE RECETAS PERSONALIZADAS:

OCASIÓN: ${occasion || 'cualquier momento'}
TIEMPO DISPONIBLE: ${timeAvailable} minutos
PORCIONES: ${servings}
USAR SOLO DESPENSA: ${useOnlyPantry ? 'Sí' : 'No'}

RESTRICCIONES Y PREFERENCIAS:
- Restricciones dietéticas: ${preferences?.dietary_restrictions?.join(', ') || 'Ninguna'}
- Alergias: ${preferences?.allergies?.join(', ') || 'Ninguna'}
- Cocinas favoritas: ${preferences?.cuisine_preferences?.join(', ') || 'Todas'}
- Ingredientes favoritos: ${preferences?.favorite_ingredients?.join(', ') || 'No especificados'}
- Ingredientes a evitar: ${preferences?.disliked_ingredients?.join(', ') || 'Ninguno'}

${pantryItems.length > 0 ? `INGREDIENTES EN DESPENSA:
${pantryItems.slice(0, 20).map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}
${pantryItems.length > 20 ? `... y ${pantryItems.length - 20} más` : ''}` : 'DESPENSA: No hay información disponible'}

INSTRUCCIONES ESPECIALES:
- Genera ${count} recetas diferentes y personalizadas
- Adapta la complejidad al nivel del usuario (${profile?.cooking_persona || 'beginner'})
- Incluye tips específicos para su nivel de experiencia
- Si es principiante, usa técnicas simples y explica términos culinarios
- Si es foodie, incluye técnicas más avanzadas y sabores interesantes
- Si es consciente de la salud, resalta beneficios nutricionales

Genera las recetas personalizadas:`;

    // Call Gemini API
    const aiResponse = await callGeminiAPI(systemPrompt, userPrompt);
    
    // Parse and validate response
    const suggestionsData = await parseAndValidateResponse(aiResponse);
    
    // Log AI usage
    await logAIUsage(user.id, 'personalized_recipes', {
      input_tokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
      output_tokens: Math.ceil(aiResponse.length / 4),
      success: true,
      recipe_count: count
    });

    return NextResponse.json({
      ...suggestionsData,
      user_profile: {
        name: profile?.display_name,
        cooking_style: profile?.cooking_persona
      }
    });

  } catch (error: unknown) {
    logger.error('Personalized recipe generation error:', 'API:route', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate personalized recipes',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = geminiConfig.getApiKey() || geminiConfig.getApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: geminiConfig.default.model,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40
      }
    });

    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean markdown if present
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
    
    return text.trim();
  } catch (error: unknown) {
    logger.error('Gemini API error:', 'API:route', error);
    throw error;
  }
}

async function parseAndValidateResponse(aiResponse: string): Promise<any> {
  try {
    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    const responseData = JSON.parse(aiResponse);

    // Validate structure
    if (!responseData.recipes || !Array.isArray(responseData.recipes)) {
      throw new Error('Invalid recipes format in response');
    }

    // Validate each recipe
    for (const recipe of responseData.recipes) {
      if (!recipe.name || !recipe.ingredients || !recipe.instructions) {
        throw new Error('Invalid recipe structure');
      }
      
      // Set defaults for optional fields
      recipe.chef_tips = recipe.chef_tips || [];
      recipe.variations = recipe.variations || [];
      recipe.personalization_notes = recipe.personalization_notes || '';
    }

    return responseData;
  } catch (error: unknown) {
    throw new Error(`Failed to parse response: ${error.message}`);
  }
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
        metadata: {
          recipe_count: metrics.recipe_count
        },
        created_at: new Date().toISOString()
      });
  } catch (error: unknown) {
    logger.error('Failed to log AI usage:', 'API:route', error);
  }
}