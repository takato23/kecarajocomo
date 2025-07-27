import { http, HttpResponse } from 'msw';
import { 
  mockWeeklyPlan, 
  mockAlternativeRecipes, 
  mockRegeneratedMeal,
  mockMealPlanRecord 
} from './fixtures/argentineMealData';

export const handlers = [
  // Meal planning API routes
  http.post('/api/ai/meal-plan/generate', () => {
    return HttpResponse.json({
      success: true,
      data: mockWeeklyPlan,
      message: 'Plan semanal generado exitosamente'
    });
  }),

  http.post('/api/meal-planning/generate', () => {
    return HttpResponse.json({
      success: true,
      data: mockWeeklyPlan,
      message: 'Plan semanal generado exitosamente'
    });
  }),

  http.post('/api/meal-planning/regenerate', () => {
    return HttpResponse.json({
      success: true,
      data: mockRegeneratedMeal,
      message: 'Comida regenerada exitosamente'
    });
  }),

  http.get('/api/meal-planning/alternatives/:mealId', () => {
    return HttpResponse.json({
      success: true,
      data: mockAlternativeRecipes,
      message: 'Alternativas obtenidas exitosamente'
    });
  }),

  http.post('/api/meal-planning/suggest-from-pantry', () => {
    return HttpResponse.json({
      success: true,
      data: mockAlternativeRecipes.slice(0, 3),
      message: 'Sugerencias basadas en despensa obtenidas'
    });
  }),

  http.post('/api/meal-planning/optimize-daily', () => {
    return HttpResponse.json({
      success: true,
      data: mockWeeklyPlan.days[0],
      message: 'Día optimizado exitosamente'
    });
  }),

  http.post('/api/meal-planning/feedback', () => {
    return HttpResponse.json({
      success: true,
      message: 'Feedback registrado exitosamente'
    });
  }),

  // Supabase mock endpoints
  http.get('https://test.supabase.co/rest/v1/meal_plans', () => {
    return HttpResponse.json([mockMealPlanRecord]);
  }),

  http.post('https://test.supabase.co/rest/v1/meal_plans', () => {
    return HttpResponse.json([mockMealPlanRecord]);
  }),

  http.patch('https://test.supabase.co/rest/v1/meal_plans', () => {
    return HttpResponse.json([mockMealPlanRecord]);
  }),

  // AI Generation endpoints (Gemini)
  http.post('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', () => {
    return HttpResponse.json({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify(mockWeeklyPlan)
          }]
        }
      }]
    });
  }),

  // Error scenarios for testing
  http.post('/api/meal-planning/generate-error', () => {
    return HttpResponse.json(
      { 
        success: false, 
        error: 'Error generando plan de comidas',
        details: 'Servicio de IA temporalmente no disponible'
      },
      { status: 500 }
    );
  }),

  http.post('/api/meal-planning/timeout', () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({
          success: false,
          error: 'Timeout'
        }, { status: 408 }));
      }, 5000);
    });
  }),

  // Network error simulation
  http.post('/api/meal-planning/network-error', () => {
    return HttpResponse.error();
  }),

  // Rate limiting simulation
  http.post('/api/meal-planning/rate-limit', () => {
    return HttpResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded',
        retryAfter: 60
      },
      { status: 429 }
    );
  }),
];