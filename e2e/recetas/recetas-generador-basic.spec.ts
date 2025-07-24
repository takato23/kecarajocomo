import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Helper functions
const takeScreenshot = async (page: Page, name: string) => {
  await page.screenshot({
    path: path.join(__dirname, '../../tests/screenshots/recetas', `${name}.png`),
    fullPage: true
  });
};

const waitForModalOpen = async (page: Page) => {
  await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible({ timeout: 10000 });
};

const waitForModalClose = async (page: Page) => {
  await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible({ timeout: 10000 });
};

// Basic test suite for recipe generator
test.describe('Recipe Generator - Basic E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all API endpoints to prevent network calls
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/ai/')) {
        await route.fulfill({
          json: {
            success: true,
            recipe: {
              title: 'Pasta con Salmón Generada',
              description: 'Receta generada por IA',
              ingredients: [
                { name: 'Pasta', quantity: '400', unit: 'g' },
                { name: 'Salmón', quantity: '300', unit: 'g' }
              ],
              instructions: ['Cocinar pasta', 'Agregar salmón'],
              prep_time: 15,
              cook_time: 20,
              servings: 4,
              difficulty: 'medium'
            },
            confidence_score: 0.95
          }
        });
      } else if (url.includes('/scan/')) {
        await route.fulfill({
          json: {
            success: true,
            recipe: {
              title: 'Receta Escaneada',
              description: 'Extraída de imagen',
              ingredients: [{ name: 'Ingrediente', quantity: '2', unit: 'tazas' }],
              instructions: ['Paso escaneado'],
              prep_time: 10,
              cook_time: 15,
              servings: 2
            },
            confidence_score: 0.88
          }
        });
      } else if (url.includes('/import')) {
        await route.fulfill({
          json: {
            success: true,
            imported: 1,
            skipped: 0,
            errors: 0
          }
        });
      } else {
        await route.fulfill({ json: { success: true } });
      }
    });

    // Navigate to recipes page
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
  });

  test('should open recipe creation modal', async ({ page }) => {
    await takeScreenshot(page, 'initial-recipes-page');
    
    const createButton = page.locator('button', { hasText: 'Crear Receta' });
    await expect(createButton).toBeVisible();
    
    await createButton.click();
    await waitForModalOpen(page);
    
    await expect(page.locator('h1', { hasText: 'Crear Receta' })).toBeVisible();
    await expect(page.locator('text=Elige tu método preferido')).toBeVisible();
    
    await takeScreenshot(page, 'modal-opened');
    
    // Verify all creation options are visible
    await expect(page.locator('text=Crear Manualmente')).toBeVisible();
    await expect(page.locator('text=Generar con IA')).toBeVisible(); 
    await expect(page.locator('text=Escanear Receta')).toBeVisible();
    await expect(page.locator('text=Importar Archivo')).toBeVisible();
  });

  test('should navigate to manual creation mode', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await page.locator('text=Crear Manualmente').click();
    await expect(page.locator('h3', { hasText: 'Crear Receta Manual' })).toBeVisible();
    
    await takeScreenshot(page, 'manual-creation-mode');
    
    // Check form elements are present
    await expect(page.locator('input[placeholder*="Pasta Carbonara"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="descripción"]')).toBeVisible();
  });

  test('should navigate to AI generation mode', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await page.locator('text=Generar con IA').click();
    await expect(page.locator('h3', { hasText: 'Generación con IA' })).toBeVisible();
    
    await takeScreenshot(page, 'ai-generation-mode');
    
    // Check AI provider selection
    await expect(page.locator('button').filter({ hasText: 'OpenAI' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Claude' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Gemini' })).toBeVisible();
  });

  test('should navigate to photo scanning mode', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await page.locator('text=Escanear Receta').click();
    await expect(page.locator('h3', { hasText: 'Escanear Receta' })).toBeVisible();
    
    await takeScreenshot(page, 'photo-scan-mode');
    
    // Check scan options
    await expect(page.locator('text=Usar Cámara')).toBeVisible();
    await expect(page.locator('text=Subir Archivo')).toBeVisible();
  });

  test('should navigate to import mode', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await page.locator('text=Importar Archivo').click();
    await expect(page.locator('h3', { hasText: 'Importar Recetas' })).toBeVisible();
    
    await takeScreenshot(page, 'import-mode');
    
    // Check file input
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('text=Formato Esperado')).toBeVisible();
  });

  test('should close modal when clicking X', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();
    
    await waitForModalClose(page);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await takeScreenshot(page, 'mobile-modal');
    
    // Check mobile layout
    await expect(page.locator('.grid-cols-1')).toBeVisible();
  });

  test('should handle AI generation flow', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await page.locator('text=Generar con IA').click();
    
    // Fill basic form
    await page.fill('textarea[placeholder*="pasta cremosa"]', 'Una pasta italiana con salmón');
    await page.locator('button').filter({ hasText: 'Claude' }).click();
    
    await takeScreenshot(page, 'ai-form-filled');
    
    await page.locator('button', { hasText: 'Generar Receta' }).click();
    
    // Wait for generation
    await expect(page.locator('text=Generando Receta')).toBeVisible();
    
    await takeScreenshot(page, 'ai-generating');
    
    // Should show generated recipe
    await expect(page.locator('text=Pasta con Salmón Generada')).toBeVisible({ timeout: 15000 });
    
    await takeScreenshot(page, 'ai-generated-result');
  });

  test('should handle manual recipe creation', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    await page.locator('text=Crear Manualmente').click();
    
    // Fill basic info
    await page.fill('input[placeholder*="Pasta Carbonara"]', 'Pasta de Prueba');
    await page.fill('textarea[placeholder*="descripción"]', 'Una deliciosa pasta para testing');
    
    // Add ingredient
    await page.fill('input[placeholder="Cantidad"]', '400');
    await page.fill('input[placeholder="Unidad"]', 'g');
    await page.fill('input[placeholder="Ingrediente"]', 'Pasta');
    await page.locator('button', { hasText: '+' }).click();
    
    // Add instruction
    await page.fill('textarea[placeholder*="siguiente paso"]', 'Cocinar la pasta al dente');
    await page.locator('button', { hasText: 'Agregar' }).click();
    
    await takeScreenshot(page, 'manual-form-complete');
    
    // Create recipe
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    
    // Should show success notification
    await expect(page.locator('text=¡Receta creada!')).toBeVisible({ timeout: 10000 });
    
    await takeScreenshot(page, 'manual-creation-success');
  });

  test('should validate Spanish content', async ({ page }) => {
    await page.locator('button', { hasText: 'Crear Receta' }).click();
    await waitForModalOpen(page);
    
    // Check Spanish phrases are present
    const spanishPhrases = [
      'Crear Receta',
      'Elige tu método preferido',
      'Crear Manualmente',
      'Generar con IA',
      'Escanear Receta',
      'Importar Archivo'
    ];
    
    for (const phrase of spanishPhrases) {
      await expect(page.locator(`text=${phrase}`)).toBeVisible();
    }
    
    await takeScreenshot(page, 'spanish-content-validated');
  });
});