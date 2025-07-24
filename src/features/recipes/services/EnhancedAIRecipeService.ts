/**
 * Enhanced AI Recipe Service
 * Integrates with unified AI service and provides prompt transparency, 
 * pantry integration, and multiple generation modes
 */

import { UnifiedAIService } from '@/services/ai';
import { UnifiedStorageService } from '@/services/storage';
import { NotificationManager } from '@/services/notifications';

import type { Recipe } from '../types';

export interface EnhancedRecipeRequest {
  // Basic parameters
  prompt?: string;
  ingredients?: string[];
  pantryIngredients?: string[];
  
  // Preferences
  cuisine?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  difficulty?: 'easy' | 'medium' | 'hard';
  servings?: number;
  maxCookTime?: number;
  
  // Dietary restrictions
  dietary?: string[];
  allergies?: string[];
  
  // Generation options
  provider?: 'openai' | 'anthropic' | 'gemini';
  showPrompt?: boolean;
  temperature?: number;
  
  // Context
  occasionType?: 'casual' | 'special' | 'healthy' | 'comfort';
  budgetLevel?: 'low' | 'medium' | 'high';
}

export interface GeneratedRecipeResponse {
  recipe: Recipe;
  generatedPrompt: string;
  confidence: number;
  provider: string;
  suggestions: string[];
  alternativeIngredients?: Array<{
    original: string;
    alternatives: string[];
    reason: string;
  }>;
  costEstimate?: {
    total: number;
    perServing: number;
    currency: string;
  };
}

export class EnhancedAIRecipeService {
  private aiService: UnifiedAIService;
  private storageService: UnifiedStorageService;
  private notificationService: NotificationManager;

  constructor() {
    this.aiService = new UnifiedAIService();
    this.storageService = new UnifiedStorageService();
    this.notificationService = new NotificationManager();
  }

  /**
   * Generate recipe with AI using intelligent prompt building
   */
  async generateRecipe(request: EnhancedRecipeRequest): Promise<GeneratedRecipeResponse> {
    try {
      // Build intelligent prompt
      const prompt = await this.buildIntelligentPrompt(request);
      
      // Show prompt to user if requested
      if (request.showPrompt) {
        await this.notificationService.notify({
          type: 'info',
          title: 'Prompt Generado',
          message: 'Puedes revisar el prompt que se enviará a la IA',
          data: { prompt },
          priority: 'medium'
        });
      }

      // Generate recipe using unified AI service
      const aiResponse = await this.aiService.generateRecipe({
        ingredients: request.ingredients || [],
        preferences: {
          cuisine: request.cuisine,
          dietary: request.dietary,
          difficulty: request.difficulty,
          servings: request.servings,
          maxCookTime: request.maxCookTime,
          mealType: request.mealType,
          additionalPreferences: request.prompt
        },
        customPrompt: prompt,
        provider: request.provider
      });

      // Enhance response with additional features
      const enhancedResponse = await this.enhanceRecipeResponse(aiResponse, request);

      // Cache the generated recipe
      await this.cacheGeneratedRecipe(enhancedResponse.recipe, request);

      return enhancedResponse;

    } catch (error: unknown) {
      console.error('Error generating recipe:', error);
      
      await this.notificationService.notify({
        type: 'error',
        title: 'Error al Generar Receta',
        message: 'No se pudo generar la receta. Intenta de nuevo.',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Generate recipe from pantry ingredients
   */
  async generateFromPantry(userId: string, additionalRequest?: Partial<EnhancedRecipeRequest>): Promise<GeneratedRecipeResponse> {
    try {
      // Get pantry ingredients
      const pantryItems = await this.storageService.get(`pantry_${userId}`) || [];
      
      if (pantryItems.length === 0) {
        // Suggest popular recipes if no pantry items
        return this.suggestPopularRecipes(additionalRequest);
      }

      // Extract ingredient names
      const pantryIngredients = pantryItems
        .filter((item: any) => item.quantity > 0 && !this.isExpired(item))
        .map((item: any) => item.name);

      const request: EnhancedRecipeRequest = {
        ...additionalRequest,
        pantryIngredients,
        ingredients: pantryIngredients,
        prompt: `Crear una receta usando principalmente los ingredientes que tengo en mi despensa: ${pantryIngredients.join(', ')}. ${additionalRequest?.prompt || ''}`
      };

      return this.generateRecipe(request);

    } catch (error: unknown) {
      console.error('Error generating recipe from pantry:', error);
      throw error;
    }
  }

  /**
   * Generate recipe alternatives
   */
  async generateAlternatives(baseRecipe: Recipe, modifications: string[]): Promise<GeneratedRecipeResponse[]> {
    const alternatives: GeneratedRecipeResponse[] = [];

    for (const modification of modifications) {
      try {
        const request: EnhancedRecipeRequest = {
          prompt: `Modifica esta receta: "${baseRecipe.title}" - ${modification}. Receta original: ${baseRecipe.instructions.join(' ')}`,
          servings: baseRecipe.servings,
          difficulty: baseRecipe.difficulty,
          showPrompt: false
        };

        const alternative = await this.generateRecipe(request);
        alternatives.push(alternative);
      } catch (error: unknown) {
        console.error(`Error generating alternative: ${modification}`, error);
      }
    }

    return alternatives;
  }

  /**
   * Build intelligent prompt based on context
   */
  private async buildIntelligentPrompt(request: EnhancedRecipeRequest): Promise<string> {
    const promptParts: string[] = [];

    // Base instruction
    promptParts.push('Genera una receta deliciosa y práctica en español.');

    // Ingredients context
    if (request.pantryIngredients && request.pantryIngredients.length > 0) {
      promptParts.push(`Usa principalmente estos ingredientes de mi despensa: ${request.pantryIngredients.join(', ')}.`);
    }

    if (request.ingredients && request.ingredients.length > 0) {
      promptParts.push(`Ingredientes específicos a incluir: ${request.ingredients.join(', ')}.`);
    }

    // Preferences
    if (request.cuisine) {
      promptParts.push(`Estilo de cocina: ${request.cuisine}.`);
    }

    if (request.mealType) {
      const mealTypeMap = {
        breakfast: 'desayuno',
        lunch: 'almuerzo',
        dinner: 'cena',
        snack: 'merienda',
        dessert: 'postre'
      };
      promptParts.push(`Tipo de comida: ${mealTypeMap[request.mealType]}.`);
    }

    if (request.difficulty) {
      const difficultyMap = {
        easy: 'fácil',
        medium: 'intermedio',
        hard: 'avanzado'
      };
      promptParts.push(`Nivel de dificultad: ${difficultyMap[request.difficulty]}.`);
    }

    if (request.servings) {
      promptParts.push(`Para ${request.servings} personas.`);
    }

    if (request.maxCookTime) {
      promptParts.push(`Tiempo máximo de cocción: ${request.maxCookTime} minutos.`);
    }

    // Dietary restrictions
    if (request.dietary && request.dietary.length > 0) {
      promptParts.push(`Restricciones dietarias: ${request.dietary.join(', ')}.`);
    }

    if (request.allergies && request.allergies.length > 0) {
      promptParts.push(`Alergias a evitar: ${request.allergies.join(', ')}.`);
    }

    // Context
    if (request.occasionType) {
      const occasionMap = {
        casual: 'para una comida casual',
        special: 'para una ocasión especial',
        healthy: 'saludable y nutritiva',
        comfort: 'reconfortante y casera'
      };
      promptParts.push(`Receta ${occasionMap[request.occasionType]}.`);
    }

    if (request.budgetLevel) {
      const budgetMap = {
        low: 'con ingredientes económicos',
        medium: 'con ingredientes de precio moderado',
        high: 'usando ingredientes premium'
      };
      promptParts.push(`Preparar ${budgetMap[request.budgetLevel]}.`);
    }

    // Custom prompt
    if (request.prompt) {
      promptParts.push(request.prompt);
    }

    // Output format
    promptParts.push(`
Incluye:
- Título atractivo
- Descripción breve
- Lista de ingredientes con cantidades exactas
- Instrucciones paso a paso numeradas
- Tiempo de preparación y cocción
- Información nutricional aproximada
- Tips o sugerencias adicionales

Responde en formato JSON válido.`);

    return promptParts.join(' ');
  }

  /**
   * Enhance AI response with additional features
   */
  private async enhanceRecipeResponse(
    aiResponse: any,
    request: EnhancedRecipeRequest
  ): Promise<GeneratedRecipeResponse> {
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      user_id: '', // Will be set by caller
      title: aiResponse.title,
      description: aiResponse.description,
      instructions: Array.isArray(aiResponse.instructions) 
        ? aiResponse.instructions 
        : aiResponse.instructions.split('\n').filter(Boolean),
      ingredients: aiResponse.ingredients.map((ing: any) => ({
        name: ing.name,
        quantity: ing.quantity || ing.amount,
        unit: ing.unit,
        notes: ing.notes
      })),
      prep_time: aiResponse.prepTimeMinutes || aiResponse.prep_time || 15,
      cook_time: aiResponse.cookTimeMinutes || aiResponse.cook_time || 20,
      servings: aiResponse.servings || request.servings || 4,
      difficulty: aiResponse.difficulty || request.difficulty || 'medium',
      cuisine: aiResponse.cuisine || request.cuisine || 'international',
      tags: aiResponse.tags || [],
      ai_generated: true,
      ai_provider: request.provider || 'openai',
      times_cooked: 0,
      is_public: false,
      nutritional_info: aiResponse.nutritionInfo || aiResponse.nutritional_info,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Calculate total time
    recipe.total_time = recipe.prep_time + recipe.cook_time;

    // Generate alternative ingredients if requested
    const alternativeIngredients = await this.generateAlternativeIngredients(recipe.ingredients);

    // Estimate cost if possible
    const costEstimate = await this.estimateCost(recipe.ingredients, recipe.servings);

    return {
      recipe,
      generatedPrompt: await this.buildIntelligentPrompt(request),
      confidence: aiResponse.confidence || 0.85,
      provider: request.provider || 'openai',
      suggestions: aiResponse.suggestions || [
        'Puedes ajustar las especias según tu gusto',
        'Acompaña con una ensalada fresca',
        'Guarda las sobras en el refrigerador por hasta 3 días'
      ],
      alternativeIngredients,
      costEstimate
    };
  }

  /**
   * Suggest popular recipes when pantry is empty
   */
  private async suggestPopularRecipes(request?: Partial<EnhancedRecipeRequest>): Promise<GeneratedRecipeResponse> {
    const popularRecipePrompts = [
      'Una pasta simple y deliciosa con ingredientes básicos',
      'Un arroz frito casero con verduras',
      'Tortilla española clásica',
      'Pollo al horno con especias',
      'Ensalada completa y nutritiva'
    ];

    const randomPrompt = popularRecipePrompts[Math.floor(Math.random() * popularRecipePrompts.length)];

    const enhancedRequest: EnhancedRecipeRequest = {
      ...request,
      prompt: randomPrompt,
      showPrompt: false
    };

    await this.notificationService.notify({
      type: 'info',
      title: 'Despensa Vacía',
      message: 'No tienes ingredientes en tu despensa. Te sugerimos una receta popular.',
      priority: 'medium'
    });

    return this.generateRecipe(enhancedRequest);
  }

  /**
   * Generate alternative ingredients
   */
  private async generateAlternativeIngredients(ingredients: any[]): Promise<any[]> {
    // This could use AI to suggest alternatives, for now return empty
    return [];
  }

  /**
   * Estimate recipe cost
   */
  private async estimateCost(ingredients: any[], servings: number): Promise<any> {
    // This could integrate with price APIs, for now return estimate
    const baseEstimate = ingredients.length * 2.5; // $2.5 per ingredient average
    return {
      total: baseEstimate,
      perServing: baseEstimate / servings,
      currency: 'USD'
    };
  }

  /**
   * Check if pantry item is expired
   */
  private isExpired(item: any): boolean {
    if (!item.expiry_date) return false;
    return new Date(item.expiry_date) < new Date();
  }

  /**
   * Cache generated recipe for faster access
   */
  private async cacheGeneratedRecipe(recipe: Recipe, request: EnhancedRecipeRequest): Promise<void> {
    try {
      const cacheKey = `generated_recipe_${Date.now()}`;
      await this.storageService.set(cacheKey, {
        recipe,
        request,
        timestamp: Date.now()
      }, { ttl: 3600000 }); // Cache for 1 hour
    } catch (error: unknown) {
      console.error('Error caching recipe:', error);
    }
  }
}

export const enhancedAIRecipeService = new EnhancedAIRecipeService();