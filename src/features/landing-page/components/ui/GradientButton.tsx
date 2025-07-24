import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { ComponentVariant, ComponentSize, LoadingState } from '../../types';

interface GradientButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: ComponentVariant;
  size?: ComponentSize;
  gradient?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingState?: LoadingState;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
  animated?: boolean;
  onClick?: () => void;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  type?: 'button' | 'submit' | 'reset';
}

const variantMap: Record<ComponentVariant, { gradient: string; hover: string; text: string }> = {
  primary: {
    gradient: 'bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600',
    hover: 'hover:from-lime-500 hover:via-lime-600 hover:to-lime-700',
    text: 'text-white'
  },
  secondary: {
    gradient: 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600',
    hover: 'hover:from-purple-500 hover:via-purple-600 hover:to-purple-700',
    text: 'text-white'
  },
  accent: {
    gradient: 'bg-gradient-to-r from-lime-400 via-purple-500 to-purple-600',
    hover: 'hover:from-lime-500 hover:via-purple-600 hover:to-purple-700',
    text: 'text-white'
  },
  success: {
    gradient: 'bg-gradient-to-r from-green-400 via-green-500 to-green-600',
    hover: 'hover:from-green-500 hover:via-green-600 hover:to-green-700',
    text: 'text-white'
  },
  warning: {
    gradient: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600',
    hover: 'hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700',
    text: 'text-white'
  },
  error: {
    gradient: 'bg-gradient-to-r from-red-400 via-red-500 to-red-600',
    hover: 'hover:from-red-500 hover:via-red-600 hover:to-red-700',
    text: 'text-white'
  },
  ghost: {
    gradient: 'bg-transparent border-2 border-white/20',
    hover: 'hover:bg-white/10 hover:border-white/30',
    text: 'text-white'
  },
  outline: {
    gradient: 'bg-transparent border-2 border-current',
    hover: 'hover:bg-current/10',
    text: 'text-lime-400'
  }
};

const sizeMap: Record<ComponentSize, { padding: string; text: string; icon: string }> = {
  xs: {
    padding: 'px-3 py-1.5',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  sm: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  md: {
    padding: 'px-6 py-3',
    text: 'text-base',
    icon: 'w-5 h-5'
  },
  lg: {
    padding: 'px-8 py-4',
    text: 'text-lg',
    icon: 'w-6 h-6'
  },
  xl: {
    padding: 'px-10 py-5',
    text: 'text-xl',
    icon: 'w-7 h-7'
  }
};

const LoadingSpinner = ({ size = 'md' }: { size?: ComponentSize }) => (
  <svg 
    className={cn('animate-spin', sizeMap[size].icon)} 
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
);

export function GradientButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  gradient,
  disabled = false,
  loading = false,
  loadingState = 'idle',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = true,
  glow = false,
  animated = true,
  onClick,
  href,
  target,
  type = 'button',
  ...props
}: GradientButtonProps) {
  const variantConfig = variantMap[variant];
  const sizeConfig = sizeMap[size];
  const isLoading = loading || loadingState === 'loading';
  const isDisabled = disabled || isLoading;

  const baseClasses = cn(
    'relative inline-flex items-center justify-center',
    'font-semibold transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'overflow-hidden',
    {
      'w-full': fullWidth,
      'rounded-full': rounded,
      'rounded-lg': !rounded,
      'shadow-lg': glow,
      'shadow-lime-500/25 hover:shadow-lime-500/40': glow && variant === 'primary',
      'shadow-purple-500/25 hover:shadow-purple-500/40': glow && variant === 'secondary',
    },
    sizeConfig.padding,
    sizeConfig.text,
    gradient || variantConfig.gradient,
    !isDisabled && variantConfig.hover,
    variantConfig.text,
    className
  );

  const buttonContent = (
    <>
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading && <LoadingSpinner size={size} />}
        {!isLoading && icon && iconPosition === 'left' && (
          <span className={cn(sizeConfig.icon)}>{icon}</span>
        )}
        <span className={cn({ 'opacity-0': isLoading })}>{children}</span>
        {!isLoading && icon && iconPosition === 'right' && (
          <span className={cn(sizeConfig.icon)}>{icon}</span>
        )}
      </div>
    </>
  );

  const buttonElement = href ? (
    <a
      href={href}
      target={target}
      className={baseClasses}
      {...props}
    >
      {buttonContent}
    </a>
  ) : (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={baseClasses}
      {...props}
    >
      {buttonContent}
    </button>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={!isDisabled ? { scale: 1.05 } : undefined}
        whileTap={!isDisabled ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {buttonElement}
      </motion.div>
    );
  }

  return buttonElement;
}

// Specialized button variants
export function PrimaryButton(props: Omit<GradientButtonProps, 'variant'>) {
  return <GradientButton variant="primary" glow {...props} />;
}

export function SecondaryButton(props: Omit<GradientButtonProps, 'variant'>) {
  return <GradientButton variant="secondary" {...props} />;
}

export function AccentButton(props: Omit<GradientButtonProps, 'variant'>) {
  return <GradientButton variant="accent" glow {...props} />;
}

export function GhostButton(props: Omit<GradientButtonProps, 'variant'>) {
  return <GradientButton variant="ghost" {...props} />;
}

export function OutlineButton(props: Omit<GradientButtonProps, 'variant'>) {
  return <GradientButton variant="outline" {...props} />;
}

export function CTAButton({
  children,
  className,
  ...props
}: Omit<GradientButtonProps, 'variant' | 'size' | 'glow'>) {
  return (
    <GradientButton
      variant="accent"
      size="lg"
      glow
      className={cn('px-12 py-4 text-lg font-bold', className)}
      {...props}
    >
      {children}
    </GradientButton>
  );
}

export function FloatingActionButton({
  children,
  className,
  ...props
}: Omit<GradientButtonProps, 'variant' | 'size' | 'rounded' | 'glow'>) {
  return (
    <GradientButton
      variant="primary"
      size="lg"
      rounded
      glow
      className={cn('fixed bottom-6 right-6 z-50 shadow-2xl', className)}
      {...props}
    >
      {children}
    </GradientButton>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: Omit<GradientButtonProps, 'size' | 'rounded'>) {
  return (
    <GradientButton
      size="md"
      rounded
      className={cn('p-3 aspect-square', className)}
      {...props}
    >
      {children}
    </GradientButton>
  );
}

export function NavButton({
  children,
  className,
  ...props
}: Omit<GradientButtonProps, 'variant' | 'size'>) {
  return (
    <GradientButton
      variant="ghost"
      size="sm"
      className={cn('px-4 py-2', className)}
      {...props}
    >
      {children}
    </GradientButton>
  );
}