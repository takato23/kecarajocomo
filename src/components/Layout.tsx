import React from 'react';

// Note: In Next.js, layout components receive children props instead of using Outlet
import { Navbar } from './navigation/Navbar';
import { MobileNav } from './navigation/MobileNav';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <Navbar />
      <MobileNav />

      {/* Main Content */}
      <main className="relative z-10 pt-16 lg:pt-20 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}