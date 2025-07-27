import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '@/services/logger';

import {
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
} from '../types';
import { generateRecipeWithAI } from '../utils/aiGeneration';

interface RecipeState {
  // State
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  searchResult: RecipeSearchResult | null;
  userRecipes: Recipe[];
  favoriteRecipes: Recipe[];
  collections: RecipeCollection[];
  currentCollection: RecipeCollection | null;
  
  // Filters and sorting
  filters: RecipeFilters;
  sortOptions: RecipeSortOptions;
  pagination: PaginationOptions;
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isGeneratingAI: boolean;
  isAnalyzingNutrition: boolean;
  searchQuery: string;
  selectedTags: string[];
  
  // AI Generation
  aiRequest: AIRecipeRequest | null;
  aiResponse: AIRecipeResponse | null;
  
  // Actions - Recipes
  setRecipes: (recipes: Recipe[]) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  
  // Actions - Search and Filter
  setFilters: (filters: RecipeFilters) => void;
  setSortOptions: (options: RecipeSortOptions) => void;
  setPagination: (options: PaginationOptions) => void;
  setSearchQuery: (query: string) => void;
  addSelectedTag: (tag: string) => void;
  removeSelectedTag: (tag: string) => void;
  clearFilters: () => void;
  searchRecipes: () => Promise<void>;
  
  // Actions - User Recipes
  setUserRecipes: (recipes: Recipe[]) => void;
  addToFavorites: (recipeId: string) => void;
  removeFromFavorites: (recipeId: string) => void;
  
  // Actions - Collections
  setCollections: (collections: RecipeCollection[]) => void;
  createCollection: (collection: RecipeCollection) => void;
  updateCollection: (id: string, updates: Partial<RecipeCollection>) => void;
  deleteCollection: (id: string) => void;
  addRecipeToCollection: (collectionId: string, recipeId: string) => void;
  removeRecipeFromCollection: (collectionId: string, recipeId: string) => void;
  
  // Actions - AI Generation
  setAIRequest: (request: AIRecipeRequest) => void;
  setAIResponse: (response: AIRecipeResponse | null) => void;
  generateAIRecipe: (request: AIRecipeRequest) => Promise<void>;
  saveAIRecipe: (recipe: RecipeFormData) => Promise<void>;
  
  // Actions - Cooking
  startCookingSession: (recipeId: string) => Promise<CookingSession>;
  completeCookingSession: (sessionId: string, data: Partial<CookingSession>) => Promise<void>;
  rateRecipe: (recipeId: string, rating: number, comment?: string) => Promise<void>;
  
  // Actions - UI State
  setIsLoading: (loading: boolean) => void;
  setIsCreating: (creating: boolean) => void;
  setIsGeneratingAI: (generating: boolean) => void;
  setIsAnalyzingNutrition: (analyzing: boolean) => void;
  
  // Utility functions
  getRecipeById: (id: string) => Recipe | undefined;
  getFilteredRecipes: () => Recipe[];
  getTotalPages: () => number;
}

export const useRecipeStore = create<RecipeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      recipes: [],
      currentRecipe: null,
      searchResult: null,
      userRecipes: [],
      favoriteRecipes: [],
      collections: [],
      currentCollection: null,
      
      filters: {},
      sortOptions: { field: 'created_at', direction: 'desc' },
      pagination: { page: 1, limit: 12 },
      
      isLoading: false,
      isCreating: false,
      isGeneratingAI: false,
      isAnalyzingNutrition: false,
      searchQuery: '',
      selectedTags: [],
      
      aiRequest: null,
      aiResponse: null,
      
      // Recipe actions
      setRecipes: (recipes) => set({ recipes }),
      setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
      addRecipe: (recipe) => set((state) => ({
        recipes: [recipe, ...state.recipes],
        userRecipes: [recipe, ...state.userRecipes],
      })),
      updateRecipe: (id, updates) => set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
        ),
        currentRecipe: state.currentRecipe?.id === id
          ? { ...state.currentRecipe, ...updates, updated_at: new Date().toISOString() }
          : state.currentRecipe,
      })),
      deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        userRecipes: state.userRecipes.filter((r) => r.id !== id),
        currentRecipe: state.currentRecipe?.id === id ? null : state.currentRecipe,
      })),
      
      // Search and filter actions
      setFilters: (filters) => set({ filters, pagination: { page: 1, limit: 12 } }),
      setSortOptions: (options) => set({ sortOptions: options }),
      setPagination: (options) => set({ pagination: options }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      addSelectedTag: (tag) => set((state) => ({
        selectedTags: [...state.selectedTags, tag],
      })),
      removeSelectedTag: (tag) => set((state) => ({
        selectedTags: state.selectedTags.filter((t) => t !== tag),
      })),
      clearFilters: () => set({
        filters: {},
        searchQuery: '',
        selectedTags: [],
        pagination: { page: 1, limit: 12 },
      }),
      searchRecipes: async () => {
        set({ isLoading: true });
        // This will be implemented with Supabase integration
        setTimeout(() => set({ isLoading: false }), 1000);
      },
      
      // User recipe actions
      setUserRecipes: (recipes) => set({ userRecipes: recipes }),
      addToFavorites: (recipeId) => {
        const recipe = get().recipes.find((r) => r.id === recipeId);
        if (recipe) {
          set((state) => ({
            favoriteRecipes: [...state.favoriteRecipes, recipe],
          }));
        }
      },
      removeFromFavorites: (recipeId) => set((state) => ({
        favoriteRecipes: state.favoriteRecipes.filter((r) => r.id !== recipeId),
      })),
      
      // Collection actions
      setCollections: (collections) => set({ collections }),
      createCollection: (collection) => set((state) => ({
        collections: [...state.collections, collection],
      })),
      updateCollection: (id, updates) => set((state) => ({
        collections: state.collections.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        ),
      })),
      deleteCollection: (id) => set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
        currentCollection: state.currentCollection?.id === id ? null : state.currentCollection,
      })),
      addRecipeToCollection: (collectionId, recipeId) => set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId
            ? { ...c, recipe_ids: [...c.recipe_ids, recipeId] }
            : c
        ),
      })),
      removeRecipeFromCollection: (collectionId, recipeId) => set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId
            ? { ...c, recipe_ids: c.recipe_ids.filter((id) => id !== recipeId) }
            : c
        ),
      })),
      
      // AI Generation actions
      setAIRequest: (request) => set({ aiRequest: request }),
      setAIResponse: (response) => set({ aiResponse: response }),
      generateAIRecipe: async (request) => {
        set({ isGeneratingAI: true, aiRequest: request, aiResponse: null });
        try {
          const response = await generateRecipeWithAI(request);
          set({ aiResponse: response, isGeneratingAI: false });
        } catch (error: unknown) {
          logger.error('Failed to generate AI recipe:', 'recipes:recipeStore', error);
          set({ isGeneratingAI: false });
          throw error;
        }
      },
      saveAIRecipe: async (recipe) => {
        set({ isCreating: true });
        // This will be implemented with Supabase
        setTimeout(() => set({ isCreating: false }), 1000);
      },
      
      // Cooking actions
      startCookingSession: async (recipeId) => {
        // This will be implemented with Supabase
        return {
          id: crypto.randomUUID(),
          recipe_id: recipeId,
          user_id: 'current-user',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
      },
      completeCookingSession: async (sessionId, data) => {
        // This will be implemented with Supabase
        const recipe = get().recipes.find((r) => r.id === data.recipe_id);
        if (recipe) {
          set((state) => ({
            recipes: state.recipes.map((r) =>
              r.id === recipe.id
                ? { ...r, times_cooked: (r.times_cooked || 0) + 1 }
                : r
            ),
          }));
        }
      },
      rateRecipe: async (recipeId, rating, comment) => {
        // This will be implemented with Supabase

      },
      
      // UI State actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsCreating: (creating) => set({ isCreating: creating }),
      setIsGeneratingAI: (generating) => set({ isGeneratingAI: generating }),
      setIsAnalyzingNutrition: (analyzing) => set({ isAnalyzingNutrition: analyzing }),
      
      // Utility functions
      getRecipeById: (id) => {
        return get().recipes.find((r) => r.id === id);
      },
      getFilteredRecipes: () => {
        const state = get();
        let filtered = [...state.recipes];
        
        // Apply filters
        if (state.filters.search) {
          const search = state.filters.search.toLowerCase();
          filtered = filtered.filter((r) =>
            r.title.toLowerCase().includes(search) ||
            r.description.toLowerCase().includes(search)
          );
        }
        
        if (state.filters.cuisine_types?.length) {
          filtered = filtered.filter((r) =>
            state.filters.cuisine_types!.includes(r.cuisine_type)
          );
        }
        
        if (state.filters.dietary_tags?.length) {
          filtered = filtered.filter((r) =>
            state.filters.dietary_tags!.some((tag) => r.dietary_tags.includes(tag))
          );
        }
        
        if (state.filters.difficulty?.length) {
          filtered = filtered.filter((r) =>
            state.filters.difficulty!.includes(r.difficulty)
          );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          const field = state.sortOptions.field;
          const direction = state.sortOptions.direction === 'asc' ? 1 : -1;
          
          if (field === 'title') {
            return a.title.localeCompare(b.title) * direction;
          }
          
          const aValue = a[field] || 0;
          const bValue = b[field] || 0;
          
          if (aValue < bValue) return -1 * direction;
          if (aValue > bValue) return 1 * direction;
          return 0;
        });
        
        return filtered;
      },
      getTotalPages: () => {
        const state = get();
        const filtered = state.getFilteredRecipes();
        return Math.ceil(filtered.length / state.pagination.limit);
      },
    }),
    {
      name: 'recipe-store',
    }
  )
);