/**
 * Argentine Date Utilities
 * 
 * Handles timezone-aware date operations for Argentina,
 * including holidays, seasons, and cultural meal timing.
 */

import { logger } from '@/lib/logger';

// Argentina timezone (UTC-3)
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Argentine seasons based on calendar months
export const ARGENTINE_SEASONS = {
  verano: [12, 1, 2], // December, January, February
  otoño: [3, 4, 5],   // March, April, May
  invierno: [6, 7, 8], // June, July, August
  primavera: [9, 10, 11], // September, October, November
} as const;

// Argentine holidays that affect meal planning
export const ARGENTINE_HOLIDAYS = {
  'new-year': { month: 1, day: 1, name: 'Año Nuevo' },
  'carnival-monday': { variable: true, name: 'Lunes de Carnaval' },
  'carnival-tuesday': { variable: true, name: 'Martes de Carnaval' },
  'memorial-day': { month: 3, day: 24, name: 'Día Nacional de la Memoria' },
  'malvinas-day': { month: 4, day: 2, name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  'easter': { variable: true, name: 'Viernes Santo' },
  'labor-day': { month: 5, day: 1, name: 'Día del Trabajador' },
  'revolution-day': { month: 5, day: 25, name: 'Día de la Revolución de Mayo' },
  'flag-day': { month: 6, day: 20, name: 'Día de la Bandera' },
  'independence-day': { month: 7, day: 9, name: 'Día de la Independencia' },
  'san-martin-day': { month: 8, day: 17, name: 'Paso a la Inmortalidad del General José de San Martín' },
  'diversity-day': { month: 10, day: 12, name: 'Día del Respeto a la Diversidad Cultural' },
  'sovereignty-day': { month: 11, day: 20, name: 'Día de la Soberanía Nacional' },
  'immaculate-conception': { month: 12, day: 8, name: 'Inmaculada Concepción de María' },
  'christmas': { month: 12, day: 25, name: 'Navidad' },
} as const;

// Typical Argentine meal times
export const ARGENTINE_MEAL_TIMES = {
  desayuno: { start: 7, end: 10, typical: 8 },
  almuerzo: { start: 12, end: 15, typical: 13 },
  merienda: { start: 16, end: 19, typical: 17 },
  cena: { start: 20, end: 23, typical: 21 },
} as const;

/**
 * Get current date in Argentina timezone
 */
export function getArgentineDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
}

/**
 * Get current season in Argentina
 */
export function getCurrentArgentineSeason(): 'verano' | 'otoño' | 'invierno' | 'primavera' {
  const currentDate = getArgentineDate();
  const month = currentDate.getMonth() + 1; // getMonth() returns 0-11

  for (const [season, months] of Object.entries(ARGENTINE_SEASONS)) {
    if (months.includes(month)) {
      return season as keyof typeof ARGENTINE_SEASONS;
    }
  }

  // Fallback (should never happen)
  return 'primavera';
}

/**
 * Get season for a specific date
 */
export function getSeasonForDate(date: Date): 'verano' | 'otoño' | 'invierno' | 'primavera' {
  const month = date.getMonth() + 1;

  for (const [season, months] of Object.entries(ARGENTINE_SEASONS)) {
    if (months.includes(month)) {
      return season as keyof typeof ARGENTINE_SEASONS;
    }
  }

  return 'primavera';
}

/**
 * Check if a date is a weekend in Argentina (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a major Argentine holiday
 */
export function isArgentineHoliday(date: Date): { isHoliday: boolean; holiday?: string } {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const [key, holiday] of Object.entries(ARGENTINE_HOLIDAYS)) {
    if (!holiday.variable && holiday.month === month && holiday.day === day) {
      return { isHoliday: true, holiday: holiday.name };
    }
  }

  // For variable holidays, we'd need a more complex calculation
  // For now, just return false for variable ones
  return { isHoliday: false };
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().split('T')[0];
}

/**
 * Generate array of dates for a week starting from a given date
 */
export function getWeekDates(startDate: string): Array<{ date: string; dayName: string; isWeekend: boolean }> {
  const start = new Date(startDate);
  const dates = [];

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    dates.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      isWeekend: isWeekend(date),
    });
  }

  return dates;
}

/**
 * Check if it's an appropriate time for a specific meal
 */
export function isAppropriateTimeForMeal(
  mealType: keyof typeof ARGENTINE_MEAL_TIMES,
  time?: Date
): boolean {
  const currentTime = time || getArgentineDate();
  const hour = currentTime.getHours();
  const mealTime = ARGENTINE_MEAL_TIMES[mealType];
  
  return hour >= mealTime.start && hour <= mealTime.end;
}

/**
 * Get next meal time
 */
export function getNextMealTime(currentTime?: Date): {
  mealType: keyof typeof ARGENTINE_MEAL_TIMES;
  timeUntil: number; // minutes
} {
  const now = currentTime || getArgentineDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  const mealSchedule = [
    { type: 'desayuno' as const, time: ARGENTINE_MEAL_TIMES.desayuno.typical * 60 },
    { type: 'almuerzo' as const, time: ARGENTINE_MEAL_TIMES.almuerzo.typical * 60 },
    { type: 'merienda' as const, time: ARGENTINE_MEAL_TIMES.merienda.typical * 60 },
    { type: 'cena' as const, time: ARGENTINE_MEAL_TIMES.cena.typical * 60 },
  ];

  for (const meal of mealSchedule) {
    if (currentMinutes < meal.time) {
      return {
        mealType: meal.type,
        timeUntil: meal.time - currentMinutes,
      };
    }
  }

  // If it's past dinner time, next meal is tomorrow's breakfast
  const tomorrowBreakfast = ARGENTINE_MEAL_TIMES.desayuno.typical * 60 + (24 * 60);
  return {
    mealType: 'desayuno',
    timeUntil: tomorrowBreakfast - currentMinutes,
  };
}

/**
 * Format date for Argentine locale
 */
export function formatArgentineDate(date: Date, format: 'short' | 'long' | 'weekday' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: ARGENTINA_TIMEZONE,
  };

  switch (format) {
    case 'short':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      break;
    case 'long':
      options.weekday = 'long';
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
    case 'weekday':
      options.weekday = 'long';
      break;
  }

  try {
    return date.toLocaleDateString('es-AR', options);
  } catch (error) {
    logger.error('Date formatting error:', 'argentineDateUtils', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Check if it's time for the traditional ñoquis del 29
 */
export function isÑoquiDay(date: Date): boolean {
  return date.getDate() === 29;
}

/**
 * Get traditional Sunday meal recommendation
 */
export function getSundayMealTradition(budget: 'economico' | 'moderado' | 'amplio'): string {
  switch (budget) {
    case 'economico':
      return 'Pastas caseras con tuco o milanesas';
    case 'moderado':
      return 'Asado pequeño o pollo al horno con papas';
    case 'amplio':
      return 'Asado completo con ensaladas';
    default:
      return 'Comida especial dominical';
  }
}

/**
 * Validate week start date format and constraints
 */
export function validateWeekStartDate(weekStart: string): { 
  isValid: boolean; 
  error?: string; 
  normalizedDate?: string 
} {
  try {
    const date = new Date(weekStart);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Fecha inválida' };
    }

    // Check if date is not too far in the past or future
    const now = getArgentineDate();
    const diffDays = Math.abs((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return { isValid: false, error: 'La fecha debe estar dentro del próximo año' };
    }

    // Normalize to Monday (start of week)
    const normalizedDate = getWeekStart(date);
    
    return { 
      isValid: true, 
      normalizedDate 
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Error al procesar la fecha' 
    };
  }
}

/**
 * Get meal planning context for a specific date range
 */
export function getMealPlanningContext(weekStart: string): {
  season: 'verano' | 'otoño' | 'invierno' | 'primavera';
  weekDates: Array<{ date: string; dayName: string; isWeekend: boolean; isHoliday: boolean }>;
  specialDays: Array<{ date: string; type: string; description: string }>;
} {
  const startDate = new Date(weekStart);
  const season = getSeasonForDate(startDate);
  const weekDates = getWeekDates(weekStart);
  const specialDays = [];

  // Check for special days in the week
  for (const dayInfo of weekDates) {
    const date = new Date(dayInfo.date);
    
    // Check for ñoquis day
    if (isÑoquiDay(date)) {
      specialDays.push({
        date: dayInfo.date,
        type: 'tradition',
        description: 'Día de los ñoquis (tradición del 29)',
      });
    }

    // Check for holidays
    const holidayInfo = isArgentineHoliday(date);
    if (holidayInfo.isHoliday) {
      specialDays.push({
        date: dayInfo.date,
        type: 'holiday',
        description: holidayInfo.holiday!,
      });
    }

    // Mark holidays in weekDates
    dayInfo.isHoliday = holidayInfo.isHoliday;
  }

  return {
    season,
    weekDates,
    specialDays,
  };
}

// Export types
export type ArgentineSeason = keyof typeof ARGENTINE_SEASONS;
export type ArgentineMealTime = keyof typeof ARGENTINE_MEAL_TIMES;