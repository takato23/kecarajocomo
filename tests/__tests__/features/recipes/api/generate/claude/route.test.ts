import { createMocks } from 'node-mocks-http';
import { POST } from '@/features/recipes/api/generate/claude/route';

// Mock the Claude AI service
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));

describe('/api/recipes/generate/claude', () => {
  const mockCreate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementation(() => ({
      messages: {
        create: mockCreate
      }
    }));
  });

  describe('POST /api/recipes/generate/claude', () => {
    it('should generate recipe with valid ingredients', async () => {
      const mockRecipe = {
        name: 'Grilled Chicken Salad',
        ingredients: [
          { name: 'Chicken breast', amount: 2, unit: 'pieces' },
          { name: 'Mixed greens', amount: 4, unit: 'cups' },
          { name: 'Cherry tomatoes', amount: 1, unit: 'cup' }
        ],
        instructions: [
          'Season and grill chicken breast',
          'Prepare mixed greens',
          'Slice cherry tomatoes',
          'Combine all ingredients'
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 2,
        nutrition: {
          calories: 320,
          protein: 35,
          carbs: 12,
          fat: 18
        }
      };

      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify(mockRecipe)
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['chicken breast', 'mixed greens', 'cherry tomatoes'],
          cuisine: 'Mediterranean',
          dietaryRestrictions: [],
          servings: 2
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        recipe: mockRecipe
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: expect.stringContaining('chicken breast, mixed greens, cherry tomatoes')
        }]
      });
    });

    it('should handle dietary restrictions', async () => {
      const mockVeganRecipe = {
        name: 'Vegan Buddha Bowl',
        ingredients: [
          { name: 'Quinoa', amount: 1, unit: 'cup' },
          { name: 'Chickpeas', amount: 1, unit: 'can' },
          { name: 'Avocado', amount: 1, unit: 'piece' }
        ],
        instructions: [
          'Cook quinoa',
          'Drain and rinse chickpeas',
          'Slice avocado',
          'Arrange in bowl'
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        nutrition: {
          calories: 420,
          protein: 18,
          carbs: 55,
          fat: 16
        }
      };

      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify(mockVeganRecipe)
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['quinoa', 'chickpeas', 'avocado'],
          cuisine: 'Healthy',
          dietaryRestrictions: ['vegan'],
          servings: 1
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipe).toEqual(mockVeganRecipe);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: expect.stringContaining('vegan')
        }]
      });
    });

    it('should handle missing ingredients', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          cuisine: 'French',
          servings: 4
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Ingredients are required'
      });
    });

    it('should handle empty ingredients array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: [],
          cuisine: 'French',
          servings: 4
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Ingredients are required'
      });
    });

    it('should handle invalid servings', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['beef', 'potatoes'],
          servings: -1
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Servings must be a positive number'
      });
    });

    it('should handle AI service errors', async () => {
      mockCreate.mockRejectedValue(new Error('Claude API error'));

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['beef', 'potatoes'],
          servings: 4
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to generate recipe'
      });
    });

    it('should handle invalid JSON response from AI', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          text: 'This is not valid JSON'
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['beef', 'potatoes'],
          servings: 4
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to parse AI response'
      });
    });

    it('should handle complex dietary restrictions', async () => {
      const mockKetoPaleoRecipe = {
        name: 'Keto Paleo Salmon',
        ingredients: [
          { name: 'Salmon fillet', amount: 2, unit: 'pieces' },
          { name: 'Broccoli', amount: 2, unit: 'cups' },
          { name: 'Olive oil', amount: 2, unit: 'tbsp' }
        ],
        instructions: [
          'Season salmon with herbs',
          'Steam broccoli',
          'Pan-fry salmon in olive oil',
          'Serve with broccoli'
        ],
        prepTime: 5,
        cookTime: 15,
        servings: 2,
        nutrition: {
          calories: 380,
          protein: 42,
          carbs: 8,
          fat: 20
        }
      };

      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify(mockKetoPaleoRecipe)
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['salmon', 'broccoli'],
          dietaryRestrictions: ['keto', 'paleo'],
          servings: 2
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipe).toEqual(mockKetoPaleoRecipe);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: expect.stringContaining('keto, paleo')
        }]
      });
    });

    it('should use default values for optional parameters', async () => {
      const mockSimpleRecipe = {
        name: 'Simple Scrambled Eggs',
        ingredients: [
          { name: 'Eggs', amount: 2, unit: 'pieces' },
          { name: 'Butter', amount: 1, unit: 'tbsp' }
        ],
        instructions: [
          'Beat eggs in bowl',
          'Heat butter in pan',
          'Pour eggs into pan',
          'Scramble until cooked'
        ],
        prepTime: 2,
        cookTime: 3,
        servings: 1,
        nutrition: {
          calories: 180,
          protein: 12,
          carbs: 1,
          fat: 14
        }
      };

      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify(mockSimpleRecipe)
        }]
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['eggs', 'butter']
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipe).toEqual(mockSimpleRecipe);
    });

    it('should handle missing API key', async () => {
      const originalEnv = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/claude',
        body: {
          ingredients: ['eggs', 'butter']
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'AI service not configured'
      });

      process.env.ANTHROPIC_API_KEY = originalEnv;
    });
  });
});