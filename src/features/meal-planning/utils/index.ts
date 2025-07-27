// Export all meal planning utilities
export * from './shoppingListGenerator';
export * from './nutritionCalculator';
export * from './recipeMatcher';

// Additional utility functions
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MealType } from '../types';

/**
 * Formats a date for display in Spanish
 */
export function formatDateSpanish(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "EEEE d 'de' MMMM", { locale: es });
}

/**
 * Gets the week date range for display
 */
export function getWeekDateRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`;
}

/**
 * Gets meal type display information
 */
export function getMealTypeInfo(mealType: MealType): {
  label: string;
  icon: string;
  color: string;
  time: string;
} {
  const mealInfo = {
    desayuno: {
      label: 'Desayuno',
      icon: '☕',
      color: 'amber',
      time: '7:00 - 10:00'
    },
    almuerzo: {
      label: 'Almuerzo',
      icon: '🍽️',
      color: 'blue',
      time: '12:00 - 14:00'
    },
    merienda: {
      label: 'Merienda',
      icon: '🍎',
      color: 'green',
      time: '16:00 - 17:00'
    },
    cena: {
      label: 'Cena',
      icon: '🌙',
      color: 'purple',
      time: '19:00 - 21:00'
    }
  };
  
  return mealInfo[mealType];
}

/**
 * Gets day of week name in Spanish
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek];
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isSameDay(dateObj, new Date());
}

/**
 * Gets the date for a specific day of the current week
 */
export function getDateForDayOfWeek(dayOfWeek: number, baseDate: Date = new Date()): Date {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
  return addDays(start, dayOffset);
}

/**
 * Generates a unique slot ID
 */
export function generateSlotId(date: string, mealType: MealType): string {
  return `${date}-${mealType}`;
}

/**
 * Parses a slot ID to extract date and meal type
 */
export function parseSlotId(slotId: string): { date: string; mealType: MealType } | null {
  const parts = slotId.split('-');
  if (parts.length < 4) return null; // Expected format: YYYY-MM-DD-mealType
  
  const date = parts.slice(0, 3).join('-');
  const mealType = parts[3] as MealType;
  
  return { date, mealType };
}

/**
 * Calculates total preparation time for a day
 */
export function calculateDayPrepTime(slots: Array<{ recipe?: { prepTime: number; cookTime: number } }>): number {
  return slots.reduce((total, slot) => {
    if (slot.recipe) {
      return total + slot.recipe.prepTime + slot.recipe.cookTime;
    }
    return total;
  }, 0);
}

/**
 * Formats time in minutes to a readable format
 */
export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} h`;
  }
  
  return `${hours} h ${mins} min`;
}

/**
 * Validates if a week plan is complete
 */
export function isWeekPlanComplete(
  slots: Array<{ recipe?: any }>,
  requiredMealsPerDay: number = 4
): boolean {
  const filledSlots = slots.filter(slot => slot.recipe).length;
  const totalRequiredSlots = 7 * requiredMealsPerDay;
  
  return filledSlots >= totalRequiredSlots;
}

/**
 * Calculates week plan completion percentage
 */
export function calculateCompletionPercentage(
  slots: Array<{ recipe?: any }>,
  requiredMealsPerDay: number = 4
): number {
  const filledSlots = slots.filter(slot => slot.recipe).length;
  const totalRequiredSlots = 7 * requiredMealsPerDay;
  
  return Math.round((filledSlots / totalRequiredSlots) * 100);
}