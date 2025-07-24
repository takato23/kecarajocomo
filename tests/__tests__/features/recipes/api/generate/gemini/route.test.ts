import { createMocks } from 'node-mocks-http';
import { POST } from '@/features/recipes/api/generate/gemini/route';

// Mock the Gemini AI service
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

describe('/api/recipes/generate/gemini', () => {
  const mockGenerateContent = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));
  });

  describe('POST /api/recipes/generate/gemini', () => {
    it('should generate recipe with valid ingredients', async () => {
      const mockRecipe = {
        name: 'Chicken Fried Rice',
        ingredients: [
          { name: 'Chicken breast', amount: 2, unit: 'pieces' },
          { name: 'Rice', amount: 2, unit: 'cups' },
          { name: 'Eggs', amount: 2, unit: 'pieces' }
        ],
        instructions: [
          'Cook rice according to package instructions',
          'Cut chicken into small pieces',
          'Scramble eggs in a pan',
          'Stir-fry everything together'
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        nutrition: {
          calories: 450,
          protein: 35,
          carbs: 45,
          fat: 15
        }
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockRecipe)
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['chicken', 'rice', 'eggs'],
          cuisine: 'Asian',
          dietaryRestrictions: [],
          servings: 4
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        recipe: mockRecipe
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('chicken, rice, eggs')
      );
    });

    it('should handle dietary restrictions', async () => {
      const mockVegetarianRecipe = {
        name: 'Vegetarian Pasta',
        ingredients: [
          { name: 'Pasta', amount: 400, unit: 'grams' },
          { name: 'Tomatoes', amount: 3, unit: 'pieces' },
          { name: 'Basil', amount: 1, unit: 'bunch' }
        ],
        instructions: [
          'Cook pasta according to package instructions',
          'Prepare tomato sauce',
          'Mix pasta with sauce and basil'
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        nutrition: {
          calories: 350,
          protein: 12,
          carbs: 65,
          fat: 8
        }
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockVegetarianRecipe)
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['pasta', 'tomatoes', 'basil'],
          cuisine: 'Italian',
          dietaryRestrictions: ['vegetarian'],
          servings: 2
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipe).toEqual(mockVegetarianRecipe);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('vegetarian')
      );
    });

    it('should handle missing ingredients', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          cuisine: 'Italian',
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
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: [],
          cuisine: 'Italian',
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
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['chicken', 'rice'],
          servings: 0
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
      mockGenerateContent.mockRejectedValue(new Error('AI service unavailable'));

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['chicken', 'rice'],
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
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['chicken', 'rice'],
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

    it('should handle multiple dietary restrictions', async () => {
      const mockGlutenFreeVeganRecipe = {
        name: 'Gluten-Free Vegan Salad',
        ingredients: [
          { name: 'Quinoa', amount: 1, unit: 'cup' },
          { name: 'Vegetables', amount: 2, unit: 'cups' },
          { name: 'Olive oil', amount: 2, unit: 'tbsp' }
        ],
        instructions: [
          'Cook quinoa',
          'Prepare vegetables',
          'Mix everything together'
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        nutrition: {
          calories: 280,
          protein: 8,
          carbs: 35,
          fat: 12
        }
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockGlutenFreeVeganRecipe)
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['quinoa', 'vegetables'],
          dietaryRestrictions: ['vegan', 'gluten-free'],
          servings: 2
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipe).toEqual(mockGlutenFreeVeganRecipe);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('vegan, gluten-free')
      );
    });

    it('should use default values for optional parameters', async () => {
      const mockRecipe = {
        name: 'Simple Recipe',
        ingredients: [{ name: 'Bread', amount: 2, unit: 'slices' }],
        instructions: ['Toast bread'],
        prepTime: 5,
        cookTime: 5,
        servings: 1,
        nutrition: { calories: 150, protein: 5, carbs: 30, fat: 2 }
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockRecipe)
        }
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/recipes/generate/gemini',
        body: {
          ingredients: ['bread']
        }
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipe).toEqual(mockRecipe);
    });
  });
});