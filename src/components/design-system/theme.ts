/**
 * Liquid Glass Design System Theme Configuration
 * 
 * This file contains the core theme tokens and utilities for the design system.
 * It provides a centralized way to manage colors, spacing, typography, and other
 * design tokens used throughout the application.
 */

// Design Tokens
export const tokens = {
  // Color System
  colors: {
    // Glass surfaces
    glass: {
      primary: 'rgba(255, 255, 255, 0.08)',
      primaryLight: 'rgba(255, 255, 255, 0.15)',
      primaryDark: 'rgba(255, 255, 255, 0.05)',
      secondary: 'rgba(255, 255, 255, 0.12)',
      secondaryLight: 'rgba(255, 255, 255, 0.25)',
      secondaryDark: 'rgba(255, 255, 255, 0.08)',
      interactive: 'rgba(255, 255, 255, 0.18)',
      interactiveLight: 'rgba(255, 255, 255, 0.35)',
      interactiveDark: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.15)',
      borderLight: 'rgba(255, 255, 255, 0.3)',
      borderDark: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Food-themed colors
    food: {
      fresh: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      warm: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      rich: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },
      golden: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
    },
    
    // Semantic colors
    semantic: {
      success: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
      },
      info: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Spacing
  spacing: {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    '4xl': '2rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    glass: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    },
    glow: {
      fresh: '0 0 16px rgba(34, 197, 94, 0.4)',
      warm: '0 0 16px rgba(249, 115, 22, 0.4)',
      rich: '0 0 16px rgba(168, 85, 247, 0.4)',
      golden: '0 0 16px rgba(245, 158, 11, 0.4)',
    },
  },
  
  // Blur effects
  blur: {
    sm: 'blur(8px)',
    base: 'blur(20px)',
    lg: 'blur(40px)',
    xl: 'blur(72px)',
  },
  
  // Transitions
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    glass: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Component variants
export const componentVariants = {
  button: {
    primary: 'bg-food-fresh-500 text-white hover:bg-food-fresh-600',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
    ghost: 'bg-transparent hover:bg-neutral-100',
    glass: 'glass-interactive',
  },
  
  card: {
    default: 'bg-white border border-neutral-200 shadow-sm',
    glass: 'glass',
    interactive: 'glass-interactive',
  },
  
  input: {
    default: 'bg-white border-neutral-200 focus:border-food-fresh-300',
    glass: 'glass border-glass-border focus:border-glass-border-light',
  },
} as const;

// Utility functions
export const getColorValue = (path: string) => {
  const keys = path.split('.');
  let value: any = tokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value;
};

export const createGlassStyles = (opacity = 0.08, blur = 'base') => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: tokens.blur[blur as keyof typeof tokens.blur],
  WebkitBackdropFilter: tokens.blur[blur as keyof typeof tokens.blur],
  border: `1px solid ${tokens.colors.glass.border}`,
  boxShadow: tokens.shadows.glass.base,
});

export const createGradient = (direction = '135deg', colors: string[]) => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

// Theme context type
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: 'fresh' | 'warm' | 'rich' | 'golden';
  glassEnabled: boolean;
  animationsEnabled: boolean;
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  mode: 'light',
  primaryColor: 'fresh',
  glassEnabled: true,
  animationsEnabled: true,
};

// CSS custom properties generator
export const generateCSSCustomProperties = (theme: ThemeConfig) => {
  const isDark = theme.mode === 'dark';
  const primaryColor = tokens.colors.food[theme.primaryColor];
  
  return {
    '--primary-50': primaryColor[50],
    '--primary-100': primaryColor[100],
    '--primary-200': primaryColor[200],
    '--primary-300': primaryColor[300],
    '--primary-400': primaryColor[400],
    '--primary-500': primaryColor[500],
    '--primary-600': primaryColor[600],
    '--primary-700': primaryColor[700],
    '--primary-800': primaryColor[800],
    '--primary-900': primaryColor[900],
    
    '--glass-primary': isDark ? tokens.colors.glass.primaryDark : tokens.colors.glass.primary,
    '--glass-secondary': isDark ? tokens.colors.glass.secondaryDark : tokens.colors.glass.secondary,
    '--glass-interactive': isDark ? tokens.colors.glass.interactiveDark : tokens.colors.glass.interactive,
    '--glass-border': isDark ? tokens.colors.glass.borderDark : tokens.colors.glass.border,
  };
};