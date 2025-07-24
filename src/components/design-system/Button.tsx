'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'fresh' | 'warm' | 'rich' | 'golden';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      glow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center rounded-xl font-medium',
      'transition-all duration-200 ease-glass',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'relative overflow-hidden',
      fullWidth ? 'w-full' : '',
    ];

    const variantClasses = {
      primary: [
        'bg-food-fresh-500 text-white border border-food-fresh-600',
        'hover:bg-food-fresh-600 hover:shadow-glow-fresh',
        'focus:ring-food-fresh-300',
        'active:bg-food-fresh-700',
      ],
      secondary: [
        'bg-neutral-100 text-neutral-900 border border-neutral-200',
        'hover:bg-neutral-200 hover:shadow-md',
        'focus:ring-neutral-300',
        'active:bg-neutral-300',
        'dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700',
        'dark:hover:bg-neutral-700',
      ],
      ghost: [
        'bg-transparent text-neutral-700 border border-transparent',
        'hover:bg-neutral-100 hover:text-neutral-900',
        'focus:ring-neutral-300',
        'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
      ],
      glass: [
        'glass-interactive text-neutral-900',
        'hover:transform hover:-translate-y-0.5',
        'focus:ring-neutral-300',
        'dark:text-neutral-100',
      ],
      fresh: [
        'glass-fresh text-food-fresh-700 border-food-fresh-200',
        'hover:bg-food-fresh-100 hover:text-food-fresh-800',
        'focus:ring-food-fresh-300',
        'dark:text-food-fresh-300 dark:hover:text-food-fresh-200',
      ],
      warm: [
        'glass-warm text-food-warm-700 border-food-warm-200',
        'hover:bg-food-warm-100 hover:text-food-warm-800',
        'focus:ring-food-warm-300',
        'dark:text-food-warm-300 dark:hover:text-food-warm-200',
      ],
      rich: [
        'glass-rich text-food-rich-700 border-food-rich-200',
        'hover:bg-food-rich-100 hover:text-food-rich-800',
        'focus:ring-food-rich-300',
        'dark:text-food-rich-300 dark:hover:text-food-rich-200',
      ],
      golden: [
        'glass-golden text-food-golden-700 border-food-golden-200',
        'hover:bg-food-golden-100 hover:text-food-golden-800',
        'focus:ring-food-golden-300',
        'dark:text-food-golden-300 dark:hover:text-food-golden-200',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    const glowClasses = glow
      ? {
          primary: 'glow-fresh',
          fresh: 'glow-fresh',
          warm: 'glow-warm',
          rich: 'glow-rich',
          golden: 'glow-golden',
          secondary: '',
          ghost: '',
          glass: '',
        }[variant] || ''
      : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glowClasses,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className={cn('flex items-center gap-inherit', loading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };