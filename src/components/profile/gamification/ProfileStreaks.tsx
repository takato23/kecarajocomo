'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays, addDays } from 'date-fns';

interface ProfileStreaksProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
}

export function ProfileStreaks({
  currentStreak,
  longestStreak,
  lastActiveDate,
}: ProfileStreaksProps) {
  // Calculate if streak is still active (last active within 24 hours)
  const isStreakActive = differenceInDays(new Date(), lastActiveDate) <= 1;
  
  // Calculate streak milestones
  const nextMilestone = getNextMilestone(currentStreak);
  const progressToMilestone = (currentStreak / nextMilestone.days) * 100;

  // Calculate when user needs to be active to maintain streak
  const nextRequiredActivity = addDays(lastActiveDate, 1);
  const hoursUntilExpiry = Math.max(0, differenceInDays(nextRequiredActivity, new Date()) * 24);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Current Streak Card */}
      <Card className={`relative overflow-hidden ${isStreakActive ? '' : 'opacity-75'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${isStreakActive ? 'text-orange-500' : 'text-gray-400'}`} />
              Current Streak
            </span>
            {isStreakActive && currentStreak >= 3 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={currentStreak}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold"
              >
                {currentStreak}
              </motion.span>
              <span className="text-lg text-gray-600 dark:text-gray-400">
                {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            {isStreakActive && currentStreak > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Next milestone: {nextMilestone.name}
                  </span>
                  <span className="font-medium">
                    {nextMilestone.days - currentStreak} days to go
                  </span>
                </div>
                <Progress value={progressToMilestone} className="h-2" />
              </div>
            )}

            {isStreakActive && hoursUntilExpiry < 24 && (
              <div className="rounded-lg bg-orange-100 dark:bg-orange-900/20 p-3">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  ⚠️ Log in within {Math.round(hoursUntilExpiry)} hours to maintain your streak!
                </p>
              </div>
            )}

            {!isStreakActive && currentStreak > 0 && (
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Streak ended. Start a new one today!
                </p>
              </div>
            )}
          </div>

          {/* Flame animation for active streaks */}
          {isStreakActive && currentStreak >= 3 && (
            <motion.div
              className="absolute -top-10 -right-10 opacity-10"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Flame className="h-32 w-32 text-orange-500" />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Longest Streak Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Longest Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{longestStreak}</span>
              <span className="text-lg text-gray-600 dark:text-gray-400">
                {longestStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            {longestStreak > currentStreak && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {longestStreak - currentStreak} days away from your record!
              </p>
            )}

            {longestStreak === currentStreak && currentStreak > 0 && (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                🎉 New Record!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Streak Calendar Preview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Streak History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakCalendar currentStreak={currentStreak} lastActiveDate={lastActiveDate} />
        </CardContent>
      </Card>

      {/* Streak Benefits */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Streak Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {getStreakBenefits(currentStreak).map((benefit, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 ${
                  benefit.unlocked
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{benefit.icon}</span>
                  <span className={`text-sm font-medium ${
                    benefit.unlocked ? 'text-green-700 dark:text-green-400' : 'text-gray-500'
                  }`}>
                    {benefit.days} days
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StreakCalendar({ currentStreak, lastActiveDate }: { currentStreak: number; lastActiveDate: Date }) {
  const today = new Date();
  const days = [];
  
  // Show last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const daysSinceLastActive = differenceInDays(lastActiveDate, date);
    const isActive = daysSinceLastActive >= 0 && daysSinceLastActive < currentStreak;
    
    days.push({
      date,
      isActive,
      isToday: i === 0,
    });
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
        <div key={index} className="text-center text-xs text-gray-500 font-medium py-1">
          {day}
        </div>
      ))}
      {days.map((day, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.01 }}
          className={`
            aspect-square rounded-md flex items-center justify-center text-xs
            ${day.isActive ? 'bg-orange-500 text-white font-medium' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}
            ${day.isToday ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
          `}
        >
          {format(day.date, 'd')}
        </motion.div>
      ))}
    </div>
  );
}

function getNextMilestone(currentStreak: number): { days: number; name: string } {
  const milestones = [
    { days: 3, name: '3-day streak' },
    { days: 7, name: 'Week warrior' },
    { days: 14, name: 'Two weeks strong' },
    { days: 30, name: 'Monthly master' },
    { days: 60, name: 'Two months!' },
    { days: 90, name: 'Quarter champion' },
    { days: 180, name: 'Half-year hero' },
    { days: 365, name: 'Year-long legend' },
  ];

  return milestones.find(m => m.days > currentStreak) || { days: 365, name: 'Year-long legend' };
}

function getStreakBenefits(currentStreak: number) {
  return [
    {
      days: 3,
      icon: '🔥',
      description: 'Unlock daily tips',
      unlocked: currentStreak >= 3,
    },
    {
      days: 7,
      icon: '⭐',
      description: 'Priority support',
      unlocked: currentStreak >= 7,
    },
    {
      days: 14,
      icon: '🎯',
      description: 'Advanced features',
      unlocked: currentStreak >= 14,
    },
    {
      days: 30,
      icon: '🏆',
      description: 'Exclusive recipes',
      unlocked: currentStreak >= 30,
    },
  ];
}