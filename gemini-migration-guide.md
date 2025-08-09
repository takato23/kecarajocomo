# Gemini Configuration Migration Guide


// Add this import to files using Gemini:
import geminiConfig from '@/lib/config/gemini.config';

// Replace direct env var access:
// OLD: process.env.GOOGLE_GEMINI_API_KEY
// NEW: geminiConfig.getApiKey()

// Use feature-specific configs:
const config = geminiConfig.getFeatureConfig('mealPlanning');


## Files to update:
- src/services/ai/GeminiService.ts
- src/services/ai/providers/GeminiProvider.ts
- src/lib/services/receiptOCR.ts
- src/lib/services/mealPlanningAI.ts
- src/lib/services/geminiService.ts
- src/lib/services/geminiServer.ts
- src/lib/services/geminiMealService.ts
- src/lib/services/geminiMealPlannerClient.ts
- src/lib/services/geminiMealPlannerAPI.ts
- src/features/recipes/api/generate/gemini/route.ts
- src/features/pantry/services/geminiPantryService.ts
- src/app/api/test-gemini/route.ts
- src/app/api/parse-voice-command/route.ts
- src/app/api/gemini/weekly/route.ts
- src/app/api/ai/recipes/suggest-pantry/route.ts
- src/app/api/ai/recipes/personalized/route.ts
- src/app/api/ai/recipes/generate/route.ts
- src/features/auth/components/onboarding/ProfileSetupStep.tsx
- src/features/auth/components/onboarding/PantrySetupStep.tsx
- src/features/auth/components/onboarding/MealPlanPreviewStep.tsx
