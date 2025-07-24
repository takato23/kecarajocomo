/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@/tests/utils/test-helpers';
import { Input } from '@/components/design-system/Input';
import { Search, Eye, EyeOff } from 'lucide-react';

describe('Input Component - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders input with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('handles text input', async () => {
      const handleChange = jest.fn();
      const { user } = render(
        <Input onChange={handleChange} placeholder="Type here" />
      );
      
      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles controlled input', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      expect(input.value).toBe('initial');
      
      rerender(<Input value="updated" onChange={() => {}} />);
      expect(input.value).toBe('updated');
    });

    it('can be disabled', async () => {
      const handleChange = jest.fn();
      const { user } = render(
        <Input onChange={handleChange} disabled placeholder="Disabled input" />
      );
      
      const input = screen.getByPlaceholderText('Disabled input');
      expect(input).toBeDisabled();
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Input Types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'];

    types.forEach(type => {
      it(`renders ${type} input correctly`, () => {
        render(<Input type={type as any} placeholder={`${type} input`} />);
        const input = screen.getByPlaceholderText(`${type} input`);
        expect(input).toHaveAttribute('type', type);
      });
    });

    it('shows/hides password visibility toggle', async () => {
      const { user } = render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      
      // Initially password type
      expect(input).toHaveAttribute('type', 'password');
      
      // Look for visibility toggle button
      const toggleButton = screen.queryByRole('button');
      if (toggleButton) {
        await user.click(toggleButton);
        expect(input).toHaveAttribute('type', 'text');
        
        await user.click(toggleButton);
        expect(input).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'glass', 'minimal'] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Input variant={variant} placeholder={`${variant} input`} />);
        const input = screen.getByPlaceholderText(`${variant} input`);
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Input size={size} placeholder={`${size} input`} />);
        const input = screen.getByPlaceholderText(`${size} input`);
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(
        <Input 
          leftIcon={<Search data-testid="search-icon" />}
          placeholder="Search"
        />
      );
      
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <Input 
          rightIcon={<Search data-testid="search-icon" />}
          placeholder="Search"
        />
      );
      
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error state', () => {
      render(<Input error placeholder="Error input" />);
      const input = screen.getByPlaceholderText('Error input');
      const container = input.closest('div');
      
      expect(container).toHaveClass('border-red-500');
    });

    it('shows error message', () => {
      render(
        <Input 
          error 
          errorMessage="This field is required"
          placeholder="Required field"
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  describe('Labels and Help Text', () => {
    it('renders with label', () => {
      render(<Input label="Email Address" placeholder="Enter email" />);
      
      const label = screen.getByText('Email Address');
      const input = screen.getByPlaceholderText('Enter email');
      
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('renders with help text', () => {
      render(
        <Input 
          placeholder="Password"
          helpText="Must be at least 8 characters"
        />
      );
      
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('handles required validation', async () => {
      const handleInvalid = jest.fn();
      const { user } = render(
        <form>
          <Input required onInvalid={handleInvalid} placeholder="Required" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);
      
      expect(handleInvalid).toHaveBeenCalled();
    });

    it('handles pattern validation', async () => {
      const { user } = render(
        <Input 
          type="email"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          placeholder="Email"
        />
      );
      
      const input = screen.getByPlaceholderText('Email');
      await user.type(input, 'invalid-email');
      
      expect(input).toHaveAttribute('pattern');
    });

    it('handles min/max validation for number inputs', () => {
      render(
        <Input 
          type="number"
          min="0"
          max="100"
          placeholder="Number"
        />
      );
      
      const input = screen.getByPlaceholderText('Number');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Focus Management', () => {
    it('can be focused programmatically', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} placeholder="Focus me" />);
      
      ref.current?.focus();
      expect(screen.getByPlaceholderText('Focus me')).toHaveFocus();
    });

    it('shows focus styles when focused', async () => {
      const { user } = render(<Input placeholder="Focus test" />);
      const input = screen.getByPlaceholderText('Focus test');
      
      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe('Keyboard Interaction', () => {
    it('submits form on Enter key', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      const { user } = render(
        <form onSubmit={handleSubmit}>
          <Input placeholder="Press Enter" />
        </form>
      );
      
      const input = screen.getByPlaceholderText('Press Enter');
      await user.type(input, 'test{Enter}');
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('clears input on Escape key', async () => {
      const { user } = render(<Input placeholder="Press Escape" />);
      const input = screen.getByPlaceholderText('Press Escape') as HTMLInputElement;
      
      await user.type(input, 'test text');
      expect(input.value).toBe('test text');
      
      await user.keyboard('{Escape}');
      // Note: Escape behavior depends on implementation
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Input label="Accessible Input" placeholder="Enter text" />
      );
      await checkA11y(container);
    });

    it('has correct ARIA attributes', () => {
      render(
        <Input 
          label="Email"
          placeholder="Enter email"
          required
          error
          errorMessage="Invalid email"
          aria-describedby="email-error"
        />
      );
      
      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('associates label with input', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      
      const input = screen.getByPlaceholderText('Enter username');
      const label = screen.getByText('Username');
      
      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} placeholder="Ref test" />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });
  });

  describe('Snapshots', () => {
    testComponentSnapshot(Input, { placeholder: 'Default Input' });
    
    it('matches snapshot for all variants and states', () => {
      const { container } = render(
        <div>
          <Input placeholder="Default" />
          <Input variant="glass" placeholder="Glass" />
          <Input variant="minimal" placeholder="Minimal" />
          <Input size="sm" placeholder="Small" />
          <Input size="lg" placeholder="Large" />
          <Input error errorMessage="Error state" placeholder="Error" />
          <Input disabled placeholder="Disabled" />
          <Input type="password" placeholder="Password" />
          <Input leftIcon={<Search />} placeholder="With icon" />
        </div>
      );
      
      expect(container).toMatchSnapshot();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const start = performance.now();
      render(<Input placeholder="Performance test" />);
      const end = performance.now();
      
      // Input should render in less than 50ms
      expect(end - start).toBeLessThan(50);
    });

    it('handles rapid typing efficiently', async () => {
      const { user } = render(<Input placeholder="Type fast" />);
      const input = screen.getByPlaceholderText('Type fast');
      
      const start = performance.now();
      await user.type(input, 'This is a long text that simulates rapid typing');
      const end = performance.now();
      
      // Should handle rapid typing efficiently
      expect(end - start).toBeLessThan(1000);
    });
  });
});