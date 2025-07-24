import { test, expect } from '@playwright/test';

test.describe('Pantry Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.goto('/pantry');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token');
    });
  });

  test.describe('Pantry Overview', () => {
    test('should display pantry with items list', async ({ page }) => {
      // Mock pantry data
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5, unit: 'pieces', expiryDate: '2024-01-20', location: 'Fridge' },
            { id: 2, name: 'Rice', quantity: 2, unit: 'kg', expiryDate: '2024-06-01', location: 'Pantry' }
          ])
        });
      });
      
      await page.reload();
      
      // Check pantry elements
      await expect(page.locator('[data-testid="pantry-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-item-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="pantry-items-list"]')).toBeVisible();
      
      // Check items
      await expect(page.locator('[data-testid="item-1"]')).toContainText('Tomatoes');
      await expect(page.locator('[data-testid="item-2"]')).toContainText('Rice');
    });

    test('should show empty state when no items', async ({ page }) => {
      // Mock empty pantry
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await page.reload();
      
      // Check empty state
      await expect(page.locator('[data-testid="empty-pantry"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-pantry-message"]')).toContainText('No items in your pantry');
      await expect(page.locator('[data-testid="add-first-item-button"]')).toBeVisible();
    });

    test('should filter items by location', async ({ page }) => {
      // Mock pantry data with multiple locations
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Milk', location: 'Fridge' },
            { id: 2, name: 'Bread', location: 'Counter' },
            { id: 3, name: 'Rice', location: 'Pantry' }
          ])
        });
      });
      
      await page.reload();
      
      // Filter by Fridge
      await page.click('[data-testid="filter-location"]');
      await page.click('[data-testid="location-fridge"]');
      
      // Should show only fridge items
      await expect(page.locator('[data-testid="item-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-2"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="item-3"]')).not.toBeVisible();
    });

    test('should search items by name', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 },
            { id: 2, name: 'Rice', quantity: 2 },
            { id: 3, name: 'Tomato Sauce', quantity: 1 }
          ])
        });
      });
      
      await page.reload();
      
      // Search for "tomato"
      await page.fill('[data-testid="search-input"]', 'tomato');
      
      // Should show only items containing "tomato"
      await expect(page.locator('[data-testid="item-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-2"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="item-3"]')).toBeVisible();
    });
  });

  test.describe('Add Item Flow', () => {
    test('should add new item to pantry', async ({ page }) => {
      // Mock successful item creation
      await page.route('**/api/pantry/items', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 3, name: 'Apples', quantity: 10, unit: 'pieces' })
          });
        }
      });
      
      // Click add item button
      await page.click('[data-testid="add-item-button"]');
      
      // Should open add item form
      await expect(page.locator('[data-testid="add-item-form"]')).toBeVisible();
      
      // Fill form
      await page.fill('[data-testid="item-name-input"]', 'Apples');
      await page.fill('[data-testid="item-quantity-input"]', '10');
      await page.selectOption('[data-testid="item-unit-select"]', 'pieces');
      await page.fill('[data-testid="item-expiry-input"]', '2024-01-25');
      await page.selectOption('[data-testid="item-location-select"]', 'Fridge');
      
      // Submit form
      await page.click('[data-testid="save-item-button"]');
      
      // Should close form and show success message
      await expect(page.locator('[data-testid="add-item-form"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Item added successfully');
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('[data-testid="add-item-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="save-item-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    });

    test('should cancel adding item', async ({ page }) => {
      await page.click('[data-testid="add-item-button"]');
      
      // Fill some data
      await page.fill('[data-testid="item-name-input"]', 'Test Item');
      
      // Cancel
      await page.click('[data-testid="cancel-button"]');
      
      // Should close form without saving
      await expect(page.locator('[data-testid="add-item-form"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible();
    });
  });

  test.describe('Edit Item Flow', () => {
    test('should edit existing item', async ({ page }) => {
      // Mock existing item
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5, unit: 'pieces', expiryDate: '2024-01-20' }
          ])
        });
      });
      
      // Mock update request
      await page.route('**/api/pantry/items/1', route => {
        if (route.request().method() === 'PUT') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 1, name: 'Tomatoes', quantity: 8, unit: 'pieces' })
          });
        }
      });
      
      await page.reload();
      
      // Click edit button
      await page.click('[data-testid="edit-item-1"]');
      
      // Should open edit form with pre-filled data
      await expect(page.locator('[data-testid="edit-item-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-name-input"]')).toHaveValue('Tomatoes');
      await expect(page.locator('[data-testid="item-quantity-input"]')).toHaveValue('5');
      
      // Update quantity
      await page.fill('[data-testid="item-quantity-input"]', '8');
      
      // Submit form
      await page.click('[data-testid="save-item-button"]');
      
      // Should close form and show success message
      await expect(page.locator('[data-testid="edit-item-form"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Item updated successfully');
    });

    test('should handle edit validation errors', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 }
          ])
        });
      });
      
      await page.reload();
      
      // Click edit button
      await page.click('[data-testid="edit-item-1"]');
      
      // Clear required field
      await page.fill('[data-testid="item-name-input"]', '');
      
      // Try to submit
      await page.click('[data-testid="save-item-button"]');
      
      // Should show validation error
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    });
  });

  test.describe('Delete Item Flow', () => {
    test('should delete item with confirmation', async ({ page }) => {
      // Mock existing item
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 }
          ])
        });
      });
      
      // Mock delete request
      await page.route('**/api/pantry/items/1', route => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({ status: 200 });
        }
      });
      
      await page.reload();
      
      // Click delete button
      await page.click('[data-testid="delete-item-1"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-message"]')).toContainText('Are you sure you want to delete Tomatoes?');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Should close dialog and show success message
      await expect(page.locator('[data-testid="delete-confirmation"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Item deleted successfully');
    });

    test('should cancel deletion', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 }
          ])
        });
      });
      
      await page.reload();
      
      // Click delete button
      await page.click('[data-testid="delete-item-1"]');
      
      // Cancel deletion
      await page.click('[data-testid="cancel-delete-button"]');
      
      // Should close dialog without deleting
      await expect(page.locator('[data-testid="delete-confirmation"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="item-1"]')).toBeVisible();
    });
  });

  test.describe('Expiration Alerts', () => {
    test('should show expiration alerts for items expiring soon', async ({ page }) => {
      // Mock items with different expiry dates
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Milk', expiryDate: '2024-01-16', daysUntilExpiry: 1 },
            { id: 2, name: 'Bread', expiryDate: '2024-01-17', daysUntilExpiry: 2 },
            { id: 3, name: 'Rice', expiryDate: '2024-06-01', daysUntilExpiry: 150 }
          ])
        });
      });
      
      await page.reload();
      
      // Should show expiration alerts
      await expect(page.locator('[data-testid="expiration-alerts"]')).toBeVisible();
      await expect(page.locator('[data-testid="expiring-item-1"]')).toContainText('Milk');
      await expect(page.locator('[data-testid="expiring-item-2"]')).toContainText('Bread');
      
      // Should not show items that are not expiring soon
      await expect(page.locator('[data-testid="expiring-item-3"]')).not.toBeVisible();
    });

    test('should mark items as consumed from expiration alert', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Milk', expiryDate: '2024-01-16', daysUntilExpiry: 1 }
          ])
        });
      });
      
      // Mock consume request
      await page.route('**/api/pantry/items/1/consume', route => {
        route.fulfill({ status: 200 });
      });
      
      await page.reload();
      
      // Click consume button in alert
      await page.click('[data-testid="consume-item-1"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Item marked as consumed');
    });
  });

  test.describe('Pantry Analytics', () => {
    test('should display pantry analytics', async ({ page }) => {
      // Mock analytics data
      await page.route('**/api/pantry/analytics', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalItems: 25,
            totalValue: 150.50,
            expiringThisWeek: 3,
            lowStockItems: 2,
            topCategories: ['Vegetables', 'Dairy', 'Grains']
          })
        });
      });
      
      // Navigate to analytics
      await page.click('[data-testid="analytics-tab"]');
      
      // Check analytics elements
      await expect(page.locator('[data-testid="total-items-metric"]')).toContainText('25');
      await expect(page.locator('[data-testid="total-value-metric"]')).toContainText('$150.50');
      await expect(page.locator('[data-testid="expiring-week-metric"]')).toContainText('3');
      await expect(page.locator('[data-testid="low-stock-metric"]')).toContainText('2');
    });

    test('should show category breakdown', async ({ page }) => {
      await page.route('**/api/pantry/analytics', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            categoryBreakdown: [
              { category: 'Vegetables', count: 8, percentage: 32 },
              { category: 'Dairy', count: 5, percentage: 20 },
              { category: 'Grains', count: 7, percentage: 28 }
            ]
          })
        });
      });
      
      await page.click('[data-testid="analytics-tab"]');
      
      // Check category breakdown
      await expect(page.locator('[data-testid="category-vegetables"]')).toContainText('8 items (32%)');
      await expect(page.locator('[data-testid="category-dairy"]')).toContainText('5 items (20%)');
      await expect(page.locator('[data-testid="category-grains"]')).toContainText('7 items (28%)');
    });
  });

  test.describe('Batch Operations', () => {
    test('should select multiple items for batch operations', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 },
            { id: 2, name: 'Onions', quantity: 3 },
            { id: 3, name: 'Garlic', quantity: 2 }
          ])
        });
      });
      
      await page.reload();
      
      // Enter batch mode
      await page.click('[data-testid="batch-mode-button"]');
      
      // Select multiple items
      await page.click('[data-testid="select-item-1"]');
      await page.click('[data-testid="select-item-2"]');
      
      // Check batch actions are available
      await expect(page.locator('[data-testid="batch-actions"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('2 items selected');
    });

    test('should delete multiple items in batch', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 },
            { id: 2, name: 'Onions', quantity: 3 }
          ])
        });
      });
      
      // Mock batch delete
      await page.route('**/api/pantry/items/batch', route => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({ status: 200 });
        }
      });
      
      await page.reload();
      
      // Select items and delete
      await page.click('[data-testid="batch-mode-button"]');
      await page.click('[data-testid="select-item-1"]');
      await page.click('[data-testid="select-item-2"]');
      await page.click('[data-testid="batch-delete-button"]');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-batch-delete"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Items deleted successfully');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper keyboard navigation', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 }
          ])
        });
      });
      
      await page.reload();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="add-item-button"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="edit-item-1"]')).toBeFocused();
    });

    test('should announce changes to screen readers', async ({ page }) => {
      await page.route('**/api/pantry/items', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Tomatoes', quantity: 5 }
          ])
        });
      });
      
      await page.reload();
      
      // Delete item
      await page.click('[data-testid="delete-item-1"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Should announce to screen readers
      await expect(page.locator('[aria-live="polite"]')).toContainText('Item deleted successfully');
    });
  });
});