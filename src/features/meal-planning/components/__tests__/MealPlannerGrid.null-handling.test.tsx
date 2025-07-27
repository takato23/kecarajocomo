import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MealPlannerGrid from '../MealPlannerGrid';
import { useMealPlanningStore } from '../../store/useMealPlanningStore';
import { useAuth } from '@/components/auth/AuthProvider';
import { useGeminiMealPlanner } from '../../hooks/useGeminiMealPlanner';

// Mock dependencies
jest.mock('../../store/useMealPlanningStore');
jest.mock('@/components/auth/AuthProvider');
jest.mock('../../hooks/useGeminiMealPlanner');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock skeleton component
jest.mock('../MealPlannerSkeleton', () => ({
  MealPlannerSkeleton: () => <div data-testid="meal-planner-skeleton">Loading...</div>,
}));

// Mock error component
jest.mock('../MealPlannerError', () => ({
  MealPlannerError: ({ error }: { error: string }) => (
    <div data-testid="meal-planner-error">Error: {error}</div>
  ),
}));

// Mock grid components
jest.mock('../MobileGrid', () => ({
  MobileGrid: ({ weekPlan }: any) => (
    <div data-testid="mobile-grid">
      Mobile Grid - Plan: {weekPlan ? 'loaded' : 'null'}
    </div>
  ),
}));

jest.mock('../DesktopGrid', () => ({
  DesktopGrid: ({ weekPlan }: any) => (
    <div data-testid="desktop-grid">
      Desktop Grid - Plan: {weekPlan ? 'loaded' : 'null'}
    </div>
  ),
}));

describe('MealPlannerGrid - Null Handling', () => {
  const mockLoadWeekPlan = jest.fn();
  const mockGetWeekSummary = jest.fn();
  const mockGetSlotForDay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123', email: 'test@test.com' },
    });

    // Mock Gemini planner
    (useGeminiMealPlanner as jest.Mock).mockReturnValue({
      generateWeeklyPlan: jest.fn(),
      isGenerating: false,
      applyGeneratedPlan: jest.fn(),
      confidence: 0,
      generateSingleMeal: jest.fn(),
    });

    // Default store state with null currentWeekPlan
    mockGetWeekSummary.mockReturnValue({
      totalMeals: 0,
      completedMeals: 0,
      uniqueRecipes: 0,
      totalServings: 0,
      completionPercentage: 0,
      nutritionAverage: undefined,
    });

    mockGetSlotForDay.mockReturnValue(undefined);
  });

  it('should show loading skeleton when currentWeekPlan is null and loading', () => {
    (useMealPlanningStore as unknown as jest.Mock).mockReturnValue({
      currentWeekPlan: null,
      isLoading: true,
      error: null,
      getSlotForDay: mockGetSlotForDay,
      getWeekSummary: mockGetWeekSummary,
      loadWeekPlan: mockLoadWeekPlan,
      setActiveModal: jest.fn(),
      updateMealSlot: jest.fn(),
      removeMealFromSlot: jest.fn(),
      clearWeek: jest.fn(),
    });

    render(<MealPlannerGrid />);

    expect(screen.getByTestId('meal-planner-skeleton')).toBeInTheDocument();
  });

  it('should load week plan on mount when currentWeekPlan is null', async () => {
    (useMealPlanningStore as unknown as jest.Mock).mockReturnValue({
      currentWeekPlan: null,
      isLoading: false,
      error: null,
      getSlotForDay: mockGetSlotForDay,
      getWeekSummary: mockGetWeekSummary,
      loadWeekPlan: mockLoadWeekPlan,
      setActiveModal: jest.fn(),
      updateMealSlot: jest.fn(),
      removeMealFromSlot: jest.fn(),
      clearWeek: jest.fn(),
    });

    render(<MealPlannerGrid />);

    await waitFor(() => {
      expect(mockLoadWeekPlan).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
    });
  });

  it('should handle null currentWeekPlan without crashing', () => {
    (useMealPlanningStore as unknown as jest.Mock).mockReturnValue({
      currentWeekPlan: null,
      isLoading: false,
      error: null,
      getSlotForDay: mockGetSlotForDay,
      getWeekSummary: mockGetWeekSummary,
      loadWeekPlan: mockLoadWeekPlan,
      setActiveModal: jest.fn(),
      updateMealSlot: jest.fn(),
      removeMealFromSlot: jest.fn(),
      clearWeek: jest.fn(),
    });

    // Should not throw error
    expect(() => render(<MealPlannerGrid />)).not.toThrow();
  });

  it('should render with null currentWeekPlan after initialization', async () => {
    (useMealPlanningStore as unknown as jest.Mock).mockReturnValue({
      currentWeekPlan: null,
      isLoading: false,
      error: null,
      getSlotForDay: mockGetSlotForDay,
      getWeekSummary: mockGetWeekSummary,
      loadWeekPlan: mockLoadWeekPlan,
      setActiveModal: jest.fn(),
      updateMealSlot: jest.fn(),
      removeMealFromSlot: jest.fn(),
      clearWeek: jest.fn(),
    });

    const { container } = render(<MealPlannerGrid />);

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText('Planificador de Comidas')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should render the component without errors
    expect(screen.getByText('0 de 28 comidas planificadas')).toBeInTheDocument();
    expect(screen.getByText('Progreso de la semana')).toBeInTheDocument();
    
    // Grid should receive null-safe data
    const grid = screen.getByTestId('desktop-grid');
    expect(grid).toHaveTextContent('Plan: loaded'); // adaptMealDataForGrid handles null
  });

  it('should show error component when there is an error', () => {
    (useMealPlanningStore as unknown as jest.Mock).mockReturnValue({
      currentWeekPlan: null,
      isLoading: false,
      error: 'Failed to load meal plan',
      getSlotForDay: mockGetSlotForDay,
      getWeekSummary: mockGetWeekSummary,
      loadWeekPlan: mockLoadWeekPlan,
      setActiveModal: jest.fn(),
      updateMealSlot: jest.fn(),
      removeMealFromSlot: jest.fn(),
      clearWeek: jest.fn(),
    });

    render(<MealPlannerGrid />);

    expect(screen.getByTestId('meal-planner-error')).toBeInTheDocument();
    expect(screen.getByText('Error: Failed to load meal plan')).toBeInTheDocument();
  });

  it('should render meal planner after successful load', async () => {
    const mockWeekPlan = {
      id: 'week-2024-01-01',
      userId: '123',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      slots: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (useMealPlanningStore as unknown as jest.Mock).mockReturnValue({
      currentWeekPlan: mockWeekPlan,
      isLoading: false,
      error: null,
      getSlotForDay: mockGetSlotForDay,
      getWeekSummary: mockGetWeekSummary,
      loadWeekPlan: mockLoadWeekPlan,
      setActiveModal: jest.fn(),
      updateMealSlot: jest.fn(),
      removeMealFromSlot: jest.fn(),
      clearWeek: jest.fn(),
    });

    render(<MealPlannerGrid />);

    await waitFor(() => {
      expect(screen.getByText('Planificador de Comidas')).toBeInTheDocument();
      expect(screen.getByText('0 de 28 comidas planificadas')).toBeInTheDocument();
    });
  });
});