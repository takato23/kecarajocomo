import { test, expect } from '@playwright/test';

test.describe('Complete Meal Planning Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're authenticated
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="signin-button"]');
    
    // Wait for authentication to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should complete full weekly meal planning workflow', async ({ page }) => {
    // Step 1: Navigate to meal planner
    await page.goto('/planificador');
    await page.waitForSelector('[data-testid="meal-planner-grid"]', { timeout: 10000 });
    
    // Verify initial empty state
    await expect(page.locator('[data-testid="empty-meal-planner"]')).toBeVisible();
    await expect(page.locator('text=Generar Plan Semanal')).toBeVisible();

    // Step 2: Configure user preferences
    await page.click('[data-testid="preferences-button"]');
    await page.waitForSelector('[data-testid="preferences-modal"]');
    
    // Set cultural preferences
    await page.selectOption('[data-testid="region-select"]', 'pampa');
    await page.selectOption('[data-testid="tradition-level"]', 'alta');
    await page.selectOption('[data-testid="mate-frequency"]', 'diario');
    await page.selectOption('[data-testid="asado-frequency"]', 'semanal');
    
    // Set budget preferences
    await page.fill('[data-testid="weekly-budget"]', '12000');
    await page.selectOption('[data-testid="budget-flexibility"]', 'moderado');
    
    // Set dietary preferences
    await page.check('[data-testid="include-beef"]');
    await page.check('[data-testid="include-chicken"]');
    await page.uncheck('[data-testid="include-pork"]');
    
    // Save preferences
    await page.click('[data-testid="save-preferences"]');
    await expect(page.locator('[data-testid="preferences-modal"]')).not.toBeVisible();

    // Step 3: Generate weekly meal plan
    await page.click('[data-testid="generate-plan-button"]');
    
    // Wait for loading state
    await expect(page.locator('[data-testid="meal-planner-loading"]')).toBeVisible();
    await expect(page.locator('text=Generando plan de comidas')).toBeVisible();
    
    // Wait for plan generation to complete (can take up to 30 seconds)
    await page.waitForSelector('[data-testid="meal-planner-grid"]', { 
      state: 'visible',
      timeout: 45000 
    });
    
    // Verify plan was generated successfully
    await expect(page.locator('[data-testid="meal-planner-loading"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="week-navigation"]')).toBeVisible();
    
    // Check all days are present
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    for (const day of days) {
      await expect(page.locator(`text=${day}`)).toBeVisible();
    }
    
    // Check all meal types are present
    const mealTypes = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
    for (const mealType of mealTypes) {
      await expect(page.locator(`text=${mealType}`).first()).toBeVisible();
    }

    // Step 4: Verify cultural authenticity
    // Check for mate in breakfast
    const breakfastSlots = page.locator('[data-testid^="meal-card-"][data-testid$="-desayuno"]');
    const firstBreakfast = breakfastSlots.first();
    await expect(firstBreakfast.locator('text=Mate')).toBeVisible();
    
    // Check for Sunday asado tradition
    const sundayLunch = page.locator('[data-testid="meal-card-6-almuerzo"]');
    await expect(sundayLunch.locator('text=/.*asado.*/i')).toBeVisible();
    await expect(sundayLunch).toHaveClass(/sunday-asado/);

    // Step 5: Modify meals (regenerate a meal)
    const mondayLunch = page.locator('[data-testid="meal-card-0-almuerzo"]');
    await mondayLunch.click({ button: 'right' });
    
    await expect(page.locator('[data-testid="meal-context-menu"]')).toBeVisible();
    await page.click('[data-testid="regenerate-meal"]');
    
    // Wait for regeneration
    await page.waitForSelector('[data-testid="meal-regenerating"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid="meal-regenerating"]', { 
      state: 'hidden',
      timeout: 30000 
    });
    
    // Verify meal was regenerated
    await expect(mondayLunch).not.toContainText('Regenerando...');

    // Step 6: Test meal alternatives
    await mondayLunch.click({ button: 'right' });
    await page.click('[data-testid="view-alternatives"]');
    
    await expect(page.locator('[data-testid="alternatives-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="alternative-recipe"]')).toHaveCount(3);
    
    // Select an alternative
    const firstAlternative = page.locator('[data-testid="alternative-recipe"]').first();
    await firstAlternative.click();
    await page.click('[data-testid="select-alternative"]');
    
    await expect(page.locator('[data-testid="alternatives-modal"]')).not.toBeVisible();

    // Step 7: Lock a meal to prevent changes
    const tuesdayDinner = page.locator('[data-testid="meal-card-1-cena"]');
    await tuesdayDinner.click({ button: 'right' });
    await page.click('[data-testid="lock-meal"]');
    
    await expect(tuesdayDinner).toHaveClass(/locked/);
    await expect(tuesdayDinner.locator('[data-testid="lock-icon"]')).toBeVisible();

    // Step 8: Generate shopping list
    await page.click('[data-testid="shopping-list-button"]');
    
    await expect(page.locator('[data-testid="shopping-list-modal"]')).toBeVisible();
    await page.waitForSelector('[data-testid="shopping-list-loading"]', { 
      state: 'hidden',
      timeout: 20000 
    });
    
    // Verify shopping list content
    await expect(page.locator('[data-testid="shopping-item"]')).toHaveCount.greaterThan(5);
    await expect(page.locator('[data-testid="total-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-cost"]')).toContainText(/\$\d+/);
    
    // Check categorized items
    await expect(page.locator('[data-testid="category-carnes"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-verduras"]')).toBeVisible();
    
    // Close shopping list
    await page.click('[data-testid="close-shopping-list"]');
    await expect(page.locator('[data-testid="shopping-list-modal"]')).not.toBeVisible();

    // Step 9: Check nutrition summary
    await expect(page.locator('[data-testid="nutrition-summary"]')).toBeVisible();
    
    const nutritionSummary = page.locator('[data-testid="nutrition-summary"]');
    await expect(nutritionSummary.locator('[data-testid="daily-calories"]')).toContainText(/\d+/);
    await expect(nutritionSummary.locator('[data-testid="weekly-calories"]')).toContainText(/\d+/);
    await expect(nutritionSummary.locator('[data-testid="protein-amount"]')).toContainText(/\d+g/);
    
    // Check nutrition recommendations
    await expect(page.locator('[data-testid="nutrition-recommendations"]')).toBeVisible();

    // Step 10: Save plan and verify persistence
    await page.click('[data-testid="save-plan-button"]');
    
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-saved"]')).toContainText(/Guardado/);
    
    // Navigate away and back to verify persistence
    await page.goto('/dashboard');
    await page.goto('/planificador');
    
    // Verify plan is still loaded
    await expect(page.locator('[data-testid="meal-planner-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="meal-card-0-desayuno"]')).toBeVisible();
    
    // Verify locked meal is still locked
    await expect(tuesdayDinner).toHaveClass(/locked/);

    // Step 11: Week navigation
    await page.click('[data-testid="next-week-button"]');
    
    // Should show empty state for next week
    await expect(page.locator('[data-testid="empty-meal-planner"]')).toBeVisible();
    
    // Navigate back to current week
    await page.click('[data-testid="prev-week-button"]');
    await expect(page.locator('[data-testid="meal-card-0-desayuno"]')).toBeVisible();
  });

  test('should handle cultural meal requirements correctly', async ({ page }) => {
    await page.goto('/planificador');
    
    // Set specific cultural preferences for testing
    await page.click('[data-testid="preferences-button"]');
    
    // Configure for high tradition level
    await page.selectOption('[data-testid="region-select"]', 'buenos-aires');
    await page.selectOption('[data-testid="tradition-level"]', 'muy-alta');
    await page.selectOption('[data-testid="mate-frequency"]', 'diario');
    await page.selectOption('[data-testid="asado-frequency"]', 'semanal');
    
    await page.click('[data-testid="save-preferences"]');
    
    // Generate plan
    await page.click('[data-testid="generate-plan-button"]');
    await page.waitForSelector('[data-testid="meal-planner-grid"]', { timeout: 45000 });
    
    // Verify cultural requirements
    // All breakfasts should include mate
    const breakfastSlots = await page.locator('[data-testid^="meal-card-"][data-testid$="-desayuno"]').count();
    for (let i = 0; i < breakfastSlots; i++) {
      const breakfast = page.locator(`[data-testid="meal-card-${i}-desayuno"]`);
      await expect(breakfast.locator('text=/mate/i')).toBeVisible();
    }
    
    // Sunday should have asado
    const sundayLunch = page.locator('[data-testid="meal-card-6-almuerzo"]');
    await expect(sundayLunch.locator('text=/asado/i')).toBeVisible();
    
    // Check for regional specialties
    await expect(page.locator('text=/choripán|empanadas|milanesas/i').first()).toBeVisible();
    
    // Verify cultural indicators
    await expect(page.locator('[data-testid="cultural-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="tradition-indicator"]')).toContainText('Muy Alta');
  });

  test('should integrate with pantry effectively', async ({ page }) => {
    // First, add some pantry items
    await page.goto('/pantry');
    
    // Add common pantry items
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-name"]', 'Pollo');
    await page.fill('[data-testid="item-quantity"]', '2');
    await page.selectOption('[data-testid="item-unit"]', 'kg');
    await page.click('[data-testid="save-item"]');
    
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-name"]', 'Arroz');
    await page.fill('[data-testid="item-quantity"]', '1');
    await page.selectOption('[data-testid="item-unit"]', 'kg');
    await page.click('[data-testid="save-item"]');
    
    // Navigate to meal planner
    await page.goto('/planificador');
    
    // Set pantry-focused mode
    await page.click('[data-testid="planning-mode"]');
    await page.selectOption('[data-testid="planning-mode-select"]', 'pantry-focused');
    
    // Generate plan
    await page.click('[data-testid="generate-plan-button"]');
    await page.waitForSelector('[data-testid="meal-planner-grid"]', { timeout: 45000 });
    
    // Verify pantry integration
    await expect(page.locator('text=/pollo/i').first()).toBeVisible();
    await expect(page.locator('text=/arroz/i').first()).toBeVisible();
    
    // Check pantry availability indicators
    await expect(page.locator('[data-testid="pantry-available"]')).toHaveCount.greaterThan(0);
    
    // Generate shopping list and verify it excludes pantry items
    await page.click('[data-testid="shopping-list-button"]');
    await page.waitForSelector('[data-testid="shopping-list-loading"]', { 
      state: 'hidden',
      timeout: 20000 
    });
    
    // Shopping list should not include items we have in pantry
    const shoppingItems = page.locator('[data-testid="shopping-item"]');
    const shoppingTexts = await shoppingItems.allTextContents();
    const hasPollo = shoppingTexts.some(text => text.toLowerCase().includes('pollo'));
    const hasArroz = shoppingTexts.some(text => text.toLowerCase().includes('arroz'));
    
    expect(hasPollo).toBeFalsy();
    expect(hasArroz).toBeFalsy();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/meal-planning/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' }),
      });
    });
    
    await page.goto('/planificador');
    
    // Try to generate plan
    await page.click('[data-testid="generate-plan-button"]');
    
    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Error generando plan');
    
    // Should show retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Test offline handling
    await page.context().setOffline(true);
    
    await page.click('[data-testid="retry-button"]');
    
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('text=Sin conexión')).toBeVisible();
  });

  test('should work efficiently with large meal plans', async ({ page }) => {
    await page.goto('/planificador');
    
    // Generate multiple weeks to test performance
    const startTime = Date.now();
    
    await page.click('[data-testid="generate-plan-button"]');
    await page.waitForSelector('[data-testid="meal-planner-grid"]', { timeout: 45000 });
    
    const generationTime = Date.now() - startTime;
    
    // Should generate within reasonable time (less than 30 seconds)
    expect(generationTime).toBeLessThan(30000);
    
    // Test scrolling performance with large plans
    const scrollStart = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
    }
    
    const scrollTime = Date.now() - scrollStart;
    
    // Scrolling should be smooth (less than 1 second for 10 scrolls)
    expect(scrollTime).toBeLessThan(1000);
    
    // Test meal modification performance
    const modificationStart = Date.now();
    
    const mondayLunch = page.locator('[data-testid="meal-card-0-almuerzo"]');
    await mondayLunch.click({ button: 'right' });
    await page.click('[data-testid="regenerate-meal"]');
    
    await page.waitForSelector('[data-testid="meal-regenerating"]', { 
      state: 'hidden',
      timeout: 20000 
    });
    
    const modificationTime = Date.now() - modificationStart;
    
    // Meal modification should be fast (less than 15 seconds)
    expect(modificationTime).toBeLessThan(15000);
  });

  test('should provide comprehensive accessibility features', async ({ page }) => {
    await page.goto('/planificador');
    
    // Generate a plan first
    await page.click('[data-testid="generate-plan-button"]');
    await page.waitForSelector('[data-testid="meal-planner-grid"]', { timeout: 45000 });
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test ARIA labels
    const grid = page.locator('[data-testid="meal-planner-grid"]');
    await expect(grid).toHaveAttribute('role', 'grid');
    await expect(grid).toHaveAttribute('aria-label');
    
    // Test meal card accessibility
    const firstMealCard = page.locator('[data-testid="meal-card-0-desayuno"]');
    await expect(firstMealCard).toHaveAttribute('tabindex');
    await expect(firstMealCard).toHaveAttribute('aria-label');
    
    // Test screen reader announcements
    await expect(page.locator('[role="status"]')).toBeVisible();
    
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('[data-testid="meal-planner-grid"]')).toBeVisible();
    
    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('[data-testid="meal-planner-grid"]')).toBeVisible();
  });
});