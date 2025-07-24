import { test, expect } from '@playwright/test';
import { TestHelpers, mockApiResponse } from '../utils/test-helpers';

test.describe('Recipe Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.signIn();
  });

  test('should display recipes page with recipes list', async ({ page }) => {
    await page.goto('/recipes');
    
    await expect(page.locator('h1')).toContainText('Recipes');
    await expect(page.locator('[data-testid="recipes-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-recipe-button"]')).toBeVisible();
  });

  test('should create a new recipe', async ({ page }) => {
    await page.goto('/recipes');
    
    // Click create recipe button
    await page.click('[data-testid="create-recipe-button"]');
    
    // Fill recipe form
    await page.fill('input[name="name"]', 'Test Recipe');
    await page.fill('textarea[name="description"]', 'A delicious test recipe');
    await page.fill('input[name="prepTime"]', '15');
    await page.fill('input[name="cookTime"]', '30');
    await page.fill('input[name="servings"]', '4');
    
    // Add ingredients
    await page.click('[data-testid="add-ingredient"]');
    await page.fill('input[name="ingredient-name-0"]', 'Flour');
    await page.fill('input[name="ingredient-amount-0"]', '2');
    await page.fill('input[name="ingredient-unit-0"]', 'cups');
    
    await page.click('[data-testid="add-ingredient"]');
    await page.fill('input[name="ingredient-name-1"]', 'Sugar');
    await page.fill('input[name="ingredient-amount-1"]', '1');
    await page.fill('input[name="ingredient-unit-1"]', 'cup');
    
    // Add instructions
    await page.click('[data-testid="add-instruction"]');
    await page.fill('textarea[name="instruction-0"]', 'Mix flour and sugar together');
    
    await page.click('[data-testid="add-instruction"]');
    await page.fill('textarea[name="instruction-1"]', 'Bake at 350°F for 30 minutes');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify recipe was created
    await expect(page.locator('[data-testid="recipe-card"]')).toContainText('Test Recipe');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should edit an existing recipe', async ({ page }) => {
    await helpers.createRecipe('Edit Test Recipe', ['ingredient1', 'ingredient2']);
    
    await page.goto('/recipes');
    
    // Click edit button on the recipe
    await page.click('[data-testid="edit-recipe-button"]');
    
    // Update recipe details
    await page.fill('input[name="name"]', 'Updated Test Recipe');
    await page.fill('textarea[name="description"]', 'Updated description');
    
    // Submit changes
    await page.click('button[type="submit"]');
    
    // Verify recipe was updated
    await expect(page.locator('[data-testid="recipe-card"]')).toContainText('Updated Test Recipe');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should delete a recipe', async ({ page }) => {
    await helpers.createRecipe('Delete Test Recipe');
    
    await page.goto('/recipes');
    
    // Click delete button on the recipe
    await page.click('[data-testid="delete-recipe-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify recipe was deleted
    await expect(page.locator('[data-testid="recipe-card"]')).not.toContainText('Delete Test Recipe');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should search for recipes', async ({ page }) => {
    await helpers.createRecipe('Searchable Recipe');
    await helpers.createRecipe('Another Recipe');
    
    await page.goto('/recipes');
    
    // Search for specific recipe
    await page.fill('[data-testid="search-input"]', 'Searchable');
    
    // Verify search results
    await expect(page.locator('[data-testid="recipe-card"]')).toContainText('Searchable Recipe');
    await expect(page.locator('[data-testid="recipe-card"]')).not.toContainText('Another Recipe');
  });

  test('should filter recipes by category', async ({ page }) => {
    await page.goto('/recipes');
    
    // Mock recipes with different categories
    await mockApiResponse(page, '**/api/recipes', {
      recipes: [
        { id: 1, name: 'Breakfast Recipe', category: 'Breakfast' },
        { id: 2, name: 'Dinner Recipe', category: 'Dinner' }
      ]
    });
    
    await page.reload();
    
    // Filter by Breakfast
    await page.selectOption('[data-testid="category-filter"]', 'Breakfast');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="recipe-card"]')).toContainText('Breakfast Recipe');
    await expect(page.locator('[data-testid="recipe-card"]')).not.toContainText('Dinner Recipe');
  });

  test('should view recipe details', async ({ page }) => {
    await helpers.createRecipe('Detail Test Recipe');
    
    await page.goto('/recipes');
    
    // Click on recipe card to view details
    await page.click('[data-testid="recipe-card"]');
    
    // Verify recipe details page
    await expect(page.locator('h1')).toContainText('Detail Test Recipe');
    await expect(page.locator('[data-testid="recipe-ingredients"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-instructions"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipe-nutrition"]')).toBeVisible();
  });

  test('should generate recipe using AI', async ({ page }) => {
    await page.goto('/recipes');
    
    // Click AI generate button
    await page.click('[data-testid="ai-generate-recipe"]');
    
    // Fill AI generation form
    await page.fill('input[name="ingredients"]', 'chicken, rice, vegetables');
    await page.fill('input[name="cuisine"]', 'Asian');
    await page.fill('input[name="dietary-restrictions"]', 'gluten-free');
    
    // Mock AI response
    await mockApiResponse(page, '**/api/recipes/generate/**', {
      name: 'AI Generated Recipe',
      ingredients: ['chicken', 'rice', 'vegetables'],
      instructions: ['Cook chicken', 'Prepare rice', 'Mix vegetables'],
      nutrition: { calories: 450, protein: 35, carbs: 45, fat: 15 }
    });
    
    // Generate recipe
    await page.click('[data-testid="generate-recipe"]');
    
    // Verify AI generated recipe
    await expect(page.locator('[data-testid="generated-recipe"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-recipe"]')).toContainText('AI Generated Recipe');
    
    // Save generated recipe
    await page.click('[data-testid="save-generated-recipe"]');
    
    // Verify recipe was saved
    await expect(page.locator('[data-testid="recipe-card"]')).toContainText('AI Generated Recipe');
  });

  test('should check recipe availability based on pantry', async ({ page }) => {
    await helpers.addPantryItem('Chicken', 1);
    await helpers.addPantryItem('Rice', 2);
    await helpers.createRecipe('Chicken Rice Recipe', ['Chicken', 'Rice']);
    
    await page.goto('/recipes');
    
    // Check recipe availability
    await page.click('[data-testid="check-availability"]');
    
    // Verify availability status
    await expect(page.locator('[data-testid="availability-status"]')).toContainText('Available');
    await expect(page.locator('[data-testid="available-ingredients"]')).toContainText('Chicken, Rice');
  });

  test('should scale recipe servings', async ({ page }) => {
    await helpers.createRecipe('Scalable Recipe');
    
    await page.goto('/recipes');
    await page.click('[data-testid="recipe-card"]');
    
    // Change servings from 4 to 8
    await page.fill('input[name="servings"]', '8');
    await page.click('[data-testid="scale-recipe"]');
    
    // Verify ingredients are scaled
    await expect(page.locator('[data-testid="ingredient-amount"]').first()).toContainText('4'); // doubled from 2
  });

  test('should add recipe to meal plan', async ({ page }) => {
    await helpers.createRecipe('Meal Plan Recipe');
    
    await page.goto('/recipes');
    await page.click('[data-testid="recipe-card"]');
    
    // Add to meal plan
    await page.click('[data-testid="add-to-meal-plan"]');
    
    // Select day and meal type
    await page.selectOption('[data-testid="meal-day"]', 'Monday');
    await page.selectOption('[data-testid="meal-type"]', 'Dinner');
    
    // Confirm addition
    await page.click('[data-testid="confirm-add-to-plan"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Added to meal plan');
  });

  test('should display nutrition information', async ({ page }) => {
    await helpers.createRecipe('Nutrition Recipe');
    
    await page.goto('/recipes');
    await page.click('[data-testid="recipe-card"]');
    
    // Verify nutrition information is displayed
    await expect(page.locator('[data-testid="nutrition-calories"]')).toBeVisible();
    await expect(page.locator('[data-testid="nutrition-protein"]')).toBeVisible();
    await expect(page.locator('[data-testid="nutrition-carbs"]')).toBeVisible();
    await expect(page.locator('[data-testid="nutrition-fat"]')).toBeVisible();
  });

  test('should handle empty state when no recipes exist', async ({ page }) => {
    // Mock empty recipes
    await mockApiResponse(page, '**/api/recipes', { recipes: [] });
    
    await page.goto('/recipes');
    
    // Verify empty state
    await expect(page.locator('[data-testid="empty-recipes"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-recipes"]')).toContainText('No recipes found');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/recipes', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/recipes');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load recipes');
  });
});