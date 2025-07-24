import React from 'react';
import { render } from '@testing-library/react';
import { Input } from '@/components/design-system/Input';

// Mock icons for consistent snapshots
const MockIcon = () => <span>🔍</span>;

describe('Input Snapshots', () => {
  describe('Input Variants', () => {
    it('should render default input', () => {
      const { container } = render(<Input placeholder="Default input" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render glass input', () => {
      const { container } = render(<Input variant="glass" placeholder="Glass input" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render fresh input', () => {
      const { container } = render(<Input variant="fresh" placeholder="Fresh input" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render warm input', () => {
      const { container } = render(<Input variant="warm" placeholder="Warm input" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input Sizes', () => {
    it('should render small input', () => {
      const { container } = render(<Input inputSize="sm" placeholder="Small input" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render medium input', () => {
      const { container } = render(<Input inputSize="md" placeholder="Medium input" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render large input', () => {
      const { container } = render(<Input inputSize="lg" placeholder="Large input" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input with Label', () => {
    it('should render input with label', () => {
      const { container } = render(
        <Input label="Input Label" placeholder="Enter text" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with label and helper text', () => {
      const { container } = render(
        <Input 
          label="Input Label" 
          helper="This is helper text" 
          placeholder="Enter text" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input States', () => {
    it('should render disabled input', () => {
      const { container } = render(
        <Input disabled placeholder="Disabled input" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with error', () => {
      const { container } = render(
        <Input error="This field is required" placeholder="Error input" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render invalid input', () => {
      const { container } = render(
        <Input isInvalid placeholder="Invalid input" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with error and label', () => {
      const { container } = render(
        <Input 
          label="Required Field" 
          error="This field is required" 
          placeholder="Enter text" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input with Icons', () => {
    it('should render input with left icon', () => {
      const { container } = render(
        <Input leftIcon={<MockIcon />} placeholder="Search..." />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with right icon', () => {
      const { container } = render(
        <Input rightIcon={<MockIcon />} placeholder="Enter text" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with both icons', () => {
      const { container } = render(
        <Input 
          leftIcon={<MockIcon />} 
          rightIcon={<MockIcon />} 
          placeholder="Both icons" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input with Addons', () => {
    it('should render input with left addon', () => {
      const { container } = render(
        <Input leftAddon="https://" placeholder="website.com" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with right addon', () => {
      const { container } = render(
        <Input rightAddon=".com" placeholder="website" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with both addons', () => {
      const { container } = render(
        <Input 
          leftAddon="https://" 
          rightAddon=".com" 
          placeholder="website" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input Types', () => {
    it('should render password input', () => {
      const { container } = render(
        <Input type="password" placeholder="Enter password" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render email input', () => {
      const { container } = render(
        <Input type="email" placeholder="Enter email" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render number input', () => {
      const { container } = render(
        <Input type="number" placeholder="Enter number" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render search input', () => {
      const { container } = render(
        <Input type="search" placeholder="Search..." />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input Complex Combinations', () => {
    it('should render large glass input with label, icon, and helper', () => {
      const { container } = render(
        <Input 
          variant="glass" 
          inputSize="lg" 
          label="Search Query" 
          leftIcon={<MockIcon />} 
          helper="Enter your search terms" 
          placeholder="Search..." 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render fresh input with error and right icon', () => {
      const { container } = render(
        <Input 
          variant="fresh" 
          rightIcon={<MockIcon />} 
          error="Invalid input format" 
          placeholder="Enter valid data" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render warm input with both addons and disabled state', () => {
      const { container } = render(
        <Input 
          variant="warm" 
          disabled 
          leftAddon="$" 
          rightAddon=".00" 
          placeholder="0" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render complete form input with all features', () => {
      const { container } = render(
        <Input 
          label="Complete Input" 
          variant="glass" 
          inputSize="md" 
          leftIcon={<MockIcon />} 
          rightIcon={<MockIcon />} 
          helper="This is a complete input example" 
          placeholder="Enter text here" 
          containerClassName="custom-container"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input Custom Props', () => {
    it('should render input with custom className', () => {
      const { container } = render(
        <Input className="custom-input" placeholder="Custom input" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with custom container className', () => {
      const { container } = render(
        <Input 
          containerClassName="custom-container" 
          placeholder="Custom container" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render input with custom attributes', () => {
      const { container } = render(
        <Input 
          id="custom-input" 
          name="customInput" 
          data-testid="custom-input" 
          placeholder="Custom attributes" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});