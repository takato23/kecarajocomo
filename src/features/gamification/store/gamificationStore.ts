import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { 
  GamificationState, 
  GamificationActions, 
  StreakType,
  AchievementNotification,
  XPEvent,
  XPAwardResponse,
  AchievementCheckResponse
} from '../types';

interface GamificationStore extends GamificationState, GamificationActions {}

const initialState: GamificationState = {
  profile: null,
  achievements: [],
  badges: [],
  xp_events: [],
  streaks: [],
  challenges: [],
  leaderboard: [],
  notifications: [],
  settings: null,
  isLoading: false,
  error: null,
  lastUpdated: null
};

export const useGamificationStore = create<GamificationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Profile Management
        loadProfile: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/gamification/profile');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load profile');
            }
            
            set({ 
              profile: data.data,
              isLoading: false, 
              lastUpdated: new Date() 
            });
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load profile',
              isLoading: false 
            });
          }
        },

        updateProfile: async (updates) => {
          try {
            const response = await fetch('/api/gamification/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to update profile');
            }
            
            set(state => ({ 
              profile: state.profile ? { ...state.profile, ...data.data } : data.data 
            }));
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to update profile' });
          }
        },

        // XP and Leveling
        awardXP: async (eventType, amount, metadata = {}) => {
          try {
            const response = await fetch('/api/gamification/xp/award', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventType, amount, metadata })
            });
            
            const data: XPAwardResponse = await response.json();
            
            if (!response.ok) {
              throw new Error('Failed to award XP');
            }
            
            // Update profile with new XP
            set(state => ({
              profile: state.profile ? {
                ...state.profile,
                total_xp: state.profile.total_xp + data.xp_awarded,
                level: data.new_level || state.profile.level,
                xp_to_next_level: state.profile.xp_to_next_level - data.xp_awarded,
                total_points: state.profile.total_points + data.points_awarded,
                weekly_points: state.profile.weekly_points + data.points_awarded,
                monthly_points: state.profile.monthly_points + data.points_awarded
              } : null
            }));
            
            // Add XP event to history
            const xpEvent: XPEvent = {
              id: Date.now().toString(),
              user_id: get().profile?.user_id || '',
              event_type: eventType,
              xp_amount: data.xp_awarded,
              points_amount: data.points_awarded,
              description: `Earned ${data.xp_awarded} XP for ${eventType}`,
              metadata,
              created_at: new Date()
            };
            
            set(state => ({
              xp_events: [xpEvent, ...state.xp_events].slice(0, 100) // Keep last 100 events
            }));
            
            // Handle level up
            if (data.level_up && data.new_level) {
              const levelUpNotification: AchievementNotification = {
                id: Date.now().toString(),
                type: 'level_up',
                title: `Level Up! Level ${data.new_level}`,
                description: `Congratulations! You've reached level ${data.new_level}!`,
                icon: '⬆️',
                xp_reward: data.xp_awarded,
                points_reward: data.points_awarded,
                timestamp: new Date(),
                isRead: false
              };
              
              set(state => ({
                notifications: [levelUpNotification, ...state.notifications]
              }));
            }
            
            // Handle achievements unlocked
            if (data.achievements_unlocked && data.achievements_unlocked.length > 0) {
              data.achievements_unlocked.forEach(achievement => {
                const notification: AchievementNotification = {
                  id: `achievement_${achievement.id}`,
                  type: 'achievement',
                  title: 'Achievement Unlocked!',
                  description: achievement.name,
                  icon: achievement.icon,
                  xp_reward: achievement.xp_reward,
                  points_reward: achievement.points_reward,
                  timestamp: new Date(),
                  isRead: false
                };
                
                set(state => ({
                  notifications: [notification, ...state.notifications]
                }));
              });
            }
            
            // Handle badges earned
            if (data.badges_earned && data.badges_earned.length > 0) {
              data.badges_earned.forEach(badge => {
                const notification: AchievementNotification = {
                  id: `badge_${badge.id}`,
                  type: 'badge',
                  title: 'Badge Earned!',
                  description: badge.name,
                  icon: badge.icon,
                  timestamp: new Date(),
                  isRead: false
                };
                
                set(state => ({
                  notifications: [notification, ...state.notifications]
                }));
              });
            }
            
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to award XP' });
          }
        },

        checkLevelUp: async () => {
          const profile = get().profile;
          if (!profile) return false;
          
          try {
            const response = await fetch('/api/gamification/level/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: profile.user_id })
            });
            
            const data = await response.json();
            
            if (data.level_up) {
              set(state => ({
                profile: state.profile ? {
                  ...state.profile,
                  level: data.new_level,
                  xp_to_next_level: data.xp_to_next_level
                } : null
              }));
              return true;
            }
            
            return false;
          } catch (error: unknown) {
            console.error('Failed to check level up:', error);
            return false;
          }
        },

        // Achievements
        loadAchievements: async () => {
          try {
            const response = await fetch('/api/gamification/achievements');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load achievements');
            }
            
            set({ achievements: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load achievements' });
          }
        },

        checkAchievementProgress: async (eventType, metadata = {}) => {
          try {
            const response = await fetch('/api/gamification/achievements/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventType, metadata })
            });
            
            const data: AchievementCheckResponse = await response.json();
            
            if (!response.ok) {
              throw new Error('Failed to check achievement progress');
            }
            
            // Update achievements progress
            if (data.achievements_unlocked.length > 0) {
              set(state => ({
                achievements: state.achievements.map(achievement => {
                  const unlockedAchievement = data.achievements_unlocked.find(a => a.id === achievement.achievement_id);
                  if (unlockedAchievement) {
                    return {
                      ...achievement,
                      is_completed: true,
                      completed_at: new Date()
                    };
                  }
                  return achievement;
                })
              }));
            }
            
          } catch (error: unknown) {
            console.error('Failed to check achievement progress:', error);
          }
        },

        markAchievementNotified: async (achievementId) => {
          try {
            await fetch(`/api/gamification/achievements/${achievementId}/notify`, {
              method: 'POST'
            });
            
            set(state => ({
              achievements: state.achievements.map(achievement => 
                achievement.id === achievementId 
                  ? { ...achievement, notified: true }
                  : achievement
              )
            }));
          } catch (error: unknown) {
            console.error('Failed to mark achievement as notified:', error);
          }
        },

        // Badges
        loadBadges: async () => {
          try {
            const response = await fetch('/api/gamification/badges');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load badges');
            }
            
            set({ badges: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load badges' });
          }
        },

        checkBadgeRequirements: async () => {
          try {
            const response = await fetch('/api/gamification/badges/check', {
              method: 'POST'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to check badge requirements');
            }
            
            // Update badges if any were earned
            if (data.badges_earned && data.badges_earned.length > 0) {
              set(state => ({
                badges: [...state.badges, ...data.badges_earned]
              }));
            }
            
          } catch (error: unknown) {
            console.error('Failed to check badge requirements:', error);
          }
        },

        // Streaks
        loadStreaks: async () => {
          try {
            const response = await fetch('/api/gamification/streaks');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load streaks');
            }
            
            set({ streaks: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load streaks' });
          }
        },

        updateStreak: async (streakType) => {
          try {
            const response = await fetch('/api/gamification/streaks/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ streakType })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to update streak');
            }
            
            set(state => ({
              streaks: state.streaks.map(streak => 
                streak.streak_type === streakType 
                  ? { ...streak, ...data.data }
                  : streak
              )
            }));
            
            // Update profile streak info
            if (streakType === StreakType.DAILY_LOGIN) {
              set(state => ({
                profile: state.profile ? {
                  ...state.profile,
                  streak_days: data.data.current_count,
                  longest_streak: Math.max(state.profile.longest_streak, data.data.current_count),
                  last_activity_date: new Date()
                } : null
              }));
            }
            
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to update streak' });
          }
        },

        // Challenges
        loadChallenges: async () => {
          try {
            const response = await fetch('/api/gamification/challenges');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load challenges');
            }
            
            set({ challenges: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load challenges' });
          }
        },

        joinChallenge: async (challengeId) => {
          try {
            const response = await fetch(`/api/gamification/challenges/${challengeId}/join`, {
              method: 'POST'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to join challenge');
            }
            
            set(state => ({
              challenges: [...state.challenges, data.data]
            }));
            
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to join challenge' });
          }
        },

        updateChallengeProgress: async (challengeId, progress) => {
          try {
            const response = await fetch(`/api/gamification/challenges/${challengeId}/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ progress })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to update challenge progress');
            }
            
            set(state => ({
              challenges: state.challenges.map(challenge => 
                challenge.id === challengeId 
                  ? { ...challenge, ...data.data }
                  : challenge
              )
            }));
            
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to update challenge progress' });
          }
        },

        // Leaderboard
        loadLeaderboard: async (type, period) => {
          try {
            const response = await fetch(`/api/gamification/leaderboard?type=${type}&period=${period}`);
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load leaderboard');
            }
            
            set({ leaderboard: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load leaderboard' });
          }
        },

        // Notifications
        loadNotifications: async () => {
          try {
            const response = await fetch('/api/gamification/notifications');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load notifications');
            }
            
            set({ notifications: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load notifications' });
          }
        },

        markNotificationRead: async (notificationId) => {
          try {
            await fetch(`/api/gamification/notifications/${notificationId}/read`, {
              method: 'POST'
            });
            
            set(state => ({
              notifications: state.notifications.map(notification => 
                notification.id === notificationId 
                  ? { ...notification, isRead: true }
                  : notification
              )
            }));
          } catch (error: unknown) {
            console.error('Failed to mark notification as read:', error);
          }
        },

        clearAllNotifications: async () => {
          try {
            await fetch('/api/gamification/notifications', {
              method: 'DELETE'
            });
            
            set({ notifications: [] });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to clear notifications' });
          }
        },

        // Settings
        loadSettings: async () => {
          try {
            const response = await fetch('/api/gamification/settings');
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to load settings');
            }
            
            set({ settings: data.data });
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to load settings' });
          }
        },

        updateSettings: async (updates) => {
          try {
            const response = await fetch('/api/gamification/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to update settings');
            }
            
            set(state => ({
              settings: state.settings ? { ...state.settings, ...data.data } : data.data
            }));
          } catch (error: unknown) {
            set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
          }
        },

        // Utility
        setError: (error) => set({ error }),
        clearError: () => set({ error: null })
      }),
      {
        name: 'gamification-store',
        partialize: (state) => ({
          profile: state.profile,
          achievements: state.achievements,
          badges: state.badges,
          streaks: state.streaks,
          challenges: state.challenges,
          notifications: state.notifications,
          settings: state.settings
        })
      }
    ),
    {
      name: 'gamification-store'
    }
  )
);

// Helper hooks for common operations
export const useGamificationProfile = () => {
  const profile = useGamificationStore(state => state.profile);
  const loadProfile = useGamificationStore(state => state.loadProfile);
  const updateProfile = useGamificationStore(state => state.updateProfile);
  
  return { profile, loadProfile, updateProfile };
};

export const useXPSystem = () => {
  const awardXP = useGamificationStore(state => state.awardXP);
  const checkLevelUp = useGamificationStore(state => state.checkLevelUp);
  const profile = useGamificationStore(state => state.profile);
  
  return { awardXP, checkLevelUp, profile };
};

export const useAchievements = () => {
  const achievements = useGamificationStore(state => state.achievements);
  const loadAchievements = useGamificationStore(state => state.loadAchievements);
  const checkAchievementProgress = useGamificationStore(state => state.checkAchievementProgress);
  
  return { achievements, loadAchievements, checkAchievementProgress };
};

export const useStreaks = () => {
  const streaks = useGamificationStore(state => state.streaks);
  const loadStreaks = useGamificationStore(state => state.loadStreaks);
  const updateStreak = useGamificationStore(state => state.updateStreak);
  
  return { streaks, loadStreaks, updateStreak };
};

export const useGamificationNotifications = () => {
  const notifications = useGamificationStore(state => state.notifications);
  const loadNotifications = useGamificationStore(state => state.loadNotifications);
  const markNotificationRead = useGamificationStore(state => state.markNotificationRead);
  const clearAllNotifications = useGamificationStore(state => state.clearAllNotifications);
  
  return { notifications, loadNotifications, markNotificationRead, clearAllNotifications };
};