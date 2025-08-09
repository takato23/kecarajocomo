import { NextRequest, NextResponse } from 'next/server'
import geminiConfig from '@/lib/config/gemini.config';;
import { logger } from '@/services/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Validation schemas
const weeklyRequestSchema = z.object({
  userId: z.string(),
  weekStart: z.string(),
  preferences: z.object({
    dietary_restrictions: z.array(z.string()).default([]),
    favorite_dishes: z.array(z.string()).default([]),
    disliked_ingredients: z.array(z.string()).default([]),
    household_size: z.number().default(2),
    budget_weekly: z.number().default(0),
    region: z.enum(['NOA', 'NEA', 'CABA', 'PBA', 'Cuyo', 'Patagonia']).optional(),
  }),
  excludeRecipeIds: z.array(z.string()).default([]),
  mode: z.enum(['normal', 'economico', 'fiesta', 'dieta']).default('normal')
});

const argentineWeeklyPlanSchema = z.object({
  plan: z.object({
    id: z.string(),
    userId: z.string(),
    weekStart: z.string(),
    weekEnd: z.string(),
    days: z.array(z.object({
      date: z.string(),
      label: z.string(),
      meals: z.object({
        breakfast: z.object({
          slot: z.literal('breakfast'),
          time: z.string(),
          recipe: z.object({
            id: z.string(),
            name: z.string(),
            ingredients: z.array(z.object({
              name: z.string(),
              amount: z.number().optional(),
              unit: z.string().optional(),
              aisle: z.enum(['verduleria', 'carniceria', 'almacen', 'panaderia', 'fiambreria', 'pescaderia', 'otros']).optional(),
            })),
            instructions: z.array(z.string()),
            prepTime: z.number(),
            cookTime: z.number(),
            servings: z.number(),
            nutrition: z.object({
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            }),
            culturalNotes: z.string().optional(),
            tags: z.array(z.string()).default([]),
          }),
          aiGenerated: z.boolean().default(true),
        }),
        lunch: z.object({
          slot: z.literal('lunch'),
          time: z.string(),
          recipe: z.object({
            id: z.string(),
            name: z.string(),
            ingredients: z.array(z.object({
              name: z.string(),
              amount: z.number().optional(),
              unit: z.string().optional(),
              aisle: z.enum(['verduleria', 'carniceria', 'almacen', 'panaderia', 'fiambreria', 'pescaderia', 'otros']).optional(),
            })),
            instructions: z.array(z.string()),
            prepTime: z.number(),
            cookTime: z.number(),
            servings: z.number(),
            nutrition: z.object({
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            }),
            culturalNotes: z.string().optional(),
            tags: z.array(z.string()).default([]),
          }),
          aiGenerated: z.boolean().default(true),
        }),
        snack: z.object({
          slot: z.literal('snack'),
          time: z.string(),
          recipe: z.object({
            id: z.string(),
            name: z.string(),
            ingredients: z.array(z.object({
              name: z.string(),
              amount: z.number().optional(),
              unit: z.string().optional(),
              aisle: z.enum(['verduleria', 'carniceria', 'almacen', 'panaderia', 'fiambreria', 'pescaderia', 'otros']).optional(),
            })),
            instructions: z.array(z.string()),
            prepTime: z.number(),
            cookTime: z.number(),
            servings: z.number(),
            nutrition: z.object({
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            }),
            culturalNotes: z.string().optional(),
            tags: z.array(z.string()).default([]),
          }),
          aiGenerated: z.boolean().default(true),
        }),
        dinner: z.object({
          slot: z.literal('dinner'),
          time: z.string(),
          recipe: z.object({
            id: z.string(),
            name: z.string(),
            ingredients: z.array(z.object({
              name: z.string(),
              amount: z.number().optional(),
              unit: z.string().optional(),
              aisle: z.enum(['verduleria', 'carniceria', 'almacen', 'panaderia', 'fiambreria', 'pescaderia', 'otros']).optional(),
            })),
            instructions: z.array(z.string()),
            prepTime: z.number(),
            cookTime: z.number(),
            servings: z.number(),
            nutrition: z.object({
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            }),
            culturalNotes: z.string().optional(),
            tags: z.array(z.string()).default([]),
          }),
          aiGenerated: z.boolean().default(true),
        }),
      }),
    })),
    metadata: z.object({
      season: z.string(),
      region: z.string(),
      mode: z.enum(['normal', 'economico', 'fiesta', 'dieta']),
      createdAt: z.string(),
    }),
  })
});

export const dynamic = 'force-dynamic';

function buildWeeklyPlanPrompt(data: z.infer<typeof weeklyRequestSchema>) {
  const { userId, weekStart, preferences, excludeRecipeIds, mode } = data;
  const { region = 'CABA' } = preferences;
  
  const seasonMap: Record<string, string> = {
    '12': 'verano', '01': 'verano', '02': 'verano',
    '03': 'otoño', '04': 'otoño', '05': 'otoño',
    '06': 'invierno', '07': 'invierno', '08': 'invierno',
    '09': 'primavera', '10': 'primavera', '11': 'primavera'
  };
  
  const currentMonth = new Date(weekStart).getMonth() + 1;
  const season = seasonMap[currentMonth.toString().padStart(2, '0')] || 'verano';
  
  const regionalIngredients: Record<string, string[]> = {
    'NOA': ['quinoa', 'llama', 'cabra', 'chañar', 'algarroba', 'locro', 'empanadas salteñas'],
    'NEA': ['surubí', 'dorado', 'mandioca', 'chipá', 'tereré', 'pacú'],
    'CABA': ['pizza porteña', 'empanadas porteñas', 'choripán', 'milanesas', 'asado'],
    'PBA': ['asado', 'milanesas', 'empanadas', 'dulce de leche', 'facturas'],
    'Cuyo': ['vino', 'cabrito', 'empanadas mendocinas', 'chivito', 'escabeche'],
    'Patagonia': ['cordero patagónico', 'centolla', 'trucha', 'calafate', 'merluza']
  };
  
  const modeInstructions = {
    'normal': 'Planificación equilibrada con ingredientes comunes y recetas tradicionales argentinas.',
    'economico': 'Priorizar ingredientes económicos, aprovechar cortes baratos de carne, usar legumbres y verduras de estación.',
    'fiesta': 'Incluir platos festivos, asado, empanadas, picadas, postres especiales para celebraciones.',
    'dieta': 'Comidas saludables, porciones controladas, más verduras y proteínas magras, menos frituras.'
  };

  return `Sos un chef argentino especializado en planificación de comidas. Necesito que generes un plan semanal COMPLETO para ${region}, estación ${season}, modo ${mode}.

INSTRUCCIONES ESPECÍFICAS:
- Región: ${region} - usar ingredientes típicos: ${regionalIngredients[region]?.join(', ') || 'ingredientes argentinos tradicionales'}
- Estación: ${season} - usar ingredientes de temporada
- Modo: ${mode} - ${modeInstructions[mode]}
- Tamaño familiar: ${preferences.household_size} personas
- Presupuesto semanal: $${preferences.budget_weekly || 'sin límite'}

RESTRICCIONES:
- Alergias/restricciones: ${preferences.dietary_restrictions.join(', ') || 'ninguna'}
- Ingredientes no deseados: ${preferences.disliked_ingredients.join(', ') || 'ninguno'}
- NO usar estas recetas: ${excludeRecipeIds.join(', ') || 'ninguna restricción'}

PREFERENCIAS:
- Platos favoritos: ${preferences.favorite_dishes.join(', ') || 'variado'}

REQUIREMENTS CULTURALES ARGENTINOS:
- Domingo debe incluir asado o comida especial
- Incluir mate o infusiones en desayunos/meriendas
- Si es día 29, incluir ñoquis en el almuerzo
- Meriendas con facturas, tostadas o algo dulce
- Cenas más ligeras que almuerzos
- Usar cortes de carne argentinos (bife de chorizo, entraña, etc.)

Genera un plan semanal desde ${weekStart} con esta estructura JSON exacta:

{
  "plan": {
    "id": "plan_[timestamp]",
    "userId": "${userId}",
    "weekStart": "${weekStart}",
    "weekEnd": "[calcular 6 días después]",
    "days": [
      {
        "date": "YYYY-MM-DD",
        "label": "Lunes/Martes/etc",
        "meals": {
          "breakfast": {
            "slot": "breakfast",
            "time": "08:00",
            "recipe": {
              "id": "recipe_[id]",
              "name": "[nombre receta]",
              "ingredients": [{"name": "string", "amount": number, "unit": "string", "aisle": "verduleria|carniceria|almacen|panaderia|fiambreria|pescaderia|otros"}],
              "instructions": ["paso 1", "paso 2"],
              "prepTime": number,
              "cookTime": number,
              "servings": ${preferences.household_size},
              "nutrition": {"calories": number, "protein": number, "carbs": number, "fat": number},
              "culturalNotes": "contexto cultural argentino",
              "tags": ["desayuno", "mate", etc]
            },
            "aiGenerated": true
          },
          "lunch": { /* mismo formato */ },
          "snack": { /* mismo formato con "merienda" tags */ },
          "dinner": { /* mismo formato */ }
        }
      }
      // ... repetir para 7 días
    ],
    "metadata": {
      "season": "${season}",
      "region": "${region}",
      "mode": "${mode}",
      "createdAt": "[ISO timestamp]"
    }
  }
}

IMPORTANTE: Responder SOLO con el JSON válido, sin texto adicional.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = weeklyRequestSchema.parse(body);
    
    const apiKey = geminiConfig.getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    });

    const prompt = buildWeeklyPlanPrompt(validatedData);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = result.response.text();
    const json = JSON.parse(text);
    
    // Validate response
    const parsed = argentineWeeklyPlanSchema.safeParse(json);
    
    if (parsed.success) {
      return NextResponse.json(parsed.data);
    } else {
      // Fallback: return basic structure if validation fails
      logger.error('Gemini response validation failed:', parsed.error);
      return NextResponse.json({ 
        error: 'Invalid response format from AI',
        details: parsed.error.errors 
      }, { status: 502 });
    }
    
  } catch (error) {
    logger.error('Gemini weekly plan error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate weekly plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}