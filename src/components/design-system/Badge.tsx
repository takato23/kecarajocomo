'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'fresh' | 'warm' | 'rich' | 'golden' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  pill?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      outline = false,
      pill = false,
      removable = false,
      onRemove,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center gap-1.5 font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      pill ? 'rounded-full' : 'rounded-lg',
    ];

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const variantClasses = outline
      ? {
          default: [
            'bg-transparent border border-neutral-300 text-neutral-700',
            'dark:border-neutral-600 dark:text-neutral-300',
          ],
          fresh: [
            'bg-transparent border border-food-fresh-300 text-food-fresh-700',
            'dark:border-food-fresh-400 dark:text-food-fresh-300',
          ],
          warm: [
            'bg-transparent border border-food-warm-300 text-food-warm-700',
            'dark:border-food-warm-400 dark:text-food-warm-300',
          ],
          rich: [
            'bg-transparent border border-food-rich-300 text-food-rich-700',
            'dark:border-food-rich-400 dark:text-food-rich-300',
          ],
          golden: [
            'bg-transparent border border-food-golden-300 text-food-golden-700',
            'dark:border-food-golden-400 dark:text-food-golden-300',
          ],
          neutral: [
            'bg-transparent border border-neutral-300 text-neutral-700',
            'dark:border-neutral-600 dark:text-neutral-300',
          ],
          success: [
            'bg-transparent border border-success-300 text-success-700',
            'dark:border-success-400 dark:text-success-300',
          ],
          warning: [
            'bg-transparent border border-warning-300 text-warning-700',
            'dark:border-warning-400 dark:text-warning-300',
          ],
          error: [
            'bg-transparent border border-error-300 text-error-700',
            'dark:border-error-400 dark:text-error-300',
          ],
          info: [
            'bg-transparent border border-info-300 text-info-700',
            'dark:border-info-400 dark:text-info-300',
          ],
        }
      : {
          default: [
            'bg-neutral-100 text-neutral-800 border border-neutral-200',
            'dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
          ],
          fresh: [
            'bg-food-fresh-100 text-food-fresh-800 border border-food-fresh-200',
            'dark:bg-food-fresh-900/30 dark:text-food-fresh-200 dark:border-food-fresh-800',
          ],
          warm: [
            'bg-food-warm-100 text-food-warm-800 border border-food-warm-200',
            'dark:bg-food-warm-900/30 dark:text-food-warm-200 dark:border-food-warm-800',
          ],
          rich: [
            'bg-food-rich-100 text-food-rich-800 border border-food-rich-200',
            'dark:bg-food-rich-900/30 dark:text-food-rich-200 dark:border-food-rich-800',
          ],
          golden: [
            'bg-food-golden-100 text-food-golden-800 border border-food-golden-200',
            'dark:bg-food-golden-900/30 dark:text-food-golden-200 dark:border-food-golden-800',
          ],
          neutral: [
            'bg-neutral-100 text-neutral-800 border border-neutral-200',
            'dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
          ],
          success: [
            'bg-success-50 text-success-700 border border-success-200',
            'dark:bg-success-900/30 dark:text-success-300 dark:border-success-800',
          ],
          warning: [
            'bg-warning-50 text-warning-700 border border-warning-200',
            'dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-800',
          ],
          error: [
            'bg-error-50 text-error-700 border border-error-200',
            'dark:bg-error-900/30 dark:text-error-300 dark:border-error-800',
          ],
          info: [
            'bg-info-50 text-info-700 border border-info-200',
            'dark:bg-info-900/30 dark:text-info-300 dark:border-info-800',
          ],
        };

    const iconSizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {leftIcon && (
          <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
            {leftIcon}
          </span>
        )}
        
        {children}
        
        {rightIcon && !removable && (
          <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
            {rightIcon}
          </span>
        )}
        
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10',
              'focus:outline-none focus:ring-1 focus:ring-current',
              iconSizeClasses[size]
            )}
          >
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };