import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibleButton } from '@/components/accessibility/AccessibleButton';
import { AccessibleInput, AccessibleTextarea, AccessibleSelect } from '@/components/accessibility/AccessibleForm';
import { SkipToContent } from '@/components/accessibility/SkipToContent';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('AccessibleButton', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton ariaLabel="Click me">
          Click Me
        </AccessibleButton>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when loading', async () => {
      const { container } = render(
        <AccessibleButton loading loadingText="Processing...">
          Submit
        </AccessibleButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-pressed state', async () => {
      const { container } = render(
        <AccessibleButton ariaPressed={true}>
          Toggle
        </AccessibleButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AccessibleInput', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleInput 
          label="Email Address" 
          type="email"
          required
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly associate error messages', async () => {
      const { container } = render(
        <AccessibleInput 
          label="Username" 
          error="Username is required"
          required
        />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      
      const errorId = input?.getAttribute('aria-describedby');
      const errorElement = container.querySelector(`#${errorId}`);
      expect(errorElement).toHaveTextContent('Username is required');
      expect(errorElement).toHaveAttribute('role', 'alert');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should associate hint text properly', async () => {
      const { container } = render(
        <AccessibleInput 
          label="Password" 
          hint="Must be at least 8 characters"
          type="password"
        />
      );
      
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-describedby');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AccessibleSelect', () => {
    const options = [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
      { value: 'fr', label: 'French' }
    ];

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleSelect 
          label="Language" 
          options={options}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly label the select element', async () => {
      const { container } = render(
        <AccessibleSelect 
          label="Choose Language" 
          options={options}
          required
        />
      );
      
      const select = container.querySelector('select');
      const label = container.querySelector('label');
      
      expect(label).toHaveAttribute('for', select?.getAttribute('id'));
      expect(select).toHaveAttribute('aria-required', 'true');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SkipToContent', () => {
    it('should not have accessibility violations', async () => {
      // Mock the translation hook
      jest.mock('@/hooks/useTranslation', () => ({
        useTranslation: () => ({
          t: (key: string) => key === 'skipToContent' ? 'Skip to main content' : key
        })
      }));

      const { container } = render(<SkipToContent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper link structure', () => {
      const { container } = render(<SkipToContent />);
      const link = container.querySelector('a');
      
      expect(link).toHaveAttribute('href', '#main-content');
      expect(link).toHaveClass('sr-only');
      expect(link).toHaveClass('focus:not-sr-only');
    });
  });

  describe('Form with multiple fields', () => {
    it('should not have accessibility violations for complete form', async () => {
      const { container } = render(
        <form>
          <AccessibleInput 
            label="Full Name" 
            required
          />
          <AccessibleInput 
            label="Email" 
            type="email"
            required
            error="Please enter a valid email"
          />
          <AccessibleTextarea 
            label="Comments" 
            hint="Optional feedback"
          />
          <AccessibleSelect 
            label="Country" 
            options={[
              { value: 'us', label: 'United States' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'ca', label: 'Canada' }
            ]}
            required
          />
          <AccessibleButton type="submit">
            Submit Form
          </AccessibleButton>
        </form>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});