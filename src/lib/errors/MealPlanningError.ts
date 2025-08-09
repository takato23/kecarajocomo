/**
 * Enhanced error handling system for meal planning
 * Provides structured error management with user-friendly messages and recovery options
 */

export class MealPlanningError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>,
    public readonly userMessage?: string,
    public readonly retryable: boolean = false,
    public readonly severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'MealPlanningError';
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MealPlanningError);
    }
  }

  /**
   * Create a user-friendly error for display
   */
  toUserError(): UserError {
    return {
      message: this.userMessage || this.getDefaultUserMessage(),
      code: this.code,
      retryable: this.retryable,
      severity: this.severity,
      context: this.context
    };
  }

  private getDefaultUserMessage(): string {
    switch (this.code) {
      case MealPlanningErrorCodes.AI_SERVICE_UNAVAILABLE:
        return 'El servicio de planificación inteligente no está disponible temporalmente. Intenta nuevamente en unos minutos.';
      case MealPlanningErrorCodes.INVALID_PREFERENCES:
        return 'Hay un error en tus preferencias. Revisa la configuración e intenta nuevamente.';
      case MealPlanningErrorCodes.INSUFFICIENT_RECIPES:
        return 'No encontramos suficientes recetas que coincidan con tus preferencias. Intenta relajar algunas restricciones.';
      case MealPlanningErrorCodes.BUDGET_EXCEEDED:
        return 'El presupuesto especificado es insuficiente para generar un plan balanceado. Considera aumentarlo o reducir las restricciones.';
      case MealPlanningErrorCodes.NUTRITIONAL_CONSTRAINTS_VIOLATED:
        return 'No pudimos crear un plan que cumpla con todas tus metas nutricionales. Revisa tus objetivos.';
      case MealPlanningErrorCodes.PANTRY_SYNC_FAILED:
        return 'Hubo un problema sincronizando tu despensa. Algunos ingredientes pueden no estar actualizados.';
      case MealPlanningErrorCodes.RECIPE_GENERATION_FAILED:
        return 'No pudimos generar nuevas recetas. Usaremos recetas existentes de tu biblioteca.';
      case MealPlanningErrorCodes.SHOPPING_LIST_GENERATION_FAILED:
        return 'Hubo un problema generando tu lista de compras. Puedes crearla manualmente desde el plan.';
      case MealPlanningErrorCodes.MEAL_PLAN_SAVE_FAILED:
        return 'No pudimos guardar tu plan de comidas. Intenta nuevamente.';
      case MealPlanningErrorCodes.VALIDATION_FAILED:
        return 'Algunos datos no son válidos. Revisa tu información e intenta nuevamente.';
      default:
        return 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.';
    }
  }
}

/**
 * Error codes for meal planning operations
 */
export const MealPlanningErrorCodes = {
  // AI Service Errors
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
  AI_TIMEOUT: 'AI_TIMEOUT',
  
  // Validation Errors
  INVALID_PREFERENCES: 'INVALID_PREFERENCES',
  INVALID_CONSTRAINTS: 'INVALID_CONSTRAINTS',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  
  // Data Errors
  RECIPE_NOT_FOUND: 'RECIPE_NOT_FOUND',
  INGREDIENT_NOT_FOUND: 'INGREDIENT_NOT_FOUND',
  PANTRY_ITEM_NOT_FOUND: 'PANTRY_ITEM_NOT_FOUND',
  INSUFFICIENT_RECIPES: 'INSUFFICIENT_RECIPES',
  
  // Business Logic Errors
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  NUTRITIONAL_CONSTRAINTS_VIOLATED: 'NUTRITIONAL_CONSTRAINTS_VIOLATED',
  ALLERGEN_DETECTED: 'ALLERGEN_DETECTED',
  DIETARY_RESTRICTION_VIOLATED: 'DIETARY_RESTRICTION_VIOLATED',
  
  // Service Errors
  PANTRY_SYNC_FAILED: 'PANTRY_SYNC_FAILED',
  RECIPE_GENERATION_FAILED: 'RECIPE_GENERATION_FAILED',
  SHOPPING_LIST_GENERATION_FAILED: 'SHOPPING_LIST_GENERATION_FAILED',
  NUTRITION_CALCULATION_FAILED: 'NUTRITION_CALCULATION_FAILED',
  
  // Database Errors
  MEAL_PLAN_SAVE_FAILED: 'MEAL_PLAN_SAVE_FAILED',
  MEAL_PLAN_LOAD_FAILED: 'MEAL_PLAN_LOAD_FAILED',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type MealPlanningErrorCode = string;

/**
 * User-friendly error interface for frontend display
 */
export interface UserError {
  message: string;
  code: MealPlanningErrorCode;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

/**
 * Error factory functions for common scenarios
 */
export class MealPlanningErrorFactory {
  static aiServiceUnavailable(originalError?: Error): MealPlanningError {
    return new MealPlanningError(
      'AI service is temporarily unavailable',
      MealPlanningErrorCodes.AI_SERVICE_UNAVAILABLE,
      { originalError: originalError?.message },
      undefined,
      true,
      'high'
    );
  }

  static invalidPreferences(validationErrors: Record<string, string>): MealPlanningError {
    return new MealPlanningError(
      'User preferences validation failed',
      MealPlanningErrorCodes.INVALID_PREFERENCES,
      { validationErrors },
      undefined,
      false,
      'medium'
    );
  }

  static insufficientRecipes(availableCount: number, requiredCount: number): MealPlanningError {
    return new MealPlanningError(
      `Insufficient recipes available: ${availableCount}/${requiredCount}`,
      MealPlanningErrorCodes.INSUFFICIENT_RECIPES,
      { availableCount, requiredCount },
      undefined,
      false,
      'medium'
    );
  }

  static budgetExceeded(requiredBudget: number, availableBudget: number): MealPlanningError {
    return new MealPlanningError(
      `Budget exceeded: requires $${requiredBudget}, available $${availableBudget}`,
      MealPlanningErrorCodes.BUDGET_EXCEEDED,
      { requiredBudget, availableBudget },
      undefined,
      false,
      'medium'
    );
  }

  static aiResponseInvalid(response: any, validationError: string): MealPlanningError {
    return new MealPlanningError(
      'AI response validation failed',
      MealPlanningErrorCodes.AI_RESPONSE_INVALID,
      { response, validationError },
      undefined,
      true,
      'high'
    );
  }

  static nutritionalConstraintsViolated(violations: string[]): MealPlanningError {
    return new MealPlanningError(
      'Nutritional constraints cannot be satisfied',
      MealPlanningErrorCodes.NUTRITIONAL_CONSTRAINTS_VIOLATED,
      { violations },
      undefined,
      false,
      'medium'
    );
  }

  static allergenDetected(allergens: string[], recipe: string): MealPlanningError {
    return new MealPlanningError(
      `Allergen detected in recipe: ${recipe}`,
      MealPlanningErrorCodes.ALLERGEN_DETECTED,
      { allergens, recipe },
      undefined,
      false,
      'critical'
    );
  }
}

/**
 * Retry utility for handling retryable errors
 */
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        const isLastAttempt = attempt === maxAttempts;
        const isRetryable = error instanceof MealPlanningError && error.retryable;
        
        if (isLastAttempt || !isRetryable) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay;
        
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    throw new Error('Max retry attempts exceeded');
  }
}

/**
 * Error reporter for logging and monitoring
 */
export class ErrorReporter {
  static report(error: MealPlanningError, context?: Record<string, any>): void {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        severity: error.severity,
        stack: error.stack,
        context: { ...error.context, ...context }
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[MealPlanning Error]', errorData);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
      // monitoringService.captureException(error, errorData);
    }
  }
}