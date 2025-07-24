'use client';

import React, { forwardRef, InputHTMLAttributes, useState, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface iOS26EnhancedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  showPasswordToggle?: boolean;
  liquidEffect?: boolean;
  glowOnFocus?: boolean;
  floatingLabel?: boolean;
}

const iOS26EnhancedInput = forwardRef<HTMLInputElement, iOS26EnhancedInputProps>(
  ({ 
    className,
    label,
    error,
    success,
    helperText,
    icon,
    clearable = false,
    showPasswordToggle = false,
    liquidEffect = true,
    glowOnFocus = true,
    floatingLabel = true,
    type = 'text',
    value,
    onChange,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      if (inputRef.current) {
        const event = new Event('input', { bubbles: true });
        inputRef.current.value = '';
        inputRef.current.dispatchEvent(event);
        setInternalValue('');
      }
    };

    const hasValue = Boolean(internalValue || value);
    const shouldShowPasswordToggle = showPasswordToggle && type === 'password';
    const inputType = shouldShowPasswordToggle && showPassword ? 'text' : type;

    const inputClasses = cn(
      "w-full bg-transparent outline-none transition-all duration-300",
      "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
      icon && "pl-10",
      (clearable || shouldShowPasswordToggle) && "pr-10",
      floatingLabel && label && "pt-5 pb-1",
      !floatingLabel && "py-3",
      "px-4",
      className
    );

    const wrapperClasses = cn(
      "relative group overflow-hidden rounded-xl transition-all duration-300",
      "ios26-liquid-glass border",
      liquidEffect && "ios26-liquid-transform",
      error 
        ? "border-red-500/50 bg-red-50/5" 
        : success 
        ? "border-green-500/50 bg-green-50/5"
        : "border-white/20 hover:border-white/30",
      isFocused && !error && !success && "border-food-fresh/50 shadow-lg shadow-food-fresh/10",
      glowOnFocus && isFocused && "ios26-liquid-glow"
    );

    return (
      <div className="w-full">
        <div className={wrapperClasses}>
          {/* Background gradient effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-liquid-shimmer" />
          </div>

          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
              <motion.div
                animate={{ 
                  scale: isFocused ? 1.1 : 1,
                  color: isFocused ? 'var(--food-fresh)' : undefined
                }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            </div>
          )}

          {/* Floating Label */}
          {floatingLabel && label && (
            <motion.label
              animate={{
                scale: hasValue || isFocused ? 0.8 : 1,
                y: hasValue || isFocused ? -10 : 0,
                x: hasValue || isFocused ? -4 : 0,
              }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
              className={cn(
                "absolute left-4 top-3 text-gray-500 dark:text-gray-400 pointer-events-none",
                "origin-left transition-all duration-200",
                icon && "left-14",
                (hasValue || isFocused) && "text-xs",
                isFocused && !error && !success && "text-food-fresh"
              )}
            >
              {label}
            </motion.label>
          )}

          {/* Input */}
          <input
            ref={(node) => {
              if (ref) {
                if (typeof ref === 'function') ref(node);
                else ref.current = node;
              }
              if (node) inputRef.current = node;
            }}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={inputClasses}
            {...props}
          />

          {/* Clear button */}
          <AnimatePresence>
            {clearable && hasValue && !shouldShowPasswordToggle && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={handleClear}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-glass-medium transition-colors"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Password toggle */}
          {shouldShowPasswordToggle && (
            <button
              onClick={() => setShowPassword(!showPassword)}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-glass-medium transition-colors"
            >
              <motion.div
                key={showPassword ? 'hide' : 'show'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </motion.div>
            </button>
          )}

          {/* Focus ring effect */}
          <div className={cn(
            "absolute inset-0 rounded-xl pointer-events-none transition-all duration-300",
            isFocused && "ring-2 ring-food-fresh/50 ring-offset-2 ring-offset-transparent"
          )} />

          {/* Liquid wave effect on focus */}
          {liquidEffect && (
            <motion.div
              initial={false}
              animate={isFocused ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3, repeat: isFocused ? Infinity : 0, repeatDelay: 1 }}
              className="absolute inset-0 rounded-xl pointer-events-none"
            />
          )}
        </div>

        {/* Helper text */}
        <AnimatePresence>
          {(error || success || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "mt-1.5 text-xs px-4",
                error && "text-red-500",
                success && "text-green-500",
                !error && !success && "text-gray-500 dark:text-gray-400"
              )}
            >
              {error || success || helperText}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Non-floating label */}
        {!floatingLabel && label && (
          <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
      </div>
    );
  }
);

iOS26EnhancedInput.displayName = 'iOS26EnhancedInput';

export { iOS26EnhancedInput };