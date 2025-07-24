import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  locale: 'en',
  locales: ['en', 'es'],
  defaultLocale: 'en',
};

// Create a test query client with shorter timeouts
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const user = userEvent.setup();
  const view = render(ui, { wrapper: AllTheProviders, ...options });
  
  return {
    user,
    ...view,
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Testing data factories
export const createMockRecipe = (overrides = {}) => ({
  id: 'test-recipe-1',
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: [
    { id: '1', name: 'Ingredient 1', amount: 100, unit: 'g' },
    { id: '2', name: 'Ingredient 2', amount: 200, unit: 'ml' },
  ],
  instructions: ['Step 1', 'Step 2', 'Step 3'],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'medium',
  nutrition: {
    calories: 250,
    protein: 20,
    carbs: 30,
    fat: 10,
  },
  ...overrides,
});

export const createMockPantryItem = (overrides = {}) => ({
  id: 'test-item-1',
  name: 'Test Item',
  quantity: 1,
  unit: 'piece',
  category: 'produce',
  expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  location: 'fridge',
  ...overrides,
});

export const createMockMealPlan = (overrides = {}) => ({
  id: 'test-meal-plan-1',
  date: new Date().toISOString(),
  meals: {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  },
  ...overrides,
});

// Accessibility testing helpers
export const checkA11y = async (container: HTMLElement) => {
  const { axe } = await import('jest-axe');
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Mock implementations for common services
export const mockSupabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ data: [], error: null }),
    delete: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

// Wait utilities
export const waitForLoadingToFinish = () => 
  waitFor(() => {
    const loadingElements = [...screen.queryAllByText(/loading/i), ...screen.queryAllByTestId('skeleton')];
    expect(loadingElements).toHaveLength(0);
  });

// Form testing helpers
export const fillForm = async (user: ReturnType<typeof userEvent.setup>, fields: Record<string, string>) => {
  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, value);
  }
};

// API mocking helpers
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  });
};

export const resetMocks = () => {
  jest.clearAllMocks();
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    global.fetch.mockReset();
  }
};

// Component testing patterns
export const testComponentAccessibility = (Component: React.ComponentType<any>, props = {}) => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Component {...props} />);
    await checkA11y(container);
  });
};

export const testComponentSnapshot = (Component: React.ComponentType<any>, props = {}) => {
  it('should match snapshot', () => {
    const { container } = render(<Component {...props} />);
    expect(container.firstChild).toMatchSnapshot();
  });
};

// Performance testing helper
export const measureRenderTime = async (Component: React.ComponentType<any>, props = {}) => {
  const start = performance.now();
  render(<Component {...props} />);
  const end = performance.now();
  return end - start;
};