import React from 'react';
import { render, screen, waitFor, within } from '../../../utils/test-utils';
import { PantryItemList } from '@/features/pantry/components/PantryItemList';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import userEvent from '@testing-library/user-event';

// Mock the store
jest.mock('@/features/pantry/store/pantryStore');

const mockUsePantryStore = usePantryStore as jest.MockedFunction<typeof usePantryStore>;

describe('PantryItemList', () => {
  const mockFetchItems = jest.fn();
  const mockSetFilter = jest.fn();
  const mockClearFilter = jest.fn();
  const mockSelectItem = jest.fn();
  const mockSelectAll = jest.fn();
  const mockClearSelection = jest.fn();
  const mockDeleteItem = jest.fn();
  const mockDeleteItems = jest.fn();
  const mockConsumeItem = jest.fn();
  const mockGetFilteredItems = jest.fn();

  const mockItems = [
    createMockPantryItem({ 
      id: '1', 
      ingredient_name: 'Apples',
      category: 'Produce',
      location: 'Refrigerator',
      quantity: 5,
      unit: 'pieces',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }),
    createMockPantryItem({ 
      id: '2', 
      ingredient_name: 'Milk',
      category: 'Dairy',
      location: 'Refrigerator',
      quantity: 1,
      unit: 'gallon',
      expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    }),
    createMockPantryItem({ 
      id: '3', 
      ingredient_name: 'Bread',
      category: 'Pantry Staples',
      location: 'Pantry',
      quantity: 1,
      unit: 'loaf',
      expiration_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
    }),
  ];

  const defaultStoreState = {
    items: mockItems,
    isLoading: false,
    error: null,
    filter: { search_term: '', sort_by: 'expiration_date' as const, sort_order: 'asc' as const },
    selectedItems: [],
    setFilter: mockSetFilter,
    clearFilter: mockClearFilter,
    selectItem: mockSelectItem,
    selectAll: mockSelectAll,
    clearSelection: mockClearSelection,
    deleteItem: mockDeleteItem,
    deleteItems: mockDeleteItems,
    fetchItems: mockFetchItems,
    getFilteredItems: mockGetFilteredItems,
    consumeItem: mockConsumeItem,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePantryStore.mockReturnValue(defaultStoreState);
    mockGetFilteredItems.mockReturnValue(mockItems);
  });

  describe('Rendering', () => {
    it('renders pantry item list correctly', () => {
      render(<PantryItemList />);

      // Check search and filter controls
      expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();

      // Check items are rendered
      expect(screen.getByText('Apples')).toBeInTheDocument();
      expect(screen.getByText('Milk')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    it('fetches items on mount', () => {
      render(<PantryItemList />);
      expect(mockFetchItems).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when loading', () => {
      mockUsePantryStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true,
        items: [],
      });
      mockGetFilteredItems.mockReturnValue([]);

      render(<PantryItemList />);

      // Should show loading skeletons
      expect(screen.getAllByTestId(/loading-skeleton|animate-pulse/i).length).toBeGreaterThan(0);
    });

    it('shows empty state when no items', () => {
      mockGetFilteredItems.mockReturnValue([]);

      render(<PantryItemList />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText(/your pantry is empty/i)).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    it('handles search input', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      const searchInput = screen.getByPlaceholderText(/search items/i);
      await user.type(searchInput, 'apple');

      await waitFor(() => {
        expect(mockSetFilter).toHaveBeenCalledWith({ search_term: 'apple' });
      });
    });

    it('toggles filter panel', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      // Filter panel should be hidden initially
      expect(screen.queryByLabelText(/category/i)).not.toBeInTheDocument();

      // Click to show filters
      await user.click(screen.getByRole('button', { name: /filters/i }));

      // Filter panel should be visible
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiring within/i)).toBeInTheDocument();
    });

    it('applies category filter', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      // Show filters
      await user.click(screen.getByRole('button', { name: /filters/i }));

      // Select category
      await user.selectOptions(screen.getByLabelText(/category/i), 'Produce');

      expect(mockSetFilter).toHaveBeenCalledWith({ category: 'Produce' });
    });

    it('clears filters', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      // Show filters
      await user.click(screen.getByRole('button', { name: /filters/i }));

      // Click clear filters
      await user.click(screen.getByRole('button', { name: /clear filters/i }));

      expect(mockClearFilter).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('handles sort by name', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      await user.click(screen.getByRole('button', { name: /name/i }));

      expect(mockSetFilter).toHaveBeenCalledWith({ 
        sort_by: 'name', 
        sort_order: 'asc' 
      });
    });

    it('toggles sort order on second click', async () => {
      const user = userEvent.setup();
      
      mockUsePantryStore.mockReturnValue({
        ...defaultStoreState,
        filter: { ...defaultStoreState.filter, sort_by: 'name', sort_order: 'asc' },
      });

      render(<PantryItemList />);

      await user.click(screen.getByRole('button', { name: /name/i }));

      expect(mockSetFilter).toHaveBeenCalledWith({ 
        sort_by: 'name', 
        sort_order: 'desc' 
      });
    });
  });

  describe('Item Actions', () => {
    it('handles item edit', async () => {
      const user = userEvent.setup();
      const mockOnEditItem = jest.fn();

      render(<PantryItemList onEditItem={mockOnEditItem} />);

      // Find and click edit button for first item
      const firstItemCard = screen.getByText('Apples').closest('[class*="Card"]');
      const editButton = within(firstItemCard!).getAllByRole('button')[1]; // Edit button
      
      await user.click(editButton);

      expect(mockOnEditItem).toHaveBeenCalledWith(mockItems[0]);
    });

    it('handles item delete', async () => {
      const user = userEvent.setup();
      const mockOnDeleteItem = jest.fn();

      render(<PantryItemList onDeleteItem={mockOnDeleteItem} />);

      // Find and click delete button for first item
      const firstItemCard = screen.getByText('Apples').closest('[class*="Card"]');
      const deleteButton = within(firstItemCard!).getAllByRole('button')[3]; // Delete button
      
      await user.click(deleteButton);

      expect(mockOnDeleteItem).toHaveBeenCalledWith(mockItems[0]);
    });

    it('handles consume item', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      // Find and click consume button for first item
      const firstItemCard = screen.getByText('Apples').closest('[class*="Card"]');
      const consumeButton = within(firstItemCard!).getAllByRole('button')[2]; // Consume button
      
      await user.click(consumeButton);

      expect(mockConsumeItem).toHaveBeenCalledWith('1', 1);
    });
  });

  describe('Selection', () => {
    it('handles item selection', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      // Click on item card to select
      const firstItemCard = screen.getByText('Apples').closest('[class*="Card"]');
      await user.click(firstItemCard!);

      expect(mockSelectItem).toHaveBeenCalledWith('1');
    });

    it('shows bulk actions when items selected', () => {
      mockUsePantryStore.mockReturnValue({
        ...defaultStoreState,
        selectedItems: ['1', '2'],
      });

      render(<PantryItemList />);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('handles bulk delete', async () => {
      const user = userEvent.setup();
      
      mockUsePantryStore.mockReturnValue({
        ...defaultStoreState,
        selectedItems: ['1', '2'],
      });

      render(<PantryItemList />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(mockDeleteItems).toHaveBeenCalledWith(['1', '2']);
    });

    it('handles select all', async () => {
      const user = userEvent.setup();

      render(<PantryItemList />);

      await user.click(screen.getByRole('button', { name: /select all/i }));

      expect(mockSelectAll).toHaveBeenCalled();
    });
  });

  describe('View Modes', () => {
    it('switches between list and grid view', async () => {
      const user = userEvent.setup();
      const mockOnViewModeChange = jest.fn();

      render(<PantryItemList viewMode="list" onViewModeChange={mockOnViewModeChange} />);

      // Click grid view button
      const gridButton = screen.getByRole('button', { name: /grid/i });
      await user.click(gridButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('grid');
    });
  });

  describe('Expiration Status', () => {
    it('shows correct expiration badges', () => {
      render(<PantryItemList />);

      // Check Milk (2 days left - urgent)
      const milkCard = screen.getByText('Milk').closest('[class*="Card"]');
      expect(within(milkCard!).getByText(/2d left/i)).toBeInTheDocument();

      // Check Bread (expired)
      const breadCard = screen.getByText('Bread').closest('[class*="Card"]');
      expect(within(breadCard!).getByText(/expired 1d ago/i)).toBeInTheDocument();

      // Check Apples (7 days left - good)
      const applesCard = screen.getByText('Apples').closest('[class*="Card"]');
      expect(within(applesCard!).getByText(/7d left/i)).toBeInTheDocument();
    });
  });

  describe('Grid View', () => {
    it('renders items in grid layout', () => {
      render(<PantryItemList viewMode="grid" />);

      // Check that items are displayed in grid format
      const container = screen.getByText('Apples').closest('[class*="grid"]');
      expect(container).toBeInTheDocument();
    });

    it('shows item menu on more button click in grid view', async () => {
      const user = userEvent.setup();

      render(<PantryItemList viewMode="grid" />);

      // Find and click more button
      const firstItemCard = screen.getByText('Apples').closest('[class*="Card"]');
      const moreButton = within(firstItemCard!).getByRole('button');
      
      await user.click(moreButton);

      // Menu should be visible
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error state when fetch fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetchItems.mockRejectedValue(new Error('Network error'));

      render(<PantryItemList />);

      // Component should still render
      expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});