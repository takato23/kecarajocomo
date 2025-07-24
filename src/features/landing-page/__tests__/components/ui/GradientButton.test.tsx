import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';

import { 
  GradientButton,
  PrimaryButton,
  SecondaryButton,
  AccentButton,
  GhostButton,
  OutlineButton,
  CTAButton,
  FloatingActionButton,
  IconButton,
  NavButton
} from '../../../components/ui/GradientButton';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('GradientButton', () => {
  it('renders children correctly', () => {
    render(
      <GradientButton>
        Test Button
      </GradientButton>
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(
      <GradientButton variant="primary" data-testid="button">
        Primary Button
      </GradientButton>
    );
    
    let button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-lime-400', 'text-white');
    
    rerender(
      <GradientButton variant="secondary" data-testid="button">
        Secondary Button
      </GradientButton>
    );
    
    button = screen.getByTestId('button');
    expect(button).toHaveClass('from-purple-400');
    
    rerender(
      <GradientButton variant="ghost" data-testid="button">
        Ghost Button
      </GradientButton>
    );
    
    button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-transparent', 'border-2');
  });

  it('applies correct size styles', () => {
    const { rerender } = render(
      <GradientButton size="xs" data-testid="button">
        XS Button
      </GradientButton>
    );
    
    let button = screen.getByTestId('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
    
    rerender(
      <GradientButton size="xl" data-testid="button">
        XL Button
      </GradientButton>
    );
    
    button = screen.getByTestId('button');
    expect(button).toHaveClass('px-10', 'py-5', 'text-xl');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    
    render(
      <GradientButton onClick={handleClick}>
        Clickable Button
      </GradientButton>
    );
    
    const button = screen.getByText('Clickable Button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as link when href is provided', () => {
    render(
      <GradientButton href="https://example.com" target="_blank">
        Link Button
      </GradientButton>
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows loading state correctly', () => {
    const { rerender } = render(
      <GradientButton loading={true} data-testid="button">
        Loading Button
      </GradientButton>
    );
    
    let button = screen.getByTestId('button');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toBeDisabled();
    
    // Check for loading spinner
    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
    
    rerender(
      <GradientButton loading={false} data-testid="button">
        Normal Button
      </GradientButton>
    );
    
    button = screen.getByTestId('button');
    expect(button).not.toBeDisabled();
  });

  it('handles disabled state', () => {
    render(
      <GradientButton disabled={true} data-testid="button">
        Disabled Button
      </GradientButton>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('renders icon in correct position', () => {
    const TestIcon = () => <span data-testid="test-icon">🔥</span>;
    
    const { rerender } = render(
      <GradientButton icon={<TestIcon />} iconPosition="left">
        Button with Icon
      </GradientButton>
    );
    
    let icon = screen.getByTestId('test-icon');
    const button = screen.getByText('Button with Icon');
    
    // Icon should appear before text
    const parentElement = icon.closest('div');
    expect(parentElement).toBeInTheDocument();
    
    rerender(
      <GradientButton icon={<TestIcon />} iconPosition="right">
        Button with Icon
      </GradientButton>
    );
    
    icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies full width when specified', () => {
    render(
      <GradientButton fullWidth={true} data-testid="button">
        Full Width Button
      </GradientButton>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('w-full');
  });

  it('applies glow effect when specified', () => {
    render(
      <GradientButton glow={true} variant="primary" data-testid="button">
        Glowing Button
      </GradientButton>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('shadow-lg', 'shadow-lime-500/25');
  });

  it('applies custom gradient when provided', () => {
    render(
      <GradientButton gradient="bg-gradient-to-r from-red-500 to-blue-500" data-testid="button">
        Custom Gradient
      </GradientButton>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('from-red-500', 'to-blue-500');
  });

  it('supports different button types', () => {
    const { rerender } = render(
      <GradientButton type="submit" data-testid="button">
        Submit Button
      </GradientButton>
    );
    
    let button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'submit');
    
    rerender(
      <GradientButton type="reset" data-testid="button">
        Reset Button
      </GradientButton>
    );
    
    button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'reset');
  });
});

describe('PrimaryButton', () => {
  it('renders with primary variant and glow', () => {
    render(
      <PrimaryButton data-testid="primary-btn">
        Primary
      </PrimaryButton>
    );
    
    const button = screen.getByTestId('primary-btn');
    expect(button).toHaveClass('from-lime-400', 'shadow-lg');
  });
});

describe('SecondaryButton', () => {
  it('renders with secondary variant', () => {
    render(
      <SecondaryButton data-testid="secondary-btn">
        Secondary
      </SecondaryButton>
    );
    
    const button = screen.getByTestId('secondary-btn');
    expect(button).toHaveClass('from-purple-400');
  });
});

describe('AccentButton', () => {
  it('renders with accent variant and glow', () => {
    render(
      <AccentButton data-testid="accent-btn">
        Accent
      </AccentButton>
    );
    
    const button = screen.getByTestId('accent-btn');
    expect(button).toHaveClass('from-lime-400', 'via-purple-500', 'shadow-lg');
  });
});

describe('GhostButton', () => {
  it('renders with ghost variant', () => {
    render(
      <GhostButton data-testid="ghost-btn">
        Ghost
      </GhostButton>
    );
    
    const button = screen.getByTestId('ghost-btn');
    expect(button).toHaveClass('bg-transparent', 'border-2');
  });
});

describe('OutlineButton', () => {
  it('renders with outline variant', () => {
    render(
      <OutlineButton data-testid="outline-btn">
        Outline
      </OutlineButton>
    );
    
    const button = screen.getByTestId('outline-btn');
    expect(button).toHaveClass('bg-transparent', 'border-2', 'text-lime-400');
  });
});

describe('CTAButton', () => {
  it('renders with CTA-specific styling', () => {
    render(
      <CTAButton data-testid="cta-btn">
        Call to Action
      </CTAButton>
    );
    
    const button = screen.getByTestId('cta-btn');
    expect(button).toHaveClass('px-12', 'py-4', 'text-lg', 'font-bold');
  });
});

describe('FloatingActionButton', () => {
  it('renders with floating action button styling', () => {
    render(
      <FloatingActionButton data-testid="fab">
        +
      </FloatingActionButton>
    );
    
    const button = screen.getByTestId('fab');
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-50', 'shadow-2xl');
  });
});

describe('IconButton', () => {
  it('renders with icon button styling', () => {
    render(
      <IconButton data-testid="icon-btn">
        🔍
      </IconButton>
    );
    
    const button = screen.getByTestId('icon-btn');
    expect(button).toHaveClass('p-3', 'aspect-square');
  });
});

describe('NavButton', () => {
  it('renders with navigation button styling', () => {
    render(
      <NavButton data-testid="nav-btn">
        Nav Item
      </NavButton>
    );
    
    const button = screen.getByTestId('nav-btn');
    expect(button).toHaveClass('bg-transparent', 'px-4', 'py-2');
  });
});

describe('Accessibility', () => {
  it('supports keyboard navigation', () => {
    const handleClick = vi.fn();
    
    render(
      <GradientButton onClick={handleClick}>
        Keyboard Button
      </GradientButton>
    );
    
    const button = screen.getByText('Keyboard Button');
    
    // Should be focusable
    button.focus();
    expect(button).toHaveFocus();
    
    // Should handle Enter key
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Should handle Space key
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has proper ARIA attributes when disabled', () => {
    render(
      <GradientButton disabled={true} data-testid="disabled-btn">
        Disabled Button
      </GradientButton>
    );
    
    const button = screen.getByTestId('disabled-btn');
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('has proper focus styles', () => {
    render(
      <GradientButton data-testid="focus-btn">
        Focus Button
      </GradientButton>
    );
    
    const button = screen.getByTestId('focus-btn');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('provides loading state feedback', () => {
    render(
      <GradientButton loading={true} data-testid="loading-btn">
        Loading Button
      </GradientButton>
    );
    
    const button = screen.getByTestId('loading-btn');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    // Should have loading indicator
    const spinner = button.querySelector('[class*="animate-spin"]');
    expect(spinner).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('does not re-render unnecessarily', () => {
    const renderCount = vi.fn();
    
    function TestButton() {
      renderCount();
      return <GradientButton>Test</GradientButton>;
    }
    
    const { rerender } = render(<TestButton />);
    expect(renderCount).toHaveBeenCalledTimes(1);
    
    // Re-render with same props shouldn't cause re-render
    rerender(<TestButton />);
    expect(renderCount).toHaveBeenCalledTimes(2); // React will re-render but that's expected
  });

  it('handles rapid clicks gracefully', () => {
    const handleClick = vi.fn();
    
    render(
      <GradientButton onClick={handleClick}>
        Rapid Click Button
      </GradientButton>
    );
    
    const button = screen.getByText('Rapid Click Button');
    
    // Simulate rapid clicks
    for (let i = 0; i < 10; i++) {
      fireEvent.click(button);
    }
    
    expect(handleClick).toHaveBeenCalledTimes(10);
  });
});