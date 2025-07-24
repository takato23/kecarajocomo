/**
 * Color Tokens - KeCarajoComer Design System
 * 
 * Based on MASTER_PLAN.md color palette
 * All colors are organized by semantic meaning and usage
 */

export const colors = {
  // Brand Colors (from MASTER_PLAN)
  brand: {
    primary: '#FF6B35',    // Naranja vibrante - Main brand color
    secondary: '#4ECDC4',  // Turquesa fresco - Secondary actions
    accent: '#FFE66D',     // Amarillo cálido - Highlights
  },

  // Neutral Palette (from MASTER_PLAN)
  neutral: {
    900: '#1A1A1A',  // Darkest - Primary text
    800: '#2A2A2A',  // Dark backgrounds
    700: '#4A4A4A',  // Secondary text
    600: '#6A6A6A',  // Tertiary text
    500: '#7A7A7A',  // Disabled text
    400: '#9A9A9A',  // Placeholders
    300: '#AAAAAA',  // Borders
    200: '#CACACA',  // Dividers
    100: '#F5F5F5',  // Light backgrounds
    50: '#FAFAFA',   // Lightest backgrounds
    0: '#FFFFFF',    // White
  },

  // Semantic Colors (from MASTER_PLAN)
  semantic: {
    success: '#06D6A0',   // Success states
    warning: '#FFD166',   // Warning states
    error: '#EF476F',     // Error states
    info: '#118AB2',      // Information
  },

  // Food Theme Colors (existing + enhanced)
  food: {
    fresh: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // Main fresh color
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
      500: '#f97316',  // Main warm color
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
      500: '#a855f7',  // Main rich color
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
      500: '#f59e0b',  // Main golden color
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },

  // Glass Effects (enhanced with opacity variants)
  glass: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      8: 'rgba(255, 255, 255, 0.08)',
      10: 'rgba(255, 255, 255, 0.10)',
      15: 'rgba(255, 255, 255, 0.15)',
      20: 'rgba(255, 255, 255, 0.20)',
      30: 'rgba(255, 255, 255, 0.30)',
      50: 'rgba(255, 255, 255, 0.50)',
    },
    black: {
      5: 'rgba(0, 0, 0, 0.05)',
      10: 'rgba(0, 0, 0, 0.10)',
      20: 'rgba(0, 0, 0, 0.20)',
      30: 'rgba(0, 0, 0, 0.30)',
      50: 'rgba(0, 0, 0, 0.50)',
    },
  },

  // Dark Mode Overrides
  dark: {
    background: {
      primary: '#0A0A0A',
      secondary: '#1A1A1A',
      tertiary: '#2A2A2A',
    },
    surface: {
      primary: '#1A1A1A',
      secondary: '#2A2A2A',
      tertiary: '#3A3A3A',
    },
  },
} as const;

// Color aliases for easier usage
export const colorAliases = {
  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[700],
    tertiary: colors.neutral[600],
    disabled: colors.neutral[500],
    inverse: colors.neutral[0],
  },
  
  // Background colors
  background: {
    primary: colors.neutral[0],
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
  },
  
  // Border colors
  border: {
    primary: colors.neutral[300],
    secondary: colors.neutral[200],
    tertiary: colors.neutral[100],
  },
} as const;

// Export type for TypeScript
export type ColorToken = typeof colors;
export type ColorAlias = typeof colorAliases;