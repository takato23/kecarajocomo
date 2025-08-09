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
    const { pantryItems, preferences, count = 5 } = body;

    if (!pantryItems || !Array.isArray(pantryItems)) {
      return NextResponse.json(
        { error: 'Pantry items are required' },
        { status: 400 }
      );
    }

    // Build system prompt for pantry-based suggestions
    const systemPrompt = `Eres un chef experto especializado en crear recetas aprovechando al máximo los ingredientes disponibles. Tu objetivo es minimizar el desperdicio de comida y maximizar el uso de ingredientes que ya tiene el usuario.

REGLAS:
1. Prioriza ingredientes que estén próximos a vencer
2. Sugiere recetas que usen la mayor cantidad posible de ingredientes disponibles
3. Minimiza ingredientes adicionales necesarios
4. Incluye variedad: desayunos, almuerzos, cenas, snacks
5. Considera restricciones dietéticas del usuario
6. Responde con un JSON que contenga un array de recetas

ESTRUCTURA JSON:
{
  "recipes": [
    {
      "name": "string",
      "description": "string",
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
      "instructions": ["string"],
      "cook_time": number,
      "prep_time": number,
      "servings": number,
      "difficulty": "facil|intermedio|dificil|experto",
      "category": "string",
      "cuisine_type": "string",
      "pantry_match_score": number (0-1),
      "additional_ingredients_needed": ["string"],
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number
      },
      "tags": ["string"],
      "reasoning": "string - explicación de por qué usar estos ingredientes"
    }
  ],
  "pantry_usage_summary": {
    "total_ingredients_available": number,
    "ingredients_used": number,
    "waste_reduction_score": number
  }
}`;

    // Build user prompt with pantry information
    const userPrompt = `INGREDIENTES DISPONIBLES EN DESPENSA:
${pantryItems.map(item => {
  const expInfo = item.expiration ? ` (vence: ${new Date(item.expiration).toLocaleDateString()})` : '';
  const urgency = item.expiration && new Date(item.expiration) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? ' ⚠️ PRÓXIMO A VENCER' : '';
  return `- ${item.name}: ${item.quantity} ${item.unit}${expInfo}${urgency}`;
}).join('\n')}

PREFERENCIAS DEL USUARIO:
- Restricciones dietéticas: ${Object.entries(preferences.dietary_restrictions || {})
  .filter(([_, value]) => value)
  .map(([key, _]) => key)
  .join(', ') || 'Ninguna'}
- Nivel de habilidad: ${preferences.skill_level || 'intermedio'}
- Tiempo preferido de cocción: ${preferences.preferred_cook_time || 30} minutos
- Ingredientes favoritos: ${preferences.favorite_ingredients?.join(', ') || 'No especificados'}
- Ingredientes a evitar: ${preferences.disliked_ingredients?.join(', ') || 'Ninguno'}

INSTRUCCIONES:
- Sugiere ${count} recetas diferentes que maximicen el uso de ingredientes disponibles
- Da prioridad absoluta a ingredientes próximos a vencer
- Incluye recetas de diferentes momentos del día
- Minimiza ingredientes adicionales necesarios
- Calcula un score de coincidencia con la despensa (0-1)
- Explica por qué cada receta es una buena opción

Genera las sugerencias de recetas:`;

    // Call Gemini API
    const aiResponse = await callGeminiAPI(systemPrompt, userPrompt);
    
    // Parse response
    const suggestionsData = await parseAndValidateSuggestionsResponse(aiResponse);
    
    // Enhance suggestions with additional metadata
    const enhancedSuggestions = await enhanceSuggestions(suggestionsData, pantryItems);
    
    // Log AI usage
    await logAIUsage(user.id, 'pantry_suggestions', {
      input_tokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
      output_tokens: Math.ceil(aiResponse.length / 4),
      success: true,
      pantry_items_count: pantryItems.length
    });

    return NextResponse.json(enhancedSuggestions);

  } catch (error: unknown) {
    logger.error('Pantry suggestions error:', 'API:route', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate pantry suggestions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = geminiConfig.getApiKey() || geminiConfig.getApiKey();
  
  if (!apiKey) {
    logger.warn('Gemini API key not available, using mock response', 'API:route');
    return JSON.stringify(getMockPantrySuggestions().content[0].text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: geminiConfig.default.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
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
    
    return text.trim();
  } catch (error: unknown) {
    logger.warn('Using fallback for pantry suggestions:', 'API:route', error);
    return JSON.stringify(getMockPantrySuggestions().content[0].text);
  }
}

function getMockPantrySuggestions(): any {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          recipes: [
            {
              name: "Tortilla Española de Papas",
              description: "Clásica tortilla española cremosa con papas y cebolla, perfecta para cualquier momento del día.",
              ingredients: [
                {
                  name: "papas",
                  quantity: 500,
                  unit: "g",
                  preparation: "peladas y cortadas en láminas finas",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "huevos",
                  quantity: 6,
                  unit: "pcs",
                  preparation: "batidos",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "cebolla",
                  quantity: 1,
                  unit: "pieza",
                  preparation: "cortada en juliana",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "aceite de oliva",
                  quantity: 100,
                  unit: "ml",
                  preparation: "",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "sal",
                  quantity: 1,
                  unit: "tsp",
                  preparation: "",
                  optional: false,
                  available_in_pantry: true
                }
              ],
              instructions: [
                "Calentar el aceite en una sartén antiadherente a fuego medio.",
                "Freír las papas y la cebolla durante 15-20 minutos hasta que estén tiernas.",
                "Escurrir el exceso de aceite y mezclar con los huevos batidos.",
                "Sazonar con sal y dejar reposar 10 minutos.",
                "Calentar una cucharada de aceite en la sartén y verter la mezcla.",
                "Cocinar 5 minutos por un lado, dar vuelta y cocinar 3 minutos más.",
                "Servir caliente o a temperatura ambiente."
              ],
              cook_time: 25,
              prep_time: 15,
              servings: 4,
              difficulty: "intermedio",
              category: "almuerzo",
              cuisine_type: "española",
              pantry_match_score: 1.0,
              additional_ingredients_needed: [],
              nutrition: {
                calories: 280,
                protein: 12,
                carbs: 20,
                fat: 18,
                fiber: 2
              },
              tags: ["tortilla", "papas", "huevos", "español", "vegetariano"],
              reasoning: "Perfecta para usar papas que pueden estar próximas a brotar, utiliza ingredientes básicos que sueles tener disponibles."
            },
            {
              name: "Ensalada de Pollo con Verduras",
              description: "Ensalada fresca y nutritiva con pollo, perfecta para una comida ligera y saludable.",
              ingredients: [
                {
                  name: "pechuga de pollo",
                  quantity: 300,
                  unit: "g",
                  preparation: "cocida y desmenuzada",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "lechuga",
                  quantity: 200,
                  unit: "g",
                  preparation: "lavada y cortada",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "tomate",
                  quantity: 2,
                  unit: "pcs",
                  preparation: "cortados en cubos",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "aceite de oliva",
                  quantity: 3,
                  unit: "tbsp",
                  preparation: "",
                  optional: false,
                  available_in_pantry: true
                },
                {
                  name: "limón",
                  quantity: 1,
                  unit: "pcs",
                  preparation: "exprimido",
                  optional: false,
                  available_in_pantry: false
                }
              ],
              instructions: [
                "Cocinar la pechuga de pollo a la plancha con sal y pimienta.",
                "Dejar enfriar y desmenuzar en tiras.",
                "Lavar y cortar la lechuga en trozos medianos.",
                "Cortar los tomates en cubos.",
                "Preparar vinagreta mezclando aceite de oliva, jugo de limón y sal.",
                "Mezclar todos los ingredientes en un bowl grande.",
                "Aliñar con la vinagreta y servir inmediatamente."
              ],
              cook_time: 10,
              prep_time: 15,
              servings: 2,
              difficulty: "facil",
              category: "almuerzo",
              cuisine_type: "mediterranea",
              pantry_match_score: 0.8,
              additional_ingredients_needed: ["limón"],
              nutrition: {
                calories: 320,
                protein: 35,
                carbs: 8,
                fat: 16,
                fiber: 4
              },
              tags: ["ensalada", "pollo", "saludable", "ligero", "proteína"],
              reasoning: "Excelente para usar verduras frescas antes de que se marchiten, el pollo aporta proteína y es muy versátil."
            }
          ],
          pantry_usage_summary: {
            total_ingredients_available: 8,
            ingredients_used: 7,
            waste_reduction_score: 0.85
          },
          usage: {
            input_tokens: 800,
            output_tokens: 1200
          }
        })
      }
    ]
  };
}

async function parseAndValidateSuggestionsResponse(aiResponse: string): Promise<any> {
  try {
    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    // Parse response directly (it should already be clean JSON)
    const suggestionsData = JSON.parse(aiResponse);

    // Validate structure
    if (!suggestionsData.recipes || !Array.isArray(suggestionsData.recipes)) {
      throw new Error('Invalid recipes format in response');
    }

    // Validate each recipe
    for (const recipe of suggestionsData.recipes) {
      if (!recipe.name || !recipe.ingredients || !recipe.instructions) {
        throw new Error('Invalid recipe structure');
      }
    }

    return suggestionsData;
  } catch (error: unknown) {
    throw new Error(`Failed to parse suggestions response: ${error.message}`);
  }
}

async function enhanceSuggestions(suggestionsData: any, pantryItems: any[]): Promise<any> {
  // Add additional metadata and analysis
  const pantryIngredientNames = pantryItems.map(item => item.name.toLowerCase());
  
  // Calculate expiration urgency
  const urgentItems = pantryItems.filter(item => {
    if (!item.expiration) return false;
    const expirationDate = new Date(item.expiration);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return expirationDate <= threeDaysFromNow;
  });

  // Enhance each recipe with additional analysis
  suggestionsData.recipes = suggestionsData.recipes.map((recipe: any) => {
    // Calculate how many urgent ingredients it uses
    const urgentIngredientsUsed = recipe.ingredients.filter((ing: any) => 
      urgentItems.some(urgent => urgent.name.toLowerCase().includes(ing.name.toLowerCase()))
    ).length;

    // Calculate actual pantry match score based on available ingredients
    const availableIngredients = recipe.ingredients.filter((ing: any) => 
      pantryIngredientNames.some(pantryIng => 
        pantryIng.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(pantryIng)
      )
    );
    
    const actualPantryScore = recipe.ingredients.length > 0 ? 
      availableIngredients.length / recipe.ingredients.length : 0;

    return {
      ...recipe,
      pantry_match_score: Math.round(actualPantryScore * 100) / 100,
      urgent_ingredients_used: urgentIngredientsUsed,
      urgency_score: urgentIngredientsUsed / Math.max(urgentItems.length, 1),
      estimated_cost_savings: calculateCostSavings(availableIngredients.length, recipe.ingredients.length)
    };
  });

  // Sort recipes by priority (urgency + pantry match)
  suggestionsData.recipes.sort((a: any, b: any) => {
    const scoreA = (a.urgency_score * 0.6) + (a.pantry_match_score * 0.4);
    const scoreB = (b.urgency_score * 0.6) + (b.pantry_match_score * 0.4);
    return scoreB - scoreA;
  });

  return suggestionsData;
}

function calculateCostSavings(availableCount: number, totalCount: number): string {
  const savingsPercentage = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;
  
  if (savingsPercentage >= 80) return 'Alto ahorro';
  if (savingsPercentage >= 60) return 'Ahorro moderado';
  if (savingsPercentage >= 40) return 'Ahorro básico';
  return 'Pocos ingredientes disponibles';
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
          pantry_items_count: metrics.pantry_items_count
        },
        created_at: new Date().toISOString()
      });
  } catch (error: unknown) {
    logger.error('Failed to log AI usage:', 'API:route', error);
  }
}