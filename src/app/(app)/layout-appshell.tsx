'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell } from '@/features/app-shell';
import { defaultNavigationConfig } from '@/features/app-shell/config/routes';
import { Toaster } from '@/services/notifications';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!user) {
      router.push('/login');
    }
  }, [user, isLoading, isInitialized, router]);

  if (!isInitialized || isLoading) {
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

  if (!user) {
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