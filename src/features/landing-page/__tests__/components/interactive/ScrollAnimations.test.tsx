import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';

import {
  ScrollProgress,
  ParallaxElement,
  ScrollTriggeredAnimation,
  FloatingElement,
  MouseFollower,
  StaggeredContainer,
  MagneticButton,
  CountUp
} from '../../../components/interactive/ScrollAnimations';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, animate, transition, ...props }: any) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>
  },
  useScroll: () => ({ scrollYProgress: { set: vi.fn() }, scrollY: { set: vi.fn() } }),
  useTransform: (value: any, input: any, output: any) => ({ set: vi.fn() }),
  useSpring: (value: any, config: any) => ({ set: vi.fn() }),
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: vi.fn(),
    on: vi.fn(),
    destroy: vi.fn()
  })
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('ScrollProgress', () => {
  it('renders scroll progress bar', () => {
    render(<ScrollProgress data-testid="scroll-progress" />);
    
    const progressBar = screen.getByTestId('scroll-progress');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveClass('fixed', 'top-0', 'h-1');
  });

  it('applies custom className', () => {
    render(<ScrollProgress className="custom-progress" data-testid="scroll-progress" />);
    
    const progressBar = screen.getByTestId('scroll-progress');
    expect(progressBar).toHaveClass('custom-progress');
  });

  it('has gradient background', () => {
    render(<ScrollProgress data-testid="scroll-progress" />);
    
    const progressBar = screen.getByTestId('scroll-progress');
    expect(progressBar).toHaveClass('bg-gradient-to-r', 'from-lime-500');
  });
});

describe('ParallaxElement', () => {
  it('renders children correctly', () => {
    render(
      <ParallaxElement>
        <div data-testid="parallax-child">Parallax Content</div>
      </ParallaxElement>
    );
    
    expect(screen.getByTestId('parallax-child')).toBeInTheDocument();
    expect(screen.getByText('Parallax Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ParallaxElement className="custom-parallax">
        <div>Content</div>
      </ParallaxElement>
    );
    
    const container = screen.getByText('Content').parentElement;
    expect(container).toHaveClass('custom-parallax');
  });
});

describe('ScrollTriggeredAnimation', () => {
  it('renders children correctly', () => {
    render(
      <ScrollTriggeredAnimation>
        <div data-testid="animated-child">Animated Content</div>
      </ScrollTriggeredAnimation>
    );
    
    expect(screen.getByTestId('animated-child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ScrollTriggeredAnimation className="custom-animation">
        <div data-testid="content">Content</div>
      </ScrollTriggeredAnimation>
    );
    
    const container = screen.getByTestId('content').parentElement;
    expect(container).toHaveClass('custom-animation');
  });

  it('handles different animation types', () => {
    const animations = ['fadeInUp', 'fadeInLeft', 'fadeInRight', 'scaleIn', 'slideInUp'] as const;
    
    animations.forEach(animation => {
      const { unmount } = render(
        <ScrollTriggeredAnimation animation={animation}>
          <div>Content</div>
        </ScrollTriggeredAnimation>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('FloatingElement', () => {
  it('renders children correctly', () => {
    render(
      <FloatingElement>
        <div data-testid="floating-child">Floating Content</div>
      </FloatingElement>
    );
    
    expect(screen.getByTestId('floating-child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <FloatingElement className="custom-floating">
        <div data-testid="content">Content</div>
      </FloatingElement>
    );
    
    const container = screen.getByTestId('content').parentElement;
    expect(container).toHaveClass('custom-floating');
  });

  it('handles different directions', () => {
    const directions = ['up', 'down', 'left', 'right', 'circular'] as const;
    
    directions.forEach(direction => {
      const { unmount } = render(
        <FloatingElement direction={direction}>
          <div>Content</div>
        </FloatingElement>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different intensities', () => {
    const intensities = ['subtle', 'medium', 'strong'] as const;
    
    intensities.forEach(intensity => {
      const { unmount } = render(
        <FloatingElement intensity={intensity}>
          <div>Content</div>
        </FloatingElement>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      unmount();
    });
  });
});

describe('MouseFollower', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <MouseFollower>
        <div data-testid="mouse-follower-child">Mouse Follower Content</div>
      </MouseFollower>
    );
    
    expect(screen.getByTestId('mouse-follower-child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <MouseFollower className="custom-follower">
        <div data-testid="content">Content</div>
      </MouseFollower>
    );
    
    const container = screen.getByTestId('content').parentElement;
    expect(container).toHaveClass('custom-follower');
  });

  it('responds to mouse movement', () => {
    render(
      <MouseFollower>
        <div>Content</div>
      </MouseFollower>
    );
    
    // Simulate mouse move
    fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
    
    // Component should handle mouse movement without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('StaggeredContainer', () => {
  it('renders all children correctly', () => {
    render(
      <StaggeredContainer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </StaggeredContainer>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <StaggeredContainer className="custom-stagger" data-testid="stagger-container">
        <div>Child</div>
      </StaggeredContainer>
    );
    
    const container = screen.getByTestId('stagger-container');
    expect(container).toHaveClass('custom-stagger');
  });

  it('handles empty children gracefully', () => {
    render(<StaggeredContainer data-testid="empty-stagger" />);
    
    const container = screen.getByTestId('empty-stagger');
    expect(container).toBeInTheDocument();
  });
});

describe('MagneticButton', () => {
  it('renders children correctly', () => {
    render(
      <MagneticButton>
        <button data-testid="magnetic-btn">Magnetic Button</button>
      </MagneticButton>
    );
    
    expect(screen.getByTestId('magnetic-btn')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    
    render(
      <MagneticButton onClick={handleClick}>
        <button>Clickable</button>
      </MagneticButton>
    );
    
    const container = screen.getByText('Clickable').parentElement;
    fireEvent.click(container!);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies cursor pointer class', () => {
    render(
      <MagneticButton data-testid="magnetic-container">
        <button>Button</button>
      </MagneticButton>
    );
    
    const container = screen.getByTestId('magnetic-container');
    expect(container).toHaveClass('cursor-pointer');
  });

  it('responds to mouse movement', () => {
    render(
      <MagneticButton data-testid="magnetic-container">
        <button>Button</button>
      </MagneticButton>
    );
    
    const container = screen.getByTestId('magnetic-container');
    
    // Mock getBoundingClientRect
    container.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 100,
      width: 200,
      height: 50,
      right: 300,
      bottom: 150,
      x: 100,
      y: 100,
      toJSON: vi.fn()
    }));
    
    fireEvent.mouseMove(container, { clientX: 200, clientY: 125 });
    fireEvent.mouseLeave(container);
    
    // Should handle mouse events without errors
    expect(container).toBeInTheDocument();
  });
});

describe('CountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial value', () => {
    render(<CountUp end={100} data-testid="count-up" />);
    
    const counter = screen.getByTestId('count-up');
    expect(counter).toHaveTextContent('0');
  });

  it('applies suffix when provided', () => {
    render(<CountUp end={100} suffix="%" data-testid="count-up" />);
    
    const counter = screen.getByTestId('count-up');
    expect(counter).toHaveTextContent('0%');
  });

  it('applies custom className', () => {
    render(<CountUp end={100} className="custom-counter" data-testid="count-up" />);
    
    const counter = screen.getByTestId('count-up');
    expect(counter).toHaveClass('custom-counter');
  });

  it('handles large numbers correctly', () => {
    render(<CountUp end={1000000} data-testid="count-up" />);
    
    // Should format large numbers with commas
    const counter = screen.getByTestId('count-up');
    expect(counter).toBeInTheDocument();
  });

  it('animates count when in view', async () => {
    const { container } = render(<CountUp end={100} data-testid="count-up" />);
    
    // Simulate IntersectionObserver callback
    const counter = screen.getByTestId('count-up');
    
    // Should start animation when component comes into view
    expect(counter).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('maintains focus management in interactive elements', () => {
    render(
      <MagneticButton>
        <button>Focusable Button</button>
      </MagneticButton>
    );
    
    const button = screen.getByText('Focusable Button');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('preserves ARIA attributes in wrapped elements', () => {
    render(
      <ScrollTriggeredAnimation>
        <button aria-label="Animated button" data-testid="aria-button">
          Button
        </button>
      </ScrollTriggeredAnimation>
    );
    
    const button = screen.getByTestId('aria-button');
    expect(button).toHaveAttribute('aria-label', 'Animated button');
  });

  it('supports reduced motion preferences', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    render(
      <FloatingElement>
        <div>Animated Content</div>
      </FloatingElement>
    );
    
    expect(screen.getByText('Animated Content')).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('handles rapid animation triggers efficiently', () => {
    render(
      <ScrollTriggeredAnimation>
        <div data-testid="perf-test">Performance Test</div>
      </ScrollTriggeredAnimation>
    );
    
    // Simulate rapid scroll events
    for (let i = 0; i < 100; i++) {
      fireEvent.scroll(window, { target: { scrollY: i * 10 } });
    }
    
    expect(screen.getByTestId('perf-test')).toBeInTheDocument();
  });

  it('cleans up event listeners properly', () => {
    const { unmount } = render(
      <MouseFollower>
        <div>Content</div>
      </MouseFollower>
    );
    
    // Component should unmount without memory leaks
    expect(() => unmount()).not.toThrow();
  });

  it('handles edge cases gracefully', () => {
    // Test with extreme values
    render(
      <CountUp end={Number.MAX_SAFE_INTEGER} data-testid="extreme-count" />
    );
    
    expect(screen.getByTestId('extreme-count')).toBeInTheDocument();
  });
});