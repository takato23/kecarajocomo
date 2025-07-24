import { UserProfile, UserPreferences } from '@/types/profile';

/**
 * Transform database snake_case to TypeScript camelCase for user preferences
 */
export function transformPreferencesFromDB(dbPreferences: any): UserPreferences | null {
  if (!dbPreferences) return null;

  return {
    id: dbPreferences.id,
    userId: dbPreferences.user_id,
    
    // Transform snake_case to camelCase
    dietaryRestrictions: dbPreferences.dietary_restrictions || [],
    allergies: dbPreferences.allergies || [],
    cuisinePreferences: dbPreferences.cuisine_preferences || [],
    cookingSkillLevel: dbPreferences.cooking_skill_level || 'intermediate',
    householdSize: dbPreferences.household_size || 1,
    budget: dbPreferences.budget || { weekly: 0, monthly: 0, currency: 'USD' },
    nutritionGoals: dbPreferences.nutrition_goals || [],
    
    // New preferences with proper transformation
    cookingPreferences: dbPreferences.cooking_preferences || {
      timeAvailable: { weekday: 30, weekend: 60 },
      cookingMethods: [],
      kitchenTools: []
    },
    planningPreferences: dbPreferences.planning_preferences || {
      planningHorizon: 'weekly',
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      batchCooking: false,
      leftoverStrategy: 'incorporate',
      varietyPreference: 'medium'
    },
    shoppingPreferences: dbPreferences.shopping_preferences || {
      preferredStores: [],
      shoppingDay: 6,
      deliveryPreferences: []
    },
    notificationSettings: dbPreferences.notification_settings || {
      mealReminders: true,
      shoppingReminders: true,
      expirationAlerts: true,
      recipeSuggestions: true,
      planningPrompts: true,
      notificationTimes: {}
    },
    mealSchedule: dbPreferences.meal_schedule,
    
    createdAt: new Date(dbPreferences.created_at),
    updatedAt: new Date(dbPreferences.updated_at)
  };
}

/**
 * Transform TypeScript camelCase to database snake_case for user preferences
 */
export function transformPreferencesToDB(preferences: Partial<UserPreferences>): any {
  const transformed: any = {};

  // Map camelCase to snake_case
  if (preferences.dietaryRestrictions !== undefined) {
    transformed.dietary_restrictions = preferences.dietaryRestrictions;
  }
  if (preferences.allergies !== undefined) {
    transformed.allergies = preferences.allergies;
  }
  if (preferences.cuisinePreferences !== undefined) {
    transformed.cuisine_preferences = preferences.cuisinePreferences;
  }
  if (preferences.cookingSkillLevel !== undefined) {
    transformed.cooking_skill_level = preferences.cookingSkillLevel;
  }
  if (preferences.householdSize !== undefined) {
    transformed.household_size = preferences.householdSize;
  }
  if (preferences.budget !== undefined) {
    transformed.budget = preferences.budget;
  }
  if (preferences.nutritionGoals !== undefined) {
    transformed.nutrition_goals = preferences.nutritionGoals;
  }
  if (preferences.cookingPreferences !== undefined) {
    transformed.cooking_preferences = preferences.cookingPreferences;
  }
  if (preferences.planningPreferences !== undefined) {
    transformed.planning_preferences = preferences.planningPreferences;
  }
  if (preferences.shoppingPreferences !== undefined) {
    transformed.shopping_preferences = preferences.shoppingPreferences;
  }
  if (preferences.notificationSettings !== undefined) {
    transformed.notification_settings = preferences.notificationSettings;
  }
  if (preferences.mealSchedule !== undefined) {
    transformed.meal_schedule = preferences.mealSchedule;
  }

  return transformed;
}

/**
 * Transform database snake_case to TypeScript camelCase for user profile
 */
export function transformProfileFromDB(dbProfile: any): UserProfile | null {
  if (!dbProfile) return null;

  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    username: dbProfile.username,
    fullName: dbProfile.full_name,
    email: dbProfile.email,
    avatarUrl: dbProfile.avatar_url,
    bio: dbProfile.bio,
    
    // Extended profile
    dateOfBirth: dbProfile.date_of_birth ? new Date(dbProfile.date_of_birth) : undefined,
    gender: dbProfile.gender,
    location: dbProfile.location,
    language: dbProfile.language || 'es',
    theme: dbProfile.theme || 'system',
    
    // Activity & Stats with defaults
    stats: dbProfile.stats || {
      recipesCreated: 0,
      mealsPlanned: 0,
      recipesRated: 0,
      streakDays: 0,
      joinedDate: new Date(),
      lastActive: new Date()
    },
    
    // Social features
    following: dbProfile.following || [],
    followers: dbProfile.followers || [],
    privacy: dbProfile.privacy_settings || {
      profileVisibility: 'private',
      shareStats: false,
      shareMealPlans: false,
      shareRecipes: false
    },
    
    createdAt: new Date(dbProfile.created_at),
    updatedAt: new Date(dbProfile.updated_at)
  };
}

/**
 * Transform TypeScript camelCase to database snake_case for user profile
 */
export function transformProfileToDB(profile: Partial<UserProfile>): any {
  const transformed: any = {};

  if (profile.username !== undefined) transformed.username = profile.username;
  if (profile.fullName !== undefined) transformed.full_name = profile.fullName;
  if (profile.email !== undefined) transformed.email = profile.email;
  if (profile.avatarUrl !== undefined) transformed.avatar_url = profile.avatarUrl;
  if (profile.bio !== undefined) transformed.bio = profile.bio;
  if (profile.dateOfBirth !== undefined) transformed.date_of_birth = profile.dateOfBirth;
  if (profile.gender !== undefined) transformed.gender = profile.gender;
  if (profile.location !== undefined) transformed.location = profile.location;
  if (profile.language !== undefined) transformed.language = profile.language;
  if (profile.theme !== undefined) transformed.theme = profile.theme;
  if (profile.stats !== undefined) transformed.stats = profile.stats;
  if (profile.following !== undefined) transformed.following = profile.following;
  if (profile.followers !== undefined) transformed.followers = profile.followers;
  if (profile.privacy !== undefined) transformed.privacy_settings = profile.privacy;

  return transformed;
}