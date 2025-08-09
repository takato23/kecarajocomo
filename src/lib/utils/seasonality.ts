/**
 * Seasonal ingredient availability and pricing for Argentina
 */

interface SeasonalData {
  [season: string]: {
    vegetables: string[];
    fruits: string[];
    proteins: string[];
    priceMultiplier: number; // 1.0 = normal, >1.0 = more expensive
  };
}

const SEASONAL_INGREDIENTS: SeasonalData = {
  verano: {
    vegetables: ['tomate', 'pepino', 'lechuga', 'choclo', 'zapallito', 'berenjena', 'pimiento', 'rabanito'],
    fruits: ['durazno', 'ciruela', 'sandía', 'melón', 'uva', 'damasco', 'cereza', 'frutilla'],
    proteins: ['pescado', 'mariscos', 'pollo'],
    priceMultiplier: 0.9, // Summer abundance
  },
  otoño: {
    vegetables: ['zapallo', 'batata', 'acelga', 'espinaca', 'coliflor', 'brócoli', 'puerro', 'cebolla'],
    fruits: ['manzana', 'pera', 'membrillo', 'granada', 'kiwi', 'mandarina', 'pomelo'],
    proteins: ['cerdo', 'cordero', 'conejo'],
    priceMultiplier: 1.0,
  },
  invierno: {
    vegetables: ['papa', 'zanahoria', 'cebolla', 'ajo', 'repollo', 'nabo', 'apio', 'hinojo'],
    fruits: ['naranja', 'mandarina', 'limón', 'pomelo', 'kiwi', 'palta'],
    proteins: ['carne vacuna', 'cerdo', 'guiso', 'estofado'],
    priceMultiplier: 1.1, // Winter scarcity
  },
  primavera: {
    vegetables: ['alcaucil', 'habas', 'arvejas', 'espárrago', 'remolacha', 'radicheta', 'berro'],
    fruits: ['frutilla', 'cereza', 'níspero', 'ananá', 'banana', 'palta'],
    proteins: ['pollo', 'conejo', 'pescado'],
    priceMultiplier: 0.95,
  },
};

// Base prices in ARS per kg/unit (2024 estimates)
const BASE_PRICES: Record<string, number> = {
  // Vegetables (per kg)
  tomate: 800,
  papa: 400,
  cebolla: 500,
  zanahoria: 450,
  lechuga: 600,
  zapallo: 300,
  pimiento: 900,
  berenjena: 700,
  espinaca: 800,
  acelga: 500,
  
  // Fruits (per kg)
  manzana: 700,
  banana: 600,
  naranja: 400,
  mandarina: 500,
  frutilla: 1200,
  pera: 650,
  durazno: 800,
  
  // Proteins (per kg)
  'carne picada': 2500,
  'carne vacuna': 3500,
  pollo: 1800,
  cerdo: 2200,
  pescado: 3000,
  huevos: 1200, // per dozen
  
  // Dairy
  leche: 400, // per liter
  queso: 4000,
  yogur: 600,
  manteca: 1500,
  
  // Pantry
  harina: 300,
  arroz: 600,
  fideos: 500,
  aceite: 800, // per liter
  azúcar: 400,
  sal: 200,
  'yerba mate': 1500,
  
  // Bakery
  pan: 800,
  facturas: 2000, // per dozen
  galletitas: 1000,
  
  // Default
  default: 1000,
};

/**
 * Get seasonal ingredients for a given season
 */
export function getSeasonalIngredients(season: string): string[] {
  const data = SEASONAL_INGREDIENTS[season] || SEASONAL_INGREDIENTS.verano;
  return [...data.vegetables, ...data.fruits];
}

/**
 * Get ingredient price considering season
 */
export function getIngredientPrice(ingredient: string, season: string): number {
  const ingredientLower = ingredient.toLowerCase();
  
  // Find base price
  let basePrice = BASE_PRICES.default;
  for (const [key, price] of Object.entries(BASE_PRICES)) {
    if (ingredientLower.includes(key) || key.includes(ingredientLower)) {
      basePrice = price;
      break;
    }
  }
  
  // Apply seasonal multiplier
  const seasonData = SEASONAL_INGREDIENTS[season] || SEASONAL_INGREDIENTS.verano;
  let multiplier = seasonData.priceMultiplier;
  
  // If ingredient is in season, reduce price
  const allSeasonal = [...seasonData.vegetables, ...seasonData.fruits, ...seasonData.proteins];
  if (allSeasonal.some(s => ingredientLower.includes(s) || s.includes(ingredientLower))) {
    multiplier *= 0.8; // 20% discount for in-season items
  } else {
    multiplier *= 1.2; // 20% premium for out-of-season items
  }
  
  return Math.round(basePrice * multiplier);
}

/**
 * Get all ingredients that are currently cheap
 */
export function getCheapIngredients(season: string, maxPrice: number = 1000): string[] {
  const cheap: string[] = [];
  const seasonData = SEASONAL_INGREDIENTS[season] || SEASONAL_INGREDIENTS.verano;
  const allSeasonal = [...seasonData.vegetables, ...seasonData.fruits];
  
  for (const ingredient of allSeasonal) {
    const price = getIngredientPrice(ingredient, season);
    if (price <= maxPrice) {
      cheap.push(ingredient);
    }
  }
  
  return cheap;
}

/**
 * Calculate total cost of a recipe
 */
export function calculateRecipeCost(
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>,
  season: string
): number {
  let total = 0;
  
  for (const ingredient of ingredients) {
    const pricePerKg = getIngredientPrice(ingredient.name, season);
    const quantity = ingredient.quantity || 1;
    
    // Convert units to kg if needed
    let multiplier = 1;
    if (ingredient.unit) {
      const unit = ingredient.unit.toLowerCase();
      if (unit === 'g' || unit === 'gr') multiplier = 0.001;
      else if (unit === 'ml' || unit === 'cc') multiplier = 0.001;
      else if (unit === 'taza') multiplier = 0.25;
      else if (unit === 'cucharada') multiplier = 0.015;
      else if (unit === 'unidad' || unit === 'u') multiplier = 0.1; // Approximate
    }
    
    total += pricePerKg * quantity * multiplier;
  }
  
  return Math.round(total);
}

/**
 * Get budget-friendly ingredient substitutions
 */
export function getBudgetSubstitutions(ingredient: string, season: string): string[] {
  const substitutions: Record<string, string[]> = {
    'carne vacuna': ['carne picada', 'pollo', 'cerdo'],
    'queso': ['queso cremoso', 'queso fresco'],
    'crema': ['leche', 'yogur natural'],
    'manteca': ['aceite', 'margarina'],
    'pescado': ['pollo', 'atún enlatado'],
    'jamón': ['paleta', 'mortadela'],
    'espinaca': ['acelga', 'radicheta'],
    'frutilla': ['manzana', 'banana'],
    'cherry': ['tomate común'],
    'palta': ['mayonesa', 'hummus'],
  };
  
  const subs = substitutions[ingredient.toLowerCase()] || [];
  
  // Filter by price
  const currentPrice = getIngredientPrice(ingredient, season);
  return subs.filter(sub => getIngredientPrice(sub, season) < currentPrice);
}