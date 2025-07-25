'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

import { 
  ProfileError, 
  ProfileErrorHandler, 
  ProfileErrorCode,
  profileErrorHandler,
  UserProfileError,
  ErrorRecoveryAction 
} from '@/services/error/ProfileErrorHandler';
import { errorReportingService } from '@/lib/error/ErrorReporting';

/**
 * Error recovery state
 */
export interface ErrorRecoveryState {
  hasError: boolean;
  error: UserProfileError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  lastRecoveryTime: Date | null;
  canRetry: boolean;
  recoveryActions: ErrorRecoveryAction[];
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  autoRetry?: boolean;
  showToasts?: boolean;
  component?: string;
  onError?: (error: UserProfileError) => void;
  onRecovery?: () => void;
  onMaxRetriesReached?: (error: UserProfileError) => void;
}

/**
 * Error recovery hook for profile operations
 * Provides comprehensive error handling with retry mechanisms and user feedback
 */
export function useErrorRecovery(config: ErrorRecoveryConfig = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    autoRetry = false,
    showToasts = true,
    component,
    onError,
    onRecovery,
    onMaxRetriesReached
  } = config;

  const [state, setState] = useState<ErrorRecoveryState>({
    hasError: false,
    error: null,
    isRecovering: false,
    recoveryAttempts: 0,
    lastRecoveryTime: null,
    canRetry: false,
    recoveryActions: []
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorHandler = useRef(profileErrorHandler);

  /**
   * Handle error with recovery options
   */
  const handleError = useCallback(async (
    error: Error | ProfileError,
    context?: Record<string, any>
  ) => {
    try {
      // Process error through ProfileErrorHandler
      const userError = errorHandler.current.handleError(error, {
        component,
        ...context
      });

      // Check if we have recent similar errors to prevent spam
      if (error instanceof ProfileError && 
          errorHandler.current.hasRecentSimilarError(error)) {
        return; // Skip duplicate error handling
      }

      // Get recovery actions
      const recoveryActions = errorHandler.current.getRecoveryActions(
        error instanceof ProfileError ? error : new ProfileError(
          error.message,
          'UNKNOWN_ERROR' as ProfileErrorCode,
          'medium',
          true,
          context
        )
      );

      // Update state
      setState(prevState => ({
        hasError: true,
        error: userError,
        isRecovering: false,
        recoveryAttempts: 0,
        lastRecoveryTime: null,
        canRetry: userError.retryable && maxRetries > 0,
        recoveryActions
      }));

      // Report error for monitoring
      await errorReportingService.reportError(error, {
        component,
        custom: context
      });

      // Call custom error handler
      if (onError) {
        onError(userError);
      }

      // Auto-retry for certain errors
      if (autoRetry && userError.retryable) {
        scheduleRetry();
      }

    } catch (reportError) {
      console.error('Failed to handle error properly:', reportError);
      
      // Fallback error state
      setState({
        hasError: true,
        error: {
          message: 'Ocurrió un error inesperado.',
          code: 'UNKNOWN_ERROR' as ProfileErrorCode,
          severity: 'medium',
          retryable: true,
          recoveryStrategy: 'retry',
          context: context
        },
        isRecovering: false,
        recoveryAttempts: 0,
        lastRecoveryTime: null,
        canRetry: true,
        recoveryActions: []
      });
    }
  }, [component, onError, autoRetry, maxRetries]);

  /**
   * Schedule retry with exponential backoff
   */
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = exponentialBackoff
      ? retryDelay * Math.pow(2, state.recoveryAttempts)
      : retryDelay;

    // Add jitter to prevent thundering herd
    const jitteredDelay = delay + (Math.random() * 0.1 * delay);

    retryTimeoutRef.current = setTimeout(() => {
      retry();
    }, jitteredDelay);
  }, [retryDelay, exponentialBackoff, state.recoveryAttempts]);

  /**
   * Retry the failed operation
   */
  const retry = useCallback(async (customAction?: () => Promise<void>) => {
    if (!state.canRetry || state.recoveryAttempts >= maxRetries) {
      if (onMaxRetriesReached && state.error) {
        onMaxRetriesReached(state.error);
      }
      return false;
    }

    setState(prevState => ({
      ...prevState,
      isRecovering: true,
      recoveryAttempts: prevState.recoveryAttempts + 1,
      lastRecoveryTime: new Date()
    }));

    try {
      // Execute custom retry action or default recovery
      if (customAction) {
        await customAction();
      }

      // Success - clear error state
      setState(prevState => ({
        hasError: false,
        error: null,
        isRecovering: false,
        recoveryAttempts: prevState.recoveryAttempts,
        lastRecoveryTime: new Date(),
        canRetry: false,
        recoveryActions: []
      }));

      if (showToasts) {
        toast.success('Operación recuperada exitosamente', {
          duration: 3000
        });
      }

      if (onRecovery) {
        onRecovery();
      }

      return true;

    } catch (retryError) {
      console.error('Retry failed:', retryError);

      const canRetryAgain = state.recoveryAttempts < maxRetries - 1;

      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        canRetry: canRetryAgain
      }));

      if (showToasts) {
        if (canRetryAgain) {
          toast.warning(
            `Reintento ${state.recoveryAttempts + 1}/${maxRetries} falló. Intentando nuevamente...`,
            { duration: 3000 }
          );
        } else {
          toast.error('Se agotaron los intentos de recuperación', {
            duration: 5000
          });
        }
      }

      // Schedule next retry if possible
      if (canRetryAgain && autoRetry) {
        scheduleRetry();
      }

      return false;
    }
  }, [state, maxRetries, onMaxRetriesReached, onRecovery, showToasts, autoRetry, scheduleRetry]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setState({
      hasError: false,
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
      lastRecoveryTime: null,
      canRetry: false,
      recoveryActions: []
    });
  }, []);

  /**
   * Execute recovery action
   */
  const executeRecoveryAction = useCallback(async (action: ErrorRecoveryAction) => {
    try {
      setState(prevState => ({
        ...prevState,
        isRecovering: true
      }));

      await action.action();

      // If action succeeds, clear error
      clearError();

    } catch (actionError) {
      console.error('Recovery action failed:', actionError);
      
      setState(prevState => ({
        ...prevState,
        isRecovering: false
      }));

      if (showToasts) {
        toast.error('La acción de recuperación falló', {
          duration: 3000
        });
      }
    }
  }, [clearError, showToasts]);

  /**
   * Get retry delay information
   */
  const getRetryInfo = useCallback(() => {
    if (!state.canRetry) return null;

    const delay = exponentialBackoff
      ? retryDelay * Math.pow(2, state.recoveryAttempts)
      : retryDelay;

    return {
      nextRetryIn: delay,
      attempt: state.recoveryAttempts + 1,
      maxAttempts: maxRetries,
      lastAttempt: state.lastRecoveryTime
    };
  }, [state, retryDelay, exponentialBackoff, maxRetries]);

  /**
   * Check if error is recoverable
   */
  const isRecoverable = useCallback((error: Error | ProfileError): boolean => {
    if (error instanceof ProfileError) {
      return error.retryable && error.recoveryStrategy !== 'none';
    }
    return true; // Assume generic errors are recoverable
  }, []);

  /**
   * Get error severity color for UI
   */
  const getSeverityColor = useCallback((severity?: string) => {
    switch (severity) {
      case 'low': return 'yellow';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'critical': return 'purple';
      default: return 'gray';
    }
  }, []);

  /**
   * Get error icon for UI
   */
  const getErrorIcon = useCallback((error?: UserProfileError) => {
    if (!error) return 'AlertCircle';

    switch (error.code) {
      case 'NETWORK_CONNECTION_FAILED':
      case 'SERVICE_UNAVAILABLE':
        return 'WifiOff';
      
      case 'USER_NOT_AUTHENTICATED':
      case 'SESSION_EXPIRED':
        return 'User';
      
      case 'PROFILE_SAVE_FAILED':
      case 'DATABASE_CONNECTION_FAILED':
        return 'Database';
      
      case 'INVALID_PROFILE_DATA':
      case 'VALIDATION_FAILED':
        return 'AlertTriangle';
      
      default:
        return 'AlertCircle';
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    handleError,
    retry,
    clearError,
    executeRecoveryAction,
    
    // Utilities
    getRetryInfo,
    isRecoverable,
    getSeverityColor,
    getErrorIcon,
    
    // Computed properties
    hasMaxRetriesReached: state.recoveryAttempts >= maxRetries,
    isAutoRetrying: autoRetry && state.canRetry && !state.isRecovering,
    errorSeverityColor: getSeverityColor(state.error?.severity),
    errorIcon: getErrorIcon(state.error)
  };
}

/**
 * Specialized hook for profile save operations
 */
export function useProfileSaveRecovery(saveFunction: () => Promise<void>) {
  const errorRecovery = useErrorRecovery({
    maxRetries: 3,
    autoRetry: true,
    component: 'ProfileSave',
    showToasts: true
  });

  const saveWithRecovery = useCallback(async () => {
    try {
      await saveFunction();
      errorRecovery.clearError();
    } catch (error) {
      await errorRecovery.handleError(error as Error, {
        operation: 'save_profile'
      });
    }
  }, [saveFunction, errorRecovery]);

  const retryWithSave = useCallback(async () => {
    return errorRecovery.retry(saveFunction);
  }, [errorRecovery, saveFunction]);

  return {
    ...errorRecovery,
    saveWithRecovery,
    retryWithSave
  };
}

/**
 * Specialized hook for profile load operations
 */
export function useProfileLoadRecovery(loadFunction: () => Promise<void>) {
  const errorRecovery = useErrorRecovery({
    maxRetries: 5,
    autoRetry: true,
    retryDelay: 2000,
    component: 'ProfileLoad',
    showToasts: true
  });

  const loadWithRecovery = useCallback(async () => {
    try {
      await loadFunction();
      errorRecovery.clearError();
    } catch (error) {
      await errorRecovery.handleError(error as Error, {
        operation: 'load_profile'
      });
    }
  }, [loadFunction, errorRecovery]);

  const retryWithLoad = useCallback(async () => {
    return errorRecovery.retry(loadFunction);
  }, [errorRecovery, loadFunction]);

  return {
    ...errorRecovery,
    loadWithRecovery,
    retryWithLoad
  };
}

/**
 * Hook for handling form validation errors
 */
export function useProfileValidationRecovery() {
  const errorRecovery = useErrorRecovery({
    maxRetries: 0, // Validation errors shouldn't be retried
    autoRetry: false,
    component: 'ProfileValidation',
    showToasts: false // Handle validation feedback manually
  });

  const handleValidationError = useCallback(async (
    fieldErrors: Record<string, string>,
    formData?: Record<string, any>
  ) => {
    const error = new ProfileError(
      'Profile validation failed',
      'INVALID_PROFILE_DATA' as ProfileErrorCode,
      'low',
      false,
      { validationErrors: fieldErrors, formData },
      'Por favor, corrige los errores en el formulario',
      'manual_intervention'
    );

    await errorRecovery.handleError(error, {
      operation: 'validate_profile',
      fieldErrors
    });
  }, [errorRecovery]);

  return {
    ...errorRecovery,
    handleValidationError
  };
}

export default useErrorRecovery;