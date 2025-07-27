import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { MealPlannerGrid } from '../MealPlannerGrid';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import { 
  mockWeeklyPlan, 
  mockUserPreferences, 
  mockAlternativeRecipes,
  mockRegeneratedMeal 
} from '@/__tests__/mocks/fixtures/argentineMealData';

// Mock the meal planning hook
jest.mock('@/hooks/meal-planning/useMealPlanning');
const mockUseMealPlanning = useMealPlanning as jest.MockedFunction<typeof useMealPlanning>;

// Mock glassmorphism components
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className, ...props }: any) => (
    <div className={`glass-card ${className}`} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/GlassButton', () => ({
  GlassButton: ({ children, onClick, variant, disabled, ...props }: any) => (
    <button 
      className={`glass-button glass-button-${variant}`} 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock drag and drop
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: 'vertical',
}));

// Mock framer motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const defaultMockHook = {
  weeklyPlan: mockWeeklyPlan,
  loading: false,
  error: null,
  preferences: mockUserPreferences,
  pantry: [],
  mode: 'normal' as const,
  generateWeeklyPlan: jest.fn(),
  regenerateMeal: jest.fn(),
  getAlternatives: jest.fn(),
  savePlan: jest.fn(),
  loadPlan: jest.fn(),
  alternatives: mockAlternativeRecipes,
  nutritionSummary: null,
  realtimeConnected: true,
};

describe('MealPlannerGrid Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMealPlanning.mockReturnValue(defaultMockHook);
  });

  describe('Rendering', () => {
    it('should render weekly meal plan grid', () => {
      render(<MealPlannerGrid />);

      // Check for week navigation
      expect(screen.getByText(/semana/i)).toBeInTheDocument();
      
      // Check for day headers
      expect(screen.getByText('Lunes')).toBeInTheDocument();
      expect(screen.getByText('Domingo')).toBeInTheDocument();
      
      // Check for meal types
      expect(screen.getByText('Desayuno')).toBeInTheDocument();
      expect(screen.getByText('Almuerzo')).toBeInTheDocument();
      expect(screen.getByText('Merienda')).toBeInTheDocument();
      expect(screen.getByText('Cena')).toBeInTheDocument();
    });

    it('should render meal cards with glassmorphism style', () => {
      render(<MealPlannerGrid />);

      const mealCards = screen.getAllByTestId(/meal-card/);
      expect(mealCards.length).toBeGreaterThan(0);
      
      mealCards.forEach(card => {
        expect(card).toHaveClass('glass-card');
      });
    });

    it('should show loading state', () => {
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        loading: true,
        weeklyPlan: null,
      });

      render(<MealPlannerGrid />);

      expect(screen.getByTestId('meal-planner-loading')).toBeInTheDocument();
      expect(screen.getByText(/generando/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorMessage = 'Error generando plan de comidas';
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        error: errorMessage,
        weeklyPlan: null,
      });

      render(<MealPlannerGrid />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(/intentar nuevamente/i)).toBeInTheDocument();
    });

    it('should show empty state when no plan exists', () => {
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        weeklyPlan: null,
      });

      render(<MealPlannerGrid />);

      expect(screen.getByText(/generar plan/i)).toBeInTheDocument();
      expect(screen.getByText(/empezar/i)).toBeInTheDocument();
    });
  });

  describe('Week Navigation', () => {
    it('should navigate to previous week', async () => {
      const mockLoadPlan = jest.fn();
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        loadPlan: mockLoadPlan,
      });

      render(<MealPlannerGrid />);

      const prevButton = screen.getByTestId('previous-week-button');
      await user.click(prevButton);

      expect(mockLoadPlan).toHaveBeenCalledWith('2024-01-08'); // Previous week
    });

    it('should navigate to next week', async () => {
      const mockLoadPlan = jest.fn();
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        loadPlan: mockLoadPlan,
      });

      render(<MealPlannerGrid />);

      const nextButton = screen.getByTestId('next-week-button');
      await user.click(nextButton);

      expect(mockLoadPlan).toHaveBeenCalledWith('2024-01-22'); // Next week
    });

    it('should show current week indicator', () => {
      render(<MealPlannerGrid />);

      expect(screen.getByText(/15 - 21 enero 2024/i)).toBeInTheDocument();
    });

    it('should highlight current day', () => {
      // Mock current date to be within the plan week
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-17')); // Wednesday in the plan

      render(<MealPlannerGrid />);

      const wednesdayHeader = screen.getByTestId('day-header-2'); // Wednesday (index 2)
      expect(wednesdayHeader).toHaveClass('current-day');

      jest.useRealTimers();
    });
  });

  describe('Meal Interactions', () => {
    it('should show meal details on hover', async () => {
      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      await user.hover(mealCard);

      await waitFor(() => {
        expect(screen.getByText(/calorías/i)).toBeInTheDocument();
        expect(screen.getByText(/proteínas/i)).toBeInTheDocument();
        expect(screen.getByText(/costo/i)).toBeInTheDocument();
      });
    });

    it('should open meal context menu on right click', async () => {
      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      await waitFor(() => {
        expect(screen.getByText(/regenerar/i)).toBeInTheDocument();
        expect(screen.getByText(/alternativas/i)).toBeInTheDocument();
        expect(screen.getByText(/bloquear/i)).toBeInTheDocument();
        expect(screen.getByText(/detalles/i)).toBeInTheDocument();
      });
    });

    it('should regenerate meal when requested', async () => {
      const mockRegenerateMeal = jest.fn().mockResolvedValue(mockRegeneratedMeal);
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        regenerateMeal: mockRegenerateMeal,
      });

      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      const regenerateButton = await screen.findByText(/regenerar/i);
      await user.click(regenerateButton);

      expect(mockRegenerateMeal).toHaveBeenCalledWith(
        mockWeeklyPlan.days[0].date,
        'almuerzo'
      );
    });

    it('should show alternatives modal', async () => {
      const mockGetAlternatives = jest.fn().mockResolvedValue(mockAlternativeRecipes);
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        getAlternatives: mockGetAlternatives,
      });

      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      const alternativesButton = await screen.findByText(/alternativas/i);
      await user.click(alternativesButton);

      await waitFor(() => {
        expect(screen.getByText(/opciones alternativas/i)).toBeInTheDocument();
        expect(mockGetAlternatives).toHaveBeenCalled();
      });
    });

    it('should lock/unlock meals', async () => {
      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      const lockButton = await screen.findByText(/bloquear/i);
      await user.click(lockButton);

      await waitFor(() => {
        expect(mealCard).toHaveClass('locked');
        expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should render draggable meal cards', () => {
      render(<MealPlannerGrid />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      
      const mealCards = screen.getAllByTestId(/meal-card/);
      mealCards.forEach(card => {
        expect(card).toHaveAttribute('draggable');
      });
    });

    it('should handle meal swap between slots', async () => {
      const mockSavePlan = jest.fn();
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        savePlan: mockSavePlan,
      });

      render(<MealPlannerGrid />);

      // Simulate drag and drop event
      const sourceCard = screen.getByTestId('meal-card-0-almuerzo');
      const targetSlot = screen.getByTestId('meal-slot-1-almuerzo');

      fireEvent.dragStart(sourceCard);
      fireEvent.dragOver(targetSlot);
      fireEvent.drop(targetSlot);

      await waitFor(() => {
        expect(mockSavePlan).toHaveBeenCalled();
      });
    });

    it('should show drop indicators during drag', () => {
      render(<MealPlannerGrid />);

      const sourceCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.dragStart(sourceCard);

      const dropZones = screen.getAllByTestId(/drop-zone/);
      dropZones.forEach(zone => {
        expect(zone).toHaveClass('drop-active');
      });
    });

    it('should prevent dropping on locked slots', () => {
      const planWithLockedMeal = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map((day, index) => 
          index === 1 ? {
            ...day,
            almuerzo: {
              ...day.almuerzo!,
              locked: true
            }
          } : day
        )
      };

      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        weeklyPlan: planWithLockedMeal,
      });

      render(<MealPlannerGrid />);

      const lockedSlot = screen.getByTestId('meal-slot-1-almuerzo');
      expect(lockedSlot).toHaveClass('locked');
      expect(lockedSlot).toHaveAttribute('data-droppable', 'false');
    });
  });

  describe('Cultural Features', () => {
    it('should highlight Sunday asado', () => {
      render(<MealPlannerGrid />);

      const sundayLunch = screen.getByTestId('meal-card-6-almuerzo'); // Sunday lunch
      expect(sundayLunch).toHaveClass('cultural-special');
      expect(within(sundayLunch).getByText(/asado/i)).toBeInTheDocument();
    });

    it('should highlight ñoquis del 29', () => {
      const planWith29 = {
        ...mockWeeklyPlan,
        days: mockWeeklyPlan.days.map(day => 
          day.date === '2024-01-29' ? {
            ...day,
            cultural: {
              isSpecialDay: true,
              occasion: 'dia29',
              notes: 'Ñoquis del 29'
            }
          } : day
        )
      };

      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        weeklyPlan: planWith29,
      });

      render(<MealPlannerGrid />);

      const day29 = screen.getByTestId('day-header-14'); // 29th
      expect(day29).toHaveClass('special-day');
      expect(screen.getByText(/ñoquis/i)).toBeInTheDocument();
    });

    it('should show mate in breakfast and merienda', () => {
      render(<MealPlannerGrid />);

      const breakfastCards = screen.getAllByTestId(/meal-card-.*-desayuno/);
      const meriendasCards = screen.getAllByTestId(/meal-card-.*-merienda/);

      breakfastCards.forEach(card => {
        expect(within(card).getByText(/mate/i)).toBeInTheDocument();
      });

      meriendasCards.forEach(card => {
        expect(within(card).getByText(/mate/i)).toBeInTheDocument();
      });
    });

    it('should display regional indicators', () => {
      render(<MealPlannerGrid />);

      expect(screen.getByText(/pampa/i)).toBeInTheDocument();
      expect(screen.getByTestId('region-indicator')).toHaveClass('region-pampa');
    });

    it('should show seasonal recommendations', () => {
      render(<MealPlannerGrid />);

      expect(screen.getByText(/verano/i)).toBeInTheDocument();
      expect(screen.getByTestId('season-indicator')).toHaveClass('season-verano');
    });
  });

  describe('Glassmorphism Styling', () => {
    it('should apply glassmorphism effects to meal cards', () => {
      render(<MealPlannerGrid />);

      const mealCards = screen.getAllByTestId(/meal-card/);
      mealCards.forEach(card => {
        expect(card).toHaveClass('glass-card');
        expect(getComputedStyle(card)).toHaveProperty('backdrop-filter');
      });
    });

    it('should have hover effects on interactive elements', async () => {
      render(<MealPlannerGrid />);

      const generateButton = screen.getByText(/generar plan/i);
      expect(generateButton).toHaveClass('glass-button');

      await user.hover(generateButton);
      expect(generateButton).toHaveClass('glass-button-hover');
    });

    it('should apply different glass variants based on meal type', () => {
      render(<MealPlannerGrid />);

      const breakfastCard = screen.getByTestId('meal-card-0-desayuno');
      const lunchCard = screen.getByTestId('meal-card-0-almuerzo');
      const snackCard = screen.getByTestId('meal-card-0-merienda');
      const dinnerCard = screen.getByTestId('meal-card-0-cena');

      expect(breakfastCard).toHaveClass('glass-breakfast');
      expect(lunchCard).toHaveClass('glass-lunch');
      expect(snackCard).toHaveClass('glass-snack');
      expect(dinnerCard).toHaveClass('glass-dinner');
    });

    it('should have loading glassmorphism animation', () => {
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        loading: true,
        weeklyPlan: null,
      });

      render(<MealPlannerGrid />);

      const loadingElement = screen.getByTestId('meal-planner-loading');
      expect(loadingElement).toHaveClass('glass-loading');
      expect(loadingElement).toHaveClass('animate-pulse');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<MealPlannerGrid />);

      expect(screen.getByTestId('meal-planner-grid')).toHaveClass('mobile-view');
      expect(screen.getByTestId('week-navigation')).toHaveClass('mobile-nav');
    });

    it('should show tablet layout on medium screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<MealPlannerGrid />);

      expect(screen.getByTestId('meal-planner-grid')).toHaveClass('tablet-view');
    });

    it('should use full desktop layout on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<MealPlannerGrid />);

      expect(screen.getByTestId('meal-planner-grid')).toHaveClass('desktop-view');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MealPlannerGrid />);

      expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'Planificador de comidas semanal');
      
      const mealCards = screen.getAllByRole('gridcell');
      mealCards.forEach((card, index) => {
        expect(card).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      mealCard.focus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should announce changes to screen readers', async () => {
      const mockRegenerateMeal = jest.fn().mockResolvedValue(mockRegeneratedMeal);
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        regenerateMeal: mockRegenerateMeal,
      });

      render(<MealPlannerGrid />);

      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      fireEvent.contextMenu(mealCard);

      const regenerateButton = await screen.findByText(/regenerar/i);
      await user.click(regenerateButton);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/comida regenerada/i);
      });
    });

    it('should have proper focus management', async () => {
      render(<MealPlannerGrid />);

      const firstMealCard = screen.getByTestId('meal-card-0-desayuno');
      firstMealCard.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('meal-card-0-almuerzo')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('meal-card-0-merienda')).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should virtualize large meal plans', () => {
      const largePlan = {
        ...mockWeeklyPlan,
        days: Array.from({ length: 30 }, (_, i) => ({
          ...mockWeeklyPlan.days[0],
          date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
          dayOfWeek: i % 7,
        }))
      };

      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        weeklyPlan: largePlan,
      });

      render(<MealPlannerGrid />);

      // Should render only visible rows
      const visibleMealCards = screen.getAllByTestId(/meal-card/);
      expect(visibleMealCards.length).toBeLessThan(largePlan.days.length * 4);
    });

    it('should debounce expensive operations', async () => {
      jest.useFakeTimers();
      
      const mockSavePlan = jest.fn();
      mockUseMealPlanning.mockReturnValue({
        ...defaultMockHook,
        savePlan: mockSavePlan,
      });

      render(<MealPlannerGrid />);

      // Trigger multiple rapid changes
      const mealCard = screen.getByTestId('meal-card-0-almuerzo');
      for (let i = 0; i < 5; i++) {
        fireEvent.dragStart(mealCard);
        fireEvent.dragEnd(mealCard);
      }

      jest.advanceTimersByTime(1000);

      // Should only call save once due to debouncing
      expect(mockSavePlan).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should memoize expensive components', () => {
      const { rerender } = render(<MealPlannerGrid />);

      const initialMealCards = screen.getAllByTestId(/meal-card/);
      
      // Re-render with same props
      rerender(<MealPlannerGrid />);
      
      const newMealCards = screen.getAllByTestId(/meal-card/);
      
      // Components should be memoized and not re-render unnecessarily
      expect(initialMealCards[0]).toBe(newMealCards[0]);
    });
  });
});