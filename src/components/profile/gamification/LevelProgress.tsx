'use client';

import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LevelProgressProps {
  currentLevel: number;
  currentXP: number;
  requiredXP: number;
  nextLevelReward?: string;
  className?: string;
}

export function LevelProgress({
  currentLevel,
  currentXP,
  requiredXP,
  nextLevelReward,
  className,
}: LevelProgressProps) {
  const progressPercentage = (currentXP / requiredXP) * 100;
  const remainingXP = requiredXP - currentXP;

  const getLevelTitle = (level: number) => {
    const titles = [
      'Novice Cook',
      'Home Cook',
      'Skilled Cook',
      'Expert Cook',
      'Master Chef',
      'Culinary Artist',
      'Legendary Chef',
    ];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Level Badge and Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              'relative w-16 h-16 rounded-2xl',
              'bg-gradient-to-br from-food-golden to-food-warm',
              'flex items-center justify-center',
              'shadow-lg'
            )}
          >
            <Star className="w-8 h-8 text-white fill-white" />
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
              {currentLevel}
            </span>
          </motion.div>

          {/* Level Info */}
          <div>
            <h3 className="text-lg font-semibold text-glass-strong">
              Level {currentLevel}
            </h3>
            <p className="text-sm text-glass-medium">
              {getLevelTitle(currentLevel)}
            </p>
          </div>
        </div>

        {/* XP Info */}
        <div className="text-right">
          <div className="text-sm font-medium text-glass-strong">
            {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
          </div>
          <div className="text-xs text-glass-medium">
            {remainingXP.toLocaleString()} to next level
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-4 bg-glass-medium rounded-full overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>

          {/* Progress Fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-food-warm to-food-golden rounded-full"
          >
            {/* Liquid Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
            <motion.div
              animate={{
                x: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>

          {/* Progress Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow-sm">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {/* Next Level Reward */}
        {nextLevelReward && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-xs text-glass-medium"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Next: {nextLevelReward}</span>
          </motion.div>
        )}
      </div>

      {/* Level Up Animation (shown when close to leveling) */}
      {progressPercentage >= 90 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-food-warm font-medium animate-pulse"
        >
          Almost there! {remainingXP} XP to Level {currentLevel + 1}!
        </motion.div>
      )}
    </div>
  );
}