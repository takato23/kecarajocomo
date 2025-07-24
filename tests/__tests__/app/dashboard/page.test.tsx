import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/useSupabase');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock child components
jest.mock('@/features/dashboard/components/DashboardStats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats">Dashboard Stats</div>,
}));

jest.mock('@/features/dashboard/components/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

jest.mock('@/features/dashboard/components/ExpirationAlerts', () => ({
  ExpirationAlerts: () => <div data-testid="expiration-alerts">Expiration Alerts</div>,
}));

jest.mock('@/features/dashboard/components/NutritionOverview', () => ({
  NutritionOverview: () => <div data-testid="nutrition-overview">Nutrition Overview</div>,
}));

jest.mock('@/features/dashboard/components/RecentMeals', () => ({
  RecentMeals: () => <div data-testid="recent-meals">Recent Meals</div>,
}));

jest.mock('@/features/dashboard/components/SmartRecommendations', () => ({
  SmartRecommendations: () => <div data-testid="smart-recommendations">Smart Recommendations</div>,
}));

describe('DashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useSupabase as jest.Mock).mockReturnValue({
      loading: true,
      user: null,
      signOut: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  it('redirects to signin when not authenticated', async () => {
    (useSupabase as jest.Mock).mockReturnValue({
      loading: false,
      user: null,
      signOut: jest.fn(),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('renders dashboard components when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    (useSupabase as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      // Check for welcome message
      expect(screen.getByText(/Welcome back, Test User!/)).toBeInTheDocument();
      
      // Check for all dashboard components
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
      expect(screen.getByTestId('expiration-alerts')).toBeInTheDocument();
      expect(screen.getByTestId('nutrition-overview')).toBeInTheDocument();
      expect(screen.getByTestId('recent-meals')).toBeInTheDocument();
      expect(screen.getByTestId('smart-recommendations')).toBeInTheDocument();
    });
  });

  it('displays email when name is not available', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {},
    };

    (useSupabase as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, test@example.com!/)).toBeInTheDocument();
    });
  });

  it('renders section headings', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    (useSupabase as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Your Week at a Glance')).toBeInTheDocument();
      expect(screen.getByText('Recent Meals')).toBeInTheDocument();
      expect(screen.getByText('Smart Recommendations')).toBeInTheDocument();
    });
  });

  it('has proper responsive layout', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    (useSupabase as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
    });

    const { container } = render(<DashboardPage />);

    await waitFor(() => {
      // Check for responsive grid classes
      const mainGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      expect(mainGrid).toBeInTheDocument();
      
      // Check for responsive spacing
      const sections = container.querySelectorAll('.space-y-6');
      expect(sections.length).toBeGreaterThan(0);
    });
  });
});