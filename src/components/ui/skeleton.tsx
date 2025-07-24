'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
  width,
  height,
  ...props
}: SkeletonProps) {
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      {...props}
    />
  );
}

// Composite skeleton components for common patterns
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-6" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonRecipeCard() {
  return (
    <div className="glass rounded-lg p-4 space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

export function SkeletonMealPlan() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-4">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center space-x-3">
                <Skeleton variant="circular" className="h-10 w-10" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard-specific skeleton components
export function SkeletonDashboardStat() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
    </div>
  );
}

export function SkeletonDashboardMeal() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-6 rounded" />
    </div>
  );
}

export function SkeletonDashboardActivity() {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg">
      <Skeleton variant="circular" className="w-2 h-2" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonDashboardAction() {
  return (
    <div className="flex items-center p-3 rounded-lg">
      <Skeleton variant="circular" className="w-8 h-8 mr-3" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-4 w-4" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonDashboardStat key={i} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Meals Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonDashboardMeal key={i} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Actions Skeleton */}
          <div>
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
              <Skeleton className="h-6 w-28 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonDashboardAction key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="mt-8">
          <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonDashboardActivity key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}