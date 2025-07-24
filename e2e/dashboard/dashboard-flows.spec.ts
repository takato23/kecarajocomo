import { test, expect } from '@playwright/test';

test.describe('Dashboard Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token');
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display dashboard with all main sections', async ({ page }) => {
      await page.reload();
      
      // Check main dashboard elements
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="pantry-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="upcoming-meals"]')).toBeVisible();
      await expect(page.locator('[data-testid="nutrition-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible();
    });

    test('should show loading states initially', async ({ page }) => {
      await page.reload();
      
      // Check loading states
      await expect(page.locator('[data-testid="pantry-status-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="nutrition-loading"]')).toBeVisible();
      
      // Wait for loading to complete
      await expect(page.locator('[data-testid="pantry-status-loading"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="nutrition-loading"]')).not.toBeVisible();
    });

    test('should handle error states gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/dashboard/metrics', route => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });
      
      await page.reload();
      
      // Check error states
      await expect(page.locator('[data-testid="pantry-status-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load');
    });
  });

  test.describe('Pantry Status Widget', () => {
    test('should display pantry metrics correctly', async ({ page }) => {
      // Mock pantry data
      await page.route('**/api/pantry/stats', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalItems: 45,
            expiringSoon: 3,
            lowStock: 2
          })
        });
      });
      
      await page.reload();
      
      // Check pantry metrics
      await expect(page.locator('[data-testid="total-items"]')).toContainText('45');
      await expect(page.locator('[data-testid="expiring-soon"]')).toContainText('3');
      await expect(page.locator('[data-testid="low-stock"]')).toContainText('2');
    });

    test('should show pantry alerts when items are expiring', async ({ page }) => {
      // Mock pantry data with alerts
      await page.route('**/api/pantry/stats', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalItems: 45,
            expiringSoon: 5,
            lowStock: 3,
            alerts: [
              { type: 'expiring', message: '5 items expiring soon' },
              { type: 'low-stock', message: '3 items low in stock' }
            ]
          })
        });
      });
      
      await page.reload();
      
      // Check alerts
      await expect(page.locator('[data-testid="pantry-alerts"]')).toBeVisible();
      await expect(page.locator('[data-testid="expiring-alert"]')).toContainText('5 items expiring soon');
      await expect(page.locator('[data-testid="low-stock-alert"]')).toContainText('3 items low in stock');
    });

    test('should navigate to pantry page when manage button is clicked', async ({ page }) => {
      await page.click('[data-testid="manage-pantry-button"]');
      await expect(page).toHaveURL(/.*pantry/);
    });

    test('should show pantry health score', async ({ page }) => {
      await page.route('**/api/pantry/stats', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalItems: 100,
            expiringSoon: 5,
            lowStock: 5,
            healthScore: 90
          })
        });
      });
      
      await page.reload();
      
      // Check health score
      await expect(page.locator('[data-testid="pantry-health-score"]')).toContainText('90%');
      await expect(page.locator('[data-testid="health-progress-bar"]')).toHaveCSS('width', '90%');
    });
  });

  test.describe('Upcoming Meals Widget', () => {
    test('should display upcoming meals', async ({ page }) => {
      // Mock meal data
      await page.route('**/api/meals/upcoming', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Pasta Carbonara', time: '2024-01-15T18:00:00Z', type: 'dinner' },
            { id: 2, name: 'Chicken Salad', time: '2024-01-16T12:00:00Z', type: 'lunch' }
          ])
        });
      });
      
      await page.reload();
      
      // Check meals
      await expect(page.locator('[data-testid="meal-1"]')).toContainText('Pasta Carbonara');
      await expect(page.locator('[data-testid="meal-2"]')).toContainText('Chicken Salad');
    });

    test('should show empty state when no meals planned', async ({ page }) => {
      // Mock empty meal data
      await page.route('**/api/meals/upcoming', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await page.reload();
      
      // Check empty state
      await expect(page.locator('[data-testid="no-meals-planned"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-meals-button"]')).toBeVisible();
    });

    test('should navigate to meal planner', async ({ page }) => {
      await page.click('[data-testid="plan-meals-button"]');
      await expect(page).toHaveURL(/.*planner/);
    });
  });

  test.describe('Nutrition Summary Widget', () => {
    test('should display nutrition metrics', async ({ page }) => {
      // Mock nutrition data
      await page.route('**/api/nutrition/daily', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            calories: { consumed: 1800, target: 2000 },
            protein: { consumed: 120, target: 150 },
            carbs: { consumed: 200, target: 250 },
            fat: { consumed: 60, target: 70 }
          })
        });
      });
      
      await page.reload();
      
      // Check nutrition metrics
      await expect(page.locator('[data-testid="calories-consumed"]')).toContainText('1800');
      await expect(page.locator('[data-testid="calories-target"]')).toContainText('2000');
      await expect(page.locator('[data-testid="protein-consumed"]')).toContainText('120');
      await expect(page.locator('[data-testid="protein-target"]')).toContainText('150');
    });

    test('should show nutrition progress bars', async ({ page }) => {
      await page.route('**/api/nutrition/daily', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            calories: { consumed: 1800, target: 2000 },
            protein: { consumed: 120, target: 150 },
            carbs: { consumed: 200, target: 250 },
            fat: { consumed: 60, target: 70 }
          })
        });
      });
      
      await page.reload();
      
      // Check progress bars
      await expect(page.locator('[data-testid="calories-progress"]')).toHaveCSS('width', '90%');
      await expect(page.locator('[data-testid="protein-progress"]')).toHaveCSS('width', '80%');
    });
  });

  test.describe('Recent Activity Widget', () => {
    test('should display recent activities', async ({ page }) => {
      // Mock activity data
      await page.route('**/api/activity/recent', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, type: 'recipe_created', message: 'Created new recipe: Pasta Carbonara', timestamp: '2024-01-15T10:00:00Z' },
            { id: 2, type: 'pantry_updated', message: 'Added 3 items to pantry', timestamp: '2024-01-15T09:00:00Z' }
          ])
        });
      });
      
      await page.reload();
      
      // Check activities
      await expect(page.locator('[data-testid="activity-1"]')).toContainText('Created new recipe: Pasta Carbonara');
      await expect(page.locator('[data-testid="activity-2"]')).toContainText('Added 3 items to pantry');
    });

    test('should show timestamps for activities', async ({ page }) => {
      await page.route('**/api/activity/recent', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, type: 'recipe_created', message: 'Created new recipe', timestamp: '2024-01-15T10:00:00Z' }
          ])
        });
      });
      
      await page.reload();
      
      // Check timestamp
      await expect(page.locator('[data-testid="activity-1-timestamp"]')).toBeVisible();
    });
  });

  test.describe('AI Insights Widget', () => {
    test('should display AI-generated insights', async ({ page }) => {
      // Mock AI insights data
      await page.route('**/api/ai/insights', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            insights: [
              { type: 'recommendation', message: 'You have enough ingredients for Italian dishes this week' },
              { type: 'tip', message: 'Consider meal prepping on Sundays to save time' }
            ]
          })
        });
      });
      
      await page.reload();
      
      // Check insights
      await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible();
      await expect(page.locator('[data-testid="insight-recommendation"]')).toContainText('Italian dishes');
      await expect(page.locator('[data-testid="insight-tip"]')).toContainText('meal prepping');
    });

    test('should handle AI insights loading state', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/ai/insights', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ insights: [] })
          });
        }, 2000);
      });
      
      await page.reload();
      
      // Check loading state
      await expect(page.locator('[data-testid="ai-insights-loading"]')).toBeVisible();
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate between dashboard sections', async ({ page }) => {
      // Test navigation to different sections
      await page.click('[data-testid="nav-pantry"]');
      await expect(page).toHaveURL(/.*pantry/);
      
      await page.click('[data-testid="nav-recipes"]');
      await expect(page).toHaveURL(/.*recipes/);
      
      await page.click('[data-testid="nav-planner"]');
      await expect(page).toHaveURL(/.*planner/);
      
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should show active navigation state', async ({ page }) => {
      // Check active state on dashboard
      await expect(page.locator('[data-testid="nav-dashboard"]')).toHaveClass(/active/);
      
      // Navigate to pantry
      await page.click('[data-testid="nav-pantry"]');
      await expect(page.locator('[data-testid="nav-pantry"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="nav-dashboard"]')).not.toHaveClass(/active/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
      
      // Check widgets stack vertically
      const widgets = page.locator('[data-testid*="widget"]');
      const widgetCount = await widgets.count();
      
      for (let i = 0; i < widgetCount; i++) {
        await expect(widgets.nth(i)).toHaveCSS('width', '100%');
      }
    });

    test('should show desktop layout on larger screens', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // Check desktop layout
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible();
      
      // Check widgets layout in grid
      await expect(page.locator('[data-testid="dashboard-grid"]')).toHaveCSS('display', 'grid');
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard widgets efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.reload();
      
      // Wait for all widgets to load
      await page.waitForSelector('[data-testid="pantry-status"]');
      await page.waitForSelector('[data-testid="nutrition-summary"]');
      await page.waitForSelector('[data-testid="recent-activity"]');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => {
        route.abort();
      });
      
      await page.reload();
      
      // Should show error states instead of crashing
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-fallback"]')).toBeVisible();
    });
  });
});