/**
 * Design System Tokens - KeCarajoComer
 * 
 * Central export for all design tokens
 * Import from here to use tokens in components
 */

// Re-export all token modules
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './effects';

// Import all tokens for combined export
import { colors, colorAliases } from './colors';
import { typography, typographyStyles } from './typography';
import { spacing, layoutSpacing, containerWidth, zIndex } from './spacing';
import { effects, glassEffects } from './effects';

// Combined tokens object (maintains compatibility with existing theme.ts)
export const tokens = {
  colors,
  colorAliases,
  typography,
  typographyStyles,
  spacing,
  layoutSpacing,
  containerWidth,
  zIndex,
  effects,
  glassEffects,
} as const;

// Utility functions
export const utils = {
  // Convert rem to px
  remToPx: (rem: string): number => {
    const value = parseFloat(rem);
    return value * 16; // Assuming 16px base font size
  },

  // Convert px to rem
  pxToRem: (px: number): string => {
    return `${px / 16}rem`;
  },

  // Get nested color value
  getColor: (path: string): string => {
    const keys = path.split('.');
    let value: any = colors;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value || '';
  },

  // Create CSS variables from tokens
  createCSSVariables: (prefix = '--ds') => {
    const variables: Record<string, string> = {};
    
    // Colors
    Object.entries(colors.brand).forEach(([key, value]) => {
      variables[`${prefix}-color-brand-${key}`] = value;
    });
    
    Object.entries(colors.neutral).forEach(([key, value]) => {
      variables[`${prefix}-color-neutral-${key}`] = value;
    });
    
    Object.entries(colors.semantic).forEach(([key, value]) => {
      variables[`${prefix}-color-${key}`] = value;
    });
    
    // Spacing
    Object.entries(spacing).forEach(([key, value]) => {
      variables[`${prefix}-spacing-${key}`] = value;
    });
    
    // Border radius
    Object.entries(effects.borderRadius).forEach(([key, value]) => {
      variables[`${prefix}-radius-${key}`] = value;
    });
    
    // Shadows
    Object.entries(effects.shadow).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables[`${prefix}-shadow-${key}`] = value;
      }
    });
    
    return variables;
  },

  // Media query helpers
  breakpoints: {
    mobile: '375px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },

  mediaQuery: {
    mobile: '@media (min-width: 375px)',
    tablet: '@media (min-width: 768px)',
    desktop: '@media (min-width: 1024px)',
    wide: '@media (min-width: 1440px)',
    
    // Helpers for max-width queries
    mobileOnly: '@media (max-width: 767px)',
    tabletOnly: '@media (min-width: 768px) and (max-width: 1023px)',
    desktopOnly: '@media (min-width: 1024px) and (max-width: 1439px)',
  },

  // Accessibility helpers
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  },

  // Focus styles
  focusRing: {
    default: {
      outline: '2px solid transparent',
      outlineOffset: '2px',
      boxShadow: `0 0 0 2px ${colors.brand.primary}`,
    },
    inset: {
      outline: '2px solid transparent',
      outlineOffset: '-2px',
      boxShadow: `inset 0 0 0 2px ${colors.brand.primary}`,
    },
  },
} as const;

// Type exports
export type DesignTokens = typeof tokens;
export type DesignUtils = typeof utils;