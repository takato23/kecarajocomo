'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, Users, TrendingUp, Star, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data - in a real app, this would come from an API
interface LeaderboardUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  completionPercentage: number;
  achievementsCount: number;
  isCurrentUser?: boolean;
}

const mockUsers: LeaderboardUser[] = [
  {
    id: '1',
    username: 'masterchef_maria',
    fullName: 'María González',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    totalPoints: 2850,
    level: 8,
    currentStreak: 45,
    completionPercentage: 95,
    achievementsCount: 28,
  },
  {
    id: '2',
    username: 'healthy_carlos',
    fullName: 'Carlos Rodriguez',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    totalPoints: 2650,
    level: 7,
    currentStreak: 32,
    completionPercentage: 88,
    achievementsCount: 25,
    isCurrentUser: true,
  },
  {
    id: '3',
    username: 'veggie_ana',
    fullName: 'Ana López',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
    totalPoints: 2400,
    level: 7,
    currentStreak: 28,
    completionPercentage: 92,
    achievementsCount: 22,
  },
  {
    id: '4',
    username: 'budget_foodie',
    fullName: 'Juan Pérez',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan',
    totalPoints: 2200,
    level: 6,
    currentStreak: 15,
    completionPercentage: 85,
    achievementsCount: 20,
  },
  {
    id: '5',
    username: 'recipe_queen',
    fullName: 'Sofia Martín',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia',
    totalPoints: 2000,
    level: 6,
    currentStreak: 22,
    completionPercentage: 80,
    achievementsCount: 18,
  },
];

interface ProfileLeaderboardProps {
  currentUserId?: string;
}

export function ProfileLeaderboard({ currentUserId }: ProfileLeaderboardProps) {
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly' | 'allTime'>('allTime');
  const [category, setCategory] = useState<'points' | 'streaks' | 'completion' | 'achievements'>('points');

  // Sort users based on selected category
  const sortedUsers = useMemo(() => {
    return [...mockUsers].sort((a, b) => {
      switch (category) {
        case 'points':
          return b.totalPoints - a.totalPoints;
        case 'streaks':
          return b.currentStreak - a.currentStreak;
        case 'completion':
          return b.completionPercentage - a.completionPercentage;
        case 'achievements':
          return b.achievementsCount - a.achievementsCount;
        default:
          return b.totalPoints - a.totalPoints;
      }
    });
  }, [category]);

  const currentUserRank = sortedUsers.findIndex(user => user.isCurrentUser) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getCategoryValue = (user: LeaderboardUser) => {
    switch (category) {
      case 'points':
        return `${user.totalPoints.toLocaleString()} pts`;
      case 'streaks':
        return `${user.currentStreak} days`;
      case 'completion':
        return `${user.completionPercentage}%`;
      case 'achievements':
        return `${user.achievementsCount} badges`;
      default:
        return '';
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'points':
        return 'Total Points';
      case 'streaks':
        return 'Current Streak';
      case 'completion':
        return 'Profile Completion';
      case 'achievements':
        return 'Achievements Unlocked';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Leaderboard
          </CardTitle>
          <div className="flex gap-2">
            <Select value={timeFrame} onValueChange={(value: any) => setTimeFrame(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="allTime">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Points</SelectItem>
                <SelectItem value="streaks">Streaks</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="achievements">Achievements</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-6">
            {/* Current User Position */}
            {currentUserRank > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      Your Position
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    #{currentUserRank} of {sortedUsers.length}
                  </Badge>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {getCategoryLabel()}: {getCategoryValue(sortedUsers.find(u => u.isCurrentUser)!)}
                </p>
              </div>
            )}

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {sortedUsers.slice(0, 3).map((user, index) => {
                const rank = index + 1;
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`text-center ${
                      user.isCurrentUser ? 'ring-2 ring-blue-400 ring-offset-2 rounded-lg' : ''
                    }`}
                  >
                    <div className={`relative p-4 rounded-lg ${
                      rank === 1 
                        ? 'bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                        : rank === 2
                        ? 'bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900'
                        : 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20'
                    }`}>
                      <div className="flex justify-center mb-3">
                        {getRankIcon(rank)}
                      </div>
                      <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-white shadow-lg">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-sm mb-1">{user.fullName}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        @{user.username}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Level {user.level}
                      </Badge>
                      <p className="text-sm font-medium mt-2">
                        {getCategoryValue(user)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Full Leaderboard */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Full Rankings
              </h3>
              {sortedUsers.map((user, index) => {
                const rank = index + 1;
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      user.isCurrentUser 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center">
                        {rank <= 3 ? getRankIcon(rank) : getRankIcon(rank)}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {user.fullName}
                          {user.isCurrentUser && (
                            <Badge variant="secondary" size="sm">You</Badge>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{user.username} • Level {user.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{getCategoryValue(user)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.achievementsCount} achievements
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                Connect with Friends
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Follow other users to see how you stack up against your friends!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}