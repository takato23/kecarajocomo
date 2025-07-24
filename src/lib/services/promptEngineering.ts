/**
 * Enhanced Prompt Engineering System
 * Provides structured, validated prompts for all AI services with localization support
 */

import { UserPreferences, PlanningConstraints, DifficultyLevel } from '../types/mealPlanning';

export interface PromptTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'meal-planning' | 'recipe-generation' | 'ocr-processing' | 'nutrition-analysis';
  readonly language: 'es' | 'en';
  readonly version: string;
  readonly template: string;
  readonly parameters: ReadonlyArray<PromptParameter>;
  readonly validationRules: ReadonlyArray<ValidationRule>;
  readonly fallbackTemplate?: string;
}

export interface PromptParameter {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly required: boolean;
  readonly description: string;
  readonly validation?: (value: any) => boolean;
  readonly defaultValue?: any;
}

export interface ValidationRule {
  readonly field: string;
  readonly rule: 'required' | 'min_length' | 'max_length' | 'format' | 'range' | 'enum';
  readonly value: any;
  readonly message: string;
}

export interface PromptResult {
  readonly success: boolean;
  readonly prompt: string;
  readonly metadata: {
    readonly templateId: string;
    readonly version: string;
    readonly generatedAt: Date;
    readonly parameterCount: number;
    readonly estimatedTokens: number;
  };
  readonly errors?: ReadonlyArray<string>;
}

/**
 * Enhanced Prompt Engineering Service
 * Manages AI prompts with validation, localization, and optimization
 */
export class PromptEngineeringService {
  private readonly templates: Map<string, PromptTemplate> = new Map();
  private readonly language: 'es' | 'en';
  
  constructor(language: 'es' | 'en' = 'es') {
    this.language = language;
    this.initializeTemplates();
  }

  /**
   * Generate a meal planning prompt with comprehensive validation
   */
  generateMealPlanningPrompt(
    preferences: UserPreferences,
    constraints: PlanningConstraints,
    pantryItems: any[] = [],
    favoriteRecipes: any[] = []
  ): PromptResult {
    const templateId = 'meal-planning-comprehensive-v2';
    const template = this.templates.get(templateId);
    
    if (!template) {
      return {
        success: false,
        prompt: '',
        metadata: {
          templateId,
          version: '2.0',
          generatedAt: new Date(),
          parameterCount: 0,
          estimatedTokens: 0
        },
        errors: ['Template not found']
      };
    }

    try {
      const parameters = {
        userId: preferences.userId,
        dietaryRestrictions: preferences.dietaryRestrictions,
        allergies: preferences.allergies,
        favoriteCuisines: preferences.favoriteCuisines,
        cookingSkillLevel: preferences.cookingSkillLevel,
        householdSize: preferences.householdSize,
        weeklyBudget: preferences.weeklyBudget || 'flexible',
        preferredMealTypes: preferences.preferredMealTypes,
        avoidIngredients: preferences.avoidIngredients,
        nutritionalGoals: preferences.nutritionalGoals,
        maxPrepTime: constraints.maxPrepTime,
        budgetLimit: constraints.budgetLimit || 'sin límite',
        servings: constraints.servings,
        mealTypes: constraints.mealTypes,
        pantryItems: pantryItems.map(item => ({
          name: item.ingredient?.name || item.name,
          quantity: item.quantity,
          unit: item.unit,
          expirationDate: item.expirationDate
        })),
        favoriteRecipes: favoriteRecipes.map(recipe => ({
          title: recipe.recipe?.title || recipe.title,
          difficulty: recipe.recipe?.difficulty || recipe.difficulty,
          cuisine: recipe.recipe?.cuisine || 'variada',
          prepTime: recipe.recipe?.prepTimeMinutes || 30
        })),
        currentDate: new Date().toLocaleDateString('es-ES'),
        currentSeason: this.getCurrentSeason(),
        nutritionPriority: this.getNutritionPriority(preferences),
        budgetPriority: this.getBudgetPriority(preferences),
        timePriority: this.getTimePriority(constraints)
      };

      const validationResult = this.validateParameters(template, parameters);
      if (!validationResult.success) {
        return {
          success: false,
          prompt: '',
          metadata: {
            templateId,
            version: template.version,
            generatedAt: new Date(),
            parameterCount: Object.keys(parameters).length,
            estimatedTokens: 0
          },
          errors: validationResult.errors
        };
      }

      const prompt = this.interpolateTemplate(template.template, parameters);
      const estimatedTokens = this.estimateTokens(prompt);

      return {
        success: true,
        prompt,
        metadata: {
          templateId,
          version: template.version,
          generatedAt: new Date(),
          parameterCount: Object.keys(parameters).length,
          estimatedTokens
        }
      };

    } catch (error: unknown) {
      return {
        success: false,
        prompt: '',
        metadata: {
          templateId,
          version: template.version,
          generatedAt: new Date(),
          parameterCount: 0,
          estimatedTokens: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Generate a recipe creation prompt
   */
  generateRecipeCreationPrompt(
    recipeName: string,
    ingredients: string[],
    difficulty: DifficultyLevel,
    servings: number,
    dietaryRestrictions: string[] = [],
    cuisine: string = 'variada'
  ): PromptResult {
    const templateId = 'recipe-creation-detailed-v1';
    const template = this.templates.get(templateId);
    
    if (!template) {
      return {
        success: false,
        prompt: '',
        metadata: {
          templateId,
          version: '1.0',
          generatedAt: new Date(),
          parameterCount: 0,
          estimatedTokens: 0
        },
        errors: ['Template not found']
      };
    }

    const parameters = {
      recipeName,
      ingredients: ingredients.join(', '),
      difficulty,
      servings,
      dietaryRestrictions: dietaryRestrictions.join(', ') || 'ninguna',
      cuisine,
      currentSeason: this.getCurrentSeason(),
      nutritionFocus: this.getNutritionFocusForRecipe(dietaryRestrictions),
      cookingTips: this.getCookingTipsForDifficulty(difficulty),
      equipmentSuggestions: this.getEquipmentSuggestions(difficulty),
      currentDate: new Date().toLocaleDateString('es-ES')
    };

    const prompt = this.interpolateTemplate(template.template, parameters);
    const estimatedTokens = this.estimateTokens(prompt);

    return {
      success: true,
      prompt,
      metadata: {
        templateId,
        version: template.version,
        generatedAt: new Date(),
        parameterCount: Object.keys(parameters).length,
        estimatedTokens
      }
    };
  }

  /**
   * Generate an OCR processing prompt for receipts
   */
  generateReceiptOCRPrompt(
    extractedText: string,
    expectedStore?: string,
    expectedDate?: string
  ): PromptResult {
    const templateId = 'receipt-ocr-processing-v1';
    const template = this.templates.get(templateId);
    
    if (!template) {
      return {
        success: false,
        prompt: '',
        metadata: {
          templateId,
          version: '1.0',
          generatedAt: new Date(),
          parameterCount: 0,
          estimatedTokens: 0
        },
        errors: ['Template not found']
      };
    }

    const parameters = {
      extractedText,
      expectedStore: expectedStore || 'tienda desconocida',
      expectedDate: expectedDate || 'fecha no especificada',
      currentDate: new Date().toLocaleDateString('es-ES'),
      argentineCurrency: 'ARS',
      commonStores: [
        'Coto', 'Carrefour', 'Walmart', 'Jumbo', 'Vea', 'Disco', 'La Anonima',
        'Libertad', 'Chango Más', 'Maxiconsumo', 'Cordiez', 'Día'
      ].join(', '),
      foodCategories: [
        'Lácteos', 'Carnes', 'Verduras', 'Frutas', 'Panadería', 'Bebidas',
        'Congelados', 'Conservas', 'Limpieza', 'Perfumería'
      ].join(', ')
    };

    const prompt = this.interpolateTemplate(template.template, parameters);
    const estimatedTokens = this.estimateTokens(prompt);

    return {
      success: true,
      prompt,
      metadata: {
        templateId,
        version: template.version,
        generatedAt: new Date(),
        parameterCount: Object.keys(parameters).length,
        estimatedTokens
      }
    };
  }

  /**
   * Initialize all prompt templates
   */
  private initializeTemplates(): void {
    // Meal Planning Template
    this.templates.set('meal-planning-comprehensive-v2', {
      id: 'meal-planning-comprehensive-v2',
      name: 'Comprehensive Meal Planning',
      description: 'Advanced meal planning with nutritional optimization',
      category: 'meal-planning',
      language: this.language,
      version: '2.0',
      template: `
Eres un chef profesional y nutricionista especializado en planificación de comidas argentinas. Tu objetivo es crear un plan semanal personalizado, balanceado y práctico.

CONTEXTO DEL USUARIO:
- ID de usuario: {{userId}}
- Tamaño del hogar: {{householdSize}} personas
- Nivel de cocina: {{cookingSkillLevel}}
- Presupuesto semanal: ${{weeklyBudget}} ARS
- Fecha actual: {{currentDate}}
- Temporada: {{currentSeason}}

PREFERENCIAS DIETARIAS:
- Restricciones: {{dietaryRestrictions}}
- Alergias: {{allergies}}
- Cocinas favoritas: {{favoriteCuisines}}
- Ingredientes a evitar: {{avoidIngredients}}

METAS NUTRICIONALES:
- Calorías diarias: {{nutritionalGoals.calories}} kcal
- Proteína: {{nutritionalGoals.protein}}g
- Carbohidratos: {{nutritionalGoals.carbs}}g
- Grasas: {{nutritionalGoals.fat}}g

RESTRICCIONES DE TIEMPO Y PRESUPUESTO:
- Tiempo máximo de preparación: {{maxPrepTime}} minutos
- Límite de presupuesto: ${{budgetLimit}} ARS
- Porciones por comida: {{servings}}
- Tipos de comida: {{mealTypes}}

INGREDIENTES DISPONIBLES EN DESPENSA:
{{#each pantryItems}}
- {{name}} ({{quantity}} {{unit}}) - Vence: {{expirationDate}}
{{/each}}

RECETAS FAVORITAS:
{{#each favoriteRecipes}}
- {{title}} ({{difficulty}}, {{cuisine}}, {{prepTime}} min)
{{/each}}

PRIORIDADES DE PLANIFICACIÓN:
- Nutrición: {{nutritionPriority}}
- Presupuesto: {{budgetPriority}}
- Tiempo: {{timePriority}}

INSTRUCCIONES ESPECÍFICAS:
1. Crea un plan para 7 días con {{mealTypes}} por día
2. Prioriza ingredientes de despensa próximos a vencer
3. Incluye recetas favoritas cuando sea apropiado
4. Asegura variedad en cocinas y métodos de cocción
5. Optimiza para presupuesto y tiempo de preparación
6. Considera técnicas de meal prep y batch cooking
7. Sugiere aprovechamiento de sobras
8. Incluye consejos de conservación

FORMATO DE RESPUESTA (JSON estricto):
{
  "week_plan": {
    "lunes": {
      "desayuno": {
        "name": "Nombre del plato",
        "ingredients": ["ingrediente1", "ingrediente2"],
        "prep_time": 15,
        "cook_time": 10,
        "servings": {{servings}},
        "difficulty": "easy|medium|hard",
        "estimated_cost": 250.00,
        "nutrition": {
          "calories": 400,
          "protein": 20,
          "carbs": 50,
          "fat": 15
        },
        "pantry_utilization": 0.7,
        "instructions": ["Paso 1", "Paso 2", "Paso 3"],
        "cooking_tips": ["Consejo 1", "Consejo 2"],
        "storage_instructions": "Conservar en refrigerador",
        "meal_prep_friendly": true
      },
      "almuerzo": { /* similar structure */ },
      "cena": { /* similar structure */ }
    },
    "martes": { /* similar structure */ },
    // ... resto de la semana
  },
  "optimization_summary": {
    "total_budget_used": 875.50,
    "pantry_utilization": 0.65,
    "nutrition_balance_score": 0.85,
    "prep_time_efficiency": 0.90,
    "recipe_variety_score": 0.80,
    "seasonal_ingredient_usage": 0.75
  },
  "batch_cooking_opportunities": [
    {
      "ingredient": "arroz integral",
      "meals": ["lunes_almuerzo", "miércoles_cena"],
      "prep_instructions": "Cocinar 2 tazas el domingo",
      "storage_tips": "Conservar en refrigerador hasta 3 días"
    }
  ],
  "shopping_list_preview": [
    {
      "item": "pollo",
      "quantity": 1.5,
      "unit": "kg",
      "estimated_cost": 450.00,
      "meals": ["lunes_cena", "jueves_almuerzo"],
      "storage_priority": "high",
      "substitutes": ["carne picada", "pescado"]
    }
  ],
  "leftover_management": [
    {
      "from_meal": "lunes_cena",
      "to_meal": "martes_almuerzo",
      "transformation": "Pollo asado → Ensalada de pollo",
      "instructions": "Desmenuzar pollo y agregar a ensalada verde"
    }
  ],
  "meal_prep_plan": {
    "sunday_prep": {
      "duration": 90,
      "tasks": [
        "Cocinar granos y legumbres",
        "Cortar verduras",
        "Marinar proteínas"
      ]
    },
    "weekday_prep": {
      "duration": 20,
      "tasks": [
        "Ensamblar platos",
        "Calentar componentes",
        "Finalizar preparación"
      ]
    }
  },
  "nutritional_analysis": {
    "daily_averages": {
      "calories": 2000,
      "protein": 120,
      "carbs": 250,
      "fat": 70
    },
    "weekly_balance": {
      "variety_score": 0.85,
      "nutrient_density": 0.78,
      "macro_balance": 0.90
    }
  },
  "seasonal_recommendations": [
    "Aprovechar tomates de temporada",
    "Incluir calabaza de invierno",
    "Usar cítricos frescos"
  ]
}

VALIDACIÓN:
- Todos los precios deben ser realistas para Argentina
- Tiempos de preparación deben ser precisos
- Respetar todas las restricciones dietarias
- JSON válido y completo
- Ingredientes disponibles en Argentina
      `,
      parameters: [
        { name: 'userId', type: 'string', required: true, description: 'User ID' },
        { name: 'householdSize', type: 'number', required: true, description: 'Number of people' },
        { name: 'cookingSkillLevel', type: 'string', required: true, description: 'Cooking skill level' },
        { name: 'weeklyBudget', type: 'number', required: false, description: 'Weekly budget in ARS' },
        { name: 'dietaryRestrictions', type: 'array', required: false, description: 'Dietary restrictions' },
        { name: 'allergies', type: 'array', required: false, description: 'Food allergies' },
        { name: 'favoriteCuisines', type: 'array', required: false, description: 'Favorite cuisines' },
        { name: 'avoidIngredients', type: 'array', required: false, description: 'Ingredients to avoid' },
        { name: 'nutritionalGoals', type: 'object', required: false, description: 'Nutritional goals' },
        { name: 'maxPrepTime', type: 'number', required: true, description: 'Maximum prep time in minutes' },
        { name: 'budgetLimit', type: 'number', required: false, description: 'Budget limit' },
        { name: 'servings', type: 'number', required: true, description: 'Servings per meal' },
        { name: 'mealTypes', type: 'array', required: true, description: 'Types of meals to include' },
        { name: 'pantryItems', type: 'array', required: false, description: 'Available pantry items' },
        { name: 'favoriteRecipes', type: 'array', required: false, description: 'User favorite recipes' }
      ],
      validationRules: [
        { field: 'userId', rule: 'required', value: true, message: 'User ID is required' },
        { field: 'householdSize', rule: 'range', value: [1, 20], message: 'Household size must be between 1 and 20' },
        { field: 'maxPrepTime', rule: 'range', value: [5, 240], message: 'Prep time must be between 5 and 240 minutes' },
        { field: 'servings', rule: 'range', value: [1, 20], message: 'Servings must be between 1 and 20' },
        { field: 'mealTypes', rule: 'required', value: true, message: 'At least one meal type is required' }
      ]
    });

    // Recipe Creation Template
    this.templates.set('recipe-creation-detailed-v1', {
      id: 'recipe-creation-detailed-v1',
      name: 'Detailed Recipe Creation',
      description: 'Creates detailed recipes with instructions and tips',
      category: 'recipe-generation',
      language: this.language,
      version: '1.0',
      template: `
Eres un chef profesional argentino especializado en crear recetas detalladas y fáciles de seguir.

SOLICITUD DE RECETA:
- Nombre: {{recipeName}}
- Ingredientes disponibles: {{ingredients}}
- Nivel de dificultad: {{difficulty}}
- Porciones: {{servings}}
- Restricciones dietarias: {{dietaryRestrictions}}
- Tipo de cocina: {{cuisine}}
- Temporada actual: {{currentSeason}}
- Fecha: {{currentDate}}

ENFOQUE NUTRICIONAL:
{{nutritionFocus}}

CONSEJOS DE COCINA PARA {{difficulty}}:
{{cookingTips}}

EQUIPO SUGERIDO:
{{equipmentSuggestions}}

INSTRUCCIONES:
1. Crea una receta completa y detallada
2. Usa ingredientes disponibles en Argentina
3. Adapta a la temporada actual
4. Incluye técnicas apropiadas para el nivel {{difficulty}}
5. Proporciona tiempos realistas
6. Incluye consejos de presentación
7. Sugiere variaciones opcionales
8. Incluye información nutricional estimada

FORMATO DE RESPUESTA (JSON):
{
  "recipe": {
    "title": "{{recipeName}}",
    "description": "Descripción atractiva de la receta",
    "servings": {{servings}},
    "difficulty": "{{difficulty}}",
    "cuisine": "{{cuisine}}",
    "prep_time": 20,
    "cook_time": 30,
    "total_time": 50,
    "ingredients": [
      {
        "name": "ingrediente",
        "quantity": 200,
        "unit": "g",
        "preparation": "cortado en cubos",
        "category": "vegetal"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "instruction": "Preparar los ingredientes...",
        "time": 5,
        "technique": "mise en place",
        "tips": "Consejos específicos para este paso"
      }
    ],
    "nutrition": {
      "calories": 320,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "fiber": 5,
      "sodium": 450
    },
    "equipment": [
      "sartén grande",
      "cuchillo de chef",
      "tabla de cortar"
    ],
    "storage": {
      "refrigerator": "3-4 días",
      "freezer": "2-3 meses",
      "instructions": "Conservar en recipiente hermético"
    },
    "variations": [
      "Versión vegetariana: sustituir carne por...",
      "Versión sin gluten: usar harina de..."
    ],
    "presentation": {
      "plating": "Servir en plato hondo, decorar con...",
      "garnish": "Perejil fresco y limón",
      "accompaniments": ["ensalada verde", "pan tostado"]
    },
    "chef_tips": [
      "Para mejor sabor, marinar por 30 minutos",
      "No revolver demasiado la preparación"
    ],
    "estimated_cost": 450.00,
    "seasonal_adaptations": [
      "En verano: agregar tomates frescos",
      "En invierno: usar calabaza asada"
    ]
  }
}

Genera la receta ahora:
      `,
      parameters: [
        { name: 'recipeName', type: 'string', required: true, description: 'Recipe name' },
        { name: 'ingredients', type: 'string', required: true, description: 'Available ingredients' },
        { name: 'difficulty', type: 'string', required: true, description: 'Difficulty level' },
        { name: 'servings', type: 'number', required: true, description: 'Number of servings' },
        { name: 'dietaryRestrictions', type: 'string', required: false, description: 'Dietary restrictions' },
        { name: 'cuisine', type: 'string', required: false, description: 'Cuisine type' }
      ],
      validationRules: [
        { field: 'recipeName', rule: 'required', value: true, message: 'Recipe name is required' },
        { field: 'ingredients', rule: 'required', value: true, message: 'Ingredients are required' },
        { field: 'servings', rule: 'range', value: [1, 20], message: 'Servings must be between 1 and 20' }
      ]
    });

    // Receipt OCR Template
    this.templates.set('receipt-ocr-processing-v1', {
      id: 'receipt-ocr-processing-v1',
      name: 'Receipt OCR Processing',
      description: 'Processes OCR text from Argentine receipts',
      category: 'ocr-processing',
      language: this.language,
      version: '1.0',
      template: `
Eres un experto en procesamiento de tickets de compra argentinos. Tu objetivo es extraer información precisa de productos alimentarios.

TEXTO EXTRAÍDO DEL TICKET:
{{extractedText}}

INFORMACIÓN CONTEXTUAL:
- Tienda esperada: {{expectedStore}}
- Fecha esperada: {{expectedDate}}
- Fecha actual: {{currentDate}}
- Moneda: {{argentineCurrency}}

TIENDAS COMUNES EN ARGENTINA:
{{commonStores}}

CATEGORÍAS DE ALIMENTOS:
{{foodCategories}}

INSTRUCCIONES:
1. Identifica la tienda y fecha del ticket
2. Extrae solo productos alimentarios
3. Normaliza nombres de productos
4. Categoriza cada producto
5. Valida precios según mercado argentino
6. Identifica cantidades y unidades
7. Descarta productos no alimentarios
8. Maneja errores de OCR comunes

FORMATO DE RESPUESTA (JSON):
{
  "store_info": {
    "name": "Nombre de la tienda",
    "date": "2024-01-15",
    "location": "Dirección si está disponible",
    "receipt_number": "Número de ticket"
  },
  "items": [
    {
      "name": "Leche Entera",
      "normalized_name": "leche",
      "category": "lacteos",
      "quantity": 1,
      "unit": "litro",
      "price": 250.00,
      "brand": "La Serenísima",
      "confidence": 0.95,
      "raw_text": "LECHE ENT 1LT LS"
    }
  ],
  "totals": {
    "subtotal": 1250.00,
    "tax": 150.00,
    "total": 1400.00,
    "items_count": 8
  },
  "processing_notes": [
    "Producto 'SHAMPOO' descartado por no ser alimentario",
    "Precio de 'tomate' validado según temporada"
  ],
  "confidence_score": 0.87,
  "validation_errors": [
    "Precio de lechuga parece alto para la temporada"
  ]
}

REGLAS DE VALIDACIÓN:
- Precios en pesos argentinos
- Solo productos alimentarios
- Nombres normalizados en español
- Cantidades y unidades estándar
- Confianza mínima del 70%

Procesa el ticket ahora:
      `,
      parameters: [
        { name: 'extractedText', type: 'string', required: true, description: 'OCR extracted text' },
        { name: 'expectedStore', type: 'string', required: false, description: 'Expected store name' },
        { name: 'expectedDate', type: 'string', required: false, description: 'Expected date' },
        { name: 'currentDate', type: 'string', required: true, description: 'Current date' },
        { name: 'argentineCurrency', type: 'string', required: true, description: 'Currency code' },
        { name: 'commonStores', type: 'string', required: true, description: 'Common store names' },
        { name: 'foodCategories', type: 'string', required: true, description: 'Food categories' }
      ],
      validationRules: [
        { field: 'extractedText', rule: 'required', value: true, message: 'Extracted text is required' },
        { field: 'extractedText', rule: 'min_length', value: 10, message: 'Extracted text too short' }
      ]
    });
  }

  /**
   * Validate parameters against template rules
   */
  private validateParameters(template: PromptTemplate, parameters: any): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of template.validationRules) {
      const value = parameters[rule.field];
      
      switch (rule.rule) {
        case 'required':
          if (rule.value && (value === undefined || value === null || value === '')) {
            errors.push(rule.message);
          }
          break;
        case 'min_length':
          if (typeof value === 'string' && value.length < rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'max_length':
          if (typeof value === 'string' && value.length > rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'range':
          if (typeof value === 'number' && (value < rule.value[0] || value > rule.value[1])) {
            errors.push(rule.message);
          }
          break;
        case 'enum':
          if (!rule.value.includes(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * Interpolate template with parameters
   */
  private interpolateTemplate(template: string, parameters: any): string {
    let result = template;
    
    // Simple interpolation for {{variable}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(parameters, key.trim());
      return value !== undefined ? String(value) : match;
    });

    // Handle arrays with {{#each}}
    result = result.replace(/\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayKey, content) => {
      const array = this.getNestedValue(parameters, arrayKey.trim());
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          if (typeof item === 'object') {
            for (const [key, value] of Object.entries(item)) {
              itemContent = itemContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
            }
          }
          return itemContent;
        }).join('');
      }
      return '';
    });

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Estimate token count for a prompt
   */
  private estimateTokens(prompt: string): number {
    // Rough estimation: 1 token ≈ 4 characters for Spanish text
    return Math.ceil(prompt.length / 4);
  }

  /**
   * Get current season based on date
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'verano';
    if (month >= 3 && month <= 5) return 'otoño';
    if (month >= 6 && month <= 8) return 'invierno';
    return 'primavera';
  }

  /**
   * Determine nutrition priority based on preferences
   */
  private getNutritionPriority(preferences: UserPreferences): string {
    if (preferences.nutritionalGoals.calories && preferences.nutritionalGoals.protein) {
      return 'alta - objetivos específicos definidos';
    }
    if (preferences.dietaryRestrictions.length > 0) {
      return 'alta - restricciones dietarias';
    }
    return 'media - balance general';
  }

  /**
   * Determine budget priority based on preferences
   */
  private getBudgetPriority(preferences: UserPreferences): string {
    if (preferences.weeklyBudget && preferences.weeklyBudget < 1000) {
      return 'alta - presupuesto ajustado';
    }
    if (preferences.weeklyBudget && preferences.weeklyBudget < 2000) {
      return 'media - presupuesto moderado';
    }
    return 'baja - presupuesto flexible';
  }

  /**
   * Determine time priority based on constraints
   */
  private getTimePriority(constraints: PlanningConstraints): string {
    if (constraints.maxPrepTime < 30) {
      return 'alta - tiempo muy limitado';
    }
    if (constraints.maxPrepTime < 60) {
      return 'media - tiempo moderado';
    }
    return 'baja - tiempo flexible';
  }

  /**
   * Get nutrition focus for recipe creation
   */
  private getNutritionFocusForRecipe(dietaryRestrictions: string[]): string {
    if (dietaryRestrictions.includes('vegetarian')) {
      return 'Enfoque en proteínas vegetales, hierro y vitamina B12';
    }
    if (dietaryRestrictions.includes('vegan')) {
      return 'Proteínas vegetales completas, calcio, hierro, vitamina B12 y omega-3';
    }
    if (dietaryRestrictions.includes('keto')) {
      return 'Alto en grasas saludables, moderado en proteínas, muy bajo en carbohidratos';
    }
    if (dietaryRestrictions.includes('gluten-free')) {
      return 'Evitar gluten, asegurar fibra y vitaminas del complejo B';
    }
    return 'Balance equilibrado de macronutrientes y micronutrientes';
  }

  /**
   * Get cooking tips based on difficulty
   */
  private getCookingTipsForDifficulty(difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case 'beginner':
        return 'Técnicas básicas, ingredientes simples, pasos claros y detallados';
      case 'intermediate':
        return 'Técnicas variadas, combinaciones de sabores, timing de cocción';
      case 'advanced':
        return 'Técnicas avanzadas, presentación profesional, balances complejos';
      default:
        return 'Técnicas adaptadas al nivel de experiencia';
    }
  }

  /**
   * Get equipment suggestions based on difficulty
   */
  private getEquipmentSuggestions(difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case 'beginner':
        return 'Equipos básicos de cocina: sartén, olla, cuchillo, tabla de cortar';
      case 'intermediate':
        return 'Equipos intermedios: procesadora, batidora, termómetro, mandolina';
      case 'advanced':
        return 'Equipos especializados: sous vide, torcha, sifón, moldes especiales';
      default:
        return 'Equipos estándar de cocina';
    }
  }
}

// Export singleton instance
export const promptEngineering = new PromptEngineeringService('es');