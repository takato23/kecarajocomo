import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PantryStatusCard } from '@/components/dashboard/PantryStatusCard';

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

describe('PantryStatusCard', () => {
  const mockItems = [
    { id: '1', name: 'Bread', quantity: 1, unit: 'loaf', daysUntilExpiry: 2, status: 'expiring' as const },
    { id: '2', name: 'Rice', quantity: 100, unit: 'g', status: 'low' as const },
    { id: '3', name: 'Pasta', quantity: 500, unit: 'g', status: 'good' as const },
    { id: '4', name: 'Yogurt', quantity: 4, unit: 'cups', daysUntilExpiry: 1, status: 'expiring' as const },
  ];

  it('renders with default items', () => {
    render(<PantryStatusCard />);
    
    expect(screen.getByText('Pantry Status')).toBeInTheDocument();
    expect(screen.getByText('Your inventory')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('renders with custom items', () => {
    render(<PantryStatusCard items={mockItems} />);
    
    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.getByText('Rice')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Yogurt')).toBeInTheDocument();
  });

  it('displays alert summary correctly', () => {
    render(<PantryStatusCard items={mockItems} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 expiring items
    expect(screen.getByText('Expiring soon')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 low stock item
    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('calls onViewAll when view all button is clicked', () => {
    const handleViewAll = jest.fn();
    render(<PantryStatusCard onViewAll={handleViewAll} />);
    
    fireEvent.click(screen.getByText('View all'));
    expect(handleViewAll).toHaveBeenCalledTimes(1);
  });

  it('calls onItemClick when item is clicked', () => {
    const handleItemClick = jest.fn();
    render(<PantryStatusCard items={mockItems} onItemClick={handleItemClick} />);
    
    fireEvent.click(screen.getByText('Bread').parentElement!.parentElement!);
    expect(handleItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('displays days until expiry', () => {
    render(<PantryStatusCard items={mockItems} />);
    
    expect(screen.getByText('2d')).toBeInTheDocument();
    expect(screen.getByText('1d')).toBeInTheDocument();
  });

  it('shows correct status icons and colors', () => {
    render(<PantryStatusCard items={mockItems} />);
    
    // Check for status-specific classes
    const breadItem = screen.getByText('Bread').parentElement!.parentElement!;
    expect(breadItem.querySelector('.bg-orange-500\\/20')).toBeInTheDocument();
    
    const riceItem = screen.getByText('Rice').parentElement!.parentElement!;
    expect(riceItem.querySelector('.bg-yellow-500\\/20')).toBeInTheDocument();
    
    const pastaItem = screen.getByText('Pasta').parentElement!.parentElement!;
    expect(pastaItem.querySelector('.bg-green-500\\/20')).toBeInTheDocument();
  });

  it('displays quantities and units', () => {
    render(<PantryStatusCard items={mockItems} />);
    
    expect(screen.getByText('1 loaf')).toBeInTheDocument();
    expect(screen.getByText('100 g')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
    expect(screen.getByText('4 cups')).toBeInTheDocument();
  });

  it('hides alert summary when no alerts', () => {
    const goodItems = [
      { id: '1', name: 'Item1', quantity: 1, unit: 'kg', status: 'good' as const },
      { id: '2', name: 'Item2', quantity: 2, unit: 'kg', status: 'good' as const },
    ];
    
    render(<PantryStatusCard items={goodItems} />);
    
    expect(screen.queryByText('Expiring soon')).not.toBeInTheDocument();
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });

  it('has hover effect on items', () => {
    render(<PantryStatusCard items={mockItems} />);
    
    const item = screen.getByText('Bread').parentElement!.parentElement!;
    expect(item).toHaveClass('hover:bg-white/10');
  });

  it('renders empty state with no items', () => {
    render(<PantryStatusCard items={[]} />);
    
    expect(screen.getByText('Pantry Status')).toBeInTheDocument();
    expect(screen.queryByText('Expiring soon')).not.toBeInTheDocument();
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });

  it('shows only expiring alert when no low stock', () => {
    const expiringOnlyItems = [
      { id: '1', name: 'Item1', quantity: 1, unit: 'kg', daysUntilExpiry: 1, status: 'expiring' as const },
      { id: '2', name: 'Item2', quantity: 2, unit: 'kg', status: 'good' as const },
    ];
    
    render(<PantryStatusCard items={expiringOnlyItems} />);
    
    expect(screen.getByText('Expiring soon')).toBeInTheDocument();
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });
});