import { test, expect, Page } from '@playwright/test';
import { format, startOfWeek } from 'date-fns';

// Test data
const TEST_USER = {
  email: 'test-meal-planner@example.com',
  password: 'TestPassword123!',
};

const MOCK_RECIPES = [
  {
    name: 'Tortilla Española',
    description: 'Clásica tortilla de patatas',
    difficulty: 'easy',
    prepTime: '15 min',
    cookTime: '15 min',
  },
  {
    name: 'Ensalada Mediterránea',
    description: 'Fresca ensalada con tomate y feta',
    difficulty: 'easy',
    prepTime: '10 min',
    cookTime: '0 min',
  },
];

class MealPlannerPage {
  constructor(private page: Page) {}

  // Navigation methods
  async goto() {
    await this.page.goto('/planificador');
    await this.page.waitForLoadState('networkidle');
  }

  async login() {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', TEST_USER.email);
    await this.page.fill('[data-testid="password-input"]', TEST_USER.password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/planificador');
  }

  // Week navigation
  async navigateToNextWeek() {
    await this.page.click('[aria-label="Next week"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToPreviousWeek() {
    await this.page.click('[aria-label="Previous week"]');
    await this.page.waitForLoadState('networkidle');
  }

  async goToToday() {
    await this.page.click('button:has-text("Hoy")');
    await this.page.waitForLoadState('networkidle');
  }

  // View switching
  async switchToCalendarView() {
    await this.page.click('button:has-text("Calendar")');
  }

  async switchToShoppingView() {
    await this.page.click('button:has-text("Shopping List")');
  }

  async switchToNutritionView() {
    await this.page.click('button:has-text("Nutrition")');
  }

  // Meal management
  async addMealToSlot(day: string, mealType: string, recipeName: string) {
    // Click on empty meal slot
    const slotSelector = `[data-testid="meal-slot-${day}-${mealType}"]`;
    await this.page.click(slotSelector);
    
    // Wait for recipe selection modal
    await this.page.waitForSelector('[data-testid="recipe-selection-modal"]');
    
    // Search for recipe
    await this.page.fill('[data-testid="recipe-search"]', recipeName);
    
    // Select recipe
    await this.page.click(`[data-testid="recipe-option-${recipeName}"]`);
    
    // Confirm selection
    await this.page.click('[data-testid="confirm-recipe-selection"]');
    
    // Wait for modal to close
    await this.page.waitForSelector('[data-testid="recipe-selection-modal"]', { state: 'hidden' });
  }

  async removeMealFromSlot(day: string, mealType: string) {
    const slotSelector = `[data-testid="meal-slot-${day}-${mealType}"]`;
    await this.page.hover(slotSelector);
    await this.page.click(`${slotSelector} [data-testid="remove-meal-button"]`);
  }

  async lockMealSlot(day: string, mealType: string) {
    const slotSelector = `[data-testid="meal-slot-${day}-${mealType}"]`;
    await this.page.hover(slotSelector);
    await this.page.click(`${slotSelector} [data-testid="lock-meal-button"]`);
  }

  // AI Generation
  async generateWeekWithAI() {
    await this.page.click('[data-testid="generate-ai-plan-button"]');
    await this.page.waitForSelector('[data-testid="ai-generation-modal"]');
    
    // Configure preferences (use defaults for now)
    await this.page.click('[data-testid="generate-plan-button"]');
    
    // Wait for generation to complete
    await this.page.waitForSelector('[data-testid="ai-generation-complete"]', { timeout: 30000 });
    
    // Apply generated plan
    await this.page.click('[data-testid="apply-generated-plan"]');
    await this.page.waitForSelector('[data-testid="ai-generation-modal"]', { state: 'hidden' });
  }

  // Shopping list
  async openShoppingList() {
    await this.page.click('[data-testid="shopping-list-button"]');
    await this.page.waitForSelector('[data-testid="shopping-list-modal"]');
  }

  async closeShoppingList() {
    await this.page.click('[data-testid="close-shopping-list"]');
    await this.page.waitForSelector('[data-testid="shopping-list-modal"]', { state: 'hidden' });
  }

  // Export functionality
  async exportWeekPlan(format: 'json' | 'csv' | 'pdf') {
    await this.page.click('[data-testid="export-button"]');
    await this.page.waitForSelector('[data-testid="export-menu"]');
    await this.page.click(`[data-testid="export-${format}"]`);
  }

  // Preferences
  async openPreferences() {
    await this.page.click('[data-testid="preferences-button"]');
    await this.page.waitForSelector('[data-testid="preferences-modal"]');
  }

  async updatePreferences(preferences: Record<string, any>) {
    await this.openPreferences();
    
    // Update dietary preferences
    if (preferences.diet) {
      await this.page.selectOption('[data-testid="diet-select"]', preferences.diet);
    }
    
    // Update servings per meal
    if (preferences.servingsPerMeal) {
      await this.page.fill('[data-testid="servings-input"]', preferences.servingsPerMeal.toString());
    }
    
    // Update cooking skill
    if (preferences.cookingSkill) {
      await this.page.selectOption('[data-testid="cooking-skill-select"]', preferences.cookingSkill);
    }
    
    // Save preferences
    await this.page.click('[data-testid="save-preferences"]');
    await this.page.waitForSelector('[data-testid="preferences-modal"]', { state: 'hidden' });
  }

  // Assertions
  async assertWeekDisplayed(weekStart: Date) {
    const expectedText = `Semana del ${format(weekStart, 'd MMM')}`;
    await expect(this.page.locator('text=' + expectedText)).toBeVisible();
  }

  async assertMealInSlot(day: string, mealType: string, recipeName: string) {
    const slotSelector = `[data-testid="meal-slot-${day}-${mealType}"]`;
    await expect(this.page.locator(`${slotSelector}:has-text("${recipeName}")`)).toBeVisible();
  }

  async assertEmptySlot(day: string, mealType: string) {
    const slotSelector = `[data-testid="meal-slot-${day}-${mealType}"]`;
    await expect(this.page.locator(`${slotSelector} [data-testid="empty-slot"]`)).toBeVisible();
  }

  async assertLoadingState() {
    await expect(this.page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  }

  async assertErrorState(errorMessage?: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toBeVisible();
    if (errorMessage) {
      await expect(this.page.locator(`text=${errorMessage}`)).toBeVisible();
    }
  }

  async assertShoppingListItems(items: string[]) {
    await this.openShoppingList();
    for (const item of items) {
      await expect(this.page.locator(`[data-testid="shopping-item"]:has-text("${item}")`)).toBeVisible();
    }
  }
}

test.describe('Meal Planner E2E Tests', () => {
  let mealPlanner: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mealPlanner = new MealPlannerPage(page);
    
    // Setup test user and login
    await mealPlanner.login();
  });

  test.describe('Basic Navigation and Display', () => {
    test('should display current week meal planner', async () => {
      await mealPlanner.goto();
      
      // Check main elements are visible
      await expect(mealPlanner.page.locator('h1:has-text("AI Meal Planner")')).toBeVisible();
      
      // Check current week is displayed
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      await mealPlanner.assertWeekDisplayed(currentWeekStart);
      
      // Check all days are visible
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      for (const day of days) {
        await expect(mealPlanner.page.locator(`text=${day}`)).toBeVisible();
      }
      
      // Check all meal types are visible
      const mealTypes = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
      for (const mealType of mealTypes) {
        await expect(mealPlanner.page.locator(`text=${mealType}`)).toBeVisible();
      }
    });

    test('should navigate between weeks', async () => {
      await mealPlanner.goto();
      
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      await mealPlanner.assertWeekDisplayed(currentWeekStart);
      
      // Navigate to next week
      await mealPlanner.navigateToNextWeek();
      const nextWeek = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      await mealPlanner.assertWeekDisplayed(nextWeek);
      
      // Navigate to previous week (back to current)
      await mealPlanner.navigateToPreviousWeek();
      await mealPlanner.assertWeekDisplayed(currentWeekStart);
      
      // Go to today
      await mealPlanner.goToToday();
      await mealPlanner.assertWeekDisplayed(currentWeekStart);
    });

    test('should switch between view modes', async () => {
      await mealPlanner.goto();
      
      // Start in calendar view
      await expect(mealPlanner.page.locator('[data-testid="meal-planner-grid"]')).toBeVisible();
      
      // Switch to shopping view
      await mealPlanner.switchToShoppingView();
      await expect(mealPlanner.page.locator('text=Shopping List View')).toBeVisible();
      
      // Switch to nutrition view
      await mealPlanner.switchToNutritionView();
      await expect(mealPlanner.page.locator('text=Nutrition Dashboard')).toBeVisible();
      
      // Switch back to calendar view
      await mealPlanner.switchToCalendarView();
      await expect(mealPlanner.page.locator('[data-testid="meal-planner-grid"]')).toBeVisible();
    });
  });

  test.describe('Meal Management', () => {
    test('should add and remove meals from slots', async () => {
      await mealPlanner.goto();
      
      // Initially slot should be empty
      await mealPlanner.assertEmptySlot('monday', 'almuerzo');
      
      // Add a meal to the slot
      await mealPlanner.addMealToSlot('monday', 'almuerzo', MOCK_RECIPES[0].name);
      await mealPlanner.assertMealInSlot('monday', 'almuerzo', MOCK_RECIPES[0].name);
      
      // Remove the meal
      await mealPlanner.removeMealFromSlot('monday', 'almuerzo');
      await mealPlanner.assertEmptySlot('monday', 'almuerzo');
    });

    test('should lock and unlock meal slots', async () => {
      await mealPlanner.goto();
      
      // Add a meal first
      await mealPlanner.addMealToSlot('tuesday', 'cena', MOCK_RECIPES[1].name);
      
      // Lock the slot
      await mealPlanner.lockMealSlot('tuesday', 'cena');
      await expect(mealPlanner.page.locator('[data-testid="meal-slot-tuesday-cena"] [data-testid="lock-icon"]')).toBeVisible();
      
      // Unlock the slot
      await mealPlanner.lockMealSlot('tuesday', 'cena');
      await expect(mealPlanner.page.locator('[data-testid="meal-slot-tuesday-cena"] [data-testid="lock-icon"]')).toBeHidden();
    });

    test('should handle multiple meals in a day', async () => {
      await mealPlanner.goto();
      
      const day = 'wednesday';
      const meals = [
        { type: 'desayuno', recipe: MOCK_RECIPES[0].name },
        { type: 'almuerzo', recipe: MOCK_RECIPES[1].name },
        { type: 'merienda', recipe: MOCK_RECIPES[0].name },
        { type: 'cena', recipe: MOCK_RECIPES[1].name },
      ];
      
      // Add meals to all slots in a day
      for (const meal of meals) {
        await mealPlanner.addMealToSlot(day, meal.type, meal.recipe);
        await mealPlanner.assertMealInSlot(day, meal.type, meal.recipe);
      }
      
      // Verify all meals are visible
      for (const meal of meals) {
        await mealPlanner.assertMealInSlot(day, meal.type, meal.recipe);
      }
    });
  });

  test.describe('AI Meal Generation', () => {
    test('should generate weekly meal plan with AI', async () => {
      await mealPlanner.goto();
      
      // Generate AI plan
      await mealPlanner.generateWeekWithAI();
      
      // Verify that meals have been generated
      // Note: This assumes the AI generates at least some meals
      const slots = await mealPlanner.page.locator('[data-testid^="meal-slot-"]').count();
      const filledSlots = await mealPlanner.page.locator('[data-testid^="meal-slot-"]:not(:has([data-testid="empty-slot"]))').count();
      
      expect(filledSlots).toBeGreaterThan(0);
    });

    test('should respect locked slots during AI generation', async () => {
      await mealPlanner.goto();
      
      // Add and lock a meal
      const lockedMeal = MOCK_RECIPES[0].name;
      await mealPlanner.addMealToSlot('thursday', 'almuerzo', lockedMeal);
      await mealPlanner.lockMealSlot('thursday', 'almuerzo');
      
      // Generate AI plan
      await mealPlanner.generateWeekWithAI();
      
      // Verify locked meal is still there
      await mealPlanner.assertMealInSlot('thursday', 'almuerzo', lockedMeal);
      await expect(mealPlanner.page.locator('[data-testid="meal-slot-thursday-almuerzo"] [data-testid="lock-icon"]')).toBeVisible();
    });
  });

  test.describe('Shopping List Integration', () => {
    test('should generate shopping list from meal plan', async () => {
      await mealPlanner.goto();
      
      // Add some meals first
      await mealPlanner.addMealToSlot('friday', 'almuerzo', MOCK_RECIPES[0].name);
      await mealPlanner.addMealToSlot('friday', 'cena', MOCK_RECIPES[1].name);
      
      // Open shopping list
      await mealPlanner.openShoppingList();
      
      // Verify shopping list contains ingredients
      // Note: This assumes the recipes have defined ingredients
      await expect(mealPlanner.page.locator('[data-testid="shopping-list-modal"]')).toBeVisible();
      await expect(mealPlanner.page.locator('[data-testid="shopping-item"]')).toHaveCount({ range: [1, Infinity] });
      
      await mealPlanner.closeShoppingList();
    });

    test('should access shopping list from shopping view', async () => {
      await mealPlanner.goto();
      
      // Switch to shopping view
      await mealPlanner.switchToShoppingView();
      
      // Open shopping list from this view
      await expect(mealPlanner.page.locator('button:has-text("Open Shopping List")')).toBeVisible();
      await mealPlanner.page.click('button:has-text("Open Shopping List")');
      
      await expect(mealPlanner.page.locator('[data-testid="shopping-list-modal"]')).toBeVisible();
    });
  });

  test.describe('User Preferences', () => {
    test('should update user preferences', async () => {
      await mealPlanner.goto();
      
      const newPreferences = {
        diet: 'vegetarian',
        servingsPerMeal: 4,
        cookingSkill: 'advanced',
      };
      
      await mealPlanner.updatePreferences(newPreferences);
      
      // Verify preferences are saved by opening modal again
      await mealPlanner.openPreferences();
      
      await expect(mealPlanner.page.locator('[data-testid="diet-select"]')).toHaveValue('vegetarian');
      await expect(mealPlanner.page.locator('[data-testid="servings-input"]')).toHaveValue('4');
      await expect(mealPlanner.page.locator('[data-testid="cooking-skill-select"]')).toHaveValue('advanced');
    });
  });

  test.describe('Export Functionality', () => {
    test('should export meal plan in different formats', async () => {
      await mealPlanner.goto();
      
      // Add some meals to export
      await mealPlanner.addMealToSlot('saturday', 'almuerzo', MOCK_RECIPES[0].name);
      await mealPlanner.addMealToSlot('sunday', 'cena', MOCK_RECIPES[1].name);
      
      // Test JSON export
      const downloadPromise = mealPlanner.page.waitForEvent('download');
      await mealPlanner.exportWeekPlan('json');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.json');
      
      // Test CSV export
      const csvDownloadPromise = mealPlanner.page.waitForEvent('download');
      await mealPlanner.exportWeekPlan('csv');
      const csvDownload = await csvDownloadPromise;
      expect(csvDownload.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Error Handling and Loading States', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await mealPlanner.page.route('**/api/meal-planning/**', route => route.abort());
      
      await mealPlanner.goto();
      
      // Should show error state instead of crashing
      await mealPlanner.assertErrorState();
    });

    test('should show loading states during operations', async () => {
      await mealPlanner.goto();
      
      // Intercept API calls to add delay
      await mealPlanner.page.route('**/api/meal-planning/generate', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      // Start AI generation
      await mealPlanner.page.click('[data-testid="generate-ai-plan-button"]');
      
      // Should show loading state
      await mealPlanner.assertLoadingState();
    });
  });

  test.describe('Offline Functionality', () => {
    test('should work offline with cached data', async ({ context }) => {
      await mealPlanner.goto();
      
      // Add some meals while online
      await mealPlanner.addMealToSlot('monday', 'almuerzo', MOCK_RECIPES[0].name);
      
      // Go offline
      await context.setOffline(true);
      
      // Should still be able to view and modify local data
      await mealPlanner.assertMealInSlot('monday', 'almuerzo', MOCK_RECIPES[0].name);
      
      // Local operations should still work
      await mealPlanner.removeMealFromSlot('monday', 'almuerzo');
      await mealPlanner.assertEmptySlot('monday', 'almuerzo');
      
      // Go back online
      await context.setOffline(false);
      
      // Changes should sync when back online
      await mealPlanner.page.reload();
      await mealPlanner.assertEmptySlot('monday', 'almuerzo');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await mealPlanner.goto();
      
      // Check that mobile layout is displayed
      await expect(mealPlanner.page.locator('[data-testid="mobile-meal-grid"]')).toBeVisible();
      
      // Navigation should still work
      await mealPlanner.navigateToNextWeek();
      await mealPlanner.navigateToPreviousWeek();
      
      // Adding meals should work on mobile
      await mealPlanner.addMealToSlot('tuesday', 'almuerzo', MOCK_RECIPES[0].name);
      await mealPlanner.assertMealInSlot('tuesday', 'almuerzo', MOCK_RECIPES[0].name);
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await mealPlanner.goto();
      
      // Check that tablet layout is displayed
      await expect(mealPlanner.page.locator('[data-testid="tablet-meal-grid"]')).toBeVisible();
      
      // All functionality should work
      await mealPlanner.addMealToSlot('wednesday', 'cena', MOCK_RECIPES[1].name);
      await mealPlanner.assertMealInSlot('wednesday', 'cena', MOCK_RECIPES[1].name);
    });
  });

  test.describe('Performance', () => {
    test('should load meal planner within acceptable time', async () => {
      const startTime = Date.now();
      await mealPlanner.goto();
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large meal plans efficiently', async () => {
      await mealPlanner.goto();
      
      // Generate a full week of meals
      await mealPlanner.generateWeekWithAI();
      
      const startTime = Date.now();
      
      // Perform various operations
      await mealPlanner.navigateToNextWeek();
      await mealPlanner.navigateToPreviousWeek();
      await mealPlanner.switchToShoppingView();
      await mealPlanner.switchToCalendarView();
      
      const operationTime = Date.now() - startTime;
      
      // Operations should be fast even with full meal plan
      expect(operationTime).toBeLessThan(2000);
    });
  });
});