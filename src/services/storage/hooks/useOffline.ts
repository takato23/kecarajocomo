/**
 * useOffline Hook
 * React hook for handling offline functionality
 */

import { useState, useEffect, useCallback } from 'react';

import { getStorageService } from '../UnifiedStorageService';

export interface UseOfflineReturn {
  // State
  isOnline: boolean;
  queueSize: number;
  
  // Actions
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  
  // Utilities
  getQueuedOperations: () => any[];
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [queueSize, setQueueSize] = useState(0);
  
  const storageService = getStorageService();

  // Set up online/offline listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically process queue when coming back online
      processQueue().catch(err => {
        console.error('Failed to process offline queue:', err);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Storage service events
    const handleStorageOnline = () => {
      setIsOnline(true);
    };

    const handleStorageOffline = () => {
      setIsOnline(false);
    };

    // Network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Storage service events
    storageService.on('online', handleStorageOnline);
    storageService.on('offline', handleStorageOffline);

    // Check queue size periodically
    const interval = setInterval(() => {
      updateQueueSize();
    }, 5000); // Every 5 seconds

    // Initial queue size
    updateQueueSize();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      storageService.off('online', handleStorageOnline);
      storageService.off('offline', handleStorageOffline);
      clearInterval(interval);
    };
  }, [storageService]);

  const updateQueueSize = useCallback(() => {
    // This would need to be exposed by the storage service
    // For now, we'll estimate based on localStorage
    if (typeof window !== 'undefined') {
      const queueData = localStorage.getItem('kcc_offline_queue');
      if (queueData) {
        try {
          const parsed = JSON.parse(queueData);
          setQueueSize(parsed.operations?.length || 0);
        } catch {
          setQueueSize(0);
        }
      } else {
        setQueueSize(0);
      }
    }
  }, []);

  const processQueue = useCallback(async (): Promise<void> => {
    try {
      await storageService.processOfflineQueue();
      updateQueueSize();
    } catch (error: unknown) {
      console.error('Failed to process offline queue:', error);
      throw error;
    }
  }, [storageService, updateQueueSize]);

  const clearQueue = useCallback((): void => {
    // This would need to be exposed by the storage service
    // For now, we'll clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kcc_offline_queue');
      setQueueSize(0);
    }
  }, []);

  const getQueuedOperations = useCallback((): any[] => {
    // This would need to be exposed by the storage service
    // For now, we'll read from localStorage
    if (typeof window !== 'undefined') {
      const queueData = localStorage.getItem('kcc_offline_queue');
      if (queueData) {
        try {
          const parsed = JSON.parse(queueData);
          return parsed.operations || [];
        } catch {
          return [];
        }
      }
    }
    return [];
  }, []);

  return {
    // State
    isOnline,
    queueSize,
    
    // Actions
    processQueue,
    clearQueue,
    
    // Utilities
    getQueuedOperations,
  };
}