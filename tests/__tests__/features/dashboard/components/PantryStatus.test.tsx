/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { PantryStatus } from '@/features/dashboard/components/PantryStatus';

// Mock hooks
jest.mock('@/features/pantry/hooks/usePantryItems', () => ({
  usePantryItems: () => ({
    items: [
      { id: '1', ingredient_name: 'Tomatoes', quantity: 3, unit: 'kg', expiration_date: new Date('2024-12-25') },
      { id: '2', ingredient_name: 'Milk', quantity: 1, unit: 'L', expiration_date: new Date('2024-01-01') },
    ],
    loading: false,
    error: null,
  }),
}));

jest.mock('@/features/pantry/hooks/usePantryStats', () => ({
  usePantryStats: () => ({
    stats: {
      totalItems: 2,
      expiredItems: 1,
      expiringItems: 0,
      lowStockItems: 0,
    },
    loading: false,
    error: null,
  }),
}));

describe('PantryStatus Component', () => {
  it('renders pantry status information', () => {
    render(<PantryStatus />);
    
    expect(screen.getByText('pantry.status.title')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total items
  });

  it('displays expired items count', () => {
    render(<PantryStatus />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Expired items
    expect(screen.getByText('pantry.status.expired')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.mocked(require('@/features/pantry/hooks/usePantryStats').usePantryStats).mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    render(<PantryStatus />);
    expect(screen.getByText('pantry.status.loading')).toBeInTheDocument();
  });

  it('handles error state', () => {
    jest.mocked(require('@/features/pantry/hooks/usePantryStats').usePantryStats).mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to load',
    });

    render(<PantryStatus />);
    expect(screen.getByText('pantry.status.error')).toBeInTheDocument();
  });
});