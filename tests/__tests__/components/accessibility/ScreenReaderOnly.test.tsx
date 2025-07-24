/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';

describe('ScreenReaderOnly Component', () => {
  it('renders content that is visually hidden', () => {
    render(<ScreenReaderOnly>Screen reader text</ScreenReaderOnly>);
    
    const element = screen.getByText('Screen reader text');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('sr-only');
  });

  it('accepts custom className', () => {
    render(
      <ScreenReaderOnly className="custom-class">
        Text
      </ScreenReaderOnly>
    );
    
    const element = screen.getByText('Text');
    expect(element).toHaveClass('sr-only', 'custom-class');
  });

  it('renders as different elements', () => {
    render(<ScreenReaderOnly as="span">Span text</ScreenReaderOnly>);
    
    const element = screen.getByText('Span text');
    expect(element.tagName).toBe('SPAN');
  });

  it('forwards additional props', () => {
    render(
      <ScreenReaderOnly data-testid="sr-only">
        Test
      </ScreenReaderOnly>
    );
    
    expect(screen.getByTestId('sr-only')).toBeInTheDocument();
  });
});