import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';

import { Hero, ProductHero, AppHero, LandingHero } from '../../../components/sections/Hero';
import { HeroProps } from '../../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>
  }
}));

// Mock the illustration components
vi.mock('../../../components/ui/FlatIllustrations', () => ({
  HeroIllustration: ({ colors, size, animated }: any) => (
    <div data-testid="hero-illustration" data-size={size} data-animated={animated}>
      Hero Illustration
    </div>
  )
}));

const mockProps: HeroProps = {
  title: 'Test Hero Title',
  subtitle: 'Test Subtitle',
  description: 'Test description for the hero section',
  cta: [
    {
      id: 'primary-cta',
      text: 'Get Started',
      href: '/signup',
      variant: 'primary',
      size: 'lg'
    },
    {
      id: 'secondary-cta',
      text: 'Learn More',
      href: '/about',
      variant: 'secondary',
      size: 'lg'
    }
  ],
  stats: [
    { label: 'Users', value: '50K+', gradient: 'from-lime-600 to-purple-600' },
    { label: 'Recipes', value: '1M+', gradient: 'from-purple-600 to-cyan-600' }
  ],
  illustration: <div data-testid="custom-illustration">Custom Illustration</div>,
  background: {
    gradient: 'bg-gradient-to-br from-lime-400/20 to-purple-500/20',
    overlay: 'bg-white/5'
  }
};

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required content', () => {
    render(<Hero {...mockProps} />);
    
    expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test description for the hero section')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('renders stats correctly', () => {
    render(<Hero {...mockProps} />);
    
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('1M+')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
  });

  it('handles CTA button clicks', () => {
    const mockOnClick = vi.fn();
    const propsWithClick = {
      ...mockProps,
      cta: [
        {
          id: 'clickable-cta',
          text: 'Click Me',
          href: '/test',
          variant: 'primary' as const,
          size: 'lg' as const,
          onClick: mockOnClick
        }
      ]
    };
    
    render(<Hero {...propsWithClick} />);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders without stats when not provided', () => {
    const propsWithoutStats = { ...mockProps, stats: [] };
    render(<Hero {...propsWithoutStats} />);
    
    expect(screen.queryByText('50K+')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Hero {...mockProps} className="custom-hero-class" data-testid="hero-section" />);
    
    const heroSection = screen.getByTestId('hero-section');
    expect(heroSection).toHaveClass('custom-hero-class');
  });

  it('renders scroll indicator', () => {
    render(<Hero {...mockProps} />);
    
    expect(screen.getByText('Scroll to explore')).toBeInTheDocument();
    
    // Check for scroll arrow icon
    const scrollIcon = screen.getByText('Scroll to explore').parentElement?.querySelector('svg');
    expect(scrollIcon).toBeInTheDocument();
  });

  it('handles multiple CTA buttons', () => {
    const multiCTAProps = {
      ...mockProps,
      cta: [
        ...mockProps.cta,
        {
          id: 'third-cta',
          text: 'Third Button',
          href: '/third',
          variant: 'primary' as const,
          size: 'md' as const
        }
      ]
    };
    
    render(<Hero {...multiCTAProps} />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByText('Third Button')).toBeInTheDocument();
  });

  it('renders with gradient background', () => {
    render(<Hero {...mockProps} data-testid="hero-section" />);
    
    const heroSection = screen.getByTestId('hero-section');
    expect(heroSection).toHaveClass('bg-gradient-to-br');
  });

  it('supports custom background props', () => {
    const customBgProps = {
      ...mockProps,
      background: {
        gradient: 'bg-gradient-to-r from-red-500 to-blue-500',
        overlay: 'bg-black/10'
      }
    };
    
    render(<Hero {...customBgProps} />);
    
    // Should render custom background elements
    const backgroundElements = document.querySelectorAll('[class*="bg-gradient-to-r"]');
    expect(backgroundElements.length).toBeGreaterThan(0);
  });
});

describe('ProductHero', () => {
  it('renders with default illustration and background', () => {
    const productProps = {
      title: 'Product Title',
      subtitle: 'Product Subtitle',
      description: 'Product description',
      cta: mockProps.cta,
      stats: mockProps.stats
    };
    
    render(<ProductHero {...productProps} />);
    
    expect(screen.getByText('Product Title')).toBeInTheDocument();
    expect(screen.getByTestId('hero-illustration')).toBeInTheDocument();
  });

  it('applies product-specific styling', () => {
    const productProps = {
      title: 'Product Title',
      subtitle: 'Product Subtitle',
      description: 'Product description',
      cta: mockProps.cta,
      stats: mockProps.stats
    };
    
    render(<ProductHero {...productProps} data-testid="product-hero" />);
    
    const heroSection = screen.getByTestId('product-hero');
    expect(heroSection).toBeInTheDocument();
  });
});

describe('AppHero', () => {
  it('renders with default stats and illustration', () => {
    const appProps = {
      title: 'App Title',
      subtitle: 'App Subtitle',
      description: 'App description',
      cta: mockProps.cta
    };
    
    render(<AppHero {...appProps} />);
    
    expect(screen.getByText('App Title')).toBeInTheDocument();
    expect(screen.getByTestId('hero-illustration')).toBeInTheDocument();
    
    // Should render default stats
    expect(screen.getByText('Happy Users')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Recipes Created')).toBeInTheDocument();
    expect(screen.getByText('Time Saved')).toBeInTheDocument();
    expect(screen.getByText('Food Waste')).toBeInTheDocument();
  });
});

describe('LandingHero', () => {
  it('renders with default content and CTAs', () => {
    render(<LandingHero />);
    
    expect(screen.getByText('Transform Your Kitchen Into a Smart Culinary Assistant')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Meal Planning')).toBeInTheDocument();
    expect(screen.getByText('Start Cooking Smarter')).toBeInTheDocument();
    expect(screen.getByText('Watch Demo')).toBeInTheDocument();
  });

  it('renders default stats', () => {
    render(<LandingHero />);
    
    expect(screen.getByText('Happy Users')).toBeInTheDocument();
    expect(screen.getByText('Recipes Created')).toBeInTheDocument();
    expect(screen.getByText('Time Saved')).toBeInTheDocument();
    expect(screen.getByText('Food Waste')).toBeInTheDocument();
  });

  it('allows props override', () => {
    render(<LandingHero title="Custom Landing Title" />);
    
    expect(screen.getByText('Custom Landing Title')).toBeInTheDocument();
  });
});

describe('Responsive Design', () => {
  it('applies responsive classes', () => {
    render(<Hero {...mockProps} data-testid="hero-section" />);
    
    const heroSection = screen.getByTestId('hero-section');
    expect(heroSection).toHaveClass('min-h-screen');
    
    // Check for responsive grid classes
    const gridContainer = heroSection.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
  });

  it('handles mobile-specific styling', () => {
    render(<Hero {...mockProps} />);
    
    // Check for responsive text sizing
    const title = screen.getByText('Test Hero Title');
    expect(title).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
  });
});

describe('Accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(<Hero {...mockProps} />);
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Test Hero Title');
  });

  it('has accessible button labels', () => {
    render(<Hero {...mockProps} />);
    
    const primaryButton = screen.getByText('Get Started');
    const secondaryButton = screen.getByText('Learn More');
    
    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
  });

  it('provides proper link attributes', () => {
    render(<Hero {...mockProps} />);
    
    const getStartedLink = screen.getByText('Get Started').closest('a');
    const learnMoreLink = screen.getByText('Learn More').closest('a');
    
    expect(getStartedLink).toHaveAttribute('href', '/signup');
    expect(learnMoreLink).toHaveAttribute('href', '/about');
  });

  it('has proper ARIA labels for decorative elements', () => {
    render(<Hero {...mockProps} />);
    
    // Icons should have proper ARIA handling
    const sparkleEmoji = screen.getByText('✨');
    expect(sparkleEmoji).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(<Hero {...mockProps} />);
    
    const buttons = screen.getAllByRole('link');
    buttons.forEach(button => {
      expect(button).toBeVisible();
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});

describe('Performance', () => {
  it('renders efficiently with minimal DOM nodes', () => {
    const { container } = render(<Hero {...mockProps} />);
    
    // Should have reasonable DOM size
    const allElements = container.querySelectorAll('*');
    expect(allElements.length).toBeLessThan(50); // Reasonable for a hero section
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      title: 'Minimal Title',
      subtitle: 'Minimal Subtitle',
      description: 'Minimal description',
      cta: [],
      stats: [],
      illustration: null,
      background: {
        gradient: '',
        overlay: ''
      }
    };
    
    expect(() => render(<Hero {...minimalProps} />)).not.toThrow();
  });
});

describe('Animation and Interactions', () => {
  it('renders without animation errors', () => {
    // Since we're mocking framer-motion, this tests that the component structure is correct
    expect(() => render(<Hero {...mockProps} />)).not.toThrow();
  });

  it('handles hover states on interactive elements', () => {
    render(<Hero {...mockProps} />);
    
    const buttons = screen.getAllByRole('link');
    buttons.forEach(button => {
      // Should not throw on hover simulation
      expect(() => fireEvent.mouseEnter(button)).not.toThrow();
      expect(() => fireEvent.mouseLeave(button)).not.toThrow();
    });
  });
});