require('@testing-library/jest-dom')
const { toHaveNoViolations } = require('jest-axe')

// Add custom jest-axe matchers
expect.extend(toHaveNoViolations)
const { TextEncoder, TextDecoder } = require('util')

// Polyfill TextEncoder/TextDecoder for Node environment
Object.assign(global, { TextEncoder, TextDecoder })

// Polyfill Request/Response for Node environment
global.Request = class Request {
  constructor(input, init) {
    // Use defineProperty to create read-only properties
    Object.defineProperty(this, 'url', {
      value: input,
      writable: false,
      enumerable: true,
      configurable: true
    });
    
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this.body = init?.body
    
    // Create nextUrl with searchParams for Next.js compatibility
    const url = new URL(input, 'http://localhost')
    Object.defineProperty(this, 'nextUrl', {
      value: {
        searchParams: url.searchParams,
        pathname: url.pathname,
        search: url.search,
        href: url.href
      },
      writable: false,
      enumerable: true,
      configurable: true
    });
  }
  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body) : {})
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body))
  }
  static json(body, init) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
  }
}

// Temporarily disable MSW to debug issue
// const { setupServer } = require('msw/lib/node/index.js')
// const { handlers } = require('./__tests__/mocks/handlers')

// Setup MSW server
// const server = setupServer(...handlers)
// module.exports = { server }

// Enable API mocking before all tests
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers between tests
// afterEach(() => server.resetHandlers())

// Clean up after all tests
// afterAll(() => server.close())

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    },
    status: 'authenticated'
  })),
  SessionProvider: ({ children }) => children,
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn((callback) => callback({ data: null, error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
}))

// Mock AI services
jest.mock('@/lib/services/geminiService', () => ({
  callGeminiWeeklyPlan: jest.fn(),
  callGeminiRegenerateMeal: jest.fn(),
  callGeminiAlternatives: jest.fn(),
}))

jest.mock('@/lib/services/mealPlanningAI', () => ({
  generateWeeklyPlan: jest.fn(),
  regenerateMeal: jest.fn(),
  generateAlternatives: jest.fn(),
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  return {
    __esModule: true,
    default: jest.fn((date) => {
      if (!date) {
        return originalDayjs('2024-01-15T00:00:00Z'); // Fixed date for tests
      }
      return originalDayjs(date);
    }),
    extend: jest.fn(),
  };
})

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

// Mock window.matchMedia for PWA
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
})

// Mock navigator for PWA
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      active: {},
      sync: {
        register: jest.fn(),
      },
    }),
    addEventListener: jest.fn(),
    controller: {},
  },
})

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})

// Mock Notification API
global.Notification = jest.fn(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
}))
global.Notification.permission = 'granted'
global.Notification.requestPermission = jest.fn().mockResolvedValue('granted')

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})