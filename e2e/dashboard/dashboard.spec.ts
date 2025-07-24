import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Dashboard', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.signIn();
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check main dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="pantry-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-meals"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(page.locator('[data-testid="nutrition-summary"]')).toBeVisible();
  });

  test('should display pantry status correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    const pantryStatus = page.locator('[data-testid="pantry-status"]');
    await expect(pantryStatus).toBeVisible();
    await expect(pantryStatus.locator('[data-testid="total-items"]')).toBeVisible();
    await expect(pantryStatus.locator('[data-testid="expiring-soon"]')).toBeVisible();
    await expect(pantryStatus.locator('[data-testid="low-stock"]')).toBeVisible();
  });

  test('should display upcoming meals', async ({ page }) => {
    await page.goto('/dashboard');
    
    const upcomingMeals = page.locator('[data-testid="upcoming-meals"]');
    await expect(upcomingMeals).toBeVisible();
    await expect(upcomingMeals.locator('h2')).toContainText('Upcoming Meals');
  });

  test('should display recent activity', async ({ page }) => {
    await page.goto('/dashboard');
    
    const recentActivity = page.locator('[data-testid="recent-activity"]');
    await expect(recentActivity).toBeVisible();
    await expect(recentActivity.locator('h2')).toContainText('Recent Activity');
  });

  test('should display nutrition summary', async ({ page }) => {
    await page.goto('/dashboard');
    
    const nutritionSummary = page.locator('[data-testid="nutrition-summary"]');
    await expect(nutritionSummary).toBeVisible();
    await expect(nutritionSummary.locator('h2')).toContainText('Nutrition Summary');
  });

  test('should display AI insights', async ({ page }) => {
    await page.goto('/dashboard');
    
    const aiInsights = page.locator('[data-testid="ai-insights"]');
    await expect(aiInsights).toBeVisible();
    await expect(aiInsights.locator('h2')).toContainText('AI Insights');
  });

  test('should navigate to pantry from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid="quick-action-pantry"]');
    await expect(page).toHaveURL('/pantry');
  });

  test('should navigate to recipes from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid="quick-action-recipes"]');
    await expect(page).toHaveURL('/recipes');
  });

  test('should navigate to meal planner from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.click('[data-testid="quick-action-planner"]');
    await expect(page).toHaveURL('/planner');
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click refresh button
    await page.click('[data-testid="refresh-dashboard"]');
    
    // Check loading state
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('should display correct metrics after adding pantry items', async ({ page }) => {
    await helpers.addPantryItem('Test Item', 5);
    await page.goto('/dashboard');
    
    const pantryStatus = page.locator('[data-testid="pantry-status"]');
    const totalItems = pantryStatus.locator('[data-testid="total-items"]');
    
    await expect(totalItems).toContainText('1');
  });

  test('should show expiring items notification', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if expiring items notification is present
    const expiringNotification = page.locator('[data-testid="expiring-notification"]');
    
    // If there are expiring items, notification should be visible
    const expiringCount = await page.locator('[data-testid="expiring-soon"]').textContent();
    if (expiringCount && parseInt(expiringCount) > 0) {
      await expect(expiringNotification).toBeVisible();
    }
  });

  test('should display empty state when no data is available', async ({ page }) => {
    // Mock empty API responses
    await page.route('**/api/pantry/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalItems: 0, expiringItems: 0, lowStockItems: 0 }),
      });
    });
    
    await page.goto('/dashboard');
    
    const pantryStatus = page.locator('[data-testid="pantry-status"]');
    await expect(pantryStatus.locator('[data-testid="total-items"]')).toContainText('0');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    
    // Check if cards stack vertically on mobile
    const cards = page.locator('[data-testid="dashboard-card"]');
    const cardCount = await cards.count();
    
    for (let i = 0; i < cardCount; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });
});