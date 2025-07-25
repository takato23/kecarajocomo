import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { LandingPage } from '../../components/LandingPage';

// Mock framer-motion for integration tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    ellipse: ({ children, ...props }: any) => <ellipse {...props}>{children}</ellipse>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useInView: () => [null, true],
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('LandingPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Page Rendering', () => {
    it('renders all major sections', () => {
      render(<LandingPage />);

      // Hero section
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Transforma tu cocina/i)).toBeInTheDocument();

      // Features section
      expect(screen.getByText(/Características principales/i)).toBeInTheDocument();
      expect(screen.getByText(/Escaneo inteligente/i)).toBeInTheDocument();
      expect(screen.getByText(/Planificación personalizada/i)).toBeInTheDocument();

      // Benefits section
      expect(screen.getByText(/Ahorra tiempo/i)).toBeInTheDocument();
      expect(screen.getByText(/Come mejor/i)).toBeInTheDocument();

      // CTA section
      expect(screen.getByText(/¿Listo para comenzar?/i)).toBeInTheDocument();

      // Footer
      expect(screen.getByText(/© 2024 KeCarajoComemos/i)).toBeInTheDocument();
    });

    it('has proper semantic structure', () => {
      const { container } = render(<LandingPage />);

      // Check for proper heading hierarchy
      const h1 = container.querySelector('h1');
      const h2s = container.querySelectorAll('h2');
      const h3s = container.querySelectorAll('h3');

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);

      // Check for semantic sections
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });

  describe('Navigation Flow', () => {
    it('navigates to sign up when clicking hero CTA', async () => {
      render(<LandingPage />);

      const ctaButton = screen.getAllByText(/Comenzar gratis/i)[0];
      fireEvent.click(ctaButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signup');
      });
    });

    it('navigates to login when clicking header login button', async () => {
      render(<LandingPage />);

      const loginButton = screen.getByText(/Iniciar sesión/i);
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('navigates to features section when clicking nav link', () => {
      render(<LandingPage />);

      const featuresLink = screen.getByText(/Características/i);
      fireEvent.click(featuresLink);

      // Check that the features section is visible
      const featuresSection = document.getElementById('features');
      expect(featuresSection).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('opens mobile menu when hamburger is clicked', async () => {
      render(<LandingPage />);

      // Find and click the mobile menu button
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(mobileMenuButton);

      // Check that mobile menu items appear
      await waitFor(() => {
        const mobileNav = screen.getByRole('navigation', { name: /mobile/i });
        expect(within(mobileNav).getByText(/Características/i)).toBeInTheDocument();
        expect(within(mobileNav).getByText(/Cómo funciona/i)).toBeInTheDocument();
      });
    });

    it('closes mobile menu when close button is clicked', async () => {
      render(<LandingPage />);

      // Open menu
      const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(mobileMenuButton);

      // Close menu
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Check that mobile menu is hidden
      await waitFor(() => {
        const mobileNav = screen.queryByRole('navigation', { name: /mobile/i });
        expect(mobileNav).not.toBeInTheDocument();
      });
    });

    it('shows feature details on hover', async () => {
      render(<LandingPage />);

      const scanFeature = screen.getByText(/Escaneo inteligente/i).closest('div');
      
      if (scanFeature) {
        fireEvent.mouseEnter(scanFeature);

        // Check that additional details appear
        await waitFor(() => {
          expect(screen.getByText(/IA que reconoce productos/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Responsive Behavior', () => {
    it('shows appropriate elements for mobile viewport', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<LandingPage />);

      // Mobile menu button should be visible
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();

      // Desktop navigation should be hidden (handled by CSS)
      const desktopNav = screen.getByRole('navigation', { name: /main/i });
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('shows appropriate elements for desktop viewport', () => {
      // Mock desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      render(<LandingPage />);

      // Desktop navigation should be visible
      const desktopNav = screen.getByRole('navigation', { name: /main/i });
      expect(desktopNav).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('lazy loads images', () => {
      render(<LandingPage />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('prefetches critical navigation routes', async () => {
      render(<LandingPage />);

      await waitFor(() => {
        expect(mockPrefetch).toHaveBeenCalledWith('/auth/login');
        expect(mockPrefetch).toHaveBeenCalledWith('/auth/signup');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<LandingPage />);

      // Check navigation landmarks
      expect(screen.getByRole('navigation', { name: /main/i })).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      // Check button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation', () => {
      render(<LandingPage />);

      // Tab through interactive elements
      const firstButton = screen.getAllByRole('button')[0];
      const firstLink = screen.getAllByRole('link')[0];

      firstLink.focus();
      expect(document.activeElement).toBe(firstLink);

      // Simulate tab key
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    });

    it('has proper contrast ratios for text', () => {
      const { container } = render(<LandingPage />);

      // Check that text elements have appropriate classes for contrast
      const headings = container.querySelectorAll('h1, h2, h3');
      headings.forEach(heading => {
        expect(heading).toHaveClass(/text-(gray|blue|green)-[789]00/);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', async () => {
      // Mock navigation error
      mockPush.mockRejectedValueOnce(new Error('Navigation failed'));

      render(<LandingPage />);

      const ctaButton = screen.getAllByText(/Comenzar gratis/i)[0];
      fireEvent.click(ctaButton);

      // Should not crash the app
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });

  describe('Analytics and Tracking', () => {
    it('tracks CTA clicks', async () => {
      const trackEvent = vi.fn();
      (window as any).gtag = trackEvent;

      render(<LandingPage />);

      const ctaButton = screen.getAllByText(/Comenzar gratis/i)[0];
      fireEvent.click(ctaButton);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('event', 'click', expect.objectContaining({
          event_category: 'CTA',
          event_label: 'Hero CTA',
        }));
      });
    });
  });
});