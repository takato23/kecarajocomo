import { supabase, handleSupabaseError } from '../supabase/client';
import type {
  Recipe,
  RecipeIngredient,
  RecipeSearchParams,
  RecipeFormData,
  RecipeStats,
  CookingSession,
  RecipeCollection,
  PantryCompatibility,
  RecipeSortBy
} from '../../types/recipes';
import type { PantryItem } from '../../types/pantry';
import { sampleRecipes } from '../../../lib/data/sample-data';

export class RecipeService {
  private static instance: RecipeService;
  
  static getInstance(): RecipeService {
    if (!RecipeService.instance) {
      RecipeService.instance = new RecipeService();
    }
    return RecipeService.instance;
  }

  // =====================================================
  // RECIPE CRUD OPERATIONS
  // =====================================================

  async createRecipe(data: RecipeFormData): Promise<Recipe> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Create recipe with slug
      const slug = this.generateSlug(data.name);
      
      const { data: recipe, error } = await supabase
        .from('recipes')
        .insert({
          name: data.name,
          slug,
          description: data.description,
          prep_time: data.prep_time,
          cook_time: data.cook_time,
          servings: data.servings,
          difficulty: data.difficulty,
          category: data.category,
          cuisine_type: data.cuisine_type,
          dietary_flags: data.dietary_info,
          tags: data.tags,
          created_by: user.data.user.id,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create ingredients
      if (data.ingredients.length > 0) {
        await this.createRecipeIngredients(recipe.id, data.ingredients);
      }

      // Create instructions
      if (data.instructions.length > 0) {
        await this.createRecipeInstructions(recipe.id, data.instructions);
      }

      return this.getRecipeById(recipe.id);
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async getRecipeById(id: string): Promise<Recipe> {
    try {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            *,
            ingredients (*)
          ),
          recipe_instructions (*),
          recipe_ratings (rating, review, user_id),
          user_favorites!inner (user_id),
          recipe_collections (
            recipe_collections (
              id, name, user_id
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!recipe) throw new Error('Recipe not found');

      return this.transformRecipeData(recipe);
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async getRecipes(params: RecipeSearchParams = {}): Promise<{
    recipes: Recipe[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Return sample data temporarily for demo purposes

      let filteredRecipes = [...sampleRecipes];
      
      // Apply basic filtering
      if (params.query) {
        const query = params.query.toLowerCase();
        filteredRecipes = filteredRecipes.filter(recipe =>
          recipe.name.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query)
        );
      }

      if (params.category) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.category === params.category);
      }

      if (params.cuisine_type) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.cuisine_type === params.cuisine_type);
      }

      if (params.difficulty) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.difficulty === params.difficulty);
      }

      if (params.only_can_make) {
        // For demo, return all recipes
        filteredRecipes = filteredRecipes;
      }

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      const paginatedRecipes = filteredRecipes.slice(offset, offset + limit);

      return {
        recipes: paginatedRecipes,
        total: filteredRecipes.length,
        hasMore: offset + limit < filteredRecipes.length
      };
    } catch (error: unknown) {
      console.error('Error in getRecipes:', error);
      throw new Error('Error al cargar recetas');
    }
  }

  async updateRecipe(id: string, data: Partial<RecipeFormData>): Promise<Recipe> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Update main recipe
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.name) {
        updateData.name = data.name;
        updateData.slug = this.generateSlug(data.name);
      }

      Object.keys(data).forEach(key => {
        if (key !== 'ingredients' && key !== 'instructions' && data[key as keyof RecipeFormData] !== undefined) {
          updateData[key] = data[key as keyof RecipeFormData];
        }
      });

      const { error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .eq('created_by', user.data.user.id);

      if (error) throw error;

      // Update ingredients if provided
      if (data.ingredients) {
        await this.updateRecipeIngredients(id, data.ingredients);
      }

      // Update instructions if provided
      if (data.instructions) {
        await this.updateRecipeInstructions(id, data.instructions);
      }

      return this.getRecipeById(id);
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('created_by', user.data.user.id);

      if (error) throw error;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // RECIPE INGREDIENTS MANAGEMENT
  // =====================================================

  private async createRecipeIngredients(recipeId: string, ingredients: any[]): Promise<void> {
    const ingredientData = ingredients.map((ing, index) => ({
      recipe_id: recipeId,
      ingredient_id: ing.ingredient_id,
      custom_ingredient_name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      preparation: ing.preparation,
      is_optional: ing.optional || false,
      notes: ing.notes,
      order_index: index
    }));

    const { error } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientData);

    if (error) throw error;
  }

  private async updateRecipeIngredients(recipeId: string, ingredients: any[]): Promise<void> {
    // Delete existing ingredients
    await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    // Insert new ingredients
    await this.createRecipeIngredients(recipeId, ingredients);
  }

  // =====================================================
  // RECIPE INSTRUCTIONS MANAGEMENT
  // =====================================================

  private async createRecipeInstructions(recipeId: string, instructions: any[]): Promise<void> {
    const instructionData = instructions.map((inst, index) => ({
      recipe_id: recipeId,
      step_number: index + 1,
      instruction: inst.instruction,
      duration_minutes: inst.duration,
      temperature_celsius: inst.temperature,
      notes: inst.notes
    }));

    const { error } = await supabase
      .from('recipe_instructions')
      .insert(instructionData);

    if (error) throw error;
  }

  private async updateRecipeInstructions(recipeId: string, instructions: any[]): Promise<void> {
    // Delete existing instructions
    await supabase
      .from('recipe_instructions')
      .delete()
      .eq('recipe_id', recipeId);

    // Insert new instructions
    await this.createRecipeInstructions(recipeId, instructions);
  }

  // =====================================================
  // SEARCH AND FILTERING
  // =====================================================

  async searchRecipes(query: string, filters?: RecipeSearchParams): Promise<Recipe[]> {
    try {
      let supabaseQuery = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            *,
            ingredients (*)
          ),
          recipe_instructions (*),
          recipe_ratings (rating)
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

      // Apply additional filters
      if (filters) {
        supabaseQuery = this.applyRecipeFilters(supabaseQuery, filters);
      }

      // Sort by relevance (name matches first, then description)
      supabaseQuery = supabaseQuery.order('name');

      const { data: recipes, error } = await supabaseQuery;

      if (error) throw error;

      return recipes?.map(recipe => this.transformRecipeData(recipe)) || [];
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async getRecipesByIngredients(ingredientIds: string[]): Promise<Recipe[]> {
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients!inner (
            ingredient_id,
            ingredients (*)
          ),
          recipe_instructions (*),
          recipe_ratings (rating)
        `)
        .in('recipe_ingredients.ingredient_id', ingredientIds);

      if (error) throw error;

      return recipes?.map(recipe => this.transformRecipeData(recipe)) || [];
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // PANTRY INTEGRATION
  // =====================================================

  async getRecipesCanMake(pantryItems: PantryItem[]): Promise<Recipe[]> {
    try {
      const availableIngredientIds = pantryItems.map(item => item.ingredient_id);
      
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            *,
            ingredients (*)
          ),
          recipe_instructions (*),
          recipe_ratings (rating)
        `);

      if (error) throw error;

      // Filter recipes where all non-optional ingredients are available
      const recipesCanMake = recipes?.filter(recipe => {
        const requiredIngredients = recipe.recipe_ingredients.filter(ing => !ing.is_optional);
        return requiredIngredients.every(ing => 
          availableIngredientIds.includes(ing.ingredient_id)
        );
      }) || [];

      return recipesCanMake.map(recipe => this.transformRecipeData(recipe));
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async checkPantryCompatibility(recipeId: string, pantryItems: PantryItem[]): Promise<PantryCompatibility> {
    try {
      const recipe = await this.getRecipeById(recipeId);
      const availableIngredients = new Map(
        pantryItems.map(item => [item.ingredient_id, item])
      );

      const missingIngredients: RecipeIngredient[] = [];
      const availableRecipeIngredients: RecipeIngredient[] = [];

      recipe.ingredients.forEach(ingredient => {
        if (availableIngredients.has(ingredient.ingredient_id)) {
          availableRecipeIngredients.push(ingredient);
        } else if (!ingredient.optional) {
          missingIngredients.push(ingredient);
        }
      });

      const totalRequired = recipe.ingredients.filter(ing => !ing.optional).length;
      const availableCount = availableRecipeIngredients.length;
      const compatibilityScore = totalRequired > 0 ? availableCount / totalRequired : 1;

      return {
        can_make: missingIngredients.length === 0,
        missing_ingredients: missingIngredients,
        available_ingredients: availableRecipeIngredients,
        substitutions: [], // TODO: Implement substitution logic
        compatibility_score: compatibilityScore
      };
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // FAVORITES MANAGEMENT
  // =====================================================

  async addToFavorites(recipeId: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.data.user.id,
          recipe_id: recipeId
        });

      if (error) throw error;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async removeFromFavorites(recipeId: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.data.user.id)
        .eq('recipe_id', recipeId);

      if (error) throw error;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async getUserFavorites(): Promise<Recipe[]> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data: favorites, error } = await supabase
        .from('user_favorites')
        .select(`
          recipes (
            *,
            recipe_ingredients (
              *,
              ingredients (*)
            ),
            recipe_instructions (*),
            recipe_ratings (rating)
          )
        `)
        .eq('user_id', user.data.user.id);

      if (error) throw error;

      return favorites?.map(fav => this.transformRecipeData(fav.recipes)) || [];
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // RATINGS AND REVIEWS
  // =====================================================

  async rateRecipe(recipeId: string, rating: number, review?: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('recipe_ratings')
        .upsert({
          recipe_id: recipeId,
          user_id: user.data.user.id,
          rating,
          review
        });

      if (error) throw error;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // COOKING SESSIONS
  // =====================================================

  async startCookingSession(recipeId: string, servings?: number): Promise<CookingSession> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data: session, error } = await supabase
        .from('cooking_sessions')
        .insert({
          recipe_id: recipeId,
          user_id: user.data.user.id,
          servings_made: servings,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;

      return session as CookingSession;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async updateCookingSession(sessionId: string, updates: Partial<CookingSession>): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cooking_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', user.data.user.id);

      if (error) throw error;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // RECIPE COLLECTIONS
  // =====================================================

  async createCollection(name: string, description?: string): Promise<RecipeCollection> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data: collection, error } = await supabase
        .from('recipe_collections')
        .insert({
          user_id: user.data.user.id,
          name,
          description
        })
        .select()
        .single();

      if (error) throw error;

      return collection as RecipeCollection;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  async addRecipeToCollection(collectionId: string, recipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collection_recipes')
        .insert({
          collection_id: collectionId,
          recipe_id: recipeId
        });

      if (error) throw error;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // RECIPE STATISTICS
  // =====================================================

  async getRecipeStats(): Promise<RecipeStats> {
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('category, cuisine_type, difficulty, cook_time, rating_average');

      if (error) throw error;

      const stats: RecipeStats = {
        total_recipes: recipes?.length || 0,
        by_category: {},
        by_cuisine: {},
        by_difficulty: {},
        average_cook_time: 0,
        average_rating: 0,
        most_popular: [],
        trending: [],
        seasonal_recommendations: []
      };

      // Calculate statistics
      if (recipes) {
        recipes.forEach(recipe => {
          // Category stats
          if (recipe.category) {
            stats.by_category[recipe.category] = (stats.by_category[recipe.category] || 0) + 1;
          }

          // Cuisine stats
          if (recipe.cuisine_type) {
            stats.by_cuisine[recipe.cuisine_type] = (stats.by_cuisine[recipe.cuisine_type] || 0) + 1;
          }

          // Difficulty stats
          if (recipe.difficulty) {
            stats.by_difficulty[recipe.difficulty] = (stats.by_difficulty[recipe.difficulty] || 0) + 1;
          }
        });

        // Calculate averages
        const totalTime = recipes.reduce((sum, recipe) => sum + (recipe.cook_time || 0), 0);
        stats.average_cook_time = totalTime / recipes.length;

        const totalRating = recipes.reduce((sum, recipe) => sum + (recipe.rating_average || 0), 0);
        stats.average_rating = totalRating / recipes.length;
      }

      return stats;
    } catch (error: unknown) {
      throw new Error(handleSupabaseError(error));
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private applyRecipeFilters(query: any, params: RecipeSearchParams): any {
    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.cuisine_type) {
      query = query.eq('cuisine_type', params.cuisine_type);
    }

    if (params.difficulty) {
      query = query.eq('difficulty', params.difficulty);
    }

    if (params.max_cook_time) {
      query = query.lte('cook_time', params.max_cook_time);
    }

    if (params.max_prep_time) {
      query = query.lte('prep_time', params.max_prep_time);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.overlaps('tags', params.tags);
    }

    if (params.only_favorites) {
      // This would need to be handled with a join
    }

    if (params.rating_min) {
      query = query.gte('rating_average', params.rating_min);
    }

    return query;
  }

  private applyRecipeSorting(query: any, sortBy?: RecipeSortBy, sortOrder: 'asc' | 'desc' = 'desc'): any {
    switch (sortBy) {
      case 'name':
        return query.order('name', { ascending: sortOrder === 'asc' });
      case 'cook_time':
        return query.order('cook_time', { ascending: sortOrder === 'asc' });
      case 'prep_time':
        return query.order('prep_time', { ascending: sortOrder === 'asc' });
      case 'difficulty':
        return query.order('difficulty', { ascending: sortOrder === 'asc' });
      case 'rating':
        return query.order('rating_average', { ascending: sortOrder === 'asc' });
      case 'popularity':
        return query.order('favorite_count', { ascending: sortOrder === 'asc' });
      case 'created_at':
      default:
        return query.order('created_at', { ascending: sortOrder === 'asc' });
    }
  }

  private transformRecipeData(rawRecipe: any): Recipe {
    return {
      id: rawRecipe.id,
      name: rawRecipe.name,
      description: rawRecipe.description || '',
      image_url: rawRecipe.image_url,
      images: rawRecipe.recipe_images || [],
      ingredients: rawRecipe.recipe_ingredients?.map((ri: any) => ({
        id: ri.id,
        recipe_id: ri.recipe_id,
        ingredient_id: ri.ingredient_id,
        ingredient: ri.ingredients,
        quantity: ri.quantity,
        unit: ri.unit,
        preparation: ri.preparation,
        optional: ri.is_optional,
        notes: ri.notes,
        order: ri.order_index
      })) || [],
      instructions: rawRecipe.recipe_instructions?.map((inst: any) => ({
        id: inst.id,
        recipe_id: inst.recipe_id,
        step_number: inst.step_number,
        instruction: inst.instruction,
        duration: inst.duration_minutes,
        temperature: inst.temperature_celsius,
        image_url: inst.image_url,
        notes: inst.notes
      })) || [],
      nutrition: rawRecipe.nutrition_per_serving,
      cook_time: rawRecipe.cook_time,
      prep_time: rawRecipe.prep_time,
      total_time: rawRecipe.total_time,
      servings: rawRecipe.servings,
      difficulty: rawRecipe.difficulty,
      cuisine_type: rawRecipe.cuisine_type,
      category: rawRecipe.category,
      tags: rawRecipe.tags || [],
      dietary_info: rawRecipe.dietary_flags || {},
      ai_generated: rawRecipe.ai_generated,
      source: rawRecipe.source_url ? {
        type: 'imported',
        url: rawRecipe.source_url,
        author: rawRecipe.source_attribution
      } : undefined,
      created_by: rawRecipe.created_by,
      favorited_by: rawRecipe.user_favorites?.map((fav: any) => fav.user_id) || [],
      rating: rawRecipe.rating_average,
      rating_count: rawRecipe.rating_count,
      created_at: new Date(rawRecipe.created_at),
      updated_at: new Date(rawRecipe.updated_at)
    };
  }
}

// Export singleton instance
export const recipeService = RecipeService.getInstance();