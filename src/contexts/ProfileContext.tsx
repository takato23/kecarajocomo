'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  memo
} from 'react';

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
import { useUser, useUserActions } from '@/store';

// ===== SPLIT CONTEXTS FOR GRANULAR UPDATES =====

// Core Profile Data Context (rarely changes)
interface ProfileDataContextValue {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
}

// Household Members Context (moderate changes)
interface HouseholdContextValue {
  householdMembers: HouseholdMember[];
  addHouseholdMember: (member: Omit<HouseholdMember, 'id' | 'userId'>) => Promise<void>;
  updateHouseholdMember: (id: string, updates: Partial<HouseholdMember>) => Promise<void>;
  removeHouseholdMember: (id: string) => Promise<void>;
}

// Profile Actions Context (stable functions)
interface ProfileActionsContextValue {
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  clearCache: () => void;
}

// Computed Values Context (derived from profile data)
interface ProfileComputedContextValue {
  getDietaryRestrictions: () => DietaryRestriction[];
  getAllergies: () => Allergy[];
  getHouseholdSize: () => number;
  getBudget: (period: 'weekly' | 'monthly') => number;
  getMealSchedule: () => MealSchedule | undefined;
  getCookingTimeAvailable: (dayType: 'weekday' | 'weekend') => number;
  getPersonalizationData: () => PersonalizationData;
  getRecommendationProfile: () => RecommendationProfile;
  getPlanningConstraints: () => PlanningConstraints;
}

// Create separate contexts
const ProfileDataContext = createContext<ProfileDataContextValue | null>(null);
const HouseholdContext = createContext<HouseholdContextValue | null>(null);
const ProfileActionsContext = createContext<ProfileActionsContextValue | null>(null);
const ProfileComputedContext = createContext<ProfileComputedContextValue | null>(null);

// ===== MEMOIZED HELPER FUNCTIONS =====

// Cache for expensive calculations
const memoCache = new Map<string, { value: any; timestamp: number; deps: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function createMemoizedFunction<T, Args extends any[]>(
  fn: (...args: Args) => T,
  keyFn: (...args: Args) => string,
  deps: () => string
) {
  return (...args: Args): T => {
    const key = keyFn(...args);
    const depsKey = deps();
    const cached = memoCache.get(key);
    
    if (cached && 
        cached.timestamp > Date.now() - CACHE_TTL && 
        cached.deps === depsKey) {
      return cached.value;
    }
    
    const result = fn(...args);
    memoCache.set(key, { 
      value: result, 
      timestamp: Date.now(), 
      deps: depsKey 
    });
    
    return result;
  };
}

// ===== PROFILE DATA PROVIDER =====

const ProfileDataProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const user = useUser();
  const userActions = useUserActions();
  
  // Memoize store mappings to prevent re-renders
  const storeData = useMemo(() => ({
    profile: user as UserProfile | null,
    preferences: user?.preferences as UserPreferences | null,
    updateProfile: userActions?.updateProfile,
    setPreferences: userActions?.setPreferences
  }), [user, userActions?.updateProfile, userActions?.setPreferences]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize profile when user changes
  useEffect(() => {
    if (user?.id) {
      const initializeProfile = async () => {
        try {
          await ensureUserProfile(user);
          logger.info('Profile initialized');
        } catch (error: unknown) {
          logger.error('Error initializing profile', 'ProfileContext', error);
          setError(error as Error);
        }
      };
      
      initializeProfile();
    }
  }, [user?.id]);

  // Memoized context value
  const value = useMemo<ProfileDataContextValue>(() => ({
    profile: storeData.profile,
    preferences: storeData.preferences,
    isLoading,
    error,
  }), [storeData.profile, storeData.preferences, isLoading, error]);

  return (
    <ProfileDataContext.Provider value={value}>
      {children}
    </ProfileDataContext.Provider>
  );
});

ProfileDataProvider.displayName = 'ProfileDataProvider';

// ===== HOUSEHOLD PROVIDER =====

const HouseholdProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const user = useUser();
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);

  // Memoized load function
  const loadHouseholdMembers = useCallback(async () => {
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
  }, [user?.id]);

  // Load household members on user change
  useEffect(() => {
    if (user?.id) {
      loadHouseholdMembers();
    }
  }, [user?.id, loadHouseholdMembers]);

  // Memoized action functions
  const addHouseholdMember = useCallback(async (member: Omit<HouseholdMember, 'id' | 'userId'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('household_members')
        .insert({ ...member, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setHouseholdMembers(prev => [...prev, data]);
      success('Miembro del hogar agregado');
    } catch (err: unknown) {
      console.error('Error al agregar miembro del hogar');
      throw err;
    }
  }, [user?.id]);

  const updateHouseholdMember = useCallback(async (id: string, updates: Partial<HouseholdMember>) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setHouseholdMembers(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
      );
      success('Miembro actualizado');
    } catch (err: unknown) {
      console.error('Error al actualizar miembro');
      throw err;
    }
  }, []);

  const removeHouseholdMember = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHouseholdMembers(prev => prev.filter(m => m.id !== id));
      success('Miembro eliminado');
    } catch (err: unknown) {
      console.error('Error al eliminar miembro');
      throw err;
    }
  }, []);

  // Memoized context value
  const value = useMemo<HouseholdContextValue>(() => ({
    householdMembers,
    addHouseholdMember,
    updateHouseholdMember,
    removeHouseholdMember,
  }), [householdMembers, addHouseholdMember, updateHouseholdMember, removeHouseholdMember]);

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
});

HouseholdProvider.displayName = 'HouseholdProvider';

// ===== PROFILE ACTIONS PROVIDER =====

const ProfileActionsProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const user = useUser();
  const userActions = useUserActions();
  const { profile } = useProfileData();
  
  // Get stable references
  const updateStoreProfile = userActions?.updateProfile;
  const updateStorePreferences = userActions?.setPreferences;

  // Memoized action functions
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile || !updateStoreProfile) return;

    try {
      await updateStoreProfile(updates);
      success('Perfil actualizado correctamente');
    } catch (err: unknown) {
      console.error('Error al actualizar el perfil');
      throw err;
    }
  }, [user?.id, profile, updateStoreProfile]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user?.id || !updateStorePreferences) return;

    try {
      await updateStorePreferences(updates);
      success('Preferencias actualizadas');
    } catch (err: unknown) {
      console.error('Error al actualizar las preferencias');
      throw err;
    }
  }, [user?.id, updateStorePreferences]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
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
      console.error('Error al subir la imagen');
      throw err;
    }
  }, [user?.id, updateProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Clear cache
      memoCache.clear();
      success('Perfil actualizado');
    } catch (err: unknown) {
      console.error('Error al actualizar el perfil');
      throw err;
    }
  }, [user?.id]);

  const syncToCloud = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  const clearCache = useCallback(() => {
    memoCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-profile-cache');
      localStorage.removeItem('user-preferences-cache');
    }
  }, []);

  // Memoized context value
  const value = useMemo<ProfileActionsContextValue>(() => ({
    updateProfile,
    updatePreferences,
    uploadAvatar,
    refreshProfile,
    syncToCloud,
    clearCache,
  }), [updateProfile, updatePreferences, uploadAvatar, refreshProfile, syncToCloud, clearCache]);

  return (
    <ProfileActionsContext.Provider value={value}>
      {children}
    </ProfileActionsContext.Provider>
  );
});

ProfileActionsProvider.displayName = 'ProfileActionsProvider';

// ===== COMPUTED VALUES PROVIDER =====

const ProfileComputedProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const { preferences } = useProfileData();
  const { householdMembers } = useHouseholdContext();

  // Create dependency key for memoization
  const createDepsKey = useCallback(() => {
    return JSON.stringify({
      preferencesVersion: preferences?.version || 0,
      householdMembersCount: householdMembers.length,
      householdMembersHash: householdMembers.map(m => `${m.id}:${m.version || 0}`).join(',')
    });
  }, [preferences?.version, householdMembers]);

  // Memoized helper functions
  const getDietaryRestrictions = useMemo(() => 
    createMemoizedFunction(
      (): DietaryRestriction[] => {
        const userRestrictions = preferences?.dietaryRestrictions || [];
        const memberRestrictions = householdMembers.flatMap(m => m.dietaryRestrictions || []);
        return [...new Set([...userRestrictions, ...memberRestrictions])];
      },
      () => 'dietary-restrictions',
      createDepsKey
    ), 
    [preferences?.dietaryRestrictions, householdMembers, createDepsKey]
  );

  const getAllergies = useMemo(() => 
    createMemoizedFunction(
      (): Allergy[] => {
        const userAllergies = preferences?.allergies || [];
        const memberAllergies = householdMembers.flatMap(m => m.allergies || []);
        return [...new Set([...userAllergies, ...memberAllergies])];
      },
      () => 'allergies',
      createDepsKey
    ), 
    [preferences?.allergies, householdMembers, createDepsKey]
  );

  const getHouseholdSize = useCallback((): number => {
    return 1 + householdMembers.length;
  }, [householdMembers.length]);

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
  }, [preferences?.cookingPreferences?.timeAvailable]);

  // Complex computed functions with memoization
  const getPersonalizationData = useMemo(() => 
    createMemoizedFunction(
      (): PersonalizationData => ({
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
      }),
      () => 'personalization-data',
      createDepsKey
    ), 
    [getDietaryRestrictions, getAllergies, preferences, getHouseholdSize, getBudget, getCookingTimeAvailable, createDepsKey]
  );

  const getRecommendationProfile = useMemo(() => 
    createMemoizedFunction(
      (): RecommendationProfile => ({
        preferences: getPersonalizationData(),
        history: {
          likedRecipes: [],
          dislikedRecipes: [],
          cookedRecipes: [],
        },
        goals: preferences?.nutritionGoals || [],
      }),
      () => 'recommendation-profile',
      createDepsKey
    ), 
    [getPersonalizationData, preferences?.nutritionGoals, createDepsKey]
  );

  const getPlanningConstraints = useMemo(() => 
    createMemoizedFunction(
      (): PlanningConstraints => ({
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
      }),
      () => 'planning-constraints',
      createDepsKey
    ), 
    [getDietaryRestrictions, getAllergies, getBudget, getCookingTimeAvailable, getHouseholdSize, getMealSchedule, preferences?.planningPreferences, createDepsKey]
  );

  // Memoized context value
  const value = useMemo<ProfileComputedContextValue>(() => ({
    getDietaryRestrictions,
    getAllergies,
    getHouseholdSize,
    getBudget,
    getMealSchedule,
    getCookingTimeAvailable,
    getPersonalizationData,
    getRecommendationProfile,
    getPlanningConstraints,
  }), [
    getDietaryRestrictions,
    getAllergies,
    getHouseholdSize,
    getBudget,
    getMealSchedule,
    getCookingTimeAvailable,
    getPersonalizationData,
    getRecommendationProfile,
    getPlanningConstraints,
  ]);

  return (
    <ProfileComputedContext.Provider value={value}>
      {children}
    </ProfileComputedContext.Provider>
  );
});

ProfileComputedProvider.displayName = 'ProfileComputedProvider';

// ===== MAIN PROVIDER =====

export const ProfileProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  return (
    <ProfileDataProvider>
      <HouseholdProvider>
        <ProfileActionsProvider>
          <ProfileComputedProvider>
            {children}
          </ProfileComputedProvider>
        </ProfileActionsProvider>
      </HouseholdProvider>
    </ProfileDataProvider>
  );
});

ProfileProvider.displayName = 'ProfileProvider';

// ===== HOOK EXPORTS =====

export const useProfileData = () => {
  const context = useContext(ProfileDataContext);
  if (!context) {
    throw new Error('useProfileData must be used within ProfileProvider');
  }
  return context;
};

export const useHouseholdContext = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHouseholdContext must be used within ProfileProvider');
  }
  return context;
};

export const useProfileActions = () => {
  const context = useContext(ProfileActionsContext);
  if (!context) {
    throw new Error('useProfileActions must be used within ProfileProvider');
  }
  return context;
};

export const useProfileComputed = () => {
  const context = useContext(ProfileComputedContext);
  if (!context) {
    throw new Error('useProfileComputed must be used within ProfileProvider');
  }
  return context;
};

// ===== BACKWARD COMPATIBILITY =====

// Combined interface for backward compatibility
interface ProfileContextValue extends 
  ProfileDataContextValue, 
  HouseholdContextValue, 
  ProfileActionsContextValue, 
  ProfileComputedContextValue {}

export const useProfile = (): ProfileContextValue => {
  const profileData = useProfileData();
  const household = useHouseholdContext();
  const actions = useProfileActions();
  const computed = useProfileComputed();

  return useMemo(() => ({
    ...profileData,
    ...household,
    ...actions,
    ...computed,
  }), [profileData, household, actions, computed]);
};

export const useProfileContext = useProfile;