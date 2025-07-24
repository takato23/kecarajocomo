'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/profile/ensure-profile';
import { success } from '@/services/notifications';
import { logger } from '@/services/logger';
import type { 
  UserProfile, 
  UserPreferences, 
  DietaryRestriction, 
  Allergy,
  HouseholdMember,
  PersonalizationData,
  RecommendationProfile,
  PlanningConstraints,
  MealSchedule
} from '@/types/profile';

interface ProfileContextValue {
  // Core Profile Data
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  householdMembers: HouseholdMember[];
  isLoading: boolean;
  error: Error | null;
  
  // Profile Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  addHouseholdMember: (member: Omit<HouseholdMember, 'id' | 'userId'>) => Promise<void>;
  updateHouseholdMember: (id: string, updates: Partial<HouseholdMember>) => Promise<void>;
  removeHouseholdMember: (id: string) => Promise<void>;
  
  // Preference Helpers
  getDietaryRestrictions: () => DietaryRestriction[];
  getAllergies: () => Allergy[];
  getHouseholdSize: () => number;
  getBudget: (period: 'weekly' | 'monthly') => number;
  getMealSchedule: () => MealSchedule | undefined;
  getCookingTimeAvailable: (dayType: 'weekday' | 'weekend') => number;
  
  // Integration Helpers
  getPersonalizationData: () => PersonalizationData;
  getRecommendationProfile: () => RecommendationProfile;
  getPlanningConstraints: () => PlanningConstraints;
  
  // Sync & Cache
  refreshProfile: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  clearCache: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const { 
    profile: storeProfile, 
    preferences: storePreferences, 
    fetchProfile, 
    fetchPreferences,
    updateProfile: updateStoreProfile,
    updatePreferences: updateStorePreferences
  } = useUserStore();
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Enhanced profile data with defaults
  const profile = storeProfile as UserProfile | null;
  const preferences = storePreferences as UserPreferences | null;

  // Load profile and preferences when user is available
  useEffect(() => {
    if (user?.id) {
      const initializeProfile = async () => {
        try {
          // Ensure profile and preferences exist
          await ensureUserProfile(user);
          
          // Then fetch them
          await fetchProfile(user.id);
          await fetchPreferences(user.id);
          await loadHouseholdMembers();
        } catch (error: unknown) {
          logger.error('Error initializing profile', 'ProfileContext', error);
          setError(error as Error);
        }
      };
      
      initializeProfile();
    }
  }, [user?.id]);

  const loadHouseholdMembers = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHouseholdMembers(data || []);
    } catch (err: unknown) {
      logger.error('Error loading household members', 'ProfileContext', err);
    }
  };

  // Profile Actions
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    try {
      setIsLoading(true);
      await updateStoreProfile(updates);
      success('Perfil actualizado correctamente');
    } catch (err: unknown) {
      error('Error al actualizar el perfil');
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user?.id || !preferences) return;

    try {
      setIsLoading(true);
      await updateStorePreferences(updates);
      success('Preferencias actualizadas');
    } catch (err: unknown) {
      error('Error al actualizar las preferencias');
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      setIsLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatarUrl: data.publicUrl });

      return data.publicUrl;
    } catch (err: unknown) {
      error('Error al subir la imagen');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Household Member Management
  const addHouseholdMember = async (member: Omit<HouseholdMember, 'id' | 'userId'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('household_members')
        .insert({ ...member, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setHouseholdMembers([...householdMembers, data]);
      success('Miembro del hogar agregado');
    } catch (err: unknown) {
      error('Error al agregar miembro del hogar');
      throw err;
    }
  };

  const updateHouseholdMember = async (id: string, updates: Partial<HouseholdMember>) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setHouseholdMembers(members => 
        members.map(m => m.id === id ? { ...m, ...updates } : m)
      );
      success('Miembro actualizado');
    } catch (err: unknown) {
      error('Error al actualizar miembro');
      throw err;
    }
  };

  const removeHouseholdMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHouseholdMembers(members => members.filter(m => m.id !== id));
      success('Miembro eliminado');
    } catch (err: unknown) {
      error('Error al eliminar miembro');
      throw err;
    }
  };

  // Preference Helpers
  const getDietaryRestrictions = useCallback((): DietaryRestriction[] => {
    const userRestrictions = preferences?.dietaryRestrictions || [];
    const memberRestrictions = householdMembers.flatMap(m => m.dietaryRestrictions || []);
    return [...new Set([...userRestrictions, ...memberRestrictions])];
  }, [preferences?.dietaryRestrictions, householdMembers]);

  const getAllergies = useCallback((): Allergy[] => {
    const userAllergies = preferences?.allergies || [];
    const memberAllergies = householdMembers.flatMap(m => m.allergies || []);
    return [...new Set([...userAllergies, ...memberAllergies])];
  }, [preferences?.allergies, householdMembers]);

  const getHouseholdSize = useCallback((): number => {
    return 1 + householdMembers.length; // User + members
  }, [householdMembers]);

  const getBudget = useCallback((period: 'weekly' | 'monthly'): number => {
    if (!preferences?.budget) return 0;
    return period === 'weekly' ? preferences.budget.weekly : preferences.budget.monthly;
  }, [preferences?.budget]);

  const getMealSchedule = useCallback((): MealSchedule | undefined => {
    return preferences?.mealSchedule;
  }, [preferences?.mealSchedule]);

  const getCookingTimeAvailable = useCallback((dayType: 'weekday' | 'weekend'): number => {
    if (!preferences?.cookingPreferences?.timeAvailable) return 30;
    return preferences.cookingPreferences.timeAvailable[dayType] || 30;
  }, [preferences?.cookingPreferences]);

  // Integration Helpers
  const getPersonalizationData = useCallback((): PersonalizationData => {
    return {
      dietaryRestrictions: getDietaryRestrictions(),
      allergies: getAllergies(),
      cuisinePreferences: preferences?.cuisinePreferences || [],
      cookingSkillLevel: preferences?.cookingSkillLevel || 'intermediate',
      householdSize: getHouseholdSize(),
      budget: getBudget('weekly'),
      timeConstraints: {
        weekday: getCookingTimeAvailable('weekday'),
        weekend: getCookingTimeAvailable('weekend'),
      },
    };
  }, [getDietaryRestrictions, getAllergies, preferences, getHouseholdSize, getBudget, getCookingTimeAvailable]);

  const getRecommendationProfile = useCallback((): RecommendationProfile => {
    return {
      preferences: getPersonalizationData(),
      history: {
        likedRecipes: [],
        dislikedRecipes: [],
        cookedRecipes: [],
      },
      goals: preferences?.nutritionGoals || [],
    };
  }, [getPersonalizationData, preferences?.nutritionGoals]);

  const getPlanningConstraints = useCallback((): PlanningConstraints => {
    return {
      dietary: getDietaryRestrictions(),
      allergies: getAllergies(),
      budget: getBudget('weekly'),
      timeConstraints: {
        weekday: getCookingTimeAvailable('weekday'),
        weekend: getCookingTimeAvailable('weekend'),
      },
      householdSize: getHouseholdSize(),
      mealSchedule: getMealSchedule(),
      batchCookingEnabled: preferences?.planningPreferences?.batchCooking || false,
      leftoverStrategy: preferences?.planningPreferences?.leftoverStrategy || 'incorporate',
    };
  }, [getDietaryRestrictions, getAllergies, getBudget, getCookingTimeAvailable, getHouseholdSize, getMealSchedule, preferences?.planningPreferences]);

  // Sync & Cache
  const refreshProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Reload all profile data
      await Promise.all([
        fetchProfile(user.id),
        fetchPreferences(user.id),
        loadHouseholdMembers()
      ]);
      
      success('Perfil actualizado');
    } catch (err: unknown) {
      error('Error al actualizar el perfil');
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncToCloud = async () => {
    // Force sync any pending changes
    await refreshProfile();
  };

  const clearCache = () => {
    // Clear local storage cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-profile-cache');
      localStorage.removeItem('user-preferences-cache');
    }
  };

  const value: ProfileContextValue = {
    profile,
    preferences,
    householdMembers,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    uploadAvatar,
    addHouseholdMember,
    updateHouseholdMember,
    removeHouseholdMember,
    getDietaryRestrictions,
    getAllergies,
    getHouseholdSize,
    getBudget,
    getMealSchedule,
    getCookingTimeAvailable,
    getPersonalizationData,
    getRecommendationProfile,
    getPlanningConstraints,
    refreshProfile,
    syncToCloud,
    clearCache,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};

export const useProfileContext = useProfile;