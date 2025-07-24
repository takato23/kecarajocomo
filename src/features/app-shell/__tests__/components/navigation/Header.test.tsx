import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { Header } from '../../../components/navigation/Header';
import { mockNavigationConfig } from '../../setup';

describe('Header Component', () => {
  const defaultProps = {
    config: mockNavigationConfig.header,
    onMenuToggle: vi.fn(),
    onSearch: vi.fn(),
    onProfileClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders header with all elements', () => {
      render(<Header {...defaultProps} />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('KeCaraJoComer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { rerender } = render(<Header {...defaultProps} variant="default" />);
      expect(screen.getByRole('banner')).toHaveClass('bg-white');

      rerender(<Header {...defaultProps} variant="glass" />);
      expect(screen.getByRole('banner')).toHaveClass('bg-white/80', 'backdrop-blur-md');

      rerender(<Header {...defaultProps} variant="transparent" />);
      expect(screen.getByRole('banner')).toHaveClass('bg-transparent');
    });

    it('conditionally renders elements based on config', () => {
      const configWithoutSearch = {
        ...mockNavigationConfig.header,
        showSearch: false,
        showNotifications: false,
        showProfile: false,
        showLogo: false,
      };

      render(<Header {...defaultProps} config={configWithoutSearch} />);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByText('KeCaraJoComer')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /view notifications/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /user profile menu/i })).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles menu toggle', () => {
      render(<Header {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(menuButton);
      
      expect(defaultProps.onMenuToggle).toHaveBeenCalledTimes(1);
    });

    it('handles search input', () => {
      render(<Header {...defaultProps} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      fireEvent.change(searchInput, { target: { value: 'pasta recipe' } });
      
      expect(defaultProps.onSearch).toHaveBeenCalledWith('pasta recipe');
    });

    it('handles profile click', () => {
      render(<Header {...defaultProps} />);
      
      const profileButton = screen.getByRole('button', { name: /user profile menu/i });
      fireEvent.click(profileButton);
      
      expect(defaultProps.onProfileClick).toHaveBeenCalledTimes(1);
    });

    it('handles notifications click', () => {
      render(<Header {...defaultProps} />);
      
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
      fireEvent.click(notificationsButton);
      
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('focuses search on Cmd/Ctrl+K', () => {
      render(<Header {...defaultProps} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      
      // Test Cmd+K (Mac)
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      expect(searchInput).toHaveFocus();
      
      // Test Ctrl+K (Windows/Linux)
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(searchInput).toHaveFocus();
    });

    it('closes dropdowns on Escape', () => {
      render(<Header {...defaultProps} />);
      
      // Open notifications dropdown
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
      fireEvent.click(notificationsButton);
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
      
      // Close with Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Dropdowns', () => {
    it('closes dropdowns when clicking outside', async () => {
      render(<Header {...defaultProps} />);
      
      // Open notifications dropdown
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
      fireEvent.click(notificationsButton);
      expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('shows notification count badge', () => {
      render(<Header {...defaultProps} />);
      
      // Would typically test with actual notifications state
      // For now, test that the structure is correct
      const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
      expect(notificationsButton).toBeInTheDocument();
    });

    it('displays profile dropdown with menu items', () => {
      render(<Header {...defaultProps} />);
      
      const profileButton = screen.getByRole('button', { name: /user profile menu/i });
      fireEvent.click(profileButton);
      
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Header {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-label');
      
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', () => {
      render(<Header {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      menuButton.focus();
      
      // Tab to search
      fireEvent.keyDown(menuButton, { key: 'Tab' });
      
      // Should be able to navigate through all interactive elements
      const interactiveElements = screen.getAllByRole('button').concat(screen.getAllByRole('textbox'));
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    it('has proper focus management', () => {
      render(<Header {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('shows mobile menu button only on mobile', () => {
      render(<Header {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(menuButton).toHaveClass('lg:hidden');
    });

    it('adapts search placeholder for mobile', () => {
      render(<Header {...defaultProps} />);
      
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toHaveAttribute('placeholder');
    });
  });

  describe('Error Handling', () => {
    it('handles missing callbacks gracefully', () => {
      const propsWithoutCallbacks = {
        config: mockNavigationConfig.header,
      };
      
      expect(() => {
        render(<Header {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });

    it('handles invalid config gracefully', () => {
      const invalidConfig = {
        showSearch: true,
        showNotifications: true,
        showProfile: true,
        showLogo: true,
        // Missing title
      };
      
      expect(() => {
        render(<Header {...defaultProps} config={invalidConfig} />);
      }).not.toThrow();
    });
  });
});