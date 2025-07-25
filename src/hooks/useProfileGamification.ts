'use client';

import { useMemo, useEffect, useState } from 'react';
import { useProfileData, useHouseholdContext } from '@/contexts/ProfileContext';
import { ProfileCompletionService, type CompletionMetrics, type AchievementType } from '@/services/profile/ProfileCompletionService';
import { success } from '@/services/notifications';
import { logger } from '@/services/logger';

interface GamificationState {
  metrics: CompletionMetrics | null;
  suggestions: string[];
  isLoading: boolean;
  error: Error | null;
}

interface GamificationActions {
  refreshMetrics: () => void;
  trackAchievement: (achievementId: AchievementType, progress: number) => Promise<void>;
  awardAchievement: (achievementId: AchievementType) => Promise<void>;
  celebrateCompletion: (section: string) => void;
}

export function useProfileGamification(): GamificationState & GamificationActions {
  const { profile, preferences, isLoading: profileLoading } = useProfileData();
  const { householdMembers } = useHouseholdContext();
  
  const [state, setState] = useState<GamificationState>({
    metrics: null,
    suggestions: [],
    isLoading: true,
    error: null,
  });

  // Calculate metrics when profile data changes
  const metrics = useMemo(() => {
    if (profileLoading || !profile) return null;

    try {
      return ProfileCompletionService.calculateCompletion(
        profile,
        preferences,
        householdMembers
      );
    } catch (error) {
      logger.error('Error calculating profile completion metrics', 'useProfileGamification', error);
      return null;
    }
  }, [profile, preferences, householdMembers, profileLoading]);

  // Calculate suggestions based on metrics
  const suggestions = useMemo(() => {
    if (!metrics) return [];
    return ProfileCompletionService.getSuggestions(metrics);
  }, [metrics]);

  // Update state when metrics change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      metrics,
      suggestions,
      isLoading: profileLoading,
      error: null,
    }));
  }, [metrics, suggestions, profileLoading]);

  // Track newly unlocked achievements
  useEffect(() => {
    if (!metrics || !profile?.id) return;

    // Check for newly unlocked achievements
    const newlyUnlocked = metrics.achievements.filter(achievement => {
      const wasUnlocked = achievement.unlockedAt && 
        new Date(achievement.unlockedAt).getTime() > Date.now() - 5000; // Within last 5 seconds
      return wasUnlocked;
    });

    // Show notifications for new achievements
    newlyUnlocked.forEach(achievement => {
      success(`🎉 Achievement Unlocked: ${achievement.name}! (+${achievement.points} points)`);
    });
  }, [metrics, profile?.id]);

  // Actions
  const refreshMetrics = () => {
    setState(prev => ({ ...prev, isLoading: true }));
    // Metrics will be recalculated by the useMemo above
  };

  const trackAchievement = async (achievementId: AchievementType, progress: number) => {
    if (!profile?.id) return;

    try {
      await ProfileCompletionService.trackProgress(profile.id, achievementId, progress);
    } catch (error) {
      logger.error('Error tracking achievement progress', 'useProfileGamification', error);
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const awardAchievement = async (achievementId: AchievementType) => {
    if (!profile?.id) return;

    try {
      await ProfileCompletionService.awardAchievement(profile.id, achievementId);
      refreshMetrics();
    } catch (error) {
      logger.error('Error awarding achievement', 'useProfileGamification', error);
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const celebrateCompletion = (section: string) => {
    const sectionNames: Record<string, string> = {
      basicInfo: 'Basic Information',
      preferences: 'Preferences',
      household: 'Household Setup',
      financial: 'Budget & Financial',
      dietary: 'Dietary Preferences',
      cooking: 'Cooking Skills',
      planning: 'Meal Planning',
      social: 'Social Features',
    };

    const sectionName = sectionNames[section] || section;
    success(`🌟 Great job! You completed the ${sectionName} section!`);
  };

  return {
    ...state,
    refreshMetrics,
    trackAchievement,
    awardAchievement,
    celebrateCompletion,
  };
}

// Hook for specific gamification features
export function useAchievements() {
  const { metrics } = useProfileGamification();
  
  return useMemo(() => {
    if (!metrics) return { achievements: [], totalPoints: 0, level: 1 };
    
    return {
      achievements: metrics.achievements,
      totalPoints: metrics.totalPoints,
      level: metrics.level,
      unlockedAchievements: metrics.achievements.filter(a => a.unlockedAt),
      lockedAchievements: metrics.achievements.filter(a => !a.unlockedAt),
      recentAchievements: metrics.achievements
        .filter(a => a.unlockedAt && 
          new Date(a.unlockedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()),
    };
  }, [metrics]);
}

export function useStreaks() {
  const { metrics } = useProfileGamification();
  
  return useMemo(() => {
    if (!metrics) return { currentStreak: 0, longestStreak: 0, lastActiveDate: new Date() };
    
    return {
      currentStreak: metrics.currentStreak,
      longestStreak: metrics.longestStreak,
      lastActiveDate: metrics.lastActiveDate,
      isStreakActive: new Date().getTime() - metrics.lastActiveDate.getTime() < 24 * 60 * 60 * 1000,
    };
  }, [metrics]);
}

export function useProfileCompletion() {
  const { metrics } = useProfileGamification();
  
  return useMemo(() => {
    if (!metrics) {
      return { 
        overall: 0, 
        sections: {}, 
        completedSections: [], 
        incompleteSections: [],
        nextMilestone: null 
      };
    }
    
    const completedSections = Object.entries(metrics.sections)
      .filter(([_, completion]) => completion === 100)
      .map(([section]) => section);
    
    const incompleteSections = Object.entries(metrics.sections)
      .filter(([_, completion]) => completion < 100)
      .sort(([_, a], [__, b]) => b - a) // Sort by completion percentage, descending
      .map(([section, completion]) => ({ section, completion }));
    
    // Find next milestone
    const milestones = [25, 50, 75, 90, 100];
    const nextMilestone = milestones.find(milestone => milestone > metrics.overall);
    
    return {
      overall: metrics.overall,
      sections: metrics.sections,
      completedSections,
      incompleteSections,
      nextMilestone,
      isComplete: metrics.overall === 100,
      level: metrics.level,
      totalPoints: metrics.totalPoints,
    };
  }, [metrics]);
}

// Utility hook for gamification notifications
export function useGamificationNotifications() {
  const { metrics } = useProfileGamification();
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  useEffect(() => {
    if (!metrics) return;

    const now = Date.now();
    if (now - lastNotificationTime < 5000) return; // Throttle notifications

    // Check for level up
    if (metrics.level > 1 && metrics.totalPoints >= (metrics.level - 1) * 1000) {
      success(`🎉 Level Up! You reached Level ${metrics.level}!`);
      setLastNotificationTime(now);
      return;
    }

    // Check for completion milestones
    const milestones = [25, 50, 75, 90, 100];
    const reachedMilestone = milestones.find(milestone => 
      metrics.overall >= milestone && 
      metrics.overall < milestone + 5 // Within 5% of milestone
    );

    if (reachedMilestone && reachedMilestone === metrics.overall) {
      success(`🌟 Milestone Reached! Your profile is ${reachedMilestone}% complete!`);
      setLastNotificationTime(now);
    }
  }, [metrics, lastNotificationTime]);

  return { /* notification utilities could go here */ };
}