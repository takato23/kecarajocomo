import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { BottomNavProps, Route } from '../../types';

interface BottomNavState {
  currentPath: string;
  visibleItems: Route[];
  showOverflow: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  routes,
  currentRoute,
  className,
  variant = 'default'
}) => {
  const [state, setState] = useState<BottomNavState>({
    currentPath: currentRoute || (typeof window !== 'undefined' ? window.location.pathname : ''),
    visibleItems: routes.slice(0, 5), // Show first 5 items
    showOverflow: routes.length > 5
  });

  // Update current path on route changes
  useEffect(() => {
    const handlePathChange = () => {
      setState(prev => ({ 
        ...prev, 
        currentPath: window.location.pathname 
      }));
    };

    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  // Update visible items based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let maxItems = 5;
      
      if (width < 375) maxItems = 4;      // Small phones
      else if (width < 414) maxItems = 5; // Standard phones
      else if (width < 768) maxItems = 6; // Large phones/small tablets
      
      setState(prev => ({
        ...prev,
        visibleItems: routes.slice(0, maxItems),
        showOverflow: routes.length > maxItems
      }));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [routes]);

  const isRouteActive = (route: Route): boolean => {
    if (route.path === '/app') {
      return state.currentPath === route.path;
    }
    return state.currentPath.startsWith(route.path);
  };

  const navItemVariants = {
    inactive: {
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    active: {
      scale: 1.1,
      y: -2,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30
      }
    }
  };

  const rippleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 0.6,
      transition: {
        type: 'tween',
        duration: 0.3
      }
    },
    exit: {
      scale: 1.5,
      opacity: 0,
      transition: {
        type: 'tween',
        duration: 0.3
      }
    }
  };

  const NavItem: React.FC<{ route: Route; index: number }> = ({ route, index }) => {
    const [showRipple, setShowRipple] = useState(false);
    const isActive = isRouteActive(route);

    const handleClick = () => {
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
    };

    return (
      <motion.div
        className="relative flex-1 flex justify-center"
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        whileTap="tap"
        variants={navItemVariants}
      >
        <motion.a
          href={route.path}
          onClick={handleClick}
          className={cn(
            'relative flex flex-col items-center justify-center p-2 min-h-16 rounded-xl transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2',
            'group overflow-hidden',
            variant === 'floating' && 'mx-1',
            isActive
              ? 'text-lime-700'
              : 'text-gray-500 hover:text-lime-600'
          )}
          role="tab"
          aria-selected={isActive}
          aria-label={`Navigate to ${route.name}`}
        >
          {/* Ripple Effect */}
          <AnimatePresence>
            {showRipple && (
              <motion.div
                className="absolute inset-0 bg-lime-500/20 rounded-xl"
                variants={rippleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              />
            )}
          </AnimatePresence>

          {/* Background for active state */}
          {isActive && (
            <motion.div
              className={cn(
                'absolute inset-0 rounded-xl',
                variant === 'floating'
                  ? 'bg-gradient-to-r from-lime-500/20 to-purple-500/20 border border-lime-200/50'
                  : 'bg-lime-50/80'
              )}
              layoutId="activeBackground"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          {/* Icon */}
          <motion.div
            className={cn(
              'relative z-10 w-6 h-6 mb-1 transition-colors duration-200',
              isActive ? 'text-lime-600' : 'text-gray-400 group-hover:text-lime-500'
            )}
            animate={{
              scale: isActive ? 1.1 : 1,
              rotate: isActive ? [0, -5, 5, 0] : 0
            }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 30 },
              rotate: { duration: 0.4, delay: 0.1 }
            }}
          >
            {route.icon}
          </motion.div>

          {/* Label */}
          <motion.span
            className={cn(
              'relative z-10 text-xs font-medium transition-all duration-200',
              isActive ? 'text-lime-700' : 'text-gray-500 group-hover:text-lime-600'
            )}
            animate={{
              fontWeight: isActive ? 600 : 500,
              scale: isActive ? 1.05 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {route.name}
          </motion.span>

          {/* Badge */}
          {route.badge && (
            <motion.span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center z-20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {typeof route.badge === 'number' && route.badge > 9 ? '9+' : route.badge}
            </motion.span>
          )}

          {/* Active Indicator */}
          {isActive && (
            <motion.div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-lime-500 to-purple-500 rounded-b-full"
              layoutId="activeIndicator"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.a>
      </motion.div>
    );
  };

  const OverflowMenu: React.FC = () => {
    const [showMenu, setShowMenu] = useState(false);
    const hiddenRoutes = routes.slice(state.visibleItems.length);

    return (
      <div className="relative flex-1 flex justify-center">
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            'flex flex-col items-center justify-center p-2 min-h-16 rounded-xl transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2',
            'text-gray-500 hover:text-lime-600'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="More navigation options"
          aria-expanded={showMenu}
        >
          <motion.div
            className="w-6 h-6 mb-1"
            animate={{ rotate: showMenu ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </motion.div>
          <span className="text-xs font-medium">More</span>
        </motion.button>

        {/* Overflow Menu */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/20 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <motion.div
                className={cn(
                  'absolute bottom-full right-0 mb-2 p-2 rounded-xl shadow-xl border z-50',
                  variant === 'floating'
                    ? 'bg-white/90 backdrop-blur-md border-white/20'
                    : 'bg-white border-gray-200'
                )}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-2 min-w-32">
                  {hiddenRoutes.map((route) => {
                    const isActive = isRouteActive(route);
                    return (
                      <motion.a
                        key={route.id}
                        href={route.path}
                        onClick={() => setShowMenu(false)}
                        className={cn(
                          'flex flex-col items-center p-3 rounded-lg transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-lime-500',
                          isActive
                            ? 'bg-lime-50 text-lime-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-5 h-5 mb-1">
                          {route.icon}
                        </div>
                        <span className="text-xs font-medium">{route.name}</span>
                        {route.badge && (
                          <span className="mt-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {typeof route.badge === 'number' && route.badge > 9 ? '9+' : route.badge}
                          </span>
                        )}
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const variantClasses = {
    default: 'bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg',
    floating: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-t-2xl mx-4 mb-4'
  };

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 safe-area-pb',
        'lg:hidden', // Hide on desktop
        variantClasses[variant],
        className
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {state.visibleItems.map((route, index) => (
          <NavItem key={route.id} route={route} index={index} />
        ))}
        
        {state.showOverflow && <OverflowMenu />}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </motion.nav>
  );
};

// Floating variant with glass morphism
export const FloatingBottomNav: React.FC<BottomNavProps> = (props) => {
  return <BottomNav {...props} variant="floating" />;
};

// Adaptive bottom navigation that changes based on context
export const AdaptiveBottomNav: React.FC<BottomNavProps & { context?: 'cooking' | 'planning' | 'shopping' }> = ({
  routes,
  context,
  ...props
}) => {
  // Reorder routes based on context
  const contextualRoutes = React.useMemo(() => {
    if (!context) return routes;

    const routeOrder = {
      cooking: ['recipes', 'pantry', 'shopping', 'planner', 'home'],
      planning: ['planner', 'recipes', 'pantry', 'shopping', 'home'],
      shopping: ['shopping', 'pantry', 'recipes', 'planner', 'home']
    };

    const order = routeOrder[context] || [];
    const sortedRoutes = [...routes].sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sortedRoutes;
  }, [routes, context]);

  return <BottomNav {...props} routes={contextualRoutes} variant="floating" />;
};

export default BottomNav;