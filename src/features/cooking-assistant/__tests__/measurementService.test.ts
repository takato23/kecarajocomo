import { 
  MeasurementService, 
  getMeasurementService, 
  convertBetweenSystems, 
  getCommonConversions 
} from '../services/measurementService';

describe('MeasurementService', () => {
  let service: MeasurementService;

  beforeEach(() => {
    service = new MeasurementService();
  });

  describe('volume conversions', () => {
    it('should convert between metric volume units', () => {
      const result = service.convertMeasurement(1, 'l', 'ml');
      
      expect(result.converted_amount).toBe(1000);
      expect(result.from_unit).toBe('l');
      expect(result.to_unit).toBe('ml');
    });

    it('should convert between imperial volume units', () => {
      const result = service.convertMeasurement(1, 'cup', 'fl oz');
      
      expect(result.converted_amount).toBeCloseTo(8, 1);
    });

    it('should convert between metric and imperial volume', () => {
      const result = service.convertMeasurement(1, 'cup', 'ml');
      
      expect(result.converted_amount).toBeCloseTo(236.588, 1);
    });

    it('should handle teaspoon to tablespoon conversion', () => {
      const result = service.convertMeasurement(3, 'tsp', 'tbsp');
      
      expect(result.converted_amount).toBeCloseTo(1, 1);
    });
  });

  describe('weight conversions', () => {
    it('should convert between metric weight units', () => {
      const result = service.convertMeasurement(1, 'kg', 'g');
      
      expect(result.converted_amount).toBe(1000);
    });

    it('should convert between imperial weight units', () => {
      const result = service.convertMeasurement(1, 'lb', 'oz');
      
      expect(result.converted_amount).toBeCloseTo(16, 1);
    });

    it('should convert between metric and imperial weight', () => {
      const result = service.convertMeasurement(1, 'lb', 'g');
      
      expect(result.converted_amount).toBeCloseTo(453.592, 1);
    });
  });

  describe('volume to weight conversions', () => {
    it('should convert volume to weight using ingredient density', () => {
      const result = service.convertMeasurement(1, 'cup', 'g', 'flour');
      
      expect(result.converted_amount).toBeCloseTo(140, 10); // Approximate
    });

    it('should convert weight to volume using ingredient density', () => {
      const result = service.convertMeasurement(200, 'g', 'cup', 'sugar');
      
      expect(result.converted_amount).toBeCloseTo(1, 0.2); // Approximate
    });

    it('should use default density for unknown ingredients', () => {
      const result = service.convertMeasurement(1, 'cup', 'g', 'unknown_ingredient');
      
      expect(result.converted_amount).toBeCloseTo(236.588, 1); // Water density
    });

    it('should handle partial ingredient name matches', () => {
      const result = service.convertMeasurement(1, 'cup', 'g', 'all-purpose flour');
      
      expect(result.converted_amount).toBeCloseTo(140, 10); // Should match 'flour'
    });
  });

  describe('temperature conversions', () => {
    it('should convert Celsius to Fahrenheit', () => {
      const result = service.convertTemperature(100, 'celsius', 'fahrenheit');
      
      expect(result).toBe(212);
    });

    it('should convert Fahrenheit to Celsius', () => {
      const result = service.convertTemperature(212, 'fahrenheit', 'celsius');
      
      expect(result).toBe(100);
    });

    it('should convert Celsius to Kelvin', () => {
      const result = service.convertTemperature(0, 'celsius', 'kelvin');
      
      expect(result).toBe(273.15);
    });

    it('should handle same unit conversion', () => {
      const result = service.convertTemperature(100, 'celsius', 'celsius');
      
      expect(result).toBe(100);
    });
  });

  describe('recipe scaling', () => {
    it('should scale recipe ingredients', () => {
      const ingredients = [
        { name: 'flour', quantity: 2, unit: 'cups' },
        { name: 'sugar', quantity: 1, unit: 'cup' },
        { name: 'eggs', quantity: 3, unit: 'large' }
      ];

      const scaled = service.scaleRecipe(4, 8, ingredients);

      expect(scaled[0].quantity).toBe(4); // 2 * 2
      expect(scaled[1].quantity).toBe(2); // 1 * 2
      expect(scaled[2].quantity).toBe(6); // 3 * 2
    });

    it('should handle fractional scaling', () => {
      const ingredients = [
        { name: 'flour', quantity: 2, unit: 'cups' }
      ];

      const scaled = service.scaleRecipe(4, 2, ingredients);

      expect(scaled[0].quantity).toBe(1); // 2 * 0.5
    });
  });

  describe('unit suggestions', () => {
    it('should suggest better volume units', () => {
      expect(service.suggestBetterUnit(0.5, 'ml')).toBe('tsp');
      expect(service.suggestBetterUnit(500, 'ml')).toBe('cup');
      expect(service.suggestBetterUnit(1500, 'ml')).toBe('l');
    });

    it('should suggest better weight units', () => {
      expect(service.suggestBetterUnit(500, 'g')).toBe('g');
      expect(service.suggestBetterUnit(1500, 'g')).toBe('kg');
    });

    it('should return null for unsupported units', () => {
      expect(service.suggestBetterUnit(100, 'unknown')).toBeNull();
    });
  });

  describe('unit type checking', () => {
    it('should identify volume units', () => {
      expect(service.isVolumeUnit('ml')).toBe(true);
      expect(service.isVolumeUnit('cup')).toBe(true);
      expect(service.isVolumeUnit('g')).toBe(false);
    });

    it('should identify weight units', () => {
      expect(service.isWeightUnit('g')).toBe(true);
      expect(service.isWeightUnit('oz')).toBe(true);
      expect(service.isWeightUnit('ml')).toBe(false);
    });

    it('should identify temperature units', () => {
      expect(service.isTemperatureUnit('celsius')).toBe(true);
      expect(service.isTemperatureUnit('fahrenheit')).toBe(true);
      expect(service.isTemperatureUnit('ml')).toBe(false);
    });
  });

  describe('amount formatting', () => {
    it('should format common fractions', () => {
      expect(service.formatAmount(0.25, 'cup')).toBe('1/4 cup');
      expect(service.formatAmount(0.5, 'tsp')).toBe('1/2 tsp');
      expect(service.formatAmount(0.75, 'tbsp')).toBe('3/4 tbsp');
    });

    it('should format whole numbers with fractions', () => {
      expect(service.formatAmount(1.25, 'cup')).toBe('1 1/4 cup');
      expect(service.formatAmount(2.5, 'tsp')).toBe('2 1/2 tsp');
    });

    it('should format decimal amounts', () => {
      expect(service.formatAmount(1.3, 'cup')).toBe('1.3 cup');
      expect(service.formatAmount(2.7, 'oz')).toBe('2.7 oz');
    });
  });

  describe('error handling', () => {
    it('should throw error for incompatible units', () => {
      expect(() => {
        service.convertMeasurement(1, 'celsius', 'ml');
      }).toThrow();
    });

    it('should handle same unit conversion', () => {
      const result = service.convertMeasurement(1, 'cup', 'cup');
      
      expect(result.converted_amount).toBe(1);
      expect(result.conversion_factor).toBe(1);
    });
  });

  describe('caching', () => {
    it('should cache conversion results', () => {
      const spy = jest.spyOn(service as any, 'performConversion');
      
      service.convertMeasurement(1, 'cup', 'ml');
      service.convertMeasurement(1, 'cup', 'ml');
      
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', () => {
      const spy = jest.spyOn(service as any, 'performConversion');
      
      service.convertMeasurement(1, 'cup', 'ml');
      service.clearCache();
      service.convertMeasurement(1, 'cup', 'ml');
      
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('supported units', () => {
    it('should return all supported units', () => {
      const units = service.getSupportedUnits();
      
      expect(units.volume).toContain('ml');
      expect(units.volume).toContain('cup');
      expect(units.weight).toContain('g');
      expect(units.weight).toContain('oz');
      expect(units.temperature).toContain('celsius');
      expect(units.temperature).toContain('fahrenheit');
    });
  });
});

describe('getMeasurementService', () => {
  it('should return singleton instance', () => {
    const service1 = getMeasurementService();
    const service2 = getMeasurementService();
    
    expect(service1).toBe(service2);
  });
});

describe('convertBetweenSystems', () => {
  it('should convert to metric system', () => {
    const result = convertBetweenSystems(1, 'cup', 'metric');
    
    expect(result?.to_unit).toBe('ml');
    expect(result?.converted_amount).toBeCloseTo(236.588, 1);
  });

  it('should convert to imperial system', () => {
    const result = convertBetweenSystems(250, 'ml', 'imperial');
    
    expect(result?.to_unit).toBe('cup');
    expect(result?.converted_amount).toBeCloseTo(1, 0.1);
  });

  it('should handle conversion failures gracefully', () => {
    const result = convertBetweenSystems(1, 'unknown', 'metric');
    
    expect(result).toBeNull();
  });
});

describe('getCommonConversions', () => {
  it('should return common conversions for volume units', () => {
    const conversions = getCommonConversions(1, 'cup');
    
    expect(conversions.length).toBeGreaterThan(0);
    expect(conversions.some(c => c.to_unit === 'ml')).toBe(true);
    expect(conversions.some(c => c.to_unit === 'fl oz')).toBe(true);
  });

  it('should return common conversions for weight units', () => {
    const conversions = getCommonConversions(100, 'g');
    
    expect(conversions.length).toBeGreaterThan(0);
    expect(conversions.some(c => c.to_unit === 'oz')).toBe(true);
  });

  it('should exclude same unit conversions', () => {
    const conversions = getCommonConversions(1, 'cup');
    
    expect(conversions.some(c => c.to_unit === 'cup')).toBe(false);
  });

  it('should handle failed conversions gracefully', () => {
    const conversions = getCommonConversions(1, 'unknown');
    
    expect(conversions).toEqual([]);
  });
});

describe('ingredient density approximations', () => {
  const testCases = [
    { ingredient: 'flour', expected: 0.593 },
    { ingredient: 'sugar', expected: 0.845 },
    { ingredient: 'butter', expected: 0.911 },
    { ingredient: 'water', expected: 1.0 },
    { ingredient: 'milk', expected: 1.03 },
    { ingredient: 'honey', expected: 1.36 }
  ];

  testCases.forEach(({ ingredient, expected }) => {
    it(`should have correct density for ${ingredient}`, () => {
      const service = new MeasurementService();
      const result = service.convertMeasurement(1, 'ml', 'g', ingredient);
      
      expect(result.converted_amount).toBeCloseTo(expected, 2);
    });
  });
});

describe('edge cases', () => {
  let service: MeasurementService;

  beforeEach(() => {
    service = new MeasurementService();
  });

  it('should handle zero amounts', () => {
    const result = service.convertMeasurement(0, 'cup', 'ml');
    
    expect(result.converted_amount).toBe(0);
  });

  it('should handle very small amounts', () => {
    const result = service.convertMeasurement(0.001, 'cup', 'ml');
    
    expect(result.converted_amount).toBeCloseTo(0.237, 3);
  });

  it('should handle very large amounts', () => {
    const result = service.convertMeasurement(1000, 'cup', 'l');
    
    expect(result.converted_amount).toBeCloseTo(236.588, 1);
  });

  it('should handle case-insensitive unit names', () => {
    const result = service.convertMeasurement(1, 'CUP', 'ML');
    
    expect(result.converted_amount).toBeCloseTo(236.588, 1);
  });

  it('should handle unit names with spaces', () => {
    const result = service.convertMeasurement(1, ' cup ', ' ml ');
    
    expect(result.converted_amount).toBeCloseTo(236.588, 1);
  });
});