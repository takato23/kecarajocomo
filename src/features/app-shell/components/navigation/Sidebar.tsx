import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { SidebarProps, Route } from '../../types';

interface SidebarState {
  expandedGroups: Set<string>;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  routes,
  isOpen,
  onToggle,
  className,
  variant = 'desktop'
}) => {
  const [state, setState] = useState<SidebarState>({
    expandedGroups: new Set(),
    currentPath: typeof window !== 'undefined' ? window.location.pathname : ''
  });

  // Update current path on route changes
  useEffect(() => {
    const handlePathChange = () => {
      setState(prev => ({ ...prev, currentPath: window.location.pathname }));
    };

    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && variant === 'mobile') {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle, variant]);

  const toggleGroup = (groupId: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  };

  const isRouteActive = (route: Route): boolean => {
    if (route.path === '/app') {
      return state.currentPath === route.path;
    }
    return state.currentPath.startsWith(route.path);
  };

  const sidebarVariants = {
    hidden: {
      x: variant === 'mobile' ? '-100%' : 0,
      opacity: variant === 'mobile' ? 0 : 1
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const NavItem: React.FC<{ route: Route; level?: number }> = ({ route, level = 0 }) => {
    const isActive = isRouteActive(route);
    const hasChildren = route.children && route.children.length > 0;
    const isExpanded = state.expandedGroups.has(route.id);

    return (
      <li className="w-full">
        <div className="relative">
          {/* Main Nav Item */}
          <motion.a
            href={route.path}
            className={cn(
              'group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2',
              level > 0 && 'ml-4 pl-8',
              isActive
                ? 'bg-gradient-to-r from-lime-500/20 to-purple-500/20 text-lime-700 border border-lime-200/50'
                : 'text-gray-700 hover:bg-white/50 hover:text-lime-600 border border-transparent hover:border-white/30'
            )}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
                toggleGroup(route.id);
              }
            }}
          >
            {/* Icon */}
            <span className={cn(
              'flex-shrink-0 w-6 h-6 mr-3 transition-colors duration-200',
              isActive ? 'text-lime-600' : 'text-gray-400 group-hover:text-lime-500'
            )}>
              {route.icon}
            </span>

            {/* Label */}
            <span className="flex-1 text-left">{route.name}</span>

            {/* Badge */}
            {route.badge && (
              <span className="ml-2 bg-lime-500 text-white text-xs px-2 py-0.5 rounded-full min-w-5 text-center">
                {typeof route.badge === 'number' && route.badge > 99 ? '99+' : route.badge}
              </span>
            )}

            {/* Expand Icon */}
            {hasChildren && (
              <motion.svg
                className="w-4 h-4 ml-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </motion.svg>
            )}

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-lime-500 to-purple-500 rounded-r"
                layoutId="activeIndicator"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.a>

          {/* Submenu */}
          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="mt-1 space-y-1 overflow-hidden"
              >
                {route.children!.map((childRoute) => (
                  <NavItem key={childRoute.id} route={childRoute} level={level + 1} />
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </li>
    );
  };

  const sidebarContent = (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate={isOpen ? "visible" : "hidden"}
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 transition-all duration-300',
        'bg-white/80 backdrop-blur-md border-r border-white/20 shadow-xl',
        variant === 'mobile' && 'lg:translate-x-0',
        !isOpen && variant === 'desktop' && 'lg:-translate-x-full',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        {variant === 'mobile' && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500"
            aria-label="Close navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <ul className="space-y-1">
          {routes.map((route) => (
            <NavItem key={route.id} route={route} />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-lime-50 to-purple-50 border border-lime-200/50">
          <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">KC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">KeCaraJoComer</p>
            <p className="text-xs text-gray-500 truncate">AI-Powered Cooking</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );

  if (variant === 'mobile') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onToggle}
              aria-hidden="true"
            />
            {sidebarContent}
          </>
        )}
      </AnimatePresence>
    );
  }

  return sidebarContent;
};

// Collapsible sidebar variant for desktop
export const CollapsibleSidebar: React.FC<SidebarProps & { collapsed?: boolean }> = ({
  routes,
  isOpen,
  onToggle,
  className,
  collapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <motion.aside
      className={cn(
        'hidden lg:flex flex-col bg-white/80 backdrop-blur-md border-r border-white/20 shadow-xl transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </motion.svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <ul className="space-y-1">
          {routes.map((route) => {
            const isActive = typeof window !== 'undefined' && window.location.pathname.startsWith(route.path);
            
            return (
              <li key={route.id}>
                <motion.a
                  href={route.path}
                  className={cn(
                    'group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2',
                    isActive
                      ? 'bg-gradient-to-r from-lime-500/20 to-purple-500/20 text-lime-700 border border-lime-200/50'
                      : 'text-gray-700 hover:bg-white/50 hover:text-lime-600 border border-transparent hover:border-white/30'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={isCollapsed ? route.name : undefined}
                >
                  <span className={cn(
                    'flex-shrink-0 w-6 h-6 transition-colors duration-200',
                    isCollapsed ? 'mr-0' : 'mr-3',
                    isActive ? 'text-lime-600' : 'text-gray-400 group-hover:text-lime-500'
                  )}>
                    {route.icon}
                  </span>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 text-left whitespace-nowrap"
                      >
                        {route.name}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {route.badge && !isCollapsed && (
                    <span className="ml-2 bg-lime-500 text-white text-xs px-2 py-0.5 rounded-full min-w-5 text-center">
                      {typeof route.badge === 'number' && route.badge > 99 ? '99+' : route.badge}
                    </span>
                  )}
                </motion.a>
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.aside>
  );
};

export default Sidebar;