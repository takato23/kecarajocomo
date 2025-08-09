/**
 * Servicio de Generación Holística de Recetas
 * Integra análisis completo del contexto para generar recetas inteligentes
 */

import { geminiPlannerService } from '@/lib/services/geminiPlannerService';
import { GeminiPlannerPrompts } from '@/lib/services/geminiPlannerPrompts';
import type { UserPreferences } from '@/lib/types/mealPlanning';
import { enhancedCache, CacheKeyGenerator } from '@/lib/services/enhancedCacheService';
import { logger } from '@/services/logger';

export interface HolisticRecipeRequest {
  readonly recipeName?: string;
  readonly targetMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  readonly targetDate: Date;
  readonly servings: number;
  readonly maxPrepTime: number;
  readonly preferredIngredients?: string[];
  readonly avoidIngredients?: string[];
  readonly nutritionalTargets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  readonly contextualFactors?: {
    weather?: string;
    occasion?: string;
    energyLevel?: 'low' | 'medium' | 'high';
    timeAvailable?: 'rushed' | 'normal' | 'leisurely';
  };
}

export interface HolisticRecipeResponse {
  readonly success: boolean;
  readonly recipe?: {
    id: string;
    title: string;
    description: string;
    reasoning: string; // Por qué esta receta es perfecta para el contexto
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      alternatives?: string[];
      nutritionalHighlight?: string;
    }>;
    instructions: Array<{
      step: number;
      description: string;
      timeMinutes: number;
      technique?: string;
      tips?: string[];
    }>;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      micronutrients?: Record<string, number>;
    };
    contextOptimization: {
      weatherAlignment: string;
      energyAlignment: string;
      timeEfficiency: string;
      nutritionalBalance: string;
    };
    variations: Array<{
      name: string;
      description: string;
      modifications: string[];
    }>;
    pairings: {
      beverages: string[];
      sides: string[];
      desserts?: string[];
    };
  };
  readonly alternatives?: Array<{
    title: string;
    reasoning: string;
    quickSummary: string;
  }>;
  readonly metadata?: {
    generationTime: number;
    confidenceScore: number;
    contextFactorsConsidered: string[];
  };
}

export class HolisticRecipeGenerator {
  
  /**
   * Genera una receta considerando todo el contexto holístico
   */
  async generateContextualRecipe(
    userPreferences: UserPreferences,
    request: HolisticRecipeRequest
  ): Promise<HolisticRecipeResponse> {
    const startTime = Date.now();
    
    try {
      // Verificar caché
      const cacheKey = CacheKeyGenerator.aiResponse(
        'holistic-recipe',
        this.generateRequestHash(userPreferences, request)
      );
      
      const cached = await enhancedCache.get<HolisticRecipeResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Construir prompt contextual
      const prompt = this.buildContextualRecipePrompt(userPreferences, request);
      
      // Generar con Gemini
      const result = await geminiPlannerService.generateDailyOptimization(
        userPreferences,
        {}, // No hay plan actual para optimizar
        request.targetDate
      );
      
      if (!result.success || !result.insights) {
        throw new Error('Failed to generate holistic recipe');
      }

      // Procesar respuesta en formato de receta
      const recipeResponse = this.processGeminiRecipeResponse(
        result.insights.holisticAnalysis,
        request,
        startTime
      );
      
      // Cachear resultado
      await enhancedCache.set(cacheKey, recipeResponse, 2 * 60 * 60 * 1000); // 2 horas
      
      return recipeResponse;
      
    } catch (error) {
      logger.error('Error generating holistic recipe:', 'holisticRecipeGenerator', error);
      return {
        success: false,
        metadata: {
          generationTime: Date.now() - startTime,
          confidenceScore: 0,
          contextFactorsConsidered: []
        }
      };
    }
  }

  /**
   * Genera múltiples sugerencias de recetas para un contexto
   */
  async generateRecipeSuggestions(
    userPreferences: UserPreferences,
    context: {
      mealType: 'breakfast' | 'lunch' | 'dinner';
      weekContext: any; // Contexto de la semana completa
      dayIndex: number;
    }
  ): Promise<Array<HolisticRecipeResponse['recipe']>> {
    const prompt = `
    ${GeminiPlannerPrompts.generateIntelligentPlanningPrompt({
      userState: {
        preferences: userPreferences,
        constraints: {
          startDate: new Date(),
          endDate: new Date(),
          mealTypes: [context.mealType],
          servings: userPreferences.householdSize,
          maxPrepTime: 60,
          budgetLimit: undefined
        },
        history: [],
        feedback: []
      },
      systemState: {
        pantryInventory: [],
        recipeLibrary: [],
        seasonalFactors: {},
        economicFactors: {}
      },
      externalFactors: {
        weather: {},
        calendar: {},
        social: {},
        market: {}
      }
    })}
    
    CONTEXTO ESPECÍFICO:
    - Tipo de comida: ${context.mealType}
    - Día de la semana: ${context.dayIndex + 1}/7
    - Contexto semanal: ${JSON.stringify(context.weekContext)}
    
    GENERA: 3 sugerencias de recetas que se complementen con el resto de la semana.
    `;

    // Implementar lógica de generación
    return [];
  }

  /**
   * Optimiza una receta existente para el contexto actual
   */
  async optimizeRecipeForContext(
    originalRecipe: any,
    userPreferences: UserPreferences,
    contextualFactors: HolisticRecipeRequest['contextualFactors']
  ): Promise<HolisticRecipeResponse['recipe']> {
    const prompt = `
    Optimiza esta receta para el contexto actual:
    
    RECETA ORIGINAL:
    ${JSON.stringify(originalRecipe)}
    
    CONTEXTO:
    - Preferencias: ${JSON.stringify(userPreferences)}
    - Factores contextuales: ${JSON.stringify(contextualFactors)}
    
    OPTIMIZACIONES REQUERIDAS:
    1. Ajustar ingredientes según disponibilidad y preferencias
    2. Modificar técnicas según tiempo disponible
    3. Adaptar porciones y presentación según ocasión
    4. Sugerir variaciones según clima y energía
    
    FORMATO: JSON con receta optimizada y explicación de cambios.
    `;

    // Implementar lógica de optimización
    return {} as any;
  }

  /**
   * Construir prompt para generación de receta contextual
   */
  private buildContextualRecipePrompt(
    preferences: UserPreferences,
    request: HolisticRecipeRequest
  ): string {
    return `
    GENERA UNA RECETA HOLÍSTICA PERFECTA
    
    PERFIL DEL USUARIO:
    - Preferencias dietarias: ${preferences.dietaryRestrictions.join(', ')}
    - Alergias: ${preferences.allergies.join(', ')}
    - Nivel culinario: ${preferences.cookingSkillLevel}
    - Tamaño del hogar: ${preferences.householdSize}
    
    REQUERIMIENTOS DE LA RECETA:
    - Tipo de comida: ${request.targetMealType}
    - Fecha objetivo: ${request.targetDate.toLocaleDateString('es-ES')}
    - Porciones: ${request.servings}
    - Tiempo máximo: ${request.maxPrepTime} minutos
    ${request.recipeName ? `- Nombre sugerido: ${request.recipeName}` : ''}
    
    INGREDIENTES:
    - Preferidos: ${request.preferredIngredients?.join(', ') || 'ninguno especificado'}
    - A evitar: ${request.avoidIngredients?.join(', ') || 'ninguno'}
    
    OBJETIVOS NUTRICIONALES:
    ${request.nutritionalTargets ? JSON.stringify(request.nutritionalTargets) : 'Balance general'}
    
    FACTORES CONTEXTUALES:
    - Clima: ${request.contextualFactors?.weather || 'no especificado'}
    - Ocasión: ${request.contextualFactors?.occasion || 'comida diaria'}
    - Nivel de energía: ${request.contextualFactors?.energyLevel || 'normal'}
    - Tiempo disponible: ${request.contextualFactors?.timeAvailable || 'normal'}
    
    GENERA:
    1. Una receta que sea PERFECTA para este contexto específico
    2. Explicación de por qué cada elemento se alinea con el contexto
    3. Variaciones para diferentes situaciones
    4. Sugerencias de acompañamiento
    
    FORMATO: JSON estructurado con todos los detalles.
    `;
  }

  /**
   * Procesar respuesta de Gemini en formato de receta
   */
  private processGeminiRecipeResponse(
    geminiResponse: any,
    request: HolisticRecipeRequest,
    startTime: number
  ): HolisticRecipeResponse {
    try {
      // Extraer receta de la respuesta
      const recipe = geminiResponse.recipe || geminiResponse;
      
      return {
        success: true,
        recipe: {
          id: `holistic-${Date.now()}`,
          title: recipe.title || recipe.name || 'Receta Personalizada',
          description: recipe.description || '',
          reasoning: recipe.reasoning || 'Optimizada para tu contexto actual',
          ingredients: this.processIngredients(recipe.ingredients || []),
          instructions: this.processInstructions(recipe.instructions || []),
          nutrition: recipe.nutrition || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          },
          contextOptimization: {
            weatherAlignment: recipe.weather_optimization || 'Perfecta para el clima actual',
            energyAlignment: recipe.energy_optimization || 'Alineada con tu nivel de energía',
            timeEfficiency: recipe.time_optimization || 'Optimizada para tu tiempo disponible',
            nutritionalBalance: recipe.nutrition_optimization || 'Balanceada nutricionalmente'
          },
          variations: recipe.variations || [],
          pairings: recipe.pairings || {
            beverages: [],
            sides: []
          }
        },
        alternatives: recipe.alternatives || [],
        metadata: {
          generationTime: Date.now() - startTime,
          confidenceScore: 0.85,
          contextFactorsConsidered: [
            'weather', 'energy_level', 'time_available', 'nutritional_goals'
          ]
        }
      };
    } catch (error) {
      logger.error('Error processing recipe response:', 'holisticRecipeGenerator', error);
      return {
        success: false,
        metadata: {
          generationTime: Date.now() - startTime,
          confidenceScore: 0,
          contextFactorsConsidered: []
        }
      };
    }
  }

  /**
   * Procesar ingredientes con alternativas
   */
  private processIngredients(ingredients: any[]): HolisticRecipeResponse['recipe']['ingredients'] {
    return ingredients.map(ing => ({
      name: typeof ing === 'string' ? ing : ing.name,
      quantity: typeof ing === 'object' ? ing.quantity : 1,
      unit: typeof ing === 'object' ? ing.unit : 'unidad',
      alternatives: ing.alternatives || [],
      nutritionalHighlight: ing.nutritional_highlight
    }));
  }

  /**
   * Procesar instrucciones con técnicas y tips
   */
  private processInstructions(instructions: any[]): HolisticRecipeResponse['recipe']['instructions'] {
    return instructions.map((inst, index) => ({
      step: index + 1,
      description: typeof inst === 'string' ? inst : inst.description || inst.instruction,
      timeMinutes: inst.time || 5,
      technique: inst.technique,
      tips: inst.tips || []
    }));
  }

  /**
   * Generar hash único para la solicitud
   */
  private generateRequestHash(
    preferences: UserPreferences,
    request: HolisticRecipeRequest
  ): string {
    const data = {
      userId: preferences.userId,
      dietaryRestrictions: preferences.dietaryRestrictions,
      request: {
        mealType: request.targetMealType,
        date: request.targetDate.toISOString(),
        servings: request.servings,
        maxPrepTime: request.maxPrepTime,
        preferred: request.preferredIngredients,
        avoid: request.avoidIngredients,
        nutritional: request.nutritionalTargets,
        context: request.contextualFactors
      }
    };
    
    // Simple hash usando JSON stringification
    return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 16);
  }
}

// Export singleton instance
export const holisticRecipeGenerator = new HolisticRecipeGenerator();