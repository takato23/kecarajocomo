import { generateICSCalendar, generateMealEvent, parseICSDate } from '../icsExport';
import { 
  mockWeeklyPlan, 
  mockMateRecipe,
  mockAsadoRecipe
} from '@/__tests__/mocks/fixtures/argentineMealData';
import type { MealPlan, Recipe } from '@/features/meal-planning/types';

describe('ICS Calendar Export', () => {
  describe('generateICSCalendar', () => {
    it('should generate valid ICS calendar for weekly meal plan', () => {
      const icsContent = generateICSCalendar(mockWeeklyPlan, {
        includePrepTime: true,
        includeIngredients: true,
        timezone: 'America/Argentina/Buenos_Aires'
      });

      // Check ICS header
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('VERSION:2.0');
      expect(icsContent).toContain('PRODID:-//KeCom//Meal Planner//ES');
      expect(icsContent).toContain('END:VCALENDAR');

      // Check timezone
      expect(icsContent).toContain('BEGIN:VTIMEZONE');
      expect(icsContent).toContain('TZID:America/Argentina/Buenos_Aires');
      expect(icsContent).toContain('END:VTIMEZONE');

      // Check meal events
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      expect(icsContent).toContain('SUMMARY:Desayuno: Mate con Facturas');
      expect(icsContent).toContain('SUMMARY:Almuerzo: Asado Tradicional Argentino');
    });

    it('should include cultural events and traditions', () => {
      const planWithCultural = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map(day => ({
          ...day,
          cultural: day.date === '2024-01-21' ? {
            isSpecialDay: true,
            occasion: 'domingo_asado',
            notes: 'Tradición familiar del asado dominical'
          } : undefined
        }))
      };

      const icsContent = generateICSCalendar(planWithCultural, {
        includeCultural: true,
        timezone: 'America/Argentina/Buenos_Aires'
      });

      expect(icsContent).toContain('Asado Dominical');
      expect(icsContent).toContain('Tradición familiar');
      expect(icsContent).toContain('CATEGORIES:Cultural,Tradicional');
    });

    it('should handle ñoquis del 29 special events', () => {
      const planWith29 = {
        ...mockWeeklyPlan,
        days: [
          ...mockWeeklyPlan.days,
          {
            date: '2024-01-29',
            weekday: 1,
            cultural: {
              isSpecialDay: true,
              occasion: 'dia29',
              notes: 'Ñoquis del 29 para la prosperidad'
            },
            meals: {
              breakfast: { slot: 'breakfast', time: '08:00', recipe: mockMateRecipe },
              lunch: { slot: 'lunch', time: '13:00', recipe: mockAsadoRecipe },
              snack: { slot: 'snack', time: '17:30', recipe: mockMateRecipe },
              dinner: { 
                slot: 'dinner', 
                time: '21:30', 
                recipe: {
                  id: 'noquis-29',
                  name: 'Ñoquis del 29',
                  description: 'Ñoquis tradicionales para atraer prosperidad',
                  cultural: {
                    isTraditional: true,
                    occasion: 'dia29',
                    significance: 'Tradición mensual para la prosperidad'
                  },
                  ingredients: [
                    { name: 'papa', amount: 1, unit: 'kg', aisle: 'verduleria' },
                    { name: 'harina', amount: 300, unit: 'g', aisle: 'almacen' }
                  ],
                  instructions: ['Hervir papas', 'Hacer masa', 'Formar ñoquis'],
                  prepTime: 45,
                  cookTime: 15,
                  servings: 4,
                  nutrition: { calories: 380, protein: 12, carbs: 75, fat: 3 }
                }
              }
            }
          }
        ]
      };

      const icsContent = generateICSCalendar(planWith29, {
        includeCultural: true,
        timezone: 'America/Argentina/Buenos_Aires'
      });

      expect(icsContent).toContain('Ñoquis del 29');
      expect(icsContent).toContain('prosperidad');
      expect(icsContent).toContain('CATEGORIES:Cultural,Tradicion29');
    });

    it('should include prep time and shopping reminders', () => {
      const icsContent = generateICSCalendar(mockWeeklyPlan, {
        includePrepTime: true,
        includeShoppingReminders: true,
        timezone: 'America/Argentina/Buenos_Aires'
      });

      // Should include prep time events
      expect(icsContent).toContain('Preparación:');
      expect(icsContent).toContain('SUMMARY:Prep: Asado Tradicional');

      // Should include shopping reminders
      expect(icsContent).toContain('Lista de Compras');
      expect(icsContent).toContain('SUMMARY:Compras para la semana');
      expect(icsContent).toContain('vacío');
      expect(icsContent).toContain('chorizo');
    });

    it('should handle different timezones correctly', () => {
      const icsContent = generateICSCalendar(mockWeeklyPlan, {
        timezone: 'America/Argentina/Cordoba'
      });

      expect(icsContent).toContain('TZID:America/Argentina/Cordoba');
    });

    it('should include nutrition information in descriptions', () => {
      const icsContent = generateICSCalendar(mockWeeklyPlan, {
        includeNutrition: true,
        includeIngredients: true,
        timezone: 'America/Argentina/Buenos_Aires'
      });

      expect(icsContent).toContain('Calorías:');
      expect(icsContent).toContain('Proteínas:');
      expect(icsContent).toContain('Carbohidratos:');
      expect(icsContent).toContain('Grasas:');
      expect(icsContent).toContain('Ingredientes:');
    });
  });

  describe('generateMealEvent', () => {
    const testRecipe: Recipe = {
      id: 'test-recipe',
      name: 'Milanesas con Puré',
      description: 'Milanesas de ternera con puré de papa',
      ingredients: [
        { name: 'milanesas', amount: 4, unit: 'unidades', aisle: 'carniceria' },
        { name: 'papa', amount: 1, unit: 'kg', aisle: 'verduleria' }
      ],
      instructions: ['Freír milanesas', 'Hacer puré'],
      prepTime: 20,
      cookTime: 15,
      servings: 4,
      nutrition: { calories: 450, protein: 25, carbs: 35, fat: 20 }
    };

    it('should generate valid VEVENT for a meal', () => {
      const event = generateMealEvent(
        testRecipe,
        '2024-01-15',
        '19:30',
        'cena',
        {
          includeIngredients: true,
          includeNutrition: true,
          timezone: 'America/Argentina/Buenos_Aires'
        }
      );

      expect(event).toContain('BEGIN:VEVENT');
      expect(event).toContain('END:VEVENT');
      expect(event).toContain('SUMMARY:Cena: Milanesas con Puré');
      expect(event).toContain('DTSTART;TZID=America/Argentina/Buenos_Aires:20240115T193000');
      expect(event).toContain('DTEND;TZID=America/Argentina/Buenos_Aires:20240115T203000');
      expect(event).toContain('DESCRIPTION:');
      expect(event).toContain('milanesas');
      expect(event).toContain('papa');
      expect(event).toContain('Calorías: 450');
    });

    it('should include prep time alarm', () => {
      const event = generateMealEvent(
        testRecipe,
        '2024-01-15',
        '19:30',
        'cena',
        {
          includePrepAlarm: true,
          timezone: 'America/Argentina/Buenos_Aires'
        }
      );

      expect(event).toContain('BEGIN:VALARM');
      expect(event).toContain('END:VALARM');
      expect(event).toContain('TRIGGER:-PT20M'); // 20 minutes before (prep time)
      expect(event).toContain('ACTION:DISPLAY');
      expect(event).toContain('DESCRIPTION:Tiempo de preparar: Milanesas con Puré');
    });

    it('should handle cultural significance', () => {
      const culturalRecipe: Recipe = {
        ...testRecipe,
        cultural: {
          isTraditional: true,
          occasion: 'domingo_asado',
          significance: 'Tradición familiar del domingo'
        }
      };

      const event = generateMealEvent(
        culturalRecipe,
        '2024-01-21',
        '13:00',
        'almuerzo',
        {
          includeCultural: true,
          timezone: 'America/Argentina/Buenos_Aires'
        }
      );

      expect(event).toContain('CATEGORIES:Cultural,Tradicional');
      expect(event).toContain('Tradición familiar');
      expect(event).toContain('🇦🇷');
    });

    it('should calculate correct duration based on prep and cook time', () => {
      const longRecipe: Recipe = {
        ...testRecipe,
        prepTime: 30,
        cookTime: 45
      };

      const event = generateMealEvent(
        longRecipe,
        '2024-01-15',
        '12:00',
        'almuerzo',
        {
          timezone: 'America/Argentina/Buenos_Aires'
        }
      );

      // Total time: 30 + 45 = 75 minutes = 1h15m
      expect(event).toContain('DTSTART;TZID=America/Argentina/Buenos_Aires:20240115T120000');
      expect(event).toContain('DTEND;TZID=America/Argentina/Buenos_Aires:20240115T131500');
    });
  });

  describe('parseICSDate', () => {
    it('should parse date and time correctly', () => {
      const result = parseICSDate('2024-01-15', '14:30', 'America/Argentina/Buenos_Aires');
      
      expect(result.start).toBe('20240115T143000');
      expect(result.timezone).toBe('America/Argentina/Buenos_Aires');
    });

    it('should handle different time formats', () => {
      const result1 = parseICSDate('2024-01-15', '09:00', 'America/Argentina/Buenos_Aires');
      const result2 = parseICSDate('2024-01-15', '21:30', 'America/Argentina/Buenos_Aires');
      
      expect(result1.start).toBe('20240115T090000');
      expect(result2.start).toBe('20240115T213000');
    });

    it('should calculate end time with duration', () => {
      const result = parseICSDate('2024-01-15', '12:00', 'America/Argentina/Buenos_Aires', 90);
      
      expect(result.start).toBe('20240115T120000');
      expect(result.end).toBe('20240115T133000'); // 12:00 + 1h30m = 13:30
    });

    it('should handle edge cases around midnight', () => {
      const result = parseICSDate('2024-01-15', '23:30', 'America/Argentina/Buenos_Aires', 60);
      
      expect(result.start).toBe('20240115T233000');
      expect(result.end).toBe('20240116T003000'); // Next day
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty meal plan', () => {
      const emptyPlan: MealPlan = {
        userId: 'test',
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        days: []
      };

      const icsContent = generateICSCalendar(emptyPlan, {
        timezone: 'America/Argentina/Buenos_Aires'
      });

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
      expect(icsContent).not.toContain('BEGIN:VEVENT');
    });

    it('should handle meals without recipes', () => {
      const planWithEmptyMeals: MealPlan = {
        ...mockWeeklyPlan,
        days: [{
          date: '2024-01-15',
          weekday: 1,
          meals: {
            breakfast: null,
            lunch: null,
            snack: null,
            dinner: null
          }
        }]
      };

      const icsContent = generateICSCalendar(planWithEmptyMeals, {
        timezone: 'America/Argentina/Buenos_Aires'
      });

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('END:VCALENDAR');
    });

    it('should escape special characters in ICS content', () => {
      const recipeWithSpecialChars: Recipe = {
        id: 'special-chars',
        name: 'Empanadas "Salteñas"',
        description: 'Empanadas con carne, cebolla & condimentos;',
        ingredients: [
          { name: 'carne picada', amount: 500, unit: 'g', aisle: 'carniceria' }
        ],
        instructions: ['Preparar relleno', 'Armar empanadas'],
        prepTime: 30,
        cookTime: 20,
        servings: 12,
        nutrition: { calories: 280, protein: 15, carbs: 25, fat: 15 }
      };

      const event = generateMealEvent(
        recipeWithSpecialChars,
        '2024-01-15',
        '20:00',
        'cena',
        {
          includeIngredients: true,
          timezone: 'America/Argentina/Buenos_Aires'
        }
      );

      // Check that special characters are properly escaped
      expect(event).toContain('Empanadas \\"Salteñas\\"');
      expect(event).toContain('cebolla \\& condimentos\\;');
      expect(event).not.toContain('cebolla & condimentos;'); // Should be escaped
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(1000); // Very long description
      const recipeWithLongDesc: Recipe = {
        id: 'long-desc',
        name: 'Receta con descripción larga',
        description: longDescription,
        ingredients: [],
        instructions: [],
        prepTime: 10,
        cookTime: 10,
        servings: 1,
        nutrition: { calories: 100, protein: 5, carbs: 10, fat: 3 }
      };

      const event = generateMealEvent(
        recipeWithLongDesc,
        '2024-01-15',
        '12:00',
        'almuerzo',
        {
          timezone: 'America/Argentina/Buenos_Aires'
        }
      );

      expect(event).toContain('BEGIN:VEVENT');
      expect(event).toContain('END:VEVENT');
      // Description should be truncated or properly formatted
      expect(event.length).toBeLessThan(10000); // Reasonable size limit
    });
  });

  describe('File export integration', () => {
    it('should generate downloadable ICS file', () => {
      const icsContent = generateICSCalendar(mockWeeklyPlan, {
        timezone: 'America/Argentina/Buenos_Aires'
      });

      // Check that content is valid for file download
      expect(icsContent).toMatch(/^BEGIN:VCALENDAR/);
      expect(icsContent).toMatch(/END:VCALENDAR$/);
      expect(icsContent.split('\n')).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^BEGIN:VCALENDAR$/),
          expect.stringMatching(/^VERSION:2.0$/),
          expect.stringMatching(/^END:VCALENDAR$/)
        ])
      );
    });

    it('should generate proper filename suggestion', () => {
      const filename = `plan-comidas-${mockWeeklyPlan.weekStart}-${mockWeeklyPlan.weekEnd}.ics`;
      
      expect(filename).toBe('plan-comidas-2024-01-15-2024-01-21.ics');
      expect(filename).toMatch(/^plan-comidas-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.ics$/);
    });
  });
});