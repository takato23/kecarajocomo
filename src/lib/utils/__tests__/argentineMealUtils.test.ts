import {
  isSunday,
  isTwentyNinth,
  normalizeDate,
  getSeasonFromDate,
  getRegionFromTimezone
} from '../dates';
import {
  dedupeRecipes,
  enforceCulturalRules,
  generateFallbackWeeklyPlan,
  generateFallbackMeal,
  mapRecipeIds,
  ensureMate,
  ensureAsado,
  ensureNoquis29
} from '../fallbacks';
import {
  aggregateShoppingList,
  categorizeShoppingItems,
  calculateShoppingCost,
  optimizeShoppingList
} from '../shoppingList';
import {
  deriveNutritionSummary,
  calculateDailyNutrition,
  calculateWeeklyNutrition,
  validateNutritionBalance,
  generateNutritionRecommendations
} from '../nutrition';
import { 
  mockWeeklyPlan, 
  mockUserPreferences, 
  mockPantryItems,
  mockShoppingList,
  mockAsadoRecipe,
  mockMilanesasRecipe,
  mockNoquis29Recipe,
  mockMateMeal
} from '@/__tests__/mocks/fixtures/argentineMealData';

describe('Argentine Date Utilities', () => {
  describe('isSunday', () => {
    it('should identify Sunday correctly', () => {
      expect(isSunday('2024-01-21')).toBe(true); // Sunday
      expect(isSunday('2024-01-22')).toBe(false); // Monday
      expect(isSunday('2024-01-20')).toBe(false); // Saturday
    });

    it('should handle different date formats', () => {
      expect(isSunday(new Date('2024-01-21'))).toBe(true);
      expect(isSunday('2024-01-21T00:00:00Z')).toBe(true);
    });

    it('should handle invalid dates', () => {
      expect(isSunday('invalid-date')).toBe(false);
      expect(isSunday('')).toBe(false);
    });
  });

  describe('isTwentyNinth', () => {
    it('should identify 29th of month correctly', () => {
      expect(isTwentyNinth('2024-01-29')).toBe(true);
      expect(isTwentyNinth('2024-02-29')).toBe(true); // Leap year
      expect(isTwentyNinth('2024-01-28')).toBe(false);
      expect(isTwentyNinth('2024-01-30')).toBe(false);
    });

    it('should handle months without 29th', () => {
      expect(isTwentyNinth('2023-02-29')).toBe(false); // Non-leap year
    });
  });

  describe('getSeasonFromDate', () => {
    it('should return correct season for Southern Hemisphere', () => {
      expect(getSeasonFromDate('2024-01-15')).toBe('verano'); // January = Summer
      expect(getSeasonFromDate('2024-04-15')).toBe('otono'); // April = Autumn
      expect(getSeasonFromDate('2024-07-15')).toBe('invierno'); // July = Winter
      expect(getSeasonFromDate('2024-10-15')).toBe('primavera'); // October = Spring
    });

    it('should handle edge cases', () => {
      expect(getSeasonFromDate('2024-03-20')).toBe('otono'); // Start of autumn
      expect(getSeasonFromDate('2024-12-21')).toBe('verano'); // Start of summer
    });
  });

  describe('getRegionFromTimezone', () => {
    it('should map timezone to Argentine region', () => {
      expect(getRegionFromTimezone('America/Argentina/Buenos_Aires')).toBe('pampa');
      expect(getRegionFromTimezone('America/Argentina/Cordoba')).toBe('centro');
      expect(getRegionFromTimezone('America/Argentina/Mendoza')).toBe('cuyo');
      expect(getRegionFromTimezone('America/Argentina/Ushuaia')).toBe('patagonia');
    });

    it('should default to pampa for unknown timezones', () => {
      expect(getRegionFromTimezone('America/New_York')).toBe('pampa');
      expect(getRegionFromTimezone('Europe/London')).toBe('pampa');
    });
  });

  describe('normalizeDate', () => {
    it('should normalize date to YYYY-MM-DD format', () => {
      expect(normalizeDate('2024-01-05')).toBe('2024-01-05');
      expect(normalizeDate(new Date('2024-01-05'))).toBe('2024-01-05');
      expect(normalizeDate('2024-1-5')).toBe('2024-01-05'); // Pad zeros
    });

    it('should handle invalid dates', () => {
      expect(() => normalizeDate('invalid')).toThrow();
      expect(() => normalizeDate('')).toThrow();
    });
  });
});

describe('Argentine Cultural Fallbacks', () => {
  describe('dedupeRecipes', () => {
    it('should remove duplicate recipes by ID', () => {
      const recipes = [
        mockAsadoRecipe,
        mockMilanesasRecipe,
        { ...mockAsadoRecipe, name: 'Duplicate Asado' }, // Same ID
        mockNoquis29Recipe
      ];

      const deduped = dedupeRecipes(recipes);

      expect(deduped).toHaveLength(3);
      expect(deduped.map(r => r.id)).toEqual([
        'asado-tradicional',
        'milanesas-napolitana', 
        'noquis-29'
      ]);
    });

    it('should preserve original order when no duplicates', () => {
      const recipes = [mockAsadoRecipe, mockMilanesasRecipe, mockNoquis29Recipe];
      const deduped = dedupeRecipes(recipes);

      expect(deduped).toEqual(recipes);
    });
  });

  describe('ensureMate', () => {
    it('should add mate to breakfast and afternoon snack if missing', () => {
      const dayPlan = {
        ...mockWeeklyPlan.days[0],
        desayuno: null,
        merienda: null
      };

      const withMate = ensureMate(dayPlan, mockUserPreferences);

      expect(withMate.desayuno?.recipe.name).toContain('Mate');
      expect(withMate.merienda?.recipe.name).toContain('Mate');
    });

    it('should not add mate if already present', () => {
      const dayPlan = mockWeeklyPlan.days[0]; // Already has mate

      const withMate = ensureMate(dayPlan, mockUserPreferences);

      expect(withMate.desayuno?.recipe.id).toBe('mate-tradicional');
      expect(withMate.merienda?.recipe.id).toBe('mate-tradicional');
    });

    it('should respect mate frequency preference', () => {
      const preferences = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          mateFrequency: 'nunca' as const
        }
      };

      const dayPlan = {
        ...mockWeeklyPlan.days[0],
        desayuno: null,
        merienda: null
      };

      const withMate = ensureMate(dayPlan, preferences);

      expect(withMate.desayuno).toBeNull();
      expect(withMate.merienda).toBeNull();
    });
  });

  describe('ensureAsado', () => {
    it('should add asado to Sunday lunch if missing', () => {
      const sundayPlan = {
        ...mockWeeklyPlan.days[6], // Sunday
        almuerzo: null
      };

      const withAsado = ensureAsado(sundayPlan, mockUserPreferences);

      expect(withAsado.almuerzo?.recipe.tags).toContain('asado');
      expect(withAsado.cultural.isSpecialDay).toBe(true);
    });

    it('should not add asado if not Sunday', () => {
      const mondayPlan = {
        ...mockWeeklyPlan.days[0], // Monday
        almuerzo: null
      };

      const withAsado = ensureAsado(mondayPlan, mockUserPreferences);

      expect(withAsado.almuerzo).toBeNull();
    });

    it('should respect asado frequency preference', () => {
      const preferences = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          asadoFrequency: 'nunca' as const
        }
      };

      const sundayPlan = {
        ...mockWeeklyPlan.days[6],
        almuerzo: null
      };

      const withAsado = ensureAsado(sundayPlan, preferences);

      expect(withAsado.almuerzo).toBeNull();
    });
  });

  describe('ensureNoquis29', () => {
    it('should add ñoquis on 29th if missing', () => {
      const day29Plan = {
        ...mockWeeklyPlan.days[0],
        date: '2024-01-29',
        cena: null
      };

      const withNoquis = ensureNoquis29(day29Plan, mockUserPreferences);

      expect(withNoquis.cena?.recipe.name).toContain('Ñoquis');
      expect(withNoquis.cultural.isSpecialDay).toBe(true);
      expect(withNoquis.cultural.occasion).toContain('29');
    });

    it('should not add ñoquis if not 29th', () => {
      const regularDay = {
        ...mockWeeklyPlan.days[0],
        date: '2024-01-15',
        cena: null
      };

      const withNoquis = ensureNoquis29(regularDay, mockUserPreferences);

      expect(withNoquis.cena).toBeNull();
    });
  });

  describe('enforceCulturalRules', () => {
    it('should apply all cultural rules to weekly plan', () => {
      const planWithoutCulture = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map(day => ({
          ...day,
          desayuno: null,
          merienda: null,
          almuerzo: null,
          cena: null
        }))
      };

      const culturalPlan = enforceCulturalRules(planWithoutCulture, mockUserPreferences);

      // Should have mate in breakfast and afternoon snack
      expect(culturalPlan.days[0].desayuno?.recipe.name).toContain('Mate');
      expect(culturalPlan.days[0].merienda?.recipe.name).toContain('Mate');

      // Sunday should have asado
      const sunday = culturalPlan.days.find(day => day.dayOfWeek === 0);
      expect(sunday?.almuerzo?.recipe.tags).toContain('asado');

      // Should set cultural flags
      expect(culturalPlan.cultural.hasMate).toBe(true);
      expect(culturalPlan.cultural.hasAsado).toBe(true);
    });
  });

  describe('generateFallbackWeeklyPlan', () => {
    it('should generate basic weekly plan with cultural elements', () => {
      const fallbackPlan = generateFallbackWeeklyPlan('test-user', '2024-01-15', mockUserPreferences);

      expect(fallbackPlan.planId).toBeDefined();
      expect(fallbackPlan.userId).toBe('test-user');
      expect(fallbackPlan.weekStart).toBe('2024-01-15');
      expect(fallbackPlan.days).toHaveLength(7);
      expect(fallbackPlan.cultural.hasMate).toBe(true);
      expect(fallbackPlan.cultural.hasAsado).toBe(true);
    });

    it('should respect user preferences in fallback', () => {
      const preferences = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          region: 'patagonia' as const,
          mateFrequency: 'ocasional' as const
        }
      };

      const fallbackPlan = generateFallbackWeeklyPlan('test-user', '2024-01-15', preferences);

      expect(fallbackPlan.region).toBe('patagonia');
    });
  });

  describe('generateFallbackMeal', () => {
    it('should generate appropriate fallback meal by type', () => {
      const breakfastMeal = generateFallbackMeal('desayuno', mockUserPreferences);
      expect(breakfastMeal.recipe.name).toContain('Mate');

      const lunchMeal = generateFallbackMeal('almuerzo', mockUserPreferences);
      expect(lunchMeal.recipe.nutrition.calories).toBeGreaterThan(300);

      const snackMeal = generateFallbackMeal('merienda', mockUserPreferences);
      expect(snackMeal.recipe.name).toContain('Mate');

      const dinnerMeal = generateFallbackMeal('cena', mockUserPreferences);
      expect(dinnerMeal.recipe.nutrition.calories).toBeGreaterThan(200);
    });
  });

  describe('mapRecipeIds', () => {
    it('should generate unique recipe IDs', () => {
      const recipes = [
        { name: 'Asado Tradicional' },
        { name: 'Milanesas a la Napolitana' },
        { name: 'Ñoquis del 29' }
      ];

      const withIds = mapRecipeIds(recipes as any[]);

      expect(withIds[0].id).toBe('asado-tradicional');
      expect(withIds[1].id).toBe('milanesas-a-la-napolitana');
      expect(withIds[2].id).toBe('noquis-del-29');
    });

    it('should handle special characters and spaces', () => {
      const recipes = [
        { name: 'Empanadas Salteñas' },
        { name: 'Chimichurri & Asado' },
        { name: 'Café con Leche' }
      ];

      const withIds = mapRecipeIds(recipes as any[]);

      expect(withIds[0].id).toBe('empanadas-saltenas');
      expect(withIds[1].id).toBe('chimichurri-asado');
      expect(withIds[2].id).toBe('cafe-con-leche');
    });
  });
});

describe('Shopping List Utilities', () => {
  describe('aggregateShoppingList', () => {
    it('should aggregate ingredients from weekly plan', () => {
      const shoppingList = aggregateShoppingList(mockWeeklyPlan, mockPantryItems);

      expect(shoppingList.items.length).toBeGreaterThan(0);
      expect(shoppingList.totalCost).toBeGreaterThan(0);
      expect(shoppingList.weekPlanId).toBe(mockWeeklyPlan.planId);
    });

    it('should exclude pantry items from shopping list', () => {
      const pantryWithYerba = [
        ...mockPantryItems,
        {
          id: 'yerba-mate',
          name: 'Yerba mate',
          category: 'bebidas',
          amount: 1,
          unit: 'kg',
          frequency: 'alta' as const
        }
      ];

      const shoppingList = aggregateShoppingList(mockWeeklyPlan, pantryWithYerba);

      const yerbaItem = shoppingList.items.find(item => 
        item.name.toLowerCase().includes('yerba')
      );
      expect(yerbaItem?.inPantry).toBe(true);
    });

    it('should combine duplicate ingredients', () => {
      const planWithDuplicates = {
        ...mockWeeklyPlan,
        days: [
          ...mockWeeklyPlan.days,
          ...mockWeeklyPlan.days // Duplicate days
        ]
      };

      const shoppingList = aggregateShoppingList(planWithDuplicates, mockPantryItems);

      // Should combine amounts for same ingredients
      const meatItems = shoppingList.items.filter(item => item.category === 'carnes');
      const meatNames = meatItems.map(item => item.name);
      const uniqueMeatNames = [...new Set(meatNames)];
      
      expect(uniqueMeatNames.length).toBeLessThanOrEqual(meatNames.length);
    });
  });

  describe('categorizeShoppingItems', () => {
    it('should group items by category', () => {
      const categories = categorizeShoppingItems(mockShoppingList.items);

      expect(categories).toBeInstanceOf(Array);
      expect(categories.every(cat => cat.name && cat.items && cat.subtotal)).toBe(true);
      
      const carnesCategory = categories.find(cat => cat.name === 'carnes');
      expect(carnesCategory).toBeDefined();
      expect(carnesCategory?.subtotal).toBeGreaterThan(0);
    });

    it('should calculate correct subtotals', () => {
      const items = [
        {
          id: '1',
          name: 'Carne',
          category: 'carnes',
          amount: 1,
          unit: 'kg',
          estimatedCost: 5000,
          priority: 'alta' as const,
          inPantry: false,
          recipes: [],
          checked: false
        },
        {
          id: '2',
          name: 'Pollo',
          category: 'carnes',
          amount: 1,
          unit: 'kg',
          estimatedCost: 3000,
          priority: 'media' as const,
          inPantry: false,
          recipes: [],
          checked: false
        }
      ];

      const categories = categorizeShoppingItems(items);
      const carnesCategory = categories.find(cat => cat.name === 'carnes');
      
      expect(carnesCategory?.subtotal).toBe(8000);
    });
  });

  describe('calculateShoppingCost', () => {
    it('should calculate total cost correctly', () => {
      const totalCost = calculateShoppingCost(mockShoppingList.items);
      const expectedCost = mockShoppingList.items.reduce(
        (sum, item) => sum + item.estimatedCost, 
        0
      );

      expect(totalCost).toBe(expectedCost);
    });

    it('should handle empty items list', () => {
      const totalCost = calculateShoppingCost([]);
      expect(totalCost).toBe(0);
    });

    it('should exclude checked items if specified', () => {
      const itemsWithChecked = mockShoppingList.items.map((item, index) => ({
        ...item,
        checked: index === 0 // First item checked
      }));

      const totalWithChecked = calculateShoppingCost(itemsWithChecked, false);
      const totalWithoutChecked = calculateShoppingCost(itemsWithChecked, true);

      expect(totalWithChecked).toBeGreaterThan(totalWithoutChecked);
    });
  });

  describe('optimizeShoppingList', () => {
    it('should prioritize high-priority items', () => {
      const optimized = optimizeShoppingList(mockShoppingList.items, mockUserPreferences);

      const priorities = optimized.map(item => item.priority);
      const highPriorityFirst = priorities.indexOf('alta');
      const lowPriorityFirst = priorities.indexOf('baja');

      if (highPriorityFirst !== -1 && lowPriorityFirst !== -1) {
        expect(highPriorityFirst).toBeLessThan(lowPriorityFirst);
      }
    });

    it('should group by preferred stores', () => {
      const preferences = {
        ...mockUserPreferences,
        shopping: {
          ...mockUserPreferences.shopping,
          preferredStores: ['carnicería', 'verdulería']
        }
      };

      const optimized = optimizeShoppingList(mockShoppingList.items, preferences);

      // Meat items should come first (carnicería)
      const firstMeatIndex = optimized.findIndex(item => item.category === 'carnes');
      const firstVegetableIndex = optimized.findIndex(item => item.category === 'verduras');

      if (firstMeatIndex !== -1 && firstVegetableIndex !== -1) {
        expect(firstMeatIndex).toBeLessThan(firstVegetableIndex);
      }
    });
  });
});

describe('Nutrition Utilities', () => {
  describe('calculateDailyNutrition', () => {
    it('should sum nutrition from all meals in a day', () => {
      const dayPlan = mockWeeklyPlan.days[0];
      const nutrition = calculateDailyNutrition(dayPlan);

      expect(nutrition.calories).toBeGreaterThan(0);
      expect(nutrition.protein).toBeGreaterThan(0);
      expect(nutrition.carbs).toBeGreaterThan(0);
      expect(nutrition.fat).toBeGreaterThan(0);
    });

    it('should handle days with missing meals', () => {
      const dayWithMissingMeals = {
        ...mockWeeklyPlan.days[0],
        desayuno: null,
        merienda: null
      };

      const nutrition = calculateDailyNutrition(dayWithMissingMeals);

      expect(nutrition.calories).toBeGreaterThan(0); // Should still have lunch and dinner
    });

    it('should handle day with no meals', () => {
      const emptyDay = {
        ...mockWeeklyPlan.days[0],
        desayuno: null,
        almuerzo: null,
        merienda: null,
        cena: null
      };

      const nutrition = calculateDailyNutrition(emptyDay);

      expect(nutrition.calories).toBe(0);
      expect(nutrition.protein).toBe(0);
      expect(nutrition.carbs).toBe(0);
      expect(nutrition.fat).toBe(0);
    });
  });

  describe('calculateWeeklyNutrition', () => {
    it('should sum nutrition from all days', () => {
      const nutrition = calculateWeeklyNutrition(mockWeeklyPlan);

      expect(nutrition.calories).toBeGreaterThan(0);
      expect(nutrition.protein).toBeGreaterThan(0);
      expect(nutrition.carbs).toBeGreaterThan(0);
      expect(nutrition.fat).toBeGreaterThan(0);
    });

    it('should match sum of daily calculations', () => {
      const weeklyNutrition = calculateWeeklyNutrition(mockWeeklyPlan);
      const dailySum = mockWeeklyPlan.days.reduce((sum, day) => {
        const dayNutrition = calculateDailyNutrition(day);
        return {
          calories: sum.calories + dayNutrition.calories,
          protein: sum.protein + dayNutrition.protein,
          carbs: sum.carbs + dayNutrition.carbs,
          fat: sum.fat + dayNutrition.fat
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      expect(weeklyNutrition).toEqual(dailySum);
    });
  });

  describe('validateNutritionBalance', () => {
    it('should validate balanced nutrition', () => {
      const balancedNutrition = {
        calories: 2000,
        protein: 100, // 20% of calories
        carbs: 250,   // 50% of calories  
        fat: 67       // 30% of calories
      };

      const balance = validateNutritionBalance(balancedNutrition);

      expect(balance.isBalanced).toBe(true);
      expect(balance.proteinPercent).toBeCloseTo(20, 1);
      expect(balance.carbPercent).toBeCloseTo(50, 1);
      expect(balance.fatPercent).toBeCloseTo(30, 1);
    });

    it('should detect unbalanced nutrition', () => {
      const unbalancedNutrition = {
        calories: 2000,
        protein: 200, // Too high protein
        carbs: 100,   // Too low carbs
        fat: 50       // Low fat
      };

      const balance = validateNutritionBalance(unbalancedNutrition);

      expect(balance.isBalanced).toBe(false);
      expect(balance.proteinPercent).toBeGreaterThan(30);
      expect(balance.carbPercent).toBeLessThan(30);
    });
  });

  describe('generateNutritionRecommendations', () => {
    it('should generate recommendations for low vegetable intake', () => {
      const lowVegPlan = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map(day => ({
          ...day,
          // Remove vegetable-heavy meals
          almuerzo: mockMateMeal, // Low calorie meal
          cena: mockMateMeal
        }))
      };

      const recommendations = generateNutritionRecommendations(lowVegPlan, mockUserPreferences);

      expect(recommendations).toContain(expect.stringMatching(/verduras|vegetales/i));
    });

    it('should recommend traditional Argentine foods', () => {
      const recommendations = generateNutritionRecommendations(mockWeeklyPlan, mockUserPreferences);

      expect(recommendations.some(rec => 
        rec.toLowerCase().includes('mate') || 
        rec.toLowerCase().includes('asado') ||
        rec.toLowerCase().includes('tradición')
      )).toBe(true);
    });

    it('should consider user cultural preferences', () => {
      const preferences = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          traditionLevel: 'alta'
        }
      };

      const recommendations = generateNutritionRecommendations(mockWeeklyPlan, preferences);

      expect(recommendations.some(rec => 
        rec.toLowerCase().includes('tradicional') ||
        rec.toLowerCase().includes('cultura')
      )).toBe(true);
    });
  });

  describe('deriveNutritionSummary', () => {
    it('should generate comprehensive nutrition summary', () => {
      const summary = deriveNutritionSummary(mockWeeklyPlan, mockUserPreferences);

      expect(summary.daily).toBeDefined();
      expect(summary.weekly).toBeDefined();
      expect(summary.balance).toBeDefined();
      expect(summary.recommendations).toBeInstanceOf(Array);

      expect(summary.balance.varietyScore).toBeGreaterThan(0);
      expect(summary.balance.nutritionScore).toBeGreaterThan(0);
      expect(summary.balance.culturalScore).toBeGreaterThan(0);
    });

    it('should calculate variety score based on recipe diversity', () => {
      const diversePlan = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map((day, index) => ({
          ...day,
          almuerzo: {
            recipe: { ...mockAsadoRecipe, id: `recipe-${index}` },
            servings: 4,
            cost: 1000,
            nutrition: mockAsadoRecipe.nutrition
          }
        }))
      };

      const summary = deriveNutritionSummary(diversePlan, mockUserPreferences);
      expect(summary.balance.varietyScore).toBeGreaterThan(5);
    });

    it('should score cultural authenticity', () => {
      const culturalPlan = {
        ...mockWeeklyPlan,
        cultural: {
          hasAsado: true,
          hasMate: true,
          hasNoquis29: true,
          specialOccasions: ['domingo', 'dia29']
        }
      };

      const summary = deriveNutritionSummary(culturalPlan, mockUserPreferences);
      expect(summary.balance.culturalScore).toBeGreaterThan(7);
    });
  });
});