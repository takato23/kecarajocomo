/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingListGenerator as ShoppingList } from '@/features/planner/components/ShoppingListGenerator';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockShoppingItems = [
  {
    id: '1',
    ingredient_name: 'Apples',
    quantity: 5,
    unit: 'pieces',
    category: 'Produce',
    is_purchased: false,
    priority: 'medium' as const,
    notes: 'Red apples preferred',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    ingredient_name: 'Milk',
    quantity: 1,
    unit: 'L',
    category: 'Dairy',
    is_purchased: true,
    priority: 'high' as const,
    notes: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('ShoppingList Component', () => {
  it('renders shopping list items', () => {
    render(<ShoppingList items={mockShoppingItems} />);
    
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('5 pieces')).toBeInTheDocument();
    expect(screen.getByText('1 L')).toBeInTheDocument();
  });

  it('shows item categories', () => {
    render(<ShoppingList items={mockShoppingItems} />);
    
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('displays priority indicators', () => {
    render(<ShoppingList items={mockShoppingItems} />);
    
    expect(screen.getByText('shopping.priority.medium')).toBeInTheDocument();
    expect(screen.getByText('shopping.priority.high')).toBeInTheDocument();
  });

  it('shows purchased items as completed', () => {
    render(<ShoppingList items={mockShoppingItems} />);
    
    const milkItem = screen.getByText('Milk').closest('[data-testid="shopping-item"]');
    expect(milkItem).toHaveClass('opacity-50');
  });

  it('handles item purchase toggle', () => {
    const mockOnTogglePurchased = jest.fn();
    
    render(<ShoppingList items={mockShoppingItems} onTogglePurchased={mockOnTogglePurchased} />);
    
    const appleCheckbox = screen.getByLabelText('shopping.mark-purchased');
    fireEvent.click(appleCheckbox);
    
    expect(mockOnTogglePurchased).toHaveBeenCalledWith('1', true);
  });

  it('handles item deletion', () => {
    const mockOnDelete = jest.fn();
    
    render(<ShoppingList items={mockShoppingItems} onDelete={mockOnDelete} />);
    
    const deleteButtons = screen.getAllByText('shopping.delete-item');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('handles item editing', () => {
    const mockOnEdit = jest.fn();
    
    render(<ShoppingList items={mockShoppingItems} onEdit={mockOnEdit} />);
    
    const editButtons = screen.getAllByText('shopping.edit-item');
    fireEvent.click(editButtons[0]);
    
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  it('renders empty state when no items', () => {
    render(<ShoppingList items={[]} />);
    
    expect(screen.getByText('shopping.empty.title')).toBeInTheDocument();
    expect(screen.getByText('shopping.empty.description')).toBeInTheDocument();
  });

  it('groups items by category', () => {
    render(<ShoppingList items={mockShoppingItems} groupByCategory />);
    
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ShoppingList items={mockShoppingItems} loading />);
    
    expect(screen.getByText('shopping.loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<ShoppingList items={[]} error="Failed to load items" />);
    
    expect(screen.getByText('shopping.error.title')).toBeInTheDocument();
    expect(screen.getByText('Failed to load items')).toBeInTheDocument();
  });

  it('filters items by purchase status', () => {
    render(<ShoppingList items={mockShoppingItems} showPurchased={false} />);
    
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
  });

  it('shows item notes when available', () => {
    render(<ShoppingList items={mockShoppingItems} />);
    
    expect(screen.getByText('Red apples preferred')).toBeInTheDocument();
  });

  it('handles bulk actions', () => {
    const mockOnBulkAction = jest.fn();
    
    render(<ShoppingList items={mockShoppingItems} onBulkAction={mockOnBulkAction} />);
    
    const selectAllCheckbox = screen.getByLabelText('shopping.select-all');
    fireEvent.click(selectAllCheckbox);
    
    const bulkPurchaseButton = screen.getByText('shopping.mark-all-purchased');
    fireEvent.click(bulkPurchaseButton);
    
    expect(mockOnBulkAction).toHaveBeenCalledWith('purchase', ['1', '2']);
  });

  it('supports drag and drop reordering', () => {
    const mockOnReorder = jest.fn();
    
    render(<ShoppingList items={mockShoppingItems} onReorder={mockOnReorder} />);
    
    const firstItem = screen.getByText('Apples').closest('[data-testid="shopping-item"]');
    const secondItem = screen.getByText('Milk').closest('[data-testid="shopping-item"]');
    
    expect(firstItem).toHaveAttribute('draggable', 'true');
    expect(secondItem).toHaveAttribute('draggable', 'true');
  });

  it('shows progress indicator', () => {
    render(<ShoppingList items={mockShoppingItems} showProgress />);
    
    expect(screen.getByText('shopping.progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument(); // 1 out of 2 items purchased
  });
});