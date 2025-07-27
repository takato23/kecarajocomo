/**
 * Pantry-Integrated Meal Planning Service
 * Enhances meal planning with pantry availability and smart suggestions
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/supabase/database.service';
import { GeminiService } from '@/services/ai/GeminiService';

interface PantryIngredient {
  name: string;
  quantity: number;
  unit: string;
  expiration_date?: string;
  category: string;
}

interface PantryAwareMealPlan {
  recipe_id?: string;
  recipe_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  pantry_usage: number; // Percentage of ingredients from pantry
  missing_ingredients: string[];
  expiring_ingredients_used: string[];
  instructions: string[];
  nutrition_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface WeeklyPantryPlan {
  week_start: string;
  week_end: string;
  daily_plans: {
    date: string;
    meals: PantryAwareMealPlan[];
  }[];
  shopping_list: {
    ingredient_name: string;
    quantity: number;
    unit: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  pantry_optimization: {
    total_pantry_usage: number;
    expiring_items_used: number;
    waste_reduction_score: number;
  };
}

export class PantryMealPlanningService {
  private gemini: GeminiService;

  constructor() {
    this.gemini = new GeminiService();
  }

  /**
   * Generate a weekly meal plan optimized for pantry usage
   */
  async generatePantryOptimizedPlan(
    userId: string,
    preferences: {
      dietary_restrictions?: string[];
      cuisine_preferences?: string[];
      cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
      prep_time_preference?: 'quick' | 'moderate' | 'elaborate';
      meal_types?: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
    } = {},
    dateRange: {
      start_date: Date;
      end_date: Date;
    }
  ): Promise<WeeklyPantryPlan> {
    try {
      // Get user's pantry items
      const pantryItems = await db.getPantryItems(userId);
      
      // Transform pantry items for AI processing
      const pantryInventory: PantryIngredient[] = pantryItems.map(item => ({
        name: item.ingredient?.name || '',
        quantity: item.quantity,
        unit: item.unit,
        expiration_date: item.expiration_date,
        category: item.ingredient?.category || 'otros'
      })).filter(item => item.name);

      // Identify expiring items (within 7 days)
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringItems = pantryInventory.filter(item => 
        item.expiration_date && 
        new Date(item.expiration_date) <= oneWeekFromNow &&
        new Date(item.expiration_date) >= now
      );

      // Generate the meal plan prompt
      const prompt = this.createPantryOptimizedPrompt(
        pantryInventory,
        expiringItems,
        preferences,
        dateRange
      );

      logger.info('Generating pantry-optimized meal plan', 'PantryMealPlanningService', {
        userId,
        pantryItemsCount: pantryInventory.length,
        expiringItemsCount: expiringItems.length
      });

      const response = await this.gemini.generateContent(prompt);
      const mealPlan = JSON.parse(response) as WeeklyPantryPlan;

      // Validate and enhance the response
      const validatedPlan = this.validateAndEnhancePlan(mealPlan, dateRange);

      return validatedPlan;

    } catch (error) {
      logger.error('Error generating pantry-optimized meal plan:', 'PantryMealPlanningService', error);
      throw new Error('Failed to generate pantry-optimized meal plan');
    }
  }

  /**
   * Suggest recipes based on expiring ingredients
   */
  async suggestRecipesForExpiringItems(
    userId: string,
    daysAhead: number = 3
  ): Promise<PantryAwareMealPlan[]> {
    try {
      const pantryItems = await db.getPantryItems(userId);
      
      // Find items expiring within the specified days
      const now = new Date();
      const targetDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      const expiringItems = pantryItems.filter(item => 
        item.expiration_date && 
        new Date(item.expiration_date) <= targetDate &&
        new Date(item.expiration_date) >= now
      );

      if (expiringItems.length === 0) {
        return [];
      }

      const expiringIngredients = expiringItems.map(item => ({
        name: item.ingredient?.name || '',
        quantity: item.quantity,
        unit: item.unit,
        days_until_expiry: Math.ceil(
          (new Date(item.expiration_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      })).filter(item => item.name);

      const prompt = `
Based on these expiring pantry ingredients, suggest 3-5 recipes that use them effectively:

Expiring Ingredients:
${expiringIngredients.map(ing => 
  `- ${ing.name} (${ing.quantity} ${ing.unit}) - expires in ${ing.days_until_expiry} days`
).join('\n')}

For each recipe, provide:
1. Recipe name and description
2. Meal type (breakfast, lunch, dinner, snack)
3. Prep and cook time
4. Servings
5. Which expiring ingredients it uses and how much
6. Additional ingredients needed (if any)
7. Basic cooking instructions
8. Nutritional highlights

Prioritize recipes that:
- Use ingredients expiring soonest
- Minimize food waste
- Are practical and quick to prepare
- Use multiple expiring ingredients when possible

Return as JSON array of recipe objects with this structure:
{
  "recipe_name": string,
  "meal_type": string,
  "description": string,
  "prep_time": number,
  "cook_time": number,
  "servings": number,
  "expiring_ingredients_used": string[],
  "additional_ingredients": string[],
  "instructions": string[],
  "pantry_usage": number,
  "nutrition_info": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}
`;

      const response = await this.gemini.generateContent(prompt);
      const suggestions = JSON.parse(response) as PantryAwareMealPlan[];

      logger.info('Generated expiring ingredient recipes', 'PantryMealPlanningService', {
        userId,
        expiringItemsCount: expiringItems.length,
        suggestionsCount: suggestions.length
      });

      return suggestions;

    } catch (error) {
      logger.error('Error suggesting recipes for expiring items:', 'PantryMealPlanningService', error);
      throw new Error('Failed to suggest recipes for expiring items');
    }
  }

  /**
   * Optimize existing meal plan based on pantry availability
   */
  async optimizeMealPlanWithPantry(
    userId: string,
    existingMealPlanIds: string[]
  ): Promise<{
    optimized_meals: PantryAwareMealPlan[];
    pantry_coverage_improvement: number;
    suggested_substitutions: {
      original_ingredient: string;
      pantry_alternative: string;
      recipe_name: string;
    }[];
  }> {
    try {
      // Get pantry items
      const pantryItems = await db.getPantryItems(userId);
      const availableIngredients = pantryItems.map(item => 
        item.ingredient?.name?.toLowerCase() || ''
      ).filter(Boolean);

      // Get existing meal plans
      const mealPlans = [];
      for (const planId of existingMealPlanIds) {
        const plan = await db.getMealPlans(userId);
        // Find the specific plan by ID - this would need enhancement in db service
        mealPlans.push(...plan.filter(p => p.id === planId));
      }

      if (mealPlans.length === 0) {
        throw new Error('No meal plans found to optimize');
      }

      // Create optimization prompt
      const prompt = `
Optimize these existing meal plans based on available pantry ingredients:

Available Pantry Ingredients:
${availableIngredients.join(', ')}

Current Meal Plans:
${mealPlans.map(plan => `- ${plan.recipe?.title || 'Unknown Recipe'} (${plan.meal_type})`).join('\n')}

Provide optimization suggestions that:
1. Maximize use of pantry ingredients
2. Suggest ingredient substitutions where possible
3. Recommend alternative recipes with better pantry coverage
4. Calculate pantry coverage improvement percentage

Return as JSON with:
{
  "optimized_meals": [array of optimized meal objects],
  "pantry_coverage_improvement": number,
  "suggested_substitutions": [array of substitution objects]
}
`;

      const response = await this.gemini.generateContent(prompt);
      const optimization = JSON.parse(response);

      logger.info('Optimized meal plan with pantry', 'PantryMealPlanningService', {
        userId,
        originalMealsCount: mealPlans.length,
        optimizedMealsCount: optimization.optimized_meals?.length || 0
      });

      return optimization;

    } catch (error) {
      logger.error('Error optimizing meal plan with pantry:', 'PantryMealPlanningService', error);
      throw new Error('Failed to optimize meal plan with pantry');
    }
  }

  private createPantryOptimizedPrompt(
    pantryInventory: PantryIngredient[],
    expiringItems: PantryIngredient[],
    preferences: any,
    dateRange: { start_date: Date; end_date: Date }
  ): string {
    const daysDiff = Math.ceil(
      (dateRange.end_date.getTime() - dateRange.start_date.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `
Create a ${daysDiff}-day meal plan optimized for pantry usage and waste reduction.

PANTRY INVENTORY:
${pantryInventory.map(item => `- ${item.name} (${item.quantity} ${item.unit}) - Category: ${item.category}`).join('\n')}

EXPIRING SOON (priority usage):
${expiringItems.map(item => `- ${item.name} (expires: ${item.expiration_date})`).join('\n')}

USER PREFERENCES:
- Dietary restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
- Cuisine preferences: ${preferences.cuisine_preferences?.join(', ') || 'Any'}
- Cooking skill level: ${preferences.cooking_skill_level || 'intermediate'}
- Prep time preference: ${preferences.prep_time_preference || 'moderate'}
- Meal types: ${preferences.meal_types?.join(', ') || 'breakfast, lunch, dinner'}

DATE RANGE: ${dateRange.start_date.toISOString().split('T')[0]} to ${dateRange.end_date.toISOString().split('T')[0]}

OPTIMIZATION GOALS:
1. Maximize pantry ingredient usage (aim for 60%+ pantry coverage per meal)
2. Prioritize expiring ingredients first
3. Minimize food waste
4. Create balanced, nutritious meals
5. Generate efficient shopping list for missing ingredients

For each meal, provide:
- Recipe name and description
- Meal type and timing
- Prep/cook time and servings
- Ingredients from pantry (with quantities used)
- Missing ingredients needed
- Expiring ingredients incorporated
- Cooking instructions
- Nutritional information
- Pantry usage percentage

Return as complete JSON object with the WeeklyPantryPlan structure including daily_plans, shopping_list, and pantry_optimization metrics.
`;
  }

  private validateAndEnhancePlan(
    plan: WeeklyPantryPlan,
    dateRange: { start_date: Date; end_date: Date }
  ): WeeklyPantryPlan {
    // Ensure dates are properly set
    plan.week_start = dateRange.start_date.toISOString().split('T')[0];
    plan.week_end = dateRange.end_date.toISOString().split('T')[0];

    // Validate daily plans exist
    if (!plan.daily_plans || plan.daily_plans.length === 0) {
      throw new Error('No daily plans generated');
    }

    // Ensure shopping list has priorities
    if (plan.shopping_list) {
      plan.shopping_list.forEach(item => {
        if (!item.priority) {
          item.priority = 'medium';
        }
      });
    }

    // Validate pantry optimization metrics
    if (!plan.pantry_optimization) {
      plan.pantry_optimization = {
        total_pantry_usage: 0,
        expiring_items_used: 0,
        waste_reduction_score: 0
      };
    }

    return plan;
  }
}

// Singleton instance
export const pantryMealPlanningService = new PantryMealPlanningService();