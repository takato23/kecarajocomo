'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ProfileSegment {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
}

interface ProfileProgressProps {
  percentage: number;
  segments: ProfileSegment[];
  className?: string;
}

export function ProfileProgress({
  percentage,
  segments,
  className,
}: ProfileProgressProps) {
  // Calculate segment widths based on weights
  const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);
  const segmentWidths = segments.map(seg => (seg.weight / totalWeight) * 100);

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {/* Segmented Progress Bar */}
        <div className="relative h-3 bg-glass-subtle rounded-full overflow-hidden">
          {/* Background segments */}
          <div className="absolute inset-0 flex">
            {segments.map((segment, index) => {
              const previousWidth = segmentWidths
                .slice(0, index)
                .reduce((sum, w) => sum + w, 0);
              
              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'relative h-full transition-colors cursor-help',
                        index > 0 && 'border-l border-glass-medium'
                      )}
                      style={{ width: `${segmentWidths[index]}%` }}
                    >
                      {segment.completed && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                            ease: 'easeOut',
                          }}
                          className={cn(
                            'absolute inset-0 origin-left',
                            'bg-gradient-to-r',
                            index === 0 && 'from-food-fresh to-food-warm',
                            index === 1 && 'from-food-warm to-food-golden',
                            index === 2 && 'from-food-golden to-food-rich',
                            index > 2 && 'from-food-rich to-food-golden'
                          )}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {segment.label}: {segment.completed ? 'Complete' : 'Incomplete'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Animated fill overlay */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-black/10 mix-blend-overlay"
          />
        </div>

        {/* Segment Labels */}
        <div className="flex justify-between text-xs text-glass-medium">
          {segments.filter((_, index) => index === 0 || index === segments.length - 1).map((segment, index) => (
            <span key={segment.id}>
              {segment.label}
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}