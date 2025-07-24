'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  variant?: 'header' | 'content' | 'card' | 'list-item' | 'avatar';
  lines?: number;
  animate?: boolean;
  className?: string;
}

export function Skeleton({
  variant = 'content',
  lines = 1,
  animate = true,
  className,
}: SkeletonProps) {
  const baseClass = cn(
    'bg-glass-subtle rounded',
    animate && 'animate-pulse relative overflow-hidden',
    className
  );

  const shimmerClass = animate ? (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  ) : null;

  switch (variant) {
    case 'avatar':
      return (
        <div className={cn(baseClass, 'rounded-full')}>
          {shimmerClass}
        </div>
      );

    case 'header':
      return (
        <div className="space-y-2">
          <div className={cn(baseClass, 'h-8 w-48')}>
            {shimmerClass}
          </div>
          <div className={cn(baseClass, 'h-6 w-32')}>
            {shimmerClass}
          </div>
        </div>
      );

    case 'card':
      return (
        <div className={cn(baseClass, 'p-4 space-y-3')}>
          {shimmerClass}
          <div className="h-4 bg-glass-subtle/50 rounded w-3/4" />
          <div className="h-4 bg-glass-subtle/50 rounded w-1/2" />
          <div className="h-4 bg-glass-subtle/50 rounded w-full" />
        </div>
      );

    case 'list-item':
      return (
        <div className={cn(baseClass, 'h-16 flex items-center gap-3 p-3')}>
          {shimmerClass}
          <div className="w-10 h-10 bg-glass-subtle/50 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-glass-subtle/50 rounded w-3/4" />
            <div className="h-3 bg-glass-subtle/50 rounded w-1/2" />
          </div>
        </div>
      );

    case 'content':
    default:
      return (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseClass,
                'h-4',
                i === lines - 1 && lines > 1 && 'w-3/4'
              )}
            >
              {shimmerClass}
            </div>
          ))}
        </div>
      );
  }
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-glass-subtle backdrop-blur-lg border border-white/10 rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Skeleton */}
        <Skeleton variant="avatar" className="w-32 h-32 flex-shrink-0" />

        {/* Info Skeleton */}
        <div className="flex-1 space-y-4">
          <Skeleton variant="header" />
          
          {/* Stats Pills */}
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileTabsSkeleton() {
  return (
    <div className="bg-glass-subtle backdrop-blur-md border border-white/10 rounded-xl p-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 flex-1 rounded-lg"
            animate={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

export function ProfileContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section 1 */}
      <div className="bg-glass-subtle backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-glass-subtle backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="list-item" />
          ))}
        </div>
      </div>
    </div>
  );
}