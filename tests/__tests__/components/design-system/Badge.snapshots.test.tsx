import React from 'react';
import { render } from '@testing-library/react';
import { Badge } from '@/components/design-system/Badge';

// Mock icons for consistent snapshots
const MockIcon = () => <span>⭐</span>;

describe('Badge Snapshots', () => {
  describe('Badge Variants', () => {
    it('should render default badge', () => {
      const { container } = render(<Badge>Default</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render fresh badge', () => {
      const { container } = render(<Badge variant="fresh">Fresh</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render warm badge', () => {
      const { container } = render(<Badge variant="warm">Warm</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render rich badge', () => {
      const { container } = render(<Badge variant="rich">Rich</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render golden badge', () => {
      const { container } = render(<Badge variant="golden">Golden</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render neutral badge', () => {
      const { container } = render(<Badge variant="neutral">Neutral</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render success badge', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render warning badge', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render error badge', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render info badge', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Outline Variants', () => {
    it('should render outline default badge', () => {
      const { container } = render(<Badge outline>Outline Default</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render outline fresh badge', () => {
      const { container } = render(<Badge variant="fresh" outline>Outline Fresh</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render outline success badge', () => {
      const { container } = render(<Badge variant="success" outline>Outline Success</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render outline error badge', () => {
      const { container } = render(<Badge variant="error" outline>Outline Error</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Sizes', () => {
    it('should render small badge', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render medium badge', () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render large badge', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Shapes', () => {
    it('should render default rounded badge', () => {
      const { container } = render(<Badge>Default Shape</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render pill badge', () => {
      const { container } = render(<Badge pill>Pill Shape</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge with Icons', () => {
    it('should render badge with left icon', () => {
      const { container } = render(
        <Badge leftIcon={<MockIcon />}>Left Icon</Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render badge with right icon', () => {
      const { container } = render(
        <Badge rightIcon={<MockIcon />}>Right Icon</Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render badge with both icons', () => {
      const { container } = render(
        <Badge leftIcon={<MockIcon />} rightIcon={<MockIcon />}>
          Both Icons
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Removable', () => {
    it('should render removable badge', () => {
      const { container } = render(
        <Badge removable onRemove={() => {}}>Removable</Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render removable badge with left icon', () => {
      const { container } = render(
        <Badge leftIcon={<MockIcon />} removable onRemove={() => {}}>
          Removable with Icon
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render removable pill badge', () => {
      const { container } = render(
        <Badge pill removable onRemove={() => {}}>
          Removable Pill
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Complex Combinations', () => {
    it('should render large fresh pill badge with icon', () => {
      const { container } = render(
        <Badge variant="fresh" size="lg" pill leftIcon={<MockIcon />}>
          Fresh Pill
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render outline warning badge with both icons', () => {
      const { container } = render(
        <Badge 
          variant="warning" 
          outline 
          leftIcon={<MockIcon />} 
          rightIcon={<MockIcon />}
        >
          Warning Badge
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render small removable success badge', () => {
      const { container } = render(
        <Badge 
          variant="success" 
          size="sm" 
          removable 
          onRemove={() => {}}
        >
          Success
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render large outline golden pill badge with left icon', () => {
      const { container } = render(
        <Badge 
          variant="golden" 
          size="lg" 
          outline 
          pill 
          leftIcon={<MockIcon />}
        >
          Golden Pill
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render rich removable badge with left icon', () => {
      const { container } = render(
        <Badge 
          variant="rich" 
          leftIcon={<MockIcon />} 
          removable 
          onRemove={() => {}}
        >
          Rich Removable
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Custom Props', () => {
    it('should render badge with custom className', () => {
      const { container } = render(
        <Badge className="custom-badge">Custom Badge</Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render badge with custom attributes', () => {
      const { container } = render(
        <Badge data-testid="custom-badge" aria-label="Custom Badge">
          Custom Attributes
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Status Examples', () => {
    it('should render status badges collection', () => {
      const { container } = render(
        <div className="flex gap-2">
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Inactive</Badge>
          <Badge variant="info">Draft</Badge>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render food category badges', () => {
      const { container } = render(
        <div className="flex gap-2">
          <Badge variant="fresh">Fresh</Badge>
          <Badge variant="warm">Warm</Badge>
          <Badge variant="rich">Rich</Badge>
          <Badge variant="golden">Golden</Badge>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});