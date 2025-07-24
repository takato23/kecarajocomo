import type {
  Recipe,
  RecipeGenerationRequest,
  UserRecipePreferences,
  ParsedRecipe,
  DifficultyLevel,
  CuisineType,
  RecipeCategory,
  NutritionGoals
} from '../../types/recipes';
import type { PantryItem } from '../../types/pantry';

import { recipeService } from './recipe.service';

interface AIRecipeResponse {
  recipe: ParsedRecipe;
  reasoning: string;
  alternatives: string[];
  nutritionNotes: string;
}

interface AIRecommendationContext {
  pantryItems: PantryItem[];
  userPreferences: UserRecipePreferences;
  mealHistory: Recipe[];
  seasonalFactors: string[];
  currentMealPlan?: any[];
}

export class AIRecipeService {
  private static instance: AIRecipeService;
  
  static getInstance(): AIRecipeService {
    if (!AIRecipeService.instance) {
      AIRecipeService.instance = new AIRecipeService();
    }
    return AIRecipeService.instance;
  }

  private readonly API_ENDPOINT = '/api/ai/recipes';

  // =====================================================
  // RECIPE GENERATION
  // =====================================================

  async generateRecipe(request: RecipeGenerationRequest): Promise<Recipe> {
    try {
      const prompt = this.buildRecipeGenerationPrompt(request);
      
      const response = await fetch(`${this.API_ENDPOINT}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          preferences: request.preferences,
          constraints: request.constraints,
          context: request.context
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const aiResponse: AIRecipeResponse = await response.json();
      
      // Convert AI response to our recipe format
      const recipe = await this.processAIRecipeResponse(aiResponse, request);
      
      return recipe;
    } catch (error: unknown) {
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
  }

  async suggestRecipesForPantry(
    pantryItems: PantryItem[], 
    preferences: UserRecipePreferences,
    count: number = 5
  ): Promise<Recipe[]> {
    try {
      const availableIngredients = pantryItems.map(item => ({
        name: item.ingredient?.name || 'Unknown',
        quantity: item.quantity,
        unit: item.unit,
        expiration: item.expiration_date
      }));

      const prompt = this.buildPantrySuggestionPrompt(availableIngredients, preferences, count);

      const response = await fetch(`${this.API_ENDPOINT}/suggest-pantry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          pantryItems: availableIngredients,
          preferences,
          count
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const suggestions = await response.json();
      
      // Process multiple recipe suggestions
      const recipes = await Promise.all(
        suggestions.recipes.map((aiRecipe: any) => 
          this.processAIRecipeResponse(aiRecipe, { preferences, constraints: {}, context: undefined })
        )
      );

      return recipes;
    } catch (error: unknown) {
      throw new Error(`Failed to suggest recipes: ${error.message}`);
    }
  }

  async optimizeRecipeForNutrition(
    recipeId: string, 
    nutritionGoals: NutritionGoals
  ): Promise<Recipe> {
    try {
      const originalRecipe = await recipeService.getRecipeById(recipeId);
      
      const prompt = this.buildNutritionOptimizationPrompt(originalRecipe, nutritionGoals);

      const response = await fetch(`${this.API_ENDPOINT}/optimize-nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          originalRecipe,
          nutritionGoals
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const optimizedRecipe = await response.json();
      
      return this.processAIRecipeResponse(optimizedRecipe, {
        preferences: { nutrition_goals: nutritionGoals } as UserRecipePreferences,
        constraints: {},
        context: undefined
      });
    } catch (error: unknown) {
      throw new Error(`Failed to optimize recipe: ${error.message}`);
    }
  }

  async generateWeeklyMealPlan(
    context: AIRecommendationContext,
    daysCount: number = 7
  ): Promise<{
    mealPlan: any[];
    shoppingList: any[];
    nutritionSummary: any;
    reasoning: string;
  }> {
    try {
      const prompt = this.buildWeeklyMealPlanPrompt(context, daysCount);

      const response = await fetch(`${this.API_ENDPOINT}/generate-meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context,
          daysCount
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const mealPlanResponse = await response.json();
      
      return {
        mealPlan: mealPlanResponse.mealPlan,
        shoppingList: mealPlanResponse.shoppingList,
        nutritionSummary: mealPlanResponse.nutritionSummary,
        reasoning: mealPlanResponse.reasoning
      };
    } catch (error: unknown) {
      throw new Error(`Failed to generate meal plan: ${error.message}`);
    }
  }

  async suggestRecipeVariations(
    recipeId: string,
    variationType: 'dietary' | 'ingredient_swap' | 'cooking_method' | 'seasonal' = 'ingredient_swap'
  ): Promise<Recipe[]> {
    try {
      const originalRecipe = await recipeService.getRecipeById(recipeId);
      
      const prompt = this.buildVariationPrompt(originalRecipe, variationType);

      const response = await fetch(`${this.API_ENDPOINT}/suggest-variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          originalRecipe,
          variationType
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const variations = await response.json();
      
      return Promise.all(
        variations.recipes.map((variation: any) => 
          this.processAIRecipeResponse(variation, {
            preferences: {} as UserRecipePreferences,
            constraints: {},
            context: undefined
          })
        )
      );
    } catch (error: unknown) {
      throw new Error(`Failed to suggest variations: ${error.message}`);
    }
  }

  // =====================================================
  // PROMPT BUILDING
  // =====================================================

  private buildRecipeGenerationPrompt(request: RecipeGenerationRequest): string {
    const { preferences, constraints, context } = request;

    let prompt = `Eres un chef experto especializado en cocina latina y internacional. 

INSTRUCCIONES:
- Genera una receta completa en español
- Responde ÚNICAMENTE con un JSON válido siguiendo la estructura exacta especificada
- Incluye ingredientes con cantidades precisas y unidades en español
- Proporciona instrucciones paso a paso claras y detalladas
- Calcula información nutricional aproximada

PREFERENCIAS DEL USUARIO:
`;

    if (preferences.cuisine_types.length > 0) {
      prompt += `- Cocinas preferidas: ${preferences.cuisine_types.join(', ')}\n`;
    }

    if (preferences.dietary_restrictions) {
      const restrictions = Object.entries(preferences.dietary_restrictions)
        .filter(([_, value]) => value)
        .map(([key, _]) => key);
      if (restrictions.length > 0) {
        prompt += `- Restricciones dietéticas: ${restrictions.join(', ')}\n`;
      }
    }

    if (preferences.favorite_ingredients.length > 0) {
      prompt += `- Ingredientes favoritos: ${preferences.favorite_ingredients.join(', ')}\n`;
    }

    if (preferences.disliked_ingredients.length > 0) {
      prompt += `- Ingredientes a evitar: ${preferences.disliked_ingredients.join(', ')}\n`;
    }

    prompt += `- Nivel de habilidad: ${preferences.skill_level}\n`;
    prompt += `- Tiempo preferido de cocción: ${preferences.preferred_cook_time} minutos\n`;

    if (constraints.required_ingredients?.length > 0) {
      prompt += `\nINGREDIENTES REQUERIDOS: ${constraints.required_ingredients.join(', ')}\n`;
    }

    if (constraints.available_ingredients?.length > 0) {
      prompt += `\nINGREDIENTES DISPONIBLES: ${constraints.available_ingredients.join(', ')}\n`;
    }

    if (constraints.max_cook_time) {
      prompt += `\nTIEMPO MÁXIMO DE COCCIÓN: ${constraints.max_cook_time} minutos\n`;
    }

    if (constraints.servings) {
      prompt += `\nPORCIONES: ${constraints.servings}\n`;
    }

    if (context) {
      prompt += `\nCONTEXTO ADICIONAL:
- Tipo de comida: ${context.meal_type}
- Temporada: ${context.season}
- Ocasión: ${context.occasion || 'diario'}
- Tamaño del grupo: ${context.group_size}
- Momento del día: ${context.time_of_day}
`;
    }

    prompt += `

ESTRUCTURA JSON REQUERIDA:
{
  "name": "string",
  "description": "string",
  "ingredients": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "preparation": "string (opcional)",
      "optional": boolean
    }
  ],
  "instructions": ["string"],
  "cook_time": number,
  "prep_time": number,
  "servings": number,
  "difficulty": "facil|intermedio|dificil|experto",
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
  "reasoning": "Explicación de por qué esta receta cumple con los requisitos",
  "alternatives": ["string"] // Sugerencias de variaciones
}

Genera la receta ahora:`;

    return prompt;
  }

  private buildPantrySuggestionPrompt(
    availableIngredients: any[], 
    preferences: UserRecipePreferences,
    count: number
  ): string {
    return `Eres un chef experto que ayuda a crear recetas basadas en ingredientes disponibles.

INGREDIENTES DISPONIBLES:
${availableIngredients.map(ing => `- ${ing.name}: ${ing.quantity} ${ing.unit}${ing.expiration ? ` (vence: ${ing.expiration})` : ''}`).join('\n')}

PREFERENCIAS DEL USUARIO:
- Restricciones dietéticas: ${Object.entries(preferences.dietary_restrictions || {}).filter(([_, v]) => v).map(([k, _]) => k).join(', ') || 'Ninguna'}
- Nivel de habilidad: ${preferences.skill_level}
- Tiempo preferido: ${preferences.preferred_cook_time} minutos

INSTRUCCIONES:
- Sugiere ${count} recetas diferentes que maximicen el uso de ingredientes disponibles
- Prioriza ingredientes que expiran pronto
- Minimiza ingredientes adicionales necesarios
- Incluye recetas de diferentes tipos (desayuno, almuerzo, cena, snacks)
- Responde con un JSON con array de recetas usando la estructura estándar

Genera las sugerencias:`;
  }

  private buildNutritionOptimizationPrompt(recipe: Recipe, goals: NutritionGoals): string {
    return `Eres un nutricionista y chef experto. Optimiza esta receta para cumplir objetivos nutricionales específicos.

RECETA ORIGINAL:
${JSON.stringify({
  name: recipe.name,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions,
  nutrition: recipe.nutrition
}, null, 2)}

OBJETIVOS NUTRICIONALES:
${JSON.stringify(goals, null, 2)}

INSTRUCCIONES:
- Modifica ingredientes y/o cantidades para cumplir objetivos nutricionales
- Mantén el sabor y la esencia de la receta original
- Sugiere substituciones saludables cuando sea necesario
- Recalcula información nutricional
- Explica los cambios realizados

Responde con la receta optimizada en formato JSON estándar incluyendo campo "optimization_notes":`;
  }

  private buildWeeklyMealPlanPrompt(context: AIRecommendationContext, daysCount: number): string {
    return `Eres un chef y nutricionista experto que crea planes de comidas balanceados.

CONTEXTO:
- Ingredientes en despensa: ${context.pantryItems.map(item => `${item.ingredient?.name}: ${item.quantity} ${item.unit}`).join(', ')}
- Preferencias del usuario: ${JSON.stringify(context.userPreferences)}
- Historial de comidas recientes: ${context.mealHistory.map(r => r.name).join(', ')}
- Factores estacionales: ${context.seasonalFactors.join(', ')}

OBJETIVOS:
- Crear plan de ${daysCount} días
- Balancear nutrición diaria
- Variar tipos de cocina y sabores
- Maximizar uso de ingredientes en despensa
- Evitar repetir comidas recientes
- Incluir desayuno, almuerzo, cena y snacks opcionales

ESTRUCTURA RESPUESTA:
{
  "mealPlan": [
    {
      "day": 1,
      "meals": {
        "breakfast": { recipe object },
        "lunch": { recipe object },
        "dinner": { recipe object },
        "snack": { recipe object (opcional) }
      }
    }
  ],
  "shoppingList": [
    {
      "ingredient": "string",
      "quantity": number,
      "unit": "string",
      "category": "string"
    }
  ],
  "nutritionSummary": {
    "daily_averages": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  },
  "reasoning": "Explicación del plan y decisiones nutricionales"
}

Genera el plan de comidas:`;
  }

  private buildVariationPrompt(recipe: Recipe, variationType: string): string {
    return `Eres un chef creativo experto en adaptar recetas.

RECETA ORIGINAL:
${JSON.stringify({
  name: recipe.name,
  ingredients: recipe.ingredients,
  instructions: recipe.instructions,
  category: recipe.category,
  cuisine_type: recipe.cuisine_type
}, null, 2)}

TIPO DE VARIACIÓN: ${variationType}

INSTRUCCIONES SEGÚN TIPO:
${variationType === 'dietary' ? '- Crea versiones vegetarianas, veganas, sin gluten, keto, etc.' : ''}
${variationType === 'ingredient_swap' ? '- Substituye ingredientes principales manteniendo perfil de sabor' : ''}
${variationType === 'cooking_method' ? '- Cambia técnica de cocción (horno vs estufa, frito vs horneado, etc.)' : ''}
${variationType === 'seasonal' ? '- Adapta con ingredientes de temporada actual' : ''}

- Genera 3-5 variaciones creativas
- Mantén la esencia y nivel de dificultad
- Explica los cambios y beneficios de cada variación

Responde con array de recetas en formato JSON estándar:`;
  }

  // =====================================================
  // RESPONSE PROCESSING
  // =====================================================

  private async processAIRecipeResponse(
    aiResponse: AIRecipeResponse, 
    originalRequest: RecipeGenerationRequest
  ): Promise<Recipe> {
    try {
      // Parse the AI response into our recipe format
      const parsedRecipe = aiResponse.recipe;
      
      // Create recipe using recipe service
      const recipeData = {
        name: parsedRecipe.name,
        description: parsedRecipe.description || '',
        ingredients: parsedRecipe.ingredients?.map((ing, index) => ({
          ingredient_name: ing.name,
          ingredient_id: undefined, // Will be resolved during creation
          quantity: ing.quantity || 1,
          unit: ing.unit || 'pcs',
          preparation: ing.preparation,
          optional: ing.optional || false,
          notes: ''
        })) || [],
        instructions: parsedRecipe.instructions?.map((inst, index) => ({
          instruction: inst,
          duration: undefined,
          temperature: undefined,
          notes: ''
        })) || [],
        prep_time: parsedRecipe.prep_time || 15,
        cook_time: parsedRecipe.cook_time || 30,
        servings: parsedRecipe.servings || 4,
        difficulty: parsedRecipe.difficulty || 'intermedio' as DifficultyLevel,
        cuisine_type: parsedRecipe.cuisine_type as CuisineType,
        category: parsedRecipe.category as RecipeCategory,
        tags: parsedRecipe.tags || [],
        dietary_info: this.extractDietaryInfo(parsedRecipe),
        source: {
          type: 'ai_generated' as const,
          author: 'KeCaraJoComer AI Assistant'
        }
      };

      // Create the recipe in the database
      const createdRecipe = await recipeService.createRecipe(recipeData);
      
      return createdRecipe;
    } catch (error: unknown) {
      throw new Error(`Failed to process AI recipe response: ${error.message}`);
    }
  }

  private extractDietaryInfo(parsedRecipe: any): any {
    const dietaryInfo: any = {
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: false,
      low_carb: false,
      keto: false,
      paleo: false,
      allergies: []
    };

    // Auto-detect dietary properties from ingredients and tags
    const ingredients = parsedRecipe.ingredients?.map((ing: any) => ing.name.toLowerCase()) || [];
    const tags = parsedRecipe.tags?.map((tag: string) => tag.toLowerCase()) || [];
    const allText = [...ingredients, ...tags, parsedRecipe.name.toLowerCase()].join(' ');

    // Check for meat products
    const meatKeywords = ['carne', 'pollo', 'pescado', 'jamón', 'chorizo', 'bacon', 'pavo'];
    if (!meatKeywords.some(keyword => allText.includes(keyword))) {
      dietaryInfo.vegetarian = true;
    }

    // Check for animal products
    const animalProducts = ['huevo', 'leche', 'queso', 'mantequilla', 'yogur', 'crema'];
    if (dietaryInfo.vegetarian && !animalProducts.some(keyword => allText.includes(keyword))) {
      dietaryInfo.vegan = true;
    }

    // Check for gluten
    const glutenProducts = ['harina', 'trigo', 'pan', 'pasta', 'avena'];
    if (!glutenProducts.some(keyword => allText.includes(keyword))) {
      dietaryInfo.gluten_free = true;
    }

    // Check for dairy
    const dairyProducts = ['leche', 'queso', 'mantequilla', 'yogur', 'crema'];
    if (!dairyProducts.some(keyword => allText.includes(keyword))) {
      dietaryInfo.dairy_free = true;
    }

    return dietaryInfo;
  }

  // =====================================================
  // RECIPE RECOMMENDATION ENGINE
  // =====================================================

  async getPersonalizedRecommendations(
    userId: string,
    count: number = 10
  ): Promise<Recipe[]> {
    try {
      // This would use more sophisticated ML/AI recommendations
      // For now, we'll use a simpler approach based on user history and preferences
      
      const response = await fetch(`${this.API_ENDPOINT}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          count
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const recommendations = await response.json();
      
      return recommendations.recipes || [];
    } catch (error: unknown) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  async getSeasonalSuggestions(season?: string): Promise<Recipe[]> {
    try {
      const currentSeason = season || this.getCurrentSeason();
      
      const response = await fetch(`${this.API_ENDPOINT}/seasonal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          season: currentSeason
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const suggestions = await response.json();
      
      return suggestions.recipes || [];
    } catch (error: unknown) {
      throw new Error(`Failed to get seasonal suggestions: ${error.message}`);
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    
    if (month >= 3 && month <= 5) return 'primavera';
    if (month >= 6 && month <= 8) return 'verano';
    if (month >= 9 && month <= 11) return 'otono';
    return 'invierno';
  }

  async analyzeRecipeComplexity(recipe: Recipe): Promise<{
    complexity_score: number;
    factors: string[];
    suggestions: string[];
  }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/analyze-complexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: unknown) {
      throw new Error(`Failed to analyze recipe complexity: ${error.message}`);
    }
  }

  async suggestIngredientSubstitutions(
    ingredientName: string,
    context: {
      recipe_type?: string;
      dietary_restrictions?: string[];
      available_ingredients?: string[];
    }
  ): Promise<{
    substitutions: Array<{
      ingredient: string;
      ratio: string;
      notes: string;
      confidence: number;
    }>;
  }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/substitutions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredient: ingredientName,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: unknown) {
      throw new Error(`Failed to suggest substitutions: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiRecipeService = AIRecipeService.getInstance();