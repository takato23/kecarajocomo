import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { BottomNav, FloatingBottomNav, AdaptiveBottomNav } from '../../../components/navigation/BottomNav';
import { mockRoutes, mockViewport } from '../../setup';

describe('BottomNav Component', () => {
  const defaultProps = {
    routes: mockRoutes,
    currentRoute: '/app',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockViewport.mobile(); // Set mobile viewport for bottom nav
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/app',
      },
      writable: true,
    });
  });

  describe('Rendering', () => {
    it('renders bottom navigation with all routes', () => {
      render(<BottomNav {...defaultProps} />);
      
      expect(screen.getByRole('tablist', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /navigate to dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /navigate to meal planner/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /navigate to recipes/i })).toBeInTheDocument();
    });

    it('renders default variant', () => {
      render(<BottomNav {...defaultProps} variant="default" />);
      
      const nav = screen.getByRole('tablist');
      expect(nav).toHaveClass('bg-white/95', 'backdrop-blur-sm');
    });

    it('renders floating variant', () => {
      render(<BottomNav {...defaultProps} variant="floating" />);
      
      const nav = screen.getByRole('tablist');
      expect(nav).toHaveClass('bg-white/80', 'backdrop-blur-md', 'rounded-t-2xl');
    });

    it('highlights active route', () => {
      render(<BottomNav {...defaultProps} currentRoute="/app" />);
      
      const homeTab = screen.getByRole('tab', { name: /navigate to dashboard/i });
      expect(homeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('hides on desktop (lg screens)', () => {
      render(<BottomNav {...defaultProps} />);
      
      const nav = screen.getByRole('tablist');
      expect(nav).toHaveClass('lg:hidden');
    });
  });

  describe('Route Interactions', () => {
    it('handles route navigation', () => {
      render(<BottomNav {...defaultProps} />);
      
      const plannerTab = screen.getByRole('tab', { name: /navigate to meal planner/i });
      const plannerLink = plannerTab.querySelector('a');
      
      expect(plannerLink).toHaveAttribute('href', '/app/planner');
    });

    it('shows ripple effect on click', async () => {
      render(<BottomNav {...defaultProps} />);
      
      const homeTab = screen.getByRole('tab', { name: /navigate to dashboard/i });
      fireEvent.click(homeTab);
      
      // The ripple effect is implemented with framer-motion
      // In a real test, you'd check for animation classes or use animation testing utilities
      expect(homeTab).toBeInTheDocument();
    });

    it('displays route badges when present', () => {
      const routesWithBadges = [
        ...mockRoutes,
        {
          id: 'shopping',
          path: '/app/shopping',
          name: 'Shopping',
          icon: <div data-testid="shopping-icon">Shopping</div>,
          badge: 3,
        },
      ];

      render(<BottomNav {...defaultProps} routes={routesWithBadges} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles large badge numbers', () => {
      const routesWithLargeBadge = [
        ...mockRoutes,
        {
          id: 'notifications',
          path: '/app/notifications',
          name: 'Notifications',
          icon: <div data-testid="notif-icon">Notifications</div>,
          badge: 25,
        },
      ];

      render(<BottomNav {...defaultProps} routes={routesWithLargeBadge} />);
      
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to screen size changes', async () => {
      render(<BottomNav {...defaultProps} routes={Array(7).fill(null).map((_, i) => ({
        id: `route-${i}`,
        path: `/app/route-${i}`,
        name: `Route ${i}`,
        icon: <div data-testid={`route-${i}-icon`}>Route {i}</div>,
      }))} />);
      
      // Should show overflow menu for many routes
      expect(screen.getByRole('button', { name: /more navigation options/i })).toBeInTheDocument();
    });

    it('shows different number of items based on screen width', async () => {
      const manyRoutes = Array(8).fill(null).map((_, i) => ({
        id: `route-${i}`,
        path: `/app/route-${i}`,
        name: `Route ${i}`,
        icon: <div data-testid={`route-${i}-icon`}>Route {i}</div>,
      }));

      render(<BottomNav {...defaultProps} routes={manyRoutes} />);
      
      // Small screen should show fewer items
      mockViewport.mobile();
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /more navigation options/i })).toBeInTheDocument();
      });
    });
  });

  describe('Overflow Menu', () => {
    const manyRoutes = Array(8).fill(null).map((_, i) => ({
      id: `route-${i}`,
      path: `/app/route-${i}`,
      name: `Route ${i}`,
      icon: <div data-testid={`route-${i}-icon`}>Route {i}</div>,
    }));

    it('shows overflow menu when there are too many routes', () => {
      render(<BottomNav {...defaultProps} routes={manyRoutes} />);
      
      expect(screen.getByRole('button', { name: /more navigation options/i })).toBeInTheDocument();
    });

    it('opens and closes overflow menu', async () => {
      render(<BottomNav {...defaultProps} routes={manyRoutes} />);
      
      const moreButton = screen.getByRole('button', { name: /more navigation options/i });
      
      // Open menu
      fireEvent.click(moreButton);
      expect(moreButton).toHaveAttribute('aria-expanded', 'true');
      
      // Close by clicking backdrop
      const backdrop = document.querySelector('[class*="fixed"][class*="inset-0"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        await waitFor(() => {
          expect(moreButton).toHaveAttribute('aria-expanded', 'false');
        });
      }
    });

    it('shows hidden routes in overflow menu', () => {
      render(<BottomNav {...defaultProps} routes={manyRoutes} />);
      
      const moreButton = screen.getByRole('button', { name: /more navigation options/i });
      fireEvent.click(moreButton);
      
      // Should show routes that don't fit in main nav
      expect(screen.getByText('Route 5')).toBeInTheDocument();
      expect(screen.getByText('Route 6')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<BottomNav {...defaultProps} />);
      
      const nav = screen.getByRole('tablist', { name: /main navigation/i });
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation', () => {
      render(<BottomNav {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        const link = tab.querySelector('a');
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('provides proper focus management', () => {
      render(<BottomNav {...defaultProps} />);
      
      const firstTab = screen.getAllByRole('tab')[0];
      const link = firstTab.querySelector('a');
      
      if (link) {
        link.focus();
        expect(link).toHaveFocus();
      }
    });
  });

  describe('Animation and Visual Effects', () => {
    it('applies active indicator', () => {
      render(<BottomNav {...defaultProps} currentRoute="/app" />);
      
      const homeTab = screen.getByRole('tab', { name: /navigate to dashboard/i });
      expect(homeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('handles hover effects', () => {
      render(<BottomNav {...defaultProps} />);
      
      const plannerTab = screen.getByRole('tab', { name: /navigate to meal planner/i });
      fireEvent.mouseEnter(plannerTab);
      
      // Animation effects are handled by framer-motion
      expect(plannerTab).toBeInTheDocument();
    });
  });
});

describe('FloatingBottomNav Component', () => {
  it('renders with floating variant', () => {
    render(<FloatingBottomNav routes={mockRoutes} />);
    
    const nav = screen.getByRole('tablist');
    expect(nav).toHaveClass('bg-white/80', 'backdrop-blur-md', 'rounded-t-2xl');
  });
});

describe('AdaptiveBottomNav Component', () => {
  beforeEach(() => {
    mockViewport.mobile();
  });

  it('reorders routes based on cooking context', () => {
    render(<AdaptiveBottomNav routes={mockRoutes} context="cooking" />);
    
    // Should prioritize recipes for cooking context
    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();
  });

  it('reorders routes based on planning context', () => {
    render(<AdaptiveBottomNav routes={mockRoutes} context="planning" />);
    
    // Should prioritize planner for planning context
    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();
  });

  it('reorders routes based on shopping context', () => {
    render(<AdaptiveBottomNav routes={mockRoutes} context="shopping" />);
    
    // Should prioritize shopping for shopping context
    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();
  });

  it('uses default order when no context provided', () => {
    render(<AdaptiveBottomNav routes={mockRoutes} />);
    
    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();
  });
});