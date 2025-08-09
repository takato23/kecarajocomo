/**
 * KeButton - Botón principal del design system KeCarajoComer
 * Mobile-first, glassmorphism, estados de loading
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const KeButton = forwardRef<HTMLButtonElement, KeButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}, ref) => {
  
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium transition-all duration-200 ease-in-out
    rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2
    backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95 transform-gpu
  `;

  const variants = {
    primary: `
      bg-green-600/90 hover:bg-green-700/90 text-white border-green-600/20
      shadow-lg shadow-green-600/25 hover:shadow-green-600/40
      focus:ring-green-500 backdrop-blur-md
    `,
    secondary: `
      bg-gray-100/80 hover:bg-gray-200/80 text-gray-900 border-gray-200/50
      dark:bg-gray-800/80 dark:hover:bg-gray-700/80 dark:text-white dark:border-gray-700/50
      shadow-md focus:ring-gray-400
    `,
    outline: `
      bg-white/50 hover:bg-white/70 text-green-700 border-green-300/60
      dark:bg-gray-900/50 dark:hover:bg-gray-800/70 dark:text-green-400 dark:border-green-700/60
      shadow-sm focus:ring-green-500
    `,
    ghost: `
      bg-transparent hover:bg-green-50/80 text-green-700 border-transparent
      dark:hover:bg-green-900/20 dark:text-green-400
      focus:ring-green-500
    `,
    danger: `
      bg-red-600/90 hover:bg-red-700/90 text-white border-red-600/20
      shadow-lg shadow-red-600/25 hover:shadow-red-600/40
      focus:ring-red-500
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]', // Touch-friendly mobile
    lg: 'px-6 py-4 text-lg min-h-[52px]',
    xl: 'px-8 py-5 text-xl min-h-[60px]'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  // Fallback para entorno de tests donde motion.button puede no estar mockeado
  const MotionButton: React.ElementType = (motion as unknown as { button?: React.ElementType })?.button ?? 'button';

  return (
    <MotionButton
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {loading && (
        <Loader2 className={cn(iconSizes[size], 'mr-2 animate-spin')} />
      )}
      
      {!loading && leftIcon && (
        <span className={cn(iconSizes[size], 'mr-2')}>
          {leftIcon}
        </span>
      )}
      
      <span className="truncate">
        {children}
      </span>
      
      {!loading && rightIcon && (
        <span className={cn(iconSizes[size], 'ml-2')}>
          {rightIcon}
        </span>
      )}
    </MotionButton>
  );
});

KeButton.displayName = 'KeButton';

export { KeButton };
export type { KeButtonProps };