/**
 * Comprehensive Validation Schemas
 * Zod schemas for all API endpoints and form validation
 */

import { z } from 'zod';

// =============================================================================
// COMMON VALIDATION SCHEMAS
// =============================================================================

export const IdSchema = z.string().uuid('Invalid ID format');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'title', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const TimestampSchema = z.object({
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// =============================================================================
// USER VALIDATION SCHEMAS
// =============================================================================

export const UserProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  image: z.string().url('Invalid image URL').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  website: z.string().url('Invalid website URL').optional(),
});

export const UserPreferencesSchema = z.object({
  // Dietary restrictions
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isDairyFree: z.boolean().default(false),
  isNutFree: z.boolean().default(false),
  isKeto: z.boolean().default(false),
  isPaleo: z.boolean().default(false),
  isLowCarb: z.boolean().default(false),
  
  // Cooking preferences
  cookingSkillLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  maxPrepTime: z.number().min(5).max(480).default(60),
  maxCookTime: z.number().min(5).max(480).default(60),
  
  // Favorite cuisines
  favoriteCuisines: z.array(z.string()).default([]),
  
  // Allergies
  allergies: z.array(z.string()).default([]),
  
  // Household info
  householdSize: z.number().int().min(1).max(20).default(2),
  
  // Notification preferences
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  
  // Privacy settings
  profilePublic: z.boolean().default(false),
  showInLeaderboard: z.boolean().default(true),
  
  // Meal planning preferences
  weeklyBudget: z.number().min(0).max(1000).optional(),
  mealPlanningStrategy: z.enum(['budget', 'nutrition', 'time', 'variety']).default('nutrition'),
});

// =============================================================================
// RECIPE VALIDATION SCHEMAS
// =============================================================================

export const RecipeIngredientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Ingredient name is required').max(100, 'Ingredient name too long'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  preparation: z.string().max(100, 'Preparation description too long').optional(),
  notes: z.string().max(200, 'Notes too long').optional(),
  optional: z.boolean().default(false),
});

export const RecipeInstructionSchema = z.object({
  id: z.string().uuid().optional(),
  stepNumber: z.number().int().min(1, 'Step number must be positive'),
  instruction: z.string().min(1, 'Instruction is required').max(1000, 'Instruction too long'),
  duration: z.number().int().min(0).max(480).optional(),
  temperature: z.number().int().min(0).max(300).optional(),
  notes: z.string().max(200, 'Notes too long').optional(),
});

export const RecipeNutritionSchema = z.object({
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(200),
  fiber: z.number().min(0).max(100).optional(),
  sugar: z.number().min(0).max(200).optional(),
  sodium: z.number().min(0).max(5000).optional(),
  cholesterol: z.number().min(0).max(1000).optional(),
});

export const RecipeCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  prepTimeMinutes: z.number().int().min(0, 'Prep time must be positive').max(480, 'Prep time too long'),
  cookTimeMinutes: z.number().int().min(0, 'Cook time must be positive').max(480, 'Cook time too long'),
  servings: z.number().int().min(1, 'Servings must be at least 1').max(50, 'Too many servings'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  cuisine: z.string().max(50, 'Cuisine too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  isPublic: z.boolean().default(true),
  ingredients: z.array(RecipeIngredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(RecipeInstructionSchema).min(1, 'At least one instruction is required'),
  nutrition: RecipeNutritionSchema.optional(),
});

export const RecipeUpdateSchema = RecipeCreateSchema.partial();

export const RecipeQuerySchema = z.object({
  ...PaginationSchema.shape,
  cuisine: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.string().optional(), // comma-separated
  authorId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxPrepTime: z.number().min(0).max(480).optional(),
  maxCookTime: z.number().min(0).max(480).optional(),
  hasNutrition: z.boolean().optional(),
});

export const RecipeRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500, 'Comment too long').optional(),
});

// =============================================================================
// PANTRY VALIDATION SCHEMAS
// =============================================================================

export const PantryItemSchema = z.object({
  id: z.string().uuid().optional(),
  ingredientId: z.string().uuid('Invalid ingredient ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  location: z.string().max(50, 'Location too long').optional(),
  purchaseDate: z.date().optional(),
  expirationDate: z.date().optional(),
  notes: z.string().max(200, 'Notes too long').optional(),
  cost: z.number().min(0).optional(),
  brand: z.string().max(50, 'Brand too long').optional(),
});

export const PantryItemUpdateSchema = PantryItemSchema.partial();

export const PantryQuerySchema = z.object({
  ...PaginationSchema.shape,
  location: z.string().optional(),
  category: z.string().optional(),
  expiringIn: z.number().int().min(0).max(365).optional(), // days
  lowStock: z.boolean().optional(),
});

export const PantryConsumptionSchema = z.object({
  pantryItemId: z.string().uuid('Invalid pantry item ID'),
  quantityUsed: z.number().positive('Quantity used must be positive'),
  usedFor: z.string().max(100, 'Usage description too long').optional(),
  notes: z.string().max(200, 'Notes too long').optional(),
});

export const PantryBatchUpdateSchema = z.object({
  items: z.array(PantryItemSchema).min(1, 'At least one item is required'),
  operation: z.enum(['add', 'update', 'consume']),
});

// =============================================================================
// MEAL PLANNING VALIDATION SCHEMAS
// =============================================================================

export const MealPlanItemSchema = z.object({
  id: z.string().uuid().optional(),
  recipeId: z.string().uuid('Invalid recipe ID'),
  date: z.date(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number().int().min(1).max(20),
  notes: z.string().max(200, 'Notes too long').optional(),
  completed: z.boolean().default(false),
});

export const MealPlanCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  startDate: z.date(),
  endDate: z.date(),
  items: z.array(MealPlanItemSchema).min(1, 'At least one meal is required'),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const MealPlanUpdateSchema = MealPlanCreateSchema.partial();

export const MealPlanQuerySchema = z.object({
  ...PaginationSchema.shape,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  recipeId: z.string().uuid().optional(),
});

export const AIGenerationSchema = z.object({
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    cuisinePreferences: z.array(z.string()).default([]),
    cookingSkillLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    maxPrepTime: z.number().min(5).max(480).default(60),
    maxCookTime: z.number().min(5).max(480).default(60),
    servings: z.number().int().min(1).max(20).default(4),
    budget: z.number().min(0).max(1000).optional(),
  }),
  constraints: z.object({
    startDate: z.date(),
    endDate: z.date(),
    mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])).min(1),
    excludeIngredients: z.array(z.string()).default([]),
    pantryItems: z.array(z.string()).default([]),
    favoriteRecipes: z.array(z.string()).default([]),
  }),
  options: z.object({
    generateShoppingList: z.boolean().default(true),
    optimizeForPantry: z.boolean().default(true),
    includeBatchCooking: z.boolean().default(false),
    prioritizeNutrition: z.boolean().default(true),
  }),
}).refine((data) => data.constraints.endDate >= data.constraints.startDate, {
  message: 'End date must be after start date',
  path: ['constraints', 'endDate'],
});

// =============================================================================
// SHOPPING LIST VALIDATION SCHEMAS
// =============================================================================

export const ShoppingItemSchema = z.object({
  id: z.string().uuid().optional(),
  ingredientId: z.string().uuid('Invalid ingredient ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  estimatedCost: z.number().min(0).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  purchased: z.boolean().default(false),
  notes: z.string().max(200, 'Notes too long').optional(),
  recipes: z.array(z.string().uuid()).default([]),
});

export const ShoppingListSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  items: z.array(ShoppingItemSchema).min(1, 'At least one item is required'),
  totalBudget: z.number().min(0).optional(),
  createdFor: z.date().optional(),
});

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    issues: Array<{
      path: string[];
      message: string;
      code: string;
    }>;
  };
};

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation failed',
          issues: error.issues.map(issue => ({
            path: issue.path.map(p => String(p)),
            message: issue.message,
            code: issue.code,
          })),
        },
      };
    }
    
    return {
      success: false,
      error: {
        message: 'Unknown validation error',
        issues: [],
      },
    };
  }
}

export function validateQueryParams(
  schema: z.ZodSchema,
  searchParams: URLSearchParams
): ValidationResult<any> {
  const params: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    if (value !== '') {
      params[key] = value;
    }
  }
  
  return validateData(schema, params);
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = validateData(schema, data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }
    return result.data;
  };
}

// =============================================================================
// FORM VALIDATION HELPERS
// =============================================================================

export type FormErrors<T = any> = {
  [K in keyof T]?: string[];
} & {
  _form?: string[];
};

export function zodErrorsToFormErrors(error: z.ZodError): FormErrors {
  const formErrors: FormErrors = {};
  
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_form';
    
    if (!formErrors[path]) {
      formErrors[path] = [];
    }
    
    formErrors[path]!.push(issue.message);
  }
  
  return formErrors;
}

export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data?: T; errors?: FormErrors } {
  try {
    const result = schema.parse(data);
    return { data: result };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { errors: zodErrorsToFormErrors(error) };
    }
    
    return { errors: { _form: ['Unknown validation error'] } };
  }
}

// =============================================================================
// RESPONSE VALIDATION
// =============================================================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.date().default(() => new Date()),
    requestId: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    pages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
  data?: T;
};

export type PaginatedResponse<T = any> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};