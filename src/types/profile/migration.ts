/**
 * @fileoverview Migration utilities for transitioning to consolidated profile types
 * @module types/profile/migration
 */

import type { UserProfile as OldProfileManagerUserProfile } from '@/services/profile/ProfileManager';

import type { UserProfile as OldTypesUserProfile } from '../profile';

import type { UserProfile, UserPreferences } from './index';

/**
 * Migrate from ProfileManager's UserProfile to consolidated UserProfile
 */
export function migrateFromProfileManagerUserProfile(
  oldProfile: OldProfileManagerUserProfile,
  additionalData?: Partial<UserProfile>
): Partial<UserProfile> {
  return {
    id: oldProfile.id,
    userId: oldProfile.userId,
    
    // Map household data
    householdSize: oldProfile.householdSize,
    householdMembers: oldProfile.householdMembers.map(member => ({
      ...member,
      userId: oldProfile.userId,
      relationship: 'other' as const,
      createdAt: oldProfile.createdAt,
      updatedAt: oldProfile.updatedAt
    })),
    
    // Financial
    monthlyBudget: oldProfile.monthlyBudget,
    budget: {
      weekly: Math.round(oldProfile.monthlyBudget / 4),
      monthly: oldProfile.monthlyBudget,
      currency: 'USD'
    },
    
    // Dietary
    dietaryRestrictions: oldProfile.dietaryRestrictions,
    allergies: oldProfile.allergies,
    preferredCuisines: oldProfile.preferredCuisines,
    dislikedIngredients: oldProfile.dislikedIngredients,
    
    // Nutrition
    nutritionalGoals: oldProfile.nutritionalGoals,
    
    // Taste
    tasteProfile: oldProfile.tasteProfile,
    
    // Skills - map numeric to enum
    cookingSkillLevel: mapNumericSkillLevel(oldProfile.cookingSkillLevel),
    
    // Timestamps
    createdAt: oldProfile.createdAt,
    updatedAt: oldProfile.updatedAt,
    
    // Merge additional data if provided
    ...additionalData
  };
}

/**
 * Migrate from old types/profile.ts UserProfile to consolidated UserProfile
 */
export function migrateFromOldTypesUserProfile(
  oldProfile: OldTypesUserProfile
): UserProfile {
  // The old UserProfile from types/profile.ts is already close to our new structure
  // We just need to ensure all required fields are present
  return {
    ...oldProfile,
    // Ensure budget object exists
    budget: {
      weekly: 0,
      monthly: 0,
      currency: 'USD'
    },
    // Map household members if they exist
    householdMembers: [],
    monthlyBudget: 0,
    // Default nutritional goals
    nutritionalGoals: {},
    // Default taste profile
    tasteProfile: {
      spicyTolerance: 'medium',
      sweetPreference: 'medium',
      saltyPreference: 'medium',
      sourPreference: 'medium',
      bitterTolerance: 'medium',
      umamiAppreciation: 'medium',
      texturePreferences: ['crispy', 'creamy', 'soft']
    },
    // Map string skill level
    cookingSkillLevel: oldProfile.cookingSkillLevel || 'intermediate',
    // Ensure arrays exist
    dietaryRestrictions: [],
    allergies: [],
    preferredCuisines: [],
    dislikedIngredients: []
  } as UserProfile;
}

/**
 * Extract UserPreferences from a consolidated UserProfile
 */
export function extractUserPreferences(profile: UserProfile): Partial<UserPreferences> {
  return {
    userId: profile.userId,
    dietaryRestrictions: profile.dietaryRestrictions,
    allergies: profile.allergies.filter(a => 
      ['peanuts', 'tree_nuts', 'milk', 'eggs', 'wheat', 'soy', 'fish', 'shellfish', 'sesame'].includes(a)
    ) as any[],
    cuisinePreferences: profile.preferredCuisines,
    cookingSkillLevel: profile.cookingSkillLevel,
    householdSize: profile.householdSize,
    budget: profile.budget,
    nutritionGoals: profile.nutritionalGoals.specialGoals || [],
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

/**
 * Map numeric skill level to enum
 */
function mapNumericSkillLevel(level: 1 | 2 | 3 | 4 | 5): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  switch (level) {
    case 1:
    case 2:
      return 'beginner';
    case 3:
      return 'intermediate';
    case 4:
      return 'advanced';
    case 5:
      return 'expert';
    default:
      return 'intermediate';
  }
}

/**
 * Map old dietary restriction format to new format
 */
export function normalizeDietaryRestriction(restriction: string): string {
  const mapping: Record<string, string> = {
    'lactose_free': 'dairy_free', // Consolidate similar restrictions
    'gluten_free': 'gluten_free',
    'dairy_free': 'dairy_free',
    'nut_free': 'nut_free',
    'shellfish_free': 'shellfish_free',
    'egg_free': 'egg_free',
    'soy_free': 'soy_free',
    // Add more mappings as needed
  };
  
  return mapping[restriction] || restriction;
}

/**
 * Validate and fix profile data for database storage
 */
export function prepareProfileForDatabase(profile: Partial<UserProfile>): Record<string, any> {
  return {
    user_id: profile.userId,
    username: profile.username,
    full_name: profile.fullName,
    email: profile.email,
    avatar_url: profile.avatarUrl,
    bio: profile.bio,
    
    // Extended profile
    date_of_birth: profile.dateOfBirth?.toISOString(),
    gender: profile.gender,
    location: profile.location ? JSON.stringify(profile.location) : null,
    language: profile.language || 'en',
    theme: profile.theme || 'system',
    
    // Stats
    stats: profile.stats ? JSON.stringify(profile.stats) : null,
    
    // Social
    following: profile.following || [],
    followers: profile.followers || [],
    privacy: profile.privacy ? JSON.stringify(profile.privacy) : null,
    
    // Household
    household_size: profile.householdSize || 1,
    household_members: profile.householdMembers ? JSON.stringify(profile.householdMembers) : null,
    
    // Financial
    monthly_budget: profile.monthlyBudget || 0,
    budget: profile.budget ? JSON.stringify(profile.budget) : null,
    
    // Dietary
    dietary_restrictions: profile.dietaryRestrictions || [],
    allergies: profile.allergies || [],
    preferred_cuisines: profile.preferredCuisines || [],
    disliked_ingredients: profile.dislikedIngredients || [],
    
    // Nutrition
    nutritional_goals: profile.nutritionalGoals ? JSON.stringify(profile.nutritionalGoals) : null,
    
    // Taste
    taste_profile: profile.tasteProfile ? JSON.stringify(profile.tasteProfile) : null,
    
    // Skills
    cooking_skill_level: profile.cookingSkillLevel || 'intermediate',
    
    // Timestamps
    created_at: profile.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Parse profile data from database
 */
export function parseProfileFromDatabase(data: any): UserProfile {
  return {
    id: data.id,
    userId: data.user_id,
    username: data.username || '',
    fullName: data.full_name || '',
    email: data.email || '',
    avatarUrl: data.avatar_url,
    bio: data.bio,
    
    // Extended profile
    dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
    gender: data.gender,
    location: data.location ? JSON.parse(data.location) : undefined,
    language: data.language || 'en',
    theme: data.theme || 'system',
    
    // Stats
    stats: data.stats ? JSON.parse(data.stats) : {
      recipesCreated: 0,
      mealsPlanned: 0,
      recipesRated: 0,
      streakDays: 0,
      joinedDate: new Date(data.created_at),
      lastActive: new Date(data.updated_at)
    },
    
    // Social
    following: data.following || [],
    followers: data.followers || [],
    privacy: data.privacy ? JSON.parse(data.privacy) : {
      profileVisibility: 'public',
      shareStats: true,
      shareMealPlans: false,
      shareRecipes: true
    },
    
    // Household
    householdSize: data.household_size || 1,
    householdMembers: data.household_members ? JSON.parse(data.household_members) : [],
    
    // Financial
    monthlyBudget: data.monthly_budget || 0,
    budget: data.budget ? JSON.parse(data.budget) : {
      weekly: 0,
      monthly: data.monthly_budget || 0,
      currency: 'USD'
    },
    
    // Dietary
    dietaryRestrictions: data.dietary_restrictions || [],
    allergies: data.allergies || [],
    preferredCuisines: data.preferred_cuisines || [],
    dislikedIngredients: data.disliked_ingredients || [],
    
    // Nutrition
    nutritionalGoals: data.nutritional_goals ? JSON.parse(data.nutritional_goals) : {},
    
    // Taste
    tasteProfile: data.taste_profile ? JSON.parse(data.taste_profile) : {
      spicyTolerance: 'medium',
      sweetPreference: 'medium',
      saltyPreference: 'medium',
      sourPreference: 'medium',
      bitterTolerance: 'medium',
      umamiAppreciation: 'medium',
      texturePreferences: ['crispy', 'creamy', 'soft']
    },
    
    // Skills
    cookingSkillLevel: data.cooking_skill_level || 'intermediate',
    
    // Timestamps
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}