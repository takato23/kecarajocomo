import { UnifiedAIService } from '../UnifiedAIService';
import { GeminiProvider } from '../providers/GeminiProvider';
import { AnthropicProvider } from '../providers/AnthropicProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';

// Mock the providers
jest.mock('../providers/GeminiProvider');
jest.mock('../providers/AnthropicProvider');
jest.mock('../providers/OpenAIProvider');

describe('UnifiedAIService', () => {
  let service: UnifiedAIService;
  let mockGeminiProvider: jest.Mocked<GeminiProvider>;
  let mockAnthropicProvider: jest.Mocked<AnthropicProvider>;
  let mockOpenAIProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock providers
    mockGeminiProvider = {
      isAvailable: jest.fn(),
      generateContent: jest.fn(),
      streamContent: jest.fn(),
      analyzeImage: jest.fn(),
      analyze: jest.fn(),
      getModelInfo: jest.fn(),
    } as any;

    mockAnthropicProvider = {
      isAvailable: jest.fn(),
      generateContent: jest.fn(),
      streamContent: jest.fn(),
      analyze: jest.fn(),
      getModelInfo: jest.fn(),
    } as any;

    mockOpenAIProvider = {
      isAvailable: jest.fn(),
      generateContent: jest.fn(),
      streamContent: jest.fn(),
      analyze: jest.fn(),
      getModelInfo: jest.fn(),
    } as any;

    // Mock constructors
    (GeminiProvider as jest.MockedClass<typeof GeminiProvider>).mockImplementation(() => mockGeminiProvider);
    (AnthropicProvider as jest.MockedClass<typeof AnthropicProvider>).mockImplementation(() => mockAnthropicProvider);
    (OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>).mockImplementation(() => mockOpenAIProvider);

    service = new UnifiedAIService();
  });

  describe('Provider Selection and Fallback', () => {
    it('should use primary provider when available', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockResolvedValue('Gemini response');

      const result = await service.generateContent('test prompt');

      expect(result).toBe('Gemini response');
      expect(mockGeminiProvider.generateContent).toHaveBeenCalledWith('test prompt', undefined);
      expect(mockAnthropicProvider.generateContent).not.toHaveBeenCalled();
      expect(mockOpenAIProvider.generateContent).not.toHaveBeenCalled();
    });

    it('should fallback to secondary provider when primary fails', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(false);
      mockAnthropicProvider.isAvailable.mockReturnValue(true);
      mockAnthropicProvider.generateContent.mockResolvedValue('Anthropic response');

      const result = await service.generateContent('test prompt');

      expect(result).toBe('Anthropic response');
      expect(mockGeminiProvider.generateContent).not.toHaveBeenCalled();
      expect(mockAnthropicProvider.generateContent).toHaveBeenCalledWith('test prompt', undefined);
    });

    it('should fallback to tertiary provider when others fail', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(false);
      mockAnthropicProvider.isAvailable.mockReturnValue(false);
      mockOpenAIProvider.isAvailable.mockReturnValue(true);
      mockOpenAIProvider.generateContent.mockResolvedValue('OpenAI response');

      const result = await service.generateContent('test prompt');

      expect(result).toBe('OpenAI response');
      expect(mockGeminiProvider.generateContent).not.toHaveBeenCalled();
      expect(mockAnthropicProvider.generateContent).not.toHaveBeenCalled();
      expect(mockOpenAIProvider.generateContent).toHaveBeenCalledWith('test prompt', undefined);
    });

    it('should throw error when all providers are unavailable', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(false);
      mockAnthropicProvider.isAvailable.mockReturnValue(false);
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      await expect(service.generateContent('test prompt')).rejects.toThrow(
        'No AI providers are currently available'
      );
    });

    it('should retry with next provider when primary throws error', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockRejectedValue(new Error('Gemini error'));
      mockAnthropicProvider.isAvailable.mockReturnValue(true);
      mockAnthropicProvider.generateContent.mockResolvedValue('Anthropic response');

      const result = await service.generateContent('test prompt');

      expect(result).toBe('Anthropic response');
      expect(mockGeminiProvider.generateContent).toHaveBeenCalled();
      expect(mockAnthropicProvider.generateContent).toHaveBeenCalled();
    });
  });

  describe('Meal Planning Specific Methods', () => {
    beforeEach(() => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
    });

    it('should generate meal plan with cultural preferences', async () => {
      const mockMealPlan = {
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        region: 'pampa',
        days: []
      };

      mockGeminiProvider.generateContent.mockResolvedValue(JSON.stringify(mockMealPlan));

      const preferences = {
        cultural: {
          region: 'pampa' as const,
          traditionLevel: 'alta' as const,
          mateFrequency: 'diario' as const,
          asadoFrequency: 'semanal' as const,
        }
      };

      const result = await service.generateMealPlan(preferences, []);

      expect(result).toEqual(mockMealPlan);
      expect(mockGeminiProvider.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('región pampa'),
        expect.any(Object)
      );
    });

    it('should generate shopping list from meal plan', async () => {
      const mockShoppingList = {
        ingredients: [
          { name: 'Carne de res', quantity: 2, unit: 'kg', category: 'Carnes' }
        ],
        totalCost: 8500
      };

      mockGeminiProvider.generateContent.mockResolvedValue(JSON.stringify(mockShoppingList));

      const mealPlan = {
        days: [
          {
            date: '2024-01-15',
            almuerzo: {
              recipe: { name: 'Asado Tradicional', ingredients: ['carne de res'] }
            }
          }
        ]
      };

      const result = await service.generateShoppingList(mealPlan as any, []);

      expect(result).toEqual(mockShoppingList);
      expect(mockGeminiProvider.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('lista de compras'),
        expect.any(Object)
      );
    });

    it('should suggest recipes based on pantry items', async () => {
      const mockRecipes = [
        {
          id: 'milanesas-pollo',
          name: 'Milanesas de Pollo',
          ingredients: ['pollo', 'pan rallado']
        }
      ];

      mockGeminiProvider.generateContent.mockResolvedValue(JSON.stringify(mockRecipes));

      const pantryItems = [
        { name: 'Pollo', quantity: 1, unit: 'kg' },
        { name: 'Pan rallado', quantity: 500, unit: 'g' }
      ];

      const result = await service.suggestRecipesFromPantry(pantryItems as any);

      expect(result).toEqual(mockRecipes);
      expect(mockGeminiProvider.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('despensa'),
        expect.any(Object)
      );
    });

    it('should analyze nutrition for meal plan', async () => {
      const mockNutrition = {
        daily: { calories: 1500, protein: 60, carbs: 180, fat: 50 },
        weekly: { calories: 10500, protein: 420, carbs: 1260, fat: 350 }
      };

      mockGeminiProvider.analyze.mockResolvedValue(mockNutrition);

      const mealPlan = {
        days: [
          {
            date: '2024-01-15',
            desayuno: { recipe: { name: 'Mate con tostadas' } }
          }
        ]
      };

      const result = await service.analyzeNutrition(mealPlan as any);

      expect(result).toEqual(mockNutrition);
      expect(mockGeminiProvider.analyze).toHaveBeenCalledWith({
        type: 'nutrition',
        data: mealPlan
      });
    });
  });

  describe('Image Analysis', () => {
    it('should analyze recipe images when provider supports it', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.analyzeImage.mockResolvedValue({
        ingredients: ['tomate', 'cebolla'],
        dish: 'Ensalada mixta'
      });

      const result = await service.analyzeRecipeImage('base64-image-data');

      expect(result).toEqual({
        ingredients: ['tomate', 'cebolla'],
        dish: 'Ensalada mixta'
      });
      expect(mockGeminiProvider.analyzeImage).toHaveBeenCalledWith('base64-image-data');
    });

    it('should fallback to text analysis when image analysis unavailable', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.analyzeImage.mockRejectedValue(new Error('Image analysis not supported'));
      mockAnthropicProvider.isAvailable.mockReturnValue(true);
      mockAnthropicProvider.generateContent.mockResolvedValue('Analysis not available');

      const result = await service.analyzeRecipeImage('base64-image-data');

      expect(result).toBeNull();
      expect(mockGeminiProvider.analyzeImage).toHaveBeenCalled();
    });
  });

  describe('Streaming Content', () => {
    it('should stream content from available provider', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.streamContent.mockResolvedValue('Streaming response');

      const result = await service.streamContent('test prompt');

      expect(result).toBe('Streaming response');
      expect(mockGeminiProvider.streamContent).toHaveBeenCalledWith('test prompt', undefined);
    });

    it('should fallback for streaming when primary fails', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.streamContent.mockRejectedValue(new Error('Streaming failed'));
      mockAnthropicProvider.isAvailable.mockReturnValue(true);
      mockAnthropicProvider.streamContent.mockResolvedValue('Fallback stream');

      const result = await service.streamContent('test prompt');

      expect(result).toBe('Fallback stream');
      expect(mockGeminiProvider.streamContent).toHaveBeenCalled();
      expect(mockAnthropicProvider.streamContent).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting and Caching', () => {
    it('should respect rate limits and cache responses', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockResolvedValue('Cached response');

      // First call
      const result1 = await service.generateContent('same prompt');
      expect(result1).toBe('Cached response');

      // Second call with same prompt should use cache
      const result2 = await service.generateContent('same prompt');
      expect(result2).toBe('Cached response');

      // Should only call provider once due to caching
      expect(mockGeminiProvider.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle rate limit errors gracefully', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockRejectedValue(new Error('Rate limit exceeded'));
      mockAnthropicProvider.isAvailable.mockReturnValue(true);
      mockAnthropicProvider.generateContent.mockResolvedValue('Fallback response');

      const result = await service.generateContent('test prompt');

      expect(result).toBe('Fallback response');
      expect(mockGeminiProvider.generateContent).toHaveBeenCalled();
      expect(mockAnthropicProvider.generateContent).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should retry failed requests with exponential backoff', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('Success after retries');

      const result = await service.generateContent('test prompt', { retries: 3 });

      expect(result).toBe('Success after retries');
      expect(mockGeminiProvider.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should provide meaningful error messages', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockRejectedValue(new Error('API quota exceeded'));
      mockAnthropicProvider.isAvailable.mockReturnValue(false);
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      await expect(service.generateContent('test prompt')).rejects.toThrow(
        expect.stringContaining('AI service temporarily unavailable')
      );
    });

    it('should track provider performance metrics', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockResolvedValue('Response');

      await service.generateContent('test prompt');

      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });
  });

  describe('Configuration and Customization', () => {
    it('should allow custom provider priority configuration', () => {
      const customService = new UnifiedAIService({
        primaryProvider: 'anthropic',
        secondaryProvider: 'openai',
        tertiaryProvider: 'gemini'
      });

      expect(customService).toBeInstanceOf(UnifiedAIService);
    });

    it('should support custom timeout configurations', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('Response'), 1000))
      );

      const options = { timeout: 500 };
      
      await expect(service.generateContent('test prompt', options)).rejects.toThrow();
    });

    it('should allow model-specific configurations', async () => {
      mockGeminiProvider.isAvailable.mockReturnValue(true);
      mockGeminiProvider.generateContent.mockResolvedValue('Response');

      const options = {
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000
      };

      await service.generateContent('test prompt', options);

      expect(mockGeminiProvider.generateContent).toHaveBeenCalledWith('test prompt', options);
    });
  });
});