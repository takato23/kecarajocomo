import { useEffect, useState, useCallback, useRef } from 'react';
import { getProfileCache, type ProfileCache } from '@/services/profile/ProfileCache';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfilePreferences = Database['public']['Tables']['profile_preferences']['Row'];
type ProfileStats = Database['public']['Tables']['profile_stats']['Row'];

interface ProfileCacheData {
  profile: Profile | null;
  preferences: ProfilePreferences | null;
  stats: ProfileStats | null;
  lastFetched: number;
}

interface UseProfileCacheOptions {
  userId?: string;
  prefetch?: boolean;
  subscribe?: boolean;
  staleTime?: number;
}

interface UseProfileCacheReturn {
  data: ProfileCacheData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePreferences: (updates: Partial<ProfilePreferences>) => Promise<void>;
  invalidate: () => void;
  prefetch: (userId: string) => Promise<void>;
  stats: {
    hitRate: number;
    cacheSize: number;
    entries: number;
  };
}

export function useProfileCache(
  options: UseProfileCacheOptions = {}
): UseProfileCacheReturn {
  const { userId, prefetch = false, subscribe = true, staleTime = 5 * 60 * 1000 } = options;
  
  const [data, setData] = useState<ProfileCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    hitRate: 0,
    cacheSize: 0,
    entries: 0,
  });

  const cacheRef = useRef<ProfileCache>();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize cache
  useEffect(() => {
    cacheRef.current = getProfileCache();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Load profile data
  const loadProfile = useCallback(async (uid: string) => {
    if (!cacheRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const profileData = await cacheRef.current.getProfile(uid);
      setData(profileData);

      // Check if data is stale
      if (profileData && Date.now() - profileData.lastFetched > staleTime) {
        // Trigger background revalidation
        cacheRef.current.prefetchProfile(uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    } finally {
      setIsLoading(false);
    }
  }, [staleTime]);

  // Refetch profile
  const refetch = useCallback(async () => {
    if (!userId || !cacheRef.current) return;

    cacheRef.current.invalidateProfile(userId);
    await loadProfile(userId);
  }, [userId, loadProfile]);

  // Update profile with optimistic updates
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!userId || !cacheRef.current) {
      throw new Error('No user ID or cache available');
    }

    try {
      // Optimistically update local state
      if (data?.profile) {
        setData({
          ...data,
          profile: { ...data.profile, ...updates },
        });
      }

      await cacheRef.current.updateProfile(userId, updates);
      
      // Reload to ensure consistency
      await loadProfile(userId);
    } catch (err) {
      // Revert optimistic update
      await loadProfile(userId);
      throw err;
    }
  }, [userId, data, loadProfile]);

  // Update preferences with optimistic updates
  const updatePreferences = useCallback(async (updates: Partial<ProfilePreferences>) => {
    if (!userId || !cacheRef.current) {
      throw new Error('No user ID or cache available');
    }

    try {
      // Optimistically update local state
      if (data?.preferences) {
        setData({
          ...data,
          preferences: { ...data.preferences, ...updates },
        });
      }

      await cacheRef.current.updatePreferences(userId, updates);
      
      // Reload to ensure consistency
      await loadProfile(userId);
    } catch (err) {
      // Revert optimistic update
      await loadProfile(userId);
      throw err;
    }
  }, [userId, data, loadProfile]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    if (!userId || !cacheRef.current) return;
    cacheRef.current.invalidateProfile(userId);
  }, [userId]);

  // Prefetch profile
  const prefetchProfile = useCallback(async (uid: string) => {
    if (!cacheRef.current) return;
    await cacheRef.current.prefetchProfile(uid);
  }, []);

  // Load profile when userId changes
  useEffect(() => {
    if (userId) {
      loadProfile(userId);
    }
  }, [userId, loadProfile]);

  // Prefetch on mount if requested
  useEffect(() => {
    if (prefetch && userId) {
      prefetchProfile(userId);
    }
  }, [prefetch, userId, prefetchProfile]);

  // Subscribe to profile changes
  useEffect(() => {
    if (!subscribe || !userId || !cacheRef.current) return;

    unsubscribeRef.current = cacheRef.current.subscribeToProfileChanges(
      userId,
      (newData) => {
        setData(newData);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [subscribe, userId]);

  // Update stats periodically
  useEffect(() => {
    if (!cacheRef.current) return;

    const updateStats = () => {
      const cacheStats = cacheRef.current!.getStats();
      setStats({
        hitRate: cacheStats.cacheStats.hitRate,
        cacheSize: cacheStats.cacheStats.size,
        entries: cacheStats.cacheStats.entries,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    updateProfile,
    updatePreferences,
    invalidate,
    prefetch: prefetchProfile,
    stats,
  };
}

// Hook for warming up cache on app initialization
export function useProfileCacheWarmup() {
  const [isWarming, setIsWarming] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const warmup = async () => {
      try {
        const cache = getProfileCache();
        await cache.warmup();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to warm up cache'));
      } finally {
        setIsWarming(false);
      }
    };

    warmup();
  }, []);

  return { isWarming, error };
}

// Hook for monitoring cache performance
export function useProfileCacheMonitor() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const cache = getProfileCache();

    const updateMetrics = () => {
      const stats = cache.getStats();
      setMetrics({
        ...stats.performanceMetrics,
        cacheStats: stats.cacheStats,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
}