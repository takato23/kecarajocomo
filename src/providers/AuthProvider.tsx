'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useUser, useUserActions } from '@/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized, user } = useAuthStore();
  const pathname = usePathname();
  
  // Public routes that don't need auth initialization to complete
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup', 
    '/auth/reset-password',
    '/auth/confirm'
  ];
  
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');

  useEffect(() => {
    if (!isInitialized) {
      if (process.env.NODE_ENV === 'development') {

      }
      // Initialize auth regardless of route type
      initialize();
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {

    }
  }, [isInitialized, user]);

  // Show loading state while initializing auth (only for protected routes)
  if (!isInitialized && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}