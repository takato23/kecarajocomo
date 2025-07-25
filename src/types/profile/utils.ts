/**
 * @fileoverview Utility functions for profile operations
 * @module types/profile/utils
 */

import type {
  UserProfile,
  UserPreferences,
  DietaryRestriction,
  Allergy,
  HouseholdMember,
  TasteProfile,
  NutritionalGoals
} from './index';

// ============================================================================
// Dietary Compatibility Checkers
// ============================================================================

/**
 * Check if an ingredient is compatible with dietary restrictions
 */
export function isIngredientCompatible(
  ingredient: string,
  restrictions: DietaryRestriction[]
): { compatible: boolean; reason?: string } {
  const lower = ingredient.toLowerCase();
  
  for (const restriction of restrictions) {
    const check = DIETARY_CHECKS[restriction];
    if (check && !check(lower)) {
      return {
        compatible: false,
        reason: `Not suitable for ${restriction.replace('_', ' ')}`
      };
    }
  }
  
  return { compatible: true };
}

/**
 * Dietary restriction checkers
 */
const DIETARY_CHECKS: Record<DietaryRestriction, (ingredient: string) => boolean> = {
  vegetarian: (ing) => !isMeat(ing) && !isFish(ing),
  vegan: (ing) => !isMeat(ing) && !isFish(ing) && !isDairy(ing) && !isEgg(ing) && !isHoney(ing),
  gluten_free: (ing) => !hasGluten(ing),
  dairy_free: (ing) => !isDairy(ing),
  lactose_free: (ing) => !hasLactose(ing),
  nut_free: (ing) => !hasNuts(ing),
  shellfish_free: (ing) => !hasShellfish(ing),
  egg_free: (ing) => !isEgg(ing),
  soy_free: (ing) => !hasSoy(ing),
  pescatarian: (ing) => !isMeat(ing),
  paleo: (ing) => !hasGrains(ing) && !hasDairy(ing) && !hasLegumes(ing),
  keto: (ing) => !hasHighCarbs(ing),
  low_carb: (ing) => !hasHighCarbs(ing),
  low_sodium: (ing) => !hasHighSodium(ing),
  low_fat: (ing) => !hasHighFat(ing),
  halal: (ing) => !isPork(ing) && !hasAlcohol(ing),
  kosher: (ing) => !isPork(ing) && !hasShellfish(ing) && !hasMixedMeatDairy(ing),
  diabetic: (ing) => !hasHighSugar(ing),
  raw_food: (ing) => isRawCompatible(ing),
  whole30: (ing) => !hasGrains(ing) && !hasDairy(ing) && !hasLegumes(ing) && !hasSugar(ing)
};

// ============================================================================
// Ingredient Type Checkers
// ============================================================================

function isMeat(ingredient: string): boolean {
  const meats = [
    'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'goose',
    'veal', 'mutton', 'bacon', 'ham', 'sausage', 'chorizo',
    'carne', 'pollo', 'cerdo', 'cordero', 'pavo', 'jamón'
  ];
  return meats.some(meat => ingredient.includes(meat));
}

function isFish(ingredient: string): boolean {
  const fish = [
    'fish', 'salmon', 'tuna', 'cod', 'trout', 'bass', 'mackerel',
    'sardine', 'anchovy', 'halibut', 'tilapia', 'catfish',
    'pescado', 'atún', 'salmón', 'merluza', 'trucha'
  ];
  return fish.some(f => ingredient.includes(f));
}

function isDairy(ingredient: string): boolean {
  const dairy = [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'ghee',
    'whey', 'casein', 'lactose', 'queso', 'leche', 'yogur',
    'manteca', 'crema', 'nata'
  ];
  return dairy.some(d => ingredient.includes(d));
}

function isEgg(ingredient: string): boolean {
  const eggs = ['egg', 'huevo', 'albumen', 'yolk', 'meringue'];
  return eggs.some(e => ingredient.includes(e));
}

function isHoney(ingredient: string): boolean {
  return ingredient.includes('honey') || ingredient.includes('miel');
}

function hasGluten(ingredient: string): boolean {
  const gluten = [
    'wheat', 'flour', 'bread', 'pasta', 'barley', 'rye',
    'seitan', 'spelt', 'kamut', 'bulgur', 'couscous',
    'harina', 'pan', 'fideos', 'trigo', 'cebada', 'centeno'
  ];
  return gluten.some(g => ingredient.includes(g));
}

function hasLactose(ingredient: string): boolean {
  const lactose = ['milk', 'cream', 'ice cream', 'leche', 'crema', 'helado'];
  return lactose.some(l => ingredient.includes(l));
}

function hasNuts(ingredient: string): boolean {
  const nuts = [
    'nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio',
    'hazelnut', 'macadamia', 'brazil', 'pine nut',
    'nuez', 'almendra', 'castaña', 'pistacho', 'avellana'
  ];
  return nuts.some(n => ingredient.includes(n));
}

function hasShellfish(ingredient: string): boolean {
  const shellfish = [
    'shrimp', 'crab', 'lobster', 'clam', 'oyster', 'mussel',
    'scallop', 'crawfish', 'prawn',
    'camarón', 'cangrejo', 'langosta', 'almeja', 'ostra', 'mejillón'
  ];
  return shellfish.some(s => ingredient.includes(s));
}

function hasSoy(ingredient: string): boolean {
  const soy = [
    'soy', 'tofu', 'tempeh', 'edamame', 'miso', 'tamari',
    'soja', 'soya'
  ];
  return soy.some(s => ingredient.includes(s));
}

function hasGrains(ingredient: string): boolean {
  const grains = [
    'wheat', 'rice', 'oat', 'corn', 'quinoa', 'barley', 'rye',
    'millet', 'buckwheat', 'amaranth',
    'trigo', 'arroz', 'avena', 'maíz', 'cebada', 'centeno'
  ];
  return grains.some(g => ingredient.includes(g));
}

function hasLegumes(ingredient: string): boolean {
  const legumes = [
    'bean', 'lentil', 'pea', 'chickpea', 'peanut', 'soybean',
    'frijol', 'lenteja', 'garbanzo', 'chícharo', 'cacahuete'
  ];
  return legumes.some(l => ingredient.includes(l));
}

function hasHighCarbs(ingredient: string): boolean {
  const highCarbs = [
    'sugar', 'bread', 'pasta', 'rice', 'potato', 'corn',
    'azúcar', 'pan', 'fideos', 'arroz', 'papa', 'maíz'
  ];
  return highCarbs.some(c => ingredient.includes(c));
}

function hasHighSodium(ingredient: string): boolean {
  const highSodium = [
    'salt', 'soy sauce', 'pickle', 'olives', 'bacon',
    'sal', 'salsa de soja', 'encurtido', 'aceitunas', 'tocino'
  ];
  return highSodium.some(s => ingredient.includes(s));
}

function hasHighFat(ingredient: string): boolean {
  const highFat = [
    'oil', 'butter', 'lard', 'cream', 'cheese', 'avocado',
    'aceite', 'mantequilla', 'manteca', 'crema', 'queso', 'aguacate'
  ];
  return highFat.some(f => ingredient.includes(f));
}

function isPork(ingredient: string): boolean {
  const pork = [
    'pork', 'bacon', 'ham', 'prosciutto', 'pancetta',
    'cerdo', 'tocino', 'jamón'
  ];
  return pork.some(p => ingredient.includes(p));
}

function hasAlcohol(ingredient: string): boolean {
  const alcohol = [
    'wine', 'beer', 'vodka', 'rum', 'whiskey', 'brandy',
    'vino', 'cerveza', 'ron', 'whisky', 'coñac'
  ];
  return alcohol.some(a => ingredient.includes(a));
}

function hasMixedMeatDairy(ingredient: string): boolean {
  // This is simplified - real kosher checking is more complex
  return isMeat(ingredient) && isDairy(ingredient);
}

function hasHighSugar(ingredient: string): boolean {
  const highSugar = [
    'sugar', 'honey', 'syrup', 'candy', 'chocolate',
    'azúcar', 'miel', 'jarabe', 'dulce', 'chocolate'
  ];
  return highSugar.some(s => ingredient.includes(s));
}

function hasSugar(ingredient: string): boolean {
  return hasHighSugar(ingredient);
}

function isRawCompatible(ingredient: string): boolean {
  // Foods that are typically consumed raw
  const rawFoods = [
    'fruit', 'vegetable', 'nut', 'seed', 'salad',
    'fruta', 'vegetal', 'nuez', 'semilla', 'ensalada'
  ];
  return rawFoods.some(r => ingredient.includes(r));
}

// ============================================================================
// Profile Analysis Functions
// ============================================================================

/**
 * Get all dietary restrictions from a household
 */
export function getHouseholdDietaryRestrictions(
  profile: UserProfile
): DietaryRestriction[] {
  const restrictions = new Set(profile.dietaryRestrictions);
  
  profile.householdMembers.forEach(member => {
    member.dietaryRestrictions?.forEach(r => restrictions.add(r));
  });
  
  return Array.from(restrictions);
}

/**
 * Get all allergies from a household
 */
export function getHouseholdAllergies(
  profile: UserProfile
): string[] {
  const allergies = new Set(profile.allergies);
  
  profile.householdMembers.forEach(member => {
    member.allergies?.forEach(a => allergies.add(a));
  });
  
  return Array.from(allergies);
}

/**
 * Calculate daily calorie needs based on household
 */
export function calculateHouseholdCalorieNeeds(
  profile: UserProfile
): number {
  let totalCalories = 0;
  
  // Base calories for main user
  totalCalories += profile.nutritionalGoals.caloriesPerDay || 2000;
  
  // Add calories for household members based on age
  profile.householdMembers.forEach(member => {
    if (member.age) {
      if (member.age < 4) totalCalories += 1200;
      else if (member.age < 9) totalCalories += 1600;
      else if (member.age < 14) totalCalories += 2000;
      else if (member.age < 18) totalCalories += 2400;
      else totalCalories += 2000;
    } else {
      totalCalories += 2000; // Default adult calories
    }
  });
  
  return totalCalories;
}

/**
 * Get cuisine suggestions based on profile
 */
export function getCuisineSuggestions(profile: UserProfile): string[] {
  const suggestions = new Set<string>();
  
  // Add preferred cuisines
  profile.preferredCuisines.forEach(c => suggestions.add(c));
  
  // Add complementary cuisines based on dietary restrictions
  if (profile.dietaryRestrictions.includes('vegetarian') || 
      profile.dietaryRestrictions.includes('vegan')) {
    suggestions.add('Indian');
    suggestions.add('Mediterranean');
    suggestions.add('Thai');
  }
  
  if (profile.dietaryRestrictions.includes('gluten_free')) {
    suggestions.add('Mexican');
    suggestions.add('Japanese');
  }
  
  if (profile.dietaryRestrictions.includes('keto') || 
      profile.dietaryRestrictions.includes('low_carb')) {
    suggestions.add('Greek');
    suggestions.add('Brazilian');
  }
  
  return Array.from(suggestions);
}

/**
 * Determine meal complexity based on skill level and time
 */
export function getMealComplexity(
  skillLevel: UserProfile['cookingSkillLevel'],
  timeAvailable: number
): 'simple' | 'moderate' | 'complex' {
  if (timeAvailable < 20) return 'simple';
  
  switch (skillLevel) {
    case 'beginner':
      return timeAvailable < 45 ? 'simple' : 'moderate';
    case 'intermediate':
      return timeAvailable < 30 ? 'simple' : timeAvailable < 60 ? 'moderate' : 'complex';
    case 'advanced':
    case 'expert':
      return timeAvailable < 20 ? 'simple' : timeAvailable < 45 ? 'moderate' : 'complex';
  }
}

/**
 * Calculate budget per meal
 */
export function calculateBudgetPerMeal(
  profile: UserProfile,
  preferences?: UserPreferences
): number {
  const mealsPerDay = preferences?.mealSchedule ? 
    [
      preferences.mealSchedule.breakfast.enabled,
      preferences.mealSchedule.lunch.enabled,
      preferences.mealSchedule.dinner.enabled
    ].filter(Boolean).length : 3;
    
  const daysInMonth = 30;
  const totalMeals = mealsPerDay * daysInMonth * profile.householdSize;
  
  return profile.monthlyBudget / totalMeals;
}

/**
 * Get ingredient restrictions summary
 */
export function getIngredientRestrictions(profile: UserProfile): string[] {
  const restricted: string[] = [];
  
  // Add ingredients based on dietary restrictions
  profile.dietaryRestrictions.forEach(restriction => {
    switch (restriction) {
      case 'vegetarian':
        restricted.push('meat', 'poultry', 'fish', 'seafood');
        break;
      case 'vegan':
        restricted.push('meat', 'poultry', 'fish', 'seafood', 'dairy', 'eggs', 'honey');
        break;
      case 'gluten_free':
        restricted.push('wheat', 'barley', 'rye', 'gluten');
        break;
      case 'dairy_free':
      case 'lactose_free':
        restricted.push('milk', 'cheese', 'yogurt', 'butter', 'cream');
        break;
      case 'nut_free':
        restricted.push('peanuts', 'tree nuts', 'almonds', 'cashews', 'walnuts');
        break;
      case 'shellfish_free':
        restricted.push('shrimp', 'crab', 'lobster', 'shellfish');
        break;
      case 'egg_free':
        restricted.push('eggs', 'egg whites', 'egg yolks');
        break;
      case 'soy_free':
        restricted.push('soy', 'tofu', 'soy sauce', 'edamame');
        break;
    }
  });
  
  // Add allergies
  restricted.push(...profile.allergies);
  
  // Add disliked ingredients
  restricted.push(...profile.dislikedIngredients);
  
  // Remove duplicates
  return Array.from(new Set(restricted));
}

/**
 * Check if profile needs onboarding
 */
export function needsOnboarding(profile: Partial<UserProfile>): boolean {
  return !profile.cookingSkillLevel ||
         !profile.householdSize ||
         !profile.dietaryRestrictions ||
         profile.preferredCuisines?.length === 0;
}

/**
 * Get profile recommendations
 */
export function getProfileRecommendations(profile: UserProfile): {
  message: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}[] {
  const recommendations = [];
  
  if (!profile.nutritionalGoals.caloriesPerDay) {
    recommendations.push({
      message: 'Set your daily calorie goals for better meal planning',
      action: 'Set nutrition goals',
      priority: 'medium' as const
    });
  }
  
  if (profile.preferredCuisines.length === 0) {
    recommendations.push({
      message: 'Add your favorite cuisines for personalized recipes',
      action: 'Add cuisine preferences',
      priority: 'high' as const
    });
  }
  
  if (!profile.avatarUrl) {
    recommendations.push({
      message: 'Add a profile photo to personalize your account',
      action: 'Upload photo',
      priority: 'low' as const
    });
  }
  
  if (profile.householdMembers.length === 0 && profile.householdSize > 1) {
    recommendations.push({
      message: 'Add household members for better meal planning',
      action: 'Add household members',
      priority: 'medium' as const
    });
  }
  
  return recommendations;
}