'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Star, ChevronRight } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useGamificationProfile, useAchievements } from '@/features/gamification/store/gamificationStore';
import { useAppStore } from '@/store';
import { useGamificationIntegration } from '@/features/gamification/hooks/useGamificationIntegration';

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  icon: React.ElementType;
  color: string;
}

interface GamificationCardProps {
  level?: number;
  experience?: number;
  experienceToNext?: number;
  streak?: number;
  achievements?: Achievement[];
}

const defaultAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Meal Planner',
    description: 'Plan 7 meals',
    progress: 5,
    maxProgress: 7,
    icon: Target,
    color: 'text-purple-400'
  },
  {
    id: '2',
    title: 'Healthy Eater',
    description: 'Cook 10 healthy meals',
    progress: 7,
    maxProgress: 10,
    icon: Trophy,
    color: 'text-green-400'
  },
];

export function GamificationCard({
  level,
  experience,
  experienceToNext,
  streak,
  achievements
}: GamificationCardProps) {
  const user = useAppStore((state) => state.user.profile);
  const { profile, loadProfile } = useGamificationProfile();
  const { achievements: userAchievements, loadAchievements } = useAchievements();
  const { trackDailyLogin } = useGamificationIntegration();
  const [showAchievementNotification, setShowAchievementNotification] = React.useState(false);
  const [latestAchievement, setLatestAchievement] = React.useState<any>(null);

  // Load gamification data
  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadAchievements();
    }
  }, [user?.id, loadProfile, loadAchievements]);

  // Track daily login when component mounts
  useEffect(() => {
    if (user?.id) {
      trackDailyLogin();
    }
  }, [user?.id, trackDailyLogin]);

  // Periodically refresh gamification data
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        loadProfile();
        loadAchievements();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.id, loadProfile, loadAchievements]);

  // Watch for new achievements
  useEffect(() => {
    if (userAchievements.length > 0) {
      const recentlyCompleted = userAchievements
        .filter(ua => ua.is_completed && ua.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
        .slice(0, 1);
      
      if (recentlyCompleted.length > 0) {
        const latest = recentlyCompleted[0];
        const completedRecently = new Date(latest.completed_at!).getTime() > Date.now() - 60000; // Within last minute
        
        if (completedRecently && latest.id !== latestAchievement?.id) {
          setLatestAchievement(latest);
          setShowAchievementNotification(true);
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setShowAchievementNotification(false);
          }, 5000);
        }
      }
    }
  }, [userAchievements, latestAchievement]);

  // Use real data if available, otherwise fall back to props or defaults
  const actualLevel = profile?.level || level || 2;
  const actualExperience = profile?.total_xp || experience || 450;
  const actualExperienceToNext = profile?.xp_to_next_level || experienceToNext || 1000;
  const actualStreak = profile?.streak_days || streak || 3;
  
  // Get recent achievements from the gamification system
  const recentAchievements = userAchievements
    .filter(ua => ua.is_completed)
    .slice(0, 2)
    .map(ua => ({
      id: ua.id,
      title: ua.achievement?.name || 'Unknown',
      description: ua.achievement?.description || '',
      progress: ua.max_progress || 0,
      maxProgress: ua.max_progress || 0,
      icon: Trophy,
      color: 'text-green-400'
    }));

  const displayAchievements = achievements || recentAchievements.length > 0 ? recentAchievements : defaultAchievements;
  const experienceProgress = (actualExperience / (actualExperience + actualExperienceToNext)) * 100;

  const handleNavigateToGamification = () => {
    window.location.href = '/dashboard/gamification';
  };

  return (
    <GlassCard className="h-full relative cursor-pointer hover:bg-white/5 transition-colors" onClick={handleNavigateToGamification}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Progress</h3>
            <p className="text-sm text-gray-400">
              {profile?.total_points ? `${profile.total_points} points earned` : 'Keep up the great work!'}
            </p>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleNavigateToGamification();
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{actualLevel}</span>
            </div>
            <div>
              <p className="text-white font-medium">Level {actualLevel}</p>
              <p className="text-sm text-gray-400">
                {actualLevel >= 25 ? 'Master Chef' : actualLevel >= 10 ? 'Experienced Cook' : 'Apprentice Chef'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium">{actualStreak}</span>
              <span className="text-sm text-gray-400">day streak</span>
            </div>
            {profile?.total_points && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">{profile.total_points}</span>
                <span className="text-sm text-gray-400">pts</span>
              </div>
            )}
          </div>
        </div>
        
        {/* XP Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Experience</span>
            <span className="text-sm text-white">{actualExperience.toLocaleString()} / {(actualExperience + actualExperienceToNext).toLocaleString()} XP</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${experienceProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400">
              {actualExperienceToNext.toLocaleString()} XP to next level
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(experienceProgress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-400">Recent Achievements</h4>
        {displayAchievements.map((achievement, index) => {
          const Icon = achievement.icon;
          const progress = (achievement.progress / achievement.maxProgress) * 100;
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={cn("p-2 rounded-lg bg-white/10", achievement.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-gray-400">{achievement.description}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {achievement.progress}/{achievement.maxProgress}
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "h-full",
                    progress === 100 
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-purple-400 to-pink-500"
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Achievement Notification */}
      {showAchievementNotification && latestAchievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white p-3 rounded-lg shadow-lg border-2 border-white/20 z-10"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <div>
              <p className="text-xs font-semibold">Achievement Unlocked!</p>
              <p className="text-xs opacity-90">{latestAchievement.achievement?.name}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAchievementNotification(false);
              }}
              className="text-white/80 hover:text-white text-xs"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}