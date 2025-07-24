'use client';

import React, { forwardRef, ButtonHTMLAttributes, useState, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface iOS26EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'liquid' | 'glass' | 'aurora' | 'ocean' | 'sunset' | 'forest';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  liquidEffect?: boolean;
  glowEffect?: boolean;
  rippleEffect?: boolean;
  morphEffect?: boolean;
  floatEffect?: boolean;
  children: React.ReactNode;
}

const iOS26EnhancedButton = forwardRef<HTMLButtonElement, iOS26EnhancedButtonProps>(
  ({ 
    className, 
    variant = 'liquid', 
    size = 'md', 
    liquidEffect = true,
    glowEffect = true,
    rippleEffect = true,
    morphEffect = false,
    floatEffect = false,
    children,
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleId = useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (rippleEffect && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = rippleId.current++;

        setRipples(prev => [...prev, { x, y, id }]);

        setTimeout(() => {
          setRipples(prev => prev.filter(ripple => ripple.id !== id));
        }, 1000);
      }

      onClick?.(e);
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-10 py-5 text-xl',
    };

    const variantClasses = {
      liquid: 'ios26-liquid-glass ios26-liquid-transform bg-gradient-to-r from-glass-light via-glass-medium to-glass-light',
      glass: 'ios26-liquid-glass bg-glass-soft hover:bg-glass-medium',
      aurora: 'ios26-liquid-glass bg-gradient-to-r from-liquid-aurora-from via-liquid-aurora-via to-liquid-aurora-to',
      ocean: 'ios26-liquid-glass bg-gradient-to-r from-liquid-ocean-from to-liquid-ocean-to',
      sunset: 'ios26-liquid-glass bg-gradient-to-r from-liquid-sunset-from to-liquid-sunset-to',
      forest: 'ios26-liquid-glass bg-gradient-to-r from-liquid-forest-from to-liquid-forest-to',
    };

    const effectClasses = cn(
      liquidEffect && 'ios26-liquid-wave',
      glowEffect && 'ios26-liquid-glow',
      morphEffect && 'ios26-liquid-morph',
      floatEffect && 'animate-glass-float',
    );

    return (
      <button
        ref={(node) => {
          if (ref) {
            if (typeof ref === 'function') ref(node);
            else ref.current = node;
          }
          if (node) buttonRef.current = node;
        }}
        className={cn(
          'relative overflow-hidden rounded-2xl font-semibold transition-all duration-300',
          'backdrop-blur-md border border-white/20',
          'shadow-lg hover:shadow-xl active:shadow-md',
          'transform-gpu hover:scale-[1.02] active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          sizeClasses[size],
          variantClasses[variant],
          effectClasses,
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Background gradient animation layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-liquid-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Refraction effect layer */}
        <div className="absolute inset-0 animate-refraction-shift opacity-30">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-white/10 to-transparent blur-xl" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-white/10 to-transparent blur-xl" />
        </div>

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>

        {/* Ripple effects */}
        {ripples.map(({ x, y, id }) => (
          <span
            key={id}
            className="absolute rounded-full bg-white/30 animate-liquid-ripple pointer-events-none"
            style={{
              left: x,
              top: y,
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Glow effect */}
        {glowEffect && (
          <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-[-2px] rounded-2xl bg-gradient-to-r from-white/20 to-white/10 blur-md animate-liquid-glow" />
          </div>
        )}
      </button>
    );
  }
);

iOS26EnhancedButton.displayName = 'iOS26EnhancedButton';

export { iOS26EnhancedButton };