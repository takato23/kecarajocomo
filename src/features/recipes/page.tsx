'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Grid, 
  List,
  SlidersHorizontal
} from 'lucide-react';

import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeForm } from './components/RecipeForm';
import { EnhancedRecipeCreationModal } from './components/EnhancedRecipeCreationModal';
import { IngredientSearchBar } from './components/IngredientSearchBar';
import { useRecipeStore } from './store/recipeStore';
import { Recipe, RecipeFormData, RecipeSortOptions } from './types';

export default function RecipeManagerPage() {
  const {
    recipes,
    currentRecipe,
    setCurrentRecipe,
    addRecipe,
    updateRecipe,
    sortOptions,
    setSortOptions,
    setRecipes,
  } = useRecipeStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [userId] = useState('current-user'); // This would come from auth
  const [isAdmin] = useState(false); // This would come from auth

  // Load initial data (mock data for now)
  useEffect(() => {
    // This would be replaced with Supabase data fetching
    const mockRecipes: Recipe[] = [];
    setRecipes(mockRecipes);
  }, []);

  const handleRecipeClick = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
  };

  const handleCreateClick = () => {
    setShowCreationModal(true);
  };

  const handleEditClick = () => {
    if (currentRecipe) {
      setEditingRecipe(currentRecipe);
      setShowForm(true);
    }
  };

  const handleFormSubmit = async (formData: RecipeFormData) => {
    if (editingRecipe) {
      // Update existing recipe
      updateRecipe(editingRecipe.id, {
        ...formData,
        updated_at: new Date().toISOString(),
      });
    } else {
      // Create new recipe
      const newRecipe: Recipe = {
        id: crypto.randomUUID(),
        user_id: 'current-user', // This would come from auth
        ...formData,
        ai_generated: false,
        times_cooked: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_time: formData.prep_time + formData.cook_time,
        nutritional_info: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
      };
      addRecipe(newRecipe);
    }
    
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  const handleRecipeCreated = (recipe: Recipe) => {
    addRecipe(recipe);
    setShowCreationModal(false);
  };

  const handleSortChange = (field: RecipeSortOptions['field']) => {
    setSortOptions({
      field,
      direction: sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  if (showForm) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
          </h1>
        </div>
        <RecipeForm
          recipe={editingRecipe}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRecipe(undefined);
          }}
        />
      </div>
    );
  }

  if (currentRecipe) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <RecipeDetail
          recipe={currentRecipe}
          onEdit={handleEditClick}
          onClose={() => setCurrentRecipe(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Recipes</h1>
          <p className="mt-2 text-lg text-gray-600">
            Discover, create, and manage your culinary collection
          </p>
        </div>
        
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-orange-600 hover:to-pink-600 hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Crear Receta
        </button>
      </div>

      {/* Search and Filters */}
      <IngredientSearchBar />

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {recipes.length} recipes found
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <select
              value={`${sortOptions.field}-${sortOptions.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortOptions({
                  field: field as RecipeSortOptions['field'],
                  direction: direction as 'asc' | 'desc',
                });
              }}
              className="rounded-lg border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="cook_time-asc">Quickest</option>
              <option value="times_cooked-desc">Most Popular</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded p-1.5 transition-colors',
                viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded p-1.5 transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <RecipeList
        onRecipeClick={handleRecipeClick}
        onCreateClick={handleCreateClick}
        viewMode={viewMode}
      />

      {/* Enhanced Recipe Creation Modal */}
      <EnhancedRecipeCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onRecipeCreated={handleRecipeCreated}
        userId={userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}

// Missing cn utility
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}