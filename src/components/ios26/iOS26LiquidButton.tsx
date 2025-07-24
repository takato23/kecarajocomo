/**
 * iOS26 Liquid Button Component
 * Premium button with liquid press animations and glass effects
 */

'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { iOS26Tokens } from '@/styles/ios26/tokens';

import { useIOS26 } from './iOS26Provider';

export interface iOS26LiquidButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fluid?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  pulse?: boolean;
  glow?: boolean;
  className?: string;
}

export const iOS26LiquidButton = forwardRef<HTMLButtonElement, iOS26LiquidButtonProps>((props, ref) => {
  const {
    children,
    variant = 'primary',
    size = 'md',
    fluid = false,
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    pulse = false,
    glow = false,
    className,
    onClick,
    ...restProps
  } = props;
  const { theme, reduceMotion } = useIOS26();
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: string }>>([]);
  const [isPressed, setIsPressed] = useState(false);
  
  const isDisabled = disabled || loading;
  const themeConfig = iOS26Tokens.themes[theme];
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled || reduceMotion) {
      onClick?.(e);
      return;
    }
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now().toString();
    
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
    
    onClick?.(e);
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3'
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          className: 'text-white',
          background: themeConfig.gradient.primary,
          hoverBackground: themeConfig.gradient.secondary
        };
      case 'secondary':
        return {
          className: 'ios26-glass ios26-glass-medium',
          background: 'transparent',
          hoverBackground: 'rgba(255, 255, 255, 0.1)'
        };
      case 'ghost':
        return {
          className: 'hover:bg-white/10 dark:hover:bg-black/10',
          background: 'transparent',
          hoverBackground: 'transparent'
        };
      case 'danger':
        return {
          className: 'text-white',
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          hoverBackground: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
        };
      case 'success':
        return {
          className: 'text-white',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          hoverBackground: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  const buttonVariants = {
    initial: { scale: 1 },
    hover: !isDisabled && !reduceMotion ? { scale: 1.05 } : {},
    tap: !isDisabled && !reduceMotion ? { scale: 0.95 } : {}
  };
  
  const pulseAnimation = pulse && !reduceMotion && !isDisabled ? {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1]
  } : {};
  
  const glowAnimation = glow && !reduceMotion && !isDisabled ? {
    boxShadow: [
      '0 4px 24px rgba(0, 0, 0, 0.08)',
      `0 8px 32px ${themeConfig.primary}40`,
      '0 4px 24px rgba(0, 0, 0, 0.08)'
    ]
  } : {};
  
  
  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative rounded-xl font-medium transition-all overflow-hidden',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        `focus:ring-${themeConfig.primary}`,
        sizeClasses[size],
        variantStyles.className,
        fluid && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        background: variantStyles.background
      }}
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={{
        ...pulseAnimation,
        ...glowAnimation
      }}
      transition={{
        duration: pulse || glow ? 2 : 0.2,
        repeat: (pulse || glow) && !reduceMotion ? Infinity : 0,
        ease: 'easeInOut'
      }}
      onClick={handleClick}
      disabled={isDisabled}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      {...restProps}
    >
      {/* Hover gradient overlay */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{ background: variantStyles.hoverBackground }}
          animate={{ opacity: isPressed ? 0.8 : 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content */}
      <motion.div
        className={cn(
          'relative z-10 flex items-center justify-center',
          loading && 'opacity-0'
        )}
      >
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </motion.div>
      
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="w-10 h-10 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.button>
  );
});

iOS26LiquidButton.displayName = 'iOS26LiquidButton';