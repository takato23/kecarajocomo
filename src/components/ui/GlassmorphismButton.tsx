'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type MealTheme = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'neutral';

interface GlassmorphismButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  mealTheme?: MealTheme;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
}

const variantStyles = {
  primary: {
    base: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 text-blue-600 dark:text-blue-400',
    hover: 'hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/40',
    glow: 'shadow-lg shadow-blue-500/20'
  },
  secondary: {
    base: 'bg-white/10 border-white/20 text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-white/20 hover:border-white/30',
    glow: 'shadow-lg shadow-black/10 dark:shadow-white/10'
  },
  accent: {
    base: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-600 dark:text-purple-400',
    hover: 'hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/40',
    glow: 'shadow-lg shadow-purple-500/20'
  },
  success: {
    base: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-600 dark:text-green-400',
    hover: 'hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/40',
    glow: 'shadow-lg shadow-green-500/20'
  },
  warning: {
    base: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-600 dark:text-yellow-400',
    hover: 'hover:from-yellow-500/30 hover:to-orange-500/30 hover:border-yellow-400/40',
    glow: 'shadow-lg shadow-yellow-500/20'
  },
  danger: {
    base: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-400/30 text-red-600 dark:text-red-400',
    hover: 'hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/40',
    glow: 'shadow-lg shadow-red-500/20'
  },
  ghost: {
    base: 'bg-transparent border-transparent text-gray-600 dark:text-gray-400',
    hover: 'hover:bg-white/10 hover:border-white/20',
    glow: ''
  }
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-6 py-3 text-base font-semibold',
  xl: 'px-8 py-4 text-lg font-bold'
};

const mealThemeStyles = {
  desayuno: {
    base: 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 border-amber-400/30 text-amber-600 dark:text-amber-400',
    hover: 'hover:from-amber-400/30 hover:to-orange-400/30 hover:border-amber-400/40',
    glow: 'shadow-lg shadow-amber-500/20'
  },
  almuerzo: {
    base: 'bg-gradient-to-r from-blue-400/20 to-cyan-400/20 border-blue-400/30 text-blue-600 dark:text-blue-400',
    hover: 'hover:from-blue-400/30 hover:to-cyan-400/30 hover:border-blue-400/40',
    glow: 'shadow-lg shadow-blue-500/20'
  },
  merienda: {
    base: 'bg-gradient-to-r from-green-400/20 to-emerald-400/20 border-green-400/30 text-green-600 dark:text-green-400',
    hover: 'hover:from-green-400/30 hover:to-emerald-400/30 hover:border-green-400/40',
    glow: 'shadow-lg shadow-green-500/20'
  },
  cena: {
    base: 'bg-gradient-to-r from-purple-400/20 to-pink-400/20 border-purple-400/30 text-purple-600 dark:text-purple-400',
    hover: 'hover:from-purple-400/30 hover:to-pink-400/30 hover:border-purple-400/40',
    glow: 'shadow-lg shadow-purple-500/20'
  },
  neutral: {
    base: 'bg-white/10 border-white/20 text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-white/20 hover:border-white/30',
    glow: 'shadow-lg shadow-black/10 dark:shadow-white/10'
  }
};

export function GlassmorphismButton({
  children,
  variant = 'secondary',
  size = 'md',
  mealTheme,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  onClick,
  onHover
}: GlassmorphismButtonProps) {
  const { effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';

  // Use meal theme styles if provided, otherwise use variant styles
  const styles = mealTheme ? mealThemeStyles[mealTheme] : variantStyles[variant];

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onHoverStart={() => onHover?.(true)}
      onHoverEnd={() => onHover?.(false)}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        // Base glassmorphism styling
        "relative overflow-hidden rounded-xl backdrop-blur-[12px] border transition-all duration-300",
        "flex items-center justify-center gap-2",
        "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent",
        
        // Size styles
        sizeStyles[size],
        
        // Theme styles
        styles.base,
        styles.hover,
        styles.glow,
        
        // State styles
        disabled && "opacity-50 cursor-not-allowed",
        loading && "cursor-wait",
        fullWidth && "w-full",
        
        // Custom className
        className
      )}
    >
      {/* Inner glow effect */}
      <div className={cn(
        "absolute inset-[1px] rounded-xl border transition-all duration-300",
        isDarkMode ? "border-white/[0.02]" : "border-white/[0.05]"
      )} />

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        whileHover={{ opacity: [0, 1, 0], x: [-100, 200] }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        {/* Loading spinner */}
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}

        {/* Left icon */}
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className={cn(
            "transition-transform duration-300",
            size === 'sm' ? "w-3 h-3" : 
            size === 'md' ? "w-4 h-4" : 
            size === 'lg' ? "w-5 h-5" : "w-6 h-6"
          )} />
        )}

        {/* Children content */}
        <span className="relative z-10">
          {children}
        </span>

        {/* Right icon */}
        {Icon && iconPosition === 'right' && !loading && (
          <Icon className={cn(
            "transition-transform duration-300",
            size === 'sm' ? "w-3 h-3" : 
            size === 'md' ? "w-4 h-4" : 
            size === 'lg' ? "w-5 h-5" : "w-6 h-6"
          )} />
        )}
      </div>

      {/* Background animation for special states */}
      {(variant === 'primary' || mealTheme) && (
        <motion.div
          className="absolute inset-0 opacity-0 bg-gradient-to-r from-current/5 via-current/10 to-current/5"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// Specialized meal-themed button variants
export function DesayunoButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="desayuno" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

export function AlmuerzoButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="almuerzo" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

export function MeriendaButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="merienda" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

export function CenaButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'mealTheme'>) {
  return (
    <GlassmorphismButton mealTheme="cena" {...props}>
      {children}
    </GlassmorphismButton>
  );
}

// AI-themed button for meal generation
export function AIGenerateButton({ children, ...props }: Omit<GlassmorphismButtonProps, 'variant' | 'className'>) {
  return (
    <GlassmorphismButton
      variant="accent"
      className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border-purple-400/30 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-orange-500/30 text-white font-semibold"
      {...props}
    >
      {children}
    </GlassmorphismButton>
  );
}