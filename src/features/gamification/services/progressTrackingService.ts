import { XPEventType, StreakType } from '../types';

import { achievementService } from './achievementService';
import { xpService } from './xpService';

interface ProgressEvent {
  eventType: XPEventType;
  metadata: Record<string, any>;
  timestamp: Date;
}

interface UserProgress {
  userId: string;
  dailyGoals: Record<string, { current: number; target: number }>;
  weeklyGoals: Record<string, { current: number; target: number }>;
  monthlyGoals: Record<string, { current: number; target: number }>;
  streaks: Record<StreakType, { current: number; longest: number; lastActivity: Date }>;
  totalStats: Record<string, number>;
  recentEvents: ProgressEvent[];
}

class ProgressTrackingService {
  private static instance: ProgressTrackingService;
  private userProgress: Map<string, UserProgress> = new Map();

  private constructor() {}

  static getInstance(): ProgressTrackingService {
    if (!ProgressTrackingService.instance) {
      ProgressTrackingService.instance = new ProgressTrackingService();
    }
    return ProgressTrackingService.instance;
  }

  // Initialize user progress tracking
  async initializeUserProgress(userId: string): Promise<UserProgress> {
    const userProgress: UserProgress = {
      userId,
      dailyGoals: {
        xp_earned: { current: 0, target: 100 },
        recipes_cooked: { current: 0, target: 2 },
        meals_planned: { current: 0, target: 3 },
        nutrition_goals_met: { current: 0, target: 1 }
      },
      weeklyGoals: {
        xp_earned: { current: 0, target: 500 },
        recipes_cooked: { current: 0, target: 10 },
        meals_planned: { current: 0, target: 21 },
        recipes_created: { current: 0, target: 1 },
        pantry_updated: { current: 0, target: 5 },
        shopping_completed: { current: 0, target: 2 }
      },
      monthlyGoals: {
        xp_earned: { current: 0, target: 2000 },
        recipes_cooked: { current: 0, target: 40 },
        meals_planned: { current: 0, target: 90 },
        recipes_created: { current: 0, target: 5 },
        achievements_unlocked: { current: 0, target: 3 },
        challenges_completed: { current: 0, target: 2 }
      },
      streaks: {
        [StreakType.DAILY_LOGIN]: { current: 0, longest: 0, lastActivity: new Date() },
        [StreakType.MEAL_PLANNING]: { current: 0, longest: 0, lastActivity: new Date() },
        [StreakType.COOKING]: { current: 0, longest: 0, lastActivity: new Date() },
        [StreakType.NUTRITION_GOALS]: { current: 0, longest: 0, lastActivity: new Date() },
        [StreakType.PANTRY_MANAGEMENT]: { current: 0, longest: 0, lastActivity: new Date() }
      },
      totalStats: {
        total_xp: 0,
        total_points: 0,
        recipes_cooked: 0,
        recipes_created: 0,
        meals_planned: 0,
        meals_completed: 0,
        pantry_items_managed: 0,
        shopping_lists_completed: 0,
        nutrition_goals_met: 0,
        achievements_unlocked: 0,
        challenges_completed: 0,
        social_interactions: 0,
        recipes_shared: 0,
        login_days: 0
      },
      recentEvents: []
    };

    this.userProgress.set(userId, userProgress);
    return userProgress;
  }

  // Track user event and update progress
  async trackEvent(userId: string, eventType: XPEventType, metadata: Record<string, any> = {}): Promise<void> {
    let userProgress = this.userProgress.get(userId);
    
    if (!userProgress) {
      userProgress = await this.initializeUserProgress(userId);
    }

    const event: ProgressEvent = {
      eventType,
      metadata,
      timestamp: new Date()
    };

    // Add to recent events
    userProgress.recentEvents.unshift(event);
    userProgress.recentEvents = userProgress.recentEvents.slice(0, 100); // Keep last 100 events

    // Update progress based on event type
    await this.updateProgressForEvent(userProgress, eventType, metadata);

    // Update streaks
    await this.updateStreaks(userProgress, eventType, metadata);

    // Award XP
    const xpResult = await xpService.awardXP(userId, eventType, metadata);
    
    // Update XP-related progress
    this.updateXPProgress(userProgress, xpResult.xpAwarded, xpResult.pointsAwarded);

    // Check achievements
    await achievementService.checkAchievementProgress(userId, eventType, metadata);

    // Check goal completions
    await this.checkGoalCompletions(userProgress, eventType);

    // Save progress
    this.userProgress.set(userId, userProgress);
  }

  // Update progress for specific event
  private async updateProgressForEvent(
    userProgress: UserProgress, 
    eventType: XPEventType, 
    metadata: Record<string, any>
  ): Promise<void> {
    const today = new Date().toDateString();
    const thisWeek = this.getWeekStart(new Date()).toDateString();
    const thisMonth = new Date().getFullYear() + '-' + (new Date().getMonth() + 1);

    switch (eventType) {
      case XPEventType.RECIPE_COOKED:
        userProgress.totalStats.recipes_cooked++;
        this.updateGoalProgress(userProgress.dailyGoals, 'recipes_cooked', 1);
        this.updateGoalProgress(userProgress.weeklyGoals, 'recipes_cooked', 1);
        this.updateGoalProgress(userProgress.monthlyGoals, 'recipes_cooked', 1);
        break;

      case XPEventType.RECIPE_CREATED:
        userProgress.totalStats.recipes_created++;
        this.updateGoalProgress(userProgress.weeklyGoals, 'recipes_created', 1);
        this.updateGoalProgress(userProgress.monthlyGoals, 'recipes_created', 1);
        break;

      case XPEventType.MEAL_PLANNED:
        userProgress.totalStats.meals_planned++;
        this.updateGoalProgress(userProgress.dailyGoals, 'meals_planned', 1);
        this.updateGoalProgress(userProgress.weeklyGoals, 'meals_planned', 1);
        this.updateGoalProgress(userProgress.monthlyGoals, 'meals_planned', 1);
        break;

      case XPEventType.MEAL_COMPLETED:
        userProgress.totalStats.meals_completed++;
        break;

      case XPEventType.PANTRY_UPDATED:
        userProgress.totalStats.pantry_items_managed++;
        this.updateGoalProgress(userProgress.weeklyGoals, 'pantry_updated', 1);
        break;

      case XPEventType.SHOPPING_COMPLETED:
        userProgress.totalStats.shopping_lists_completed++;
        this.updateGoalProgress(userProgress.weeklyGoals, 'shopping_completed', 1);
        break;

      case XPEventType.NUTRITION_GOAL_MET:
        userProgress.totalStats.nutrition_goals_met++;
        this.updateGoalProgress(userProgress.dailyGoals, 'nutrition_goals_met', 1);
        break;

      case XPEventType.ACHIEVEMENT_UNLOCKED:
        userProgress.totalStats.achievements_unlocked++;
        this.updateGoalProgress(userProgress.monthlyGoals, 'achievements_unlocked', 1);
        break;

      case XPEventType.CHALLENGE_COMPLETED:
        userProgress.totalStats.challenges_completed++;
        this.updateGoalProgress(userProgress.monthlyGoals, 'challenges_completed', 1);
        break;

      case XPEventType.RECIPE_SHARED:
        userProgress.totalStats.recipes_shared++;
        userProgress.totalStats.social_interactions++;
        break;

      case XPEventType.RECIPE_RATED:
        userProgress.totalStats.social_interactions++;
        break;

      case XPEventType.DAILY_LOGIN:
        userProgress.totalStats.login_days++;
        break;
    }
  }

  // Update goal progress
  private updateGoalProgress(goals: Record<string, { current: number; target: number }>, goalType: string, increment: number): void {
    if (goals[goalType]) {
      goals[goalType].current += increment;
    }
  }

  // Update XP-related progress
  private updateXPProgress(userProgress: UserProgress, xpAwarded: number, pointsAwarded: number): void {
    userProgress.totalStats.total_xp += xpAwarded;
    userProgress.totalStats.total_points += pointsAwarded;
    
    this.updateGoalProgress(userProgress.dailyGoals, 'xp_earned', xpAwarded);
    this.updateGoalProgress(userProgress.weeklyGoals, 'xp_earned', xpAwarded);
    this.updateGoalProgress(userProgress.monthlyGoals, 'xp_earned', xpAwarded);
  }

  // Update streaks
  private async updateStreaks(
    userProgress: UserProgress, 
    eventType: XPEventType, 
    metadata: Record<string, any>
  ): Promise<void> {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Map events to streak types
    const streakMappings: Record<XPEventType, StreakType[]> = {
      [XPEventType.DAILY_LOGIN]: [StreakType.DAILY_LOGIN],
      [XPEventType.MEAL_PLANNED]: [StreakType.MEAL_PLANNING],
      [XPEventType.RECIPE_COOKED]: [StreakType.COOKING],
      [XPEventType.NUTRITION_GOAL_MET]: [StreakType.NUTRITION_GOALS],
      [XPEventType.PANTRY_UPDATED]: [StreakType.PANTRY_MANAGEMENT]
    };

    const streakTypes = streakMappings[eventType] || [];
    
    for (const streakType of streakTypes) {
      const streak = userProgress.streaks[streakType];
      const lastActivityDate = streak.lastActivity.toDateString();
      
      if (lastActivityDate === today) {
        // Already active today, no change
        continue;
      } else if (lastActivityDate === yesterday) {
        // Continue streak
        streak.current++;
        streak.longest = Math.max(streak.longest, streak.current);
        streak.lastActivity = new Date();
      } else {
        // Streak broken, restart
        streak.current = 1;
        streak.lastActivity = new Date();
      }
    }
  }

  // Check goal completions
  private async checkGoalCompletions(userProgress: UserProgress, eventType: XPEventType): Promise<void> {
    const completedGoals: string[] = [];

    // Check daily goals
    Object.entries(userProgress.dailyGoals).forEach(([goalType, goal]) => {
      if (goal.current >= goal.target) {
        completedGoals.push(`daily_${goalType}`);
      }
    });

    // Check weekly goals
    Object.entries(userProgress.weeklyGoals).forEach(([goalType, goal]) => {
      if (goal.current >= goal.target) {
        completedGoals.push(`weekly_${goalType}`);
      }
    });

    // Check monthly goals
    Object.entries(userProgress.monthlyGoals).forEach(([goalType, goal]) => {
      if (goal.current >= goal.target) {
        completedGoals.push(`monthly_${goalType}`);
      }
    });

    // Award bonus XP for goal completions
    for (const completedGoal of completedGoals) {
      if (completedGoal.startsWith('daily_')) {
        await this.trackEvent(userProgress.userId, XPEventType.DAILY_LOGIN, { goalCompleted: completedGoal });
      } else if (completedGoal.startsWith('weekly_')) {
        await this.trackEvent(userProgress.userId, XPEventType.WEEKLY_GOAL_MET, { goalCompleted: completedGoal });
      } else if (completedGoal.startsWith('monthly_')) {
        await this.trackEvent(userProgress.userId, XPEventType.MONTHLY_GOAL_MET, { goalCompleted: completedGoal });
      }
    }
  }

  // Get user progress
  async getUserProgress(userId: string): Promise<UserProgress> {
    let userProgress = this.userProgress.get(userId);
    
    if (!userProgress) {
      userProgress = await this.initializeUserProgress(userId);
    }
    
    return userProgress;
  }

  // Get progress analytics
  async getProgressAnalytics(userId: string): Promise<{
    dailyProgress: Record<string, number>;
    weeklyProgress: Record<string, number>;
    monthlyProgress: Record<string, number>;
    streakSummary: Record<StreakType, { current: number; longest: number }>;
    recentActivity: ProgressEvent[];
    goalCompletionRate: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  }> {
    const userProgress = await this.getUserProgress(userId);
    
    // Calculate progress percentages
    const dailyProgress: Record<string, number> = {};
    Object.entries(userProgress.dailyGoals).forEach(([goalType, goal]) => {
      dailyProgress[goalType] = Math.min((goal.current / goal.target) * 100, 100);
    });

    const weeklyProgress: Record<string, number> = {};
    Object.entries(userProgress.weeklyGoals).forEach(([goalType, goal]) => {
      weeklyProgress[goalType] = Math.min((goal.current / goal.target) * 100, 100);
    });

    const monthlyProgress: Record<string, number> = {};
    Object.entries(userProgress.monthlyGoals).forEach(([goalType, goal]) => {
      monthlyProgress[goalType] = Math.min((goal.current / goal.target) * 100, 100);
    });

    // Calculate streak summary
    const streakSummary: Record<StreakType, { current: number; longest: number }> = {};
    Object.entries(userProgress.streaks).forEach(([streakType, streak]) => {
      streakSummary[streakType as StreakType] = {
        current: streak.current,
        longest: streak.longest
      };
    });

    // Calculate goal completion rates
    const dailyCompletionRate = Object.values(userProgress.dailyGoals).reduce((sum, goal) => 
      sum + (goal.current >= goal.target ? 1 : 0), 0) / Object.keys(userProgress.dailyGoals).length * 100;

    const weeklyCompletionRate = Object.values(userProgress.weeklyGoals).reduce((sum, goal) => 
      sum + (goal.current >= goal.target ? 1 : 0), 0) / Object.keys(userProgress.weeklyGoals).length * 100;

    const monthlyCompletionRate = Object.values(userProgress.monthlyGoals).reduce((sum, goal) => 
      sum + (goal.current >= goal.target ? 1 : 0), 0) / Object.keys(userProgress.monthlyGoals).length * 100;

    return {
      dailyProgress,
      weeklyProgress,
      monthlyProgress,
      streakSummary,
      recentActivity: userProgress.recentEvents.slice(0, 20),
      goalCompletionRate: {
        daily: dailyCompletionRate,
        weekly: weeklyCompletionRate,
        monthly: monthlyCompletionRate
      }
    };
  }

  // Reset daily/weekly/monthly progress
  async resetProgress(userId: string, resetType: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const userProgress = await this.getUserProgress(userId);
    
    switch (resetType) {
      case 'daily':
        Object.keys(userProgress.dailyGoals).forEach(goalType => {
          userProgress.dailyGoals[goalType].current = 0;
        });
        break;
      case 'weekly':
        Object.keys(userProgress.weeklyGoals).forEach(goalType => {
          userProgress.weeklyGoals[goalType].current = 0;
        });
        break;
      case 'monthly':
        Object.keys(userProgress.monthlyGoals).forEach(goalType => {
          userProgress.monthlyGoals[goalType].current = 0;
        });
        break;
    }
    
    this.userProgress.set(userId, userProgress);
  }

  // Get week start date
  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  // Update goal targets
  async updateGoalTargets(
    userId: string, 
    goalType: 'daily' | 'weekly' | 'monthly',
    updates: Record<string, number>
  ): Promise<void> {
    const userProgress = await this.getUserProgress(userId);
    
    Object.entries(updates).forEach(([goalKey, target]) => {
      switch (goalType) {
        case 'daily':
          if (userProgress.dailyGoals[goalKey]) {
            userProgress.dailyGoals[goalKey].target = target;
          }
          break;
        case 'weekly':
          if (userProgress.weeklyGoals[goalKey]) {
            userProgress.weeklyGoals[goalKey].target = target;
          }
          break;
        case 'monthly':
          if (userProgress.monthlyGoals[goalKey]) {
            userProgress.monthlyGoals[goalKey].target = target;
          }
          break;
      }
    });
    
    this.userProgress.set(userId, userProgress);
  }

  // Get user's total statistics
  async getUserTotalStats(userId: string): Promise<Record<string, number>> {
    const userProgress = await this.getUserProgress(userId);
    return { ...userProgress.totalStats };
  }
}

export const progressTrackingService = ProgressTrackingService.getInstance();