'use client';

import { useMemo } from 'react';
import { Zap, Star, TrendingUp } from 'lucide-react';

import { useGamificationProfile } from '../store/gamificationStore';

interface XPProgressBarProps {
  showDetails?: boolean;
  className?: string;
}

export function XPProgressBar({ showDetails = true, className = '' }: XPProgressBarProps) {
  const { profile } = useGamificationProfile();

  const progressData = useMemo(() => {
    if (!profile) return null;

    const progressPercentage = Math.min(
      ((profile.total_xp - (profile.total_xp - profile.xp_to_next_level)) / profile.xp_to_next_level) * 100,
      100
    );

    return {
      currentLevel: profile.level,
      totalXP: profile.total_xp,
      xpToNextLevel: profile.xp_to_next_level,
      progressPercentage,
      nextLevel: profile.level + 1
    };
  }, [profile]);

  if (!progressData) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-16 ${className}`} />
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-full">
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            Level {progressData.currentLevel}
          </span>
        </div>
        
        {showDetails && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{progressData.totalXP.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{progressData.xpToNextLevel} to Level {progressData.nextLevel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressData.progressPercentage}%` }}
          />
        </div>
        
        {/* Percentage indicator */}
        <div 
          className="absolute top-0 transform -translate-y-6 -translate-x-1/2"
          style={{ left: `${progressData.progressPercentage}%` }}
        >
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            {Math.round(progressData.progressPercentage)}%
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 text-xs text-gray-600">
          Progress to Level {progressData.nextLevel}
        </div>
      )}
    </div>
  );
}

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ level, size = 'md', className = '' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  return (
    <div className={`
      ${sizeClasses[size]}
      bg-gradient-to-r from-purple-500 to-indigo-500 
      rounded-full flex items-center justify-center 
      text-white font-bold shadow-lg
      ${className}
    `}>
      {level}
    </div>
  );
}

interface XPAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export function XPAnimation({ amount, onComplete }: XPAnimationProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-bounce">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <span className="font-bold">+{amount} XP</span>
        </div>
      </div>
    </div>
  );
}