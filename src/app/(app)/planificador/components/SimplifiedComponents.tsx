'use client';

import React from 'react';

import { cn } from '@/lib/utils';

// Simple card component without any iOS26 features
export const SimpleCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6',
          'bg-white/80 backdrop-blur-sm',
          'border border-gray-200/50',
          'shadow-lg hover:shadow-xl transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SimpleCard.displayName = 'SimpleCard';

// Simple button component
export const SimpleButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}>(
  ({ className, children, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative rounded-xl font-medium transition-all',
          'px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white',
          'hover:scale-105 active:scale-95 transform-gpu',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-2">
          {leftIcon}
          {children}
          {rightIcon}
        </span>
      </button>
    );
  }
);

SimpleButton.displayName = 'SimpleButton';

// Simple floating action menu
interface FloatingMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const SimpleFloatingActionMenu = React.forwardRef<HTMLDivElement, {
  items: FloatingMenuItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}>(
  ({ items, position = 'bottom-right', className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const positionClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6'
    };
    
    const menuDirection = {
      'bottom-right': 'bottom-16 right-0',
      'bottom-left': 'bottom-16 left-0',
      'top-right': 'top-16 right-0',
      'top-left': 'top-16 left-0'
    };
    
    return (
      <div 
        ref={ref}
        className={cn('fixed z-50', positionClasses[position], className)}
      >
        <div className="relative">
          {/* Menu items */}
          {isOpen && (
            <div className={cn("absolute space-y-2", menuDirection[position])}>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
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

SimpleFloatingActionMenu.displayName = 'SimpleFloatingActionMenu';