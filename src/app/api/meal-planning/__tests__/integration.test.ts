import { NextRequest } from 'next/server';
import { POST as generateRoute } from '../generate/route';
import { POST as regenerateRoute } from '../regenerate/route';
import { POST as suggestFromPantryRoute } from '../suggest-from-pantry/route';
import { POST as optimizeDailyRoute } from '../optimize-daily/route';
import { POST as feedbackRoute } from '../feedback/route';
import { 
  mockWeeklyPlan, 
  mockUserPreferences, 
  mockPantryItems,
  mockRegeneratedMeal,
  mockAlternativeRecipes
} from '@/__tests__/mocks/fixtures/argentineMealData';

// Mock Gemini service
jest.mock('@/lib/services/geminiService', () => ({
  callGeminiWeeklyPlan: jest.fn(),
  callGeminiRegenerateMeal: jest.fn(),
  callGeminiAlternatives: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: [], error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }));

import { callGeminiWeeklyPlan, callGeminiRegenerateMeal, callGeminiAlternatives } from '@/lib/services/geminiService';

const mockCallGeminiWeeklyPlan = callGeminiWeeklyPlan as jest.MockedFunction<typeof callGeminiWeeklyPlan>;
const mockCallGeminiRegenerateMeal = callGeminiRegenerateMeal as jest.MockedFunction<typeof callGeminiRegenerateMeal>;
const mockCallGeminiAlternatives = callGeminiAlternatives as jest.MockedFunction<typeof callGeminiAlternatives>;

describe('Meal Planning API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/meal-planning/generate', () => {
    it('should generate weekly meal plan successfully', async () => {
      mockCallGeminiWeeklyPlan.mockResolvedValue(mockWeeklyPlan);

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWeeklyPlan);
      expect(data.message).toContain('exitosamente');
      expect(mockCallGeminiWeeklyPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        })
      );
    });

    it('should handle missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          // Missing userId and weekStart
          preferences: mockUserPreferences,
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('requeridos');
    });

    it('should handle Gemini API error', async () => {
      mockCallGeminiWeeklyPlan.mockRejectedValue(new Error('Gemini API error'));

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Error');
    });

    it('should apply cultural rules for Argentine users', async () => {
      const argentinePreferences = {
        ...mockUserPreferences,
        cultural: {
          region: 'pampa' as const,
          traditionLevel: 'alta' as const,
          mateFrequency: 'diario' as const,
          asadoFrequency: 'semanal' as const,
        }
      };

      mockCallGeminiWeeklyPlan.mockResolvedValue({
        ...mockWeeklyPlan,
        cultural: {
          hasAsado: true,
          hasMate: true,
          hasNoquis29: true,
          specialOccasions: ['domingo', 'dia29']
        });

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: argentinePreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.cultural.hasAsado).toBe(true);
      expect(data.data.cultural.hasMate).toBe(true);
      expect(data.data.cultural.hasNoquis29).toBe(true);
    });

    it('should handle economic mode correctly', async () => {
      const economicPlan = {
        ...mockWeeklyPlan,
        mode: 'economico' as const,
        weeklyCost: 15000 // Lower cost
      };

      mockCallGeminiWeeklyPlan.mockResolvedValue(economicPlan);

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: {
            ...mockUserPreferences,
            budget: { weekly: 15000, currency: 'ARS', flexibility: 'estricto' }
          },
          pantry: mockPantryItems,
          mode: 'economico'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.mode).toBe('economico');
      expect(data.data.weeklyCost).toBeLessThanOrEqual(15000);
    });

    it('should validate date format', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '15/01/2024', // Invalid format
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('fecha');
    });
  });

  describe('POST /api/meal-planning/regenerate', () => {
    it('should regenerate meal successfully', async () => {
      mockCallGeminiRegenerateMeal.mockResolvedValue(mockRegeneratedMeal);

      const request = new NextRequest('http://localhost:3000/api/meal-planning/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          weekPlanId: 'plan-test-week-1',
          date: '2024-01-15',
          mealType: 'almuerzo',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          reason: 'No me gusta la comida sugerida'
        }),
      });

      const response = await regenerateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRegeneratedMeal);
      expect(mockCallGeminiRegenerateMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2024-01-15',
          mealType: 'almuerzo',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          reason: 'No me gusta la comida sugerida'
        })
      );
    });

    it('should handle invalid meal type', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          weekPlanId: 'plan-test-week-1',
          date: '2024-01-15',
          mealType: 'invalid-meal', // Invalid
          preferences: mockUserPreferences,
          pantry: mockPantryItems
        }),
      });

      const response = await regenerateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('tipo de comida');
    });

    it('should preserve cultural context during regeneration', async () => {
      const sundayMeal = {
        ...mockRegeneratedMeal,
        recipe: {
          ...mockRegeneratedMeal.recipe,
          cultural: {
            isTraditional: true,
            occasion: 'domingo',
            significance: 'Asado dominical'
          }
        }
      };

      mockCallGeminiRegenerateMeal.mockResolvedValue(sundayMeal);

      const request = new NextRequest('http://localhost:3000/api/meal-planning/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          weekPlanId: 'plan-test-week-1',
          date: '2024-01-21', // Sunday
          mealType: 'almuerzo',
          preferences: {
            ...mockUserPreferences,
            cultural: {
              ...mockUserPreferences.cultural,
              asadoFrequency: 'semanal'
            }
          },
          pantry: mockPantryItems
        }),
      });

      const response = await regenerateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.recipe.cultural.occasion).toBe('domingo');
    });
  });

  describe('POST /api/meal-planning/suggest-from-pantry', () => {
    it('should suggest recipes based on pantry items', async () => {
      mockCallGeminiAlternatives.mockResolvedValue(mockAlternativeRecipes);

      const request = new NextRequest('http://localhost:3000/api/meal-planning/suggest-from-pantry', {
        method: 'POST',
        body: JSON.stringify({
          pantry: mockPantryItems,
          preferences: mockUserPreferences,
          mealType: 'almuerzo',
          date: '2024-01-15'
        }),
      });

      const response = await suggestFromPantryRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockAlternativeRecipes);
      expect(mockCallGeminiAlternatives).toHaveBeenCalledWith(
        expect.objectContaining({
          pantry: mockPantryItems,
          preferences: mockUserPreferences,
          mealType: 'almuerzo'
        })
      );
    });

    it('should handle empty pantry', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/suggest-from-pantry', {
        method: 'POST',
        body: JSON.stringify({
          pantry: [], // Empty pantry
          preferences: mockUserPreferences,
          mealType: 'almuerzo',
          date: '2024-01-15'
        }),
      });

      const response = await suggestFromPantryRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('despensa');
    });

    it('should prioritize ingredients with expiring dates', async () => {
      const pantryWithExpiring = [
        ...mockPantryItems,
        {
          id: 'expiring-tomatoes',
          name: 'Tomates',
          category: 'verduras',
          amount: 500,
          unit: 'g',
          expiryDate: '2024-01-16', // Expires soon
          frequency: 'media' as const
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/meal-planning/suggest-from-pantry', {
        method: 'POST',
        body: JSON.stringify({
          pantry: pantryWithExpiring,
          preferences: mockUserPreferences,
          mealType: 'almuerzo',
          date: '2024-01-15'
        }),
      });

      const response = await suggestFromPantryRoute(request);
      
      expect(response.status).toBe(200);
      expect(mockCallGeminiAlternatives).toHaveBeenCalledWith(
        expect.objectContaining({
          priorityIngredients: expect.arrayContaining(['Tomates'])
        })
      );
    });
  });

  describe('POST /api/meal-planning/optimize-daily', () => {
    it('should optimize daily nutrition and cost', async () => {
      const optimizedDay = {
        ...mockWeeklyPlan.days[0],
        dailyCost: mockWeeklyPlan.days[0].dailyCost * 0.8, // 20% cost reduction
        dailyNutrition: {
          ...mockWeeklyPlan.days[0].dailyNutrition,
          calories: 2000 // Optimized calories
        }
      };

      // Mock the optimization logic
      jest.doMock('@/lib/services/mealOptimizer', () => ({
        optimizeDailyMeals: jest.fn().mockResolvedValue(optimizedDay)
      }));

      const request = new NextRequest('http://localhost:3000/api/meal-planning/optimize-daily', {
        method: 'POST',
        body: JSON.stringify({
          dayPlan: mockWeeklyPlan.days[0],
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          targetCalories: 2000,
          maxCost: 3000
        }),
      });

      const response = await optimizeDailyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dailyCost).toBeLessThan(mockWeeklyPlan.days[0].dailyCost);
      expect(data.data.dailyNutrition.calories).toBe(2000);
    });

    it('should maintain cultural requirements during optimization', async () => {
      const sundayPlan = mockWeeklyPlan.days.find(day => day.dayOfWeek === 0)!;

      const request = new NextRequest('http://localhost:3000/api/meal-planning/optimize-daily', {
        method: 'POST',
        body: JSON.stringify({
          dayPlan: sundayPlan,
          preferences: {
            ...mockUserPreferences,
            cultural: {
              ...mockUserPreferences.cultural,
              asadoFrequency: 'semanal'
            }
          },
          pantry: mockPantryItems,
          targetCalories: 2000,
          maxCost: 3000
        }),
      });

      const response = await optimizeDailyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.cultural.isSpecialDay).toBe(true);
      expect(data.data.cultural.occasion).toBe('domingo');
    });
  });

  describe('POST /api/meal-planning/feedback', () => {
    it('should save user feedback successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/feedback', {
        method: 'POST',
        body: JSON.stringify({
          weekPlanId: 'plan-test-week-1',
          feedback: {
            rating: 4,
            likes: ['Asado dominical', 'Ñoquis del 29'],
            dislikes: ['Muy caro', 'Falta variedad'],
            suggestions: ['Incluir más pescado', 'Opciones vegetarianas'],
            culturalFeedback: {
              authenticityRating: 5,
              traditionPreservation: 4,
              localIngredients: 3
            }
          }),
      });

      const response = await feedbackRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('registrado');
    });

    it('should validate feedback structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/feedback', {
        method: 'POST',
        body: JSON.stringify({
          weekPlanId: 'plan-test-week-1',
          feedback: {
            rating: 6, // Invalid: should be 1-5
            likes: 'should be array' // Invalid type
          }),
      });

      const response = await feedbackRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('válido');
    });

    it('should handle cultural feedback appropriately', async () => {
      const culturalFeedback = {
        weekPlanId: 'plan-test-week-1',
        feedback: {
          rating: 5,
          likes: ['Asado tradicional', 'Mate incluido'],
          culturalFeedback: {
            authenticityRating: 5,
            traditionPreservation: 5,
            localIngredients: 4,
            regionalAccuracy: 5,
            seasonalAppropriate: 4
          }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/meal-planning/feedback', {
        method: 'POST',
        body: JSON.stringify(culturalFeedback),
      });

      const response = await feedbackRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: 'invalid json{',
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('JSON');
    });

    it('should handle missing content-type', async () => {
      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        // No body
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle Gemini service timeout', async () => {
      mockCallGeminiWeeklyPlan.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Timeout');
    });

    it('should handle rate limiting', async () => {
      mockCallGeminiWeeklyPlan.mockRejectedValue(
        Object.assign(new Error('Rate limit exceeded'), { status: 429 })
      );

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: mockUserPreferences,
          pantry: mockPantryItems,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('límite');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large pantry efficiently', async () => {
      const largePantry = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        category: 'otros',
        amount: 1,
        unit: 'unidad',
        frequency: 'baja' as const
      }));

      mockCallGeminiWeeklyPlan.mockResolvedValue(mockWeeklyPlan);

      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/meal-planning/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          weekStart: '2024-01-15',
          preferences: mockUserPreferences,
          pantry: largePantry,
          mode: 'normal'
        }),
      });

      const response = await generateRoute(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      mockCallGeminiWeeklyPlan.mockResolvedValue(mockWeeklyPlan);

      const requests = Array.from({ length: 5 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/meal-planning/generate', {
          method: 'POST',
          body: JSON.stringify({
            userId: `test-user-${i}`,
            weekStart: '2024-01-15',
            preferences: mockUserPreferences,
            pantry: mockPantryItems,
            mode: 'normal'
          }),
        })
      );

      const responses = await Promise.all(
        requests.map(request => generateRoute(request))
      );

      expect(responses).toHaveLength(5);
      expect(responses.every(response => response.status === 200)).toBe(true);
    });
  });
});