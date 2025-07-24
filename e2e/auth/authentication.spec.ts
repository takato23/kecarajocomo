import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('KeCaraJoComer');
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="sign-up-button"]')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="sign-in-button"]');
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="sign-up-button"]');
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.locator('h1')).toContainText('Sign Up');
  });

  test('should show validation errors for invalid sign in', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Try with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should show validation errors for invalid sign up', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Try with mismatched passwords
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password456');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toBeVisible();
  });

  test('should successfully sign in with valid credentials', async ({ page }) => {
    await helpers.signIn();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should successfully sign out', async ({ page }) => {
    await helpers.signIn();
    await helpers.signOut();
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
  });

  test('should redirect to dashboard when accessing auth pages while authenticated', async ({ page }) => {
    await helpers.signIn();
    await page.goto('/auth/signin');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect to sign in when accessing protected pages while unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    await helpers.signIn();
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should complete onboarding flow for new users', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding');
    
    // Complete onboarding steps
    await page.click('[data-testid="next-step"]');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.click('[data-testid="next-step"]');
    
    // Dietary preferences
    await page.check('input[name="vegetarian"]');
    await page.click('[data-testid="next-step"]');
    
    // Nutrition goals
    await page.fill('input[name="dailyCalories"]', '2000');
    await page.click('[data-testid="next-step"]');
    
    // Complete onboarding
    await page.click('[data-testid="complete-onboarding"]');
    await expect(page).toHaveURL('/dashboard');
  });
});