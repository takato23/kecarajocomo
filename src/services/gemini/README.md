# Gemini Meal Planner Service

A robust, production-ready service for generating AI-powered meal plans using Google's Gemini API (Flash 2.0, Pro, or Flash).

## Features

- 🤖 **Multiple Gemini Models**: Support for Flash 2.0 (recommended), Pro, and Flash
- 🔄 **Automatic Retry Logic**: Exponential backoff for transient failures
- 📊 **Token Management**: Automatic fallback strategies for token limits
- ✅ **JSON Validation**: Strict validation and automatic correction
- 📝 **Comprehensive Logging**: Debug-friendly logs without sensitive data
- 🌍 **Multilingual**: Spanish-first with English support
- 🥗 **Dietary Support**: Vegan, keto, gluten-free, and more
- 🔒 **Type-Safe**: Full TypeScript support with Zod validation

## Installation

```bash
npm install @google/generative-ai zod pino
```

## Quick Start

```typescript
import { GeminiMealPlannerService } from '@/services/gemini/GeminiMealPlannerService';

// Initialize the service
const mealPlanner = new GeminiMealPlannerService(
  process.env.GEMINI_API_KEY!,
  'flash2' // Recommended for best performance
);

// Generate a weekly meal plan
const plan = await mealPlanner.generateWeeklyPlan({
  userProfile: {
    id: 'user_123',
    dietaryPreferences: {
      type: 'omnivore',
      allergies: ['nuts', 'shellfish'],
      medicalRestrictions: [],
      culturalPreferences: []
    },
    nutritionalGoals: {
      objective: 'weight-loss',
      dailyCalories: 1800
    },
    cookingPreferences: {
      experienceLevel: 'intermediate',
      maxPrepTime: 45,
      preferredCuisines: ['italian', 'mexican'],
      kitchenEquipment: ['oven', 'stove', 'blender']
    }
  },
  dateRange: {
    start: new Date('2024-01-15'),
    end: new Date('2024-01-21')
  }
});
```

## Service Architecture

```
GeminiMealPlannerService
├── PromptTemplates       # Modular prompt generation
├── MealPlanValidator     # Zod-based validation
├── Error Handling        # Typed error classes
└── Logging              # Pino logger integration
```

## Key Methods

### `generateWeeklyPlan(params: GeneratePlanParams): Promise<MealPlan>`

Generates a complete weekly meal plan based on user preferences and constraints.

**Features:**
- Automatic strategy selection (single request, batched, or simplified)
- Pantry item prioritization
- Locked meal slot support
- Nutritional goal compliance

### `regenerateSlot(slot, userProfile, pantryItems, recentMeals): Promise<Recipe>`

Regenerates a single meal slot with variety consideration.

**Features:**
- Avoids recent ingredients
- Respects time constraints (weekday vs weekend)
- Pantry optimization

## Error Handling

The service includes specific error types for different scenarios:

```typescript
try {
  const plan = await mealPlanner.generateWeeklyPlan(params);
} catch (error) {
  if (error instanceof GeminiRateLimitError) {
    // Handle rate limiting
    console.log('Please try again later');
  } else if (error instanceof GeminiTokenLimitError) {
    // Automatically handled with fallback
  } else if (error instanceof GeminiValidationError) {
    // Handle validation errors
    console.log('Invalid response format');
  }
}
```

## Generation Strategies

The service automatically selects the best strategy based on context:

1. **Single Request**: For simple plans within token limits
2. **Batched**: Splits large plans into day batches
3. **Simplified**: Fallback for extreme token constraints

## Logging

The service uses Pino for structured logging:

```typescript
// Set log level via environment variable
process.env.LOG_LEVEL = 'debug'; // info, warn, error

// Logs include:
// - Request IDs for tracking
// - Performance metrics
// - Token usage
// - Error details (sanitized)
```

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional
LOG_LEVEL=info                    # Logging verbosity
GEMINI_MODEL=gemini-2.0-flash-exp # Model override
```

### Model Selection

- **Flash 2.0** (`flash2`): Best performance, 1M context window
- **Pro** (`pro`): Advanced reasoning, 2M context window  
- **Flash** (`flash`): Legacy option, 1M context window

## Testing

```typescript
// Mock the service for testing
jest.mock('@/services/gemini/GeminiMealPlannerService');

// Example test
test('should generate meal plan', async () => {
  const mockPlan = createMockMealPlan();
  mockMealPlanner.generateWeeklyPlan.mockResolvedValue(mockPlan);
  
  const result = await generatePlan(params);
  expect(result).toBeDefined();
  expect(result.slots).toHaveLength(28);
});
```

## Performance Considerations

- **Token Estimation**: ~4 characters per token
- **Response Time**: 2-8 seconds for full week
- **Retry Delays**: 1s, 2s, 4s... up to 32s
- **Cache Friendly**: Responses can be cached

## Best Practices

1. **Initialize Once**: Create service instance at app startup
2. **Handle Errors**: Always wrap calls in try-catch
3. **Rate Limiting**: Implement client-side rate limiting
4. **Caching**: Cache successful responses for similar requests
5. **Monitoring**: Track success rates and response times

## Troubleshooting

### Common Issues

1. **JSON Parse Errors**
   - Service automatically extracts and fixes JSON
   - Falls back to simplified format if needed

2. **Rate Limits**
   - Implement request queuing
   - Use exponential backoff (built-in)

3. **Token Limits**
   - Service auto-switches to batched mode
   - Consider using Flash 2.0 for larger contexts

4. **Timeout Errors**
   - Increase timeout in production
   - Consider async job processing

## Support

For issues or questions:
- Check logs for request IDs
- Review error messages for specific guidance
- Ensure API key has proper permissions

## License

This service is part of the KeCaraJoComer project.