import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/services/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Si hay un error del auth, redirigir al login con mensaje de error
  if (error) {
    logger.error('Auth callback error', 'AuthCallback', { 
      error, 
      errorDescription,
      url: request.url 
    });
    
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // Si no hay código, es una solicitud inválida
  if (!code) {
    logger.warn('Auth callback without code', 'AuthCallback', { url: request.url });
    
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'Link inválido o expirado');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Intercambiar el código por una sesión
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      throw exchangeError;
    }

    if (!data.session) {
      throw new Error('No se pudo crear la sesión');
    }

    logger.info('Magic link auth successful', 'AuthCallback', { 
      userId: data.user?.id,
      email: data.user?.email 
    });

    // Crear response con redirección
    const redirectUrl = new URL(next, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Configurar cookies de sesión
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in || 3600,
      path: '/'
    });

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    return response;

  } catch (error: any) {
    logger.error('Magic link exchange failed', 'AuthCallback', error);
    
    let errorMessage = 'Error al procesar el link de acceso';
    
    if (error.message?.includes('expired')) {
      errorMessage = 'El link ha expirado. Solicitá uno nuevo.';
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Link inválido. Verificá tu email e intentá de nuevo.';
    } else if (error.message?.includes('used')) {
      errorMessage = 'Este link ya fue usado. Solicitá uno nuevo.';
    }

    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }
}