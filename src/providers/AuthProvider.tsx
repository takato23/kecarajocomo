'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user.profile);
  const isAuthenticated = useAppStore((state) => state.user.isAuthenticated);
  const isLoading = useAppStore((state) => state.user.isLoading);
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

  // Show loading state while checking auth (only for protected routes)
  if (isLoading && !isPublicRoute) {
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