/**
 * @fileoverview Consolidated profile type definitions and utilities
 * @module types/profile
 * 
 * This module provides a single source of truth for all profile-related types,
 * schemas, guards, and utilities across the application.
 */

import { z } from 'zod';

// ============================================================================
// Base Enums and Constants
// ============================================================================

/**
 * Supported dietary restrictions in the system
 */
export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'shellfish_free',
  'egg_free',
  'soy_free',
  'pescatarian',
  'paleo',
  'keto',
  'low_carb',
  'low_sodium',
  'halal',
  'kosher',
  'lactose_free',
  'diabetic',
  'raw_food',
  'whole30',
  'low_fat'
] as const;

export type DietaryRestriction = typeof DIETARY_RESTRICTIONS[number];

/**
 * Common food allergies
 */
export const ALLERGIES = [
  'peanuts',
  'tree_nuts',
  'milk',
  'eggs',
  'wheat',
  'soy',
  'fish',
  'shellfish',
  'sesame'
] as const;

export type Allergy = typeof ALLERGIES[number];

/**
 * Cooking skill levels
 */
export const COOKING_SKILL_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
] as const;

export type CookingSkillLevel = typeof COOKING_SKILL_LEVELS[number];

/**
 * UI theme preferences
 */
export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = typeof THEMES[number];

/**
 * Gender options
 */
export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = typeof GENDERS[number];

/**
 * Meal types
 */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;
export type MealType = typeof MEAL_TYPES[number];

/**
 * Texture preferences for food
 */
export const TEXTURE_PREFERENCES = [
  'crispy',
  'creamy',
  'crunchy',
  'soft',
  'chewy',
  'smooth',
  'chunky'
] as const;

export type TexturePreference = typeof TEXTURE_PREFERENCES[number];

/**
 * Taste intensity levels
 */
export const INTENSITY_LEVELS = ['none', 'low', 'medium', 'high', 'very_high'] as const;
export type IntensityLevel = typeof INTENSITY_LEVELS[number];

/**
 * Privacy visibility options
 */
export const PRIVACY_LEVELS = ['public', 'friends', 'private'] as const;
export type PrivacyLevel = typeof PRIVACY_LEVELS[number];

/**
 * Household member relationships
 */
export const RELATIONSHIPS = [
  'self',
  'partner',
  'child',
  'parent',
  'roommate',
  'other'
] as const;

export type Relationship = typeof RELATIONSHIPS[number];

/**
 * Store types
 */
export const STORE_TYPES = [
  'supermarket',
  'local',
  'online',
  'farmers_market'
] as const;

export type StoreType = typeof STORE_TYPES[number];

/**
 * Planning horizons
 */
export const PLANNING_HORIZONS = [
  'daily',
  'weekly',
  'biweekly',
  'monthly'
] as const;

export type PlanningHorizon = typeof PLANNING_HORIZONS[number];

/**
 * Leftover strategies
 */
export const LEFTOVER_STRATEGIES = ['incorporate', 'freeze', 'avoid'] as const;
export type LeftoverStrategy = typeof LEFTOVER_STRATEGIES[number];

/**
 * Variety preferences
 */
export const VARIETY_PREFERENCES = ['high', 'medium', 'low'] as const;
export type VarietyPreference = typeof VARIETY_PREFERENCES[number];

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Location schema
 */
export const locationSchema = z.object({
  country: z.string().min(2).max(100),
  city: z.string().min(2).max(100).optional(),
  timezone: z.string().min(3).max(50)
});

/**
 * User stats schema
 */
export const userStatsSchema = z.object({
  recipesCreated: z.number().int().min(0),
  mealsPlanned: z.number().int().min(0),
  recipesRated: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  joinedDate: z.date(),
  lastActive: z.date()
});

/**
 * Privacy settings schema
 */
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(PRIVACY_LEVELS),
  shareStats: z.boolean(),
  shareMealPlans: z.boolean(),
  shareRecipes: z.boolean()
});

/**
 * Nutritional goals schema
 */
export const nutritionalGoalsSchema = z.object({
  caloriesPerDay: z.number().int().min(800).max(5000).optional(),
  proteinPerDay: z.number().min(0).max(500).optional(),
  carbsPerDay: z.number().min(0).max(1000).optional(),
  fatPerDay: z.number().min(0).max(500).optional(),
  fiberPerDay: z.number().min(0).max(100).optional(),
  sodiumLimit: z.number().min(0).max(10000).optional(),
  sugarLimit: z.number().min(0).max(500).optional(),
  specialGoals: z.array(z.string()).max(10).optional()
});

/**
 * Taste profile schema
 */
export const tasteProfileSchema = z.object({
  spicyTolerance: z.enum(INTENSITY_LEVELS),
  sweetPreference: z.enum(['low', 'medium', 'high']),
  saltyPreference: z.enum(['low', 'medium', 'high']),
  sourPreference: z.enum(['low', 'medium', 'high']),
  bitterTolerance: z.enum(['low', 'medium', 'high']),
  umamiAppreciation: z.enum(['low', 'medium', 'high']),
  texturePreferences: z.array(z.enum(TEXTURE_PREFERENCES)).max(7)
});

/**
 * Budget schema
 */
export const budgetSchema = z.object({
  weekly: z.number().min(0).max(10000),
  monthly: z.number().min(0).max(50000),
  currency: z.string().length(3)
});

/**
 * Cooking preferences schema
 */
export const cookingPreferencesSchema = z.object({
  timeAvailable: z.object({
    weekday: z.number().int().min(0).max(300), // minutes
    weekend: z.number().int().min(0).max(600)  // minutes
  }),
  cookingMethods: z.array(z.string()).max(20),
  kitchenTools: z.array(z.string()).max(30)
});

/**
 * Store schema
 */
export const storeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  location: z.string().max(200).optional(),
  type: z.enum(STORE_TYPES)
});

/**
 * Delivery preference schema
 */
export const deliveryPreferenceSchema = z.object({
  service: z.string().min(1).max(50),
  preferredDays: z.array(z.number().int().min(0).max(6)).max(7),
  preferredTimeSlots: z.array(z.string()).max(5)
});

/**
 * Planning preferences schema
 */
export const planningPreferencesSchema = z.object({
  planningHorizon: z.enum(PLANNING_HORIZONS),
  mealTypes: z.array(z.enum(MEAL_TYPES)).min(1).max(5),
  batchCooking: z.boolean(),
  leftoverStrategy: z.enum(LEFTOVER_STRATEGIES),
  varietyPreference: z.enum(VARIETY_PREFERENCES)
});

/**
 * Shopping preferences schema
 */
export const shoppingPreferencesSchema = z.object({
  preferredStores: z.array(storeSchema).max(10),
  shoppingDay: z.number().int().min(0).max(6), // day of week
  deliveryPreferences: z.array(deliveryPreferenceSchema).max(5)
});

/**
 * Meal schedule time schema
 */
export const mealScheduleTimeSchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7)
});

/**
 * Meal schedule schema
 */
export const mealScheduleSchema = z.object({
  breakfast: mealScheduleTimeSchema,
  lunch: mealScheduleTimeSchema,
  dinner: mealScheduleTimeSchema,
  snacks: z.object({
    enabled: z.boolean(),
    count: z.number().int().min(0).max(5)
  })
});

/**
 * Notification schedule schema
 */
export const notificationScheduleSchema = z.object({
  mealReminders: z.object({
    breakfast: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    lunch: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    dinner: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
  }),
  shoppingReminder: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  planningReminder: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
});

/**
 * Notification settings schema
 */
export const notificationSettingsSchema = z.object({
  mealReminders: z.boolean(),
  shoppingReminders: z.boolean(),
  expirationAlerts: z.boolean(),
  recipeSuggestions: z.boolean(),
  planningPrompts: z.boolean(),
  notificationTimes: notificationScheduleSchema
});

/**
 * Household member schema
 */
export const householdMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(2).max(50),
  relationship: z.enum(RELATIONSHIPS),
  age: z.number().int().min(0).max(120).optional(),
  dietaryRestrictions: z.array(z.enum(DIETARY_RESTRICTIONS)).max(20).optional(),
  allergies: z.array(z.enum(ALLERGIES)).max(10).optional(),
  preferences: z.array(z.string()).max(20).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  
  // Extended Profile
  dateOfBirth: z.date().optional(),
  gender: z.enum(GENDERS).optional(),
  location: locationSchema.optional(),
  language: z.string().min(2).max(10),
  theme: z.enum(THEMES),
  
  // Activity & Stats
  stats: userStatsSchema,
  
  // Social Features
  following: z.array(z.string().uuid()).max(1000),
  followers: z.array(z.string().uuid()).max(10000),
  privacy: privacySettingsSchema,
  
  // Household
  householdSize: z.number().int().min(1).max(20),
  householdMembers: z.array(householdMemberSchema).max(20),
  
  // Financial
  monthlyBudget: z.number().min(0).max(100000),
  budget: budgetSchema,
  
  // Dietary
  dietaryRestrictions: z.array(z.enum(DIETARY_RESTRICTIONS)).max(20),
  allergies: z.array(z.string()).max(50), // Can be either predefined or custom
  preferredCuisines: z.array(z.string()).max(20),
  dislikedIngredients: z.array(z.string()).max(100),
  
  // Nutrition
  nutritionalGoals: nutritionalGoalsSchema,
  
  // Taste
  tasteProfile: tasteProfileSchema,
  
  // Skills
  cookingSkillLevel: z.enum(COOKING_SKILL_LEVELS),
  
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Dietary
  dietaryRestrictions: z.array(z.enum(DIETARY_RESTRICTIONS)).max(20),
  allergies: z.array(z.enum(ALLERGIES)).max(10),
  cuisinePreferences: z.array(z.string()).max(20),
  cookingSkillLevel: z.enum(COOKING_SKILL_LEVELS),
  householdSize: z.number().int().min(1).max(20),
  budget: budgetSchema,
  nutritionGoals: z.array(z.string()).max(10),
  
  // Cooking
  cookingPreferences: cookingPreferencesSchema,
  
  // Planning
  planningPreferences: planningPreferencesSchema,
  
  // Shopping
  shoppingPreferences: shoppingPreferencesSchema,
  
  // Notifications
  notificationSettings: notificationSettingsSchema,
  
  // Schedule
  mealSchedule: mealScheduleSchema.optional(),
  
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type Location = z.infer<typeof locationSchema>;
export type UserStats = z.infer<typeof userStatsSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type NutritionalGoals = z.infer<typeof nutritionalGoalsSchema>;
export type TasteProfile = z.infer<typeof tasteProfileSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type CookingPreferences = z.infer<typeof cookingPreferencesSchema>;
export type Store = z.infer<typeof storeSchema>;
export type DeliveryPreference = z.infer<typeof deliveryPreferenceSchema>;
export type PlanningPreferences = z.infer<typeof planningPreferencesSchema>;
export type ShoppingPreferences = z.infer<typeof shoppingPreferencesSchema>;
export type MealScheduleTime = z.infer<typeof mealScheduleTimeSchema>;
export type MealSchedule = z.infer<typeof mealScheduleSchema>;
export type NotificationSchedule = z.infer<typeof notificationScheduleSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type HouseholdMember = z.infer<typeof householdMemberSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid dietary restriction
 */
export function isDietaryRestriction(value: unknown): value is DietaryRestriction {
  return typeof value === 'string' && DIETARY_RESTRICTIONS.includes(value as any);
}

/**
 * Check if a value is a valid allergy
 */
export function isAllergy(value: unknown): value is Allergy {
  return typeof value === 'string' && ALLERGIES.includes(value as any);
}

/**
 * Check if a value is a valid cooking skill level
 */
export function isCookingSkillLevel(value: unknown): value is CookingSkillLevel {
  return typeof value === 'string' && COOKING_SKILL_LEVELS.includes(value as any);
}

/**
 * Check if a value is a valid meal type
 */
export function isMealType(value: unknown): value is MealType {
  return typeof value === 'string' && MEAL_TYPES.includes(value as any);
}

/**
 * Check if an object is a valid UserProfile
 */
export function isUserProfile(value: unknown): value is UserProfile {
  return userProfileSchema.safeParse(value).success;
}

/**
 * Check if an object is a valid UserPreferences
 */
export function isUserPreferences(value: unknown): value is UserPreferences {
  return userPreferencesSchema.safeParse(value).success;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a default user profile
 */
export function createDefaultUserProfile(userId: string, email: string): Partial<UserProfile> {
  const now = new Date();
  return {
    userId,
    email,
    language: 'en',
    theme: 'system',
    stats: {
      recipesCreated: 0,
      mealsPlanned: 0,
      recipesRated: 0,
      streakDays: 0,
      joinedDate: now,
      lastActive: now
    },
    following: [],
    followers: [],
    privacy: {
      profileVisibility: 'public',
      shareStats: true,
      shareMealPlans: false,
      shareRecipes: true
    },
    householdSize: 1,
    householdMembers: [],
    monthlyBudget: 0,
    budget: {
      weekly: 0,
      monthly: 0,
      currency: 'USD'
    },
    dietaryRestrictions: [],
    allergies: [],
    preferredCuisines: [],
    dislikedIngredients: [],
    nutritionalGoals: {},
    tasteProfile: createDefaultTasteProfile(),
    cookingSkillLevel: 'intermediate',
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Create a default taste profile
 */
export function createDefaultTasteProfile(): TasteProfile {
  return {
    spicyTolerance: 'medium',
    sweetPreference: 'medium',
    saltyPreference: 'medium',
    sourPreference: 'medium',
    bitterTolerance: 'medium',
    umamiAppreciation: 'medium',
    texturePreferences: ['crispy', 'creamy', 'soft']
  };
}

/**
 * Create default user preferences
 */
export function createDefaultUserPreferences(userId: string): Partial<UserPreferences> {
  const now = new Date();
  return {
    userId,
    dietaryRestrictions: [],
    allergies: [],
    cuisinePreferences: [],
    cookingSkillLevel: 'intermediate',
    householdSize: 1,
    budget: {
      weekly: 0,
      monthly: 0,
      currency: 'USD'
    },
    nutritionGoals: [],
    cookingPreferences: {
      timeAvailable: {
        weekday: 30,
        weekend: 60
      },
      cookingMethods: [],
      kitchenTools: []
    },
    planningPreferences: {
      planningHorizon: 'weekly',
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      batchCooking: false,
      leftoverStrategy: 'incorporate',
      varietyPreference: 'medium'
    },
    shoppingPreferences: {
      preferredStores: [],
      shoppingDay: 6, // Saturday
      deliveryPreferences: []
    },
    notificationSettings: {
      mealReminders: true,
      shoppingReminders: true,
      expirationAlerts: true,
      recipeSuggestions: true,
      planningPrompts: true,
      notificationTimes: {
        mealReminders: {}
      }
    },
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Merge user profiles (for updates)
 */
export function mergeUserProfiles(
  existing: UserProfile,
  updates: Partial<UserProfile>
): UserProfile {
  return {
    ...existing,
    ...updates,
    stats: {
      ...existing.stats,
      ...(updates.stats || {})
    },
    privacy: {
      ...existing.privacy,
      ...(updates.privacy || {})
    },
    nutritionalGoals: {
      ...existing.nutritionalGoals,
      ...(updates.nutritionalGoals || {})
    },
    tasteProfile: {
      ...existing.tasteProfile,
      ...(updates.tasteProfile || {})
    },
    budget: {
      ...existing.budget,
      ...(updates.budget || {})
    },
    updatedAt: new Date()
  };
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: Partial<UserProfile>): number {
  const fields = [
    'username',
    'fullName',
    'avatarUrl',
    'bio',
    'dateOfBirth',
    'gender',
    'location',
    'householdSize',
    'monthlyBudget',
    'dietaryRestrictions',
    'allergies',
    'preferredCuisines',
    'nutritionalGoals',
    'tasteProfile',
    'cookingSkillLevel'
  ];

  let completed = 0;
  for (const field of fields) {
    const value = (profile as any)[field];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        completed++;
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        completed++;
      } else if (typeof value !== 'object') {
        completed++;
      }
    }
  }

  return Math.round((completed / fields.length) * 100);
}

// ============================================================================
// Integration Types (for backward compatibility)
// ============================================================================

export interface PersonalizationData {
  dietaryRestrictions: DietaryRestriction[];
  allergies: Allergy[];
  cuisinePreferences: string[];
  cookingSkillLevel: string;
  householdSize: number;
  budget: number;
  timeConstraints: {
    weekday: number;
    weekend: number;
  };
}

export interface RecommendationProfile {
  preferences: PersonalizationData;
  history: {
    likedRecipes: string[];
    dislikedRecipes: string[];
    cookedRecipes: string[];
  };
  goals: string[];
}

export interface PlanningConstraints {
  dietary: DietaryRestriction[];
  allergies: Allergy[];
  budget: number;
  timeConstraints: {
    weekday: number;
    weekend: number;
  };
  householdSize: number;
  mealSchedule?: MealSchedule;
  batchCookingEnabled: boolean;
  leftoverStrategy: string;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate and parse user profile data
 */
export function validateUserProfile(data: unknown): UserProfile | null {
  const result = userProfileSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate and parse user preferences data
 */
export function validateUserPreferences(data: unknown): UserPreferences | null {
  const result = userPreferencesSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Get validation errors for user profile
 */
export function getUserProfileErrors(data: unknown): Record<string, string> | null {
  const result = userProfileSchema.safeParse(data);
  if (result.success) return null;
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}

/**
 * Get validation errors for user preferences
 */
export function getUserPreferencesErrors(data: unknown): Record<string, string> | null {
  const result = userPreferencesSchema.safeParse(data);
  if (result.success) return null;
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}