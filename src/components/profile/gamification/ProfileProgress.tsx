'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Users, 
  DollarSign, 
  Utensils, 
  ChefHat, 
  Calendar, 
  Heart,
  TrendingUp,
  Trophy,
  Target,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Simple collapsible implementation
const Collapsible = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const CollapsibleContent = ({ children, className = '', ...props }: any) => 
  <div className={`overflow-hidden ${className}`} {...props}>{children}</div>;
const CollapsibleTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
import type { CompletionMetrics } from '@/services/profile/ProfileCompletionService';
import { ProfileTips } from './ProfileTips';

interface ProfileProgressProps {
  metrics: CompletionMetrics;
  suggestions: string[];
  onSectionClick?: (section: string) => void;
}

export function ProfileProgress({ 
  metrics, 
  suggestions, 
  onSectionClick 
}: ProfileProgressProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const sectionIcons: Record<string, React.ReactNode> = {
    basicInfo: <User className="h-5 w-5" />,
    preferences: <Settings className="h-5 w-5" />,
    household: <Users className="h-5 w-5" />,
    financial: <DollarSign className="h-5 w-5" />,
    dietary: <Utensils className="h-5 w-5" />,
    cooking: <ChefHat className="h-5 w-5" />,
    planning: <Calendar className="h-5 w-5" />,
    social: <Heart className="h-5 w-5" />,
  };

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

  const getStatusColor = (completion: number) => {
    if (completion === 100) return 'text-green-600 dark:text-green-400';
    if (completion >= 75) return 'text-blue-600 dark:text-blue-400';
    if (completion >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (completion: number) => {
    if (completion === 100) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (completion >= 75) return <Star className="h-4 w-4 text-blue-600" />;
    if (completion >= 50) return <Target className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const levelProgress = ((metrics.totalPoints % 1000) / 1000) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              Profile Completion
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                Level {metrics.level}
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {metrics.overall}%
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {metrics.overall}% complete
                </span>
              </div>
              <Progress value={metrics.overall} className="h-3" />
            </div>

            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Level {metrics.level} Progress
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {metrics.totalPoints} / {metrics.nextLevelPoints === Infinity ? '∞' : metrics.nextLevelPoints} points
                </span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              {metrics.nextLevelPoints !== Infinity && (
                <p className="text-xs text-gray-500">
                  {metrics.nextLevelPoints - metrics.totalPoints} points to next level
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalPoints}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.achievements.filter(a => a.unlockedAt).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.currentStreak}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.level}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Level</div>
              </div>
            </div>
          </div>

          {/* Celebration animation for high completion */}
          {metrics.overall >= 90 && (
            <motion.div
              className="absolute top-4 right-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Trophy className="h-8 w-8 text-yellow-500" />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Section Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Section Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.sections).map(([section, completion]) => (
              <Collapsible
                key={section}
                open={expandedSections.includes(section)}
                onOpenChange={() => toggleSection(section)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        completion === 100 
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : completion >= 50
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : 'bg-gray-100 dark:bg-gray-900'
                      }`}>
                        {sectionIcons[section]}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {sectionNames[section]}
                          </span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(completion)}
                            <span className={`font-medium ${getStatusColor(completion)}`}>
                              {completion}%
                            </span>
                          </div>
                        </div>
                        <Progress value={completion} className="h-1.5 mt-1" />
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      expandedSections.includes(section) ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 ml-14">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {getSectionDescription(section, completion)}
                    </p>
                    {completion < 100 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSectionClick?.(section)}
                        className="mt-2"
                      >
                        Complete Section
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Card */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                      {suggestion}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Tips */}
      <ProfileTips 
        metrics={metrics}
        onSectionClick={onSectionClick}
      />

      {/* Motivational Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
              {getMotivationalMessage(metrics.overall)}
            </h3>
            <p className="text-purple-600 dark:text-purple-400">
              {getMotivationalSubtext(metrics.overall, metrics.currentStreak)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getSectionDescription(section: string, completion: number): string {
  const descriptions: Record<string, string> = {
    basicInfo: completion === 100
      ? 'Your basic profile information is complete!'
      : 'Add your name, photo, bio, and personal details to help others connect with you.',
    preferences: completion === 100
      ? 'Your preferences are all set up!'
      : 'Configure your app preferences, notifications, and meal schedule.',
    household: completion === 100
      ? 'Household setup is complete!'
      : 'Add family members or roommates to plan meals for everyone.',
    financial: completion === 100
      ? 'Budget settings are configured!'
      : 'Set up your food budget to help manage expenses and find cost-effective recipes.',
    dietary: completion === 100
      ? 'Dietary preferences are complete!'
      : 'Tell us about your dietary restrictions, allergies, and taste preferences.',
    cooking: completion === 100
      ? 'Cooking profile is complete!'
      : 'Share your cooking skills, available time, and kitchen equipment.',
    planning: completion === 100
      ? 'Planning preferences are set!'
      : 'Configure your meal planning preferences and shopping habits.',
    social: completion === 100
      ? 'Social features are active!'
      : 'Connect with other users and customize your privacy settings.',
  };

  return descriptions[section] || 'Complete this section to improve your experience.';
}

function getMotivationalMessage(completion: number): string {
  if (completion >= 90) return "🎉 You're a Profile Master!";
  if (completion >= 75) return "⭐ Almost There, Champion!";
  if (completion >= 50) return "🚀 You're Making Great Progress!";
  if (completion >= 25) return "💪 Keep Building Your Profile!";
  return "🌟 Welcome! Let's Get Started!";
}

function getMotivationalSubtext(completion: number, streak: number): string {
  if (completion >= 90) {
    return `Amazing job! Your ${streak}-day streak shows your dedication. Keep it up!`;
  }
  if (completion >= 75) {
    return `You're so close to completion! Just ${100 - completion}% to go!`;
  }
  if (completion >= 50) {
    return `You're halfway there! Every section you complete unlocks new features.`;
  }
  if (completion >= 25) {
    return `Great start! Complete more sections to unlock achievements and features.`;
  }
  return "Let's build your profile together. Each step unlocks new possibilities!";
}