/**
 * Accessibility utility functions
 */

// Generate unique IDs for ARIA relationships
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

// Check if user prefers high contrast
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  return mediaQuery.matches;
}

// Get user's preferred color scheme
export function getPreferredColorScheme(): 'light' | 'dark' | 'no-preference' {
  if (typeof window === 'undefined') return 'no-preference';
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'no-preference';
}

// Trap focus within an element
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
  );
  
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstFocusableElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Announce message to screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Alias for announce function (for backward compatibility)
export const announceToScreenReader = announce;

// Format time for screen readers
export function formatTimeForScreenReader(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

// Create ARIA description from multiple sources
export function createAriaDescription(...descriptions: (string | undefined)[]): string | undefined {
  const filtered = descriptions.filter(Boolean);
  return filtered.length > 0 ? filtered.join('. ') : undefined;
}

// Check if element is visible
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

// Get focusable elements within a container
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll(
    'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
  );
  
  return Array.from(elements).filter(el => isElementVisible(el as HTMLElement)) as HTMLElement[];
}

// Get first focusable element
export function getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[0] : null;
}

// Get last focusable element
export function getLastFocusableElement(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[elements.length - 1] : null;
}

// Alias for getFocusableElements (for backward compatibility)
export const getAllFocusableElements = getFocusableElements;