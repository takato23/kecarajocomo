/**
 * Nutrition calculation utilities for Argentine meal planning
 * Handles nutrition aggregation, analysis, and recommendations
 */

import { 
  ArgentineWeeklyPlan, 
  ArgentineDayPlan, 
  ArgentineMeal, 
  NutritionInfo, 
  WeeklyNutritionSummary,
  UserPreferences,
  DEFAULT_NUTRITION_TARGETS
} from '@/types/meal-planning/argentine';

// ============================================================================
// NUTRITION AGGREGATION
// ============================================================================

/**
 * Calculates daily nutrition totals from all meals
 */
export function calculateDailyNutrition(dayPlan: ArgentineDayPlan): NutritionInfo {
  const meals = [dayPlan.desayuno, dayPlan.almuerzo, dayPlan.merienda, dayPlan.cena].filter(Boolean) as ArgentineMeal[];
  
  return meals.reduce((total, meal) => ({
    calories: total.calories + meal.nutrition.calories,
    protein: total.protein + meal.nutrition.protein,
    carbs: total.carbs + meal.nutrition.carbs,
    fat: total.fat + meal.nutrition.fat,
    fiber: (total.fiber || 0) + (meal.nutrition.fiber || 0),
    sodium: (total.sodium || 0) + (meal.nutrition.sodium || 0),
    sugar: (total.sugar || 0) + (meal.nutrition.sugar || 0),
    iron: (total.iron || 0) + (meal.nutrition.iron || 0),
    calcium: (total.calcium || 0) + (meal.nutrition.calcium || 0),
    vitaminC: (total.vitaminC || 0) + (meal.nutrition.vitaminC || 0),
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
    iron: 0,
    calcium: 0,
    vitaminC: 0,
  });
}

/**
 * Calculates weekly nutrition totals and averages
 */
export function calculateWeeklyNutrition(weeklyPlan: ArgentineWeeklyPlan): {
  weekly: NutritionInfo;
  daily: NutritionInfo;
} {
  const weeklyTotals = weeklyPlan.days.reduce((total, day) => {
    const dailyNutrition = calculateDailyNutrition(day);
    return {
      calories: total.calories + dailyNutrition.calories,
      protein: total.protein + dailyNutrition.protein,
      carbs: total.carbs + dailyNutrition.carbs,
      fat: total.fat + dailyNutrition.fat,
      fiber: (total.fiber || 0) + (dailyNutrition.fiber || 0),
      sodium: (total.sodium || 0) + (dailyNutrition.sodium || 0),
      sugar: (total.sugar || 0) + (dailyNutrition.sugar || 0),
      iron: (total.iron || 0) + (dailyNutrition.iron || 0),
      calcium: (total.calcium || 0) + (dailyNutrition.calcium || 0),
      vitaminC: (total.vitaminC || 0) + (dailyNutrition.vitaminC || 0),
    };
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
    iron: 0,
    calcium: 0,
    vitaminC: 0,
  });

  const dailyAverages: NutritionInfo = {
    calories: Math.round(weeklyTotals.calories / 7),
    protein: Math.round(weeklyTotals.protein / 7),
    carbs: Math.round(weeklyTotals.carbs / 7),
    fat: Math.round(weeklyTotals.fat / 7),
    fiber: Math.round((weeklyTotals.fiber || 0) / 7),
    sodium: Math.round((weeklyTotals.sodium || 0) / 7),
    sugar: Math.round((weeklyTotals.sugar || 0) / 7),
    iron: Math.round((weeklyTotals.iron || 0) / 7),
    calcium: Math.round((weeklyTotals.calcium || 0) / 7),
    vitaminC: Math.round((weeklyTotals.vitaminC || 0) / 7),
  };

  return {
    weekly: weeklyTotals,
    daily: dailyAverages
  };
}

// ============================================================================
// NUTRITION ANALYSIS
// ============================================================================

/**
 * Analyzes nutrition balance and generates scores
 */
export function analyzeNutritionBalance(
  weeklyPlan: ArgentineWeeklyPlan, 
  preferences?: UserPreferences
): WeeklyNutritionSummary['balance'] {
  const { daily, weekly } = calculateWeeklyNutrition(weeklyPlan);
  
  // Get appropriate targets based on family composition
  const targets = getTargetsForUser(preferences);
  
  // Calculate scores (0-10)
  const nutritionScore = calculateNutritionScore(daily, targets);
  const varietyScore = calculateVarietyScore(weeklyPlan);
  const culturalScore = calculateCulturalScore(weeklyPlan);
  const budgetEfficiency = calculateBudgetEfficiency(weeklyPlan);
  
  return {
    varietyScore,
    nutritionScore,
    culturalScore,
    budgetEfficiency
  };
}

/**
 * Gets nutrition targets based on user preferences
 */
function getTargetsForUser(preferences?: UserPreferences): NutritionInfo {
  if (!preferences) return DEFAULT_NUTRITION_TARGETS.adult;
  
  const { family, nutrition } = preferences;
  let baseTargets = DEFAULT_NUTRITION_TARGETS.adult;
  
  // Adjust for children in household
  if (family.hasChildren) {
    const adultMembers = Math.max(1, family.householdSize - family.childrenAges.length);
    const childMembers = family.childrenAges.length;
    
    // Weighted average between adult and child targets
    const adultWeight = adultMembers / family.householdSize;
    const childWeight = childMembers / family.householdSize;
    
    baseTargets = {
      calories: Math.round(DEFAULT_NUTRITION_TARGETS.adult.calories * adultWeight + 
                          DEFAULT_NUTRITION_TARGETS.child.calories * childWeight),
      protein: Math.round(DEFAULT_NUTRITION_TARGETS.adult.protein * adultWeight + 
                         DEFAULT_NUTRITION_TARGETS.child.protein * childWeight),
      carbs: Math.round(DEFAULT_NUTRITION_TARGETS.adult.carbs * adultWeight + 
                       DEFAULT_NUTRITION_TARGETS.child.carbs * childWeight),
      fat: Math.round(DEFAULT_NUTRITION_TARGETS.adult.fat * adultWeight + 
                     DEFAULT_NUTRITION_TARGETS.child.fat * childWeight),
      fiber: Math.round(DEFAULT_NUTRITION_TARGETS.adult.fiber * adultWeight + 
                       DEFAULT_NUTRITION_TARGETS.child.fiber * childWeight),
      sodium: Math.round(DEFAULT_NUTRITION_TARGETS.adult.sodium * adultWeight + 
                        DEFAULT_NUTRITION_TARGETS.child.sodium * childWeight),
    };
  }
  
  // Apply custom targets if specified
  if (nutrition?.targetCalories) baseTargets.calories = nutrition.targetCalories;
  if (nutrition?.targetProtein) baseTargets.protein = nutrition.targetProtein;
  if (nutrition?.targetCarbs) baseTargets.carbs = nutrition.targetCarbs;
  if (nutrition?.targetFat) baseTargets.fat = nutrition.targetFat;
  
  return baseTargets;
}

/**
 * Calculates nutrition score based on target adherence
 */
function calculateNutritionScore(actual: NutritionInfo, targets: NutritionInfo): number {
  const tolerance = 0.15; // 15% tolerance
  
  const scores = [
    calculateAdherenceScore(actual.calories, targets.calories, tolerance),
    calculateAdherenceScore(actual.protein, targets.protein, tolerance),
    calculateAdherenceScore(actual.carbs, targets.carbs, tolerance),
    calculateAdherenceScore(actual.fat, targets.fat, tolerance),
  ];
  
  // Bonus points for adequate fiber and controlled sodium
  if (actual.fiber && actual.fiber >= (targets.fiber || 25)) {
    scores.push(10);
  }
  if (actual.sodium && actual.sodium <= (targets.sodium || 2300)) {
    scores.push(10);
  }
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Calculates adherence score for a single nutrient
 */
function calculateAdherenceScore(actual: number, target: number, tolerance: number): number {
  const lowerBound = target * (1 - tolerance);
  const upperBound = target * (1 + tolerance);
  
  if (actual >= lowerBound && actual <= upperBound) {
    return 10; // Perfect adherence
  }
  
  const deviation = Math.abs(actual - target) / target;
  if (deviation <= tolerance * 2) {
    return Math.max(0, 10 - (deviation - tolerance) * 50); // Linear decay
  }
  
  return 0; // Too far from target
}

/**
 * Calculates variety score based on recipe diversity
 */
function calculateVarietyScore(weeklyPlan: ArgentineWeeklyPlan): number {
  const allMeals = weeklyPlan.days.flatMap(day => 
    [day.desayuno, day.almuerzo, day.merienda, day.cena].filter(Boolean) as ArgentineMeal[]
  );
  
  const uniqueRecipes = new Set(allMeals.map(meal => meal.recipe.id));
  const totalMeals = allMeals.length;
  
  if (totalMeals === 0) return 0;
  
  // Score based on recipe diversity
  const diversityRatio = uniqueRecipes.size / totalMeals;
  
  // Bonus for different cooking techniques
  const techniques = new Set(allMeals.flatMap(meal => meal.recipe.techniques));
  const techniqueBonus = Math.min(2, techniques.size / 5); // Max 2 bonus points
  
  // Bonus for seasonal ingredients
  const seasonalMeals = allMeals.filter(meal => 
    meal.recipe.season === weeklyPlan.season
  ).length;
  const seasonalBonus = (seasonalMeals / totalMeals) * 2; // Max 2 bonus points
  
  const baseScore = diversityRatio * 6; // Max 6 points for variety
  return Math.min(10, Math.round(baseScore + techniqueBonus + seasonalBonus));
}

/**
 * Calculates cultural score based on Argentine traditions
 */
function calculateCulturalScore(weeklyPlan: ArgentineWeeklyPlan): number {
  let score = 0;
  
  // Check for cultural requirements
  if (weeklyPlan.cultural.hasAsado) score += 2;
  if (weeklyPlan.cultural.hasMate) score += 1;
  if (weeklyPlan.cultural.hasNoquis29) score += 1;
  
  // Traditional dishes score
  const traditionalRatio = weeklyPlan.cultural.traditionalDishes / 
    weeklyPlan.days.length; // Average traditional dishes per day
  score += traditionalRatio * 4; // Max 4 points
  
  // Regional consistency
  const regionalMeals = weeklyPlan.days.flatMap(day =>
    [day.desayuno, day.almuerzo, day.merienda, day.cena]
      .filter(Boolean)
      .filter(meal => meal && meal.recipe.region === weeklyPlan.region)
  ).length;
  
  const totalMeals = weeklyPlan.days.flatMap(day =>
    [day.desayuno, day.almuerzo, day.merienda, day.cena].filter(Boolean)
  ).length;
  
  if (totalMeals > 0) {
    const regionalRatio = regionalMeals / totalMeals;
    score += regionalRatio * 2; // Max 2 points for regional consistency
  }
  
  return Math.min(10, Math.round(score));
}

/**
 * Calculates budget efficiency score
 */
function calculateBudgetEfficiency(weeklyPlan: ArgentineWeeklyPlan): number {
  const budget = weeklyPlan.preferences?.budget?.weekly;
  if (!budget) return 5; // Neutral score if no budget set
  
  const actualCost = weeklyPlan.weeklyCost;
  const ratio = actualCost / budget;
  
  if (ratio <= 0.8) return 10; // Under budget
  if (ratio <= 0.95) return 8; // Close to budget
  if (ratio <= 1.05) return 6; // Slightly over budget
  if (ratio <= 1.2) return 4; // Moderately over budget
  return 2; // Significantly over budget
}

// ============================================================================
// NUTRITION RECOMMENDATIONS
// ============================================================================

/**
 * Generates nutrition recommendations based on analysis
 */
export function generateNutritionRecommendations(
  weeklyPlan: ArgentineWeeklyPlan,
  preferences?: UserPreferences
): string[] {
  const { daily } = calculateWeeklyNutrition(weeklyPlan);
  const targets = getTargetsForUser(preferences);
  const recommendations: string[] = [];
  
  // Calorie recommendations
  const calorieDeviation = (daily.calories - targets.calories) / targets.calories;
  if (calorieDeviation > 0.15) {
    recommendations.push('Considera reducir las porciones o elegir opciones más livianas para el almuerzo y cena.');
  } else if (calorieDeviation < -0.15) {
    recommendations.push('Podrías agregar snacks saludables o aumentar las porciones para alcanzar tus necesidades calóricas.');
  }
  
  // Protein recommendations
  const proteinDeviation = (daily.protein - targets.protein) / targets.protein;
  if (proteinDeviation < -0.1) {
    recommendations.push('Incluí más fuentes de proteína como carnes magras, huevos, legumbres o lácteos.');
  }
  
  // Fiber recommendations
  if ((daily.fiber || 0) < 20) {
    recommendations.push('Agregá más fibra con verduras, frutas y cereales integrales.');
  }
  
  // Sodium recommendations
  if ((daily.sodium || 0) > 2500) {
    recommendations.push('Reducí el consumo de sal y alimentos procesados. Usá más especias y hierbas para dar sabor.');
  }
  
  // Cultural recommendations
  if (!weeklyPlan.cultural.hasAsado && preferences?.cultural.asadoFrequency !== 'nunca') {
    recommendations.push('Considerá incluir un asado durante el fin de semana para mantener las tradiciones familiares.');
  }
  
  if (!weeklyPlan.cultural.hasMate && preferences?.cultural.mateFrequency === 'diario') {
    recommendations.push('No olvides incluir el mate en tu rutina diaria, especialmente en la merienda.');
  }
  
  // Seasonal recommendations
  const currentMonth = new Date().getMonth();
  if (weeklyPlan.season === 'invierno' && currentMonth >= 5 && currentMonth <= 8) {
    recommendations.push('Aprovechá los vegetales de invierno como zapallo, brócoli y coliflor para sopas y guisos.');
  } else if (weeklyPlan.season === 'verano' && (currentMonth <= 2 || currentMonth >= 11)) {
    recommendations.push('Incluí más ensaladas frescas y frutas de estación como tomates, pepinos y sandía.');
  }
  
  return recommendations;
}

/**
 * Generates achievements based on nutrition analysis
 */
export function generateNutritionAchievements(weeklyPlan: ArgentineWeeklyPlan): string[] {
  const achievements: string[] = [];
  const balance = analyzeNutritionBalance(weeklyPlan);
  
  if (balance.nutritionScore >= 8) {
    achievements.push('¡Excelente balance nutricional! Estás cumpliendo tus objetivos.');
  }
  
  if (balance.varietyScore >= 8) {
    achievements.push('¡Gran variedad en tus comidas! Estás explorando diferentes sabores.');
  }
  
  if (balance.culturalScore >= 8) {
    achievements.push('¡Perfecto! Mantenés las tradiciones culinarias argentinas.');
  }
  
  if (balance.budgetEfficiency >= 8) {
    achievements.push('¡Excelente control del presupuesto! Comés bien sin gastar de más.');
  }
  
  if (weeklyPlan.cultural.hasAsado) {
    achievements.push('¡Domingo de asado! Disfrutás de una tradición argentina clásica.');
  }
  
  if (weeklyPlan.cultural.hasNoquis29) {
    achievements.push('¡Tradición del 29! No te olvidaste de los ñoquis.');
  }
  
  return achievements;
}

/**
 * Generates warnings for nutrition issues
 */
export function generateNutritionWarnings(
  weeklyPlan: ArgentineWeeklyPlan,
  preferences?: UserPreferences
): string[] {
  const { daily } = calculateWeeklyNutrition(weeklyPlan);
  const targets = getTargetsForUser(preferences);
  const warnings: string[] = [];
  
  // Check for severe nutritional imbalances
  if (daily.protein < targets.protein * 0.7) {
    warnings.push('⚠️ Consumo de proteína muy bajo. Consultá con un nutricionista.');
  }
  
  if (daily.calories < targets.calories * 0.8) {
    warnings.push('⚠️ Consumo calórico muy bajo. Podría afectar tu energía y salud.');
  }
  
  if ((daily.sodium || 0) > 3000) {
    warnings.push('⚠️ Consumo de sodio muy alto. Riesgo para la presión arterial.');
  }
  
  // Check for food allergies
  if (preferences?.dietary.allergies.length) {
    const allergens = preferences.dietary.allergies;
    const allIngredients = weeklyPlan.days
      .flatMap(day => [day.desayuno, day.almuerzo, day.merienda, day.cena])
      .filter(Boolean)
      .flatMap(meal => meal!.recipe.ingredients.map(ing => ing.name.toLowerCase()));
    
    const foundAllergens = allergens.filter(allergen => 
      allIngredients.some(ingredient => ingredient.includes(allergen.toLowerCase()))
    );
    
    if (foundAllergens.length) {
      warnings.push(`⚠️ Posibles alérgenos detectados: ${foundAllergens.join(', ')}`);
    }
  }
  
  return warnings;
}

/**
 * Main function to derive comprehensive nutrition summary
 */
export function deriveNutritionSummary(
  weeklyPlan: ArgentineWeeklyPlan,
  preferences?: UserPreferences
): WeeklyNutritionSummary {
  const { daily, weekly } = calculateWeeklyNutrition(weeklyPlan);
  const balance = analyzeNutritionBalance(weeklyPlan, preferences);
  const recommendations = generateNutritionRecommendations(weeklyPlan, preferences);
  const achievements = generateNutritionAchievements(weeklyPlan);
  const warnings = generateNutritionWarnings(weeklyPlan, preferences);
  
  return {
    daily,
    weekly,
    balance,
    recommendations,
    achievements,
    warnings
  };
}