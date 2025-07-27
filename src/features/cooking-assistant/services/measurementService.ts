import { MeasurementConversion } from '../types';
import { logger } from '@/services/logger';

// Conversion factors to grams/milliliters
const VOLUME_CONVERSIONS = {
  // Metric
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  
  // US Imperial
  'tsp': 4.92892,
  'teaspoon': 4.92892,
  'teaspoons': 4.92892,
  'tbsp': 14.7868,
  'tablespoon': 14.7868,
  'tablespoons': 14.7868,
  'fl oz': 29.5735,
  'fluid ounce': 29.5735,
  'fluid ounces': 29.5735,
  'cup': 236.588,
  'cups': 236.588,
  'pint': 473.176,
  'pints': 473.176,
  'quart': 946.353,
  'quarts': 946.353,
  'gallon': 3785.41,
  'gallons': 3785.41,
  
  // UK Imperial
  'uk tsp': 5.91939,
  'uk tbsp': 17.7582,
  'uk fl oz': 28.4131,
  'uk cup': 284.131,
  'uk pint': 568.261,
  'uk quart': 1136.52,
  'uk gallon': 4546.09,
};

const WEIGHT_CONVERSIONS = {
  // Metric
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  
  // US/UK Imperial
  'oz': 28.3495,
  'ounce': 28.3495,
  'ounces': 28.3495,
  'lb': 453.592,
  'lbs': 453.592,
  'pound': 453.592,
  'pounds': 453.592,
  'stone': 6350.29,
  'stones': 6350.29,
};

const TEMPERATURE_CONVERSIONS = {
  'celsius': (temp: number) => temp,
  'fahrenheit': (temp: number) => (temp - 32) * 5/9,
  'kelvin': (temp: number) => temp - 273.15,
};

// Common ingredient density approximations (grams per ml)
const INGREDIENT_DENSITIES = {
  'flour': 0.593,
  'sugar': 0.845,
  'brown sugar': 0.901,
  'butter': 0.911,
  'oil': 0.92,
  'honey': 1.36,
  'salt': 1.217,
  'baking powder': 0.9,
  'baking soda': 2.2,
  'cocoa powder': 0.59,
  'powdered sugar': 0.56,
  'rice': 0.75,
  'oats': 0.41,
  'milk': 1.03,
  'water': 1.0,
  'vanilla extract': 0.879,
  'yeast': 0.8,
  'cornstarch': 0.61,
  'breadcrumbs': 0.24,
  'coconut oil': 0.92,
  'cream cheese': 1.04,
  'sour cream': 0.96,
  'yogurt': 1.04,
  'maple syrup': 1.37,
  'molasses': 1.4,
  'peanut butter': 0.94,
  'jam': 1.33,
  'ketchup': 1.05,
  'mayonnaise': 0.91,
  'mustard': 0.99,
  'vinegar': 1.01,
  'lemon juice': 1.02,
  'lime juice': 1.02,
  'orange juice': 1.05,
  'wine': 0.99,
  'beer': 1.01,
  'broth': 1.01,
  'stock': 1.01,
  'tomato sauce': 1.04,
  'tomato paste': 1.1,
  'coconut milk': 0.97,
  'almond milk': 1.02,
  'soy milk': 1.03,
  'heavy cream': 0.99,
  'light cream': 1.01,
  'half and half': 1.02,
  'whole milk': 1.03,
  'skim milk': 1.04,
  'buttermilk': 1.03,
  'egg': 1.03,
  'egg white': 1.03,
  'egg yolk': 0.95,
  'parmesan cheese': 0.38,
  'cheddar cheese': 0.92,
  'mozzarella cheese': 0.98,
  'feta cheese': 1.03,
  'ricotta cheese': 1.04,
  'cottage cheese': 1.02,
  'nuts': 0.55,
  'almonds': 0.59,
  'walnuts': 0.52,
  'pecans': 0.69,
  'cashews': 0.59,
  'peanuts': 0.56,
  'pine nuts': 0.68,
  'sunflower seeds': 0.54,
  'sesame seeds': 0.57,
  'pumpkin seeds': 0.56,
  'raisins': 0.67,
  'dried cranberries': 0.63,
  'dates': 0.8,
  'coconut flakes': 0.35,
  'coconut shredded': 0.31,
  'chocolate chips': 0.86,
  'marshmallows': 0.16,
  'cornmeal': 0.7,
  'quinoa': 0.85,
  'couscous': 0.72,
  'bulgur': 0.68,
  'barley': 0.69,
  'lentils': 0.85,
  'chickpeas': 0.76,
  'black beans': 0.77,
  'kidney beans': 0.78,
  'white beans': 0.75,
  'pasta': 0.68,
  'rice': 0.75,
  'wild rice': 0.77,
  'brown rice': 0.74,
  'white rice': 0.75,
  'arborio rice': 0.78,
  'jasmine rice': 0.76,
  'basmati rice': 0.74,
  'sushi rice': 0.77,
  'millet': 0.73,
  'buckwheat': 0.69,
  'amaranth': 0.74,
  'chia seeds': 0.6,
  'flax seeds': 0.53,
  'hemp seeds': 0.64,
  'poppy seeds': 0.53,
  'caraway seeds': 0.64,
  'cumin seeds': 0.63,
  'coriander seeds': 0.63,
  'fennel seeds': 0.56,
  'mustard seeds': 0.71,
  'sesame oil': 0.92,
  'olive oil': 0.915,
  'coconut oil': 0.92,
  'avocado oil': 0.916,
  'vegetable oil': 0.92,
  'canola oil': 0.915,
  'sunflower oil': 0.92,
  'grapeseed oil': 0.923,
  'ghee': 0.911,
  'lard': 0.919,
  'shortening': 0.9,
  'margarine': 0.91,
  'cream': 0.99,
  'whipped cream': 0.35,
  'condensed milk': 1.28,
  'evaporated milk': 1.04,
  'powdered milk': 0.45,
  'ice cream': 0.54,
  'sorbet': 0.9,
  'gelato': 0.88,
  'frozen yogurt': 0.96,
  'custard': 1.02,
  'pudding': 1.04,
  'jello': 1.01,
  'apple juice': 1.04,
  'grape juice': 1.05,
  'cranberry juice': 1.04,
  'pineapple juice': 1.05,
  'grapefruit juice': 1.04,
  'tomato juice': 1.04,
  'vegetable juice': 1.04,
  'carrot juice': 1.04,
  'beet juice': 1.05,
  'celery juice': 1.01,
  'cucumber juice': 1.01,
  'spinach juice': 1.01,
  'kale juice': 1.01,
  'wheat grass juice': 1.01,
  'coconut water': 1.01,
  'sports drink': 1.04,
  'energy drink': 1.05,
  'soda': 1.04,
  'cola': 1.04,
  'ginger ale': 1.03,
  'lemonade': 1.04,
  'iced tea': 1.01,
  'coffee': 1.01,
  'tea': 1.01,
  'hot chocolate': 1.02,
  'smoothie': 1.1,
  'protein shake': 1.05,
  'milkshake': 1.08,
  'juice box': 1.04,
  'fruit punch': 1.04,
  'sangria': 1.01,
  'cocktail': 1.01,
  'liqueur': 1.1,
  'spirits': 0.94,
  'whiskey': 0.94,
  'vodka': 0.94,
  'rum': 0.94,
  'gin': 0.94,
  'tequila': 0.94,
  'brandy': 0.94,
  'cognac': 0.94,
  'sherry': 1.01,
  'port wine': 1.04,
  'champagne': 0.99,
  'prosecco': 0.99,
  'sparkling wine': 0.99,
  'white wine': 0.99,
  'red wine': 0.99,
  'rosé wine': 0.99,
  'dessert wine': 1.05,
  'cooking wine': 0.99,
  'sake': 0.99,
  'mirin': 1.01,
  'rice wine': 0.99,
  'vermouth': 1.01,
  'aperitif': 1.01,
  'digestif': 1.01,
  'bitters': 0.95,
  'extract': 0.88,
  'food coloring': 1.01,
  'gelatin': 1.27,
  'agar': 1.3,
  'pectin': 1.5,
  'xanthan gum': 1.6,
  'guar gum': 1.5,
  'arrowroot': 0.67,
  'tapioca starch': 0.67,
  'potato starch': 0.67,
  'corn starch': 0.61,
  'wheat starch': 0.67,
  'rice starch': 0.67,
  'cassava starch': 0.67,
  'sweet potato starch': 0.67,
  'plantain starch': 0.67,
  'banana starch': 0.67,
  'coconut starch': 0.67,
  'almond starch': 0.67,
  'hazelnut starch': 0.67,
  'chestnut starch': 0.67,
  'acorn starch': 0.67,
  'buckwheat starch': 0.67,
  'quinoa starch': 0.67,
  'amaranth starch': 0.67,
  'millet starch': 0.67,
  'sorghum starch': 0.67,
  'teff starch': 0.67,
  'fonio starch': 0.67,
  'wild rice starch': 0.67,
  'black rice starch': 0.67,
  'red rice starch': 0.67,
  'purple rice starch': 0.67,
  'glutinous rice starch': 0.67,
  'sticky rice starch': 0.67,
  'sushi rice starch': 0.67,
  'basmati rice starch': 0.67,
  'jasmine rice starch': 0.67,
  'arborio rice starch': 0.67,
  'carnaroli rice starch': 0.67,
  'bomba rice starch': 0.67,
  'calrose rice starch': 0.67,
  'koshihikari rice starch': 0.67,
  'forbidden rice starch': 0.67,
  'bhutanese rice starch': 0.67,
  'thai rice starch': 0.67,
  'cambodian rice starch': 0.67,
  'vietnamese rice starch': 0.67,
  'laotian rice starch': 0.67,
  'burmese rice starch': 0.67,
  'indian rice starch': 0.67,
  'pakistani rice starch': 0.67,
  'bangladeshi rice starch': 0.67,
  'sri lankan rice starch': 0.67,
  'nepalese rice starch': 0.67,
  'bhutanese rice starch': 0.67,
  'tibetan rice starch': 0.67,
  'mongolian rice starch': 0.67,
  'chinese rice starch': 0.67,
  'japanese rice starch': 0.67,
  'korean rice starch': 0.67,
  'filipino rice starch': 0.67,
  'indonesian rice starch': 0.67,
  'malaysian rice starch': 0.67,
  'singaporean rice starch': 0.67,
  'thai rice starch': 0.67,
  'vietnamese rice starch': 0.67,
  'cambodian rice starch': 0.67,
  'laotian rice starch': 0.67,
  'burmese rice starch': 0.67,
  'default': 1.0 // Default density for unknown ingredients
};

export class MeasurementService {
  private conversionCache: Map<string, MeasurementConversion> = new Map();

  convertMeasurement(
    amount: number,
    fromUnit: string,
    toUnit: string,
    ingredient?: string
  ): MeasurementConversion {
    const cacheKey = `${amount}-${fromUnit}-${toUnit}-${ingredient || 'default'}`;
    
    if (this.conversionCache.has(cacheKey)) {
      return this.conversionCache.get(cacheKey)!;
    }

    const conversion = this.performConversion(amount, fromUnit, toUnit, ingredient);
    this.conversionCache.set(cacheKey, conversion);
    
    return conversion;
  }

  private performConversion(
    amount: number,
    fromUnit: string,
    toUnit: string,
    ingredient?: string
  ): MeasurementConversion {
    const normalizedFromUnit = this.normalizeUnit(fromUnit);
    const normalizedToUnit = this.normalizeUnit(toUnit);

    // If units are the same, no conversion needed
    if (normalizedFromUnit === normalizedToUnit) {
      return {
        from_amount: amount,
        from_unit: fromUnit,
        to_unit: toUnit,
        converted_amount: amount,
        conversion_factor: 1
      };
    }

    let convertedAmount: number;
    let conversionFactor: number;

    // Check if both units are volume units
    if (VOLUME_CONVERSIONS[normalizedFromUnit] && VOLUME_CONVERSIONS[normalizedToUnit]) {
      conversionFactor = VOLUME_CONVERSIONS[normalizedFromUnit] / VOLUME_CONVERSIONS[normalizedToUnit];
      convertedAmount = amount * conversionFactor;
    }
    // Check if both units are weight units
    else if (WEIGHT_CONVERSIONS[normalizedFromUnit] && WEIGHT_CONVERSIONS[normalizedToUnit]) {
      conversionFactor = WEIGHT_CONVERSIONS[normalizedFromUnit] / WEIGHT_CONVERSIONS[normalizedToUnit];
      convertedAmount = amount * conversionFactor;
    }
    // Convert between volume and weight using ingredient density
    else if (VOLUME_CONVERSIONS[normalizedFromUnit] && WEIGHT_CONVERSIONS[normalizedToUnit]) {
      const density = this.getIngredientDensity(ingredient);
      const volumeInMl = amount * VOLUME_CONVERSIONS[normalizedFromUnit];
      const weightInGrams = volumeInMl * density;
      conversionFactor = weightInGrams / WEIGHT_CONVERSIONS[normalizedToUnit];
      convertedAmount = weightInGrams / WEIGHT_CONVERSIONS[normalizedToUnit];
    }
    // Convert between weight and volume using ingredient density
    else if (WEIGHT_CONVERSIONS[normalizedFromUnit] && VOLUME_CONVERSIONS[normalizedToUnit]) {
      const density = this.getIngredientDensity(ingredient);
      const weightInGrams = amount * WEIGHT_CONVERSIONS[normalizedFromUnit];
      const volumeInMl = weightInGrams / density;
      conversionFactor = volumeInMl / VOLUME_CONVERSIONS[normalizedToUnit];
      convertedAmount = volumeInMl / VOLUME_CONVERSIONS[normalizedToUnit];
    }
    // Unsupported conversion
    else {
      throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}`);
    }

    return {
      from_amount: amount,
      from_unit: fromUnit,
      to_unit: toUnit,
      converted_amount: Math.round(convertedAmount * 100) / 100,
      conversion_factor: Math.round(conversionFactor * 1000) / 1000
    };
  }

  private normalizeUnit(unit: string): string {
    return unit.toLowerCase().trim();
  }

  private getIngredientDensity(ingredient?: string): number {
    if (!ingredient) return INGREDIENT_DENSITIES['default'];
    
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Direct match first
    if (INGREDIENT_DENSITIES[normalizedIngredient]) {
      return INGREDIENT_DENSITIES[normalizedIngredient];
    }
    
    // Partial match
    for (const [key, density] of Object.entries(INGREDIENT_DENSITIES)) {
      if (normalizedIngredient.includes(key) || key.includes(normalizedIngredient)) {
        return density;
      }
    }
    
    return INGREDIENT_DENSITIES['default'];
  }

  convertTemperature(temperature: number, fromUnit: string, toUnit: string): number {
    const normalizedFromUnit = this.normalizeUnit(fromUnit);
    const normalizedToUnit = this.normalizeUnit(toUnit);

    if (normalizedFromUnit === normalizedToUnit) {
      return temperature;
    }

    // Convert to Celsius first
    let celsius: number;
    if (normalizedFromUnit === 'fahrenheit') {
      celsius = (temperature - 32) * 5/9;
    } else if (normalizedFromUnit === 'kelvin') {
      celsius = temperature - 273.15;
    } else {
      celsius = temperature;
    }

    // Convert from Celsius to target unit
    if (normalizedToUnit === 'fahrenheit') {
      return Math.round((celsius * 9/5 + 32) * 10) / 10;
    } else if (normalizedToUnit === 'kelvin') {
      return Math.round((celsius + 273.15) * 10) / 10;
    } else {
      return Math.round(celsius * 10) / 10;
    }
  }

  scaleRecipe(originalServings: number, targetServings: number, ingredients: any[]): any[] {
    const scaleFactor = targetServings / originalServings;
    
    return ingredients.map(ingredient => ({
      ...ingredient,
      quantity: Math.round(ingredient.quantity * scaleFactor * 100) / 100
    }));
  }

  suggestBetterUnit(amount: number, unit: string, ingredient?: string): string | null {
    const normalizedUnit = this.normalizeUnit(unit);
    
    // Volume suggestions
    if (VOLUME_CONVERSIONS[normalizedUnit]) {
      const amountInMl = amount * VOLUME_CONVERSIONS[normalizedUnit];
      
      if (amountInMl < 5) {
        return 'tsp';
      } else if (amountInMl < 15) {
        return 'tbsp';
      } else if (amountInMl < 250) {
        return 'ml';
      } else if (amountInMl < 1000) {
        return 'cup';
      } else {
        return 'l';
      }
    }
    
    // Weight suggestions
    if (WEIGHT_CONVERSIONS[normalizedUnit]) {
      const amountInGrams = amount * WEIGHT_CONVERSIONS[normalizedUnit];
      
      if (amountInGrams < 1000) {
        return 'g';
      } else {
        return 'kg';
      }
    }
    
    return null;
  }

  getSupportedUnits(): { volume: string[]; weight: string[]; temperature: string[] } {
    return {
      volume: Object.keys(VOLUME_CONVERSIONS),
      weight: Object.keys(WEIGHT_CONVERSIONS),
      temperature: Object.keys(TEMPERATURE_CONVERSIONS)
    };
  }

  isVolumeUnit(unit: string): boolean {
    return !!VOLUME_CONVERSIONS[this.normalizeUnit(unit)];
  }

  isWeightUnit(unit: string): boolean {
    return !!WEIGHT_CONVERSIONS[this.normalizeUnit(unit)];
  }

  isTemperatureUnit(unit: string): boolean {
    return !!TEMPERATURE_CONVERSIONS[this.normalizeUnit(unit)];
  }

  formatAmount(amount: number, unit: string): string {
    // Format fractions for common cooking measurements
    const fractions = {
      0.125: '1/8',
      0.25: '1/4',
      0.33: '1/3',
      0.5: '1/2',
      0.66: '2/3',
      0.75: '3/4'
    };

    const wholePart = Math.floor(amount);
    const decimalPart = amount - wholePart;
    
    // Check if decimal part matches a common fraction
    for (const [decimal, fraction] of Object.entries(fractions)) {
      if (Math.abs(decimalPart - parseFloat(decimal)) < 0.01) {
        if (wholePart === 0) {
          return `${fraction} ${unit}`;
        } else {
          return `${wholePart} ${fraction} ${unit}`;
        }
      }
    }

    // Round to reasonable precision
    const rounded = Math.round(amount * 100) / 100;
    return `${rounded} ${unit}`;
  }

  clearCache(): void {
    this.conversionCache.clear();
  }
}

// Global measurement service instance
let measurementServiceInstance: MeasurementService | null = null;

export const getMeasurementService = (): MeasurementService => {
  if (!measurementServiceInstance) {
    measurementServiceInstance = new MeasurementService();
  }
  return measurementServiceInstance;
};

// Utility functions
export const convertBetweenSystems = (
  amount: number,
  unit: string,
  targetSystem: 'metric' | 'imperial',
  ingredient?: string
): MeasurementConversion | null => {
  const service = getMeasurementService();
  const normalizedUnit = unit.toLowerCase().trim();
  
  try {
    if (targetSystem === 'metric') {
      // Convert to metric equivalents
      if (service.isVolumeUnit(normalizedUnit)) {
        if (amount < 15) return service.convertMeasurement(amount, unit, 'ml', ingredient);
        if (amount < 1000) return service.convertMeasurement(amount, unit, 'ml', ingredient);
        return service.convertMeasurement(amount, unit, 'l', ingredient);
      }
      if (service.isWeightUnit(normalizedUnit)) {
        if (amount < 1000) return service.convertMeasurement(amount, unit, 'g', ingredient);
        return service.convertMeasurement(amount, unit, 'kg', ingredient);
      }
    } else {
      // Convert to imperial equivalents
      if (service.isVolumeUnit(normalizedUnit)) {
        if (amount < 3) return service.convertMeasurement(amount, unit, 'tsp', ingredient);
        if (amount < 16) return service.convertMeasurement(amount, unit, 'tbsp', ingredient);
        if (amount < 32) return service.convertMeasurement(amount, unit, 'fl oz', ingredient);
        if (amount < 128) return service.convertMeasurement(amount, unit, 'cup', ingredient);
        return service.convertMeasurement(amount, unit, 'quart', ingredient);
      }
      if (service.isWeightUnit(normalizedUnit)) {
        if (amount < 16) return service.convertMeasurement(amount, unit, 'oz', ingredient);
        return service.convertMeasurement(amount, unit, 'lb', ingredient);
      }
    }
  } catch (error: unknown) {
    logger.warn('Conversion failed:', 'measurementService', error);
    return null;
  }
  
  return null;
};

export const getCommonConversions = (amount: number, unit: string, ingredient?: string): MeasurementConversion[] => {
  const service = getMeasurementService();
  const conversions: MeasurementConversion[] = [];
  
  const commonUnits = service.isVolumeUnit(unit) 
    ? ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz']
    : ['g', 'kg', 'oz', 'lb'];
  
  for (const targetUnit of commonUnits) {
    if (targetUnit === unit.toLowerCase()) continue;
    
    try {
      const conversion = service.convertMeasurement(amount, unit, targetUnit, ingredient);
      conversions.push(conversion);
    } catch (error: unknown) {
      // Skip failed conversions
    }
  }
  
  return conversions;
};