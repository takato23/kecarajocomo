import { createClient } from '@supabase/supabase-js';

import {
  Recipe,
  RecipeFilters,
  RecipeSortOptions,
  PaginationOptions,
  RecipeSearchResult,
  RecipeCollection,
  CookingSession,
  Ingredient,
  RecipeFormData,
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Recipes
export async function fetchRecipes(
  filters: RecipeFilters,
  sort: RecipeSortOptions,
  pagination: PaginationOptions
): Promise<RecipeSearchResult> {
  let query = supabase
    .from('recipes')
    .select(`
      *,
      recipe_instructions!recipe_id (*),
      recipe_ingredients!recipe_id (
        *,
        ingredient:ingredients (*)
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.cuisine_types?.length) {
    query = query.in('cuisine_type', filters.cuisine_types);
  }

  if (filters.meal_types?.length) {
    query = query.contains('meal_types', filters.meal_types);
  }

  if (filters.dietary_tags?.length) {
    query = query.contains('dietary_tags', filters.dietary_tags);
  }

  if (filters.difficulty?.length) {
    query = query.in('difficulty', filters.difficulty);
  }

  if (filters.max_cook_time) {
    query = query.lte('cook_time', filters.max_cook_time);
  }

  if (filters.max_prep_time) {
    query = query.lte('prep_time', filters.max_prep_time);
  }

  if (filters.is_public !== undefined) {
    query = query.eq('is_public', filters.is_public);
  }

  if (filters.ai_generated !== undefined) {
    query = query.eq('ai_generated', filters.ai_generated);
  }

  if (filters.user_id) {
    query = query.eq('created_by', filters.user_id);
  }

  // Apply sorting
  const orderColumn = sort.field === 'created_at' ? 'created_at' 
    : sort.field === 'title' ? 'title'
    : sort.field === 'rating' ? 'rating'
    : sort.field === 'cook_time' ? 'cook_time'
    : sort.field === 'prep_time' ? 'prep_time'
    : 'times_cooked';
  
  query = query.order(orderColumn, { ascending: sort.direction === 'asc' });

  // Apply pagination
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) throw error;

  // Transform the data to match our Recipe type
  const recipes = data.map(recipe => ({
    ...recipe,
    instructions: recipe.recipe_instructions
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((inst: any) => ({
        step_number: inst.step_number,
        text: inst.text,
        time_minutes: inst.time_minutes,
        temperature: inst.temperature_value && inst.temperature_unit ? {
          value: inst.temperature_value,
          unit: inst.temperature_unit,
        } : undefined,
        tips: inst.tips,
        image_url: inst.image_url,
      })),
    ingredients: recipe.recipe_ingredients.map((ri: any) => ({
      ingredient_id: ri.ingredient.id,
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
      notes: ri.notes,
      optional: ri.optional,
      group: ri.ingredient_group,
    })),
  })) as Recipe[];

  return {
    recipes,
    total: count || 0,
    page: pagination.page,
    total_pages: Math.ceil((count || 0) / pagination.limit),
  };
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_instructions!recipe_id (*),
      recipe_ingredients!recipe_id (
        *,
        ingredient:ingredients (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Transform the data
  return {
    ...data,
    instructions: data.recipe_instructions
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((inst: any) => ({
        step_number: inst.step_number,
        text: inst.text,
        time_minutes: inst.time_minutes,
        temperature: inst.temperature_value && inst.temperature_unit ? {
          value: inst.temperature_value,
          unit: inst.temperature_unit,
        } : undefined,
        tips: inst.tips,
        image_url: inst.image_url,
      })),
    ingredients: data.recipe_ingredients.map((ri: any) => ({
      ingredient_id: ri.ingredient.id,
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
      notes: ri.notes,
      optional: ri.optional,
      group: ri.ingredient_group,
    })),
  } as Recipe;
}

export async function createRecipe(
  recipeData: RecipeFormData,
  userId: string,
  aiGenerated: boolean = false,
  aiProvider?: 'claude' | 'gemini'
): Promise<Recipe> {
  // First create the recipe
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert([{
      title: recipeData.title,
      description: recipeData.description,
      prep_time: recipeData.prep_time,
      cook_time: recipeData.cook_time,
      servings: recipeData.servings,
      cuisine_type: recipeData.cuisine_type,
      meal_types: recipeData.meal_types,
      dietary_tags: recipeData.dietary_tags,
      difficulty: recipeData.difficulty,
      nutritional_info: null,
      image_url: recipeData.image_url,
      video_url: recipeData.video_url,
      source_url: recipeData.source_url,
      ai_generated: aiGenerated,
      ai_provider: aiProvider,
      is_public: recipeData.is_public,
      created_by: userId,
    }])
    .select()
    .single();

  if (recipeError) throw recipeError;

  // Create instructions
  const instructions = recipeData.instructions.map((inst, index) => ({
    recipe_id: recipe.id,
    step_number: index + 1,
    text: inst.text,
    time_minutes: inst.time_minutes,
    temperature_value: inst.temperature?.value,
    temperature_unit: inst.temperature?.unit,
    tips: inst.tips,
  }));

  const { error: instructionsError } = await supabase
    .from('recipe_instructions')
    .insert(instructions);

  if (instructionsError) throw instructionsError;

  // Create or find ingredients and link them
  for (const ingredient of recipeData.ingredients) {
    // First, try to find existing ingredient
    const { data: existingIngredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('name', ingredient.name.toLowerCase())
      .single();

    let ingredientId: string;

    if (!existingIngredient) {
      // Create new ingredient
      const { data: newIngredient, error: ingredientError } = await supabase
        .from('ingredients')
        .insert([{
          name: ingredient.name.toLowerCase(),
          category: 'other', // This should be determined by AI or user
        }])
        .select()
        .single();

      if (ingredientError) throw ingredientError;
      ingredientId = newIngredient.id;
    } else {
      ingredientId = existingIngredient.id;
    }

    // Link ingredient to recipe
    const { error: linkError } = await supabase
      .from('recipe_ingredients')
      .insert([{
        recipe_id: recipe.id,
        ingredient_id: ingredientId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        optional: ingredient.optional,
        ingredient_group: ingredient.group,
      }]);

    if (linkError) throw linkError;
  }

  // Fetch and return the complete recipe
  const completeRecipe = await fetchRecipeById(recipe.id);
  if (!completeRecipe) throw new Error('Failed to fetch created recipe');

  return completeRecipe;
}

export async function updateRecipe(
  id: string,
  recipeData: Partial<RecipeFormData>
): Promise<Recipe> {
  // Update the recipe
  const { error: recipeError } = await supabase
    .from('recipes')
    .update({
      title: recipeData.title,
      description: recipeData.description,
      prep_time: recipeData.prep_time,
      cook_time: recipeData.cook_time,
      servings: recipeData.servings,
      cuisine_type: recipeData.cuisine_type,
      meal_types: recipeData.meal_types,
      dietary_tags: recipeData.dietary_tags,
      difficulty: recipeData.difficulty,
      nutritional_info: null,
      image_url: recipeData.image_url,
      video_url: recipeData.video_url,
      source_url: recipeData.source_url,
      is_public: recipeData.is_public,
    })
    .eq('id', id);

  if (recipeError) throw recipeError;

  // If instructions are provided, update them
  if (recipeData.instructions) {
    // Delete existing instructions
    await supabase
      .from('recipe_instructions')
      .delete()
      .eq('recipe_id', id);

    // Insert new instructions
    const instructions = recipeData.instructions.map((inst, index) => ({
      recipe_id: id,
      step_number: index + 1,
      text: inst.text,
      time_minutes: inst.time_minutes,
      temperature_value: inst.temperature?.value,
      temperature_unit: inst.temperature?.unit,
      tips: inst.tips,
    }));

    const { error: instructionsError } = await supabase
      .from('recipe_instructions')
      .insert(instructions);

    if (instructionsError) throw instructionsError;
  }

  // If ingredients are provided, update them
  if (recipeData.ingredients) {
    // Delete existing recipe ingredients
    await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id);

    // Insert new ingredients (similar to create)
    for (const ingredient of recipeData.ingredients) {
      const { data: existingIngredient } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', ingredient.name.toLowerCase())
        .single();

      let ingredientId: string;

      if (!existingIngredient) {
        const { data: newIngredient, error: ingredientError } = await supabase
          .from('ingredients')
          .insert([{
            name: ingredient.name.toLowerCase(),
            category: 'other',
          }])
          .select()
          .single();

        if (ingredientError) throw ingredientError;
        ingredientId = newIngredient.id;
      } else {
        ingredientId = existingIngredient.id;
      }

      const { error: linkError } = await supabase
        .from('recipe_ingredients')
        .insert([{
          recipe_id: id,
          ingredient_id: ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          optional: ingredient.optional,
          ingredient_group: ingredient.group,
        }]);

      if (linkError) throw linkError;
    }
  }

  // Fetch and return the updated recipe
  const updatedRecipe = await fetchRecipeById(id);
  if (!updatedRecipe) throw new Error('Failed to fetch updated recipe');

  return updatedRecipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Recipe Ratings
export async function rateRecipe(
  recipeId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<void> {
  const { error } = await supabase
    .from('recipe_ratings')
    .upsert([{
      recipe_id: recipeId,
      user_id: userId,
      rating,
      comment,
    }], { onConflict: 'recipe_id,user_id' });

  if (error) throw error;
}

// Cooking Sessions
export async function startCookingSession(
  recipeId: string,
  userId: string
): Promise<CookingSession> {
  const { data, error } = await supabase
    .from('cooking_sessions')
    .insert([{
      recipe_id: recipeId,
      user_id: userId,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as CookingSession;
}

export async function completeCookingSession(
  sessionId: string,
  data: Partial<CookingSession>
): Promise<void> {
  const { error } = await supabase
    .from('cooking_sessions')
    .update({
      completed_at: data.completed_at,
      notes: data.notes,
      modifications: data.modifications,
      rating: data.rating,
    })
    .eq('id', sessionId);

  if (error) throw error;
}

// Recipe Collections
export async function fetchUserCollections(userId: string): Promise<RecipeCollection[]> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .select(`
      *,
      recipe_collection_items!collection_id (
        recipe_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(collection => ({
    ...collection,
    recipe_ids: collection.recipe_collection_items.map((item: any) => item.recipe_id),
  })) as RecipeCollection[];
}

export async function createCollection(
  name: string,
  description: string,
  userId: string,
  isPublic: boolean = false
): Promise<RecipeCollection> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .insert([{
      user_id: userId,
      name,
      description,
      is_public: isPublic,
    }])
    .select()
    .single();

  if (error) throw error;
  return { ...data, recipe_ids: [] } as RecipeCollection;
}

export async function addRecipeToCollection(
  collectionId: string,
  recipeId: string
): Promise<void> {
  const { error } = await supabase
    .from('recipe_collection_items')
    .insert([{
      collection_id: collectionId,
      recipe_id: recipeId,
    }]);

  if (error) throw error;
}

export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string
): Promise<void> {
  const { error } = await supabase
    .from('recipe_collection_items')
    .delete()
    .match({ collection_id: collectionId, recipe_id: recipeId });

  if (error) throw error;
}

// Ingredients
export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data as Ingredient[];
}

// Real-time subscriptions
export function subscribeToRecipes(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`recipes:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'recipes',
        filter: `created_by=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToRatings(
  recipeId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`ratings:${recipeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'recipe_ratings',
        filter: `recipe_id=eq.${recipeId}`,
      },
      callback
    )
    .subscribe();
}