'use client';

import { useMemo } from 'react';
import { Flame, Calendar, Trophy, Target, TrendingUp } from 'lucide-react';

import { Streak, StreakType } from '../types';

interface StreakDisplayProps {
  streak: Streak;
  showDetails?: boolean;
  className?: string;
}

export function StreakDisplay({ streak, showDetails = true, className = '' }: StreakDisplayProps) {
  const streakData = useMemo(() => {
    const nextMilestone = Math.ceil(streak.current_count / 10) * 10;
    const daysUntilMilestone = nextMilestone - streak.current_count;
    
    const typeLabels = {
      [StreakType.DAILY_LOGIN]: 'Daily Login',
      [StreakType.MEAL_PLANNING]: 'Meal Planning',
      [StreakType.COOKING]: 'Cooking',
      [StreakType.NUTRITION_GOALS]: 'Nutrition Goals',
      [StreakType.PANTRY_MANAGEMENT]: 'Pantry Management'
    };

    const typeIcons = {
      [StreakType.DAILY_LOGIN]: '📅',
      [StreakType.MEAL_PLANNING]: '🍽️',
      [StreakType.COOKING]: '👨‍🍳',
      [StreakType.NUTRITION_GOALS]: '🎯',
      [StreakType.PANTRY_MANAGEMENT]: '🏠'
    };

    const typeColors = {
      [StreakType.DAILY_LOGIN]: 'from-blue-400 to-blue-600',
      [StreakType.MEAL_PLANNING]: 'from-green-400 to-green-600',
      [StreakType.COOKING]: 'from-orange-400 to-orange-600',
      [StreakType.NUTRITION_GOALS]: 'from-purple-400 to-purple-600',
      [StreakType.PANTRY_MANAGEMENT]: 'from-yellow-400 to-yellow-600'
    };

    return {
      label: typeLabels[streak.streak_type],
      icon: typeIcons[streak.streak_type],
      color: typeColors[streak.streak_type],
      nextMilestone,
      daysUntilMilestone
    };
  }, [streak]);

  const getStreakIntensity = (count: number) => {
    if (count >= 100) return 'legendary';
    if (count >= 50) return 'epic';
    if (count >= 25) return 'strong';
    if (count >= 10) return 'good';
    return 'starting';
  };

  const intensity = getStreakIntensity(streak.current_count);
  const intensityColors = {
    starting: 'text-gray-600',
    good: 'text-blue-600',
    strong: 'text-green-600',
    epic: 'text-purple-600',
    legendary: 'text-yellow-600'
  };

  return (
    <div className={`
      bg-white rounded-lg shadow-md p-4 border-2 transition-all duration-300
      ${streak.is_active ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl">{streakData.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-800">{streakData.label}</h3>
            <p className="text-xs text-gray-500">
              {streak.is_active ? 'Active Streak' : 'Inactive'}
            </p>
          </div>
        </div>
        
        {streak.is_active && (
          <div className="flex items-center gap-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              {streak.current_count} days
            </span>
          </div>
        )}
      </div>

      {/* Current Streak */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Streak</span>
          <span className={`text-xl font-bold ${intensityColors[intensity]}`}>
            {streak.current_count} {streak.current_count === 1 ? 'day' : 'days'}
          </span>
        </div>
        
        {/* Streak Intensity Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`
              h-2 rounded-full transition-all duration-500
              bg-gradient-to-r ${streakData.color}
            `}
            style={{ 
              width: `${Math.min((streak.current_count / 100) * 100, 100)}%` 
            }}
          />
        </div>
        
        <div className="mt-1 text-xs text-gray-500">
          {intensity.charAt(0).toUpperCase() + intensity.slice(1)} streak
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          {/* Personal Best */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Personal Best</span>
            </div>
            <span className="text-sm font-bold text-yellow-800">
              {streak.longest_count} {streak.longest_count === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Next Milestone */}
          {streak.is_active && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Next Milestone</span>
              </div>
              <span className="text-sm font-bold text-blue-800">
                {streakData.daysUntilMilestone} to {streakData.nextMilestone}
              </span>
            </div>
          )}

          {/* Last Activity */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Last Activity</span>
            </div>
            <span className="text-sm text-gray-600">
              {new Date(streak.last_activity_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface StreakGridProps {
  streaks: Streak[];
  className?: string;
}

export function StreakGrid({ streaks, className = '' }: StreakGridProps) {
  const activeStreaks = streaks.filter(s => s.is_active);
  const inactiveStreaks = streaks.filter(s => !s.is_active);

  return (
    <div className={className}>
      {activeStreaks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Active Streaks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeStreaks.map((streak) => (
              <StreakDisplay key={streak.id} streak={streak} />
            ))}
          </div>
        </div>
      )}

      {inactiveStreaks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            Previous Streaks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveStreaks.map((streak) => (
              <StreakDisplay key={streak.id} streak={streak} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StreakSummaryProps {
  streaks: Streak[];
  className?: string;
}

export function StreakSummary({ streaks, className = '' }: StreakSummaryProps) {
  const totalActiveStreaks = streaks.filter(s => s.is_active).length;
  const totalDays = streaks.reduce((sum, s) => sum + s.current_count, 0);
  const longestStreak = Math.max(...streaks.map(s => s.longest_count), 0);

  return (
    <div className={`bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Summary
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{totalActiveStreaks}</div>
          <div className="text-sm text-gray-600">Active Streaks</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{totalDays}</div>
          <div className="text-sm text-gray-600">Total Days</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{longestStreak}</div>
          <div className="text-sm text-gray-600">Longest Streak</div>
        </div>
      </div>
    </div>
  );
}