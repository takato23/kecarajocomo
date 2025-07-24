export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  
  // Extended Profile
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: {
    country: string;
    city?: string;
    timezone: string;
  };
  language: string;
  theme: 'light' | 'dark' | 'system';
  
  // Activity & Stats
  stats: {
    recipesCreated: number;
    mealsPlanned: number;
    recipesRated: number;
    streakDays: number;
    joinedDate: Date;
    lastActive: Date;
  };
  
  // Social Features
  following: string[];
  followers: string[];
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareStats: boolean;
    shareMealPlans: boolean;
    shareRecipes: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  
  // From existing schema
  dietaryRestrictions: DietaryRestriction[];
  allergies: Allergy[];
  cuisinePreferences: string[];
  cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  householdSize: number;
  budget: {
    weekly: number;
    monthly: number;
    currency: string;
  };
  nutritionGoals: string[];
  
  // New preferences
  cookingPreferences: {
    timeAvailable: {
      weekday: number; // minutes
      weekend: number; // minutes
    };
    cookingMethods: string[];
    kitchenTools: string[];
  };
  
  planningPreferences: {
    planningHorizon: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    mealTypes: MealType[];
    batchCooking: boolean;
    leftoverStrategy: 'incorporate' | 'freeze' | 'avoid';
    varietyPreference: 'high' | 'medium' | 'low';
  };
  
  shoppingPreferences: {
    preferredStores: Store[];
    shoppingDay: number; // day of week
    deliveryPreferences: DeliveryPreference[];
  };
  
  notificationSettings: {
    mealReminders: boolean;
    shoppingReminders: boolean;
    expirationAlerts: boolean;
    recipeSuggestions: boolean;
    planningPrompts: boolean;
    notificationTimes: NotificationSchedule;
  };
  
  mealSchedule?: MealSchedule;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  name: string;
  relationship: 'self' | 'partner' | 'child' | 'parent' | 'roommate' | 'other';
  age?: number;
  dietaryRestrictions?: DietaryRestriction[];
  allergies?: Allergy[];
  preferences?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'shellfish_free'
  | 'egg_free'
  | 'soy_free'
  | 'pescatarian'
  | 'paleo'
  | 'keto'
  | 'low_carb'
  | 'low_sodium'
  | 'halal'
  | 'kosher';

export type Allergy = 
  | 'peanuts'
  | 'tree_nuts'
  | 'milk'
  | 'eggs'
  | 'wheat'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export interface MealSchedule {
  breakfast: {
    enabled: boolean;
    time: string; // HH:MM
    daysOfWeek: number[];
  };
  lunch: {
    enabled: boolean;
    time: string;
    daysOfWeek: number[];
  };
  dinner: {
    enabled: boolean;
    time: string;
    daysOfWeek: number[];
  };
  snacks: {
    enabled: boolean;
    count: number;
  };
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export interface Store {
  id: string;
  name: string;
  location?: string;
  type: 'supermarket' | 'local' | 'online' | 'farmers_market';
}

export interface DeliveryPreference {
  service: string;
  preferredDays: number[];
  preferredTimeSlots: string[];
}

export interface NotificationSchedule {
  mealReminders: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  shoppingReminder?: string;
  planningReminder?: string;
}

// Integration types
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