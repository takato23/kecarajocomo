'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Flame, Target, Bell, Settings, TrendingUp, Award } from 'lucide-react';

import { 
  useGamificationStore, 
  useGamificationProfile, 
  useAchievements, 
  useStreaks, 
  useGamificationNotifications 
} from '../store/gamificationStore';
import { LeaderboardType, LeaderboardPeriod } from '../types';

import { XPProgressBar, LevelBadge } from './XPProgressBar';
import { AchievementCard, AchievementNotification } from './AchievementCard';
import { StreakDisplay, StreakSummary } from './StreakDisplay';
import { LeaderboardTable, LeaderboardPodium } from './LeaderboardTable';
import { ChallengeCard } from './ChallengeCard';

interface GamificationDashboardProps {
  className?: string;
}

export function GamificationDashboard({ className = '' }: GamificationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard' | 'challenges'>('overview');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>(LeaderboardType.XP);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.WEEKLY);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const { profile, loadProfile } = useGamificationProfile();
  const { achievements, loadAchievements } = useAchievements();
  const { streaks, loadStreaks } = useStreaks();
  const { notifications, loadNotifications, markNotificationRead } = useGamificationNotifications();
  
  const {
    badges,
    challenges,
    leaderboard,
    isLoading,
    error,
    loadBadges,
    loadChallenges,
    loadLeaderboard,
    joinChallenge,
    setError
  } = useGamificationStore();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadProfile(),
          loadAchievements(),
          loadStreaks(),
          loadBadges(),
          loadChallenges(),
          loadNotifications()
        ]);
      } catch (error: unknown) {
        console.error('Failed to load gamification data:', error);
      }
    };

    loadData();
  }, []);

  // Load leaderboard when type or period changes
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard(leaderboardType, leaderboardPeriod);
    }
  }, [activeTab, leaderboardType, leaderboardPeriod]);

  // Handle achievement notifications
  useEffect(() => {
    const unreadAchievements = notifications.filter(n => !n.isRead && n.type === 'achievement');
    if (unreadAchievements.length > 0) {
      setSelectedAchievement(unreadAchievements[0]);
      setShowAchievementNotification(true);
    }
  }, [notifications]);

  const handleAchievementNotificationClose = () => {
    setShowAchievementNotification(false);
    if (selectedAchievement) {
      markNotificationRead(selectedAchievement.id);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
    } catch (error: unknown) {
      console.error('Failed to join challenge:', error);
    }
  };

  const recentAchievements = achievements.filter(a => a.is_completed).slice(0, 3);
  const activeStreaks = streaks.filter(s => s.is_active);
  const activeChallenges = challenges.filter(c => c.challenge?.is_active).slice(0, 3);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'challenges', label: 'Challenges', icon: Target }
  ];

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🎮</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gamification</h1>
                <p className="text-sm text-gray-600">Track your progress and achievements</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              
              {/* Level Badge */}
              {profile && (
                <div className="flex items-center gap-2">
                  <LevelBadge level={profile.level} size="sm" />
                  <span className="text-sm font-medium text-gray-700">
                    Level {profile.level}
                  </span>
                </div>
              )}
              
              {/* Settings */}
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* XP Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <XPProgressBar showDetails={true} />
              <StreakSummary streaks={streaks} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total XP</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.total_xp?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {achievements.filter(a => a.is_completed).length}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Streaks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activeStreaks.length}
                    </p>
                  </div>
                  <Flame className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Challenges</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {challenges.filter(c => c.is_completed).length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentAchievements.map((userAchievement) => (
                    <AchievementCard
                      key={userAchievement.id}
                      achievement={userAchievement.achievement}
                      userAchievement={userAchievement}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Streaks */}
            {activeStreaks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Streaks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeStreaks.slice(0, 4).map((streak) => (
                    <StreakDisplay key={streak.id} streak={streak} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Challenges</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeChallenges.map((userChallenge) => (
                    <ChallengeCard
                      key={userChallenge.id}
                      challenge={userChallenge.challenge}
                      userChallenge={userChallenge}
                      onJoin={handleJoinChallenge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
              <div className="text-sm text-gray-600">
                {achievements.filter(a => a.is_completed).length} of {achievements.length} completed
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((userAchievement) => (
                <AchievementCard
                  key={userAchievement.id}
                  achievement={userAchievement.achievement}
                  userAchievement={userAchievement}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
            
            <LeaderboardPodium
              entries={leaderboard}
              currentUserId={profile?.user_id}
              type={leaderboardType}
            />
            
            <LeaderboardTable
              entries={leaderboard}
              currentUserId={profile?.user_id}
              type={leaderboardType}
              period={leaderboardPeriod}
              onTypeChange={setLeaderboardType}
              onPeriodChange={setLeaderboardPeriod}
            />
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((userChallenge) => (
                <ChallengeCard
                  key={userChallenge.id}
                  challenge={userChallenge.challenge}
                  userChallenge={userChallenge}
                  onJoin={handleJoinChallenge}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Achievement Notification Modal */}
      {showAchievementNotification && selectedAchievement && (
        <AchievementNotification
          achievement={selectedAchievement}
          onClose={handleAchievementNotificationClose}
        />
      )}
    </div>
  );
}