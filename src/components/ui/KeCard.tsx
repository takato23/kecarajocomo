/**
 * KeCard - Card principal del design system KeCarajoComer
 * Mobile-first, glassmorphism, para mostrar recetas, ingredientes, planes
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'recipe' | 'pantry' | 'meal';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const KeCard = forwardRef<HTMLDivElement, KeCardProps>(({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  loading = false,
  className,
  children,
  ...props
}, ref) => {
  
  const baseStyles = `
    relative bg-white/80 backdrop-blur-sm border rounded-2xl
    dark:bg-gray-900/80 dark:border-gray-700/50
    transition-all duration-200 ease-in-out
    ${clickable ? 'cursor-pointer' : ''}
    ${loading ? 'animate-pulse' : ''}
  `;

  const variants = {
    default: `
      border-gray-200/50 shadow-md
      ${hoverable ? 'hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02]' : ''}
    `,
    elevated: `
      border-gray-200/30 shadow-xl shadow-gray-200/60
      ${hoverable ? 'hover:shadow-2xl hover:shadow-gray-200/80 hover:scale-[1.02]' : ''}
    `,
    outline: `
      border-gray-300/60 shadow-sm
      ${hoverable ? 'hover:border-green-300/60 hover:shadow-md hover:shadow-green-100/50' : ''}
    `,
    recipe: `
      border-orange-200/50 shadow-lg shadow-orange-100/50
      ${hoverable ? 'hover:shadow-xl hover:shadow-orange-100/70 hover:scale-[1.02]' : ''}
      bg-gradient-to-br from-white/90 to-orange-50/80
      dark:from-gray-900/90 dark:to-orange-900/20
    `,
    pantry: `
      border-green-200/50 shadow-lg shadow-green-100/50
      ${hoverable ? 'hover:shadow-xl hover:shadow-green-100/70 hover:scale-[1.02]' : ''}
      bg-gradient-to-br from-white/90 to-green-50/80
      dark:from-gray-900/90 dark:to-green-900/20
    `,
    meal: `
      border-blue-200/50 shadow-lg shadow-blue-100/50
      ${hoverable ? 'hover:shadow-xl hover:shadow-blue-100/70 hover:scale-[1.02]' : ''}
      bg-gradient-to-br from-white/90 to-blue-50/80
      dark:from-gray-900/90 dark:to-blue-900/20
    `
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        paddings[padding],
        className
      )}
      whileHover={hoverable ? { y: -2 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}
      {children}
    </motion.div>
  );
});

KeCard.displayName = 'KeCard';

// Sub-componentes para estructura común
const KeCardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-3', className)}
      {...props}
    >
      {children}
    </div>
  )
);
KeCardHeader.displayName = 'KeCard.Header';

const KeCardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
);
KeCardTitle.displayName = 'KeCard.Title';

const KeCardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  )
);
KeCardDescription.displayName = 'KeCard.Description';

const KeCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    >
      {children}
    </div>
  )
);
KeCardContent.displayName = 'KeCard.Content';

const KeCardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-3', className)}
      {...props}
    >
      {children}
    </div>
  )
);
KeCardFooter.displayName = 'KeCard.Footer';

export { 
  KeCard, 
  KeCardHeader,
  KeCardTitle,
  KeCardDescription, 
  KeCardContent, 
  KeCardFooter 
};
export type { KeCardProps };