import { supabase } from '@/lib/supabase/client';
import { logger } from '@/services/logger';
import { GeminiService } from '@/services/ai/GeminiService';
import { ProfileData } from '@/types/profile';
import { Recipe } from '@/types/recipe';

export interface MealPlanRequest {
  userId: string;
  startDate: Date;
  endDate: Date;
  mealsPerDay: string[]; // ['breakfast', 'lunch', 'snack', 'dinner']
  preferences?: {
    dietaryRestrictions?: string[];
    cuisinePreferences?: string[];
    avoidIngredients?: string[];
    preferIngredients?: string[];
  };
  nutritionalGoals?: {
    dailyCalories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
  };
  generateMode: 'full' | 'daily'; // Generar todo el plan o día por día
  specificDate?: Date; // Para generación diaria
}

export interface MealPlanItem {
  date: Date;
  mealType: string;
  recipe?: Recipe;
  customRecipe?: any; // Para recetas generadas por IA
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  servings: number;
}

export interface DailyNutrition {
  date: Date;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  mealsCount: number;
  calorieBalance: number; // Diferencia con el objetivo
  macroBalance: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export class MealPlanGenerator {
  private geminiService: GeminiService;
  private readonly NUTRITION_TOLERANCE = 0.1; // ±10% de tolerancia

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Genera un plan de alimentación completo o por día
   */
  async generateMealPlan(request: MealPlanRequest): Promise<MealPlanItem[]> {
    // Obtener perfil del usuario para preferencias adicionales
    const userProfile = await this.getUserProfile(request.userId);
    
    // Combinar preferencias del request con las del perfil
    const combinedPreferences = this.combinePreferences(request.preferences, userProfile);
    const combinedGoals = this.combineNutritionalGoals(request.nutritionalGoals, userProfile);

    if (request.generateMode === 'daily' && request.specificDate) {
      // Generar solo para un día específico
      return await this.generateDailyPlan(
        request.specificDate,
        request.mealsPerDay,
        combinedPreferences,
        combinedGoals,
        request.userId
      );
    } else {
      // Generar plan completo
      return await this.generateFullPlan(
        request.startDate,
        request.endDate,
        request.mealsPerDay,
        combinedPreferences,
        combinedGoals,
        request.userId
      );
    }
  }

  /**
   * Genera el plan para un día específico
   */
  private async generateDailyPlan(
    date: Date,
    mealsPerDay: string[],
    preferences: any,
    nutritionalGoals: any,
    userId: string
  ): Promise<MealPlanItem[]> {
    const dailyPlan: MealPlanItem[] = [];
    const dailyNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    // Calcular objetivos por comida
    const mealsCount = mealsPerDay.length;
    const mealTargets = this.calculateMealTargets(nutritionalGoals, mealsPerDay);

    for (const mealType of mealsPerDay) {
      // Buscar receta existente primero
      let recipe = await this.findSuitableRecipe(
        mealType,
        preferences,
        mealTargets[mealType],
        dailyNutrition
      );

      let mealItem: MealPlanItem;

      if (recipe) {
        // Usar receta existente
        mealItem = {
          date,
          mealType,
          recipe,
          nutritionalInfo: this.extractNutritionalInfo(recipe),
          servings: 1
        };
      } else {
        // Generar nueva receta con IA
        const customRecipe = await this.generateAIRecipe(
          mealType,
          preferences,
          mealTargets[mealType],
          dailyNutrition,
          userId
        );

        mealItem = {
          date,
          mealType,
          customRecipe,
          nutritionalInfo: customRecipe.nutritionalInfo,
          servings: 1
        };
      }

      // Actualizar totales diarios
      this.updateDailyNutrition(dailyNutrition, mealItem.nutritionalInfo);
      dailyPlan.push(mealItem);
    }

    return dailyPlan;
  }

  /**
   * Genera el plan completo para un rango de fechas
   */
  private async generateFullPlan(
    startDate: Date,
    endDate: Date,
    mealsPerDay: string[],
    preferences: any,
    nutritionalGoals: any,
    userId: string
  ): Promise<MealPlanItem[]> {
    const fullPlan: MealPlanItem[] = [];
    const currentDate = new Date(startDate);

    // Obtener todas las recetas disponibles para optimizar
    const availableRecipes = await this.getAvailableRecipes(preferences);

    while (currentDate <= endDate) {
      const dailyPlan = await this.generateOptimizedDailyPlan(
        currentDate,
        mealsPerDay,
        preferences,
        nutritionalGoals,
        availableRecipes,
        fullPlan, // Para evitar repeticiones excesivas
        userId
      );

      fullPlan.push(...dailyPlan);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return fullPlan;
  }

  /**
   * Genera un plan diario optimizado considerando variedad
   */
  private async generateOptimizedDailyPlan(
    date: Date,
    mealsPerDay: string[],
    preferences: any,
    nutritionalGoals: any,
    availableRecipes: Recipe[],
    previousPlan: MealPlanItem[],
    userId: string
  ): Promise<MealPlanItem[]> {
    const dailyPlan: MealPlanItem[] = [];
    const dailyNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const mealTargets = this.calculateMealTargets(nutritionalGoals, mealsPerDay);

    // Obtener recetas usadas recientemente para evitar repetición
    const recentRecipes = this.getRecentRecipes(previousPlan, 3); // Últimos 3 días

    for (const mealType of mealsPerDay) {
      // Filtrar recetas por tipo de comida y que no se hayan usado recientemente
      const mealRecipes = availableRecipes.filter(r => 
        this.isRecipeSuitableForMeal(r, mealType) &&
        !recentRecipes.has(r.id) &&
        this.meetsPreferences(r, preferences)
      );

      // Ordenar por ajuste nutricional
      const sortedRecipes = this.sortRecipesByNutritionalFit(
        mealRecipes,
        mealTargets[mealType],
        dailyNutrition
      );

      let mealItem: MealPlanItem;

      if (sortedRecipes.length > 0) {
        // Seleccionar entre las mejores opciones con algo de aleatoriedad
        const recipe = this.selectWithVariety(sortedRecipes.slice(0, 5));
        
        mealItem = {
          date,
          mealType,
          recipe,
          nutritionalInfo: this.extractNutritionalInfo(recipe),
          servings: 1
        };
      } else {
        // Generar con IA si no hay opciones
        const customRecipe = await this.generateAIRecipe(
          mealType,
          preferences,
          mealTargets[mealType],
          dailyNutrition,
          userId
        );

        mealItem = {
          date,
          mealType,
          customRecipe,
          nutritionalInfo: customRecipe.nutritionalInfo,
          servings: 1
        };
      }

      this.updateDailyNutrition(dailyNutrition, mealItem.nutritionalInfo);
      dailyPlan.push(mealItem);
    }

    return dailyPlan;
  }

  /**
   * Calcula los objetivos nutricionales por comida
   */
  private calculateMealTargets(nutritionalGoals: any, mealsPerDay: string[]) {
    const targets: any = {};
    
    // Distribución por defecto de calorías por comida
    const distribution = {
      breakfast: 0.25,
      lunch: 0.35,
      snack: 0.15,
      dinner: 0.25
    };

    const totalDistribution = mealsPerDay.reduce((sum, meal) => 
      sum + (distribution[meal] || 0.25), 0
    );

    mealsPerDay.forEach(meal => {
      const mealRatio = (distribution[meal] || 0.25) / totalDistribution;
      
      targets[meal] = {
        calories: Math.round((nutritionalGoals.dailyCalories || 2000) * mealRatio),
        protein: Math.round((nutritionalGoals.proteinGrams || 50) * mealRatio),
        carbs: Math.round((nutritionalGoals.carbsGrams || 250) * mealRatio),
        fat: Math.round((nutritionalGoals.fatGrams || 65) * mealRatio),
        fiber: Math.round((nutritionalGoals.fiberGrams || 25) * mealRatio)
      };
    });

    return targets;
  }

  /**
   * Busca una receta adecuada en la base de datos
   */
  private async findSuitableRecipe(
    mealType: string,
    preferences: any,
    targetNutrition: any,
    currentDailyNutrition: any
  ): Promise<Recipe | null> {
    // Construir query para Supabase
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true);

    // Filtrar por tipo de comida si está especificado
    if (mealType) {
      query = query.contains('meal_types', [mealType]);
    }

    // Filtrar por restricciones dietéticas
    if (preferences.dietaryRestrictions?.length > 0) {
      query = query.contains('dietary_tags', preferences.dietaryRestrictions);
    }

    const { data: recipes, error } = await query;

    if (error || !recipes || recipes.length === 0) {
      return null;
    }

    // Evaluar y ordenar recetas por ajuste nutricional
    const scoredRecipes = recipes.map(recipe => ({
      recipe,
      score: this.calculateNutritionalScore(recipe, targetNutrition, currentDailyNutrition)
    }));

    // Ordenar por puntuación
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Retornar la mejor opción si supera un umbral mínimo
    return scoredRecipes[0].score > 0.7 ? scoredRecipes[0].recipe : null;
  }

  /**
   * Calcula el puntaje nutricional de una receta
   */
  private calculateNutritionalScore(
    recipe: Recipe,
    targetNutrition: any,
    currentDailyNutrition: any
  ): number {
    const recipeNutrition = this.extractNutritionalInfo(recipe);
    let score = 1.0;

    // Penalizar por desviación de objetivos
    const calorieDeviation = Math.abs(recipeNutrition.calories - targetNutrition.calories) / targetNutrition.calories;
    const proteinDeviation = Math.abs(recipeNutrition.protein - targetNutrition.protein) / targetNutrition.protein;
    const carbsDeviation = Math.abs(recipeNutrition.carbs - targetNutrition.carbs) / targetNutrition.carbs;
    const fatDeviation = Math.abs(recipeNutrition.fat - targetNutrition.fat) / targetNutrition.fat;

    // Aplicar penalizaciones
    score -= calorieDeviation * 0.4; // Las calorías tienen más peso
    score -= proteinDeviation * 0.2;
    score -= carbsDeviation * 0.2;
    score -= fatDeviation * 0.2;

    // Asegurar que el score esté entre 0 y 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Genera una receta usando IA y la guarda automáticamente
   */
  private async generateAIRecipe(
    mealType: string,
    preferences: any,
    targetNutrition: any,
    currentDailyNutrition: any,
    userId?: string
  ): Promise<any> {
    const prompt = `
      Genera una receta para ${mealType} con las siguientes características:
      
      Objetivos nutricionales:
      - Calorías: ${targetNutrition.calories} kcal (±10%)
      - Proteínas: ${targetNutrition.protein}g
      - Carbohidratos: ${targetNutrition.carbs}g
      - Grasas: ${targetNutrition.fat}g
      - Fibra: ${targetNutrition.fiber}g
      
      Preferencias:
      - Restricciones dietéticas: ${preferences.dietaryRestrictions?.join(', ') || 'Ninguna'}
      - Preferencias de cocina: ${preferences.cuisinePreferences?.join(', ') || 'Cualquiera'}
      - Evitar ingredientes: ${preferences.avoidIngredients?.join(', ') || 'Ninguno'}
      - Preferir ingredientes: ${preferences.preferIngredients?.join(', ') || 'Ninguno'}
      
      La receta debe ser:
      - Fácil de preparar (30 minutos o menos)
      - Con ingredientes comunes y accesibles
      - Balanceada nutricionalmente
      - Sabrosa y apetitosa
      
      Responde en formato JSON con la siguiente estructura:
      {
        "name": "Nombre de la receta",
        "description": "Descripción breve",
        "ingredients": [
          {"name": "ingrediente", "amount": 100, "unit": "g"}
        ],
        "instructions": ["paso 1", "paso 2"],
        "prepTime": 15,
        "cookTime": 20,
        "servings": 1,
        "nutritionalInfo": {
          "calories": 500,
          "protein": 25,
          "carbs": 60,
          "fat": 20,
          "fiber": 8
        },
        "tags": ["vegetariano", "sin gluten"],
        "mealType": "${mealType}"
      }
    `;

    try {
      const response = await this.geminiService.generateRecipe(prompt);
      const generatedRecipe = JSON.parse(response);
      
      // Guardar la receta generada en la base de datos si tenemos userId
      if (userId) {
        try {
          const { data: savedRecipe, error: saveError } = await supabase
            .from('ai_generated_recipes')
            .insert({
              user_id: userId,
            recipe_data: generatedRecipe,
            name: generatedRecipe.name,
            description: generatedRecipe.description,
            meal_type: mealType,
            dietary_tags: generatedRecipe.tags || [],
            cuisine: generatedRecipe.cuisine,
            prep_time: generatedRecipe.prepTime,
            cook_time: generatedRecipe.cookTime,
            servings: generatedRecipe.servings || 1,
            difficulty: generatedRecipe.difficulty,
            nutritional_info: generatedRecipe.nutritionalInfo || {},
            is_public: false, // Por defecto las recetas generadas son privadas
            usage_count: 1
          })
          .select()
          .single();

          if (savedRecipe) {
            // Agregar el ID de la receta guardada al objeto
            generatedRecipe.ai_recipe_id = savedRecipe.id;
          }
        } catch (saveError) {
          logger.error('Error guardando receta AI:', saveError);
          // No fallar si no se puede guardar, solo loguear el error
        }
      }

      return generatedRecipe;
    } catch (error) {
      logger.error('Error generando receta con IA:', error);
      // Retornar una receta básica de respaldo
      return this.getFallbackRecipe(mealType, targetNutrition);
    }
  }

  /**
   * Extrae información nutricional de una receta
   */
  private extractNutritionalInfo(recipe: Recipe): any {
    return {
      calories: recipe.nutrition?.calories || 0,
      protein: recipe.nutrition?.protein || 0,
      carbs: recipe.nutrition?.carbs || 0,
      fat: recipe.nutrition?.fat || 0,
      fiber: recipe.nutrition?.fiber || 0
    };
  }

  /**
   * Actualiza los totales nutricionales diarios
   */
  private updateDailyNutrition(dailyNutrition: any, mealNutrition: any): void {
    dailyNutrition.calories += mealNutrition.calories;
    dailyNutrition.protein += mealNutrition.protein;
    dailyNutrition.carbs += mealNutrition.carbs;
    dailyNutrition.fat += mealNutrition.fat;
    dailyNutrition.fiber += mealNutrition.fiber;
  }

  /**
   * Obtiene el perfil del usuario
   */
  private async getUserProfile(userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return error ? null : data;
  }

  /**
   * Combina las preferencias del request con las del perfil
   */
  private combinePreferences(requestPrefs: any, userProfile: ProfileData | null): any {
    if (!userProfile) return requestPrefs || {};

    return {
      dietaryRestrictions: [
        ...(requestPrefs?.dietaryRestrictions || []),
        ...(userProfile.dietary_restrictions || [])
      ],
      cuisinePreferences: [
        ...(requestPrefs?.cuisinePreferences || []),
        ...(userProfile.cuisine_preferences || [])
      ],
      avoidIngredients: [
        ...(requestPrefs?.avoidIngredients || []),
        ...(userProfile.allergies || [])
      ],
      preferIngredients: requestPrefs?.preferIngredients || []
    };
  }

  /**
   * Combina los objetivos nutricionales
   */
  private combineNutritionalGoals(requestGoals: any, userProfile: ProfileData | null): any {
    if (!userProfile || !userProfile.nutrition_goals) return requestGoals || {};

    return {
      dailyCalories: requestGoals?.dailyCalories || userProfile.nutrition_goals.daily_calories || 2000,
      proteinGrams: requestGoals?.proteinGrams || userProfile.nutrition_goals.protein_grams || 50,
      carbsGrams: requestGoals?.carbsGrams || userProfile.nutrition_goals.carbs_grams || 250,
      fatGrams: requestGoals?.fatGrams || userProfile.nutrition_goals.fat_grams || 65,
      fiberGrams: requestGoals?.fiberGrams || userProfile.nutrition_goals.fiber_grams || 25
    };
  }

  /**
   * Obtiene recetas disponibles según preferencias
   */
  private async getAvailableRecipes(preferences: any): Promise<Recipe[]> {
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true);

    if (preferences.dietaryRestrictions?.length > 0) {
      query = query.contains('dietary_tags', preferences.dietaryRestrictions);
    }

    const { data, error } = await query;
    return error ? [] : data || [];
  }

  /**
   * Obtiene las recetas usadas recientemente
   */
  private getRecentRecipes(plan: MealPlanItem[], days: number): Set<string> {
    const recentRecipeIds = new Set<string>();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    plan.forEach(item => {
      if (item.recipe && item.date >= cutoffDate) {
        recentRecipeIds.add(item.recipe.id);
      }
    });

    return recentRecipeIds;
  }

  /**
   * Verifica si una receta es adecuada para un tipo de comida
   */
  private isRecipeSuitableForMeal(recipe: Recipe, mealType: string): boolean {
    return recipe.meal_types?.includes(mealType) || false;
  }

  /**
   * Verifica si una receta cumple con las preferencias
   */
  private meetsPreferences(recipe: Recipe, preferences: any): boolean {
    // Verificar restricciones dietéticas
    if (preferences.dietaryRestrictions?.length > 0) {
      const hasAllRestrictions = preferences.dietaryRestrictions.every(
        (restriction: string) => recipe.dietary_tags?.includes(restriction)
      );
      if (!hasAllRestrictions) return false;
    }

    // Verificar ingredientes a evitar
    if (preferences.avoidIngredients?.length > 0) {
      const hasAvoidedIngredient = recipe.ingredients?.some(
        (ing: any) => preferences.avoidIngredients.includes(ing.name.toLowerCase())
      );
      if (hasAvoidedIngredient) return false;
    }

    return true;
  }

  /**
   * Ordena recetas por ajuste nutricional
   */
  private sortRecipesByNutritionalFit(
    recipes: Recipe[],
    targetNutrition: any,
    currentDailyNutrition: any
  ): Recipe[] {
    return recipes
      .map(recipe => ({
        recipe,
        score: this.calculateNutritionalScore(recipe, targetNutrition, currentDailyNutrition)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.recipe);
  }

  /**
   * Selecciona una receta con variedad
   */
  private selectWithVariety(recipes: Recipe[]): Recipe {
    // 70% de probabilidad de elegir la mejor, 30% de elegir entre las otras
    const random = Math.random();
    if (random < 0.7 || recipes.length === 1) {
      return recipes[0];
    }
    
    // Elegir aleatoriamente entre las otras opciones
    const index = Math.floor(Math.random() * (recipes.length - 1)) + 1;
    return recipes[index];
  }

  /**
   * Obtiene una receta de respaldo
   */
  private getFallbackRecipe(mealType: string, targetNutrition: any): any {
    const fallbackRecipes = {
      breakfast: {
        name: "Avena con frutas",
        description: "Avena nutritiva con frutas frescas",
        ingredients: [
          { name: "Avena", amount: 50, unit: "g" },
          { name: "Leche", amount: 200, unit: "ml" },
          { name: "Plátano", amount: 1, unit: "unidad" },
          { name: "Miel", amount: 1, unit: "cucharada" }
        ],
        instructions: [
          "Calentar la leche",
          "Agregar la avena y cocinar 5 minutos",
          "Servir con plátano y miel"
        ],
        prepTime: 5,
        cookTime: 5,
        servings: 1,
        nutritionalInfo: targetNutrition,
        tags: ["vegetariano", "sin gluten"],
        mealType: "breakfast"
      },
      lunch: {
        name: "Ensalada de pollo",
        description: "Ensalada completa con pollo a la plancha",
        ingredients: [
          { name: "Pechuga de pollo", amount: 150, unit: "g" },
          { name: "Lechuga mixta", amount: 100, unit: "g" },
          { name: "Tomate", amount: 1, unit: "unidad" },
          { name: "Aceite de oliva", amount: 1, unit: "cucharada" }
        ],
        instructions: [
          "Cocinar el pollo a la plancha",
          "Cortar las verduras",
          "Mezclar todo y aliñar"
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        nutritionalInfo: targetNutrition,
        tags: ["alto en proteína", "bajo en carbohidratos"],
        mealType: "lunch"
      },
      snack: {
        name: "Yogur con frutos secos",
        description: "Snack saludable y nutritivo",
        ingredients: [
          { name: "Yogur natural", amount: 150, unit: "g" },
          { name: "Almendras", amount: 20, unit: "g" },
          { name: "Miel", amount: 1, unit: "cucharadita" }
        ],
        instructions: [
          "Servir el yogur",
          "Agregar almendras y miel"
        ],
        prepTime: 2,
        cookTime: 0,
        servings: 1,
        nutritionalInfo: targetNutrition,
        tags: ["vegetariano", "alto en proteína"],
        mealType: "snack"
      },
      dinner: {
        name: "Salmón con verduras",
        description: "Salmón al horno con verduras asadas",
        ingredients: [
          { name: "Salmón", amount: 150, unit: "g" },
          { name: "Brócoli", amount: 100, unit: "g" },
          { name: "Zanahoria", amount: 1, unit: "unidad" },
          { name: "Aceite de oliva", amount: 1, unit: "cucharada" }
        ],
        instructions: [
          "Precalentar el horno a 180°C",
          "Colocar el salmón y verduras en una bandeja",
          "Hornear por 20 minutos"
        ],
        prepTime: 10,
        cookTime: 20,
        servings: 1,
        nutritionalInfo: targetNutrition,
        tags: ["alto en omega-3", "bajo en carbohidratos"],
        mealType: "dinner"
      }
    };

    return fallbackRecipes[mealType] || fallbackRecipes.lunch;
  }

  /**
   * Calcula estadísticas nutricionales del plan
   */
  async calculatePlanStatistics(mealPlanId: string): Promise<DailyNutrition[]> {
    const { data: items, error } = await supabase
      .from('meal_plan_items')
      .select('*')
      .eq('meal_plan_id', mealPlanId)
      .order('date', { ascending: true });

    if (error || !items) return [];

    // Agrupar por fecha
    const dailyStats = new Map<string, DailyNutrition>();

    items.forEach(item => {
      const dateKey = item.date.toString();
      
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, {
          date: new Date(item.date),
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          mealsCount: 0,
          calorieBalance: 0,
          macroBalance: { protein: 0, carbs: 0, fat: 0 }
        });
      }

      const stats = dailyStats.get(dateKey)!;
      const nutrition = item.nutritional_info;

      stats.totalCalories += nutrition.calories || 0;
      stats.totalProtein += nutrition.protein || 0;
      stats.totalCarbs += nutrition.carbs || 0;
      stats.totalFat += nutrition.fat || 0;
      stats.totalFiber += nutrition.fiber || 0;
      stats.mealsCount += 1;
    });

    return Array.from(dailyStats.values());
  }
}