import { 
  Achievement, 
  UserAchievement, 
  XPEventType, 
  AchievementCategory,
  AchievementDifficulty,
  RequirementType,
  GamificationAPIResponse,
  AchievementCheckResponse,
  XPAwardResponse
} from '../types';

class AchievementService {
  private static instance: AchievementService;
  private achievements: Achievement[] = [];
  private userAchievements: UserAchievement[] = [];

  private constructor() {
    this.initializeAchievements();
  }

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  private initializeAchievements() {
    // Initialize predefined achievements
    this.achievements = [
      // Cooking Achievements
      {
        id: 'cooking_first_recipe',
        name: 'First Recipe',
        description: 'Cook your first recipe',
        icon: '👨‍🍳',
        category: AchievementCategory.COOKING,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 50,
        points_reward: 10,
        requirements: [
          { type: RequirementType.RECIPES_COOKED, target: 1 }
        ],
        unlock_condition: 'Cook 1 recipe',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'cooking_chef_apprentice',
        name: 'Chef Apprentice',
        description: 'Cook 10 different recipes',
        icon: '🍳',
        category: AchievementCategory.COOKING,
        difficulty: AchievementDifficulty.MEDIUM,
        xp_reward: 200,
        points_reward: 50,
        requirements: [
          { type: RequirementType.RECIPES_COOKED, target: 10 }
        ],
        unlock_condition: 'Cook 10 recipes',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'cooking_master_chef',
        name: 'Master Chef',
        description: 'Cook 100 recipes',
        icon: '👨‍🍳',
        category: AchievementCategory.COOKING,
        difficulty: AchievementDifficulty.HARD,
        xp_reward: 1000,
        points_reward: 250,
        requirements: [
          { type: RequirementType.RECIPES_COOKED, target: 100 }
        ],
        unlock_condition: 'Cook 100 recipes',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Meal Planning Achievements
      {
        id: 'planning_first_week',
        name: 'Week Planner',
        description: 'Plan your first week of meals',
        icon: '📅',
        category: AchievementCategory.MEAL_PLANNING,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 100,
        points_reward: 25,
        requirements: [
          { type: RequirementType.MEALS_PLANNED, target: 7 }
        ],
        unlock_condition: 'Plan 7 meals',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'planning_month_master',
        name: 'Monthly Planner',
        description: 'Plan meals for an entire month',
        icon: '🗓️',
        category: AchievementCategory.MEAL_PLANNING,
        difficulty: AchievementDifficulty.MEDIUM,
        xp_reward: 500,
        points_reward: 100,
        requirements: [
          { type: RequirementType.MEALS_PLANNED, target: 30 }
        ],
        unlock_condition: 'Plan 30 meals',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Nutrition Achievements
      {
        id: 'nutrition_first_goal',
        name: 'Health Conscious',
        description: 'Meet your nutrition goals for the first time',
        icon: '🥗',
        category: AchievementCategory.NUTRITION,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 75,
        points_reward: 15,
        requirements: [
          { type: RequirementType.NUTRITION_GOALS_MET, target: 1 }
        ],
        unlock_condition: 'Meet nutrition goals once',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'nutrition_week_streak',
        name: 'Healthy Week',
        description: 'Meet your nutrition goals for 7 days in a row',
        icon: '🌟',
        category: AchievementCategory.NUTRITION,
        difficulty: AchievementDifficulty.MEDIUM,
        xp_reward: 300,
        points_reward: 75,
        requirements: [
          { type: RequirementType.STREAK_DAYS, target: 7, metadata: { streak_type: 'nutrition_goals' } }
        ],
        unlock_condition: 'Meet nutrition goals for 7 consecutive days',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Pantry Achievements
      {
        id: 'pantry_organized',
        name: 'Organized Pantry',
        description: 'Add 20 items to your pantry',
        icon: '🏠',
        category: AchievementCategory.PANTRY,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 100,
        points_reward: 20,
        requirements: [
          { type: RequirementType.PANTRY_ITEMS_MANAGED, target: 20 }
        ],
        unlock_condition: 'Manage 20 pantry items',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Recipe Creation Achievements
      {
        id: 'recipe_creator',
        name: 'Recipe Creator',
        description: 'Create your first custom recipe',
        icon: '📝',
        category: AchievementCategory.RECIPES,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 100,
        points_reward: 25,
        requirements: [
          { type: RequirementType.RECIPES_CREATED, target: 1 }
        ],
        unlock_condition: 'Create 1 recipe',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'recipe_author',
        name: 'Recipe Author',
        description: 'Create 10 custom recipes',
        icon: '✍️',
        category: AchievementCategory.RECIPES,
        difficulty: AchievementDifficulty.MEDIUM,
        xp_reward: 500,
        points_reward: 125,
        requirements: [
          { type: RequirementType.RECIPES_CREATED, target: 10 }
        ],
        unlock_condition: 'Create 10 recipes',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Streak Achievements
      {
        id: 'streak_first_week',
        name: 'Committed',
        description: 'Login for 7 days in a row',
        icon: '🔥',
        category: AchievementCategory.STREAKS,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 150,
        points_reward: 30,
        requirements: [
          { type: RequirementType.STREAK_DAYS, target: 7, metadata: { streak_type: 'daily_login' } }
        ],
        unlock_condition: 'Login for 7 consecutive days',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'streak_month',
        name: 'Dedicated',
        description: 'Login for 30 days in a row',
        icon: '🔥',
        category: AchievementCategory.STREAKS,
        difficulty: AchievementDifficulty.HARD,
        xp_reward: 750,
        points_reward: 150,
        requirements: [
          { type: RequirementType.STREAK_DAYS, target: 30, metadata: { streak_type: 'daily_login' } }
        ],
        unlock_condition: 'Login for 30 consecutive days',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Social Achievements
      {
        id: 'social_first_share',
        name: 'Recipe Sharer',
        description: 'Share your first recipe',
        icon: '📤',
        category: AchievementCategory.SOCIAL,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 50,
        points_reward: 10,
        requirements: [
          { type: RequirementType.RECIPES_SHARED, target: 1 }
        ],
        unlock_condition: 'Share 1 recipe',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Cuisine Diversity Achievements
      {
        id: 'cuisine_explorer',
        name: 'Cuisine Explorer',
        description: 'Try recipes from 5 different cuisines',
        icon: '🌍',
        category: AchievementCategory.COOKING,
        difficulty: AchievementDifficulty.MEDIUM,
        xp_reward: 300,
        points_reward: 75,
        requirements: [
          { type: RequirementType.CUISINE_TYPES_TRIED, target: 5 }
        ],
        unlock_condition: 'Try 5 different cuisines',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },

      // Level-based Achievements
      {
        id: 'level_rookie',
        name: 'Rookie',
        description: 'Reach level 5',
        icon: '🌟',
        category: AchievementCategory.CHALLENGES,
        difficulty: AchievementDifficulty.EASY,
        xp_reward: 200,
        points_reward: 50,
        requirements: [
          { type: RequirementType.LEVEL_REACHED, target: 5 }
        ],
        unlock_condition: 'Reach level 5',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'level_veteran',
        name: 'Veteran',
        description: 'Reach level 25',
        icon: '🏆',
        category: AchievementCategory.CHALLENGES,
        difficulty: AchievementDifficulty.HARD,
        xp_reward: 1000,
        points_reward: 250,
        requirements: [
          { type: RequirementType.LEVEL_REACHED, target: 25 }
        ],
        unlock_condition: 'Reach level 25',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      },
      {
        id: 'level_legend',
        name: 'Legend',
        description: 'Reach level 50',
        icon: '👑',
        category: AchievementCategory.CHALLENGES,
        difficulty: AchievementDifficulty.LEGENDARY,
        xp_reward: 2500,
        points_reward: 500,
        requirements: [
          { type: RequirementType.LEVEL_REACHED, target: 50 }
        ],
        unlock_condition: 'Reach level 50',
        is_hidden: false,
        is_repeatable: false,
        created_at: new Date()
      }
    ];
  }

  // Get all achievements
  async getAchievements(): Promise<GamificationAPIResponse<Achievement[]>> {
    return {
      data: this.achievements,
      success: true
    };
  }

  // Get user achievements
  async getUserAchievements(userId: string): Promise<GamificationAPIResponse<UserAchievement[]>> {
    const userAchievements = this.userAchievements.filter(ua => ua.user_id === userId);
    return {
      data: userAchievements,
      success: true
    };
  }

  // Check achievement progress for a specific event
  async checkAchievementProgress(
    userId: string, 
    eventType: XPEventType, 
    metadata: Record<string, any> = {}
  ): Promise<AchievementCheckResponse> {
    const achievementsUnlocked: Achievement[] = [];
    const userAchievements = this.userAchievements.filter(ua => ua.user_id === userId);

    // Get user stats from metadata or calculate from events
    const userStats = await this.getUserStats(userId);

    for (const achievement of this.achievements) {
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
      
      // Skip if already completed
      if (userAchievement?.is_completed) continue;

      // Check if achievement requirements are met
      let requirementsMet = true;
      let totalProgress = 0;
      let maxProgress = 0;

      for (const requirement of achievement.requirements) {
        const progress = this.calculateRequirementProgress(requirement, userStats, metadata);
        totalProgress += progress;
        maxProgress += requirement.target;
        
        if (progress < requirement.target) {
          requirementsMet = false;
        }
      }

      // Update or create user achievement
      if (userAchievement) {
        // Update existing achievement progress
        userAchievement.progress = totalProgress;
        userAchievement.max_progress = maxProgress;
        userAchievement.updated_at = new Date();

        if (requirementsMet && !userAchievement.is_completed) {
          userAchievement.is_completed = true;
          userAchievement.completed_at = new Date();
          achievementsUnlocked.push(achievement);
        }
      } else {
        // Create new user achievement
        const newUserAchievement: UserAchievement = {
          id: `ua_${userId}_${achievement.id}`,
          user_id: userId,
          achievement_id: achievement.id,
          progress: totalProgress,
          max_progress: maxProgress,
          is_completed: requirementsMet,
          completed_at: requirementsMet ? new Date() : undefined,
          notified: false,
          created_at: new Date(),
          updated_at: new Date(),
          achievement
        };

        this.userAchievements.push(newUserAchievement);
        
        if (requirementsMet) {
          achievementsUnlocked.push(achievement);
        }
      }
    }

    // Calculate total XP and points awarded
    const xpAwarded = achievementsUnlocked.reduce((sum, achievement) => sum + achievement.xp_reward, 0);
    const pointsAwarded = achievementsUnlocked.reduce((sum, achievement) => sum + achievement.points_reward, 0);

    return {
      achievements_unlocked: achievementsUnlocked,
      badges_earned: [], // TODO: Implement badges
      xp_awarded: xpAwarded,
      points_awarded: pointsAwarded
    };
  }

  private calculateRequirementProgress(
    requirement: any, 
    userStats: Record<string, any>, 
    metadata: Record<string, any>
  ): number {
    switch (requirement.type) {
      case RequirementType.RECIPES_COOKED:
        return userStats.recipesCooked || 0;
      
      case RequirementType.RECIPES_CREATED:
        return userStats.recipesCreated || 0;
      
      case RequirementType.MEALS_PLANNED:
        return userStats.mealsPlanned || 0;
      
      case RequirementType.MEALS_COMPLETED:
        return userStats.mealsCompleted || 0;
      
      case RequirementType.PANTRY_ITEMS_MANAGED:
        return userStats.pantryItemsManaged || 0;
      
      case RequirementType.SHOPPING_LISTS_COMPLETED:
        return userStats.shoppingListsCompleted || 0;
      
      case RequirementType.NUTRITION_GOALS_MET:
        return userStats.nutritionGoalsMet || 0;
      
      case RequirementType.STREAK_DAYS:
        if (requirement.metadata?.streak_type) {
          return userStats.streaks?.[requirement.metadata.streak_type] || 0;
        }
        return 0;
      
      case RequirementType.TOTAL_XP:
        return userStats.totalXp || 0;
      
      case RequirementType.LEVEL_REACHED:
        return userStats.level || 0;
      
      case RequirementType.CUISINE_TYPES_TRIED:
        return userStats.cuisineTypesTried || 0;
      
      case RequirementType.RECIPES_SHARED:
        return userStats.recipesShared || 0;
      
      case RequirementType.SOCIAL_INTERACTIONS:
        return userStats.socialInteractions || 0;
      
      default:
        return 0;
    }
  }

  private async getUserStats(userId: string): Promise<Record<string, any>> {
    // In a real implementation, this would fetch from the database
    // For now, return mock data
    return {
      recipesCooked: 5,
      recipesCreated: 2,
      mealsPlanned: 15,
      mealsCompleted: 10,
      pantryItemsManaged: 25,
      shoppingListsCompleted: 3,
      nutritionGoalsMet: 8,
      totalXp: 1250,
      level: 3,
      cuisineTypesTried: 3,
      recipesShared: 1,
      socialInteractions: 5,
      streaks: {
        daily_login: 5,
        meal_planning: 3,
        cooking: 2,
        nutrition_goals: 7,
        pantry_management: 1
      }
    };
  }

  // Award XP and check for achievements
  async awardXP(
    userId: string, 
    eventType: XPEventType, 
    amount: number, 
    metadata: Record<string, any> = {}
  ): Promise<XPAwardResponse> {
    // Check achievements that might be unlocked by this event
    const achievementCheck = await this.checkAchievementProgress(userId, eventType, metadata);

    // Calculate level-based rewards
    const levelUpData = await this.checkLevelUp(userId, amount);

    return {
      xp_awarded: amount,
      points_awarded: Math.floor(amount / 10), // 10 XP = 1 point
      new_level: levelUpData.newLevel,
      level_up: levelUpData.levelUp,
      achievements_unlocked: achievementCheck.achievements_unlocked,
      badges_earned: achievementCheck.badges_earned
    };
  }

  private async checkLevelUp(userId: string, xpAwarded: number): Promise<{ newLevel?: number; levelUp: boolean }> {
    // Simple level calculation - in real implementation, fetch from user profile
    const currentXP = 1250; // Mock current XP
    const newXP = currentXP + xpAwarded;
    
    const currentLevel = Math.floor(currentXP / 1000) + 1;
    const newLevel = Math.floor(newXP / 1000) + 1;
    
    return {
      newLevel: newLevel !== currentLevel ? newLevel : undefined,
      levelUp: newLevel > currentLevel
    };
  }

  // Get achievement by ID
  async getAchievementById(id: string): Promise<Achievement | null> {
    return this.achievements.find(a => a.id === id) || null;
  }

  // Mark achievement as notified
  async markAchievementNotified(userId: string, achievementId: string): Promise<void> {
    const userAchievement = this.userAchievements.find(
      ua => ua.user_id === userId && ua.achievement_id === achievementId
    );
    
    if (userAchievement) {
      userAchievement.notified = true;
      userAchievement.updated_at = new Date();
    }
  }

  // Get achievements by category
  async getAchievementsByCategory(category: AchievementCategory): Promise<Achievement[]> {
    return this.achievements.filter(a => a.category === category);
  }

  // Get achievements by difficulty
  async getAchievementsByDifficulty(difficulty: AchievementDifficulty): Promise<Achievement[]> {
    return this.achievements.filter(a => a.difficulty === difficulty);
  }

  // Get user's completion percentage
  async getUserCompletionPercentage(userId: string): Promise<number> {
    const userAchievements = this.userAchievements.filter(ua => ua.user_id === userId);
    const completedCount = userAchievements.filter(ua => ua.is_completed).length;
    return Math.round((completedCount / this.achievements.length) * 100);
  }
}

export const achievementService = AchievementService.getInstance();