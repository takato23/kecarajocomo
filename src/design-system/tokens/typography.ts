/**
 * Typography Tokens - KeCarajoComer Design System
 * 
 * Based on MASTER_PLAN.md typography specifications
 * Consistent type scale for all text elements
 */

export const typography = {
  // Font Families (from MASTER_PLAN)
  fontFamily: {
    heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
  },

  // Font Sizes (from MASTER_PLAN)
  fontSize: {
    xs: '0.75rem',    // 12px - Tiny text, captions
    sm: '0.875rem',   // 14px - Small body text
    base: '1rem',     // 16px - Default body text
    lg: '1.125rem',   // 18px - Large body text
    xl: '1.25rem',    // 20px - Small headings
    '2xl': '1.5rem',  // 24px - Medium headings
    '3xl': '1.875rem',// 30px - Large headings
    '4xl': '2.25rem', // 36px - Extra large headings
    '5xl': '3rem',    // 48px - Hero text
    '6xl': '3.75rem', // 60px - Display text
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Decoration
  textDecoration: {
    none: 'none',
    underline: 'underline',
    overline: 'overline',
    lineThrough: 'line-through',
  },

  // Text Transform
  textTransform: {
    none: 'none',
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
  },
} as const;

// Typography Styles - Pre-composed text styles
export const typographyStyles = {
  // Display styles
  display: {
    large: {
      fontSize: typography.fontSize['6xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
    },
    medium: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
    },
    small: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.normal,
    },
  },

  // Heading styles
  heading: {
    h1: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    h2: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
    },
    h3: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
    },
    h4: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
    },
    h5: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
    },
    h6: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
    },
  },

  // Body styles
  body: {
    large: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.relaxed,
    },
    base: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
    },
    small: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.relaxed,
    },
  },

  // Caption styles
  caption: {
    base: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.wide,
    },
    strong: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.wide,
    },
  },

  // Label styles
  label: {
    base: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
    },
    small: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.wide,
    },
  },

  // Button text
  button: {
    large: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.wide,
    },
    base: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.normal,
    },
    small: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
    },
  },

  // Code styles
  code: {
    base: {
      fontFamily: typography.fontFamily.mono.join(', '),
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
    },
    block: {
      fontFamily: typography.fontFamily.mono.join(', '),
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.relaxed,
    },
  },
} as const;

// Export type for TypeScript
export type TypographyToken = typeof typography;
export type TypographyStyle = typeof typographyStyles;