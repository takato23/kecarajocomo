/**
 * iOS26 Liquid Input Component
 * Premium input field with glass effects and liquid animations
 */

'use client';

import React, { useState, forwardRef, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { useIOS26 } from './iOS26Provider';

export interface iOS26LiquidInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'medium' | 'strong';
  onClear?: () => void;
  showClear?: boolean;
  fluid?: boolean;
}

export const iOS26LiquidInput = forwardRef<HTMLInputElement, iOS26LiquidInputProps>(({
  label,
  error,
  helperText,
  icon,
  endIcon,
  size = 'md',
  variant = 'medium',
  onClear,
  showClear = false,
  fluid = false,
  className,
  onFocus,
  onBlur,
  onChange,
  value,
  disabled,
  ...props
}, ref) => {
  const { reduceMotion, theme } = useIOS26();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setHasValue(!!value);
  }, [value]);
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };
  
  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    setHasValue(false);
  };
  
  const sizeClasses = {
    sm: {
      container: 'h-9',
      input: 'text-sm px-3',
      label: 'text-xs',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'h-11',
      input: 'text-base px-4',
      label: 'text-sm',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'h-14',
      input: 'text-lg px-5',
      label: 'text-base',
      icon: 'w-6 h-6'
    }
  };
  
  const sizeConfig = sizeClasses[size];
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative',
        fluid && 'w-full',
        className
      )}
    >
      {/* Label */}
      {label && (
        <motion.label
          className={cn(
            'absolute left-4 transition-all duration-200 pointer-events-none z-10',
            sizeConfig.label,
            'text-gray-600 dark:text-gray-400',
            (isFocused || hasValue) && 'transform -translate-y-6 scale-90',
            !isFocused && !hasValue && 'top-1/2 -translate-y-1/2',
            (isFocused || hasValue) && 'top-0'
          )}
          htmlFor={props.id}
        >
          {label}
        </motion.label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        <motion.div
          className={cn(
            'relative rounded-xl overflow-hidden',
            'ios26-glass',
            `ios26-glass-${variant}`,
            sizeConfig.container,
            error && 'ring-2 ring-red-500',
            disabled && 'opacity-50'
          )}
          animate={{
            scale: isFocused && !reduceMotion ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Icon */}
          {icon && (
            <div className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400',
              sizeConfig.icon
            )}>
              {icon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={ref}
            className={cn(
              'w-full h-full bg-transparent outline-none',
              sizeConfig.input,
              icon && 'pl-10',
              (endIcon || (showClear && hasValue)) && 'pr-10',
              'text-gray-900 dark:text-white',
              'placeholder-gray-500 dark:placeholder-gray-400',
              label && 'pt-4'
            )}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            {...props}
          />
          
          {/* End Icon / Clear Button */}
          {(endIcon || (showClear && hasValue)) && (
            <div className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              sizeConfig.icon
            )}>
              <AnimatePresence mode="wait">
                {showClear && hasValue ? (
                  <motion.button
                    key="clear"
                    type="button"
                    onClick={handleClear}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                ) : endIcon ? (
                  <motion.div
                    key="icon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-500 dark:text-gray-400"
                  >
                    {endIcon}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
          
          {/* Focus Ring Animation */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{
              boxShadow: isFocused 
                ? `0 0 0 2px ${theme === 'elegant' ? '#8B5CF6' : '#3B82F6'}40`
                : '0 0 0 0px transparent'
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      </div>
      
      {/* Helper Text / Error */}
      <AnimatePresence mode="wait">
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn(
              'mt-1 text-xs px-1',
              error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

iOS26LiquidInput.displayName = 'iOS26LiquidInput';