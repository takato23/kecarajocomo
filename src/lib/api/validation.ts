import { z } from 'zod';
import { MealTypes, DietaryRestrictions, CuisineTypes } from '@/lib/types/mealPlanning';

// Common validation schemas
export const DateStringSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  { message: 'Invalid date format' }
);

export const UUIDSchema = z.string().uuid('Invalid ID format');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc')
});

// Meal Plan schemas
export const CreateMealPlanSchema = z.object({
  name: z.string().min(1).max(255),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  preferences: z.object({
    dietaryRestrictions: z.array(z.enum(DietaryRestrictions)).optional(),
    cuisinePreferences: z.array(z.enum(CuisineTypes)).optional(),
    avoidIngredients: z.array(z.string()).optional(),
    budgetPerWeek: z.number().positive().optional()
  }).optional(),
  nutritionalGoals: z.object({
    calories: z.number().min(1200).max(4000).optional(),
    protein: z.number().min(50).max(300).optional(),
    carbs: z.number().min(50).max(500).optional(),
    fat: z.number().min(20).max(200).optional(),
    fiber: z.number().min(20).max(100).optional()
  }).optional(),
  isActive: z.boolean().optional()
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date' }
);

export const UpdateMealPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  preferences: z.object({}).optional(),
  nutritionalGoals: z.object({}).optional(),
  isActive: z.boolean().optional()
});

// Meal Plan Item schemas
export const CreateMealPlanItemSchema = z.object({
  recipeId: UUIDSchema.optional(),
  date: DateStringSchema,
  mealType: z.enum(MealTypes),
  servings: z.number().int().positive().default(1),
  customRecipe: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
    prepTime: z.number().positive(),
    cookTime: z.number().positive(),
    nutrition: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number().optional()
    })
  }).optional(),
  notes: z.string().max(500).optional()
}).refine(
  (data) => data.recipeId || data.customRecipe,
  { message: 'Either recipeId or customRecipe must be provided' }
);

export const UpdateMealPlanItemSchema = z.object({
  servings: z.number().int().positive().optional(),
  isCompleted: z.boolean().optional(),
  notes: z.string().max(500).optional()
});

// Shopping List schemas
export const GenerateShoppingListSchema = z.object({
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
  mealTypes: z.array(z.enum(MealTypes)).optional(),
  excludePantryItems: z.boolean().default(false)
});

// Statistics schemas
export const StatisticsQuerySchema = z.object({
  mealPlanId: UUIDSchema.optional(),
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional()
}).refine(
  (data) => data.mealPlanId || (data.startDate && data.endDate),
  { message: 'Either mealPlanId or date range (startDate and endDate) is required' }
);

// Generate meal plan schemas
export const GenerateMealPlanRequestSchema = z.object({
  name: z.string().min(1).max(255),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  mealsPerDay: z.array(z.enum(MealTypes)).min(1),
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    cuisinePreferences: z.array(z.string()).optional(),
    avoidIngredients: z.array(z.string()).optional(),
    budgetPerWeek: z.number().positive().optional(),
    cookingTime: z.enum(['quick', 'moderate', 'elaborate']).optional(),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional()
  }).optional(),
  nutritionalGoals: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional()
  }).optional(),
  generateMode: z.enum(['full', 'daily']).default('full')
});

// Helper function to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return { success: false, errors: result.error };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          message: 'Invalid JSON in request body',
          path: []
        }
      ])
    };
  }
}

// Helper function to validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    // Handle array parameters (e.g., ?types=breakfast&types=lunch)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });
  
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return { success: false, errors: result.error };
  }
  
  return { success: true, data: result.data };
}