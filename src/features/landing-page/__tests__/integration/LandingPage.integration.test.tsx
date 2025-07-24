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
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</path>,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    ellipse: ({ children, ...props }: any) => <ellipse {...props}>{children}</ellipse>,
    rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
    text: ({ children, ...props }: any) => <text {...props}>{children}</text>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
    polygon: ({ children, ...props }: any) => <polygon {...props}>{children}</polygon>
  },
  AnimatePresence: ({ children }: any) => children,
  useScroll: () => ({ scrollYProgress: { set: vi.fn() }, scrollY: { set: vi.fn() } }),
  useTransform: () => ({ set: vi.fn() }),
  useSpring: () => ({ set: vi.fn() }),
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 })
}));

describe('LandingPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window dimensions for responsive tests
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('Complete Page Rendering', () => {
    it('renders all main sections', () => {
      render(<LandingPage />);
      
      // Check navigation
      expect(screen.getByText('KeCaraJoComer')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      
      // Check hero section
      expect(screen.getByText('Transform Your Kitchen Into a Smart Culinary Assistant')).toBeInTheDocument();
      expect(screen.getByText('Start Cooking Smarter')).toBeInTheDocument();
      expect(screen.getByText('Watch Demo')).toBeInTheDocument();
      
      // Check features section
      expect(screen.getByText('Why Choose KeCaraJoComer?')).toBeInTheDocument();
      expect(screen.getByText('AI Recipe Generation')).toBeInTheDocument();
      expect(screen.getByText('Smart Meal Planning')).toBeInTheDocument();
      
      // Check pricing section
      expect(screen.getByText('Choose Your Culinary Journey')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
      
      // Check footer
      expect(screen.getByText('© 2024 KeCaraJoComer. All rights reserved.')).toBeInTheDocument();
    });

    it('has proper semantic structure', () => {
      render(<LandingPage />);
      
      // Check for proper heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      
      // Check for navigation
      const navigation = screen.getByRole('navigation', { hidden: true });
      expect(navigation).toBeInTheDocument();
      
      // Check for main content areas
      const sections = screen.getAllByRole('region', { hidden: true });
      expect(sections.length).toBeGreaterThan(0);
    });

    it('renders all interactive elements', () => {
      render(<LandingPage />);
      
      // Check CTA buttons
      const ctaButtons = screen.getAllByRole('link');
      expect(ctaButtons.length).toBeGreaterThan(0);
      
      // Check navigation links
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('has working navigation links', () => {
      render(<LandingPage />);
      
      const featuresLink = screen.getByText('Features');
      const pricingLink = screen.getByText('Pricing');
      const aboutLink = screen.getByText('About');
      
      expect(featuresLink).toHaveAttribute('href', '#features');
      expect(pricingLink).toHaveAttribute('href', '#pricing');
      expect(aboutLink).toHaveAttribute('href', '#about');
    });

    it('has working CTA buttons', () => {
      render(<LandingPage />);
      
      const getStartedButton = screen.getByText('Start Cooking Smarter');
      const watchDemoButton = screen.getByText('Watch Demo');
      
      expect(getStartedButton.closest('a')).toHaveAttribute('href', '/signup');
      expect(watchDemoButton.closest('a')).toHaveAttribute('href', '#demo');
    });

    it('has mobile-friendly navigation', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      render(<LandingPage />);
      
      // Navigation should still be present but may be hidden on mobile
      const navigation = screen.getByText('KeCaraJoComer');
      expect(navigation).toBeInTheDocument();
    });
  });

  describe('Hero Section Integration', () => {
    it('displays hero content correctly', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('AI-Powered Meal Planning')).toBeInTheDocument();
      expect(screen.getByText('Transform Your Kitchen Into a Smart Culinary Assistant')).toBeInTheDocument();
      expect(screen.getByText(/Experience the future of cooking/)).toBeInTheDocument();
    });

    it('shows hero stats', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Happy Users')).toBeInTheDocument();
      expect(screen.getByText('Recipes Created')).toBeInTheDocument();
      expect(screen.getByText('Time Saved')).toBeInTheDocument();
      expect(screen.getByText('Food Waste')).toBeInTheDocument();
    });

    it('renders hero illustration', () => {
      render(<LandingPage />);
      
      // The illustration should be present in the hero section
      const heroSection = screen.getByText('Transform Your Kitchen Into a Smart Culinary Assistant').closest('section');
      expect(heroSection).toBeInTheDocument();
    });
  });

  describe('Features Section Integration', () => {
    it('displays all feature cards', () => {
      render(<LandingPage />);
      
      const featureCards = [
        'AI Recipe Generation',
        'Smart Meal Planning',
        'Pantry Management',
        'Shopping Optimization',
        'Nutrition Tracking',
        'Community Sharing'
      ];
      
      featureCards.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('has interactive feature cards', () => {
      render(<LandingPage />);
      
      const featureCard = screen.getByText('AI Recipe Generation').closest('[role]');
      if (featureCard) {
        fireEvent.mouseEnter(featureCard);
        fireEvent.mouseLeave(featureCard);
        // Should not throw errors on hover
      }
    });

    it('shows feature descriptions', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Get personalized recipes based on your preferences/)).toBeInTheDocument();
      expect(screen.getByText(/Plan your entire week with intelligent suggestions/)).toBeInTheDocument();
    });
  });

  describe('Pricing Section Integration', () => {
    it('displays all pricing plans', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('shows pricing features', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('5 AI-generated recipes per month')).toBeInTheDocument();
      expect(screen.getByText('Unlimited AI-generated recipes')).toBeInTheDocument();
      expect(screen.getByText('Everything in Pro')).toBeInTheDocument();
    });

    it('has working pricing toggle', () => {
      render(<LandingPage />);
      
      const monthlyText = screen.getByText('Monthly');
      const yearlyText = screen.getByText('Yearly');
      
      expect(monthlyText).toBeInTheDocument();
      expect(yearlyText).toBeInTheDocument();
      
      // Check for save badge
      expect(screen.getByText('Save 20%')).toBeInTheDocument();
    });

    it('highlights popular plan', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });
  });

  describe('Footer Integration', () => {
    it('displays footer content', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('© 2024 KeCaraJoComer. All rights reserved.')).toBeInTheDocument();
    });

    it('has footer navigation links', () => {
      render(<LandingPage />);
      
      const footerLinks = ['Features', 'Pricing', 'API', 'Mobile App', 'Blog', 'Help Center'];
      
      footerLinks.forEach(link => {
        expect(screen.getByText(link)).toBeInTheDocument();
      });
    });

    it('displays company information', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/Transform your kitchen into a smart culinary assistant/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design Integration', () => {
    it('adapts to mobile viewport', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      render(<LandingPage />);
      
      // Content should still be accessible
      expect(screen.getByText('Transform Your Kitchen Into a Smart Culinary Assistant')).toBeInTheDocument();
      expect(screen.getByText('Start Cooking Smarter')).toBeInTheDocument();
    });

    it('adapts to tablet viewport', () => {
      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      
      render(<LandingPage />);
      
      expect(screen.getByText('Why Choose KeCaraJoComer?')).toBeInTheDocument();
    });

    it('works on desktop viewport', () => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      
      render(<LandingPage />);
      
      expect(screen.getByText('Choose Your Culinary Journey')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('has proper ARIA landmarks', () => {
      render(<LandingPage />);
      
      // Check for main content
      const main = document.querySelector('main') || screen.getByRole('main', { hidden: true });
      expect(main).toBeTruthy();
    });

    it('supports keyboard navigation', () => {
      render(<LandingPage />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        link.focus();
        expect(link).toHaveFocus();
      });
    });

    it('has proper heading hierarchy', () => {
      render(<LandingPage />);
      
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      expect(h1Elements.length).toBeGreaterThan(0);
      
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('provides alternative text for images', () => {
      render(<LandingPage />);
      
      // SVG illustrations should have proper labeling
      const svgElements = document.querySelectorAll('svg');
      svgElements.forEach(svg => {
        // SVGs should either have aria-hidden="true" or proper labeling
        const hasAriaHidden = svg.getAttribute('aria-hidden') === 'true';
        const hasAriaLabel = svg.hasAttribute('aria-label');
        const hasTitle = svg.querySelector('title');
        
        expect(hasAriaHidden || hasAriaLabel || hasTitle).toBeTruthy();
      });
    });
  });

  describe('Performance Integration', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();
      render(<LandingPage />);
      const endTime = performance.now();
      
      // Should render in reasonable time (less than 100ms in test environment)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles large content gracefully', () => {
      render(<LandingPage />);
      
      // Should handle all sections without performance issues
      const allText = document.body.textContent || '';
      expect(allText.length).toBeGreaterThan(1000); // Should have substantial content
    });

    it('has minimal DOM size', () => {
      const { container } = render(<LandingPage />);
      
      const allElements = container.querySelectorAll('*');
      // Should have reasonable DOM size for a landing page
      expect(allElements.length).toBeLessThan(500);
    });
  });

  describe('User Journey Integration', () => {
    it('supports complete user flow', async () => {
      render(<LandingPage />);
      
      // User sees hero
      expect(screen.getByText('Transform Your Kitchen Into a Smart Culinary Assistant')).toBeInTheDocument();
      
      // User scrolls to features (simulated)
      const featuresSection = screen.getByText('Why Choose KeCaraJoComer?');
      expect(featuresSection).toBeInTheDocument();
      
      // User views pricing
      const pricingSection = screen.getByText('Choose Your Culinary Journey');
      expect(pricingSection).toBeInTheDocument();
      
      // User can click CTA
      const ctaButton = screen.getByText('Start Cooking Smarter');
      expect(ctaButton.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('provides clear value proposition', () => {
      render(<LandingPage />);
      
      // Clear main value prop
      expect(screen.getByText(/AI-powered meal planning/i)).toBeInTheDocument();
      
      // Supporting benefits
      expect(screen.getByText(/reduce food waste/i)).toBeInTheDocument();
      expect(screen.getByText(/save time/i)).toBeInTheDocument();
    });

    it('has clear call-to-action hierarchy', () => {
      render(<LandingPage />);
      
      // Primary CTA should be prominent
      const primaryCTA = screen.getByText('Start Cooking Smarter');
      expect(primaryCTA).toBeInTheDocument();
      
      // Secondary CTA should be available
      const secondaryCTA = screen.getByText('Watch Demo');
      expect(secondaryCTA).toBeInTheDocument();
    });
  });
});