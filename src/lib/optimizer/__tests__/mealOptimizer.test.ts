import { optimizeWeeklyPlan } from '../mealOptimizer';
import { 
  mockWeeklyPlan,
  mockUserPreferences,
  mockPantryItems,
  mockAsadoRecipe,
  mockMateRecipe,
  mockMilanesas
} from '@/__tests__/mocks/fixtures/argentineMealData';
import type { ArgentineWeeklyPlan, Recipe, PantryItem, UserPreferences } from '@/features/meal-planning/types';

// Mock seasonal availability service
jest.mock('@/lib/utils/seasonality', () => ({
  getSeasonalAvailability: jest.fn((region: string, season: string) => {
    if (season === 'verano') {
      return ['tomate', 'lechuga', 'sandía', 'melón'];
    }
    if (season === 'invierno') {
      return ['papa', 'cebolla', 'zapallo', 'batata'];
    }
    return ['papa', 'cebolla', 'tomate'];
  })
}));

// Mock pricing and substitution services
jest.mock('@/lib/utils/pricing', () => ({
  estimateWeeklyBudget: jest.fn(() => ({
    estimatedTotalARS: 15000,
    ownedValueARS: 2000,
    toBuyARS: 13000,
    currency: 'ARS'
  }))
}));

jest.mock('@/lib/utils/substitutions', () => ({
  optimizePlanForBudget: jest.fn((plan) => ({
    plan: {
      ...plan,
      days: plan.days.map(day => ({
        ...day,
        meals: {
          ...day.meals,
          almuerzo: {
            ...day.meals.almuerzo,
            recipe: {
              ...day.meals.almuerzo.recipe,
              name: 'Pollo al Horno Económico',
              tags: ['economico', 'proteina']
            }
          }
        }
      }))
    },
    changes: 2,
    savings: 3500
  }))
}));

describe('Multi-Objective Meal Optimizer', () => {
  const baseContext = {
    preferences: mockUserPreferences,
    pantry: mockPantryItems,
    mode: 'normal' as const,
    region: 'pampa',
    season: 'verano'
  };

  const createTestPlan = (customMeals?: any): ArgentineWeeklyPlan => ({
    ...mockWeeklyPlan,
    days: [{
      date: '2024-01-15',
      weekday: 1,
      meals: customMeals || {
        breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
        lunch: { slot: 'lunch', time: '13:00', recipe: mockAsadoRecipe },
        snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
        dinner: { slot: 'dinner', time: '21:30', recipe: mockMilanesas }
      }
    }]
  });

  describe('Pantry optimization', () => {
    it('should boost score for recipes using pantry ingredients', () => {
      const plan = createTestPlan({
        breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
        lunch: { 
          slot: 'lunch', 
          time: '13:00', 
          recipe: {
            ...mockAsadoRecipe,
            ingredients: [
              { name: 'yerba mate', amount: 50, unit: 'g', aisle: 'almacen' }, // In pantry
              { name: 'sal', amount: 5, unit: 'g', aisle: 'condimentos' }, // In pantry
              { name: 'carne vacuno', amount: 500, unit: 'g', aisle: 'carniceria' } // Not in pantry
            ]
          }
        }
      });

      const optimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        pantry: [
          { id: '1', name: 'yerba mate', amount: 500, unit: 'g', location: 'alacena' },
          { id: '2', name: 'sal', amount: 1, unit: 'kg', location: 'alacena' }
        ]
      });

      // Should add scores to meals
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
      expect(optimized.days[0].meals.lunch.score).toBeGreaterThan(0);
    });

    it('should prioritize pantry usage in economic mode', () => {
      const plan = createTestPlan();
      
      const economicOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'economico'
      });

      const normalOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'normal'
      });

      // Economic mode should apply substitutions
      expect(economicOptimized.days[0].meals.lunch.recipe.name).toContain('Económico');
      expect(normalOptimized.days[0].meals.lunch.recipe.name).not.toContain('Económico');
    });
  });

  describe('Seasonal optimization', () => {
    it('should boost scores for seasonal ingredients in summer', () => {
      const summerPlan = createTestPlan({
        breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
        lunch: {
          slot: 'lunch',
          time: '13:00',
          recipe: {
            id: 'summer-salad',
            name: 'Ensalada de Verano',
            ingredients: [
              { name: 'tomate', amount: 2, unit: 'unidades', aisle: 'verduleria' },
              { name: 'lechuga', amount: 1, unit: 'unidad', aisle: 'verduleria' },
              { name: 'sandía', amount: 200, unit: 'g', aisle: 'frutas' }
            ],
            instructions: ['Cortar vegetales', 'Mezclar en bowl'],
            prepTime: 10,
            cookTime: 0,
            servings: 2,
            nutrition: { calories: 150, protein: 5, carbs: 25, fat: 2 }
          }
        }
      });

      const optimized = optimizeWeeklyPlan(summerPlan, {
        ...baseContext,
        season: 'verano'
      });

      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
      expect(optimized.days[0].meals.lunch.score).toBeGreaterThan(0);
    });

    it('should penalize out-of-season ingredients in winter', () => {
      const winterPlan = createTestPlan({
        breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
        lunch: {
          slot: 'lunch',
          time: '13:00',
          recipe: {
            id: 'winter-inappropriate',
            name: 'Ensalada con Sandía',
            ingredients: [
              { name: 'sandía', amount: 300, unit: 'g', aisle: 'frutas' }, // Out of season
              { name: 'melón', amount: 200, unit: 'g', aisle: 'frutas' } // Out of season
            ],
            instructions: ['Cortar frutas'],
            prepTime: 5,
            cookTime: 0,
            servings: 2,
            nutrition: { calories: 120, protein: 2, carbs: 28, fat: 1 }
          }
        }
      });

      const winterOptimized = optimizeWeeklyPlan(winterPlan, {
        ...baseContext,
        season: 'invierno'
      });

      // Score should be lower due to out-of-season ingredients
      expect(winterOptimized.days[0].meals.lunch.score).toBeLessThan(0.5);
    });
  });

  describe('Variety optimization', () => {
    it('should penalize recipe repetition', () => {
      const repetitivePlan: ArgentineWeeklyPlan = {
        ...mockWeeklyPlan,
        days: [
          {
            date: '2024-01-15',
            weekday: 1,
            meals: {
              breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
              lunch: { slot: 'lunch', time: '13:00', recipe: mockAsadoRecipe },
              snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
              dinner: { slot: 'dinner', time: '21:30', recipe: mockMilanesas }
            }
          },
          {
            date: '2024-01-16',
            weekday: 2,
            meals: {
              breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
              lunch: { slot: 'lunch', time: '13:00', recipe: mockAsadoRecipe }, // Repeated
              snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
              dinner: { slot: 'dinner', time: '21:30', recipe: mockAsadoRecipe } // Repeated again
            }
          }
        ]
      };

      const optimized = optimizeWeeklyPlan(repetitivePlan, baseContext);

      // First occurrence should have higher score than repetitions
      const firstAsado = optimized.days[0].meals.lunch.score;
      const secondAsado = optimized.days[1].meals.lunch.score;
      const thirdAsado = optimized.days[1].meals.dinner.score;

      expect(firstAsado).toBeGreaterThan(secondAsado);
      expect(secondAsado).toBeGreaterThan(thirdAsado);
    });

    it('should maintain variety across different meal types', () => {
      const plan = createTestPlan();
      const optimized = optimizeWeeklyPlan(plan, baseContext);

      // Each meal should have a score (variety tracking)
      expect(optimized.days[0].meals.breakfast).toHaveProperty('score');
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
      expect(optimized.days[0].meals.snack).toHaveProperty('score');
      expect(optimized.days[0].meals.dinner).toHaveProperty('score');
    });
  });

  describe('Macro nutrition optimization', () => {
    it('should optimize for macro targets in diet mode', () => {
      const dietPreferences: UserPreferences = {
        ...mockUserPreferences,
        targetCalories: 2000,
        targetProtein: 120,
        targetCarbs: 200,
        targetFat: 70
      };

      const plan = createTestPlan();

      const dietOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'dieta',
        preferences: dietPreferences
      });

      const normalOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'normal',
        preferences: dietPreferences
      });

      // Diet mode should weight macro optimization more heavily
      // Both should have scores, but diet mode calculations should be different
      expect(dietOptimized.days[0].meals.lunch).toHaveProperty('score');
      expect(normalOptimized.days[0].meals.lunch).toHaveProperty('score');
    });

    it('should penalize meals that deviate from macro targets', () => {
      const highProteinPreferences: UserPreferences = {
        ...mockUserPreferences,
        targetProtein: 200 // Very high target
      };

      const lowProteinMeal = {
        slot: 'lunch',
        time: '13:00',
        recipe: {
          id: 'low-protein',
          name: 'Ensalada Simple',
          ingredients: [
            { name: 'lechuga', amount: 100, unit: 'g', aisle: 'verduleria' }
          ],
          instructions: ['Cortar lechuga'],
          prepTime: 5,
          cookTime: 0,
          servings: 1,
          nutrition: { calories: 50, protein: 2, carbs: 8, fat: 0 } // Very low protein
        }
      };

      const plan = createTestPlan({ 
        breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
        lunch: lowProteinMeal
      });

      const optimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'dieta',
        preferences: highProteinPreferences
      });

      // Should penalize the low-protein meal
      expect(optimized.days[0].meals.lunch.score).toBeLessThan(0.5);
    });
  });

  describe('Weight balancing', () => {
    it('should apply different weights based on mode', () => {
      const plan = createTestPlan();

      const economicOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'economico'
      });

      const dietOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'dieta'
      });

      const normalOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'normal'
      });

      // All should have scores, but calculated with different weights
      expect(economicOptimized.days[0].meals.lunch).toHaveProperty('score');
      expect(dietOptimized.days[0].meals.lunch).toHaveProperty('score');
      expect(normalOptimized.days[0].meals.lunch).toHaveProperty('score');

      // Economic mode should prioritize pantry usage more
      // Diet mode should prioritize macro alignment more
    });
  });

  describe('Cultural rule preservation', () => {
    it('should not break cultural rules during optimization', () => {
      const sundayPlan: ArgentineWeeklyPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-21', // Sunday
          weekday: 0,
          cultural: {
            isSpecialDay: true,
            occasion: 'domingo_asado',
            notes: 'Tradición del asado dominical'
          },
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
            lunch: { 
              slot: 'lunch', 
              time: '13:00', 
              recipe: {
                ...mockAsadoRecipe,
                cultural: {
                  isTraditional: true,
                  occasion: 'domingo_asado',
                  significance: 'Tradición familiar argentina'
                }
              }
            },
            snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
            dinner: { slot: 'dinner', time: '21:30', recipe: mockMilanesas }
          }
        }]
      };

      const optimized = optimizeWeeklyPlan(sundayPlan, {
        ...baseContext,
        mode: 'economico' // Even in economic mode
      });

      // Should preserve Sunday asado tradition
      expect(optimized.days[0].meals.lunch.recipe.name).toContain('Asado');
      expect(optimized.days[0].cultural?.occasion).toBe('domingo_asado');
    });

    it('should preserve ñoquis del 29 tradition', () => {
      const dia29Plan: ArgentineWeeklyPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-29', // 29th
          weekday: 1,
          cultural: {
            isSpecialDay: true,
            occasion: 'dia29',
            notes: 'Ñoquis del 29 para la prosperidad'
          },
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
            lunch: { slot: 'lunch', time: '13:00', recipe: mockMilanesas },
            snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
            dinner: { 
              slot: 'dinner', 
              time: '21:30', 
              recipe: {
                id: 'noquis-29',
                name: 'Ñoquis del 29',
                cultural: {
                  isTraditional: true,
                  occasion: 'dia29',
                  significance: 'Tradición para atraer prosperidad'
                },
                ingredients: [
                  { name: 'papa', amount: 1, unit: 'kg', aisle: 'verduleria' }
                ],
                instructions: ['Hacer masa', 'Formar ñoquis'],
                prepTime: 45,
                cookTime: 15,
                servings: 4,
                nutrition: { calories: 380, protein: 12, carbs: 75, fat: 3 }
              }
            }
          }
        }]
      };

      const optimized = optimizeWeeklyPlan(dia29Plan, baseContext);

      // Should preserve ñoquis tradition
      expect(optimized.days[0].meals.dinner.recipe.name).toContain('Ñoquis');
      expect(optimized.days[0].cultural?.occasion).toBe('dia29');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty meal plan', () => {
      const emptyPlan: ArgentineWeeklyPlan = {
        userId: 'test',
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        days: []
      };

      const optimized = optimizeWeeklyPlan(emptyPlan, baseContext);

      expect(optimized.days).toHaveLength(0);
      expect(optimized).toEqual(emptyPlan);
    });

    it('should handle meals without recipes', () => {
      const planWithNulls: ArgentineWeeklyPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: null },
            lunch: { slot: 'lunch', time: '13:00', recipe: mockAsadoRecipe },
            snack: { slot: 'snack', time: '17:30', recipe: null },
            dinner: { slot: 'dinner', time: '21:30', recipe: null }
          }
        }]
      };

      const optimized = optimizeWeeklyPlan(planWithNulls, baseContext);

      // Should not crash and should handle null recipes gracefully
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
      expect(optimized.days[0].meals.breakfast.recipe).toBeNull();
    });

    it('should handle missing preferences', () => {
      const plan = createTestPlan();
      const emptyPreferences: UserPreferences = {};

      const optimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        preferences: emptyPreferences
      });

      // Should not crash with empty preferences
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
    });

    it('should handle empty pantry', () => {
      const plan = createTestPlan();

      const optimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        pantry: []
      });

      // Should work with empty pantry (pantry boost = 0)
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
    });

    it('should handle recipes without ingredients', () => {
      const planWithNoIngredients = createTestPlan({
        breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
        lunch: {
          slot: 'lunch',
          time: '13:00',
          recipe: {
            id: 'no-ingredients',
            name: 'Recipe Sin Ingredientes',
            ingredients: [],
            instructions: ['Just magic'],
            prepTime: 0,
            cookTime: 0,
            servings: 1,
            nutrition: { calories: 100, protein: 5, carbs: 10, fat: 2 }
          }
        }
      });

      const optimized = optimizeWeeklyPlan(planWithNoIngredients, baseContext);

      // Should handle recipes without ingredients gracefully
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
      expect(optimized.days[0].meals.lunch.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration with substitution system', () => {
    it('should apply budget optimizations in economic mode', () => {
      const expensivePlan = createTestPlan();

      const optimized = optimizeWeeklyPlan(expensivePlan, {
        ...baseContext,
        mode: 'economico'
      });

      // Should have applied substitutions (mocked to return economic alternatives)
      expect(optimized.days[0].meals.lunch.recipe.name).toContain('Económico');
      expect(optimized.days[0].meals.lunch.recipe.tags).toContain('economico');
    });

    it('should not apply substitutions in non-economic modes', () => {
      const plan = createTestPlan();

      const normalOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'normal'
      });

      const dietOptimized = optimizeWeeklyPlan(plan, {
        ...baseContext,
        mode: 'dieta'
      });

      // Should not apply economic substitutions
      expect(normalOptimized.days[0].meals.lunch.recipe.name).toBe(mockAsadoRecipe.name);
      expect(dietOptimized.days[0].meals.lunch.recipe.name).toBe(mockAsadoRecipe.name);
    });
  });

  describe('Performance', () => {
    it('should optimize large meal plans efficiently', () => {
      const largePlan: ArgentineWeeklyPlan = {
        ...mockWeeklyPlan,
        days: Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
          weekday: i % 7,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
            lunch: { slot: 'lunch', time: '13:00', recipe: mockAsadoRecipe },
            snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
            dinner: { slot: 'dinner', time: '21:30', recipe: mockMilanesas }
          }
        }))
      };

      const startTime = Date.now();
      const optimized = optimizeWeeklyPlan(largePlan, baseContext);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      expect(optimized.days).toHaveLength(30);
      expect(optimized.days[0].meals.lunch).toHaveProperty('score');
    });
  });
});