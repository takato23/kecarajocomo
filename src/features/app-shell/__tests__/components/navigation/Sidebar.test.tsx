import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Sidebar, CollapsibleSidebar } from '../../../components/navigation/Sidebar';
import { mockRoutes } from '../../setup';

describe('Sidebar Component', () => {
  const defaultProps = {
    routes: mockRoutes,
    isOpen: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/app',
      },
      writable: true,
    });
  });

  describe('Rendering', () => {
    it('renders sidebar with all routes', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
      expect(screen.getByText('Recipes')).toBeInTheDocument();
    });

    it('shows navigation header', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('KeCaraJoComer')).toBeInTheDocument();
    });

    it('renders mobile variant with overlay', () => {
      render(<Sidebar {...defaultProps} variant="mobile" />);
      
      const overlay = screen.getByRole('navigation').parentElement?.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeTruthy();
    });

    it('renders desktop variant without overlay', () => {
      render(<Sidebar {...defaultProps} variant="desktop" />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('lg:static');
    });
  });

  describe('Route Navigation', () => {
    it('highlights active route', () => {
      // Set current path to recipes
      Object.defineProperty(window, 'location', {
        value: { pathname: '/app/recipes' },
        writable: true,
      });

      render(<Sidebar {...defaultProps} />);
      
      const recipesLink = screen.getByRole('link', { name: /recipes/i });
      expect(recipesLink).toHaveClass('from-lime-500/20', 'to-purple-500/20');
    });

    it('handles route clicks', () => {
      render(<Sidebar {...defaultProps} />);
      
      const plannerLink = screen.getByRole('link', { name: /meal planner/i });
      fireEvent.click(plannerLink);
      
      // Link should navigate (href attribute)
      expect(plannerLink).toHaveAttribute('href', '/app/planner');
    });

    it('displays route badges when present', () => {
      const routesWithBadges = [
        ...mockRoutes,
        {
          id: 'notifications',
          path: '/app/notifications',
          name: 'Notifications',
          icon: <div data-testid="notif-icon">Notifications</div>,
          badge: 5,
        },
      ];

      render(<Sidebar {...defaultProps} routes={routesWithBadges} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('handles large badge numbers', () => {
      const routesWithLargeBadge = [
        ...mockRoutes,
        {
          id: 'notifications',
          path: '/app/notifications',
          name: 'Notifications',
          icon: <div data-testid="notif-icon">Notifications</div>,
          badge: 150,
        },
      ];

      render(<Sidebar {...defaultProps} routes={routesWithLargeBadge} />);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Nested Routes', () => {
    it('renders nested routes', () => {
      const routesWithChildren = [
        {
          id: 'recipes',
          path: '/app/recipes',
          name: 'Recipes',
          icon: <div data-testid="recipes-icon">Recipes</div>,
          children: [
            {
              id: 'my-recipes',
              path: '/app/recipes/my-recipes',
              name: 'My Recipes',
              icon: <div data-testid="my-recipes-icon">My Recipes</div>,
            },
            {
              id: 'favorites',
              path: '/app/recipes/favorites',
              name: 'Favorites',
              icon: <div data-testid="favorites-icon">Favorites</div>,
            },
          ],
        },
      ];

      render(<Sidebar {...defaultProps} routes={routesWithChildren} />);
      
      const recipesLink = screen.getByRole('link', { name: /recipes/i });
      fireEvent.click(recipesLink);
      
      expect(screen.getByText('My Recipes')).toBeInTheDocument();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });

    it('toggles nested route groups', () => {
      const routesWithChildren = [
        {
          id: 'recipes',
          path: '/app/recipes',
          name: 'Recipes',
          icon: <div data-testid="recipes-icon">Recipes</div>,
          children: [
            {
              id: 'my-recipes',
              path: '/app/recipes/my-recipes',
              name: 'My Recipes',
              icon: <div data-testid="my-recipes-icon">My Recipes</div>,
            },
          ],
        },
      ];

      render(<Sidebar {...defaultProps} routes={routesWithChildren} />);
      
      const recipesLink = screen.getByRole('link', { name: /recipes/i });
      
      // Should not show children initially
      expect(screen.queryByText('My Recipes')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(recipesLink);
      expect(screen.getByText('My Recipes')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(recipesLink);
      expect(screen.queryByText('My Recipes')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles sidebar toggle', () => {
      render(<Sidebar {...defaultProps} variant="mobile" />);
      
      const closeButton = screen.getByRole('button', { name: /close navigation/i });
      fireEvent.click(closeButton);
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape key in mobile variant', () => {
      render(<Sidebar {...defaultProps} variant="mobile" />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape in desktop variant', () => {
      render(<Sidebar {...defaultProps} variant="desktop" />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onToggle).not.toHaveBeenCalled();
    });

    it('closes on overlay click in mobile variant', () => {
      render(<Sidebar {...defaultProps} variant="mobile" />);
      
      const overlay = document.querySelector('[aria-hidden="true"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Sidebar {...defaultProps} />);
      
      const navigation = screen.getByRole('navigation', { name: /main navigation/i });
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');
      
      const closeButton = screen.queryByRole('button', { name: /close navigation/i });
      if (closeButton) {
        expect(closeButton).toHaveAttribute('aria-label');
      }
    });

    it('supports keyboard navigation', () => {
      render(<Sidebar {...defaultProps} />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('provides proper focus management', () => {
      render(<Sidebar {...defaultProps} />);
      
      const firstLink = screen.getAllByRole('link')[0];
      firstLink.focus();
      
      // Should be able to tab through all links
      fireEvent.keyDown(firstLink, { key: 'Tab' });
    });
  });
});

describe('CollapsibleSidebar Component', () => {
  const defaultProps = {
    routes: mockRoutes,
    isOpen: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders in expanded state by default', () => {
      render(<CollapsibleSidebar {...defaultProps} />);
      
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders in collapsed state', () => {
      render(<CollapsibleSidebar {...defaultProps} collapsed={true} />);
      
      // Should not show text labels when collapsed
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
      
      // But should show icons
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    });

    it('shows tooltips when collapsed', () => {
      render(<CollapsibleSidebar {...defaultProps} collapsed={true} />);
      
      const homeLink = screen.getByRole('link', { name: /dashboard/i });
      expect(homeLink).toHaveAttribute('title', 'Dashboard');
    });
  });

  describe('Interactions', () => {
    it('toggles collapse state', () => {
      render(<CollapsibleSidebar {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleButton);
      
      // Check if aria-label changed
      expect(toggleButton).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('handles route navigation in collapsed state', () => {
      render(<CollapsibleSidebar {...defaultProps} collapsed={true} />);
      
      const homeLink = screen.getByRole('link', { name: /dashboard/i });
      expect(homeLink).toHaveAttribute('href', '/app');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for toggle button', () => {
      const { rerender } = render(<CollapsibleSidebar {...defaultProps} collapsed={false} />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');
      
      rerender(<CollapsibleSidebar {...defaultProps} collapsed={true} />);
      expect(toggleButton).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('maintains navigation accessibility when collapsed', () => {
      render(<CollapsibleSidebar {...defaultProps} collapsed={true} />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});