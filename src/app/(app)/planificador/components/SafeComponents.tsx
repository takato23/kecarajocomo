'use client';

import React from 'react';

import { cn } from '@/lib/utils';

// Safe wrapper for iOS26EnhancedCard that filters out custom props
export const SafeiOS26EnhancedCard = React.forwardRef<HTMLDivElement, any>(
  ({ 
    className,
    children,
    variant,
    elevation,
    liquidEffect,
    glowEffect,
    morphEffect,
    floatEffect,
    interactive,
    gradient,
    ...htmlProps 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-3xl p-6',
          'backdrop-blur-lg border border-white/10',
          'transition-all duration-500',
          'shadow-lg hover:shadow-xl',
          'bg-gradient-to-br from-white/10 via-white/5 to-transparent',
          className
        )}
        {...htmlProps}
      >
        {children}
      </div>
    );
  }
);

SafeiOS26EnhancedCard.displayName = 'SafeiOS26EnhancedCard';

// Safe wrapper for iOS26LiquidButton that filters out custom props
export const SafeiOS26LiquidButton = React.forwardRef<HTMLButtonElement, any>(
  ({ 
    className,
    children,
    variant,
    size,
    leftIcon,
    rightIcon,
    glow,
    pulse,
    loading,
    ...htmlProps 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative rounded-xl font-medium transition-all overflow-hidden',
          'px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white',
          'hover:scale-105 active:scale-95 transform-gpu',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          className
        )}
        {...htmlProps}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

SafeiOS26LiquidButton.displayName = 'SafeiOS26LiquidButton';

// Safe wrapper for iOS26FloatingActionMenu
export const SafeiOS26FloatingActionMenu = React.forwardRef<HTMLDivElement, any>(
  ({ items, position = 'bottom-right', direction = 'up', className, ...htmlProps }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const positionClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6'
    };
    
    return (
      <div 
        ref={ref}
        className={cn('fixed z-50', positionClasses[position], className)} 
        {...htmlProps}
      >
        <div className="relative">
          {/* Menu items */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 space-y-2">
              {items?.map((item: any, index: number) => (
                <button
                  key={item.id || index}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Main button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-xl hover:scale-110 transition-all flex items-center justify-center"
          >
            <svg
              className={cn("w-6 h-6 transition-transform", isOpen && "rotate-45")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

SafeiOS26FloatingActionMenu.displayName = 'SafeiOS26FloatingActionMenu';