/**
 * Servicio de Planificación con Gemini
 * Integra el sistema de prompts holístico con la funcionalidad existente
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import { 
  UserPreferences, 
  PlanningConstraints, 
  WeeklyPlan 
} from '../types/mealPlanning';
// removed prisma reliance

import { 
  GeminiPlannerPrompts, 
  GeminiCLIIntegration, 
  type GeminiPromptConfig,
  type HolisticPlannerContext 
} from './geminiPlannerPrompts';
import { enhancedCache, CacheKeyGenerator } from './enhancedCacheService';

export interface GeminiPlannerOptions {
  readonly useHolisticAnalysis: boolean;
  readonly includeExternalFactors: boolean;
  readonly optimizeResources: boolean;
  readonly enableLearning: boolean;
  readonly analysisDepth: 'surface' | 'comprehensive' | 'deep_dive';
}

export interface GeminiPlanResult {
  readonly success: boolean;
  readonly plan?: WeeklyPlan;
  readonly insights?: {
    readonly holisticAnalysis: any;
    readonly optimizationRecommendations: any;
    readonly learningAdaptations: any;
  };
  readonly metadata: {
    readonly promptTokens: number;
    readonly responseTokens: number;
    readonly processingTime: number;
    readonly confidenceScore: number;
    readonly geminiModel: string;
  };
  readonly error?: string;
}

/**
 * Servicio principal para planificación con Gemini
 */
export class GeminiPlannerService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas para análisis holístico
  
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY or NEXT_PUBLIC_GOOGLE_AI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Usando Flash 2.0 para optimizar costos
      generationConfig: {
        temperature: 0.4, // Balanceado para creatividad y precisión
        maxOutputTokens: 4096,
        topP: 0.8,
        topK: 40,
      }
    });
  }

  /**
   * Genera plan holístico usando el sistema completo de prompts
   */
  async generateHolisticPlan(
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    options: GeminiPlannerOptions = {
      useHolisticAnalysis: true,
      includeExternalFactors: true,
      optimizeResources: true,
      enableLearning: true,
      analysisDepth: 'comprehensive'
    }
  ): Promise<GeminiPlanResult> {
    const startTime = Date.now();
    
    try {
      // 1. Construir contexto holístico
      const context = await this.buildHolisticContext(preferences, constraints);
      
      // 2. Configurar prompts según opciones
      const promptConfig = this.getPromptConfiguration(options);
      
      // 3. Verificar cache para análisis similar
      const cacheKey = CacheKeyGenerator.holisticPlan(
        preferences.userId,
        JSON.stringify(constraints),
        JSON.stringify(options)
      );
      
      const cached = await enhancedCache.get<GeminiPlanResult>(cacheKey);
      if (cached && !this.isContextStale(cached, context)) {
        return cached;
      }

      // 4. Generar prompt comprensivo
      const comprehensivePrompt = GeminiPlannerPrompts.generateComprehensivePlannerPrompt(
        context,
        promptConfig
      );

      // 5. Ejecutar análisis con Gemini
      const result = await this.executeGeminiAnalysis(comprehensivePrompt);
      
      // 6. Procesar y validar respuesta
      const processedResult = await this.processGeminiResponse(result, context, startTime);
      
      // 7. Cache del resultado
      await enhancedCache.set(cacheKey, processedResult, this.CACHE_TTL);
      
      return processedResult;
      
    } catch (error: unknown) {
      console.error('Error in holistic planning:', error);
      return {
        success: false,
        metadata: {
          promptTokens: 0,
          responseTokens: 0,
          processingTime: Date.now() - startTime,
          confidenceScore: 0,
          geminiModel: 'gemini-1.5-pro'
        },
        error: error instanceof Error ? error.message : 'Unknown error in holistic planning'
      };
    }
  }

  /**
   * Análisis rápido para planificación diaria
   */
  async generateDailyOptimization(
    preferences: UserPreferences,
    currentPlan: Partial<WeeklyPlan>,
    focusDay: Date
  ): Promise<GeminiPlanResult> {
    const context = await this.buildDailyContext(preferences, currentPlan, focusDay);
    const config = GeminiCLIIntegration.getPromptConfig('daily');
    
    const prompt = `
    ${GeminiPlannerPrompts.generateResourceOptimizationPrompt()}
    
    CONTEXTO ESPECÍFICO DEL DÍA:
    - Fecha: ${focusDay.toLocaleDateString('es-ES')}
    - Plan actual: ${JSON.stringify(currentPlan, null, 2)}
    - Preferencias: ${JSON.stringify(preferences, null, 2)}
    
    OBJETIVO: Optimizar únicamente este día considerando:
    1. Tiempo disponible específico del usuario
    2. Ingredientes disponibles en despensa
    3. Energía y motivación estimada
    4. Contexto de la semana (día laboral/fin de semana)
    
    RESPUESTA ESPERADA: Optimizaciones específicas y actionables para este día únicamente.
    `;

    const result = await this.executeGeminiAnalysis(prompt);
    return this.processGeminiResponse(result, context, Date.now());
  }

  /**
   * Sistema de aprendizaje basado en feedback
   */
  async processLearningFeedback(
    planId: string,
    feedback: {
      mealRatings: Record<string, number>;
      timeAccuracy: Record<string, number>;
      difficultyActual: Record<string, number>;
      innovations: string[];
      challenges: string[];
    }
  ): Promise<{ insights: any; adaptations: any }> {
    const prompt = `
    ${GeminiPlannerPrompts.generateLearningAdaptationPrompt()}
    
    FEEDBACK RECIBIDO:
    ${JSON.stringify(feedback, null, 2)}
    
    ANÁLISIS REQUERIDO:
    1. Identificar patrones en el feedback
    2. Correlacionar satisfacción con características de recetas
    3. Ajustar estimaciones de tiempo y dificultad
    4. Extraer insights para futuros planes
    5. Generar adaptaciones específicas
    
    FORMATO DE RESPUESTA: JSON con análisis detallado y recomendaciones de adaptación.
    `;

    const result = await this.executeGeminiAnalysis(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      
      // Guardar insights en base de datos para futuras referencias
      await this.saveLearningInsights(planId, parsed);
      
      return {
        insights: parsed.insights || {},
        adaptations: parsed.adaptations || {}
      };
    } catch (error) {
      console.error('Error processing learning feedback:', error);
      return { insights: {}, adaptations: {} };
    }
  }

  /**
   * Construir contexto holístico completo
   */
  private async buildHolisticContext(
    preferences: UserPreferences,
    constraints: PlanningConstraints
  ): Promise<HolisticPlannerContext> {
    const [pantryItems, favoriteRecipes, userHistory, feedback] = await Promise.all([
      this.getUserPantryItems(preferences.userId),
      this.getUserFavoriteRecipes(preferences.userId),
      this.getUserPlanningHistory(preferences.userId),
      this.getUserFeedbackHistory(preferences.userId)
    ]);

    return {
      userState: {
        preferences,
        constraints,
        history: userHistory,
        feedback: feedback
      },
      systemState: {
        pantryInventory: pantryItems,
        recipeLibrary: favoriteRecipes,
        seasonalFactors: this.getSeasonalFactors(),
        economicFactors: this.getEconomicFactors()
      },
      externalFactors: {
        weather: await this.getWeatherContext(),
        calendar: this.getCalendarContext(),
        social: this.getSocialContext(),
        market: this.getMarketContext()
      }
    };
  }

  /**
   * Construir contexto para optimización diaria
   */
  private async buildDailyContext(
    preferences: UserPreferences,
    currentPlan: Partial<WeeklyPlan>,
    focusDay: Date
  ): Promise<HolisticPlannerContext> {
    // Versión simplificada del contexto holístico para análisis diario
    const pantryItems = await this.getUserPantryItems(preferences.userId);
    
    return {
      userState: {
        preferences,
        constraints: {
          startDate: focusDay,
          endDate: focusDay,
          mealTypes: ['breakfast', 'lunch', 'dinner'],
          servings: preferences.householdSize,
          maxPrepTime: 60, // Default para análisis diario
          budgetLimit: undefined
        },
        history: [],
        feedback: []
      },
      systemState: {
        pantryInventory: pantryItems,
        recipeLibrary: [],
        seasonalFactors: this.getSeasonalFactors(),
        economicFactors: {}
      },
      externalFactors: {
        weather: { temperature: 20, condition: 'clear' }, // Mock data
        calendar: { events: [], availability: 'normal' },
        social: { meals_planned: 0, guests: 0 },
        market: { promotions: [], availability: 'normal' }
      }
    };
  }

  /**
   * Configuración de prompts según opciones
   */
  private getPromptConfiguration(options: GeminiPlannerOptions): GeminiPromptConfig {
    const baseFiles = [
      '@./src/features/meal-planning/',
      '@./src/lib/types/mealPlanning.ts',
      '@./src/features/pantry/',
      '@./src/features/recipes/'
    ];

    const contextFiles = [...baseFiles];
    
    if (options.includeExternalFactors) {
      contextFiles.push('@./src/services/', '@./src/features/dashboard/');
    }
    
    if (options.enableLearning) {
      contextFiles.push('@./src/features/gamification/', '@./src/features/growth-stack/');
    }

    return {
      contextFiles,
      analysisDepth: options.analysisDepth,
      optimizationFocus: 'holistic',
      adaptationLevel: options.enableLearning ? 'learning' : 'dynamic'
    };
  }

  /**
   * Ejecutar análisis con Gemini
   */
  private async executeGeminiAnalysis(prompt: string) {
    return await Promise.race([
      this.model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini request timeout')), 60000) // 60s timeout
      )
    ]);
  }

  /**
   * Procesar respuesta de Gemini
   */
  private async processGeminiResponse(
    result: any, 
    context: HolisticPlannerContext, 
    startTime: number
  ): Promise<GeminiPlanResult> {
    const response = await result.response;
    const text = response.text();
    const processingTime = Date.now() - startTime;

    try {
      const parsedResponse = JSON.parse(text);
      
      // Validar estructura de respuesta
      if (!this.validateGeminiResponse(parsedResponse)) {
        throw new Error('Invalid Gemini response structure');
      }

      // Convertir respuesta a formato WeeklyPlan
      const weeklyPlan = await this.convertToWeeklyPlan(parsedResponse, context);
      
      return {
        success: true,
        plan: weeklyPlan,
        insights: {
          holisticAnalysis: parsedResponse.week_integration || {},
          optimizationRecommendations: parsedResponse.optimization_strategies || {},
          learningAdaptations: parsedResponse.learning_integration || {}
        },
        metadata: {
          promptTokens: this.estimateTokens(text), // Estimación
          responseTokens: text.length / 4, // Estimación
          processingTime,
          confidenceScore: this.calculateConfidence(parsedResponse),
          geminiModel: 'gemini-1.5-pro'
        }
      };
      
    } catch (error) {
      console.error('Error processing Gemini response:', error);
      return {
        success: false,
        metadata: {
          promptTokens: 0,
          responseTokens: 0,
          processingTime,
          confidenceScore: 0,
          geminiModel: 'gemini-1.5-pro'
        },
        error: `Failed to process Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Métodos auxiliares
   */
  private async getUserPantryItems(userId: string) {
    try {
      // Placeholder until Supabase integration is added
      return [] as any[];
    } catch {
      return [] as any[];
    }
  }

  private async getUserFavoriteRecipes(userId: string) {
    try {
      // Placeholder until Supabase integration is added
      return [] as any[];
    } catch {
      return [] as any[];
    }
  }

  private async getUserPlanningHistory(userId: string) {
    // TODO: Implementar cuando tengamos tabla de historial
    return [];
  }

  private async getUserFeedbackHistory(userId: string) {
    // TODO: Implementar cuando tengamos tabla de feedback
    return [];
  }

  private getSeasonalFactors() {
    const month = new Date().getMonth() + 1;
    const season = month >= 12 || month <= 2 ? 'verano' : 
                   month >= 3 && month <= 5 ? 'otoño' : 
                   month >= 6 && month <= 8 ? 'invierno' : 'primavera';
    
    return {
      season,
      month,
      seasonalProduce: this.getSeasonalProduce(season),
      weatherPatterns: this.getWeatherPatterns(season)
    };
  }

  private getEconomicFactors() {
    // Mock data - en producción conectar con APIs de precios
    return {
      inflation_rate: 0.08,
      seasonal_price_variations: {},
      current_promotions: []
    };
  }

  private async getWeatherContext() {
    // Mock data - en producción conectar con API del clima
    return {
      temperature: 22,
      condition: 'clear',
      humidity: 60,
      forecast: 'stable'
    };
  }

  private getCalendarContext() {
    return {
      events: [], // TODO: Integrar con calendario del usuario
      availability: 'normal',
      special_dates: []
    };
  }

  private getSocialContext() {
    return {
      meals_planned: 0,
      guests: 0,
      social_events: []
    };
  }

  private getMarketContext() {
    return {
      promotions: [],
      availability: 'normal',
      seasonal_pricing: {}
    };
  }

  private getSeasonalProduce(season: string) {
    const seasonalMap = {
      'verano': ['tomate', 'pepino', 'sandía', 'durazno'],
      'otoño': ['calabaza', 'manzana', 'pera', 'batata'],
      'invierno': ['brócoli', 'coliflor', 'naranja', 'mandarina'],
      'primavera': ['espárragos', 'frutillas', 'espinaca', 'lechuga']
    };
    return seasonalMap[season] || [];
  }

  private getWeatherPatterns(season: string) {
    const patterns = {
      'verano': { avg_temp: 28, preference: 'light_fresh' },
      'otoño': { avg_temp: 20, preference: 'balanced' },
      'invierno': { avg_temp: 12, preference: 'warm_comfort' },
      'primavera': { avg_temp: 22, preference: 'fresh_varied' }
    };
    return patterns[season] || patterns['primavera'];
  }

  private validateGeminiResponse(response: any): boolean {
    // Validación básica de estructura
    return response && 
           (response.week_plan || response.daily_plans) &&
           typeof response === 'object';
  }

  private async convertToWeeklyPlan(geminiResponse: any, context: HolisticPlannerContext): Promise<WeeklyPlan> {
    // Convertir respuesta de Gemini al formato WeeklyPlan existente
    const plan: WeeklyPlan = {
      id: `gemini-plan-${Date.now()}`,
      userId: context.userState.preferences.userId,
      weekStartDate: context.userState.constraints.startDate,
      meals: [],
      nutritionSummary: geminiResponse.nutritional_analysis || {},
      budgetSummary: geminiResponse.optimization_summary || {},
      prepPlan: geminiResponse.meal_prep_plan || {},
      shoppingList: geminiResponse.shopping_list_preview || [],
      confidence: this.calculateConfidence(geminiResponse),
      generatedAt: new Date(),
      metadata: {
        aiModel: 'gemini-1.5-pro',
        generationTime: 0, // Se calcula fuera
        revisionCount: 1,
        userFeedback: null
      }
    };

    // Procesar daily_plans si existen
    if (geminiResponse.daily_plans) {
      plan.meals = geminiResponse.daily_plans.map((dayPlan: any, index: number) => {
        const date = new Date(context.userState.constraints.startDate);
        date.setDate(date.getDate() + index);
        
        return {
          date,
          breakfast: this.convertMealFromGemini(dayPlan.meals?.breakfast),
          lunch: this.convertMealFromGemini(dayPlan.meals?.lunch),
          dinner: this.convertMealFromGemini(dayPlan.meals?.dinner)
        };
      });
    }

    return plan;
  }

  private convertMealFromGemini(geminiMeal: any) {
    if (!geminiMeal) return null;
    
    return {
      recipeId: `gemini-${Date.now()}-${Math.random()}`,
      recipe: {
        id: `gemini-${Date.now()}-${Math.random()}`,
        title: geminiMeal.recipe?.name || geminiMeal.name,
        description: geminiMeal.recipe?.description || '',
        prepTimeMinutes: geminiMeal.recipe?.timing?.prep_time || geminiMeal.prep_time || 30,
        cookTimeMinutes: geminiMeal.recipe?.timing?.cook_time || geminiMeal.cook_time || 30,
        servings: geminiMeal.recipe?.servings || geminiMeal.servings || 4,
        difficulty: geminiMeal.recipe?.difficulty || geminiMeal.difficulty || 'medium',
        ingredients: (geminiMeal.recipe?.ingredients || geminiMeal.ingredients || []).map((ing: any) => ({
          name: typeof ing === 'string' ? ing : ing.name,
          quantity: typeof ing === 'object' ? ing.quantity : 1,
          unit: typeof ing === 'object' ? ing.unit : 'porción'
        }))
      },
      confidence: 0.85,
      reasoning: geminiMeal.contextual_optimization?.energy_alignment || '',
      nutritionMatch: 0.8,
      budgetMatch: 0.7,
      pantryMatch: 0.6,
      timeMatch: 0.8,
      preferenceMatch: 0.75
    };
  }

  private calculateConfidence(response: any): number {
    // Algoritmo simple de cálculo de confianza basado en completitud de respuesta
    let score = 0.5; // Base score
    
    if (response.week_plan || response.daily_plans) score += 0.2;
    if (response.optimization_summary) score += 0.1;
    if (response.nutritional_analysis) score += 0.1;
    if (response.shopping_list_preview) score += 0.05;
    if (response.meal_prep_plan) score += 0.05;
    
    return Math.min(score, 1.0);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Estimación aproximada
  }

  private isContextStale(cached: GeminiPlanResult, currentContext: HolisticPlannerContext): boolean {
    // TODO: Implementar lógica para determinar si el contexto ha cambiado significativamente
    return false;
  }

  private async saveLearningInsights(planId: string, insights: any): Promise<void> {
    // TODO: Implementar guardado de insights para machine learning
    console.log('Saving learning insights for plan:', planId, insights);
  }
}

// Export singleton instance
export const geminiPlannerService = new GeminiPlannerService();