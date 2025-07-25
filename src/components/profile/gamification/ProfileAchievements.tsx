'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award, Target, TrendingUp, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Achievement } from '@/services/profile/ProfileCompletionService';

interface ProfileAchievementsProps {
  achievements: Achievement[];
  totalPoints: number;
  level: number;
}

export function ProfileAchievements({
  achievements,
  totalPoints,
  level,
}: ProfileAchievementsProps) {
  // Group achievements by category
  const groupedAchievements = useMemo(() => {
    return achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, Achievement[]>);
  }, [achievements]);

  // Sort achievements: unlocked first, then by progress
  const sortAchievements = (achievements: Achievement[]) => {
    return [...achievements].sort((a, b) => {
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      
      const aProgress = (a.progress || 0) / (a.maxProgress || 1);
      const bProgress = (b.progress || 0) / (b.maxProgress || 1);
      return bProgress - aProgress;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile':
        return <Award className="h-5 w-5" />;
      case 'activity':
        return <Target className="h-5 w-5" />;
      case 'social':
        return <Star className="h-5 w-5" />;
      case 'mastery':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profile':
        return 'text-blue-600 dark:text-blue-400';
      case 'activity':
        return 'text-green-600 dark:text-green-400';
      case 'social':
        return 'text-purple-600 dark:text-purple-400';
      case 'mastery':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Achievements
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Level {level}
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {totalPoints} points
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="mastery">Mastery</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortAchievements(achievements).map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </TabsContent>

          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="mb-4 flex items-center gap-2">
                <span className={getCategoryColor(category)}>
                  {getCategoryIcon(category)}
                </span>
                <h3 className="text-lg font-semibold capitalize">{category} Achievements</h3>
                <Badge variant="secondary">
                  {categoryAchievements.filter(a => a.unlockedAt).length}/{categoryAchievements.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortAchievements(categoryAchievements).map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = achievement.progress || 0;
  const maxProgress = achievement.maxProgress || 1;
  const progressPercentage = (progress / maxProgress) * 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`relative overflow-hidden transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
                  : 'bg-gray-50 dark:bg-gray-900 opacity-75'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{achievement.icon}</div>
                  {isUnlocked ? (
                    <Badge className="bg-yellow-500 text-white">
                      +{achievement.points}
                    </Badge>
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <h4 className={`font-semibold mb-1 ${isUnlocked ? '' : 'text-gray-500'}`}>
                  {achievement.name}
                </h4>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {achievement.description}
                </p>

                {achievement.maxProgress && !isUnlocked && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{progress}/{maxProgress}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1.5" />
                  </div>
                )}

                {isUnlocked && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    </motion.div>
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isUnlocked ? (
            <p>Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
          ) : achievement.maxProgress ? (
            <p>Progress: {progress}/{maxProgress}</p>
          ) : (
            <p>Keep going to unlock this achievement!</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}