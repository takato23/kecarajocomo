// Gamification Types for kecarajocomer

export interface UserGamificationProfile {
  id: string;
  user_id: string;
  level: number;
  total_xp: number;
  xp_to_next_level: number;
  streak_days: number;
  longest_streak: number;
  last_activity_date: Date;
  achievements_unlocked: string[];
  badges_earned: string[];
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  created_at: Date;
  updated_at: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  xp_reward: number;
  points_reward: number;
  requirements: AchievementRequirement[];
  unlock_condition: string;
  is_hidden: boolean;
  is_repeatable: boolean;
  created_at: Date;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  max_progress: number;
  is_completed: boolean;
  completed_at?: Date;
  notified: boolean;
  created_at: Date;
  updated_at: Date;
  achievement?: Achievement;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirements: BadgeRequirement[];
  unlock_condition: string;
  is_hidden: boolean;
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: Date;
  badge?: Badge;
}

export interface XPEvent {
  id: string;
  user_id: string;
  event_type: XPEventType;
  xp_amount: number;
  points_amount: number;
  description: string;
  metadata?: Record<string, any>;
  source_id?: string; // e.g., recipe_id, meal_plan_id
  created_at: Date;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: StreakType;
  current_count: number;
  longest_count: number;
  last_activity_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration_days: number;
  xp_reward: number;
  points_reward: number;
  requirements: ChallengeRequirement[];
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  is_global: boolean;
  created_at: Date;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  max_progress: number;
  is_completed: boolean;
  completed_at?: Date;
  joined_at: Date;
  challenge?: Challenge;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  score: number;
  rank: number;
  period_start: Date;
  period_end: Date;
  user_name?: string;
  user_avatar?: string;
}

export interface GamificationSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  show_achievements: boolean;
  show_leaderboard: boolean;
  show_streaks: boolean;
  show_challenges: boolean;
  privacy_level: PrivacyLevel;
  created_at: Date;
  updated_at: Date;
}

// Enums and Types

export enum AchievementCategory {
  COOKING = 'cooking',
  MEAL_PLANNING = 'meal_planning',
  NUTRITION = 'nutrition',
  PANTRY = 'pantry',
  RECIPES = 'recipes',
  SOCIAL = 'social',
  STREAKS = 'streaks',
  CHALLENGES = 'challenges'
}

export enum AchievementDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  LEGENDARY = 'legendary'
}

export enum BadgeCategory {
  COOKING_SKILLS = 'cooking_skills',
  NUTRITION_EXPERT = 'nutrition_expert',
  MEAL_PLANNER = 'meal_planner',
  PANTRY_MASTER = 'pantry_master',
  RECIPE_CREATOR = 'recipe_creator',
  STREAK_CHAMPION = 'streak_champion',
  SOCIAL_BUTTERFLY = 'social_butterfly',
  SEASONAL = 'seasonal',
  SPECIAL_EVENT = 'special_event'
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum XPEventType {
  RECIPE_CREATED = 'recipe_created',
  RECIPE_COOKED = 'recipe_cooked',
  MEAL_PLANNED = 'meal_planned',
  MEAL_COMPLETED = 'meal_completed',
  PANTRY_UPDATED = 'pantry_updated',
  SHOPPING_COMPLETED = 'shopping_completed',
  NUTRITION_GOAL_MET = 'nutrition_goal_met',
  STREAK_CONTINUED = 'streak_continued',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  CHALLENGE_COMPLETED = 'challenge_completed',
  RECIPE_SHARED = 'recipe_shared',
  RECIPE_RATED = 'recipe_rated',
  DAILY_LOGIN = 'daily_login',
  WEEKLY_GOAL_MET = 'weekly_goal_met',
  MONTHLY_GOAL_MET = 'monthly_goal_met'
}

export enum StreakType {
  DAILY_LOGIN = 'daily_login',
  MEAL_PLANNING = 'meal_planning',
  COOKING = 'cooking',
  NUTRITION_GOALS = 'nutrition_goals',
  PANTRY_MANAGEMENT = 'pantry_management'
}

export enum ChallengeCategory {
  COOKING = 'cooking',
  NUTRITION = 'nutrition',
  MEAL_PLANNING = 'meal_planning',
  PANTRY = 'pantry',
  SOCIAL = 'social',
  SEASONAL = 'seasonal',
  SPECIAL_EVENT = 'special_event'
}

export enum ChallengeDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum LeaderboardType {
  XP = 'xp',
  POINTS = 'points',
  ACHIEVEMENTS = 'achievements',
  STREAKS = 'streaks',
  RECIPES_CREATED = 'recipes_created',
  MEALS_COOKED = 'meals_cooked'
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

// Requirement Types

export interface AchievementRequirement {
  type: RequirementType;
  target: number;
  current?: number;
  metadata?: Record<string, any>;
}

export interface BadgeRequirement {
  type: RequirementType;
  target: number;
  metadata?: Record<string, any>;
}

export interface ChallengeRequirement {
  type: RequirementType;
  target: number;
  metadata?: Record<string, any>;
}

export enum RequirementType {
  RECIPES_CREATED = 'recipes_created',
  RECIPES_COOKED = 'recipes_cooked',
  MEALS_PLANNED = 'meals_planned',
  MEALS_COMPLETED = 'meals_completed',
  PANTRY_ITEMS_MANAGED = 'pantry_items_managed',
  SHOPPING_LISTS_COMPLETED = 'shopping_lists_completed',
  NUTRITION_GOALS_MET = 'nutrition_goals_met',
  STREAK_DAYS = 'streak_days',
  TOTAL_XP = 'total_xp',
  LEVEL_REACHED = 'level_reached',
  CUISINE_TYPES_TRIED = 'cuisine_types_tried',
  DIETARY_RESTRICTIONS_FOLLOWED = 'dietary_restrictions_followed',
  COOKING_TIME_SAVED = 'cooking_time_saved',
  FOOD_WASTE_REDUCED = 'food_waste_reduced',
  RECIPES_SHARED = 'recipes_shared',
  SOCIAL_INTERACTIONS = 'social_interactions',
  SEASONAL_RECIPES = 'seasonal_recipes',
  HEALTHY_CHOICES = 'healthy_choices'
}

// UI Display Types

export interface AchievementNotification {
  id: string;
  type: 'achievement' | 'badge' | 'level_up' | 'streak' | 'challenge';
  title: string;
  description: string;
  icon: string;
  xp_reward?: number;
  points_reward?: number;
  timestamp: Date;
  isRead: boolean;
}

export interface LevelProgress {
  current_level: number;
  current_xp: number;
  xp_to_next_level: number;
  total_xp_for_next_level: number;
  progress_percentage: number;
}

export interface StreakDisplay {
  type: StreakType;
  current_count: number;
  longest_count: number;
  is_active: boolean;
  next_milestone: number;
  days_until_milestone: number;
}

export interface ChallengeProgress {
  challenge: Challenge;
  progress: number;
  max_progress: number;
  progress_percentage: number;
  days_remaining: number;
  is_completed: boolean;
}

export interface GamificationSummary {
  level: number;
  total_xp: number;
  xp_to_next_level: number;
  streak_days: number;
  total_achievements: number;
  total_badges: number;
  weekly_points: number;
  monthly_points: number;
  rank?: number;
  recent_achievements: Achievement[];
  active_challenges: Challenge[];
  current_streaks: Streak[];
}

// Store Types

export interface GamificationState {
  profile: UserGamificationProfile | null;
  achievements: UserAchievement[];
  badges: UserBadge[];
  xp_events: XPEvent[];
  streaks: Streak[];
  challenges: UserChallenge[];
  leaderboard: LeaderboardEntry[];
  notifications: AchievementNotification[];
  settings: GamificationSettings | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface GamificationActions {
  // Profile
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserGamificationProfile>) => Promise<void>;
  
  // XP and Leveling
  awardXP: (eventType: XPEventType, amount: number, metadata?: Record<string, any>) => Promise<void>;
  checkLevelUp: () => Promise<boolean>;
  
  // Achievements
  loadAchievements: () => Promise<void>;
  checkAchievementProgress: (eventType: XPEventType, metadata?: Record<string, any>) => Promise<void>;
  markAchievementNotified: (achievementId: string) => Promise<void>;
  
  // Badges
  loadBadges: () => Promise<void>;
  checkBadgeRequirements: () => Promise<void>;
  
  // Streaks
  loadStreaks: () => Promise<void>;
  updateStreak: (streakType: StreakType) => Promise<void>;
  
  // Challenges
  loadChallenges: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  updateChallengeProgress: (challengeId: string, progress: number) => Promise<void>;
  
  // Leaderboard
  loadLeaderboard: (type: LeaderboardType, period: LeaderboardPeriod) => Promise<void>;
  
  // Notifications
  loadNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Settings
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<GamificationSettings>) => Promise<void>;
  
  // Utility
  setError: (error: string | null) => void;
  clearError: () => void;
}

// API Response Types

export interface GamificationAPIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface XPAwardResponse {
  xp_awarded: number;
  points_awarded: number;
  new_level?: number;
  level_up?: boolean;
  achievements_unlocked?: Achievement[];
  badges_earned?: Badge[];
}

export interface AchievementCheckResponse {
  achievements_unlocked: Achievement[];
  badges_earned: Badge[];
  xp_awarded: number;
  points_awarded: number;
}

// Helper Types

export interface GamificationConfig {
  xp_rates: Record<XPEventType, number>;
  level_requirements: number[];
  achievement_definitions: Achievement[];
  badge_definitions: Badge[];
  streak_multipliers: Record<StreakType, number>;
  challenge_templates: Challenge[];
}

export interface GamificationStats {
  total_users: number;
  total_achievements_unlocked: number;
  total_badges_earned: number;
  total_xp_awarded: number;
  average_level: number;
  top_achievements: Achievement[];
  active_challenges: Challenge[];
  leaderboard_top_10: LeaderboardEntry[];
}