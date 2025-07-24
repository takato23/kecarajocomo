/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/design-system/Card';

describe('Card Component', () => {
  it('renders card with content', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Card variant="outline">Outline card</Card>);
    const card = screen.getByText('Outline card').closest('div');
    expect(card).toHaveClass('border');
  });

  it('applies size styles', () => {
    render(<Card size="lg">Large card</Card>);
    const card = screen.getByText('Large card').closest('div');
    expect(card).toHaveClass('p-6');
  });

  it('can be hoverable', () => {
    render(<Card hoverable>Hoverable card</Card>);
    const card = screen.getByText('Hoverable card').closest('div');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('accepts custom className', () => {
    render(<Card className="custom-class">Custom card</Card>);
    const card = screen.getByText('Custom card').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  it('renders with header and footer', () => {
    render(
      <Card 
        header={<div>Header</div>} 
        footer={<div>Footer</div>}
      >
        Content
      </Card>
    );
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});