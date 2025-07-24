// Spanish Voice Parser for Pantry Items
// Handles natural Spanish language voice input and converts to structured pantry data

import type { ParsedIngredientInput, IngredientCategory } from '@/types/pantry';

// Spanish number words mapping
const SPANISH_NUMBERS: Record<string, number> = {
  'cero': 0,
  'un': 1,
  'uno': 1,
  'una': 1,
  'dos': 2,
  'tres': 3,
  'cuatro': 4,
  'cinco': 5,
  'seis': 6,
  'siete': 7,
  'ocho': 8,
  'nueve': 9,
  'diez': 10,
  'once': 11,
  'doce': 12,
  'docena': 12,
  'trece': 13,
  'catorce': 14,
  'quince': 15,
  'dieciséis': 16,
  'diecisiete': 17,
  'dieciocho': 18,
  'diecinueve': 19,
  'veinte': 20,
  'veintiuno': 21,
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
  'sesenta': 60,
  'setenta': 70,
  'ochenta': 80,
  'noventa': 90,
  'cien': 100,
  'ciento': 100,
  'mil': 1000,
  'medio': 0.5,
  'media': 0.5,
};

// Fractional Spanish numbers
const SPANISH_FRACTIONS: Record<string, number> = {
  'medio': 0.5,
  'media': 0.5,
  'cuarto': 0.25,
  'cuarta': 0.25,
  'tercio': 0.33,
  'tercia': 0.33,
};

// Spanish unit mappings with variations
const SPANISH_UNITS: Record<string, { unit: string; factor?: number }> = {
  // Weight
  'kilo': { unit: 'kg' },
  'kilos': { unit: 'kg' },
  'kilogramo': { unit: 'kg' },
  'kilogramos': { unit: 'kg' },
  'kg': { unit: 'kg' },
  'k': { unit: 'kg' }, // Common abbreviation
  'gramo': { unit: 'g' },
  'gramos': { unit: 'g' },
  'g': { unit: 'g' },
  'gr': { unit: 'g' }, // Common abbreviation
  'libra': { unit: 'lb' },
  'libras': { unit: 'lb' },
  'onza': { unit: 'oz' },
  'onzas': { unit: 'oz' },
  
  // Volume
  'litro': { unit: 'L' },
  'litros': { unit: 'L' },
  'l': { unit: 'L' },
  'mililitro': { unit: 'ml' },
  'mililitros': { unit: 'ml' },
  'ml': { unit: 'ml' },
  'taza': { unit: 'cup' },
  'tazas': { unit: 'cup' },
  'cucharada': { unit: 'tbsp' },
  'cucharadas': { unit: 'tbsp' },
  'cucharadita': { unit: 'tsp' },
  'cucharaditas': { unit: 'tsp' },
  'vaso': { unit: 'cup', factor: 1.05 }, // Slightly more than a cup
  'vasos': { unit: 'cup', factor: 1.05 },
  
  // Count
  'pieza': { unit: 'pcs' },
  'piezas': { unit: 'pcs' },
  'unidad': { unit: 'pcs' },
  'unidades': { unit: 'pcs' },
  'paquete': { unit: 'pack' },
  'paquetes': { unit: 'pack' },
  'bolsa': { unit: 'bag' },
  'bolsas': { unit: 'bag' },
  'lata': { unit: 'can' },
  'latas': { unit: 'can' },
  'frasco': { unit: 'jar' },
  'frascos': { unit: 'jar' },
  'botella': { unit: 'bottle' },
  'botellas': { unit: 'bottle' },
  'caja': { unit: 'box' },
  'cajas': { unit: 'box' },
  'docena': { unit: 'pcs', factor: 12 },
  'docenas': { unit: 'pcs', factor: 12 },
  'manojo': { unit: 'bunch' },
  'manojos': { unit: 'bunch' },
  'atado': { unit: 'bunch' },
  'atados': { unit: 'bunch' },
  'racimo': { unit: 'bunch' },
  'racimos': { unit: 'bunch' },
};

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  verduras: ['lechuga', 'tomate', 'tomates', 'cebolla', 'cebollas', 'papa', 'papas', 'zanahoria', 'zanahorias', 'brócoli', 'brocoli', 'espinaca', 'espinacas', 'apio', 'pimiento', 'pimientos', 'morrón', 'morron', 'morrones', 'calabaza', 'calabazas', 'zapallo', 'zapallos', 'zapallito', 'zapallitos', 'pepino', 'pepinos', 'ajo', 'ajos', 'perejil', 'cilantro', 'albahaca', 'rúcula', 'rucula', 'radicheta', 'acelga', 'acelgas', 'choclo', 'choclos', 'maíz', 'maiz', 'berenjena', 'berenjenas', 'coliflor', 'coliflores', 'repollo', 'repollos', 'puerro', 'puerros', 'verdeo', 'cebolla de verdeo', 'batata', 'batatas', 'mandioca', 'mandiocas', 'rabano', 'rábano', 'rabanos', 'rábanos'],
  frutas: ['manzana', 'manzanas', 'naranja', 'naranjas', 'plátano', 'platano', 'plátanos', 'platanos', 'banana', 'bananas', 'fresa', 'fresas', 'frutilla', 'frutillas', 'uva', 'uvas', 'limón', 'limon', 'limones', 'pera', 'peras', 'durazno', 'duraznos', 'mango', 'mangos', 'piña', 'pina', 'piñas', 'pinas', 'ananá', 'anana', 'ananás', 'ananas', 'sandía', 'sandia', 'sandías', 'sandias', 'melón', 'melon', 'melones', 'aguacate', 'aguacates', 'palta', 'paltas', 'cereza', 'cerezas', 'ciruela', 'ciruelas', 'mandarina', 'mandarinas', 'pomelo', 'pomelos', 'kiwi', 'kiwis', 'arándanos', 'arandanos', 'frambuesa', 'frambuesas', 'mora', 'moras', 'higo', 'higos', 'damasco', 'damascos'],
  carnes: ['pollo', 'carne', 'res', 'vaca', 'cerdo', 'pechuga', 'milanesa', 'milanesas', 'bistec', 'bife', 'chuleta', 'costilla', 'asado', 'vacío', 'matambre', 'picada', 'molida', 'pescado', 'salmón', 'atún', 'merluza', 'pejerrey', 'camarón', 'camarones', 'langostinos', 'mariscos', 'chorizo', 'morcilla', 'bondiola', 'entraña', 'tapa de asado', 'peceto', 'nalga', 'cuadril', 'lomo', 'colita de cuadril'],
  lacteos: ['leche', 'queso', 'yogur', 'yogurt', 'crema', 'manteca', 'mantequilla', 'huevo', 'huevos', 'nata', 'ricota', 'mozzarella', 'muzarela', 'provolone', 'reggianito', 'sardo', 'port salut', 'cremoso', 'dulce de leche', 'crema de leche'],
  granos: ['arroz', 'pasta', 'fideos', 'ñoquis', 'ravioles', 'canelones', 'lasaña', 'quinoa', 'avena', 'porotos', 'lentejas', 'garbanzos', 'maíz', 'trigo', 'cebada', 'polenta', 'sémola', 'harina', 'salvado'],
  condimentos: ['sal', 'pimienta', 'azúcar', 'aceite', 'vinagre', 'mostaza', 'mayonesa', 'ketchup', 'salsa', 'especias', 'orégano', 'comino', 'pimentón', 'paprika', 'ají molido', 'laurel', 'tomillo', 'romero', 'nuez moscada', 'canela', 'vainilla', 'provenzal', 'chimichurri', 'salsa criolla', 'salsa golf'],
  bebidas: ['agua', 'jugo', 'refresco', 'café', 'té', 'mate', 'yerba', 'cerveza', 'vino', 'fernet', 'gaseosa', 'coca', 'sprite', 'fanta', 'pomelo', 'tónica', 'soda', 'leche', 'chocolatada'],
  enlatados: ['atún', 'sardinas', 'caballa', 'porotos', 'lentejas', 'garbanzos', 'maíz', 'choclo', 'durazno', 'ananá', 'tomate', 'salsa', 'sopa', 'palmitos', 'aceitunas', 'pickles', 'pepinos'],
  congelados: ['helado', 'verduras', 'pizza', 'carne', 'pollo', 'pescado', 'papas', 'empanadas', 'medallones', 'hamburguesas', 'patitas', 'nuggets', 'bastones', 'milanesas', 'tartas', 'pascualina'],
  panaderia: ['pan', 'pan francés', 'pan lactal', 'pan de campo', 'pan árabe', 'facturas', 'medialunas', 'criollitos', 'bizcochos', 'galletas', 'galletitas', 'tostadas', 'grisines', 'prepizza', 'tapas de empanadas', 'tapas de tarta', 'pan rallado', 'budín', 'magdalenas'],
  snacks: ['papas', 'frituras', 'palomitas', 'chocolates', 'dulces', 'chicles', 'cacahuates', 'nueces'],
  otros: []
};

// Common Spanish prepositions and articles to filter out
const PREPOSITIONS = ['de', 'del', 'con', 'sin', 'para', 'por', 'en', 'a', 'y', 'o', 'e', 'u', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];

// Parse Spanish number words to numeric values
function parseSpanishNumber(words: string[]): number | null {
  let total = 0;
  let current = 0;
  
  for (const word of words) {
    const num = SPANISH_NUMBERS[word.toLowerCase()];
    const frac = SPANISH_FRACTIONS[word.toLowerCase()];
    
    if (num !== undefined) {
      if (num === 1000) {
        current = current === 0 ? 1000 : current * 1000;
      } else if (num === 100) {
        current = current === 0 ? 100 : current * 100;
      } else if (num < 100 && current > 0) {
        current += num;
      } else {
        current = num;
      }
    } else if (frac !== undefined) {
      return total + current + frac;
    }
  }
  
  total += current;
  return total > 0 ? total : null;
}

// Extract quantity and unit from Spanish text
function extractQuantityAndUnit(text: string): { 
  quantity: number | null; 
  unit: string | null; 
  remainingText: string;
} {
  const words = text.toLowerCase().split(/\s+/);
  let quantity: number | null = null;
  let unit: string | null = null;
  let quantityEndIndex = -1;
  let unitIndex = -1;
  
  // Try to find numeric quantity first
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check for numeric values
    const numericValue = parseFloat(word.replace(',', '.'));
    if (!isNaN(numericValue)) {
      quantity = numericValue;
      quantityEndIndex = i;
      
      // Check if next word is a fraction
      if (i + 1 < words.length && SPANISH_FRACTIONS[words[i + 1]]) {
        quantity += SPANISH_FRACTIONS[words[i + 1]];
        quantityEndIndex = i + 1;
      }
      break;
    }
    
    // Check for Spanish number words
    const spanishNum = parseSpanishNumber(words.slice(i, Math.min(i + 3, words.length)));
    if (spanishNum !== null) {
      quantity = spanishNum;
      // Find where the number ends
      for (let j = i; j < Math.min(i + 3, words.length); j++) {
        if (SPANISH_NUMBERS[words[j]] !== undefined || SPANISH_FRACTIONS[words[j]] !== undefined) {
          quantityEndIndex = j;
        } else {
          break;
        }
      }
      
      // Special handling for "un kilo y medio"
      if (i < words.length - 3 && 
          (words[i] === 'un' || words[i] === 'una') && 
          SPANISH_UNITS[words[i + 1]] &&
          words[i + 2] === 'y' && 
          (words[i + 3] === 'medio' || words[i + 3] === 'media')) {
        const unitInfo = SPANISH_UNITS[words[i + 1]];
        quantity = 1.5;
        unit = unitInfo.unit;
        quantityEndIndex = i + 3;
        unitIndex = i + 3;
        break;
      }
      
      break;
    }
  }
  
  // If no quantity found, check for special cases like "una docena", "medio kilo"
  if (quantity === null) {
    for (let i = 0; i < words.length - 1; i++) {
      // Check for "una docena" pattern
      if ((words[i] === 'una' || words[i] === 'un') && words[i + 1] === 'docena') {
        quantity = 12;
        unit = 'pcs';
        unitIndex = i + 1;
        quantityEndIndex = i + 1;
        // Return immediately to prevent further processing
        const remainingWords = words.slice(i + 2).filter(w => !PREPOSITIONS.includes(w));
        return { quantity, unit, remainingText: remainingWords.join(' ') };
      }
      // Check for "medio/media" + unit (e.g., "medio kilo")
      else if ((words[i] === 'medio' || words[i] === 'media') && SPANISH_UNITS[words[i + 1]]) {
        const unitInfo = SPANISH_UNITS[words[i + 1]];
        quantity = 0.5;
        unit = unitInfo.unit;
        unitIndex = i + 1;
        quantityEndIndex = i + 1;
        break;
      }
      // Check for other unit patterns with factors
      else if ((words[i] === 'una' || words[i] === 'un') && SPANISH_UNITS[words[i + 1]]?.factor) {
        const unitInfo = SPANISH_UNITS[words[i + 1]];
        quantity = unitInfo.factor || 1;
        unit = unitInfo.unit;
        unitIndex = i + 1;
        quantityEndIndex = i + 1;
        break;
      }
    }
  }
  
  // Look for unit after quantity
  if (quantity !== null && unit === null) {
    for (let i = quantityEndIndex + 1; i < Math.min(quantityEndIndex + 3, words.length); i++) {
      // Skip prepositions
      if (PREPOSITIONS.includes(words[i])) continue;
      
      const unitInfo = SPANISH_UNITS[words[i]];
      if (unitInfo) {
        unit = unitInfo.unit;
        if (unitInfo.factor) {
          quantity *= unitInfo.factor;
        }
        unitIndex = i;
        
        // Check for "y medio" after unit (e.g., "kilo y medio")
        if (i + 2 < words.length && words[i + 1] === 'y' && 
            (words[i + 2] === 'medio' || words[i + 2] === 'media')) {
          quantity += 0.5;
          unitIndex = i + 2;
        }
        break;
      }
    }
  }
  
  // Extract remaining text (the ingredient name)
  let remainingWords = [...words];
  if (unitIndex >= 0) {
    remainingWords = remainingWords.slice(unitIndex + 1);
  } else if (quantityEndIndex >= 0) {
    remainingWords = remainingWords.slice(quantityEndIndex + 1);
  }
  
  // Filter out leading prepositions
  while (remainingWords.length > 0 && PREPOSITIONS.includes(remainingWords[0])) {
    remainingWords.shift();
  }
  
  return {
    quantity,
    unit,
    remainingText: remainingWords.join(' ')
  };
}

// Determine category based on ingredient name
function determineCategory(ingredientName: string): IngredientCategory {
  const lowerName = ingredientName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category as IngredientCategory;
    }
  }
  
  return 'otros';
}

// Clean and normalize ingredient name
function normalizeIngredientName(name: string): string {
  // Remove extra spaces and trim
  let normalized = name.trim().replace(/\s+/g, ' ');
  
  // Capitalize first letter of each word
  normalized = normalized.replace(/\b\w/g, l => l.toUpperCase());
  
  return normalized;
}

// Main parser function
export function parseSpanishVoiceInput(transcript: string): ParsedIngredientInput[] {
  const items: ParsedIngredientInput[] = [];
  
  // Normalize transcript first
  let normalizedTranscript = transcript.toLowerCase().trim();
  // Remove common filler words
  normalizedTranscript = normalizedTranscript.replace(/\b(eh|ah|este|bueno|entonces)\b/g, '');
  
  // Special handling for specific patterns before splitting
  // Handle "una docena de X" pattern
  if (normalizedTranscript.includes('una docena de') || normalizedTranscript.includes('un docena de')) {
    const dozenMatch = normalizedTranscript.match(/(una?)\s+docena\s+de\s+(.+)/);
    if (dozenMatch) {
      const ingredientName = dozenMatch[2].trim();
      const normalizedName = normalizeIngredientName(ingredientName);
      const category = determineCategory(ingredientName);
      
      items.push({
        raw_text: normalizedTranscript,
        extracted_name: normalizedName,
        normalized_name: normalizedName.toLowerCase(),
        name: normalizedName,
        quantity: 12,
        unit: 'pcs',
        category: category,
        confidence: 0.9,
        suggestions: []
      });
      return items;
    }
  }
  
  // Handle "X kilo y medio de Y" pattern
  const kiloMedioMatch = normalizedTranscript.match(/(un|una?)\s+kilo\s+y\s+medio\s+de\s+(.+)/);
  if (kiloMedioMatch) {
    const ingredientName = kiloMedioMatch[2].trim();
    const normalizedName = normalizeIngredientName(ingredientName);
    const category = determineCategory(ingredientName);
    
    items.push({
      raw_text: normalizedTranscript,
      extracted_name: normalizedName,
      normalized_name: normalizedName.toLowerCase(),
      name: normalizedName,
      quantity: 1.5,
      unit: 'kg',
      category: category,
      confidence: 0.9,
      suggestions: []
    });
    return items;
  }
  
  // Split by common separators (y, coma, punto)
  const segments = normalizedTranscript.split(/\s*(?:,|\sy\s|\.)\s*/);
  
  for (const segment of segments) {
    if (!segment.trim()) continue;
    
    const { quantity, unit, remainingText } = extractQuantityAndUnit(segment);
    
    if (!remainingText) continue;
    
    const normalizedName = normalizeIngredientName(remainingText);
    const category = determineCategory(remainingText);
    
    // Generate suggestions based on partial matches
    const suggestions: string[] = [];
    if (normalizedName.length > 3) {
      const lowerName = normalizedName.toLowerCase();
      for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
          if (keyword.includes(lowerName) || lowerName.includes(keyword)) {
            suggestions.push(normalizeIngredientName(keyword));
          }
        }
      }
    }
    
    items.push({
      raw_text: segment,
      extracted_name: normalizedName,
      normalized_name: normalizedName.toLowerCase(),
      name: normalizedName, // Add name field for compatibility
      quantity: quantity || 1,
      unit: unit || 'pcs',
      category: category, // Add category field
      confidence: quantity !== null ? 0.9 : 0.7,
      suggestions: [...new Set(suggestions)].slice(0, 3)
    });
  }
  
  return items;
}

// Parse a batch of voice inputs
export function parseSpanishVoiceBatch(transcripts: string[]): ParsedIngredientInput[] {
  const allItems: ParsedIngredientInput[] = [];
  
  for (const transcript of transcripts) {
    allItems.push(...parseSpanishVoiceInput(transcript));
  }
  
  return allItems;
}

// Validate parsed input
export function validateParsedInput(input: ParsedIngredientInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!input.extracted_name || input.extracted_name.length < 2) {
    errors.push('El nombre del ingrediente es muy corto');
  }
  
  if (input.quantity <= 0) {
    errors.push('La cantidad debe ser mayor a cero');
  }
  
  if (!input.unit) {
    errors.push('Falta la unidad de medida');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}