import { http, HttpResponse } from 'msw';
import { 
  createMockPantryItem, 
  createMockRecipe, 
  createMockMealPlan,
  createMockUser 
} from '../utils/test-utils';
import type { RecipeIngredient } from '@/features/pantry/types';

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';

export const handlers = [
  // Auth handlers
  http.get(`${API_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      user: createMockUser(),
    });
  }),

  http.post(`${API_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      user: createMockUser(),
      session: { access_token: 'test-token', refresh_token: 'test-refresh' },
    });
  }),

  http.post(`${API_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      user: createMockUser(),
      session: { access_token: 'test-token', refresh_token: 'test-refresh' },
    });
  }),

  // Pantry API handlers
  http.get('/api/pantry/items', () => {
    return HttpResponse.json({
      data: {
        items: [
          createMockPantryItem({ id: '1', ingredient_name: 'Apples' }),
          createMockPantryItem({ id: '2', ingredient_name: 'Bananas' }),
          createMockPantryItem({ id: '3', ingredient_name: 'Carrots' }),
        ],
      },
      success: true,
      pagination: {
        page: 1,
        limit: 50,
        total: 3,
        pages: 1,
      },
    });
  }),

  http.post('/api/pantry/items', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      data: createMockPantryItem(body || {}),
      success: true,
      message: 'Pantry item created successfully',
    }, { status: 201 });
  }),

  http.put('/api/pantry/items/:id', async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      data: createMockPantryItem({ ...(body || {}), id: params.id }),
      success: true,
      message: 'Pantry item updated successfully',
    });
  }),

  http.delete('/api/pantry/items/:id', () => {
    return HttpResponse.json({
      data: null,
      success: true,
      message: 'Pantry item deleted successfully',
    });
  }),

  http.get('/api/pantry/stats', () => {
    return HttpResponse.json({
      data: {
        totalItems: 10,
        expiringItems: 3,
        expiredItems: 1,
        categories: {
          'Produce': 4,
          'Dairy': 3,
          'Pantry Staples': 3,
        },
        totalValue: 45.67,
      },
      success: true,
    });
  }),

  http.get('/api/pantry/analysis', () => {
    return HttpResponse.json({
      data: {
        waste_analysis: {
          expired_items_last_month: 2,
          waste_value: 12.34,
          most_wasted_categories: ['Produce', 'Dairy'],
        },
        usage_patterns: {
          most_used_ingredients: ['Eggs', 'Milk', 'Flour'],
          seasonal_trends: { 'Fresh Produce': 1.2, 'Canned Goods': 0.8 },
          shopping_frequency: 7,
        },
        optimization_suggestions: {
          bulk_buy_recommendations: ['Rice and pasta in bulk'],
          storage_improvements: ['Store produce properly'],
          recipe_suggestions: ['Banana bread with overripe bananas'],
        },
      },
      success: true,
    });
  }),

  http.get('/api/pantry/expiration-alerts', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'alert-1',
          pantry_item_id: '1',
          item_name: 'Milk',
          expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          days_until_expiration: 2,
          alert_type: 'urgent',
          dismissed: false,
          created_at: new Date(),
        },
        {
          id: 'alert-2',
          pantry_item_id: '2',
          item_name: 'Yogurt',
          expiration_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          days_until_expiration: -1,
          alert_type: 'expired',
          dismissed: false,
          created_at: new Date(),
        },
      ],
      success: true,
    });
  }),

  http.post('/api/pantry/availability', async ({ request }) => {
    const body = await request.json() as any;
    const recipeIngredients = body?.recipe_ingredients || [];
    return HttpResponse.json({
      data: {
        availability: recipeIngredients.map((ing: RecipeIngredient) => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          required_quantity: ing.quantity,
          required_unit: ing.unit,
          available_quantity: Math.random() > 0.5 ? ing.quantity : 0,
          available_unit: ing.unit,
          sufficient: Math.random() > 0.5,
        })),
        shopping_list: [],
        summary: {
          total_ingredients: recipeIngredients.length,
          available_ingredients: Math.floor(recipeIngredients.length * 0.7),
          missing_ingredients: Math.floor(recipeIngredients.length * 0.3),
          availability_percentage: 70,
        },
      },
      success: true,
    });
  }),

  // Recipe API handlers
  http.get('/api/recipes', () => {
    return HttpResponse.json({
      data: [
        createMockRecipe({ id: '1', name: 'Pasta Carbonara' }),
        createMockRecipe({ id: '2', name: 'Chicken Stir Fry' }),
        createMockRecipe({ id: '3', name: 'Vegetable Soup' }),
      ],
      success: true,
    });
  }),

  http.post('/api/recipes', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      data: createMockRecipe(body || {}),
      success: true,
      message: 'Recipe created successfully',
    }, { status: 201 });
  }),

  http.post('/api/recipes/generate/claude', async () => {
    return HttpResponse.json({
      data: createMockRecipe({
        name: 'AI Generated Recipe',
        ai_generated: true,
      }),
      success: true,
    });
  }),

  http.post('/api/recipes/generate/gemini', async () => {
    return HttpResponse.json({
      data: createMockRecipe({
        name: 'Gemini Generated Recipe',
        ai_generated: true,
      }),
      success: true,
    });
  }),

  // Meal Planner API handlers
  http.get('/api/meal-plans', () => {
    return HttpResponse.json({
      data: [createMockMealPlan()],
      success: true,
    });
  }),

  http.post('/api/meal-plans', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: createMockMealPlan(body),
      success: true,
      message: 'Meal plan created successfully',
    }, { status: 201 });
  }),

  http.post('/api/planner/claude/suggestions', async () => {
    return HttpResponse.json({
      suggestions: [
        {
          recipe_id: '1',
          recipe_name: 'Suggested Recipe 1',
          reason: 'Based on your pantry items',
          match_score: 0.9,
        },
        {
          recipe_id: '2',
          recipe_name: 'Suggested Recipe 2',
          reason: 'Healthy and quick to make',
          match_score: 0.85,
        },
      ],
    });
  }),

  // Shopping List API handlers
  http.post('/api/planner/shopping-intelligence', async ({ request }) => {
    const body = await request.json() as any;
    const items = body?.items || [];
    return HttpResponse.json({
      data: {
        optimized_list: items.map((item: any) => ({
          ...item,
          store_section: 'Produce',
          estimated_price: Math.random() * 10,
        })),
        store_layout: ['Produce', 'Dairy', 'Meat', 'Pantry'],
        estimated_total: 45.67,
        savings_tips: ['Buy generic brands', 'Use coupons'],
      },
      success: true,
    });
  }),

  // Dashboard API handlers
  http.get('/api/dashboard/summary', () => {
    return HttpResponse.json({
      data: {
        pantry_items_count: 25,
        expiring_soon_count: 5,
        upcoming_meals_count: 7,
        nutrition_score: 85,
        recent_activities: [
          { type: 'pantry_add', description: 'Added Milk', timestamp: new Date() },
          { type: 'recipe_cook', description: 'Cooked Pasta', timestamp: new Date() },
        ],
      },
      success: true,
    });
  }),

  // AI Intelligence handlers
  http.post('/features/pantry/api/intelligence', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body?.action === 'insights') {
      return HttpResponse.json({
        insights: [
          {
            title: 'Reduce Food Waste',
            description: 'You have 3 items expiring soon',
            impact: 'high',
            actionable_steps: ['Use bananas for smoothie', 'Freeze bread'],
            estimated_savings: 15.50,
          },
          {
            title: 'Bulk Buying Opportunity',
            description: 'Rice is on sale this week',
            impact: 'medium',
            actionable_steps: ['Buy 10lb bag instead of 2lb'],
            estimated_savings: 8.00,
          },
        ],
      });
    }

    return HttpResponse.json({ insights: [] });
  }),

  // Catch-all handler for Supabase
  http.get(`${API_URL}/*`, () => {
    return HttpResponse.json({ data: [], error: null });
  }),
  
  http.post(`${API_URL}/*`, () => {
    return HttpResponse.json({ data: {}, error: null });
  }),
];

// Export handlers for specific test scenarios
export const errorHandlers = [
  http.get('/api/pantry/items', () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.post('/api/pantry/items', () => {
    return HttpResponse.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  }),
];

export const unauthorizedHandlers = [
  http.get('/api/pantry/items', () => {
    return HttpResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }),
];