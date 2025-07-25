import { endOfWeek, format } from 'date-fns';

import { supabase } from '@/lib/supabase';

import { 
  PlannedMealV2, 
  ServiceResponse,
  RecipeV2 
} from '../types';

// =============================================
// PLANNING V2 SERVICE
// =============================================

class PlanningV2Service {
  private readonly TABLE_NAME = 'meal_plan_entries';
  private readonly RECIPES_TABLE = 'recipes';

  // =============================================
  // READ OPERATIONS
  // =============================================

  /**
   * Get all meals for a specific week
   */
  async getMealsForWeek(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceResponse<PlannedMealV2[]>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          recipe:recipe_id (
            id,
            name,
            description,
            image_url,
            prep_time,
            cook_time,
            servings,
            difficulty,
            cuisine,
            tags,
            rating,
            is_ai_generated,
            dietary_labels,
            ingredients (
              id,
              name,
              amount,
              unit,
              category,
              notes,
              is_optional
            ),
            instructions,
            nutrition (
              calories,
              protein,
              carbs,
              fat,
              fiber,
              sugar,
              sodium
            )
          )
        `)
        .eq('user_id', userId)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate)
        .order('plan_date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (error) throw error;

      // Transform the data to match our types
      const meals: PlannedMealV2[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        planDate: item.plan_date,
        mealType: item.meal_type,
        recipeId: item.recipe_id,
        customMealName: item.custom_meal_name,
        recipe: item.recipe ? this.transformRecipe(item.recipe) : undefined,
        notes: item.notes,
        servings: item.servings || 4,
        isCompleted: item.is_completed || false,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return { success: true, data: meals };
    } catch (error) {
      console.error('Error fetching week meals:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get a single meal by ID
   */
  async getMealById(mealId: string): Promise<ServiceResponse<PlannedMealV2>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          recipe:recipe_id (*)
        `)
        .eq('id', mealId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Meal not found');

      const meal: PlannedMealV2 = {
        id: data.id,
        userId: data.user_id,
        planDate: data.plan_date,
        mealType: data.meal_type,
        recipeId: data.recipe_id,
        customMealName: data.custom_meal_name,
        recipe: data.recipe ? this.transformRecipe(data.recipe) : undefined,
        notes: data.notes,
        servings: data.servings || 4,
        isCompleted: data.is_completed || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return { success: true, data: meal };
    } catch (error) {
      console.error('Error fetching meal:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =============================================
  // CREATE OPERATIONS
  // =============================================

  /**
   * Create a new meal plan entry
   */
  async createMeal(
    meal: Omit<PlannedMealV2, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<PlannedMealV2>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          user_id: meal.userId,
          plan_date: meal.planDate,
          meal_type: meal.mealType,
          recipe_id: meal.recipeId,
          custom_meal_name: meal.customMealName,
          notes: meal.notes,
          servings: meal.servings,
          is_completed: meal.isCompleted
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch the complete meal with recipe details
      return this.getMealById(data.id);
    } catch (error) {
      console.error('Error creating meal:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create multiple meals at once (batch operation)
   */
  async createMultipleMeals(
    meals: Omit<PlannedMealV2, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<ServiceResponse<PlannedMealV2[]>> {
    try {
      const mealsToInsert = meals.map(meal => ({
        user_id: meal.userId,
        plan_date: meal.planDate,
        meal_type: meal.mealType,
        recipe_id: meal.recipeId,
        custom_meal_name: meal.customMealName,
        notes: meal.notes,
        servings: meal.servings,
        is_completed: meal.isCompleted
      }));

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(mealsToInsert)
        .select();

      if (error) throw error;

      // Fetch complete meals with recipe details
      const mealIds = data.map(meal => meal.id);
      const completeMeals = await Promise.all(
        mealIds.map(id => this.getMealById(id))
      );

      const successfulMeals = completeMeals
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      return { success: true, data: successfulMeals };
    } catch (error) {
      console.error('Error creating multiple meals:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =============================================
  // UPDATE OPERATIONS
  // =============================================

  /**
   * Update an existing meal
   */
  async updateMeal(
    id: string, 
    updates: Partial<PlannedMealV2>
  ): Promise<ServiceResponse<PlannedMealV2>> {
    try {
      const updateData: any = {};
      
      if (updates.planDate !== undefined) updateData.plan_date = updates.planDate;
      if (updates.mealType !== undefined) updateData.meal_type = updates.mealType;
      if (updates.recipeId !== undefined) updateData.recipe_id = updates.recipeId;
      if (updates.customMealName !== undefined) updateData.custom_meal_name = updates.customMealName;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.servings !== undefined) updateData.servings = updates.servings;
      if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Fetch updated meal
      return this.getMealById(id);
    } catch (error) {
      console.error('Error updating meal:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Mark a meal as completed
   */
  async toggleMealCompletion(id: string): Promise<ServiceResponse<PlannedMealV2>> {
    try {
      // First get current state
      const { data: currentMeal, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('is_completed')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle completion
      return this.updateMeal(id, { 
        isCompleted: !currentMeal.is_completed 
      });
    } catch (error) {
      console.error('Error toggling meal completion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =============================================
  // DELETE OPERATIONS
  // =============================================

  /**
   * Delete a meal
   */
  async deleteMeal(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting meal:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Clear all meals for a week
   */
  async clearWeek(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('user_id', userId)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error clearing week:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =============================================
  // COMPLEX OPERATIONS
  // =============================================

  /**
   * Copy meals from one week to another
   */
  async copyWeek(
    userId: string, 
    sourceStartDate: string, 
    targetStartDate: string
  ): Promise<ServiceResponse<PlannedMealV2[]>> {
    try {
      // Calculate date ranges
      const sourceStart = new Date(sourceStartDate);
      const sourceEnd = format(endOfWeek(sourceStart), 'yyyy-MM-dd');
      const targetStart = new Date(targetStartDate);
      
      // Get source week meals
      const sourceMeals = await this.getMealsForWeek(userId, sourceStartDate, sourceEnd);
      
      if (!sourceMeals.success || !sourceMeals.data) {
        throw new Error('Failed to fetch source week meals');
      }

      // Calculate day difference
      const dayDiff = Math.floor(
        (targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create new meals with adjusted dates
      const newMeals = sourceMeals.data.map(meal => {
        const originalDate = new Date(meal.planDate);
        const newDate = new Date(originalDate);
        newDate.setDate(newDate.getDate() + dayDiff);
        
        return {
          userId: meal.userId,
          planDate: format(newDate, 'yyyy-MM-dd'),
          mealType: meal.mealType,
          recipeId: meal.recipeId,
          customMealName: meal.customMealName,
          notes: meal.notes,
          servings: meal.servings,
          isCompleted: false // Reset completion status
        };
      });

      // Create all new meals
      return this.createMultipleMeals(newMeals);
    } catch (error) {
      console.error('Error copying week:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get meal statistics for a date range
   */
  async getMealStats(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceResponse<{
    totalMeals: number;
    completedMeals: number;
    mealsByType: Record<string, number>;
    topRecipes: Array<{ recipeId: string; recipeName: string; count: number }>;
  }>> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('meal_type, is_completed, recipe_id, recipe:recipe_id(name)')
        .eq('user_id', userId)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate);

      if (error) throw error;

      const meals = data || [];
      
      // Calculate statistics
      const stats = {
        totalMeals: meals.length,
        completedMeals: meals.filter(m => m.is_completed).length,
        mealsByType: meals.reduce((acc, meal) => {
          acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        topRecipes: [] as Array<{ recipeId: string; recipeName: string; count: number }>
      };

      // Calculate top recipes
      const recipeCounts = meals.reduce((acc, meal) => {
        if (meal.recipe_id && meal.recipe) {
          const key = `${meal.recipe_id}|${meal.recipe.name}`;
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      stats.topRecipes = Object.entries(recipeCounts)
        .map(([key, count]) => {
          const [recipeId, recipeName] = key.split('|');
          return { recipeId, recipeName, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching meal stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Transform raw recipe data to RecipeV2 type
   */
  private transformRecipe(rawRecipe: any): RecipeV2 {
    return {
      id: rawRecipe.id,
      name: rawRecipe.name,
      description: rawRecipe.description,
      imageUrl: rawRecipe.image_url,
      prepTime: rawRecipe.prep_time || 0,
      cookTime: rawRecipe.cook_time || 0,
      servings: rawRecipe.servings || 4,
      difficulty: rawRecipe.difficulty || 'medium',
      ingredients: rawRecipe.ingredients || [],
      instructions: rawRecipe.instructions || [],
      nutrition: rawRecipe.nutrition || undefined,
      dietaryLabels: rawRecipe.dietary_labels || [],
      cuisine: rawRecipe.cuisine,
      tags: rawRecipe.tags || [],
      rating: rawRecipe.rating,
      isAiGenerated: rawRecipe.is_ai_generated || false
    };
  }
}

// Export singleton instance
export const planningV2Service = new PlanningV2Service();