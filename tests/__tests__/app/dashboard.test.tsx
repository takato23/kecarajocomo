/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AppDashboard from '@/app/(app)/app/page';
import { useAuthStore } from '@/stores/auth';
import { useDashboardData } from '@/hooks/useDashboardData';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/app'),
}));

// Mock the auth store
jest.mock('@/stores/auth');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the dashboard data hook
jest.mock('@/hooks/useDashboardData');
const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;

// Mock Link component from Next.js
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  RefreshCw: ({ className, size }: any) => <div data-testid="refresh-icon" className={className} style={{ width: size, height: size }} />,
  Plus: ({ size }: any) => <div data-testid="plus-icon" style={{ width: size, height: size }} />,
  Calendar: ({ className, size }: any) => <div data-testid="calendar-icon" className={className} style={{ width: size, height: size }} />,
  ChefHat: ({ className }: any) => <div data-testid="chef-hat-icon" className={className} />,
  Package: ({ className }: any) => <div data-testid="package-icon" className={className} />,
  ShoppingCart: ({ className }: any) => <div data-testid="shopping-cart-icon" className={className} />,
  Clock: ({ className }: any) => <div data-testid="clock-icon" className={className} />,
  TrendingUp: ({ size }: any) => <div data-testid="trending-up-icon" style={{ width: size, height: size }} />,
  AlertTriangle: ({ className, size }: any) => <div data-testid="alert-triangle-icon" className={className} style={{ width: size, height: size }} />,
}));

describe('AppDashboard', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
  };

  const mockStats = {
    recipesCount: 5,
    recipesThisWeek: 2,
    favoriteRecipesCount: 3,
    mealsPlanned: 10,
    mealsThisWeek: 7,
    completedMealsToday: 2,
    pantryItems: 15,
    pantryExpiringCount: 3,
    pantryLowStockCount: 2,
    shoppingItems: 8,
    shoppingCompletedToday: 1,
    totalEstimatedCost: 45.67,
    recentRecipes: [
      {
        id: 'recipe-1',
        name: 'Test Recipe',
        description: 'A test recipe',
        difficulty: 'easy' as const,
        total_time: 30,
        servings: 4,
        created_at: new Date().toISOString(),
        is_public: false,
        cuisine_types: ['italian'],
        meal_types: ['dinner'],
      },
    ],
    todaysMeals: [
      {
        id: 'meal-1',
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast' as const,
        recipe_id: 'recipe-1',
        scheduled_time: '08:00',
        recipe: {
          name: 'Breakfast Recipe',
          total_time: 15,
          difficulty: 'easy' as const,
        },
      },
    ],
    upcomingMeals: [
      {
        id: 'meal-2',
        date: '2024-01-15',
        meal_type: 'lunch' as const,
        recipe_id: 'recipe-2',
        scheduled_time: '12:30',
        recipe: {
          name: 'Lunch Recipe',
          total_time: 45,
        },
      },
    ],
    expiringItems: [],
    recentActivity: [
      {
        action: 'Created recipe',
        item: 'Test Recipe',
        time: '2 hours ago',
        type: 'recipe' as const,
        icon: '🍳',
      },
    ],
    weeklyMealPlan: [],
  };

  const mockRefreshData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth store mock
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isInitialized: true,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      signOut: jest.fn(),
    });

    // Setup default dashboard data mock
    mockUseDashboardData.mockReturnValue({
      stats: mockStats,
      isLoading: false,
      error: null,
      refreshData: mockRefreshData,
      retryCount: 0,
    });

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    });
  });

  it('renders loading state when auth is loading', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isLoading: true,
      isInitialized: false,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      signOut: jest.fn(),
    });

    render(<AppDashboard />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders not authenticated state when no user', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isLoading: false,
      isInitialized: true,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      signOut: jest.fn(),
    });

    render(<AppDashboard />);
    
    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });

  it('renders skeleton when dashboard data is loading', () => {
    mockUseDashboardData.mockReturnValue({
      stats: mockStats,
      isLoading: true,
      error: null,
      refreshData: mockRefreshData,
      retryCount: 0,
    });

    render(<AppDashboard />);
    
    // Should render skeleton instead of actual content
    expect(screen.queryByText('Welcome back, Test User!')).not.toBeInTheDocument();
  });

  it('renders error state when dashboard data fails to load', () => {
    const mockError = {
      message: 'Failed to load data',
      code: 'NETWORK_ERROR',
      retry: jest.fn(),
    };

    mockUseDashboardData.mockReturnValue({
      stats: mockStats,
      isLoading: false,
      error: mockError,
      refreshData: mockRefreshData,
      retryCount: 1,
    });

    render(<AppDashboard />);
    
    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders dashboard with user data successfully', () => {
    render(<AppDashboard />);
    
    expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
    expect(screen.getByText('Here\'s your cooking dashboard')).toBeInTheDocument();
  });

  it('displays correct stats in dashboard cards', () => {
    render(<AppDashboard />);
    
    // Check recipes stat
    expect(screen.getByText('5')).toBeInTheDocument(); // recipesCount
    expect(screen.getByText('+2 this week')).toBeInTheDocument();
    
    // Check meals stat
    expect(screen.getByText('7')).toBeInTheDocument(); // mealsThisWeek
    expect(screen.getByText('2 completed today')).toBeInTheDocument();
    
    // Check pantry stat
    expect(screen.getByText('15')).toBeInTheDocument(); // pantryItems
    expect(screen.getByText('3 expiring soon')).toBeInTheDocument();
    
    // Check shopping stat
    expect(screen.getByText('8')).toBeInTheDocument(); // shoppingItems
    expect(screen.getByText('Est. $45.67')).toBeInTheDocument();
  });

  it('displays today\'s meals correctly', () => {
    render(<AppDashboard />);
    
    expect(screen.getByText('Today\'s Meals')).toBeInTheDocument();
    expect(screen.getByText('Breakfast Recipe')).toBeInTheDocument();
    expect(screen.getByText('8:00 AM')).toBeInTheDocument();
    expect(screen.getByText('15 min • easy')).toBeInTheDocument();
  });

  it('calls refreshData when refresh button is clicked', () => {
    render(<AppDashboard />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(mockRefreshData).toHaveBeenCalledTimes(1);
  });
});