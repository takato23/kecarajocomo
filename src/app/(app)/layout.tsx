'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';

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

  if (!isInitialized || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Professional Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="pt-16 pb-20 lg:pb-0">
        {children}
      </main>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}