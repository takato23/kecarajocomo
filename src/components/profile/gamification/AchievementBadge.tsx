'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'cooking' | 'exploration' | 'social' | 'streak' | 'special';
  unlockedAt?: Date;
  progress?: {
    current: number;
    total: number;
  };
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: 'w-12 h-12 text-2xl',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-20 h-20 text-4xl',
};

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600',
};

export function AchievementBadge({
  achievement,
  size = 'md',
  showProgress = true,
  onClick,
  className,
}: AchievementBadgeProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = achievement.progress;
  const progressPercentage = progress
    ? (progress.current / progress.total) * 100
    : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            disabled={!onClick}
            className={cn(
              'relative group',
              onClick && 'cursor-pointer',
              className
            )}
            whileHover={onClick ? { scale: 1.05 } : {}}
            whileTap={onClick ? { scale: 0.95 } : {}}
          >
            {/* Badge Container */}
            <div
              className={cn(
                'relative rounded-2xl p-2',
                'bg-glass-medium backdrop-blur-sm',
                'border-2 transition-all duration-300',
                sizeMap[size],
                isUnlocked
                  ? cn(
                      'border-transparent',
                      achievement.rarity && `bg-gradient-to-br ${rarityColors[achievement.rarity]}`
                    )
                  : 'border-white/10 grayscale opacity-60'
              )}
            >
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isUnlocked ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className={cn(
                      'block',
                      isUnlocked && achievement.rarity === 'legendary' && 'animate-pulse'
                    )}
                  >
                    {achievement.icon}
                  </motion.span>
                ) : (
                  <>
                    <span className="opacity-30">{achievement.icon}</span>
                    <Lock className="absolute w-4 h-4 text-white/50" />
                  </>
                )}
              </div>

              {/* Progress Ring (if not unlocked and has progress) */}
              {!isUnlocked && progress && showProgress && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(249,115,22,0.6)"
                    strokeWidth="6"
                    strokeDasharray={`${progressPercentage * 2.83} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
              )}

              {/* Shine Effect (for unlocked achievements) */}
              {isUnlocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 5,
                  }}
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
                  style={{
                    transform: 'translateX(-100%) translateY(-100%)',
                    animation: 'shine 3s ease-in-out infinite',
                  }}
                />
              )}
            </div>

            {/* New Badge Indicator */}
            {isUnlocked && achievement.unlockedAt && 
             new Date().getTime() - achievement.unlockedAt.getTime() < 86400000 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-food-warm rounded-full animate-pulse"
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{achievement.name}</p>
            <p className="text-xs text-glass-medium">{achievement.description}</p>
            {progress && !isUnlocked && (
              <p className="text-xs text-food-warm">
                Progress: {progress.current}/{progress.total}
              </p>
            )}
            {isUnlocked && achievement.unlockedAt && (
              <p className="text-xs text-glass-medium">
                Unlocked: {achievement.unlockedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}