import { act, renderHook } from '@testing-library/react';
import { useRecipeStore } from '@/features/recipes/store/recipeStore';
import { generateRecipeWithAI } from '@/features/recipes/utils/aiGeneration';
import type { 
  Recipe, 
  RecipeFilters, 
  RecipeSortOptions, 
  PaginationOptions, 
  RecipeSearchResult, 
  AIRecipeRequest, 
  AIRecipeResponse, 
  RecipeFormData, 
  RecipeCollection, 
  CookingSession,
  RecipeIngredient,
  Instruction,
  DetailedNutritionalInfo,
  CuisineType,
  DifficultyLevel,
  MealType,
  DietaryTag
} from '@/features/recipes/types';

// Mock AI generation utility
jest.mock('@/features/recipes/utils/aiGeneration', () => ({
  generateRecipeWithAI: jest.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid'),
  },
});

describe('useRecipeStore', () => {
  // Helper function to create mock recipes
  const createMockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
    id: 'recipe-1',
    user_id: 'user-1',
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: [
      {
        ingredient_id: 'ing-1',
        name: 'Test Ingredient',
        quantity: 1,
        unit: 'cup',
        notes: 'chopped',
        optional: false,
        group: 'main',
      },
    ],
    instructions: [
      {
        step_number: 1,
        text: 'Mix ingredients',
        time_minutes: 5,
        temperature: {
          value: 350,
          unit: 'fahrenheit',
        },
        tips: ['Mix well'],
        image_url: 'https://example.com/step1.jpg',
      },
    ],
    prep_time: 15,
    cook_time: 30,
    total_time: 45,
    servings: 4,
    cuisine_type: 'italian',
    meal_types: ['dinner'],
    dietary_tags: ['vegetarian'],
    difficulty: 'medium',
    nutritional_info: {
      calories: 300,
      protein: 15,
      carbs: 45,
      fat: 10,
      saturated_fat: 3,
      trans_fat: 0,
      cholesterol: 0,
      sodium: 400,
      fiber: 8,
      sugar: 5,
      vitamin_a: 20,
      vitamin_c: 30,
      calcium: 150,
      iron: 5,
    },
    image_url: 'https://example.com/recipe.jpg',
    video_url: 'https://example.com/recipe.mp4',
    source_url: 'https://example.com/source',
    ai_generated: false,
    ai_provider: undefined,
    rating: 4.5,
    times_cooked: 10,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const createMockCollection = (overrides: Partial<RecipeCollection> = {}): RecipeCollection => ({
    id: 'collection-1',
    user_id: 'user-1',
    name: 'Test Collection',
    description: 'A collection of test recipes',
    recipe_ids: ['recipe-1', 'recipe-2'],
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useRecipeStore());
      
      expect(result.current.recipes).toEqual([]);
      expect(result.current.currentRecipe).toBeNull();
      expect(result.current.searchResult).toBeNull();
      expect(result.current.userRecipes).toEqual([]);
      expect(result.current.favoriteRecipes).toEqual([]);
      expect(result.current.collections).toEqual([]);
      expect(result.current.currentCollection).toBeNull();
      
      expect(result.current.filters).toEqual({});
      expect(result.current.sortOptions).toEqual({ field: 'created_at', direction: 'desc' });
      expect(result.current.pagination).toEqual({ page: 1, limit: 12 });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isGeneratingAI).toBe(false);
      expect(result.current.isAnalyzingNutrition).toBe(false);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedTags).toEqual([]);
      
      expect(result.current.aiRequest).toBeNull();
      expect(result.current.aiResponse).toBeNull();
    });
  });

  describe('Recipe Management', () => {
    describe('setRecipes', () => {
      it('should set recipes', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipes = [createMockRecipe({ id: '1' }), createMockRecipe({ id: '2' })];

        act(() => {
          result.current.setRecipes(mockRecipes);
        });

        expect(result.current.recipes).toEqual(mockRecipes);
      });
    });

    describe('setCurrentRecipe', () => {
      it('should set current recipe', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe();

        act(() => {
          result.current.setCurrentRecipe(mockRecipe);
        });

        expect(result.current.currentRecipe).toEqual(mockRecipe);
      });

      it('should set current recipe to null', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe();

        act(() => {
          result.current.setCurrentRecipe(mockRecipe);
        });

        act(() => {
          result.current.setCurrentRecipe(null);
        });

        expect(result.current.currentRecipe).toBeNull();
      });
    });

    describe('addRecipe', () => {
      it('should add recipe to both recipes and userRecipes', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe();

        act(() => {
          result.current.addRecipe(mockRecipe);
        });

        expect(result.current.recipes).toContain(mockRecipe);
        expect(result.current.userRecipes).toContain(mockRecipe);
        expect(result.current.recipes[0]).toEqual(mockRecipe);
      });

      it('should add recipe to the beginning of the arrays', () => {
        const { result } = renderHook(() => useRecipeStore());
        const existingRecipe = createMockRecipe({ id: '1' });
        const newRecipe = createMockRecipe({ id: '2' });

        act(() => {
          result.current.setRecipes([existingRecipe]);
          result.current.setUserRecipes([existingRecipe]);
        });

        act(() => {
          result.current.addRecipe(newRecipe);
        });

        expect(result.current.recipes[0]).toEqual(newRecipe);
        expect(result.current.userRecipes[0]).toEqual(newRecipe);
      });
    });

    describe('updateRecipe', () => {
      it('should update recipe in recipes array', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: '1', title: 'Original Title' });

        act(() => {
          result.current.setRecipes([mockRecipe]);
        });

        act(() => {
          result.current.updateRecipe('1', { title: 'Updated Title' });
        });

        expect(result.current.recipes[0].title).toBe('Updated Title');
        expect(result.current.recipes[0].updated_at).toBeDefined();
      });

      it('should update current recipe if it matches', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: '1', title: 'Original Title' });

        act(() => {
          result.current.setRecipes([mockRecipe]);
          result.current.setCurrentRecipe(mockRecipe);
        });

        act(() => {
          result.current.updateRecipe('1', { title: 'Updated Title' });
        });

        expect(result.current.currentRecipe?.title).toBe('Updated Title');
        expect(result.current.currentRecipe?.updated_at).toBeDefined();
      });

      it('should not update current recipe if it does not match', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe1 = createMockRecipe({ id: '1', title: 'Recipe 1' });
        const mockRecipe2 = createMockRecipe({ id: '2', title: 'Recipe 2' });

        act(() => {
          result.current.setRecipes([mockRecipe1, mockRecipe2]);
          result.current.setCurrentRecipe(mockRecipe1);
        });

        act(() => {
          result.current.updateRecipe('2', { title: 'Updated Recipe 2' });
        });

        expect(result.current.currentRecipe?.title).toBe('Recipe 1');
        expect(result.current.recipes[1].title).toBe('Updated Recipe 2');
      });
    });

    describe('deleteRecipe', () => {
      it('should remove recipe from recipes array', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe1 = createMockRecipe({ id: '1' });
        const mockRecipe2 = createMockRecipe({ id: '2' });

        act(() => {
          result.current.setRecipes([mockRecipe1, mockRecipe2]);
        });

        act(() => {
          result.current.deleteRecipe('1');
        });

        expect(result.current.recipes).toHaveLength(1);
        expect(result.current.recipes[0].id).toBe('2');
      });

      it('should remove recipe from userRecipes array', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe1 = createMockRecipe({ id: '1' });
        const mockRecipe2 = createMockRecipe({ id: '2' });

        act(() => {
          result.current.setUserRecipes([mockRecipe1, mockRecipe2]);
        });

        act(() => {
          result.current.deleteRecipe('1');
        });

        expect(result.current.userRecipes).toHaveLength(1);
        expect(result.current.userRecipes[0].id).toBe('2');
      });

      it('should clear current recipe if it matches deleted recipe', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: '1' });

        act(() => {
          result.current.setRecipes([mockRecipe]);
          result.current.setCurrentRecipe(mockRecipe);
        });

        act(() => {
          result.current.deleteRecipe('1');
        });

        expect(result.current.currentRecipe).toBeNull();
      });

      it('should not clear current recipe if it does not match', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe1 = createMockRecipe({ id: '1' });
        const mockRecipe2 = createMockRecipe({ id: '2' });

        act(() => {
          result.current.setRecipes([mockRecipe1, mockRecipe2]);
          result.current.setCurrentRecipe(mockRecipe1);
        });

        act(() => {
          result.current.deleteRecipe('2');
        });

        expect(result.current.currentRecipe).toEqual(mockRecipe1);
      });
    });

    describe('getRecipeById', () => {
      it('should return recipe by id', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: '1' });

        act(() => {
          result.current.setRecipes([mockRecipe]);
        });

        const foundRecipe = result.current.getRecipeById('1');
        expect(foundRecipe).toEqual(mockRecipe);
      });

      it('should return undefined if recipe not found', () => {
        const { result } = renderHook(() => useRecipeStore());

        const foundRecipe = result.current.getRecipeById('nonexistent');
        expect(foundRecipe).toBeUndefined();
      });
    });
  });

  describe('Search and Filter', () => {
    describe('setFilters', () => {
      it('should set filters and reset pagination', () => {
        const { result } = renderHook(() => useRecipeStore());
        const filters: RecipeFilters = {
          cuisine_types: ['italian', 'mexican'],
          difficulty: ['easy'],
        };

        act(() => {
          result.current.setPagination({ page: 3, limit: 20 });
        });

        act(() => {
          result.current.setFilters(filters);
        });

        expect(result.current.filters).toEqual(filters);
        expect(result.current.pagination).toEqual({ page: 1, limit: 12 });
      });
    });

    describe('setSortOptions', () => {
      it('should set sort options', () => {
        const { result } = renderHook(() => useRecipeStore());
        const sortOptions: RecipeSortOptions = {
          field: 'title',
          direction: 'asc',
        };

        act(() => {
          result.current.setSortOptions(sortOptions);
        });

        expect(result.current.sortOptions).toEqual(sortOptions);
      });
    });

    describe('setPagination', () => {
      it('should set pagination options', () => {
        const { result } = renderHook(() => useRecipeStore());
        const pagination: PaginationOptions = {
          page: 2,
          limit: 24,
        };

        act(() => {
          result.current.setPagination(pagination);
        });

        expect(result.current.pagination).toEqual(pagination);
      });
    });

    describe('setSearchQuery', () => {
      it('should set search query', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setSearchQuery('pasta');
        });

        expect(result.current.searchQuery).toBe('pasta');
      });
    });

    describe('Tags Management', () => {
      it('should add selected tag', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.addSelectedTag('vegetarian');
        });

        expect(result.current.selectedTags).toContain('vegetarian');
      });

      it('should remove selected tag', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.addSelectedTag('vegetarian');
          result.current.addSelectedTag('vegan');
        });

        act(() => {
          result.current.removeSelectedTag('vegetarian');
        });

        expect(result.current.selectedTags).toEqual(['vegan']);
      });
    });

    describe('clearFilters', () => {
      it('should clear all filters and reset pagination', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setFilters({ cuisine_types: ['italian'] });
          result.current.setSearchQuery('pasta');
          result.current.addSelectedTag('vegetarian');
          result.current.setPagination({ page: 3, limit: 20 });
        });

        act(() => {
          result.current.clearFilters();
        });

        expect(result.current.filters).toEqual({});
        expect(result.current.searchQuery).toBe('');
        expect(result.current.selectedTags).toEqual([]);
        expect(result.current.pagination).toEqual({ page: 1, limit: 12 });
      });
    });

    describe('searchRecipes', () => {
      it('should set loading state during search', async () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.searchRecipes();
        });

        expect(result.current.isLoading).toBe(true);

        // Wait for the timeout to complete
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 1100));
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    describe('getFilteredRecipes', () => {
      const mockRecipes = [
        createMockRecipe({
          id: '1',
          title: 'Italian Pasta',
          description: 'Delicious pasta dish',
          cuisine_type: 'italian',
          dietary_tags: ['vegetarian'],
          difficulty: 'easy',
          created_at: '2024-01-01T00:00:00Z',
        }),
        createMockRecipe({
          id: '2',
          title: 'Mexican Tacos',
          description: 'Spicy tacos',
          cuisine_type: 'mexican',
          dietary_tags: ['gluten-free'],
          difficulty: 'medium',
          created_at: '2024-01-02T00:00:00Z',
        }),
        createMockRecipe({
          id: '3',
          title: 'Vegetarian Pizza',
          description: 'Cheese pizza',
          cuisine_type: 'italian',
          dietary_tags: ['vegetarian'],
          difficulty: 'hard',
          created_at: '2024-01-03T00:00:00Z',
        }),
      ];

      it('should filter by search term in title', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setFilters({ search: 'pasta' });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered).toHaveLength(1);
        expect(filtered[0].title).toBe('Italian Pasta');
      });

      it('should filter by search term in description', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setFilters({ search: 'spicy' });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered).toHaveLength(1);
        expect(filtered[0].title).toBe('Mexican Tacos');
      });

      it('should filter by cuisine types', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setFilters({ cuisine_types: ['italian'] });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered).toHaveLength(2);
        expect(filtered.every(r => r.cuisine_type === 'italian')).toBe(true);
      });

      it('should filter by dietary tags', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setFilters({ dietary_tags: ['vegetarian'] });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered).toHaveLength(2);
        expect(filtered.every(r => r.dietary_tags.includes('vegetarian'))).toBe(true);
      });

      it('should filter by difficulty', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setFilters({ difficulty: ['easy', 'medium'] });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered).toHaveLength(2);
        expect(filtered.every(r => ['easy', 'medium'].includes(r.difficulty))).toBe(true);
      });

      it('should combine multiple filters', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setFilters({
            cuisine_types: ['italian'],
            dietary_tags: ['vegetarian'],
            difficulty: ['easy'],
          });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered).toHaveLength(1);
        expect(filtered[0].title).toBe('Italian Pasta');
      });

      it('should sort by title ascending', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setSortOptions({ field: 'title', direction: 'asc' });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered[0].title).toBe('Italian Pasta');
        expect(filtered[1].title).toBe('Mexican Tacos');
        expect(filtered[2].title).toBe('Vegetarian Pizza');
      });

      it('should sort by title descending', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setSortOptions({ field: 'title', direction: 'desc' });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered[0].title).toBe('Vegetarian Pizza');
        expect(filtered[1].title).toBe('Mexican Tacos');
        expect(filtered[2].title).toBe('Italian Pasta');
      });

      it('should sort by created_at descending (default)', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(mockRecipes);
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered[0].created_at).toBe('2024-01-03T00:00:00Z');
        expect(filtered[1].created_at).toBe('2024-01-02T00:00:00Z');
        expect(filtered[2].created_at).toBe('2024-01-01T00:00:00Z');
      });

      it('should handle sorting with undefined values', () => {
        const recipesWithUndefined = [
          createMockRecipe({ id: '1', rating: 5 }),
          createMockRecipe({ id: '2', rating: undefined }),
          createMockRecipe({ id: '3', rating: 3 }),
        ];

        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.setRecipes(recipesWithUndefined);
          result.current.setSortOptions({ field: 'rating', direction: 'desc' });
        });

        const filtered = result.current.getFilteredRecipes();
        expect(filtered[0].rating).toBe(5);
        expect(filtered[1].rating).toBe(3);
        expect(filtered[2].rating).toBeUndefined();
      });
    });

    describe('getTotalPages', () => {
      it('should calculate total pages correctly', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipes = Array.from({ length: 25 }, (_, i) => 
          createMockRecipe({ id: `${i + 1}` })
        );

        act(() => {
          result.current.setRecipes(mockRecipes);
          result.current.setPagination({ page: 1, limit: 12 });
        });

        expect(result.current.getTotalPages()).toBe(3); // 25 / 12 = 2.08 -> 3
      });

      it('should handle empty recipes', () => {
        const { result } = renderHook(() => useRecipeStore());

        expect(result.current.getTotalPages()).toBe(0);
      });
    });
  });

  describe('User Recipes and Favorites', () => {
    describe('setUserRecipes', () => {
      it('should set user recipes', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipes = [createMockRecipe({ id: '1' })];

        act(() => {
          result.current.setUserRecipes(mockRecipes);
        });

        expect(result.current.userRecipes).toEqual(mockRecipes);
      });
    });

    describe('addToFavorites', () => {
      it('should add recipe to favorites', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: '1' });

        act(() => {
          result.current.setRecipes([mockRecipe]);
        });

        act(() => {
          result.current.addToFavorites('1');
        });

        expect(result.current.favoriteRecipes).toContain(mockRecipe);
      });

      it('should not add recipe if it does not exist', () => {
        const { result } = renderHook(() => useRecipeStore());

        act(() => {
          result.current.addToFavorites('nonexistent');
        });

        expect(result.current.favoriteRecipes).toEqual([]);
      });
    });

    describe('removeFromFavorites', () => {
      it('should remove recipe from favorites', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: '1' });

        act(() => {
          result.current.setRecipes([mockRecipe]);
          result.current.addToFavorites('1');
        });

        act(() => {
          result.current.removeFromFavorites('1');
        });

        expect(result.current.favoriteRecipes).not.toContain(mockRecipe);
      });
    });
  });

  describe('Collections', () => {
    describe('setCollections', () => {
      it('should set collections', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollections = [createMockCollection({ id: '1' })];

        act(() => {
          result.current.setCollections(mockCollections);
        });

        expect(result.current.collections).toEqual(mockCollections);
      });
    });

    describe('createCollection', () => {
      it('should add collection to collections array', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollection = createMockCollection();

        act(() => {
          result.current.createCollection(mockCollection);
        });

        expect(result.current.collections).toContain(mockCollection);
      });
    });

    describe('updateCollection', () => {
      it('should update collection in collections array', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollection = createMockCollection({ id: '1', name: 'Original Name' });

        act(() => {
          result.current.setCollections([mockCollection]);
        });

        act(() => {
          result.current.updateCollection('1', { name: 'Updated Name' });
        });

        expect(result.current.collections[0].name).toBe('Updated Name');
        expect(result.current.collections[0].updated_at).toBeDefined();
      });
    });

    describe('deleteCollection', () => {
      it('should remove collection from collections array', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollection1 = createMockCollection({ id: '1' });
        const mockCollection2 = createMockCollection({ id: '2' });

        act(() => {
          result.current.setCollections([mockCollection1, mockCollection2]);
        });

        act(() => {
          result.current.deleteCollection('1');
        });

        expect(result.current.collections).toHaveLength(1);
        expect(result.current.collections[0].id).toBe('2');
      });

      it('should clear current collection if it matches deleted collection', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollection = createMockCollection({ id: '1' });

        act(() => {
          result.current.setCollections([mockCollection]);
          result.current.currentCollection = mockCollection;
        });

        act(() => {
          result.current.deleteCollection('1');
        });

        expect(result.current.currentCollection).toBeNull();
      });
    });

    describe('addRecipeToCollection', () => {
      it('should add recipe id to collection', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollection = createMockCollection({ id: '1', recipe_ids: ['recipe-1'] });

        act(() => {
          result.current.setCollections([mockCollection]);
        });

        act(() => {
          result.current.addRecipeToCollection('1', 'recipe-2');
        });

        expect(result.current.collections[0].recipe_ids).toContain('recipe-2');
      });
    });

    describe('removeRecipeFromCollection', () => {
      it('should remove recipe id from collection', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockCollection = createMockCollection({ 
          id: '1', 
          recipe_ids: ['recipe-1', 'recipe-2'] 
        });

        act(() => {
          result.current.setCollections([mockCollection]);
        });

        act(() => {
          result.current.removeRecipeFromCollection('1', 'recipe-1');
        });

        expect(result.current.collections[0].recipe_ids).not.toContain('recipe-1');
        expect(result.current.collections[0].recipe_ids).toContain('recipe-2');
      });
    });
  });

  describe('AI Generation', () => {
    describe('setAIRequest', () => {
      it('should set AI request', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRequest: AIRecipeRequest = {
          prompt: 'Generate a pasta recipe',
          cuisine_type: 'italian',
          provider: 'claude',
        };

        act(() => {
          result.current.setAIRequest(mockRequest);
        });

        expect(result.current.aiRequest).toEqual(mockRequest);
      });
    });

    describe('setAIResponse', () => {
      it('should set AI response', () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockResponse: AIRecipeResponse = {
          recipe: {
            title: 'AI Generated Recipe',
            description: 'Generated by AI',
            ingredients: [],
            instructions: [],
            prep_time: 15,
            cook_time: 30,
            total_time: 45,
            servings: 4,
            cuisine_type: 'italian',
            meal_types: ['dinner'],
            dietary_tags: [],
            difficulty: 'medium',
            nutritional_info: {
              calories: 300,
              protein: 15,
              carbs: 45,
              fat: 10,
            },
            ai_generated: true,
            ai_provider: 'claude',
            is_public: true,
          },
          confidence_score: 0.95,
        };

        act(() => {
          result.current.setAIResponse(mockResponse);
        });

        expect(result.current.aiResponse).toEqual(mockResponse);
      });
    });

    describe('generateAIRecipe', () => {
      it('should generate AI recipe successfully', async () => {
        const mockRequest: AIRecipeRequest = {
          prompt: 'Generate a pasta recipe',
          cuisine_type: 'italian',
          provider: 'claude',
        };

        const mockResponse: AIRecipeResponse = {
          recipe: {
            title: 'AI Generated Pasta',
            description: 'Delicious AI pasta',
            ingredients: [],
            instructions: [],
            prep_time: 15,
            cook_time: 30,
            total_time: 45,
            servings: 4,
            cuisine_type: 'italian',
            meal_types: ['dinner'],
            dietary_tags: [],
            difficulty: 'medium',
            nutritional_info: {
              calories: 400,
              protein: 18,
              carbs: 50,
              fat: 12,
            },
            ai_generated: true,
            ai_provider: 'claude',
            is_public: true,
          },
          confidence_score: 0.9,
        };

        (generateRecipeWithAI as jest.Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useRecipeStore());

        await act(async () => {
          await result.current.generateAIRecipe(mockRequest);
        });

        expect(result.current.isGeneratingAI).toBe(false);
        expect(result.current.aiRequest).toEqual(mockRequest);
        expect(result.current.aiResponse).toEqual(mockResponse);
        expect(generateRecipeWithAI).toHaveBeenCalledWith(mockRequest);
      });

      it('should handle AI generation error', async () => {
        const mockRequest: AIRecipeRequest = {
          prompt: 'Generate a pasta recipe',
          cuisine_type: 'italian',
          provider: 'claude',
        };

        const mockError = new Error('AI generation failed');
        (generateRecipeWithAI as jest.Mock).mockRejectedValue(mockError);

        const { result } = renderHook(() => useRecipeStore());

        await act(async () => {
          await expect(result.current.generateAIRecipe(mockRequest)).rejects.toThrow('AI generation failed');
        });

        expect(result.current.isGeneratingAI).toBe(false);
        expect(result.current.aiRequest).toEqual(mockRequest);
        expect(result.current.aiResponse).toBeNull();
      });
    });

    describe('saveAIRecipe', () => {
      it('should save AI recipe', async () => {
        const mockFormData: RecipeFormData = {
          title: 'AI Recipe',
          description: 'AI generated recipe',
          ingredients: [],
          instructions: [],
          prep_time: 15,
          cook_time: 30,
          servings: 4,
          cuisine_type: 'italian',
          meal_types: ['dinner'],
          dietary_tags: [],
          difficulty: 'medium',
          is_public: true,
        };

        const { result } = renderHook(() => useRecipeStore());

        await act(async () => {
          await result.current.saveAIRecipe(mockFormData);
        });

        expect(result.current.isCreating).toBe(false);
      });
    });
  });

  describe('Cooking', () => {
    describe('startCookingSession', () => {
      it('should start cooking session', async () => {
        const { result } = renderHook(() => useRecipeStore());

        const session = await act(async () => {
          return await result.current.startCookingSession('recipe-1');
        });

        expect(session).toEqual({
          id: 'test-uuid',
          recipe_id: 'recipe-1',
          user_id: 'current-user',
          started_at: expect.any(String),
          created_at: expect.any(String),
        });
      });
    });

    describe('completeCookingSession', () => {
      it('should complete cooking session and increment times_cooked', async () => {
        const { result } = renderHook(() => useRecipeStore());
        const mockRecipe = createMockRecipe({ id: 'recipe-1', times_cooked: 5 });

        act(() => {
          result.current.setRecipes([mockRecipe]);
        });

        await act(async () => {
          await result.current.completeCookingSession('session-1', {
            recipe_id: 'recipe-1',
            completed_at: new Date().toISOString(),
          });
        });

        expect(result.current.recipes[0].times_cooked).toBe(6);
      });

      it('should handle completing session for non-existent recipe', async () => {
        const { result } = renderHook(() => useRecipeStore());

        await act(async () => {
          await result.current.completeCookingSession('session-1', {
            recipe_id: 'nonexistent',
            completed_at: new Date().toISOString(),
          });
        });

        // Should not throw error
        expect(result.current.recipes).toEqual([]);
      });
    });

    describe('rateRecipe', () => {
      it('should rate recipe', async () => {
        const { result } = renderHook(() => useRecipeStore());
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await act(async () => {
          await result.current.rateRecipe('recipe-1', 5, 'Great recipe!');
        });

        expect(consoleSpy).toHaveBeenCalledWith('Rating recipe:', 'recipe-1', 5, 'Great recipe!');

        consoleSpy.mockRestore();
      });
    });
  });

  describe('UI State Management', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set creating state', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setIsCreating(true);
      });

      expect(result.current.isCreating).toBe(true);
    });

    it('should set generating AI state', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setIsGeneratingAI(true);
      });

      expect(result.current.isGeneratingAI).toBe(true);
    });

    it('should set analyzing nutrition state', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setIsAnalyzingNutrition(true);
      });

      expect(result.current.isAnalyzingNutrition).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty recipes in filtering', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.setFilters({ search: 'nonexistent' });
      });

      const filtered = result.current.getFilteredRecipes();
      expect(filtered).toEqual([]);
    });

    it('should handle invalid sort field gracefully', () => {
      const { result } = renderHook(() => useRecipeStore());
      const mockRecipes = [createMockRecipe({ id: '1' })];

      act(() => {
        result.current.setRecipes(mockRecipes);
        result.current.setSortOptions({ field: 'invalid' as any, direction: 'asc' });
      });

      const filtered = result.current.getFilteredRecipes();
      expect(filtered).toEqual(mockRecipes);
    });

    it('should handle updating non-existent recipe', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.updateRecipe('nonexistent', { title: 'Updated' });
      });

      expect(result.current.recipes).toEqual([]);
    });

    it('should handle deleting non-existent recipe', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.deleteRecipe('nonexistent');
      });

      expect(result.current.recipes).toEqual([]);
    });

    it('should handle adding recipe to non-existent collection', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.addRecipeToCollection('nonexistent', 'recipe-1');
      });

      expect(result.current.collections).toEqual([]);
    });

    it('should handle removing recipe from non-existent collection', () => {
      const { result } = renderHook(() => useRecipeStore());

      act(() => {
        result.current.removeRecipeFromCollection('nonexistent', 'recipe-1');
      });

      expect(result.current.collections).toEqual([]);
    });
  });
});