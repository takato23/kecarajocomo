import { getGeminiService } from '../ai/GeminiService';
import type { Recipe } from '../planner/MealPlanner';

export interface RecipeSource {
  url: string;
  name: string;
  selector?: string;
}

export interface ScrapedRecipe extends Recipe {
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
  videoUrl?: string;
  rating?: number;
  reviews?: number;
}

/**
 * Scraper de Recetas con adaptación automática
 */
export class RecipeScraper {
  private geminiService;
  
  // Fuentes de recetas populares en Argentina
  private readonly RECIPE_SOURCES: RecipeSource[] = [
    { url: 'https://www.paulinacocina.net', name: 'Paulina Cocina' },
    { url: 'https://www.recetasgratis.net', name: 'Recetas Gratis' },
    { url: 'https://cookpad.com/ar', name: 'Cookpad Argentina' },
    { url: 'https://www.recetasdeargentina.com.ar', name: 'Recetas de Argentina' }
  ];
  
  constructor() {
    this.geminiService = getGeminiService();
  }
  
  /**
   * Buscar recetas basadas en ingredientes disponibles
   */
  async searchRecipesByIngredients(
    ingredients: string[],
    preferences?: {
      dietaryRestrictions?: string[];
      cuisineType?: string;
      maxCookingTime?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
    }
  ): Promise<ScrapedRecipe[]> {
    try {

      // Por ahora generar recetas con IA basadas en ingredientes
      const recipes = await this.generateRecipesWithAI(ingredients, preferences);
      
      return recipes;
      
    } catch (error: unknown) {
      console.error('Error buscando recetas:', error);
      return [];
    }
  }
  
  /**
   * Scrape receta desde URL
   */
  async scrapeRecipeFromUrl(url: string): Promise<ScrapedRecipe | null> {
    try {

      // TODO: Implementar scraping real con fetch y parsing
      // Por ahora usar IA para extraer información
      
      const mockRecipe = await this.extractRecipeWithAI(url);
      return mockRecipe;
      
    } catch (error: unknown) {
      console.error('Error scrapeando receta:', error);
      return null;
    }
  }
  
  /**
   * Adaptar receta a preferencias del usuario
   */
  async adaptRecipeToPreferences(
    recipe: Recipe,
    preferences: {
      servings?: number;
      dietaryRestrictions?: string[];
      allergies?: string[];
      dislikedIngredients?: string[];
      skillLevel?: number;
    }
  ): Promise<Recipe> {
    try {

      // 1. Ajustar porciones
      if (preferences.servings && preferences.servings !== recipe.servings) {
        recipe = this.adjustServings(recipe, preferences.servings);
      }
      
      // 2. Sustituir ingredientes problemáticos
      if (preferences.allergies || preferences.dislikedIngredients || preferences.dietaryRestrictions) {
        recipe = await this.substituteIngredients(recipe, preferences);
      }
      
      // 3. Simplificar según nivel de habilidad
      if (preferences.skillLevel && preferences.skillLevel <= 2) {
        recipe = await this.simplifyRecipe(recipe);
      }
      
      return recipe;
      
    } catch (error: unknown) {
      console.error('Error adaptando receta:', error);
      return recipe;
    }
  }
  
  /**
   * Generar recetas con IA basadas en ingredientes
   */
  private async generateRecipesWithAI(
    ingredients: string[],
    preferences?: any
  ): Promise<ScrapedRecipe[]> {
    try {
      const prompt = `
        Genera 5 recetas argentinas/latinoamericanas usando estos ingredientes:
        ${ingredients.join(', ')}
        
        ${preferences?.dietaryRestrictions ? `Restricciones: ${preferences.dietaryRestrictions.join(', ')}` : ''}
        ${preferences?.maxCookingTime ? `Tiempo máximo: ${preferences.maxCookingTime} minutos` : ''}
        ${preferences?.difficulty ? `Dificultad: ${preferences.difficulty}` : ''}
        
        Para cada receta incluye:
        - Nombre atractivo
        - Descripción breve
        - Lista completa de ingredientes con cantidades
        - Instrucciones paso a paso
        - Tiempo de preparación y cocción
        - Dificultad
        - Información nutricional aproximada
        - Tags relevantes
        
        Responde con un JSON array de recetas.
      `;
      
      // Por ahora retornar recetas mock
      return this.getMockRecipes(ingredients);
      
    } catch (error: unknown) {
      console.error('Error generando recetas con IA:', error);
      return this.getMockRecipes(ingredients);
    }
  }
  
  /**
   * Extraer receta de URL con IA
   */
  private async extractRecipeWithAI(url: string): Promise<ScrapedRecipe> {
    // Mock implementation
    return {
      id: 'scraped-1',
      name: 'Receta Scrapeada',
      description: 'Receta obtenida de ' + url,
      ingredients: [
        { name: 'Ingrediente 1', quantity: 1, unit: 'unidad', required: true }
      ],
      instructions: ['Paso 1', 'Paso 2'],
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'medium',
      tags: ['scrapeada'],
      sourceUrl: url,
      sourceName: new URL(url).hostname
    };
  }
  
  /**
   * Ajustar porciones de receta
   */
  private adjustServings(recipe: Recipe, newServings: number): Recipe {
    const ratio = newServings / recipe.servings;
    
    return {
      ...recipe,
      servings: newServings,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: Math.round(ing.quantity * ratio * 10) / 10
      }))
    };
  }
  
  /**
   * Sustituir ingredientes problemáticos
   */
  private async substituteIngredients(
    recipe: Recipe,
    preferences: any
  ): Promise<Recipe> {
    const allRestrictions = [
      ...(preferences.allergies || []),
      ...(preferences.dislikedIngredients || []),
      ...(preferences.dietaryRestrictions || [])
    ];
    
    const substitutions = this.getCommonSubstitutions();
    const updatedIngredients = recipe.ingredients.map(ing => {
      // Verificar si el ingrediente tiene restricciones
      const hasRestriction = allRestrictions.some(
        r => ing.name.toLowerCase().includes(r.toLowerCase())
      );
      
      if (hasRestriction) {
        // Buscar sustitución
        const substitute = substitutions[ing.name.toLowerCase()];
        if (substitute) {
          return {
            ...ing,
            name: substitute,
            notes: `Sustituido por ${substitute}`
          };
        }
      }
      
      return ing;
    });
    
    return {
      ...recipe,
      ingredients: updatedIngredients
    };
  }
  
  /**
   * Simplificar receta para principiantes
   */
  private async simplifyRecipe(recipe: Recipe): Promise<Recipe> {
    // Simplificar instrucciones complejas
    const simplifiedInstructions = recipe.instructions.map(instruction => {
      // Dividir instrucciones muy largas
      if (instruction.length > 100) {
        return instruction.match(/.{1,100}[.!?]\s/g) || [instruction];
      }
      return instruction;
    }).flat();
    
    return {
      ...recipe,
      instructions: simplifiedInstructions,
      difficulty: 'easy'
    };
  }
  
  /**
   * Obtener sustituciones comunes
   */
  private getCommonSubstitutions(): Record<string, string> {
    return {
      'leche': 'leche de almendras',
      'manteca': 'aceite de coco',
      'huevo': 'sustituto de huevo',
      'harina': 'harina sin gluten',
      'crema': 'crema de coco',
      'queso': 'queso vegano',
      'carne': 'proteína vegetal',
      'pollo': 'tofu',
      'pescado': 'tempeh'
    };
  }
  
  /**
   * Recetas mock para desarrollo
   */
  private getMockRecipes(ingredients: string[]): ScrapedRecipe[] {
    const baseRecipes: ScrapedRecipe[] = [
      {
        id: 'mock-1',
        name: 'Milanesas a la Napolitana',
        description: 'Clásicas milanesas argentinas con jamón, queso y salsa',
        ingredients: [
          { name: 'Milanesas', quantity: 4, unit: 'unidad', required: true },
          { name: 'Jamón', quantity: 200, unit: 'g', required: true },
          { name: 'Queso', quantity: 200, unit: 'g', required: true },
          { name: 'Salsa de tomate', quantity: 500, unit: 'ml', required: true }
        ],
        instructions: [
          'Freír las milanesas hasta dorar',
          'Colocar jamón y queso sobre cada milanesa',
          'Cubrir con salsa de tomate',
          'Gratinar en el horno 10 minutos'
        ],
        prepTime: 15,
        cookTime: 25,
        servings: 4,
        difficulty: 'easy',
        tags: ['argentina', 'clásico', 'horno'],
        nutrition: {
          calories: 520,
          protein: 38,
          carbs: 25,
          fat: 28
        },
        sourceUrl: 'https://ejemplo.com/milanesas',
        sourceName: 'Recetas Argentinas',
        rating: 4.8,
        reviews: 234
      },
      {
        id: 'mock-2',
        name: 'Empanadas de Carne',
        description: 'Empanadas jugosas al horno con el mejor relleno',
        ingredients: [
          { name: 'Carne picada', quantity: 500, unit: 'g', required: true },
          { name: 'Cebolla', quantity: 2, unit: 'unidad', required: true },
          { name: 'Huevo duro', quantity: 2, unit: 'unidad', required: true },
          { name: 'Tapas de empanada', quantity: 12, unit: 'unidad', required: true }
        ],
        instructions: [
          'Rehogar la cebolla hasta transparentar',
          'Agregar la carne y cocinar',
          'Condimentar y dejar enfriar',
          'Rellenar las empanadas y cerrar con repulgue',
          'Hornear 20 minutos a 200°C'
        ],
        prepTime: 45,
        cookTime: 20,
        servings: 12,
        difficulty: 'medium',
        tags: ['argentina', 'horno', 'tradicional'],
        nutrition: {
          calories: 280,
          protein: 15,
          carbs: 22,
          fat: 14
        },
        sourceUrl: 'https://ejemplo.com/empanadas',
        sourceName: 'Cocina Criolla',
        rating: 4.9,
        reviews: 567
      },
      {
        id: 'mock-3',
        name: 'Locro Criollo',
        description: 'Guiso tradicional perfecto para días fríos',
        ingredients: [
          { name: 'Maíz blanco', quantity: 300, unit: 'g', required: true },
          { name: 'Porotos', quantity: 200, unit: 'g', required: true },
          { name: 'Zapallo', quantity: 300, unit: 'g', required: true },
          { name: 'Carne de cerdo', quantity: 400, unit: 'g', required: true },
          { name: 'Chorizo', quantity: 2, unit: 'unidad', required: true }
        ],
        instructions: [
          'Remojar maíz y porotos la noche anterior',
          'Hervir con la carne hasta tiernizar',
          'Agregar zapallo y chorizo',
          'Cocinar a fuego lento 2 horas',
          'Servir con salsa picante'
        ],
        prepTime: 30,
        cookTime: 180,
        servings: 8,
        difficulty: 'medium',
        tags: ['argentina', 'invierno', 'tradicional'],
        nutrition: {
          calories: 420,
          protein: 22,
          carbs: 48,
          fat: 16
        },
        sourceUrl: 'https://ejemplo.com/locro',
        sourceName: 'Sabores Patrios',
        rating: 4.7,
        reviews: 189
      }
    ];
    
    // Filtrar recetas que contengan algún ingrediente disponible
    return baseRecipes.filter(recipe => 
      recipe.ingredients.some(ing => 
        ingredients.some(available => 
          ing.name.toLowerCase().includes(available.toLowerCase())
        )
      )
    );
  }
}

// Singleton
let recipeScraper: RecipeScraper | null = null;

export function getRecipeScraper(): RecipeScraper {
  if (!recipeScraper) {
    recipeScraper = new RecipeScraper();
  }
  return recipeScraper;
}