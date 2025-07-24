# Testing Documentation

## Overview

KeCaraJoComer implements a comprehensive testing strategy covering unit tests, integration tests, end-to-end tests, and accessibility testing. The testing approach ensures code quality, functionality, and user experience across all features.

## Testing Stack

### Core Testing Tools

- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW (Mock Service Worker)**: API mocking for tests
- **Jest-Axe**: Accessibility testing
- **Storybook**: Visual testing and component documentation

### Testing Environment

```json
{
  "testEnvironment": "jest-environment-jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
```

## Test Categories

### Unit Tests

Unit tests focus on individual components, functions, and modules in isolation.

#### Component Testing

```typescript
// Example: Button component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/design-system/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading...</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });
});
```

#### Store Testing

```typescript
// Example: PantryStore test
import { usePantryStore } from '@/features/pantry/store/pantryStore';

describe('PantryStore', () => {
  beforeEach(() => {
    usePantryStore.setState({
      items: [],
      stats: null,
      isLoading: false,
      error: null
    });
  });

  it('adds item to pantry', () => {
    const store = usePantryStore.getState();
    const newItem = {
      id: '1',
      ingredient_name: 'Tomatoes',
      quantity: 5,
      unit: 'pieces',
      expiration_date: new Date('2024-01-15'),
      location: 'refrigerator'
    };

    store.addItem(newItem);
    expect(store.items).toContain(newItem);
  });

  it('updates item quantity', () => {
    const store = usePantryStore.getState();
    const item = { id: '1', quantity: 5 };
    
    store.addItem(item);
    store.updateItem('1', { quantity: 3 });
    
    expect(store.items[0].quantity).toBe(3);
  });

  it('removes item from pantry', () => {
    const store = usePantryStore.getState();
    const item = { id: '1', ingredient_name: 'Tomatoes' };
    
    store.addItem(item);
    store.removeItem('1');
    
    expect(store.items).toHaveLength(0);
  });
});
```

#### Service Testing

```typescript
// Example: API service test
import { fetchPantryItems } from '@/features/pantry/services/pantryService';

// Mock fetch globally
global.fetch = jest.fn();

describe('PantryService', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('fetches pantry items successfully', async () => {
    const mockItems = [
      { id: '1', ingredient_name: 'Tomatoes', quantity: 5 },
      { id: '2', ingredient_name: 'Milk', quantity: 1 }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockItems, success: true })
    });

    const result = await fetchPantryItems();
    expect(result).toEqual(mockItems);
    expect(fetch).toHaveBeenCalledWith('/api/pantry/items');
  });

  it('handles fetch errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    await expect(fetchPantryItems()).rejects.toThrow('API Error');
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

#### Feature Integration

```typescript
// Example: Recipe generation integration test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeGenerator } from '@/features/recipes/components/AiRecipeGenerator';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Recipe Generation Integration', () => {
  it('generates recipe using pantry ingredients', async () => {
    // Mock API response
    server.use(
      rest.post('/features/recipes/api/generate/claude', (req, res, ctx) => {
        return res(ctx.json({
          recipe: {
            title: 'Tomato Pasta',
            ingredients: [
              { name: 'tomatoes', quantity: 3, unit: 'pieces' },
              { name: 'pasta', quantity: 200, unit: 'g' }
            ],
            instructions: [
              { step_number: 1, text: 'Cook pasta' },
              { step_number: 2, text: 'Add tomatoes' }
            ]
          }
        }));
      })
    );

    render(
      <RecipeGenerator
        availableIngredients={['tomatoes', 'pasta']}
        onRecipeGenerated={jest.fn()}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Recipe description'), {
      target: { value: 'Pasta with tomatoes' }
    });
    
    fireEvent.click(screen.getByText('Generate Recipe'));

    // Wait for generation
    await waitFor(() => {
      expect(screen.getByText('Tomato Pasta')).toBeInTheDocument();
    });

    expect(screen.getByText('Cook pasta')).toBeInTheDocument();
    expect(screen.getByText('Add tomatoes')).toBeInTheDocument();
  });
});
```

#### Cross-Feature Integration

```typescript
// Example: Pantry to meal planner integration
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MealPlannerPage } from '@/features/planner/page';
import { usePantryStore } from '@/features/pantry/store/pantryStore';

describe('Meal Planner Integration', () => {
  it('suggests recipes based on pantry items', async () => {
    // Setup pantry items
    usePantryStore.setState({
      items: [
        { ingredient_name: 'tomatoes', quantity: 5 },
        { ingredient_name: 'pasta', quantity: 1 },
        { ingredient_name: 'cheese', quantity: 200 }
      ]
    });

    render(<MealPlannerPage />);

    // Open meal suggestions
    fireEvent.click(screen.getByText('Get Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Based on your pantry')).toBeInTheDocument();
    });

    // Should suggest recipes using available ingredients
    expect(screen.getByText('Pasta with Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Cheesy Pasta')).toBeInTheDocument();
  });
});
```

### End-to-End Tests

E2E tests simulate real user interactions across the entire application.

#### Authentication Flow

```typescript
// e2e/auth/authentication.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up and complete onboarding', async ({ page }) => {
    // Navigate to sign up
    await page.goto('/auth/signup');

    // Fill registration form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('h1')).toContainText('Welcome');

    // Complete onboarding steps
    await page.click('[data-testid="get-started-button"]');

    // Profile setup
    await page.fill('[data-testid="full-name"]', 'Test User');
    await page.selectOption('[data-testid="household-size"]', '2');
    await page.click('[data-testid="next-button"]');

    // Dietary preferences
    await page.check('[data-testid="dietary-vegetarian"]');
    await page.check('[data-testid="dietary-dairy-free"]');
    await page.click('[data-testid="next-button"]');

    // Skip remaining steps for test
    await page.click('[data-testid="skip-to-dashboard"]');

    // Should reach dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('user can sign in with existing account', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('[data-testid="email"]', 'existing@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

#### Pantry Management Flow

```typescript
// e2e/pantry/pantry-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Pantry Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as existing user
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('user can add items to pantry', async ({ page }) => {
    await page.goto('/pantry');

    // Open add item form
    await page.click('[data-testid="add-item-button"]');

    // Fill item details
    await page.fill('[data-testid="ingredient-name"]', 'Tomatoes');
    await page.fill('[data-testid="quantity"]', '5');
    await page.selectOption('[data-testid="unit"]', 'pieces');
    await page.fill('[data-testid="expiration-date"]', '2024-01-15');
    await page.selectOption('[data-testid="location"]', 'refrigerator');

    // Save item
    await page.click('[data-testid="save-item-button"]');

    // Verify item appears in list
    await expect(page.locator('[data-testid="pantry-item"]')).toContainText('Tomatoes');
    await expect(page.locator('[data-testid="pantry-item"]')).toContainText('5 pieces');
  });

  test('user can update item quantities', async ({ page }) => {
    await page.goto('/pantry');

    // Click on existing item
    await page.click('[data-testid="pantry-item"]:first-child');

    // Update quantity
    await page.fill('[data-testid="quantity"]', '3');
    await page.click('[data-testid="update-button"]');

    // Verify updated quantity
    await expect(page.locator('[data-testid="pantry-item"]:first-child')).toContainText('3 pieces');
  });

  test('user can consume items', async ({ page }) => {
    await page.goto('/pantry');

    // Click consume button
    await page.click('[data-testid="consume-button"]:first-child');

    // Enter consumed quantity
    await page.fill('[data-testid="consume-quantity"]', '2');
    await page.click('[data-testid="confirm-consume"]');

    // Verify quantity decreased
    await expect(page.locator('[data-testid="pantry-item"]:first-child')).toContainText('1 piece');
  });
});
```

#### Recipe Management Flow

```typescript
// e2e/recipes/recipe-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('user can generate AI recipe', async ({ page }) => {
    await page.goto('/recipes/generate');

    // Fill generation form
    await page.fill('[data-testid="recipe-prompt"]', 'Healthy pasta dish');
    await page.selectOption('[data-testid="cuisine-type"]', 'italian');
    await page.check('[data-testid="dietary-vegetarian"]');
    await page.fill('[data-testid="servings"]', '4');
    await page.fill('[data-testid="max-time"]', '30');

    // Generate recipe
    await page.click('[data-testid="generate-button"]');

    // Wait for generation
    await expect(page.locator('[data-testid="generating-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-recipe"]')).toBeVisible({ timeout: 10000 });

    // Verify recipe details
    await expect(page.locator('[data-testid="recipe-title"]')).toContainText('Pasta');
    await expect(page.locator('[data-testid="recipe-ingredients"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-instructions"]')).toBeVisible();

    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Recipe saved');
  });
});
```

### Accessibility Testing

Accessibility tests ensure the application is usable by people with disabilities.

#### Automated Accessibility Testing

```typescript
// Example: Accessibility test with jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/design-system/Button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes', () => {
    const { container } = render(
      <Button aria-label="Close modal" disabled>
        ×
      </Button>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-label', 'Close modal');
    expect(button).toHaveAttribute('disabled');
  });
});
```

#### Manual Accessibility Testing

```typescript
// e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/pantry');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="add-item-button"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="filter-button"]')).toBeFocused();
  });

  test('screen reader announcements work', async ({ page }) => {
    await page.goto('/pantry');

    // Add item and verify live region announcement
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="ingredient-name"]', 'Test Item');
    await page.click('[data-testid="save-item-button"]');

    // Check for live region announcement
    await expect(page.locator('[aria-live="polite"]')).toContainText('Item added successfully');
  });

  test('focus management in modals', async ({ page }) => {
    await page.goto('/pantry');

    // Open modal
    await page.click('[data-testid="add-item-button"]');

    // Focus should be trapped in modal
    await expect(page.locator('[data-testid="modal-title"]')).toBeFocused();

    // Escape should close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="modal"]')).not.toBeVisible();
  });
});
```

### Visual Testing

Visual tests catch UI regressions and ensure consistent styling.

#### Component Visual Testing

```typescript
// Example: Component snapshot test
import { render } from '@testing-library/react';
import { Button } from '@/components/design-system/Button';

describe('Button Visual Tests', () => {
  it('matches snapshot for primary variant', () => {
    const { container } = render(<Button variant="primary">Primary Button</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary Button</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for loading state', () => {
    const { container } = render(<Button loading>Loading Button</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

#### Storybook Visual Testing

```typescript
// Example: Storybook story for visual testing
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
```

### Performance Testing

Performance tests ensure the application meets performance requirements.

#### Load Testing

```typescript
// Example: Performance test with Playwright
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('pantry page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/pantry');
    await page.waitForSelector('[data-testid="pantry-dashboard"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });

  test('large pantry list renders performantly', async ({ page }) => {
    // Mock large dataset
    await page.route('/api/pantry/items', route => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        ingredient_name: `Item ${i}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unit: 'pieces'
      }));
      
      route.fulfill({
        json: { data: items, success: true }
      });
    });

    const startTime = Date.now();
    await page.goto('/pantry');
    await page.waitForSelector('[data-testid="pantry-item"]');
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000); // 2 second budget for large lists
  });
});
```

#### Bundle Size Testing

```typescript
// Example: Bundle size test
import { execSync } from 'child_process';

describe('Bundle Size', () => {
  it('main bundle is within size budget', () => {
    const bundleSize = getBundleSize('.next/static/chunks/main-*.js');
    expect(bundleSize).toBeLessThan(500 * 1024); // 500KB budget
  });

  it('feature bundles are properly split', () => {
    const pantryBundle = getBundleSize('.next/static/chunks/pantry-*.js');
    const recipesBundle = getBundleSize('.next/static/chunks/recipes-*.js');
    
    expect(pantryBundle).toBeLessThan(100 * 1024); // 100KB per feature
    expect(recipesBundle).toBeLessThan(100 * 1024);
  });
});

function getBundleSize(pattern: string): number {
  const output = execSync(`find .next/static/chunks -name "${pattern}" -exec wc -c {} +`);
  return parseInt(output.toString().split(' ')[0]);
}
```

## Test Data Management

### Test Fixtures

```typescript
// fixtures/pantryItems.ts
export const mockPantryItems = [
  {
    id: '1',
    ingredient_name: 'Tomatoes',
    quantity: 5,
    unit: 'pieces',
    expiration_date: new Date('2024-01-15'),
    location: 'refrigerator',
    category: 'vegetables',
    cost: 3.50,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '2',
    ingredient_name: 'Milk',
    quantity: 1,
    unit: 'liter',
    expiration_date: new Date('2024-01-10'),
    location: 'refrigerator',
    category: 'dairy',
    cost: 2.99,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];
```

### Factory Functions

```typescript
// factories/pantryItemFactory.ts
export function createPantryItem(overrides: Partial<PantryItem> = {}): PantryItem {
  return {
    id: faker.string.uuid(),
    ingredient_name: faker.food.ingredient(),
    quantity: faker.number.int({ min: 1, max: 10 }),
    unit: faker.helpers.arrayElement(['pieces', 'kg', 'liter', 'cups']),
    expiration_date: faker.date.future(),
    location: faker.helpers.arrayElement(['refrigerator', 'pantry', 'freezer']),
    category: faker.helpers.arrayElement(['vegetables', 'dairy', 'grains', 'proteins']),
    cost: faker.number.float({ min: 1, max: 20, precision: 2 }),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    ...overrides
  };
}
```

### Database Seeding

```typescript
// scripts/seedTestDatabase.ts
import { createClient } from '@supabase/supabase-js';
import { mockPantryItems } from '../fixtures/pantryItems';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function seedTestData() {
  // Clear existing data
  await supabase.from('pantry_items').delete().neq('id', '0');
  
  // Insert test data
  await supabase.from('pantry_items').insert(mockPantryItems);
  
  console.log('Test data seeded successfully');
}
```

## Mocking and Stubbing

### API Mocking with MSW

```typescript
// mocks/handlers.ts
import { rest } from 'msw';
import { mockPantryItems } from '../fixtures/pantryItems';

export const handlers = [
  rest.get('/api/pantry/items', (req, res, ctx) => {
    return res(ctx.json({
      data: mockPantryItems,
      success: true
    }));
  }),

  rest.post('/api/pantry/items', (req, res, ctx) => {
    return res(ctx.json({
      data: { id: '3', ...req.body },
      success: true,
      message: 'Item created successfully'
    }));
  }),

  rest.post('/features/recipes/api/generate/claude', (req, res, ctx) => {
    return res(
      ctx.delay(1000), // Simulate API delay
      ctx.json({
        recipe: {
          title: 'Generated Recipe',
          ingredients: [
            { name: 'ingredient1', quantity: 1, unit: 'cup' }
          ],
          instructions: [
            { step_number: 1, text: 'Cook the ingredients' }
          ]
        }
      })
    );
  })
];
```

### Service Mocking

```typescript
// mocks/services.ts
export const mockPantryService = {
  fetchItems: jest.fn().mockResolvedValue(mockPantryItems),
  addItem: jest.fn().mockResolvedValue({ id: '3' }),
  updateItem: jest.fn().mockResolvedValue({ success: true }),
  deleteItem: jest.fn().mockResolvedValue({ success: true }),
  getStats: jest.fn().mockResolvedValue({
    totalItems: 25,
    totalValue: 150.75,
    expiringThisWeek: 3
  })
};
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'features/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Jest Setup

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    query: {},
    pathname: '/',
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
    ['line'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## Test Utilities

### Custom Render Function

```typescript
// utils/test-utils.tsx
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

function render(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { render };
```

### Test Helpers

```typescript
// utils/test-helpers.ts
import { PantryItem } from '@/features/pantry/types';
import { createPantryItem } from '../factories/pantryItemFactory';

export function createMockPantryItems(count: number = 5): PantryItem[] {
  return Array.from({ length: count }, () => createPantryItem());
}

export function waitForLoadingToFinish() {
  return new Promise(resolve => setTimeout(resolve, 100));
}

export function mockIntersectionObserver() {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

export function mockGeolocation() {
  global.navigator.geolocation = {
    getCurrentPosition: jest.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });
    }),
  };
}
```

## Coverage and Reporting

### Coverage Configuration

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "features/pantry/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

### Test Reports

```bash
# Generate coverage report
npm run test:coverage

# Generate HTML coverage report
npm run test:coverage:html

# Generate E2E test report
npm run test:e2e:report
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-results
          path: test-results/
```

## Testing Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions and outcomes
   - Avoid testing internal state or implementation details

2. **Use Descriptive Test Names**
   - Clearly describe what is being tested
   - Include expected behavior and conditions
   - Use consistent naming patterns

3. **Follow AAA Pattern**
   - **Arrange**: Set up test data and conditions
   - **Act**: Execute the code being tested
   - **Assert**: Verify the expected outcome

4. **Keep Tests Independent**
   - Each test should be able to run in isolation
   - Don't rely on test execution order
   - Clean up after each test

5. **Mock External Dependencies**
   - Mock API calls, external services, and third-party libraries
   - Use dependency injection for better testability
   - Keep mocks simple and focused

### Component Testing Guidelines

```typescript
// Good: Testing behavior and user interactions
it('shows error message when form submission fails', async () => {
  const mockSubmit = jest.fn().mockRejectedValue(new Error('API Error'));
  
  render(<PantryItemForm onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Ingredient Name'), {
    target: { value: 'Tomatoes' }
  });
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expect(screen.getByText('Failed to save item')).toBeInTheDocument();
  });
});

// Bad: Testing implementation details
it('calls handleSubmit function when form is submitted', () => {
  const handleSubmit = jest.fn();
  const { getByTestId } = render(<PantryItemForm onSubmit={handleSubmit} />);
  
  fireEvent.click(getByTestId('submit-button'));
  
  expect(handleSubmit).toHaveBeenCalled();
});
```

### E2E Testing Guidelines

```typescript
// Good: Testing complete user workflows
test('user can add item to pantry and see it in list', async ({ page }) => {
  await page.goto('/pantry');
  
  await page.click('[data-testid="add-item-button"]');
  await page.fill('[data-testid="ingredient-name"]', 'Tomatoes');
  await page.fill('[data-testid="quantity"]', '5');
  await page.click('[data-testid="save-button"]');
  
  await expect(page.locator('[data-testid="pantry-item"]')).toContainText('Tomatoes');
});

// Bad: Testing individual component behavior
test('add item button is clickable', async ({ page }) => {
  await page.goto('/pantry');
  
  const button = page.locator('[data-testid="add-item-button"]');
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('[data-testid="add-item-form"]')).toBeVisible();
});
```

## Performance Testing

### Lighthouse Integration

```typescript
// scripts/lighthouse-test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouseTest(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  
  // Check performance score
  const performanceScore = runnerResult.lhr.categories.performance.score * 100;
  if (performanceScore < 90) {
    throw new Error(`Performance score ${performanceScore} is below threshold`);
  }
  
  await chrome.kill();
}
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for bundle size regressions
npm run build:analyze -- --compare
```

## Maintenance and Updates

### Regular Tasks

1. **Update Dependencies**
   - Update testing libraries regularly
   - Review and update test configurations
   - Update snapshot tests when necessary

2. **Review Coverage**
   - Monitor coverage reports
   - Identify areas needing more tests
   - Remove obsolete tests

3. **Performance Monitoring**
   - Run performance tests regularly
   - Monitor bundle sizes
   - Update performance budgets

4. **Test Maintenance**
   - Review and refactor flaky tests
   - Update test data and fixtures
   - Improve test reliability

### Documentation

- Keep testing documentation up to date
- Document testing patterns and conventions
- Share testing knowledge across the team
- Review and update testing guidelines regularly

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Add proper wait conditions
   - Use stable selectors
   - Avoid timing-dependent assertions

2. **Memory Leaks**
   - Clean up event listeners
   - Clear timers and intervals
   - Properly unmount components

3. **Slow Tests**
   - Optimize database queries
   - Use proper mocking
   - Parallelize test execution

4. **CI/CD Issues**
   - Ensure proper environment setup
   - Use appropriate timeouts
   - Handle flaky network conditions

### Debugging Tips

```typescript
// Debug component rendering
import { screen, debug } from '@testing-library/react';

test('debug test', () => {
  render(<MyComponent />);
  screen.debug(); // Prints DOM to console
});

// Debug Playwright tests
test('debug e2e test', async ({ page }) => {
  await page.goto('/pantry');
  await page.pause(); // Pauses execution for debugging
});
```

This comprehensive testing documentation ensures that KeCaraJoComer maintains high quality, reliability, and user experience across all features and components.