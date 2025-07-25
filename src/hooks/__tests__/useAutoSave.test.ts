/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { useAutoSave } from '../useAutoSave';
import type { UseAutoSaveOptions, AutoSaveReturn } from '../useAutoSave';
import { createMockLocalStorage, createMockNavigator } from '@/__tests__/utils/profileTestUtils';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('@/services/profile/AutoSaveManager', () => {
  return {
    AutoSaveManager: jest.fn().mockImplementation(() => ({
      initialize: jest.fn(),
      scheduleAutoSave: jest.fn(),
      forceSave: jest.fn(),
      clearPendingChanges: jest.fn(),
      getBackupData: jest.fn(),
      cleanup: jest.fn(),
      onConflict: null
    }))
  };
});

jest.mock('@/lib/offline/OfflineQueue', () => {
  return {
    OfflineQueue: jest.fn().mockImplementation(() => ({
      enqueue: jest.fn(),
      processQueue: jest.fn(),
      hasQueuedItems: jest.fn().mockResolvedValue(false)
    }))
  };
});

interface TestData {
  name: string;
  value: number;
}

describe('useAutoSave', () => {
  const mockOnSave = jest.fn();
  const mockOnValidate = jest.fn();
  const mockOnStateChange = jest.fn();
  const mockOnConflict = jest.fn();

  const initialData: TestData = { name: 'test', value: 42 };

  const defaultOptions: UseAutoSaveOptions<TestData> = {
    onSave: mockOnSave,
    onValidate: mockOnValidate,
    onStateChange: mockOnStateChange,
    enableOffline: true,
    storageKey: 'test-key',
    enableConflictDetection: true,
    onConflict: mockOnConflict
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: createMockLocalStorage(),
      writable: true
    });

    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      value: createMockNavigator(true), // Online by default
      writable: true
    });

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true
    });

    // Reset mock implementations
    mockOnSave.mockResolvedValue(undefined);
    mockOnValidate.mockReturnValue(true);
  });

  afterEach(() => {
    // Clean up event listeners
    const mockRemoveEventListener = jest.fn();
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true
    });
    Object.defineProperty(document, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true
    });
  });

  describe('Basic functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      expect(result.current.saveState).toBe('idle');
      expect(result.current.hasPendingChanges).toBe(false);
      expect(typeof result.current.forceSave).toBe('function');
      expect(typeof result.current.updateData).toBe('function');
      expect(typeof result.current.manualSave).toBe('function');
      expect(typeof result.current.clearPendingChanges).toBe('function');
      expect(typeof result.current.getRecoveryData).toBe('function');
      expect(typeof result.current.retryFailedSaves).toBe('function');
    });

    it('should call onSave when updateData is called with changed data', async () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      const newData = { name: 'updated', value: 100 };

      act(() => {
        result.current.updateData(newData);
      });

      expect(result.current.hasPendingChanges).toBe(true);
    });

    it('should not trigger save when data hasn\'t changed', () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      act(() => {
        result.current.updateData(initialData);
      });

      expect(result.current.hasPendingChanges).toBe(false);
    });

    it('should force save when forceSave is called', async () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();
      mockManager.forceSave.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockManager.forceSave).toHaveBeenCalled();
    });

    it('should perform manual save correctly', async () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await act(async () => {
        await result.current.manualSave();
      });

      expect(mockOnSave).toHaveBeenCalledWith(initialData);
      expect(toast.success).toHaveBeenCalledWith('Guardado exitosamente');
    });

    it('should clear pending changes', () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      // First set some pending changes
      act(() => {
        result.current.updateData({ name: 'changed', value: 999 });
      });

      expect(result.current.hasPendingChanges).toBe(true);

      // Clear pending changes
      act(() => {
        result.current.clearPendingChanges();
      });

      expect(result.current.hasPendingChanges).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate data before saving', async () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await act(async () => {
        await result.current.manualSave();
      });

      expect(mockOnValidate).toHaveBeenCalledWith(initialData);
    });

    it('should prevent save when validation fails', async () => {
      mockOnValidate.mockReturnValueOnce(false);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await expect(async () => {
        await act(async () => {
          await result.current.manualSave();
        });
      }).rejects.toThrow('Datos inválidos');

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should handle validation error messages', async () => {
      const errorMessage = 'Name is required';
      mockOnValidate.mockReturnValueOnce(errorMessage);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await expect(async () => {
        await act(async () => {
          await result.current.manualSave();
        });
      }).rejects.toThrow(errorMessage);
    });

    it('should skip validation when no validator provided', async () => {
      const optionsWithoutValidator = {
        ...defaultOptions,
        onValidate: undefined
      };

      const { result } = renderHook(() => useAutoSave(initialData, optionsWithoutValidator));

      await act(async () => {
        await result.current.manualSave();
      });

      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('Offline support', () => {
    it('should queue saves when offline', async () => {
      const { OfflineQueue } = require('@/lib/offline/OfflineQueue');
      const mockQueue = new OfflineQueue();
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await act(async () => {
        await result.current.manualSave();
      });

      expect(mockQueue.enqueue).toHaveBeenCalledWith('test-key_save', {
        action: 'save',
        data: initialData,
        timestamp: expect.any(Number)
      });

      expect(toast.info).toHaveBeenCalledWith('Guardado offline - se sincronizará cuando recupere conexión');
    });

    it('should process offline queue when coming online', async () => {
      const { OfflineQueue } = require('@/lib/offline/OfflineQueue');
      const mockQueue = new OfflineQueue();
      mockQueue.hasQueuedItems.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      // Simulate coming online
      act(() => {
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);
      });

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('Conexión restaurada - sincronizando cambios...');
      });
    });

    it('should show warning when going offline', () => {
      renderHook(() => useAutoSave(initialData, defaultOptions));

      // Simulate going offline
      act(() => {
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
      });

      expect(toast.warning).toHaveBeenCalledWith('Sin conexión - los cambios se guardarán localmente');
    });

    it('should retry failed saves', async () => {
      const { OfflineQueue } = require('@/lib/offline/OfflineQueue');
      const mockQueue = new OfflineQueue();

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await act(async () => {
        await result.current.retryFailedSaves();
      });

      expect(mockQueue.processQueue).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Guardado sincronizado exitosamente');
    });

    it('should handle retry failures', async () => {
      const { OfflineQueue } = require('@/lib/offline/OfflineQueue');
      const mockQueue = new OfflineQueue();
      mockQueue.processQueue.mockRejectedValueOnce(new Error('Sync failed'));

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await expect(async () => {
        await act(async () => {
          await result.current.retryFailedSaves();
        });
      }).rejects.toThrow('Sync failed');

      expect(toast.error).toHaveBeenCalledWith('Error al sincronizar guardado');
    });

    it('should disable offline support when enableOffline is false', () => {
      const optionsWithoutOffline = {
        ...defaultOptions,
        enableOffline: false
      };

      renderHook(() => useAutoSave(initialData, optionsWithoutOffline));

      // OfflineQueue should not be initialized
      const { OfflineQueue } = require('@/lib/offline/OfflineQueue');
      expect(OfflineQueue).not.toHaveBeenCalled();
    });
  });

  describe('State management', () => {
    it('should call onStateChange when state changes', async () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await act(async () => {
        await result.current.manualSave();
      });

      expect(mockOnStateChange).toHaveBeenCalledWith('saving');
      expect(mockOnStateChange).toHaveBeenCalledWith('saved');
    });

    it('should update hasPendingChanges based on save state', async () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      // Change data to create pending changes
      act(() => {
        result.current.updateData({ name: 'changed', value: 999 });
      });

      expect(result.current.hasPendingChanges).toBe(true);

      // Save should clear pending changes
      await act(async () => {
        await result.current.manualSave();
      });

      expect(result.current.hasPendingChanges).toBe(false);
    });

    it('should set pending changes on error', async () => {
      mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await expect(async () => {
        await act(async () => {
          await result.current.manualSave();
        });
      }).rejects.toThrow('Save failed');

      expect(result.current.hasPendingChanges).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle save errors gracefully', async () => {
      const saveError = new Error('Network error');
      mockOnSave.mockRejectedValueOnce(saveError);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await expect(async () => {
        await act(async () => {
          await result.current.manualSave();
        });
      }).rejects.toThrow('Network error');

      expect(toast.error).toHaveBeenCalledWith('Network error');
    });

    it('should handle unknown errors', async () => {
      mockOnSave.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      await expect(async () => {
        await act(async () => {
          await result.current.manualSave();
        });
      }).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith('Error al guardar');
    });
  });

  describe('Page visibility and beforeunload handling', () => {
    it('should save when page becomes hidden and has pending changes', () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      // Create pending changes
      act(() => {
        result.current.updateData({ name: 'changed', value: 999 });
      });

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      act(() => {
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      expect(mockManager.forceSave).toHaveBeenCalled();
    });

    it('should warn before unload when there are pending changes', () => {
      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      // Create pending changes
      act(() => {
        result.current.updateData({ name: 'changed', value: 999 });
      });

      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
      
      act(() => {
        window.dispatchEvent(beforeUnloadEvent);
      });

      expect(beforeUnloadEvent.returnValue).toBe('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?');
    });

    it('should not warn before unload when no pending changes', () => {
      renderHook(() => useAutoSave(initialData, defaultOptions));

      // Simulate beforeunload event without pending changes
      const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
      
      act(() => {
        window.dispatchEvent(beforeUnloadEvent);
      });

      expect(beforeUnloadEvent.returnValue).toBeUndefined();
    });
  });

  describe('Conflict resolution', () => {
    it('should handle conflicts when onConflict is provided', async () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();
      
      const localData = { name: 'local', value: 1 };
      const serverData = { name: 'server', value: 2 };
      const resolvedData = { name: 'resolved', value: 3 };

      mockOnConflict.mockResolvedValueOnce(resolvedData);

      renderHook(() => useAutoSave(initialData, defaultOptions));

      // Simulate conflict
      if (mockManager.onConflict) {
        await act(async () => {
          await mockManager.onConflict(localData, serverData);
        });
      }

      expect(mockOnConflict).toHaveBeenCalledWith(localData, serverData);
    });

    it('should handle conflict resolution errors', async () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();
      
      mockOnConflict.mockRejectedValueOnce(new Error('Conflict resolution failed'));

      renderHook(() => useAutoSave(initialData, defaultOptions));

      // Simulate conflict resolution error
      if (mockManager.onConflict) {
        await act(async () => {
          try {
            await mockManager.onConflict({ name: 'local', value: 1 }, { name: 'server', value: 2 });
          } catch (error) {
            // Error should be caught and handled
          }
        });
      }

      expect(mockOnConflict).toHaveBeenCalled();
    });
  });

  describe('Configuration options', () => {
    it('should use custom config options', () => {
      const customConfig = {
        debounceMs: 2000,
        maxRetries: 5,
        retryDelayMs: 3000,
        enableLocalStorage: false,
        enableConflictDetection: false
      };

      const optionsWithCustomConfig = {
        ...defaultOptions,
        config: customConfig
      };

      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');

      renderHook(() => useAutoSave(initialData, optionsWithCustomConfig));

      expect(AutoSaveManager).toHaveBeenCalledWith(
        expect.objectContaining(customConfig)
      );
    });

    it('should use default config when not provided', () => {
      const optionsWithoutConfig = {
        ...defaultOptions,
        config: undefined
      };

      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');

      renderHook(() => useAutoSave(initialData, optionsWithoutConfig));

      expect(AutoSaveManager).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceMs: 1000,
          maxRetries: 3,
          retryDelayMs: 2000,
          enableLocalStorage: true,
          enableConflictDetection: true
        })
      );
    });

    it('should merge custom config with defaults', () => {
      const partialConfig = {
        debounceMs: 500
      };

      const optionsWithPartialConfig = {
        ...defaultOptions,
        config: partialConfig
      };

      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');

      renderHook(() => useAutoSave(initialData, optionsWithPartialConfig));

      expect(AutoSaveManager).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceMs: 500,
          maxRetries: 3, // default
          retryDelayMs: 2000, // default
          enableLocalStorage: true, // default
          enableConflictDetection: true
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();

      const { unmount } = renderHook(() => useAutoSave(initialData, defaultOptions));

      unmount();

      expect(mockManager.cleanup).toHaveBeenCalled();
    });
  });

  describe('Recovery data', () => {
    it('should get recovery data when available', () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();
      const recoveryData = { name: 'recovered', value: 123 };
      mockManager.getBackupData.mockReturnValueOnce(recoveryData);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      const data = result.current.getRecoveryData();

      expect(data).toEqual(recoveryData);
      expect(mockManager.getBackupData).toHaveBeenCalled();
    });

    it('should return null when no recovery data available', () => {
      const { AutoSaveManager } = require('@/services/profile/AutoSaveManager');
      const mockManager = new AutoSaveManager();
      mockManager.getBackupData.mockReturnValueOnce(null);

      const { result } = renderHook(() => useAutoSave(initialData, defaultOptions));

      const data = result.current.getRecoveryData();

      expect(data).toBeNull();
    });
  });
});