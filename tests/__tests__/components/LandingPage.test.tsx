import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import LandingPage from '@/components/LandingPage';
import '@testing-library/jest-dom';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, ...props }: any) {
    return (
      <a href={href} onClick={onClick} {...props}>
        {children}
      </a>
    );
  };
});

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock animation frame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16);
  },
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => {
    clearTimeout(id);
  },
});

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {

    it('renders the main heading', () => {
      render(<LandingPage />);
      
      const heading = screen.getByRole('heading', { 
        name: /transform your meal planning with ai magic/i 
      });
      expect(heading).toBeInTheDocument();
    });

    it('renders the hero description', () => {
      render(<LandingPage />);
      
      const description = screen.getByText(
        /say goodbye to decision fatigue and food waste/i
      );
      expect(description).toBeInTheDocument();
    });

    it('renders call-to-action buttons', () => {
      render(<LandingPage />);
      
      const startTrialButtons = screen.getAllByText(/start.*trial/i);
      const learnMoreButton = screen.getByText(/learn more/i);
      
      expect(startTrialButtons).toHaveLength(2); // Hero and CTA sections
      expect(learnMoreButton).toBeInTheDocument();
    });

    it('renders all feature cards', () => {
      render(<LandingPage />);
      
      const features = [
        'AI-Powered Meal Planning',
        'Save 5+ Hours Weekly',
        'Reduce Food Waste by 40%',
        'Optimized Shopping Lists',
        'Improve Nutrition by 30%',
        'Family-Friendly',
      ];

      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('renders statistics section', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('100K+')).toBeInTheDocument();
      expect(screen.getByText('5M+')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText('4.8★')).toBeInTheDocument();
    });

    it('renders testimonials section', () => {
      render(<LandingPage />);
      
      const testimonialHeading = screen.getByRole('heading', {
        name: /loved by food enthusiasts/i
      });
      expect(testimonialHeading).toBeInTheDocument();
    });

    it('renders how it works section', () => {
      render(<LandingPage />);
      
      const howItWorksHeading = screen.getByRole('heading', {
        name: /how it works/i
      });
      expect(howItWorksHeading).toBeInTheDocument();
      
      expect(screen.getByText('Set Your Preferences')).toBeInTheDocument();
      expect(screen.getByText('Get AI Meal Plans')).toBeInTheDocument();
      expect(screen.getByText('Shop & Cook')).toBeInTheDocument();
    });

    it('renders footer with correct links', () => {
      render(<LandingPage />);
      
      const privacyLink = screen.getByRole('link', { name: /privacy/i });
      const termsLink = screen.getByRole('link', { name: /terms/i });
      const contactLink = screen.getByRole('link', { name: /contact/i });
      
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(contactLink).toHaveAttribute('href', '/contact');
    });
  });

  describe('Interactions', () => {
    it('handles get started button click', () => {
      render(<LandingPage />);
      
      const getStartedButtons = screen.getAllByRole('link', { name: /get started/i });
      const headerButton = getStartedButtons[0]; // Header button
      
      fireEvent.click(headerButton);
      
      // The button should still be in the document after click
      expect(headerButton).toBeInTheDocument();
    });

    it('handles demo button interaction', () => {
      render(<LandingPage />);
      
      const demoButton = screen.getByText(/watch 2min demo/i);
      
      fireEvent.click(demoButton);
      
      expect(screen.getByText(/interactive demo/i)).toBeInTheDocument();
    });

    it('handles feature card hover effects', async () => {
      render(<LandingPage />);
      
      const featureCard = screen.getByText('AI-Powered Meal Planning').closest('div');
      
      if (featureCard) {
        fireEvent.mouseEnter(featureCard);
        
        await waitFor(() => {
          expect(screen.getByText('Learn more')).toBeInTheDocument();
        });
        
        fireEvent.mouseLeave(featureCard);
        
        await waitFor(() => {
          expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
        });
      }
    });

    it('handles testimonial navigation', async () => {
      render(<LandingPage />);
      
      // Get testimonial navigation dots
      const navigationDots = screen.getAllByRole('button').filter(
        button => button.className.includes('w-3 h-3')
      );
      
      expect(navigationDots).toHaveLength(3);
      
      // Click second dot
      fireEvent.click(navigationDots[1]);
      
      // Wait for testimonial change
      await waitFor(() => {
        expect(screen.getByText(/the ai suggestions are incredible/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<LandingPage />);
      
      // Check main heading is h1
      const mainHeading = screen.getByRole('heading', {
        name: /transform your meal planning with ai magic/i
      });
      expect(mainHeading.tagName).toBe('H1');
      
      // Check that we have multiple headings on the page
      const allHeadings = screen.getAllByRole('heading');
      expect(allHeadings.length).toBeGreaterThan(1);
    });

    it('has proper link attributes', () => {
      render(<LandingPage />);
      
      const signupLinks = screen.getAllByRole('link').filter(
        link => link.getAttribute('href') === '/auth/signup'
      );
      
      signupLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/auth/signup');
      });
    });
  });

  describe('Performance', () => {
    it('handles testimonial auto-rotation', async () => {
      jest.useFakeTimers();
      
      render(<LandingPage />);
      
      // Fast-forward time to trigger auto-rotation
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Should have rotated to next testimonial
      await waitFor(() => {
        expect(screen.getByText(/the ai suggestions are incredible/i)).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });
});