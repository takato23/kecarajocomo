import React from 'react';
import { render, screen, waitFor, within } from '../../../utils/test-utils';
import { PantryDashboard } from '@/features/pantry/components/PantryDashboard';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import userEvent from '@testing-library/user-event';

// Mock the store
jest.mock('@/features/pantry/store/pantryStore');

const mockUsePantryStore = usePantryStore as jest.MockedFunction<typeof usePantryStore>;

describe('PantryDashboard', () => {
  const mockFetchStats = jest.fn();
  const mockFetchExpirationAlerts = jest.fn();
  const mockGetExpiringItems = jest.fn();
  const mockGetExpiredItems = jest.fn();

  const defaultStoreState = {
    stats: {
      totalItems: 25,
      expiringItems: 5,
      expiredItems: 2,
      categories: {
        'Produce': 10,
        'Dairy': 5,
        'Pantry Staples': 10,
      },
      totalValue: 125.50,
    },
    expirationAlerts: [],
    isLoading: false,
    fetchStats: mockFetchStats,
    fetchExpirationAlerts: mockFetchExpirationAlerts,
    getExpiringItems: mockGetExpiringItems,
    getExpiredItems: mockGetExpiredItems,
    items: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePantryStore.mockReturnValue(defaultStoreState);
    mockGetExpiringItems.mockReturnValue([]);
    mockGetExpiredItems.mockReturnValue([]);
  });

  it('renders pantry dashboard with stats', async () => {
    render(<PantryDashboard />);

    // Check header
    expect(screen.getByText('Pantry Overview')).toBeInTheDocument();
    expect(screen.getByText('Manage your ingredients and track expiration dates')).toBeInTheDocument();

    // Check stats cards
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Based on getExpiringItems mock

    expect(screen.getByText('Expired Items')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Based on getExpiredItems mock

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$125.50')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    mockUsePantryStore.mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
      stats: null,
    });

    render(<PantryDashboard />);

    // Should show loading skeletons
    const loadingElements = screen.getAllByTestId(/loading-skeleton|animate-pulse/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('calls fetch functions on mount', () => {
    render(<PantryDashboard />);

    expect(mockFetchStats).toHaveBeenCalledTimes(1);
    expect(mockFetchExpirationAlerts).toHaveBeenCalledTimes(1);
  });

  it('handles add item button click', async () => {
    const user = userEvent.setup();
    const mockOnAddItem = jest.fn();

    render(<PantryDashboard onAddItem={mockOnAddItem} />);

    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    expect(mockOnAddItem).toHaveBeenCalledTimes(1);
  });

  it('handles manage items button click', async () => {
    const user = userEvent.setup();
    const mockOnManageItems = jest.fn();

    render(<PantryDashboard onManageItems={mockOnManageItems} />);

    const manageButton = screen.getByRole('button', { name: /manage items/i });
    await user.click(manageButton);

    expect(mockOnManageItems).toHaveBeenCalledTimes(1);
  });

  it('displays expiration alerts when items are expiring', () => {
    const expiringItems = [
      {
        id: '1',
        ingredient_name: 'Milk',
        expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        quantity: 1,
        unit: 'gallon',
      },
      {
        id: '2',
        ingredient_name: 'Yogurt',
        expiration_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        quantity: 2,
        unit: 'cups',
      },
    ];

    const expiredItems = [
      {
        id: '3',
        ingredient_name: 'Bread',
        expiration_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        quantity: 1,
        unit: 'loaf',
      },
    ];

    mockGetExpiringItems.mockReturnValue(expiringItems);
    mockGetExpiredItems.mockReturnValue(expiredItems);

    render(<PantryDashboard />);

    // Check expiration alerts section
    expect(screen.getByText('Expiration Alerts')).toBeInTheDocument();

    // Check expired items card
    const expiredCard = screen.getByText('Expired Items (1)').closest('div');
    expect(expiredCard).toBeInTheDocument();
    expect(within(expiredCard!).getByText('Bread')).toBeInTheDocument();

    // Check expiring items card
    const expiringCard = screen.getByText('Expiring Soon (2)').closest('div');
    expect(expiringCard).toBeInTheDocument();
    expect(within(expiringCard!).getByText('Milk')).toBeInTheDocument();
    expect(within(expiringCard!).getByText('Yogurt')).toBeInTheDocument();
  });

  it('displays categories overview', () => {
    render(<PantryDashboard />);

    // Check categories section
    expect(screen.getByText('Items by Category')).toBeInTheDocument();

    // Check category counts
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Pantry Staples')).toBeInTheDocument();
  });

  it('displays quick actions', async () => {
    const user = userEvent.setup();
    const mockOnAddItem = jest.fn();
    const mockOnManageItems = jest.fn();

    render(
      <PantryDashboard 
        onAddItem={mockOnAddItem} 
        onManageItems={mockOnManageItems} 
      />
    );

    // Check quick actions section
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();

    // Check action buttons
    const addNewButton = screen.getAllByRole('button', { name: /add new item/i })[0];
    await user.click(addNewButton);
    expect(mockOnAddItem).toHaveBeenCalled();

    const browseButton = screen.getByRole('button', { name: /browse all items/i });
    await user.click(browseButton);
    expect(mockOnManageItems).toHaveBeenCalled();

    const shoppingButton = screen.getByRole('button', { name: /generate shopping list/i });
    expect(shoppingButton).toBeInTheDocument();
  });

  it('shows AI insights when available', async () => {
    // Mock fetch for AI insights
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          insights: [
            {
              title: 'Reduce Food Waste',
              description: 'You have items expiring soon',
              impact: 'high',
              actionable_steps: ['Use milk in smoothie', 'Freeze bread'],
              estimated_savings: 10.50,
            },
          ],
        }),
      })
    ) as jest.Mock;

    mockUsePantryStore.mockReturnValue({
      ...defaultStoreState,
      items: [{ id: '1', ingredient_name: 'Test Item' }],
    });

    render(<PantryDashboard />);

    // Wait for AI insights to load
    await waitFor(() => {
      expect(screen.getByText('AI Pantry Insights')).toBeInTheDocument();
    });

    expect(screen.getByText('Reduce Food Waste')).toBeInTheDocument();
    expect(screen.getByText('You have items expiring soon')).toBeInTheDocument();
    expect(screen.getByText('high impact')).toBeInTheDocument();
    expect(screen.getByText('Potential savings: $10.50')).toBeInTheDocument();
  });

  it('handles hiding and showing AI insights', async () => {
    const user = userEvent.setup();

    mockUsePantryStore.mockReturnValue({
      ...defaultStoreState,
      items: [],
    });

    render(<PantryDashboard />);

    // Initially, insights section might be hidden
    const showInsightsButton = screen.queryByRole('button', { name: /show insights/i });
    if (showInsightsButton) {
      await user.click(showInsightsButton);
      expect(screen.getByText('AI Pantry Insights')).toBeInTheDocument();
    }

    // Find and click the hide button
    const hideButton = screen.getByRole('button', { name: /×/i });
    await user.click(hideButton);

    // Insights should be hidden
    expect(screen.queryByText('AI Pantry Insights')).not.toBeInTheDocument();
    expect(screen.getByText('AI insights hidden - Get smart recommendations for your pantry')).toBeInTheDocument();
  });

  it('handles error state gracefully', async () => {
    // Mock console.error to avoid cluttering test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock fetch to return an error
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;

    render(<PantryDashboard />);

    // Component should still render without crashing
    expect(screen.getByText('Pantry Overview')).toBeInTheDocument();

    // Restore console.error
    consoleSpy.mockRestore();
  });
});