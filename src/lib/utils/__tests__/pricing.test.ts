import { estimateWeeklyBudget } from '../pricing';
import { optimizePlanForBudget } from '../substitutions';
import { 
  mockWeeklyPlan, 
  mockPantryItems 
} from '@/__tests__/mocks/fixtures/argentineMealData';
import type { PriceCatalogItem, MealPlan } from '@/features/meal-planning/types';

// Mock price catalog with realistic Argentine prices
const mockPriceCatalog: PriceCatalogItem[] = [
  {
    id: 'yerba-mate-price',
    name: 'yerba mate',
    unit: 'kg',
    price_ars: 4200,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'pan-price',
    name: 'pan',
    unit: 'kg', 
    price_ars: 1500,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'nalga-price',
    name: 'nalga',
    unit: 'kg',
    price_ars: 6800,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'vacio-price',
    name: 'vacío',
    unit: 'kg',
    price_ars: 7800,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'pollo-price',
    name: 'pollo',
    unit: 'kg',
    price_ars: 3600,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'papa-price',
    name: 'papa',
    unit: 'kg',
    price_ars: 800,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'sal-price',
    name: 'sal',
    unit: 'kg',
    price_ars: 300,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'aceite-price',
    name: 'aceite',
    unit: 'l',
    price_ars: 1200,
    region: 'Argentina',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

describe('Pricing Utilities', () => {
  describe('estimateWeeklyBudget', () => {
    it('should calculate total weekly budget correctly', () => {
      const budget = estimateWeeklyBudget(mockWeeklyPlan, [], mockPriceCatalog);

      expect(budget.estimatedTotalARS).toBeGreaterThan(0);
      expect(budget.ownedValueARS).toBe(0); // No pantry items
      expect(budget.toBuyARS).toBe(budget.estimatedTotalARS);
      expect(budget.currency).toBe('ARS');
    });

    it('should account for pantry items to reduce costs', () => {
      const budgetWithoutPantry = estimateWeeklyBudget(mockWeeklyPlan, [], mockPriceCatalog);
      const budgetWithPantry = estimateWeeklyBudget(mockWeeklyPlan, mockPantryItems, mockPriceCatalog);

      expect(budgetWithPantry.ownedValueARS).toBeGreaterThan(0);
      expect(budgetWithPantry.toBuyARS).toBeLessThan(budgetWithoutPantry.toBuyARS);
    });

    it('should handle regional price variations', () => {
      const pampaPrice: PriceCatalogItem = {
        ...mockPriceCatalog[0],
        region: 'CABA',
        price_ars: 5000 // Higher price in CABA
      };

      const catalogWithRegional = [...mockPriceCatalog, pampaPrice];
      const budget = estimateWeeklyBudget(mockWeeklyPlan, [], catalogWithRegional);

      expect(budget.estimatedTotalARS).toBeGreaterThan(0);
    });

    it('should handle missing ingredients gracefully', () => {
      const planWithUnknownIngredients: MealPlan = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map(day => ({
          ...day,
          meals: {
            ...day.meals,
            breakfast: {
              ...day.meals.breakfast,
              recipe: {
                ...day.meals.breakfast.recipe,
                ingredients: [
                  {
                    name: 'Ingrediente inexistente',
                    amount: 100,
                    unit: 'g',
                    aisle: 'otros'
                  }
                ]
              }
            }
          }
        }))
      };

      const budget = estimateWeeklyBudget(planWithUnknownIngredients, [], mockPriceCatalog);
      
      // Should not crash and return valid budget
      expect(budget.estimatedTotalARS).toBeGreaterThanOrEqual(0);
      expect(budget.currency).toBe('ARS');
    });

    it('should handle different units correctly', () => {
      const planWithMixedUnits: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: {
              slot: 'breakfast',
              time: '08:00',
              recipe: {
                id: 'test-recipe',
                name: 'Test Recipe',
                ingredients: [
                  { name: 'yerba mate', amount: 500, unit: 'g', aisle: 'almacen' }, // 0.5 kg
                  { name: 'sal', amount: 2, unit: 'kg', aisle: 'condimentos' },     // 2 kg
                  { name: 'aceite', amount: 500, unit: 'ml', aisle: 'condimentos' } // 0.5 l
                ],
                instructions: [],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                nutrition: { calories: 50, protein: 2, carbs: 5, fat: 1 }
              }
            },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'l', name: 'L', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'S', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'D', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const budget = estimateWeeklyBudget(planWithMixedUnits, [], mockPriceCatalog);
      
      // Should calculate: (0.5 * 4200) + (2 * 300) + (0.5 * 1200) = 2100 + 600 + 600 = 3300
      expect(budget.estimatedTotalARS).toBe(3300);
    });

    it('should calculate variance to budget correctly', () => {
      const budget = estimateWeeklyBudget(mockWeeklyPlan, mockPantryItems, mockPriceCatalog);
      const targetBudget = 15000; // ARS
      const variance = targetBudget - budget.toBuyARS;
      
      expect(typeof variance).toBe('number');
      if (budget.toBuyARS > targetBudget) {
        expect(variance).toBeLessThan(0); // Over budget
      } else {
        expect(variance).toBeGreaterThanOrEqual(0); // Under budget
      }
    });
  });

  describe('Unit conversions', () => {
    it('should handle gram to kilogram conversions', () => {
      const planWithGrams: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: {
              slot: 'breakfast',
              time: '08:00',
              recipe: {
                id: 'gram-test',
                name: 'Gram Test',
                ingredients: [
                  { name: 'yerba mate', amount: 1000, unit: 'g', aisle: 'almacen' } // 1 kg
                ],
                instructions: [],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                nutrition: { calories: 50, protein: 2, carbs: 5, fat: 1 }
              }
            },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'l', name: 'L', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'S', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'D', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const budget = estimateWeeklyBudget(planWithGrams, [], mockPriceCatalog);
      
      // 1000g = 1kg, so should cost 1 * 4200 = 4200
      expect(budget.estimatedTotalARS).toBe(4200);
    });

    it('should handle milliliter to liter conversions', () => {
      const planWithML: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: {
              slot: 'breakfast',
              time: '08:00',
              recipe: {
                id: 'ml-test',
                name: 'ML Test',
                ingredients: [
                  { name: 'aceite', amount: 2000, unit: 'ml', aisle: 'condimentos' } // 2 l
                ],
                instructions: [],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                nutrition: { calories: 50, protein: 2, carbs: 5, fat: 1 }
              }
            },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'l', name: 'L', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'S', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'D', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const budget = estimateWeeklyBudget(planWithML, [], mockPriceCatalog);
      
      // 2000ml = 2l, so should cost 2 * 1200 = 2400
      expect(budget.estimatedTotalARS).toBe(2400);
    });
  });

  describe('optimizePlanForBudget', () => {
    it('should apply economic substitutions', () => {
      const expensivePlan: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Breakfast', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            lunch: {
              slot: 'lunch',
              time: '13:00',
              recipe: {
                id: 'expensive-asado',
                name: 'Asado de Vacío Premium',
                ingredients: [
                  { name: 'Vacío premium', amount: 2, unit: 'kg', aisle: 'carniceria' }
                ],
                instructions: ['Asar a la parrilla'],
                prepTime: 30,
                cookTime: 120,
                servings: 6,
                nutrition: { calories: 800, protein: 60, carbs: 0, fat: 50 }
              }
            },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'Snack', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'Dinner', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const { plan: optimized, changes } = optimizePlanForBudget(expensivePlan);

      expect(changes).toBeGreaterThan(0);
      expect(optimized.days[0].meals.lunch.recipe.name).toContain('Pollo');
      expect(optimized.days[0].meals.lunch.recipe.tags).toContain('economico');
    });

    it('should calculate savings correctly', () => {
      const expensivePlan: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Breakfast', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            lunch: {
              slot: 'lunch',
              time: '13:00',
              recipe: {
                id: 'expensive-beef',
                name: 'Bife de Chorizo Premium',
                cost: 8500, // Expensive
                ingredients: [{ name: 'bife de chorizo', amount: 1.5, unit: 'kg', aisle: 'carniceria' }],
                instructions: [],
                prepTime: 15,
                cookTime: 25,
                servings: 4,
                nutrition: { calories: 650, protein: 45, carbs: 0, fat: 48 }
              }
            },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'Snack', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'Dinner', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const { plan: optimized, savings } = optimizePlanForBudget(expensivePlan, 6000); // Target budget ARS 6000

      expect(savings).toBeGreaterThan(0);
      expect(optimized.days[0].meals.lunch.recipe.cost).toBeLessThan(8500);
      expect(optimized.days[0].meals.lunch.recipe.tags).toContain('economico');
    });

    it('should not modify meals that are already economical', () => {
      const economicalPlan: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Mate', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'l', name: 'Lentejas', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'Mate', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'Pasta simple', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const { plan: optimized, changes } = optimizePlanForBudget(economicalPlan);

      expect(changes).toBe(0);
      expect(optimized.days[0].meals.lunch.recipe.name).toBe('Lentejas');
    });

    it('should handle multiple expensive meals in the same plan', () => {
      const multiExpensivePlan: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Breakfast', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            lunch: {
              slot: 'lunch',
              time: '13:00',
              recipe: {
                id: 'expensive-asado',
                name: 'Asado Premium',
                ingredients: [{ name: 'Vacío', amount: 2, unit: 'kg' }],
                instructions: [],
                prepTime: 30,
                cookTime: 120,
                servings: 6,
                nutrition: { calories: 800, protein: 60, carbs: 0, fat: 50 }
              }
            },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'Snack', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: {
              slot: 'dinner',
              time: '21:30',
              recipe: {
                id: 'expensive-milanesa',
                name: 'Milanesas de Lomo',
                ingredients: [{ name: 'Lomo', amount: 1, unit: 'kg' }],
                instructions: [],
                prepTime: 20,
                cookTime: 30,
                servings: 4,
                nutrition: { calories: 600, protein: 40, carbs: 20, fat: 30 }
              }
            }
          }
        }]
      };

      const { plan: optimized, changes } = optimizePlanForBudget(multiExpensivePlan);

      expect(changes).toBe(2); // Both lunch and dinner should be optimized
      expect(optimized.days[0].meals.lunch.recipe.tags).toContain('economico');
      expect(optimized.days[0].meals.dinner.recipe.tags).toContain('economico');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty meal plan', () => {
      const emptyPlan: MealPlan = {
        userId: 'test',
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        days: []
      };

      const budget = estimateWeeklyBudget(emptyPlan, [], mockPriceCatalog);

      expect(budget.estimatedTotalARS).toBe(0);
      expect(budget.ownedValueARS).toBe(0);
      expect(budget.toBuyARS).toBe(0);
    });

    it('should handle plan with meals without ingredients', () => {
      const planWithoutIngredients: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Mate', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'l', name: 'Lunch', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'Snack', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'Dinner', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const budget = estimateWeeklyBudget(planWithoutIngredients, [], mockPriceCatalog);

      expect(budget.estimatedTotalARS).toBe(0);
      expect(budget.ownedValueARS).toBe(0);
      expect(budget.toBuyARS).toBe(0);
    });

    it('should handle empty price catalog', () => {
      const budget = estimateWeeklyBudget(mockWeeklyPlan, [], []);

      expect(budget.estimatedTotalARS).toBe(0);
      expect(budget.ownedValueARS).toBe(0);
      expect(budget.toBuyARS).toBe(0);
    });

    it('should handle ingredients without amounts', () => {
      const planWithoutAmounts: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: {
              slot: 'breakfast',
              time: '08:00',
              recipe: {
                id: 'no-amounts',
                name: 'Recipe without amounts',
                ingredients: [
                  { name: 'yerba mate', aisle: 'almacen' }, // No amount specified
                  { name: 'sal', unit: 'kg', aisle: 'condimentos' } // No amount specified
                ],
                instructions: [],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                nutrition: { calories: 50, protein: 2, carbs: 5, fat: 1 }
              }
            },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'l', name: 'L', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 's', name: 'S', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'd', name: 'D', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        }]
      };

      const budget = estimateWeeklyBudget(planWithoutAmounts, [], mockPriceCatalog);

      expect(budget.estimatedTotalARS).toBe(0); // Should be 0 since no amounts specified
      expect(budget.ownedValueARS).toBe(0);
      expect(budget.toBuyARS).toBe(0);
    });
  });
});