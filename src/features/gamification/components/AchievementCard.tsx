'use client';

import { useState } from 'react';
import { CheckCircle, Lock, Star, Trophy, Clock } from 'lucide-react';

import { 
  Achievement, 
  UserAchievement, 
  AchievementDifficulty, 
  AchievementCategory 
} from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  onClick?: () => void;
  className?: string;
}

export function AchievementCard({ 
  achievement, 
  userAchievement, 
  onClick, 
  className = '' 
}: AchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isCompleted = userAchievement?.is_completed || false;
  const progress = userAchievement?.progress || 0;
  const maxProgress = userAchievement?.max_progress || 100;
  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  const difficultyColors = {
    [AchievementDifficulty.EASY]: 'from-green-400 to-green-600',
    [AchievementDifficulty.MEDIUM]: 'from-yellow-400 to-yellow-600', 
    [AchievementDifficulty.HARD]: 'from-red-400 to-red-600',
    [AchievementDifficulty.LEGENDARY]: 'from-purple-400 to-purple-600'
  };

  const categoryIcons = {
    [AchievementCategory.COOKING]: '👨‍🍳',
    [AchievementCategory.MEAL_PLANNING]: '📅',
    [AchievementCategory.NUTRITION]: '🥗',
    [AchievementCategory.PANTRY]: '🏠',
    [AchievementCategory.RECIPES]: '📝',
    [AchievementCategory.SOCIAL]: '👥',
    [AchievementCategory.STREAKS]: '🔥',
    [AchievementCategory.CHALLENGES]: '🎯'
  };

  return (
    <div 
      className={`
        relative bg-white rounded-lg shadow-md border-2 transition-all duration-300 cursor-pointer
        ${isCompleted ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
        ${isHovered ? 'shadow-lg scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Achievement Icon */}
      <div className="absolute -top-3 -right-3 z-10">
        {isCompleted ? (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        ) : achievement.is_hidden ? (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>
        ) : null}
      </div>

      {/* Difficulty Badge */}
      <div className="absolute top-3 left-3">
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium text-white
          bg-gradient-to-r ${difficultyColors[achievement.difficulty]}
        `}>
          {achievement.difficulty.charAt(0).toUpperCase() + achievement.difficulty.slice(1)}
        </div>
      </div>

      <div className="p-4 pt-8">
        {/* Achievement Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl">
            {achievement.icon || categoryIcons[achievement.category] || '🏆'}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
              {achievement.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Progress Bar (if not completed) */}
        {!isCompleted && userAchievement && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">
                Progress: {progress}/{maxProgress}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{achievement.xp_reward} XP</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span>{achievement.points_reward} pts</span>
            </div>
          </div>
          
          {userAchievement?.completed_at && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(userAchievement.completed_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

export function AchievementGrid({ 
  achievements, 
  userAchievements, 
  onAchievementClick,
  className = ''
}: AchievementGridProps) {
  const getUserAchievement = (achievementId: string) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          userAchievement={getUserAchievement(achievement.id)}
          onClick={() => onAchievementClick?.(achievement)}
        />
      ))}
    </div>
  );
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Achievement Unlocked!
          </h2>
          <div className="text-4xl mb-4">
            {achievement.icon || '🏆'}
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {achievement.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {achievement.description}
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">+{achievement.xp_reward} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="font-medium">+{achievement.points_reward} points</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}