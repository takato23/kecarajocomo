import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/services/logger';

import { cn } from '@/lib/utils';

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-lime-500',
    secondary: 'text-purple-500',
    white: 'text-white',
    gray: 'text-gray-500'
  };

  return (
    <motion.svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
};

// Loading dots animation
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingDots = ({ 
  size = 'md', 
  color = 'primary', 
  className 
}: LoadingDotsProps) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-lime-500',
    secondary: 'bg-purple-500',
    white: 'bg-white',
    gray: 'bg-gray-500'
  };

  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2
      }
    },
    end: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    start: {
      y: '0%'
    },
    end: {
      y: '100%'
    }
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut'
  };

  return (
    <motion.div
      className={cn('flex space-x-1', className)}
      variants={containerVariants}
      initial="start"
      animate="end"
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            sizeClasses[size],
            colorClasses[color]
          )}
          variants={dotVariants}
          transition={dotTransition}
        />
      ))}
    </motion.div>
  );
};

// Pulse loading effect
interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const PulseLoader = ({ 
  size = 'md', 
  color = 'primary', 
  className 
}: PulseLoaderProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'bg-lime-500',
    secondary: 'bg-purple-500',
    white: 'bg-white',
    gray: 'bg-gray-500'
  };

  return (
    <motion.div
      className={cn(
        'rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

// Skeleton loading component
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton = ({ 
  width = '100%', 
  height = '1rem', 
  className, 
  rounded = false,
  animate = true 
}: SkeletonProps) => {
  const skeletonClasses = cn(
    'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
    'dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
    {
      'rounded-full': rounded,
      'rounded': !rounded,
      'animate-pulse': animate
    },
    className
  );

  return (
    <div
      className={skeletonClasses}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

// Card skeleton
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('p-6 border rounded-lg', className)}>
    <div className="animate-pulse">
      <Skeleton width="3rem" height="3rem" rounded className="mb-4" />
      <Skeleton width="60%" height="1.25rem" className="mb-2" />
      <Skeleton width="100%" height="1rem" className="mb-1" />
      <Skeleton width="100%" height="1rem" className="mb-1" />
      <Skeleton width="80%" height="1rem" />
    </div>
  </div>
);

// Hero skeleton
export const HeroSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('min-h-screen flex items-center justify-center', className)}>
    <div className="max-w-7xl mx-auto px-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="animate-pulse">
          <Skeleton width="60%" height="2rem" className="mb-6" />
          <Skeleton width="100%" height="3rem" className="mb-4" />
          <Skeleton width="100%" height="1.5rem" className="mb-2" />
          <Skeleton width="80%" height="1.5rem" className="mb-8" />
          <div className="flex gap-4">
            <Skeleton width="9rem" height="3rem" />
            <Skeleton width="9rem" height="3rem" />
          </div>
        </div>
        <div className="animate-pulse">
          <Skeleton width="100%" height="20rem" rounded />
        </div>
      </div>
    </div>
  </div>
);

// Progress bar loading
interface ProgressBarProps {
  progress: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = ({ 
  progress, 
  color = 'primary', 
  size = 'md', 
  showLabel = true,
  className 
}: ProgressBarProps) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-lime-500 to-purple-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Loading...</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          className={cn('h-full rounded-full', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  spinner?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  message = 'Loading...', 
  spinner,
  className 
}: LoadingOverlayProps) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              {spinner || <LoadingSpinner size="lg" />}
              {message && (
                <p className="mt-4 text-gray-600 font-medium">{message}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Lazy loading wrapper with suspense
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

export const LazyWrapper = ({ 
  children, 
  fallback, 
  error,
  className 
}: LazyWrapperProps) => {
  const [hasError, setHasError] = React.useState(false);

  const defaultFallback = (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  );

  const defaultError = (
    <div className="text-center py-12 text-gray-500">
      <p>Failed to load content</p>
    </div>
  );

  if (hasError) {
    return <div className={className}>{error || defaultError}</div>;
  }

  return (
    <div className={className}>
      <React.Suspense fallback={fallback || defaultFallback}>
        {children}
      </React.Suspense>
    </div>
  );
};

// Hook for loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

// Loading button component
interface LoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const LoadingButton = ({ 
  children, 
  isLoading = false, 
  loadingText = 'Loading...', 
  onClick,
  disabled = false,
  className,
  variant = 'primary'
}: LoadingButtonProps) => {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const loading = isLoading || internalLoading;

  const handleClick = async () => {
    if (loading || disabled || !onClick) return;

    try {
      setInternalLoading(true);
      await onClick();
    } catch (error: unknown) {
      logger.error('Button action failed:', 'LoadingStates', error);
    } finally {
      setInternalLoading(false);
    }
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-lime-500 to-purple-500 text-white hover:from-lime-600 hover:to-purple-600',
    secondary: 'bg-white border-2 border-lime-500 text-lime-600 hover:bg-lime-50'
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(
        'px-6 py-2 rounded-lg font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <LoadingSpinner size="sm" color="white" />
            <span>{loadingText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};