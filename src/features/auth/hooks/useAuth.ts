import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const { user, isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!user && options?.redirectTo) {
      router.push(options.redirectTo);
    }

    if (user && options?.redirectIfFound && options?.redirectTo) {
      router.push(options.redirectTo);
    }
  }, [user, isLoading, isInitialized, router, options]);

  return {
    user,
    isLoading: !isInitialized || isLoading,
    isAuthenticated: !!user,
  };
}

export function useRequireAuth(redirectTo: string = '/login') {
  return useAuth({ redirectTo });
}

export function useRedirectIfAuthenticated(redirectTo: string = '/app') {
  return useAuth({ redirectTo, redirectIfFound: true });
}