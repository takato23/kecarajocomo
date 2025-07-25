import type { UserProfile, UserPreferences, HouseholdMember } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

// Achievement types
export type AchievementType = 
  | 'profile_photo'
  | 'basic_info'
  | 'dietary_preferences'
  | 'household_setup'
  | 'taste_profile'
  | 'cooking_skills'
  | 'budget_planning'
  | 'meal_schedule'
  | 'shopping_preferences'
  | 'nutrition_goals'
  | 'first_recipe'
  | 'first_meal_plan'
  | 'week_streak'
  | 'month_streak'
  | 'social_butterfly'
  | 'master_chef'
  | 'budget_guru'
  | 'health_conscious'
  | 'family_planner'
  | 'eco_warrior';

// Achievement metadata
export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'profile' | 'activity' | 'social' | 'mastery';
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

// Completion metrics
export interface CompletionMetrics {
  overall: number;
  sections: {
    basicInfo: number;
    preferences: number;
    household: number;
    financial: number;
    dietary: number;
    cooking: number;
    planning: number;
    social: number;
  };
  achievements: Achievement[];
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
}

// Profile section weights for calculating overall completion
const SECTION_WEIGHTS = {
  basicInfo: 0.20,
  preferences: 0.15,
  household: 0.10,
  financial: 0.10,
  dietary: 0.15,
  cooking: 0.10,
  planning: 0.10,
  social: 0.10,
};

// Points required for each level
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  2000,  // Level 6
  3500,  // Level 7
  5500,  // Level 8
  8000,  // Level 9
  10000, // Level 10 (Max)
];

// Achievement definitions
const ACHIEVEMENTS: Record<AchievementType, Omit<Achievement, 'id' | 'unlockedAt' | 'progress'>> = {
  profile_photo: {
    name: 'Say Cheese!',
    description: 'Upload your first profile photo',
    icon: '📸',
    points: 10,
    category: 'profile',
    maxProgress: 1,
  },
  basic_info: {
    name: 'Getting Started',
    description: 'Complete your basic profile information',
    icon: '✍️',
    points: 20,
    category: 'profile',
    maxProgress: 5,
  },
  dietary_preferences: {
    name: 'Know Your Taste',
    description: 'Set up your dietary preferences and restrictions',
    icon: '🥗',
    points: 30,
    category: 'profile',
    maxProgress: 3,
  },
  household_setup: {
    name: 'Family First',
    description: 'Add household members to your profile',
    icon: '👨‍👩‍👧‍👦',
    points: 25,
    category: 'profile',
    maxProgress: 1,
  },
  taste_profile: {
    name: 'Flavor Explorer',
    description: 'Complete your taste profile preferences',
    icon: '👅',
    points: 30,
    category: 'profile',
    maxProgress: 6,
  },
  cooking_skills: {
    name: 'Kitchen Ready',
    description: 'Define your cooking skills and available tools',
    icon: '👨‍🍳',
    points: 25,
    category: 'profile',
    maxProgress: 3,
  },
  budget_planning: {
    name: 'Money Matters',
    description: 'Set up your food budget',
    icon: '💰',
    points: 20,
    category: 'profile',
    maxProgress: 1,
  },
  meal_schedule: {
    name: 'Time Manager',
    description: 'Configure your meal schedule',
    icon: '⏰',
    points: 25,
    category: 'profile',
    maxProgress: 3,
  },
  shopping_preferences: {
    name: 'Smart Shopper',
    description: 'Set up your shopping preferences',
    icon: '🛒',
    points: 20,
    category: 'profile',
    maxProgress: 2,
  },
  nutrition_goals: {
    name: 'Health Goals',
    description: 'Define your nutritional objectives',
    icon: '🎯',
    points: 30,
    category: 'profile',
    maxProgress: 3,
  },
  first_recipe: {
    name: 'Recipe Creator',
    description: 'Create your first recipe',
    icon: '📝',
    points: 50,
    category: 'activity',
  },
  first_meal_plan: {
    name: 'Meal Planner',
    description: 'Create your first meal plan',
    icon: '📅',
    points: 50,
    category: 'activity',
  },
  week_streak: {
    name: 'Week Warrior',
    description: 'Use the app for 7 consecutive days',
    icon: '🔥',
    points: 100,
    category: 'activity',
  },
  month_streak: {
    name: 'Dedicated Foodie',
    description: 'Use the app for 30 consecutive days',
    icon: '🏆',
    points: 500,
    category: 'activity',
  },
  social_butterfly: {
    name: 'Social Butterfly',
    description: 'Follow 10 other users',
    icon: '🦋',
    points: 50,
    category: 'social',
    maxProgress: 10,
  },
  master_chef: {
    name: 'Master Chef',
    description: 'Create 50 recipes',
    icon: '⭐',
    points: 1000,
    category: 'mastery',
    maxProgress: 50,
  },
  budget_guru: {
    name: 'Budget Guru',
    description: 'Stay within budget for 4 consecutive weeks',
    icon: '📊',
    points: 200,
    category: 'mastery',
    maxProgress: 4,
  },
  health_conscious: {
    name: 'Health Conscious',
    description: 'Meet your nutrition goals for 2 weeks',
    icon: '💪',
    points: 150,
    category: 'mastery',
    maxProgress: 14,
  },
  family_planner: {
    name: 'Family Planner',
    description: 'Create meal plans for 5+ person household',
    icon: '🏠',
    points: 100,
    category: 'mastery',
  },
  eco_warrior: {
    name: 'Eco Warrior',
    description: 'Reduce food waste by 50% for a month',
    icon: '🌍',
    points: 300,
    category: 'mastery',
  },
};

export class ProfileCompletionService {
  /**
   * Calculate profile completion metrics
   */
  static calculateCompletion(
    profile: UserProfile | null,
    preferences: UserPreferences | null,
    householdMembers: HouseholdMember[]
  ): CompletionMetrics {
    const sections = {
      basicInfo: this.calculateBasicInfoCompletion(profile),
      preferences: this.calculatePreferencesCompletion(preferences),
      household: this.calculateHouseholdCompletion(householdMembers),
      financial: this.calculateFinancialCompletion(profile, preferences),
      dietary: this.calculateDietaryCompletion(profile, preferences),
      cooking: this.calculateCookingCompletion(preferences),
      planning: this.calculatePlanningCompletion(preferences),
      social: this.calculateSocialCompletion(profile),
    };

    // Calculate weighted overall completion
    const overall = Object.entries(sections).reduce((sum, [key, value]) => {
      return sum + value * SECTION_WEIGHTS[key as keyof typeof SECTION_WEIGHTS];
    }, 0);

    // Get achievements
    const achievements = this.calculateAchievements(profile, preferences, householdMembers);
    const totalPoints = achievements.reduce((sum, achievement) => {
      return achievement.unlockedAt ? sum + achievement.points : sum;
    }, 0);

    // Calculate level
    const { level, nextLevelPoints } = this.calculateLevel(totalPoints);

    // Get streak info
    const { currentStreak, longestStreak } = this.calculateStreaks(profile);

    return {
      overall: Math.round(overall),
      sections,
      achievements,
      totalPoints,
      level,
      nextLevelPoints,
      currentStreak,
      longestStreak,
      lastActiveDate: profile?.stats?.lastActive || new Date(),
    };
  }

  /**
   * Calculate basic info section completion
   */
  private static calculateBasicInfoCompletion(profile: UserProfile | null): number {
    if (!profile) return 0;

    const fields = [
      profile.username,
      profile.fullName,
      profile.avatarUrl,
      profile.bio,
      profile.dateOfBirth,
      profile.gender,
      profile.location,
    ];

    const completed = fields.filter(field => field !== null && field !== undefined && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate preferences section completion
   */
  private static calculatePreferencesCompletion(preferences: UserPreferences | null): number {
    if (!preferences) return 0;

    const hasNotifications = preferences.notificationSettings && 
      Object.values(preferences.notificationSettings).some(v => v === true);
    
    const hasMealSchedule = preferences.mealSchedule && 
      Object.values(preferences.mealSchedule).some(meal => 
        typeof meal === 'object' && meal.enabled
      );

    const fields = [
      preferences.cuisinePreferences?.length > 0,
      preferences.cookingSkillLevel,
      hasNotifications,
      hasMealSchedule,
    ];

    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate household section completion
   */
  private static calculateHouseholdCompletion(householdMembers: HouseholdMember[]): number {
    if (householdMembers.length === 0) return 0;
    
    // Consider it complete if at least one household member is added
    return 100;
  }

  /**
   * Calculate financial section completion
   */
  private static calculateFinancialCompletion(
    profile: UserProfile | null,
    preferences: UserPreferences | null
  ): number {
    if (!profile && !preferences) return 0;

    const hasBudget = profile?.budget?.monthly > 0 || preferences?.budget?.monthly > 0;
    const hasCurrency = profile?.budget?.currency || preferences?.budget?.currency;

    const fields = [hasBudget, hasCurrency];
    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate dietary section completion
   */
  private static calculateDietaryCompletion(
    profile: UserProfile | null,
    preferences: UserPreferences | null
  ): number {
    if (!profile && !preferences) return 0;

    const fields = [
      (profile?.dietaryRestrictions?.length || 0) > 0 || (preferences?.dietaryRestrictions?.length || 0) > 0,
      (profile?.allergies?.length || 0) > 0 || (preferences?.allergies?.length || 0) > 0,
      profile?.tasteProfile,
      profile?.nutritionalGoals,
    ];

    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate cooking section completion
   */
  private static calculateCookingCompletion(preferences: UserPreferences | null): number {
    if (!preferences) return 0;

    const fields = [
      preferences.cookingSkillLevel,
      preferences.cookingPreferences?.timeAvailable,
      (preferences.cookingPreferences?.cookingMethods?.length || 0) > 0,
      (preferences.cookingPreferences?.kitchenTools?.length || 0) > 0,
    ];

    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate planning section completion
   */
  private static calculatePlanningCompletion(preferences: UserPreferences | null): number {
    if (!preferences) return 0;

    const fields = [
      preferences.planningPreferences?.planningHorizon,
      (preferences.planningPreferences?.mealTypes?.length || 0) > 0,
      preferences.shoppingPreferences?.shoppingDay !== undefined,
    ];

    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate social section completion
   */
  private static calculateSocialCompletion(profile: UserProfile | null): number {
    if (!profile) return 0;

    const hasFollowers = (profile.followers?.length || 0) > 0;
    const isFollowing = (profile.following?.length || 0) > 0;
    const hasPrivacySettings = profile.privacy !== undefined;

    const fields = [hasFollowers, isFollowing, hasPrivacySettings];
    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate achievements based on profile data
   */
  private static calculateAchievements(
    profile: UserProfile | null,
    preferences: UserPreferences | null,
    householdMembers: HouseholdMember[]
  ): Achievement[] {
    const achievements: Achievement[] = [];

    // Check each achievement
    for (const [id, definition] of Object.entries(ACHIEVEMENTS)) {
      const achievement: Achievement = {
        id: id as AchievementType,
        ...definition,
      };

      // Check if achievement is unlocked
      const unlockStatus = this.checkAchievementUnlocked(
        id as AchievementType,
        profile,
        preferences,
        householdMembers
      );

      if (unlockStatus.unlocked) {
        achievement.unlockedAt = unlockStatus.unlockedAt;
      }
      
      achievement.progress = unlockStatus.progress;

      achievements.push(achievement);
    }

    return achievements;
  }

  /**
   * Check if a specific achievement is unlocked
   */
  private static checkAchievementUnlocked(
    achievementId: AchievementType,
    profile: UserProfile | null,
    preferences: UserPreferences | null,
    householdMembers: HouseholdMember[]
  ): { unlocked: boolean; progress: number; unlockedAt?: Date } {
    switch (achievementId) {
      case 'profile_photo':
        return {
          unlocked: !!profile?.avatarUrl,
          progress: profile?.avatarUrl ? 1 : 0,
          unlockedAt: profile?.avatarUrl ? profile.updatedAt : undefined,
        };

      case 'basic_info':
        const basicFields = [
          profile?.username,
          profile?.fullName,
          profile?.bio,
          profile?.dateOfBirth,
          profile?.gender,
        ].filter(Boolean).length;
        return {
          unlocked: basicFields >= 5,
          progress: basicFields,
          unlockedAt: basicFields >= 5 ? profile?.updatedAt : undefined,
        };

      case 'dietary_preferences':
        const dietaryComplete = (profile?.dietaryRestrictions?.length || 0) > 0 ||
          (preferences?.dietaryRestrictions?.length || 0) > 0 ||
          (profile?.allergies?.length || 0) > 0;
        return {
          unlocked: dietaryComplete,
          progress: dietaryComplete ? 3 : 0,
          unlockedAt: dietaryComplete ? profile?.updatedAt : undefined,
        };

      case 'household_setup':
        return {
          unlocked: householdMembers.length > 0,
          progress: householdMembers.length > 0 ? 1 : 0,
          unlockedAt: householdMembers.length > 0 ? householdMembers[0].createdAt : undefined,
        };

      case 'taste_profile':
        const tasteFields = profile?.tasteProfile ? 
          Object.values(profile.tasteProfile).filter(v => v !== undefined).length : 0;
        return {
          unlocked: tasteFields >= 6,
          progress: tasteFields,
          unlockedAt: tasteFields >= 6 ? profile?.updatedAt : undefined,
        };

      case 'cooking_skills':
        const cookingComplete = preferences?.cookingSkillLevel &&
          preferences?.cookingPreferences?.timeAvailable &&
          (preferences?.cookingPreferences?.cookingMethods?.length || 0) > 0;
        return {
          unlocked: !!cookingComplete,
          progress: cookingComplete ? 3 : 0,
          unlockedAt: cookingComplete ? preferences?.updatedAt : undefined,
        };

      case 'budget_planning':
        const hasBudget = (profile?.budget?.monthly || 0) > 0 || 
          (preferences?.budget?.monthly || 0) > 0;
        return {
          unlocked: hasBudget,
          progress: hasBudget ? 1 : 0,
          unlockedAt: hasBudget ? profile?.updatedAt : undefined,
        };

      case 'meal_schedule':
        const scheduledMeals = preferences?.mealSchedule ? 
          Object.values(preferences.mealSchedule).filter(meal => 
            typeof meal === 'object' && meal.enabled
          ).length : 0;
        return {
          unlocked: scheduledMeals >= 3,
          progress: scheduledMeals,
          unlockedAt: scheduledMeals >= 3 ? preferences?.updatedAt : undefined,
        };

      case 'shopping_preferences':
        const shoppingComplete = preferences?.shoppingPreferences?.shoppingDay !== undefined &&
          (preferences?.shoppingPreferences?.preferredStores?.length || 0) > 0;
        return {
          unlocked: !!shoppingComplete,
          progress: shoppingComplete ? 2 : 0,
          unlockedAt: shoppingComplete ? preferences?.updatedAt : undefined,
        };

      case 'nutrition_goals':
        const nutritionFields = profile?.nutritionalGoals ? 
          Object.values(profile.nutritionalGoals).filter(v => v !== undefined).length : 0;
        return {
          unlocked: nutritionFields >= 3,
          progress: nutritionFields,
          unlockedAt: nutritionFields >= 3 ? profile?.updatedAt : undefined,
        };

      case 'first_recipe':
        const hasRecipes = (profile?.stats?.recipesCreated || 0) > 0;
        return {
          unlocked: hasRecipes,
          progress: hasRecipes ? 1 : 0,
          unlockedAt: hasRecipes ? profile?.updatedAt : undefined,
        };

      case 'first_meal_plan':
        const hasMealPlans = (profile?.stats?.mealsPlanned || 0) > 0;
        return {
          unlocked: hasMealPlans,
          progress: hasMealPlans ? 1 : 0,
          unlockedAt: hasMealPlans ? profile?.updatedAt : undefined,
        };

      case 'week_streak':
        const weekStreak = (profile?.stats?.streakDays || 0) >= 7;
        return {
          unlocked: weekStreak,
          progress: Math.min(profile?.stats?.streakDays || 0, 7),
          unlockedAt: weekStreak ? profile?.stats?.lastActive : undefined,
        };

      case 'month_streak':
        const monthStreak = (profile?.stats?.streakDays || 0) >= 30;
        return {
          unlocked: monthStreak,
          progress: Math.min(profile?.stats?.streakDays || 0, 30),
          unlockedAt: monthStreak ? profile?.stats?.lastActive : undefined,
        };

      case 'social_butterfly':
        const followingCount = profile?.following?.length || 0;
        return {
          unlocked: followingCount >= 10,
          progress: Math.min(followingCount, 10),
          unlockedAt: followingCount >= 10 ? profile?.updatedAt : undefined,
        };

      case 'master_chef':
        const recipeCount = profile?.stats?.recipesCreated || 0;
        return {
          unlocked: recipeCount >= 50,
          progress: Math.min(recipeCount, 50),
          unlockedAt: recipeCount >= 50 ? profile?.updatedAt : undefined,
        };

      case 'family_planner':
        const largeHousehold = (profile?.householdSize || 1) >= 5;
        const hasPlanForLarge = largeHousehold && (profile?.stats?.mealsPlanned || 0) > 0;
        return {
          unlocked: hasPlanForLarge,
          progress: hasPlanForLarge ? 1 : 0,
          unlockedAt: hasPlanForLarge ? profile?.updatedAt : undefined,
        };

      // These require additional tracking not in the current model
      case 'budget_guru':
      case 'health_conscious':
      case 'eco_warrior':
        return {
          unlocked: false,
          progress: 0,
        };

      default:
        return {
          unlocked: false,
          progress: 0,
        };
    }
  }

  /**
   * Calculate user level based on total points
   */
  private static calculateLevel(totalPoints: number): { level: number; nextLevelPoints: number } {
    let level = 1;
    let nextLevelPoints = LEVEL_THRESHOLDS[1];

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (totalPoints >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        nextLevelPoints = LEVEL_THRESHOLDS[i + 1] || Infinity;
      } else {
        break;
      }
    }

    return { level: Math.min(level, 10), nextLevelPoints };
  }

  /**
   * Calculate streaks
   */
  private static calculateStreaks(profile: UserProfile | null): { currentStreak: number; longestStreak: number } {
    const currentStreak = profile?.stats?.streakDays || 0;
    // In a real implementation, we'd track the longest streak in the database
    const longestStreak = Math.max(currentStreak, 0);

    return { currentStreak, longestStreak };
  }

  /**
   * Get suggestions for profile improvement
   */
  static getSuggestions(metrics: CompletionMetrics): string[] {
    const suggestions: string[] = [];

    // Find sections with low completion
    const incompleteSections = Object.entries(metrics.sections)
      .filter(([_, completion]) => completion < 100)
      .sort(([_, a], [__, b]) => a - b);

    // Add suggestions based on incomplete sections
    for (const [section, completion] of incompleteSections.slice(0, 3)) {
      suggestions.push(this.getSuggestionForSection(section, completion));
    }

    // Add achievement-based suggestions
    const nextAchievements = metrics.achievements
      .filter(a => !a.unlockedAt && a.category === 'profile')
      .sort((a, b) => {
        const aProgress = (a.progress || 0) / (a.maxProgress || 1);
        const bProgress = (b.progress || 0) / (b.maxProgress || 1);
        return bProgress - aProgress;
      })
      .slice(0, 2);

    for (const achievement of nextAchievements) {
      suggestions.push(`Complete "${achievement.name}" to earn ${achievement.points} points!`);
    }

    return suggestions;
  }

  /**
   * Get suggestion for a specific section
   */
  private static getSuggestionForSection(section: string, completion: number): string {
    const suggestions: Record<string, string> = {
      basicInfo: 'Complete your basic profile information to help us personalize your experience',
      preferences: 'Set up your preferences to get better recipe recommendations',
      household: 'Add household members to plan meals for your whole family',
      financial: 'Set up your budget to help manage food expenses',
      dietary: 'Configure dietary preferences for personalized meal suggestions',
      cooking: 'Tell us about your cooking skills and available time',
      planning: 'Set up meal planning preferences for better organization',
      social: 'Connect with other users to share recipes and ideas',
    };

    return suggestions[section] || `Complete the ${section} section (${completion}% done)`;
  }

  /**
   * Track achievement progress
   */
  static async trackProgress(
    userId: string,
    achievementId: AchievementType,
    progress: number
  ): Promise<void> {
    try {
      // In a real implementation, this would update a database table
      // tracking user achievement progress
      logger.info('Tracking achievement progress', { userId, achievementId, progress });
    } catch (error) {
      logger.error('Error tracking achievement progress', 'ProfileCompletionService', error);
    }
  }

  /**
   * Award achievement
   */
  static async awardAchievement(
    userId: string,
    achievementId: AchievementType
  ): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Update user_achievements table
      // 2. Send notification
      // 3. Update user points/level
      logger.info('Awarding achievement', { userId, achievementId });
    } catch (error) {
      logger.error('Error awarding achievement', 'ProfileCompletionService', error);
    }
  }
}