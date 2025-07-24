'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass' | 'fresh' | 'warm';
  inputSize?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isInvalid?: boolean;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      type = 'text',
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      isInvalid,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || props.name || 'input';
    const hasError = isInvalid || !!error;

    const baseClasses = [
      'w-full rounded-xl border transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
    ];

    const variantClasses = {
      default: [
        'bg-white border-neutral-200 text-neutral-900',
        'focus:border-food-fresh-300 focus:ring-food-fresh-200',
        'dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100',
        'dark:focus:border-food-fresh-400 dark:focus:ring-food-fresh-400/20',
      ],
      glass: [
        'glass border-glass-border text-neutral-900',
        'focus:border-glass-border-light focus:ring-glass-border/20',
        'dark:text-neutral-100',
      ],
      fresh: [
        'glass-fresh border-food-fresh-200 text-food-fresh-900',
        'focus:border-food-fresh-400 focus:ring-food-fresh-200',
        'dark:text-food-fresh-100',
      ],
      warm: [
        'glass-warm border-food-warm-200 text-food-warm-900',
        'focus:border-food-warm-400 focus:ring-food-warm-200',
        'dark:text-food-warm-100',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const errorClasses = hasError
      ? [
          'border-error-500 focus:border-error-500 focus:ring-error-200',
          'dark:border-error-400 dark:focus:border-error-400 dark:focus:ring-error-400/20',
        ]
      : [];

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const paddingWithIcon = {
      sm: leftIcon ? 'pl-9' : rightIcon ? 'pr-9' : '',
      md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '',
    };

    return (
      <div className={cn('relative', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute inset-y-0 left-0 flex items-center">
              <div className="glass-secondary rounded-l-xl px-3 py-2 border-r border-glass-border text-sm text-neutral-600 dark:text-neutral-400">
                {leftAddon}
              </div>
            </div>
          )}

          {leftIcon && !leftAddon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className={cn('text-neutral-400 dark:text-neutral-500', iconSizeClasses[inputSize])}>
                {leftIcon}
              </div>
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              errorClasses,
              paddingWithIcon[inputSize],
              leftAddon && 'rounded-l-none pl-20',
              rightAddon && 'rounded-r-none pr-20',
              className
            )}
            disabled={disabled}
            {...props}
          />

          {rightIcon && !rightAddon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className={cn('text-neutral-400 dark:text-neutral-500', iconSizeClasses[inputSize])}>
                {rightIcon}
              </div>
            </div>
          )}

          {rightAddon && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              <div className="glass-secondary rounded-r-xl px-3 py-2 border-l border-glass-border text-sm text-neutral-600 dark:text-neutral-400">
                {rightAddon}
              </div>
            </div>
          )}
        </div>

        {(error || helper) && (
          <div className="mt-1 text-sm">
            {hasError ? (
              <p className="text-error-600 dark:text-error-400 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            ) : helper ? (
              <p className="text-neutral-500 dark:text-neutral-400">{helper}</p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };