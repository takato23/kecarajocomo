import { GoogleGenerativeAI } from '@google/generative-ai';
import { format, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { 
  AIPlannerConfig, 
  AIGeneratedMealPlan,
  PlannedMealV2,
  RecipeV2,
  MealType,
  NutritionInfo
} from '../types';

// =============================================
// CONSTANTS
// =============================================

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const MEAL_TYPE_TRANSLATIONS: Record<MealType, string> = {
  desayuno: 'breakfast',
  almuerzo: 'lunch',
  merienda: 'snack',
  cena: 'dinner'
};

const DIET_TRANSLATIONS = {
  omnivore: 'omnívoro',
  vegetarian: 'vegetariano',
  vegan: 'vegano',
  pescatarian: 'pescetariano',
  keto: 'cetogénica',
  paleo: 'paleo',
  glutenFree: 'sin gluten',
  dairyFree: 'sin lácteos'
};

// =============================================
// AI PLANNER LOGIC
// =============================================

class AIPlannerLogic {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  /**
   * Generate a complete meal plan based on user preferences
   */
  async generateMealPlan(config: AIPlannerConfig): Promise<AIGeneratedMealPlan> {
    try {
      // Build the prompt
      const prompt = this.buildPrompt(config);
      
      // Generate content with Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      const parsedMeals = this.parseAIResponse(text, config);
      
      // Create the meal plan
      const plan: AIGeneratedMealPlan = {
        id: uuidv4(),
        config,
        meals: parsedMeals,
        shoppingList: {
          id: uuidv4(),
          userId: config.userId,
          weekStartDate: config.startDate,
          items: [], // Will be populated by shopping list parser
          categories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nutritionSummary: this.calculateNutritionSummary(parsedMeals),
        estimatedCost: this.estimateCosts(parsedMeals, config.budget),
        generatedAt: new Date().toISOString(),
        suggestions: this.generateSuggestions(config, parsedMeals)
      };
      
      return plan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error('Failed to generate meal plan');
    }
  }

  /**
   * Build the prompt for Gemini AI
   */
  private buildPrompt(config: AIPlannerConfig): string {
    const dietPrefs = config.dietaryPreferences
      .map(pref => DIET_TRANSLATIONS[pref])
      .join(', ');
    
    const excludedIngredients = config.excludedIngredients?.join(', ') || 'ninguno';
    const preferredIngredients = config.preferredIngredients?.join(', ') || 'ninguno';
    const cuisines = config.cuisine?.join(', ') || 'variada';
    
    const prompt = `
    Genera un plan de comidas detallado para ${config.numberOfDays} días.
    
    CONFIGURACIÓN:
    - Preferencias dietéticas: ${dietPrefs || 'sin restricciones'}
    - Perfil nutricional: ${config.dietProfile}
    - Presupuesto: ${config.budget}
    - Tiempo máximo de preparación: ${config.maxPrepTime || 60} minutos
    - Porciones por comida: ${config.servingsPerMeal}
    - Cocina preferida: ${cuisines}
    - Ingredientes a excluir: ${excludedIngredients}
    - Ingredientes preferidos: ${preferredIngredients}
    - Preferir variedad: ${config.preferVariety ? 'sí' : 'no'}
    - Usar ingredientes de temporada: ${config.useSeasonalIngredients ? 'sí' : 'no'}
    
    COMIDAS POR DÍA:
    ${config.mealsPerDay.map(meal => `- ${MEAL_TYPE_TRANSLATIONS[meal]}`).join('\n')}
    
    Genera un JSON con el siguiente formato exacto:
    {
      "meals": [
        {
          "day": 1,
          "mealType": "desayuno|almuerzo|merienda|cena",
          "recipe": {
            "name": "nombre de la receta",
            "description": "descripción breve",
            "prepTime": 15,
            "cookTime": 20,
            "difficulty": "easy|medium|hard",
            "ingredients": [
              {
                "name": "ingrediente",
                "amount": 100,
                "unit": "g|ml|unidad|taza|cucharada",
                "category": "produce|meat|dairy|grains|pantry|spices"
              }
            ],
            "instructions": ["paso 1", "paso 2"],
            "nutrition": {
              "calories": 350,
              "protein": 20,
              "carbs": 45,
              "fat": 12,
              "fiber": 5
            },
            "tags": ["saludable", "rápido"],
            "cuisine": "mexicana"
          }
        }
      ]
    }
    
    IMPORTANTE:
    - Asegúrate de que todas las recetas cumplan con las preferencias dietéticas
    - Varía los ingredientes principales entre comidas
    - Incluye recetas tradicionales argentinas cuando sea apropiado
    - Balancea los macronutrientes según el perfil nutricional solicitado
    - Genera SOLO el JSON, sin texto adicional
    `;
    
    return prompt;
  }

  /**
   * Parse AI response and convert to PlannedMealV2 array
   */
  private parseAIResponse(response: string, config: AIPlannerConfig): PlannedMealV2[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      const meals: PlannedMealV2[] = [];
      
      // Convert each meal
      parsed.meals.forEach((meal: any) => {
        const date = addDays(new Date(config.startDate), meal.day - 1);
        const recipe: RecipeV2 = {
          id: uuidv4(),
          name: meal.recipe.name,
          description: meal.recipe.description,
          prepTime: meal.recipe.prepTime || 15,
          cookTime: meal.recipe.cookTime || 30,
          servings: config.servingsPerMeal,
          difficulty: meal.recipe.difficulty || 'medium',
          ingredients: meal.recipe.ingredients.map((ing: any) => ({
            id: uuidv4(),
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category || 'pantry',
            isOptional: false
          })),
          instructions: meal.recipe.instructions || [],
          nutrition: meal.recipe.nutrition,
          dietaryLabels: config.dietaryPreferences,
          cuisine: meal.recipe.cuisine,
          tags: meal.recipe.tags || [],
          isAiGenerated: true
        };
        
        const plannedMeal: PlannedMealV2 = {
          id: uuidv4(),
          userId: config.userId,
          planDate: format(date, 'yyyy-MM-dd'),
          mealType: meal.mealType as MealType,
          recipe,
          servings: config.servingsPerMeal,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        meals.push(plannedMeal);
      });
      
      return meals;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Calculate nutrition summary for the meal plan
   */
  private calculateNutritionSummary(meals: PlannedMealV2[]): {
    daily: NutritionInfo;
    weekly: NutritionInfo;
  } {
    const totalNutrition: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };
    
    meals.forEach(meal => {
      if (meal.recipe?.nutrition) {
        totalNutrition.calories += meal.recipe.nutrition.calories || 0;
        totalNutrition.protein += meal.recipe.nutrition.protein || 0;
        totalNutrition.carbs += meal.recipe.nutrition.carbs || 0;
        totalNutrition.fat += meal.recipe.nutrition.fat || 0;
        totalNutrition.fiber += meal.recipe.nutrition.fiber || 0;
        totalNutrition.sugar += meal.recipe.nutrition.sugar || 0;
        totalNutrition.sodium += meal.recipe.nutrition.sodium || 0;
      }
    });
    
    const days = new Set(meals.map(m => m.planDate)).size || 1;
    
    return {
      daily: {
        calories: Math.round(totalNutrition.calories / days),
        protein: Math.round(totalNutrition.protein / days),
        carbs: Math.round(totalNutrition.carbs / days),
        fat: Math.round(totalNutrition.fat / days),
        fiber: Math.round(totalNutrition.fiber / days),
        sugar: Math.round(totalNutrition.sugar / days),
        sodium: Math.round(totalNutrition.sodium / days)
      },
      weekly: totalNutrition
    };
  }

  /**
   * Estimate costs based on budget level
   */
  private estimateCosts(meals: PlannedMealV2[], budget: string): {
    total: number;
    perMeal: number;
    perServing: number;
  } | undefined {
    // Rough estimates in Argentine pesos
    const costPerMeal = {
      low: 800,
      medium: 1500,
      high: 2500
    };
    
    const mealCost = costPerMeal[budget as keyof typeof costPerMeal] || costPerMeal.medium;
    const totalCost = meals.length * mealCost;
    const avgServings = meals.reduce((sum, meal) => sum + meal.servings, 0) / meals.length;
    
    return {
      total: totalCost,
      perMeal: mealCost,
      perServing: Math.round(mealCost / avgServings)
    };
  }

  /**
   * Generate helpful suggestions based on the meal plan
   */
  private generateSuggestions(config: AIPlannerConfig, meals: PlannedMealV2[]): string[] {
    const suggestions: string[] = [];
    
    // Prep suggestions
    const highPrepMeals = meals.filter(m => 
      (m.recipe?.prepTime || 0) + (m.recipe?.cookTime || 0) > 60
    );
    if (highPrepMeals.length > 0) {
      suggestions.push('Considera preparar algunos platos el fin de semana para ahorrar tiempo durante la semana.');
    }
    
    // Variety suggestions
    const uniqueRecipes = new Set(meals.map(m => m.recipe?.name)).size;
    if (uniqueRecipes < meals.length * 0.7) {
      suggestions.push('Para mayor variedad, intenta alternar las recetas cada semana.');
    }
    
    // Nutritional balance
    const avgNutrition = this.calculateNutritionSummary(meals).daily;
    if (avgNutrition.protein < 50) {
      suggestions.push('Considera agregar más fuentes de proteína a tu plan.');
    }
    if (avgNutrition.fiber < 25) {
      suggestions.push('Incluye más verduras y granos integrales para aumentar la fibra.');
    }
    
    // Budget tips
    if (config.budget === 'low') {
      suggestions.push('Compra ingredientes de temporada y en cantidad para reducir costos.');
    }
    
    // Meal prep tips
    if (config.preferVariety) {
      suggestions.push('Prepara bases versátiles (arroz, quinoa, pollo) que puedas combinar de diferentes formas.');
    }
    
    return suggestions;
  }

  /**
   * Generate a single meal suggestion
   */
  async generateSingleMeal(
    mealType: MealType,
    preferences: Partial<AIPlannerConfig>
  ): Promise<RecipeV2> {
    const config: AIPlannerConfig = {
      userId: 'temp',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      numberOfDays: 1,
      mealsPerDay: [mealType],
      dietaryPreferences: preferences.dietaryPreferences || [],
      dietProfile: preferences.dietProfile || 'balanced',
      budget: preferences.budget || 'medium',
      servingsPerMeal: preferences.servingsPerMeal || 4,
      preferVariety: false,
      useSeasonalIngredients: true,
      considerPantryItems: false,
      ...preferences
    };
    
    const plan = await this.generateMealPlan(config);
    if (plan.meals.length > 0 && plan.meals[0].recipe) {
      return plan.meals[0].recipe;
    }
    
    throw new Error('Failed to generate meal suggestion');
  }
}

// Export singleton instance
export const aiPlannerLogic = new AIPlannerLogic();