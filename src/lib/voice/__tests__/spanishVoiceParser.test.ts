import { parseSpanishVoiceInput } from '../spanishVoiceParser';

describe('SpanishVoiceParser', () => {
  describe('parseSpanishVoiceInput', () => {
    it('should parse "una docena de huevos" correctly', () => {
      const result = parseSpanishVoiceInput('una docena de huevos');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Huevos',
        quantity: 12,
        unit: 'pcs',
        category: 'lácteos'
      });
    });

    it('should parse "1kg de milanesa" correctly', () => {
      const result = parseSpanishVoiceInput('1kg de milanesa');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Milanesa',
        quantity: 1,
        unit: 'kg',
        category: 'carnes'
      });
    });

    it('should parse "medio kilo de queso" correctly', () => {
      const result = parseSpanishVoiceInput('medio kilo de queso');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Queso',
        quantity: 0.5,
        unit: 'kg',
        category: 'lácteos'
      });
    });

    it('should parse multiple items correctly', () => {
      const result = parseSpanishVoiceInput('2 litros de leche y una docena de huevos');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'Leche',
        quantity: 2,
        unit: 'L',
        category: 'lácteos'
      });
      expect(result[1]).toMatchObject({
        name: 'Huevos',
        quantity: 12,
        unit: 'pcs',
        category: 'lácteos'
      });
    });

    it('should parse "un cuarto de manteca" correctly', () => {
      const result = parseSpanishVoiceInput('un cuarto de manteca');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Manteca',
        quantity: 0.25,
        unit: 'kg',
        category: 'lácteos'
      });
    });

    it('should handle items without explicit quantity', () => {
      const result = parseSpanishVoiceInput('manzanas');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Manzanas',
        quantity: 1,
        unit: 'pcs',
        category: 'frutas'
      });
    });

    it('should parse Spanish number words', () => {
      const result = parseSpanishVoiceInput('tres kilos de papas');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Papas',
        quantity: 3,
        unit: 'kg',
        category: 'frutas'
      });
    });

    it('should handle various unit variations', () => {
      const tests = [
        { input: '2 kilos de arroz', expectedUnit: 'kg' },
        { input: '500 gramos de harina', expectedUnit: 'g' },
        { input: '3 litros de aceite', expectedUnit: 'L' },
        { input: '250 mililitros de vinagre', expectedUnit: 'ml' },
      ];

      tests.forEach(({ input, expectedUnit }) => {
        const result = parseSpanishVoiceInput(input);
        expect(result[0].unit).toBe(expectedUnit);
      });
    });
  });
});