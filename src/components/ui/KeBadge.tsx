/**
 * KeBadge - Badge/Chip principal del design system KeCarajoComer
 * Mobile-first, glassmorphism, para categorías, tags, estados
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  clickable?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  count?: number;
  pulse?: boolean;
  children: React.ReactNode;
}

const KeBadge = forwardRef<HTMLDivElement, KeBadgeProps>(({
  variant = 'default',
  size = 'md',
  rounded = 'md',
  clickable = false,
  removable = false,
  onRemove,
  leftIcon,
  rightIcon,
  count,
  pulse = false,
  className,
  children,
  ...props
}, ref) => {
  
  const baseStyles = `
    inline-flex items-center gap-1.5 font-medium transition-all duration-200
    backdrop-blur-sm border shadow-sm select-none
    ${clickable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
    ${pulse ? 'animate-pulse' : ''}
  `;

  const variants = {
    default: `
      bg-gray-100/80 text-gray-700 border-gray-200/60
      dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700/60
      hover:bg-gray-200/80 dark:hover:bg-gray-700/80
    `,
    primary: `
      bg-green-100/80 text-green-700 border-green-200/60
      dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/60
      hover:bg-green-200/80 dark:hover:bg-green-800/40
    `,
    secondary: `
      bg-blue-100/80 text-blue-700 border-blue-200/60
      dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/60
      hover:bg-blue-200/80 dark:hover:bg-blue-800/40
    `,
    success: `
      bg-emerald-100/80 text-emerald-700 border-emerald-200/60
      dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/60
      hover:bg-emerald-200/80 dark:hover:bg-emerald-800/40
    `,
    warning: `
      bg-orange-100/80 text-orange-700 border-orange-200/60
      dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/60
      hover:bg-orange-200/80 dark:hover:bg-orange-800/40
    `,
    danger: `
      bg-red-100/80 text-red-700 border-red-200/60
      dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/60
      hover:bg-red-200/80 dark:hover:bg-red-800/40
    `,
    info: `
      bg-cyan-100/80 text-cyan-700 border-cyan-200/60
      dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/60
      hover:bg-cyan-200/80 dark:hover:bg-cyan-800/40
    `
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs min-h-[24px]',
    md: 'px-3 py-1.5 text-sm min-h-[28px]', // Touch-friendly mobile
    lg: 'px-4 py-2 text-base min-h-[32px]'
  };

  const roundedStyles = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        roundedStyles[rounded],
        className
      )}
      whileHover={clickable ? { scale: 1.05 } : undefined}
      whileTap={clickable ? { scale: 0.95 } : undefined}
      {...props}
    >
      {/* Left Icon */}
      {leftIcon && (
        <span className={cn(iconSizes[size])}>
          {leftIcon}
        </span>
      )}
      
      {/* Content */}
      <span className="truncate">
        {children}
      </span>
      
      {/* Count */}
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-1.5 py-0.5 bg-current/20 rounded-full text-xs font-bold min-w-[18px] text-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
      
      {/* Right Icon */}
      {rightIcon && !removable && (
        <span className={cn(iconSizes[size])}>
          {rightIcon}
        </span>
      )}
      
      {/* Remove Button */}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={cn(
            "hover:bg-current/20 rounded-full transition-colors p-0.5",
            iconSizes[size]
          )}
        >
          <X className="w-full h-full" />
        </button>
      )}
    </motion.div>
  );
});

KeBadge.displayName = 'KeBadge';

// Componente especializado para notificaciones
const KeNotificationBadge = forwardRef<HTMLDivElement, 
  Omit<KeBadgeProps, 'variant' | 'rounded'> & {
    status?: 'success' | 'warning' | 'danger' | 'info';
  }
>(({ 
  status = 'info', 
  size = 'sm',
  pulse = true,
  className,
  ...props 
}, ref) => (
  <KeBadge
    ref={ref}
    variant={status}
    size={size}
    rounded="full"
    pulse={pulse}
    className={cn("relative", className)}
    {...props}
  />
));

KeNotificationBadge.displayName = 'KeNotificationBadge';

// Componente especializado para categorías de comida
const KeFoodCategoryBadge = forwardRef<HTMLDivElement,
  Omit<KeBadgeProps, 'variant'> & {
    category: 'verduras' | 'frutas' | 'carnes' | 'lacteos' | 'granos' | 'condimentos' | 'bebidas' | 'otros';
  }
>(({ 
  category,
  size = 'md',
  rounded = 'lg',
  clickable = true,
  ...props 
}, ref) => {
  
  const categoryVariants = {
    verduras: 'success',
    frutas: 'warning', 
    carnes: 'danger',
    lacteos: 'info',
    granos: 'secondary',
    condimentos: 'default',
    bebidas: 'primary',
    otros: 'default'
  } as const;

  return (
    <KeBadge
      ref={ref}
      variant={categoryVariants[category]}
      size={size}
      rounded={rounded}
      clickable={clickable}
      {...props}
    />
  );
});

KeFoodCategoryBadge.displayName = 'KeFoodCategoryBadge';

// Componente especializado para estados de vencimiento
const KeExpiryBadge = forwardRef<HTMLDivElement,
  Omit<KeBadgeProps, 'variant' | 'children'> & {
    daysUntilExpiry: number;
  }
>(({ 
  daysUntilExpiry,
  size = 'sm',
  rounded = 'full',
  ...props 
}, ref) => {
  
  const getVariantAndText = (days: number) => {
    if (days <= 0) return { variant: 'danger' as const, text: 'Vencido' };
    if (days <= 1) return { variant: 'danger' as const, text: '1 día' };
    if (days <= 3) return { variant: 'warning' as const, text: `${days} días` };
    if (days <= 7) return { variant: 'info' as const, text: `${days} días` };
    return { variant: 'success' as const, text: `${days} días` };
  };

  const { variant, text } = getVariantAndText(daysUntilExpiry);

  return (
    <KeBadge
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      pulse={daysUntilExpiry <= 1}
      {...props}
    >
      {text}
    </KeBadge>
  );
});

KeExpiryBadge.displayName = 'KeExpiryBadge';

export { 
  KeBadge, 
  KeNotificationBadge, 
  KeFoodCategoryBadge, 
  KeExpiryBadge 
};
export type { KeBadgeProps };