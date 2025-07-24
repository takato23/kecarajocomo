import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock getComputedStyle
window.getComputedStyle = vi.fn().mockReturnValue({
  getPropertyValue: vi.fn().mockReturnValue(''),
  setProperty: vi.fn(),
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
}));

// Mock fetch for any API calls
global.fetch = vi.fn();

// Suppress console errors/warnings in tests unless explicitly needed
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Add custom matchers for landing page specific assertions
expect.extend({
  toHaveGradientClass(received, expected) {
    const hasGradient = received.className.includes('bg-gradient');
    return {
      message: () => `expected ${received} to have gradient class`,
      pass: hasGradient
    };
  },
  
  toHaveGlassEffect(received) {
    const hasBlur = received.className.includes('backdrop-blur');
    const hasTransparency = received.className.includes('bg-white/') || received.className.includes('bg-black/');
    return {
      message: () => `expected ${received} to have glass morphism effect`,
      pass: hasBlur && hasTransparency
    };
  },
  
  toBeResponsive(received) {
    const hasResponsiveClasses = /\b(sm:|md:|lg:|xl:|2xl:)/.test(received.className);
    return {
      message: () => `expected ${received} to have responsive classes`,
      pass: hasResponsiveClasses
    };
  }
});

// TypeScript declarations for custom matchers
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toHaveGradientClass(expected: string): T;
      toHaveGlassEffect(): T;
      toBeResponsive(): T;
    }
  }
}