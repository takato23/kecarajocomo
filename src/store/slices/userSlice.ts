/**
 * User Slice - User state management
 */

import { StateCreator } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserPreferences {
  dietary: string[]; // vegetarian, vegan, gluten-free, etc.
  allergies: string[];
  favoriteCategories: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  householdSize: number;
  budget: {
    weekly: number;
    currency: string;
  };
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  notifications: {
    lowStock: boolean;
    expiration: boolean;
    mealReminders: boolean;
    priceAlerts: boolean;
    newRecipes: boolean;
  };
}

export interface UserSlice {
  user: {
    profile: UserProfile | null;
    preferences: UserPreferences;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  
  // Actions
  setUser: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  logout: () => void;
  setAuthLoading: (loading: boolean) => void;
}

const defaultPreferences: UserPreferences = {
  dietary: [],
  allergies: [],
  favoriteCategories: [],
  cookingSkill: 'beginner',
  householdSize: 2,
  budget: {
    weekly: 5000,
    currency: 'ARS'
  },
  location: {
    city: 'Buenos Aires',
    country: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  notifications: {
    lowStock: true,
    expiration: true,
    mealReminders: true,
    priceAlerts: true,
    newRecipes: false
  }
};

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  user: {
    profile: null,
    preferences: defaultPreferences,
    isAuthenticated: false,
    isLoading: false
  },
  
  setUser: (profile) => set((state) => {
    state.user.profile = profile;
    state.user.isAuthenticated = true;
    state.user.isLoading = false;
  }),
  
  updateProfile: (updates) => set((state) => {
    if (state.user.profile) {
      Object.assign(state.user.profile, updates);
    }
  }),
  
  setPreferences: (preferences) => set((state) => {
    Object.assign(state.user.preferences, preferences);
  }),
  
  logout: () => set((state) => {
    state.user.profile = null;
    state.user.isAuthenticated = false;
    state.user.isLoading = false;
  }),
  
  setAuthLoading: (loading) => set((state) => {
    state.user.isLoading = loading;
  })
});