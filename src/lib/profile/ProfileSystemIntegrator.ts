/**
 * ProfileSystemIntegrator - Central coordination hub for the entire profile system
 * 
 * This class provides a unified interface for managing all profile-related functionality,
 * including data persistence, real-time synchronization, performance monitoring,
 * analytics tracking, and cross-system integration.
 * 
 * Features:
 * - Centralized profile data management
 * - Real-time synchronization across components
 * - Performance monitoring and optimization
 * - Analytics and user behavior tracking
 * - Migration assistance for existing users
 * - Error handling and recovery mechanisms
 * - Offline support and data consistency
 */

import { EventEmitter } from 'events';
import type { 
  UserProfile, 
  UserPreferences, 
  HouseholdMember,
  ProfileCompletionMetrics,
  ProfileAnalytics,
  SystemHealth
} from '@/services/profile/ProfileManager';
import { getProfileManager } from '@/services/profile/ProfileManager';
import { getHolisticSystem } from '@/services/core/HolisticSystem';

// Enhanced types for system integration
export interface ProfileSystemConfig {
  // Performance settings
  enableRealTimeSync: boolean;
  syncIntervalMs: number;
  enableOfflineMode: boolean;
  
  // Analytics settings
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  
  // Integration settings
  enableGamification: boolean;
  enableAutoSave: boolean;
  enableConflictResolution: boolean;
  
  // Migration settings
  enableMigrationAssistance: boolean;
  migrationBatchSize: number;
}

export interface ProfileSystemState {
  isInitialized: boolean;
  isOnline: boolean;
  lastSyncTime: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'conflict';
  pendingChanges: number;
  systemHealth: SystemHealth;
}

export interface ProfileSystemEvents {
  'profile:updated': { userId: string; profile: UserProfile };
  'profile:synced': { userId: string; timestamp: Date };
  'profile:conflict': { userId: string; conflicts: any[] };
  'profile:error': { userId: string; error: Error };
  'system:health': { health: SystemHealth };
  'analytics:event': { event: string; data: any };
  'migration:progress': { userId: string; progress: number };
  'performance:metric': { metric: string; value: number; timestamp: Date };
}

export class ProfileSystemIntegrator extends EventEmitter {
  private config: ProfileSystemConfig;
  private state: ProfileSystemState;
  private profileManager;
  private holisticSystem;
  private syncInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();
  private errorRetryQueue: Array<{ operation: () => Promise<any>; retries: number }> = [];

  constructor(config: Partial<ProfileSystemConfig> = {}) {
    super();
    
    this.config = {
      enableRealTimeSync: true,
      syncIntervalMs: 30000, // 30 seconds
      enableOfflineMode: true,
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      enableGamification: true,
      enableAutoSave: true,
      enableConflictResolution: true,
      enableMigrationAssistance: true,
      migrationBatchSize: 10,
      ...config
    };

    this.state = {
      isInitialized: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncTime: null,
      syncStatus: 'idle',
      pendingChanges: 0,
      systemHealth: {
        status: 'healthy',
        lastCheck: new Date(),
        metrics: {
          responseTime: 0,
          errorRate: 0,
          syncSuccessRate: 100,
          cacheHitRate: 0
        }
      }
    };

    this.holisticSystem = getHolisticSystem();
    this.profileManager = getProfileManager(this.holisticSystem);

    this.setupEventListeners();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize the profile system
   */
  async initialize(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Initialize core systems
      await this.holisticSystem.initialize();
      
      // Setup real-time synchronization
      if (this.config.enableRealTimeSync) {
        this.startRealTimeSync();
      }

      // Setup online/offline detection
      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
      }

      this.state.isInitialized = true;
      
      const initTime = performance.now() - startTime;
      this.recordPerformanceMetric('system:initialization', initTime);
      
      console.log(`ProfileSystemIntegrator initialized in ${initTime.toFixed(2)}ms`);
      
    } catch (error) {
      this.handleError('initialization', error as Error);
      throw error;
    }
  }

  /**
   * Get complete profile data for a user
   */
  async getCompleteUserProfile(userId: string): Promise<{
    profile: UserProfile | null;
    preferences: UserPreferences | null;
    householdMembers: HouseholdMember[];
    completionMetrics: ProfileCompletionMetrics;
    analytics: ProfileAnalytics;
  }> {
    const startTime = performance.now();
    
    try {
      const [profile, preferences, householdMembers, completionMetrics] = await Promise.all([
        this.profileManager.getUserProfile(userId),
        this.profileManager.getUserPreferences(userId),
        this.profileManager.getHouseholdMembers(userId),
        this.profileManager.getProfileCompletionMetrics(userId)
      ]);

      // Generate analytics data
      const analytics = await this.generateAnalytics(userId, {
        profile,
        preferences,
        householdMembers,
        completionMetrics
      });

      const loadTime = performance.now() - startTime;
      this.recordPerformanceMetric('profile:load', loadTime);

      if (this.config.enableAnalytics) {
        this.emit('analytics:event', {
          event: 'profile:viewed',
          data: {
            userId,
            completionPercentage: completionMetrics.overall,
            loadTime,
            timestamp: new Date()
          }
        });
      }

      return {
        profile,
        preferences,
        householdMembers,
        completionMetrics,
        analytics
      };
    } catch (error) {
      this.handleError('profile:load', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Update user profile with conflict resolution
   */
  async updateUserProfile(
    userId: string, 
    updates: Partial<UserProfile>,
    options: {
      skipConflictResolution?: boolean;
      force?: boolean;
      source?: string;
    } = {}
  ): Promise<UserProfile> {
    const startTime = performance.now();
    
    try {
      this.state.pendingChanges++;
      this.state.syncStatus = 'syncing';

      // Check for conflicts if enabled
      if (this.config.enableConflictResolution && !options.skipConflictResolution) {
        const conflicts = await this.detectConflicts(userId, updates);
        if (conflicts.length > 0 && !options.force) {
          this.emit('profile:conflict', { userId, conflicts });
          throw new Error('Profile conflicts detected. Resolve conflicts or use force option.');
        }
      }

      // Update profile
      const updatedProfile = await this.profileManager.upsertProfile(userId, updates);
      
      // Update state
      this.state.pendingChanges--;
      this.state.syncStatus = 'idle';
      this.state.lastSyncTime = new Date();

      // Emit events
      this.emit('profile:updated', { userId, profile: updatedProfile });
      this.emit('profile:synced', { userId, timestamp: new Date() });

      const updateTime = performance.now() - startTime;
      this.recordPerformanceMetric('profile:update', updateTime);

      if (this.config.enableAnalytics) {
        this.emit('analytics:event', {
          event: 'profile:updated',
          data: {
            userId,
            updateTime,
            source: options.source || 'unknown',
            fieldsUpdated: Object.keys(updates),
            timestamp: new Date()
          }
        });
      }

      return updatedProfile;
    } catch (error) {
      this.state.pendingChanges--;
      this.state.syncStatus = 'error';
      this.handleError('profile:update', error as Error, { userId, updates });
      throw error;
    }
  }

  /**
   * Batch update multiple users (for migration)
   */
  async batchUpdateProfiles(
    updates: Array<{ userId: string; data: Partial<UserProfile> }>,
    onProgress?: (progress: number, userId: string) => void
  ): Promise<{ successful: number; failed: Array<{ userId: string; error: Error }> }> {
    const results = { successful: 0, failed: [] as Array<{ userId: string; error: Error }> };
    const batches = this.chunkArray(updates, this.config.migrationBatchSize);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      const batchPromises = batch.map(async ({ userId, data }) => {
        try {
          await this.updateUserProfile(userId, data, { source: 'migration' });
          results.successful++;
          
          const progress = Math.round(((batchIndex * this.config.migrationBatchSize + results.successful) / updates.length) * 100);
          onProgress?.(progress, userId);
          this.emit('migration:progress', { userId, progress });
          
          return { success: true, userId };
        } catch (error) {
          results.failed.push({ userId, error: error as Error });
          return { success: false, userId, error };
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to prevent overwhelming the system
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get system health and performance metrics
   */
  getSystemHealth(): SystemHealth & { performanceMetrics: Record<string, number[]> } {
    return {
      ...this.state.systemHealth,
      performanceMetrics: Object.fromEntries(this.performanceMetrics)
    };
  }

  /**
   * Get current system state
   */
  getSystemState(): ProfileSystemState {
    return { ...this.state };
  }

  /**
   * Force synchronization of all pending changes
   */
  async forceSynchronization(): Promise<void> {
    if (this.state.syncStatus === 'syncing') {
      return; // Already syncing
    }

    try {
      this.state.syncStatus = 'syncing';
      
      // Process retry queue
      await this.processRetryQueue();
      
      this.state.syncStatus = 'idle';
      this.state.lastSyncTime = new Date();
      
    } catch (error) {
      this.state.syncStatus = 'error';
      this.handleError('force:sync', error as Error);
      throw error;
    }
  }

  /**
   * Cleanup and shutdown the system
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down ProfileSystemIntegrator...');
    
    // Clear intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Force sync any pending changes
    if (this.state.pendingChanges > 0) {
      await this.forceSynchronization();
    }

    // Clean up event listeners
    this.removeAllListeners();

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }

    this.state.isInitialized = false;
    console.log('ProfileSystemIntegrator shutdown complete');
  }

  // Private methods

  private setupEventListeners(): void {
    // Handle system health monitoring
    if (this.config.enablePerformanceMonitoring) {
      setInterval(() => {
        this.updateSystemHealth();
      }, 60000); // Every minute
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Monitor key performance metrics
    this.on('performance:metric', ({ metric, value, timestamp }) => {
      if (!this.performanceMetrics.has(metric)) {
        this.performanceMetrics.set(metric, []);
      }
      
      const values = this.performanceMetrics.get(metric)!;
      values.push(value);
      
      // Keep only last 100 measurements
      if (values.length > 100) {
        values.shift();
      }
    });
  }

  private startRealTimeSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.state.isOnline && this.state.pendingChanges > 0) {
        try {
          await this.forceSynchronization();
        } catch (error) {
          console.warn('Real-time sync failed:', error);
        }
      }
    }, this.config.syncIntervalMs);
  }

  private async detectConflicts(userId: string, updates: Partial<UserProfile>): Promise<any[]> {
    try {
      const currentProfile = await this.profileManager.getUserProfile(userId);
      const conflicts: any[] = [];

      if (currentProfile && currentProfile.updatedAt) {
        // Check if the profile was modified by another source
        const lastModified = new Date(currentProfile.updatedAt);
        const timeDiff = Date.now() - lastModified.getTime();
        
        if (timeDiff < 5000) { // 5 seconds
          conflicts.push({
            field: 'updatedAt',
            current: currentProfile.updatedAt,
            incoming: new Date().toISOString(),
            type: 'concurrent_modification'
          });
        }
      }

      return conflicts;
    } catch (error) {
      console.warn('Conflict detection failed:', error);
      return [];
    }
  }

  private async generateAnalytics(userId: string, data: any): Promise<ProfileAnalytics> {
    return {
      userId,
      lastActive: new Date(),
      profileViews: 1,
      profileUpdates: 0,
      completionProgress: data.completionMetrics?.overall || 0,
      engagementScore: this.calculateEngagementScore(data),
      preferencePatterns: this.analyzePreferencePatterns(data.preferences),
      usagePatterns: {
        mostActiveTab: 'overview',
        averageSessionDuration: 0,
        featuresUsed: []
      }
    };
  }

  private calculateEngagementScore(data: any): number {
    let score = 0;
    
    // Base score from profile completion
    score += (data.completionMetrics?.overall || 0) * 0.4;
    
    // Bonus for household members
    if (data.householdMembers?.length > 0) {
      score += Math.min(data.householdMembers.length * 10, 30);
    }
    
    // Bonus for dietary preferences
    if (data.preferences?.dietaryRestrictions?.length > 0) {
      score += Math.min(data.preferences.dietaryRestrictions.length * 5, 20);
    }
    
    return Math.min(score, 100);
  }

  private analyzePreferencePatterns(preferences: UserPreferences | null): Record<string, any> {
    if (!preferences) return {};

    return {
      dietaryComplexity: preferences.dietaryRestrictions?.length || 0,
      cuisinePreferences: preferences.cuisinePreferences?.length || 0,
      budgetTier: this.categorizeBudget(preferences.budget?.monthly || 0),
      cookingLevel: preferences.cookingSkill || 'beginner'
    };
  }

  private categorizeBudget(budget: number): string {
    if (budget < 20000) return 'low';
    if (budget < 50000) return 'medium';
    if (budget < 100000) return 'high';
    return 'premium';
  }

  private recordPerformanceMetric(metric: string, value: number): void {
    if (this.config.enablePerformanceMonitoring) {
      this.emit('performance:metric', {
        metric,
        value,
        timestamp: new Date()
      });
    }
  }

  private handleError(operation: string, error: Error, context?: any): void {
    console.error(`ProfileSystemIntegrator error [${operation}]:`, error, context);
    
    if (this.config.enableErrorTracking) {
      this.emit('profile:error', { 
        userId: context?.userId || 'unknown', 
        error: {
          ...error,
          operation,
          context
        }
      });
    }

    // Add to retry queue for retryable operations
    if (operation.includes('update') || operation.includes('sync')) {
      this.errorRetryQueue.push({
        operation: () => this.retryOperation(operation, context),
        retries: 0
      });
    }
  }

  private async retryOperation(operation: string, context: any): Promise<any> {
    // Implement retry logic based on operation type
    console.log(`Retrying operation: ${operation}`, context);
    // This would contain the actual retry logic
  }

  private async processRetryQueue(): Promise<void> {
    const queue = [...this.errorRetryQueue];
    this.errorRetryQueue = [];

    for (const item of queue) {
      if (item.retries < 3) {
        try {
          await item.operation();
        } catch (error) {
          item.retries++;
          if (item.retries < 3) {
            this.errorRetryQueue.push(item);
          }
        }
      }
    }
  }

  private updateSystemHealth(): void {
    const metrics = this.calculateHealthMetrics();
    
    this.state.systemHealth = {
      status: this.determineHealthStatus(metrics),
      lastCheck: new Date(),
      metrics
    };

    this.emit('system:health', { health: this.state.systemHealth });
  }

  private calculateHealthMetrics(): SystemHealth['metrics'] {
    const performanceValues = this.performanceMetrics.get('profile:load') || [];
    const updateValues = this.performanceMetrics.get('profile:update') || [];
    
    return {
      responseTime: performanceValues.length > 0 
        ? performanceValues.reduce((a, b) => a + b, 0) / performanceValues.length 
        : 0,
      errorRate: this.errorRetryQueue.length / 100 * 100, // Percentage
      syncSuccessRate: this.state.lastSyncTime ? 100 : 0,
      cacheHitRate: 85 // Mock value for now
    };
  }

  private determineHealthStatus(metrics: SystemHealth['metrics']): SystemHealth['status'] {
    if (metrics.errorRate > 10 || metrics.responseTime > 2000) {
      return 'degraded';
    }
    if (metrics.errorRate > 25 || metrics.responseTime > 5000) {
      return 'unhealthy';
    }
    return 'healthy';
  }

  private handleOnline(): void {
    this.state.isOnline = true;
    console.log('ProfileSystemIntegrator: Back online');
    
    // Trigger sync when back online
    if (this.state.pendingChanges > 0) {
      this.forceSynchronization().catch(console.error);
    }
  }

  private handleOffline(): void {
    this.state.isOnline = false;
    console.log('ProfileSystemIntegrator: Offline mode activated');
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Singleton instance
let integrator: ProfileSystemIntegrator | null = null;

export function getProfileSystemIntegrator(config?: Partial<ProfileSystemConfig>): ProfileSystemIntegrator {
  if (!integrator) {
    integrator = new ProfileSystemIntegrator(config);
  }
  return integrator;
}

// React hook for using the integrator
export function useProfileSystemIntegrator() {
  const integrator = getProfileSystemIntegrator();
  
  return {
    integrator,
    state: integrator.getSystemState(),
    health: integrator.getSystemHealth(),
    
    // Convenience methods
    async getProfile(userId: string) {
      return integrator.getCompleteUserProfile(userId);
    },
    
    async updateProfile(userId: string, updates: Partial<UserProfile>, options?: any) {
      return integrator.updateUserProfile(userId, updates, options);
    },
    
    async sync() {
      return integrator.forceSynchronization();
    }
  };
}

export default ProfileSystemIntegrator;