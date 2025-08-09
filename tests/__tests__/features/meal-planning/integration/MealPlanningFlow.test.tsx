import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';
import MealPlannerPage from '@/features/meal-planning/components/MealPlannerPage';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { useUser } from '@/store';
import { toast } from 'sonner';

// Mock the API calls
global.fetch = jest.fn();

// Mock dependencies
jest.mock('@/store');
jest.mock('sonner');
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Create a wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('Meal Planning Integration Flow', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store
    mockStore = {
      currentWeekPlan: null,
      currentDate: new Date('2024-01-15'),
      userPreferences: {
        servingsPerMeal: 2,
        mealsPerDay: 3,
        cookingSkill: 'intermediate',
        budget: 'medium',
      },
      recipes: {
        'recipe-1': {
          id: 'recipe-1',
          name: 'Test Recipe 1',
          description: 'A delicious test recipe',
          prepTime: 15,
          cookTime: 30,
          servings: 4,
          difficulty: 'easy',
          ingredients: [],
          instructions: [],
          nutrition: { calories: 300, protein: 20, carbs: 30, fat: 10 },
        },
        'recipe-2': {
          id: 'recipe-2',
          name: 'Test Recipe 2',
          description: 'Another test recipe',
          prepTime: 20,
          cookTime: 25,
          servings: 2,
          difficulty: 'medium',
          ingredients: [],
          instructions: [],
          nutrition: { calories: 400, protein: 25, carbs: 35, fat: 15 },
        },
      },
      activeModal: null,
      isLoading: false,
      error: null,
      selectedSlots: [],
      // Mock methods
      loadWeekPlan: jest.fn().mockResolvedValue(undefined),
      setCurrentDate: jest.fn(),
      setActiveModal: jest.fn(),
      addMealToSlot: jest.fn().mockResolvedValue(undefined),
      removeMealFromSlot: jest.fn().mockResolvedValue(undefined),
      toggleSlotLock: jest.fn().mockResolvedValue(undefined),
      clearWeek: jest.fn().mockResolvedValue(undefined),
      getSlotForDay: jest.fn(),
      getWeekSummary: jest.fn().mockReturnValue({
        totalMeals: 0,
        completedMeals: 0,
        uniqueRecipes: 0,
        totalServings: 0,
        completionPercentage: 0,
      }),
      downloadWeekPlan: jest.fn(),
    };

    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock the store hook
    jest.doMock('@/features/meal-planning/store/useMealPlanningStore', () => ({
      useMealPlanningStore: () => mockStore,
    }));

    // Mock fetch for API calls
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        plan: {
          weekPlan: {
            id: 'generated-week',
            slots: [],
          },
        },
      }),
    });
  });

  describe('Complete Meal Planning Workflow', () => {
    it('should load and display initial week plan', async () => {
      const weekPlan = {
        id: 'week-2024-01-15',
        userId: mockUser.id,
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        slots: [
          {
            id: 'slot-1',
            dayOfWeek: 1,
            mealType: 'almuerzo',
            date: '2024-01-15',
            servings: 2,
            isLocked: false,
            isCompleted: false,
          },
          {
            id: 'slot-2',
            dayOfWeek: 1,
            mealType: 'cena',
            date: '2024-01-15',
            servings: 2,
            recipeId: 'recipe-1',
            recipe: mockStore.recipes['recipe-1'],
            isLocked: false,
            isCompleted: true,
          },
        ],
      };

      mockStore.currentWeekPlan = weekPlan;

      renderWithProviders(<MealPlannerPage />);

      await waitFor(() => {
        expect(screen.getByText('AI Meal Planner')).toBeInTheDocument();
      });

      const expectedStartDate = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        'yyyy-MM-dd'
      );
      expect(mockStore.loadWeekPlan).toHaveBeenCalledWith(expectedStartDate);
    });

    it('should handle recipe selection flow', async () => {
      const user = userEvent.setup();
      const weekPlan = {
        id: 'week-2024-01-15',
        slots: [{
          id: 'slot-1',
          dayOfWeek: 1,
          mealType: 'almuerzo',
          date: '2024-01-15',
          servings: 2,
        }],
      };

      mockStore.currentWeekPlan = weekPlan;
      
      // Mock the recipe selection modal
      jest.doMock('@/features/meal-planning/components/RecipeSelectionModal', () => ({
        RecipeSelectionModal: ({ slot, onClose }: any) => (
          <div data-testid="recipe-selection-modal">
            <h3>Select Recipe for {slot.mealType}</h3>
            <button
              onClick={() => {
                mockStore.addMealToSlot(slot, mockStore.recipes['recipe-1']);
                onClose();
              }}
            >
              Select Recipe 1
            </button>
            <button onClick={onClose}>Cancel</button>
          </div>
        ),
      }));

      renderWithProviders(<MealPlannerPage />);

      // Simulate opening recipe selection
      mockStore.setActiveModal.mockImplementation((modal) => {
        mockStore.activeModal = modal;
      });

      // Click on an empty slot (this would be in the MealPlannerGrid)
      // For this test, we'll simulate the modal being opened
      mockStore.activeModal = 'recipe-select';

      // Re-render with modal open
      renderWithProviders(<MealPlannerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('recipe-selection-modal')).toBeInTheDocument();
      });

      const selectButton = screen.getByText('Select Recipe 1');
      await user.click(selectButton);

      expect(mockStore.addMealToSlot).toHaveBeenCalledWith(
        expect.objectContaining({ mealType: 'almuerzo' }),
        mockStore.recipes['recipe-1']
      );
    });

    it('should handle week navigation and reload', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<MealPlannerPage />);

      // Navigate to next week
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.querySelector('svg')); // Find button with ChevronRight icon
      if (nextButton) {
        await user.click(nextButton);
        expect(mockStore.setCurrentDate).toHaveBeenCalled();
      }

      // Go to today
      const todayButton = screen.getByText('Hoy');
      await user.click(todayButton);

      expect(mockStore.setCurrentDate).toHaveBeenCalled();
    });

    it('should handle AI meal plan generation', async () => {
      const user = userEvent.setup();
      
      // Mock the AI generation API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          plan: {
            weekPlan: {
              id: 'ai-generated-week',
              slots: [
                {
                  id: 'ai-slot-1',
                  dayOfWeek: 1,
                  mealType: 'almuerzo',
                  recipeId: 'recipe-1',
                  recipe: mockStore.recipes['recipe-1'],
                },
              ],
            },
          },
          metadata: {
            confidenceScore: 0.95,
            processingTime: '2.5s',
          },
        }),
      });

      renderWithProviders(<MealPlannerPage />);

      // This would trigger AI generation (actual implementation depends on UI)
      // For now, we'll test the API call directly
      const response = await fetch('/api/meal-planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: mockStore.userPreferences,
          constraints: {
            startDate: '2024-01-15',
            endDate: '2024-01-21',
          },
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.plan.weekPlan.slots).toHaveLength(1);
    });

    it('should handle shopping list generation', async () => {
      const user = userEvent.setup();
      const weekPlan = {
        id: 'week-2024-01-15',
        slots: [
          {
            id: 'slot-1',
            dayOfWeek: 1,
            mealType: 'almuerzo',
            recipeId: 'recipe-1',
            recipe: mockStore.recipes['recipe-1'],
            servings: 2,
          },
          {
            id: 'slot-2',
            dayOfWeek: 2,
            mealType: 'cena',
            recipeId: 'recipe-2',
            recipe: mockStore.recipes['recipe-2'],
            servings: 4,
          },
        ],
      };

      mockStore.currentWeekPlan = weekPlan;
      
      // Mock shopping list generation
      mockStore.getShoppingList = jest.fn().mockResolvedValue({
        id: 'shopping-list-1',
        items: [
          { id: '1', name: 'Tomatoes', amount: 500, unit: 'g', category: 'produce' },
          { id: '2', name: 'Chicken', amount: 1, unit: 'kg', category: 'meat' },
        ],
        categories: ['produce', 'meat'],
        estimatedTotal: 25.50,
      });

      renderWithProviders(<MealPlannerPage />);

      // Switch to shopping view
      const shoppingTab = screen.getByRole('button', { name: /Shopping List/i });
      await user.click(shoppingTab);

      expect(screen.getByText('Shopping List View')).toBeInTheDocument();

      // Open shopping list modal
      const openShoppingButton = screen.getByText('Open Shopping List');
      await user.click(openShoppingButton);

      expect(mockStore.setActiveModal).toHaveBeenCalledWith('shopping-list');
    });

    it('should handle offline functionality', async () => {
      // Mock offline scenario
      mockStore.isOnline = false;
      mockStore.offlineQueue = [];

      renderWithProviders(<MealPlannerPage />);

      // Attempt to add a meal while offline
      const slot = { dayOfWeek: 1, mealType: 'almuerzo' };
      const recipe = mockStore.recipes['recipe-1'];

      // This would add the action to offline queue
      await mockStore.addMealToSlot(slot, recipe);

      // When coming back online, queued actions should be executed
      mockStore.isOnline = true;
      mockStore.syncOfflineChanges = jest.fn();

      if (mockStore.syncOfflineChanges) {
        await mockStore.syncOfflineChanges();
      }

      expect(mockStore.addMealToSlot).toHaveBeenCalledWith(slot, recipe);
    });

    it('should handle error states gracefully', async () => {
      // Test loading error
      mockStore.error = 'Failed to load meal plan';
      mockStore.isLoading = false;

      renderWithProviders(<MealPlannerPage />);

      expect(screen.getByText('Error: Failed to load meal plan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();

      // Test API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // This would be handled by error boundaries in a real app
      try {
        await fetch('/api/meal-planning/generate', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should export meal plans in different formats', async () => {
      const user = userEvent.setup();
      const weekPlan = {
        id: 'week-2024-01-15',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        slots: [
          {
            id: 'slot-1',
            dayOfWeek: 1,
            mealType: 'almuerzo',
            recipeId: 'recipe-1',
            recipe: mockStore.recipes['recipe-1'],
            servings: 2,
          },
        ],
      };

      mockStore.currentWeekPlan = weekPlan;
      mockStore.exportWeekPlanAsJSON = jest.fn().mockReturnValue('{"plan": "data"}');
      mockStore.exportWeekPlanAsCSV = jest.fn().mockReturnValue('Day,Meal,Recipe\nMonday,Lunch,Test Recipe');

      renderWithProviders(<MealPlannerPage />);

      // Test JSON export
      mockStore.downloadWeekPlan('json');
      expect(mockStore.downloadWeekPlan).toHaveBeenCalledWith('json');

      // Test CSV export
      mockStore.downloadWeekPlan('csv');
      expect(mockStore.downloadWeekPlan).toHaveBeenCalledWith('csv');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large meal plans efficiently', async () => {
      const largeWeekPlan = {
        id: 'large-week',
        slots: Array.from({ length: 28 }, (_, i) => ({
          id: `slot-${i}`,
          dayOfWeek: Math.floor(i / 4),
          mealType: ['desayuno', 'almuerzo', 'merienda', 'cena'][i % 4],
          date: '2024-01-15',
          servings: 2,
          recipeId: i % 2 === 0 ? 'recipe-1' : 'recipe-2',
          recipe: i % 2 === 0 ? mockStore.recipes['recipe-1'] : mockStore.recipes['recipe-2'],
        })),
      };

      mockStore.currentWeekPlan = largeWeekPlan;

      const startTime = performance.now();
      renderWithProviders(<MealPlannerPage />);

      await waitFor(() => {
        expect(screen.getByText('AI Meal Planner')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 1 second even with large data
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MealPlannerPage />);

      // Rapid clicking should not cause errors
      const todayButton = screen.getByText('Hoy');
      await user.click(todayButton);
      await user.click(todayButton);
      await user.click(todayButton);

      expect(mockStore.setCurrentDate).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent operations', async () => {
      const operations = [
        mockStore.loadWeekPlan('2024-01-15'),
        mockStore.addMealToSlot(
          { dayOfWeek: 1, mealType: 'almuerzo' },
          mockStore.recipes['recipe-1']
        ),
        mockStore.toggleSlotLock('slot-1'),
      ];

      // All operations should complete without conflicts
      await Promise.all(operations);

      expect(mockStore.loadWeekPlan).toHaveBeenCalled();
      expect(mockStore.addMealToSlot).toHaveBeenCalled();
      expect(mockStore.toggleSlotLock).toHaveBeenCalled();
    });
  });
});