import { 
  ParsedIngredientInput, 
  IngredientSuggestion, 
  Ingredient, 
  IngredientCategory,
  IngredientParserConfig,
  VoiceParseResult
} from '@/types/pantry';

// Common ingredient normalization patterns
const NORMALIZATION_PATTERNS = {
  // Meat normalizations
  'pollo': ['pollo', 'pechuga de pollo', 'muslo de pollo', 'milanesa de pollo', 'pollo entero'],
  'carne': ['carne', 'carne molida', 'bistec', 'res', 'carne de res'],
  'cerdo': ['cerdo', 'chuleta de cerdo', 'costilla de cerdo', 'tocino'],
  'pescado': ['pescado', 'salmon', 'atun', 'tilapia', 'bagre'],
  
  // Vegetables
  'tomate': ['tomate', 'jitomate', 'tomates cherry'],
  'cebolla': ['cebolla', 'cebolla blanca', 'cebolla morada', 'cebolla cabezona'],
  'papa': ['papa', 'patata', 'papas', 'papa criolla'],
  'zanahoria': ['zanahoria', 'zanahorias baby'],
  
  // Dairy
  'leche': ['leche', 'leche entera', 'leche descremada', 'leche deslactosada'],
  'queso': ['queso', 'queso fresco', 'queso mozzarella', 'queso cheddar'],
  
  // Grains
  'arroz': ['arroz', 'arroz blanco', 'arroz integral', 'arroz basmati'],
  'pasta': ['pasta', 'espagueti', 'macarrones', 'fideos'],
  
  // Fruits
  'manzana': ['manzana', 'manzanas verdes', 'manzanas rojas'],
  'platano': ['platano', 'banano', 'guineo'],
};

// Category classification keywords
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  verduras: ['lechuga', 'espinaca', 'acelga', 'brócoli', 'coliflor', 'apio', 'pepino', 'pimiento', 'tomate', 'cebolla', 'ajo', 'zanahoria', 'papa', 'yuca', 'remolacha'],
  frutas: ['manzana', 'pera', 'platano', 'naranja', 'limón', 'uva', 'fresa', 'mango', 'piña', 'papaya', 'kiwi', 'durazno', 'cereza', 'mora'],
  carnes: ['pollo', 'res', 'cerdo', 'pescado', 'salmon', 'atun', 'camarón', 'bistec', 'chuleta', 'costilla', 'milanesa', 'chorizo', 'jamón'],
  lacteos: ['leche', 'queso', 'yogur', 'crema', 'mantequilla', 'nata', 'cuajada', 'requesón'],
  granos: ['arroz', 'pasta', 'avena', 'quinoa', 'lenteja', 'frijol', 'garbanzo', 'maiz', 'trigo', 'cebada'],
  condimentos: ['sal', 'pimienta', 'ajo', 'cebolla en polvo', 'comino', 'oregano', 'albahaca', 'cilantro', 'perejil', 'aceite', 'vinagre', 'salsa'],
  bebidas: ['agua', 'jugo', 'refresco', 'cerveza', 'vino', 'cafe', 'te', 'leche', 'batido'],
  enlatados: ['atun enlatado', 'sardinas', 'duraznos en almibar', 'maiz enlatado', 'frijoles enlatados', 'salsa de tomate'],
  congelados: ['verduras congeladas', 'frutas congeladas', 'pescado congelado', 'helado', 'paletas'],
  panaderia: ['pan', 'galletas', 'pastel', 'torta', 'croissant', 'dona', 'muffin', 'bagel'],
  snacks: ['papas fritas', 'doritos', 'palomitas', 'nueces', 'almendras', 'chocolate', 'dulces', 'chicle'],
  otros: ['detergente', 'jabon', 'papel', 'aluminio', 'bolsas', 'servilletas']
};

// Quantity extraction patterns
const QUANTITY_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(kg|kilogramos?)/gi,
  /(\d+(?:\.\d+)?)\s*(g|gramos?)/gi,
  /(\d+(?:\.\d+)?)\s*(l|litros?)/gi,
  /(\d+(?:\.\d+)?)\s*(ml|mililitros?)/gi,
  /(\d+(?:\.\d+)?)\s*(tazas?|cups?)/gi,
  /(\d+(?:\.\d+)?)\s*(cucharadas?|tbsp)/gi,
  /(\d+(?:\.\d+)?)\s*(cucharaditas?|tsp)/gi,
  /(\d+(?:\.\d+)?)\s*(piezas?|unidades?|pcs?)/gi,
  /(\d+(?:\.\d+)?)\s*(paquetes?|pack)/gi,
  /(\d+(?:\.\d+)?)\s*(lb|libras?)/gi,
  /(\d+(?:\.\d+)?)\s*(oz|onzas?)/gi,
];

export class IngredientParser {
  private config: IngredientParserConfig;

  constructor(config: Partial<IngredientParserConfig> = {}) {
    this.config = {
      language: 'es',
      auto_categorize: true,
      fuzzy_matching: true,
      phonetic_matching: true,
      confidence_threshold: 0.7,
      ...config
    };
  }

  /**
   * Parse a single ingredient input text
   */
  parseIngredient(input: string): ParsedIngredientInput {
    const cleaned = this.cleanInput(input);
    const { quantity, unit, cleanedName } = this.extractQuantityAndUnit(cleaned);
    const normalizedName = this.normalizeIngredientName(cleanedName);
    const suggestions = this.generateSuggestions(cleanedName);

    return {
      raw_text: input,
      extracted_name: cleanedName,
      normalized_name: normalizedName,
      quantity,
      unit,
      confidence: this.calculateConfidence(cleanedName, normalizedName),
      suggestions
    };
  }

  /**
   * Parse multiple ingredients from a single text (voice input)
   */
  parseMultipleIngredients(input: string): ParsedIngredientInput[] {
    // Split by common separators
    const separators = [',', 'y', 'and', '\n', ';'];
    const items = this.splitByMultipleSeparators(input, separators);
    
    return items
      .map(item => this.parseIngredient(item.trim()))
      .filter(parsed => parsed.extracted_name.length > 0);
  }

  /**
   * Categorize an ingredient automatically
   */
  categorizeIngredient(ingredientName: string): IngredientCategory {
    const normalized = ingredientName.toLowerCase().trim();
    
    // Check each category for keyword matches
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword) || keyword.includes(normalized)) {
          return category as IngredientCategory;
        }
      }
    }
    
    return 'otros'; // Default category
  }

  /**
   * Generate ingredient suggestions based on existing ingredients
   */
  generateIngredientSuggestions(
    input: string, 
    existingIngredients: Ingredient[]
  ): IngredientSuggestion[] {
    const normalized = input.toLowerCase().trim();
    const suggestions: IngredientSuggestion[] = [];

    for (const ingredient of existingIngredients) {
      const score = this.calculateSimilarityScore(normalized, ingredient);
      
      if (score > this.config.confidence_threshold) {
        suggestions.push({
          ingredient,
          score,
          match_type: this.getMatchType(normalized, ingredient)
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Process voice input result
   */
  processVoiceInput(transcript: string): VoiceParseResult {
    const startTime = Date.now();
    const parsed_items = this.parseMultipleIngredients(transcript);
    const processing_time = Date.now() - startTime;
    
    // Calculate overall confidence based on individual item confidence
    const confidence = parsed_items.length > 0 
      ? parsed_items.reduce((sum, item) => sum + item.confidence, 0) / parsed_items.length
      : 0;

    return {
      transcript,
      parsed_items,
      confidence,
      processing_time
    };
  }

  /**
   * Clean and normalize input text
   */
  private cleanInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\.,\d]/g, '') // Remove special chars except basic punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Extract quantity and unit from text
   */
  private extractQuantityAndUnit(input: string): {
    quantity?: number;
    unit?: string;
    cleanedName: string;
  } {
    let cleanedName = input;
    let quantity: number | undefined;
    let unit: string | undefined;

    // Try to match quantity patterns
    for (const pattern of QUANTITY_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        const [fullMatch, quantityStr, unitStr] = match;
        quantity = parseFloat(quantityStr);
        unit = this.normalizeUnit(unitStr);
        cleanedName = input.replace(fullMatch, '').trim();
        break;
      }
    }

    // If no explicit quantity found, look for numbers at the beginning
    if (!quantity) {
      const numberMatch = input.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
      if (numberMatch) {
        quantity = parseFloat(numberMatch[1]);
        cleanedName = numberMatch[2].trim();
        unit = 'pcs'; // Default to pieces
      }
    }

    return { quantity, unit, cleanedName };
  }

  /**
   * Normalize ingredient name using patterns
   */
  private normalizeIngredientName(name: string): string {
    const cleaned = name.toLowerCase().trim();
    
    // Check normalization patterns
    for (const [normalized, variants] of Object.entries(NORMALIZATION_PATTERNS)) {
      for (const variant of variants) {
        if (cleaned.includes(variant) || variant.includes(cleaned)) {
          return normalized;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Generate alternative suggestions for an ingredient
   */
  private generateSuggestions(name: string): string[] {
    const suggestions: string[] = [];
    const normalized = name.toLowerCase();
    
    // Find related ingredients from normalization patterns
    for (const [key, variants] of Object.entries(NORMALIZATION_PATTERNS)) {
      if (variants.some(variant => 
        normalized.includes(variant) || variant.includes(normalized)
      )) {
        suggestions.push(key, ...variants.filter(v => v !== normalized));
      }
    }
    
    return [...new Set(suggestions)].slice(0, 5); // Remove duplicates and limit
  }

  /**
   * Calculate parsing confidence score
   */
  private calculateConfidence(original: string, normalized: string): number {
    let confidence = 0.5; // Base confidence
    
    // Boost if found in normalization patterns
    if (Object.values(NORMALIZATION_PATTERNS).some(variants => 
      variants.includes(normalized)
    )) {
      confidence += 0.3;
    }
    
    // Boost if categorizable
    if (this.categorizeIngredient(original) !== 'otros') {
      confidence += 0.2;
    }
    
    // Penalize very short names
    if (original.length < 3) {
      confidence -= 0.2;
    }
    
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Calculate similarity score between input and existing ingredient
   */
  private calculateSimilarityScore(input: string, ingredient: Ingredient): number {
    const targets = [
      ingredient.name,
      ingredient.normalized_name,
      ...ingredient.common_names
    ].map(name => name.toLowerCase());

    let maxScore = 0;

    for (const target of targets) {
      // Exact match
      if (input === target) {
        maxScore = Math.max(maxScore, 1.0);
        continue;
      }

      // Contains match
      if (target.includes(input) || input.includes(target)) {
        maxScore = Math.max(maxScore, 0.8);
        continue;
      }

      // Fuzzy matching (simple Levenshtein-based)
      if (this.config.fuzzy_matching) {
        const similarity = this.calculateLevenshteinSimilarity(input, target);
        maxScore = Math.max(maxScore, similarity * 0.6);
      }
    }

    return maxScore;
  }

  /**
   * Get match type for suggestion
   */
  private getMatchType(input: string, ingredient: Ingredient): 'exact' | 'partial' | 'category' | 'phonetic' {
    const targets = [ingredient.name, ingredient.normalized_name, ...ingredient.common_names]
      .map(name => name.toLowerCase());

    if (targets.includes(input)) return 'exact';
    if (targets.some(target => target.includes(input) || input.includes(target))) return 'partial';
    
    // Check if same category
    const inputCategory = this.categorizeIngredient(input);
    const ingredientCategory = ingredient.category;
    if (inputCategory === ingredientCategory && inputCategory !== 'otros') return 'category';
    
    return 'phonetic';
  }

  /**
   * Split text by multiple separators
   */
  private splitByMultipleSeparators(text: string, separators: string[]): string[] {
    let parts = [text];
    
    for (const separator of separators) {
      const newParts: string[] = [];
      for (const part of parts) {
        newParts.push(...part.split(separator));
      }
      parts = newParts;
    }
    
    return parts.filter(part => part.trim().length > 0);
  }

  /**
   * Normalize unit names
   */
  private normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase().trim();
    
    // Weight units
    if (['kg', 'kilogramo', 'kilogramos'].includes(normalized)) return 'kg';
    if (['g', 'gramo', 'gramos'].includes(normalized)) return 'g';
    if (['lb', 'libra', 'libras'].includes(normalized)) return 'lb';
    if (['oz', 'onza', 'onzas'].includes(normalized)) return 'oz';
    
    // Volume units
    if (['l', 'litro', 'litros'].includes(normalized)) return 'l';
    if (['ml', 'mililitro', 'mililitros'].includes(normalized)) return 'ml';
    if (['taza', 'tazas', 'cup', 'cups'].includes(normalized)) return 'cup';
    if (['cucharada', 'cucharadas', 'tbsp'].includes(normalized)) return 'tbsp';
    if (['cucharadita', 'cucharaditas', 'tsp'].includes(normalized)) return 'tsp';
    
    // Count units
    if (['pieza', 'piezas', 'unidad', 'unidades', 'pcs'].includes(normalized)) return 'pcs';
    if (['paquete', 'paquetes', 'pack'].includes(normalized)) return 'pack';
    
    return normalized;
  }

  /**
   * Simple Levenshtein similarity calculation
   */
  private calculateLevenshteinSimilarity(a: string, b: string): number {
    const matrix: number[][] = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }
}

// Export a default configured parser
export const defaultParser = new IngredientParser();

// Utility functions
export const parseIngredient = (input: string) => defaultParser.parseIngredient(input);
export const parseMultipleIngredients = (input: string) => defaultParser.parseMultipleIngredients(input);
export const categorizeIngredient = (name: string) => defaultParser.categorizeIngredient(name);
export const processVoiceInput = (transcript: string) => defaultParser.processVoiceInput(transcript);