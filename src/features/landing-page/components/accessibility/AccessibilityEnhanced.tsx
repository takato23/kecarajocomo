import React, { useEffect, useState, createContext, useContext } from 'react';
import { motion, MotionProps, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

// Accessibility context for global settings
interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  focusVisible: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  screenReader: false,
  focusVisible: false
});

export const useAccessibility = () => useContext(AccessibilityContext);

// Provider component
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [settings, setSettings] = useState<AccessibilityContextType>({
    reducedMotion: shouldReduceMotion || false,
    highContrast: false,
    fontSize: 'medium',
    screenReader: false,
    focusVisible: false
  });

  useEffect(() => {
    // Detect screen reader usage
    const detectScreenReader = () => {
      return navigator.userAgent.includes('NVDA') || 
             navigator.userAgent.includes('JAWS') || 
             navigator.userAgent.includes('VoiceOver') ||
             window.speechSynthesis?.speaking ||
             document.body.classList.contains('screen-reader');
    };

    // Detect high contrast preference
    const detectHighContrast = () => {
      return window.matchMedia('(prefers-contrast: high)').matches ||
             window.matchMedia('(-ms-high-contrast: active)').matches;
    };

    // Detect font size preference
    const detectFontSize = (): 'small' | 'medium' | 'large' => {
      const fontSize = window.getComputedStyle(document.documentElement).fontSize;
      const size = parseFloat(fontSize);
      if (size >= 20) return 'large';
      if (size <= 14) return 'small';
      return 'medium';
    };

    setSettings(prev => ({
      ...prev,
      reducedMotion: shouldReduceMotion || false,
      screenReader: detectScreenReader(),
      highContrast: detectHighContrast(),
      fontSize: detectFontSize()
    }));

    // Listen for preference changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [shouldReduceMotion]);

  return (
    <AccessibilityContext.Provider value={settings}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessible motion wrapper
interface AccessibleMotionProps extends MotionProps {
  children: React.ReactNode;
  reduceMotion?: boolean;
  className?: string;
  as?: keyof typeof motion;
}

export const AccessibleMotion = ({ 
  children, 
  reduceMotion, 
  className, 
  as = 'div',
  ...motionProps 
}: AccessibleMotionProps) => {
  const { reducedMotion } = useAccessibility();
  const shouldReduce = reduceMotion ?? reducedMotion;
  
  const MotionComponent = motion[as] as any;
  
  if (shouldReduce) {
    const Component = as as any;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent className={className} {...motionProps}>
      {children}
    </MotionComponent>
  );
};

// Focus management hook
export const useFocusManagement = () => {
  const [focusVisible, setFocusVisible] = useState(false);
  const [lastFocusMethod, setLastFocusMethod] = useState<'mouse' | 'keyboard' | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setLastFocusMethod('keyboard');
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setLastFocusMethod('mouse');
      setFocusVisible(false);
    };

    const handleFocus = () => {
      if (lastFocusMethod === 'keyboard') {
        setFocusVisible(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focus', handleFocus, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focus', handleFocus, true);
    };
  }, [lastFocusMethod]);

  return { focusVisible, lastFocusMethod };
};

// Accessible button component
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
}

export const AccessibleButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  AccessibleButtonProps
>(({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  ariaDescribedBy,
  type = 'button',
  href,
  target,
  ...props 
}, ref) => {
  const { focusVisible } = useFocusManagement();
  const { highContrast, fontSize } = useAccessibility();
  
  const baseClasses = cn(
    'inline-flex items-center justify-center font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // High contrast mode adjustments
    {
      'ring-4 ring-blue-600': highContrast && focusVisible,
      'focus:ring-lime-500': !highContrast,
      'focus:ring-blue-600': highContrast
    },
    // Size variations
    {
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg'
    },
    // Font size adjustments
    {
      'text-xs': fontSize === 'small' && size === 'sm',
      'text-sm': fontSize === 'small' && size === 'md',
      'text-base': fontSize === 'small' && size === 'lg',
      'text-xl': fontSize === 'large' && size === 'lg'
    },
    // Variant styles
    {
      'bg-gradient-to-r from-lime-500 to-purple-500 text-white hover:from-lime-600 hover:to-purple-600': 
        variant === 'primary' && !highContrast,
      'bg-blue-600 text-white hover:bg-blue-700': 
        variant === 'primary' && highContrast,
      'bg-white border-2 border-lime-500 text-lime-600 hover:bg-lime-50': 
        variant === 'secondary' && !highContrast,
      'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50': 
        variant === 'secondary' && highContrast,
      'bg-transparent text-gray-600 hover:bg-gray-100': 
        variant === 'ghost' && !highContrast,
      'bg-transparent text-black hover:bg-gray-200 border border-black': 
        variant === 'ghost' && highContrast
    },
    className
  );

  const commonProps = {
    className: baseClasses,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': disabled || loading,
    disabled: disabled || loading,
    ...props
  };

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={disabled ? undefined : href}
        target={target}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onClick}
        {...commonProps}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" 
                  aria-hidden="true" />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      {...commonProps}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" 
                aria-hidden="true" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

// Accessible card component
interface AccessibleCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
}

export const AccessibleCard = React.forwardRef<HTMLDivElement, AccessibleCardProps>(({
  children,
  className,
  onClick,
  href,
  ariaLabel,
  role,
  tabIndex,
  ...props
}, ref) => {
  const { highContrast } = useAccessibility();
  const { focusVisible } = useFocusManagement();
  
  const cardClasses = cn(
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'focus:ring-lime-500': !highContrast,
      'focus:ring-blue-600 ring-4': highContrast && focusVisible,
      'cursor-pointer hover:shadow-lg': onClick || href,
      'border-2 border-black': highContrast,
      'border border-gray-200': !highContrast
    },
    className
  );

  if (href) {
    return (
      <a
        ref={ref as any}
        href={href}
        className={cardClasses}
        aria-label={ariaLabel}
        role={role || 'link'}
        tabIndex={tabIndex}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      aria-label={ariaLabel}
      role={role || (onClick ? 'button' : undefined)}
      tabIndex={onClick ? 0 : tabIndex}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});

AccessibleCard.displayName = 'AccessibleCard';

// Skip link component
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink = ({ href, children, className }: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-blue-600 text-white px-4 py-2 rounded-md z-50',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        className
      )}
    >
      {children}
    </a>
  );
};

// Accessible heading component with proper hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleHeading = ({ level, children, className, id }: AccessibleHeadingProps) => {
  const { fontSize, highContrast } = useAccessibility();
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const headingClasses = cn(
    'font-bold leading-tight',
    {
      // High contrast mode
      'text-black': highContrast,
      // Font size adjustments
      'text-xl': level === 1 && fontSize === 'small',
      'text-2xl': level === 1 && fontSize === 'medium',
      'text-3xl': level === 1 && fontSize === 'large',
      'text-lg': level === 2 && fontSize === 'small',
      'text-xl': level === 2 && fontSize === 'medium',
      'text-2xl': level === 2 && fontSize === 'large',
    },
    className
  );

  return (
    <Tag id={id} className={headingClasses}>
      {children}
    </Tag>
  );
};

// Accessible list component
interface AccessibleListProps {
  children: React.ReactNode;
  ordered?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const AccessibleList = ({ children, ordered = false, className, ariaLabel }: AccessibleListProps) => {
  const Tag = ordered ? 'ol' : 'ul';
  
  return (
    <Tag className={className} aria-label={ariaLabel}>
      {children}
    </Tag>
  );
};

// Live region for dynamic content announcements
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion = ({ 
  children, 
  politeness = 'polite', 
  atomic = false, 
  className 
}: LiveRegionProps) => {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={politeness}
      aria-atomic={atomic}
      role="status"
    >
      {children}
    </div>
  );
};

// Accessible form field wrapper
interface AccessibleFieldProps {
  children: React.ReactNode;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleField = ({ 
  children, 
  label, 
  error, 
  hint, 
  required = false, 
  className 
}: AccessibleFieldProps) => {
  const fieldId = React.useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  
  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {hint && (
        <div id={hintId} className="text-sm text-gray-500">
          {hint}
        </div>
      )}
      
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required
      })}
      
      {error && (
        <div id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};