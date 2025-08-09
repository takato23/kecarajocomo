import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { PantryDashboard } from '../../components/PantryDashboard';
import { RecipeAvailabilityCheck } from '../../components/RecipeAvailabilityCheck';
import { usePantryAIAnalysis } from '../../hooks/usePantryAIAnalysis';
import { mockPantryItems, mockRecipes, mockAIAnalysis } from '@/__tests__/mocks/fixtures/pantryData';

// Mock the AI analysis hook
jest.mock('../../hooks/usePantryAIAnalysis');
jest.mock('@/services/ai/UnifiedAIService');
jest.mock('@/lib/services/geminiPantryService');

const mockUsePantryAIAnalysis = usePantryAIAnalysis as jest.MockedFunction<typeof usePantryAIAnalysis>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2024-12-31',
  };

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe('Pantry AI Analysis Integration', () => {
  const user = userEvent.setup();
  let mockAnalysisHook: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnalysisHook = {
      pantryItems: mockPantryItems,
      expiringItems: [],
      availableRecipes: [],
      missingIngredients: {},
      suggestions: [],
      wasteReduction: null,
      loading: false,
      error: null,
      analyzeRecipeAvailability: jest.fn(),
      suggestRecipesFromExpiring: jest.fn(),
      calculateMissingIngredients: jest.fn(),
      optimizeShoppingList: jest.fn(),
      trackConsumption: jest.fn(),
      predictWaste: jest.fn(),
    };

    mockUsePantryAIAnalysis.mockReturnValue(mockAnalysisHook);
  });

  describe('Recipe Availability Analysis', () => {
    it('should check recipe ingredient availability accurately', async () => {
      const mockAvailabilityResult = {
        canMake: true,
        availableIngredients: ['pollo', 'arroz', 'cebolla'],
        missingIngredients: [],
        substitutions: [],
        confidence: 0.95,
      };

      mockAnalysisHook.analyzeRecipeAvailability.mockResolvedValue(mockAvailabilityResult);

      render(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[0]} 
          pantryItems={mockPantryItems}
        />,
        { wrapper: createWrapper() }
      );

      const checkButton = screen.getByTestId('check-availability-button');
      await user.click(checkButton);

      await waitFor(() => {
        expect(mockAnalysisHook.analyzeRecipeAvailability).toHaveBeenCalledWith(
          mockRecipes[0],
          mockPantryItems
        );
      });

      // Verify results display
      await waitFor(() => {
        expect(screen.getByTestId('availability-result')).toBeVisible();
        expect(screen.getByText('✅ Puedes hacer esta receta')).toBeVisible();
        expect(screen.getByTestId('available-ingredients')).toBeVisible();
        expect(screen.getByText('pollo')).toBeVisible();
        expect(screen.getByText('arroz')).toBeVisible();
        expect(screen.getByText('cebolla')).toBeVisible();
      });

      // Check confidence indicator
      expect(screen.getByTestId('confidence-score')).toContainText('95%');
    });

    it('should suggest recipe modifications for partial availability', async () => {
      const mockPartialAvailability = {
        canMake: false,
        availableIngredients: ['pollo', 'arroz'],
        missingIngredients: [
          { name: 'pimiento rojo', quantity: 2, unit: 'unidades', cost: 800 }
        ],
        substitutions: [
          { 
            original: 'pimiento rojo', 
            substitute: 'pimiento verde', 
            available: true,
            reason: 'Similar flavor profile'
          }
        ],
        confidence: 0.75,
      };

      mockAnalysisHook.analyzeRecipeAvailability.mockResolvedValue(mockPartialAvailability);

      render(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[1]} 
          pantryItems={mockPantryItems}
        />,
        { wrapper: createWrapper() }
      );

      const checkButton = screen.getByTestId('check-availability-button');
      await user.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Ingredientes faltantes')).toBeVisible();
        expect(screen.getByTestId('missing-ingredients')).toBeVisible();
        expect(screen.getByText('pimiento rojo')).toBeVisible();
        expect(screen.getByText('2 unidades')).toBeVisible();
        expect(screen.getByText('$800')).toBeVisible();
      });

      // Check substitution suggestions
      expect(screen.getByTestId('substitutions')).toBeVisible();
      expect(screen.getByText('💡 Sustituciones disponibles')).toBeVisible();
      expect(screen.getByText('pimiento verde')).toBeVisible();
      expect(screen.getByText('Similar flavor profile')).toBeVisible();

      // Test substitution application
      const applySubstitution = screen.getByTestId('apply-substitution-0');
      await user.click(applySubstitution);

      await waitFor(() => {
        expect(screen.getByTestId('substitution-applied')).toBeVisible();
        expect(screen.getByText('✅ Sustitución aplicada')).toBeVisible();
      });
    });

    it('should calculate missing ingredients cost accurately', async () => {
      const missingIngredients = {
        'receta-pollo-arroz': [
          { name: 'azafrán', quantity: 1, unit: 'sobre', cost: 1200 },
          { name: 'vino blanco', quantity: 1, unit: 'botella', cost: 2500 }
        ]
      };

      mockAnalysisHook.calculateMissingIngredients.mockResolvedValue(missingIngredients);
      mockAnalysisHook.missingIngredients = missingIngredients;

      const { rerender } = render(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[0]} 
          pantryItems={mockPantryItems}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('calculate-missing-cost'));

      await waitFor(() => {
        expect(mockAnalysisHook.calculateMissingIngredients).toHaveBeenCalled();
      });

      rerender(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[0]} 
          pantryItems={mockPantryItems}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('missing-cost-breakdown')).toBeVisible();
        expect(screen.getByText('azafrán')).toBeVisible();
        expect(screen.getByText('$1,200')).toBeVisible();
        expect(screen.getByText('vino blanco')).toBeVisible();
        expect(screen.getByText('$2,500')).toBeVisible();
        expect(screen.getByTestId('total-missing-cost')).toContainText('$3,700');
      });
    });
  });

  describe('Smart Recipe Suggestions', () => {
    it('should suggest recipes based on expiring items', async () => {
      const expiringItems = [
        { 
          id: '1', 
          name: 'Pollo', 
          quantity: 1, 
          unit: 'kg',
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          daysUntilExpiry: 1
        }
      ];

      const suggestedRecipes = [
        {
          id: 'pollo-rapidisimo',
          name: 'Pollo al Limón Rápido',
          cookingTime: 20,
          difficulty: 'Fácil',
          usesExpiringItems: ['Pollo'],
          urgencyScore: 0.9
        },
        {
          id: 'pollo-asado-simple',
          name: 'Pollo Asado Simple',
          cookingTime: 45,
          difficulty: 'Medio',
          usesExpiringItems: ['Pollo'],
          urgencyScore: 0.8
        }
      ];

      mockAnalysisHook.expiringItems = expiringItems;
      mockAnalysisHook.suggestRecipesFromExpiring.mockResolvedValue(suggestedRecipes);

      render(<PantryDashboard />, { wrapper: createWrapper() });

      // Wait for expiring items to be detected
      await waitFor(() => {
        expect(screen.getByTestId('expiring-items-alert')).toBeVisible();
        expect(screen.getByText('1 ingrediente expira pronto')).toBeVisible();
      });

      const getSuggestionsButton = screen.getByTestId('get-recipe-suggestions');
      await user.click(getSuggestionsButton);

      await waitFor(() => {
        expect(mockAnalysisHook.suggestRecipesFromExpiring).toHaveBeenCalledWith(expiringItems);
      });

      // Verify suggestions display
      await waitFor(() => {
        expect(screen.getByTestId('recipe-suggestions')).toBeVisible();
        expect(screen.getByText('💡 Recetas recomendadas')).toBeVisible();
        
        // Check urgent suggestion first
        const suggestions = screen.getAllByTestId('suggested-recipe');
        expect(suggestions[0]).toContainText('Pollo al Limón Rápido');
        expect(suggestions[0]).toContainText('20 min');
        expect(suggestions[0]).toHaveClass('urgent');
        
        expect(suggestions[1]).toContainText('Pollo Asado Simple');
        expect(suggestions[1]).toContainText('45 min');
      });

      // Test recipe selection
      const selectRecipe = screen.getByTestId('select-recipe-pollo-rapidisimo');
      await user.click(selectRecipe);

      await waitFor(() => {
        expect(screen.getByTestId('recipe-selected-notification')).toBeVisible();
        expect(screen.getByText('Receta agregada al planificador')).toBeVisible();
      });
    });

    it('should optimize shopping lists based on pantry analysis', async () => {
      const shoppingList = [
        { name: 'Tomate', quantity: 1, unit: 'kg', cost: 1200 },
        { name: 'Cebolla', quantity: 500, unit: 'g', cost: 600 },
        { name: 'Pollo', quantity: 2, unit: 'kg', cost: 3200 }
      ];

      const optimizedList = {
        items: [
          { name: 'Tomate', quantity: 1, unit: 'kg', cost: 1200 },
          { name: 'Cebolla', quantity: 200, unit: 'g', cost: 240 }, // Reduced because we have some
        ],
        removed: [
          { name: 'Pollo', reason: 'Ya tienes suficiente en la despensa' }
        ],
        savings: 3560,
        totalCost: 1440
      };

      mockAnalysisHook.optimizeShoppingList.mockResolvedValue(optimizedList);

      render(<PantryDashboard />, { wrapper: createWrapper() });

      // Upload a shopping list for optimization
      const optimizeButton = screen.getByTestId('optimize-shopping-list');
      await user.click(optimizeButton);

      // Mock file upload
      const fileInput = screen.getByTestId('shopping-list-upload');
      const file = new File(['Tomate,1,kg\nCebolla,500,g\nPollo,2,kg'], 'shopping.csv', {
        type: 'text/csv'
      });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockAnalysisHook.optimizeShoppingList).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Tomate' }),
            expect.objectContaining({ name: 'Cebolla' }),
            expect.objectContaining({ name: 'Pollo' })
          ])
        );
      });

      // Verify optimization results
      await waitFor(() => {
        expect(screen.getByTestId('optimization-results')).toBeVisible();
        expect(screen.getByText('🎯 Lista optimizada')).toBeVisible();
        
        // Check savings
        expect(screen.getByTestId('total-savings')).toContainText('$3,560');
        expect(screen.getByTestId('optimized-total')).toContainText('$1,440');
        
        // Check removed items
        expect(screen.getByTestId('removed-items')).toBeVisible();
        expect(screen.getByText('Pollo')).toBeVisible();
        expect(screen.getByText('Ya tienes suficiente en la despensa')).toBeVisible();
        
        // Check modified quantities
        expect(screen.getByText('Cebolla: 200g (reducido de 500g)')).toBeVisible();
      });
    });

    it('should predict consumption patterns and waste', async () => {
      const wasteAnalysis = {
        predictedWaste: [
          { 
            item: 'Lechuga', 
            probability: 0.7, 
            daysUntilWaste: 3,
            suggestions: ['Hacer ensalada hoy', 'Usar en sandwich']
          },
          { 
            item: 'Bananas', 
            probability: 0.4, 
            daysUntilWaste: 2,
            suggestions: ['Hacer smoothie', 'Pan de banana']
          }
        ],
        consumptionPatterns: {
          dailyAverage: 2.3,
          weeklyTrend: 'increasing',
          topCategories: ['Carnes', 'Verduras', 'Lácteos']
        },
        wasteReductionTips: [
          'Planifica comidas basadas en fechas de vencimiento',
          'Usa el método FIFO (First In, First Out)',
          'Congela alimentos que no uses pronto'
        ]
      };

      mockAnalysisHook.predictWaste.mockResolvedValue(wasteAnalysis);
      mockAnalysisHook.wasteReduction = wasteAnalysis;

      render(<PantryDashboard />, { wrapper: createWrapper() });

      const analyzeWasteButton = screen.getByTestId('analyze-waste-patterns');
      await user.click(analyzeWasteButton);

      await waitFor(() => {
        expect(mockAnalysisHook.predictWaste).toHaveBeenCalled();
      });

      // Verify waste prediction display
      await waitFor(() => {
        expect(screen.getByTestId('waste-analysis')).toBeVisible();
        expect(screen.getByText('📊 Análisis de desperdicio')).toBeVisible();
        
        // Check predicted waste items
        expect(screen.getByTestId('waste-prediction')).toBeVisible();
        expect(screen.getByText('Lechuga')).toBeVisible();
        expect(screen.getByText('70% probabilidad')).toBeVisible();
        expect(screen.getByText('3 días')).toBeVisible();
        
        // Check suggestions
        expect(screen.getByText('Hacer ensalada hoy')).toBeVisible();
        expect(screen.getByText('Usar en sandwich')).toBeVisible();
      });

      // Check consumption patterns
      expect(screen.getByTestId('consumption-patterns')).toBeVisible();
      expect(screen.getByText('2.3 kg/día promedio')).toBeVisible();
      expect(screen.getByText('Tendencia: Aumentando')).toBeVisible();

      // Check waste reduction tips
      expect(screen.getByTestId('waste-reduction-tips')).toBeVisible();
      expect(screen.getByText('Planifica comidas basadas en fechas de vencimiento')).toBeVisible();
    });
  });

  describe('AI-Powered Inventory Management', () => {
    it('should track consumption automatically and learn patterns', async () => {
      const consumptionEvent = {
        itemId: '1',
        itemName: 'Pollo',
        quantityUsed: 500,
        unit: 'g',
        usedFor: 'Milanesas de Pollo',
        timestamp: new Date().toISOString()
      };

      mockAnalysisHook.trackConsumption.mockResolvedValue(undefined);

      render(<PantryDashboard />, { wrapper: createWrapper() });

      // Simulate consumption tracking
      const chickenItem = screen.getByTestId('pantry-item-1');
      const consumeButton = chickenItem.querySelector('[data-testid="quick-consume"]');
      
      await user.click(consumeButton!);

      // Fill consumption form
      await user.clear(screen.getByTestId('consume-quantity'));
      await user.type(screen.getByTestId('consume-quantity'), '500');
      await user.selectOptions(screen.getByTestId('consume-unit'), 'g');
      await user.type(screen.getByTestId('used-for'), 'Milanesas de Pollo');
      
      await user.click(screen.getByTestId('confirm-consumption'));

      await waitFor(() => {
        expect(mockAnalysisHook.trackConsumption).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId: '1',
            quantityUsed: 500,
            unit: 'g',
            usedFor: 'Milanesas de Pollo'
          })
        );
      });

      // Verify consumption was recorded
      await waitFor(() => {
        expect(screen.getByTestId('consumption-recorded')).toBeVisible();
        expect(screen.getByText('Consumo registrado')).toBeVisible();
      });
    });

    it('should provide intelligent reorder suggestions', async () => {
      const reorderSuggestions = [
        {
          item: 'Leche',
          currentQuantity: 500,
          unit: 'ml',
          suggestedQuantity: 2,
          suggestedUnit: 'litros',
          reason: 'Consumo promedio alto',
          urgency: 'high',
          estimatedDaysLeft: 2
        },
        {
          item: 'Pan',
          currentQuantity: 0,
          unit: 'unidades',
          suggestedQuantity: 2,
          suggestedUnit: 'unidades',
          reason: 'Agotado - consumo regular',
          urgency: 'urgent',
          estimatedDaysLeft: 0
        }
      ];

      mockAnalysisHook.getReorderSuggestions = jest.fn().mockResolvedValue(reorderSuggestions);

      render(<PantryDashboard />, { wrapper: createWrapper() });

      const reorderButton = screen.getByTestId('check-reorder-suggestions');
      await user.click(reorderButton);

      await waitFor(() => {
        expect(mockAnalysisHook.getReorderSuggestions).toHaveBeenCalled();
      });

      // Verify reorder suggestions
      await waitFor(() => {
        expect(screen.getByTestId('reorder-suggestions')).toBeVisible();
        expect(screen.getByText('🔄 Sugerencias de reposición')).toBeVisible();
        
        // Check urgent items first
        const suggestions = screen.getAllByTestId('reorder-suggestion');
        expect(suggestions[0]).toContainText('Pan');
        expect(suggestions[0]).toHaveClass('urgent');
        expect(suggestions[0]).toContainText('Agotado');
        
        expect(suggestions[1]).toContainText('Leche');
        expect(suggestions[1]).toHaveClass('high-priority');
        expect(suggestions[1]).toContainText('2 días restantes');
      });

      // Test adding to shopping list
      const addToListButton = screen.getByTestId('add-to-shopping-list-Pan');
      await user.click(addToListButton);

      await waitFor(() => {
        expect(screen.getByTestId('added-to-shopping-list')).toBeVisible();
        expect(screen.getByText('Pan agregado a la lista de compras')).toBeVisible();
      });
    });
  });

  describe('Error Handling and Performance', () => {
    it('should handle AI service failures gracefully', async () => {
      mockAnalysisHook.analyzeRecipeAvailability.mockRejectedValue(
        new Error('AI service temporarily unavailable')
      );
      mockAnalysisHook.error = 'AI service temporarily unavailable';

      render(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[0]} 
          pantryItems={mockPantryItems}
        />,
        { wrapper: createWrapper() }
      );

      const checkButton = screen.getByTestId('check-availability-button');
      await user.click(checkButton);

      await waitFor(() => {
        expect(screen.getByTestId('ai-error-message')).toBeVisible();
        expect(screen.getByText('AI service temporarily unavailable')).toBeVisible();
        expect(screen.getByTestId('fallback-manual-check')).toBeVisible();
      });

      // Test manual fallback
      const manualCheckButton = screen.getByTestId('manual-availability-check');
      await user.click(manualCheckButton);

      await waitFor(() => {
        expect(screen.getByTestId('manual-availability-form')).toBeVisible();
        expect(screen.getByText('Verificación manual de ingredientes')).toBeVisible();
      });
    });

    it('should optimize performance for large pantries', async () => {
      // Create large pantry dataset
      const largePantry = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unit: 'kg',
        category: 'Test',
        expiryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      }));

      mockAnalysisHook.pantryItems = largePantry;
      mockAnalysisHook.analyzeRecipeAvailability.mockImplementation(async () => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return { canMake: true, confidence: 0.8 };
      });

      const startTime = Date.now();

      render(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[0]} 
          pantryItems={largePantry}
        />,
        { wrapper: createWrapper() }
      );

      const renderTime = Date.now() - startTime;

      // Should render efficiently even with large pantry
      expect(renderTime).toBeLessThan(1000);

      const checkButton = screen.getByTestId('check-availability-button');
      
      const analysisStartTime = Date.now();
      await user.click(checkButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('availability-result')).toBeVisible();
      });

      const analysisTime = Date.now() - analysisStartTime;

      // Analysis should complete within reasonable time
      expect(analysisTime).toBeLessThan(5000);
    });

    it('should provide loading states and progress indicators', async () => {
      mockAnalysisHook.loading = true;
      mockAnalysisHook.analyzeRecipeAvailability.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { canMake: true, confidence: 0.9 };
      });

      render(
        <RecipeAvailabilityCheck 
          recipe={mockRecipes[0]} 
          pantryItems={mockPantryItems}
        />,
        { wrapper: createWrapper() }
      );

      const checkButton = screen.getByTestId('check-availability-button');
      await user.click(checkButton);

      // Should show loading state immediately
      expect(screen.getByTestId('analysis-loading')).toBeVisible();
      expect(screen.getByText('Analizando disponibilidad...')).toBeVisible();

      // Should show progress indicator
      expect(screen.getByTestId('progress-indicator')).toBeVisible();

      // Button should be disabled during analysis
      expect(checkButton).toBeDisabled();
    });
  });
});