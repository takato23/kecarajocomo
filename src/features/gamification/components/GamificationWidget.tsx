'use client';

import { useEffect, useState } from 'react';
import { Star, Trophy, Flame, ChevronRight, Gift } from 'lucide-react';
import { logger } from '@/services/logger';

import { useGamificationProfile, useAchievements, useStreaks } from '../store/gamificationStore';
import { progressTrackingService } from '../services/progressTrackingService';

import { XPProgressBar, LevelBadge } from './XPProgressBar';

interface GamificationWidgetProps {
  userId?: string;
  className?: string;
}

export function GamificationWidget({ userId, className = '' }: GamificationWidgetProps) {
  const { profile, loadProfile } = useGamificationProfile();
  const { achievements, loadAchievements } = useAchievements();
  const { streaks, loadStreaks } = useStreaks();
  const [progressData, setProgressData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadProfile(),
          loadAchievements(),
          loadStreaks()
        ]);

        if (userId) {
          const analytics = await progressTrackingService.getProgressAnalytics(userId);
          setProgressData(analytics);
        }
      } catch (error: unknown) {
        logger.error('Failed to load gamification data:', 'GamificationWidget', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Start Your Journey</p>
          <p className="text-sm text-gray-400">Complete your first action to unlock gamification features!</p>
        </div>
      </div>
    );
  }

  const recentAchievements = achievements.filter(a => a.is_completed).slice(0, 3);
  const activeStreaks = streaks.filter(s => s.is_active);
  const longestStreak = Math.max(...streaks.map(s => s.current_count), 0);

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LevelBadge level={profile.level} size="sm" />
            <div>
              <h3 className="font-semibold text-gray-900">Level {profile.level}</h3>
              <p className="text-sm text-gray-500">{profile.total_xp.toLocaleString()} XP</p>
            </div>
          </div>
          
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-200">
        <XPProgressBar showDetails={false} />
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">{profile.total_points}</span>
            </div>
            <p className="text-xs text-gray-500">Points</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">{recentAchievements.length}</span>
            </div>
            <p className="text-xs text-gray-500">Achievements</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{longestStreak}</span>
            </div>
            <p className="text-xs text-gray-500">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Achievements</h4>
          <div className="space-y-2">
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <div className="text-lg">{achievement.achievement?.icon || '🏆'}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{achievement.achievement?.name}</p>
                  <p className="text-xs text-gray-500">+{achievement.achievement?.xp_reward} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Streaks */}
      {activeStreaks.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Active Streaks</h4>
          <div className="space-y-2">
            {activeStreaks.slice(0, 2).map((streak) => (
              <div key={streak.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {streak.streak_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-sm text-orange-600 font-medium">
                  {streak.current_count} days
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Goals */}
      {progressData && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Today's Goals</h4>
          <div className="space-y-2">
            {Object.entries(progressData.dailyProgress).slice(0, 3).map(([goalType, progress]) => (
              <div key={goalType} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {goalType.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function GamificationWidgetCompact({ userId, className = '' }: GamificationWidgetProps) {
  const { profile } = useGamificationProfile();

  if (!profile) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <Gift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Start earning XP!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LevelBadge level={profile.level} size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Level {profile.level}</p>
            <p className="text-xs text-gray-500">{profile.total_xp.toLocaleString()} XP</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-orange-600">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{profile.streak_days}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">{profile.total_points}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <XPProgressBar showDetails={false} />
      </div>
    </div>
  );
}

// Achievement notification component
export function AchievementToast({ achievement, onClose }: { achievement: any; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border-2 border-green-400 p-4 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{achievement.icon || '🏆'}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Achievement Unlocked!</p>
          <p className="text-xs text-gray-600">{achievement.name}</p>
          <p className="text-xs text-green-600">+{achievement.xp_reward} XP</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}