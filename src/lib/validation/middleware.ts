/**
 * Validation Middleware for API Routes
 * Provides consistent validation and error handling for all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { MealPlanningError, MealPlanningErrorCodes } from '@/lib/errors/MealPlanningError';

import { validateData, validateQueryParams, ApiResponse } from './schemas';

// =============================================================================
// TYPES
// =============================================================================

export type ValidatedRequest<TBody = any, TQuery = any> = NextRequest & {
  json: () => Promise<TBody>;
  validatedBody?: TBody;
  validatedQuery?: TQuery;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
};

export type ApiHandler<TBody = any, TQuery = any> = (
  request: ValidatedRequest<TBody, TQuery>,
  context: { params?: any }
) => Promise<NextResponse>;

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  requireAuth?: boolean;
  requireOwnership?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
}

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

export function withValidation<TBody = any, TQuery = any>(
  handler: ApiHandler<TBody, TQuery>,
  options: ValidationOptions = {}
) {
  return async (
    request: NextRequest,
    context: { params?: any } = {}
  ): Promise<NextResponse> => {
    try {
      const validatedRequest = request as ValidatedRequest<TBody, TQuery>;

      // Authentication check
      if (options.requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return createErrorResponse(
            'Authentication required',
            401,
            MealPlanningErrorCodes.AUTHENTICATION_REQUIRED
          );
        }
        
        validatedRequest.user = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.name || undefined,
        };
      }

      // Query parameters validation
      if (options.query) {
        const { searchParams } = new URL(request.url);
        const queryResult = validateQueryParams(options.query, searchParams);
        
        if (!queryResult.success) {
          return createErrorResponse(
            'Invalid query parameters',
            400,
            MealPlanningErrorCodes.VALIDATION_FAILED,
            queryResult.error
          );
        }
        
        validatedRequest.validatedQuery = queryResult.data;
      }

      // Request body validation
      if (options.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          const body = await request.json();
          const bodyResult = validateData(options.body, body);
          
          if (!bodyResult.success) {
            return createErrorResponse(
              'Invalid request body',
              400,
              MealPlanningErrorCodes.VALIDATION_FAILED,
              bodyResult.error
            );
          }
          
          validatedRequest.validatedBody = bodyResult.data;
        } catch (error: unknown) {
          return createErrorResponse(
            'Invalid JSON in request body',
            400,
            MealPlanningErrorCodes.VALIDATION_FAILED
          );
        }
      }

      // Rate limiting (basic implementation)
      if (options.rateLimit) {
        const rateLimitResult = await checkRateLimit(
          request,
          options.rateLimit.requests,
          options.rateLimit.window
        );
        
        if (!rateLimitResult.allowed) {
          return createErrorResponse(
            'Rate limit exceeded',
            429,
            MealPlanningErrorCodes.RATE_LIMIT_EXCEEDED,
            {
              retryAfter: rateLimitResult.retryAfter,
              limit: options.rateLimit.requests,
              window: options.rateLimit.window,
            }
          );
        }
      }

      // Execute the handler
      return await handler(validatedRequest, context);

    } catch (error: unknown) {
      console.error('API Error:', error);
      
      if (error instanceof MealPlanningError) {
        return createErrorResponse(
          error.userMessage || error.message,
          error.statusCode || 500,
          error.code,
          error.context
        );
      }
      
      return createErrorResponse(
        'Internal server error',
        500,
        MealPlanningErrorCodes.INTERNAL_ERROR
      );
    }
  };
}

// =============================================================================
// SPECIFIC VALIDATION MIDDLEWARES
// =============================================================================

export function requireAuth<TBody = any, TQuery = any>(
  handler: ApiHandler<TBody, TQuery>,
  options: Omit<ValidationOptions, 'requireAuth'> = {}
) {
  return withValidation(handler, { ...options, requireAuth: true });
}

export function validateBody<TBody = any>(
  schema: z.ZodSchema<TBody>,
  handler: ApiHandler<TBody, any>,
  options: Omit<ValidationOptions, 'body'> = {}
) {
  return withValidation(handler, { ...options, body: schema });
}

export function validateQuery<TQuery = any>(
  schema: z.ZodSchema<TQuery>,
  handler: ApiHandler<any, TQuery>,
  options: Omit<ValidationOptions, 'query'> = {}
) {
  return withValidation(handler, { ...options, query: schema });
}

export function validateAuthAndBody<TBody = any>(
  schema: z.ZodSchema<TBody>,
  handler: ApiHandler<TBody, any>,
  options: Omit<ValidationOptions, 'requireAuth' | 'body'> = {}
) {
  return withValidation(handler, { ...options, requireAuth: true, body: schema });
}

export function validateAuthAndQuery<TQuery = any>(
  schema: z.ZodSchema<TQuery>,
  handler: ApiHandler<any, TQuery>,
  options: Omit<ValidationOptions, 'requireAuth' | 'query'> = {}
) {
  return withValidation(handler, { ...options, requireAuth: true, query: schema });
}

export function validateAll<TBody = any, TQuery = any>(
  bodySchema: z.ZodSchema<TBody>,
  querySchema: z.ZodSchema<TQuery>,
  handler: ApiHandler<TBody, TQuery>,
  options: Omit<ValidationOptions, 'body' | 'query'> = {}
) {
  return withValidation(handler, { 
    ...options, 
    body: bodySchema, 
    query: querySchema,
    requireAuth: true 
  });
}

// =============================================================================
// OWNERSHIP VALIDATION
// =============================================================================

export async function validateOwnership(
  request: ValidatedRequest,
  resourceId: string,
  resourceType: 'recipe' | 'meal-plan' | 'pantry-item'
): Promise<boolean> {
  if (!request.user) {
    throw new MealPlanningError(
      'Authentication required',
      MealPlanningErrorCodes.AUTHENTICATION_REQUIRED,
      {},
      'You must be logged in to perform this action'
    );
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    
    let resource;
    switch (resourceType) {
      case 'recipe':
        resource = await prisma.recipe.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        break;
      case 'meal-plan':
        resource = await prisma.mealPlan.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        break;
      case 'pantry-item':
        resource = await prisma.pantryItem.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    if (!resource) {
      throw new MealPlanningError(
        'Resource not found',
        MealPlanningErrorCodes.NOT_FOUND,
        { resourceId, resourceType },
        'The requested resource does not exist'
      );
    }

    return resource.userId === request.user.id;
  } catch (error: unknown) {
    if (error instanceof MealPlanningError) {
      throw error;
    }
    
    throw new MealPlanningError(
      'Failed to validate ownership',
      MealPlanningErrorCodes.DATABASE_ERROR,
      { resourceId, resourceType, error: error.message }
    );
  }
}

export function requireOwnership(
  resourceType: 'recipe' | 'meal-plan' | 'pantry-item',
  getResourceId: (params: any) => string
) {
  return function<TBody = any, TQuery = any>(
    handler: ApiHandler<TBody, TQuery>,
    options: ValidationOptions = {}
  ) {
    return withValidation(async (request, context) => {
      const resourceId = getResourceId(context.params);
      const isOwner = await validateOwnership(request, resourceId, resourceType);
      
      if (!isOwner) {
        return createErrorResponse(
          'Access denied',
          403,
          MealPlanningErrorCodes.FORBIDDEN,
          { resourceId, resourceType }
        );
      }
      
      return handler(request, context);
    }, { ...options, requireAuth: true });
  };
}

// =============================================================================
// RATE LIMITING
// =============================================================================

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(
  request: NextRequest,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  
  const current = rateLimitStore.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }
  
  if (current.count >= maxRequests) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((current.resetTime - now) / 1000) 
    };
  }
  
  current.count++;
  return { allowed: true };
}

function getClientIdentifier(request: NextRequest): string {
  // In production, you might want to use a combination of IP and user ID
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

// =============================================================================
// ERROR RESPONSE UTILITIES
// =============================================================================

function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details
    },
    meta: {
      timestamp: new Date(),
    }
  };
  
  return NextResponse.json(response, { status });
}

export function createSuccessResponse<T = any>(
  data: T,
  status: number = 200,
  meta?: any
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date(),
      ...meta
    }
  };
  
  return NextResponse.json(response, { status });
}

export function createPaginatedResponse<T = any>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  status: number = 200
): NextResponse {
  const pages = Math.ceil(pagination.total / pagination.limit);
  
  const response = {
    success: true,
    data,
    pagination: {
      ...pagination,
      pages,
      hasNext: pagination.page < pages,
      hasPrev: pagination.page > 1,
    },
    meta: {
      timestamp: new Date(),
    }
  };
  
  return NextResponse.json(response, { status });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function parseMultipartFormData(request: NextRequest): Promise<FormData> {
  return request.formData();
}

export function sanitizeInput(input: string): string {
  // Basic input sanitization
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}

export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrlFormat(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

// =============================================================================
// VALIDATION DECORATORS
// =============================================================================

export function validate<T>(schema: z.ZodSchema<T>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const data = args[0];
      const result = validateData(schema, data);
      
      if (!result.success) {
        throw new MealPlanningError(
          'Validation failed',
          MealPlanningErrorCodes.VALIDATION_FAILED,
          result.error
        );
      }
      
      return originalMethod.apply(this, [result.data, ...args.slice(1)]);
    };
    
    return descriptor;
  };
}

export function rateLimit(requests: number, windowSeconds: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const request = args[0] as NextRequest;
      const rateLimitResult = await checkRateLimit(request, requests, windowSeconds);
      
      if (!rateLimitResult.allowed) {
        throw new MealPlanningError(
          'Rate limit exceeded',
          MealPlanningErrorCodes.RATE_LIMIT_EXCEEDED,
          { retryAfter: rateLimitResult.retryAfter }
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}