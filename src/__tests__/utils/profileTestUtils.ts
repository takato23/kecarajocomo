/**
 * Test utilities and mocks for profile system testing
 */

import React from 'react';
import type { 
  UserProfile, 
  UserPreferences, 
  HouseholdMember,
  CompletionMetrics,
  Achievement,
  AchievementType
} from '@/types/profile';

// Mock user profile data
export const mockUserProfile: UserProfile = {
  id: 'test-user-id',
  username: 'testuser',
  fullName: 'Test User',
  email: 'test@example.com',
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'Test user bio',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male',
  location: 'Buenos Aires, Argentina',
  householdSize: 2,
  dietaryRestrictions: ['vegetarian'],
  allergies: ['nuts'],
  preferredCuisines: ['mediterranean', 'asian'],
  cookingSkillLevel: 'intermediate',
  tasteProfile: {
    sweetness: 5,
    spiciness: 7,
    saltiness: 6,
    sourness: 4,
    bitterness: 3,
    umami: 8
  },
  nutritionalGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25
  },
  budget: {
    weekly: 100,
    monthly: 400,
    currency: 'ARS'
  },
  privacy: 'public',
  followers: [],
  following: [],
  stats: {
    profileCompleteness: 85,
    recipesCreated: 5,
    mealsPlanned: 12,
    totalSaved: 0,
    streakDays: 7,
    lastActive: new Date()
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date(),
};

export const mockUserPreferences: UserPreferences = {
  id: 'test-preferences-id',
  userId: 'test-user-id',
  cuisinePreferences: ['mediterranean', 'asian', 'latin'],
  dietaryRestrictions: ['vegetarian'],
  allergies: ['nuts', 'shellfish'],
  cookingSkillLevel: 'intermediate',
  cookingPreferences: {
    timeAvailable: {
      weekday: 30,
      weekend: 60
    },
    cookingMethods: ['baking', 'grilling', 'sauteing'],
    kitchenTools: ['oven', 'stovetop', 'blender']
  },
  planningPreferences: {
    planningHorizon: 'weekly',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    batchCooking: true,
    leftoverStrategy: 'incorporate'
  },
  shoppingPreferences: {
    shoppingDay: 6, // Saturday
    preferredStores: ['Jumbo', 'Disco'],
    organicPreference: true,
    localPreference: false
  },
  budget: {
    weekly: 100,
    monthly: 400,
    currency: 'ARS'
  },
  mealSchedule: {
    breakfast: { enabled: true, time: '08:00' },
    lunch: { enabled: true, time: '13:00' },
    dinner: { enabled: true, time: '20:00' },
    snacks: { enabled: false, time: '' }
  },
  notificationSettings: {
    mealReminders: true,
    shoppingReminders: true,
    recipeRecommendations: true,
    socialUpdates: false,
    promotional: false
  },
  version: 1,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date()
};

export const mockHouseholdMembers: HouseholdMember[] = [
  {
    id: 'member-1',
    userId: 'test-user-id',
    name: 'Jane Doe',
    age: 28,
    relationship: 'spouse',
    dietaryRestrictions: ['gluten_free'],
    allergies: ['dairy'],
    preferences: {
      spiceLevel: 'mild',
      favoriteIngredients: ['chicken', 'rice'],
      dislikedIngredients: ['mushrooms']
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'member-2',
    userId: 'test-user-id',
    name: 'Little John',
    age: 8,
    relationship: 'child',
    dietaryRestrictions: [],
    allergies: ['nuts'],
    preferences: {
      spiceLevel: 'none',
      favoriteIngredients: ['pasta', 'cheese'],
      dislikedIngredients: ['vegetables']
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date()
  }
];

export const mockAchievements: Achievement[] = [
  {
    id: 'profile_photo',
    name: 'Say Cheese!',
    description: 'Upload your first profile photo',
    icon: '📸',
    points: 10,
    category: 'profile',
    unlockedAt: new Date(),
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'basic_info',
    name: 'Getting Started',
    description: 'Complete your basic profile information',
    icon: '✍️',
    points: 20,
    category: 'profile',
    unlockedAt: new Date(),
    progress: 5,
    maxProgress: 5
  },
  {
    id: 'dietary_preferences',
    name: 'Know Your Taste',
    description: 'Set up your dietary preferences and restrictions',
    icon: '🥗',
    points: 30,
    category: 'profile',
    progress: 2,
    maxProgress: 3
  }
];

export const mockCompletionMetrics: CompletionMetrics = {
  overall: 85,
  sections: {
    basicInfo: 100,
    preferences: 90,
    household: 80,
    financial: 85,
    dietary: 95,
    cooking: 75,
    planning: 70,
    social: 60
  },
  achievements: mockAchievements,
  totalPoints: 160,
  level: 3,
  nextLevelPoints: 250,
  currentStreak: 7,
  longestStreak: 14,
  lastActiveDate: new Date()
};

// Mock functions factory
export const createMockProfileActions = () => ({
  updateProfile: jest.fn().mockResolvedValue(undefined),
  updatePreferences: jest.fn().mockResolvedValue(undefined),
  uploadAvatar: jest.fn().mockResolvedValue('https://example.com/new-avatar.jpg'),
  refreshProfile: jest.fn().mockResolvedValue(undefined),
  syncToCloud: jest.fn().mockResolvedValue(undefined),
  clearCache: jest.fn()
});

export const createMockHouseholdActions = () => ({
  addHouseholdMember: jest.fn().mockResolvedValue(undefined),
  updateHouseholdMember: jest.fn().mockResolvedValue(undefined),
  removeHouseholdMember: jest.fn().mockResolvedValue(undefined)
});

export const createMockProfileComputed = () => ({
  getDietaryRestrictions: jest.fn().mockReturnValue(['vegetarian', 'gluten_free']),
  getAllergies: jest.fn().mockReturnValue(['nuts', 'dairy']),
  getHouseholdSize: jest.fn().mockReturnValue(3),
  getBudget: jest.fn().mockReturnValue(400),
  getMealSchedule: jest.fn().mockReturnValue(mockUserPreferences.mealSchedule),
  getCookingTimeAvailable: jest.fn().mockReturnValue(30),
  getPersonalizationData: jest.fn().mockReturnValue({
    dietaryRestrictions: ['vegetarian', 'gluten_free'],
    allergies: ['nuts', 'dairy'],
    cuisinePreferences: ['mediterranean', 'asian'],
    cookingSkillLevel: 'intermediate',
    householdSize: 3,
    budget: 400,
    timeConstraints: { weekday: 30, weekend: 60 }
  }),
  getRecommendationProfile: jest.fn().mockReturnValue({
    preferences: {},
    history: { likedRecipes: [], dislikedRecipes: [], cookedRecipes: [] },
    goals: []
  }),
  getPlanningConstraints: jest.fn().mockReturnValue({
    dietary: ['vegetarian', 'gluten_free'],
    allergies: ['nuts', 'dairy'],
    budget: 400,
    timeConstraints: { weekday: 30, weekend: 60 },
    householdSize: 3,
    mealSchedule: mockUserPreferences.mealSchedule,
    batchCookingEnabled: true,
    leftoverStrategy: 'incorporate'
  })
});

// Mock auto-save return values
export const createMockAutoSaveReturn = () => ({
  saveState: 'idle' as const,
  forceSave: jest.fn().mockResolvedValue(undefined),
  updateData: jest.fn(),
  hasPendingChanges: false,
  manualSave: jest.fn().mockResolvedValue(undefined),
  clearPendingChanges: jest.fn(),
  getRecoveryData: jest.fn().mockReturnValue(null),
  retryFailedSaves: jest.fn().mockResolvedValue(undefined)
});

// Mock gamification return values
export const createMockGamificationReturn = () => ({
  metrics: mockCompletionMetrics,
  suggestions: [
    'Complete your household setup to earn more points!',
    'Add your cooking preferences to get better recommendations'
  ],
  isLoading: false,
  error: null,
  refreshMetrics: jest.fn(),
  trackAchievement: jest.fn().mockResolvedValue(undefined),
  awardAchievement: jest.fn().mockResolvedValue(undefined),
  celebrateCompletion: jest.fn()
});

// Partial data for testing edge cases
export const mockPartialProfile: Partial<UserProfile> = {
  id: 'partial-user-id',
  username: 'partialuser',
  email: 'partial@example.com'
};

export const mockEmptyPreferences: Partial<UserPreferences> = {
  id: 'empty-preferences-id',
  userId: 'partial-user-id'
};

// Error scenarios
export const mockProfileError = new Error('Profile save failed');
export const mockNetworkError = new Error('Network connection failed');
export const mockValidationError = new Error('Validation failed: required field missing');

// Mock Supabase responses
export const mockSupabaseSuccessResponse = {
  data: mockUserProfile,
  error: null
};

export const mockSupabaseErrorResponse = {
  data: null,
  error: { message: 'Database error', code: 'PGRST116' }
};

// Testing helper functions
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
};

export const createMockNavigator = (online = true) => ({
  onLine: online,
  serviceWorker: {
    register: jest.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      active: {},
      sync: { register: jest.fn() }
    }),
    addEventListener: jest.fn(),
    controller: {}
  }
});

// Test data builders
export class ProfileTestDataBuilder {
  private profile: Partial<UserProfile> = { ...mockUserProfile };

  static create(): ProfileTestDataBuilder {
    return new ProfileTestDataBuilder();
  }

  withId(id: string): ProfileTestDataBuilder {
    this.profile.id = id;
    return this;
  }

  withUsername(username: string): ProfileTestDataBuilder {
    this.profile.username = username;
    return this;
  }

  withCompleteness(completeness: number): ProfileTestDataBuilder {
    if (this.profile.stats) {
      this.profile.stats.profileCompleteness = completeness;
    }
    return this;
  }

  withDietaryRestrictions(restrictions: string[]): ProfileTestDataBuilder {
    this.profile.dietaryRestrictions = restrictions;
    return this;
  }

  withAllergies(allergies: string[]): ProfileTestDataBuilder {
    this.profile.allergies = allergies;
    return this;
  }

  withoutAvatar(): ProfileTestDataBuilder {
    this.profile.avatarUrl = undefined;
    return this;
  }

  incomplete(): ProfileTestDataBuilder {
    this.profile.fullName = undefined;
    this.profile.bio = undefined;
    this.profile.dateOfBirth = undefined;
    this.profile.avatarUrl = undefined;
    return this;
  }

  build(): UserProfile {
    return this.profile as UserProfile;
  }
}

export class PreferencesTestDataBuilder {
  private preferences: Partial<UserPreferences> = { ...mockUserPreferences };

  static create(): PreferencesTestDataBuilder {
    return new PreferencesTestDataBuilder();
  }

  withUserId(userId: string): PreferencesTestDataBuilder {
    this.preferences.userId = userId;
    return this;
  }

  withCookingSkill(skill: string): PreferencesTestDataBuilder {
    this.preferences.cookingSkillLevel = skill as any;
    return this;
  }

  withBudget(weekly: number, monthly: number): PreferencesTestDataBuilder {
    this.preferences.budget = { weekly, monthly, currency: 'ARS' };
    return this;
  }

  withoutBudget(): PreferencesTestDataBuilder {
    this.preferences.budget = undefined;
    return this;
  }

  minimal(): PreferencesTestDataBuilder {
    return new PreferencesTestDataBuilder();
  }

  build(): UserPreferences {
    return this.preferences as UserPreferences;
  }
}

// Mock context providers
interface MockProviderProps {
  children: React.ReactNode;
}

export const MockProfileProvider = ({ children }: MockProviderProps) => {
  return React.createElement('div', { 'data-testid': 'mock-profile-provider' }, children);
};

// Custom render function for testing components with profile context
export const renderWithProfileContext = (
  ui: React.ReactElement,
  options: {
    profile?: UserProfile;
    preferences?: UserPreferences;
    householdMembers?: HouseholdMember[];
    isLoading?: boolean;
    error?: Error | null;
  } = {}
) => {
  // This would be implemented with actual context providers in real tests
  // For now, it's a placeholder for the pattern
  return ui;
};