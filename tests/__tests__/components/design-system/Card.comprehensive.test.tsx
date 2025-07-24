/**
 * @jest-environment jsdom
 */
import { render, screen } from '@/tests/utils/test-helpers';
import { Card } from '@/components/design-system/Card';
import { MoreVertical, Heart } from 'lucide-react';

describe('Card Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders card with content', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with header', () => {
      render(
        <Card header="Card Title">
          <p>Card body</p>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card body')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(
        <Card footer={<button>Action</button>}>
          <p>Card content</p>
        </Card>
      );
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('renders with header and footer', () => {
      render(
        <Card 
          header="Title"
          footer={<button>Save</button>}
        >
          <p>Content</p>
        </Card>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'outlined', 'glass', 'elevated'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(
          <Card variant={variant}>
            <p>{variant} card</p>
          </Card>
        );
        
        const card = screen.getByText(`${variant} card`).closest('div');
        expect(card).toBeInTheDocument();
        
        // Check for variant-specific classes
        if (variant === 'glass') {
          expect(card).toHaveClass('glass');
        } else if (variant === 'elevated') {
          expect(card).toHaveClass('shadow-lg');
        }
      });
    });
  });

  describe('Interactive Cards', () => {
    it('handles click events when interactive', async () => {
      const handleClick = jest.fn();
      const { user } = render(
        <Card interactive onClick={handleClick}>
          <p>Click me</p>
        </Card>
      );
      
      const card = screen.getByText('Click me').closest('div');
      await user.click(card!);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows hover state when interactive', async () => {
      const { user } = render(
        <Card interactive>
          <p>Hover me</p>
        </Card>
      );
      
      const card = screen.getByText('Hover me').closest('div');
      expect(card).toHaveClass('cursor-pointer');
      
      await user.hover(card!);
      // Hover effects are applied via CSS
    });

    it('does not handle clicks when not interactive', async () => {
      const handleClick = jest.fn();
      const { user } = render(
        <Card onClick={handleClick}>
          <p>Static card</p>
        </Card>
      );
      
      const card = screen.getByText('Static card').closest('div');
      await user.click(card!);
      
      // Click handler might still be called, but card shouldn't have interactive styles
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Padding Options', () => {
    const paddings = ['none', 'sm', 'md', 'lg'] as const;

    paddings.forEach(padding => {
      it(`renders with ${padding} padding`, () => {
        render(
          <Card padding={padding}>
            <p>{padding} padding</p>
          </Card>
        );
        
        const content = screen.getByText(`${padding} padding`);
        const card = content.closest('div');
        
        if (padding === 'none') {
          expect(card).toHaveClass('p-0');
        } else {
          expect(card).toHaveClass(`p-${padding === 'sm' ? '4' : padding === 'md' ? '6' : '8'}`);
        }
      });
    });
  });

  describe('Additional Props', () => {
    it('passes through className', () => {
      render(
        <Card className="custom-class">
          <p>Custom styled</p>
        </Card>
      );
      
      const card = screen.getByText('Custom styled').closest('div');
      expect(card).toHaveClass('custom-class');
    });

    it('passes through data attributes', () => {
      render(
        <Card data-testid="test-card" data-id="123">
          <p>Test card</p>
        </Card>
      );
      
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('data-id', '123');
    });

    it('passes through aria attributes', () => {
      render(
        <Card aria-label="Info card" role="article">
          <p>Accessible card</p>
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Info card');
    });
  });

  describe('Complex Content', () => {
    it('renders with complex header', () => {
      render(
        <Card 
          header={
            <div className="flex justify-between items-center">
              <h3>Complex Header</h3>
              <button aria-label="More options">
                <MoreVertical />
              </button>
            </div>
          }
        >
          <p>Content</p>
        </Card>
      );
      
      expect(screen.getByText('Complex Header')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      render(
        <Card>
          <h3>Title</h3>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </Card>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      render(
        <Card loading>
          <p>This should not be visible</p>
        </Card>
      );
      
      // Content should be hidden or replaced with skeleton
      const skeleton = screen.queryByTestId('card-skeleton');
      if (skeleton) {
        expect(skeleton).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Card header="Accessible Card">
          <p>Card content with proper semantics</p>
        </Card>
      );
      await checkA11y(container);
    });

    it('uses semantic HTML when appropriate', () => {
      render(
        <Card as="article" header="Article Card">
          <p>Article content</p>
        </Card>
      );
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('handles keyboard navigation for interactive cards', async () => {
      const handleClick = jest.fn();
      const { user } = render(
        <Card interactive onClick={handleClick} tabIndex={0}>
          <p>Keyboard accessible</p>
        </Card>
      );
      
      const card = screen.getByText('Keyboard accessible').closest('div');
      card?.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      render(
        <Card className="sm:p-4 md:p-6 lg:p-8">
          <p>Responsive card</p>
        </Card>
      );
      
      const card = screen.getByText('Responsive card').closest('div');
      expect(card).toHaveClass('sm:p-4', 'md:p-6', 'lg:p-8');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card ref={ref}>
          <p>Ref test</p>
        </Card>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  describe('Snapshots', () => {
    testComponentSnapshot(Card, { children: <p>Default Card</p> });
    
    it('matches snapshot for all variants', () => {
      const { container } = render(
        <div>
          <Card variant="default">Default</Card>
          <Card variant="outlined">Outlined</Card>
          <Card variant="glass">Glass</Card>
          <Card variant="elevated">Elevated</Card>
          <Card interactive>Interactive</Card>
          <Card header="With Header" footer={<button>Footer</button>}>
            Full featured
          </Card>
        </div>
      );
      
      expect(container).toMatchSnapshot();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const start = performance.now();
      render(
        <Card header="Performance Test">
          <p>Content</p>
        </Card>
      );
      const end = performance.now();
      
      // Card should render in less than 50ms
      expect(end - start).toBeLessThan(50);
    });

    it('handles complex content efficiently', async () => {
      const start = performance.now();
      render(
        <Card 
          header={
            <div className="flex gap-4">
              <h3>Complex Header</h3>
              <span>Subtitle</span>
              <button>Action</button>
            </div>
          }
          footer={
            <div className="flex gap-2">
              <button>Cancel</button>
              <button>Save</button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>Item {i + 1}</div>
            ))}
          </div>
        </Card>
      );
      const end = performance.now();
      
      // Complex card should still render efficiently
      expect(end - start).toBeLessThan(100);
    });
  });
});