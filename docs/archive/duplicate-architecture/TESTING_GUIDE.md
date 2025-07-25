# 🧪 KeCarajoComer Testing Guide

## Overview

This guide provides comprehensive documentation for the testing infrastructure of KeCarajoComer. Our testing strategy ensures code quality, reliability, and maintainability through multiple layers of automated tests.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Testing Standards](#testing-standards)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing approach follows these principles:

- **Test Pyramid**: Emphasis on unit tests, supported by integration tests, topped with E2E tests
- **Coverage First**: Maintain minimum 85% code coverage across all metrics
- **Accessibility Always**: Every component must pass accessibility tests
- **Performance Matters**: Tests should run quickly and efficiently
- **Documentation**: Tests serve as living documentation for component behavior

## Test Types

### 1. Unit Tests (Jest)

Unit tests focus on individual components and functions in isolation.

**Location**: `tests/__tests__/`

**Coverage Requirements**: 85% minimum for branches, functions, lines, and statements

**Key Features**:
- Component rendering and behavior
- Business logic validation
- Utility function testing
- Store and hook testing

### 2. Integration Tests (Jest + Testing Library)

Integration tests verify how multiple components work together.

**Location**: `tests/__tests__/integration/`

**Focus Areas**:
- API route testing
- Complex component interactions
- State management flows
- Service integrations

### 3. E2E Tests (Playwright)

End-to-end tests simulate real user workflows across the application.

**Location**: `e2e/`

**Test Scenarios**:
- Authentication flows
- Recipe management
- Meal planning
- Pantry operations
- Shopping list generation

### 4. Visual Regression Tests (Playwright)

Visual tests catch unintended UI changes.

**Location**: `e2e/visual/`

**Coverage**:
- Design system components
- Key application pages
- Responsive layouts

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders button"
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npx playwright test --ui

# Run specific E2E test
npx playwright test auth

# Run E2E tests in debug mode
npx playwright test --debug
```

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@/tests/utils/test-helpers';
import { Button } from '@/components/design-system/Button';

describe('Button Component', () => {
  it('renders with text and handles clicks', async () => {
    const handleClick = jest.fn();
    const { user } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading...</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Recipe Management', () => {
  test('user can create a new recipe', async ({ page }) => {
    // Navigate to recipes page
    await page.goto('/recipes');
    
    // Click create button
    await page.getByRole('button', { name: /create recipe/i }).click();
    
    // Fill recipe form
    await page.getByLabel('Recipe Name').fill('Test Recipe');
    await page.getByLabel('Description').fill('A delicious test recipe');
    await page.getByLabel('Prep Time').fill('15');
    await page.getByLabel('Cook Time').fill('30');
    
    // Submit form
    await page.getByRole('button', { name: /save recipe/i }).click();
    
    // Verify success
    await expect(page.getByText('Recipe created successfully')).toBeVisible();
    await expect(page.getByText('Test Recipe')).toBeVisible();
  });
});
```

### Test Utilities

We provide custom test utilities in `tests/utils/test-helpers.tsx`:

```typescript
import { render, checkA11y, createMockRecipe } from '@/tests/utils/test-helpers';

// Custom render with providers
const { user } = render(<Component />);

// Accessibility testing
await checkA11y(container);

// Mock data factories
const recipe = createMockRecipe({ name: 'Custom Recipe' });
```

## Testing Standards

### Component Testing Checklist

- [ ] Renders without errors
- [ ] Handles all props correctly
- [ ] Manages internal state properly
- [ ] Responds to user interactions
- [ ] Handles edge cases (empty data, errors)
- [ ] Passes accessibility tests
- [ ] Includes loading and error states
- [ ] Tests keyboard navigation
- [ ] Validates ARIA attributes
- [ ] Includes snapshot tests for UI stability

### Best Practices

1. **Descriptive Test Names**: Use clear, behavior-focused descriptions
   ```typescript
   // ❌ Bad
   it('test button', () => {});
   
   // ✅ Good
   it('disables submit button when form is invalid', () => {});
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('updates count when increment button is clicked', () => {
     // Arrange
     render(<Counter initialCount={0} />);
     
     // Act
     fireEvent.click(screen.getByText('Increment'));
     
     // Assert
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

3. **Use Testing Library Queries Correctly**:
   ```typescript
   // Prefer accessible queries
   screen.getByRole('button', { name: /submit/i });
   screen.getByLabelText('Email Address');
   
   // Avoid test IDs unless necessary
   screen.getByTestId('custom-element'); // Last resort
   ```

4. **Mock External Dependencies**:
   ```typescript
   jest.mock('@/lib/supabase', () => ({
     supabase: mockSupabase
   }));
   ```

5. **Test User Behavior, Not Implementation**:
   ```typescript
   // ❌ Bad - Testing implementation
   expect(component.state.isOpen).toBe(true);
   
   // ✅ Good - Testing behavior
   expect(screen.getByRole('dialog')).toBeVisible();
   ```

## CI/CD Integration

### GitHub Actions Workflows

1. **Test Suite** (`test.yml`):
   - Runs on every push and PR
   - Executes linting, type checking, unit tests, and E2E tests
   - Enforces 85% coverage threshold
   - Generates test reports

2. **PR Checks** (`pr-checks.yml`):
   - Additional checks for pull requests
   - Bundle size analysis
   - Visual regression tests
   - Accessibility checks
   - Dependency security scan

### Pre-commit Hooks

Configure git hooks for local testing:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **Tests Failing in CI but Passing Locally**
   - Check environment variables
   - Ensure consistent Node.js versions
   - Verify timezone settings
   - Check for hardcoded values

2. **Flaky E2E Tests**
   - Add proper wait conditions
   - Use `waitFor` for async operations
   - Increase timeout for slow operations
   - Check for race conditions

3. **Coverage Not Meeting Threshold**
   - Run coverage report to identify gaps
   - Focus on untested branches
   - Add tests for error scenarios
   - Test edge cases

4. **Mock Issues**
   - Clear mocks between tests: `jest.clearAllMocks()`
   - Use `jest.resetModules()` for module state
   - Verify mock implementations match actual APIs

### Debugging Tips

```bash
# Debug specific test
npm test -- --verbose Button.test.tsx

# Run tests with specific Node options
NODE_OPTIONS=--inspect npm test

# Generate detailed coverage report
npm test -- --coverage --coverageReporters=html,text-summary

# Run Playwright with debugging
npx playwright test --debug
PWDEBUG=1 npx playwright test
```

## Performance Testing

### Component Render Performance

```typescript
import { measureRenderTime } from '@/tests/utils/test-helpers';

it('renders efficiently', async () => {
  const renderTime = await measureRenderTime(ComplexComponent, props);
  expect(renderTime).toBeLessThan(100); // ms
});
```

### Bundle Size Testing

Monitor bundle sizes in CI to prevent regression:

```typescript
// next.config.js
module.exports = {
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../bundle-report.html',
        })
      );
    }
    return config;
  },
};
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Web Accessibility Testing](https://www.w3.org/WAI/test-evaluate/)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed
5. Add examples for complex patterns

Remember: **Tests are not just for catching bugs; they're documentation for future developers!**