'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'purple' | 'green' | 'blue' | 'orange';
}

export function ProgressBar({ 
  progress, 
  className,
  showPercentage = false,
  color = 'purple'
}: ProgressBarProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'blue':
        return 'bg-blue-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full", getColorClasses())}
        />
      </div>
      
      {showPercentage && (
        <div className="absolute -top-6 right-0 text-xs text-gray-400">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

export default ProgressBar;