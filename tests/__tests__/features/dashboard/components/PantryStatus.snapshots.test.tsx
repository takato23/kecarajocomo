import React from 'react';
import { render } from '@testing-library/react';
import { PantryStatus } from '@/features/dashboard/components/PantryStatus';

// Mock the useDashboard hook
jest.mock('@/features/dashboard/hooks/useDashboard', () => ({
  useDashboard: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, className, children }: any) {
    return <a href={href} className={className}>{children}</a>;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon">Package</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Archive: () => <div data-testid="archive-icon">Archive</div>,
}));

// Mock DashboardCard component
jest.mock('@/components/ui', () => ({
  DashboardCard: ({ title, subtitle, loading, action, children }: any) => (
    <div data-testid="dashboard-card">
      <div data-testid="card-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {loading && <div data-testid="loading">Loading...</div>}
        {action && <div data-testid="action">{action}</div>}
      </div>
      <div data-testid="card-content">{children}</div>
    </div>
  ),
}));

const mockUseDashboard = require('@/features/dashboard/hooks/useDashboard').useDashboard;

describe('PantryStatus Snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should render loading state', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 0,
            expiringSoon: 0,
            lowStock: 0,
          },
        },
        hasPantryAlerts: false,
        totalPantryAlerts: 0,
        isLoading: true,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Empty Pantry States', () => {
    it('should render empty pantry with no alerts', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 0,
            expiringSoon: 0,
            lowStock: 0,
          },
        },
        hasPantryAlerts: false,
        totalPantryAlerts: 0,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Healthy Pantry States', () => {
    it('should render healthy pantry with no alerts', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 25,
            expiringSoon: 0,
            lowStock: 0,
          },
        },
        hasPantryAlerts: false,
        totalPantryAlerts: 0,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render healthy pantry with good health score', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 50,
            expiringSoon: 0,
            lowStock: 0,
          },
        },
        hasPantryAlerts: false,
        totalPantryAlerts: 0,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Pantry with Alerts', () => {
    it('should render pantry with expiring items only', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 30,
            expiringSoon: 5,
            lowStock: 0,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 5,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render pantry with low stock items only', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 30,
            expiringSoon: 0,
            lowStock: 3,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 3,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render pantry with both expiring and low stock alerts', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 40,
            expiringSoon: 7,
            lowStock: 4,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 11,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('High Alert Scenarios', () => {
    it('should render pantry with many expiring items', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 20,
            expiringSoon: 15,
            lowStock: 8,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 23,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render pantry with critical health score', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 100,
            expiringSoon: 25,
            lowStock: 20,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 45,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    it('should render pantry with single item expiring', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 1,
            expiringSoon: 1,
            lowStock: 0,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 1,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render pantry with large numbers', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 999,
            expiringSoon: 123,
            lowStock: 456,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 579,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Various Health Scores', () => {
    it('should render 90% health score', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 100,
            expiringSoon: 5,
            lowStock: 5,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 10,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render 50% health score', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 100,
            expiringSoon: 25,
            lowStock: 25,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 50,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render 10% health score', () => {
      mockUseDashboard.mockReturnValue({
        metrics: {
          pantryStatus: {
            totalItems: 100,
            expiringSoon: 45,
            lowStock: 45,
          },
        },
        hasPantryAlerts: true,
        totalPantryAlerts: 90,
        isLoading: false,
      });

      const { container } = render(<PantryStatus />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});