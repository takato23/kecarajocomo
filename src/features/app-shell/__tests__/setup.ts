import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });

  // Mock console methods to reduce test noise
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion to prevent animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    nav: 'nav',
    aside: 'aside',
    header: 'header',
    main: 'main',
    button: 'button',
    a: 'a',
    span: 'span',
    ul: 'ul',
    li: 'li',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Global test utilities
export const mockRoute = {
  id: 'test',
  path: '/test',
  name: 'Test',
  icon: <div data-testid="test-icon">Test Icon</div>,
};

export const mockRoutes = [
  {
    id: 'home',
    path: '/app',
    name: 'Dashboard',
    icon: <div data-testid="home-icon">Home</div>,
  },
  {
    id: 'planner',
    path: '/app/planner',
    name: 'Meal Planner',
    icon: <div data-testid="planner-icon">Planner</div>,
  },
  {
    id: 'recipes',
    path: '/app/recipes',
    name: 'Recipes',
    icon: <div data-testid="recipes-icon">Recipes</div>,
  },
];

export const mockNavigationConfig = {
  sidebar: mockRoutes,
  bottomNav: mockRoutes,
  header: {
    showSearch: true,
    showNotifications: true,
    showProfile: true,
    showLogo: true,
    title: 'KeCaraJoComer',
  },
};

// Helper to mock window dimensions
export const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Helper to mock viewport
export const mockViewport = {
  mobile: () => mockWindowDimensions(375, 812),
  tablet: () => mockWindowDimensions(768, 1024),
  desktop: () => mockWindowDimensions(1280, 800),
  large: () => mockWindowDimensions(1920, 1080),
};

// Helper to create mock user
export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    theme: 'light' as const,
    language: 'en',
    notifications: {
      email: true,
      push: true,
      mealReminders: true,
      shoppingReminders: true,
      expirationAlerts: true,
    },
    privacy: {
      shareRecipes: false,
      showActivity: true,
      allowAnalytics: false,
    },
  },
};

// Helper to create mock notifications
export const mockNotifications = [
  {
    id: 'notif-1',
    type: 'info' as const,
    title: 'Meal reminder',
    message: 'Time for lunch!',
    timestamp: new Date(),
    read: false,
  },
  {
    id: 'notif-2',
    type: 'warning' as const,
    title: 'Expiring soon',
    message: 'Milk expires tomorrow',
    timestamp: new Date(),
    read: false,
  },
];