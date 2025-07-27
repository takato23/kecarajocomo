/**
 * Date utilities for Argentine meal planning
 * Handles timezone, seasons, special dates, and cultural calendar
 */

import { SeasonType, RegionType } from '@/types/meal-planning/argentine';

// ============================================================================
// TIMEZONE AND DATE NORMALIZATION
// ============================================================================

/**
 * Normalizes date to Argentine timezone (UTC-3)
 */
export function normalizeDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Convert to Argentine timezone (UTC-3)
  const argentinaTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  
  return argentinaTime.toISOString().split('T')[0];
}

/**
 * Gets current date in Argentine timezone
 */
export function getCurrentDateInArgentina(): string {
  return normalizeDate(new Date());
}

/**
 * Checks if a date is a Sunday (important for asado tradition)
 */
export function isSunday(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.getDay() === 0;
}

/**
 * Checks if a date is the 29th of the month (ñoquis tradition)
 */
export function isTwentyNinth(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.getDate() === 29;
}

/**
 * Gets the start of the week (Monday) for Argentine calendar
 */
export function getWeekStart(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const dayOfWeek = date.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start of week
  
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysToSubtract);
  
  return normalizeDate(weekStart);
}

/**
 * Gets the end of the week (Sunday) for Argentine calendar
 */
export function getWeekEnd(dateInput: string | Date): string {
  const weekStart = getWeekStart(dateInput);
  const weekStartDate = new Date(weekStart);
  weekStartDate.setDate(weekStartDate.getDate() + 6);
  
  return normalizeDate(weekStartDate);
}

/**
 * Gets week number of the year (for asado frequency calculations)
 */
export function getWeekNumber(dateInput: string | Date): number {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  
  return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
}

// ============================================================================
// SEASONAL CALCULATIONS
// ============================================================================

/**
 * Determines current season based on date (Southern Hemisphere)
 */
export function getSeasonFromDate(dateInput?: string | Date): SeasonType {
  const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  const month = date.getMonth() + 1; // 1-12
  
  // Southern Hemisphere seasons
  if (month === 12 || month <= 2) return 'verano'; // Summer: Dec, Jan, Feb
  if (month >= 3 && month <= 5) return 'otono';    // Autumn: Mar, Apr, May
  if (month >= 6 && month <= 8) return 'invierno'; // Winter: Jun, Jul, Aug
  return 'primavera';                               // Spring: Sep, Oct, Nov
}

/**
 * Checks if it's grilling/asado season (warmer months)
 */
export function isAsadoSeason(dateInput?: string | Date): boolean {
  const season = getSeasonFromDate(dateInput);
  return season === 'verano' || season === 'primavera';
}

/**
 * Checks if it's soup/stew season (colder months)
 */
export function isStewSeason(dateInput?: string | Date): boolean {
  const season = getSeasonFromDate(dateInput);
  return season === 'invierno' || season === 'otono';
}

/**
 * Gets seasonal ingredients for Argentina
 */
export function getSeasonalIngredients(season: SeasonType, region: RegionType): string[] {
  const seasonalMap: Record<SeasonType, Record<RegionType, string[]>> = {
    verano: {
      pampa: ['tomate', 'pepino', 'lechuga', 'sandía', 'melón', 'durazno', 'ciruela'],
      patagonia: ['cordero', 'trucha', 'frambuesa', 'mora', 'cereza'],
      norte: ['palta', 'mango', 'quinoa', 'maíz', 'zapallo'],
      cuyo: ['uva', 'higo', 'damasco', 'nuez', 'oliva'],
      centro: ['soja', 'maní', 'batata', 'zapallo', 'acelga'],
      litoral: ['yuca', 'mandarina', 'pomelo', 'surubí', 'dorado']
    },
    otono: {
      pampa: ['papa', 'zanahoria', 'calabaza', 'manzana', 'pera', 'membrillo'],
      patagonia: ['centolla', 'mejillón', 'manzana', 'pera', 'nuez'],
      norte: ['quinoa', 'papa andina', 'llama', 'vicuña', 'cacao'],
      cuyo: ['uva', 'nuez', 'oliva', 'ajo', 'cebolla'],
      centro: ['maní', 'soja', 'girasol', 'maíz', 'sorgo'],
      litoral: ['naranja', 'limón', 'yerba mate', 'té', 'mandioca']
    },
    invierno: {
      pampa: ['carne', 'pollo', 'cerdo', 'repollo', 'zapallo', 'cebolla'],
      patagonia: ['cordero', 'salmón', 'merluza', 'cebolla', 'ajo'],
      norte: ['llama', 'quinoa', 'papa', 'maíz', 'ají'],
      cuyo: ['cabrito', 'liebre', 'oliva', 'nuez', 'ajo'],
      centro: ['carne', 'pollo', 'cerdo', 'trigo', 'avena'],
      litoral: ['pescado de río', 'mandioca', 'batata', 'naranja']
    },
    primavera: {
      pampa: ['cordero', 'espárragos', 'arvejas', 'habas', 'frutilla'],
      patagonia: ['cordero patagónico', 'calafate', 'rosa mosqueta', 'trucha'],
      norte: ['cabrito', 'quinoa', 'papa nueva', 'habas', 'arvejas'],
      cuyo: ['cabrito', 'espárragos', 'alcaucil', 'uva temprana'],
      centro: ['pollo', 'huevos', 'espinaca', 'rúcula', 'rabanito'],
      litoral: ['pescado de río', 'espinaca', 'acelga', 'rúcula']
    }
  };
  
  return seasonalMap[season][region] || [];
}

// ============================================================================
// SPECIAL DATES AND HOLIDAYS
// ============================================================================

/**
 * Checks if a date is a major Argentine holiday
 */
export function isArgentineHoliday(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Fixed holidays
  const fixedHolidays = [
    [1, 1],   // New Year
    [5, 1],   // Labor Day
    [5, 25],  // May Revolution
    [6, 20],  // Flag Day
    [7, 9],   // Independence Day
    [8, 17],  // San Martín Day
    [12, 8],  // Immaculate Conception
    [12, 25]  // Christmas
  ];
  
  return fixedHolidays.some(([m, d]) => month === m && day === d);
}

/**
 * Gets special meal recommendations for holidays
 */
export function getHolidayMealRecommendations(dateInput: string | Date): string[] {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const holidayMeals: Record<string, string[]> = {
    '1-1': ['Vitel toné', 'Ensalada rusa', 'Pan dulce'], // New Year
    '5-25': ['Locro', 'Empanadas', 'Pastelitos'], // May Revolution
    '7-9': ['Locro', 'Empanadas', 'Choripán'], // Independence Day
    '12-25': ['Vitel toné', 'Pionono', 'Pan dulce', 'Budín de pan'] // Christmas
  };
  
  const key = `${month}-${day}`;
  return holidayMeals[key] || [];
}

/**
 * Checks if it's a typical asado day (weekends, holidays)
 */
export function isAsadoDay(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const dayOfWeek = date.getDay();
  
  // Weekends or holidays
  return dayOfWeek === 0 || dayOfWeek === 6 || isArgentineHoliday(date);
}

/**
 * Checks if it's mate time (afternoon)
 */
export function isMateTime(hour?: number): boolean {
  const currentHour = hour ?? new Date().getHours();
  // Traditional mate time: 3 PM to 7 PM
  return currentHour >= 15 && currentHour <= 19;
}

// ============================================================================
// REGIONAL TIME ZONES
// ============================================================================

/**
 * Gets the appropriate region based on timezone (rough approximation)
 */
export function getRegionFromTimezone(): RegionType {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common Argentine timezones to regions
    const timezoneToRegion: Record<string, RegionType> = {
      'America/Argentina/Buenos_Aires': 'pampa',
      'America/Argentina/Cordoba': 'centro',
      'America/Argentina/Mendoza': 'cuyo',
      'America/Argentina/Salta': 'norte',
      'America/Argentina/Ushuaia': 'patagonia',
      'America/Argentina/La_Rioja': 'cuyo',
      'America/Argentina/San_Juan': 'cuyo',
      'America/Argentina/Catamarca': 'norte',
      'America/Argentina/Tucuman': 'norte',
      'America/Argentina/Jujuy': 'norte'
    };
    
    return timezoneToRegion[timezone] || 'pampa'; // Default to pampa
  } catch {
    return 'pampa'; // Fallback
  }
}

// ============================================================================
// DATE FORMATTING FOR ARGENTINA
// ============================================================================

/**
 * Formats date in Argentine format (DD/MM/YYYY)
 */
export function formatArgentineDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('es-AR');
}

/**
 * Formats time in Argentine format (24-hour)
 */
export function formatArgentineTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/**
 * Gets day name in Spanish
 */
export function getDayNameInSpanish(dayOfWeek: number): string {
  const dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 
    'Jueves', 'Viernes', 'Sábado'
  ];
  return dayNames[dayOfWeek] || 'Desconocido';
}

/**
 * Gets month name in Spanish
 */
export function getMonthNameInSpanish(month: number): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return monthNames[month] || 'Desconocido';
}

// ============================================================================
// MEAL TIMING UTILITIES
// ============================================================================

/**
 * Gets typical meal times for Argentina
 */
export function getTypicalMealTimes() {
  return {
    desayuno: { start: '07:00', end: '10:00' },
    almuerzo: { start: '12:00', end: '14:30' },
    merienda: { start: '16:00', end: '18:00' },
    cena: { start: '20:00', end: '22:30' }
  };
}

/**
 * Determines which meal it is based on current time
 */
export function getCurrentMealType(hour?: number): 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | null {
  const currentHour = hour ?? new Date().getHours();
  
  if (currentHour >= 7 && currentHour < 11) return 'desayuno';
  if (currentHour >= 12 && currentHour < 15) return 'almuerzo';
  if (currentHour >= 16 && currentHour < 19) return 'merienda';
  if (currentHour >= 20 && currentHour < 23) return 'cena';
  
  return null; // Outside typical meal times
}

/**
 * Checks if it's an appropriate time for a specific meal
 */
export function isAppropriateTimeForMeal(mealType: string, hour?: number): boolean {
  const currentHour = hour ?? new Date().getHours();
  const mealTimes = getTypicalMealTimes();
  
  if (!(mealType in mealTimes)) return false;
  
  const { start, end } = mealTimes[mealType as keyof typeof mealTimes];
  const startHour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);
  
  return currentHour >= startHour && currentHour <= endHour;
}

// ============================================================================
// DATE CALCULATIONS FOR PLANNING
// ============================================================================

/**
 * Gets dates for the entire week starting from a given date
 */
export function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(normalizeDate(date));
  }
  
  return dates;
}

/**
 * Gets the next occurrence of a specific day of the week
 */
export function getNextDayOfWeek(targetDay: number, fromDate?: string | Date): string {
  const from = fromDate ? (typeof fromDate === 'string' ? new Date(fromDate) : fromDate) : new Date();
  const currentDay = from.getDay();
  
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Next week
  }
  
  const targetDate = new Date(from);
  targetDate.setDate(from.getDate() + daysToAdd);
  
  return normalizeDate(targetDate);
}

/**
 * Calculates days until next asado (next Sunday)
 */
export function getDaysUntilNextAsado(fromDate?: string | Date): number {
  const from = fromDate ? (typeof fromDate === 'string' ? new Date(fromDate) : fromDate) : new Date();
  const currentDay = from.getDay();
  
  // Days until Sunday (0)
  return currentDay === 0 ? 7 : 7 - currentDay;
}

/**
 * Checks if date falls within the current week
 */
export function isDateInCurrentWeek(dateInput: string | Date, referenceDate?: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const reference = referenceDate ? 
    (typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate) : 
    new Date();
  
  const weekStart = getWeekStart(reference);
  const weekEnd = getWeekEnd(reference);
  const dateStr = normalizeDate(date);
  
  return dateStr >= weekStart && dateStr <= weekEnd;
}

export default {
  normalizeDate,
  getCurrentDateInArgentina,
  isSunday,
  isTwentyNinth,
  getWeekStart,
  getWeekEnd,
  getSeasonFromDate,
  isAsadoSeason,
  isStewSeason,
  getSeasonalIngredients,
  isArgentineHoliday,
  getHolidayMealRecommendations,
  isAsadoDay,
  isMateTime,
  getRegionFromTimezone,
  formatArgentineDate,
  formatArgentineTime,
  getDayNameInSpanish,
  getMonthNameInSpanish,
  getTypicalMealTimes,
  getCurrentMealType,
  isAppropriateTimeForMeal,
  getWeekDates,
  getNextDayOfWeek,
  getDaysUntilNextAsado,
  isDateInCurrentWeek
};