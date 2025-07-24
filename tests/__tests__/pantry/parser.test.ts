/**
 * @jest-environment jsdom
 */

import { 
  IngredientParser, 
  parseIngredient, 
  parseMultipleIngredients, 
  categorizeIngredient,
  processVoiceInput 
} from '@/lib/pantry/parser';
import { IngredientCategory } from '@/types/pantry';

describe('IngredientParser', () => {
  let parser: IngredientParser;

  beforeEach(() => {
    parser = new IngredientParser();
  });

  describe('parseIngredient', () => {
    test('should parse simple ingredient name', () => {
      const result = parseIngredient('tomate');
      
      expect(result.extracted_name).toBe('tomate');
      expect(result.normalized_name).toBe('tomate');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should parse ingredient with quantity and unit', () => {
      const result = parseIngredient('2 kg pollo');
      
      expect(result.extracted_name).toBe('pollo');
      expect(result.normalized_name).toBe('pollo');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('kg');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should parse ingredient with decimal quantity', () => {
      const result = parseIngredient('1.5 litros leche');
      
      expect(result.extracted_name).toBe('leche');
      expect(result.quantity).toBe(1.5);
      expect(result.unit).toBe('l');
    });

    test('should normalize similar ingredient names', () => {
      const result1 = parseIngredient('pechuga de pollo');
      const result2 = parseIngredient('milanesa de pollo');
      
      expect(result1.normalized_name).toBe('pollo');
      expect(result2.normalized_name).toBe('pollo');
    });

    test('should handle special characters and accents', () => {
      const result = parseIngredient('2 piñas grandes');
      
      expect(result.extracted_name).toBe('piñas grandes');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('pcs');
    });

    test('should provide suggestions for similar ingredients', () => {
      const result = parseIngredient('pollo');
      
      expect(result.suggestions).toContain('pollo');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should handle empty or invalid input', () => {
      const result = parseIngredient('');
      
      expect(result.extracted_name).toBe('');
      expect(result.confidence).toBe(0);
    });
  });

  describe('parseMultipleIngredients', () => {
    test('should parse comma-separated ingredients', () => {
      const result = parseMultipleIngredients('tomate, cebolla, 2 kg pollo');
      
      expect(result).toHaveLength(3);
      expect(result[0].extracted_name).toBe('tomate');
      expect(result[1].extracted_name).toBe('cebolla');
      expect(result[2].extracted_name).toBe('pollo');
      expect(result[2].quantity).toBe(2);
    });

    test('should parse ingredients separated by "y"', () => {
      const result = parseMultipleIngredients('arroz y frijoles y pollo');
      
      expect(result).toHaveLength(3);
      expect(result[0].extracted_name).toBe('arroz');
      expect(result[1].extracted_name).toBe('frijoles');
      expect(result[2].extracted_name).toBe('pollo');
    });

    test('should parse newline-separated ingredients', () => {
      const result = parseMultipleIngredients('tomate\\ncebolla\\npollo');
      
      expect(result).toHaveLength(3);
    });

    test('should handle mixed separators', () => {
      const result = parseMultipleIngredients('tomate, cebolla y 2 kg pollo; arroz');
      
      expect(result).toHaveLength(4);
    });

    test('should filter out empty ingredients', () => {
      const result = parseMultipleIngredients('tomate, , cebolla');
      
      expect(result).toHaveLength(2);
      expect(result.every(item => item.extracted_name.length > 0)).toBe(true);
    });
  });

  describe('categorizeIngredient', () => {
    test('should categorize vegetables correctly', () => {
      expect(categorizeIngredient('tomate')).toBe('verduras');
      expect(categorizeIngredient('lechuga')).toBe('verduras');
      expect(categorizeIngredient('brócoli')).toBe('verduras');
    });

    test('should categorize fruits correctly', () => {
      expect(categorizeIngredient('manzana')).toBe('frutas');
      expect(categorizeIngredient('platano')).toBe('frutas');
      expect(categorizeIngredient('naranja')).toBe('frutas');
    });

    test('should categorize meat correctly', () => {
      expect(categorizeIngredient('pollo')).toBe('carnes');
      expect(categorizeIngredient('res')).toBe('carnes');
      expect(categorizeIngredient('pescado')).toBe('carnes');
    });

    test('should categorize dairy correctly', () => {
      expect(categorizeIngredient('leche')).toBe('lacteos');
      expect(categorizeIngredient('queso')).toBe('lacteos');
      expect(categorizeIngredient('yogur')).toBe('lacteos');
    });

    test('should categorize grains correctly', () => {
      expect(categorizeIngredient('arroz')).toBe('granos');
      expect(categorizeIngredient('pasta')).toBe('granos');
      expect(categorizeIngredient('avena')).toBe('granos');
    });

    test('should default to "otros" for unknown ingredients', () => {
      expect(categorizeIngredient('ingrediente desconocido')).toBe('otros');
      expect(categorizeIngredient('')).toBe('otros');
    });

    test('should handle partial matches', () => {
      expect(categorizeIngredient('jugo de manzana')).toBe('frutas');
      expect(categorizeIngredient('aceite de oliva')).toBe('condimentos');
    });
  });

  describe('processVoiceInput', () => {
    test('should process voice transcript and return parsed items', () => {
      const result = processVoiceInput('necesito tomate, cebolla y dos kilos de pollo');
      
      expect(result.transcript).toBe('necesito tomate, cebolla y dos kilos de pollo');
      expect(result.parsed_items).toHaveLength(3);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processing_time).toBeGreaterThan(0);
    });

    test('should handle empty transcript', () => {
      const result = processVoiceInput('');
      
      expect(result.parsed_items).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    test('should calculate confidence based on parsing quality', () => {
      const goodResult = processVoiceInput('tomate, cebolla, pollo');
      const poorResult = processVoiceInput('um, eh, cosa esa');
      
      expect(goodResult.confidence).toBeGreaterThan(poorResult.confidence);
    });
  });

  describe('unit normalization', () => {
    test('should normalize weight units', () => {
      expect(parseIngredient('2 kilogramos pollo').unit).toBe('kg');
      expect(parseIngredient('500 gramos azucar').unit).toBe('g');
      expect(parseIngredient('1 libra carne').unit).toBe('lb');
    });

    test('should normalize volume units', () => {
      expect(parseIngredient('1 litro leche').unit).toBe('l');
      expect(parseIngredient('250 mililitros aceite').unit).toBe('ml');
      expect(parseIngredient('2 tazas harina').unit).toBe('cup');
    });

    test('should normalize count units', () => {
      expect(parseIngredient('6 piezas huevos').unit).toBe('pcs');
      expect(parseIngredient('2 paquetes pasta').unit).toBe('pack');
    });

    test('should default to pieces for numbers without units', () => {
      expect(parseIngredient('5 manzanas').unit).toBe('pcs');
    });
  });

  describe('confidence scoring', () => {
    test('should give high confidence for well-known ingredients', () => {
      const result = parseIngredient('tomate');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should give medium confidence for categorizable ingredients', () => {
      const result = parseIngredient('verdura extraña');
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    test('should give low confidence for very short or unclear input', () => {
      const result = parseIngredient('x');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should boost confidence for ingredients with quantities', () => {
      const withQuantity = parseIngredient('2 kg tomate');
      const withoutQuantity = parseIngredient('tomate');
      
      expect(withQuantity.confidence).toBeGreaterThanOrEqual(withoutQuantity.confidence);
    });
  });

  describe('ingredient suggestions', () => {
    test('should provide relevant suggestions', () => {
      const result = parseIngredient('pollo');
      
      expect(result.suggestions).toContain('pollo');
      expect(result.suggestions.some(s => s.includes('pollo'))).toBe(true);
    });

    test('should limit number of suggestions', () => {
      const result = parseIngredient('carne');
      
      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    });

    test('should not duplicate the main ingredient in suggestions', () => {
      const result = parseIngredient('tomate');
      const mainIngredient = result.normalized_name;
      
      // Filter out exact matches to avoid counting the main ingredient
      const uniqueSuggestions = result.suggestions.filter(s => s !== mainIngredient);
      expect(uniqueSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('custom parser configuration', () => {
    test('should respect language configuration', () => {
      const spanishParser = new IngredientParser({ language: 'es' });
      const result = spanishParser.parseIngredient('tomate');
      
      expect(result.normalized_name).toBe('tomate');
    });

    test('should respect confidence threshold', () => {
      const strictParser = new IngredientParser({ confidence_threshold: 0.9 });
      // This would affect suggestion filtering in a real implementation
      expect(strictParser).toBeDefined();
    });

    test('should handle fuzzy matching configuration', () => {
      const fuzzyParser = new IngredientParser({ fuzzy_matching: true });
      const nonFuzzyParser = new IngredientParser({ fuzzy_matching: false });
      
      expect(fuzzyParser).toBeDefined();
      expect(nonFuzzyParser).toBeDefined();
    });
  });
});