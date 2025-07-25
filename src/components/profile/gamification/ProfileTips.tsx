'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  X, 
  Sparkles, 
  Target,
  TrendingUp,
  Users,
  Settings,
  Utensils,
  Home,
  DollarSign,
  Calendar,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CompletionMetrics } from '@/services/profile/ProfileCompletionService';

interface ProfileTip {
  id: string;
  title: string;
  description: string;
  section: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  points: number;
  icon: React.ReactNode;
  actionLabel: string;
  steps?: string[];
  benefits?: string[];
}

interface ProfileTipsProps {
  metrics: CompletionMetrics;
  onSectionClick?: (section: string) => void;
}

export function ProfileTips({ metrics, onSectionClick }: ProfileTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  // Generate personalized tips based on profile completion
  const tips = useMemo(() => {
    const allTips: ProfileTip[] = [
      {
        id: 'add-photo',
        title: 'Add Your Profile Photo',
        description: 'A profile photo helps others connect with you and makes your profile more personal.',
        section: 'basicInfo',
        priority: 'high',
        estimatedTime: '2 min',
        points: 10,
        icon: <Users className="h-5 w-5" />,
        actionLabel: 'Upload Photo',
        steps: [
          'Click on your profile avatar',
          'Select "Upload Photo"',
          'Choose a clear, friendly photo',
          'Crop and save'
        ],
        benefits: [
          'Earn 10 points instantly',
          'Unlock the "Say Cheese!" achievement',
          'Build trust with other users',
          'Personalize your experience'
        ]
      },
      {
        id: 'complete-basic-info',
        title: 'Complete Your Basic Information',
        description: 'Fill in your name, bio, and other details to help us personalize your experience.',
        section: 'basicInfo',
        priority: 'high',
        estimatedTime: '5 min',
        points: 20,
        icon: <Settings className="h-5 w-5" />,
        actionLabel: 'Complete Profile',
        steps: [
          'Add your full name',
          'Write a short bio about yourself',
          'Set your date of birth',
          'Choose your gender (optional)',
          'Add your location'
        ],
        benefits: [
          'Earn 20 points',
          'Unlock personalized recommendations',
          'Get better recipe suggestions',
          'Access location-specific features'
        ]
      },
      {
        id: 'set-dietary-preferences',
        title: 'Configure Dietary Preferences',
        description: 'Tell us about your dietary restrictions and food preferences for better recommendations.',
        section: 'dietary',
        priority: 'high',
        estimatedTime: '3 min',
        points: 30,
        icon: <Utensils className="h-5 w-5" />,
        actionLabel: 'Set Preferences',
        steps: [
          'Select your dietary restrictions',
          'Add any food allergies',
          'Choose your preferred cuisines',
          'Set your spice tolerance',
          'Select texture preferences'
        ],
        benefits: [
          'Earn 30 points',
          'Get personalized recipe suggestions',
          'Avoid foods you can\'t eat',
          'Discover new cuisines you\'ll love'
        ]
      },
      {
        id: 'add-household-members',
        title: 'Add Household Members',
        description: 'Include family members or roommates to plan meals for everyone.',
        section: 'household',
        priority: 'medium',
        estimatedTime: '4 min',
        points: 25,
        icon: <Home className="h-5 w-5" />,
        actionLabel: 'Add Members',
        steps: [
          'Click "Add Household Member"',
          'Enter their name and relationship',
          'Add their dietary restrictions',
          'Set their age (optional)',
          'Save their preferences'
        ],
        benefits: [
          'Earn 25 points',
          'Plan meals for the whole family',
          'Get portion size recommendations',
          'Account for everyone\'s preferences'
        ]
      },
      {
        id: 'set-budget',
        title: 'Set Your Food Budget',
        description: 'Configure your weekly and monthly food budget to get cost-effective recommendations.',
        section: 'financial',
        priority: 'medium',
        estimatedTime: '2 min',
        points: 20,
        icon: <DollarSign className="h-5 w-5" />,
        actionLabel: 'Set Budget',
        steps: [
          'Enter your weekly food budget',
          'Set your monthly limit',
          'Choose your currency',
          'Save your preferences'
        ],
        benefits: [
          'Earn 20 points',
          'Get budget-friendly recipes',
          'Track your food expenses',
          'Plan cost-effective meals'
        ]
      },
      {
        id: 'configure-meal-schedule',
        title: 'Set Up Your Meal Schedule',
        description: 'Define when you typically eat meals to get timely reminders and suggestions.',
        section: 'planning',
        priority: 'medium',
        estimatedTime: '3 min',
        points: 25,
        icon: <Calendar className="h-5 w-5" />,
        actionLabel: 'Set Schedule',
        steps: [
          'Set your breakfast time',
          'Configure lunch schedule',
          'Set dinner time',
          'Enable meal reminders',
          'Choose notification preferences'
        ],
        benefits: [
          'Earn 25 points',
          'Get timely meal reminders',
          'Plan your day better',
          'Never miss a meal'
        ]
      },
      {
        id: 'customize-privacy',
        title: 'Customize Privacy Settings',
        description: 'Control what information you share and how others can interact with you.',
        section: 'social',
        priority: 'low',
        estimatedTime: '2 min',
        points: 15,
        icon: <Heart className="h-5 w-5" />,
        actionLabel: 'Set Privacy',
        steps: [
          'Choose profile visibility',
          'Set recipe sharing preferences',
          'Configure data sharing options',
          'Save your settings'
        ],
        benefits: [
          'Earn 15 points',
          'Control your privacy',
          'Share safely',
          'Build your network'
        ]
      }
    ];

    // Filter tips based on completion status and dismissed tips
    return allTips.filter(tip => {
      if (dismissedTips.includes(tip.id)) return false;
      
      const sectionCompletion = metrics.sections[tip.section as keyof typeof metrics.sections] || 0;
      
      // Show tip if section is not complete
      if (sectionCompletion < 100) {
        // Prioritize tips for less complete sections
        if (tip.priority === 'high' && sectionCompletion < 50) return true;
        if (tip.priority === 'medium' && sectionCompletion < 75) return true;
        if (tip.priority === 'low' && sectionCompletion < 90) return true;
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by priority and section completion
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      const aCompletion = metrics.sections[a.section as keyof typeof metrics.sections] || 0;
      const bCompletion = metrics.sections[b.section as keyof typeof metrics.sections] || 0;
      
      return aCompletion - bCompletion;
    }).slice(0, 6); // Show max 6 tips
  }, [metrics, dismissedTips]);

  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => [...prev, tipId]);
  };

  const handleTipAction = (tip: ProfileTip) => {
    onSectionClick?.(tip.section);
    dismissTip(tip.id);
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
        return '';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      default:
        return '';
    }
  };

  if (tips.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Great job!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You've completed most of your profile. Keep using the app to unlock more achievements!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          Personalized Tips
          <Badge variant="secondary">{tips.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {tips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${getPriorityColor(tip.priority)} border shadow-sm`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                          {tip.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{tip.title}</h4>
                            <Badge className={`text-xs ${getPriorityBadgeColor(tip.priority)}`}>
                              {tip.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              +{tip.points} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {tip.description}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ⏱️ {tip.estimatedTime}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedTip(
                                expandedTip === tip.id ? null : tip.id
                              )}
                              className="text-xs h-6 px-2"
                            >
                              {expandedTip === tip.id ? 'Less' : 'More'}
                            </Button>
                          </div>
                          
                          <AnimatePresence>
                            {expandedTip === tip.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3 space-y-3"
                              >
                                {tip.steps && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Steps to complete:
                                    </h5>
                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                      {tip.steps.map((step, stepIndex) => (
                                        <li key={stepIndex} className="flex items-start gap-2">
                                          <span className="flex-shrink-0 w-4 h-4 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center justify-center font-medium">
                                            {stepIndex + 1}
                                          </span>
                                          {step}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {tip.benefits && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Benefits:
                                    </h5>
                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                      {tip.benefits.map((benefit, benefitIndex) => (
                                        <li key={benefitIndex} className="flex items-center gap-2">
                                          <Sparkles className="h-3 w-3 text-yellow-500" />
                                          {benefit}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleTipAction(tip)}
                              className="text-xs h-7 px-3"
                            >
                              {tip.actionLabel}
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissTip(tip.id)}
                              className="text-xs h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tips.length > 3 && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete these tips to unlock more personalized suggestions!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}