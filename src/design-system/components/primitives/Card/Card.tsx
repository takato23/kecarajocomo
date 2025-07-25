import { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl bg-white overflow-hidden transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border border-gray-200',
        elevated: 'shadow-lg',
        ghost: 'bg-gray-50',
        glass: 'bg-white/80 backdrop-blur-lg border border-white/20',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, children, onClick, ...props }, ref) => {
    const Component = interactive && onClick ? motion.div : 'div';
    
    const cardProps = interactive && onClick
      ? {
          whileHover: { y: -2 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.2 },
        }
      : {};
    
    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive, className }))}
        onClick={onClick}
        {...cardProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          !noPadding && 'p-6 pb-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Title component
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// Card Description component
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

// Card Content component
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(!noPadding && 'p-6 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer component
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          !noPadding && 'p-6 pt-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Card Image component
export interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  height?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, src, alt, height = 200, objectFit = 'cover', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        {...props}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full"
          style={{ objectFit }}
        />
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';