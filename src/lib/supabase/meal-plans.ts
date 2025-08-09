/**
 * Meal Plans Supabase Service
 * Handles all database operations for meal plans
 */

import { supabase } from './client';
import type { Database } from './types';
import type { WeekPlan, MealSlot, MealType, Recipe } from '@/features/meal-planning/types';
import { logger } from '@/lib/logger';

type MealPlanRow = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

type PlannedMealRow = Database['public']['Tables']['planned_meals']['Row'];
type PlannedMealInsert = Database['public']['Tables']['planned_meals']['Insert'];
type PlannedMealUpdate = Database['public']['Tables']['planned_meals']['Update'];

export class MealPlanService {
  /**
   * Create a new meal plan
   */
  static async createMealPlan(
    userId: string,
    startDate: string,
    endDate: string,
    name?: string,
    targetCalories?: number,
    targetMacros?: any,
    notes?: string
  ): Promise<{ data: MealPlanRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: name || `Plan de comidas - ${startDate}`,
          start_date: startDate,
          end_date: endDate,
          target_calories: targetCalories,
          target_macros: targetMacros,
          notes: notes,
          is_template: false,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Meal plan created successfully', 'MealPlanService', { mealPlanId: data?.id });
      return { data, error: null };
    } catch (error) {
      logger.error('Error creating meal plan', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get meal plans for a user within a date range
   */
  static async getMealPlans(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: MealPlanRow[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (startDate) {
        query = query.gte('end_date', startDate);
      }
      if (endDate) {
        query = query.lte('start_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching meal plans', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a specific meal plan with all its planned meals
   */
  static async getMealPlanWithMeals(
    mealPlanId: string,
    userId: string
  ): Promise<{ data: any | null; error: Error | null }> {
    try {
      // Get meal plan
      const { data: mealPlan, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .eq('user_id', userId)
        .single();

      if (planError) throw planError;

      // Get planned meals with recipe details
      const { data: plannedMeals, error: mealsError } = await supabase
        .from('planned_meals')
        .select(`
          *,
          recipes (
            id,
            name,
            slug,
            description,
            image_url,
            prep_time,
            cook_time,
            servings,
            difficulty,
            ingredients,
            instructions,
            nutrition_per_serving,
            tags,
            cuisine_types,
            meal_types,
            dietary_info
          )
        `)
        .eq('meal_plan_id', mealPlanId)
        .order('date', { ascending: true })
        .order('order_index', { ascending: true });

      if (mealsError) throw mealsError;

      return {
        data: {
          ...mealPlan,
          planned_meals: plannedMeals
        },
        error: null
      };
    } catch (error) {
      logger.error('Error fetching meal plan with meals', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a meal plan
   */
  static async updateMealPlan(
    mealPlanId: string,
    userId: string,
    updates: MealPlanUpdate
  ): Promise<{ data: MealPlanRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_modified_by: userId
        })
        .eq('id', mealPlanId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Meal plan updated successfully', 'MealPlanService', { mealPlanId });
      return { data, error: null };
    } catch (error) {
      logger.error('Error updating meal plan', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a meal plan and all its planned meals
   */
  static async deleteMealPlan(
    mealPlanId: string,
    userId: string
  ): Promise<{ error: Error | null }> {
    try {
      // Delete all planned meals first (cascade should handle this, but being explicit)
      const { error: mealsError } = await supabase
        .from('planned_meals')
        .delete()
        .eq('meal_plan_id', mealPlanId);

      if (mealsError) throw mealsError;

      // Delete the meal plan
      const { error: planError } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId)
        .eq('user_id', userId);

      if (planError) throw planError;

      logger.info('Meal plan deleted successfully', 'MealPlanService', { mealPlanId });
      return { error: null };
    } catch (error) {
      logger.error('Error deleting meal plan', 'MealPlanService', error);
      return { error: error as Error };
    }
  }

  /**
   * Add a meal to a plan
   */
  static async addPlannedMeal(
    mealPlanId: string,
    date: string,
    mealType: string,
    recipeId?: string,
    customMeal?: any,
    servings: number = 1,
    notes?: string
  ): Promise<{ data: PlannedMealRow | null; error: Error | null }> {
    try {
      // Get the next order index for this meal type on this date
      const { data: existingMeals } = await supabase
        .from('planned_meals')
        .select('order_index')
        .eq('meal_plan_id', mealPlanId)
        .eq('date', date)
        .eq('meal_type', mealType)
        .order('order_index', { ascending: false })
        .limit(1);

      const orderIndex = existingMeals && existingMeals.length > 0 
        ? existingMeals[0].order_index + 1 
        : 0;

      const { data, error } = await supabase
        .from('planned_meals')
        .insert({
          meal_plan_id: mealPlanId,
          date,
          meal_type: mealType,
          recipe_id: recipeId,
          custom_meal: customMeal,
          servings,
          notes,
          order_index: orderIndex,
          is_prepared: false,
          reminder_sent: false
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Planned meal added successfully', 'MealPlanService', { plannedMealId: data?.id });
      return { data, error: null };
    } catch (error) {
      logger.error('Error adding planned meal', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a planned meal
   */
  static async updatePlannedMeal(
    plannedMealId: string,
    updates: PlannedMealUpdate
  ): Promise<{ data: PlannedMealRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('planned_meals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', plannedMealId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Planned meal updated successfully', 'MealPlanService', { plannedMealId });
      return { data, error: null };
    } catch (error) {
      logger.error('Error updating planned meal', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Remove a planned meal
   */
  static async removePlannedMeal(
    plannedMealId: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('planned_meals')
        .delete()
        .eq('id', plannedMealId);

      if (error) throw error;

      logger.info('Planned meal removed successfully', 'MealPlanService', { plannedMealId });
      return { error: null };
    } catch (error) {
      logger.error('Error removing planned meal', 'MealPlanService', error);
      return { error: error as Error };
    }
  }

  /**
   * Mark a meal as prepared
   */
  static async markMealAsPrepared(
    plannedMealId: string,
    rating?: number,
    feedback?: string
  ): Promise<{ data: PlannedMealRow | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('planned_meals')
        .update({
          is_prepared: true,
          prepared_at: new Date().toISOString(),
          rating,
          feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', plannedMealId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Meal marked as prepared', 'MealPlanService', { plannedMealId });
      return { data, error: null };
    } catch (error) {
      logger.error('Error marking meal as prepared', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Duplicate a meal plan
   */
  static async duplicateMealPlan(
    sourceMealPlanId: string,
    userId: string,
    newStartDate: string,
    newEndDate: string,
    newName?: string
  ): Promise<{ data: MealPlanRow | null; error: Error | null }> {
    try {
      // Get source meal plan
      const { data: sourcePlan, error: sourceError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', sourceMealPlanId)
        .eq('user_id', userId)
        .single();

      if (sourceError) throw sourceError;

      // Create new meal plan
      const { data: newPlan, error: createError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: newName || `${sourcePlan.name} (copia)`,
          start_date: newStartDate,
          end_date: newEndDate,
          target_calories: sourcePlan.target_calories,
          target_macros: sourcePlan.target_macros,
          notes: sourcePlan.notes,
          is_template: sourcePlan.is_template,
          is_public: false
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get planned meals from source
      const { data: sourceMeals, error: mealsError } = await supabase
        .from('planned_meals')
        .select('*')
        .eq('meal_plan_id', sourceMealPlanId)
        .order('date', { ascending: true });

      if (mealsError) throw mealsError;

      // Calculate date offset
      const sourceStartDate = new Date(sourcePlan.start_date);
      const newStartDateObj = new Date(newStartDate);
      const dayOffset = Math.floor((newStartDateObj.getTime() - sourceStartDate.getTime()) / (1000 * 60 * 60 * 24));

      // Duplicate meals with adjusted dates
      if (sourceMeals && sourceMeals.length > 0) {
        const newMeals = sourceMeals.map(meal => {
          const mealDate = new Date(meal.date);
          mealDate.setDate(mealDate.getDate() + dayOffset);
          
          return {
            meal_plan_id: newPlan.id,
            date: mealDate.toISOString().split('T')[0],
            meal_type: meal.meal_type,
            recipe_id: meal.recipe_id,
            custom_meal: meal.custom_meal,
            servings: meal.servings,
            notes: meal.notes,
            order_index: meal.order_index,
            is_prepared: false,
            reminder_sent: false
          };
        });

        const { error: insertError } = await supabase
          .from('planned_meals')
          .insert(newMeals);

        if (insertError) throw insertError;
      }

      logger.info('Meal plan duplicated successfully', 'MealPlanService', { 
        sourceMealPlanId, 
        newMealPlanId: newPlan.id 
      });
      
      return { data: newPlan, error: null };
    } catch (error) {
      logger.error('Error duplicating meal plan', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a meal plan template from an existing plan
   */
  static async createTemplate(
    mealPlanId: string,
    userId: string,
    templateName: string,
    templateCategory?: string,
    isPublic: boolean = false
  ): Promise<{ data: MealPlanRow | null; error: Error | null }> {
    try {
      // Get the meal plan to use as template
      const { data: sourcePlan, error: sourceError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .eq('user_id', userId)
        .single();

      if (sourceError) throw sourceError;

      // Create the template
      const { data: template, error: createError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: templateName,
          start_date: sourcePlan.start_date,
          end_date: sourcePlan.end_date,
          target_calories: sourcePlan.target_calories,
          target_macros: sourcePlan.target_macros,
          notes: sourcePlan.notes,
          is_template: true,
          is_public: isPublic,
          template_category: templateCategory
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy planned meals to template
      const { data: sourceMeals, error: mealsError } = await supabase
        .from('planned_meals')
        .select('*')
        .eq('meal_plan_id', mealPlanId);

      if (mealsError) throw mealsError;

      if (sourceMeals && sourceMeals.length > 0) {
        const templateMeals = sourceMeals.map(meal => ({
          meal_plan_id: template.id,
          date: meal.date,
          meal_type: meal.meal_type,
          recipe_id: meal.recipe_id,
          custom_meal: meal.custom_meal,
          servings: meal.servings,
          notes: meal.notes,
          order_index: meal.order_index,
          is_prepared: false,
          reminder_sent: false
        }));

        const { error: insertError } = await supabase
          .from('planned_meals')
          .insert(templateMeals);

        if (insertError) throw insertError;
      }

      logger.info('Template created successfully', 'MealPlanService', { templateId: template.id });
      return { data: template, error: null };
    } catch (error) {
      logger.error('Error creating template', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get meal plan templates
   */
  static async getTemplates(
    userId?: string,
    isPublic: boolean = false,
    category?: string
  ): Promise<{ data: MealPlanRow[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('meal_plans')
        .select('*')
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      if (isPublic) {
        query = query.eq('is_public', true);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      if (category) {
        query = query.eq('template_category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching templates', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get week plan in the new unified format
   */
  static async getWeekPlan(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: WeekPlan | null; error: Error | null }> {
    try {
      // First, get or create meal plan
      let mealPlan: MealPlanRow | null = null;
      
      const { data: existingPlans } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('start_date', startDate)
        .eq('end_date', endDate)
        .limit(1);
      
      if (existingPlans && existingPlans.length > 0) {
        mealPlan = existingPlans[0];
      } else {
        // Create new meal plan if none exists
        const { data, error } = await this.createMealPlan(
          userId,
          startDate,
          endDate,
          `Semana del ${startDate}`
        );
        if (error) throw error;
        mealPlan = data;
      }
      
      if (!mealPlan) {
        throw new Error('Failed to get or create meal plan');
      }
      
      // Get planned meals
      const { data: plannedMeals, error: mealsError } = await supabase
        .from('planned_meals')
        .select(`
          *,
          recipes (
            id,
            name,
            slug,
            description,
            image_url,
            prep_time,
            cook_time,
            servings,
            difficulty,
            ingredients,
            instructions,
            nutrition_per_serving,
            tags,
            cuisine_types,
            meal_types,
            dietary_info
          )
        `)
        .eq('meal_plan_id', mealPlan.id)
        .order('date', { ascending: true })
        .order('order_index', { ascending: true });
      
      if (mealsError) throw mealsError;
      
      // Convert to WeekPlan format with MealSlots
      const slots: MealSlot[] = [];
      
      // Create slots for each day and meal type
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
        
        for (const mealType of mealTypes) {
          // Find planned meal for this slot
          const plannedMeal = plannedMeals?.find(
            pm => pm.date === dateStr && pm.meal_type === mealType
          );
          
          const slot: MealSlot = {
            id: `${dateStr}-${mealType}`,
            dayOfWeek,
            mealType,
            date: dateStr,
            servings: plannedMeal?.servings || 2,
            isLocked: false,
            isCompleted: plannedMeal?.is_prepared || false,
            createdAt: plannedMeal?.created_at || new Date().toISOString(),
            updatedAt: plannedMeal?.updated_at || new Date().toISOString()
          };
          
          // Add recipe if exists
          if (plannedMeal?.recipes) {
            slot.recipeId = plannedMeal.recipe_id;
            slot.recipe = {
              id: plannedMeal.recipes.id,
              name: plannedMeal.recipes.name,
              description: plannedMeal.recipes.description,
              image: plannedMeal.recipes.image_url,
              prepTime: plannedMeal.recipes.prep_time || 0,
              cookTime: plannedMeal.recipes.cook_time || 0,
              servings: plannedMeal.recipes.servings || 1,
              difficulty: plannedMeal.recipes.difficulty || 'medium',
              ingredients: plannedMeal.recipes.ingredients || [],
              instructions: plannedMeal.recipes.instructions || [],
              nutrition: plannedMeal.recipes.nutrition_per_serving,
              dietaryLabels: plannedMeal.recipes.dietary_info || [],
              cuisine: plannedMeal.recipes.cuisine_types?.[0],
              tags: plannedMeal.recipes.tags || [],
              rating: plannedMeal.rating,
              isAiGenerated: false,
              isFavorite: false
            };
          }
          
          // Add custom meal if exists
          if (plannedMeal?.custom_meal) {
            slot.customMealName = plannedMeal.custom_meal.name;
          }
          
          // Add notes if exists
          if (plannedMeal?.notes) {
            slot.notes = plannedMeal.notes;
          }
          
          slots.push(slot);
        }
      }
      
      const weekPlan: WeekPlan = {
        id: mealPlan.id,
        userId: mealPlan.user_id,
        startDate,
        endDate,
        slots,
        isActive: true,
        createdAt: mealPlan.created_at,
        updatedAt: mealPlan.updated_at
      };
      
      return { data: weekPlan, error: null };
    } catch (error) {
      logger.error('Error getting week plan', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Save week plan in the new unified format
   */
  static async saveWeekPlan(
    userId: string,
    startDate: string,
    endDate: string,
    weekPlan: WeekPlan
  ): Promise<{ data: MealPlanRow | null; error: Error | null }> {
    try {
      // Get or create meal plan
      let mealPlan: MealPlanRow | null = null;
      
      const { data: existingPlans } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('start_date', startDate)
        .eq('end_date', endDate)
        .limit(1);
      
      if (existingPlans && existingPlans.length > 0) {
        mealPlan = existingPlans[0];
      } else {
        const { data, error } = await this.createMealPlan(
          userId,
          startDate,
          endDate,
          `Semana del ${startDate}`
        );
        if (error) throw error;
        mealPlan = data;
      }
      
      if (!mealPlan) throw new Error('Failed to create or update meal plan');
      
      // Delete existing planned meals
      await supabase
        .from('planned_meals')
        .delete()
        .eq('meal_plan_id', mealPlan.id);
      
      // Add planned meals from slots
      for (const slot of weekPlan.slots) {
        if (slot.recipeId || slot.customMealName) {
          await this.addPlannedMeal(
            mealPlan.id,
            slot.date,
            slot.mealType,
            slot.recipeId,
            slot.customMealName ? { name: slot.customMealName } : undefined,
            slot.servings,
            slot.notes
          );
        }
      }

      logger.info('Week plan saved successfully', 'MealPlanService', { mealPlanId: mealPlan.id });
      return { data: mealPlan, error: null };
    } catch (error) {
      logger.error('Error saving week plan', 'MealPlanService', error);
      return { data: null, error: error as Error };
    }
  }
}