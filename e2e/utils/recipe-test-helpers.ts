import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Enhanced test helpers for recipe generator E2E tests
 * Provides utilities for common testing patterns and mock setups
 */

export interface MockRecipeData {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
    notes?: string;
  }>;
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine_type?: string;
  meal_type?: string;
}

export interface AIGenerationParams {
  prompt: string;
  ingredients: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  provider: 'openai' | 'anthropic' | 'gemini';
}

export interface ScanResult {
  success: boolean;
  recipe?: MockRecipeData;
  confidence_score?: number;
  extractedText?: string;
  errors?: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: number;
  summary: string;
}

export class RecipeTestHelpers {
  constructor(private page: Page) {}

  /**
   * Setup all service mocks for recipe generator testing
   */
  async setupServiceMocks(options: {
    aiSuccess?: boolean;
    scanSuccess?: boolean;
    importSuccess?: boolean;
    notificationSuccess?: boolean;
  } = {}) {
    const {
      aiSuccess = true,
      scanSuccess = true,
      importSuccess = true,
      notificationSuccess = true
    } = options;

    // Mock AI services
    await this.page.route('**/api/ai/**', async route => {
      const url = route.request().url();
      if (url.includes('/generate')) {
        if (aiSuccess) {
          await route.fulfill({
            json: {
              success: true,
              recipe: {
                title: 'Pasta con Salmón y Espinacas Generada por IA',
                description: 'Deliciosa pasta italiana con salmón fresco y espinacas',
                ingredients: [
                  { name: 'Pasta linguine', quantity: '400', unit: 'g' },
                  { name: 'Salmón fresco', quantity: '300', unit: 'g' },
                  { name: 'Espinacas baby', quantity: '200', unit: 'g' },
                  { name: 'Crema de leche', quantity: '200', unit: 'ml' },
                  { name: 'Ajo', quantity: '2', unit: 'dientes' }
                ],
                instructions: [
                  'Hervir agua con sal y cocinar la pasta al dente',
                  'Cortar el salmón en cubos medianos',
                  'Saltear el ajo en aceite de oliva hasta dorar',
                  'Agregar el salmón y cocinar 3-4 minutos',
                  'Añadir las espinacas y cocinar hasta marchitar',
                  'Incorporar la crema y sazonar con sal y pimienta',
                  'Mezclar con la pasta caliente y servir inmediatamente'
                ],
                prep_time: 15,
                cook_time: 20,
                servings: 4,
                difficulty: 'medium',
                cuisine_type: 'italiana',
                meal_type: 'main'
              },
              confidence_score: 0.95,
              generatedPrompt: 'Genera una receta de pasta cremosa con salmón y espinacas, estilo italiano, para 4 personas...'
            }
          });
        } else {
          await route.fulfill({
            status: 500,
            json: { error: 'Servicio de IA temporalmente no disponible' }
          });
        }
      }
    });

    // Mock OCR/Photo scanning services
    await this.page.route('**/api/scan/**', async route => {
      if (scanSuccess) {
        await route.fulfill({
          json: {
            success: true,
            recipe: {
              title: 'Receta Extraída de Imagen',
              description: 'Receta tradicional escaneada desde foto',
              ingredients: [
                { name: 'Harina', quantity: '2', unit: 'tazas' },
                { name: 'Huevos', quantity: '3', unit: 'unidades' },
                { name: 'Leche', quantity: '1', unit: 'taza' }
              ],
              instructions: [
                'Mezclar harina con huevos en un bowl',
                'Agregar leche gradualmente',
                'Batir hasta obtener masa homogénea'
              ],
              prep_time: 10,
              cook_time: 15,
              servings: 2,
              difficulty: 'easy'
            },
            confidence_score: 0.88,
            extractedText: 'Receta casera - Ingredientes: 2 tazas harina, 3 huevos, 1 taza leche...'
          }
        });
      } else {
        await route.fulfill({
          json: {
            success: false,
            confidence_score: 0.2,
            errors: ['Imagen demasiado borrosa para extraer receta completa']
          }
        });
      }
    });

    // Mock import services
    await this.page.route('**/api/recipes/import', async route => {
      if (importSuccess) {
        await route.fulfill({
          json: {
            success: true,
            imported: 3,
            skipped: 1,
            errors: 0,
            summary: 'Importación completada exitosamente'
          }
        });
      } else {
        await route.fulfill({
          status: 400,
          json: { error: 'Archivo JSON malformado o inválido' }
        });
      }
    });

    // Mock bulk import endpoint
    await this.page.route('**/api/recipes/full', async route => {
      await route.fulfill({
        json: [
          {
            title: 'Receta del Archivo Oficial 1',
            description: 'Importada desde recipes_full.json',
            ingredients: [{ name: 'Ingrediente oficial', quantity: '1', unit: 'unidad' }],
            instructions: ['Instrucción del archivo oficial'],
            prep_time: 5,
            cook_time: 10,
            servings: 1
          },
          {
            title: 'Receta del Archivo Oficial 2', 
            description: 'Segunda receta oficial',
            ingredients: [{ name: 'Ingrediente 2', quantity: '2', unit: 'unidades' }],
            instructions: ['Segunda instrucción oficial'],
            prep_time: 8,
            cook_time: 12,
            servings: 2
          }
        ]
      });
    });

    // Mock analytics
    await this.page.route('**/api/analytics/**', async route => {
      await route.fulfill({ json: { success: true } });
    });

    // Mock notifications
    await this.page.route('**/api/notifications/**', async route => {
      if (notificationSuccess) {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({
          status: 500,
          json: { error: 'Servicio de notificaciones no disponible' }
        });
      }
    });
  }

  /**
   * Wait for recipe creation modal to open
   */
  async waitForModalOpen(timeout = 10000) {
    await expect(this.page.locator('[data-testid="recipe-creation-modal"]').or(
      this.page.locator('.fixed.inset-0.z-50')
    )).toBeVisible({ timeout });
  }

  /**
   * Wait for recipe creation modal to close
   */
  async waitForModalClose(timeout = 10000) {
    await expect(this.page.locator('[data-testid="recipe-creation-modal"]').or(
      this.page.locator('.fixed.inset-0.z-50')
    )).not.toBeVisible({ timeout });
  }

  /**
   * Take a screenshot with standardized naming
   */
  async takeScreenshot(name: string, options: { fullPage?: boolean } = {}) {
    await this.page.screenshot({
      path: path.join(__dirname, '../../tests/screenshots/recetas', `${name}.png`),
      fullPage: options.fullPage ?? true
    });
  }

  /**
   * Open recipe creation modal
   */
  async openRecipeCreationModal() {
    const createButton = this.page.locator('button', { hasText: 'Crear Receta' });
    await expect(createButton).toBeVisible();
    await createButton.click();
    await this.waitForModalOpen();
  }

  /**
   * Navigate to specific creation mode
   */
  async navigateToMode(mode: 'manual' | 'ai' | 'scan' | 'import') {
    const modeText = {
      manual: 'Crear Manualmente',
      ai: 'Generar con IA',
      scan: 'Escanear Receta',
      import: 'Importar Archivo'
    };

    await this.page.locator(`text=${modeText[mode]}`).click();
    
    // Wait for mode to load
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill manual recipe form with provided data
   */
  async fillManualRecipeForm(data: MockRecipeData) {
    // Basic info
    await this.page.fill('input[placeholder*="Pasta Carbonara"]', data.title);
    if (data.description) {
      await this.page.fill('textarea[placeholder*="descripción"]', data.description);
    }

    // Times and servings
    if (data.prep_time) {
      await this.page.fill('input[type="number"]', data.prep_time.toString(), { first: true });
    }
    if (data.cook_time) {
      await this.page.fill('input[type="number"]', data.cook_time.toString(), { nth: 1 });
    }
    if (data.servings) {
      await this.page.fill('input[type="number"]', data.servings.toString(), { nth: 2 });
    }

    // Add ingredients
    for (const ingredient of data.ingredients) {
      await this.page.fill('input[placeholder="Cantidad"]', ingredient.quantity);
      await this.page.fill('input[placeholder="Unidad"]', ingredient.unit);
      await this.page.fill('input[placeholder="Ingrediente"]', ingredient.name);
      await this.page.locator('button', { hasText: '+' }).click();
      await this.page.waitForTimeout(200); // Allow UI to update
    }

    // Add instructions
    for (const instruction of data.instructions) {
      await this.page.fill('textarea[placeholder*="siguiente paso"]', instruction);
      await this.page.locator('button', { hasText: 'Agregar' }).click();
      await this.page.waitForTimeout(200); // Allow UI to update
    }
  }

  /**
   * Fill AI generation form with provided parameters
   */
  async fillAIGenerationForm(params: AIGenerationParams) {
    // Select provider
    const providerNames = {
      openai: 'OpenAI',
      anthropic: 'Claude', 
      gemini: 'Gemini'
    };
    
    await this.page.locator('button').filter({ hasText: providerNames[params.provider] }).click();

    // Fill prompt
    await this.page.fill('textarea[placeholder*="pasta cremosa"]', params.prompt);

    // Fill available ingredients
    await this.page.fill('input[placeholder*="pollo, arroz"]', params.ingredients);

    // Set cuisine if provided
    if (params.cuisine) {
      await this.page.selectOption('select', params.cuisine);
    }

    // Set difficulty
    await this.page.selectOption('select[value="medium"]', params.difficulty);

    // Set servings
    await this.page.fill('input[type="number"]', params.servings.toString());
  }

  /**
   * Upload file for import or scanning
   */
  async uploadFile(selector: string, filename: string, content: string | Buffer, mimeType: string) {
    await this.page.setInputFiles(selector, {
      name: filename,
      mimeType,
      buffer: typeof content === 'string' ? Buffer.from(content) : content
    });
  }

  /**
   * Verify Spanish text content
   */
  async verifySpanishContent() {
    // Check for key Spanish phrases
    const spanishPhrases = [
      'Crear Receta',
      'Elige tu método preferido',
      'Crear Manualmente',
      'Generar con IA',
      'Escanear Receta',
      'Importar Archivo'
    ];

    for (const phrase of spanishPhrases) {
      await expect(this.page.locator(`text=${phrase}`)).toBeVisible();
    }
  }

  /**
   * Test responsive behavior at different viewport sizes
   */
  async testResponsiveDesign() {
    const viewports = [
      { width: 375, height: 812, name: 'mobile' },    // iPhone 12
      { width: 768, height: 1024, name: 'tablet' },   // iPad
      { width: 1920, height: 1080, name: 'desktop' }  // Desktop
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Allow layout to adjust
      
      await this.takeScreenshot(`responsive-${viewport.name}`);
      
      // Verify modal is still accessible and functional
      await expect(this.page.locator('.fixed.inset-0.z-50')).toBeVisible();
    }
  }

  /**
   * Simulate network conditions for testing
   */
  async simulateNetworkConditions(condition: 'slow' | 'fast' | 'offline') {
    if (condition === 'offline') {
      await this.page.context().setOffline(true);
    } else {
      await this.page.context().setOffline(false);
      
      const conditions = {
        slow: { downloadThroughput: 50000, uploadThroughput: 20000, latency: 500 },
        fast: { downloadThroughput: 10000000, uploadThroughput: 5000000, latency: 20 }
      };
      
      await this.page.context().route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, conditions[condition].latency));
        await route.continue();
      });
    }
  }

  /**
   * Verify accessibility features
   */
  async verifyAccessibility() {
    // Check for keyboard navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for ARIA labels and roles where applicable
    const interactiveElements = this.page.locator('button, input, select, textarea');
    const count = await interactiveElements.count();
    
    // Ensure interactive elements are accessible
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        // Check if element has accessible name or label
        const hasLabel = await element.evaluate(el => {
          return !!(
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby') ||
            (el as HTMLLabelElement).labels?.length ||
            el.textContent?.trim()
          );
        });
        
        if (!hasLabel) {
          console.warn(`Element at index ${i} may lack proper accessibility labeling`);
        }
      }
    }
  }

  /**
   * Monitor and collect analytics events during test
   */
  async collectAnalyticsEvents(): Promise<string[]> {
    const events: string[] = [];
    
    await this.page.route('**/api/analytics/**', async route => {
      const postData = route.request().postDataJSON();
      if (postData?.event) {
        events.push(postData.event);
      }
      await route.fulfill({ json: { success: true } });
    });

    return events;
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await expect(this.page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify error handling with custom error message
   */
  async verifyErrorHandling(expectedErrorText: string) {
    await expect(this.page.locator(`text=${expectedErrorText}`)).toBeVisible({ timeout: 10000 });
    await this.takeScreenshot(`error-${expectedErrorText.toLowerCase().replace(/\s+/g, '-')}`);
  }

  /**
   * Create mock file for testing
   */
  createMockFile(type: 'json' | 'image', content?: any) {
    if (type === 'json') {
      return {
        name: 'test-recipes.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(content || [
          {
            title: 'Receta de Prueba',
            description: 'Una receta para testing',
            ingredients: [{ name: 'Ingrediente', quantity: '1', unit: 'unidad' }],
            instructions: ['Instrucción de prueba'],
            prep_time: 5,
            cook_time: 10,
            servings: 1
          }
        ]))
      };
    } else {
      return {
        name: 'test-recipe-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data-for-testing')
      };
    }
  }
}