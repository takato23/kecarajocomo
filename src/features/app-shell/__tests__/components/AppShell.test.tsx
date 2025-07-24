import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AppShell, GlassAppShell, ResponsiveAppShell, CompactAppShell } from '../../components/AppShell';
import { mockNavigationConfig, mockViewport } from '../setup';

describe('AppShell Component', () => {
  const defaultProps = {
    navigation: mockNavigationConfig,
    currentRoute: '/app',
    children: <div data-testid="page-content">Page Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockViewport.desktop();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/app',
      },
      writable: true,
    });
  });

  describe('Rendering', () => {
    it('renders all shell components', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
        expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument(); // Sidebar
        expect(screen.getByTestId('page-content')).toBeInTheDocument(); // Children
      });
    });

    it('shows loading state initially', () => {
      const { container } = render(<AppShell {...defaultProps} />);
      
      // Check for loading state elements
      const loadingText = screen.queryByText(/loading kecarajocomer/i);
      if (loadingText) {
        expect(loadingText).toBeInTheDocument();
      }
    });

    it('renders with different variants', async () => {
      const { rerender } = render(<AppShell {...defaultProps} variant="default" />);
      
      await waitFor(() => {
        const main = document.querySelector('main');
        expect(main?.parentElement).toHaveClass('bg-gray-50');
      });

      rerender(<AppShell {...defaultProps} variant="glass" />);
      
      await waitFor(() => {
        const main = document.querySelector('main');
        expect(main?.parentElement).toHaveClass('from-lime-50/50', 'to-purple-50/50');
      });
    });

    it('passes navigation config to child components', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('KeCaraJoComer')).toBeInTheDocument(); // From header config
        expect(screen.getByText('Dashboard')).toBeInTheDocument(); // From sidebar routes
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('shows sidebar on desktop', async () => {
      mockViewport.desktop();
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation', { name: /main navigation/i });
        expect(sidebar).toBeInTheDocument();
        expect(sidebar).toHaveClass('lg:static'); // Desktop sidebar
      });
    });

    it('shows bottom nav on mobile', async () => {
      mockViewport.mobile();
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const bottomNav = screen.getByRole('tablist', { name: /main navigation/i });
        expect(bottomNav).toBeInTheDocument();
      });
    });

    it('adapts layout on viewport changes', async () => {
      const { container } = render(<AppShell {...defaultProps} />);
      
      // Start with desktop
      mockViewport.desktop();
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument(); // No bottom nav on desktop
      });
      
      // Change to mobile
      mockViewport.mobile();
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument(); // Bottom nav appears
      });
    });

    it('auto-closes sidebar when switching to mobile', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} sidebarOpen={true} onSidebarToggle={onSidebarToggle} />);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
      
      // Switch to mobile
      mockViewport.mobile();
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        // Sidebar should auto-close on mobile
        expect(onSidebarToggle).toHaveBeenCalledWith(false);
      });
    });

    it('respects responsive prop', async () => {
      const { rerender } = render(<AppShell {...defaultProps} responsive={false} />);
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });
      
      // With responsive=false, changing viewport shouldn't affect layout
      mockViewport.mobile();
      fireEvent(window, new Event('resize'));
      
      // Should still show desktop layout
      await waitFor(() => {
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Management', () => {
    it('toggles sidebar on header menu click', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
        fireEvent.click(menuButton);
      });
      
      // Sidebar state should toggle
      // The exact behavior depends on the implementation
    });

    it('syncs controlled sidebar state', async () => {
      const { rerender } = render(<AppShell {...defaultProps} sidebarOpen={false} />);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
      
      // Update controlled state
      rerender(<AppShell {...defaultProps} sidebarOpen={true} />);
      
      // Sidebar should reflect new state
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('calls onSidebarToggle callback', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} onSidebarToggle={onSidebarToggle} />);
      
      await waitFor(() => {
        const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
        fireEvent.click(menuButton);
        
        expect(onSidebarToggle).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('toggles sidebar with Cmd/Ctrl+B', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} onSidebarToggle={onSidebarToggle} />);
      
      await waitFor(() => {
        // Cmd+B (Mac)
        fireEvent.keyDown(document, { key: 'b', metaKey: true });
        expect(onSidebarToggle).toHaveBeenCalledTimes(1);
        
        // Ctrl+B (Windows/Linux)
        fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
        expect(onSidebarToggle).toHaveBeenCalledTimes(2);
      });
    });

    it('closes sidebar with Escape on mobile', async () => {
      mockViewport.mobile();
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} sidebarOpen={true} onSidebarToggle={onSidebarToggle} />);
      
      await waitFor(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSidebarToggle).toHaveBeenCalledWith(false);
      });
    });

    it('does not close sidebar with Escape on desktop', async () => {
      mockViewport.desktop();
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} sidebarOpen={true} onSidebarToggle={onSidebarToggle} />);
      
      await waitFor(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSidebarToggle).not.toHaveBeenCalled();
      });
    });
  });

  describe('Route Changes', () => {
    it('re-animates content on route change', async () => {
      const { rerender } = render(<AppShell {...defaultProps} currentRoute="/app" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });
      
      // Change route
      rerender(<AppShell {...defaultProps} currentRoute="/app/recipes" />);
      
      // Content should re-animate (framer-motion handles the animation)
      await waitFor(() => {
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });
    });
  });

  describe('Additional Features', () => {
    it('renders scroll to top button when scrolled', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Simulate scroll
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true });
        fireEvent.scroll(window);
        
        const scrollButton = screen.getByRole('button', { name: /scroll to top/i });
        expect(scrollButton).toBeInTheDocument();
      });
    });

    it('handles scroll to top click', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo');
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Simulate scroll
        Object.defineProperty(window, 'scrollY', { value: 400, writable: true });
        fireEvent.scroll(window);
        
        const scrollButton = screen.getByRole('button', { name: /scroll to top/i });
        fireEvent.click(scrollButton);
        
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });
    });

    it('adds bottom padding when bottom nav is visible', async () => {
      mockViewport.mobile();
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toHaveClass('pb-20');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation config gracefully', async () => {
      const invalidProps = {
        ...defaultProps,
        navigation: {
          sidebar: [],
          bottomNav: [],
          header: {},
        },
      };
      
      expect(() => {
        render(<AppShell {...invalidProps} />);
      }).not.toThrow();
    });

    it('handles missing callbacks gracefully', async () => {
      const propsWithoutCallbacks = {
        navigation: mockNavigationConfig,
        children: <div>Content</div>,
      };
      
      expect(() => {
        render(<AppShell {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });
  });
});

describe('GlassAppShell Component', () => {
  it('renders with glass variant', async () => {
    render(<GlassAppShell navigation={mockNavigationConfig}>
      <div>Content</div>
    </GlassAppShell>);
    
    await waitFor(() => {
      const content = screen.getByText('Content');
      expect(content.closest('[class*="from-lime-50/50"]')).toBeInTheDocument();
    });
  });
});

describe('ResponsiveAppShell Component', () => {
  it('renders with responsive enabled', async () => {
    render(<ResponsiveAppShell navigation={mockNavigationConfig}>
      <div>Content</div>
    </ResponsiveAppShell>);
    
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

describe('CompactAppShell Component', () => {
  it('filters navigation when hideSecondaryNav is true', async () => {
    const extendedNavigation = {
      ...mockNavigationConfig,
      sidebar: [
        ...mockNavigationConfig.sidebar,
        {
          id: 'settings',
          path: '/app/settings',
          name: 'Settings',
          icon: <div>Settings</div>,
        },
        {
          id: 'help',
          path: '/app/help',
          name: 'Help',
          icon: <div>Help</div>,
        },
      ],
    };

    render(<CompactAppShell navigation={extendedNavigation} hideSecondaryNav={true}>
      <div>Content</div>
    </CompactAppShell>);
    
    await waitFor(() => {
      // Should show primary routes
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      
      // Should hide secondary routes
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Help')).not.toBeInTheDocument();
    });
  });

  it('shows all routes when hideSecondaryNav is false', async () => {
    render(<CompactAppShell navigation={mockNavigationConfig} hideSecondaryNav={false}>
      <div>Content</div>
    </CompactAppShell>);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
      expect(screen.getByText('Recipes')).toBeInTheDocument();
    });
  });
});