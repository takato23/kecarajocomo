# API Design - kecarajocomer

## Overview

RESTful API design combining Supabase's auto-generated endpoints with custom Edge Functions for AI integration and complex business logic. The API supports both Claude AI and Gemini for enhanced flexibility.

## API Architecture

### Base URLs

```
# Supabase REST API
https://{project-id}.supabase.co/rest/v1/

# Supabase Edge Functions
https://{project-id}.supabase.co/functions/v1/

# Local Development
http://localhost:54321/rest/v1/
http://localhost:54321/functions/v1/
```

### Authentication

```typescript
// Headers for all requests
{
  "apikey": "{SUPABASE_ANON_KEY}",
  "Authorization": "Bearer {USER_JWT_TOKEN}",
  "Content-Type": "application/json"
}
```

## Supabase REST API Endpoints

### User Management

```typescript
// Get user profile
GET /user_profiles?id=eq.{user_id}

// Update user profile
PATCH /user_profiles?id=eq.{user_id}
{
  "username": "string",
  "full_name": "string",
  "avatar_url": "string"
}

// Get user preferences
GET /user_preferences?user_id=eq.{user_id}

// Update user preferences
PATCH /user_preferences?user_id=eq.{user_id}
{
  "dietary_restrictions": ["vegetarian", "gluten-free"],
  "allergies": ["peanuts"],
  "cuisine_preferences": ["italian", "mexican"],
  "cooking_skill_level": "intermediate"
}
```

### Recipe Management

```typescript
// Search recipes with filters
GET /recipes?is_public=eq.true&meal_types=cs.{breakfast}&order=created_at.desc&limit=20

// Get recipe details with ingredients
GET /recipes?id=eq.{recipe_id}&select=*,recipe_ingredients(*,ingredients(*))

// Create new recipe
POST /recipes
{
  "name": "string",
  "description": "string",
  "instructions": [
    {
      "step": 1,
      "text": "Preheat oven to 180°C",
      "time": 5
    }
  ],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "easy",
  "meal_types": ["dinner"],
  "tags": ["healthy", "quick"]
}

// Save recipe to favorites
POST /saved_recipes
{
  "user_id": "{user_id}",
  "recipe_id": "{recipe_id}"
}

// Rate recipe
POST /recipe_ratings
{
  "recipe_id": "{recipe_id}",
  "rating": 5,
  "comment": "Delicious and easy to make!"
}
```

### Meal Planning

```typescript
// Get active meal plan
GET /meal_plans?user_id=eq.{user_id}&is_active=eq.true&select=*,planned_meals(*,recipes(*))

// Create meal plan
POST /meal_plans
{
  "user_id": "{user_id}",
  "name": "Week of Jan 15",
  "week_start": "2024-01-15"
}

// Add meal to plan
POST /planned_meals
{
  "meal_plan_id": "{meal_plan_id}",
  "recipe_id": "{recipe_id}",
  "date": "2024-01-15",
  "meal_type": "dinner",
  "servings": 2
}

// Mark meal as prepared
PATCH /planned_meals?id=eq.{meal_id}
{
  "is_prepared": true,
  "prepared_at": "2024-01-15T19:30:00Z"
}
```

### Pantry Management

```typescript
// Get pantry items
GET /pantry_items?user_id=eq.{user_id}&select=*,ingredients(*),pantry_locations(*)

// Add pantry item
POST /pantry_items
{
  "user_id": "{user_id}",
  "ingredient_id": "{ingredient_id}",
  "quantity": 500,
  "unit": "grams",
  "expiration_date": "2024-02-01",
  "location_id": "{location_id}"
}

// Update pantry quantity
PATCH /pantry_items?id=eq.{item_id}
{
  "quantity": 250,
  "is_running_low": true
}

// Get expiring items
GET /pantry_items?user_id=eq.{user_id}&expiration_date=lte.{date}&order=expiration_date.asc
```

### Shopping Lists

```typescript
// Get active shopping lists
GET /shopping_lists?user_id=eq.{user_id}&is_active=eq.true&select=*,shopping_items(*,ingredients(*))

// Mark item as purchased
PATCH /shopping_items?id=eq.{item_id}
{
  "is_purchased": true,
  "price": 4.99,
  "purchased_at": "2024-01-15T10:30:00Z"
}
```

## Custom Edge Functions

### AI Recipe Generation

```typescript
// Generate recipe with AI (Claude or Gemini)
POST /functions/v1/ai-generate-recipe
{
  "preferences": {
    "dietary_restrictions": ["vegetarian"],
    "cuisine_type": "italian",
    "cooking_time_max": 30,
    "skill_level": "beginner"
  },
  "constraints": {
    "available_ingredients": ["pasta", "tomatoes", "basil"],
    "avoid_ingredients": ["mushrooms"],
    "servings": 4
  },
  "ai_provider": "claude" // or "gemini"
}

// Response
{
  "recipe": {
    "name": "Quick Tomato Basil Pasta",
    "description": "A simple and delicious vegetarian pasta dish",
    "prep_time": 10,
    "cook_time": 20,
    "ingredients": [
      {
        "ingredient": "pasta",
        "amount": 400,
        "unit": "grams"
      }
    ],
    "instructions": [...],
    "nutrition": {
      "calories": 380,
      "protein": 12,
      "carbs": 65,
      "fat": 8
    }
  },
  "ai_metadata": {
    "provider": "claude",
    "model": "claude-3-sonnet",
    "tokens_used": 1234,
    "generation_time_ms": 2500
  }
}
```

### AI Meal Planning

```typescript
// Generate weekly meal plan with AI
POST /functions/v1/ai-plan-meals
{
  "user_preferences": {
    "dietary_restrictions": ["gluten-free"],
    "household_size": 4,
    "budget": "moderate",
    "cooking_time_preference": "quick"
  },
  "nutrition_goals": {
    "daily_calories": 2000,
    "daily_protein": 60,
    "balanced_macros": true
  },
  "pantry_items": [
    {
      "ingredient": "chicken breast",
      "quantity": 1000,
      "unit": "grams"
    }
  ],
  "preferences": {
    "variety": "high",
    "repeat_meals": false,
    "batch_cooking": true
  },
  "ai_provider": "gemini" // or "claude"
}

// Response
{
  "meal_plan": {
    "week_start": "2024-01-15",
    "total_cost_estimate": 120.50,
    "meals": [
      {
        "day": 0,
        "meal_type": "breakfast",
        "recipe_id": "uuid",
        "recipe_name": "Gluten-Free Pancakes",
        "servings": 4,
        "nutrition": {...}
      }
    ],
    "shopping_list_preview": [
      {
        "ingredient": "gluten-free flour",
        "quantity": 500,
        "unit": "grams",
        "estimated_cost": 4.99
      }
    ]
  },
  "ai_metadata": {
    "provider": "gemini",
    "reasoning": "Focused on batch cooking opportunities and pantry utilization"
  }
}
```

### Smart Shopping List

```typescript
// Generate optimized shopping list
POST /functions/v1/shopping-optimize
{
  "meal_plan_id": "{meal_plan_id}",
  "optimization_preferences": {
    "group_by_store_section": true,
    "combine_similar_items": true,
    "suggest_bulk_buying": true,
    "budget_limit": 150
  },
  "store_preference": "whole_foods",
  "include_pantry_check": true
}

// Response
{
  "shopping_list": {
    "id": "uuid",
    "total_items": 25,
    "estimated_cost": 132.45,
    "sections": [
      {
        "name": "Produce",
        "items": [
          {
            "ingredient": "tomatoes",
            "quantity": 2,
            "unit": "kg",
            "notes": "For 3 recipes this week",
            "estimated_price": 5.99
          }
        ]
      }
    ],
    "savings_suggestions": [
      {
        "suggestion": "Buy rice in bulk",
        "potential_savings": 3.50
      }
    ],
    "alternative_suggestions": [
      {
        "original": "pine nuts",
        "alternative": "sunflower seeds",
        "reason": "Similar taste, 70% cheaper"
      }
    ]
  }
}
```

### Nutrition Analysis

```typescript
// Analyze nutrition for date range
POST /functions/v1/nutrition-analyze
{
  "user_id": "{user_id}",
  "date_range": {
    "start": "2024-01-15",
    "end": "2024-01-21"
  },
  "include_recommendations": true
}

// Response
{
  "analysis": {
    "daily_averages": {
      "calories": 1950,
      "protein": 75,
      "carbs": 250,
      "fat": 65,
      "fiber": 28
    },
    "goal_comparison": {
      "calories": {
        "goal": 2000,
        "actual": 1950,
        "percentage": 97.5,
        "status": "on_track"
      }
    },
    "nutrient_breakdown": {
      "vitamins": {...},
      "minerals": {...}
    },
    "recommendations": [
      {
        "type": "increase",
        "nutrient": "iron",
        "suggestion": "Add more leafy greens or fortified cereals",
        "recipe_suggestions": ["uuid1", "uuid2"]
      }
    ]
  }
}
```

### Pantry Intelligence

```typescript
// Get pantry insights and suggestions
POST /functions/v1/pantry-insights
{
  "user_id": "{user_id}",
  "analysis_type": "full"
}

// Response
{
  "insights": {
    "expiring_soon": [
      {
        "ingredient": "yogurt",
        "expires_in_days": 3,
        "quantity": "500g",
        "recipe_suggestions": ["uuid1", "uuid2"]
      }
    ],
    "running_low": [
      {
        "ingredient": "olive oil",
        "current_quantity": "100ml",
        "usage_rate": "200ml/week",
        "days_remaining": 3
      }
    ],
    "usage_patterns": {
      "most_used": ["olive oil", "garlic", "onions"],
      "rarely_used": ["saffron", "truffle oil"],
      "seasonal_trends": {...}
    },
    "optimization_suggestions": [
      {
        "suggestion": "You often buy spinach but it expires. Try frozen spinach instead.",
        "potential_savings": 15.00
      }
    ]
  }
}
```

### Recipe Suggestions

```typescript
// Get personalized recipe suggestions
POST /functions/v1/recipe-suggestions
{
  "user_id": "{user_id}",
  "context": {
    "meal_type": "dinner",
    "available_time": 30,
    "use_pantry_items": true,
    "mood": "comfort_food"
  },
  "count": 5
}

// Response
{
  "suggestions": [
    {
      "recipe_id": "uuid",
      "name": "Creamy Mushroom Risotto",
      "match_score": 0.95,
      "reasons": [
        "Uses 5 items from your pantry",
        "Matches comfort food preference",
        "Can be made in 30 minutes"
      ],
      "pantry_items_used": ["arborio rice", "mushrooms", "parmesan"],
      "missing_ingredients": ["white wine"],
      "estimated_cost": 8.50
    }
  ]
}
```

## Real-time Subscriptions

```typescript
// Subscribe to meal plan updates
const subscription = supabase
  .channel('meal-plan-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'planned_meals',
      filter: `meal_plan_id=eq.${mealPlanId}`
    },
    (payload) => {
      console.log('Meal plan updated:', payload);
    }
  )
  .subscribe();

// Subscribe to pantry updates
const pantrySubscription = supabase
  .channel('pantry-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'pantry_items',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Pantry updated:', payload);
    }
  )
  .subscribe();
```

## Error Handling

```typescript
// Standard error response format
{
  "error": {
    "code": "RECIPE_NOT_FOUND",
    "message": "Recipe with ID {id} not found",
    "details": {
      "recipe_id": "uuid",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}

// Error codes
enum ErrorCodes {
  // Client errors (4xx)
  INVALID_REQUEST = "INVALID_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
}
```

## Rate Limiting

```typescript
// Rate limits per endpoint category
const rateLimits = {
  // Standard CRUD operations
  standard: {
    requests: 1000,
    window: "1h",
    burst: 50
  },
  
  // AI operations
  ai: {
    requests: 100,
    window: "1h",
    burst: 10,
    cost_based: true // Also limited by token usage
  },
  
  // Real-time subscriptions
  realtime: {
    connections: 10,
    channels: 50
  }
};

// Rate limit headers
{
  "X-RateLimit-Limit": "100",
  "X-RateLimit-Remaining": "95",
  "X-RateLimit-Reset": "1705318800"
}
```

## API Versioning

```typescript
// Version in URL
/rest/v1/recipes
/functions/v1/ai-generate-recipe

// Version in header (alternative)
{
  "API-Version": "2024-01-15"
}

// Deprecation notice
{
  "Deprecation": "true",
  "Sunset": "2024-06-30",
  "Link": "<https://docs.kecarajocomer.com/migrations/v2>; rel=\"successor-version\""
}
```

## Security

### API Key Management

```typescript
// Environment variables
SUPABASE_URL=https://{project-id}.supabase.co
SUPABASE_ANON_KEY={anon-key}
SUPABASE_SERVICE_KEY={service-key} // Server-side only
CLAUDE_API_KEY={claude-key}
GEMINI_API_KEY={gemini-key}

// Client-side initialization
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### Request Validation

```typescript
// Edge function request validation
export async function validateRequest(req: Request) {
  // Check authentication
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  // Verify JWT
  const { data: user, error } = await supabase.auth.getUser(token);
  if (error) {
    throw new Error('Invalid token');
  }
  
  // Validate request body
  const body = await req.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    throw new Error('Invalid request body');
  }
  
  return { user, body: validation.data };
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Edge function caching
export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

// Cache AI responses
const cacheKey = `recipe:${JSON.stringify(constraints)}`;
const cached = await cache.get(cacheKey);
if (cached) {
  return new Response(cached, {
    headers: {
      'X-Cache': 'HIT',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

// Query optimization
// Use select to limit fields
GET /recipes?select=id,name,cook_time,image_url

// Use computed fields
GET /meal_plans?select=*,total_meals:planned_meals(count)

// Pagination
GET /recipes?limit=20&offset=40&order=created_at.desc
```

## Testing

### API Testing Examples

```typescript
// Integration test example
describe('Recipe API', () => {
  it('should create a new recipe', async () => {
    const recipe = {
      name: 'Test Recipe',
      servings: 4,
      instructions: [{ step: 1, text: 'Test' }]
    };
    
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data.name).toBe('Test Recipe');
  });
  
  it('should generate recipe with AI', async () => {
    const response = await fetch('/functions/v1/ai-generate-recipe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        preferences: { dietary_restrictions: ['vegan'] },
        ai_provider: 'claude'
      })
    });
    
    const data = await response.json();
    expect(data.recipe).toBeDefined();
    expect(data.ai_metadata.provider).toBe('claude');
  });
});
```