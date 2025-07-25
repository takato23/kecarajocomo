# API Documentation - KeCarajoComer

**Version**: 1.0  
**Base URL**: `/api`  
**Authentication**: Supabase Auth with JWT tokens

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Recipes](#recipes)
4. [Meal Planning](#meal-planning)
5. [Pantry Management](#pantry-management)
6. [Shopping Lists](#shopping-lists)
7. [AI Services](#ai-services)
8. [Price Tracking](#price-tracking)
9. [Common Responses](#common-responses)

---

## Authentication

All API endpoints require authentication unless specified. Include the JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## User Profile

### Get User Profile
```http
GET /api/user/profile
```

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "bio": "Food enthusiast"
  },
  "preferences": {
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"],
    "cuisine_preferences": ["italian", "mexican"],
    "cooking_skill_level": "intermediate",
    "household_size": 4
  }
}
```

### Update User Profile
```http
PATCH /api/user/profile
Content-Type: application/json

{
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": "Updated bio"
}
```

### Update User Preferences
```http
PATCH /api/user/preferences
Content-Type: application/json

{
  "dietary_restrictions": ["vegetarian", "gluten-free"],
  "cooking_skill_level": "advanced"
}
```

### Upload Avatar
```http
POST /api/profile/avatar
Content-Type: multipart/form-data

file: <image file>
```

### Complete Profile Setup
```http
POST /api/profile/complete
Content-Type: application/json

{
  "preferences": {
    "dietary_restrictions": ["vegetarian"],
    "household_size": 2
  }
}
```

---

## Recipes

### List Recipes
```http
GET /api/recipes?page=1&limit=20&meal_type=dinner&cuisine=italian
```

**Query Parameters**
- `page` (number): Page number for pagination
- `limit` (number): Items per page (default: 20, max: 100)
- `meal_type` (string): Filter by meal type (breakfast, lunch, dinner, snack)
- `cuisine` (string): Filter by cuisine type
- `dietary` (string): Filter by dietary restriction
- `max_time` (number): Maximum cooking time in minutes
- `search` (string): Search query

**Response**
```json
{
  "recipes": [
    {
      "id": "uuid",
      "name": "Margherita Pizza",
      "slug": "margherita-pizza",
      "description": "Classic Italian pizza",
      "image_url": "https://...",
      "prep_time": 20,
      "cook_time": 15,
      "total_time": 35,
      "servings": 4,
      "difficulty": "easy",
      "meal_types": ["lunch", "dinner"],
      "cuisine_type": "italian",
      "tags": ["vegetarian", "quick"],
      "rating": 4.5,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Get Recipe Details
```http
GET /api/recipes/[id]
```

**Response**
```json
{
  "id": "uuid",
  "name": "Margherita Pizza",
  "slug": "margherita-pizza",
  "description": "Classic Italian pizza with fresh mozzarella and basil",
  "instructions": [
    {
      "step": 1,
      "text": "Prepare the pizza dough",
      "time": 10
    }
  ],
  "ingredients": [
    {
      "id": "uuid",
      "name": "Pizza dough",
      "amount": 1,
      "unit": "lb",
      "notes": "store-bought or homemade"
    }
  ],
  "nutrition": {
    "calories": 250,
    "protein": 12,
    "carbs": 35,
    "fat": 8,
    "fiber": 2
  },
  "prep_time": 20,
  "cook_time": 15,
  "servings": 4,
  "difficulty": "easy",
  "video_url": "https://...",
  "source_url": "https://...",
  "ai_generated": false,
  "created_by": "user_id",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Get All Recipes (Full)
```http
GET /api/recipes/full
```

Returns all recipes with complete details. Use with caution due to large response size.

### Create Recipe
```http
POST /api/recipes
Content-Type: application/json

{
  "name": "My Special Recipe",
  "description": "A family favorite",
  "instructions": [
    {
      "step": 1,
      "text": "First step"
    }
  ],
  "ingredients": [
    {
      "ingredient_id": "uuid",
      "amount": 2,
      "unit": "cups"
    }
  ],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "medium",
  "meal_types": ["dinner"],
  "tags": ["healthy", "quick"]
}
```

### Update Recipe
```http
PATCH /api/recipes/[id]
Content-Type: application/json

{
  "name": "Updated Recipe Name",
  "servings": 6
}
```

### Delete Recipe
```http
DELETE /api/recipes/[id]
```

### Import Recipe
```http
POST /api/recipes/import
Content-Type: application/json

{
  "url": "https://example.com/recipe",
  "parse_method": "auto"
}
```

---

## AI Services

### Generate Recipe with AI
```http
POST /api/ai/generate-recipe
Content-Type: application/json

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
  "ai_provider": "claude"
}
```

**Response**
```json
{
  "recipe": {
    "name": "Quick Tomato Basil Pasta",
    "description": "AI-generated vegetarian pasta dish",
    "instructions": [...],
    "ingredients": [...],
    "nutrition": {...},
    "ai_generated": true
  },
  "ai_metadata": {
    "provider": "claude",
    "model": "claude-3-sonnet",
    "tokens_used": 1234,
    "generation_time_ms": 2500
  }
}
```

### Get Recipe Suggestions from Pantry
```http
POST /api/ai/suggest-from-pantry
Content-Type: application/json

{
  "max_suggestions": 5,
  "meal_type": "dinner",
  "max_cooking_time": 45
}
```

---

## Pantry Management

### Get Pantry Items
```http
GET /api/pantry/items?location=fridge&expiring_soon=true
```

**Query Parameters**
- `location` (string): Filter by location (fridge, freezer, pantry)
- `expiring_soon` (boolean): Show items expiring in next 3 days
- `category` (string): Filter by category
- `search` (string): Search query

### Add Pantry Item
```http
POST /api/pantry/items
Content-Type: application/json

{
  "ingredient_id": "uuid",
  "quantity": 500,
  "unit": "grams",
  "expiration_date": "2024-02-01",
  "location_id": "uuid",
  "notes": "Opened on Jan 15"
}
```

### Batch Add Items
```http
POST /api/pantry/items/batch
Content-Type: application/json

{
  "items": [
    {
      "ingredient_id": "uuid",
      "quantity": 500,
      "unit": "grams"
    }
  ]
}
```

### Update Pantry Item
```http
PATCH /api/pantry/items/[id]
Content-Type: application/json

{
  "quantity": 250,
  "is_running_low": true
}
```

### Delete Pantry Item
```http
DELETE /api/pantry/items/[id]
```

### Consume Pantry Items
```http
POST /api/pantry/consume
Content-Type: application/json

{
  "consumptions": [
    {
      "item_id": "uuid",
      "quantity": 100,
      "unit": "grams"
    }
  ]
}
```

### Get Pantry Stats
```http
GET /api/pantry/stats
```

**Response**
```json
{
  "total_items": 45,
  "expiring_soon": 3,
  "expired": 1,
  "low_stock": 5,
  "categories": {
    "produce": 12,
    "dairy": 8,
    "pantry": 15,
    "proteins": 10
  },
  "estimated_value": 125.50
}
```

### Get Pantry Analysis
```http
GET /api/pantry/analysis
```

Returns AI-powered insights about pantry usage, waste patterns, and optimization suggestions.

### Check Ingredient Availability
```http
POST /api/pantry/availability
Content-Type: application/json

{
  "ingredients": [
    {
      "ingredient_id": "uuid",
      "required_amount": 200,
      "unit": "grams"
    }
  ]
}
```

### Pantry Locations

#### Get Locations
```http
GET /api/pantry/locations
```

#### Create Location
```http
POST /api/pantry/locations
Content-Type: application/json

{
  "name": "Main Fridge",
  "type": "fridge",
  "temperature": "cold"
}
```

#### Update Location
```http
PATCH /api/pantry/locations/[id]
```

#### Delete Location
```http
DELETE /api/pantry/locations/[id]
```

### Expiration Alerts

#### Get Alerts
```http
GET /api/pantry/expiration-alerts
```

#### Dismiss Alert
```http
DELETE /api/pantry/expiration-alerts/[id]
```

---

## Shopping Lists

(To be implemented - placeholder for shopping list endpoints)

---

## Common Responses

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Recipe not found",
    "details": { ... }
  }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "fields": {
      "email": "Invalid email format",
      "password": "Password too short"
    }
  }
}
```

### Pagination Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `CONFLICT` | Resource conflict (e.g., duplicate) | 409 |
| `INTERNAL_ERROR` | Server error | 500 |
| `AI_SERVICE_ERROR` | AI service unavailable | 503 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |

---

## Rate Limiting

- **Standard endpoints**: 1000 requests/hour
- **AI endpoints**: 100 requests/hour
- **File uploads**: 50 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642360800
```

---

## Webhooks

(To be implemented - placeholder for webhook documentation)

---

## API Versioning

The API uses URL versioning. Current version is v1, accessed via `/api/v1/...` endpoints.

Future versions will be available at `/api/v2/...` etc.

---

## Testing

### Test Endpoints

#### Check Schema
```http
GET /api/test-schema
```

Validates database schema integrity.

#### Check Recipes
```http
GET /api/check-recipes
```

Returns recipe data validation status.

---

## SDK Examples

### JavaScript/TypeScript
```typescript
// Using fetch
const response = await fetch('/api/recipes', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Using Axios
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const recipes = await api.get('/recipes');
```

### React Query Example
```typescript
import { useQuery } from '@tanstack/react-query';

function useRecipes(filters) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      const response = await fetch(`/api/recipes?${new URLSearchParams(filters)}`);
      return response.json();
    }
  });
}
```