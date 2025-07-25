'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  Flame, 
  CheckCircle, 
  X,
  Bell,
  Gift
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfileGamification } from '@/hooks/useProfileGamification';

interface Notification {
  id: string;
  type: 'achievement' | 'level_up' | 'milestone' | 'streak' | 'tip' | 'reminder';
  title: string;
  message: string;
  icon: React.ReactNode;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionUrl?: string;
  points?: number;
  isRead?: boolean;
}

export function ProfileNotifications() {
  const { metrics } = useProfileGamification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Generate notifications based on profile metrics
  useEffect(() => {
    if (!metrics) return;

    const newNotifications: Notification[] = [];

    // Check for recent achievements
    const recentAchievements = metrics.achievements.filter(
      achievement => achievement.unlockedAt && 
      new Date(achievement.unlockedAt).getTime() > Date.now() - 5000
    );

    recentAchievements.forEach(achievement => {
      newNotifications.push({
        id: `achievement-${achievement.id}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned "${achievement.name}" and gained ${achievement.points} points!`,
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
        timestamp: new Date(achievement.unlockedAt!),
        priority: 'high',
        points: achievement.points,
      });
    });

    // Check for level up
    if (metrics.level > 1) {
      const shouldShowLevelUp = metrics.totalPoints >= (metrics.level - 1) * 1000;
      if (shouldShowLevelUp) {
        newNotifications.push({
          id: `level-${metrics.level}`,
          type: 'level_up',
          title: 'Level Up!',
          message: `Congratulations! You reached Level ${metrics.level}!`,
          icon: <Star className="h-5 w-5 text-purple-500" />,
          timestamp: new Date(),
          priority: 'high',
        });
      }
    }

    // Check for completion milestones
    const milestones = [25, 50, 75, 90, 100];
    const reachedMilestone = milestones.find(milestone => 
      metrics.overall >= milestone && 
      metrics.overall < milestone + 5
    );

    if (reachedMilestone && reachedMilestone === metrics.overall) {
      newNotifications.push({
        id: `milestone-${reachedMilestone}`,
        type: 'milestone',
        title: 'Milestone Reached!',
        message: `Your profile is ${reachedMilestone}% complete! ${
          reachedMilestone === 100 ? 'You\'re a Profile Master!' : 'Keep going!'
        }`,
        icon: <Target className="h-5 w-5 text-blue-500" />,
        timestamp: new Date(),
        priority: 'medium',
      });
    }

    // Check for streak milestones
    const streakMilestones = [3, 7, 14, 30, 60, 90];
    const streakMilestone = streakMilestones.find(milestone => 
      metrics.currentStreak === milestone
    );

    if (streakMilestone) {
      newNotifications.push({
        id: `streak-${streakMilestone}`,
        type: 'streak',
        title: 'Streak Milestone!',
        message: `Amazing! You've maintained a ${streakMilestone}-day streak!`,
        icon: <Flame className="h-5 w-5 text-orange-500" />,
        timestamp: new Date(),
        priority: 'medium',
      });
    }

    // Add helpful tips based on completion
    if (metrics.overall < 50) {
      newNotifications.push({
        id: 'tip-getting-started',
        type: 'tip',
        title: 'Profile Tip',
        message: 'Complete more profile sections to unlock personalized features!',
        icon: <Bell className="h-5 w-5 text-blue-500" />,
        timestamp: new Date(),
        priority: 'low',
        actionLabel: 'View Progress',
        actionUrl: '/profile/progress',
      });
    }

    // Add profile completion reminders
    const incompleteSections = Object.entries(metrics.sections)
      .filter(([_, completion]) => completion < 100)
      .length;

    if (incompleteSections > 3) {
      newNotifications.push({
        id: 'reminder-complete-profile',
        type: 'reminder',
        title: 'Complete Your Profile',
        message: `You have ${incompleteSections} sections to complete. Finish them to unlock more features!`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        timestamp: new Date(),
        priority: 'low',
        actionLabel: 'Complete Now',
        actionUrl: '/profile/progress',
      });
    }

    // Only update if there are new notifications
    if (newNotifications.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const genuinelyNew = newNotifications.filter(n => !existingIds.has(n.id));
        return [...prev, ...genuinelyNew];
      });
    }
  }, [metrics]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900';
    }
  };

  if (notifications.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Notifications ({notifications.length})
          </h3>
          {notifications.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissAll}
              className="text-xs h-6 px-2"
            >
              Clear All
            </Button>
          )}
        </div>

        <AnimatePresence>
          {notifications.slice(0, 5).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <Card className={`${getPriorityColor(notification.priority)} border shadow-lg`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h4>
                          {notification.points && (
                            <Badge variant="secondary" className="text-xs">
                              +{notification.points}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          {notification.actionLabel && (
                            <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="flex-shrink-0 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length > 5 && (
          <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="p-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                +{notifications.length - 5} more notifications
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-xs mt-1"
              >
                View All
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Hook for managing profile notifications
export function useProfileNotifications() {
  const { metrics } = useProfileGamification();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (!metrics) return;

    // Check for new achievements, level ups, etc.
    const hasRecentActivity = 
      metrics.achievements.some(a => 
        a.unlockedAt && 
        new Date(a.unlockedAt).getTime() > Date.now() - 10000
      ) ||
      metrics.totalPoints > 0;

    setHasNewNotifications(hasRecentActivity);
  }, [metrics]);

  return {
    hasNewNotifications,
    clearNotifications: () => setHasNewNotifications(false),
  };
}