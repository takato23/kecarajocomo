# Gemini AI Integration for Meal Planning

This document describes the enhanced Gemini AI integration for the meal planning system.

## Overview

The meal planning system now uses Google's Gemini 1.5 Pro model with robust JSON responses, error handling, and intelligent meal planning capabilities.

## Key Features

### 1. Structured JSON Responses
- Uses Gemini's JSON mode for consistent, parseable responses
- Validates all responses with Zod schemas
- Handles markdown cleanup automatically

### 2. Robust Error Handling
- Automatic retry with exponential backoff
- Rate limiting (10 requests per minute)
- User-friendly error messages
- Detailed error logging and tracking

### 3. Reusable Prompt Templates
- Consistent prompt structure across all operations
- Easy to maintain and update
- Supports localization and customization

### 4. Service Operations

#### Generate Weekly Meal Plan
```typescript
const result = await geminiPlannerService.generateHolisticPlan(
  preferences,
  constraints,
  options
);
```

#### Regenerate Specific Meal
```typescript
const meal = await geminiPlannerService.regenerateMeal(
  'dinner',
  preferences,
  constraints,
  avoidRecipes
);
```

#### Suggest Recipes from Pantry
```typescript
const suggestions = await geminiPlannerService.suggestFromPantry(
  userId,
  preferences
);
```

#### Optimize Daily Meals
```typescript
const result = await geminiPlannerService.generateDailyOptimization(
  preferences,
  currentPlan,
  focusDay
);
```

## API Endpoints

### POST /api/meal-planning/generate
Generate a complete weekly meal plan.

**Request Body:**
```json
{
  "preferences": {
    "dietaryRestrictions": ["vegetarian"],
    "allergies": ["nuts"],
    "cuisinePreferences": ["italian", "mexican"],
    "cookingSkillLevel": "intermediate",
    "householdSize": 2,
    "budgetRange": "medium"
  },
  "constraints": {
    "startDate": "2024-01-20",
    "endDate": "2024-01-26",
    "mealTypes": ["breakfast", "lunch", "dinner"],
    "servings": 2,
    "maxPrepTime": 60
  }
}
```

### POST /api/meal-planning/regenerate
Regenerate a specific meal.

**Request Body:**
```json
{
  "mealType": "dinner",
  "preferences": { /* user preferences */ },
  "constraints": { /* planning constraints */ },
  "avoidRecipes": ["Recipe to avoid 1", "Recipe to avoid 2"]
}
```

### POST /api/meal-planning/suggest-from-pantry
Get recipe suggestions based on pantry items.

**Request Body:**
```json
{
  "preferences": { /* user preferences */ }
}
```

### POST /api/meal-planning/optimize-daily
Optimize meals for a specific day.

**Request Body:**
```json
{
  "preferences": { /* user preferences */ },
  "currentPlan": { /* partial weekly plan */ },
  "focusDay": "2024-01-22"
}
```

### POST /api/meal-planning/feedback
Submit feedback to improve future meal plans.

**Request Body:**
```json
{
  "planId": "plan-123",
  "feedback": {
    "mealRatings": { "meal1": 5, "meal2": 3 },
    "timeAccuracy": { "meal1": 90, "meal2": 110 },
    "difficultyActual": { "meal1": 2, "meal2": 4 },
    "innovations": ["Great flavor combination"],
    "challenges": ["Too many ingredients"]
  }
}
```

## Configuration

### Environment Variables
```env
# Required - Gemini API Key
GOOGLE_AI_API_KEY=your_api_key_here
# or
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Service Configuration
```typescript
const geminiService = getGeminiService({
  model: 'gemini-1.5-pro',     // or 'gemini-1.5-flash'
  temperature: 0.7,             // 0.0 - 1.0
  maxOutputTokens: 8192,        // Max response length
  topP: 0.95,                   // Nucleus sampling
  topK: 40                      // Top-k sampling
});
```

## Error Handling

The service provides detailed error information with retry capabilities:

```typescript
{
  success: false,
  error: "User-friendly error message",
  code: "RATE_LIMIT_EXCEEDED",
  retryable: true,
  retryDelay: 5000  // milliseconds
}
```

### Error Codes
- `INVALID_API_KEY`: API key configuration error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `TIMEOUT`: Request took too long
- `INVALID_REQUEST`: Invalid input data
- `SERVER_ERROR`: Gemini service error
- `NETWORK_ERROR`: Connection issues
- `PARSE_ERROR`: Invalid response format
- `VALIDATION_ERROR`: Response validation failed

## Testing

Run the test suite to verify the integration:

```bash
# Run all tests
npm run test:gemini

# Or run specific test
node src/lib/services/__tests__/geminiService.test.js
```

## Performance Considerations

1. **Caching**: Results are cached for 4 hours to reduce API calls
2. **Rate Limiting**: Maximum 10 requests per minute
3. **Timeouts**: 
   - Weekly plan: 45 seconds
   - Daily optimization: 30 seconds
   - Meal regeneration: 20 seconds
   - Pantry suggestions: 25 seconds

## Best Practices

1. **Always provide complete user preferences** for better personalization
2. **Include pantry items** when generating meal plans to maximize ingredient usage
3. **Use feedback API** to improve future suggestions
4. **Handle errors gracefully** with retry logic for retryable errors
5. **Monitor rate limits** and implement queuing for high-traffic scenarios

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Verify GOOGLE_AI_API_KEY is set correctly
   - Check API key has Gemini API access enabled

2. **"Rate Limit Exceeded" Error**
   - Implement request queuing
   - Add delays between requests
   - Consider upgrading API quota

3. **"Timeout" Errors**
   - Reduce complexity of request
   - Increase timeout values
   - Check network connectivity

4. **"Parse Error" Responses**
   - Check Gemini API status
   - Verify prompt templates
   - Review response logs

## Future Enhancements

1. **Multi-language Support**: Expand prompt templates for internationalization
2. **Image Generation**: Add meal photos using Gemini's multimodal capabilities
3. **Voice Input**: Support voice-based meal preferences
4. **Collaborative Planning**: Multi-user meal planning support
5. **Advanced Analytics**: Deeper nutritional and cost analysis