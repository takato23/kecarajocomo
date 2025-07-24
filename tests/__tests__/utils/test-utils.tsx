import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import userEvent from '@testing-library/user-event';

// Mock messages for internationalization
const messages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
  },
  pantry: {
    title: 'Pantry',
    addItem: 'Add Item',
    editItem: 'Edit Item',
    deleteItem: 'Delete Item',
    itemName: 'Item Name',
    quantity: 'Quantity',
    unit: 'Unit',
    category: 'Category',
    location: 'Location',
    expirationDate: 'Expiration Date',
    cost: 'Cost',
    notes: 'Notes',
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
  },
  dashboard: {
    welcome: 'Welcome',
    overview: 'Overview',
    recentActivity: 'Recent Activity',
    upcomingMeals: 'Upcoming Meals',
    pantryStatus: 'Pantry Status',
  },
};

// Create a custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
  queryClient?: QueryClient;
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

export const AllTheProviders = ({
  children,
  locale = 'en',
  queryClient = createTestQueryClient(),
}: {
  children: React.ReactNode;
  locale?: string;
  queryClient?: QueryClient;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  {
    locale = 'en',
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders locale={locale} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Utility functions for common test scenarios
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPantryItem = (overrides = {}) => ({
  id: 'test-item-id',
  user_id: 'test-user-id',
  ingredient_id: 'test-ingredient-id',
  ingredient_name: 'Test Item',
  quantity: 1,
  unit: 'pieces',
  expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  location: 'Pantry',
  category: 'Other',
  cost: 5.99,
  notes: 'Test notes',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockRecipe = (overrides = {}) => ({
  id: 'test-recipe-id',
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: [
    {
      id: 'ingredient-1',
      ingredient_id: 'test-ingredient-1',
      ingredient_name: 'Test Ingredient 1',
      quantity: 1,
      unit: 'cup',
      preparation: 'chopped',
      optional: false,
    },
  ],
  instructions: ['Step 1', 'Step 2', 'Step 3'],
  nutrition: {
    calories: 300,
    protein: 20,
    carbs: 30,
    fat: 10,
  },
  cook_time: 30,
  prep_time: 15,
  servings: 4,
  tags: ['test', 'recipe'],
  ai_generated: false,
  created_by: 'test-user-id',
  created_at: new Date(),
  ...overrides,
});

export const createMockMealPlan = (overrides = {}) => ({
  id: 'test-meal-plan-id',
  user_id: 'test-user-id',
  week_start: new Date(),
  meals: [
    {
      id: 'test-meal-id',
      meal_plan_id: 'test-meal-plan-id',
      recipe_id: 'test-recipe-id',
      day: 0,
      meal_type: 'dinner' as const,
      servings: 2,
    },
  ],
  created_at: new Date(),
  ...overrides,
});

// Custom matchers for common assertions
export const expectToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectNotToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument();
};

// Mock fetch responses
export const mockFetchResponse = (data: any, options: { status?: number; ok?: boolean } = {}) => {
  const { status = 200, ok = true } = options;
  
  return jest.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};

export const mockFetchError = (error: string, status = 500) => {
  return jest.fn().mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error }),
    text: async () => error,
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};

// Utility to mock Supabase client
export const createMockSupabaseClient = () => {
  const auth = {
    getUser: jest.fn().mockResolvedValue({
      data: { user: createMockUser() },
      error: null,
    }),
    signIn: jest.fn().mockResolvedValue({
      data: { user: createMockUser(), session: {} },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: createMockUser(), session: {} },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };

  const from = jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  }));

  return {
    auth,
    from,
  };
};

// Utility to wait for async state updates
export const waitForStateUpdate = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

// Mock window methods
export const mockWindowLocation = (url: string) => {
  delete (window as any).location;
  window.location = { href: url } as any;
};

export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
  };
};

// Setup mock localStorage
export const setupMockLocalStorage = () => {
  const mockStorage = mockLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  return mockStorage;
};

// Utility to test accessibility
export const checkAccessibility = async (container: HTMLElement) => {
  const results = await import('jest-axe').then(({ axe }) => axe(container));
  expect(results).toHaveNoViolations();
};