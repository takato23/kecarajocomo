/**
 * Reusable Prompt Templates for Gemini AI
 * Structured templates for consistent and maintainable prompts
 */

import { UserPreferences, PlanningConstraints } from '../types/mealPlanning';
import { 
  generateDailyMealPrompt,
  getMealSuggestions,
  ARGENTINE_MEAL_CULTURE,
  ArgentineMealContext,
  generateArgentineMealPlanPrompt,
  ARGENTINE_MEAL_COMPONENTS,
  SEASONAL_PREFERENCES,
  REGIONAL_SPECIALTIES,
  BUDGET_MEALS
} from '@/lib/prompts/argentineMealPrompts';

export class GeminiPromptTemplates {
  /**
   * Base template for all meal planning prompts
   */
  static readonly BASE_JSON_INSTRUCTION = `
CRITICAL: You must respond with a valid JSON object only. 
- Do NOT include any markdown formatting or code blocks
- Do NOT include explanatory text before or after the JSON
- Do NOT wrap the response in backticks
- The response must be parseable by JSON.parse() directly`;

  /**
   * User preferences section template
   */
  static formatUserPreferences(preferences: UserPreferences): string {
    return `USER PROFILE:
- Dietary Restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${preferences.allergies?.join(', ') || 'None'}
- Favorite Cuisines: ${preferences.favoriteCuisines?.join(', ') || 'International variety'}
- Cooking Skill: ${preferences.cookingSkillLevel || 'intermediate'}
- Household Size: ${preferences.householdSize || 2} people
- Weekly Budget: ${preferences.weeklyBudget ? `$${preferences.weeklyBudget}` : 'Flexible'}
- Avoided Ingredients: ${preferences.avoidIngredients?.join(', ') || 'None'}
- Meal Preferences: ${preferences.preferredMealTypes?.join(', ') || 'All meals'}
- Max Prep Time per Meal: ${preferences.maxPrepTimePerMeal || 60} minutes
- Batch Cooking: ${preferences.batchCookingPreference ? 'Preferred' : 'Not preferred'}`;
  }

  /**
   * Planning constraints section template
   */
  static formatPlanningConstraints(constraints: PlanningConstraints): string {
    const days = Math.ceil(
      (constraints.endDate.getTime() - constraints.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `PLANNING PARAMETERS:
- Duration: ${days} days (${constraints.startDate.toLocaleDateString()} to ${constraints.endDate.toLocaleDateString()})
- Meal Types Required: ${constraints.mealTypes.join(', ')}
- Servings per Meal: ${constraints.servings}
- Max Preparation Time: ${constraints.maxPrepTime} minutes
- Budget Limit: ${constraints.budgetLimit ? `$${constraints.budgetLimit}` : 'No specific limit'}
- Excluded Recipes: ${constraints.excludeRecipes?.length || 0} recipes to avoid
- Shopping Days: ${constraints.preferredShoppingDays?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'Any day'}
- Max Shopping Trips: ${constraints.maxShoppingTrips || 2} per week`;
  }

  /**
   * Nutritional goals template
   */
  static formatNutritionalGoals(goals: any): string {
    if (!goals || Object.keys(goals).length === 0) {
      return 'NUTRITIONAL GOALS: Balanced nutrition with variety';
    }

    return `NUTRITIONAL GOALS (Daily Targets):
- Calories: ${goals.calories || '2000-2200'}
- Protein: ${goals.protein || '50-60'}g
- Carbohydrates: ${goals.carbs || '225-325'}g
- Fat: ${goals.fat || '44-78'}g
- Fiber: ${goals.fiber || '25-35'}g
- Sugar: ${goals.sugar ? `max ${goals.sugar}g` : 'Minimize added sugars'}
- Sodium: ${goals.sodium ? `max ${goals.sodium}mg` : 'Moderate intake'}`;
  }

  /**
   * Pantry items template
   */
  static formatPantryItems(items: any[]): string {
    if (!items || items.length === 0) {
      return 'PANTRY: Empty - all ingredients need to be purchased';
    }

    const categorized = items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(`${item.name} (${item.quantity} ${item.unit})`);
      return acc;
    }, {} as Record<string, string[]>);

    return `AVAILABLE PANTRY ITEMS:
${Object.entries(categorized)
  .map(([category, items]) => `- ${category}: ${items.join(', ')}`)
  .join('\n')}`;
  }

  /**
   * Seasonal context template
   */
  static formatSeasonalContext(date: Date): string {
    const month = date.getMonth();
    const season = month >= 2 && month <= 4 ? 'Spring' :
                  month >= 5 && month <= 7 ? 'Summer' :
                  month >= 8 && month <= 10 ? 'Fall' : 'Winter';

    const seasonalProduce: Record<string, string[]> = {
      'Spring': ['asparagus', 'strawberries', 'peas', 'artichokes', 'radishes'],
      'Summer': ['tomatoes', 'corn', 'zucchini', 'berries', 'peaches', 'watermelon'],
      'Fall': ['pumpkin', 'apples', 'brussels sprouts', 'sweet potatoes', 'cranberries'],
      'Winter': ['citrus', 'pomegranate', 'winter squash', 'kale', 'root vegetables']
    };

    return `SEASONAL CONTEXT:
- Current Season: ${season}
- Seasonal Produce: ${seasonalProduce[season].join(', ')}
- Cooking Style: ${season === 'Summer' ? 'Light, fresh, minimal cooking' : 
                   season === 'Winter' ? 'Hearty, warming, comfort foods' :
                   'Balanced, transitional dishes'}`;
  }

  /**
   * Complete meal plan prompt - Argentine version
   */
  static createMealPlanPrompt(
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    pantryItems?: any[],
    context?: any
  ): string {
    // Determine Argentine context
    const currentMonth = constraints.startDate.getMonth() + 1;
    const season = currentMonth >= 12 || currentMonth <= 2 ? 'verano' : 
                   currentMonth >= 3 && currentMonth <= 5 ? 'otoño' : 
                   currentMonth >= 6 && currentMonth <= 8 ? 'invierno' : 'primavera';
    
    const region = 'buenosAires'; // Default region, could be from user preferences
    const budget = preferences.weeklyBudget && preferences.weeklyBudget < 50000 ? 'economico' :
                   preferences.weeklyBudget && preferences.weeklyBudget < 100000 ? 'moderado' : 'amplio';
    const cookingTime = preferences.maxPrepTimePerMeal && preferences.maxPrepTimePerMeal <= 30 ? 'rapido' :
                       preferences.maxPrepTimePerMeal && preferences.maxPrepTimePerMeal <= 60 ? 'normal' : 'elaborado';

    const argentineContext: ArgentineMealContext = {
      season: season as any,
      region: region as any,
      budget: budget as any,
      cookingTime: cookingTime as any,
      familySize: preferences.householdSize || 2,
      dietaryRestrictions: [
        ...(preferences.dietaryRestrictions || []),
        ...(preferences.allergies || [])
      ].filter(Boolean)
    };

    // Generate Argentine meal plan prompt
    const argentinePrompt = generateArgentineMealPlanPrompt(argentineContext);

    // Add JSON response format
    const sections = [
      argentinePrompt,
      '',
      '# PREFERENCIAS ADICIONALES DEL USUARIO:',
      this.formatUserPreferences(preferences),
      '',
      '# INFORMACIÓN DE LA DESPENSA:',
      pantryItems ? this.formatPantryItems(pantryItems) : 'Despensa vacía - necesita comprar todo',
      '',
      this.BASE_JSON_INSTRUCTION,
      '',
      this.getArgentineMealPlanResponseSchema()
    ].filter(Boolean).join('\n');

    return sections;
  }

  /**
   * Recipe regeneration prompt
   */
  static createRegenerateMealPrompt(
    mealType: string,
    dayOfWeek: string,
    preferences: UserPreferences,
    constraints: any,
    avoidRecipes?: string[]
  ): string {
    // Use Argentine meal suggestions based on meal type and day
    const suggestions = getMealSuggestions(
      mealType as any,
      constraints.budget || 'económico',
      dayOfWeek.toLowerCase().includes('sábado') || dayOfWeek.toLowerCase().includes('domingo') ? 'normal' : 'rápido',
      'verano' // Could be made dynamic based on date
    );

    return `# PEDIDO DE RECETA ARGENTINA

Generá una receta argentina auténtica para ${mealType === 'breakfast' ? 'desayuno' : mealType === 'lunch' ? 'almuerzo' : 'cena'} del ${dayOfWeek}.

${this.formatUserPreferences(preferences)}

REQUISITOS ESPECÍFICOS:
- Tipo de comida: ${mealType === 'breakfast' ? 'desayuno' : mealType === 'lunch' ? 'almuerzo' : 'cena'}
- Tiempo máximo: ${constraints.maxPrepTime || 30} minutos
- Porciones: ${constraints.servings || 2}
- Presupuesto: ${constraints.budgetPerServing ? `$${constraints.budgetPerServing} por porción` : 'Económico'}

${avoidRecipes?.length ? `EVITAR ESTAS RECETAS:\n- ${avoidRecipes.join('\n- ')}` : ''}

CONTEXTO CULTURAL ARGENTINO:
${ARGENTINE_MEAL_CULTURE}

SUGERENCIAS PARA ESTE TIPO DE COMIDA:
${suggestions.map(s => `- ${s}`).join('\n')}

IMPORTANTE:
- La receta debe ser algo que una familia argentina cocinaría realmente en casa
- Usar nombres argentinos para los platos (no traducciones)
- Los ingredientes deben ser fáciles de conseguir en Argentina
- Respetar las costumbres horarias (almuerzo 13-14hs, cena 21-22hs)
- Si es fin de semana, puede ser más elaborado

${this.BASE_JSON_INSTRUCTION}

Response format:
{
  "meal": {
    "name": "Nombre del plato en español argentino",
    "ingredients": ["ingrediente 1", "ingrediente 2"],
    "prep_time": 15,
    "cook_time": 20,
    "servings": 2,
    "difficulty": "easy|medium|hard",
    "nutrition": {
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 15
    },
    "instructions": ["Paso 1", "Paso 2", "Paso 3"]
  }
}`;
  }

  /**
   * Pantry-based recipe suggestions prompt - Argentine version
   */
  static createPantryRecipePrompt(
    pantryItems: any[],
    preferences: UserPreferences,
    mealTypes?: string[]
  ): string {
    const expiringItems = pantryItems
      .filter(item => item.expirationDate)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
      .slice(0, 5);

    return `# SUGERENCIAS DE RECETAS ARGENTINAS CON LA DESPENSA

Crea 3-5 recetas argentinas auténticas usando principalmente estos ingredientes disponibles.

${this.formatPantryItems(pantryItems)}

INGREDIENTES PRIORITARIOS (Usar primero):
${expiringItems.map(item => `- ${item.name} (vence ${new Date(item.expirationDate).toLocaleDateString('es-AR')})`).join('\n')}

${this.formatUserPreferences(preferences)}

REQUISITOS DE RECETAS:
- Usar al menos 60% de ingredientes de la despensa
- Minimizar compras adicionales
- Variedad en tipos de comida: ${mealTypes?.join(', ') || 'desayuno, almuerzo, cena, merienda'}
- Platos típicos argentinos caseros
- Preparación en menos de ${preferences.maxPrepTimePerMeal || 45} minutos

CONTEXTO CULTURAL ARGENTINO:
${ARGENTINE_MEAL_CULTURE}

SUGERENCIAS DE PLATOS TÍPICOS:
- Si tienes carne: milanesas, bifes, albóndigas
- Si tienes pasta: fideos con tuco, ñoquis caseros
- Si tienes huevos: tortilla de papas, revuelto gramajo
- Si tienes verduras: tartas, ensaladas, guarniciones
- Para merienda: mate con tortas, budines, scones

${this.BASE_JSON_INSTRUCTION}

Formato de respuesta:
{
  "recipes": [
    {
      "name": "Nombre del plato argentino",
      "meal_type": "desayuno|almuerzo|cena|merienda",
      "pantry_usage_percentage": 75,
      "additional_ingredients_needed": ["ingrediente 1", "ingrediente 2"],
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "prep_time": 20,
      "cook_time": 25,
      "servings": 4,
      "difficulty": "fácil|medio|difícil",
      "instructions": ["Paso 1", "Paso 2"],
      "cultural_notes": "Nota sobre la tradición del plato"
    }
  ]
}`;
  }

  /**
   * Shopping list generation prompt - Argentine version
   */
  static createShoppingListPrompt(
    mealPlan: any,
    pantryItems: any[],
    budget?: number,
    preferredStores?: string[]
  ): string {
    return `# LISTA DE COMPRAS ARGENTINA

Crea una lista de compras organizada para este plan de comidas argentino.

RESUMEN DEL PLAN DE COMIDAS:
${JSON.stringify(mealPlan, null, 2)}

${this.formatPantryItems(pantryItems)}

PARÁMETROS DE COMPRA:
- Presupuesto: ${budget ? `$${budget} ARS` : 'Optimizar precio-calidad'}
- Lugares preferidos: ${preferredStores?.join(', ') || 'Verdulería, carnicería, almacén del barrio'}
- Estrategia: Agrupar por tipo de negocio, minimizar desperdicio

ORGANIZACIÓN POR COMERCIOS ARGENTINOS:
1. VERDULERÍA:
   - Verduras frescas
   - Frutas de estación
   - Papas, cebollas, ajos

2. CARNICERÍA:
   - Cortes de carne (especificar: nalga, roast beef, asado, etc.)
   - Pollo (entero, supremas, patas/muslos)
   - Fiambres (jamón, queso, salame)
   - Carne picada

3. ALMACÉN/CHINO:
   - Productos secos (fideos, arroz, polenta)
   - Conservas
   - Aceite, vinagre, condimentos
   - Yerba mate
   - Harina, azúcar

4. PANADERÍA:
   - Pan francés
   - Facturas (medialunas, vigilantes)
   - Pan de miga
   - Prepizzas

5. FIAMBRERÍA/QUESERÍA:
   - Quesos (cremoso, rallado, cuartirolo)
   - Fiambres especiales
   - Aceitunas, pickles

6. LÁCTEOS:
   - Leche
   - Yogur
   - Manteca
   - Crema

${this.BASE_JSON_INSTRUCTION}

Formato de respuesta:
{
  "categories": [
    {
      "name": "Verdulería",
      "items": [
        {
          "name": "Tomates perita",
          "quantity": 2,
          "unit": "kg",
          "estimatedCost": 800,
          "notes": "Para salsa de milanesas y ensalada"
        }
      ],
      "categoryTotal": 4500
    }
  ],
  "totalEstimatedCost": 35000,
  "savingTips": [
    "Comprar pollo entero y trozarlo en casa ahorra 30%",
    "La carne picada común sirve perfectamente para albóndigas",
    "Verduras de estación están más baratas"
  ],
  "alternativeSuggestions": {
    "lomo": "nalga o bola de lomo para milanesas",
    "queso parmesano": "queso rallado común"
  }
}`;
  }

  /**
   * Nutritional analysis prompt
   */
  static createNutritionalAnalysisPrompt(mealPlan: any, goals: any): string {
    return `# NUTRITIONAL ANALYSIS REQUEST

Analyze the nutritional content of this meal plan and compare against goals.

MEAL PLAN:
${JSON.stringify(mealPlan, null, 2)}

${this.formatNutritionalGoals(goals)}

ANALYSIS REQUIREMENTS:
1. Calculate daily and weekly averages
2. Identify nutritional gaps or excesses
3. Suggest adjustments to meet goals
4. Highlight particularly nutritious meals
5. Note any concerns for specific dietary needs

${this.BASE_JSON_INSTRUCTION}

Response format:
{
  "dailyAverages": {
    "calories": 2100,
    "protein": 85,
    "carbs": 260,
    "fat": 70,
    "fiber": 28,
    "sugar": 45,
    "sodium": 2200
  },
  "goalComparison": {
    "calories": { "target": 2000, "actual": 2100, "difference": 100, "status": "slightly_over" },
    "protein": { "target": 60, "actual": 85, "difference": 25, "status": "exceeds" }
  },
  "nutritionalHighlights": [
    "High fiber content supports digestive health",
    "Excellent protein variety from plant and animal sources"
  ],
  "concerns": [
    "Sodium levels slightly elevated on Day 3",
    "Low iron content - consider adding leafy greens"
  ],
  "recommendations": [
    "Reduce portion sizes slightly to meet calorie goals",
    "Add vitamin C rich foods to improve iron absorption"
  ]
}`;
  }

  /**
   * Get the meal plan response schema for prompts
   */
  private static getMealPlanResponseSchema(): string {
    return `Expected JSON Response Structure:
{
  "daily_plans": [
    {
      "day": 1,
      "date": "2024-01-20",
      "meals": {
        "breakfast": {
          "name": "Wholesome Oatmeal Bowl",
          "ingredients": ["rolled oats", "banana", "almond butter", "chia seeds", "honey"],
          "prep_time": 5,
          "cook_time": 10,
          "servings": 2,
          "difficulty": "easy",
          "nutrition": {
            "calories": 380,
            "protein": 12,
            "carbs": 58,
            "fat": 14
          },
          "instructions": [
            "Bring 2 cups water to boil",
            "Add 1 cup oats and reduce heat",
            "Cook for 5 minutes stirring occasionally",
            "Top with sliced banana, almond butter, and chia seeds",
            "Drizzle with honey to taste"
          ]
        },
        "lunch": { /* same structure */ },
        "dinner": { /* same structure */ }
      }
    }
    /* ... more days */
  ],
  "shopping_list_preview": [
    { "item": "rolled oats", "quantity": "500", "unit": "g" },
    { "item": "bananas", "quantity": "6", "unit": "units" }
  ],
  "nutritional_analysis": {
    "average_daily_calories": 2050,
    "protein_grams": 78,
    "carbs_grams": 265,
    "fat_grams": 72
  },
  "optimization_summary": {
    "total_estimated_cost": 95.50,
    "prep_time_total_minutes": 420,
    "variety_score": 0.85
  }
}`;
  }

  /**
   * Get the Argentine meal plan response schema
   */
  private static getArgentineMealPlanResponseSchema(): string {
    return `Estructura JSON esperada:
{
  "daily_plans": [
    {
      "day": 1,
      "date": "2024-01-20",
      "day_name": "Lunes",
      "meals": {
        "breakfast": {
          "name": "Café con leche y tostadas",
          "ingredients": ["café", "leche", "pan", "manteca", "mermelada"],
          "prep_time": 5,
          "cook_time": 5,
          "servings": 2,
          "difficulty": "easy",
          "nutrition": {
            "calories": 350,
            "protein": 10,
            "carbs": 45,
            "fat": 15
          },
          "instructions": [
            "Preparar café con leche",
            "Tostar el pan",
            "Untar con manteca y mermelada"
          ]
        },
        "lunch": {
          "name": "Milanesas con puré",
          "ingredients": ["milanesas de carne", "papas", "leche", "manteca", "ajo", "perejil"],
          "prep_time": 20,
          "cook_time": 30,
          "servings": 2,
          "difficulty": "medium",
          "nutrition": {
            "calories": 650,
            "protein": 35,
            "carbs": 60,
            "fat": 28
          },
          "instructions": [
            "Freír las milanesas hasta dorar",
            "Hervir papas y hacer puré con leche y manteca",
            "Servir caliente con limón"
          ]
        },
        "snack": {
          "name": "Mate con bizcochos",
          "ingredients": ["yerba mate", "bizcochos", "agua caliente"],
          "prep_time": 5,
          "cook_time": 0,
          "servings": 2,
          "difficulty": "easy",
          "nutrition": {
            "calories": 200,
            "protein": 5,
            "carbs": 30,
            "fat": 7
          },
          "instructions": [
            "Preparar el mate",
            "Servir con bizcochos"
          ]
        },
        "dinner": {
          "name": "Pizza casera",
          "ingredients": ["masa de pizza", "salsa", "mozzarella", "orégano", "aceitunas"],
          "prep_time": 15,
          "cook_time": 20,
          "servings": 2,
          "difficulty": "medium",
          "nutrition": {
            "calories": 700,
            "protein": 28,
            "carbs": 80,
            "fat": 30
          },
          "instructions": [
            "Estirar la masa",
            "Agregar salsa y mozzarella",
            "Hornear hasta dorar"
          ]
        }
      }
    }
    /* ... más días */
  ],
  "shopping_list_preview": [
    { "item": "carne para milanesas", "quantity": "1", "unit": "kg" },
    { "item": "yerba mate", "quantity": "500", "unit": "g" },
    { "item": "mozzarella", "quantity": "500", "unit": "g" }
  ],
  "nutritional_analysis": {
    "average_daily_calories": 1900,
    "protein_grams": 78,
    "carbs_grams": 215,
    "fat_grams": 80
  },
  "optimization_summary": {
    "total_estimated_cost": 35000,
    "prep_time_total_minutes": 420,
    "variety_score": 0.85,
    "includes_traditional_meals": true,
    "mate_included": true,
    "sunday_asado": true
  }
}`;
  }
}