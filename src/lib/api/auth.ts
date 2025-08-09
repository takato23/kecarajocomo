import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { User } from '@supabase/supabase-js';
import { unauthorizedResponse, ApiErrorCode, errorResponse } from './response';

export interface AuthenticatedRequest {
  user: User;
  supabase: ReturnType<typeof createRouteHandlerClient>;
}

/**
 * Middleware to verify authentication for API routes
 * Returns user and supabase client if authenticated, otherwise returns error response
 */
export async function requireAuth(): Promise<
  { authenticated: true; user: User; supabase: ReturnType<typeof createRouteHandlerClient> } |
  { authenticated: false; response: ReturnType<typeof unauthorizedResponse> }
> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        response: unauthorizedResponse(error?.message || 'Authentication required')
      };
    }

    return {
      authenticated: true,
      user,
      supabase
    };
  } catch (error) {
    return {
      authenticated: false,
      response: errorResponse(
        ApiErrorCode.INVALID_TOKEN,
        'Invalid authentication token',
        401
      )
    };
  }
}

/**
 * Helper to check if a resource belongs to the authenticated user
 */
export async function verifyResourceOwnership(
  supabase: ReturnType<typeof createRouteHandlerClient>,
  tableName: string,
  resourceId: string,
  userId: string,
  userIdColumn: string = 'user_id'
): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', resourceId)
    .eq(userIdColumn, userId)
    .single();

  return !error && !!data;
}

/**
 * Rate limiting helper (basic implementation)
 * In production, use a proper rate limiting solution like Redis
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const userLimits = requestCounts.get(identifier);

  if (!userLimits || now > userLimits.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (userLimits.count >= maxRequests) {
    return false;
  }

  userLimits.count++;
  return true;
}