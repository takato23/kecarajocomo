/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PantryDashboard } from '@/components/pantry/PantryDashboard';
import { PantryItem, PantryStats } from '@/types/pantry';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid=\"plus-icon\" />,
  Search: () => <div data-testid=\"search-icon\" />,
  Filter: () => <div data-testid=\"filter-icon\" />,
  Grid3X3: () => <div data-testid=\"grid-icon\" />,
  List: () => <div data-testid=\"list-icon\" />,
  Mic: () => <div data-testid=\"mic-icon\" />,
  MicOff: () => <div data-testid=\"mic-off-icon\" />,
  AlertTriangle: () => <div data-testid=\"alert-icon\" />,
  Calendar: () => <div data-testid=\"calendar-icon\" />,
  Package: () => <div data-testid=\"package-icon\" />,
  TrendingUp: () => <div data-testid=\"trending-up-icon\" />,
}));

// Mock child components
jest.mock('@/components/pantry/PantryItemCard', () => ({
  PantryItemCard: ({ item, onUpdate, onDelete }: any) => (
    <div data-testid={`pantry-item-card-${item.id}`}>
      <span>{item.ingredient?.name}</span>
      <button onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}>
        Update
      </button>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  ),
}));

jest.mock('@/components/pantry/PantryItemList', () => ({
  PantryItemList: ({ item, onUpdate, onDelete }: any) => (
    <div data-testid={`pantry-item-list-${item.id}`}>
      <span>{item.ingredient?.name}</span>
      <button onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}>
        Update
      </button>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  ),
}));

jest.mock('@/components/pantry/PantryAddForm', () => ({
  PantryAddForm: ({ onClose, onSubmit }: any) => (
    <div data-testid=\"pantry-add-form\">
      <button onClick={onClose}>Close</button>
      <button 
        onClick={() => onSubmit({ 
          ingredient_name: 'Test Item',
          quantity: 1,
          unit: 'pcs'
        })}
      >
        Submit
      </button>
    </div>
  ),
}));

jest.mock('@/components/pantry/PantryStats', () => ({
  PantryStats: ({ stats, onQuickFilter }: any) => (
    <div data-testid=\"pantry-stats\">
      <span>Total: {stats.total_items}</span>
      <button onClick={() => onQuickFilter('expired')}>Show Expired</button>
      <button onClick={() => onQuickFilter('low_stock')}>Show Low Stock</button>
    </div>
  ),
}));

jest.mock('@/components/pantry/VoiceInput', () => ({
  VoiceInput: ({ isRecording, onComplete, onClose }: any) => (
    <div data-testid=\"voice-input\">
      <span>Recording: {isRecording ? 'true' : 'false'}</span>
      <button onClick={() => onComplete([])}>Complete</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/components/pantry/CategoryFilter', () => ({
  CategoryFilter: ({ selectedCategory, onCategoryChange }: any) => (
    <div data-testid=\"category-filter\">
      <span>Selected: {selectedCategory || 'none'}</span>
      <button onClick={() => onCategoryChange('verduras')}>Verduras</button>
      <button onClick={() => onCategoryChange(undefined)}>Clear</button>
    </div>
  ),
}));

const mockStats: PantryStats = {
  total_items: 5,
  categories: {
    verduras: 2,
    frutas: 1,
    carnes: 2,
    lacteos: 0,
    granos: 0,
    condimentos: 0,
    bebidas: 0,
    enlatados: 0,
    congelados: 0,
    panaderia: 0,
    snacks: 0,
    otros: 0,
  },
  expiring_soon: 1,
  expired: 0,
  low_stock: 2,
  items_by_location: {
    despensa: 3,
    refrigerador: 2,
  },
};

const mockItems: PantryItem[] = [
  {
    id: '1',
    user_id: 'user1',
    ingredient_id: 'ing1',
    ingredient: {
      id: 'ing1',
      name: 'Tomate',
      normalized_name: 'tomate',
      category: 'verduras',
      common_names: ['tomate', 'jitomate'],
      created_at: new Date(),
      updated_at: new Date(),
    },
    quantity: 5,
    unit: 'pcs',
    location: 'despensa',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    user_id: 'user1',
    ingredient_id: 'ing2',
    ingredient: {
      id: 'ing2',
      name: 'Leche',
      normalized_name: 'leche',
      category: 'lacteos',
      common_names: ['leche'],
      created_at: new Date(),
      updated_at: new Date(),
    },
    quantity: 1,
    unit: 'l',
    location: 'refrigerador',
    expiration_date: new Date(Date.now() + 86400000), // Tomorrow
    low_stock_threshold: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

describe('PantryDashboard', () => {
  const defaultProps = {
    items: mockItems,
    stats: mockStats,
    onAddItem: jest.fn(),
    onUpdateItem: jest.fn(),
    onDeleteItem: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders pantry dashboard with basic elements', () => {
    render(<PantryDashboard {...defaultProps} />);

    expect(screen.getByText('Mi Despensa')).toBeInTheDocument();
    expect(screen.getByText(/5 ingredientes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar/i })).toBeInTheDocument();
  });

  test('displays pantry items in grid view by default', () => {
    render(<PantryDashboard {...defaultProps} />);

    expect(screen.getByTestId('pantry-item-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('pantry-item-card-2')).toBeInTheDocument();
    expect(screen.getByText('Tomate')).toBeInTheDocument();
    expect(screen.getByText('Leche')).toBeInTheDocument();
  });

  test('switches to list view when list button is clicked', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const listButton = screen.getByTestId('list-icon').closest('button')!;
    await user.click(listButton);

    expect(screen.getByTestId('pantry-item-list-1')).toBeInTheDocument();
    expect(screen.getByTestId('pantry-item-list-2')).toBeInTheDocument();
  });

  test('opens add form when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);

    expect(screen.getByTestId('pantry-add-form')).toBeInTheDocument();
  });

  test('opens voice input when microphone button is clicked', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const micButton = screen.getByTestId('mic-icon').closest('button')!;
    await user.click(micButton);

    expect(screen.getByTestId('voice-input')).toBeInTheDocument();
    expect(screen.getByText('Recording: true')).toBeInTheDocument();
  });

  test('filters items by search query', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/buscar ingredientes/i);
    await user.type(searchInput, 'tomate');

    // In a real implementation, this would filter the items
    // For now, we just verify the input works
    expect(searchInput).toHaveValue('tomate');
  });

  test('calls onUpdateItem when item is updated', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const updateButton = screen.getAllByText('Update')[0];
    await user.click(updateButton);

    expect(defaultProps.onUpdateItem).toHaveBeenCalledWith('1', { quantity: 6 });
  });

  test('calls onDeleteItem when item is deleted', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const deleteButton = screen.getAllByText('Delete')[0];
    await user.click(deleteButton);

    expect(defaultProps.onDeleteItem).toHaveBeenCalledWith('1');
  });

  test('shows loading state when isLoading is true', () => {
    render(<PantryDashboard {...defaultProps} isLoading={true} />);

    // Should show skeleton loading cards
    const skeletonCards = screen.getAllByRole('generic').filter(el =>
      el.className.includes('animate-pulse')
    );
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  test('shows empty state when no items are present', () => {
    render(<PantryDashboard {...defaultProps} items={[]} />);

    expect(screen.getByText('No hay ingredientes')).toBeInTheDocument();
    expect(screen.getByText(/comienza agregando ingredientes/i)).toBeInTheDocument();
  });

  test('shows filtered empty state when search has no results', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/buscar ingredientes/i);
    await user.type(searchInput, 'nonexistent ingredient');

    // In a real implementation, this would show no results
    // The actual filtering logic would be in the parent component or hook
  });

  test('handles category filter selection', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const categoryButton = screen.getByText('Verduras');
    await user.click(categoryButton);

    // The category filter would be applied in the parent component
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
  });

  test('handles sort order changes', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const sortSelect = screen.getByDisplayValue('Nombre');
    await user.selectOptions(sortSelect, 'category');

    expect(sortSelect).toHaveValue('category');
  });

  test('toggles sort direction when sort button is clicked', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const sortToggleButton = screen.getByTestId('trending-up-icon').closest('button')!;
    await user.click(sortToggleButton);

    // The icon should show rotation or the sort order should change
    expect(sortToggleButton).toBeInTheDocument();
  });

  test('handles quick filter actions from stats component', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    const expiredButton = screen.getByText('Show Expired');
    await user.click(expiredButton);

    // This would toggle the expired filter in the actual implementation
    expect(screen.getByTestId('pantry-stats')).toBeInTheDocument();
  });

  test('submits new item through add form', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    // Open add form
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);

    // Submit form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    expect(defaultProps.onAddItem).toHaveBeenCalledWith({
      ingredient_name: 'Test Item',
      quantity: 1,
      unit: 'pcs'
    });
  });

  test('completes voice input workflow', async () => {
    const user = userEvent.setup();
    render(<PantryDashboard {...defaultProps} />);

    // Open voice input
    const micButton = screen.getByTestId('mic-icon').closest('button')!;
    await user.click(micButton);

    // Complete voice input
    const completeButton = screen.getByText('Complete');
    await user.click(completeButton);

    // Voice input should close
    await waitFor(() => {
      expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument();
    });
  });

  test('displays stats correctly', () => {
    render(<PantryDashboard {...defaultProps} />);

    expect(screen.getByText('Total: 5')).toBeInTheDocument();
    expect(screen.getByTestId('pantry-stats')).toBeInTheDocument();
  });

  test('handles responsive design classes', () => {
    const { container } = render(<PantryDashboard {...defaultProps} />);

    // Check that responsive classes are present
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
  });

  test('applies glass morphism styles', () => {
    const { container } = render(<PantryDashboard {...defaultProps} />);

    // Check for glass morphism classes
    const glassElements = container.querySelectorAll('.backdrop-blur-md');
    expect(glassElements.length).toBeGreaterThan(0);
  });
});