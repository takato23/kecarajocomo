import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseInstance } from '@/lib/supabase/singleton';
import { logger } from '@/services/logger';

import { useAppStore } from '@/store';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter();
  const supabase = getSupabaseInstance();
  const { profile: user, isLoading } = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);

  useEffect(() => {
    const checkUser = async () => {
      setAuthLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email!,
            name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
            createdAt: new Date(authUser.created_at),
            lastLogin: new Date()
          });
        }
      } catch (error) {
        logger.error('Error checking auth:', 'useAuth', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
          createdAt: new Date(session.user.created_at),
          lastLogin: new Date()
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setAuthLoading]);

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