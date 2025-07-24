import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '@/components/design-system/Button';

// Mock icons for consistent snapshots
const MockIcon = () => <span>🔧</span>;

describe('Button Snapshots', () => {
  describe('Button Variants', () => {
    it('should render primary button', () => {
      const { container } = render(<Button variant="primary">Primary Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render secondary button', () => {
      const { container } = render(<Button variant="secondary">Secondary Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render ghost button', () => {
      const { container } = render(<Button variant="ghost">Ghost Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render glass button', () => {
      const { container } = render(<Button variant="glass">Glass Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render fresh button', () => {
      const { container } = render(<Button variant="fresh">Fresh Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render warm button', () => {
      const { container } = render(<Button variant="warm">Warm Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render rich button', () => {
      const { container } = render(<Button variant="rich">Rich Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render golden button', () => {
      const { container } = render(<Button variant="golden">Golden Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Button Sizes', () => {
    it('should render small button', () => {
      const { container } = render(<Button size="sm">Small Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render medium button', () => {
      const { container } = render(<Button size="md">Medium Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render large button', () => {
      const { container } = render(<Button size="lg">Large Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render extra large button', () => {
      const { container } = render(<Button size="xl">Extra Large Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Button States', () => {
    it('should render loading button', () => {
      const { container } = render(<Button loading>Loading Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render disabled button', () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render full width button', () => {
      const { container } = render(<Button fullWidth>Full Width Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render button with glow effect', () => {
      const { container } = render(<Button glow>Glow Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Button with Icons', () => {
    it('should render button with left icon', () => {
      const { container } = render(
        <Button leftIcon={<MockIcon />}>Button with Left Icon</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render button with right icon', () => {
      const { container } = render(
        <Button rightIcon={<MockIcon />}>Button with Right Icon</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render button with both icons', () => {
      const { container } = render(
        <Button leftIcon={<MockIcon />} rightIcon={<MockIcon />}>
          Button with Both Icons
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Button Complex Combinations', () => {
    it('should render large glass button with glow and left icon', () => {
      const { container } = render(
        <Button variant="glass" size="lg" glow leftIcon={<MockIcon />}>
          Complex Button
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render full width loading button', () => {
      const { container } = render(
        <Button loading fullWidth variant="primary">
          Full Width Loading Button
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render disabled fresh button with icons', () => {
      const { container } = render(
        <Button disabled variant="fresh" leftIcon={<MockIcon />} rightIcon={<MockIcon />}>
          Disabled Fresh Button
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render small warm button with glow', () => {
      const { container } = render(
        <Button variant="warm" size="sm" glow>
          Small Warm Glow
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Button Custom Props', () => {
    it('should render button with custom className', () => {
      const { container } = render(
        <Button className="custom-class">Custom Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render button with custom attributes', () => {
      const { container } = render(
        <Button data-testid="custom-button" aria-label="Custom Button">
          Custom Attributes
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});