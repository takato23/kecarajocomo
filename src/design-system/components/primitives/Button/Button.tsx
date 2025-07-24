import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus:ring-orange-500',
        secondary: 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 focus:ring-teal-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-500',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500',
        outline: 'border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-base rounded-lg gap-2',
        lg: 'h-12 px-6 text-lg rounded-xl gap-2.5',
        icon: 'h-10 w-10 rounded-lg p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    isLoading, 
    leftIcon,
    rightIcon,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Cargando...</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              {leftIcon && (
                <span className={cn(children && "mr-2")}>{leftIcon}</span>
              )}
              {children}
              {rightIcon && (
                <span className={cn(children && "ml-2")}>{rightIcon}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';