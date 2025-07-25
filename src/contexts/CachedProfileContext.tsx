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
import { useProfileCache } from '@/hooks/useProfileCache';
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
import { useUser } from '@/store';

// Core Profile Data Context with caching
interface ProfileDataContextValue {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  cacheStats: {
    hitRate: number;
    cacheSize: number;
    entries: number;
  };
}

// Household Members Context
interface HouseholdContextValue {
  householdMembers: HouseholdMember[];
  addHouseholdMember: (member: Omit<HouseholdMember, 'id' | 'userId'>) => Promise<void>;
  updateHouseholdMember: (id: string, updates: Partial<HouseholdMember>) => Promise<void>;
  removeHouseholdMember: (id: string) => Promise<void>;
}

// Profile Actions Context with cache-aware updates
interface ProfileActionsContextValue {
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
  invalidateCache: () => void;
  prefetchProfile: (userId: string) => Promise<void>;
}

// Computed Values Context
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

// Profile Data Provider with caching
const ProfileDataProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const user = useUser();
  
  // Use the profile cache hook
  const {
    data,
    isLoading,
    error,
    stats: cacheStats,
  } = useProfileCache({
    userId: user?.id,
    prefetch: true,
    subscribe: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized context value
  const value = useMemo<ProfileDataContextValue>(() => ({
    profile: data?.profile as UserProfile | null,
    preferences: data?.preferences as UserPreferences | null,
    isLoading,
    error,
    cacheStats,
  }), [data?.profile, data?.preferences, isLoading, error, cacheStats]);

  return (
    <ProfileDataContext.Provider value={value}>
      {children}
    </ProfileDataContext.Provider>
  );
});

ProfileDataProvider.displayName = 'ProfileDataProvider';

// Household Provider with caching
const HouseholdProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const user = useUser();
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [cacheKey, setCacheKey] = useState(0); // Force cache invalidation

  // Cache household members in memory
  const householdCache = useMemo(() => new Map<string, HouseholdMember[]>(), []);

  // Memoized load function with caching
  const loadHouseholdMembers = useCallback(async () => {
    if (!user?.id) return;
    
    const cacheKeyStr = `${user.id}_${cacheKey}`;
    
    // Check cache first
    if (householdCache.has(cacheKeyStr)) {
      setHouseholdMembers(householdCache.get(cacheKeyStr)!);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const members = data || [];
      householdCache.set(cacheKeyStr, members);
      setHouseholdMembers(members);
    } catch (err: unknown) {
      logger.error('Error loading household members', 'ProfileContext', err);
    }
  }, [user?.id, cacheKey, householdCache]);

  // Load household members on user change
  useEffect(() => {
    if (user?.id) {
      loadHouseholdMembers();
    }
  }, [user?.id, loadHouseholdMembers]);

  // Subscribe to household member changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`household_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setCacheKey(prev => prev + 1); // Invalidate cache
          loadHouseholdMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadHouseholdMembers]);

  // Memoized action functions with optimistic updates
  const addHouseholdMember = useCallback(async (member: Omit<HouseholdMember, 'id' | 'userId'>) => {
    if (!user?.id) return;

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempMember = { ...member, id: tempId, userId: user.id } as HouseholdMember;
    setHouseholdMembers(prev => [...prev, tempMember]);

    try {
      const { data, error } = await supabase
        .from('household_members')
        .insert({ ...member, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      // Replace temp member with real data
      setHouseholdMembers(prev => 
        prev.map(m => m.id === tempId ? data : m)
      );
      
      // Invalidate cache
      setCacheKey(prev => prev + 1);
      success('Miembro del hogar agregado');
    } catch (err: unknown) {
      // Revert optimistic update
      setHouseholdMembers(prev => prev.filter(m => m.id !== tempId));
      console.error('Error al agregar miembro del hogar');
      throw err;
    }
  }, [user?.id]);

  const updateHouseholdMember = useCallback(async (id: string, updates: Partial<HouseholdMember>) => {
    // Optimistic update
    setHouseholdMembers(prev => 
      prev.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    try {
      const { error } = await supabase
        .from('household_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate cache
      setCacheKey(prev => prev + 1);
      success('Miembro actualizado');
    } catch (err: unknown) {
      // Revert optimistic update
      await loadHouseholdMembers();
      console.error('Error al actualizar miembro');
      throw err;
    }
  }, [loadHouseholdMembers]);

  const removeHouseholdMember = useCallback(async (id: string) => {
    // Store member for potential revert
    const memberToRemove = householdMembers.find(m => m.id === id);
    
    // Optimistic update
    setHouseholdMembers(prev => prev.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate cache
      setCacheKey(prev => prev + 1);
      success('Miembro eliminado');
    } catch (err: unknown) {
      // Revert optimistic update
      if (memberToRemove) {
        setHouseholdMembers(prev => [...prev, memberToRemove]);
      }
      console.error('Error al eliminar miembro');
      throw err;
    }
  }, [householdMembers]);

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

// Profile Actions Provider with cache integration
const ProfileActionsProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const user = useUser();
  const { profile } = useProfileData();
  
  // Use the profile cache hook for actions
  const {
    updateProfile: cacheUpdateProfile,
    updatePreferences: cacheUpdatePreferences,
    refetch,
    invalidate,
    prefetch,
  } = useProfileCache({
    userId: user?.id,
  });

  // Memoized action functions
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    try {
      await cacheUpdateProfile(updates);
      success('Perfil actualizado correctamente');
    } catch (err: unknown) {
      console.error('Error al actualizar el perfil');
      throw err;
    }
  }, [user?.id, profile, cacheUpdateProfile]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user?.id) return;

    try {
      await cacheUpdatePreferences(updates);
      success('Preferencias actualizadas');
    } catch (err: unknown) {
      console.error('Error al actualizar las preferencias');
      throw err;
    }
  }, [user?.id, cacheUpdatePreferences]);

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
      await refetch();
      success('Perfil actualizado');
    } catch (err: unknown) {
      console.error('Error al actualizar el perfil');
      throw err;
    }
  }, [user?.id, refetch]);

  const invalidateCache = useCallback(() => {
    invalidate();
  }, [invalidate]);

  const prefetchProfile = useCallback(async (userId: string) => {
    await prefetch(userId);
  }, [prefetch]);

  // Memoized context value
  const value = useMemo<ProfileActionsContextValue>(() => ({
    updateProfile,
    updatePreferences,
    uploadAvatar,
    refreshProfile,
    invalidateCache,
    prefetchProfile,
  }), [updateProfile, updatePreferences, uploadAvatar, refreshProfile, invalidateCache, prefetchProfile]);

  return (
    <ProfileActionsContext.Provider value={value}>
      {children}
    </ProfileActionsContext.Provider>
  );
});

ProfileActionsProvider.displayName = 'ProfileActionsProvider';

// Computed Values Provider with caching
const ProfileComputedProvider = memo<{ children: React.ReactNode }>(({ children }) => {
  const { preferences } = useProfileData();
  const { householdMembers } = useHouseholdContext();

  // Use Map for computed value caching
  const computedCache = useMemo(() => new Map<string, { value: any; timestamp: number }>(), []);
  const COMPUTED_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  const getCachedOrCompute = useCallback(<T,>(key: string, compute: () => T): T => {
    const cached = computedCache.get(key);
    const now = Date.now();
    
    if (cached && cached.timestamp > now - COMPUTED_CACHE_TTL) {
      return cached.value;
    }
    
    const value = compute();
    computedCache.set(key, { value, timestamp: now });
    return value;
  }, [computedCache, COMPUTED_CACHE_TTL]);

  // Memoized helper functions with caching
  const getDietaryRestrictions = useCallback((): DietaryRestriction[] => {
    return getCachedOrCompute('dietary-restrictions', () => {
      const userRestrictions = preferences?.dietaryRestrictions || [];
      const memberRestrictions = householdMembers.flatMap(m => m.dietaryRestrictions || []);
      return [...new Set([...userRestrictions, ...memberRestrictions])];
    });
  }, [preferences?.dietaryRestrictions, householdMembers, getCachedOrCompute]);

  const getAllergies = useCallback((): Allergy[] => {
    return getCachedOrCompute('allergies', () => {
      const userAllergies = preferences?.allergies || [];
      const memberAllergies = householdMembers.flatMap(m => m.allergies || []);
      return [...new Set([...userAllergies, ...memberAllergies])];
    });
  }, [preferences?.allergies, householdMembers, getCachedOrCompute]);

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

  // Complex computed functions with caching
  const getPersonalizationData = useCallback((): PersonalizationData => {
    return getCachedOrCompute('personalization-data', () => ({
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
    }));
  }, [getDietaryRestrictions, getAllergies, preferences, getHouseholdSize, getBudget, getCookingTimeAvailable, getCachedOrCompute]);

  const getRecommendationProfile = useCallback((): RecommendationProfile => {
    return getCachedOrCompute('recommendation-profile', () => ({
      preferences: getPersonalizationData(),
      history: {
        likedRecipes: [],
        dislikedRecipes: [],
        cookedRecipes: [],
      },
      goals: preferences?.nutritionGoals || [],
    }));
  }, [getPersonalizationData, preferences?.nutritionGoals, getCachedOrCompute]);

  const getPlanningConstraints = useCallback((): PlanningConstraints => {
    return getCachedOrCompute('planning-constraints', () => ({
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
    }));
  }, [getDietaryRestrictions, getAllergies, getBudget, getCookingTimeAvailable, getHouseholdSize, getMealSchedule, preferences?.planningPreferences, getCachedOrCompute]);

  // Clear computed cache when dependencies change
  useEffect(() => {
    computedCache.clear();
  }, [preferences, householdMembers, computedCache]);

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

// Main Provider
export const CachedProfileProvider = memo<{ children: React.ReactNode }>(({ children }) => {
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

CachedProfileProvider.displayName = 'CachedProfileProvider';

// Hook exports
export const useProfileData = () => {
  const context = useContext(ProfileDataContext);
  if (!context) {
    throw new Error('useProfileData must be used within CachedProfileProvider');
  }
  return context;
};

export const useHouseholdContext = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHouseholdContext must be used within CachedProfileProvider');
  }
  return context;
};

export const useProfileActions = () => {
  const context = useContext(ProfileActionsContext);
  if (!context) {
    throw new Error('useProfileActions must be used within CachedProfileProvider');
  }
  return context;
};

export const useProfileComputed = () => {
  const context = useContext(ProfileComputedContext);
  if (!context) {
    throw new Error('useProfileComputed must be used within CachedProfileProvider');
  }
  return context;
};

// Combined interface for backward compatibility
interface ProfileContextValue extends 
  ProfileDataContextValue, 
  HouseholdContextValue, 
  ProfileActionsContextValue, 
  ProfileComputedContextValue {}

export const useCachedProfile = (): ProfileContextValue => {
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