/**
 * @jest-environment jsdom
 */
import { 
  announceToScreenReader, 
  trapFocus, 
  getFirstFocusableElement, 
  getLastFocusableElement, 
  getAllFocusableElements 
} from '@/lib/accessibility';

describe('accessibility utilities', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    // Clean up any live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    liveRegions.forEach(region => region.remove());
  });

  describe('announceToScreenReader', () => {
    it('creates and announces polite messages', () => {
      announceToScreenReader('Test message');
      
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.textContent).toBe('Test message');
    });

    it('creates and announces assertive messages', () => {
      announceToScreenReader('Urgent message', 'assertive');
      
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.textContent).toBe('Urgent message');
    });

    it('reuses existing live region for same priority', () => {
      announceToScreenReader('First message');
      announceToScreenReader('Second message');
      
      const liveRegions = document.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions).toHaveLength(1);
      expect(liveRegions[0].textContent).toBe('Second message');
    });

    it('clears message after timeout', (done) => {
      announceToScreenReader('Temporary message');
      
      setTimeout(() => {
        const liveRegion = document.querySelector('[aria-live="polite"]');
        expect(liveRegion?.textContent).toBe('');
        done();
      }, 150);
    });
  });

  describe('getAllFocusableElements', () => {
    it('returns all focusable elements', () => {
      mockElement.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#test">Link</a>
        <div tabindex="0">Focusable div</div>
        <div>Non-focusable div</div>
        <button disabled>Disabled button</button>
      `;

      const focusableElements = getAllFocusableElements(mockElement);
      expect(focusableElements).toHaveLength(4);
      expect(focusableElements[0].tagName).toBe('BUTTON');
      expect(focusableElements[1].tagName).toBe('INPUT');
      expect(focusableElements[2].tagName).toBe('A');
      expect(focusableElements[3].tagName).toBe('DIV');
    });

    it('returns empty array when no focusable elements', () => {
      mockElement.innerHTML = `
        <div>Non-focusable</div>
        <span>Also non-focusable</span>
      `;

      const focusableElements = getAllFocusableElements(mockElement);
      expect(focusableElements).toHaveLength(0);
    });
  });

  describe('getFirstFocusableElement', () => {
    it('returns the first focusable element', () => {
      mockElement.innerHTML = `
        <div>Non-focusable</div>
        <button>First button</button>
        <input type="text" />
        <button>Second button</button>
      `;

      const firstFocusable = getFirstFocusableElement(mockElement);
      expect(firstFocusable?.tagName).toBe('BUTTON');
      expect(firstFocusable?.textContent).toBe('First button');
    });

    it('returns null when no focusable elements', () => {
      mockElement.innerHTML = `<div>Non-focusable</div>`;

      const firstFocusable = getFirstFocusableElement(mockElement);
      expect(firstFocusable).toBeNull();
    });
  });

  describe('getLastFocusableElement', () => {
    it('returns the last focusable element', () => {
      mockElement.innerHTML = `
        <button>First button</button>
        <input type="text" />
        <button>Last button</button>
        <div>Non-focusable</div>
      `;

      const lastFocusable = getLastFocusableElement(mockElement);
      expect(lastFocusable?.tagName).toBe('BUTTON');
      expect(lastFocusable?.textContent).toBe('Last button');
    });

    it('returns null when no focusable elements', () => {
      mockElement.innerHTML = `<div>Non-focusable</div>`;

      const lastFocusable = getLastFocusableElement(mockElement);
      expect(lastFocusable).toBeNull();
    });
  });

  describe('trapFocus', () => {
    it('prevents focus from leaving the container', () => {
      mockElement.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

      const btn1 = document.getElementById('btn1') as HTMLButtonElement;
      const btn2 = document.getElementById('btn2') as HTMLButtonElement;
      const btn3 = document.getElementById('btn3') as HTMLButtonElement;

      const cleanup = trapFocus(mockElement);

      // Focus first button
      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      // Simulate Tab key on last button
      btn3.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      mockElement.dispatchEvent(tabEvent);

      // Should wrap to first button
      expect(document.activeElement).toBe(btn1);

      // Clean up event listeners
      cleanup();
    });

    it('handles Shift+Tab for reverse navigation', () => {
      mockElement.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

      const btn1 = document.getElementById('btn1') as HTMLButtonElement;
      const btn3 = document.getElementById('btn3') as HTMLButtonElement;

      const cleanup = trapFocus(mockElement);

      // Focus first button
      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      // Simulate Shift+Tab key on first button
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      mockElement.dispatchEvent(shiftTabEvent);

      // Should wrap to last button
      expect(document.activeElement).toBe(btn3);

      // Clean up event listeners
      cleanup();
    });

    it('returns cleanup function', () => {
      const cleanup = trapFocus(mockElement);
      expect(typeof cleanup).toBe('function');
      
      // Should not throw when called
      expect(() => cleanup()).not.toThrow();
    });
  });
});