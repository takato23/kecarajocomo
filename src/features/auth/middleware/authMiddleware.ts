// Authentication Middleware

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';

export async function authMiddleware(request: NextRequest) {
  const res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (process.env.NODE_ENV === 'development') {

  }

  const { pathname } = request.nextUrl;

  // Define route patterns
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/callback',
    '/auth/confirm',
    '/api/auth',
    '/privacy',
    '/terms'
  ];

  const authRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password'
  ];

  const protectedRoutes = [
    '/dashboard',
    '/onboarding',
    '/recipes',
    // '/meal-planner',
    '/pantry',
    '/shopping',
    '/nutrition',
    '/profile',
    '/settings'
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isApiRoute = pathname.startsWith('/api/');

  // Handle authentication redirects
  if (session) {
    // User is authenticated
    if (isAuthRoute) {
      // Redirect authenticated users away from auth pages
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Check if user needs onboarding
    if (isProtectedRoute && pathname !== '/onboarding') {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .single();

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      } catch (error: unknown) {
        logger.error('Failed to check onboarding status:', 'auth:authMiddleware', error);
        // If we can't check onboarding status, allow the request to continue
      }
    }
  } else {
    // User is not authenticated
    if (isProtectedRoute) {
      // Redirect to sign in with return URL
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (pathname === '/onboarding') {
      // Redirect unauthenticated users to sign in
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // API route protection
  if (isApiRoute && !pathname.startsWith('/api/auth/')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return res;
}

// Helper function to check if user is authenticated
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Helper function, so we don't need to set cookies
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user || null;
}

// Helper function to require authentication
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

// Helper function to check user permissions
export async function checkPermission(
  request: NextRequest,
  permission: string
): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) return false;
  
  // Add permission checking logic here
  // For now, all authenticated users have all permissions
  return true;
}

// Rate limiting helper
const rateLimitMap = new Map();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const requests = rateLimitMap.get(identifier) || [];
  const requestsInWindow = requests.filter((time: number) => time > windowStart);
  
  if (requestsInWindow.length >= limit) {
    return false;
  }
  
  requestsInWindow.push(now);
  rateLimitMap.set(identifier, requestsInWindow);
  
  return true;
}

// Security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.anthropic.com https://*.supabase.co;"
  );

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}