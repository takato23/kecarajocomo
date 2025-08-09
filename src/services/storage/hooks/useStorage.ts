/**
 * useStorage Hook
 * React hook for using the unified storage service
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/services/logger';

import { getStorageService } from '../UnifiedStorageService';
import {
  StorageConfig,
  StorageItem,
  StorageMetadata,
  StorageQuery,
  StorageError,
  StorageProvider,
} from '../types';

export interface UseStorageOptions extends Partial<StorageConfig> {
  onError?: (error: StorageError) => void;
  onChange?: (key: string, value: any, operation: 'set' | 'delete') => void;
  autoSync?: boolean;
  namespace?: string;
}

export interface UseStorageReturn<T = any> {
  // State
  isLoading: boolean;
  error: StorageError | null;
  
  // Basic operations
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T, metadata?: Partial<StorageMetadata>) => Promise<void>;
  remove: (key: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  
  // Batch operations
  getMany: (keys: string[]) => Promise<Array<T | null>>;
  setMany: (items: Array<{ key: string; value: T; metadata?: Partial<StorageMetadata> }>) => Promise<void>;
  removeMany: (keys: string[]) => Promise<void>;
  
  // Query operations
  query: (query: StorageQuery) => Promise<StorageItem<T>[]>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  
  // Utilities
  size: () => Promise<{ used: number; limit?: number }>;
  switchProvider: (provider: StorageProvider) => Promise<void>;
  
  // Helpers
  createKey: (...parts: string[]) => string;
}

export function useStorage<T = any>(options: UseStorageOptions = {}): UseStorageReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);
  
  const storageService = getStorageService(options);
  const optionsRef = useRef(options);
  const namespace = options.namespace || 'default';
  
  // Update options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Set up event listeners
  useEffect(() => {
    const handleChange = (event: any) => {
      optionsRef.current.onChange?.(event.key, event.value, event.operation);
    };

    storageService.on('change', handleChange);
    
    return () => {
      storageService.off('change', handleChange);
    };
  }, [storageService]);

  // Auto-sync setup
  useEffect(() => {
    if (options.autoSync) {
      storageService.enableSync().catch(err => {
        logger.error('Failed to enable auto-sync:', 'useStorage', err);
      });
    }
    
    return () => {
      if (options.autoSync) {
        storageService.disableSync().catch(err => {
          logger.error('Failed to disable auto-sync:', 'useStorage', err);
        });
      }
    };
  }, [options.autoSync, storageService]);

  const handleError = useCallback((err: any) => {
    const error = err instanceof StorageError ? err : new StorageError(
      err.message || 'Storage operation failed',
      'UNKNOWN'
    );
    setError(error);
    optionsRef.current.onError?.(error);
    throw error;
  }, []);

  const createKey = useCallback((...parts: string[]) => {
    return [namespace, ...parts].filter(Boolean).join(':');
  }, [namespace]);

  const get = useCallback(async (key: string): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fullKey = createKey(key);
      const result = await storageService.get<T>(fullKey);
      return result;
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService, createKey, handleError]);

  const set = useCallback(async (
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fullKey = createKey(key);
      await storageService.set(fullKey, value, metadata);
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService, createKey, handleError]);

  const remove = useCallback(async (key: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fullKey = createKey(key);
      await storageService.delete(fullKey);
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService, createKey, handleError]);

  const has = useCallback(async (key: string): Promise<boolean> => {
    try {
      const fullKey = createKey(key);
      const value = await storageService.get(fullKey);
      return value !== null;
    } catch (err: unknown) {
      logger.error('Storage has error:', 'useStorage', err);
      return false;
    }
  }, [storageService, createKey]);

  const getMany = useCallback(async (keys: string[]): Promise<Array<T | null>> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const promises = keys.map(key => get(key).catch(() => null));
      const results = await Promise.all(promises);
      return results;
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [get, handleError]);

  const setMany = useCallback(async (
    items: Array<{ key: string; value: T; metadata?: Partial<StorageMetadata> }>
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const promises = items.map(item => set(item.key, item.value, item.metadata));
      await Promise.all(promises);
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [set, handleError]);

  const removeMany = useCallback(async (keys: string[]): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const promises = keys.map(key => remove(key));
      await Promise.all(promises);
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [remove, handleError]);

  const query = useCallback(async (queryOptions: StorageQuery): Promise<StorageItem<T>[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const namespaceQuery = {
        ...queryOptions,
        prefix: queryOptions.prefix ? createKey(queryOptions.prefix) : createKey(),
      };
      const results = await storageService.query<T>(namespaceQuery);
      
      // Remove namespace from keys
      return results.map(item => ({
        ...item,
        key: item.key.replace(`${namespace}:`, ''),
      }));
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService, createKey, namespace, handleError]);

  const keys = useCallback(async (): Promise<string[]> => {
    const items = await query({});
    return items.map(item => item.key);
  }, [query]);

  const clear = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Only clear items in this namespace
      const items = await query({});
      const fullKeys = items.map(item => createKey(item.key));
      
      for (const key of fullKeys) {
        await storageService.delete(key);
      }
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService, query, createKey, handleError]);

  const size = useCallback(async (): Promise<{ used: number; limit?: number }> => {
    try {
      return await storageService.getSize();
    } catch (err: unknown) {
      throw handleError(err);
    }
  }, [storageService, handleError]);

  const switchProvider = useCallback(async (provider: StorageProvider): Promise<void> => {
    try {
      await storageService.switchProvider(provider);
    } catch (err: unknown) {
      throw handleError(err);
    }
  }, [storageService, handleError]);

  return {
    // State
    isLoading,
    error,
    
    // Basic operations
    get,
    set,
    remove,
    has,
    
    // Batch operations
    getMany,
    setMany,
    removeMany,
    
    // Query operations
    query,
    keys,
    clear,
    
    // Utilities
    size,
    switchProvider,
    
    // Helpers
    createKey,
  };
}