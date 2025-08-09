import type { WeekPlan, MealSlot, NutritionInfo, DayPlan } from '../types';
import { logger } from '@/services/logger';

/**
 * Calculates nutrition information for a single meal slot
 */
export function calculateMealNutrition(slot: MealSlot): NutritionInfo | null {
  if (!slot.recipe?.nutrition) return null;
  
  const { nutrition } = slot.recipe;
  const servingMultiplier = slot.servings / slot.recipe.servings;
  
  return {
    calories: Math.round(nutrition.calories * servingMultiplier),
    protein: Math.round(nutrition.protein * servingMultiplier),
    carbs: Math.round(nutrition.carbs * servingMultiplier),
    fat: Math.round(nutrition.fat * servingMultiplier),
    fiber: nutrition.fiber ? Math.round(nutrition.fiber * servingMultiplier) : undefined,
    sugar: nutrition.sugar ? Math.round(nutrition.sugar * servingMultiplier) : undefined,
    sodium: nutrition.sodium ? Math.round(nutrition.sodium * servingMultiplier) : undefined
  };
}

/**
 * Calculates daily nutrition totals
 */
export function calculateDayNutrition(daySlots: MealSlot[]): NutritionInfo {
  const totals: NutritionInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };
  
  daySlots.forEach(slot => {
    const mealNutrition = calculateMealNutrition(slot);
    if (mealNutrition) {
      totals.calories += mealNutrition.calories;
      totals.protein += mealNutrition.protein;
      totals.carbs += mealNutrition.carbs;
      totals.fat += mealNutrition.fat;
      
      if (mealNutrition.fiber) totals.fiber! += mealNutrition.fiber;
      if (mealNutrition.sugar) totals.sugar! += mealNutrition.sugar;
      if (mealNutrition.sodium) totals.sodium! += mealNutrition.sodium;
    }
  });
  
  return totals;
}

/**
 * Calculates weekly nutrition totals and averages
 */
export function calculateWeekNutrition(weekPlan: WeekPlan): {
  totals: NutritionInfo;
  dailyAverage: NutritionInfo;
  mealAverage: NutritionInfo;
  dayBreakdown: Record<number, NutritionInfo>;
} {
  const totals: NutritionInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };
  
  const dayBreakdown: Record<number, NutritionInfo> = {};
  let totalMeals = 0;
  
  // Group slots by day
  for (let day = 0; day < 7; day++) {
    const daySlots = weekPlan.slots.filter(slot => slot.dayOfWeek === day && slot.recipe);
    dayBreakdown[day] = calculateDayNutrition(daySlots);
    
    // Add to weekly totals
    totals.calories += dayBreakdown[day].calories;
    totals.protein += dayBreakdown[day].protein;
    totals.carbs += dayBreakdown[day].carbs;
    totals.fat += dayBreakdown[day].fat;
    
    if (dayBreakdown[day].fiber) totals.fiber! += dayBreakdown[day].fiber!;
    if (dayBreakdown[day].sugar) totals.sugar! += dayBreakdown[day].sugar!;
    if (dayBreakdown[day].sodium) totals.sodium! += dayBreakdown[day].sodium!;
    
    totalMeals += daySlots.length;
  }
  
  // Calculate averages
  const dailyAverage: NutritionInfo = {
    calories: Math.round(totals.calories / 7),
    protein: Math.round(totals.protein / 7),
    carbs: Math.round(totals.carbs / 7),
    fat: Math.round(totals.fat / 7),
    fiber: totals.fiber ? Math.round(totals.fiber / 7) : undefined,
    sugar: totals.sugar ? Math.round(totals.sugar / 7) : undefined,
    sodium: totals.sodium ? Math.round(totals.sodium / 7) : undefined
  };
  
  const mealAverage: NutritionInfo = {
    calories: totalMeals > 0 ? Math.round(totals.calories / totalMeals) : 0,
    protein: totalMeals > 0 ? Math.round(totals.protein / totalMeals) : 0,
    carbs: totalMeals > 0 ? Math.round(totals.carbs / totalMeals) : 0,
    fat: totalMeals > 0 ? Math.round(totals.fat / totalMeals) : 0,
    fiber: totals.fiber && totalMeals > 0 ? Math.round(totals.fiber / totalMeals) : undefined,
    sugar: totals.sugar && totalMeals > 0 ? Math.round(totals.sugar / totalMeals) : undefined,
    sodium: totals.sodium && totalMeals > 0 ? Math.round(totals.sodium / totalMeals) : undefined
  };
  
  return {
    totals,
    dailyAverage,
    mealAverage,
    dayBreakdown
  };
}

/**
 * Calculates macro percentages
 */
export function calculateMacroPercentages(nutrition: NutritionInfo): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const proteinCalories = nutrition.protein * 4;
  const carbCalories = nutrition.carbs * 4;
  const fatCalories = nutrition.fat * 9;
  const totalCalories = proteinCalories + carbCalories + fatCalories;
  
  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }
  
  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    carbs: Math.round((carbCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100)
  };
}

/**
 * Analyzes nutrition balance and provides recommendations
 */
export function analyzeNutritionBalance(
  nutrition: NutritionInfo,
  targetCalories: number = 2000
): {
  status: 'deficit' | 'balanced' | 'surplus';
  caloriesDiff: number;
  macroBalance: {
    protein: 'low' | 'balanced' | 'high';
    carbs: 'low' | 'balanced' | 'high';
    fat: 'low' | 'balanced' | 'high';
  };
  recommendations: string[];
} {
  const caloriesDiff = nutrition.calories - targetCalories;
  const status = caloriesDiff < -200 ? 'deficit' : caloriesDiff > 200 ? 'surplus' : 'balanced';
  
  const macroPercentages = calculateMacroPercentages(nutrition);
  
  // Recommended ranges (can be customized based on diet profile)
  const macroRanges = {
    protein: { min: 15, max: 30 },
    carbs: { min: 45, max: 65 },
    fat: { min: 20, max: 35 }
  };
  
  const macroBalance = {
    protein: macroPercentages.protein < macroRanges.protein.min ? 'low' :
             macroPercentages.protein > macroRanges.protein.max ? 'high' : 'balanced',
    carbs: macroPercentages.carbs < macroRanges.carbs.min ? 'low' :
           macroPercentages.carbs > macroRanges.carbs.max ? 'high' : 'balanced',
    fat: macroPercentages.fat < macroRanges.fat.min ? 'low' :
         macroPercentages.fat > macroRanges.fat.max ? 'high' : 'balanced'
  };
  
  const recommendations: string[] = [];
  
  // Calorie recommendations
  if (status === 'deficit') {
    recommendations.push(`Añade ${Math.abs(caloriesDiff)} calorías más a tu dieta diaria`);
  } else if (status === 'surplus') {
    recommendations.push(`Reduce ${caloriesDiff} calorías de tu dieta diaria`);
  }
  
  // Macro recommendations
  if (macroBalance.protein === 'low') {
    recommendations.push('Aumenta el consumo de proteínas (carnes magras, legumbres, lácteos)');
  } else if (macroBalance.protein === 'high') {
    recommendations.push('Considera reducir el consumo de proteínas y balancear con más vegetales');
  }
  
  if (macroBalance.carbs === 'low') {
    recommendations.push('Añade más carbohidratos saludables (granos enteros, frutas, vegetales)');
  } else if (macroBalance.carbs === 'high') {
    recommendations.push('Reduce los carbohidratos refinados y aumenta las proteínas y grasas saludables');
  }
  
  if (macroBalance.fat === 'low') {
    recommendations.push('Incluye más grasas saludables (aguacate, nueces, aceite de oliva)');
  } else if (macroBalance.fat === 'high') {
    recommendations.push('Reduce las grasas saturadas y opta por opciones más magras');
  }
  
  // Micronutrient recommendations
  if (nutrition.fiber && nutrition.fiber < 25) {
    recommendations.push('Aumenta el consumo de fibra (verduras, frutas, granos enteros)');
  }
  
  if (nutrition.sodium && nutrition.sodium > 2300) {
    recommendations.push('Reduce el consumo de sodio (menos alimentos procesados)');
  }
  
  return {
    status,
    caloriesDiff,
    macroBalance,
    recommendations
  };
}

/**
 * Generates a nutrition report for the week
 */
export function generateNutritionReport(weekPlan: WeekPlan): {
  summary: string;
  highlights: string[];
  warnings: string[];
  score: number;
} {
  const weekNutrition = calculateWeekNutrition(weekPlan);
  const analysis = analyzeNutritionBalance(weekNutrition.dailyAverage);
  
  const highlights: string[] = [];
  const warnings: string[] = [];
  
  // Calculate nutrition score (0-100)
  let score = 100;
  
  // Deduct points for imbalances
  if (analysis.status !== 'balanced') score -= 10;
  if (analysis.macroBalance.protein !== 'balanced') score -= 10;
  if (analysis.macroBalance.carbs !== 'balanced') score -= 10;
  if (analysis.macroBalance.fat !== 'balanced') score -= 10;
  
  // Add highlights
  if (score >= 80) {
    highlights.push('¡Excelente balance nutricional!');
  }
  
  if (analysis.status === 'balanced') {
    highlights.push('Consumo calórico adecuado');
  }
  
  if (weekNutrition.dailyAverage.fiber && weekNutrition.dailyAverage.fiber >= 25) {
    highlights.push('Buen consumo de fibra');
  }
  
  // Add warnings
  analysis.recommendations.forEach(rec => warnings.push(rec));
  
  // Generate summary
  const summary = `Tu plan semanal proporciona un promedio de ${weekNutrition.dailyAverage.calories} calorías diarias ` +
    `con ${weekNutrition.dailyAverage.protein}g de proteína, ${weekNutrition.dailyAverage.carbs}g de carbohidratos ` +
    `y ${weekNutrition.dailyAverage.fat}g de grasa.`;
  
  return {
    summary,
    highlights,
    warnings,
    score: Math.max(0, score)
  };
}