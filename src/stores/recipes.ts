import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { recipeService } from '@/lib/services/recipe.service';
import type { 
  Recipe, 
  RecipeSearchParams, 
  RecipeFormData,
  RecipeCollection,
  PantryCompatibility 
} from '@/types/recipes';
import type { PantryItem } from '@/types/pantry';

// Fallback to mock data when database is not available
async function loadMockRecipes(): Promise<Recipe[]> {
  try {
    const response = await fetch('/data/mock-recipes.json');
    if (!response.ok) {
      throw new Error('Failed to load mock recipes');
    }
    return await response.json();
  } catch (error: unknown) {
    console.warn('Could not load mock recipes, using empty array');
    return [];
  }
}

interface RecipesState {
  // Core state
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  
  // Pagination and search
  searchParams: RecipeSearchParams;
  totalCount: number;
  hasMore: boolean;
  
  // User interactions
  favoriteIds: string[];
  userRatings: Map<string, number>;
  collections: RecipeCollection[];
  
  // Pantry integration
  pantryCompatibility: Map<string, PantryCompatibility>;
  
  // Actions - Core CRUD
  fetchRecipes: (params?: Partial<RecipeSearchParams>) => Promise<void>;
  fetchRecipeById: (id: string) => Promise<void>;
  createRecipe: (data: RecipeFormData) => Promise<Recipe>;
  updateRecipe: (id: string, data: Partial<RecipeFormData>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  
  // Actions - Search and filtering
  setSearchParams: (params: Partial<RecipeSearchParams>) => void;
  clearFilters: () => void;
  loadMoreRecipes: () => Promise<void>;
  
  // Actions - User interactions
  toggleFavorite: (recipeId: string) => Promise<void>;
  rateRecipe: (recipeId: string, rating: number, review?: string) => Promise<void>;
  shareRecipe: (recipeId: string) => Promise<string>;
  
  // Actions - Collections
  fetchCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<RecipeCollection>;
  addToCollection: (recipeId: string, collectionId: string) => Promise<void>;
  removeFromCollection: (recipeId: string, collectionId: string) => Promise<void>;
  
  // Actions - Pantry integration
  checkPantryCompatibility: (recipeId: string, pantryItems: PantryItem[]) => Promise<void>;
  getRecipesCanMake: (pantryItems: PantryItem[]) => Promise<Recipe[]>;
  
  // Utility actions
  reset: () => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  setError: (error: string | null) => void;
}

const initialSearchParams: RecipeSearchParams = {
  query: '',
  sort_by: 'created_at',
  sort_order: 'desc',
  limit: 20,
  offset: 0
};

export const useRecipesStore = create<RecipesState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    recipes: [],
    currentRecipe: null,
    isLoading: false,
    error: null,
    searchParams: initialSearchParams,
    totalCount: 0,
    hasMore: true,
    favoriteIds: [],
    userRatings: new Map(),
    collections: [],
    pantryCompatibility: new Map(),

    // Core CRUD actions
    fetchRecipes: async (params) => {
      const state = get();
      const newParams = { ...state.searchParams, ...params };
      
      // Reset if this is a new search
      if (params && Object.keys(params).some(key => key !== 'offset')) {
        newParams.offset = 0;
        set({ recipes: [], hasMore: true });
      }

      if (state.isLoading || (!state.hasMore && newParams.offset > 0)) return;

      set({ isLoading: true, error: null, searchParams: newParams });

      try {
        const result = await recipeService.getRecipes(newParams);
        
        set(state => ({
          recipes: newParams.offset === 0 ? result.recipes : [...state.recipes, ...result.recipes],
          totalCount: result.total,
          hasMore: result.recipes.length === newParams.limit,
          isLoading: false,
          searchParams: { ...newParams, offset: newParams.offset + newParams.limit }
        }));
      } catch (error: unknown) {
        // Fallback to mock data if database fails
        console.warn('Database failed, loading mock recipes:', error);
        try {
          const mockRecipes = await loadMockRecipes();
          set({
            recipes: mockRecipes,
            totalCount: mockRecipes.length,
            hasMore: false,
            isLoading: false,
            error: null
          });
        } catch (mockError: unknown) {
          set({ 
            error: 'Error al cargar recetas y datos de prueba no disponibles',
            isLoading: false 
          });
        }
      }
    },

    fetchRecipeById: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        const recipe = await recipeService.getRecipeById(id);
        set({ currentRecipe: recipe, isLoading: false });
      } catch (error: unknown) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al cargar receta',
          isLoading: false,
          currentRecipe: null
        });
      }
    },

    createRecipe: async (data: RecipeFormData) => {
      set({ isLoading: true, error: null });

      try {
        const newRecipe = await recipeService.createRecipe(data);
        
        set(state => ({
          recipes: [newRecipe, ...state.recipes],
          currentRecipe: newRecipe,
          totalCount: state.totalCount + 1,
          isLoading: false
        }));

        return newRecipe;
      } catch (error: unknown) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al crear receta',
          isLoading: false 
        });
        throw error;
      }
    },

    updateRecipe: async (id: string, data: Partial<RecipeFormData>) => {
      set({ isLoading: true, error: null });

      try {
        const updatedRecipe = await recipeService.updateRecipe(id, data);
        
        set(state => ({
          recipes: state.recipes.map(r => r.id === id ? updatedRecipe : r),
          currentRecipe: state.currentRecipe?.id === id ? updatedRecipe : state.currentRecipe,
          isLoading: false
        }));
      } catch (error: unknown) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al actualizar receta',
          isLoading: false 
        });
        throw error;
      }
    },

    deleteRecipe: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        await recipeService.deleteRecipe(id);
        
        set(state => ({
          recipes: state.recipes.filter(r => r.id !== id),
          currentRecipe: state.currentRecipe?.id === id ? null : state.currentRecipe,
          totalCount: Math.max(0, state.totalCount - 1),
          isLoading: false
        }));
      } catch (error: unknown) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al eliminar receta',
          isLoading: false 
        });
        throw error;
      }
    },

    // Search and filtering actions
    setSearchParams: (params) => {
      const state = get();
      const newParams = { ...state.searchParams, ...params, offset: 0 };
      set({ searchParams: newParams });
      get().fetchRecipes();
    },

    clearFilters: () => {
      set({ searchParams: initialSearchParams });
      get().fetchRecipes();
    },

    loadMoreRecipes: async () => {
      const state = get();
      if (!state.hasMore || state.isLoading) return;
      
      await get().fetchRecipes({ offset: state.searchParams.offset });
    },

    // User interaction actions
    toggleFavorite: async (recipeId: string) => {
      const state = get();
      const isFavorite = state.favoriteIds.includes(recipeId);

      // Optimistic update
      set({
        favoriteIds: isFavorite 
          ? state.favoriteIds.filter(id => id !== recipeId)
          : [...state.favoriteIds, recipeId]
      });

      try {
        if (isFavorite) {
          await recipeService.removeFromFavorites(recipeId);
        } else {
          await recipeService.addToFavorites(recipeId);
        }

        // Update recipe in list if present
        set(state => ({
          recipes: state.recipes.map(recipe => 
            recipe.id === recipeId 
              ? { ...recipe, favorited_by: isFavorite ? [] : ['current-user'] }
              : recipe
          ),
          currentRecipe: state.currentRecipe?.id === recipeId 
            ? { ...state.currentRecipe, favorited_by: isFavorite ? [] : ['current-user'] }
            : state.currentRecipe
        }));
      } catch (error: unknown) {
        // Revert optimistic update
        set({
          favoriteIds: isFavorite 
            ? [...state.favoriteIds, recipeId]
            : state.favoriteIds.filter(id => id !== recipeId)
        });
        
        set({ error: error instanceof Error ? error.message : 'Error al actualizar favoritos' });
        throw error;
      }
    },

    rateRecipe: async (recipeId: string, rating: number, review?: string) => {
      const state = get();
      
      // Optimistic update
      const newRatings = new Map(state.userRatings);
      newRatings.set(recipeId, rating);
      set({ userRatings: newRatings });

      try {
        await recipeService.rateRecipe(recipeId, rating, review);
        
        // Refresh the recipe to get updated average rating
        if (state.currentRecipe?.id === recipeId) {
          await get().fetchRecipeById(recipeId);
        }
      } catch (error: unknown) {
        // Revert optimistic update
        set({ userRatings: state.userRatings });
        set({ error: error instanceof Error ? error.message : 'Error al calificar receta' });
        throw error;
      }
    },

    shareRecipe: async (recipeId: string) => {
      try {
        const shareUrl = `${window.location.origin}/recetas/${recipeId}`;
        
        if (navigator.share) {
          const recipe = get().recipes.find(r => r.id === recipeId) || get().currentRecipe;
          await navigator.share({
            title: recipe?.name || 'Receta',
            text: recipe?.description || 'Mira esta deliciosa receta',
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
        }
        
        return shareUrl;
      } catch (error: unknown) {
        set({ error: 'Error al compartir receta' });
        throw error;
      }
    },

    // Collection actions
    fetchCollections: async () => {
      try {
        const collections = await recipeService.getUserCollections();
        set({ collections });
      } catch (error: unknown) {
        set({ error: error instanceof Error ? error.message : 'Error al cargar colecciones' });
      }
    },

    createCollection: async (name: string, description?: string) => {
      try {
        const collection = await recipeService.createCollection({ name, description });
        set(state => ({
          collections: [...state.collections, collection]
        }));
        return collection;
      } catch (error: unknown) {
        set({ error: error instanceof Error ? error.message : 'Error al crear colección' });
        throw error;
      }
    },

    addToCollection: async (recipeId: string, collectionId: string) => {
      try {
        await recipeService.addToCollection(recipeId, collectionId);
        // Could refresh collections here if needed
      } catch (error: unknown) {
        set({ error: error instanceof Error ? error.message : 'Error al agregar a colección' });
        throw error;
      }
    },

    removeFromCollection: async (recipeId: string, collectionId: string) => {
      try {
        await recipeService.removeFromCollection(recipeId, collectionId);
        // Could refresh collections here if needed
      } catch (error: unknown) {
        set({ error: error instanceof Error ? error.message : 'Error al remover de colección' });
        throw error;
      }
    },

    // Pantry integration actions
    checkPantryCompatibility: async (recipeId: string, pantryItems: PantryItem[]) => {
      try {
        const compatibility = await recipeService.checkPantryCompatibility(recipeId, pantryItems);
        set(state => ({
          pantryCompatibility: new Map(state.pantryCompatibility).set(recipeId, compatibility)
        }));
      } catch (error: unknown) {
        console.error('Error checking pantry compatibility:', error);
      }
    },

    getRecipesCanMake: async (pantryItems: PantryItem[]) => {
      try {
        const recipes = await recipeService.getRecipesCanMake(pantryItems);
        return recipes;
      } catch (error: unknown) {
        set({ error: error instanceof Error ? error.message : 'Error al buscar recetas disponibles' });
        return [];
      }
    },

    // Utility actions
    reset: () => {
      set({
        recipes: [],
        currentRecipe: null,
        isLoading: false,
        error: null,
        searchParams: initialSearchParams,
        totalCount: 0,
        hasMore: true,
        favoriteIds: [],
        userRatings: new Map(),
        collections: [],
        pantryCompatibility: new Map(),
      });
    },

    setCurrentRecipe: (recipe: Recipe | null) => {
      set({ currentRecipe: recipe });
    },

    setError: (error: string | null) => {
      set({ error });
    },
  }))
);