import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardLayout, GlassCard, StatCard, QuickAction } from '@/components/dashboard/DashboardLayout';
import { Bell, Flame, TrendingUp } from 'lucide-react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('DashboardLayout', () => {
  it('renders with user name', () => {
    render(<DashboardLayout userName="John Doe" />);
    expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
  });

  it('renders with default user name', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('Welcome back, User')).toBeInTheDocument();
  });

  it('displays current date', () => {
    render(<DashboardLayout />);
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    expect(screen.getByText(today)).toBeInTheDocument();
  });

  it('renders notification bell', () => {
    render(<DashboardLayout />);
    const bell = screen.getByRole('button');
    expect(bell).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <DashboardLayout>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});

describe('GlassCard', () => {
  it('renders children content', () => {
    render(
      <GlassCard>
        <div>Card Content</div>
      </GlassCard>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <GlassCard className="custom-class">
        <div>Content</div>
      </GlassCard>
    );
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  it('has glass morphism styles', () => {
    render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('bg-white/10', 'backdrop-blur-md', 'border-white/20');
  });
});

describe('StatCard', () => {
  it('renders with all props', () => {
    render(
      <StatCard
        icon={Flame}
        label="Calories"
        value="1,500"
        trend={5}
        color="text-orange-400"
      />
    );
    
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('renders without trend', () => {
    render(
      <StatCard
        icon={Flame}
        label="Items"
        value={42}
      />
    );
    
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('shows positive trend with green color', () => {
    render(
      <StatCard
        icon={Flame}
        label="Growth"
        value="100"
        trend={10}
      />
    );
    
    const trendElement = screen.getByText('10%');
    expect(trendElement).toHaveClass('text-green-400');
  });

  it('shows negative trend with red color', () => {
    render(
      <StatCard
        icon={Flame}
        label="Loss"
        value="50"
        trend={-5}
      />
    );
    
    const trendElement = screen.getByText('5%');
    expect(trendElement).toHaveClass('text-red-400');
  });
});

describe('QuickAction', () => {
  it('renders with label and icon', () => {
    render(
      <QuickAction
        icon={Flame}
        label="Test Action"
      />
    );
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <QuickAction
        icon={Flame}
        label="Click Me"
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom color', () => {
    render(
      <QuickAction
        icon={Flame}
        label="Custom Color"
        color="bg-red-500"
      />
    );
    
    const button = screen.getByRole('button');
    const iconContainer = button.querySelector('.bg-red-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('has hover and tap animations', () => {
    render(
      <QuickAction
        icon={Flame}
        label="Animated"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-white/20');
  });
});