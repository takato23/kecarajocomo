'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AutoSaveManager, type AutoSaveConfig, type SaveState } from '@/services/profile/AutoSaveManager';
import { OfflineQueue } from '@/lib/offline/OfflineQueue';

export interface UseAutoSaveOptions<T> {
  /** Auto-save configuration */
  config?: Partial<AutoSaveConfig>;
  /** Save function - must return a promise */
  onSave: (data: T) => Promise<void>;
  /** Function to validate data before saving */
  onValidate?: (data: T) => boolean | string;
  /** Callback when save state changes */
  onStateChange?: (state: SaveState) => void;
  /** Enable offline support */
  enableOffline?: boolean;
  /** Unique key for offline storage */
  storageKey?: string;
  /** Enable conflict detection */
  enableConflictDetection?: boolean;
  /** Function to resolve conflicts */
  onConflict?: (localData: T, serverData: T) => Promise<T>;
}

export interface AutoSaveReturn<T> {
  /** Current save state */
  saveState: SaveState;
  /** Force immediate save */
  forceSave: () => Promise<void>;
  /** Update data and trigger auto-save */
  updateData: (data: T) => void;
  /** Check if there are pending changes */
  hasPendingChanges: boolean;
  /** Manual save without debounce */
  manualSave: () => Promise<void>;
  /** Clear pending changes */
  clearPendingChanges: () => void;
  /** Get recovery data if available */
  getRecoveryData: () => T | null;
  /** Retry failed saves */
  retryFailedSaves: () => Promise<void>;
}

/**
 * Hook for automatic saving with debouncing, offline support, and conflict resolution
 */
export function useAutoSave<T>(
  initialData: T,
  options: UseAutoSaveOptions<T>
): AutoSaveReturn<T> {
  const {
    config = {},
    onSave,
    onValidate,
    onStateChange,
    enableOffline = true,
    storageKey = 'autosave',
    enableConflictDetection = true,
    onConflict
  } = options;

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  const autoSaveManagerRef = useRef<AutoSaveManager<T> | null>(null);
  const offlineQueueRef = useRef<OfflineQueue | null>(null);
  const currentDataRef = useRef<T>(initialData);
  const lastSavedDataRef = useRef<string>(JSON.stringify(initialData));

  // Initialize managers
  useEffect(() => {
    const fullConfig: AutoSaveConfig = {
      debounceMs: 1000,
      maxRetries: 3,
      retryDelayMs: 2000,
      enableLocalStorage: true,
      enableConflictDetection,
      ...config
    };

    autoSaveManagerRef.current = new AutoSaveManager<T>(fullConfig);
    
    if (enableOffline) {
      offlineQueueRef.current = new OfflineQueue();
    }

    return () => {
      autoSaveManagerRef.current?.cleanup();
    };
  }, [config, enableOffline, enableConflictDetection]);

  // Handle state changes
  const handleStateChange = useCallback((newState: SaveState) => {
    setSaveState(newState);
    onStateChange?.(newState);

    // Update pending changes based on state
    if (newState === 'saved') {
      setHasPendingChanges(false);
      lastSavedDataRef.current = JSON.stringify(currentDataRef.current);
    } else if (newState === 'error' || newState === 'conflict') {
      setHasPendingChanges(true);
    }
  }, [onStateChange]);

  // Save function with validation and error handling
  const performSave = useCallback(async (data: T): Promise<void> => {
    try {
      // Validate data if validator provided
      if (onValidate) {
        const validationResult = onValidate(data);
        if (validationResult !== true) {
          const errorMessage = typeof validationResult === 'string' 
            ? validationResult 
            : 'Datos inválidos';
          throw new Error(errorMessage);
        }
      }

      // Check if we're offline and queue the save
      if (enableOffline && offlineQueueRef.current && !navigator.onLine) {
        await offlineQueueRef.current.enqueue(`${storageKey}_save`, {
          action: 'save',
          data,
          timestamp: Date.now()
        });
        
        handleStateChange('offline');
        toast.info('Guardado offline - se sincronizará cuando recupere conexión');
        return;
      }

      // Perform the actual save
      await onSave(data);
      
    } catch (error) {
      console.error('Error en auto-save:', error);
      throw error;
    }
  }, [onSave, onValidate, enableOffline, storageKey, handleStateChange]);

  // Initialize auto-save manager with save function
  useEffect(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.initialize(
        performSave,
        handleStateChange,
        storageKey
      );
    }
  }, [performSave, handleStateChange, storageKey]);

  // Update data and trigger auto-save
  const updateData = useCallback((newData: T) => {
    currentDataRef.current = newData;
    
    // Check if data actually changed
    const newDataStr = JSON.stringify(newData);
    const hasChanged = newDataStr !== lastSavedDataRef.current;
    
    setHasPendingChanges(hasChanged);
    
    if (hasChanged && autoSaveManagerRef.current) {
      autoSaveManagerRef.current.scheduleAutoSave(newData);
    }
  }, []);

  // Force immediate save
  const forceSave = useCallback(async (): Promise<void> => {
    if (autoSaveManagerRef.current) {
      await autoSaveManagerRef.current.forceSave(currentDataRef.current);
    }
  }, []);

  // Manual save without debounce
  const manualSave = useCallback(async (): Promise<void> => {
    if (autoSaveManagerRef.current) {
      handleStateChange('saving');
      try {
        await performSave(currentDataRef.current);
        handleStateChange('saved');
        toast.success('Guardado exitosamente');
      } catch (error) {
        handleStateChange('error');
        toast.error(error instanceof Error ? error.message : 'Error al guardar');
        throw error;
      }
    }
  }, [performSave, handleStateChange]);

  // Clear pending changes
  const clearPendingChanges = useCallback(() => {
    setHasPendingChanges(false);
    lastSavedDataRef.current = JSON.stringify(currentDataRef.current);
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.clearPendingChanges();
    }
  }, []);

  // Get recovery data
  const getRecoveryData = useCallback((): T | null => {
    if (autoSaveManagerRef.current) {
      return autoSaveManagerRef.current.getBackupData();
    }
    return null;
  }, []);

  // Retry failed saves
  const retryFailedSaves = useCallback(async (): Promise<void> => {
    if (offlineQueueRef.current) {
      try {
        handleStateChange('saving');
        await offlineQueueRef.current.processQueue();
        handleStateChange('saved');
        toast.success('Guardado sincronizado exitosamente');
      } catch (error) {
        handleStateChange('error');
        toast.error('Error al sincronizar guardado');
        throw error;
      }
    }
  }, [handleStateChange]);

  // Handle online/offline status
  useEffect(() => {
    if (!enableOffline) return;

    const handleOnline = async () => {
      if (offlineQueueRef.current && (await offlineQueueRef.current.hasQueuedItems())) {
        toast.info('Conexión restaurada - sincronizando cambios...');
        try {
          await retryFailedSaves();
        } catch (error) {
          console.error('Error al sincronizar al volver online:', error);
        }
      }
    };

    const handleOffline = () => {
      toast.warning('Sin conexión - los cambios se guardarán localmente');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOffline, retryFailedSaves]);

  // Handle conflict resolution
  useEffect(() => {
    if (!autoSaveManagerRef.current || !onConflict) return;

    const handleConflict = async (localData: T, serverData: T) => {
      try {
        handleStateChange('conflict');
        const resolvedData = await onConflict(localData, serverData);
        currentDataRef.current = resolvedData;
        await forceSave();
      } catch (error) {
        console.error('Error resolviendo conflicto:', error);
        handleStateChange('error');
      }
    };

    autoSaveManagerRef.current.onConflict = handleConflict;
  }, [onConflict, handleStateChange, forceSave]);

  // Handle page visibility for immediate save on hide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasPendingChanges && autoSaveManagerRef.current) {
        // Force save when page becomes hidden
        autoSaveManagerRef.current.forceSave(currentDataRef.current).catch(error => {
          console.error('Error en guardado al ocultar página:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasPendingChanges]);

  // Handle beforeunload for unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasPendingChanges]);

  return {
    saveState,
    forceSave,
    updateData,
    hasPendingChanges,
    manualSave,
    clearPendingChanges,
    getRecoveryData,
    retryFailedSaves
  };
}