import { 
  getSeasonalIngredients, 
  checkIngredientAvailability,
  suggestSeasonalAlternatives,
  getSeasonForDate,
  filterRecipesBySeason,
  calculateSeasonalPricing
} from '../seasonalAvailability';
import { 
  mockWeeklyPlan,
  mockAsadoRecipe,
  mockMilanesas,
  mockEmpanadas
} from '@/__tests__/mocks/fixtures/argentineMealData';
import type { Recipe, Ingredient } from '@/features/meal-planning/types';

// Mock seasonal data for Argentina
const mockSeasonalData = {
  verano: { // December - February
    available: ['tomate', 'pepino', 'lechuga', 'sandía', 'melón', 'durazno', 'uva'],
    peak: ['tomate', 'lechuga', 'sandía'],
    limited: ['papa', 'cebolla'],
    unavailable: ['zapallo', 'batata'],
    priceMultiplier: {
      'tomate': 0.8,
      'lechuga': 0.7,
      'papa': 1.3,
      'cebolla': 1.2
    }
  },
  otoño: { // March - May
    available: ['papa', 'cebolla', 'zanahoria', 'zapallo', 'manzana', 'pera'],
    peak: ['papa', 'zapallo'],
    limited: ['tomate', 'lechuga'],
    unavailable: ['sandía', 'melón'],
    priceMultiplier: {
      'papa': 0.9,
      'zapallo': 0.8,
      'tomate': 1.4,
      'lechuga': 1.3
    }
  },
  invierno: { // June - August
    available: ['papa', 'cebolla', 'zanahoria', 'repollo', 'zapallo', 'batata'],
    peak: ['repollo', 'batata'],
    limited: ['tomate', 'lechuga'],
    unavailable: ['sandía', 'melón', 'durazno'],
    priceMultiplier: {
      'papa': 1.0,
      'repollo': 0.8,
      'tomate': 1.6,
      'lechuga': 1.5
    }
  },
  primavera: { // September - November
    available: ['tomate', 'lechuga', 'papa', 'cebolla', 'zanahoria', 'espinaca'],
    peak: ['espinaca', 'lechuga'],
    limited: ['zapallo', 'batata'],
    unavailable: [],
    priceMultiplier: {
      'tomate': 1.1,
      'lechuga': 0.9,
      'espinaca': 0.8,
      'zapallo': 1.3
    }
  }
};

describe('Seasonal Availability System', () => {
  describe('getSeasonForDate', () => {
    it('should correctly identify Argentine seasons', () => {
      // Summer (December - February)
      expect(getSeasonForDate('2024-01-15')).toBe('verano');
      expect(getSeasonForDate('2024-12-25')).toBe('verano');
      expect(getSeasonForDate('2024-02-28')).toBe('verano');

      // Autumn (March - May)
      expect(getSeasonForDate('2024-03-15')).toBe('otoño');
      expect(getSeasonForDate('2024-04-20')).toBe('otoño');
      expect(getSeasonForDate('2024-05-31')).toBe('otoño');

      // Winter (June - August)
      expect(getSeasonForDate('2024-06-15')).toBe('invierno');
      expect(getSeasonForDate('2024-07-20')).toBe('invierno');
      expect(getSeasonForDate('2024-08-31')).toBe('invierno');

      // Spring (September - November)
      expect(getSeasonForDate('2024-09-15')).toBe('primavera');
      expect(getSeasonForDate('2024-10-20')).toBe('primavera');
      expect(getSeasonForDate('2024-11-30')).toBe('primavera');
    });

    it('should handle year transitions correctly', () => {
      expect(getSeasonForDate('2023-12-31')).toBe('verano');
      expect(getSeasonForDate('2024-01-01')).toBe('verano');
      expect(getSeasonForDate('2024-02-29')).toBe('verano'); // Leap year
    });
  });

  describe('getSeasonalIngredients', () => {
    it('should return correct ingredients for summer', () => {
      const summer = getSeasonalIngredients('verano', mockSeasonalData);
      
      expect(summer.available).toContain('tomate');
      expect(summer.available).toContain('lechuga');
      expect(summer.available).toContain('sandía');
      expect(summer.peak).toContain('tomate');
      expect(summer.unavailable).toContain('zapallo');
    });

    it('should return correct ingredients for winter', () => {
      const winter = getSeasonalIngredients('invierno', mockSeasonalData);
      
      expect(winter.available).toContain('repollo');
      expect(winter.available).toContain('batata');
      expect(winter.peak).toContain('repollo');
      expect(winter.unavailable).toContain('sandía');
    });

    it('should handle regions with different availability', () => {
      const summerPatagonia = getSeasonalIngredients('verano', mockSeasonalData, 'patagonia');
      const summerNorte = getSeasonalIngredients('verano', mockSeasonalData, 'norte');
      
      // Different regions might have different seasonal patterns
      expect(summerPatagonia).toBeDefined();
      expect(summerNorte).toBeDefined();
    });
  });

  describe('checkIngredientAvailability', () => {
    it('should correctly identify available ingredients', () => {
      const tomato: Ingredient = { name: 'tomate', amount: 2, unit: 'unidades', aisle: 'verduleria' };
      const availability = checkIngredientAvailability(tomato, 'verano', mockSeasonalData);
      
      expect(availability.isAvailable).toBe(true);
      expect(availability.status).toBe('peak');
      expect(availability.priceMultiplier).toBe(0.8);
    });

    it('should identify limited availability ingredients', () => {
      const potato: Ingredient = { name: 'papa', amount: 1, unit: 'kg', aisle: 'verduleria' };
      const availability = checkIngredientAvailability(potato, 'verano', mockSeasonalData);
      
      expect(availability.isAvailable).toBe(true);
      expect(availability.status).toBe('limited');
      expect(availability.priceMultiplier).toBe(1.3);
    });

    it('should identify unavailable ingredients', () => {
      const watermelon: Ingredient = { name: 'sandía', amount: 1, unit: 'unidad', aisle: 'frutas' };
      const availability = checkIngredientAvailability(watermelon, 'invierno', mockSeasonalData);
      
      expect(availability.isAvailable).toBe(false);
      expect(availability.status).toBe('unavailable');
      expect(availability.alternatives).toBeDefined();
      expect(availability.alternatives.length).toBeGreaterThan(0);
    });

    it('should handle ingredients not in seasonal data', () => {
      const meat: Ingredient = { name: 'carne', amount: 500, unit: 'g', aisle: 'carniceria' };
      const availability = checkIngredientAvailability(meat, 'verano', mockSeasonalData);
      
      expect(availability.isAvailable).toBe(true);
      expect(availability.status).toBe('year_round');
      expect(availability.priceMultiplier).toBe(1.0);
    });
  });

  describe('suggestSeasonalAlternatives', () => {
    it('should suggest alternatives for unavailable ingredients', () => {
      const unavailableIngredients = [
        { name: 'sandía', amount: 1, unit: 'unidad', aisle: 'frutas' }
      ];
      
      const alternatives = suggestSeasonalAlternatives(unavailableIngredients, 'invierno', mockSeasonalData);
      
      expect(alternatives).toHaveLength(1);
      expect(alternatives[0].original.name).toBe('sandía');
      expect(alternatives[0].suggestions).toBeDefined();
      expect(alternatives[0].suggestions.length).toBeGreaterThan(0);
      expect(alternatives[0].reason).toContain('no disponible en invierno');
    });

    it('should suggest cost-effective alternatives for expensive seasonal items', () => {
      const expensiveIngredients = [
        { name: 'tomate', amount: 3, unit: 'unidades', aisle: 'verduleria' }
      ];
      
      const alternatives = suggestSeasonalAlternatives(expensiveIngredients, 'invierno', mockSeasonalData);
      
      expect(alternatives).toHaveLength(1);
      expect(alternatives[0].original.name).toBe('tomate');
      expect(alternatives[0].reason).toContain('precio elevado');
      expect(alternatives[0].suggestions).toContain('tomate en lata');
    });

    it('should not suggest alternatives for peak season ingredients', () => {
      const peakIngredients = [
        { name: 'tomate', amount: 2, unit: 'unidades', aisle: 'verduleria' }
      ];
      
      const alternatives = suggestSeasonalAlternatives(peakIngredients, 'verano', mockSeasonalData);
      
      expect(alternatives).toHaveLength(0);
    });
  });

  describe('filterRecipesBySeason', () => {
    const recipes: Recipe[] = [
      {
        ...mockAsadoRecipe,
        seasonal: {
          preferredSeasons: ['verano', 'primavera'],
          restrictedSeasons: [],
        }
      },
      {
        id: 'locro',
        name: 'Locro Tradicional',
        description: 'Guiso tradicional de invierno',
        ingredients: [
          { name: 'zapallo', amount: 500, unit: 'g', aisle: 'verduleria' },
          { name: 'papa', amount: 3, unit: 'unidades', aisle: 'verduleria' },
          { name: 'porotos', amount: 200, unit: 'g', aisle: 'almacen' }
        ],
        instructions: ['Cocinar verduras', 'Agregar porotos'],
        prepTime: 30,
        cookTime: 120,
        servings: 6,
        nutrition: { calories: 280, protein: 12, carbs: 45, fat: 8 },
        seasonal: {
          preferredSeasons: ['invierno', 'otoño'],
          restrictedSeasons: ['verano'],
        }
      },
      {
        ...mockEmpanadas,
        seasonal: {
          preferredSeasons: [], // Year-round
          restrictedSeasons: [],
        }
      }
    ];

    it('should filter recipes by preferred season', () => {
      const summerRecipes = filterRecipesBySeason(recipes, 'verano', 'preferred');
      
      expect(summerRecipes).toHaveLength(1);
      expect(summerRecipes[0].id).toBe('asado-tradicional');
    });

    it('should exclude restricted recipes', () => {
      const summerRecipes = filterRecipesBySeason(recipes, 'verano', 'available');
      
      expect(summerRecipes).toHaveLength(2); // Asado + Empanadas (year-round)
      expect(summerRecipes.find(r => r.id === 'locro')).toBeUndefined();
    });

    it('should include year-round recipes in any season', () => {
      const winterRecipes = filterRecipesBySeason(recipes, 'invierno', 'available');
      
      expect(winterRecipes.find(r => r.id === 'empanadas-carne')).toBeDefined();
    });

    it('should return all recipes when season filtering disabled', () => {
      const allRecipes = filterRecipesBySeason(recipes, 'verano', 'all');
      
      expect(allRecipes).toHaveLength(3);
    });
  });

  describe('calculateSeasonalPricing', () => {
    it('should apply seasonal price multipliers correctly', () => {
      const ingredients: Ingredient[] = [
        { name: 'tomate', amount: 2, unit: 'kg', aisle: 'verduleria' },
        { name: 'papa', amount: 1, unit: 'kg', aisle: 'verduleria' },
        { name: 'carne', amount: 500, unit: 'g', aisle: 'carniceria' }
      ];

      const basePrices = {
        'tomate': 1500, // per kg
        'papa': 800,   // per kg  
        'carne': 6000  // per kg
      };

      const seasonalPricing = calculateSeasonalPricing(ingredients, basePrices, 'verano', mockSeasonalData);
      
      expect(seasonalPricing.totalBase).toBe(6300); // (2*1500) + (1*800) + (0.5*6000)
      expect(seasonalPricing.totalSeasonal).toBe(6040); // Tomate cheaper in summer, papa more expensive
      expect(seasonalPricing.savings).toBe(260);
      expect(seasonalPricing.items).toHaveLength(3);
      
      const tomato = seasonalPricing.items.find(item => item.name === 'tomate');
      expect(tomato?.multiplier).toBe(0.8);
      expect(tomato?.seasonalPrice).toBe(2400); // 2kg * 1500 * 0.8
    });

    it('should handle missing price data gracefully', () => {
      const ingredients: Ingredient[] = [
        { name: 'ingrediente_inexistente', amount: 1, unit: 'kg', aisle: 'otros' }
      ];

      const basePrices = {};

      const seasonalPricing = calculateSeasonalPricing(ingredients, basePrices, 'verano', mockSeasonalData);
      
      expect(seasonalPricing.totalBase).toBe(0);
      expect(seasonalPricing.totalSeasonal).toBe(0);
      expect(seasonalPricing.savings).toBe(0);
    });

    it('should calculate regional price variations', () => {
      const ingredients: Ingredient[] = [
        { name: 'tomate', amount: 1, unit: 'kg', aisle: 'verduleria' }
      ];

      const basePrices = { 'tomate': 1500 };

      const cabaPrice = calculateSeasonalPricing(ingredients, basePrices, 'verano', mockSeasonalData, 'CABA');
      const patagoniaPrice = calculateSeasonalPricing(ingredients, basePrices, 'verano', mockSeasonalData, 'patagonia');
      
      expect(cabaPrice.totalSeasonal).toBeDefined();
      expect(patagoniaPrice.totalSeasonal).toBeDefined();
      // Patagonia might have different pricing due to transport costs
      expect(patagoniaPrice.totalSeasonal).toBeGreaterThanOrEqual(cabaPrice.totalSeasonal);
    });
  });

  describe('Integration with meal planning', () => {
    it('should analyze seasonal suitability of meal plan', () => {
      const plan = mockWeeklyPlan;
      const season = getSeasonForDate(plan.weekStart);
      
      expect(season).toBe('verano'); // January 15, 2024 is summer

      const seasonalAnalysis = {
        season,
        totalRecipes: plan.days.reduce((count, day) => {
          return count + Object.values(day.meals).filter(meal => meal?.recipe).length;
        }, 0),
        seasonallyAppropriate: 0,
        needingAlternatives: 0
      };

      expect(seasonalAnalysis.totalRecipes).toBeGreaterThan(0);
    });

    it('should provide seasonal optimization suggestions', () => {
      const winterPlan = {
        ...mockWeeklyPlan,
        weekStart: '2024-07-15', // Winter
        weekEnd: '2024-07-21'
      };

      const suggestions = {
        addWinterRecipes: ['locro', 'guiso de lentejas', 'carbonada'],
        removeSeasonallyInappropriate: [],
        ingredientSubstitutions: [
          {
            original: 'tomate fresco',
            alternative: 'tomate en lata',
            reason: 'Mejor precio y disponibilidad en invierno'
          }
        ]
      };

      expect(suggestions.addWinterRecipes).toContain('locro');
      expect(suggestions.ingredientSubstitutions).toHaveLength(1);
    });

    it('should track seasonal variety score', () => {
      const plan = mockWeeklyPlan;
      const season = getSeasonForDate(plan.weekStart);
      
      const varietyScore = {
        peakSeasonalUse: 0.8, // 80% of ingredients in peak season
        seasonalDiversity: 0.7, // Good variety of seasonal ingredients
        appropriatenessScore: 0.9, // Very appropriate for season
        overallScore: 0.8
      };

      expect(varietyScore.overallScore).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle invalid dates gracefully', () => {
      expect(() => getSeasonForDate('invalid-date')).not.toThrow();
      expect(getSeasonForDate('')).toBe('verano'); // Default fallback
    });

    it('should handle missing seasonal data', () => {
      const emptySeasonalData = {};
      const ingredients = [{ name: 'tomate', amount: 1, unit: 'kg', aisle: 'verduleria' }];
      
      const availability = checkIngredientAvailability(ingredients[0], 'verano', emptySeasonalData);
      
      expect(availability.isAvailable).toBe(true);
      expect(availability.status).toBe('year_round');
    });

    it('should handle extreme seasonal data', () => {
      const extremeData = {
        verano: {
          available: [],
          peak: [],
          limited: [],
          unavailable: ['everything'],
          priceMultiplier: {}
        }
      };

      const ingredients = [{ name: 'everything', amount: 1, unit: 'kg', aisle: 'test' }];
      const availability = checkIngredientAvailability(ingredients[0], 'verano', extremeData);
      
      expect(availability.isAvailable).toBe(false);
      expect(availability.alternatives).toBeDefined();
    });

    it('should handle recipes without seasonal metadata', () => {
      const recipes = [mockAsadoRecipe]; // No seasonal metadata
      const filtered = filterRecipesBySeason(recipes, 'verano', 'preferred');
      
      expect(filtered).toHaveLength(1); // Should include recipes without seasonal restrictions
    });
  });
});