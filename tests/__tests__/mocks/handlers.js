const { http, HttpResponse } = require('msw');

const handlers = [
  // Auth endpoints
  http.post('/auth/v1/signup', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: body.email,
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });
  }),

  http.post('/auth/v1/signin', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: body.email,
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      },
    });
  }),

  // Pantry endpoints
  http.get('/rest/v1/pantry_items', () => {
    return HttpResponse.json([
      {
        id: 'item-1',
        user_id: 'test-user-id',
        ingredient_id: 'ing-1',
        quantity: 2,
        unit: 'kg',
        expiration_date: '2024-12-31',
        location: 'fridge',
        ingredients: {
          id: 'ing-1',
          name: 'Tomatoes',
          category: 'vegetable',
          unit: 'kg',
        },
      },
      {
        id: 'item-2',
        user_id: 'test-user-id',
        ingredient_id: 'ing-2',
        quantity: 1,
        unit: 'L',
        expiration_date: '2024-12-25',
        location: 'pantry',
        ingredients: {
          id: 'ing-2',
          name: 'Milk',
          category: 'dairy',
          unit: 'L',
        },
      },
    ]);
  }),

  http.post('/rest/v1/pantry_items', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'new-item-id',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  // Recipe endpoints
  http.get('/rest/v1/recipes', () => {
    return HttpResponse.json([
      {
        id: 'recipe-1',
        name: 'Tomato Pasta',
        description: 'Simple and delicious pasta with fresh tomatoes',
        prep_time: 10,
        cook_time: 20,
        servings: 4,
        difficulty: 'easy',
        cuisine: 'Italian',
        created_at: new Date().toISOString(),
      },
      {
        id: 'recipe-2',
        name: 'Grilled Chicken',
        description: 'Healthy grilled chicken with herbs',
        prep_time: 15,
        cook_time: 25,
        servings: 2,
        difficulty: 'medium',
        cuisine: 'American',
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Meal plan endpoints
  http.get('/rest/v1/meal_plans', () => {
    return HttpResponse.json([
      {
        id: 'plan-1',
        user_id: 'test-user-id',
        name: 'Week 1',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Shopping list endpoints
  http.get('/rest/v1/shopping_lists', () => {
    return HttpResponse.json([
      {
        id: 'list-1',
        user_id: 'test-user-id',
        name: 'Weekly Shopping',
        items: [
          {
            id: 'list-item-1',
            ingredient_id: 'ing-1',
            quantity: 3,
            unit: 'kg',
            checked: false,
          },
        ],
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // AI endpoints
  http.post('/api/ai/generate-recipe', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      recipe: {
        name: 'AI Generated Recipe',
        description: 'A delicious recipe created by AI',
        ingredients: [
          { name: 'Ingredient 1', quantity: 1, unit: 'cup' },
          { name: 'Ingredient 2', quantity: 2, unit: 'tbsp' },
        ],
        instructions: [
          'Step 1: Prepare ingredients',
          'Step 2: Cook the dish',
          'Step 3: Serve and enjoy',
        ],
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        nutrition: {
          calories: 350,
          protein: 25,
          carbs: 45,
          fat: 12,
        },
      },
    });
  }),

  // Gemini AI endpoints
  http.post('/api/pantry/analysis', async () => {
    return HttpResponse.json({
      insights: [
        {
          type: 'waste_reduction',
          title: 'Use Expiring Items',
          description: 'You have items expiring soon that should be used.',
          impact: 'high',
          actionable_steps: ['Use milk in recipes', 'Freeze vegetables'],
          confidence_score: 0.9,
        },
      ],
      predictions: [
        {
          item_id: 'item-1',
          predicted_expiration_date: '2024-12-31',
          confidence: 0.85,
          factors: ['vegetable type', 'storage conditions'],
        },
      ],
    });
  }),

  // Default handler for unmatched requests
  http.all('*', ({ request }) => {
    console.error(`Unhandled ${request.method} request to ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];

module.exports = { handlers };