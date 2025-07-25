/**
 * Setup file for meal planning tests
 */

// Mock environment variables
process.env.GOOGLE_AI_API_KEY = 'test-gemini-api-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.sessionStorage = sessionStorageMock;

// Mock fetch globally
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/meal-planning',
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}));

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    promise: jest.fn(),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString();
  }),
  startOfWeek: jest.fn((date) => {
    const result = new Date(date);
    result.setDate(date.getDate() - date.getDay() + 1);
    return result;
  }),
  addDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
  }),
  addWeeks: jest.fn((date, weeks) => {
    const result = new Date(date);
    result.setDate(date.getDate() + weeks * 7);
    return result;
  }),
  isSameDay: jest.fn((date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  }),
  es: {},
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ children, ...props }) => <div {...props}>{children || 'Icon'}</div>;
  
  return {
    Calendar: MockIcon,
    Settings: MockIcon,
    ShoppingCart: MockIcon,
    BarChart3: MockIcon,
    Sparkles: MockIcon,
    Download: MockIcon,
    Share2: MockIcon,
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    Plus: MockIcon,
    Trash2: MockIcon,
    Edit: MockIcon,
    Lock: MockIcon,
    Unlock: MockIcon,
    Star: MockIcon,
    Clock: MockIcon,
    Users: MockIcon,
    ChefHat: MockIcon,
  };
});

// Global test utilities
global.testUtils = {
  // Helper to create mock dates
  createMockDate: (dateString) => new Date(dateString),
  
  // Helper to create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  }),
  
  // Helper to create mock preferences
  createMockPreferences: (overrides = {}) => ({
    userId: 'test-user-id',
    dietaryRestrictions: ['omnivore'],
    allergies: [],
    favoriteCuisines: ['mediterránea'],
    cookingSkillLevel: 'intermediate',
    householdSize: 2,
    weeklyBudget: 500,
    maxPrepTimePerMeal: 60,
    preferredMealTypes: ['breakfast', 'lunch', 'dinner'],
    ...overrides,
  }),
  
  // Helper to create mock recipe
  createMockRecipe: (overrides = {}) => ({
    id: 'test-recipe-id',
    name: 'Test Recipe',
    description: 'Test description',
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: [],
    instructions: [],
    dietaryLabels: [],
    tags: [],
    cuisine: 'Test',
    isAiGenerated: false,
    isFavorite: false,
    ...overrides,
  }),
  
  // Helper to wait for async operations
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
};

// Console warnings/errors suppression for tests
const originalError = console.error;
const originalWarn = console.warn;

global.beforeAll = global.beforeAll || (() => {});
global.afterAll = global.afterAll || (() => {});

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('ReactDOM.render is no longer supported'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});