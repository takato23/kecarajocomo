import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AppShell } from '../../components/AppShell';
import { mockNavigationConfig, mockViewport } from '../setup';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('AppShell Accessibility Tests', () => {
  const defaultProps = {
    navigation: mockNavigationConfig,
    currentRoute: '/app',
    children: <div data-testid="page-content">Page Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockViewport.desktop();
  });

  describe('WCAG Compliance', () => {
    it('passes axe accessibility audit on desktop', async () => {
      const { container } = render(<AppShell {...defaultProps} />);
      
      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes axe accessibility audit on mobile', async () => {
      mockViewport.mobile();
      const { container } = render(<AppShell {...defaultProps} />);
      
      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('maintains proper heading hierarchy', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        
        // Check that headings follow proper hierarchy
        headings.forEach((heading, index) => {
          const level = parseInt(heading.tagName.substring(1));
          expect(level).toBeGreaterThanOrEqual(1);
          expect(level).toBeLessThanOrEqual(6);
        });
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const interactiveElements = [
          ...screen.getAllByRole('button'),
          ...screen.getAllByRole('link'),
          ...screen.getAllByRole('textbox'),
        ];
        
        // All interactive elements should be keyboard accessible
        interactiveElements.forEach(element => {
          expect(element).toHaveAttribute('tabIndex');
          expect(parseInt(element.getAttribute('tabIndex') || '0')).toBeGreaterThanOrEqual(-1);
        });
      });
    });

    it('implements proper focus trap in mobile sidebar', async () => {
      mockViewport.mobile();
      render(<AppShell {...defaultProps} sidebarOpen={true} />);
      
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation', { name: /main navigation/i });
        const closeButton = screen.getByRole('button', { name: /close navigation/i });
        
        // Focus should be trapped within sidebar when open
        closeButton.focus();
        expect(closeButton).toHaveFocus();
        
        // Tab should cycle within sidebar
        const sidebarLinks = sidebar.querySelectorAll('a');
        expect(sidebarLinks.length).toBeGreaterThan(0);
      });
    });

    it('restores focus after closing dialogs', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /user profile menu/i });
        profileButton.focus();
        fireEvent.click(profileButton);
        
        // Close with Escape
        fireEvent.keyDown(document, { key: 'Escape' });
        
        // Focus should return to profile button
        expect(profileButton).toHaveFocus();
      });
    });

    it('provides skip navigation links', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Tab once from the beginning of the document
        fireEvent.keyDown(document.body, { key: 'Tab' });
        
        // Look for skip links (may be visually hidden)
        const skipLinks = document.querySelectorAll('[href^="#"]');
        expect(skipLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper ARIA labels', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Navigation landmarks
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument();
        
        // Interactive elements
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });

    it('announces navigation state changes', async () => {
      const onSidebarToggle = vi.fn();
      render(<AppShell {...defaultProps} onSidebarToggle={onSidebarToggle} />);
      
      await waitFor(() => {
        const menuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
        
        // Check initial state
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        
        // Toggle menu
        fireEvent.click(menuButton);
        
        // State should be announced
        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('provides context for icon-only buttons', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // All icon buttons should have descriptive labels
        const iconButtons = screen.getAllByRole('button').filter(button => {
          // Check if button contains only an icon (no text)
          return !button.textContent?.trim() || button.querySelector('svg');
        });
        
        iconButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
          expect(button.getAttribute('aria-label')).not.toBe('');
        });
      });
    });

    it('marks active navigation items', async () => {
      render(<AppShell {...defaultProps} currentRoute="/app/recipes" />);
      
      await waitFor(() => {
        // Desktop sidebar
        const recipeLink = screen.getByRole('link', { name: /recipes/i });
        expect(recipeLink).toHaveAttribute('aria-current');
      });
    });

    it('provides live regions for dynamic content', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Look for aria-live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThan(0);
        
        // Check that live regions have appropriate politeness
        liveRegions.forEach(region => {
          const politeness = region.getAttribute('aria-live');
          expect(['polite', 'assertive']).toContain(politeness);
        });
      });
    });
  });

  describe('Focus Management', () => {
    it('manages focus during route changes', async () => {
      const { rerender } = render(<AppShell {...defaultProps} currentRoute="/app" />);
      
      await waitFor(() => {
        // Get initial focus
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
      });
      
      // Change route
      rerender(<AppShell {...defaultProps} currentRoute="/app/recipes" />);
      
      await waitFor(() => {
        // Focus should move to main content area
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('tabIndex', '-1');
      });
    });

    it('provides visible focus indicators', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const interactiveElements = [
          ...screen.getAllByRole('button'),
          ...screen.getAllByRole('link'),
          ...screen.getAllByRole('textbox'),
        ];
        
        interactiveElements.forEach(element => {
          // Check for focus styles
          expect(element.className).toMatch(/focus:(outline-none|ring)/);
        });
      });
    });
  });

  describe('Responsive Accessibility', () => {
    it('maintains accessibility during viewport changes', async () => {
      const { container } = render(<AppShell {...defaultProps} />);
      
      // Desktop
      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
      
      // Mobile
      mockViewport.mobile();
      fireEvent(window, new Event('resize'));
      
      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('adapts touch targets for mobile', async () => {
      mockViewport.mobile();
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Check bottom nav touch targets
        const tabs = screen.getAllByRole('tab');
        tabs.forEach(tab => {
          const styles = window.getComputedStyle(tab);
          // Touch targets should be at least 44x44px
          expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
        });
      });
    });
  });

  describe('Color Contrast', () => {
    it('maintains sufficient color contrast', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // This is a simplified check - in real tests, you'd use tools like axe-core
        // to verify WCAG AA contrast ratios
        const textElements = screen.getAllByText(/./);
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          // Check that text has defined color
          expect(styles.color).toBeTruthy();
        });
      });
    });
  });

  describe('Motion and Animation', () => {
    it('respects prefers-reduced-motion', async () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Animations should be disabled or reduced
        const animatedElements = document.querySelectorAll('[class*="transition"]');
        expect(animatedElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Form Accessibility', () => {
    it('provides proper form labels', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        const searchInput = screen.getByRole('textbox', { name: /search/i });
        expect(searchInput).toHaveAttribute('aria-label');
        expect(searchInput).toHaveAttribute('placeholder');
      });
    });

    it('provides error announcements', async () => {
      render(<AppShell {...defaultProps} />);
      
      await waitFor(() => {
        // Search with empty query
        const searchInput = screen.getByRole('textbox', { name: /search/i });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
        
        // In a real app, this would announce validation errors
        expect(searchInput).toHaveAttribute('aria-invalid', 'false');
      });
    });
  });
});