import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { GlassConfig, GlassIntensity, BlurIntensity, BorderRadius } from '../../types';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: GlassIntensity;
  blur?: BlurIntensity;
  border?: boolean;
  borderRadius?: BorderRadius;
  shadow?: boolean;
  hover?: boolean;
  animated?: boolean;
  gradient?: string;
  onClick?: () => void;
}

const glassIntensityMap: Record<GlassIntensity, GlassConfig> = {
  light: {
    backdrop: 'backdrop-blur-sm',
    border: 'border-white/10',
    shadow: 'shadow-lg',
    opacity: 0.8
  },
  medium: {
    backdrop: 'backdrop-blur-md',
    border: 'border-white/20',
    shadow: 'shadow-xl',
    opacity: 0.9
  },
  heavy: {
    backdrop: 'backdrop-blur-lg',
    border: 'border-white/30',
    shadow: 'shadow-2xl',
    opacity: 0.95
  }
};

const blurMap: Record<BlurIntensity, string> = {
  none: '',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
  '3xl': 'backdrop-blur-3xl'
};

const radiusMap: Record<BorderRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full'
};

export function GlassCard({
  children,
  className,
  intensity = 'medium',
  blur,
  border = true,
  borderRadius = 'xl',
  shadow = true,
  hover = false,
  animated = true,
  gradient,
  onClick
}: GlassCardProps) {
  const glassConfig = glassIntensityMap[intensity];
  const blurClass = blur ? blurMap[blur] : glassConfig.backdrop;
  const radiusClass = radiusMap[borderRadius];

  const baseClasses = cn(
    'relative overflow-hidden',
    'bg-white/10 dark:bg-white/5',
    blurClass,
    radiusClass,
    {
      [glassConfig.border]: border,
      [glassConfig.shadow]: shadow,
      'hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300': hover,
      'cursor-pointer': onClick
    }
  );

  const cardContent = (
    <div className={cn(baseClasses, className)} onClick={onClick}>
      {/* Gradient background overlay */}
      {gradient && (
        <div 
          className={cn(
            'absolute inset-0 opacity-20',
            gradient
          )}
        />
      )}
      
      {/* Glossy highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-60" />
      
      {/* Border highlight */}
      {border && (
        <div className="absolute inset-0 rounded-[inherit] border border-white/20 dark:border-white/10" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

// Specialized glass card variants
export function GlassFeatureCard({
  children,
  className,
  gradient,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="medium"
      blur="md"
      gradient={gradient}
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassHeroCard({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="light"
      blur="lg"
      borderRadius="2xl"
      className={cn('p-8', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassPricingCard({
  children,
  className,
  popular = false,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'> & { popular?: boolean }) {
  return (
    <GlassCard
      intensity={popular ? 'heavy' : 'medium'}
      blur="md"
      borderRadius="xl"
      className={cn(
        'p-6',
        {
          'ring-2 ring-lime-400/50 ring-offset-2 ring-offset-transparent': popular,
          'scale-105': popular
        },
        className
      )}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassTestimonialCard({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="medium"
      blur="sm"
      borderRadius="lg"
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassNavCard({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="light"
      blur="md"
      borderRadius="2xl"
      className={cn('p-4', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassModalCard({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="heavy"
      blur="xl"
      borderRadius="2xl"
      shadow={true}
      className={cn('p-8', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassStatsCard({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="medium"
      blur="md"
      borderRadius="xl"
      className={cn('p-4', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassButtonCard({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'intensity' | 'blur'>) {
  return (
    <GlassCard
      intensity="light"
      blur="sm"
      borderRadius="lg"
      hover={true}
      className={cn('p-3', className)}
      {...props}
    >
      {children}
    </GlassCard>
  );
}