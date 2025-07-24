import { XPEventType, XPEvent, UserGamificationProfile } from '../types';

class XPService {
  private static instance: XPService;
  private xpRates: Record<XPEventType, number> = {
    [XPEventType.RECIPE_CREATED]: 100,
    [XPEventType.RECIPE_COOKED]: 50,
    [XPEventType.MEAL_PLANNED]: 25,
    [XPEventType.MEAL_COMPLETED]: 30,
    [XPEventType.PANTRY_UPDATED]: 10,
    [XPEventType.SHOPPING_COMPLETED]: 40,
    [XPEventType.NUTRITION_GOAL_MET]: 75,
    [XPEventType.STREAK_CONTINUED]: 20,
    [XPEventType.ACHIEVEMENT_UNLOCKED]: 0, // XP already awarded by achievement
    [XPEventType.CHALLENGE_COMPLETED]: 0, // XP already awarded by challenge
    [XPEventType.RECIPE_SHARED]: 25,
    [XPEventType.RECIPE_RATED]: 15,
    [XPEventType.DAILY_LOGIN]: 10,
    [XPEventType.WEEKLY_GOAL_MET]: 200,
    [XPEventType.MONTHLY_GOAL_MET]: 500
  };

  private levelRequirements: number[] = [];

  private constructor() {
    this.initializeLevelRequirements();
  }

  static getInstance(): XPService {
    if (!XPService.instance) {
      XPService.instance = new XPService();
    }
    return XPService.instance;
  }

  private initializeLevelRequirements() {
    // Generate level requirements with exponential curve
    // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
    this.levelRequirements = [0]; // Level 1 starts at 0
    
    for (let level = 2; level <= 100; level++) {
      const baseXP = 100;
      const exponentialMultiplier = Math.pow(1.15, level - 2);
      const xpRequired = Math.floor(baseXP * exponentialMultiplier);
      
      // Add to previous level's requirement
      this.levelRequirements.push(
        this.levelRequirements[level - 2] + xpRequired
      );
    }
  }

  // Calculate XP for a given event type
  calculateXP(eventType: XPEventType, metadata: Record<string, any> = {}): number {
    let baseXP = this.xpRates[eventType] || 0;
    
    // Apply modifiers based on metadata
    if (metadata.difficulty) {
      switch (metadata.difficulty) {
        case 'easy':
          baseXP *= 1.0;
          break;
        case 'medium':
          baseXP *= 1.2;
          break;
        case 'hard':
          baseXP *= 1.5;
          break;
        case 'expert':
          baseXP *= 2.0;
          break;
      }
    }

    // Streak multiplier
    if (metadata.streakDays) {
      const streakMultiplier = Math.min(1 + (metadata.streakDays * 0.05), 3.0); // Max 3x multiplier
      baseXP *= streakMultiplier;
    }

    // First-time bonus
    if (metadata.firstTime) {
      baseXP *= 1.5;
    }

    // Quality bonus for recipes
    if (metadata.rating && eventType === XPEventType.RECIPE_CREATED) {
      baseXP *= (metadata.rating / 5); // 5-star rating system
    }

    // Time-based bonus for cooking
    if (metadata.cookingTime && eventType === XPEventType.RECIPE_COOKED) {
      // Bonus for efficient cooking (under estimated time)
      if (metadata.cookingTime < metadata.estimatedTime) {
        baseXP *= 1.25;
      }
    }

    return Math.floor(baseXP);
  }

  // Calculate level from total XP
  calculateLevel(totalXP: number): number {
    for (let level = this.levelRequirements.length - 1; level >= 0; level--) {
      if (totalXP >= this.levelRequirements[level]) {
        return level + 1;
      }
    }
    return 1;
  }

  // Calculate XP needed for next level
  calculateXPToNextLevel(totalXP: number): number {
    const currentLevel = this.calculateLevel(totalXP);
    
    if (currentLevel >= this.levelRequirements.length) {
      return 0; // Max level reached
    }
    
    const nextLevelXP = this.levelRequirements[currentLevel];
    return nextLevelXP - totalXP;
  }

  // Calculate XP needed for specific level
  getXPRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > this.levelRequirements.length) return this.levelRequirements[this.levelRequirements.length - 1];
    
    return this.levelRequirements[level - 1];
  }

  // Get level progress percentage
  getLevelProgressPercentage(totalXP: number): number {
    const currentLevel = this.calculateLevel(totalXP);
    
    if (currentLevel >= this.levelRequirements.length) {
      return 100; // Max level reached
    }
    
    const currentLevelXP = this.levelRequirements[currentLevel - 1];
    const nextLevelXP = this.levelRequirements[currentLevel];
    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    
    return Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);
  }

  // Award XP to user
  async awardXP(
    userId: string, 
    eventType: XPEventType, 
    metadata: Record<string, any> = {}
  ): Promise<{
    xpAwarded: number;
    pointsAwarded: number;
    newLevel?: number;
    levelUp: boolean;
    profile: UserGamificationProfile;
  }> {
    const xpAwarded = this.calculateXP(eventType, metadata);
    const pointsAwarded = Math.floor(xpAwarded / 10); // 10 XP = 1 point
    
    // Get current profile (in real implementation, fetch from database)
    const currentProfile = await this.getUserProfile(userId);
    
    const newTotalXP = currentProfile.total_xp + xpAwarded;
    const oldLevel = currentProfile.level;
    const newLevel = this.calculateLevel(newTotalXP);
    const levelUp = newLevel > oldLevel;
    
    // Update profile
    const updatedProfile: UserGamificationProfile = {
      ...currentProfile,
      total_xp: newTotalXP,
      level: newLevel,
      xp_to_next_level: this.calculateXPToNextLevel(newTotalXP),
      total_points: currentProfile.total_points + pointsAwarded,
      weekly_points: currentProfile.weekly_points + pointsAwarded,
      monthly_points: currentProfile.monthly_points + pointsAwarded,
      last_activity_date: new Date(),
      updated_at: new Date()
    };

    // Create XP event record
    const xpEvent: XPEvent = {
      id: `xp_${Date.now()}_${userId}`,
      user_id: userId,
      event_type: eventType,
      xp_amount: xpAwarded,
      points_amount: pointsAwarded,
      description: this.getEventDescription(eventType, metadata),
      metadata,
      created_at: new Date()
    };

    // In real implementation, save to database
    await this.saveXPEvent(xpEvent);
    await this.updateUserProfile(updatedProfile);

    return {
      xpAwarded,
      pointsAwarded,
      newLevel: levelUp ? newLevel : undefined,
      levelUp,
      profile: updatedProfile
    };
  }

  // Get XP event description
  private getEventDescription(eventType: XPEventType, metadata: Record<string, any>): string {
    switch (eventType) {
      case XPEventType.RECIPE_CREATED:
        return `Created recipe: ${metadata.recipeName || 'Unknown'}`;
      case XPEventType.RECIPE_COOKED:
        return `Cooked recipe: ${metadata.recipeName || 'Unknown'}`;
      case XPEventType.MEAL_PLANNED:
        return `Planned meal: ${metadata.mealType || 'Unknown'}`;
      case XPEventType.MEAL_COMPLETED:
        return `Completed meal: ${metadata.mealType || 'Unknown'}`;
      case XPEventType.PANTRY_UPDATED:
        return `Updated pantry items`;
      case XPEventType.SHOPPING_COMPLETED:
        return `Completed shopping list`;
      case XPEventType.NUTRITION_GOAL_MET:
        return `Met nutrition goal: ${metadata.goalType || 'Unknown'}`;
      case XPEventType.STREAK_CONTINUED:
        return `Continued ${metadata.streakType || 'Unknown'} streak`;
      case XPEventType.RECIPE_SHARED:
        return `Shared recipe: ${metadata.recipeName || 'Unknown'}`;
      case XPEventType.RECIPE_RATED:
        return `Rated recipe: ${metadata.recipeName || 'Unknown'}`;
      case XPEventType.DAILY_LOGIN:
        return `Daily login bonus`;
      case XPEventType.WEEKLY_GOAL_MET:
        return `Met weekly goal: ${metadata.goalType || 'Unknown'}`;
      case XPEventType.MONTHLY_GOAL_MET:
        return `Met monthly goal: ${metadata.goalType || 'Unknown'}`;
      default:
        return `Earned XP from ${eventType}`;
    }
  }

  // Get user profile (mock implementation)
  private async getUserProfile(userId: string): Promise<UserGamificationProfile> {
    // In real implementation, fetch from database
    return {
      id: `profile_${userId}`,
      user_id: userId,
      level: 3,
      total_xp: 1250,
      xp_to_next_level: 250,
      streak_days: 5,
      longest_streak: 12,
      last_activity_date: new Date(),
      achievements_unlocked: [],
      badges_earned: [],
      total_points: 125,
      weekly_points: 45,
      monthly_points: 125,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  // Save XP event (mock implementation)
  private async saveXPEvent(event: XPEvent): Promise<void> {
    // In real implementation, save to database

  }

  // Update user profile (mock implementation)
  private async updateUserProfile(profile: UserGamificationProfile): Promise<void> {
    // In real implementation, update in database

  }

  // Get XP events for user
  async getUserXPEvents(userId: string, limit: number = 50): Promise<XPEvent[]> {
    // In real implementation, fetch from database
    return [];
  }

  // Get level leaderboard
  async getLevelLeaderboard(limit: number = 100): Promise<{ user_id: string; level: number; total_xp: number }[]> {
    // In real implementation, fetch from database
    return [];
  }

  // Get level requirements for display
  getLevelRequirements(): number[] {
    return [...this.levelRequirements];
  }

  // Get XP rates for display
  getXPRates(): Record<XPEventType, number> {
    return { ...this.xpRates };
  }

  // Calculate time to next level based on average XP gain
  calculateTimeToNextLevel(totalXP: number, averageXPPerDay: number): number {
    const xpToNextLevel = this.calculateXPToNextLevel(totalXP);
    
    if (xpToNextLevel === 0 || averageXPPerDay <= 0) {
      return 0;
    }
    
    return Math.ceil(xpToNextLevel / averageXPPerDay);
  }

  // Get level rewards
  getLevelRewards(level: number): {
    xp_bonus: number;
    points_bonus: number;
    features_unlocked: string[];
  } {
    const rewards = {
      xp_bonus: 0,
      points_bonus: 0,
      features_unlocked: [] as string[]
    };

    // Level-based rewards
    if (level >= 5) {
      rewards.features_unlocked.push('Custom recipe categories');
    }
    if (level >= 10) {
      rewards.features_unlocked.push('Advanced meal planning');
      rewards.xp_bonus = 50;
    }
    if (level >= 15) {
      rewards.features_unlocked.push('Nutrition analytics');
      rewards.points_bonus = 25;
    }
    if (level >= 20) {
      rewards.features_unlocked.push('Recipe sharing');
      rewards.xp_bonus = 100;
    }
    if (level >= 25) {
      rewards.features_unlocked.push('Advanced pantry management');
      rewards.points_bonus = 50;
    }
    if (level >= 30) {
      rewards.features_unlocked.push('AI recipe suggestions');
      rewards.xp_bonus = 150;
    }
    if (level >= 50) {
      rewards.features_unlocked.push('Master chef badge');
      rewards.points_bonus = 100;
      rewards.xp_bonus = 250;
    }

    return rewards;
  }
}

export const xpService = XPService.getInstance();