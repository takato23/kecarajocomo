import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForAppLoad() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('body')).toBeVisible();
  }

  async signIn(email: string = 'test@example.com', password: string = 'password123') {
    await this.page.goto('/auth/signin');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  async signOut() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="sign-out"]');
    await this.page.waitForURL('/');
  }

  async addPantryItem(name: string, quantity: number = 1, location: string = 'Kitchen') {
    await this.page.goto('/pantry');
    await this.page.click('[data-testid="add-item-button"]');
    await this.page.fill('input[name="name"]', name);
    await this.page.fill('input[name="quantity"]', quantity.toString());
    await this.page.selectOption('select[name="location"]', location);
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  async createRecipe(name: string, ingredients: string[] = ['ingredient1', 'ingredient2']) {
    await this.page.goto('/recipes');
    await this.page.click('[data-testid="create-recipe-button"]');
    await this.page.fill('input[name="name"]', name);
    
    for (const ingredient of ingredients) {
      await this.page.click('[data-testid="add-ingredient"]');
      await this.page.fill('input[name="ingredient-name"]:last-of-type', ingredient);
    }
    
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  async planMeal(day: string, mealType: string, recipeName: string) {
    await this.page.goto('/planner');
    await this.page.click(`[data-testid="meal-slot-${day}-${mealType}"]`);
    await this.page.fill('input[name="recipe-search"]', recipeName);
    await this.page.click(`[data-testid="recipe-option-${recipeName}"]`);
    await this.page.click('button[data-testid="confirm-meal"]');
    await expect(this.page.locator(`[data-testid="meal-slot-${day}-${mealType}"] text=${recipeName}`)).toBeVisible();
  }

  async checkAccessibility() {
    // Skip to content link
    await this.page.keyboard.press('Tab');
    await expect(this.page.locator('[data-testid="skip-to-content"]')).toBeFocused();
    
    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  }

  async checkResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.waitForAppLoad();
    
    // Check if mobile navigation is visible
    await expect(this.page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.waitForAppLoad();
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.waitForAppLoad();
    
    // Check if desktop navigation is visible
    await expect(this.page.locator('[data-testid="desktop-nav"]')).toBeVisible();
  }

  async checkPerformance() {
    const startTime = Date.now();
    await this.page.goto('/dashboard');
    await this.waitForAppLoad();
    const loadTime = Date.now() - startTime;
    
    // Expect page to load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance metrics
    const performanceMetrics = await this.page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });
    
    expect(performanceMetrics).toBeTruthy();
  }
}

export const mockApiResponse = (page: Page, endpoint: string, response: any) => {
  return page.route(endpoint, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
};

export const interceptApiCall = (page: Page, endpoint: string) => {
  return page.waitForRequest(endpoint);
};