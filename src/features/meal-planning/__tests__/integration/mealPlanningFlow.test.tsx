import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { MealPlannerGrid } from '../../components/MealPlannerGrid';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import { 
  mockWeeklyPlan, 
  mockUserPreferences, 
  mockPantryItems,
  mockAlternativeRecipes,
  mockRegeneratedMeal,
  mockNutritionSummary,
  mockShoppingList
} from '@/__tests__/mocks/fixtures/argentineMealData';
import { server } from '@/__tests__/mocks/server';

// Mock the hook with realistic implementation
jest.mock('@/hooks/meal-planning/useMealPlanning');
const mockUseMealPlanning = useMealPlanning as jest.MockedFunction<typeof useMealPlanning>;

// Mock providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

describe('Meal Planning Complete Flow Integration', () => {
  const user = userEvent.setup();
  let mockHookImplementation: any;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();

    // Create realistic hook implementation
    mockHookImplementation = {
      weeklyPlan: null,
      loading: false,
      saving: false,
      error: null,
      preferences: mockUserPreferences,
      pantry: mockPantryItems,
      mode: 'normal' as const,
      weekKey: '',
      isDirty: false,
      alternatives: [],
      nutritionSummary: null,
      lastSavedAt: null,
      realtimeConnected: true,
      generateWeeklyPlan: jest.fn(),
      regenerateMeal: jest.fn(),
      getAlternatives: jest.fn(),
      savePlan: jest.fn(),
      loadPlan: jest.fn(),
      updatePreferences: jest.fn(),
      addFavoriteDish: jest.fn(),
      addDislikedIngredient: jest.fn(),
      setMode: jest.fn(),
      clearError: jest.fn(),
      updatePantryItem: jest.fn(),
      removePantryItem: jest.fn(),
    };

    mockUseMealPlanning.mockReturnValue(mockHookImplementation);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Initial Plan Generation Flow', () => {
    it('should complete full meal plan generation with cultural authenticity', async () => {
      // Mock the generation process
      let planGenerationStep = 0;
      mockHookImplementation.generateWeeklyPlan.mockImplementation(async () => {
        planGenerationStep++;
        
        if (planGenerationStep === 1) {
          // First call - loading state
          mockHookImplementation.loading = true;
          mockUseMealPlanning.mockReturnValue({ ...mockHookImplementation });
        } else {
          // Second call - success state
          mockHookImplementation.loading = false;
          mockHookImplementation.weeklyPlan = mockWeeklyPlan;
          mockHookImplementation.nutritionSummary = mockNutritionSummary;
          mockHookImplementation.isDirty = true;
          mockUseMealPlanning.mockReturnValue({ ...mockHookImplementation });
        }
      });

      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // 1. Initial empty state
      expect(screen.getByText(/generar plan/i)).toBeInTheDocument();
      expect(screen.getByText(/empezar/i)).toBeInTheDocument();

      // 2. Start generation
      const generateButton = screen.getByText(/generar plan/i);
      await user.click(generateButton);

      expect(mockHookImplementation.generateWeeklyPlan).toHaveBeenCalledWith({
        preferences: mockUserPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });

      // 3. Loading state
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('meal-planner-loading')).toBeInTheDocument();
        expect(screen.getByText(/generando/i)).toBeInTheDocument();
      });

      // 4. Plan generated successfully
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check weekly view is rendered
        expect(screen.getByText('Lunes')).toBeInTheDocument();
        expect(screen.getByText('Domingo')).toBeInTheDocument();
        
        // Check meal types
        expect(screen.getByText('Desayuno')).toBeInTheDocument();
        expect(screen.getByText('Almuerzo')).toBeInTheDocument();
        expect(screen.getByText('Merienda')).toBeInTheDocument();
        expect(screen.getByText('Cena')).toBeInTheDocument();

        // Check cultural authenticity
        expect(screen.getByText(/asado/i)).toBeInTheDocument();
        expect(screen.getByText(/mate/i)).toBeInTheDocument();
        expect(screen.getByText(/pampa/i)).toBeInTheDocument();
      });

      // 5. Verify cultural features are properly displayed
      const sundaySlot = screen.getByTestId('meal-card-6-almuerzo'); // Sunday lunch
      expect(within(sundaySlot).getByText(/asado/i)).toBeInTheDocument();
      expect(sundaySlot).toHaveClass('cultural-special');

      const breakfastSlots = screen.getAllByTestId(/meal-card-.*-desayuno/);
      breakfastSlots.forEach(slot => {
        expect(within(slot).getByText(/mate/i)).toBeInTheDocument();
      });

      // 6. Verify nutrition summary is displayed
      expect(screen.getByTestId('nutrition-summary')).toBeInTheDocument();
      expect(screen.getByText(/9,625/)).toBeInTheDocument(); // Weekly calories
      expect(screen.getByText(/367g/)).toBeInTheDocument(); // Weekly protein
    });

    it('should handle generation errors gracefully with retry options', async () => {
      // Mock error scenario
      const errorMessage = 'Error generando plan de comidas';
      mockHookImplementation.generateWeeklyPlan.mockRejectedValue(new Error(errorMessage));
      mockHookImplementation.error = errorMessage;

      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const generateButton = screen.getByText(/generar plan/i);
      await user.click(generateButton);

      // Show error state
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText(/intentar nuevamente/i)).toBeInTheDocument();
      });

      // Test retry functionality
      mockHookImplementation.clearError.mockImplementation(() => {
        mockHookImplementation.error = null;
      });

      const retryButton = screen.getByText(/intentar nuevamente/i);
      await user.click(retryButton);

      expect(mockHookImplementation.clearError).toHaveBeenCalled();
      expect(mockHookImplementation.generateWeeklyPlan).toHaveBeenCalledTimes(2);
    });

    it('should respect user preferences during generation', async () => {
      const customPreferences = {
        ...mockUserPreferences,
        cultural: {
          ...mockUserPreferences.cultural,
          region: 'patagonia' as const,
          traditionLevel: 'alta' as const,
          mateFrequency: 'ocasional' as const,
          asadoFrequency: 'mensual' as const,
        },
        budget: {
          weekly: 15000,
          currency: 'ARS' as const,
          flexibility: 'estricto' as const,
        },
      };

      mockHookImplementation.preferences = customPreferences;
      mockHookImplementation.generateWeeklyPlan.mockImplementation(async (options) => {
        expect(options.preferences.cultural.region).toBe('patagonia');
        expect(options.preferences.budget.weekly).toBe(15000);
        
        mockHookImplementation.weeklyPlan = {
          ...mockWeeklyPlan,
          region: 'patagonia',
          weeklyCost: 14500, // Respects budget
        };
      });

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const generateButton = screen.getByText(/generar plan/i);
      await user.click(generateButton);

      expect(mockHookImplementation.generateWeeklyPlan).toHaveBeenCalledWith({
        preferences: customPreferences,
        pantry: mockPantryItems,
        mode: 'normal',
      });
    });
  });

  describe('Meal Interaction and Modification Flow', () => {
    beforeEach(() => {
      // Start with generated plan
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;
      mockHookImplementation.nutritionSummary = mockNutritionSummary;
    });

    it('should regenerate individual meals successfully', async () => {
      mockHookImplementation.regenerateMeal.mockImplementation(async (date, mealType) => {
        expect(date).toBe('2024-01-15');
        expect(mealType).toBe('almuerzo');
        
        // Update the plan with regenerated meal
        const updatedPlan = { ...mockWeeklyPlan };
        updatedPlan.days[0].almuerzo = mockRegeneratedMeal;
        mockHookImplementation.weeklyPlan = updatedPlan;
        mockHookImplementation.isDirty = true;
        
        return mockRegeneratedMeal;
      });

      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Right-click on meal card
      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      await waitFor(() => {
        expect(screen.getByTestId('meal-context-menu')).toBeInTheDocument();
      });

      // Click regenerate
      const regenerateButton = screen.getByText(/regenerar/i);
      await user.click(regenerateButton);

      expect(mockHookImplementation.regenerateMeal).toHaveBeenCalledWith(
        '2024-01-15',
        'almuerzo'
      );

      // Verify the meal was updated
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Milanesas de Ternera')).toBeInTheDocument();
        expect(screen.getByText(/\$5,200/)).toBeInTheDocument();
      });
    });

    it('should show and select meal alternatives', async () => {
      mockHookImplementation.getAlternatives.mockImplementation(async (recipeId) => {
        expect(recipeId).toBe('asado-tradicional');
        mockHookImplementation.alternatives = mockAlternativeRecipes;
        return mockAlternativeRecipes;
      });

      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Right-click on meal card
      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      const alternativesButton = await screen.findByText(/alternativas/i);
      await user.click(alternativesButton);

      expect(mockHookImplementation.getAlternatives).toHaveBeenCalledWith('asado-tradicional');

      // Verify alternatives modal appears
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/opciones alternativas/i)).toBeInTheDocument();
        expect(screen.getByText('Milanesas de Pollo')).toBeInTheDocument();
        expect(screen.getByText('Pollo a la Parrilla')).toBeInTheDocument();
        expect(screen.getByText('Pasta con Tuco')).toBeInTheDocument();
      });

      // Select an alternative
      const alternativeCard = screen.getByText('Milanesas de Pollo');
      await user.click(alternativeCard);

      // Verify the selection updates the plan
      expect(mockHookImplementation.isDirty).toBe(true);
    });

    it('should lock and unlock meals', async () => {
      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      const lockButton = await screen.findByText(/bloquear/i);
      await user.click(lockButton);

      // Verify meal is locked
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mealCard).toHaveClass('locked');
        expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      });

      // Test unlocking
      fireEvent.contextMenu(mealCard);
      const unlockButton = await screen.findByText(/desbloquear/i);
      await user.click(unlockButton);

      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mealCard).not.toHaveClass('locked');
        expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop Meal Swapping', () => {
    beforeEach(() => {
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;
    });

    it('should swap meals between slots', async () => {
      mockHookImplementation.onSwap = jest.fn().mockImplementation((targetDate, targetMeal, sourceDate, sourceMeal) => {
        // Update plan to reflect the swap
        const updatedPlan = { ...mockWeeklyPlan };
        // Implementation would swap the meals
        mockHookImplementation.weeklyPlan = updatedPlan;
        mockHookImplementation.isDirty = true;
      });

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const sourceMeal = screen.getByTestId('meal-card-0-almuerzo');
      const targetSlot = screen.getByTestId('meal-slot-1-almuerzo');

      // Simulate drag and drop
      fireEvent.dragStart(sourceMeal);
      fireEvent.dragOver(targetSlot);
      fireEvent.drop(targetSlot);

      await waitFor(() => {
        expect(mockHookImplementation.isDirty).toBe(true);
      });
    });

    it('should prevent invalid meal swaps', () => {
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Try to drag mate (breakfast) to lunch slot
      const mateMeal = screen.getByTestId('meal-card-0-desayuno');
      const lunchSlot = screen.getByTestId('meal-slot-1-almuerzo');

      fireEvent.dragStart(mateMeal);
      fireEvent.dragOver(lunchSlot);

      expect(lunchSlot).toHaveClass('drop-invalid');
      expect(screen.getByText(/no compatible/i)).toBeInTheDocument();
    });
  });

  describe('Week Navigation and Persistence', () => {
    beforeEach(() => {
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;
    });

    it('should navigate between weeks and load plans', async () => {
      mockHookImplementation.loadPlan.mockImplementation(async (weekStart) => {
        if (weekStart === '2024-01-22') {
          // Next week - load different plan
          mockHookImplementation.weeklyPlan = {
            ...mockWeeklyPlan,
            weekStart: '2024-01-22',
            weekEnd: '2024-01-28',
            planId: 'plan-test-week-2',
          };
        }
      });

      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Navigate to next week
      const nextWeekButton = screen.getByTestId('next-week-button');
      await user.click(nextWeekButton);

      expect(mockHookImplementation.loadPlan).toHaveBeenCalledWith('2024-01-22');

      // Verify plan updated
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/22 - 28 enero 2024/i)).toBeInTheDocument();
      });
    });

    it('should auto-save changes', async () => {
      mockHookImplementation.isDirty = true;
      mockHookImplementation.savePlan.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Trigger auto-save (usually on blur or timer)
      await waitFor(() => {
        expect(mockHookImplementation.savePlan).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Cultural Features Integration', () => {
    beforeEach(() => {
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;
    });

    it('should properly display ñoquis del 29', async () => {
      const planWith29 = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map(day => 
          day.date === '2024-01-29' ? {
            ...day,
            cultural: {
              isSpecialDay: true,
              occasion: 'dia29',
              notes: 'Ñoquis del 29 para la prosperidad'
            },
            cena: {
              recipe: {
                id: 'noquis-29',
                name: 'Ñoquis del 29',
                cultural: {
                  isTraditional: true,
                  occasion: 'dia29',
                  significance: 'Tradición del 29 para atraer prosperidad'
                }
              },
              servings: 4,
              cost: 1800,
              nutrition: { calories: 380, protein: 12, carbs: 75, fat: 3 }
            }
          } : day
        )
      };

      mockHookImplementation.weeklyPlan = planWith29;

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const day29 = screen.getByTestId('day-header-29');
      expect(day29).toHaveClass('special-day');
      expect(screen.getByText(/ñoquis del 29/i)).toBeInTheDocument();
      expect(screen.getByTestId('noquis-badge')).toBeInTheDocument();
    });

    it('should highlight Sunday asado tradition', () => {
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const sundayHeader = screen.getByTestId('day-header-6');
      const sundayLunch = screen.getByTestId('meal-card-6-almuerzo');

      expect(sundayHeader).toHaveClass('special-day');
      expect(sundayLunch).toHaveClass('sunday-asado');
      expect(within(sundayLunch).getByText(/asado/i)).toBeInTheDocument();
      expect(screen.getByTestId('sunday-badge')).toBeInTheDocument();
    });

    it('should show regional and seasonal indicators', () => {
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      expect(screen.getByTestId('region-indicator')).toHaveClass('region-pampa');
      expect(screen.getByText(/pampa/i)).toBeInTheDocument();
      expect(screen.getByTestId('season-indicator')).toHaveClass('season-verano');
      expect(screen.getByText(/verano/i)).toBeInTheDocument();
    });
  });

  describe('Nutrition and Shopping Integration', () => {
    beforeEach(() => {
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;
      mockHookImplementation.nutritionSummary = mockNutritionSummary;
    });

    it('should display comprehensive nutrition summary', () => {
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const nutritionPanel = screen.getByTestId('nutrition-summary');
      
      expect(within(nutritionPanel).getByText(/1,375/)).toBeInTheDocument(); // Daily calories
      expect(within(nutritionPanel).getByText(/9,625/)).toBeInTheDocument(); // Weekly calories
      expect(within(nutritionPanel).getByText(/52.5g/)).toBeInTheDocument(); // Daily protein
      expect(within(nutritionPanel).getByText(/8.5/)).toBeInTheDocument(); // Variety score
      expect(within(nutritionPanel).getByText(/9.2/)).toBeInTheDocument(); // Cultural score
    });

    it('should generate shopping list from meal plan', async () => {
      mockHookImplementation.generateShoppingList = jest.fn().mockResolvedValue(mockShoppingList);

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const shoppingButton = screen.getByText(/lista de compras/i);
      await user.click(shoppingButton);

      expect(mockHookImplementation.generateShoppingList).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('shopping-list-modal')).toBeInTheDocument();
        expect(screen.getByText('Vacío')).toBeInTheDocument();
        expect(screen.getByText('Chorizo criollo')).toBeInTheDocument();
        expect(screen.getByText(/\$9,500/)).toBeInTheDocument(); // Total cost
      });
    });

    it('should show nutrition recommendations', () => {
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const recommendations = screen.getByTestId('nutrition-recommendations');
      
      expect(within(recommendations).getByText(/incluir más verduras/i)).toBeInTheDocument();
      expect(within(recommendations).getByText(/considerar pescado/i)).toBeInTheDocument();
      expect(within(recommendations).getByText(/mantener la tradición del mate/i)).toBeInTheDocument();
    });
  });

  describe('Performance and User Experience', () => {
    it('should handle large meal plans efficiently', async () => {
      const largePlan = {
        ...mockWeeklyPlan,
        days: Array.from({ length: 30 }, (_, i) => ({
          ...mockWeeklyPlan.days[0],
          date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
          dayOfWeek: i % 7,
        }))
      };

      mockHookImplementation.weeklyPlan = largePlan;

      const startTime = Date.now();
      
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const endTime = Date.now();
      
      // Should render efficiently even with large plans
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId('meal-planner-grid')).toBeInTheDocument();
    });

    it('should provide smooth animations and transitions', async () => {
      mockHookImplementation.weeklyPlan = null;

      const { rerender } = render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Transition from empty to loaded state
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;
      
      rerender(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        const grid = screen.getByTestId('meal-planner-grid');
        expect(grid).toHaveClass('animate-fade-in');
      });
    });

    it('should show real-time connection status', () => {
      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const connectionStatus = screen.getByTestId('realtime-status');
      expect(connectionStatus).toHaveClass('connected');
      expect(within(connectionStatus).getByText(/conectado/i)).toBeInTheDocument();
    });

    it('should handle offline mode gracefully', () => {
      mockHookImplementation.realtimeConnected = false;

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      const connectionStatus = screen.getByTestId('realtime-status');
      expect(connectionStatus).toHaveClass('disconnected');
      expect(within(connectionStatus).getByText(/sin conexión/i)).toBeInTheDocument();
      expect(screen.getByText(/los cambios se guardarán cuando se restablezca la conexión/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility and Internationalization', () => {
    it('should provide comprehensive accessibility features', () => {
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Check ARIA labels
      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'Planificador de comidas semanal');

      // Check keyboard navigation
      const firstMealCard = screen.getByTestId('meal-card-0-desayuno');
      expect(firstMealCard).toHaveAttribute('tabindex', '0');
      expect(firstMealCard).toHaveAttribute('aria-label');

      // Check screen reader announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display appropriate Argentine Spanish content', () => {
      mockHookImplementation.weeklyPlan = mockWeeklyPlan;

      render(
        <TestWrapper>
          <MealPlannerGrid />
        </TestWrapper>
      );

      // Check Argentine-specific terminology
      expect(screen.getByText('Desayuno')).toBeInTheDocument();
      expect(screen.getByText('Almuerzo')).toBeInTheDocument();
      expect(screen.getByText('Merienda')).toBeInTheDocument();
      expect(screen.getByText('Cena')).toBeInTheDocument();

      // Check currency formatting
      expect(screen.getByText(/\$8,500/)).toBeInTheDocument(); // Argentine peso format

      // Check cultural terms
      expect(screen.getByText(/mate/i)).toBeInTheDocument();
      expect(screen.getByText(/asado/i)).toBeInTheDocument();
    });
  });
});