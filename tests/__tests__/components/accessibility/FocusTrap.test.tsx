/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusTrap } from '@/components/accessibility/FocusTrap';

// Mock focus-trap-react to avoid library issues in tests
jest.mock('focus-trap-react', () => {
  return function FocusTrapReactMock({ children, active }: any) {
    return <div data-testid="focus-trap" data-active={active}>{children}</div>;
  };
});

describe('FocusTrap Component', () => {
  it('renders children correctly', () => {
    render(
      <FocusTrap active={false}>
        <div>
          <input data-testid="input1" />
          <button data-testid="button1">Button</button>
        </div>
      </FocusTrap>
    );

    expect(screen.getByTestId('input1')).toBeInTheDocument();
    expect(screen.getByTestId('button1')).toBeInTheDocument();
    expect(screen.getByTestId('focus-trap')).toBeInTheDocument();
  });

  it('passes active prop to focus trap', () => {
    render(
      <FocusTrap active={true}>
        <div>
          <input data-testid="input1" />
          <button data-testid="button1">Button</button>
          <input data-testid="input2" />
        </div>
      </FocusTrap>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    const input1 = screen.getByTestId('input1');
    const button1 = screen.getByTestId('button1');
    const input2 = screen.getByTestId('input2');

    // Check that elements are rendered
    expect(input1).toBeInTheDocument();
    expect(button1).toBeInTheDocument();
    expect(input2).toBeInTheDocument();
    
    // Check that active prop is passed correctly
    expect(focusTrap).toHaveAttribute('data-active', 'true');

    // Elements should be focusable
    expect(input1).toBeVisible();
    expect(button1).toBeVisible();
    expect(input2).toBeVisible();
  });

  it('renders with inactive state', () => {
    render(
      <FocusTrap active={false}>
        <div>
          <input data-testid="input1" />
          <button data-testid="button1">Button</button>
          <input data-testid="input2" />
        </div>
      </FocusTrap>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    const input1 = screen.getByTestId('input1');
    const button1 = screen.getByTestId('button1');
    const input2 = screen.getByTestId('input2');

    // Check that elements are rendered and accessible
    expect(input1).toBeInTheDocument();
    expect(button1).toBeInTheDocument();
    expect(input2).toBeInTheDocument();
    
    // Check that active prop is passed correctly
    expect(focusTrap).toHaveAttribute('data-active', 'false');

    // Elements should be focusable
    expect(input1).toBeVisible();
    expect(button1).toBeVisible();
    expect(input2).toBeVisible();
  });

  it('renders with default active state', () => {
    render(
      <FocusTrap>
        <div>
          <input data-testid="input1" />
          <button data-testid="button1">Button</button>
        </div>
      </FocusTrap>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    const input1 = screen.getByTestId('input1');
    const button1 = screen.getByTestId('button1');
    
    // Check that elements are rendered
    expect(input1).toBeInTheDocument();
    expect(button1).toBeInTheDocument();
    
    // Check that active prop defaults to true
    expect(focusTrap).toHaveAttribute('data-active', 'true');
    
    // Elements should be focusable
    expect(input1).toBeVisible();
    expect(button1).toBeVisible();
  });

  it('renders with inactive state', () => {
    render(
      <FocusTrap active={false}>
        <div>
          <input data-testid="input1" />
          <button data-testid="button1">Button</button>
        </div>
      </FocusTrap>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    const input1 = screen.getByTestId('input1');
    const button1 = screen.getByTestId('button1');

    // Check that elements are rendered
    expect(input1).toBeInTheDocument();
    expect(button1).toBeInTheDocument();
    
    // Check that active prop is false
    expect(focusTrap).toHaveAttribute('data-active', 'false');
    
    // Elements should be focusable
    expect(input1).toBeVisible();
    expect(button1).toBeVisible();
  });

  it('handles empty focus trap', () => {
    render(
      <FocusTrap active={false}>
        <div>No focusable elements</div>
      </FocusTrap>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    
    // Should not crash with no focusable elements
    expect(screen.getByText('No focusable elements')).toBeInTheDocument();
    expect(focusTrap).toHaveAttribute('data-active', 'false');
  });

  it('can be unmounted safely', () => {
    const { unmount } = render(
      <FocusTrap active={false}>
        <div>
          <input data-testid="input1" />
        </div>
      </FocusTrap>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    
    // Check that element is rendered
    expect(screen.getByTestId('input1')).toBeInTheDocument();
    expect(focusTrap).toHaveAttribute('data-active', 'false');

    // Test unmount doesn't crash
    expect(() => unmount()).not.toThrow();
  });
});