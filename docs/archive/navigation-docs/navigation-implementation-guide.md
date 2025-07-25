# Navigation Implementation Guide

## Project Structure

```
src/
├── components/
│   └── navigation/
│       ├── desktop/
│       │   ├── DesktopNavbar.tsx
│       │   ├── MegaMenu.tsx
│       │   ├── SearchPalette.tsx
│       │   ├── NotificationPanel.tsx
│       │   └── UserMenu.tsx
│       ├── mobile/
│       │   ├── MobileBottomNav.tsx
│       │   ├── MobileDrawer.tsx
│       │   ├── FloatingActionButton.tsx
│       │   ├── QuickActionsMenu.tsx
│       │   └── GestureHandler.tsx
│       ├── shared/
│       │   ├── NavigationProvider.tsx
│       │   ├── NavigationItem.tsx
│       │   ├── Badge.tsx
│       │   └── Ripple.tsx
│       └── index.ts
├── hooks/
│   ├── useNavigation.ts
│   ├── useGesture.ts
│   ├── useMediaQuery.ts
│   └── useKeyboardNavigation.ts
└── styles/
    └── navigation/
        ├── desktop.module.css
        ├── mobile.module.css
        └── animations.css
```

## Core Components Implementation

### 1. NavigationProvider

```typescript
// components/navigation/shared/NavigationProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface NavigationContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentPath: string;
  isDrawerOpen: boolean;
  isSearchOpen: boolean;
  isQuickActionsOpen: boolean;
  toggleDrawer: () => void;
  toggleSearch: () => void;
  toggleQuickActions: () => void;
  closeAll: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1199px)');
  const isDesktop = useMediaQuery('(min-width: 1200px)');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Close all panels on route change
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsSearchOpen(false);
    setIsQuickActionsOpen(false);
  }, [pathname]);

  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const toggleSearch = () => setIsSearchOpen(prev => !prev);
  const toggleQuickActions = () => setIsQuickActionsOpen(prev => !prev);
  
  const closeAll = () => {
    setIsDrawerOpen(false);
    setIsSearchOpen(false);
    setIsQuickActionsOpen(false);
  };

  return (
    <NavigationContext.Provider
      value={{
        isMobile,
        isTablet,
        isDesktop,
        currentPath: pathname,
        isDrawerOpen,
        isSearchOpen,
        isQuickActionsOpen,
        toggleDrawer,
        toggleSearch,
        toggleQuickActions,
        closeAll,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
```

### 2. Gesture Handler Implementation

```typescript
// components/navigation/mobile/GestureHandler.tsx
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigation } from '@/hooks/useNavigation';

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function GestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: GestureHandlerProps) {
  const { isMobile } = useNavigation();
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Horizontal swipes
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x > 75 && velocity.x > 0.3) {
        onSwipeRight?.();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } else if (offset.x < -75 && velocity.x < -0.3) {
        onSwipeLeft?.();
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }
    
    // Vertical swipes
    else {
      if (offset.y > 100 && velocity.y > 0.5) {
        onSwipeDown?.();
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } else if (offset.y < -100 && velocity.y < -0.5) {
        onSwipeUp?.();
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <motion.div
      ref={constraintsRef}
      style={{ x, y }}
      drag
      dragElastic={0.1}
      dragConstraints={constraintsRef}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. Mobile Bottom Navigation

```typescript
// components/navigation/mobile/MobileBottomNav.tsx
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ChefHat, Calendar, ShoppingCart, User } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'home', href: '/dashboard', icon: Home, label: 'Home' },
  { id: 'recipes', href: '/recipes', icon: ChefHat, label: 'Recipes' },
  { id: 'planner', href: '/planner', icon: Calendar, label: 'Planner' },
  { id: 'pantry', href: '/pantry', icon: ShoppingCart, label: 'Pantry', badge: 3 },
  { id: 'profile', href: '/profile', icon: User, label: 'Profile' },
];

export function MobileBottomNav() {
  const { currentPath } = useNavigation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <div className="glass border-t border-white/10">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center py-2 rounded-xl transition-all",
                  "active:scale-95 hover:bg-white/5",
                  isActive && "bg-white/10"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-colors",
                      isActive ? "text-primary" : "text-gray-400"
                    )} 
                  />
                  {item.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                               flex items-center justify-center px-1 text-[10px] 
                               font-bold rounded-full bg-red-500 text-white"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </motion.div>
                <span 
                  className={cn(
                    "text-xs mt-1 transition-colors",
                    isActive ? "text-primary font-medium" : "text-gray-400"
                  )}
                >
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

### 4. Desktop Navigation Bar

```typescript
// components/navigation/desktop/DesktopNavbar.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { MegaMenu } from './MegaMenu';
import { SearchPalette } from './SearchPalette';
import { NotificationPanel } from './NotificationPanel';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { 
    id: 'recipes', 
    href: '/recipes', 
    label: 'Recipes',
    hasMegaMenu: true,
  },
  { 
    id: 'planner', 
    href: '/planner', 
    label: 'Meal Planner',
    hasDropdown: true,
  },
  { 
    id: 'pantry', 
    href: '/pantry', 
    label: 'Pantry',
    hasDropdown: true,
  },
  { id: 'analytics', href: '/analytics', label: 'Analytics' },
];

export function DesktopNavbar() {
  const { currentPath, toggleSearch } = useNavigation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 glass border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <span className="text-2xl font-bold bg-gradient-to-r 
                                 from-primary to-primary-dark bg-clip-text 
                                 text-transparent">
                    KeCarajoComer
                  </span>
                </motion.div>
              </Link>

              {/* Navigation Items */}
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => item.hasDropdown || item.hasMegaMenu 
                      ? setActiveDropdown(item.id) 
                      : null
                    }
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium",
                        "transition-all duration-200 relative",
                        currentPath.startsWith(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      )}
                    >
                      {item.label}
                      {(item.hasDropdown || item.hasMegaMenu) && (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      
                      {/* Active indicator */}
                      {currentPath.startsWith(item.href) && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>

                    {/* Dropdown/Mega Menu */}
                    <AnimatePresence>
                      {activeDropdown === item.id && item.hasMegaMenu && (
                        <MegaMenu itemId={item.id} />
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSearch}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <NotificationPanel onClose={() => setShowNotifications(false)} />
                  )}
                </AnimatePresence>
              </div>

              {/* Settings */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg 
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <img
                    src="/api/placeholder/32/32"
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <UserMenu onClose={() => setShowUserMenu(false)} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Palette */}
      <SearchPalette />
    </>
  );
}
```

## Implementation Steps

### Phase 1: Core Setup (Week 1)
1. **Day 1-2**: Set up NavigationProvider and context
2. **Day 3-4**: Implement responsive detection and base components
3. **Day 5**: Create shared components (Badge, Ripple, etc.)

### Phase 2: Mobile Implementation (Week 2)
1. **Day 1-2**: Implement MobileBottomNav with animations
2. **Day 3-4**: Add GestureHandler with swipe detection
3. **Day 5**: Implement FloatingActionButton and QuickActions

### Phase 3: Desktop Implementation (Week 3)
1. **Day 1-2**: Build DesktopNavbar with dropdowns
2. **Day 3**: Implement SearchPalette with keyboard shortcuts
3. **Day 4-5**: Add NotificationPanel and UserMenu

### Phase 4: Polish & Testing (Week 4)
1. **Day 1-2**: Add animations and transitions
2. **Day 3**: Implement keyboard navigation
3. **Day 4-5**: Testing and bug fixes

## Testing Strategy

### Unit Tests
```typescript
// __tests__/navigation/NavigationProvider.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { NavigationProvider, useNavigation } from '@/components/navigation/shared/NavigationProvider';

describe('NavigationProvider', () => {
  it('provides navigation context', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: NavigationProvider,
    });

    expect(result.current.isMobile).toBeDefined();
    expect(result.current.toggleDrawer).toBeInstanceOf(Function);
  });
});
```

### Integration Tests
```typescript
// __tests__/navigation/MobileNavigation.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { MobileBottomNav } from '@/components/navigation/mobile/MobileBottomNav';

describe('MobileBottomNav', () => {
  it('navigates to correct route on tap', () => {
    const { getByText } = render(<MobileBottomNav />);
    const recipesTab = getByText('Recipes');
    
    fireEvent.click(recipesTab);
    expect(window.location.pathname).toBe('/recipes');
  });
});
```

### E2E Tests
```typescript
// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('desktop navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Recipes');
    await expect(page).toHaveURL('/recipes');
  });

  test('mobile gestures work', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return; // Touch events only in Chrome
    
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    
    // Simulate swipe gesture
    await page.touchscreen.swipe({
      startX: 20,
      startY: 400,
      endX: 300,
      endY: 400,
      steps: 10,
    });
    
    // Check drawer opened
    await expect(page.locator('.mobile-drawer')).toBeVisible();
  });
});
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const SearchPalette = dynamic(() => import('./SearchPalette'), {
  loading: () => <div className="search-skeleton" />,
});

const MegaMenu = dynamic(() => import('./MegaMenu'), {
  ssr: false,
});
```

### Animation Optimization
```typescript
// Use CSS transforms for better performance
const animationVariants = {
  hidden: { 
    opacity: 0, 
    transform: 'translateY(-10px)',
  },
  visible: { 
    opacity: 1, 
    transform: 'translateY(0)',
    transition: { 
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1], // Material easing
    },
  },
};
```

### Bundle Size Optimization
```typescript
// Tree-shake icons
import { Home, ChefHat, Calendar } from 'lucide-react';

// Instead of
import * as Icons from 'lucide-react';
```

## Deployment Checklist

- [ ] All components implemented and tested
- [ ] Responsive behavior verified on all breakpoints
- [ ] Keyboard navigation fully functional
- [ ] Gestures work on touch devices
- [ ] Performance metrics meet targets
- [ ] Accessibility audit passed
- [ ] Browser compatibility verified
- [ ] Documentation complete
- [ ] Analytics tracking implemented
- [ ] Error boundaries in place