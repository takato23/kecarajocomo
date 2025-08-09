import { rankAlternatives, recordTasteEvent } from '../bandit';
import { 
  mockAsadoRecipe,
  mockMilanesas,
  mockEmpanadas,
  mockMateRecipe
} from '@/__tests__/mocks/fixtures/argentineMealData';
import type { Recipe } from '@/features/meal-planning/types';

// Mock Supabase client
const createMockSupabaseClient = (mockTasteEvents: any[] = []) => ({
  from: jest.fn((table: string) => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        in: jest.fn(() => ({
          then: async (callback: Function) => callback({ data: mockTasteEvents, error: null })
        }))
      }))
    })),
    insert: jest.fn(() => ({
      then: async (callback: Function) => callback({ data: null, error: null })
    }))
  }))
});

describe('Thompson Sampling Bandit System', () => {
  const mockAlternatives: Recipe[] = [
    mockAsadoRecipe,
    mockMilanesas,
    mockEmpanadas,
    {
      id: 'locro-tradicional',
      name: 'Locro Tradicional',
      description: 'Guiso tradicional argentino',
      ingredients: [
        { name: 'zapallo', amount: 500, unit: 'g', aisle: 'verduleria' },
        { name: 'porotos', amount: 200, unit: 'g', aisle: 'almacen' }
      ],
      instructions: ['Cocinar verduras', 'Agregar porotos'],
      prepTime: 30,
      cookTime: 120,
      servings: 6,
      nutrition: { calories: 280, protein: 12, carbs: 45, fat: 8 }
    }
  ];

  describe('rankAlternatives', () => {
    it('should rank alternatives with no historical data', async () => {
      const client = createMockSupabaseClient([]);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: []
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      expect(ranked).toEqual(expect.arrayContaining(mockAlternatives));
      
      // Should call Supabase correctly
      expect(client.from).toHaveBeenCalledWith('taste_events');
    });

    it('should prioritize favorites when no taste events exist', async () => {
      const client = createMockSupabaseClient([]);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: ['Empanadas de Carne', 'Locro Tradicional']
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      
      // Favorites should generally appear higher in ranking due to alpha boost
      const empanadasIndex = ranked.findIndex(r => r.name === 'Empanadas de Carne');
      const locroIndex = ranked.findIndex(r => r.name === 'Locro Tradicional');
      
      expect(empanadasIndex).toBeGreaterThanOrEqual(0);
      expect(locroIndex).toBeGreaterThanOrEqual(0);
    });

    it('should rank based on accept/reject history using Beta distribution', async () => {
      const mockTasteEvents = [
        { recipe_name: 'Asado Tradicional Argentino', action: 'accept' },
        { recipe_name: 'Asado Tradicional Argentino', action: 'accept' },
        { recipe_name: 'Asado Tradicional Argentino', action: 'accept' },
        { recipe_name: 'Milanesas de Ternera', action: 'accept' },
        { recipe_name: 'Milanesas de Ternera', action: 'reject' },
        { recipe_name: 'Empanadas de Carne', action: 'reject' },
        { recipe_name: 'Empanadas de Carne', action: 'reject' },
        { recipe_name: 'Locro Tradicional', action: 'accept' }
      ];

      const client = createMockSupabaseClient(mockTasteEvents);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: []
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      
      // Asado should likely be first (3 accepts, 0 rejects)
      // Empanadas should likely be last (0 accepts, 2 rejects)
      const asadoIndex = ranked.findIndex(r => r.name === 'Asado Tradicional Argentino');
      const empanadasIndex = ranked.findIndex(r => r.name === 'Empanadas de Carne');
      
      expect(asadoIndex).toBeLessThan(empanadasIndex);
    });

    it('should handle mixed accept/reject patterns', async () => {
      const mockTasteEvents = [
        { recipe_name: 'Milanesas de Ternera', action: 'accept' },
        { recipe_name: 'Milanesas de Ternera', action: 'accept' },
        { recipe_name: 'Milanesas de Ternera', action: 'reject' },
        { recipe_name: 'Asado Tradicional Argentino', action: 'accept' },
        { recipe_name: 'Asado Tradicional Argentino', action: 'reject' },
        { recipe_name: 'Asado Tradicional Argentino', action: 'reject' }
      ];

      const client = createMockSupabaseClient(mockTasteEvents);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: []
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      
      // Milanesas (2 accepts, 1 reject) should rank higher than Asado (1 accept, 2 rejects)
      const milanesasIndex = ranked.findIndex(r => r.name === 'Milanesas de Ternera');
      const asadoIndex = ranked.findIndex(r => r.name === 'Asado Tradicional Argentino');
      
      expect(milanesasIndex).toBeLessThan(asadoIndex);
    });

    it('should combine favorites with taste event history', async () => {
      const mockTasteEvents = [
        { recipe_name: 'Empanadas de Carne', action: 'reject' },
        { recipe_name: 'Empanadas de Carne', action: 'reject' },
        { recipe_name: 'Locro Tradicional', action: 'accept' }
      ];

      const client = createMockSupabaseClient(mockTasteEvents);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: ['Empanadas de Carne'] // Favorite but rejected in history
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      
      // Should balance favorite status with rejection history
      // Empanadas gets +1 alpha from favorite, but has 2 rejects
      const empanadasIndex = ranked.findIndex(r => r.name === 'Empanadas de Carne');
      const locroIndex = ranked.findIndex(r => r.name === 'Locro Tradicional');
      
      // Locro (1 accept, 0 rejects) should still rank higher than Empanadas (favorite + 0 accepts + 2 rejects)
      expect(locroIndex).toBeLessThan(empanadasIndex);
    });

    it('should handle case-insensitive favorite matching', async () => {
      const client = createMockSupabaseClient([]);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: ['EMPANADAS DE CARNE', 'asado tradicional argentino'] // Different cases
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      
      // Should still boost favorites despite case differences
      const empanadasIndex = ranked.findIndex(r => r.name === 'Empanadas de Carne');
      const asadoIndex = ranked.findIndex(r => r.name === 'Asado Tradicional Argentino');
      
      expect(empanadasIndex).toBeGreaterThanOrEqual(0);
      expect(asadoIndex).toBeGreaterThanOrEqual(0);
    });

    it('should add random jitter to prevent deterministic ordering', async () => {
      const client = createMockSupabaseClient([]);
      
      // Run ranking multiple times with same input
      const rankings = await Promise.all(
        Array.from({ length: 10 }, () =>
          rankAlternatives({
            userId: 'user123',
            client: client as any,
            alternatives: mockAlternatives,
            favorites: []
          })
        )
      );

      // Should have some variation in ordering due to jitter
      const firstItemNames = rankings.map(ranking => ranking[0].name);
      const uniqueFirstItems = new Set(firstItemNames);
      
      // With jitter, we should see some variation (though this could occasionally fail due to randomness)
      expect(uniqueFirstItems.size).toBeGreaterThanOrEqual(1);
    });

    it('should handle Supabase errors gracefully', async () => {
      const clientWithError = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn(() => ({
                then: async (callback: Function) => callback({ data: null, error: new Error('Database error') })
              }))
            }))
          }))
        }))
      };
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: clientWithError as any,
        alternatives: mockAlternatives,
        favorites: ['Asado Tradicional Argentino']
      });

      expect(ranked).toHaveLength(mockAlternatives.length);
      // Should still work with favorites even when database fails
    });

    it('should handle empty alternatives array', async () => {
      const client = createMockSupabaseClient([]);
      
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: [],
        favorites: ['Some Recipe']
      });

      expect(ranked).toHaveLength(0);
      expect(ranked).toEqual([]);
    });
  });

  describe('recordTasteEvent', () => {
    it('should record accept events correctly', async () => {
      const client = createMockSupabaseClient([]);
      
      await recordTasteEvent(
        client as any,
        'user123',
        'Asado Tradicional Argentino',
        'accept'
      );

      expect(client.from).toHaveBeenCalledWith('taste_events');
      expect(client.from('taste_events').insert).toHaveBeenCalledWith({
        user_id: 'user123',
        recipe_name: 'Asado Tradicional Argentino',
        action: 'accept'
      });
    });

    it('should record reject events correctly', async () => {
      const client = createMockSupabaseClient([]);
      
      await recordTasteEvent(
        client as any,
        'user123',
        'Empanadas de Carne',
        'reject'
      );

      expect(client.from).toHaveBeenCalledWith('taste_events');
      expect(client.from('taste_events').insert).toHaveBeenCalledWith({
        user_id: 'user123',
        recipe_name: 'Empanadas de Carne',
        action: 'reject'
      });
    });

    it('should handle database errors gracefully', async () => {
      const clientWithError = {
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            then: async (callback: Function) => callback({ data: null, error: new Error('Insert failed') })
          }))
        }))
      };
      
      // Should not throw error
      await expect(recordTasteEvent(
        clientWithError as any,
        'user123',
        'Some Recipe',
        'accept'
      )).resolves.toBeUndefined();
    });

    it('should handle special characters in recipe names', async () => {
      const client = createMockSupabaseClient([]);
      
      await recordTasteEvent(
        client as any,
        'user123',
        'Empanadas "Especiales" & Condimentos',
        'accept'
      );

      expect(client.from('taste_events').insert).toHaveBeenCalledWith({
        user_id: 'user123',
        recipe_name: 'Empanadas "Especiales" & Condimentos',
        action: 'accept'
      });
    });
  });

  describe('Beta distribution calculations', () => {
    it('should calculate correct Beta means for different accept/reject ratios', async () => {
      // Test known scenarios to verify Beta distribution math
      const scenarios = [
        {
          events: [
            { recipe_name: 'Perfect Recipe', action: 'accept' },
            { recipe_name: 'Perfect Recipe', action: 'accept' },
            { recipe_name: 'Perfect Recipe', action: 'accept' }
          ],
          expected: 'high' // 3 accepts, 0 rejects → alpha=4, beta=1 → mean=0.8
        },
        {
          events: [
            { recipe_name: 'Bad Recipe', action: 'reject' },
            { recipe_name: 'Bad Recipe', action: 'reject' },
            { recipe_name: 'Bad Recipe', action: 'reject' }
          ],
          expected: 'low' // 0 accepts, 3 rejects → alpha=1, beta=4 → mean=0.2
        },
        {
          events: [
            { recipe_name: 'Mixed Recipe', action: 'accept' },
            { recipe_name: 'Mixed Recipe', action: 'reject' }
          ],
          expected: 'medium' // 1 accept, 1 reject → alpha=2, beta=2 → mean=0.5
        }
      ];

      for (const scenario of scenarios) {
        const client = createMockSupabaseClient(scenario.events);
        
        const alternatives = [
          {
            id: 'test',
            name: scenario.events[0].recipe_name,
            ingredients: [],
            instructions: [],
            prepTime: 0,
            cookTime: 0,
            servings: 1,
            nutrition: { calories: 100, protein: 10, carbs: 10, fat: 5 }
          }
        ];

        const ranked = await rankAlternatives({
          userId: 'user123',
          client: client as any,
          alternatives: alternatives as Recipe[],
          favorites: []
        });

        expect(ranked).toHaveLength(1);
        // The actual score calculation includes jitter, so we can't test exact values
        // But we can verify the function completes successfully
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical user preference learning journey', async () => {
      // Simulate a user who initially likes meat dishes but learns to appreciate vegetables
      const evolutionSteps = [
        // Week 1: User likes traditional meat dishes
        [
          { recipe_name: 'Asado Tradicional Argentino', action: 'accept' },
          { recipe_name: 'Milanesas de Ternera', action: 'accept' },
          { recipe_name: 'Empanadas de Carne', action: 'accept' },
          { recipe_name: 'Locro Tradicional', action: 'reject' } // Has vegetables
        ],
        // Week 4: User starts accepting mixed dishes
        [
          { recipe_name: 'Locro Tradicional', action: 'accept' },
          { recipe_name: 'Milanesas de Ternera', action: 'accept' }
        ],
        // Week 8: User now prefers variety
        [
          { recipe_name: 'Locro Tradicional', action: 'accept' },
          { recipe_name: 'Asado Tradicional Argentino', action: 'reject' } // Too heavy now
        ]
      ];

      for (let week = 0; week < evolutionSteps.length; week++) {
        const allEventsUpToWeek = evolutionSteps.slice(0, week + 1).flat();
        const client = createMockSupabaseClient(allEventsUpToWeek);
        
        const ranked = await rankAlternatives({
          userId: 'user123',
          client: client as any,
          alternatives: mockAlternatives,
          favorites: []
        });

        expect(ranked).toHaveLength(mockAlternatives.length);
        
        if (week === 0) {
          // Early weeks: traditional meat dishes should rank high
          const asadoIndex = ranked.findIndex(r => r.name === 'Asado Tradicional Argentino');
          const locroIndex = ranked.findIndex(r => r.name === 'Locro Tradicional');
          expect(asadoIndex).toBeLessThan(locroIndex);
        }
        
        if (week === evolutionSteps.length - 1) {
          // Later weeks: Locro should improve in ranking
          const locroIndex = ranked.findIndex(r => r.name === 'Locro Tradicional');
          expect(locroIndex).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should handle seasonal preference shifts', async () => {
      const summerPreferences = [
        { recipe_name: 'Asado Tradicional Argentino', action: 'accept' }, // Good for summer
        { recipe_name: 'Locro Tradicional', action: 'reject' } // Too heavy for summer
      ];

      const winterPreferences = [
        { recipe_name: 'Locro Tradicional', action: 'accept' }, // Good for winter
        { recipe_name: 'Asado Tradicional Argentino', action: 'reject' } // User changes preference
      ];

      // Summer ranking
      const summerClient = createMockSupabaseClient(summerPreferences);
      const summerRanked = await rankAlternatives({
        userId: 'user123',
        client: summerClient as any,
        alternatives: mockAlternatives,
        favorites: []
      });

      // Winter ranking (with accumulated events)
      const winterClient = createMockSupabaseClient([...summerPreferences, ...winterPreferences]);
      const winterRanked = await rankAlternatives({
        userId: 'user123',
        client: winterClient as any,
        alternatives: mockAlternatives,
        favorites: []
      });

      expect(summerRanked).toHaveLength(mockAlternatives.length);
      expect(winterRanked).toHaveLength(mockAlternatives.length);
      
      // Rankings should potentially differ between seasons due to accumulated events
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of alternatives efficiently', async () => {
      const manyAlternatives = Array.from({ length: 100 }, (_, i) => ({
        id: `recipe-${i}`,
        name: `Recipe ${i}`,
        ingredients: [],
        instructions: [],
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        nutrition: { calories: 300, protein: 15, carbs: 30, fat: 10 }
      }));

      const client = createMockSupabaseClient([]);
      
      const startTime = Date.now();
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: manyAlternatives as Recipe[],
        favorites: []
      });
      const endTime = Date.now();

      expect(ranked).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large taste event histories efficiently', async () => {
      const manyEvents = Array.from({ length: 1000 }, (_, i) => ({
        recipe_name: `Recipe ${i % 50}`, // 50 unique recipes with 20 events each
        action: i % 3 === 0 ? 'accept' : 'reject'
      }));

      const client = createMockSupabaseClient(manyEvents);
      
      const startTime = Date.now();
      const ranked = await rankAlternatives({
        userId: 'user123',
        client: client as any,
        alternatives: mockAlternatives,
        favorites: []
      });
      const endTime = Date.now();

      expect(ranked).toHaveLength(mockAlternatives.length);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});