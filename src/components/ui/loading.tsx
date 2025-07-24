'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

export function LoadingSpinner({ size = 'md', className, color = 'primary' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
    </div>
  );
}

interface LoadingBarProps {
  progress?: number;
  className?: string;
}

export function LoadingBar({ progress, className }: LoadingBarProps) {
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700', className)}>
      {progress !== undefined ? (
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      ) : (
        <div className="bg-blue-600 h-2.5 rounded-full animate-progress"></div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, message, children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            {message && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
}

export function LoadingCard({ title = 'Loading...', description }: LoadingCardProps) {
  return (
    <div className="glass rounded-lg p-6 text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}

// AI-specific loading states
export function AIGeneratingCard() {
  return (
    <div className="glass-interactive rounded-lg p-6 text-center">
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <LoadingSpinner size="lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 bg-blue-600 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        AI is creating your recipe
      </h3>
      <LoadingDots className="justify-center text-blue-600" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Analyzing ingredients and preferences...
      </p>
    </div>
  );
}

export function MealPlanGeneratingCard() {
  const steps = [
    'Analyzing your preferences',
    'Checking pantry inventory',
    'Balancing nutrition',
    'Creating meal variety',
    'Optimizing shopping list',
  ];

  return (
    <div className="glass-interactive rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Creating your personalized meal plan
      </h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
              index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            )}>
              {index === 0 ? <LoadingDots className="text-white" /> : index + 1}
            </div>
            <span className={cn(
              'text-sm',
              index === 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
            )}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}