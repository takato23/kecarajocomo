import { QueueProcessor, QueuedItem } from './OfflineQueue';
import { getProfileManager } from '@/services/profile/ProfileManager';
import { getHolisticSystem } from '@/services/core/HolisticSystem';
import type { UserProfile } from '@/services/profile/ProfileManager';

/**
 * Profile save processor for offline queue
 */
export const profileSaveProcessor: QueueProcessor = {
  process: async (item: QueuedItem) => {
    const { data } = item;
    
    if (!data || !data.userId || !data.profile) {
      throw new Error('Invalid profile save data');
    }

    const profileManager = getProfileManager(getHolisticSystem());
    await profileManager.upsertProfile(data.userId, data.profile);
  },

  validate: (item: QueuedItem) => {
    // Check if the item is still relevant
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const age = Date.now() - item.createdAt;
    
    if (age > maxAge) {
      return false; // Too old, discard
    }

    // Validate data structure
    return !!(item.data?.userId && item.data?.profile);
  },

  transform: (item: QueuedItem) => {
    // Add any necessary transformations
    // For example, ensure timestamps are current
    if (item.data?.profile) {
      item.data.profile.updatedAt = new Date().toISOString();
    }
    
    return item;
  }
};

/**
 * Batch profile updates processor
 */
export const batchProfileUpdateProcessor: QueueProcessor = {
  process: async (item: QueuedItem) => {
    const { data } = item;
    
    if (!data || !Array.isArray(data.updates)) {
      throw new Error('Invalid batch update data');
    }

    const profileManager = getProfileManager(getHolisticSystem());
    
    // Process updates in sequence to avoid conflicts
    for (const update of data.updates) {
      if (update.userId && update.profile) {
        await profileManager.upsertProfile(update.userId, update.profile);
      }
    }
  },

  validate: (item: QueuedItem) => {
    return !!(item.data?.updates && Array.isArray(item.data.updates));
  }
};

/**
 * Dietary restrictions update processor
 */
export const dietaryRestrictionsProcessor: QueueProcessor = {
  process: async (item: QueuedItem) => {
    const { data } = item;
    
    if (!data || !data.userId || !Array.isArray(data.restrictions)) {
      throw new Error('Invalid dietary restrictions data');
    }

    const profileManager = getProfileManager(getHolisticSystem());
    await profileManager.updateDietaryRestrictions(data.userId, data.restrictions);
  },

  validate: (item: QueuedItem) => {
    return !!(item.data?.userId && Array.isArray(item.data?.restrictions));
  }
};

/**
 * Allergies update processor  
 */
export const allergiesProcessor: QueueProcessor = {
  process: async (item: QueuedItem) => {
    const { data } = item;
    
    if (!data || !data.userId || !Array.isArray(data.allergies)) {
      throw new Error('Invalid allergies data');
    }

    const profileManager = getProfileManager(getHolisticSystem());
    await profileManager.updateAllergies(data.userId, data.allergies);
  },

  validate: (item: QueuedItem) => {
    return !!(item.data?.userId && Array.isArray(item.data?.allergies));
  }
};

/**
 * Initialize offline queue with profile processors
 */
export function initializeOfflineProcessors(offlineQueue: any) {
  // Register processors with pattern matching
  offlineQueue.registerProcessor('profile_save*', profileSaveProcessor);
  offlineQueue.registerProcessor('profile_batch*', batchProfileUpdateProcessor);
  offlineQueue.registerProcessor('dietary_restrictions*', dietaryRestrictionsProcessor);
  offlineQueue.registerProcessor('allergies*', allergiesProcessor);
  
  // Generic profile processor for any profile-related operation
  offlineQueue.registerProcessor('profile_*', profileSaveProcessor);
}

/**
 * Helper function to create profile save queue item data
 */
export function createProfileSaveData(userId: string, profile: Partial<UserProfile>) {
  return {
    userId,
    profile: {
      ...profile,
      updatedAt: new Date().toISOString()
    },
    timestamp: Date.now()
  };
}

/**
 * Helper function to create batch update data
 */
export function createBatchUpdateData(updates: Array<{ userId: string; profile: Partial<UserProfile> }>) {
  return {
    updates: updates.map(update => ({
      ...update,
      profile: {
        ...update.profile,
        updatedAt: new Date().toISOString()
      }
    })),
    timestamp: Date.now()
  };
}

/**
 * Utility to check queue status and provide user feedback
 */
export async function getQueueStatus(offlineQueue: any) {
  const stats = await offlineQueue.getQueueStats();
  
  return {
    hasOfflineChanges: stats.pending > 0 || stats.processing > 0,
    pendingCount: stats.pending,
    processingCount: stats.processing,
    failedCount: stats.failed,
    message: stats.pending > 0 
      ? `${stats.pending} cambios pendientes de sincronización`
      : stats.failed > 0
      ? `${stats.failed} cambios fallaron al sincronizar`
      : 'Todos los cambios están sincronizados'
  };
}