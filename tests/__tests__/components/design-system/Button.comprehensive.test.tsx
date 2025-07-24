/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@/tests/utils/test-helpers';
import { Button } from '@/components/design-system/Button';
import { ChevronRight, Home, Loader2 } from 'lucide-react';

describe('Button Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const handleClick = jest.fn();
      const { user } = render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('prevents click when disabled', async () => {
      const handleClick = jest.fn();
      const { user } = render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button', { name: /disabled/i });
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('prevents click when loading', async () => {
      const handleClick = jest.fn();
      const { user } = render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    const variants: Array<Button['props']['variant']> = [
      'primary', 'secondary', 'ghost', 'glass', 'fresh', 'warm', 'rich', 'golden'
    ];

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>{variant} Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Check for variant-specific classes
        if (variant === 'primary') {
          expect(button).toHaveClass('bg-food-fresh-500');
        } else if (variant === 'glass') {
          expect(button).toHaveClass('glass-interactive');
        }
      });
    });
  });

  describe('Sizes', () => {
    const sizes: Array<Button['props']['size']> = ['sm', 'md', 'lg', 'xl'];

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>{size} Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Check for size-specific classes
        const sizeClasses = {
          sm: 'px-3',
          md: 'px-4',
          lg: 'px-6',
          xl: 'px-8',
        };
        
        expect(button).toHaveClass(sizeClasses[size]);
      });
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(
        <Button leftIcon={<Home data-testid="home-icon" />}>
          Home
        </Button>
      );
      
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <Button rightIcon={<ChevronRight data-testid="chevron-icon" />}>
          Next
        </Button>
      );
      
      expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders with both icons', () => {
      render(
        <Button 
          leftIcon={<Home data-testid="home-icon" />}
          rightIcon={<ChevronRight data-testid="chevron-icon" />}
        >
          Navigate
        </Button>
      );
      
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
      expect(screen.getByText('Navigate')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading...</Button>);
      const button = screen.getByRole('button');
      
      // Check for spinner animation
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides content when loading', () => {
      render(<Button loading>Content</Button>);
      const button = screen.getByRole('button');
      
      // Content should be visually hidden but still in DOM
      const content = screen.getByText('Content');
      expect(content.parentElement).toHaveClass('opacity-0');
    });
  });

  describe('Special Props', () => {
    it('renders full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('applies glow effect when enabled', () => {
      render(<Button glow variant="fresh">Glowing</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('glow-fresh');
    });

    it('forwards additional props', () => {
      render(
        <Button 
          data-testid="custom-button" 
          aria-label="Custom Button"
          type="submit"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom Button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Test</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });

  describe('Keyboard Interaction', () => {
    it('can be activated with Enter key', async () => {
      const handleClick = jest.fn();
      const { user } = render(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated with Space key', async () => {
      const handleClick = jest.fn();
      const { user } = render(<Button onClick={handleClick}>Press Space</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Management', () => {
    it('shows focus ring when focused', async () => {
      const { user } = render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      await checkA11y(container);
    });

    it('has correct ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('has correct ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Snapshots', () => {
    testComponentSnapshot(Button, { children: 'Default Button' });
    
    it('matches snapshot for all variants', () => {
      const variants: Array<Button['props']['variant']> = [
        'primary', 'secondary', 'ghost', 'glass', 'fresh', 'warm', 'rich', 'golden'
      ];
      
      const { container } = render(
        <div>
          {variants.map(variant => (
            <Button key={variant} variant={variant}>{variant}</Button>
          ))}
        </div>
      );
      
      expect(container).toMatchSnapshot();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const start = performance.now();
      render(<Button>Performance Test</Button>);
      const end = performance.now();
      
      // Button should render in less than 50ms
      expect(end - start).toBeLessThan(50);
    });
  });
});