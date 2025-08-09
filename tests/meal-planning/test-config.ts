import { configure } from '@testing-library/react';
import '@testing-library/jest-dom';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000,
  computedStyleSupportsPseudoElements: true,
});

// Global test setup for meal planning tests
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Mock window.matchMedia for responsive tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock fetch globally
  global.fetch = jest.fn();

  // Mock performance.now for timing tests
  global.performance.now = jest.fn(() => Date.now());

  // Mock URL.createObjectURL and revokeObjectURL for file exports
  global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
  global.URL.revokeObjectURL = jest.fn();

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: Object.keys(store).length,
      key: (index: number) => Object.keys(store)[index] || null,
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock navigator for PWA tests
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: jest.fn(() => Promise.resolve()),
      ready: Promise.resolve({
        update: jest.fn(),
        unregister: jest.fn(),
      }),
    },
    writable: true,
  });

  // Mock geolocation for location-based features
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: jest.fn((success) =>
        success({
          coords: {
            latitude: -34.6037,
            longitude: -58.3816, // Buenos Aires coordinates
            accuracy: 100,
          },
        })
      ),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
    writable: true,
  });

  // Mock notification API
  Object.defineProperty(window, 'Notification', {
    value: {
      permission: 'granted',
      requestPermission: jest.fn(() => Promise.resolve('granted')),
    },
    writable: true,
  });

  // Mock crypto for ID generation
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockReset();
  
  // Default successful fetch response
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
  });
});

afterEach(() => {
  // Clean up any side effects
  document.body.innerHTML = '';
  
  // Reset timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Custom matchers for meal planning tests
expect.extend({
  toBeValidMealSlot(received) {
    const pass = (
      received &&
      typeof received.id === 'string' &&
      typeof received.dayOfWeek === 'number' &&
      received.dayOfWeek >= 0 &&
      received.dayOfWeek <= 6 &&
      ['desayuno', 'almuerzo', 'merienda', 'cena'].includes(received.mealType) &&
      typeof received.servings === 'number' &&
      received.servings > 0 &&
      typeof received.isLocked === 'boolean' &&
      typeof received.isCompleted === 'boolean'
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid meal slot`
          : `Expected ${JSON.stringify(received)} to be a valid meal slot`,
    };
  },

  toBeValidRecipe(received) {
    const pass = (
      received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      received.name.length > 0 &&
      typeof received.description === 'string' &&
      typeof received.prepTime === 'number' &&
      received.prepTime >= 0 &&
      typeof received.cookTime === 'number' &&
      received.cookTime >= 0 &&
      typeof received.servings === 'number' &&
      received.servings > 0 &&
      ['easy', 'medium', 'hard'].includes(received.difficulty) &&
      Array.isArray(received.ingredients) &&
      received.ingredients.length > 0 &&
      Array.isArray(received.instructions) &&
      received.instructions.length > 0
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid recipe`
          : `Expected ${JSON.stringify(received)} to be a valid recipe`,
    };
  },

  toBeValidWeekPlan(received) {
    const pass = (
      received &&
      typeof received.id === 'string' &&
      typeof received.userId === 'string' &&
      typeof received.startDate === 'string' &&
      typeof received.endDate === 'string' &&
      Array.isArray(received.slots) &&
      typeof received.isActive === 'boolean'
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${JSON.stringify(received)} not to be a valid week plan`
          : `Expected ${JSON.stringify(received)} to be a valid week plan`,
    };
  },

  toHaveValidDateRange(received) {
    const startDate = new Date(received.startDate);
    const endDate = new Date(received.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    const pass = (
      !isNaN(startDate.getTime()) &&
      !isNaN(endDate.getTime()) &&
      daysDiff === 6 // Week should be exactly 7 days (6 day difference)
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected date range to be invalid`
          : `Expected valid 7-day date range, got ${daysDiff + 1} days`,
    };
  },

  toHaveCompleteMealSlots(received) {
    const expectedSlots = 28; // 7 days × 4 meals
    const mealTypes = ['desayuno', 'almuerzo', 'merienda', 'cena'];
    
    const slotsPerDay = Array.from({ length: 7 }, (_, day) => 
      received.slots.filter((slot: any) => slot.dayOfWeek === day)
    );
    
    const hasAllMealTypes = slotsPerDay.every(daySlots =>
      mealTypes.every(mealType =>
        daySlots.some((slot: any) => slot.mealType === mealType)
      )
    );

    const pass = (
      received.slots.length === expectedSlots &&
      hasAllMealTypes
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected week plan not to have complete meal slots`
          : `Expected week plan to have ${expectedSlots} slots with all meal types, got ${received.slots.length} slots`,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMealSlot(): R;
      toBeValidRecipe(): R;
      toBeValidWeekPlan(): R;
      toHaveValidDateRange(): R;
      toHaveCompleteMealSlots(): R;
    }
  }
}

// Export test utilities
export const testUtils = {
  // Wait for async operations
  waitForAsync: (ms: number = 0) => 
    new Promise(resolve => setTimeout(resolve, ms)),

  // Mock timer helpers
  advanceTimers: (ms: number) => {
    jest.advanceTimersByTime(ms);
  },

  // Mock network conditions
  mockNetworkError: () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
  },

  mockSlowNetwork: (delay: number = 2000) => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), delay)
      )
    );
  },

  // Mock API responses
  mockAPIResponse: (data: any, status: number = 200) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  },

  mockAPIError: (status: number = 500, message: string = 'Server error') => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error: message }),
      text: () => Promise.resolve(message),
    });
  },

  // Performance testing
  measurePerformance: async (fn: () => Promise<void> | void): Promise<number> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  // Memory leak detection
  checkMemoryLeaks: () => {
    // Simplified memory leak detection
    const eventListeners = document.eventListeners?.length || 0;
    const timeouts = (global as any).__timeouts?.length || 0;
    const intervals = (global as any).__intervals?.length || 0;
    
    return {
      eventListeners,
      timeouts,
      intervals,
      total: eventListeners + timeouts + intervals,
    };
  },

  // Component testing helpers
  createMockComponent: (name: string, props?: any) => {
    return function MockComponent(componentProps: any) {
      return React.createElement('div', {
        'data-testid': `mock-${name.toLowerCase()}`,
        'data-props': JSON.stringify({ ...props, ...componentProps }),
      }, `Mock ${name}`);
    };
  },

  // Date helpers for testing
  createDateInTimezone: (dateString: string, timezone: string = 'America/Argentina/Buenos_Aires') => {
    // Simplified timezone creation for testing
    return new Date(dateString);
  },
};