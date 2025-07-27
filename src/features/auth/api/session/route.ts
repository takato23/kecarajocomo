// Secure Session Management API

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/services/logger';

const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/'
};

export async function POST(request: NextRequest) {
  try {
    const { session }: { session: Session } = await request.json();

    if (!session || !session.access_token) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Set secure HTTP-only cookies
    cookieStore.set('access_token', session.access_token, SECURE_COOKIE_OPTIONS);
    cookieStore.set('refresh_token', session.refresh_token, SECURE_COOKIE_OPTIONS);
    
    // Set session metadata
    cookieStore.set('session_expires_at', session.expires_at?.toString() || '', {
      ...SECURE_COOKIE_OPTIONS,
      httpOnly: false // Allow client to read expiration
    });

    // Log session creation for security monitoring

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to set secure session:', 'auth:route', error);
    return NextResponse.json(
      { error: 'Failed to set session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const expiresAt = cookieStore.get('session_expires_at')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt ? parseInt(expiresAt) : null
    });
  } catch (error: unknown) {
    logger.error('Failed to get session:', 'auth:route', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Clear all session cookies
    const cookieNames = ['access_token', 'refresh_token', 'session_expires_at'];
    
    for (const cookieName of cookieNames) {
      cookieStore.set(cookieName, '', {
        ...SECURE_COOKIE_OPTIONS,
        maxAge: 0
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to clear session:', 'auth:route', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}