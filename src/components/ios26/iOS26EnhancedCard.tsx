'use client';

import React, { forwardRef, HTMLAttributes, useState } from 'react';

import { cn } from '@/lib/utils';

export interface iOS26EnhancedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'liquid' | 'glass' | 'aurora' | 'ocean' | 'sunset' | 'forest';
  elevation?: 'low' | 'medium' | 'high' | 'floating';
  liquidEffect?: boolean;
  glowEffect?: boolean;
  morphEffect?: boolean;
  floatEffect?: boolean;
  interactive?: boolean;
  gradient?: boolean;
  children: React.ReactNode;
}

const iOS26EnhancedCard = forwardRef<HTMLDivElement, iOS26EnhancedCardProps>(
  ({ 
    className, 
    variant = 'liquid', 
    elevation = 'medium',
    liquidEffect = true,
    glowEffect = false,
    morphEffect = false,
    floatEffect = false,
    interactive = false,
    gradient = false,
    children,
    // Filter out custom props before spreading
    ...restProps 
  }, ref) => {
    // Remove custom props that shouldn't be passed to DOM
    const domProps = Object.entries(restProps).reduce((acc, [key, value]) => {
      // Only include standard HTML attributes
      if (!['variant', 'elevation', 'liquidEffect', 'glowEffect', 'morphEffect', 'floatEffect', 'interactive', 'gradient'].includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {} as HTMLAttributes<HTMLDivElement>);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
    };

    const elevationClasses = {
      low: 'shadow-md hover:shadow-lg',
      medium: 'shadow-lg hover:shadow-xl',
      high: 'shadow-xl hover:shadow-2xl',
      floating: 'shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]',
    };

    const variantClasses = {
      liquid: 'ios26-liquid-glass bg-glass-soft',
      glass: 'ios26-liquid-glass bg-glass-medium',
      aurora: gradient ? 'ios26-liquid-glass ios26-liquid-gradient' : 'ios26-liquid-glass bg-glass-light',
      ocean: gradient ? 'ios26-liquid-glass bg-gradient-to-br from-liquid-ocean-from to-liquid-ocean-to' : 'ios26-liquid-glass bg-glass-light',
      sunset: gradient ? 'ios26-liquid-glass bg-gradient-to-br from-liquid-sunset-from to-liquid-sunset-to' : 'ios26-liquid-glass bg-glass-light',
      forest: gradient ? 'ios26-liquid-glass bg-gradient-to-br from-liquid-forest-from to-liquid-forest-to' : 'ios26-liquid-glass bg-glass-light',
    };

    const effectClasses = cn(
      liquidEffect && 'ios26-liquid-wave',
      glowEffect && 'ios26-liquid-glow',
      morphEffect && 'ios26-liquid-morph',
      floatEffect && 'animate-glass-float',
      interactive && 'ios26-liquid-transform cursor-pointer'
    );

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-3xl p-6',
          'backdrop-blur-lg border border-white/10',
          'transition-all duration-500',
          elevationClasses[elevation],
          variantClasses[variant],
          effectClasses,
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        style={interactive ? {
          '--mouse-x': `${mousePosition.x}%`,
          '--mouse-y': `${mousePosition.y}%`,
        } as React.CSSProperties : undefined}
        {...domProps}
      >
        {/* Background gradient layer */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
        </div>

        {/* Interactive light effect */}
        {interactive && (
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-out"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
              inset: 0,
              opacity: isHovered ? 1 : 0,
            }}
          />
        )}

        {/* Animated shimmer effect */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
          "opacity-0 -translate-x-full",
          isHovered && "animate-liquid-shimmer opacity-100"
        )} />

        {/* Refraction layers */}
        <div className="absolute inset-0 animate-refraction-shift opacity-20">
          <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-gradient-radial from-food-fresh/10 to-transparent blur-3xl" />
          <div className="absolute bottom-[-50%] right-[-50%] w-full h-full bg-gradient-radial from-food-warm/10 to-transparent blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Glow effect overlay */}
        {glowEffect && (
          <div className="absolute inset-0 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-[-4px] rounded-3xl bg-gradient-to-r from-food-fresh/20 via-food-warm/20 to-food-rich/20 blur-xl animate-liquid-glow" />
          </div>
        )}

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20">
          <div className="absolute top-2 left-2 w-12 h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
          <div className="absolute top-2 left-2 w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20">
          <div className="absolute bottom-2 right-2 w-12 h-[1px] bg-gradient-to-l from-white/20 to-transparent" />
          <div className="absolute bottom-2 right-2 w-[1px] h-12 bg-gradient-to-t from-white/20 to-transparent" />
        </div>
      </div>
    );
  }
);

iOS26EnhancedCard.displayName = 'iOS26EnhancedCard';

export { iOS26EnhancedCard };