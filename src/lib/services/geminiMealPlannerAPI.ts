/**
 * Servicio Optimizado de Planificación de Comidas con Gemini API
 * Diseñado para funcionar en Vercel con Gemini Flash 2.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import type { 
  UserPreferences, 
  PlanningConstraints 
} from '../types/mealPlanning';

import { enhancedCache, CacheKeyGenerator } from './enhancedCacheService';

export interface SimplifiedMealPlanRequest {
  userPreferences: UserPreferences;
  constraints: PlanningConstraints;
  pantryItems?: string[]; // Simplificado para reducir tokens
  contextData?: {
    season: string;
    weather?: string;
    specialOccasions?: string[];
  };
}

export interface OptimizedMealPlanResponse {
  success: boolean;
  weekPlan?: {
    days: Array<{
      date: string;
      meals: {
        breakfast?: MealData;
        lunch?: MealData;
        dinner?: MealData;
      };
      prepNotes?: string[];
    }>;
    shoppingList: ShoppingListItem[];
    batchCookingSuggestions: string[];
    nutritionSummary: NutritionSummary;
    estimatedCost: number;
  };
  error?: string;
}

interface MealData {
  name: string;
  ingredients: string[];
  prepTime: number;
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface ShoppingListItem {
  item: string;
  quantity: string;
  category: string;
  estimatedCost?: number;
}

interface NutritionSummary {
  dailyAverage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  weeklyTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export class GeminiMealPlannerAPI {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048, // Reducido para optimizar costos
        topP: 0.85,
        topK: 40,
      }
    });
  }

  /**
   * Genera un plan semanal optimizado
   */
  async generateWeeklyMealPlan(request: SimplifiedMealPlanRequest): Promise<OptimizedMealPlanResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = await enhancedCache.get<OptimizedMealPlanResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate optimized prompt
      const prompt = this.buildOptimizedPrompt(request);
      
      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse and validate response
      const planResponse = this.parseGeminiResponse(text);
      
      // Cache the result
      await enhancedCache.set(cacheKey, planResponse, 2 * 60 * 60 * 1000); // 2 hours
      
      return planResponse;
      
    } catch (error) {
      console.error('Error generating meal plan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate meal plan'
      };
    }
  }

  /**
   * Genera una receta individual contextualizada
   */
  async generateSingleRecipe(
    mealType: 'breakfast' | 'lunch' | 'dinner',
    preferences: UserPreferences,
    context?: {
      availableIngredients?: string[];
      timeAvailable?: number;
      servings?: number;
    }
  ): Promise<MealData | null> {
    try {
      const prompt = `
Genera UNA receta de ${mealType} en español para Argentina.

PREFERENCIAS:
- Restricciones: ${preferences.dietaryRestrictions.join(', ') || 'ninguna'}
- Alergias: ${preferences.allergies.join(', ') || 'ninguna'}
- Porciones: ${context?.servings || preferences.householdSize}
- Tiempo máximo: ${context?.timeAvailable || 30} minutos
${context?.availableIngredients ? `- Ingredientes disponibles: ${context.availableIngredients.join(', ')}` : ''}

RESPONDE SOLO con JSON:
{
  "name": "nombre del plato",
  "ingredients": ["ingrediente 1", "ingrediente 2"],
  "prepTime": 20,
  "instructions": ["paso 1", "paso 2"],
  "nutrition": {
    "calories": 350,
    "protein": 20,
    "carbs": 40,
    "fat": 15
  }
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const cleanJson = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch {
        console.error('Failed to parse recipe JSON');
        return null;
      }
      
    } catch (error) {
      console.error('Error generating recipe:', error);
      return null;
    }
  }

  /**
   * Construye un prompt optimizado para reducir tokens
   */
  private buildOptimizedPrompt(request: SimplifiedMealPlanRequest): string {
    const { userPreferences: prefs, constraints, pantryItems, contextData } = request;
    
    return `
Genera un plan de comidas para 7 días en Argentina.

USUARIO:
- Personas: ${prefs.householdSize}
- Restricciones: ${prefs.dietaryRestrictions.join(', ') || 'ninguna'}
- Alergias: ${prefs.allergies.join(', ') || 'ninguna'}
- Presupuesto semanal: $${prefs.weeklyBudget || 10000} ARS
- Tiempo máximo cocina: ${constraints.maxPrepTime || 45} min

${pantryItems?.length ? `DESPENSA: ${pantryItems.slice(0, 10).join(', ')}` : ''}
${contextData ? `CONTEXTO: ${contextData.season}, ${contextData.weather || 'templado'}` : ''}

GENERA un plan que:
1. Use ingredientes de despensa primero
2. Sugiera batch cooking el domingo
3. Reutilice sobras creativamente
4. Mantenga variedad nutricional
5. Respete presupuesto

RESPONDE SOLO con este JSON:
{
  "days": [
    {
      "date": "Lunes",
      "meals": {
        "breakfast": {
          "name": "nombre",
          "ingredients": ["ing1", "ing2"],
          "prepTime": 15,
          "instructions": ["paso1", "paso2"],
          "nutrition": {"calories": 300, "protein": 15, "carbs": 40, "fat": 10}
        },
        "lunch": { /* igual */ },
        "dinner": { /* igual */ }
      },
      "prepNotes": ["preparar X para mañana"]
    }
    /* 6 días más */
  ],
  "shoppingList": [
    {"item": "pollo", "quantity": "1kg", "category": "proteínas", "estimatedCost": 1500}
  ],
  "batchCookingSuggestions": [
    "Cocinar 2kg arroz el domingo",
    "Preparar salsa de tomate para 3 comidas"
  ],
  "nutritionSummary": {
    "dailyAverage": {"calories": 2000, "protein": 80, "carbs": 250, "fat": 70},
    "weeklyTotal": {"calories": 14000, "protein": 560, "carbs": 1750, "fat": 490}
  },
  "estimatedCost": 8500
}`;
  }

  /**
   * Parsea la respuesta de Gemini
   */
  private parseGeminiResponse(text: string): OptimizedMealPlanResponse {
    try {
      // Limpiar el texto de markdown si existe
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      return {
        success: true,
        weekPlan: parsed
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        success: false,
        error: 'Failed to parse meal plan response'
      };
    }
  }

  /**
   * Genera clave de caché única
   */
  private generateCacheKey(request: SimplifiedMealPlanRequest): string {
    const key = {
      userId: request.userPreferences.userId,
      restrictions: request.userPreferences.dietaryRestrictions,
      allergies: request.userPreferences.allergies,
      startDate: request.constraints.startDate.toISOString().split('T')[0],
      pantryHash: request.pantryItems?.slice(0, 5).join(',') || ''
    };
    
    return CacheKeyGenerator.mealPlan(
      key.userId,
      JSON.stringify(key).substring(0, 32)
    );
  }

  /**
   * Optimiza la lista de compras basada en precios locales
   */
  async optimizeShoppingList(
    shoppingList: ShoppingListItem[],
    budget?: number
  ): Promise<{
    optimizedList: ShoppingListItem[];
    savings: number;
    alternatives: Record<string, string[]>;
  }> {
    // TODO: Implementar optimización con datos de precios locales
    return {
      optimizedList: shoppingList,
      savings: 0,
      alternatives: {}
    };
  }
}

// Export singleton instance
export const geminiMealPlannerAPI = new GeminiMealPlannerAPI();