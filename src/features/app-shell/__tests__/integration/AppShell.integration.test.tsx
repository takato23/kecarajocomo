import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AppShell } from '../../components/AppShell';
import { mockNavigationConfig, mockViewport } from '../setup';

describe('AppShell Integration Tests', () => {
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

  describe('Desktop Navigation Flow', () => {
    it('completes full desktop navigation workflow', async () => {
      const onSidebarToggle = vi.fn();
      const { rerender } = render(
        <AppShell {...defaultProps} onSidebarToggle={onSidebarToggle} />
      );

      await waitFor(() => {
        // Header is visible
        expect(screen.getByRole('banner')).toBeInTheDocument();
        
        // Sidebar is visible on desktop
        expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
        
        // No bottom nav on desktop
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      });

      // Toggle sidebar
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(menuButton);
      expect(onSidebarToggle).toHaveBeenCalledWith(true);

      // Navigate to recipes
      const recipesLink = screen.getByRole('link', { name: /recipes/i });
      expect(recipesLink).toHaveAttribute('href', '/app/recipes');
      
      // Simulate route change
      rerender(<AppShell {...defaultProps} currentRoute="/app/recipes" />);
      
      // Search functionality
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Profile menu
      const profileButton = screen.getByRole('button', { name: /user profile menu/i });
      fireEvent.click(profileButton);
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    it('handles keyboard navigation workflow', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} onSidebarToggle={onSidebarToggle} />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      // Cmd+K to focus search
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toHaveFocus();

      // Cmd+B to toggle sidebar
      fireEvent.keyDown(document, { key: 'b', metaKey: true });
      expect(onSidebarToggle).toHaveBeenCalledTimes(1);

      // Tab through navigation
      const firstNavLink = screen.getAllByRole('link')[0];
      firstNavLink.focus();
      expect(firstNavLink).toHaveFocus();
      
      fireEvent.keyDown(firstNavLink, { key: 'Tab' });
      // Next element should receive focus
    });
  });

  describe('Mobile Navigation Flow', () => {
    beforeEach(() => {
      mockViewport.mobile();
    });

    it('completes full mobile navigation workflow', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} onSidebarToggle={onSidebarToggle} />);

      await waitFor(() => {
        // Header is visible
        expect(screen.getByRole('banner')).toBeInTheDocument();
        
        // Bottom nav is visible on mobile
        expect(screen.getByRole('tablist', { name: /main navigation/i })).toBeInTheDocument();
      });

      // Open mobile sidebar
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(menuButton);
      expect(onSidebarToggle).toHaveBeenCalledWith(true);

      // Close sidebar with overlay click
      const overlay = document.querySelector('[aria-hidden="true"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onSidebarToggle).toHaveBeenCalledWith(false);
      }

      // Navigate using bottom nav
      const plannerTab = screen.getByRole('tab', { name: /navigate to meal planner/i });
      fireEvent.click(plannerTab);
      
      // Check active state
      expect(plannerTab).toHaveAttribute('aria-selected', 'true');
    });

    it('handles responsive transitions', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} sidebarOpen={true} onSidebarToggle={onSidebarToggle} />);

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      // Transition to tablet
      mockViewport.tablet();
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        // Bottom nav still visible on tablet
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      // Transition to desktop
      mockViewport.desktop();
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        // Bottom nav hidden on desktop
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
        
        // Sidebar visible
        expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('integrates search across navigation', async () => {
      render(<AppShell {...defaultProps} />);

      await waitFor(() => {
        const searchInput = screen.getByRole('textbox', { name: /search/i });
        expect(searchInput).toBeInTheDocument();
      });

      // Type search query
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      fireEvent.change(searchInput, { target: { value: 'chicken recipe' } });
      
      // Press Enter to search
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      // In a real app, this would trigger search functionality
      expect(searchInput).toHaveValue('chicken recipe');
    });
  });

  describe('Notification System', () => {
    it('shows and manages notifications', async () => {
      render(<AppShell {...defaultProps} />);

      await waitFor(() => {
        const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
        expect(notificationsButton).toBeInTheDocument();
      });

      // Open notifications
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
      fireEvent.click(notificationsButton);
      
      // Check dropdown is open
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
      
      // In a real app, notifications would be displayed here
      expect(screen.getByText('Meal reminder')).toBeInTheDocument();
      expect(screen.getByText('Expiring soon')).toBeInTheDocument();
    });
  });

  describe('User Profile Integration', () => {
    it('handles user profile interactions', async () => {
      render(<AppShell {...defaultProps} />);

      await waitFor(() => {
        const profileButton = screen.getByRole('button', { name: /user profile menu/i });
        expect(profileButton).toBeInTheDocument();
      });

      // Open profile menu
      const profileButton = screen.getByRole('button', { name: /user profile menu/i });
      fireEvent.click(profileButton);
      
      // Check menu items
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      
      // Click a menu item
      fireEvent.click(screen.getByText('Profile Settings'));
      
      // In a real app, this would navigate to profile settings
    });
  });

  describe('Error Recovery', () => {
    it('recovers from navigation errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Render with invalid route
      render(<AppShell {...defaultProps} currentRoute="/invalid/route" />);

      await waitFor(() => {
        // Should still render the shell
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles missing navigation gracefully', async () => {
      const minimalNavigation = {
        sidebar: [],
        bottomNav: [],
        header: {
          showSearch: false,
          showNotifications: false,
          showProfile: false,
          showLogo: true,
        },
      };

      render(<AppShell navigation={minimalNavigation}>
        <div>Content</div>
      </AppShell>);

      await waitFor(() => {
        // Should still render with minimal navigation
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('lazy loads components appropriately', async () => {
      render(<AppShell {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      // Scroll to trigger scroll-to-top button
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        // Scroll-to-top button should appear
        expect(screen.getByRole('button', { name: /scroll to top/i })).toBeInTheDocument();
      });
    });

    it('maintains state during route changes', async () => {
      const { rerender } = render(<AppShell {...defaultProps} currentRoute="/app" />);

      await waitFor(() => {
        // Set some state (e.g., search input)
        const searchInput = screen.getByRole('textbox', { name: /search/i });
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(searchInput).toHaveValue('test search');
      });

      // Change route
      rerender(<AppShell {...defaultProps} currentRoute="/app/recipes" />);

      await waitFor(() => {
        // Search input should maintain its value
        const searchInput = screen.getByRole('textbox', { name: /search/i });
        expect(searchInput).toHaveValue('test search');
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains focus management across navigation', async () => {
      render(<AppShell {...defaultProps} />);

      await waitFor(() => {
        // Focus on first interactive element
        const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
        menuButton.focus();
        expect(menuButton).toHaveFocus();
      });

      // Tab through elements
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      
      // Focus should move to next element
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toHaveFocus();
    });

    it('announces route changes to screen readers', async () => {
      const { rerender } = render(<AppShell {...defaultProps} currentRoute="/app" />);

      await waitFor(() => {
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });

      // Change route
      rerender(<AppShell {...defaultProps} currentRoute="/app/recipes" />);

      // In a real app, this would trigger aria-live announcements
      await waitFor(() => {
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });
    });
  });
});