'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glass-interactive' | 'fresh' | 'warm' | 'rich' | 'golden';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  blur?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      glow = false,
      blur = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-2xl transition-all duration-300 ease-glass',
      blur && 'backdrop-blur-md',
    ];

    const variantClasses = {
      default: [
        'bg-white border border-neutral-200 shadow-sm',
        'dark:bg-neutral-800 dark:border-neutral-700',
      ],
      glass: [
        'glass',
      ],
      'glass-interactive': [
        'glass-interactive cursor-pointer',
      ],
      fresh: [
        'glass-fresh border border-food-fresh-200/50',
      ],
      warm: [
        'glass-warm border border-food-warm-200/50',
      ],
      rich: [
        'glass-rich border border-food-rich-200/50',
      ],
      golden: [
        'glass-golden border border-food-golden-200/50',
      ],
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    const hoverClasses = hover
      ? [
          'hover:transform hover:-translate-y-1 hover:shadow-glass-lg',
          variant === 'glass-interactive' && 'hover:bg-glass-interactive-light',
        ]
      : [];

    const glowClasses = glow
      ? {
          default: 'hover:shadow-lg',
          glass: 'hover:shadow-glass-lg',
          'glass-interactive': 'hover:shadow-glass-lg',
          fresh: 'glow-fresh',
          warm: 'glow-warm',
          rich: 'glow-rich',
          golden: 'glow-golden',
        }[variant]
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          hoverClasses,
          glowClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between mb-4', className)}
        {...props}
      >
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && <div className="ml-4 flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Body Component
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-neutral-700 dark:text-neutral-300', className)}
        {...props}
      />
    );
  }
);

CardBody.displayName = 'CardBody';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = 'end', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-700/50',
          justifyClasses[justify],
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };