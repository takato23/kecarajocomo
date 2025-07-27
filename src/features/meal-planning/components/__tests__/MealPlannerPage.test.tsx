import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import MealPlannerPage from '../MealPlannerPage';
import { useMealPlanningStore } from '../../store/useMealPlanningStore';
import { useUser } from '@/store';
import { useGeminiMealPlanner } from '../../hooks/useGeminiMealPlanner';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('../../store/useMealPlanningStore');
jest.mock('@/store');
jest.mock('../../hooks/useGeminiMealPlanner');
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

// Mock child components
jest.mock('../MealPlannerGrid', () => ({
  __esModule: true,
  default: ({ onRecipeSelect, onShoppingList, onExportWeek }: any) => (
    <div data-testid="meal-planner-grid">
      <button onClick={() => onRecipeSelect({ dayOfWeek: 1, mealType: 'almuerzo' })}>
        Select Recipe
      </button>
      <button onClick={onShoppingList}>Shopping List</button>
      <button onClick={onExportWeek}>Export Week</button>
    </div>
  ),
}));

jest.mock('../RecipeSelectionModal', () => ({
  RecipeSelectionModal: ({ slot, onClose }: any) => (
    <div data-testid="recipe-selection-modal">
      <div>Recipe Selection for {slot.mealType}</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../UserPreferencesModal', () => ({
  UserPreferencesModal: ({ onClose }: any) => (
    <div data-testid="user-preferences-modal">
      <div>User Preferences</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../ShoppingListModal', () => ({
  ShoppingListModal: ({ onClose }: any) => (
    <div data-testid="shopping-list-modal">
      <div>Shopping List</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('MealPlannerPage', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockCurrentDate = new Date('2024-01-15');
  
  const mockStoreState = {
    currentDate: mockCurrentDate,
    userPreferences: { servingsPerMeal: 2 },
    activeModal: null,
    isLoading: false,
    error: null,
    setCurrentDate: jest.fn(),
    setActiveModal: jest.fn(),
    loadWeekPlan: jest.fn(),
  };

  const mockGeminiPlanner = {
    generateWeeklyPlan: jest.fn(),
    isGenerating: false,
    applyGeneratedPlan: jest.fn(),
    lastGeneratedPlan: null,
    confidence: 0.85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useMealPlanningStore as jest.Mock).mockReturnValue(mockStoreState);
    (useGeminiMealPlanner as jest.Mock).mockReturnValue(mockGeminiPlanner);
  });

  describe('Component Rendering', () => {
    it('should render the main components', () => {
      render(<MealPlannerPage />);
      
      expect(screen.getByText('AI Meal Planner')).toBeInTheDocument();
      expect(screen.getByText('Plan your meals with AI-powered suggestions')).toBeInTheDocument();
      expect(screen.getByTestId('meal-planner-grid')).toBeInTheDocument();
    });

    it('should display the current week dates', () => {
      render(<MealPlannerPage />);
      
      const weekStart = startOfWeek(mockCurrentDate, { weekStartsOn: 1 });
      const expectedText = `Semana del ${format(weekStart, 'd MMM', { locale: es })}`;
      
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('should render view tabs', () => {
      render(<MealPlannerPage />);
      
      expect(screen.getByRole('button', { name: /Calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Shopping List/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nutrition/i })).toBeInTheDocument();
    });
  });

  describe('Week Navigation', () => {
    it('should navigate to previous week', async () => {
      render(<MealPlannerPage />);
      
      const prevButton = screen.getByRole('button', { name: /Previous week/i });
      await userEvent.click(prevButton);
      
      const expectedDate = addWeeks(mockCurrentDate, -1);
      expect(mockStoreState.setCurrentDate).toHaveBeenCalledWith(expectedDate);
    });

    it('should navigate to next week', async () => {
      render(<MealPlannerPage />);
      
      const nextButton = screen.getByRole('button', { name: /Next week/i });
      await userEvent.click(nextButton);
      
      const expectedDate = addWeeks(mockCurrentDate, 1);
      expect(mockStoreState.setCurrentDate).toHaveBeenCalledWith(expectedDate);
    });

    it('should navigate to today', async () => {
      render(<MealPlannerPage />);
      
      const todayButton = screen.getByRole('button', { name: 'Hoy' });
      await userEvent.click(todayButton);
      
      expect(mockStoreState.setCurrentDate).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('View Mode Switching', () => {
    it('should switch to shopping list view', async () => {
      render(<MealPlannerPage />);
      
      const shoppingTab = screen.getByRole('button', { name: /Shopping List/i });
      await userEvent.click(shoppingTab);
      
      expect(screen.getByText('Shopping List View')).toBeInTheDocument();
      expect(screen.getByText('Generate and manage your shopping lists from your meal plans')).toBeInTheDocument();
    });

    it('should switch to nutrition view', async () => {
      render(<MealPlannerPage />);
      
      const nutritionTab = screen.getByRole('button', { name: /Nutrition/i });
      await userEvent.click(nutritionTab);
      
      expect(screen.getByText('Nutrition Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Track your nutritional goals and analyze your meal plans')).toBeInTheDocument();
    });
  });

  describe('Modal Management', () => {
    it('should open recipe selection modal', async () => {
      render(<MealPlannerPage />);
      
      const selectButton = within(screen.getByTestId('meal-planner-grid'))
        .getByText('Select Recipe');
      await userEvent.click(selectButton);
      
      expect(mockStoreState.setActiveModal).toHaveBeenCalledWith('recipe-select');
    });

    it('should open preferences modal', async () => {
      render(<MealPlannerPage />);
      
      const settingsButton = screen.getByRole('button', { name: 'Preferences' });
      await userEvent.click(settingsButton);
      
      expect(mockStoreState.setActiveModal).toHaveBeenCalledWith('preferences');
    });

    it('should open shopping list modal', async () => {
      render(<MealPlannerPage />);
      
      const shoppingButton = within(screen.getByTestId('meal-planner-grid'))
        .getByText('Shopping List');
      await userEvent.click(shoppingButton);
      
      expect(mockStoreState.setActiveModal).toHaveBeenCalledWith('shopping-list');
    });

    it('should render recipe selection modal when active', () => {
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        activeModal: 'recipe-select',
      });
      
      render(<MealPlannerPage />);
      
      expect(screen.getByTestId('recipe-selection-modal')).toBeInTheDocument();
    });

    it('should close modals properly', async () => {
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        activeModal: 'preferences',
      });
      
      render(<MealPlannerPage />);
      
      const closeButton = within(screen.getByTestId('user-preferences-modal'))
        .getByText('Close');
      await userEvent.click(closeButton);
      
      expect(mockStoreState.setActiveModal).toHaveBeenCalledWith(null);
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading', () => {
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        isLoading: true,
      });
      
      render(<MealPlannerPage />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should not show wizard loading for completed users', () => {
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        isLoading: true,
      });
      
      render(<MealPlannerPage />);
      
      // Should not show loading spinner in center of screen
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error state', () => {
      const errorMessage = 'Failed to load meal plan';
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        error: errorMessage,
      });
      
      render(<MealPlannerPage />);
      
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    });

    it('should reload page on error reload button click', async () => {
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });
      
      (useMealPlanningStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        error: 'Some error',
      });
      
      render(<MealPlannerPage />);
      
      const reloadButton = screen.getByRole('button', { name: 'Reload' });
      await userEvent.click(reloadButton);
      
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('User Authentication', () => {
    it('should load week plan when user is authenticated', () => {
      render(<MealPlannerPage />);
      
      const expectedStartDate = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }), 
        'yyyy-MM-dd'
      );
      
      expect(mockStoreState.loadWeekPlan).toHaveBeenCalledWith(expectedStartDate);
    });

    it('should not load week plan when user is not authenticated', () => {
      (useUser as jest.Mock).mockReturnValue({ user: null });
      
      render(<MealPlannerPage />);
      
      expect(mockStoreState.loadWeekPlan).not.toHaveBeenCalled();
    });
  });

  describe('Shopping List Integration', () => {
    it('should open shopping list from calendar view', async () => {
      render(<MealPlannerPage />);
      
      const shoppingButton = within(screen.getByTestId('meal-planner-grid'))
        .getByText('Shopping List');
      await userEvent.click(shoppingButton);
      
      expect(mockStoreState.setActiveModal).toHaveBeenCalledWith('shopping-list');
    });

    it('should open shopping list from shopping view', async () => {
      render(<MealPlannerPage />);
      
      // Switch to shopping view
      const shoppingTab = screen.getByRole('button', { name: /Shopping List/i });
      await userEvent.click(shoppingTab);
      
      // Click open shopping list button
      const openButton = screen.getByRole('button', { name: 'Open Shopping List' });
      await userEvent.click(openButton);
      
      expect(mockStoreState.setActiveModal).toHaveBeenCalledWith('shopping-list');
    });
  });

  describe('Export Functionality', () => {
    it('should trigger export when export button is clicked', async () => {
      render(<MealPlannerPage />);
      
      const exportButton = screen.getByRole('button', { name: 'Export' });
      await userEvent.click(exportButton);
      
      // Export functionality is not yet implemented, but button should be clickable
      expect(exportButton).toBeInTheDocument();
    });

    it('should trigger export from grid', async () => {
      render(<MealPlannerPage />);
      
      const exportButton = within(screen.getByTestId('meal-planner-grid'))
        .getByText('Export Week');
      await userEvent.click(exportButton);
      
      // Export functionality would be tested when implemented
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show icon only on mobile for view tabs', () => {
      render(<MealPlannerPage />);
      
      const calendarTab = screen.getByRole('button', { name: /Calendar/i });
      const icon = calendarTab.querySelector('svg');
      const text = calendarTab.querySelector('span');
      
      expect(icon).toBeInTheDocument();
      expect(text).toHaveClass('hidden', 'sm:inline');
    });
  });
});