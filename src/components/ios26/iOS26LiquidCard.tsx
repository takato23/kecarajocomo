/**
 * iOS26 Liquid Card Component
 * Premium glassmorphic card with liquid animations
 */

'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';

import { useIOS26 } from './iOS26Provider';

export interface iOS26LiquidCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: React.ReactNode;
  variant?: 'subtle' | 'medium' | 'strong' | 'ultra';
  interactive?: boolean;
  glow?: boolean;
  morph?: boolean;
  shimmer?: boolean;
  gradient?: boolean;
  className?: string;
}

export const iOS26LiquidCard = forwardRef<HTMLDivElement, iOS26LiquidCardProps>((props, ref) => {
  const {
    children,
    variant = 'medium',
    interactive = true,
    glow = false,
    morph = false,
    shimmer = false,
    gradient = true,
    className,
    onHoverStart,
    onHoverEnd,
    onTapStart,
    onTapEnd,
    ...restProps
  } = props;
  const { reduceMotion, theme } = useIOS26();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: string }>>([]);
  
  const handleHoverStart = (e: any) => {
    setIsHovered(true);
    onHoverStart?.(e);
  };
  
  const handleHoverEnd = (e: any) => {
    setIsHovered(false);
    onHoverEnd?.(e);
  };
  
  const handleTapStart = (e: any) => {
    setIsPressed(true);
    onTapStart?.(e);
  };
  
  const handleTapEnd = (e: any) => {
    setIsPressed(false);
    onTapEnd?.(e);
  };
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || reduceMotion) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now().toString();
    
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 800);
  };
  
  const cardVariants = {
    initial: { scale: 1 },
    hover: interactive && !reduceMotion ? { scale: 1.02 } : {},
    tap: interactive && !reduceMotion ? { scale: 0.98 } : {}
  };
  
  const glowAnimation = glow && !reduceMotion ? {
    boxShadow: [
      '0 8px 32px rgba(0, 0, 0, 0.12)',
      '0 8px 40px rgba(139, 92, 246, 0.3)',
      '0 8px 32px rgba(0, 0, 0, 0.12)'
    ]
  } : {};
  
  const morphAnimation = morph && !reduceMotion ? {
    borderRadius: ['1rem', '1.25rem', '0.875rem', '1.125rem', '1rem']
  } : {};
  
  // No need to filter props here since they're already extracted

  return (
    <motion.div
      ref={ref}
      className={cn(
        'ios26-glass ios26-glass-card',
        `ios26-glass-${variant}`,
        'relative p-6',
        glow && 'ios26-glow',
        morph && 'ios26-liquid',
        shimmer && 'ios26-shimmer',
        className
      )}
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={{
        ...glowAnimation,
        ...morphAnimation
      }}
      transition={{
        duration: morph ? 8 : glow ? 2 : 0.3,
        repeat: (glow || morph) && !reduceMotion ? Infinity : 0,
        ease: 'easeInOut'
      }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onTapStart={handleTapStart}
      onTapEnd={handleTapEnd}
      onClick={handleClick}
      {...restProps}
    >
      {/* Gradient overlay */}
      {gradient && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 60%)`,
            opacity: isHovered ? 0.8 : 0.5,
            transition: 'opacity 300ms ease'
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Shimmer effect */}
      {shimmer && !reduceMotion && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          <div className="ios26-shimmer absolute inset-0" />
        </div>
      )}
      
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
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="w-10 h-10 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Pressed state overlay */}
      <AnimatePresence>
        {isPressed && interactive && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              background: 'rgba(0, 0, 0, 0.05)'
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

iOS26LiquidCard.displayName = 'iOS26LiquidCard';