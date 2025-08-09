/**
 * KeInput - Input principal del design system KeCarajoComer
 * Mobile-first, glassmorphism, validación visual
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface KeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search' | 'numeric';
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
}

const KeInput = forwardRef<HTMLInputElement, KeInputProps>(({
  label,
  error,
  success,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  fullWidth = true,
  showPasswordToggle = false,
  type = 'text',
  className,
  id,
  ...props
}, ref) => {
  
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputId = id || `ke-input-${Math.random().toString(36).substr(2, 9)}`;
  const actualType = (type === 'password' && showPassword) ? 'text' : type;
  
  const baseStyles = `
    w-full px-4 py-3 text-base rounded-xl border transition-all duration-200
    bg-white/80 backdrop-blur-sm placeholder:text-gray-500
    dark:bg-gray-900/80 dark:text-white dark:placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    min-h-[44px] touch-manipulation
  `;

  const variants = {
    default: `
      border-gray-300/60 focus:border-green-500 focus:ring-green-500/20
      dark:border-gray-600/60 dark:focus:border-green-400
    `,
    search: `
      border-gray-300/60 focus:border-blue-500 focus:ring-blue-500/20
      dark:border-gray-600/60 dark:focus:border-blue-400
      rounded-full px-5
    `,
    numeric: `
      border-gray-300/60 focus:border-purple-500 focus:ring-purple-500/20
      dark:border-gray-600/60 dark:focus:border-purple-400
      text-right font-mono
    `
  };

  const stateStyles = error 
    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
    : success 
    ? 'border-green-500/60 focus:border-green-500 focus:ring-green-500/20'
    : variants[variant];

  return (
    <div className={cn('space-y-2', fullWidth ? 'w-full' : 'w-auto')}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <div className="w-5 h-5">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input */}
        <motion.input
          ref={ref}
          id={inputId}
          type={actualType}
          className={cn(
            baseStyles,
            stateStyles,
            leftIcon && 'pl-11',
            (rightIcon || showPasswordToggle || error || success) && 'pr-11',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.15 }}
          {...props}
        />

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Success Icon */}
          {success && !error && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          
          {/* Error Icon */}
          {error && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          
          {/* Password Toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
          
          {/* Custom Right Icon */}
          {rightIcon && !error && !success && (
            <div className="text-gray-400">
              <div className="w-5 h-5">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      {(error || success || hint) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </p>
          )}
          
          {success && !error && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {success}
            </p>
          )}
          
          {hint && !error && !success && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hint}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
});

KeInput.displayName = 'KeInput';

export { KeInput };
export type { KeInputProps };