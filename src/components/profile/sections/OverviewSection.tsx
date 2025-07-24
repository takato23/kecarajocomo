'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Clock, 
  Coins, 
  Trophy,
  Flame,
  TrendingUp,
  Calendar,
  Star,
  Bookmark,
  BarChart3
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProfileContext } from '@/contexts/ProfileContext';

interface Stat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt?: Date;
  progress?: {
    current: number;
    total: number;
  };
}

export function OverviewSection() {
  const { profile } = useProfileContext();
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // Mock data for demonstration
  const weeklyStats: Stat[] = [
    {
      label: 'Meals Cooked',
      value: 12,
      icon: <ChefHat className="w-5 h-5" />,
      trend: { value: 20, isPositive: true },
    },
    {
      label: 'New Recipes',
      value: 3,
      icon: <Star className="w-5 h-5" />,
      trend: { value: 50, isPositive: true },
    },
    {
      label: 'Time Saved',
      value: '4.5h',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: 'Money Saved',
      value: '€45',
      icon: <Coins className="w-5 h-5" />,
      trend: { value: 15, isPositive: true },
    },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Italian Dish',
      description: 'Cooked your first Italian recipe',
      icon: '🍝',
      unlockedAt: new Date(),
    },
    {
      id: '2',
      name: '5-Day Meal Streak',
      description: 'Cooked for 5 days in a row',
      icon: '🔥',
      unlockedAt: new Date(),
    },
    {
      id: '3',
      name: 'Budget Master',
      description: 'Stayed under budget for a week',
      icon: '💰',
      unlockedAt: new Date(),
    },
    {
      id: '4',
      name: 'Recipe Explorer',
      description: 'Try 10 different recipes',
      icon: '🔍',
      progress: { current: 7, total: 10 },
    },
    {
      id: '5',
      name: 'Healthy Week',
      description: 'Cook 7 healthy meals in a week',
      icon: '🥗',
      progress: { current: 3, total: 7 },
    },
  ];

  const pinnedRecipes = [
    { id: '1', name: 'Spaghetti Carbonara', image: '🍝', time: '30 min' },
    { id: '2', name: 'Greek Salad', image: '🥗', time: '15 min' },
    { id: '3', name: 'Chicken Stir-fry', image: '🍜', time: '25 min' },
  ];

  const currentStreak = 5;

  return (
    <div className="space-y-6">
      {/* Cooking Journey */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Your Cooking Journey
          </h2>
          <Button variant="ghost" size="sm" className="text-glass-medium">
            View Details
          </Button>
        </div>

        {/* Weekly Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {weeklyStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'bg-glass-medium backdrop-blur-sm rounded-xl p-4',
                'border border-white/10',
                'hover:bg-glass-heavy transition-colors'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-glass-medium rounded-lg">
                  {stat.icon}
                </div>
                {stat.trend && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    stat.trend.isPositive ? 'text-food-fresh' : 'text-error-500'
                  )}>
                    <TrendingUp className={cn(
                      'w-3 h-3',
                      !stat.trend.isPositive && 'rotate-180'
                    )} />
                    {stat.trend.value}%
                  </div>
                )}
              </div>
              <div className="text-2xl font-semibold text-glass-strong">
                {stat.value}
              </div>
              <div className="text-xs text-glass-medium mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cooking Streak */}
        <div className="mt-6 p-4 bg-gradient-to-r from-food-warm/10 to-food-golden/10 rounded-xl border border-food-warm/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-food-warm animate-pulse" />
              <div>
                <div className="text-sm font-medium text-glass-strong">
                  Cooking Streak
                </div>
                <div className="text-xs text-glass-medium">
                  Keep it up! You're on fire!
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-food-warm">
              {currentStreak} days
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-2 rounded-full',
                  i < currentStreak
                    ? 'bg-food-warm'
                    : 'bg-glass-medium'
                )}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Achievements */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Recent Achievements
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllAchievements(!showAllAchievements)}
            className="text-glass-medium"
          >
            {showAllAchievements ? 'Show Less' : 'View All'}
          </Button>
        </div>

        <div className="space-y-3">
          {achievements
            .slice(0, showAllAchievements ? undefined : 3)
            .map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-4 p-3',
                  'bg-glass-medium backdrop-blur-sm rounded-lg',
                  'border border-white/10',
                  !achievement.unlockedAt && 'opacity-60'
                )}
              >
                <div className={cn(
                  'text-3xl',
                  !achievement.unlockedAt && 'grayscale'
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-glass-strong">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-glass-medium">
                    {achievement.description}
                  </div>
                  {achievement.progress && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-glass-medium mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress.current}/{achievement.progress.total}</span>
                      </div>
                      <div className="h-1.5 bg-glass-medium rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(achievement.progress.current / achievement.progress.total) * 100}%`
                          }}
                          className="h-full bg-food-warm rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {achievement.unlockedAt && (
                  <div className="text-xs text-glass-medium">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Today
                  </div>
                )}
              </motion.div>
            ))}
        </div>
      </Card>

      {/* Pinned Recipes */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Pinned Recipes
          </h2>
          <Button variant="ghost" size="sm" className="text-glass-medium">
            Manage
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pinnedRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative overflow-hidden',
                'bg-glass-medium backdrop-blur-sm rounded-xl',
                'border border-white/10',
                'hover:bg-glass-heavy transition-all',
                'cursor-pointer group'
              )}
            >
              <div className="aspect-square flex items-center justify-center text-6xl p-8">
                {recipe.image}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="text-sm font-medium text-white">
                  {recipe.name}
                </div>
                <div className="text-xs text-white/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.time}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Add Recipe Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: pinnedRecipes.length * 0.1 }}
            className={cn(
              'aspect-square',
              'bg-glass-medium backdrop-blur-sm rounded-xl',
              'border border-white/10 border-dashed',
              'hover:bg-glass-heavy hover:border-white/20',
              'transition-all group',
              'flex items-center justify-center'
            )}
          >
            <div className="text-center">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                +
              </div>
              <div className="text-xs text-glass-medium">
                Pin Recipe
              </div>
            </div>
          </motion.button>
        </div>
      </Card>
    </div>
  );
}