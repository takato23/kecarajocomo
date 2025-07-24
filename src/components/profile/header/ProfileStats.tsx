'use client';

import { MapPin, Users, ChefHat, Star } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ProfileStatsProps {
  level: number;
  levelProgress: number;
  completionPercentage: number;
  quickStats: {
    location?: string;
    householdSize: number;
    primaryCuisine?: string;
  };
  className?: string;
}

export function ProfileStats({
  level,
  levelProgress,
  completionPercentage,
  quickStats,
  className,
}: ProfileStatsProps) {
  const getLevelTitle = (level: number) => {
    const titles = [
      'Novice Cook',
      'Home Cook',
      'Skilled Cook',
      'Expert Cook',
      'Master Chef',
    ];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  const statItems = [
    quickStats.location && {
      icon: MapPin,
      value: quickStats.location,
    },
    {
      icon: Users,
      value: `${quickStats.householdSize} ${quickStats.householdSize === 1 ? 'member' : 'members'}`,
    },
    quickStats.primaryCuisine && {
      icon: ChefHat,
      value: quickStats.primaryCuisine,
    },
  ].filter(Boolean);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Level and Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4 transition-colors',
                  i < level
                    ? 'fill-food-golden text-food-golden'
                    : 'text-glass-medium'
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-glass-strong">
            Level {level} {getLevelTitle(level)}
          </span>
        </div>
      </div>

      {/* Profile Completion Progress */}
      <div className="space-y-2">
        <div className="relative h-2 bg-glass-medium rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-food-warm to-food-golden rounded-full"
          />
        </div>
        <p className="text-xs text-glass-medium">
          {completionPercentage}% Profile Complete
        </p>
      </div>

      {/* Quick Stats Pills */}
      <div className="flex flex-wrap gap-2">
        {statItems.map((stat, index) => {
          if (!stat) return null;
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5',
                'bg-glass-medium backdrop-blur-sm rounded-full',
                'border border-white/10',
                'text-xs text-glass-strong'
              )}
            >
              <Icon className="w-3 h-3 text-glass-medium" />
              <span>{stat.value}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}