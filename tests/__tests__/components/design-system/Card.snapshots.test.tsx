import React from 'react';
import { render } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system/Card';

// Mock components for consistent snapshots
const MockButton = () => <button>Action</button>;
const MockContent = () => <div>Sample content</div>;

describe('Card Snapshots', () => {
  describe('Card Variants', () => {
    it('should render default card', () => {
      const { container } = render(
        <Card>
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render glass card', () => {
      const { container } = render(
        <Card variant="glass">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render glass interactive card', () => {
      const { container } = render(
        <Card variant="glass-interactive">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render fresh card', () => {
      const { container } = render(
        <Card variant="fresh">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render warm card', () => {
      const { container } = render(
        <Card variant="warm">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render rich card', () => {
      const { container } = render(
        <Card variant="rich">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render golden card', () => {
      const { container } = render(
        <Card variant="golden">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Card Padding', () => {
    it('should render card with no padding', () => {
      const { container } = render(
        <Card padding="none">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card with small padding', () => {
      const { container } = render(
        <Card padding="sm">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card with medium padding', () => {
      const { container } = render(
        <Card padding="md">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card with large padding', () => {
      const { container } = render(
        <Card padding="lg">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card with extra large padding', () => {
      const { container } = render(
        <Card padding="xl">
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Card States', () => {
    it('should render card with hover effects', () => {
      const { container } = render(
        <Card hover>
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card with glow effect', () => {
      const { container } = render(
        <Card glow>
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card without blur', () => {
      const { container } = render(
        <Card blur={false}>
          <MockContent />
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('CardHeader Snapshots', () => {
    it('should render card header with title', () => {
      const { container } = render(
        <CardHeader title="Card Title" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card header with title and subtitle', () => {
      const { container } = render(
        <CardHeader title="Card Title" subtitle="Card subtitle" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card header with action', () => {
      const { container } = render(
        <CardHeader title="Card Title" action={<MockButton />} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card header with all props', () => {
      const { container } = render(
        <CardHeader 
          title="Card Title" 
          subtitle="Card subtitle" 
          action={<MockButton />} 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card header with custom children', () => {
      const { container } = render(
        <CardHeader>
          <div>Custom header content</div>
        </CardHeader>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('CardBody Snapshots', () => {
    it('should render card body with text content', () => {
      const { container } = render(
        <CardBody>
          <p>This is card body content</p>
        </CardBody>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card body with custom className', () => {
      const { container } = render(
        <CardBody className="custom-body">
          <p>Custom styled body</p>
        </CardBody>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('CardFooter Snapshots', () => {
    it('should render card footer with default justify', () => {
      const { container } = render(
        <CardFooter>
          <MockButton />
        </CardFooter>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card footer with start justify', () => {
      const { container } = render(
        <CardFooter justify="start">
          <MockButton />
        </CardFooter>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card footer with center justify', () => {
      const { container } = render(
        <CardFooter justify="center">
          <MockButton />
        </CardFooter>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render card footer with between justify', () => {
      const { container } = render(
        <CardFooter justify="between">
          <MockButton />
          <MockButton />
        </CardFooter>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Complete Card Snapshots', () => {
    it('should render complete card with all components', () => {
      const { container } = render(
        <Card variant="glass" padding="lg" hover glow>
          <CardHeader 
            title="Complete Card" 
            subtitle="This is a complete card example" 
            action={<MockButton />}
          />
          <CardBody>
            <p>This is the main content of the card. It can contain any content.</p>
            <MockContent />
          </CardBody>
          <CardFooter justify="between">
            <MockButton />
            <MockButton />
          </CardFooter>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render fresh card with simple content', () => {
      const { container } = render(
        <Card variant="fresh" padding="md">
          <CardHeader title="Fresh Card" />
          <CardBody>
            <p>Fresh card content</p>
          </CardBody>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render interactive card with hover', () => {
      const { container } = render(
        <Card variant="glass-interactive" hover>
          <CardHeader title="Interactive Card" />
          <CardBody>
            <p>Click me!</p>
          </CardBody>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});