/**
 * iOS26 Design Tokens
 * Core design system tokens for the iOS26 liquid glass aesthetic
 */

export const iOS26Tokens = {
  // Glass effect configurations
  glass: {
    blur: {
      subtle: 'blur(8px)',
      medium: 'blur(16px)',
      strong: 'blur(24px)',
      ultra: 'blur(32px)',
      max: 'blur(48px)'
    },
    background: {
      light: {
        subtle: 'rgba(255, 255, 255, 0.8)',
        medium: 'rgba(255, 255, 255, 0.6)',
        strong: 'rgba(255, 255, 255, 0.4)',
        ultra: 'rgba(255, 255, 255, 0.2)'
      },
      dark: {
        subtle: 'rgba(0, 0, 0, 0.8)',
        medium: 'rgba(0, 0, 0, 0.6)',
        strong: 'rgba(0, 0, 0, 0.4)',
        ultra: 'rgba(0, 0, 0, 0.2)'
      },
      colored: (r: number, g: number, b: number, a: number = 0.5) => 
        `rgba(${r}, ${g}, ${b}, ${a})`
    },
    border: {
      light: 'rgba(255, 255, 255, 0.3)',
      medium: 'rgba(255, 255, 255, 0.2)',
      dark: 'rgba(0, 0, 0, 0.2)',
      colored: (r: number, g: number, b: number) => 
        `rgba(${r}, ${g}, ${b}, 0.25)`
    },
    shadow: {
      subtle: '0 4px 24px rgba(0, 0, 0, 0.08)',
      medium: '0 8px 32px rgba(0, 0, 0, 0.12)',
      strong: '0 16px 48px rgba(0, 0, 0, 0.16)',
      colored: (r: number, g: number, b: number) => 
        `0 8px 32px rgba(${r}, ${g}, ${b}, 0.2)`
    }
  },

  // Animation configurations
  animation: {
    duration: {
      instant: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      liquid: '800ms',
      morph: '1200ms'
    },
    easing: {
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      liquid: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    spring: {
      soft: { stiffness: 200, damping: 20 },
      normal: { stiffness: 300, damping: 25 },
      bouncy: { stiffness: 400, damping: 20 },
      stiff: { stiffness: 500, damping: 30 }
    }
  },

  // Color themes
  themes: {
    elegant: {
      name: 'Elegant',
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: {
        light: '#FAFAFA',
        dark: '#0F0F0F'
      },
      surface: {
        light: '#FFFFFF',
        dark: '#1A1A1A'
      },
      text: {
        light: '#1F2937',
        dark: '#F9FAFB'
      },
      gradient: {
        primary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        secondary: 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
        accent: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        mesh: 'radial-gradient(at 50% 50%, #8B5CF6 0%, transparent 50%), radial-gradient(at 80% 0%, #EC4899 0%, transparent 50%), radial-gradient(at 0% 50%, #F59E0B 0%, transparent 50%)'
      }
    },
    modern: {
      name: 'Modern',
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#8B5CF6',
      background: {
        light: '#F8FAFC',
        dark: '#0C0E14'
      },
      surface: {
        light: '#FFFFFF',
        dark: '#1E293B'
      },
      text: {
        light: '#0F172A',
        dark: '#F1F5F9'
      },
      gradient: {
        primary: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
        secondary: 'linear-gradient(135deg, #10B981 0%, #8B5CF6 100%)',
        accent: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        mesh: 'radial-gradient(at 50% 50%, #3B82F6 0%, transparent 50%), radial-gradient(at 80% 80%, #10B981 0%, transparent 50%), radial-gradient(at 20% 20%, #8B5CF6 0%, transparent 50%)'
      }
    },
    ultra: {
      name: 'Ultra',
      primary: '#F59E0B',
      secondary: '#EF4444',
      accent: '#A855F7',
      background: {
        light: '#FFFBEB',
        dark: '#1A0E00'
      },
      surface: {
        light: '#FFFFFF',
        dark: '#2A1A00'
      },
      text: {
        light: '#451A03',
        dark: '#FEF3C7'
      },
      gradient: {
        primary: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        secondary: 'linear-gradient(135deg, #EF4444 0%, #A855F7 100%)',
        accent: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
        mesh: 'radial-gradient(at 0% 0%, #F59E0B 0%, transparent 50%), radial-gradient(at 100% 100%, #EF4444 0%, transparent 50%), radial-gradient(at 50% 50%, #A855F7 0%, transparent 50%)'
      }
    },
    cinema: {
      name: 'Cinema',
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
      accent: '#DC2626',
      background: {
        light: '#1F2937',
        dark: '#030712'
      },
      surface: {
        light: '#374151',
        dark: '#111827'
      },
      text: {
        light: '#F9FAFB',
        dark: '#F3F4F6'
      },
      gradient: {
        primary: 'linear-gradient(135deg, #4B5563 0%, #1F2937 100%)',
        secondary: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
        accent: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        mesh: 'radial-gradient(at 50% 0%, #4B5563 0%, transparent 50%), radial-gradient(at 0% 100%, #DC2626 0%, transparent 50%), radial-gradient(at 100% 50%, #1F2937 0%, transparent 50%)'
      }
    }
  },

  // Spacing system
  spacing: {
    micro: '0.125rem', // 2px
    tiny: '0.25rem',   // 4px
    small: '0.5rem',   // 8px
    medium: '1rem',    // 16px
    large: '1.5rem',   // 24px
    huge: '2rem',      // 32px
    giant: '3rem',     // 48px
    mega: '4rem'       // 64px
  },

  // Border radius
  radius: {
    none: '0',
    small: '0.375rem',  // 6px
    medium: '0.75rem',  // 12px
    large: '1rem',      // 16px
    xlarge: '1.5rem',   // 24px
    round: '9999px',
    liquid: {
      static: '1rem',
      hover: '1.25rem',
      active: '0.875rem'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace'
    },
    fontSize: {
      tiny: '0.625rem',    // 10px
      small: '0.75rem',    // 12px
      base: '0.875rem',    // 14px
      medium: '1rem',      // 16px
      large: '1.125rem',   // 18px
      xlarge: '1.25rem',   // 20px
      huge: '1.5rem',      // 24px
      giant: '2rem',       // 32px
      mega: '3rem'         // 48px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2
    }
  },

  // Z-index layers
  zIndex: {
    base: 0,
    elevated: 10,
    dropdown: 20,
    sticky: 30,
    modal: 40,
    popover: 50,
    overlay: 60,
    notification: 70,
    tooltip: 80,
    debug: 90
  },

  // Breakpoints
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px'
  }
} as const;

// Type exports
export type Theme = keyof typeof iOS26Tokens.themes;
export type BlurLevel = keyof typeof iOS26Tokens.glass.blur;
export type AnimationDuration = keyof typeof iOS26Tokens.animation.duration;
export type AnimationEasing = keyof typeof iOS26Tokens.animation.easing;
export type Spacing = keyof typeof iOS26Tokens.spacing;
export type Radius = keyof typeof iOS26Tokens.radius;
export type FontSize = keyof typeof iOS26Tokens.typography.fontSize;
export type FontWeight = keyof typeof iOS26Tokens.typography.fontWeight;