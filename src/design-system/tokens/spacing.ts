/**
 * Spacing Tokens - KeCarajoComer Design System
 * 
 * Consistent spacing scale based on 4px grid
 * Used for margins, paddings, gaps, and positioning
 */

export const spacing = {
  // Base spacing scale (4px grid)
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Layout spacing presets
export const layoutSpacing = {
  // Page margins
  page: {
    mobile: spacing[4],    // 16px
    tablet: spacing[6],    // 24px
    desktop: spacing[8],   // 32px
    wide: spacing[12],     // 48px
  },

  // Section spacing
  section: {
    small: spacing[8],     // 32px
    medium: spacing[12],   // 48px
    large: spacing[16],    // 64px
    xlarge: spacing[24],   // 96px
  },

  // Component spacing
  component: {
    xxsmall: spacing[1],   // 4px
    xsmall: spacing[2],    // 8px
    small: spacing[3],     // 12px
    medium: spacing[4],    // 16px
    large: spacing[6],     // 24px
    xlarge: spacing[8],    // 32px
  },

  // Grid gaps
  grid: {
    small: spacing[2],     // 8px
    medium: spacing[4],    // 16px
    large: spacing[6],     // 24px
    xlarge: spacing[8],    // 32px
  },

  // Stack spacing (vertical rhythm)
  stack: {
    xxsmall: spacing[1],   // 4px
    xsmall: spacing[2],    // 8px
    small: spacing[3],     // 12px
    medium: spacing[4],    // 16px
    large: spacing[6],     // 24px
    xlarge: spacing[8],    // 32px
    xxlarge: spacing[12],  // 48px
  },

  // Inline spacing (horizontal)
  inline: {
    xxsmall: spacing[1],   // 4px
    xsmall: spacing[2],    // 8px
    small: spacing[3],     // 12px
    medium: spacing[4],    // 16px
    large: spacing[6],     // 24px
  },
} as const;

// Container max widths
export const containerWidth = {
  xs: '20rem',      // 320px
  sm: '24rem',      // 384px
  md: '28rem',      // 448px
  lg: '32rem',      // 512px
  xl: '36rem',      // 576px
  '2xl': '42rem',   // 672px
  '3xl': '48rem',   // 768px
  '4xl': '56rem',   // 896px
  '5xl': '64rem',   // 1024px
  '6xl': '72rem',   // 1152px
  '7xl': '80rem',   // 1280px
  full: '100%',
  prose: '65ch',    // Optimal reading width
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
  top: 90,
  max: 99999,
} as const;

// Export type for TypeScript
export type SpacingToken = typeof spacing;
export type LayoutSpacing = typeof layoutSpacing;
export type ContainerWidth = typeof containerWidth;
export type ZIndex = typeof zIndex;