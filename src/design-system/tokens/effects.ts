/**
 * Effects Tokens - KeCarajoComer Design System
 * 
 * Visual effects including shadows, borders, animations, and glass effects
 */

export const effects = {
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    '4xl': '2rem',    // 32px
    full: '9999px',   // Pill shape
  },

  // Border Width
  borderWidth: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  // Box Shadows
  shadow: {
    // Elevation shadows
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

    // Glass shadows
    glass: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    },

    // Glow effects (from existing theme)
    glow: {
      fresh: '0 0 16px rgba(34, 197, 94, 0.4)',
      warm: '0 0 16px rgba(249, 115, 22, 0.4)',
      rich: '0 0 16px rgba(168, 85, 247, 0.4)',
      golden: '0 0 16px rgba(245, 158, 11, 0.4)',
      brand: '0 0 16px rgba(255, 107, 53, 0.4)',
    },
  },

  // Blur effects
  blur: {
    none: 'blur(0)',
    sm: 'blur(4px)',
    base: 'blur(8px)',
    md: 'blur(12px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
    '2xl': 'blur(40px)',
    '3xl': 'blur(64px)',
  },

  // Opacity
  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
  },

  // Transitions
  transition: {
    // Durations
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },

    // Timing functions
    timing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      glass: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Presets
    preset: {
      default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      glass: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Animation keyframes
  animation: {
    // Spin
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    
    // Ping
    ping: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '75%': { transform: 'scale(2)', opacity: '0' },
      '100%': { transform: 'scale(2)', opacity: '0' },
    },

    // Pulse
    pulse: {
      '0%': { opacity: '1' },
      '50%': { opacity: '0.5' },
      '100%': { opacity: '1' },
    },

    // Bounce
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },

    // Shimmer (for loading states)
    shimmer: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },

    // Float (for subtle movement)
    float: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },

    // Fade in
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },

    // Scale in
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
  },
} as const;

// Glass effect presets
export const glassEffects = {
  light: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: effects.blur.md,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: effects.shadow.glass.base,
  },
  
  medium: {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: effects.blur.lg,
    border: '1px solid rgba(255, 255, 255, 0.20)',
    boxShadow: effects.shadow.glass.md,
  },
  
  strong: {
    background: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: effects.blur.xl,
    border: '1px solid rgba(255, 255, 255, 0.30)',
    boxShadow: effects.shadow.glass.lg,
  },

  dark: {
    background: 'rgba(0, 0, 0, 0.25)',
    backdropFilter: effects.blur.lg,
    border: '1px solid rgba(255, 255, 255, 0.10)',
    boxShadow: effects.shadow.glass.base,
  },
} as const;

// Export type for TypeScript
export type EffectsToken = typeof effects;
export type GlassEffect = typeof glassEffects;