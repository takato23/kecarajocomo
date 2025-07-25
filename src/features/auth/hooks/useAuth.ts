import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useUser, useUserActions } from '@/store';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { initialize } = useUserActions();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    if (!user && options?.redirectTo) {
      router.push(options.redirectTo);
    }

    if (user && options?.redirectIfFound && options?.redirectTo) {
      router.push(options.redirectTo);
    }
  }, [user, isLoading, router, options]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useRequireAuth(redirectTo: string = '/login') {
  return useAuth({ redirectTo });
}

export function useRedirectIfAuthenticated(redirectTo: string = '/app') {
  return useAuth({ redirectTo, redirectIfFound: true });
}