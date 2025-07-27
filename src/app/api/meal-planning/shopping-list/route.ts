import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getUser } from '@/lib/auth/supabase-auth';
import { db } from '@/lib/supabase/database.service';

interface ShoppingListItem {
  ingredient_name: string;
  needed_quantity: number;
  unit: string;
  available_quantity: number;
  shortage: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimated_price?: number;
  recipes_using: string[];
}

interface ShoppingListResponse {
  shopping_list: ShoppingListItem[];
  summary: {
    total_items: number;
    high_priority_items: number;
    estimated_total_cost: number;
    pantry_coverage_percentage: number;
  };
  meal_plan_dates: {
    start_date: string;
    end_date: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start_date, end_date, meal_plan_ids } = body;

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Get meal plans for the specified date range
    const mealPlans = await db.getMealPlans(
      user.id,
      new Date(start_date),
      new Date(end_date)
    );

    if (!mealPlans || mealPlans.length === 0) {
      return NextResponse.json(
        { error: 'No meal plans found for the specified date range' },
        { status: 400 }
      );
    }

    // Get user's current pantry items
    const pantryItems = await db.getPantryItems(user.id);

    // Create a map of available pantry ingredients
    const pantryMap = new Map<string, { quantity: number; unit: string }>();
    pantryItems.forEach(item => {
      const ingredientName = item.ingredient?.name?.toLowerCase();
      if (ingredientName) {
        const existing = pantryMap.get(ingredientName);
        if (existing) {
          // Sum quantities if same unit, otherwise keep separate entries
          if (existing.unit === item.unit) {
            existing.quantity += item.quantity;
          }
        } else {
          pantryMap.set(ingredientName, {
            quantity: item.quantity,
            unit: item.unit
          });
        }
      }
    });

    // Collect all required ingredients from recipes in meal plans
    const requiredIngredients = new Map<string, {
      total_quantity: number;
      unit: string;
      recipes: string[];
      category: string;
    }>();

    for (const mealPlan of mealPlans) {
      if (mealPlan.recipe) {
        const recipe = await db.getRecipeById(mealPlan.recipe.id, user.id);
        if (recipe?.recipe_ingredients) {
          for (const recipeIngredient of recipe.recipe_ingredients) {
            const ingredientName = recipeIngredient.ingredient?.name?.toLowerCase();
            if (ingredientName) {
              const servingMultiplier = mealPlan.servings || 1;
              const adjustedQuantity = recipeIngredient.quantity * servingMultiplier;

              const existing = requiredIngredients.get(ingredientName);
              if (existing) {
                // Sum quantities if same unit
                if (existing.unit === recipeIngredient.unit) {
                  existing.total_quantity += adjustedQuantity;
                }
                existing.recipes.push(recipe.title);
              } else {
                requiredIngredients.set(ingredientName, {
                  total_quantity: adjustedQuantity,
                  unit: recipeIngredient.unit,
                  recipes: [recipe.title],
                  category: recipeIngredient.ingredient?.category || 'otros'
                });
              }
            }
          }
        }
      }
    }

    // Calculate shopping list by comparing required vs available
    const shoppingList: ShoppingListItem[] = [];
    let totalPantryCoverage = 0;
    let totalRequiredItems = 0;

    requiredIngredients.forEach((required, ingredientName) => {
      totalRequiredItems++;
      const available = pantryMap.get(ingredientName);
      const availableQuantity = available?.quantity || 0;
      const shortage = Math.max(0, required.total_quantity - availableQuantity);

      if (availableQuantity > 0) {
        totalPantryCoverage++;
      }

      // Only add to shopping list if there's a shortage
      if (shortage > 0) {
        // Determine priority based on recipe frequency and shortage amount
        const recipeCount = required.recipes.length;
        let priority: 'high' | 'medium' | 'low' = 'medium';
        
        if (recipeCount >= 3 || shortage >= required.total_quantity) {
          priority = 'high';
        } else if (recipeCount === 1 && shortage < required.total_quantity * 0.5) {
          priority = 'low';
        }

        shoppingList.push({
          ingredient_name: ingredientName,
          needed_quantity: required.total_quantity,
          unit: required.unit,
          available_quantity: availableQuantity,
          shortage,
          priority,
          category: required.category,
          recipes_using: [...new Set(required.recipes)] // Remove duplicates
        });
      }
    });

    // Sort shopping list by priority and category
    shoppingList.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.category.localeCompare(b.category);
    });

    const response: ShoppingListResponse = {
      shopping_list: shoppingList,
      summary: {
        total_items: shoppingList.length,
        high_priority_items: shoppingList.filter(item => item.priority === 'high').length,
        estimated_total_cost: 0, // Could be calculated with price data
        pantry_coverage_percentage: totalRequiredItems > 0 
          ? Math.round((totalPantryCoverage / totalRequiredItems) * 100) 
          : 0
      },
      meal_plan_dates: {
        start_date,
        end_date
      }
    };

    logger.info('Generated shopping list', 'meal-planning/shopping-list', {
      userId: user.id,
      totalItems: shoppingList.length,
      pantryCoverage: response.summary.pantry_coverage_percentage
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error generating shopping list:', 'meal-planning/shopping-list', error);
    return NextResponse.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    
    // Generate shopping list for next N days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    // Get meal plans for the specified period
    const mealPlans = await db.getMealPlans(user.id, startDate, endDate);

    if (!mealPlans || mealPlans.length === 0) {
      return NextResponse.json({
        shopping_list: [],
        summary: {
          total_items: 0,
          high_priority_items: 0,
          estimated_total_cost: 0,
          pantry_coverage_percentage: 0
        },
        meal_plan_dates: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });
    }

    // Use the same logic as POST but with auto-generated date range
    const response = await fetch(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
    });

    return response;

  } catch (error) {
    logger.error('Error in GET shopping list:', 'meal-planning/shopping-list', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    );
  }
}