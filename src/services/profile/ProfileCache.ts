import { CacheManager } from '@/lib/cache/CacheManager';
import { createClient } from '@/lib/supabase/client';
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

interface ProfileCacheOptions {
  profileTTL?: number;
  preferencesTTL?: number;
  statsTTL?: number;
  enableOptimisticUpdates?: boolean;
  enableWarmup?: boolean;
}

export class ProfileCache {
  private cache: CacheManager<ProfileCacheData>;
  private supabase = createClient();
  private options: Required<ProfileCacheOptions>;
  private updateQueue: Map<string, any> = new Map();
  private warmupPromise: Promise<void> | null = null;

  constructor(options: ProfileCacheOptions = {}) {
    this.options = {
      profileTTL: 10 * 60 * 1000, // 10 minutes
      preferencesTTL: 30 * 60 * 1000, // 30 minutes
      statsTTL: 5 * 60 * 1000, // 5 minutes
      enableOptimisticUpdates: true,
      enableWarmup: true,
      ...options,
    };

    this.cache = new CacheManager<ProfileCacheData>({
      maxSize: 10 * 1024 * 1024, // 10MB for profile cache
      maxEntries: 100,
      defaultTTL: this.options.profileTTL,
      enableLocalStorage: true,
      storagePrefix: 'profile_cache_',
      version: '1.0.0',
    });

    // Set up cache event listeners
    this.setupEventListeners();

    // Warm up cache if enabled
    if (this.options.enableWarmup) {
      this.warmup();
    }
  }

  // Get complete profile data with caching
  async getProfile(userId: string): Promise<ProfileCacheData | null> {
    const cacheKey = this.getCacheKey(userId);

    // Try to get from cache first
    const cached = await this.cache.get(cacheKey, {
      allowStale: true,
      revalidate: () => this.fetchProfile(userId),
    });

    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await this.fetchProfile(userId);
    if (fresh) {
      this.cache.set(cacheKey, fresh, { ttl: this.options.profileTTL });
    }

    return fresh;
  }

  // Get specific profile component
  async getProfileComponent<K extends keyof ProfileCacheData>(
    userId: string,
    component: K
  ): Promise<ProfileCacheData[K] | null> {
    const profile = await this.getProfile(userId);
    return profile ? profile[component] : null;
  }

  // Update profile with optimistic updates
  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile | null> {
    const cacheKey = this.getCacheKey(userId);

    if (this.options.enableOptimisticUpdates) {
      // Apply optimistic update
      const current = await this.cache.get(cacheKey);
      if (current && current.profile) {
        const optimisticProfile = { ...current.profile, ...updates };
        const optimisticData = { ...current, profile: optimisticProfile };
        this.cache.set(cacheKey, optimisticData, { ttl: this.options.profileTTL });
      }
    }

    try {
      // Perform actual update
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update cache with fresh data
      const fresh = await this.fetchProfile(userId);
      if (fresh) {
        this.cache.set(cacheKey, fresh, { ttl: this.options.profileTTL });
      }

      return data;
    } catch (error) {
      // Revert optimistic update on error
      if (this.options.enableOptimisticUpdates) {
        this.invalidateProfile(userId);
      }
      throw error;
    }
  }

  // Update preferences with optimistic updates
  async updatePreferences(
    userId: string,
    updates: Partial<ProfilePreferences>
  ): Promise<ProfilePreferences | null> {
    const cacheKey = this.getCacheKey(userId);

    if (this.options.enableOptimisticUpdates) {
      // Apply optimistic update
      const current = await this.cache.get(cacheKey);
      if (current && current.preferences) {
        const optimisticPreferences = { ...current.preferences, ...updates };
        const optimisticData = { ...current, preferences: optimisticPreferences };
        this.cache.set(cacheKey, optimisticData, { ttl: this.options.preferencesTTL });
      }
    }

    try {
      // Perform actual update
      const { data, error } = await this.supabase
        .from('profile_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update cache with fresh data
      const fresh = await this.fetchProfile(userId);
      if (fresh) {
        this.cache.set(cacheKey, fresh, { ttl: this.options.preferencesTTL });
      }

      return data;
    } catch (error) {
      // Revert optimistic update on error
      if (this.options.enableOptimisticUpdates) {
        this.invalidateProfile(userId);
      }
      throw error;
    }
  }

  // Invalidate profile cache
  invalidateProfile(userId: string): void {
    const cacheKey = this.getCacheKey(userId);
    this.cache.delete(cacheKey);
  }

  // Invalidate all profiles
  invalidateAll(): void {
    this.cache.invalidate(/^profile_/);
  }

  // Prefetch profile data
  async prefetchProfile(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    const cached = await this.cache.get(cacheKey);

    if (!cached) {
      const fresh = await this.fetchProfile(userId);
      if (fresh) {
        this.cache.set(cacheKey, fresh, { ttl: this.options.profileTTL });
      }
    }
  }

  // Warm up cache with current user
  async warmup(): Promise<void> {
    if (this.warmupPromise) return this.warmupPromise;

    this.warmupPromise = this.performWarmup();
    return this.warmupPromise;
  }

  // Get cache statistics
  getStats() {
    return {
      cacheStats: this.cache.getStats(),
      performanceMetrics: this.cache.getPerformanceMetrics(),
    };
  }

  // Subscribe to profile changes
  subscribeToProfileChanges(userId: string, callback: (data: ProfileCacheData) => void) {
    const channel = this.supabase
      .channel(`profile_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          this.invalidateProfile(userId);
          const fresh = await this.getProfile(userId);
          if (fresh) callback(fresh);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_preferences',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          this.invalidateProfile(userId);
          const fresh = await this.getProfile(userId);
          if (fresh) callback(fresh);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_stats',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          this.invalidateProfile(userId);
          const fresh = await this.getProfile(userId);
          if (fresh) callback(fresh);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Private methods

  private getCacheKey(userId: string): string {
    return `profile_${userId}`;
  }

  private async fetchProfile(userId: string): Promise<ProfileCacheData | null> {
    try {
      // Fetch all profile data in parallel
      const [profileResult, preferencesResult, statsResult] = await Promise.all([
        this.supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        this.supabase
          .from('profile_preferences')
          .select('*')
          .eq('user_id', userId)
          .single(),
        this.supabase
          .from('profile_stats')
          .select('*')
          .eq('user_id', userId)
          .single(),
      ]);

      return {
        profile: profileResult.data,
        preferences: preferencesResult.data,
        stats: statsResult.data,
        lastFetched: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  private async performWarmup(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        await this.prefetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error warming up profile cache:', error);
    }
  }

  private setupEventListeners(): void {
    // Log cache events for monitoring
    this.cache.on('cache:hit', ({ key }) => {
      console.debug(`Profile cache hit: ${key}`);
    });

    this.cache.on('cache:miss', ({ key }) => {
      console.debug(`Profile cache miss: ${key}`);
    });

    this.cache.on('cache:evict', ({ key, reason }) => {
      console.debug(`Profile cache evict: ${key} (${reason})`);
    });

    this.cache.on('cache:revalidated', ({ key }) => {
      console.debug(`Profile cache revalidated: ${key}`);
    });

    // Monitor performance
    setInterval(() => {
      const stats = this.getStats();
      if (stats.cacheStats.entries > 0) {
        console.debug('Profile cache stats:', {
          hitRate: `${(stats.cacheStats.hitRate * 100).toFixed(2)}%`,
          entries: stats.cacheStats.entries,
          size: `${(stats.cacheStats.size / 1024).toFixed(2)}KB`,
        });
      }
    }, 60000); // Log every minute
  }

  // Cleanup
  destroy(): void {
    this.cache.destroy();
  }
}

// Singleton instance
let profileCacheInstance: ProfileCache | null = null;

export function getProfileCache(): ProfileCache {
  if (!profileCacheInstance) {
    profileCacheInstance = new ProfileCache();
  }
  return profileCacheInstance;
}

export function destroyProfileCache(): void {
  if (profileCacheInstance) {
    profileCacheInstance.destroy();
    profileCacheInstance = null;
  }
}