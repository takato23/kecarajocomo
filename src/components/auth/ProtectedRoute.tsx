'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth/login',
  fallback
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
};

export default ProtectedRoute;