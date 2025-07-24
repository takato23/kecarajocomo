/**
 * Recipe Slice - Recipe state management
 */

import { StateCreator } from 'zustand';

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  optional?: boolean;
  category?: string;
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  duration?: number; // in minutes
  temperature?: number;
  image?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  category: string;
  cuisine?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  image?: string;
  tags: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  rating: number;
  ratingCount: number;
  isFavorite: boolean;
  isPersonal: boolean; // user-created vs. community/AI
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  lastCooked?: Date;
  cookCount: number;
}

export interface RecipeFilter {
  category?: string[];
  cuisine?: string[];
  difficulty?: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  dietary?: string[]; // vegetarian, vegan, gluten-free, etc.
  ingredients?: string[]; // must contain these ingredients
  excludeIngredients?: string[]; // must not contain these
  rating?: number; // minimum rating
  tags?: string[];
}

export interface RecipeSlice {
  recipes: {
    items: Recipe[];
    favorites: string[]; // recipe IDs
    recentlyViewed: string[]; // recipe IDs
    searchHistory: string[];
    categories: string[];
    cuisines: string[];
    tags: string[];
    currentFilter: RecipeFilter;
    isLoading: boolean;
    lastSync?: Date;
  };
  
  // Actions
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'cookCount'>) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  favoriteRecipe: (id: string, favorite?: boolean) => void;
  rateRecipe: (id: string, rating: number) => void;
  addToRecentlyViewed: (id: string) => void;
  markAsCooked: (id: string) => void;
  setRecipeFilter: (filter: Partial<RecipeFilter>) => void;
  clearRecipeFilter: () => void;
  addSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
  setRecipesLoading: (loading: boolean) => void;
  importRecipes: (recipes: Recipe[]) => void;
  duplicateRecipe: (id: string) => void;
}

const defaultCategories = [
  'desayuno',
  'almuerzo',
  'cena',
  'snack',
  'postre',
  'bebida',
  'aperitivo',
  'ensalada',
  'sopa',
  'pasta',
  'pizza',
  'asado',
  'vegetariano',
  'vegano'
];

const defaultCuisines = [
  'argentina',
  'italiana',
  'mexicana',
  'china',
  'japonesa',
  'francesa',
  'española',
  'india',
  'tailandesa',
  'mediterránea',
  'americana',
  'brasileña'
];

export const createRecipeSlice: StateCreator<RecipeSlice> = (set, get) => ({
  recipes: {
    items: [],
    favorites: [],
    recentlyViewed: [],
    searchHistory: [],
    categories: defaultCategories,
    cuisines: defaultCuisines,
    tags: [],
    currentFilter: {},
    isLoading: false,
    lastSync: undefined
  },
  
  addRecipe: (recipe) => set((state) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      rating: 0,
      ratingCount: 0,
      cookCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    state.recipes.items.push(newRecipe);
    
    // Add new categories, cuisines, and tags
    if (!state.recipes.categories.includes(recipe.category)) {
      state.recipes.categories.push(recipe.category);
    }
    
    if (recipe.cuisine && !state.recipes.cuisines.includes(recipe.cuisine)) {
      state.recipes.cuisines.push(recipe.cuisine);
    }
    
    recipe.tags.forEach(tag => {
      if (!state.recipes.tags.includes(tag)) {
        state.recipes.tags.push(tag);
      }
    });
  }),
  
  updateRecipe: (id, updates) => set((state) => {
    const index = state.recipes.items.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
      Object.assign(state.recipes.items[index], updates, { updatedAt: new Date() });
    }
  }),
  
  deleteRecipe: (id) => set((state) => {
    state.recipes.items = state.recipes.items.filter(recipe => recipe.id !== id);
    state.recipes.favorites = state.recipes.favorites.filter(favId => favId !== id);
    state.recipes.recentlyViewed = state.recipes.recentlyViewed.filter(viewId => viewId !== id);
  }),
  
  favoriteRecipe: (id, favorite) => set((state) => {
    const recipe = state.recipes.items.find(recipe => recipe.id === id);
    if (recipe) {
      const isFavorite = favorite !== undefined ? favorite : !recipe.isFavorite;
      recipe.isFavorite = isFavorite;
      recipe.updatedAt = new Date();
      
      if (isFavorite && !state.recipes.favorites.includes(id)) {
        state.recipes.favorites.push(id);
      } else if (!isFavorite) {
        state.recipes.favorites = state.recipes.favorites.filter(favId => favId !== id);
      }
    }
  }),
  
  rateRecipe: (id, rating) => set((state) => {
    const recipe = state.recipes.items.find(recipe => recipe.id === id);
    if (recipe) {
      // Simple rating update (in real app, would handle user-specific ratings)
      const newRatingCount = recipe.ratingCount + 1;
      const newRating = ((recipe.rating * recipe.ratingCount) + rating) / newRatingCount;
      
      recipe.rating = newRating;
      recipe.ratingCount = newRatingCount;
      recipe.updatedAt = new Date();
    }
  }),
  
  addToRecentlyViewed: (id) => set((state) => {
    // Remove if already exists and add to front
    state.recipes.recentlyViewed = state.recipes.recentlyViewed.filter(viewId => viewId !== id);
    state.recipes.recentlyViewed.unshift(id);
    
    // Keep only last 20 items
    if (state.recipes.recentlyViewed.length > 20) {
      state.recipes.recentlyViewed = state.recipes.recentlyViewed.slice(0, 20);
    }
  }),
  
  markAsCooked: (id) => set((state) => {
    const recipe = state.recipes.items.find(recipe => recipe.id === id);
    if (recipe) {
      recipe.lastCooked = new Date();
      recipe.cookCount += 1;
      recipe.updatedAt = new Date();
    }
  }),
  
  setRecipeFilter: (filter) => set((state) => {
    Object.assign(state.recipes.currentFilter, filter);
  }),
  
  clearRecipeFilter: () => set((state) => {
    state.recipes.currentFilter = {};
  }),
  
  addSearchTerm: (term) => set((state) => {
    const trimmedTerm = term.trim().toLowerCase();
    if (trimmedTerm && !state.recipes.searchHistory.includes(trimmedTerm)) {
      state.recipes.searchHistory.unshift(trimmedTerm);
      
      // Keep only last 10 searches
      if (state.recipes.searchHistory.length > 10) {
        state.recipes.searchHistory = state.recipes.searchHistory.slice(0, 10);
      }
    }
  }),
  
  clearSearchHistory: () => set((state) => {
    state.recipes.searchHistory = [];
  }),
  
  setRecipesLoading: (loading) => set((state) => {
    state.recipes.isLoading = loading;
  }),
  
  importRecipes: (recipes) => set((state) => {
    recipes.forEach(recipe => {
      // Check if recipe already exists
      const existingIndex = state.recipes.items.findIndex(existing => 
        existing.title === recipe.title && existing.source === recipe.source
      );
      
      if (existingIndex === -1) {
        state.recipes.items.push({
          ...recipe,
          id: recipe.id || Date.now().toString() + Math.random(),
          updatedAt: new Date()
        });
      } else {
        // Update existing recipe
        Object.assign(state.recipes.items[existingIndex], recipe, { updatedAt: new Date() });
      }
    });
  }),
  
  duplicateRecipe: (id) => set((state) => {
    const original = state.recipes.items.find(recipe => recipe.id === id);
    if (original) {
      const duplicate: Recipe = {
        ...original,
        id: Date.now().toString(),
        title: `${original.title} (Copia)`,
        isPersonal: true,
        rating: 0,
        ratingCount: 0,
        cookCount: 0,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastCooked: undefined
      };
      
      state.recipes.items.push(duplicate);
    }
  })
});