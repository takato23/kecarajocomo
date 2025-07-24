import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n.config';
// import { authMiddleware } from '@/features/auth';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  // Apply internationalization first
  const intlResponse = intlMiddleware(request);
  
  // Temporarily disable auth middleware to test login flow
  // const authResponse = await authMiddleware(request);
  // if (authResponse) return authResponse;
  
  if (process.env.NODE_ENV === 'development') {

  }
  
  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(en|es|fr|de|it|pt|ja|zh|ko|ar)/:path*'
  ],
};