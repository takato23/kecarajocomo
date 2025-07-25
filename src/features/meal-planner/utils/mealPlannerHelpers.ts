import { Recipe, PlannedMeal, MealType, NutritionalInfo } from '../types';

/**
 * Calculate total nutrition for a list of meals
 */
export const calculateTotalNutrition = (meals: PlannedMeal[]): NutritionalInfo => {
  const totals: NutritionalInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  meals.forEach((meal) => {
    if (meal.recipe?.nutritionalInfo) {
      const nutrition = meal.recipe.nutritionalInfo;
      const servingMultiplier = meal.servings / (meal.recipe.servings || 1);

      Object.keys(totals).forEach((key) => {
        const nutrientKey = key as keyof NutritionalInfo;
        if (nutrition[nutrientKey] !== undefined) {
          totals[nutrientKey]! += nutrition[nutrientKey]! * servingMultiplier;
        }
      });
    }
  });

  return totals;
};

/**
 * Get meal type configuration
 */
export const getMealTypeConfig = (mealType: MealType) => {
  const configs = {
    breakfast: { 
      icon: '🌅', 
      label: 'Desayuno',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      timeRange: '6:00 - 10:00'
    },
    lunch: { 
      icon: '☀️', 
      label: 'Almuerzo',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      timeRange: '12:00 - 14:00'
    },
    dinner: { 
      icon: '🌙', 
      label: 'Cena',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      timeRange: '19:00 - 21:00'
    },
    snack: { 
      icon: '🍿', 
      label: 'Snack',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      timeRange: 'Cualquier hora'
    },
    dessert: { 
      icon: '🍰', 
      label: 'Postre',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      timeRange: 'Después de las comidas'
    },
  };

  return configs[mealType];
};

/**
 * Format cooking time for display
 */
export const formatCookingTime = (prepTime?: number, cookTime?: number): string => {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  
  if (totalTime < 60) {
    return `${totalTime}m`;
  }
  
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

/**
 * Get week dates starting from a given date
 */
export const getWeekDates = (startDate: Date): Date[] => {
  const dates = [];
  const date = new Date(startDate);
  
  // Set to start of week (Sunday)
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return dates;
};

/**
 * Format date for meal plan display
 */
export const formatMealPlanDate = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  
  return new Intl.DateTimeFormat('es-ES', { 
    weekday: 'long', 
    day: 'numeric',
    month: 'short'
  }).format(date);
};

/**
 * Calculate macro percentages from nutritional info
 */
export const calculateMacroPercentages = (nutrition: NutritionalInfo) => {
  const totalCalories = nutrition.calories || 0;
  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  const proteinCalories = (nutrition.protein || 0) * 4;
  const carbCalories = (nutrition.carbs || 0) * 4;
  const fatCalories = (nutrition.fat || 0) * 9;

  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    carbs: Math.round((carbCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100),
  };
};

/**
 * Check if a recipe matches dietary restrictions
 */
export const matchesDietaryRestrictions = (
  recipe: Recipe, 
  restrictions: string[]
): boolean => {
  if (restrictions.length === 0) return true;
  
  // This is a simplified check - in a real app, you'd have more sophisticated logic
  const recipeTags = recipe.tags || [];
  
  return restrictions.every((restriction) => {
    const lowerRestriction = restriction.toLowerCase();
    
    // Check if any tag matches the restriction
    return recipeTags.some((tag) => 
      tag.toLowerCase().includes(lowerRestriction)
    );
  });
};

/**
 * Generate a unique meal ID
 */
export const generateMealId = (): string => {
  return `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a unique recipe ID
 */
export const generateRecipeId = (): string => {
  return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};