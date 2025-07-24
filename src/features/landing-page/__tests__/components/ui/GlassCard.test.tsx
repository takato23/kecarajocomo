import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';

import { 
  GlassCard, 
  GlassFeatureCard, 
  GlassHeroCard, 
  GlassPricingCard,
  GlassTestimonialCard,
  GlassNavCard,
  GlassModalCard,
  GlassStatsCard,
  GlassButtonCard
} from '../../../components/ui/GlassCard';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div data-testid="child-content">Test Content</div>
      </GlassCard>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct intensity classes', () => {
    const { rerender } = render(
      <GlassCard intensity="light" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    let card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('backdrop-blur-sm');
    
    rerender(
      <GlassCard intensity="medium" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('backdrop-blur-md');
    
    rerender(
      <GlassCard intensity="heavy" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('backdrop-blur-lg');
  });

  it('applies custom blur when provided', () => {
    render(
      <GlassCard blur="xl" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('backdrop-blur-xl');
  });

  it('applies correct border radius', () => {
    const { rerender } = render(
      <GlassCard borderRadius="sm" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    let card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('rounded-sm');
    
    rerender(
      <GlassCard borderRadius="full" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('rounded-full');
  });

  it('shows border when enabled', () => {
    render(
      <GlassCard border={true} data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('border-white/20');
  });

  it('hides border when disabled', () => {
    render(
      <GlassCard border={false} data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).not.toHaveClass('border-white/20');
  });

  it('applies gradient background when provided', () => {
    render(
      <GlassCard gradient="bg-gradient-to-r from-red-500 to-blue-500" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const gradientDiv = screen.getByTestId('glass-card').querySelector('[class*="bg-gradient-to-r"]');
    expect(gradientDiv).toBeInTheDocument();
    expect(gradientDiv).toHaveClass('from-red-500', 'to-blue-500');
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = vi.fn();
    
    render(
      <GlassCard onClick={handleClick} data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('cursor-pointer');
    
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(
      <GlassCard className="custom-class" data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('custom-class');
  });

  it('applies hover effects when hover is enabled', () => {
    render(
      <GlassCard hover={true} data-testid="glass-card">
        Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('hover:bg-white/20');
  });
});

describe('GlassFeatureCard', () => {
  it('renders with correct default props', () => {
    render(
      <GlassFeatureCard data-testid="feature-card">
        Feature Content
      </GlassFeatureCard>
    );
    
    const card = screen.getByTestId('feature-card');
    expect(card).toHaveClass('backdrop-blur-md', 'p-6');
  });

  it('applies gradient when provided', () => {
    render(
      <GlassFeatureCard gradient="bg-gradient-to-br from-lime-400/20 to-purple-500/20" data-testid="feature-card">
        Feature Content
      </GlassFeatureCard>
    );
    
    const gradientDiv = screen.getByTestId('feature-card').querySelector('[class*="bg-gradient-to-br"]');
    expect(gradientDiv).toBeInTheDocument();
  });
});

describe('GlassHeroCard', () => {
  it('renders with hero-specific styling', () => {
    render(
      <GlassHeroCard data-testid="hero-card">
        Hero Content
      </GlassHeroCard>
    );
    
    const card = screen.getByTestId('hero-card');
    expect(card).toHaveClass('backdrop-blur-lg', 'rounded-2xl', 'p-8');
  });
});

describe('GlassPricingCard', () => {
  it('renders normal pricing card', () => {
    render(
      <GlassPricingCard data-testid="pricing-card">
        Pricing Content
      </GlassPricingCard>
    );
    
    const card = screen.getByTestId('pricing-card');
    expect(card).toHaveClass('backdrop-blur-md', 'p-6');
    expect(card).not.toHaveClass('ring-2');
  });

  it('renders popular pricing card with special styling', () => {
    render(
      <GlassPricingCard popular={true} data-testid="pricing-card">
        Popular Pricing Content
      </GlassPricingCard>
    );
    
    const card = screen.getByTestId('pricing-card');
    expect(card).toHaveClass('backdrop-blur-lg', 'ring-2', 'ring-lime-400/50', 'scale-105');
  });
});

describe('GlassTestimonialCard', () => {
  it('renders with testimonial-specific styling', () => {
    render(
      <GlassTestimonialCard data-testid="testimonial-card">
        Testimonial Content
      </GlassTestimonialCard>
    );
    
    const card = screen.getByTestId('testimonial-card');
    expect(card).toHaveClass('backdrop-blur-sm', 'rounded-lg', 'p-6');
  });
});

describe('GlassNavCard', () => {
  it('renders with navigation-specific styling', () => {
    render(
      <GlassNavCard data-testid="nav-card">
        Nav Content
      </GlassNavCard>
    );
    
    const card = screen.getByTestId('nav-card');
    expect(card).toHaveClass('backdrop-blur-md', 'rounded-2xl', 'p-4');
  });
});

describe('GlassModalCard', () => {
  it('renders with modal-specific styling', () => {
    render(
      <GlassModalCard data-testid="modal-card">
        Modal Content
      </GlassModalCard>
    );
    
    const card = screen.getByTestId('modal-card');
    expect(card).toHaveClass('backdrop-blur-xl', 'rounded-2xl', 'p-8');
  });
});

describe('GlassStatsCard', () => {
  it('renders with stats-specific styling', () => {
    render(
      <GlassStatsCard data-testid="stats-card">
        Stats Content
      </GlassStatsCard>
    );
    
    const card = screen.getByTestId('stats-card');
    expect(card).toHaveClass('backdrop-blur-md', 'rounded-xl', 'p-4');
  });
});

describe('GlassButtonCard', () => {
  it('renders with button-specific styling and hover effects', () => {
    render(
      <GlassButtonCard data-testid="button-card">
        Button Content
      </GlassButtonCard>
    );
    
    const card = screen.getByTestId('button-card');
    expect(card).toHaveClass('backdrop-blur-sm', 'rounded-lg', 'p-3', 'hover:bg-white/20');
  });
});

describe('Accessibility', () => {
  it('supports keyboard navigation when clickable', () => {
    const handleClick = vi.fn();
    
    render(
      <GlassCard onClick={handleClick} data-testid="glass-card">
        Clickable Content
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    
    // Should be focusable when clickable
    card.focus();
    expect(card).toHaveFocus();
    
    // Should handle Enter key
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    
    // Should handle Space key
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
  });

  it('does not interfere with child element accessibility', () => {
    render(
      <GlassCard>
        <button aria-label="Test button">Click me</button>
      </GlassCard>
    );
    
    const button = screen.getByLabelText('Test button');
    expect(button).toBeInTheDocument();
    expect(button).toBeVisible();
  });
});

describe('Performance', () => {
  it('does not render unnecessary elements when props are default', () => {
    const { container } = render(
      <GlassCard>
        Content
      </GlassCard>
    );
    
    // Should not have gradient overlay when no gradient is provided
    const gradientOverlay = container.querySelector('[class*="bg-gradient"]');
    expect(gradientOverlay).toBeNull();
  });

  it('renders minimal DOM structure', () => {
    const { container } = render(
      <GlassCard>
        <span>Test</span>
      </GlassCard>
    );
    
    // Should have minimal DOM structure
    const allElements = container.querySelectorAll('*');
    expect(allElements.length).toBeLessThan(10); // Reasonable DOM size
  });
});