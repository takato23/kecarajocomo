import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/supabase/types';

import { AuthenticationError, handleApiError } from './errors';

type RouteHandler = (
  request: NextRequest,
  context: {
    params: any;
    session: any;
    supabase: any;
  }
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler) {
  return async (request: NextRequest, context: { params: any }) => {
    try {
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new AuthenticationError();
      }

      return await handler(request, {
        ...context,
        session,
        supabase,
      });
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      
      return NextResponse.json(
        apiError.toJSON(),
        { status: apiError.status }
      );
    }
  };
}

export function withCors(handler: RouteHandler) {
  return async (request: NextRequest, context: any) => {
    const response = await handler(request, context);
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    return response;
  };
}

export function withRateLimit(
  handler: RouteHandler,
  options: {
    windowMs?: number;
    max?: number;
  } = {}
) {
  const { windowMs = 60000, max = 100 } = options;
  const requests = new Map<string, number[]>();

  return async (request: NextRequest, context: any) => {
    const ip = request.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old requests
    const userRequests = requests.get(ip) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= max) {
      return NextResponse.json(
        { error: 'Too many requests', status: 429 },
        { status: 429 }
      );
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);

    return handler(request, context);
  };
}

export function withValidation<T = any>(
  schema: {
    validate: (data: any) => { error?: any; value: T };
  },
  handler: RouteHandler
) {
  return async (request: NextRequest, context: any) => {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const body = await request.json();
      const { error, value } = schema.validate(body);

      if (error) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: error.details,
            status: 400,
          },
          { status: 400 }
        );
      }

      // Replace request body with validated value
      context.body = value;
    }

    return handler(request, context);
  };
}