/**
 * Comprehensive error handling service for profile operations
 * Provides standardized error handling, recovery strategies, and user-friendly messages
 */

import { toast } from 'sonner';

/**
 * Profile-specific error codes
 */
export const ProfileErrorCodes = {
  // Data Validation Errors
  INVALID_PROFILE_DATA: 'INVALID_PROFILE_DATA',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
  INVALID_PHONE_FORMAT: 'INVALID_PHONE_FORMAT',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  INVALID_HOUSEHOLD_SIZE: 'INVALID_HOUSEHOLD_SIZE',
  INVALID_BUDGET_AMOUNT: 'INVALID_BUDGET_AMOUNT',

  // Authentication & Authorization Errors
  USER_NOT_AUTHENTICATED: 'USER_NOT_AUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  PROFILE_ACCESS_DENIED: 'PROFILE_ACCESS_DENIED',

  // Storage & Database Errors
  PROFILE_SAVE_FAILED: 'PROFILE_SAVE_FAILED',
  PROFILE_LOAD_FAILED: 'PROFILE_LOAD_FAILED',
  PROFILE_DELETE_FAILED: 'PROFILE_DELETE_FAILED',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',

  // Network & Service Errors
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',

  // Business Logic Errors
  PROFILE_ALREADY_EXISTS: 'PROFILE_ALREADY_EXISTS',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  DIETARY_RESTRICTION_CONFLICT: 'DIETARY_RESTRICTION_CONFLICT',
  ALLERGEN_CONTRADICTION: 'ALLERGEN_CONTRADICTION',
  PREFERENCE_CONFLICT: 'PREFERENCE_CONFLICT',

  // Integration Errors
  AUTO_SAVE_FAILED: 'AUTO_SAVE_FAILED',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  BACKUP_FAILED: 'BACKUP_FAILED',
  RECOVERY_FAILED: 'RECOVERY_FAILED',

  // Unknown Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ProfileErrorCode = typeof ProfileErrorCodes[keyof typeof ProfileErrorCodes];

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error recovery strategies
 */
export type RecoveryStrategy = 
  | 'retry' 
  | 'retry_with_backoff' 
  | 'reload_page' 
  | 'redirect_login' 
  | 'manual_intervention' 
  | 'graceful_degradation'
  | 'none';

/**
 * Profile error class with Spanish user messages
 */
export class ProfileError extends Error {
  constructor(
    message: string,
    public readonly code: ProfileErrorCode,
    public readonly severity: ErrorSeverity = 'medium',
    public readonly retryable: boolean = false,
    public readonly context?: Record<string, any>,
    public readonly userMessage?: string,
    public readonly recoveryStrategy: RecoveryStrategy = 'none'
  ) {
    super(message);
    this.name = 'ProfileError';
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProfileError);
    }
  }

  /**
   * Get user-friendly error message in Spanish
   */
  getUserMessage(): string {
    if (this.userMessage) {
      return this.userMessage;
    }

    return getDefaultUserMessage(this.code, this.context);
  }

  /**
   * Convert to user error format
   */
  toUserError(): UserProfileError {
    return {
      message: this.getUserMessage(),
      code: this.code,
      severity: this.severity,
      retryable: this.retryable,
      recoveryStrategy: this.recoveryStrategy,
      context: this.context
    };
  }
}

/**
 * User-friendly error interface
 */
export interface UserProfileError {
  message: string;
  code: ProfileErrorCode;
  severity: ErrorSeverity;
  retryable: boolean;
  recoveryStrategy: RecoveryStrategy;
  context?: Record<string, any>;
}

/**
 * Error recovery action interface
 */
export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * Get default user message for error codes
 */
function getDefaultUserMessage(code: ProfileErrorCode, context?: Record<string, any>): string {
  switch (code) {
    // Validation Errors
    case ProfileErrorCodes.INVALID_PROFILE_DATA:
      return 'Los datos del perfil contienen información inválida. Por favor, revisa los campos marcados.';
    
    case ProfileErrorCodes.REQUIRED_FIELD_MISSING:
      return `El campo ${context?.field || 'requerido'} es obligatorio.`;
    
    case ProfileErrorCodes.INVALID_EMAIL_FORMAT:
      return 'El formato del email no es válido. Ingresa un email correcto.';
    
    case ProfileErrorCodes.INVALID_PHONE_FORMAT:
      return 'El formato del teléfono no es válido. Usa el formato +54 9 11 1234-5678.';
    
    case ProfileErrorCodes.INVALID_HOUSEHOLD_SIZE:
      return 'El número de miembros del hogar debe ser entre 1 y 20.';
    
    case ProfileErrorCodes.INVALID_BUDGET_AMOUNT:
      return 'El presupuesto mensual debe ser un valor positivo.';

    // Authentication Errors
    case ProfileErrorCodes.USER_NOT_AUTHENTICATED:
      return 'Debes iniciar sesión para acceder a tu perfil.';
    
    case ProfileErrorCodes.SESSION_EXPIRED:
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    
    case ProfileErrorCodes.INSUFFICIENT_PERMISSIONS:
      return 'No tienes permisos suficientes para realizar esta acción.';
    
    case ProfileErrorCodes.PROFILE_ACCESS_DENIED:
      return 'No tienes acceso a este perfil.';

    // Storage Errors
    case ProfileErrorCodes.PROFILE_SAVE_FAILED:
      return 'No se pudieron guardar los cambios del perfil. Intenta nuevamente.';
    
    case ProfileErrorCodes.PROFILE_LOAD_FAILED:
      return 'No se pudo cargar tu perfil. Verifica tu conexión e intenta nuevamente.';
    
    case ProfileErrorCodes.PROFILE_UPDATE_FAILED:
      return 'No se pudieron actualizar los datos del perfil. Intenta nuevamente.';
    
    case ProfileErrorCodes.DATABASE_CONNECTION_FAILED:
      return 'Error de conexión con la base de datos. Intenta más tarde.';
    
    case ProfileErrorCodes.STORAGE_QUOTA_EXCEEDED:
      return 'Se ha superado el límite de almacenamiento. Contacta con soporte.';

    // Network Errors
    case ProfileErrorCodes.NETWORK_CONNECTION_FAILED:
      return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    
    case ProfileErrorCodes.SERVICE_UNAVAILABLE:
      return 'El servicio no está disponible temporalmente. Intenta en unos minutos.';
    
    case ProfileErrorCodes.REQUEST_TIMEOUT:
      return 'La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.';
    
    case ProfileErrorCodes.RATE_LIMIT_EXCEEDED:
      return 'Has superado el límite de solicitudes. Espera un momento e intenta nuevamente.';

    // Business Logic Errors
    case ProfileErrorCodes.PROFILE_ALREADY_EXISTS:
      return 'Ya existe un perfil para este usuario.';
    
    case ProfileErrorCodes.PROFILE_NOT_FOUND:
      return 'No se encontró el perfil solicitado.';
    
    case ProfileErrorCodes.DIETARY_RESTRICTION_CONFLICT:
      return 'Hay conflictos entre las restricciones dietéticas seleccionadas.';
    
    case ProfileErrorCodes.ALLERGEN_CONTRADICTION:
      return 'Hay contradicciones en la información de alergias.';

    // Integration Errors
    case ProfileErrorCodes.AUTO_SAVE_FAILED:
      return 'No se pudieron guardar automáticamente los cambios. Usa "Guardar Ahora".';
    
    case ProfileErrorCodes.SYNC_CONFLICT:
      return 'Hay conflictos de sincronización. Los datos pueden estar desactualizados.';
    
    case ProfileErrorCodes.BACKUP_FAILED:
      return 'No se pudo crear una copia de seguridad de los cambios.';
    
    case ProfileErrorCodes.RECOVERY_FAILED:
      return 'No se pudieron recuperar los datos guardados localmente.';

    default:
      return 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.';
  }
}

/**
 * Profile error factory for common scenarios
 */
export class ProfileErrorFactory {
  static invalidField(field: string, value?: any): ProfileError {
    return new ProfileError(
      `Invalid field value: ${field}`,
      ProfileErrorCodes.REQUIRED_FIELD_MISSING,
      'low',
      false,
      { field, value },
      undefined,
      'manual_intervention'
    );
  }

  static networkError(originalError?: Error): ProfileError {
    return new ProfileError(
      'Network connection failed',
      ProfileErrorCodes.NETWORK_CONNECTION_FAILED,
      'medium',
      true,
      { originalError: originalError?.message },
      undefined,
      'retry_with_backoff'
    );
  }

  static authenticationRequired(): ProfileError {
    return new ProfileError(
      'User authentication required',
      ProfileErrorCodes.USER_NOT_AUTHENTICATED,
      'high',
      false,
      {},
      undefined,
      'redirect_login'
    );
  }

  static sessionExpired(): ProfileError {
    return new ProfileError(
      'User session expired',
      ProfileErrorCodes.SESSION_EXPIRED,
      'high',
      false,
      {},
      undefined,
      'redirect_login'
    );
  }

  static saveFailed(reason?: string): ProfileError {
    return new ProfileError(
      'Profile save operation failed',
      ProfileErrorCodes.PROFILE_SAVE_FAILED,
      'medium',
      true,
      { reason },
      undefined,
      'retry'
    );
  }

  static loadFailed(reason?: string): ProfileError {
    return new ProfileError(
      'Profile load operation failed',
      ProfileErrorCodes.PROFILE_LOAD_FAILED,
      'medium',
      true,
      { reason },
      undefined,
      'retry'
    );
  }

  static validationFailed(errors: Record<string, string>): ProfileError {
    return new ProfileError(
      'Profile validation failed',
      ProfileErrorCodes.INVALID_PROFILE_DATA,
      'low',
      false,
      { validationErrors: errors },
      undefined,
      'manual_intervention'
    );
  }

  static serviceUnavailable(): ProfileError {
    return new ProfileError(
      'Profile service unavailable',
      ProfileErrorCodes.SERVICE_UNAVAILABLE,
      'high',
      true,
      {},
      undefined,
      'retry_with_backoff'
    );
  }

  static autoSaveFailed(data?: any): ProfileError {
    return new ProfileError(
      'Auto-save failed',
      ProfileErrorCodes.AUTO_SAVE_FAILED,
      'medium',
      true,
      { data },
      undefined,
      'graceful_degradation'
    );
  }

  static syncConflict(localData?: any, serverData?: any): ProfileError {
    return new ProfileError(
      'Data synchronization conflict',
      ProfileErrorCodes.SYNC_CONFLICT,
      'medium',
      false,
      { localData, serverData },
      undefined,
      'manual_intervention'
    );
  }
}

/**
 * Profile error handler service
 */
export class ProfileErrorHandler {
  private static instance: ProfileErrorHandler;
  private errorHistory: Array<{ error: ProfileError; timestamp: Date }> = [];
  private maxHistorySize = 50;

  static getInstance(): ProfileErrorHandler {
    if (!ProfileErrorHandler.instance) {
      ProfileErrorHandler.instance = new ProfileErrorHandler();
    }
    return ProfileErrorHandler.instance;
  }

  /**
   * Handle profile error with appropriate user feedback and recovery actions
   */
  handleError(error: Error | ProfileError, context?: Record<string, any>): UserProfileError {
    let profileError: ProfileError;

    if (error instanceof ProfileError) {
      profileError = error;
    } else {
      profileError = this.categorizeError(error, context);
    }

    // Add to error history
    this.addToHistory(profileError);

    // Log error
    this.logError(profileError, context);

    // Show user notification
    this.showUserNotification(profileError);

    return profileError.toUserError();
  }

  /**
   * Categorize generic errors into profile errors
   */
  private categorizeError(error: Error, context?: Record<string, any>): ProfileError {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ProfileErrorFactory.networkError(error);
    }

    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ProfileErrorFactory.authenticationRequired();
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ProfileErrorFactory.validationFailed({ general: error.message });
    }

    if (message.includes('save') || message.includes('update') || message.includes('persist')) {
      return ProfileErrorFactory.saveFailed(error.message);
    }

    if (message.includes('load') || message.includes('fetch') || message.includes('get')) {
      return ProfileErrorFactory.loadFailed(error.message);
    }

    if (message.includes('timeout')) {
      return new ProfileError(
        error.message,
        ProfileErrorCodes.REQUEST_TIMEOUT,
        'medium',
        true,
        context,
        undefined,
        'retry'
      );
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return new ProfileError(
        error.message,
        ProfileErrorCodes.RATE_LIMIT_EXCEEDED,
        'medium',
        true,
        context,
        undefined,
        'retry_with_backoff'
      );
    }

    // Default to unknown error
    return new ProfileError(
      error.message,
      ProfileErrorCodes.UNKNOWN_ERROR,
      'medium',
      true,
      { originalError: error.message, ...context },
      undefined,
      'retry'
    );
  }

  /**
   * Add error to history for tracking
   */
  private addToHistory(error: ProfileError): void {
    this.errorHistory.unshift({
      error,
      timestamp: new Date()
    });

    // Keep only recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: ProfileError, context?: Record<string, any>): void {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        severity: error.severity,
        retryable: error.retryable,
        recoveryStrategy: error.recoveryStrategy,
        stack: error.stack,
        context: { ...error.context, ...context }
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
    };

    // Console logging
    if (process.env.NODE_ENV === 'development') {
      console.error('[ProfileErrorHandler]', errorData);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && error.severity !== 'low') {
      // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
      // monitoringService.captureException(error, errorData);
    }
  }

  /**
   * Show appropriate user notification based on error severity
   */
  private showUserNotification(error: ProfileError): void {
    const message = error.getUserMessage();

    switch (error.severity) {
      case 'low':
        toast.info(message, {
          duration: 3000
        });
        break;

      case 'medium':
        toast.warning(message, {
          duration: 4000
        });
        break;

      case 'high':
        toast.error(message, {
          duration: 6000
        });
        break;

      case 'critical':
        toast.error(message, {
          duration: 10000,
          style: {
            backgroundColor: '#fee2e2',
            borderColor: '#fca5a5',
            color: '#991b1b'
          }
        });
        break;
    }
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(error: ProfileError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.recoveryStrategy) {
      case 'retry':
        actions.push({
          label: 'Reintentar',
          action: () => {}, // Will be overridden by caller
          primary: true,
          variant: 'primary'
        });
        break;

      case 'retry_with_backoff':
        actions.push({
          label: 'Reintentar',
          action: () => {}, // Will be overridden by caller
          primary: true,
          variant: 'primary'
        });
        break;

      case 'reload_page':
        actions.push({
          label: 'Recargar Página',
          action: () => window.location.reload(),
          primary: true,
          variant: 'primary'
        });
        break;

      case 'redirect_login':
        actions.push({
          label: 'Iniciar Sesión',
          action: () => {
            // TODO: Redirect to login page
            window.location.href = '/login';
          },
          primary: true,
          variant: 'primary'
        });
        break;

      case 'manual_intervention':
        actions.push({
          label: 'Revisar Datos',
          action: () => {}, // Will be handled by form validation
          primary: true,
          variant: 'secondary'
        });
        break;

      case 'graceful_degradation':
        actions.push({
          label: 'Continuar',
          action: () => {}, // Will be overridden by caller
          primary: true,
          variant: 'secondary'
        });
        break;
    }

    // Always add general actions
    actions.push({
      label: 'Ir al Inicio',
      action: () => {
        window.location.href = '/';
      },
      variant: 'ghost'
    });

    return actions;
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): Array<{ error: ProfileError; timestamp: Date }> {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Check if there are recent similar errors (for preventing spam)
   */
  hasRecentSimilarError(error: ProfileError, timeWindow: number = 5000): boolean {
    const now = Date.now();
    return this.errorHistory.some(
      ({ error: historyError, timestamp }) =>
        historyError.code === error.code &&
        now - timestamp.getTime() < timeWindow
    );
  }
}

// Export singleton instance
export const profileErrorHandler = ProfileErrorHandler.getInstance();