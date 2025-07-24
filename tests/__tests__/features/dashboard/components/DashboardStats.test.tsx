/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DashboardStats } from '@/features/dashboard/components/DashboardStats';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

const mockStats = {
  pantry: {
    totalItems: 45,
    expiredItems: 3,
    expiringItems: 7,
    lowStockItems: 2,
    recentlyAdded: 5,
  },
  recipes: {
    totalRecipes: 28,
    favoriteRecipes: 12,
    recentlyViewed: 8,
    categoryCounts: {
      'main': 15,
      'appetizer': 5,
      'dessert': 8,
    },
  },
  shopping: {
    totalItems: 15,
    purchasedItems: 8,
    pendingItems: 7,
    priorityItems: 3,
  },
  planner: {
    plannedMeals: 21,
    currentWeek: 7,
    nextWeek: 14,
    completedMeals: 12,
  },
};

describe('DashboardStats Component', () => {
  it('renders pantry statistics', () => {
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('dashboard.stats.pantry.title')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // Total items
    expect(screen.getByText('3')).toBeInTheDocument(); // Expired items
    expect(screen.getByText('7')).toBeInTheDocument(); // Expiring items
    expect(screen.getByText('2')).toBeInTheDocument(); // Low stock items
  });

  it('renders recipe statistics', () => {
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('dashboard.stats.recipes.title')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument(); // Total recipes
    expect(screen.getByText('12')).toBeInTheDocument(); // Favorite recipes
    expect(screen.getByText('8')).toBeInTheDocument(); // Recently viewed
  });

  it('renders shopping statistics', () => {
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('dashboard.stats.shopping.title')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // Total items
    expect(screen.getByText('8')).toBeInTheDocument(); // Purchased items
    expect(screen.getByText('7')).toBeInTheDocument(); // Pending items
  });

  it('renders planner statistics', () => {
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('dashboard.stats.planner.title')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument(); // Planned meals
    expect(screen.getByText('12')).toBeInTheDocument(); // Completed meals
  });

  it('displays progress bars', () => {
    render(<DashboardStats stats={mockStats} />);
    
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows loading state', () => {
    render(<DashboardStats stats={mockStats} loading />);
    
    expect(screen.getByText('dashboard.stats.loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<DashboardStats stats={null} error="Failed to load stats" />);
    
    expect(screen.getByText('dashboard.stats.error.title')).toBeInTheDocument();
    expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
  });

  it('renders chart when data is available', () => {
    render(<DashboardStats stats={mockStats} showChart />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-data')).toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(<DashboardStats stats={mockStats} />);
    
    // Shopping completion percentage: 8/15 = 53.3%
    expect(screen.getByText('53%')).toBeInTheDocument();
    
    // Pantry health percentage: (45-3-7)/45 = 77.8%
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const emptyStats = {
      pantry: {
        totalItems: 0,
        expiredItems: 0,
        expiringItems: 0,
        lowStockItems: 0,
        recentlyAdded: 0,
      },
      recipes: {
        totalRecipes: 0,
        favoriteRecipes: 0,
        recentlyViewed: 0,
        categoryCounts: {},
      },
      shopping: {
        totalItems: 0,
        purchasedItems: 0,
        pendingItems: 0,
        priorityItems: 0,
      },
      planner: {
        plannedMeals: 0,
        currentWeek: 0,
        nextWeek: 0,
        completedMeals: 0,
      },
    };
    
    render(<DashboardStats stats={emptyStats} />);
    
    expect(screen.getByText('dashboard.stats.empty.title')).toBeInTheDocument();
  });

  it('shows trends when available', () => {
    const statsWithTrends = {
      ...mockStats,
      trends: {
        pantry: { change: '+5%', direction: 'up' },
        recipes: { change: '+2%', direction: 'up' },
        shopping: { change: '-10%', direction: 'down' },
        planner: { change: '+15%', direction: 'up' },
      },
    };
    
    render(<DashboardStats stats={statsWithTrends} />);
    
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('+2%')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('supports customizable time ranges', () => {
    render(<DashboardStats stats={mockStats} timeRange="week" />);
    
    expect(screen.getByText('dashboard.stats.timeRange.week')).toBeInTheDocument();
  });

  it('handles refresh action', () => {
    const mockOnRefresh = jest.fn();
    
    render(<DashboardStats stats={mockStats} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByText('dashboard.stats.refresh');
    expect(refreshButton).toBeInTheDocument();
  });

  it('shows alerts for critical items', () => {
    const criticalStats = {
      ...mockStats,
      pantry: {
        ...mockStats.pantry,
        expiredItems: 10,
        expiringItems: 15,
      },
    };
    
    render(<DashboardStats stats={criticalStats} />);
    
    expect(screen.getByText('dashboard.stats.alerts.expired')).toBeInTheDocument();
    expect(screen.getByText('dashboard.stats.alerts.expiring')).toBeInTheDocument();
  });
});