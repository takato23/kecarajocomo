// src/lib/services/geminiMealService.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import geminiConfig from '@/lib/config/gemini.config';;
import { logger } from '@/services/logger';
import { generateArgentineMealPlanPrompt, generateDailyMealPrompt, ARGENTINE_MEAL_CULTURE } from '@/lib/prompts/argentineMealPrompts';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(geminiConfig.getApiKey()!);

const RecipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string(),
    category: z.enum(['verduleria', 'carniceria', 'almacen', 'panaderia', 'fiambreria'])
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
    fiber: z.number()
  }),
  culturalNotes: z.string().optional()
});

const MealPlanSchema = z.record(z.record(z.object({
  recipe: RecipeSchema
})));

export async function generateMealPlan(options: {
  weekStart: Date;
  weekEnd: Date;
  preferences: any;
  culturalContext: any;
}) {
  const model = genAI.getGenerativeModel({ 
    model: geminiConfig.default.model,
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  });

  // Determinar contexto argentino
  const season = getCurrentSeason();
  const argentineContext = {
    season: season as any,
    region: 'buenosAires' as any,
    budget: getBudgetLevel(options.preferences.weeklyBudget) as any,
    cookingTime: getCookingTimeLevel(options.preferences.maxPrepTimePerMeal) as any,
    familySize: options.preferences.householdSize || 2,
    dietaryRestrictions: [
      ...(options.preferences.dietaryRestrictions || []),
      ...(options.preferences.allergies || [])
    ].filter(Boolean)
  };

  const prompt = generateArgentineMealPlanPrompt(argentineContext);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parsear JSON con manejo de errores
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se encontró JSON válido en la respuesta');
    
    const mealPlan = JSON.parse(jsonMatch[0]);
    
    // Validar con Zod
    const validated = MealPlanSchema.parse(mealPlan);
    
    return validated;
  } catch (error) {
    logger.error('Error generando plan:', error);
    
    // Retry con temperatura más baja
    if (error instanceof z.ZodError) {
      return generateMealPlanWithLowerTemp(options);
    }
    
    throw error;
  }
}

export async function regenerateMeal(options: {
  dayIndex: number;
  mealType: string;
  currentPlan: any;
  avoidRepetition: boolean;
}) {
  const model = genAI.getGenerativeModel({ model: geminiConfig.default.model });
  
  // Obtener comidas existentes para evitar repetición
  const existingMeals = new Set<string>();
  if (options.avoidRepetition) {
    Object.values(options.currentPlan).forEach((day: any) => {
      Object.values(day).forEach((meal: any) => {
        if (meal?.recipe?.name) {
          existingMeals.add(meal.recipe.name.toLowerCase());
        }
      });
    });
  }

  const mealTypeSpanish = options.mealType === 'breakfast' ? 'desayuno' :
                         options.mealType === 'lunch' ? 'almuerzo' :
                         options.mealType === 'snack' ? 'merienda' : 'cena';

  const dayName = getDayName(options.dayIndex);
  const isWeekend = options.dayIndex >= 5;
  const isSunday = options.dayIndex === 6;

  const prompt = `# REGENERAR COMIDA ARGENTINA

Genera UNA receta argentina auténtica para ${mealTypeSpanish} del ${dayName}.

CONTEXTO CULTURAL:
${ARGENTINE_MEAL_CULTURE}

EVITAR REPETICIONES:
${Array.from(existingMeals).map(meal => `- ${meal}`).join('\n')}

CONSIDERACIONES ESPECIALES:
${isWeekend ? '- Es fin de semana, permitir comidas más elaboradas' : '- Es día de semana, comidas prácticas'}
${isSunday && options.mealType === 'lunch' ? '- Es domingo, considerar asado si es almuerzo' : ''}
${options.dayIndex === 28 && options.mealType === 'lunch' ? '- Es día 29, incluir ñoquis' : ''}

TIPO DE COMIDA: ${mealTypeSpanish}
- ${mealTypeSpanish === 'desayuno' ? 'Liviano, con café/mate, tostadas o facturas' : ''}
- ${mealTypeSpanish === 'almuerzo' ? 'Comida principal, puede incluir carne, pasta, guarnición' : ''}
- ${mealTypeSpanish === 'merienda' ? 'SIEMPRE incluir mate, algo dulce, tortas caseras' : ''}
- ${mealTypeSpanish === 'cena' ? 'Puede ser liviana o completa, típicamente 21-22hs' : ''}

Responder SOLO con JSON válido, sin markdown:
{
  "recipe": {
    "name": "Nombre del plato argentino",
    "ingredients": [
      {
        "name": "ingrediente",
        "amount": 200,
        "unit": "g",
        "category": "verduleria|carniceria|almacen|panaderia|fiambreria"
      }
    ],
    "instructions": ["Paso 1", "Paso 2"],
    "prepTime": 15,
    "cookTime": 30,
    "servings": 2,
    "nutrition": {
      "calories": 400,
      "protein": 25,
      "carbs": 50,
      "fat": 15,
      "fiber": 5
    },
    "culturalNotes": "Información cultural del plato"
  }
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se encontró JSON válido');
  
  const meal = JSON.parse(jsonMatch[0]);
  return meal.recipe ? RecipeSchema.parse(meal.recipe) : RecipeSchema.parse(meal);
}

// Helpers
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'otoño';
  if (month >= 5 && month <= 7) return 'invierno';
  if (month >= 8 && month <= 10) return 'primavera';
  return 'verano';
}

function getBudgetLevel(weeklyBudget?: number): string {
  if (!weeklyBudget) return 'moderado';
  if (weeklyBudget < 50000) return 'economico';
  if (weeklyBudget < 100000) return 'moderado';
  return 'amplio';
}

function getCookingTimeLevel(maxPrepTime?: number): string {
  if (!maxPrepTime) return 'normal';
  if (maxPrepTime <= 30) return 'rapido';
  if (maxPrepTime <= 60) return 'normal';
  return 'elaborado';
}

function getSpecialDates(start: Date, end: Date): string[] {
  const special = [];
  
  // Check if 29 is in range (ñoquis day)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDate() === 29) {
      special.push('Día de ñoquis (29)');
    }
  }
  
  return special;
}

function getDayName(index: number): string {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index];
}

async function generateMealPlanWithLowerTemp(options: any) {
  // Implementación con temperatura más baja para mayor precisión
  const model = genAI.getGenerativeModel({ 
    model: geminiConfig.default.model,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
    }
  });
  
  // Usar un prompt más simple para evitar errores de parsing
  const simplifiedPrompt = `Genera un plan de comidas argentino semanal en JSON válido con la estructura exacta:
{
  "0": {
    "breakfast": { "recipe": { "name": "Café con tostadas", "ingredients": [], "instructions": [], "prepTime": 5, "cookTime": 5, "servings": 2, "nutrition": {"calories": 200, "protein": 5, "carbs": 30, "fat": 8, "fiber": 2} } },
    "lunch": { "recipe": { "name": "Milanesas con puré", "ingredients": [], "instructions": [], "prepTime": 20, "cookTime": 25, "servings": 2, "nutrition": {"calories": 600, "protein": 35, "carbs": 50, "fat": 25, "fiber": 4} } },
    "snack": { "recipe": { "name": "Mate con bizcochos", "ingredients": [], "instructions": [], "prepTime": 5, "cookTime": 0, "servings": 2, "nutrition": {"calories": 150, "protein": 3, "carbs": 25, "fat": 5, "fiber": 1} } },
    "dinner": { "recipe": { "name": "Tortilla de papas", "ingredients": [], "instructions": [], "prepTime": 15, "cookTime": 20, "servings": 2, "nutrition": {"calories": 400, "protein": 15, "carbs": 40, "fat": 20, "fiber": 3} } }
  }
}

Incluir solo el día 0 por ahora, comidas argentinas auténticas.`;

  const result = await model.generateContent(simplifiedPrompt);
  const response = await result.response;
  const text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback a un plan básico
    return createBasicArgentinePlan();
  }
  
  try {
    const mealPlan = JSON.parse(jsonMatch[0]);
    return mealPlan;
  } catch {
    return createBasicArgentinePlan();
  }
}

function createBasicArgentinePlan() {
  // Plan básico argentino como fallback
  return {
    "0": {
      "breakfast": {
        "recipe": {
          "name": "Café con leche y tostadas",
          "ingredients": [
            { "name": "café", "amount": 10, "unit": "g", "category": "almacen" },
            { "name": "leche", "amount": 250, "unit": "ml", "category": "almacen" },
            { "name": "pan", "amount": 2, "unit": "rebanadas", "category": "panaderia" }
          ],
          "instructions": ["Preparar café con leche", "Tostar el pan", "Servir caliente"],
          "prepTime": 5,
          "cookTime": 5,
          "servings": 1,
          "nutrition": { "calories": 300, "protein": 12, "carbs": 40, "fat": 10, "fiber": 2 },
          "culturalNotes": "Desayuno clásico argentino"
        }
      },
      "lunch": {
        "recipe": {
          "name": "Milanesas con puré",
          "ingredients": [
            { "name": "milanesas", "amount": 2, "unit": "unidades", "category": "carniceria" },
            { "name": "papas", "amount": 500, "unit": "g", "category": "verduleria" }
          ],
          "instructions": ["Freír las milanesas", "Hacer puré de papas", "Servir con limón"],
          "prepTime": 20,
          "cookTime": 25,
          "servings": 2,
          "nutrition": { "calories": 650, "protein": 40, "carbs": 50, "fat": 30, "fiber": 4 },
          "culturalNotes": "Plato argentino por excelencia"
        }
      },
      "snack": {
        "recipe": {
          "name": "Mate con bizcochos",
          "ingredients": [
            { "name": "yerba mate", "amount": 30, "unit": "g", "category": "almacen" },
            { "name": "bizcochos", "amount": 3, "unit": "unidades", "category": "panaderia" }
          ],
          "instructions": ["Cebar el mate", "Servir con bizcochos"],
          "prepTime": 5,
          "cookTime": 0,
          "servings": 1,
          "nutrition": { "calories": 200, "protein": 5, "carbs": 35, "fat": 6, "fiber": 2 },
          "culturalNotes": "Merienda tradicional argentina"
        }
      },
      "dinner": {
        "recipe": {
          "name": "Empanadas de carne",
          "ingredients": [
            { "name": "empanadas", "amount": 4, "unit": "unidades", "category": "carniceria" }
          ],
          "instructions": ["Hornear las empanadas", "Servir calientes"],
          "prepTime": 5,
          "cookTime": 20,
          "servings": 2,
          "nutrition": { "calories": 500, "protein": 25, "carbs": 45, "fat": 25, "fiber": 3 },
          "culturalNotes": "Cena práctica y típica"
        }
      }
    }
  };
}