import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Sign Up Flow', () => {
    test('should navigate to sign up page and complete registration', async ({ page }) => {
      // Navigate to sign up page
      await page.click('[data-testid="signup-button"]');
      await expect(page).toHaveURL(/.*signup/);
      
      // Verify sign up page loaded
      await expect(page.locator('h1')).toContainText('Sign Up');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      
      // Fill out sign up form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to onboarding or dashboard
      await expect(page).toHaveURL(/.*onboarding|.*dashboard/);
    });

    test('should show validation errors for invalid sign up data', async ({ page }) => {
      await page.click('[data-testid="signup-button"]');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Test invalid email
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      
      // Test password mismatch
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'different-password');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });
  });

  test.describe('Sign In Flow', () => {
    test('should navigate to sign in page and complete login', async ({ page }) => {
      // Navigate to sign in page
      await page.click('[data-testid="signin-button"]');
      await expect(page).toHaveURL(/.*signin/);
      
      // Verify sign in page loaded
      await expect(page.locator('h1')).toContainText('Sign In');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      
      // Fill out sign in form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('[data-testid="signin-button"]');
      
      // Enter invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid credentials');
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.click('[data-testid="signin-button"]');
      
      const passwordInput = page.locator('input[name="password"]');
      const toggleButton = page.locator('[data-testid="password-toggle"]');
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle to hide password again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Authentication Navigation', () => {
    test('should navigate between sign in and sign up pages', async ({ page }) => {
      // Go to sign in page
      await page.click('[data-testid="signin-button"]');
      await expect(page).toHaveURL(/.*signin/);
      
      // Navigate to sign up from sign in page
      await page.click('[data-testid="signup-link"]');
      await expect(page).toHaveURL(/.*signup/);
      
      // Navigate back to sign in from sign up page
      await page.click('[data-testid="signin-link"]');
      await expect(page).toHaveURL(/.*signin/);
    });

    test('should handle forgot password link', async ({ page }) => {
      await page.click('[data-testid="signin-button"]');
      
      // Click forgot password link
      await page.click('[data-testid="forgot-password-link"]');
      
      // Should show forgot password form or navigate to forgot password page
      await expect(page.locator('[data-testid="forgot-password-form"]')).toBeVisible();
    });
  });

  test.describe('Onboarding Flow', () => {
    test('should complete onboarding wizard after signup', async ({ page }) => {
      // Mock successful signup that redirects to onboarding
      await page.goto('/onboarding');
      
      // Step 1: Welcome
      await expect(page.locator('h1')).toContainText('Welcome');
      await page.click('[data-testid="onboarding-next"]');
      
      // Step 2: Profile Setup
      await expect(page.locator('h2')).toContainText('Profile');
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.click('[data-testid="onboarding-next"]');
      
      // Step 3: Dietary Preferences
      await expect(page.locator('h2')).toContainText('Dietary Preferences');
      await page.click('[data-testid="dietary-vegetarian"]');
      await page.click('[data-testid="onboarding-next"]');
      
      // Step 4: Nutrition Goals
      await expect(page.locator('h2')).toContainText('Nutrition Goals');
      await page.click('[data-testid="goal-maintain"]');
      await page.click('[data-testid="onboarding-next"]');
      
      // Step 5: Cooking Preferences
      await expect(page.locator('h2')).toContainText('Cooking Preferences');
      await page.click('[data-testid="skill-intermediate"]');
      await page.click('[data-testid="onboarding-next"]');
      
      // Step 6: Pantry Setup
      await expect(page.locator('h2')).toContainText('Pantry Setup');
      await page.click('[data-testid="pantry-skip"]');
      
      // Step 7: Meal Plan Preview
      await expect(page.locator('h2')).toContainText('Meal Plan');
      await page.click('[data-testid="onboarding-next"]');
      
      // Step 8: Completion
      await expect(page.locator('h2')).toContainText('Complete');
      await page.click('[data-testid="onboarding-finish"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should allow going back in onboarding', async ({ page }) => {
      await page.goto('/onboarding');
      
      // Go to step 2
      await page.click('[data-testid="onboarding-next"]');
      await expect(page.locator('h2')).toContainText('Profile');
      
      // Go back to step 1
      await page.click('[data-testid="onboarding-back"]');
      await expect(page.locator('h1')).toContainText('Welcome');
    });

    test('should validate required fields in onboarding', async ({ page }) => {
      await page.goto('/onboarding');
      
      // Skip to profile step
      await page.click('[data-testid="onboarding-next"]');
      
      // Try to continue without filling required fields
      await page.click('[data-testid="onboarding-next"]');
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session after page reload', async ({ page }) => {
      // Mock logged in user
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
      });
      
      // Reload page
      await page.reload();
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    });

    test('should redirect to login when session expires', async ({ page }) => {
      // Mock logged in user
      await page.goto('/dashboard');
      
      // Clear session
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
      });
      
      // Navigate to a protected route
      await page.goto('/pantry');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*signin/);
    });

    test('should handle logout', async ({ page }) => {
      // Mock logged in user
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
      });
      
      // Click logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to home page
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper focus management during authentication', async ({ page }) => {
      await page.click('[data-testid="signin-button"]');
      
      // Check tab order
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.click('[data-testid="signin-button"]');
      
      // Submit form with errors
      await page.click('button[type="submit"]');
      
      // Error should be announced
      await expect(page.locator('[aria-live="assertive"]')).toBeVisible();
      await expect(page.locator('[aria-live="assertive"]')).toContainText('required');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('[data-testid="signin-button"]');
      
      // Check form has proper labels
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
      await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
    });
  });
});