// Type adapter to convert between different type systems
import { MealType, MealPlan, MealPlanItem } from '@/types/meal-planning';
import { MealSlot, WeekPlan, MealType as StoreMealType } from './index';

// Map store meal types to enum meal types
export const mealTypeMap: Record<StoreMealType, MealType> = {
  'desayuno': MealType.BREAKFAST,
  'almuerzo': MealType.LUNCH,
  'merienda': MealType.SNACK,
  'cena': MealType.DINNER
};

// Reverse map
export const mealTypeReverseMap: Record<MealType, StoreMealType> = {
  [MealType.BREAKFAST]: 'desayuno',
  [MealType.LUNCH]: 'almuerzo',
  [MealType.SNACK]: 'merienda',
  [MealType.DINNER]: 'cena'
};

// Convert WeekPlan (store) to MealPlan (API)
export function weekPlanToMealPlan(weekPlan: WeekPlan): Partial<MealPlan> {
  return {
    id: weekPlan.id,
    user_id: weekPlan.userId,
    name: `Week of ${weekPlan.startDate}`,
    start_date: weekPlan.startDate,
    end_date: weekPlan.endDate,
    status: 'active' as any,
    items: weekPlan.slots.map(slotToMealPlanItem),
    created_at: weekPlan.createdAt,
    updated_at: weekPlan.updatedAt
  };
}

// Convert MealSlot (store) to MealPlanItem (API)
export function slotToMealPlanItem(slot: MealSlot): MealPlanItem {
  return {
    id: slot.id,
    meal_plan_id: '', // Will be filled by parent
    date: slot.date,
    meal_type: mealTypeMap[slot.mealType],
    recipe_id: slot.recipeId,
    recipe: slot.recipe as any, // Type conversion needed
    servings: slot.servings,
    notes: slot.notes,
    is_completed: slot.isCompleted,
    is_locked: slot.isLocked,
    nutrition: slot.recipe?.nutrition,
    created_at: slot.createdAt,
    updated_at: slot.updatedAt
  };
}

// Convert MealPlanItem (API) to MealSlot (store)
export function mealPlanItemToSlot(item: MealPlanItem, dayOfWeek: number): MealSlot {
  return {
    id: item.id,
    dayOfWeek,
    mealType: mealTypeReverseMap[item.meal_type],
    date: item.date,
    recipeId: item.recipe_id,
    recipe: item.recipe as any, // Type conversion needed
    customMealName: item.custom_meal?.name,
    servings: item.servings,
    isLocked: item.is_locked,
    isCompleted: item.is_completed,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}