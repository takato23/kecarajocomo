'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useUser, useUserActions } from '@/store';

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
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Simple Navigation */}
      <nav className="bg-lime-500 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">KeCarajoComer</h1>
          <div className="flex gap-4">
            <Link href="/app" className="hover:underline">Dashboard</Link>
            <Link href="/recetas" className="hover:underline">Recetas</Link>
            <Link href="/despensa" className="hover:underline">Despensa</Link>
            <Link href="/lista-compras" className="hover:underline">Compras</Link>
            {/* <Link href="/planificador" className="hover:underline">Planificador</Link> */}
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex justify-around p-2">
          <Link href="/app" className="p-2 text-center">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/recetas" className="p-2 text-center">
            <span className="text-2xl">🍽️</span>
            <span className="text-xs block">Recetas</span>
          </Link>
          <Link href="/despensa" className="p-2 text-center">
            <span className="text-2xl">🥫</span>
            <span className="text-xs block">Despensa</span>
          </Link>
          <Link href="/lista-compras" className="p-2 text-center">
            <span className="text-2xl">🛒</span>
            <span className="text-xs block">Compras</span>
          </Link>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="p-4 pb-20 md:pb-4">
        {children}
      </main>
    </div>
  );
}