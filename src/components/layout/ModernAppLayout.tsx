'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { MobileNav } from '../navigation/MobileNav';
import { FloatingActionMenu } from '../ui/FloatingActionMenu';

import ModernSidebar from './ModernSidebar';


interface ModernAppLayoutProps {
  children: React.ReactNode;
}

export const ModernAppLayout: React.FC<ModernAppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState('');

  // Detect route changes
  useEffect(() => {
    if (pathname !== prevPathname && !pathname.includes('#')) {
      const isSignificantRouteChange = getMainRoute(prevPathname) !== getMainRoute(pathname);
      
      if (isSignificantRouteChange) {
        setIsLoading(true);
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
    setPrevPathname(pathname);
  }, [pathname, prevPathname]);

  const getMainRoute = (path: string): string => {
    const segments = path.split('/');
    return segments.length > 1 ? `/${segments[1]}` : path;
  };

  // Don't show layout on auth pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Loading screen */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 dark:text-gray-400"
              >
                Cargando...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <ModernSidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <motion.main
        className={cn(
          "min-h-screen transition-all duration-300",
          "lg:pl-80", // Space for sidebar on desktop
          sidebarCollapsed && "lg:pl-20",
          "pb-20 lg:pb-0" // Space for mobile nav
        )}
        animate={{
          paddingLeft: sidebarCollapsed ? 80 : 280
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={getMainRoute(pathname)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Floating Action Button */}
      <div className="lg:hidden">
        <FloatingActionMenu />
      </div>
    </div>
  );
};