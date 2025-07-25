'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  Calendar, 
  ShoppingCart,
  MoreHorizontal,
  Search,
  User,
  Package,
  LogOut
} from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

import { cn } from '@/lib/utils';
import { useUser } from '@/store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Inicio',
    href: '/',
    icon: Home,
  },
  {
    label: 'Cocinar',
    href: '/recetas',
    icon: BookOpen,
  },
  {
    label: 'Planificar',
    href: '/planificador',
    icon: Calendar,
  },
  {
    label: 'Comprar',
    href: '/lista-compras',
    icon: ShoppingCart,
    badge: 5,
  },
];

const moreItems: NavItem[] = [
  {
    label: 'Despensa',
    href: '/despensa',
    icon: Package,
  },
  {
    label: 'Perfil',
    href: '/perfil',
    icon: User,
  },
  {
    label: 'Buscar',
    href: '/buscar',
    icon: Search,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const controls = useAnimation();

  // Update active tab based on pathname
  useEffect(() => {
    const index = navItems.findIndex(item => pathname.startsWith(item.href));
    if (index !== -1) {
      setActiveTab(index);
    }
  }, [pathname]);

  // Swipe handlers for tab navigation
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab < navItems.length - 1) {
        setActiveTab(activeTab + 1);
      }
    },
    onSwipedRight: () => {
      if (activeTab > 0) {
        setActiveTab(activeTab - 1);
      }
    },
    trackMouse: false,
  });

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  // Haptic feedback simulation (would use native API in production)
  const triggerHaptic = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    triggerHaptic([0, 10, 50, 10]); // Quick double tap pattern
  };

  return (
    <>
      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        {/* Glow effect behind mobile nav */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-50 transition-opacity duration-500" />
        
        <nav className="relative rounded-2xl overflow-hidden"
             style={{
               background: 'rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(30px)',
               WebkitBackdropFilter: 'blur(30px)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               boxShadow: `
                 inset 3px 3px 6px rgba(255, 255, 255, 0.3),
                 inset -3px -3px 6px rgba(0, 0, 0, 0.05),
                 8px 8px 20px rgba(0, 0, 0, 0.2)
               `,
             }}>
        <div className="relative" {...handlers}>
          {/* Active tab indicator */}
          <motion.div
            className="absolute top-0 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500"
            animate={{
              left: `${(activeTab / navItems.length) * 100}%`,
              width: `${100 / navItems.length}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <div className="flex justify-around items-center h-16 px-4">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleTabPress(index)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-1 relative",
                  "transition-all duration-200",
                  isActive(item.href) 
                    ? "text-gray-900" 
                    : "text-gray-700"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <item.icon className={cn(
                    "w-6 h-6 transition-all duration-200",
                    isActive(item.href) && "transform scale-110"
                  )} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
                <span className={cn(
                  "text-xs mt-1 transition-all duration-200",
                  isActive(item.href) ? "font-medium" : "font-normal"
                )}>
                  {item.label}
                </span>
              </Link>
            ))}

            {/* More button */}
            <button
              onClick={() => {
                setMoreMenuOpen(!moreMenuOpen);
                triggerHaptic([0, 30]); // Medium tap
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-1 relative",
                "transition-all duration-200",
                moreMenuOpen 
                  ? "text-orange-600 dark:text-orange-400" 
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: moreMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <MoreHorizontal className="w-6 h-6" />
              </motion.div>
              <span className="text-xs mt-1">Más</span>
            </button>
          </div>
        </div>
        </nav>
      </div>

      {/* More menu overlay */}
      <AnimatePresence>
        {moreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMoreMenuOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-24 left-4 right-4 z-50 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  {moreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMoreMenuOpen(false);
                        triggerHaptic([0, 10, 100, 20]); // Success pattern
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <item.icon className="w-8 h-8 text-gray-700 dark:text-gray-300 mb-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
                
                {/* Logout button */}
                <button
                  onClick={async () => {
                    setMoreMenuOpen(false);
                    triggerHaptic([0, 10, 100, 20]); // Success pattern
                    try {
                      // TODO: Implement sign out
                      router.push('/login');
                      router.push('/');
                    } catch (error) {
                      console.error('Error al cerrar sesión:', error);
                    }
                  }}
                  className="mt-4 w-full flex items-center justify-center space-x-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Cerrar Sesión
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}