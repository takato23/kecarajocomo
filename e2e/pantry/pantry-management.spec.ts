import { test, expect } from '@playwright/test';

test.describe('Pantry Management - Enhanced Despensa Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pantry page
    await page.goto('/pantry');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="pantry-dashboard"]', { timeout: 10000 });
  });

  test('should display pantry page with items list', async ({ page }) => {
    await page.goto('/pantry');
    
    await expect(page.locator('h1')).toContainText('Pantry');
    await expect(page.locator('[data-testid="pantry-items-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-item-button"]')).toBeVisible();
  });

  test('should add a new pantry item', async ({ page }) => {
    await page.goto('/pantry');
    
    // Click add item button
    await page.click('[data-testid="add-item-button"]');
    
    // Fill form
    await page.fill('input[name="name"]', 'Test Item');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="location"]', 'Kitchen');
    await page.fill('input[name="expiryDate"]', '2024-12-31');
    await page.fill('input[name="notes"]', 'Test notes');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify item was added
    await expect(page.locator('[data-testid="pantry-item"]')).toContainText('Test Item');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should edit an existing pantry item', async ({ page }) => {
    await helpers.addPantryItem('Edit Test Item', 3);
    
    await page.goto('/pantry');
    
    // Click edit button on the item
    await page.click('[data-testid="edit-item-button"]');
    
    // Update the item
    await page.fill('input[name="name"]', 'Updated Test Item');
    await page.fill('input[name="quantity"]', '7');
    
    // Submit changes
    await page.click('button[type="submit"]');
    
    // Verify item was updated
    await expect(page.locator('[data-testid="pantry-item"]')).toContainText('Updated Test Item');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should delete a pantry item', async ({ page }) => {
    await helpers.addPantryItem('Delete Test Item', 2);
    
    await page.goto('/pantry');
    
    // Click delete button on the item
    await page.click('[data-testid="delete-item-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify item was deleted
    await expect(page.locator('[data-testid="pantry-item"]')).not.toContainText('Delete Test Item');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should search for pantry items', async ({ page }) => {
    await helpers.addPantryItem('Searchable Item', 1);
    await helpers.addPantryItem('Another Item', 2);
    
    await page.goto('/pantry');
    
    // Search for specific item
    await page.fill('[data-testid="search-input"]', 'Searchable');
    
    // Verify search results
    await expect(page.locator('[data-testid="pantry-item"]')).toContainText('Searchable Item');
    await expect(page.locator('[data-testid="pantry-item"]')).not.toContainText('Another Item');
  });

  test('should filter pantry items by location', async ({ page }) => {
    await page.goto('/pantry');
    
    // Add items with different locations
    await helpers.addPantryItem('Kitchen Item', 1, 'Kitchen');
    await helpers.addPantryItem('Fridge Item', 1, 'Fridge');
    
    // Filter by Kitchen
    await page.selectOption('[data-testid="location-filter"]', 'Kitchen');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="pantry-item"]')).toContainText('Kitchen Item');
    await expect(page.locator('[data-testid="pantry-item"]')).not.toContainText('Fridge Item');
  });

  test('should sort pantry items', async ({ page }) => {
    await helpers.addPantryItem('Apple', 1);
    await helpers.addPantryItem('Banana', 2);
    await helpers.addPantryItem('Cherry', 3);
    
    await page.goto('/pantry');
    
    // Sort by name descending
    await page.selectOption('[data-testid="sort-select"]', 'name-desc');
    
    // Verify sort order
    const items = page.locator('[data-testid="pantry-item-name"]');
    await expect(items.first()).toContainText('Cherry');
    await expect(items.last()).toContainText('Apple');
  });

  test('should display item expiration warnings', async ({ page }) => {
    await page.goto('/pantry');
    
    // Mock API to return item with expiration warning
    await mockApiResponse(page, '**/api/pantry/items', {
      items: [{
        id: 1,
        name: 'Expiring Item',
        quantity: 1,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        location: 'Kitchen'
      }]
    });
    
    await page.reload();
    
    // Verify expiration warning is displayed
    await expect(page.locator('[data-testid="expiration-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiration-warning"]')).toContainText('Expiring Item');
  });

  test('should consume/use pantry items', async ({ page }) => {
    await helpers.addPantryItem('Consumable Item', 5);
    
    await page.goto('/pantry');
    
    // Click consume button
    await page.click('[data-testid="consume-item-button"]');
    
    // Specify quantity to consume
    await page.fill('input[name="consumeQuantity"]', '2');
    await page.click('[data-testid="confirm-consume"]');
    
    // Verify quantity was updated
    await expect(page.locator('[data-testid="item-quantity"]')).toContainText('3');
  });

  test('should batch update multiple items', async ({ page }) => {
    await helpers.addPantryItem('Batch Item 1', 1);
    await helpers.addPantryItem('Batch Item 2', 2);
    
    await page.goto('/pantry');
    
    // Select multiple items
    await page.check('[data-testid="select-item-1"]');
    await page.check('[data-testid="select-item-2"]');
    
    // Open batch actions
    await page.click('[data-testid="batch-actions"]');
    
    // Update location for selected items
    await page.selectOption('[data-testid="batch-location"]', 'Fridge');
    await page.click('[data-testid="apply-batch-update"]');
    
    // Verify items were updated
    await expect(page.locator('[data-testid="item-location"]').first()).toContainText('Fridge');
    await expect(page.locator('[data-testid="item-location"]').last()).toContainText('Fridge');
  });

  test('should display pantry analytics', async ({ page }) => {
    await page.goto('/pantry');
    
    // Navigate to analytics tab
    await page.click('[data-testid="analytics-tab"]');
    
    // Verify analytics are displayed
    await expect(page.locator('[data-testid="pantry-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="waste-reduction-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="consumption-patterns"]')).toBeVisible();
  });

  test('should work with barcode scanning', async ({ page }) => {
    await page.goto('/pantry');
    
    // Mock barcode scanning
    await page.click('[data-testid="scan-barcode"]');
    
    // Mock successful scan
    await mockApiResponse(page, '**/api/pantry/barcode/**', {
      name: 'Scanned Product',
      category: 'Food',
      nutritionalInfo: { calories: 100 }
    });
    
    // Verify scanned item details are populated
    await expect(page.locator('input[name="name"]')).toHaveValue('Scanned Product');
  });

  test('should display empty state when no items exist', async ({ page }) => {
    // Mock empty pantry
    await mockApiResponse(page, '**/api/pantry/items', { items: [] });
    
    await page.goto('/pantry');
    
    // Verify empty state
    await expect(page.locator('[data-testid="empty-pantry"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-pantry"]')).toContainText('Your pantry is empty');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/pantry/items', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/pantry');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load pantry items');
  });
});