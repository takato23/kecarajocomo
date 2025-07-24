import React from 'react';
import { render } from '@testing-library/react';
import { LiveRegion } from '@/components/accessibility/LiveRegion';

// Mock setTimeout for consistent snapshots
global.setTimeout = jest.fn((fn: () => void) => {
  fn();
}) as any;

describe('LiveRegion Snapshots', () => {
  describe('Basic LiveRegion', () => {
    it('should render basic live region with message', () => {
      const { container } = render(
        <LiveRegion message="Hello screen readers" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render empty live region with no message', () => {
      const { container } = render(
        <LiveRegion message="" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion Politeness Levels', () => {
    it('should render polite live region', () => {
      const { container } = render(
        <LiveRegion message="Polite announcement" politeness="polite" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render assertive live region', () => {
      const { container } = render(
        <LiveRegion message="Assertive announcement" politeness="assertive" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with default politeness', () => {
      const { container } = render(
        <LiveRegion message="Default politeness announcement" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion Clear Options', () => {
    it('should render live region with clearOnUnmount enabled', () => {
      const { container } = render(
        <LiveRegion 
          message="Clear on unmount enabled" 
          clearOnUnmount={true} 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with clearOnUnmount disabled', () => {
      const { container } = render(
        <LiveRegion 
          message="Clear on unmount disabled" 
          clearOnUnmount={false} 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with default clearOnUnmount', () => {
      const { container } = render(
        <LiveRegion message="Default clear on unmount" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion with Different Message Types', () => {
    it('should render live region with success message', () => {
      const { container } = render(
        <LiveRegion 
          message="Success: Your data has been saved successfully" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with error message', () => {
      const { container } = render(
        <LiveRegion 
          message="Error: Unable to save your data. Please try again." 
          politeness="assertive" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with warning message', () => {
      const { container } = render(
        <LiveRegion 
          message="Warning: This action cannot be undone" 
          politeness="assertive" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with info message', () => {
      const { container } = render(
        <LiveRegion 
          message="Info: 5 items remaining in your cart" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion with Loading States', () => {
    it('should render live region with loading message', () => {
      const { container } = render(
        <LiveRegion 
          message="Loading your data, please wait..." 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with progress message', () => {
      const { container } = render(
        <LiveRegion 
          message="Progress: 75% complete" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with completion message', () => {
      const { container } = render(
        <LiveRegion 
          message="Task completed successfully" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion with Form-related Messages', () => {
    it('should render live region with form validation message', () => {
      const { container } = render(
        <LiveRegion 
          message="Please enter a valid email address" 
          politeness="assertive" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with form submission message', () => {
      const { container } = render(
        <LiveRegion 
          message="Form submitted successfully" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with field help message', () => {
      const { container } = render(
        <LiveRegion 
          message="Password must be at least 8 characters long" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion with Navigation Messages', () => {
    it('should render live region with page navigation message', () => {
      const { container } = render(
        <LiveRegion 
          message="Navigated to Dashboard page" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with content update message', () => {
      const { container } = render(
        <LiveRegion 
          message="Content updated: 3 new items added" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with search results message', () => {
      const { container } = render(
        <LiveRegion 
          message="Search completed: 12 results found" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion with Complex Messages', () => {
    it('should render live region with multi-line message', () => {
      const { container } = render(
        <LiveRegion 
          message="Recipe saved successfully. You can find it in your recipe collection. Share it with friends or make it again later." 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with numbered list message', () => {
      const { container } = render(
        <LiveRegion 
          message="3 errors found: 1. Name is required. 2. Email is invalid. 3. Password is too short." 
          politeness="assertive" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with dynamic content message', () => {
      const { container } = render(
        <LiveRegion 
          message="Cart updated: 2 items, total $45.99" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion with Special Characters', () => {
    it('should render live region with special characters', () => {
      const { container } = render(
        <LiveRegion 
          message="Price: $29.99 (was $39.99) - 25% off!" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with unicode characters', () => {
      const { container } = render(
        <LiveRegion 
          message="Recipe saved: Crème brûlée with café notes ✨" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with HTML entities', () => {
      const { container } = render(
        <LiveRegion 
          message="Data imported: 5 recipes & 12 ingredients" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('LiveRegion Edge Cases', () => {
    it('should render live region with very long message', () => {
      const { container } = render(
        <LiveRegion 
          message="This is a very long message that contains a lot of information and might be used to test how the live region handles lengthy announcements that could potentially be truncated or cause performance issues in screen readers but should still be announced properly to users who rely on assistive technologies."
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with whitespace message', () => {
      const { container } = render(
        <LiveRegion 
          message="   Message with whitespace   " 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render live region with single character message', () => {
      const { container } = render(
        <LiveRegion 
          message="✓" 
          politeness="polite" 
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});