import React from 'react';
import { render } from '@testing-library/react';
import { FocusTrap } from '@/components/accessibility/FocusTrap';

// Mock the focus-trap-react library
jest.mock('focus-trap-react', () => {
  return function MockFocusTrap({ children, active, paused, focusTrapOptions }: any) {
    return (
      <div 
        data-testid="focus-trap"
        data-active={active}
        data-paused={paused}
        data-escape-deactivates={focusTrapOptions?.escapeDeactivates}
        data-click-outside-deactivates={focusTrapOptions?.clickOutsideDeactivates}
        data-return-focus-on-deactivate={focusTrapOptions?.returnFocusOnDeactivate}
        data-allow-outside-click={focusTrapOptions?.allowOutsideClick}
        data-initial-focus={focusTrapOptions?.initialFocus}
        data-fallback-focus={focusTrapOptions?.fallbackFocus}
      >
        {children}
      </div>
    );
  };
});

describe('FocusTrap Snapshots', () => {
  const MockContent = ({ title }: { title: string }) => (
    <div className="mock-content">
      <h2>{title}</h2>
      <button>Button 1</button>
      <input type="text" placeholder="Text input" />
      <button>Button 2</button>
    </div>
  );

  describe('Basic FocusTrap', () => {
    it('should render basic focus trap with default props', () => {
      const { container } = render(
        <FocusTrap>
          <MockContent title="Basic Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render active focus trap', () => {
      const { container } = render(
        <FocusTrap active={true}>
          <MockContent title="Active Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render inactive focus trap', () => {
      const { container } = render(
        <FocusTrap active={false}>
          <MockContent title="Inactive Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('FocusTrap States', () => {
    it('should render paused focus trap', () => {
      const { container } = render(
        <FocusTrap paused={true}>
          <MockContent title="Paused Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render active but paused focus trap', () => {
      const { container } = render(
        <FocusTrap active={true} paused={true}>
          <MockContent title="Active but Paused Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render inactive and paused focus trap', () => {
      const { container } = render(
        <FocusTrap active={false} paused={true}>
          <MockContent title="Inactive and Paused Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('FocusTrap with Callbacks', () => {
    it('should render focus trap with onDeactivate callback', () => {
      const { container } = render(
        <FocusTrap onDeactivate={() => {}}>
          <MockContent title="Focus Trap with Callback" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with all callbacks', () => {
      const { container } = render(
        <FocusTrap 
          onDeactivate={() => {}}
          active={true}
          paused={false}
        >
          <MockContent title="Focus Trap with All Callbacks" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('FocusTrap with Focus Options', () => {
    it('should render focus trap with initialFocus selector', () => {
      const { container } = render(
        <FocusTrap initialFocus="#initial-focus">
          <MockContent title="Initial Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with fallbackFocus selector', () => {
      const { container } = render(
        <FocusTrap fallbackFocus="#fallback-focus">
          <MockContent title="Fallback Focus Trap" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with both focus selectors', () => {
      const { container } = render(
        <FocusTrap 
          initialFocus="#initial-focus"
          fallbackFocus="#fallback-focus"
        >
          <MockContent title="Both Focus Selectors" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with disabled initialFocus', () => {
      const { container } = render(
        <FocusTrap initialFocus={false}>
          <MockContent title="Disabled Initial Focus" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('FocusTrap with Deactivation Options', () => {
    it('should render focus trap with escape deactivation disabled', () => {
      const { container } = render(
        <FocusTrap escapeDeactivates={false}>
          <MockContent title="No Escape Deactivation" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with click outside deactivation disabled', () => {
      const { container } = render(
        <FocusTrap clickOutsideDeactivates={false}>
          <MockContent title="No Click Outside Deactivation" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with all deactivation options disabled', () => {
      const { container } = render(
        <FocusTrap 
          escapeDeactivates={false}
          clickOutsideDeactivates={false}
        >
          <MockContent title="All Deactivation Disabled" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('FocusTrap Complex Configurations', () => {
    it('should render focus trap with complete configuration', () => {
      const { container } = render(
        <FocusTrap
          active={true}
          paused={false}
          onDeactivate={() => {}}
          initialFocus="#start-here"
          fallbackFocus="#fallback-here"
          escapeDeactivates={true}
          clickOutsideDeactivates={true}
        >
          <MockContent title="Complete Configuration" />
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap for modal-like usage', () => {
      const { container } = render(
        <FocusTrap
          active={true}
          paused={false}
          onDeactivate={() => {}}
          initialFocus="#modal-close"
          escapeDeactivates={true}
          clickOutsideDeactivates={true}
        >
          <div className="modal">
            <h2>Modal Title</h2>
            <p>Modal content</p>
            <button id="modal-close">Close</button>
            <button>Save</button>
          </div>
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap for form-like usage', () => {
      const { container } = render(
        <FocusTrap
          active={true}
          initialFocus="#first-field"
          fallbackFocus="#submit-button"
          escapeDeactivates={false}
          clickOutsideDeactivates={false}
        >
          <form>
            <input id="first-field" type="text" placeholder="First field" />
            <input type="text" placeholder="Second field" />
            <button id="submit-button" type="submit">Submit</button>
          </form>
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('FocusTrap with Different Content', () => {
    it('should render focus trap with simple text content', () => {
      const { container } = render(
        <FocusTrap>
          <p>Simple text content inside focus trap</p>
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with complex nested content', () => {
      const { container } = render(
        <FocusTrap>
          <div className="complex-content">
            <header>
              <h1>Complex Content</h1>
              <nav>
                <a href="#section1">Section 1</a>
                <a href="#section2">Section 2</a>
              </nav>
            </header>
            <main>
              <section id="section1">
                <h2>Section 1</h2>
                <button>Action 1</button>
                <input type="text" placeholder="Input 1" />
              </section>
              <section id="section2">
                <h2>Section 2</h2>
                <button>Action 2</button>
                <input type="text" placeholder="Input 2" />
              </section>
            </main>
          </div>
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render focus trap with no focusable elements', () => {
      const { container } = render(
        <FocusTrap>
          <div>
            <p>No focusable elements here</p>
            <span>Just text content</span>
          </div>
        </FocusTrap>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});