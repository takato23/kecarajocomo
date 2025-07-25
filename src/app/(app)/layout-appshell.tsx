'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/features/app-shell';
import { defaultNavigationConfig } from '@/features/app-shell/config/routes';
import { Toaster } from '@/services/notifications';
import { useAppStore } from '@/store';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAppStore((state) => state.user.profile);
  const isAuthenticated = useAppStore((state) => state.user.isAuthenticated);
  const isLoading = useAppStore((state) => state.user.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-lime-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-lime-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">KC</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Debug info for development
  // logger.debug('AppLayout Debug:', 'AppLayout', {
  //   user,
  //   defaultNavigationConfig,
  //   currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/app'
  // });

  return (
    <>
      <Toaster position="bottom-right" />
      <AppShell
        navigation={defaultNavigationConfig}
        currentRoute={typeof window !== 'undefined' ? window.location.pathname : '/app'}
      >
        {children}
      </AppShell>
    </>
  );
}