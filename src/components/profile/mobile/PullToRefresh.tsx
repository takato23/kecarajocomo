'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Transform values for the refresh indicator
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(pullProgress, [0, 0.3, 1], [0, 1, 1]);
  const indicatorScale = useTransform(pullProgress, [0, 1], [0.8, 1]);
  const indicatorRotation = useTransform(y, [0, threshold * 2], [0, 360]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      controls.start({ y: 0 });
    }
  }, [onRefresh, isRefreshing, controls]);

  const handleDragEnd = useCallback(() => {
    const currentY = y.get();
    
    if (currentY >= threshold && !isRefreshing) {
      // Snap to refresh position and trigger refresh
      controls.start({ y: 60 }).then(handleRefresh);
    } else {
      // Snap back to top
      controls.start({ y: 0 });
    }
  }, [y, threshold, isRefreshing, controls, handleRefresh]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Refresh Indicator */}
      <motion.div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'pointer-events-none z-10'
        )}
        style={{
          opacity: indicatorOpacity,
          y,
        }}
      >
        <motion.div
          className={cn(
            'w-12 h-12 rounded-full',
            'bg-glass-heavy backdrop-blur-md',
            'border border-white/20',
            'flex items-center justify-center',
            'shadow-lg'
          )}
          style={{
            scale: indicatorScale,
            rotate: indicatorRotation,
          }}
        >
          <RefreshCw
            className={cn(
              'w-6 h-6',
              isRefreshing ? 'animate-spin text-food-warm' : 'text-glass-strong'
            )}
          />
        </motion.div>
      </motion.div>

      {/* Content Container */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: threshold * 1.5 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y }}
        className={cn(
          'relative',
          isRefreshing && 'pointer-events-none'
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}