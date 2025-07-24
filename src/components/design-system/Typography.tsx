'use client';

import React from 'react';

import { cn } from '@/lib/utils';

// Heading Component
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'default' | 'muted' | 'fresh' | 'warm' | 'rich' | 'golden';
  gradient?: boolean;
  truncate?: boolean;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      as: Component = 'h2',
      size = 'xl',
      weight = 'semibold',
      color = 'default',
      gradient = false,
      truncate = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = ['font-display'];

    const sizeClasses = {
      '4xl': 'text-4xl leading-tight',
      '3xl': 'text-3xl leading-tight',
      '2xl': 'text-2xl leading-tight',
      xl: 'text-xl leading-relaxed',
      lg: 'text-lg leading-relaxed',
      md: 'text-base leading-relaxed',
      sm: 'text-sm leading-relaxed',
    };

    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    };

    const colorClasses = gradient
      ? {
          default: 'text-gradient-fresh',
          muted: 'text-gradient-fresh opacity-80',
          fresh: 'text-gradient-fresh',
          warm: 'text-gradient-warm',
          rich: 'text-gradient-rich',
          golden: 'text-gradient-golden',
        }
      : {
          default: 'text-neutral-900 dark:text-neutral-100',
          muted: 'text-neutral-600 dark:text-neutral-400',
          fresh: 'text-food-fresh-700 dark:text-food-fresh-300',
          warm: 'text-food-warm-700 dark:text-food-warm-300',
          rich: 'text-food-rich-700 dark:text-food-rich-300',
          golden: 'text-food-golden-700 dark:text-food-golden-300',
        };

    const truncateClasses = truncate ? 'truncate' : '';

    return (
      <Component
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          weightClasses[weight],
          colorClasses[color],
          truncateClasses,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = 'Heading';

// Text Component
export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div' | 'label';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'fresh' | 'warm' | 'rich' | 'golden' | 'success' | 'warning' | 'error' | 'info';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = 'p',
      size = 'base',
      weight = 'normal',
      color = 'default',
      align = 'left',
      truncate = false,
      italic = false,
      underline = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = ['font-sans'];

    const sizeClasses = {
      xs: 'text-xs leading-normal',
      sm: 'text-sm leading-relaxed',
      base: 'text-base leading-relaxed',
      lg: 'text-lg leading-relaxed',
      xl: 'text-xl leading-relaxed',
    };

    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const colorClasses = {
      default: 'text-neutral-700 dark:text-neutral-300',
      muted: 'text-neutral-500 dark:text-neutral-400',
      fresh: 'text-food-fresh-700 dark:text-food-fresh-300',
      warm: 'text-food-warm-700 dark:text-food-warm-300',
      rich: 'text-food-rich-700 dark:text-food-rich-300',
      golden: 'text-food-golden-700 dark:text-food-golden-300',
      success: 'text-success-700 dark:text-success-300',
      warning: 'text-warning-700 dark:text-warning-300',
      error: 'text-error-700 dark:text-error-300',
      info: 'text-info-700 dark:text-info-300',
    };

    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    };

    const decorationClasses = [
      truncate && 'truncate',
      italic && 'italic',
      underline && 'underline',
    ].filter(Boolean);

    return (
      <Component
        ref={ref as any}
        className={cn(
          baseClasses,
          sizeClasses[size],
          weightClasses[weight],
          colorClasses[color],
          alignClasses[align],
          decorationClasses,
          className
        )}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';

// Code Component
export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'xs' | 'sm' | 'base';
  variant?: 'inline' | 'block';
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ size = 'sm', variant = 'inline', className, children, ...props }, ref) => {
    const baseClasses = [
      'font-mono rounded',
      variant === 'inline'
        ? 'px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800'
        : 'p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700',
    ];

    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
    };

    const Component = variant === 'inline' ? 'code' : 'pre';

    return (
      <Component
        ref={ref as any}
        className={cn(
          baseClasses,
          sizeClasses[size],
          'text-neutral-800 dark:text-neutral-200',
          className
        )}
        {...(props as any)}
      >
        {variant === 'block' ? <code>{children}</code> : children}
      </Component>
    );
  }
);

Code.displayName = 'Code';

// Link Component
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'fresh' | 'warm' | 'muted';
  underline?: boolean;
  external?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      variant = 'default',
      underline = false,
      external = false,
      className,
      children,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded',
      underline ? 'underline' : 'hover:underline',
    ];

    const variantClasses = {
      default: [
        'text-food-fresh-600 hover:text-food-fresh-700',
        'dark:text-food-fresh-400 dark:hover:text-food-fresh-300',
        'focus:ring-food-fresh-300',
      ],
      fresh: [
        'text-food-fresh-600 hover:text-food-fresh-700',
        'dark:text-food-fresh-400 dark:hover:text-food-fresh-300',
        'focus:ring-food-fresh-300',
      ],
      warm: [
        'text-food-warm-600 hover:text-food-warm-700',
        'dark:text-food-warm-400 dark:hover:text-food-warm-300',
        'focus:ring-food-warm-300',
      ],
      muted: [
        'text-neutral-600 hover:text-neutral-700',
        'dark:text-neutral-400 dark:hover:text-neutral-300',
        'focus:ring-neutral-300',
      ],
    };

    return (
      <a
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        target={external ? '_blank' : target}
        rel={external ? 'noopener noreferrer' : rel}
        {...props}
      >
        {children}
        {external && (
          <svg
            className="inline w-3 h-3 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </a>
    );
  }
);

Link.displayName = 'Link';

export { Heading, Text, Code, Link };