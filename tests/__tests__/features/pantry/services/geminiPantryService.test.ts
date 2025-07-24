/**
 * @jest-environment jsdom
 * Comprehensive test suite for GeminiPantryService
 * Tests AI-powered pantry intelligence and smart recommendations
 */

import { GeminiPantryService } from '@/features/pantry/services/geminiPantryService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PantryItem, PantryStats } from '@/features/pantry/types';

// Mock Google Generative AI
jest.mock('@google/generative-ai');

// Mock environment variable
const mockApiKey = 'test-api-key';
process.env.GOOGLE_GEMINI_API_KEY = mockApiKey;

describe('GeminiPantryService', () => {
  let mockModel: any;
  let mockGenAI: any;
  let mockGenerateContent: jest.Mock;
  let mockResponse: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock response structure
    mockResponse = {
      response: {
        text: jest.fn()
      }
    };

    mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);

    mockModel = {
      generateContent: mockGenerateContent
    };

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    };

    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI);

    // Mock console.error to suppress error logs in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to create mock pantry items
  const createMockPantryItem = (overrides: Partial<PantryItem> = {}): PantryItem => ({
    id: 'item-1',
    user_id: 'user-1',
    ingredient_name: 'Milk',
    quantity: 1,
    unit: 'liter',
    category: 'dairy',
    location: 'refrigerator',
    expiration_date: new Date('2024-01-15'),
    purchase_date: new Date('2024-01-10'),
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
    ...overrides
  });

  // Helper function to create mock pantry stats
  const createMockPantryStats = (overrides: Partial<PantryStats> = {}): PantryStats => ({
    totalItems: 25,
    expiringItems: 3,
    expiredItems: 1,
    categories: {
      dairy: 5,
      protein: 8,
      vegetables: 7,
      grains: 3,
      spices: 2
    },
    ...overrides
  });

  describe('generatePantryInsights', () => {
    const mockPantryItems = [
      createMockPantryItem(),
      createMockPantryItem({ 
        id: 'item-2', 
        ingredient_name: 'Chicken Breast', 
        category: 'protein',
        expiration_date: new Date('2024-01-12') // expiring soon
      }),
      createMockPantryItem({ 
        id: 'item-3', 
        ingredient_name: 'Expired Bread', 
        category: 'grains',
        expiration_date: new Date('2024-01-08') // expired
      })
    ];

    const mockPantryStats = createMockPantryStats();

    it('should generate pantry insights successfully', async () => {
      const mockInsights = {
        insights: [
          {
            type: 'waste_reduction',
            title: 'Remove Expired Items',
            description: 'You have expired bread that should be removed',
            impact: 'high',
            actionable_steps: ['Remove expired bread', 'Clean storage area'],
            confidence_score: 0.95
          },
          {
            type: 'usage_optimization',
            title: 'Use Chicken Soon',
            description: 'Chicken breast expires in 2 days',
            impact: 'medium',
            actionable_steps: ['Plan chicken recipe', 'Cook or freeze'],
            estimated_savings: 8.50,
            confidence_score: 0.88
          }
        ]
      };

      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockInsights));

      const result = await GeminiPantryService.generatePantryInsights(
        mockPantryItems,
        mockPantryStats
      );

      expect(result).toEqual(mockInsights.insights);
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('pantry management expert'));
    });

    it('should handle user preferences in prompt', async () => {
      const userPreferences = {
        dietary_restrictions: ['vegetarian'],
        cooking_skill: 'intermediate' as const,
        household_size: 3,
        budget_conscious: true
      };

      const mockInsights = { insights: [] };
      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockInsights));

      await GeminiPantryService.generatePantryInsights(
        mockPantryItems,
        mockPantryStats,
        userPreferences
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(userPreferences, null, 2))
      );
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockResponse.response.text.mockResolvedValue('Invalid JSON response');

      const result = await GeminiPantryService.generatePantryInsights(
        mockPantryItems,
        mockPantryStats
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error generating pantry insights:', expect.any(Error));
    });

    it('should handle API errors with fallback insights', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiPantryService.generatePantryInsights(
        mockPantryItems,
        mockPantryStats
      );

      expect(result).toHaveLength(2); // fallback insights
      expect(result[0].type).toBe('waste_reduction');
      expect(result[1].type).toBe('usage_optimization');
    });

    it('should handle empty pantry gracefully', async () => {
      const emptyStats = createMockPantryStats({
        totalItems: 0,
        expiringItems: 0,
        expiredItems: 0,
        categories: {}
      });

      const mockInsights = { insights: [] };
      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockInsights));

      const result = await GeminiPantryService.generatePantryInsights(
        [],
        emptyStats
      );

      expect(result).toEqual([]);
    });

    it('should handle malformed JSON response', async () => {
      mockResponse.response.text.mockResolvedValue('{"insights": [invalid json}');

      const result = await GeminiPantryService.generatePantryInsights(
        mockPantryItems,
        mockPantryStats
      );

      expect(result).toHaveLength(2); // fallback insights
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('predictExpirationDates', () => {
    const mockItemsWithoutExpiration = [
      createMockPantryItem({ 
        id: 'item-1', 
        ingredient_name: 'Onions', 
        expiration_date: undefined 
      }),
      createMockPantryItem({ 
        id: 'item-2', 
        ingredient_name: 'Canned Tomatoes', 
        expiration_date: undefined 
      })
    ];

    it('should predict expiration dates successfully', async () => {
      const mockPredictions = {
        predictions: [
          {
            item_id: 'item-1',
            predicted_expiration_date: '2024-01-25',
            confidence: 0.85,
            factors: ['Storage location', 'Food category'],
            storage_recommendations: ['Store in cool, dry place'],
            usage_suggestions: ['Use in cooking within 2 weeks']
          },
          {
            item_id: 'item-2',
            predicted_expiration_date: '2024-06-15',
            confidence: 0.92,
            factors: ['Canned goods have long shelf life'],
            storage_recommendations: ['Keep in pantry'],
            usage_suggestions: ['Check for dents or rust']
          }
        ]
      };

      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockPredictions));

      const result = await GeminiPantryService.predictExpirationDates(mockItemsWithoutExpiration);

      expect(result).toHaveLength(2);
      expect(result[0].predicted_expiration_date).toBeInstanceOf(Date);
      expect(result[0].item_id).toBe('item-1');
      expect(result[0].confidence).toBe(0.85);
    });

    it('should handle items that already have expiration dates', async () => {
      const itemsWithExpiration = [
        createMockPantryItem({ expiration_date: new Date('2024-01-20') })
      ];

      const result = await GeminiPantryService.predictExpirationDates(itemsWithExpiration);

      expect(result).toEqual([]);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should handle empty items array', async () => {
      const result = await GeminiPantryService.predictExpirationDates([]);

      expect(result).toEqual([]);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiPantryService.predictExpirationDates(mockItemsWithoutExpiration);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error predicting expiration dates:', expect.any(Error));
    });

    it('should handle malformed prediction response', async () => {
      mockResponse.response.text.mockResolvedValue('{"predictions": invalid}');

      const result = await GeminiPantryService.predictExpirationDates(mockItemsWithoutExpiration);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('generateIngredientSubstitutions', () => {
    const missingIngredients = ['heavy cream', 'fresh basil'];
    const availablePantryItems = [
      createMockPantryItem({ ingredient_name: 'Milk', category: 'dairy' }),
      createMockPantryItem({ ingredient_name: 'Butter', category: 'dairy' }),
      createMockPantryItem({ ingredient_name: 'Dried Basil', category: 'spices' })
    ];

    it('should generate ingredient substitutions successfully', async () => {
      const mockSubstitutions = {
        substitutions: [
          {
            original_ingredient: 'heavy cream',
            substitutes: [
              {
                name: 'Milk + Butter',
                ratio: 1.0,
                notes: 'Mix 3/4 cup milk with 1/4 cup melted butter',
                nutritional_impact: 'Lower fat content',
                availability_score: 0.9
              }
            ],
            recipe_compatibility: 'Works well in most recipes'
          },
          {
            original_ingredient: 'fresh basil',
            substitutes: [
              {
                name: 'Dried Basil',
                ratio: 0.33,
                notes: 'Use 1/3 the amount of dried basil',
                nutritional_impact: 'Similar nutritional profile',
                availability_score: 1.0
              }
            ],
            recipe_compatibility: 'Good for cooked dishes'
          }
        ]
      };

      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockSubstitutions));

      const result = await GeminiPantryService.generateIngredientSubstitutions(
        missingIngredients,
        availablePantryItems
      );

      expect(result).toEqual(mockSubstitutions.substitutions);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('culinary expert')
      );
    });

    it('should handle empty missing ingredients', async () => {
      const result = await GeminiPantryService.generateIngredientSubstitutions(
        [],
        availablePantryItems
      );

      expect(result).toEqual([]);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should handle empty pantry items', async () => {
      const mockSubstitutions = { substitutions: [] };
      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockSubstitutions));

      const result = await GeminiPantryService.generateIngredientSubstitutions(
        missingIngredients,
        []
      );

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiPantryService.generateIngredientSubstitutions(
        missingIngredients,
        availablePantryItems
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error generating substitutions:', expect.any(Error));
    });
  });

  describe('createOptimizationPlan', () => {
    const mockPantryItems = [createMockPantryItem()];
    const mockPantryStats = createMockPantryStats();
    const mockUsageHistory = [
      {
        ingredient: 'Milk',
        date: new Date('2024-01-09'),
        amount_used: 0.5
      }
    ];

    it('should create optimization plan successfully', async () => {
      const mockPlan = {
        immediate_actions: [
          {
            priority: 'critical',
            action: 'Remove expired bread',
            reason: 'Expired items can contaminate other food',
            estimated_time: 10
          },
          {
            priority: 'high',
            action: 'Use chicken breast today',
            reason: 'Expires tomorrow',
            estimated_time: 30
          }
        ],
        weekly_plan: [
          {
            week: 1,
            focus_area: 'Expiration management',
            recommendations: ['Check all dates daily', 'Plan meals around expiring items']
          },
          {
            week: 2,
            focus_area: 'Organization',
            recommendations: ['Group similar items', 'Label containers']
          }
        ],
        long_term_strategy: {
          storage_optimization: ['Use clear containers', 'Implement FIFO system'],
          shopping_pattern_improvements: ['Buy smaller quantities', 'Check inventory before shopping'],
          waste_reduction_targets: 30
        }
      };

      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockPlan));

      const result = await GeminiPantryService.createOptimizationPlan(
        mockPantryItems,
        mockPantryStats,
        mockUsageHistory
      );

      expect(result).toEqual(mockPlan);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('comprehensive pantry optimization plan')
      );
    });

    it('should handle missing usage history', async () => {
      const mockPlan = {
        immediate_actions: [],
        weekly_plan: [],
        long_term_strategy: {
          storage_optimization: [],
          shopping_pattern_improvements: [],
          waste_reduction_targets: 20
        }
      };

      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockPlan));

      const result = await GeminiPantryService.createOptimizationPlan(
        mockPantryItems,
        mockPantryStats
      );

      expect(result).toEqual(mockPlan);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('[]')
      );
    });

    it('should handle API errors with fallback plan', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiPantryService.createOptimizationPlan(
        mockPantryItems,
        mockPantryStats
      );

      expect(result.immediate_actions).toHaveLength(2);
      expect(result.weekly_plan).toHaveLength(2);
      expect(result.long_term_strategy).toBeDefined();
      expect(result.long_term_strategy.waste_reduction_targets).toBe(25);
    });

    it('should handle malformed plan response', async () => {
      mockResponse.response.text.mockResolvedValue('invalid json');

      const result = await GeminiPantryService.createOptimizationPlan(
        mockPantryItems,
        mockPantryStats
      );

      // Should return fallback plan
      expect(result.immediate_actions).toHaveLength(2);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('generateShoppingRecommendations', () => {
    const mockPantryItems = [
      createMockPantryItem({ ingredient_name: 'Milk', quantity: 0.2 }), // running low
      createMockPantryItem({ ingredient_name: 'Eggs', quantity: 2 })
    ];

    const mockUpcomingMeals = [
      {
        recipe_name: 'Pancakes',
        ingredients: [
          { name: 'Flour', quantity: 2, unit: 'cups' },
          { name: 'Milk', quantity: 1, unit: 'cup' },
          { name: 'Eggs', quantity: 3, unit: 'pieces' }
        ],
        date: new Date('2024-01-16')
      }
    ];

    it('should generate shopping recommendations successfully', async () => {
      const mockRecommendations = {
        recommendations: [
          {
            ingredient: 'Milk',
            reason: 'Running low and needed for pancakes',
            urgency: 'high',
            quantity_suggestion: '1 gallon',
            cost_estimate: 4.50
          },
          {
            ingredient: 'Flour',
            reason: 'Not in pantry, needed for pancakes',
            urgency: 'medium',
            quantity_suggestion: '5 lb bag',
            cost_estimate: 3.20
          }
        ]
      };

      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockRecommendations));

      const result = await GeminiPantryService.generateShoppingRecommendations(
        mockPantryItems,
        mockUpcomingMeals
      );

      expect(result).toEqual(mockRecommendations.recommendations);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('smart shopping recommendations')
      );
    });

    it('should handle empty pantry and no upcoming meals', async () => {
      const mockRecommendations = { recommendations: [] };
      mockResponse.response.text.mockResolvedValue(JSON.stringify(mockRecommendations));

      const result = await GeminiPantryService.generateShoppingRecommendations([]);

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await GeminiPantryService.generateShoppingRecommendations(
        mockPantryItems,
        mockUpcomingMeals
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error generating shopping recommendations:', expect.any(Error));
    });

    it('should handle malformed recommendations response', async () => {
      mockResponse.response.text.mockResolvedValue('{"recommendations": invalid}');

      const result = await GeminiPantryService.generateShoppingRecommendations(
        mockPantryItems,
        mockUpcomingMeals
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Fallback Functions', () => {
    describe('getFallbackInsights', () => {
      it('should provide fallback insights for expired items', () => {
        const mockStats = createMockPantryStats({
          expiredItems: 2,
          expiringItems: 1
        });

        // Access private method through class instance
        const insights = (GeminiPantryService as any).getFallbackInsights([], mockStats);

        expect(insights).toHaveLength(2);
        expect(insights[0].type).toBe('waste_reduction');
        expect(insights[0].title).toBe('Remove Expired Items');
        expect(insights[1].type).toBe('usage_optimization');
        expect(insights[1].title).toBe('Use Expiring Items Soon');
      });

      it('should provide minimal insights for healthy pantry', () => {
        const mockStats = createMockPantryStats({
          expiredItems: 0,
          expiringItems: 2
        });

        const insights = (GeminiPantryService as any).getFallbackInsights([], mockStats);

        expect(insights).toHaveLength(0);
      });

      it('should provide single insight for many expiring items', () => {
        const mockStats = createMockPantryStats({
          expiredItems: 0,
          expiringItems: 5
        });

        const insights = (GeminiPantryService as any).getFallbackInsights([], mockStats);

        expect(insights).toHaveLength(1);
        expect(insights[0].type).toBe('usage_optimization');
      });
    });

    describe('getFallbackOptimizationPlan', () => {
      it('should provide fallback optimization plan', () => {
        const mockStats = createMockPantryStats();

        const plan = (GeminiPantryService as any).getFallbackOptimizationPlan([], mockStats);

        expect(plan.immediate_actions).toHaveLength(2);
        expect(plan.weekly_plan).toHaveLength(2);
        expect(plan.long_term_strategy).toBeDefined();
        expect(plan.long_term_strategy.waste_reduction_targets).toBe(25);
      });

      it('should have proper action priorities', () => {
        const mockStats = createMockPantryStats();

        const plan = (GeminiPantryService as any).getFallbackOptimizationPlan([], mockStats);

        expect(plan.immediate_actions[0].priority).toBe('critical');
        expect(plan.immediate_actions[1].priority).toBe('high');
        expect(plan.immediate_actions[0].estimated_time).toBe(15);
        expect(plan.immediate_actions[1].estimated_time).toBe(30);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex pantry analysis workflow', async () => {
      const complexPantryItems = [
        createMockPantryItem({ ingredient_name: 'Expired Milk', expiration_date: new Date('2024-01-05') }),
        createMockPantryItem({ ingredient_name: 'Chicken', expiration_date: new Date('2024-01-13') }),
        createMockPantryItem({ ingredient_name: 'Rice', expiration_date: undefined }),
        createMockPantryItem({ ingredient_name: 'Onions', expiration_date: undefined })
      ];

      const complexStats = createMockPantryStats({
        totalItems: 4,
        expiredItems: 1,
        expiringItems: 1
      });

      // Mock responses for multiple calls
      const mockInsights = { insights: [{ type: 'waste_reduction', title: 'Clean expired items' }] };
      const mockPredictions = { predictions: [{ item_id: 'item-3', predicted_expiration_date: '2024-06-01' }] };
      const mockSubstitutions = { substitutions: [{ original_ingredient: 'heavy cream', substitutes: [] }] };

      mockResponse.response.text
        .mockResolvedValueOnce(JSON.stringify(mockInsights))
        .mockResolvedValueOnce(JSON.stringify(mockPredictions))
        .mockResolvedValueOnce(JSON.stringify(mockSubstitutions));

      // Run multiple operations
      const insights = await GeminiPantryService.generatePantryInsights(complexPantryItems, complexStats);
      const predictions = await GeminiPantryService.predictExpirationDates(complexPantryItems);
      const substitutions = await GeminiPantryService.generateIngredientSubstitutions(['heavy cream'], complexPantryItems);

      expect(insights).toHaveLength(1);
      expect(predictions).toHaveLength(1);
      expect(substitutions).toHaveLength(1);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle API rate limiting gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await GeminiPantryService.generatePantryInsights(
        [createMockPantryItem()],
        createMockPantryStats()
      );

      expect(result).toBeInstanceOf(Array);
      expect(console.error).toHaveBeenCalledWith('Error generating pantry insights:', expect.any(Error));
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network timeouts', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network timeout'));

      const result = await GeminiPantryService.generatePantryInsights(
        [createMockPantryItem()],
        createMockPantryStats()
      );

      expect(result).toBeInstanceOf(Array);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle invalid API key', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Invalid API key'));

      const result = await GeminiPantryService.predictExpirationDates(
        [createMockPantryItem({ expiration_date: undefined })]
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle empty response text', async () => {
      mockResponse.response.text.mockResolvedValue('');

      const result = await GeminiPantryService.generateIngredientSubstitutions(
        ['milk'],
        [createMockPantryItem()]
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});