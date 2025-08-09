import { NextResponse } from 'next/server';
import { logger } from '@/services/logger';
import { ZodError } from 'zod';

// Standard API response types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  meta?: {
    timestamp: string;
    version?: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes enum
export enum ApiErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Client errors (400)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  
  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  MEAL_PLAN_NOT_FOUND = 'MEAL_PLAN_NOT_FOUND',
  RECIPE_NOT_FOUND = 'RECIPE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Helper function to create success response
export function successResponse<T>(
  data?: T,
  message?: string,
  statusCode: number = 200,
  meta?: Record<string, any>
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
  
  return NextResponse.json(response, { status: statusCode });
}

// Helper function to create error response
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      timestamp: new Date().toISOString()
    }
  };
  
  return NextResponse.json(response, { status: statusCode });
}

// Common error response helpers
export const unauthorizedResponse = (message: string = 'Authentication required') =>
  errorResponse(ApiErrorCode.UNAUTHORIZED, message, 401);

export const forbiddenResponse = (message: string = 'Access denied') =>
  errorResponse(ApiErrorCode.FORBIDDEN, message, 403);

export const notFoundResponse = (resource: string = 'Resource') =>
  errorResponse(ApiErrorCode.NOT_FOUND, `${resource} not found`, 404);

export const validationErrorResponse = (errors: ZodError | any) => {
  const details = errors instanceof ZodError ? errors.errors : errors;
  return errorResponse(
    ApiErrorCode.VALIDATION_ERROR,
    'Validation failed',
    400,
    details
  );
};

export const badRequestResponse = (message: string, details?: any) =>
  errorResponse(ApiErrorCode.BAD_REQUEST, message, 400, details);

export const conflictResponse = (message: string, details?: any) =>
  errorResponse(ApiErrorCode.CONFLICT, message, 409, details);

export const internalErrorResponse = (error: any) => {
  // Log the actual error for debugging
  logger.error('Internal server error:', error);
  
  // Don't expose internal error details to the client
  return errorResponse(
    ApiErrorCode.INTERNAL_ERROR,
    'An internal server error occurred',
    500
  );
};

export const rateLimitResponse = (message: string = 'Rate limit exceeded') =>
  errorResponse(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429);

// Utility function to handle common database errors
export function handleDatabaseError(error: any): NextResponse<ApiErrorResponse> {
  logger.error('Database error:', error);
  
  // Handle specific Supabase/PostgreSQL error codes
  if (error.code === 'PGRST116') {
    return notFoundResponse('Record');
  }
  
  if (error.code === '23505') {
    return conflictResponse('Record already exists');
  }
  
  if (error.code === '23503') {
    return badRequestResponse('Invalid reference: related record not found');
  }
  
  return errorResponse(
    ApiErrorCode.DATABASE_ERROR,
    'Database operation failed',
    500
  );
}

// Wrapper function for consistent error handling
export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<ApiSuccessResponse<T> | ApiErrorResponse>> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    
    return internalErrorResponse(error);
  }
}

// Type guards
export function isApiSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}