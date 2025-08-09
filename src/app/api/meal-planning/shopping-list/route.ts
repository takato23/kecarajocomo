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
    // Autenticación
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start_date, end_date, meal_plan_ids, plan } = body as {
      start_date?: string;
      end_date?: string;
      meal_plan_ids?: string[];
      plan?: any;
    };

    // Helper: crea mapa de ingredientes requeridos desde un plan arbitrario
    const collectRequiredFromPlan = (inputPlan: any) => {
      const required = new Map<string, { total_quantity: number; unit: string; recipes: string[]; category: string }>();

      const upsert = (name: string, qty: number, unit: string, recipeTitle: string, category: string) => {
        const key = name.trim().toLowerCase();
        if (!key) return;
        const ex = required.get(key);
        if (ex) {
          if (ex.unit === unit) ex.total_quantity += qty;
          if (!ex.recipes.includes(recipeTitle)) ex.recipes.push(recipeTitle);
        } else {
          required.set(key, { total_quantity: qty, unit, recipes: [recipeTitle], category: category || 'otros' });
        }
      };

      const extractIngredients = (recipe: any) => {
        const title: string = recipe?.title || recipe?.name || 'Receta';
        const ingredients = recipe?.ingredients;
        if (Array.isArray(ingredients)) {
          for (const ing of ingredients) {
            if (ing && typeof ing === 'object') {
              const name: string = ing.name || ing.ingredient || '';
              const amount: number = typeof ing.amount === 'number' ? ing.amount : (typeof ing.quantity === 'number' ? ing.quantity : 1);
              const unit: string = ing.unit || ing.units || 'unidades';
              const category: string = ing.aisle || ing.category || 'otros';
              if (name) upsert(name, amount, unit, title, category);
            } else if (typeof ing === 'string') {
              upsert(ing, 1, 'unidades', title, 'otros');
            }
          }
        }
      };

      const days: any[] = Array.isArray(inputPlan?.days) ? inputPlan.days : [];
      for (const day of days) {
        // Formato { meals: { breakfast|lunch|snack|dinner: { recipe } } }
        if (day?.meals && typeof day.meals === 'object') {
          for (const key of ['breakfast', 'lunch', 'snack', 'dinner']) {
            const slot = (day.meals as any)[key];
            const rec = slot?.recipe || slot; // algunos planes ponen la receta directo
            if (rec) extractIngredients(rec);
          }
        }
        // Formato { slots: { breakfast|lunch|snack|dinner: RecipeLike } }
        if (day?.slots && typeof day.slots === 'object') {
          for (const key of ['breakfast', 'lunch', 'snack', 'dinner']) {
            const rec = (day.slots as any)[key];
            if (rec) extractIngredients(rec.recipe || rec);
          }
        }
      }

      // Fallback: recetas a nivel raíz
      if (Array.isArray(inputPlan?.recipes)) {
        for (const rec of inputPlan.recipes) extractIngredients(rec);
      }

      return required;
    };

    // Helper: derivar rango de fechas desde el plan
    const deriveRangeFromPlan = (inputPlan: any): { start: Date; end: Date } => {
      const today = new Date();
      const dates: Date[] = [];
      if (Array.isArray(inputPlan?.days)) {
        for (const day of inputPlan.days) {
          if (day?.date) {
            const d = new Date(day.date);
            if (!isNaN(d.getTime())) dates.push(d);
          }
        }
      }
      if (dates.length) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        return { start: dates[0], end: dates[dates.length - 1] };
      }
      // Fallback 7 días desde hoy
      const end = new Date(today);
      end.setDate(today.getDate() + 6);
      return { start: today, end };
    };

    // Helper: construir respuesta a partir de requerimientos y despensa
    const buildResponse = (
      required: Map<string, { total_quantity: number; unit: string; recipes: string[]; category: string }>,
      pantryMap: Map<string, { quantity: number; unit: string }>,
      start: Date,
      end: Date
    ) => {
      const shoppingList: ShoppingListItem[] = [] as any;
      let totalPantryCoverage = 0;
      let totalRequiredItems = 0;

      required.forEach((req, ingredientName) => {
        totalRequiredItems++;
        const available = pantryMap.get(ingredientName);
        const availableQuantity = available?.quantity || 0;
        const shortage = Math.max(0, req.total_quantity - availableQuantity);
        if (availableQuantity > 0) totalPantryCoverage++;
        if (shortage > 0) {
          const recipeCount = req.recipes.length;
          let priority: 'high' | 'medium' | 'low' = 'medium';
          if (recipeCount >= 3 || shortage >= req.total_quantity) priority = 'high';
          else if (recipeCount === 1 && shortage < req.total_quantity * 0.5) priority = 'low';

          shoppingList.push({
            ingredient_name: ingredientName,
            needed_quantity: req.total_quantity,
            unit: req.unit,
            available_quantity: availableQuantity,
            shortage,
            priority,
            category: req.category,
            recipes_using: [...new Set(req.recipes)]
          } as any);
        }
      });

      // Ordenar por prioridad y categoría
      shoppingList.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 } as const;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.category.localeCompare(b.category);
      });

      const response: ShoppingListResponse = {
        shopping_list: shoppingList,
        summary: {
          total_items: shoppingList.length,
          high_priority_items: shoppingList.filter((i) => i.priority === 'high').length,
          estimated_total_cost: 0,
          pantry_coverage_percentage: totalRequiredItems > 0
            ? Math.round((totalPantryCoverage / totalRequiredItems) * 100)
            : 0,
        },
        meal_plan_dates: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
      };

      return response;
    };

    // Si viene un plan completo, generar lista directamente desde el plan
    if (plan) {
      try {
        const requiredFromPlan = collectRequiredFromPlan(plan);
        // Cargar despensa del usuario para calcular faltantes
        const pantryItems = await db.getPantryItems(user.id);
        const pantryMap = new Map<string, { quantity: number; unit: string }>();
        pantryItems.forEach((item) => {
          const ingredientName = item.ingredient?.name?.toLowerCase();
          if (ingredientName) {
            const ex = pantryMap.get(ingredientName);
            if (ex) {
              if (ex.unit === item.unit) ex.quantity += item.quantity;
            } else {
              pantryMap.set(ingredientName, { quantity: item.quantity, unit: item.unit });
            }
          }
        });

        const range = deriveRangeFromPlan(plan);
        const response = buildResponse(requiredFromPlan, pantryMap, range.start, range.end);
        return NextResponse.json(response);
      } catch (e) {
        console.error('[ShoppingList] Error procesando plan', e);
        logger.error('Error processing plan for shopping list:', 'meal-planning/shopping-list', e as unknown);
        return NextResponse.json(
          { error: 'Invalid plan format' },
          { status: 400 }
        );
      }
    }

    // Flujo existente: requiere start_date y end_date
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