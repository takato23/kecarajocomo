import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShoppingListCard } from '@/components/dashboard/ShoppingListCard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

// Mock GlassCard
jest.mock('@/components/dashboard/DashboardLayout', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

describe('ShoppingListCard', () => {
  const mockItems = [
    { id: '1', name: 'Apples', quantity: 5, unit: 'pieces', category: 'Produce', checked: true },
    { id: '2', name: 'Milk', quantity: 2, unit: 'liters', category: 'Dairy', checked: false },
    { id: '3', name: 'Bread', quantity: 1, unit: 'loaf', category: 'Bakery', checked: false },
    { id: '4', name: 'Cheese', quantity: 200, unit: 'g', category: 'Dairy', checked: true },
  ];

  it('renders with default items', () => {
    render(<ShoppingListCard />);
    
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('4 items')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
  });

  it('renders with custom items', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.getByText('Cheese')).toBeInTheDocument();
  });

  it('groups items by category', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Bakery')).toBeInTheDocument();
  });

  it('displays shopping progress correctly', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    expect(screen.getByText('Shopping Progress')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument(); // 2 checked out of 4
  });

  it('calls onAddItem when add button is clicked', () => {
    const handleAddItem = jest.fn();
    render(<ShoppingListCard onAddItem={handleAddItem} />);
    
    const buttons = screen.getAllByRole('button');
    const addButton = buttons[buttons.length - 1]; // Last button is add
    fireEvent.click(addButton);
    
    expect(handleAddItem).toHaveBeenCalledTimes(1);
  });

  it('calls onGenerateList when AI button is clicked', () => {
    const handleGenerateList = jest.fn();
    render(<ShoppingListCard onGenerateList={handleGenerateList} />);
    
    const buttons = screen.getAllByRole('button');
    const aiButton = buttons[buttons.length - 2]; // Second to last is AI generate
    fireEvent.click(aiButton);
    
    expect(handleGenerateList).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleItem when item is clicked', () => {
    const handleToggleItem = jest.fn();
    render(<ShoppingListCard items={mockItems} onToggleItem={handleToggleItem} />);
    
    fireEvent.click(screen.getByText('Apples').parentElement!.parentElement!);
    expect(handleToggleItem).toHaveBeenCalledWith(mockItems[0]);
  });

  it('shows checked items with line-through', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    expect(screen.getByText('Apples')).toHaveClass('line-through');
    expect(screen.getByText('Cheese')).toHaveClass('line-through');
    expect(screen.getByText('Milk')).not.toHaveClass('line-through');
  });

  it('displays quantities and units', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    expect(screen.getByText('5 pieces')).toBeInTheDocument();
    expect(screen.getByText('2 liters')).toBeInTheDocument();
    expect(screen.getByText('1 loaf')).toBeInTheDocument();
    expect(screen.getByText('200 g')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    const allCheckedItems = mockItems.map(item => ({ ...item, checked: true }));
    const { rerender } = render(<ShoppingListCard items={allCheckedItems} />);
    
    expect(screen.getByText('4/4')).toBeInTheDocument(); // All checked
    
    const noCheckedItems = mockItems.map(item => ({ ...item, checked: false }));
    rerender(<ShoppingListCard items={noCheckedItems} />);
    
    expect(screen.getByText('0/4')).toBeInTheDocument(); // None checked
  });

  it('shows checked state correctly', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    const appleItem = screen.getByText('Apples').parentElement!.parentElement!;
    expect(appleItem.querySelector('.bg-green-500')).toBeInTheDocument();
    
    const milkItem = screen.getByText('Milk').parentElement!.parentElement!;
    expect(milkItem.querySelector('.bg-green-500')).not.toBeInTheDocument();
  });

  it('has hover effect on items', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    const item = screen.getByText('Apples').parentElement!.parentElement!;
    expect(item).toHaveClass('hover:bg-white/10');
  });

  it('applies opacity to checked items', () => {
    render(<ShoppingListCard items={mockItems} />);
    
    const checkedItem = screen.getByText('Apples').parentElement!.parentElement!;
    expect(checkedItem).toHaveClass('opacity-60');
  });

  it('renders empty state with no items', () => {
    render(<ShoppingListCard items={[]} />);
    
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(screen.getByText('0/0')).toBeInTheDocument();
  });

  it('has AI generate button with sparkles icon', () => {
    render(<ShoppingListCard />);
    
    const buttons = screen.getAllByRole('button');
    const aiButton = buttons[buttons.length - 2];
    expect(aiButton).toHaveAttribute('title', 'Generate AI shopping list');
  });
});