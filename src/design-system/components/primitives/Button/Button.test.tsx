import { render, screen, fireEvent } from '@testing-library/react';
import { PlusIcon } from '@heroicons/react/24/solid';

import { Button } from './Button';

describe('Button', () => {
  it('renders correctly with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    // Check for spinner
    expect(screen.getByRole('button').querySelector('svg')).toHaveClass('animate-spin');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-orange-500');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-teal-500');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-500');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-2');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');
    
    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
    
    rerender(<Button size="icon" aria-label="Icon button">I</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('renders with left icon', () => {
    render(
      <Button leftIcon={<PlusIcon data-testid="left-icon" className="w-5 h-5" />}>
        Add Item
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(
      <Button rightIcon={<PlusIcon data-testid="right-icon" className="w-5 h-5" />}>
        Next
      </Button>
    );
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders with both icons', () => {
    render(
      <Button 
        leftIcon={<PlusIcon data-testid="left-icon" className="w-5 h-5" />}
        rightIcon={<PlusIcon data-testid="right-icon" className="w-5 h-5" />}
      >
        Action
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('does not trigger onClick when loading', () => {
    const handleClick = jest.fn();
    render(<Button isLoading onClick={handleClick}>Loading</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Button</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('passes through other props', () => {
    render(<Button data-testid="custom-button" type="submit">Submit</Button>);
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});