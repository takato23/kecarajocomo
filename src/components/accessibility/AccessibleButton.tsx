'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { ScreenReaderOnly } from './ScreenReaderOnly';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  srOnlyText?: string;
}

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-accent',
  ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-accent',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-lg',
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Loading...',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      ariaLabel,
      ariaPressed,
      ariaExpanded,
      ariaControls,
      srOnlyText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          buttonVariants[variant],
          buttonSizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span aria-live="polite">{loadingText}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="mr-2" aria-hidden="true">
                {icon}
              </span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="ml-2" aria-hidden="true">
                {icon}
              </span>
            )}
          </>
        )}
        {srOnlyText && <ScreenReaderOnly>{srOnlyText}</ScreenReaderOnly>}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';