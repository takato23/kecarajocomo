import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { logger } from '@/lib/logger';

type Tables = Database['public']['Tables'];
type Recipe = Tables['recipes']['Row'];
type RecipeInsert = Tables['recipes']['Insert'];
type RecipeUpdate = Tables['recipes']['Update'];
type Ingredient = Tables['ingredients']['Row'];
type PantryItem = Tables['pantry_items']['Row'];
type MealPlan = Tables['meal_plans']['Row'];

/**
 * Supabase Database Service
 * Complete replacement for Prisma operations
 */
export class DatabaseService {
  private supabase = createClient();

  // ============== RECIPES ==============
  async getRecipes(userId: string, limit = 20, offset = 0) {
    const { data, error } = await this.supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name,
            category
          )
        ),
        nutrition_info (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch recipes', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async getRecipeById(recipeId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          quantity,
          unit,
          notes,
          ingredient:ingredients (*)
        ),
        nutrition_info (*),
        recipe_ratings (
          rating,
          created_at
        )
      `)
      .eq('id', recipeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch recipe', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async createRecipe(recipe: RecipeInsert) {
    const { data, error } = await this.supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create recipe', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async updateRecipe(recipeId: string, userId: string, updates: RecipeUpdate) {
    const { data, error } = await this.supabase
      .from('recipes')
      .update(updates)
      .eq('id', recipeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update recipe', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async deleteRecipe(recipeId: string, userId: string) {
    const { error } = await this.supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete recipe', 'DatabaseService', error);
      throw error;
    }

    return true;
  }

  // ============== INGREDIENTS ==============
  async findOrCreateIngredient(name: string, category?: string) {
    // First try to find existing ingredient
    const { data: existing } = await this.supabase
      .from('ingredients')
      .select()
      .ilike('name', name)
      .single();

    if (existing) return existing;

    // Create new ingredient
    const { data, error } = await this.supabase
      .from('ingredients')
      .insert({
        name: name.toLowerCase(),
        category: category || 'otros',
        unit: 'unidad'
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create ingredient', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async addRecipeIngredients(recipeId: string, ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>) {
    const { error } = await this.supabase
      .from('recipe_ingredients')
      .insert(
        ingredients.map(ing => ({
          recipe_id: recipeId,
          ingredient_id: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        }))
      );

    if (error) {
      logger.error('Failed to add recipe ingredients', 'DatabaseService', error);
      throw error;
    }

    return true;
  }

  // ============== PANTRY ==============
  async getPantryItems(userId: string) {
    const { data, error } = await this.supabase
      .from('pantry_items')
      .select(`
        *,
        ingredient:ingredients (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch pantry items', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async addPantryItem(userId: string, item: {
    ingredientId: string;
    quantity: number;
    unit: string;
    location?: string;
    expirationDate?: Date;
    notes?: string;
  }) {
    // Check if item already exists
    const { data: existing } = await this.supabase
      .from('pantry_items')
      .select()
      .eq('user_id', userId)
      .eq('ingredient_id', item.ingredientId)
      .single();

    if (existing) {
      // Update quantity
      const { data, error } = await this.supabase
        .from('pantry_items')
        .update({
          quantity: existing.quantity + item.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Create new item
    const { data, error } = await this.supabase
      .from('pantry_items')
      .insert({
        user_id: userId,
        ingredient_id: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location || 'pantry',
        expiration_date: item.expirationDate?.toISOString(),
        notes: item.notes
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add pantry item', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async updatePantryItem(itemId: string, userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('pantry_items')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update pantry item', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async deletePantryItem(itemId: string, userId: string) {
    const { error } = await this.supabase
      .from('pantry_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete pantry item', 'DatabaseService', error);
      throw error;
    }

    return true;
  }

  // ============== MEAL PLANNING ==============
  async getMealPlans(userId: string, startDate?: Date, endDate?: Date) {
    let query = this.supabase
      .from('meal_plans')
      .select(`
        *,
        recipe:recipes (
          id,
          title,
          prep_time,
          cook_time,
          servings,
          image_url
        )
      `)
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('date', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('date', endDate.toISOString());
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch meal plans', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async createMealPlan(userId: string, plan: {
    date: Date;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    recipeId: string;
    servings?: number;
    notes?: string;
  }) {
    const { data, error } = await this.supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        date: plan.date.toISOString(),
        meal_type: plan.mealType,
        recipe_id: plan.recipeId,
        servings: plan.servings || 1,
        notes: plan.notes
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create meal plan', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async deleteMealPlan(planId: string, userId: string) {
    const { error } = await this.supabase
      .from('meal_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete meal plan', 'DatabaseService', error);
      throw error;
    }

    return true;
  }

  // ============== USER PROFILE ==============
  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select(`
        *,
        preferences:user_preferences (*)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch user profile', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user profile', 'DatabaseService', error);
      throw error;
    }

    return data;
  }

  async updateUserPreferences(userId: string, preferences: any) {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user preferences', 'DatabaseService', error);
      throw error;
    }

    return data;
  }
}

// Singleton instance
export const db = new DatabaseService();