'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Calendar, ShoppingCart, ChefHat, BarChart3, Settings,
  Search, Plus, TrendingUp, Clock, Heart, Star,
  ChevronLeft, Apple
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  color?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export function iOS26EnhancedSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  const sections: SidebarSection[] = [
    {
      title: 'Main',
      items: [
        { 
          href: '/dashboard', 
          label: 'Dashboard', 
          icon: <Home className="h-5 w-5" />,
          color: 'from-blue-500 to-blue-600'
        },
        { 
          href: '/recipes', 
          label: 'Recipes', 
          icon: <ChefHat className="h-5 w-5" />,
          badge: 'New',
          color: 'from-food-fresh to-food-fresh-dark'
        },
        { 
          href: '/meal-plans', 
          label: 'Meal Plans', 
          icon: <Calendar className="h-5 w-5" />,
          color: 'from-purple-500 to-purple-600'
        },
        { 
          href: '/pantry', 
          label: 'Pantry', 
          icon: <ShoppingCart className="h-5 w-5" />,
          badge: 3,
          color: 'from-food-warm to-food-warm-dark'
        },
      ],
    },
    {
      title: 'Insights',
      items: [
        { 
          href: '/analytics', 
          label: 'Analytics', 
          icon: <BarChart3 className="h-5 w-5" />,
          color: 'from-indigo-500 to-indigo-600'
        },
        { 
          href: '/nutrition', 
          label: 'Nutrition', 
          icon: <Apple className="h-5 w-5" />,
          color: 'from-green-500 to-green-600'
        },
        { 
          href: '/trends', 
          label: 'Trends', 
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'from-pink-500 to-pink-600'
        },
      ],
    },
    {
      title: 'Quick Access',
      items: [
        { 
          href: '/favorites', 
          label: 'Favorites', 
          icon: <Heart className="h-5 w-5" />,
          color: 'from-red-500 to-red-600'
        },
        { 
          href: '/recent', 
          label: 'Recent', 
          icon: <Clock className="h-5 w-5" />,
          color: 'from-gray-500 to-gray-600'
        },
        { 
          href: '/top-rated', 
          label: 'Top Rated', 
          icon: <Star className="h-5 w-5" />,
          color: 'from-yellow-500 to-yellow-600'
        },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={cn(
        "sticky top-20 h-[calc(100vh-5rem)] transition-all duration-500 ease-in-out",
        "ios26-liquid-glass ios26-blur-medium rounded-2xl",
        "border border-white/10 shadow-xl",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-glass-ultralight via-transparent to-glass-feather animate-gradient-flow opacity-50" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-food-fresh/10 to-transparent blur-3xl animate-liquid-morph" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-food-warm/10 to-transparent blur-3xl animate-liquid-morph animation-delay-2000" />
      </div>

      <div className="relative h-full flex flex-col p-4">
        {/* Collapse Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full ios26-liquid-glass bg-glass-medium border border-white/20 flex items-center justify-center shadow-lg z-10"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </motion.button>

        {/* Search */}
        <div className={cn(
          "mb-6 transition-all duration-300",
          isCollapsed && "mb-4"
        )}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "ios26-liquid-glass hover:bg-glass-medium transition-all duration-300",
              "border border-white/10 shadow-sm"
            )}
          >
            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-500 dark:text-gray-400 overflow-hidden whitespace-nowrap"
                >
                  Search recipes...
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Quick Actions */}
        <div className={cn(
          "mb-6 space-y-2",
          isCollapsed && "mb-4"
        )}>
          <iOS26EnhancedButton
            variant="aurora"
            size={isCollapsed ? "sm" : "md"}
            className="w-full justify-center"
            morphEffect={false}
            floatEffect={true}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span>New Recipe</span>}
          </iOS26EnhancedButton>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {sections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-1">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {section.title}
                  </motion.h3>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                    >
                      <Link
                        href={item.href}
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                          "ios26-liquid-ripple group",
                          active
                            ? "bg-gradient-to-r text-white shadow-lg"
                            : "hover:bg-glass-medium text-gray-600 dark:text-gray-400"
                        )}
                        style={{
                          backgroundImage: active ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined,
                          '--tw-gradient-from': active && item.color ? item.color.split(' ')[1] : undefined,
                          '--tw-gradient-to': active && item.color ? item.color.split(' ')[3] : undefined,
                        } as React.CSSProperties}
                      >
                        {/* Icon */}
                        <motion.div
                          animate={{
                            scale: hoveredItem === item.href ? 1.1 : 1,
                            rotate: active ? [0, 360] : 0,
                          }}
                          transition={{ duration: 0.5 }}
                          className="flex-shrink-0"
                        >
                          {item.icon}
                        </motion.div>

                        {/* Label */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-sm font-medium overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Badge */}
                        {item.badge && (
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={cn(
                              "ml-auto flex items-center justify-center text-xs font-bold rounded-full",
                              typeof item.badge === 'number' 
                                ? "w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white"
                                : "px-2 py-0.5 bg-gradient-to-r from-food-fresh to-food-fresh-dark text-white"
                            )}
                          >
                            {item.badge}
                          </motion.span>
                        )}

                        {/* Active indicator */}
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 w-1 h-full bg-white rounded-full opacity-60"
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        )}

                        {/* Hover effect */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10" />
                        </div>
                      </Link>

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && hoveredItem === item.href && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50"
                        >
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-gray-900" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Settings */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
              "ios26-liquid-ripple hover:bg-glass-medium",
              "text-gray-600 dark:text-gray-400"
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-medium overflow-hidden whitespace-nowrap"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>
    </aside>
  );
}