'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useProfileCache, useProfileCacheWarmup } from '@/hooks/useProfileCache';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database } from '@/types/supabase';
import { logger } from '@/services/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfilePreferences = Database['public']['Tables']['profile_preferences']['Row'];
type ProfileStats = Database['public']['Tables']['profile_stats']['Row'];

interface CachedProfileContextValue {
  profile: Profile | null;
  preferences: ProfilePreferences | null;
  stats: ProfileStats | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePreferences: (updates: Partial<ProfilePreferences>) => Promise<void>;
  refetch: () => Promise<void>;
  invalidate: () => void;
  cacheStats: {
    hitRate: number;
    cacheSize: number;
    entries: number;
  };
}

const CachedProfileContext = createContext<CachedProfileContextValue | undefined>(undefined);

export function CachedProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isWarming, error: warmupError } = useProfileCacheWarmup();
  
  const {
    data,
    isLoading,
    error,
    refetch,
    updateProfile,
    updatePreferences,
    invalidate,
    stats,
  } = useProfileCache({
    userId: user?.id,
    prefetch: true,
    subscribe: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log cache performance in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        logger.info('Profile Cache Performance:', 'CachedProfileProvider', {
          hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
          size: `${(stats.cacheSize / 1024).toFixed(2)}KB`,
          entries: stats.entries,
        });
      }, 30000); // Log every 30 seconds

      return () => clearInterval(interval);
    }
  }, [stats]);

  const value: CachedProfileContextValue = {
    profile: data?.profile || null,
    preferences: data?.preferences || null,
    stats: data?.stats || null,
    isLoading: isLoading || isWarming,
    error: error || warmupError,
    updateProfile,
    updatePreferences,
    refetch,
    invalidate,
    cacheStats: stats,
  };

  return (
    <CachedProfileContext.Provider value={value}>
      {children}
    </CachedProfileContext.Provider>
  );
}

export function useCachedProfile() {
  const context = useContext(CachedProfileContext);
  if (context === undefined) {
    throw new Error('useCachedProfile must be used within a CachedProfileProvider');
  }
  return context;
}

// Example usage component showing cache benefits
export function ProfileCacheDebugger() {
  const { cacheStats } = useCachedProfile();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs">
      <h3 className="font-bold mb-2">Profile Cache</h3>
      <div className="space-y-1">
        <div>Hit Rate: {(cacheStats.hitRate * 100).toFixed(2)}%</div>
        <div>Size: {(cacheStats.cacheSize / 1024).toFixed(2)}KB</div>
        <div>Entries: {cacheStats.entries}</div>
      </div>
    </div>
  );
}