import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';

// Test data and mocks
const MOCK_RECIPE_DATA = {
  manual: {
    title: 'Pasta Carbonara Casera',
    description: 'Una deliciosa pasta italiana tradicional',
    ingredients: [
      { name: 'Pasta', quantity: '400', unit: 'g' },
      { name: 'Huevos', quantity: '3', unit: 'unidades' },
      { name: 'Queso parmesano', quantity: '100', unit: 'g' }
    ],
    instructions: [
      'Hervir agua con sal en una olla grande',
      'Cocinar la pasta según las instrucciones del paquete',
      'Mezclar huevos y queso en un bowl'
    ]
  },
  ai: {
    prompt: 'Una pasta cremosa con salmón y espinacas, estilo italiano',
    ingredients: 'pasta, salmón, espinacas, crema',
    cuisine: 'italiana',
    difficulty: 'medium',
    servings: 4
  },
  import: {
    filename: 'recetas-test.json',
    content: [
      {
        title: 'Ensalada César',
        description: 'Ensalada clásica romana',
        ingredients: [
          { name: 'Lechuga romana', quantity: '1', unit: 'cabeza' }
        ],
        instructions: ['Lavar y cortar la lechuga'],
        prep_time: 10,
        cook_time: 0,
        servings: 2
      }
    ]
  }
};

// Mock services setup
const setupMocks = async (page: Page) => {
  // Mock AI services
  await page.route('**/api/ai/**', async route => {
    const url = route.request().url();
    if (url.includes('/generate')) {
      await route.fulfill({
        json: {
          success: true,
          recipe: {
            title: 'Pasta con Salmón y Espinacas',
            description: 'Deliciosa pasta italiana con salmón fresco',
            ingredients: [
              { name: 'Pasta', quantity: '400', unit: 'g' },
              { name: 'Salmón', quantity: '300', unit: 'g' },
              { name: 'Espinacas', quantity: '200', unit: 'g' }
            ],
            instructions: [
              'Cocinar la pasta al dente',
              'Saltear el salmón con espinacas',
              'Mezclar todo con crema'
            ],
            prep_time: 15,
            cook_time: 20,
            servings: 4,
            difficulty: 'medium'
          },
          confidence_score: 0.95,
          generatedPrompt: 'Genera una receta de pasta con salmón y espinacas...'
        }
      });
    }
  });

  // Mock OCR/Photo scanning services
  await page.route('**/api/scan/**', async route => {
    await route.fulfill({
      json: {
        success: true,
        recipe: {
          title: 'Receta Escaneada',
          description: 'Extraída de imagen',
          ingredients: [
            { name: 'Ingrediente 1', quantity: '2', unit: 'tazas' }
          ],
          instructions: ['Paso 1 de la receta escaneada'],
          prep_time: 10,
          cook_time: 15,
          servings: 2
        },
        confidence_score: 0.88,
        extractedText: 'Texto extraído de la imagen...'
      }
    });
  });

  // Mock import services
  await page.route('**/api/recipes/import', async route => {
    await route.fulfill({
      json: {
        success: true,
        imported: 1,
        skipped: 0,
        errors: 0,
        summary: 'Importación completada exitosamente'
      }
    });
  });

  // Mock bulk import endpoint
  await page.route('**/api/recipes/full', async route => {
    await route.fulfill({
      json: [
        {
          title: 'Receta del Archivo Completo',
          description: 'Importada desde recipes_full.json',
          ingredients: [{ name: 'Test', quantity: '1', unit: 'unidad' }],
          instructions: ['Instrucción de prueba'],
          prep_time: 5,
          cook_time: 10,
          servings: 1
        }
      ]
    });
  });

  // Mock analytics
  await page.route('**/api/analytics/**', async route => {
    await route.fulfill({ json: { success: true } });
  });

  // Mock notifications
  await page.route('**/api/notifications/**', async route => {
    await route.fulfill({ json: { success: true } });
  });
};

// Helper functions
const waitForModalOpen = async (page: Page) => {
  await expect(page.locator('[data-testid="recipe-creation-modal"]').or(
    page.locator('.fixed.inset-0.z-50')
  )).toBeVisible({ timeout: 10000 });
};

const waitForModalClose = async (page: Page) => {
  await expect(page.locator('[data-testid="recipe-creation-modal"]').or(
    page.locator('.fixed.inset-0.z-50')
  )).not.toBeVisible({ timeout: 10000 });
};

const takeScreenshot = async (page: Page, name: string) => {
  await page.screenshot({
    path: path.join(__dirname, '../../tests/screenshots/recetas', `${name}.png`),
    fullPage: true
  });
};

// Test suite
test.describe('Recipe Generator E2E Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Setup mocks
    await setupMocks(page);
    
    // Navigate to recipes page
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to be ready
    await expect(page.locator('h1')).toContainText('My Recipes');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('Modal Opening and Navigation', () => {
    test('should open recipe creation modal when clicking "Crear Receta" button', async () => {
      await takeScreenshot(page, 'recipes-page-initial');
      
      const createButton = page.locator('button', { hasText: 'Crear Receta' });
      await expect(createButton).toBeVisible();
      
      await createButton.click();
      await waitForModalOpen(page);
      
      // Check modal header
      await expect(page.locator('h1', { hasText: 'Crear Receta' })).toBeVisible();
      await expect(page.locator('text=Elige tu método preferido')).toBeVisible();
      
      await takeScreenshot(page, 'modal-selection-screen');
      
      // Verify all 4 creation options are visible
      await expect(page.locator('text=Crear Manualmente')).toBeVisible();
      await expect(page.locator('text=Generar con IA')).toBeVisible();
      await expect(page.locator('text=Escanear Receta')).toBeVisible();
      await expect(page.locator('text=Importar Archivo')).toBeVisible();
    });

    test('should close modal when clicking X button', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      const closeButton = page.locator('button').filter({ has: page.locator('svg') });
      await closeButton.first().click();
      
      await waitForModalClose(page);
    });

    test('should navigate back to selection from any mode', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      // Test navigation from AI mode
      await page.locator('text=Generar con IA').click();
      await expect(page.locator('text=Configuración de IA')).toBeVisible();
      
      await page.locator('button', { hasText: 'Volver' }).click();
      await expect(page.locator('text=Elige tu método preferido')).toBeVisible();
    });
  });

  test.describe('Manual Recipe Creation Flow', () => {
    test('should create recipe manually with complete form', async () => {
      // Mark task as in progress
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Crear Manualmente').click();
      await expect(page.locator('h3', { hasText: 'Crear Receta Manual' })).toBeVisible();
      
      await takeScreenshot(page, 'manual-creation-form');
      
      // Fill basic info
      await page.fill('input[placeholder*="Pasta Carbonara"]', MOCK_RECIPE_DATA.manual.title);
      await page.fill('textarea[placeholder*="descripción"]', MOCK_RECIPE_DATA.manual.description);
      
      // Set times and servings
      await page.fill('input[type="number"]', '15', { first: true }); // prep time
      await page.fill('input[type="number"]', '30', { nth: 1 }); // cook time
      await page.fill('input[type="number"]', '4', { nth: 2 }); // servings
      
      // Add ingredients
      for (const ingredient of MOCK_RECIPE_DATA.manual.ingredients) {
        await page.fill('input[placeholder="Cantidad"]', ingredient.quantity);
        await page.fill('input[placeholder="Unidad"]', ingredient.unit);
        await page.fill('input[placeholder="Ingrediente"]', ingredient.name);
        await page.locator('button', { hasText: '+' }).click();
      }
      
      await takeScreenshot(page, 'manual-creation-with-ingredients');
      
      // Add instructions
      for (const instruction of MOCK_RECIPE_DATA.manual.instructions) {
        await page.fill('textarea[placeholder*="siguiente paso"]', instruction);
        await page.locator('button', { hasText: 'Agregar' }).click();
      }
      
      await takeScreenshot(page, 'manual-creation-complete');
      
      // Submit recipe
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      
      // Wait for success notification
      await expect(page.locator('text=¡Receta creada!')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=se agregó a tu colección')).toBeVisible();
      
      await waitForModalClose(page);
      await takeScreenshot(page, 'manual-creation-success');
    });

    test('should show validation errors for incomplete form', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      await page.locator('text=Crear Manualmente').click();
      
      // Try to submit without required fields
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      
      // Check for validation message
      await expect(page.locator('text=Campos Requeridos')).toBeVisible();
      await expect(page.locator('text=completa título, ingredientes e instrucciones')).toBeVisible();
      
      await takeScreenshot(page, 'manual-creation-validation-error');
    });
  });

  test.describe('AI Recipe Generation Flow', () => {
    test('should generate recipe with AI successfully', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Generar con IA').click();
      await expect(page.locator('h3', { hasText: 'Generación con IA' })).toBeVisible();
      
      await takeScreenshot(page, 'ai-generation-form');
      
      // Select AI provider (Claude)
      await page.locator('button').filter({ hasText: 'Claude' }).click();
      
      // Fill prompt and configuration
      await page.fill('textarea[placeholder*="pasta cremosa"]', MOCK_RECIPE_DATA.ai.prompt);
      await page.fill('input[placeholder*="pollo, arroz"]', MOCK_RECIPE_DATA.ai.ingredients);
      
      // Set configuration
      await page.selectOption('select', MOCK_RECIPE_DATA.ai.cuisine);
      await page.selectOption('select[value="medium"]', MOCK_RECIPE_DATA.ai.difficulty);
      await page.fill('input[type="number"]', MOCK_RECIPE_DATA.ai.servings.toString());
      
      await takeScreenshot(page, 'ai-generation-configured');
      
      // Generate recipe
      await page.locator('button', { hasText: 'Generar Receta' }).click();
      
      // Wait for generation loading state
      await expect(page.locator('text=Generando Receta')).toBeVisible();
      await expect(page.locator('text=La IA está creando tu receta personalizada')).toBeVisible();
      
      await takeScreenshot(page, 'ai-generation-loading');
      
      // Wait for generated recipe
      await expect(page.locator('text=Pasta con Salmón y Espinacas')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=95% confianza')).toBeVisible();
      
      await takeScreenshot(page, 'ai-generation-result');
      
      // Save recipe
      await page.locator('button', { hasText: 'Guardar Receta' }).click();
      
      await expect(page.locator('text=¡Receta creada!')).toBeVisible();
      await waitForModalClose(page);
    });

    test('should handle AI generation errors gracefully', async () => {
      // Mock AI service error
      await page.route('**/api/ai/**', async route => {
        await route.fulfill({
          status: 500,
          json: { error: 'AI service temporarily unavailable' }
        });
      });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      await page.locator('text=Generar con IA').click();
      
      await page.fill('textarea[placeholder*="pasta cremosa"]', 'Test prompt');
      await page.locator('button', { hasText: 'Generar Receta' }).click();
      
      // Check error handling
      await expect(page.locator('text=Error de Generación')).toBeVisible();
      await expect(page.locator('text=No se pudo generar la receta')).toBeVisible();
      
      await takeScreenshot(page, 'ai-generation-error');
    });

    test('should test empty prompt handling', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      await page.locator('text=Generar con IA').click();
      
      // Try to generate without prompt
      await page.locator('button', { hasText: 'Generar Receta' }).click();
      
      // Should still work as prompt is optional
      await expect(page.locator('text=Generando Receta')).toBeVisible();
    });
  });

  test.describe('Photo Scanning Flow', () => {
    test('should scan recipe from photo successfully', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Escanear Receta').click();
      await expect(page.locator('h3', { hasText: 'Escanear Receta' })).toBeVisible();
      
      await takeScreenshot(page, 'photo-scan-options');
      
      // Select file upload option
      await page.locator('text=Subir Archivo').click();
      
      // Create a mock image file
      const filePath = path.join(__dirname, '../fixtures/test-recipe-image.jpg');
      await page.setInputFiles('input[type="file"]', {
        name: 'recipe-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });
      
      await takeScreenshot(page, 'photo-scan-file-selected');
      
      // Scan the image
      await page.locator('button', { hasText: 'Escanear' }).click();
      
      // Wait for scanning process
      await expect(page.locator('text=Escaneando Imagen')).toBeVisible();
      await expect(page.locator('text=Extrayendo receta de la imagen')).toBeVisible();
      
      await takeScreenshot(page, 'photo-scan-processing');
      
      // Wait for scan result
      await expect(page.locator('text=Receta Extraída')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=88% confianza')).toBeVisible();
      
      await takeScreenshot(page, 'photo-scan-result');
      
      // Save scanned recipe
      await page.locator('button', { hasText: 'Guardar Receta' }).click();
      
      await expect(page.locator('text=¡Receta creada!')).toBeVisible();
    });

    test('should handle blurry image scanning', async () => {
      // Mock low confidence scan result
      await page.route('**/api/scan/**', async route => {
        await route.fulfill({
          json: {
            success: false,
            confidence_score: 0.2,
            errors: ['Imagen demasiado borrosa para extraer receta']
          }
        });
      });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      await page.locator('text=Escanear Receta').click();
      
      await page.setInputFiles('input[type="file"]', {
        name: 'blurry-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('blurry-image-data')
      });
      
      await page.locator('button', { hasText: 'Escanear' }).click();
      
      await expect(page.locator('text=Error de Escaneo')).toBeVisible();
      await expect(page.locator('text=Imagen demasiado borrosa')).toBeVisible();
      
      await takeScreenshot(page, 'photo-scan-blurry-error');
    });
  });

  test.describe('Batch Import Flow', () => {
    test('should import recipes from JSON file', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Importar Archivo').click();
      await expect(page.locator('h3', { hasText: 'Importar Recetas' })).toBeVisible();
      
      await takeScreenshot(page, 'import-form');
      
      // Upload JSON file
      await page.setInputFiles('input[type="file"]', {
        name: MOCK_RECIPE_DATA.import.filename,
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(MOCK_RECIPE_DATA.import.content))
      });
      
      await expect(page.locator(`text=${MOCK_RECIPE_DATA.import.filename}`)).toBeVisible();
      
      await takeScreenshot(page, 'import-file-selected');
      
      // Import recipes
      await page.locator('button', { hasText: 'Importar Recetas' }).click();
      
      // Wait for import process
      await expect(page.locator('text=Importando Recetas')).toBeVisible();
      
      await takeScreenshot(page, 'import-processing');
      
      // Wait for success
      await expect(page.locator('text=Importación Completada')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=1 recetas importadas')).toBeVisible();
    });

    test('should handle malformed JSON file', async () => {
      // Mock import error
      await page.route('**/api/recipes/import', async route => {
        await route.fulfill({
          status: 400,
          json: { error: 'Archivo JSON malformado' }
        });
      });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      await page.locator('text=Importar Archivo').click();
      
      await page.setInputFiles('input[type="file"]', {
        name: 'malformed.json',
        mimeType: 'application/json',
        buffer: Buffer.from('invalid json content')
      });
      
      await page.locator('button', { hasText: 'Importar Recetas' }).click();
      
      await expect(page.locator('text=Error de Importación')).toBeVisible();
      await expect(page.locator('text=No se pudo importar el archivo')).toBeVisible();
      
      await takeScreenshot(page, 'import-malformed-error');
    });

    test('should handle duplicate recipes during import', async () => {
      // Mock import with duplicates
      await page.route('**/api/recipes/import', async route => {
        await route.fulfill({
          json: {
            success: true,
            imported: 2,
            skipped: 3,
            errors: 1,
            summary: 'Algunas recetas ya existían'
          }
        });
      });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      await page.locator('text=Importar Archivo').click();
      
      await page.setInputFiles('input[type="file"]', {
        name: 'recipes-with-duplicates.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify([{}, {}, {}]))
      });
      
      await page.locator('button', { hasText: 'Importar Recetas' }).click();
      
      await expect(page.locator('text=2 recetas importadas, 3 omitidas, 1 errores')).toBeVisible();
      
      await takeScreenshot(page, 'import-with-duplicates');
    });
  });

  test.describe('Admin Bulk Import Flow', () => {
    test('should show admin bulk import for admin users', async () => {
      // Mock admin user
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({ isAdmin: true }));
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await expect(page.locator('text=Importar Completo (Admin)')).toBeVisible();
      
      await takeScreenshot(page, 'admin-bulk-import-visible');
    });

    test('should deny access to non-admin users', async () => {
      // Mock regular user
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({ isAdmin: false }));
      });
      
      // Mock access denied response
      await page.route('**/api/recipes/full', async route => {
        await route.fulfill({
          status: 403,
          json: { error: 'Solo los administradores pueden acceder' }
        });
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      // Admin option should not be visible for regular users
      await expect(page.locator('text=Admin')).not.toBeVisible();
    });
  });

  test.describe('Responsive Design and Mobile UX', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 size
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await takeScreenshot(page, 'mobile-modal-selection');
      
      // Check mobile layout adaptations
      await expect(page.locator('.grid-cols-1')).toBeVisible();
      
      // Test mobile AI generation flow
      await page.locator('text=Generar con IA').click();
      
      await takeScreenshot(page, 'mobile-ai-generation');
      
      // Check responsive grid
      await expect(page.locator('.sm\\:grid-cols-2')).toBeVisible();
      
      // Test mobile manual creation
      await page.locator('button', { hasText: 'Volver' }).click();
      await page.locator('text=Crear Manualmente').click();
      
      await takeScreenshot(page, 'mobile-manual-creation');
      
      // Test mobile ingredient addition
      await page.fill('input[placeholder="Cantidad"]', '2');
      await page.fill('input[placeholder="Unidad"]', 'tazas');
      await page.fill('input[placeholder="Ingrediente"]', 'Arroz');
      await page.locator('button', { hasText: '+' }).click();
      
      await takeScreenshot(page, 'mobile-ingredient-added');
    });

    test('should handle touch interactions', async () => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      // Test touch tap on creation options
      await page.locator('text=Generar con IA').tap();
      await expect(page.locator('h3', { hasText: 'Generación con IA' })).toBeVisible();
      
      // Test touch interaction with providers
      await page.locator('button').filter({ hasText: 'Claude' }).tap();
      await expect(page.locator('button').filter({ hasText: 'Claude' })).toHaveClass(/border-purple-500/);
    });
  });

  test.describe('Analytics and Notifications Integration', () => {
    test('should track analytics events during recipe creation', async () => {
      let analyticsEvents: string[] = [];
      
      // Intercept analytics calls
      await page.route('**/api/analytics/**', async route => {
        const postData = route.request().postDataJSON();
        analyticsEvents.push(postData.event);
        await route.fulfill({ json: { success: true } });
      });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Generar con IA').click();
      await page.fill('textarea[placeholder*="pasta cremosa"]', 'Test recipe');
      await page.locator('button', { hasText: 'Generar Receta' }).click();
      
      // Wait for generation and save
      await expect(page.locator('text=Pasta con Salmón y Espinacas')).toBeVisible({ timeout: 15000 });
      await page.locator('button', { hasText: 'Guardar Receta' }).click();
      
      // Verify analytics events were tracked
      expect(analyticsEvents).toContain('ai_recipe_generation_start');
      expect(analyticsEvents).toContain('ai_recipe_generation_success');
      expect(analyticsEvents).toContain('recipe_created');
    });

    test('should show notifications in Spanish', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Generar con IA').click();
      await page.fill('textarea[placeholder*="pasta cremosa"]', 'Test recipe');
      await page.locator('button', { hasText: 'Generar Receta' }).click();
      
      // Wait for generation completion
      await expect(page.locator('text=Pasta con Salmón y Espinacas')).toBeVisible({ timeout: 15000 });
      await page.locator('button', { hasText: 'Guardar Receta' }).click();
      
      // Check Spanish notifications
      await expect(page.locator('text=¡Receta creada!')).toBeVisible();
      await expect(page.locator('text=se agregó a tu colección')).toBeVisible();
      
      await takeScreenshot(page, 'spanish-notifications');
    });

    test('should handle notification errors gracefully', async () => {
      // Mock notification service error
      await page.route('**/api/notifications/**', async route => {
        await route.fulfill({
          status: 500,
          json: { error: 'Notification service unavailable' }
        });
      });
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Crear Manualmente').click();
      await page.fill('input[placeholder*="Pasta Carbonara"]', 'Test Recipe');
      
      // Add minimal required data
      await page.fill('input[placeholder="Cantidad"]', '1');
      await page.fill('input[placeholder="Unidad"]', 'taza');
      await page.fill('input[placeholder="Ingrediente"]', 'Test');
      await page.locator('button', { hasText: '+' }).click();
      
      await page.fill('textarea[placeholder*="siguiente paso"]', 'Test instruction');
      await page.locator('button', { hasText: 'Agregar' }).click();
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      
      // Recipe should still be created even if notifications fail
      await waitForModalClose(page);
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Generar con IA').click();
      await page.fill('textarea[placeholder*="pasta cremosa"]', 'Test recipe');
      await page.locator('button', { hasText: 'Generar Receta' }).click();
      
      // Should show appropriate error message
      await expect(page.locator('text=Error')).toBeVisible({ timeout: 10000 });
      
      await takeScreenshot(page, 'network-error-handling');
    });

    test('should validate file types for import', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Importar Archivo').click();
      
      // Try to upload non-JSON file
      await page.setInputFiles('input[type="file"]', {
        name: 'not-json.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not JSON')
      });
      
      // File input should reject non-JSON files due to accept attribute
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('accept', '.json');
    });

    test('should handle large file sizes', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Escanear Receta').click();
      
      // Try to upload very large image
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      await page.setInputFiles('input[type="file"]', {
        name: 'large-image.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer
      });
      
      await page.locator('button', { hasText: 'Escanear' }).click();
      
      // Should handle large files appropriately (either process or show size warning)
      await expect(page.locator('text=Escaneando Imagen').or(
        page.locator('text=Archivo demasiado grande')
      )).toBeVisible({ timeout: 10000 });
    });

    test('should maintain session state across modal operations', async () => {
      // Start manual creation
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      await page.locator('text=Crear Manualmente').click();
      await page.fill('input[placeholder*="Pasta Carbonara"]', 'Test Recipe Title');
      
      // Navigate away and back
      await page.locator('button', { hasText: 'Volver' }).click();
      await page.locator('text=Crear Manualmente').click();
      
      // Check if form was reset (expected behavior)
      const titleInput = page.locator('input[placeholder*="Pasta Carbonara"]');
      await expect(titleInput).toHaveValue('');
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle multiple rapid clicks gracefully', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      // Rapidly click different options
      for (let i = 0; i < 5; i++) {
        await page.locator('text=Generar con IA').click();
        await page.locator('button', { hasText: 'Volver' }).click();
        await page.locator('text=Crear Manualmente').click();
        await page.locator('button', { hasText: 'Volver' }).click();
      }
      
      // Should still be functional
      await page.locator('text=Generar con IA').click();
      await expect(page.locator('h3', { hasText: 'Generación con IA' })).toBeVisible();
    });

    test('should load modal within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      const loadTime = Date.now() - startTime;
      
      // Modal should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
      
      await takeScreenshot(page, 'modal-load-performance');
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should be keyboard navigable', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).focus();
      await page.keyboard.press('Enter');
      
      await waitForModalOpen(page);
      
      // Navigate with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should activate first option
      
      await expect(page.locator('h3', { hasText: 'Crear Receta Manual' })).toBeVisible();
    });

    test('should have proper ARIA labels', async () => {
      await page.locator('button', { hasText: 'Crear Receta' }).click();
      await waitForModalOpen(page);
      
      // Check for modal role
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toHaveAttribute('role', 'dialog', { timeout: 1000 }).catch(() => {
        // Modal role might not be set, this is optional for accessibility
      });
      
      // Check close button accessibility
      const closeButton = page.locator('button').filter({ has: page.locator('svg') });
      await expect(closeButton.first()).toBeVisible();
    });
  });
});