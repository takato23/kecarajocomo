/**
 * Fallback utilities for Argentine meal planning
 * Handles cultural rules, error recovery, and traditional food requirements
 */

import { 
  ArgentineWeeklyPlan,
  ArgentineDayPlan,
  ArgentineMeal,
  Recipe,
  MealType,
  ModeType,
  UserPreferences,
  RegionType,
  SeasonType,
  NutritionInfo
} from '@/types/meal-planning/argentine';
import { nanoid } from 'nanoid';

// ============================================================================
// CULTURAL RULES ENFORCEMENT
// ============================================================================

/**
 * Ensures Argentine cultural traditions are respected in meal planning
 */
export function enforceCulturalRules(
  plan: ArgentineWeeklyPlan, 
  weekStart: string
): ArgentineWeeklyPlan {
  let enhancedPlan = { ...plan };
  
  // Ensure mate is present if preferences indicate daily consumption
  enhancedPlan = ensureMate(enhancedPlan);
  
  // Ensure asado on weekends if frequency allows
  enhancedPlan = ensureAsado(enhancedPlan);
  
  // Ensure ñoquis on the 29th if applicable
  enhancedPlan = ensureNoquis29(enhancedPlan, weekStart);
  
  // Ensure Sunday family lunch is substantial
  enhancedPlan = ensureSundayFamilyMeal(enhancedPlan);
  
  // Balance traditional vs modern based on preferences
  enhancedPlan = balanceTraditionalMeals(enhancedPlan);
  
  // Update cultural metadata
  enhancedPlan.cultural = updateCulturalMetadata(enhancedPlan);
  
  return enhancedPlan;
}

/**
 * Ensures mate is included in merienda when culturally appropriate
 */
export function ensureMate(plan: ArgentineWeeklyPlan): ArgentineWeeklyPlan {
  const preferences = plan.preferences;
  if (preferences?.cultural.mateFrequency === 'nunca') return plan;
  
  const frequency = preferences?.cultural.mateFrequency || 'ocasional';
  const daysToIncludeMate = getDaysForFrequency(frequency);
  
  return {
    ...plan,
    days: plan.days.map((day, index) => {
      if (!daysToIncludeMate.includes(index)) return day;
      
      // Add mate to merienda if not already present
      if (!day.merienda || !isMateRelated(day.merienda.recipe)) {
        const mateRecipe = getMateRecipe(plan.region);
        const mateMeal: ArgentineMeal = {
          id: nanoid(),
          recipe: mateRecipe,
          servings: preferences?.family.householdSize || 2,
          cost: mateRecipe.cost.perServing * (preferences?.family.householdSize || 2),
          nutrition: scaleNutrition(mateRecipe.nutrition, preferences?.family.householdSize || 2),
          cultural: {
            timeOfDay: 'merienda',
            isTraditional: true,
            occasion: 'mate'
          }
        };
        
        return {
          ...day,
          merienda: mateMeal,
          cultural: {
            ...day.cultural,
            hasMate: true
          }
        };
      }
      
      return day;
    })
  };
}

/**
 * Ensures asado is planned for appropriate days
 */
export function ensureAsado(plan: ArgentineWeeklyPlan): ArgentineWeeklyPlan {
  const preferences = plan.preferences;
  if (preferences?.cultural.asadoFrequency === 'nunca') return plan;
  
  const frequency = preferences?.cultural.asadoFrequency || 'quincenal';
  
  // Determine if this week should have asado
  const shouldHaveAsado = shouldIncludeAsado(frequency, plan.weekStart);
  if (!shouldHaveAsado) return plan;
  
  // Find Sunday (index 6) or Saturday (index 5) for asado
  const asadoDay = plan.days.find(day => day.dayOfWeek === 0 || day.dayOfWeek === 6); // Sunday or Saturday
  if (!asadoDay) return plan;
  
  const asadoRecipe = getAsadoRecipe(plan.region, plan.mode);
  const asadoMeal: ArgentineMeal = {
    id: nanoid(),
    recipe: asadoRecipe,
    servings: preferences?.family.householdSize || 4,
    cost: asadoRecipe.cost.perServing * (preferences?.family.householdSize || 4),
    nutrition: scaleNutrition(asadoRecipe.nutrition, preferences?.family.householdSize || 4),
    cultural: {
      timeOfDay: 'almuerzo',
      isTraditional: true,
      occasion: 'asado'
    }
  };
  
  return {
    ...plan,
    days: plan.days.map(day => {
      if (day.date === asadoDay.date) {
        return {
          ...day,
          almuerzo: asadoMeal,
          cultural: {
            ...day.cultural,
            hasAsado: true,
            occasion: 'asado'
          }
        };
      }
      return day;
    })
  };
}

/**
 * Ensures ñoquis are planned for the 29th of the month
 */
export function ensureNoquis29(plan: ArgentineWeeklyPlan, weekStart: string): ArgentineWeeklyPlan {
  // Check if any day in the week is the 29th
  const day29 = plan.days.find(day => {
    const date = new Date(day.date);
    return date.getDate() === 29;
  });
  
  if (!day29) return plan;
  
  const noquiRecipe = getNoquiRecipe(plan.region);
  const noquiMeal: ArgentineMeal = {
    id: nanoid(),
    recipe: noquiRecipe,
    servings: plan.preferences?.family.householdSize || 2,
    cost: noquiRecipe.cost.perServing * (plan.preferences?.family.householdSize || 2),
    nutrition: scaleNutrition(noquiRecipe.nutrition, plan.preferences?.family.householdSize || 2),
    cultural: {
      timeOfDay: 'almuerzo',
      isTraditional: true,
      occasion: 'dia29'
    }
  };
  
  return {
    ...plan,
    days: plan.days.map(day => {
      if (day.date === day29.date) {
        return {
          ...day,
          almuerzo: noquiMeal,
          cultural: {
            ...day.cultural,
            isSpecialDay: true,
            occasion: 'dia29',
            notes: 'Tradición del 29 - Ñoquis'
          }
        };
      }
      return day;
    })
  };
}

/**
 * Ensures Sunday has a substantial family meal
 */
function ensureSundayFamilyMeal(plan: ArgentineWeeklyPlan): ArgentineWeeklyPlan {
  const sunday = plan.days.find(day => day.dayOfWeek === 0);
  if (!sunday) return plan;
  
  // If already has asado, skip
  if (sunday.cultural.hasAsado) return plan;
  
  // Ensure substantial Sunday lunch
  if (!sunday.almuerzo || sunday.almuerzo.cost < 800) { // Minimum cost for family meal
    const sundayRecipe = getSundayFamilyRecipe(plan.region, plan.mode);
    const sundayMeal: ArgentineMeal = {
      id: nanoid(),
      recipe: sundayRecipe,
      servings: plan.preferences?.family.householdSize || 4,
      cost: sundayRecipe.cost.perServing * (plan.preferences?.family.householdSize || 4),
      nutrition: scaleNutrition(sundayRecipe.nutrition, plan.preferences?.family.householdSize || 4),
      cultural: {
        timeOfDay: 'almuerzo',
        isTraditional: true,
        occasion: 'domingo'
      }
    };
    
    return {
      ...plan,
      days: plan.days.map(day => {
        if (day.dayOfWeek === 0) {
          return {
            ...day,
            almuerzo: sundayMeal,
            cultural: {
              ...day.cultural,
              isSpecialDay: true,
              occasion: 'domingo'
            }
          };
        }
        return day;
      })
    };
  }
  
  return plan;
}

/**
 * Balances traditional vs modern meals based on user preferences
 */
function balanceTraditionalMeals(plan: ArgentineWeeklyPlan): ArgentineWeeklyPlan {
  const traditionLevel = plan.preferences?.cultural.traditionLevel || 'media';
  const targetTraditionalRatio = getTraditionalRatio(traditionLevel);
  
  const totalMeals = plan.days.flatMap(day => 
    [day.desayuno, day.almuerzo, day.merienda, day.cena].filter(Boolean)
  ).length;
  
  const currentTraditionalMeals = plan.days.flatMap(day =>
    [day.desayuno, day.almuerzo, day.merienda, day.cena]
      .filter(Boolean)
      .filter(meal => meal!.recipe.cultural.isTraditional)
  ).length;
  
  const targetTraditionalMeals = Math.round(totalMeals * targetTraditionalRatio);
  
  if (currentTraditionalMeals < targetTraditionalMeals) {
    // Need to add more traditional meals
    return addTraditionalMeals(plan, targetTraditionalMeals - currentTraditionalMeals);
  }
  
  return plan;
}

// ============================================================================
// FALLBACK GENERATION
// ============================================================================

/**
 * Generates a complete fallback weekly plan when AI generation fails
 */
export function generateFallbackWeeklyPlan(
  weekStart: string,
  preferences?: UserPreferences,
  mode: ModeType = 'normal'
): ArgentineWeeklyPlan {
  const region = preferences?.cultural.region || 'pampa';
  const season = getCurrentSeason();
  
  const fallbackPlan: ArgentineWeeklyPlan = {
    planId: `fallback_${nanoid()}`,
    userId: 'fallback',
    weekStart,
    weekEnd: getWeekEnd(weekStart),
    days: [],
    weeklyNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    weeklyCost: 0,
    totalPrepTime: 0,
    totalCookTime: 0,
    generatedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mode,
    region,
    season,
    cultural: {
      hasAsado: false,
      hasMate: false,
      hasNoquis29: false,
      traditionalDishes: 0,
      specialOccasions: [],
      varietyScore: 5,
      balanceScore: 5
    },
    preferences: preferences || getDefaultPreferences(),
  };
  
  // Generate 7 days of basic meals
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    
    const day: ArgentineDayPlan = {
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      dayName: getDayName(dayOfWeek),
      desayuno: generateFallbackMeal('desayuno', preferences, mode),
      almuerzo: generateFallbackMeal('almuerzo', preferences, mode),
      merienda: generateFallbackMeal('merienda', preferences, mode),
      cena: generateFallbackMeal('cena', preferences, mode),
      cultural: {
        isSpecialDay: dayOfWeek === 0, // Sunday
        hasMate: true,
        hasAsado: dayOfWeek === 0 // Asado on Sunday
      },
      dailyNutrition: { calories: 1800, protein: 80, carbs: 200, fat: 60 },
      dailyCost: 1200,
      prepTime: 60,
      cookTime: 45
    };
    
    fallbackPlan.days.push(day);
  }
  
  // Apply cultural rules to the fallback plan
  return enforceCulturalRules(fallbackPlan, weekStart);
}

/**
 * Generates a single fallback meal when specific meal generation fails
 */
export function generateFallbackMeal(
  mealType: MealType,
  preferences?: UserPreferences,
  mode: ModeType = 'normal'
): ArgentineMeal {
  const recipe = getFallbackRecipe(mealType, mode, preferences?.cultural.region);
  
  return {
    id: nanoid(),
    recipe,
    servings: preferences?.family.householdSize || 2,
    cost: recipe.cost.perServing * (preferences?.family.householdSize || 2),
    nutrition: scaleNutrition(recipe.nutrition, preferences?.family.householdSize || 2),
    cultural: {
      timeOfDay: mealType,
      isTraditional: recipe.cultural.isTraditional
    }
  };
}

// ============================================================================
// RECIPE GENERATION HELPERS
// ============================================================================

/**
 * Gets a basic mate recipe for merienda
 */
function getMateRecipe(region: RegionType): Recipe {
  return {
    id: `mate_${region}`,
    name: 'Mate con facturas',
    description: 'Mate tradicional argentino acompañado de facturas',
    ingredients: [
      {
        id: 'yerba',
        name: 'Yerba mate',
        amount: 50,
        unit: 'g',
        category: 'bebidas',
        isTraditional: true
      },
      {
        id: 'facturas',
        name: 'Facturas surtidas',
        amount: 4,
        unit: 'unidades',
        category: 'otros'
      }
    ],
    instructions: [
      'Preparar el mate con agua a 70-80°C',
      'Servir las facturas en un plato',
      'Disfrutar en ronda familiar'
    ],
    nutrition: { calories: 200, protein: 5, carbs: 35, fat: 8 },
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    difficulty: 'facil',
    tags: ['merienda', 'tradicional', 'mate'],
    region,
    cultural: {
      isTraditional: true,
      occasion: 'mate',
      significance: 'Tradición argentina de compartir mate'
    },
    cost: {
      total: 400,
      perServing: 200,
      currency: 'ARS',
      lastUpdated: new Date().toISOString(),
      budgetTier: 'economico'
    },
    equipment: ['mate', 'bombilla', 'pava'],
    techniques: ['cebado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Gets an asado recipe appropriate for the region and mode
 */
function getAsadoRecipe(region: RegionType, mode: ModeType): Recipe {
  const cuts = mode === 'economico' 
    ? ['pollo', 'chorizo', 'morcilla']
    : ['bife de chorizo', 'vacío', 'chorizo', 'morcilla'];
    
  return {
    id: `asado_${region}_${mode}`,
    name: 'Asado argentino',
    description: `Asado tradicional ${mode === 'economico' ? 'económico' : 'completo'} con ${cuts.join(', ')}`,
    ingredients: [
      {
        id: 'carne',
        name: cuts[0],
        amount: 300,
        unit: 'g',
        category: 'carnes',
        isTraditional: true
      },
      {
        id: 'chorizo',
        name: 'Chorizo',
        amount: 200,
        unit: 'g',
        category: 'carnes',
        isTraditional: true
      },
      {
        id: 'sal_gruesa',
        name: 'Sal gruesa',
        amount: 20,
        unit: 'g',
        category: 'condimentos'
      }
    ],
    instructions: [
      'Encender el fuego con leña o carbón',
      'Salar la carne con sal gruesa',
      'Cocinar a fuego medio durante 45-60 minutos',
      'Dar vuelta las carnes según sea necesario',
      'Servir bien caliente'
    ],
    nutrition: { calories: 650, protein: 45, carbs: 5, fat: 50 },
    prepTime: 30,
    cookTime: 60,
    servings: 4,
    difficulty: 'medio',
    tags: ['asado', 'tradicional', 'fin_de_semana'],
    region,
    cultural: {
      isTraditional: true,
      occasion: 'asado',
      significance: 'Tradición argentina del asado dominical'
    },
    cost: {
      total: mode === 'economico' ? 2400 : 3600,
      perServing: mode === 'economico' ? 600 : 900,
      currency: 'ARS',
      lastUpdated: new Date().toISOString(),
      budgetTier: mode === 'economico' ? 'economico' : 'medio'
    },
    equipment: ['parrilla', 'pinzas', 'cuchillo'],
    techniques: ['asado', 'parrilla'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Gets ñoqui recipe for the 29th tradition
 */
function getNoquiRecipe(region: RegionType): Recipe {
  return {
    id: `noquis_29_${region}`,
    name: 'Ñoquis del 29',
    description: 'Ñoquis tradicionales con salsa de tomate para el 29 del mes',
    ingredients: [
      {
        id: 'papa',
        name: 'Papa',
        amount: 1000,
        unit: 'g',
        category: 'verduras',
        isTraditional: true
      },
      {
        id: 'harina',
        name: 'Harina',
        amount: 200,
        unit: 'g',
        category: 'cereales'
      },
      {
        id: 'huevo',
        name: 'Huevo',
        amount: 1,
        unit: 'unidad',
        category: 'otros'
      },
      {
        id: 'tomate',
        name: 'Puré de tomate',
        amount: 400,
        unit: 'g',
        category: 'verduras'
      }
    ],
    instructions: [
      'Hervir las papas con cáscara hasta que estén tiernas',
      'Pelar y pisar las papas calientes',
      'Agregar harina y huevo, formar una masa',
      'Hacer rollitos y cortar los ñoquis',
      'Hervir en agua con sal hasta que floten',
      'Servir con salsa de tomate'
    ],
    nutrition: { calories: 380, protein: 12, carbs: 75, fat: 5 },
    prepTime: 45,
    cookTime: 30,
    servings: 4,
    difficulty: 'medio',
    tags: ['ñoquis', 'tradicional', 'dia29'],
    region,
    cultural: {
      isTraditional: true,
      occasion: 'dia29',
      significance: 'Tradición argentina del 29 - comer ñoquis para atraer prosperidad'
    },
    cost: {
      total: 800,
      perServing: 200,
      currency: 'ARS',
      lastUpdated: new Date().toISOString(),
      budgetTier: 'economico'
    },
    equipment: ['olla', 'tenedor', 'cuchillo'],
    techniques: ['hervor', 'amasado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDaysForFrequency(frequency: string): number[] {
  switch (frequency) {
    case 'diario': return [0, 1, 2, 3, 4, 5, 6]; // Every day
    case 'semanal': return [0, 3, 6]; // Monday, Thursday, Sunday
    case 'ocasional': return [0, 6]; // Weekend only
    default: return [6]; // Sunday only
  }
}

function shouldIncludeAsado(frequency: string, weekStart: string): boolean {
  const weekNumber = getWeekOfYear(new Date(weekStart));
  
  switch (frequency) {
    case 'semanal': return true;
    case 'quincenal': return weekNumber % 2 === 0;
    case 'mensual': return weekNumber % 4 === 0;
    default: return false;
  }
}

function isMateRelated(recipe: Recipe): boolean {
  return recipe.name.toLowerCase().includes('mate') || 
         recipe.tags.includes('mate') ||
         recipe.cultural.occasion === 'mate';
}

function scaleNutrition(nutrition: NutritionInfo, servings: number): NutritionInfo {
  return {
    calories: Math.round(nutrition.calories * servings),
    protein: Math.round(nutrition.protein * servings),
    carbs: Math.round(nutrition.carbs * servings),
    fat: Math.round(nutrition.fat * servings),
    fiber: nutrition.fiber ? Math.round(nutrition.fiber * servings) : undefined,
    sodium: nutrition.sodium ? Math.round(nutrition.sodium * servings) : undefined,
  };
}

function getTraditionalRatio(traditionLevel: string): number {
  switch (traditionLevel) {
    case 'alta': return 0.7; // 70% traditional meals
    case 'media': return 0.4; // 40% traditional meals
    case 'baja': return 0.2; // 20% traditional meals
    default: return 0.4;
  }
}

function getCurrentSeason(): SeasonType {
  const month = new Date().getMonth();
  if (month >= 11 || month <= 2) return 'verano';
  if (month >= 3 && month <= 5) return 'otono';
  if (month >= 6 && month <= 8) return 'invierno';
  return 'primavera';
}

function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
}

function getDayName(dayOfWeek: number): string {
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return names[dayOfWeek];
}

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

function updateCulturalMetadata(plan: ArgentineWeeklyPlan) {
  const hasAsado = plan.days.some(day => day.cultural.hasAsado);
  const hasMate = plan.days.some(day => day.cultural.hasMate);
  const hasNoquis29 = plan.days.some(day => day.cultural.occasion === 'dia29');
  
  const traditionalMeals = plan.days.flatMap(day =>
    [day.desayuno, day.almuerzo, day.merienda, day.cena]
      .filter(Boolean)
      .filter(meal => meal!.recipe.cultural.isTraditional)
  ).length;
  
  const specialOccasions = plan.days
    .filter(day => day.cultural.isSpecialDay)
    .map(day => day.cultural.occasion)
    .filter(Boolean) as string[];
  
  return {
    hasAsado,
    hasMate,
    hasNoquis29,
    traditionalDishes: traditionalMeals,
    specialOccasions,
    varietyScore: calculateVarietyScore(plan),
    balanceScore: calculateBalanceScore(plan)
  };
}

// Simplified scoring functions
function calculateVarietyScore(plan: ArgentineWeeklyPlan): number {
  const recipes = plan.days.flatMap(day =>
    [day.desayuno, day.almuerzo, day.merienda, day.cena].filter(Boolean)
  );
  const uniqueRecipes = new Set(recipes.map(meal => meal!.recipe.id));
  return Math.min(10, Math.round((uniqueRecipes.size / recipes.length) * 10));
}

function calculateBalanceScore(plan: ArgentineWeeklyPlan): number {
  // Simplified balance score based on nutrition variety
  return 7; // Default good balance
}

// Placeholder functions for additional fallback recipes
function getSundayFamilyRecipe(region: RegionType, mode: ModeType): Recipe {
  // Return a substantial family meal recipe
  return getFallbackRecipe('almuerzo', mode, region);
}

function addTraditionalMeals(plan: ArgentineWeeklyPlan, count: number): ArgentineWeeklyPlan {
  // Implementation to add traditional meals to reach target
  return plan;
}

function getFallbackRecipe(mealType: MealType, mode: ModeType, region?: RegionType): Recipe {
  // Simplified fallback recipes
  const fallbackRecipes: Record<MealType, Recipe> = {
    desayuno: {
      id: `fallback_desayuno`,
      name: 'Café con tostadas',
      description: 'Desayuno simple con café y tostadas',
      ingredients: [],
      instructions: ['Preparar café', 'Tostar el pan', 'Servir caliente'],
      nutrition: { calories: 250, protein: 8, carbs: 35, fat: 8 },
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      difficulty: 'facil',
      tags: ['desayuno', 'simple'],
      cultural: { isTraditional: true },
      cost: { total: 150, perServing: 150, currency: 'ARS', lastUpdated: new Date().toISOString(), budgetTier: 'economico' },
      equipment: [],
      techniques: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    almuerzo: {
      id: `fallback_almuerzo`,
      name: 'Milanesas con puré',
      description: 'Milanesas caseras con puré de papa',
      ingredients: [],
      instructions: ['Preparar milanesas', 'Hacer puré', 'Servir caliente'],
      nutrition: { calories: 550, protein: 35, carbs: 45, fat: 25 },
      prepTime: 20,
      cookTime: 25,
      servings: 2,
      difficulty: 'medio',
      tags: ['almuerzo', 'tradicional'],
      cultural: { isTraditional: true },
      cost: { total: 800, perServing: 400, currency: 'ARS', lastUpdated: new Date().toISOString(), budgetTier: 'medio' },
      equipment: [],
      techniques: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    merienda: {
      id: `fallback_merienda`,
      name: 'Mate con galletitas',
      description: 'Mate tradicional con galletitas',
      ingredients: [],
      instructions: ['Preparar mate', 'Servir galletitas'],
      nutrition: { calories: 180, protein: 4, carbs: 25, fat: 7 },
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      difficulty: 'facil',
      tags: ['merienda', 'mate'],
      cultural: { isTraditional: true, occasion: 'mate' },
      cost: { total: 120, perServing: 120, currency: 'ARS', lastUpdated: new Date().toISOString(), budgetTier: 'economico' },
      equipment: [],
      techniques: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    cena: {
      id: `fallback_cena`,
      name: 'Empanadas caseras',
      description: 'Empanadas de carne caseras',
      ingredients: [],
      instructions: ['Preparar masa', 'Hacer relleno', 'Armar y hornear'],
      nutrition: { calories: 420, protein: 18, carbs: 35, fat: 25 },
      prepTime: 30,
      cookTime: 20,
      servings: 3,
      difficulty: 'medio',
      tags: ['cena', 'tradicional'],
      cultural: { isTraditional: true },
      cost: { total: 600, perServing: 200, currency: 'ARS', lastUpdated: new Date().toISOString(), budgetTier: 'economico' },
      equipment: [],
      techniques: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  
  return fallbackRecipes[mealType];
}

function getDefaultPreferences(): UserPreferences {
  return {
    dietary: {
      restrictions: [],
      allergies: [],
      dislikes: [],
      favorites: ['asado', 'empanadas', 'milanesas'],
      avoidIngredients: [],
      preferIngredients: []
    },
    cooking: {
      skill: 'intermedio',
      timeAvailable: 60,
      equipment: ['horno', 'estufa'],
      preferredTechniques: ['plancha', 'horno'],
      avoidTechniques: [],
      maxDifficulty: 'medio'
    },
    cultural: {
      region: 'pampa',
      traditionLevel: 'media',
      mateFrequency: 'diario',
      asadoFrequency: 'quincenal',
      preferLocalIngredients: true,
      respectOccasions: true
    },
    family: {
      householdSize: 2,
      hasChildren: false,
      childrenAges: [],
      specialNeeds: [],
      eatingSchedule: {
        desayuno: '08:00',
        almuerzo: '13:00',
        merienda: '17:00',
        cena: '21:00'
      }
    },
    budget: {
      weekly: 15000,
      currency: 'ARS',
      flexibility: 'flexible',
      maxPerMeal: 500,
      prioritizeValue: true
    },
    shopping: {
      preferredStores: ['supermercado'],
      buysBulk: false,
      prefersLocal: true,
      hasGarden: false,
      shoppingDays: ['sabado'],
      avoidWaste: true
    },
    nutrition: {
      focusAreas: [],
      allergiesConsidered: true
    }
  };
}

// Additional utility exports
export { dedupeRecipes, mapRecipeIds };

function dedupeRecipes(recipes: Recipe[]): Recipe[] {
  const seen = new Set<string>();
  return recipes.filter(recipe => {
    if (seen.has(recipe.id)) return false;
    seen.add(recipe.id);
    return true;
  });
}

function mapRecipeIds(plan: ArgentineWeeklyPlan): ArgentineWeeklyPlan {
  // This function should map recipe IDs to ensure consistency
  // For now, just return the plan as-is
  return plan;
}