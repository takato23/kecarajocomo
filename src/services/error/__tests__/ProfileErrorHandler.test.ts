/**
 * @jest-environment jsdom
 */

import { toast } from 'sonner';

import {
  ProfileErrorHandler,
  ProfileError,
  ProfileErrorFactory,
  ProfileErrorCodes,
  profileErrorHandler
} from '../ProfileErrorHandler';

import type {
  ProfileErrorCode,
  ErrorSeverity,
  RecoveryStrategy,
  UserProfileError,
  ErrorRecoveryAction
} from '../ProfileErrorHandler';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

describe('ProfileError', () => {
  it('should create error with all properties', () => {
    const context = { field: 'username', value: '' };
    const error = new ProfileError(
      'Test error message',
      ProfileErrorCodes.REQUIRED_FIELD_MISSING,
      'medium',
      true,
      context,
      'Spanish user message',
      'retry'
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe(ProfileErrorCodes.REQUIRED_FIELD_MISSING);
    expect(error.severity).toBe('medium');
    expect(error.retryable).toBe(true);
    expect(error.context).toEqual(context);
    expect(error.userMessage).toBe('Spanish user message');
    expect(error.recoveryStrategy).toBe('retry');
    expect(error.name).toBe('ProfileError');
  });

  it('should use default values when not provided', () => {
    const error = new ProfileError(
      'Test error',
      ProfileErrorCodes.UNKNOWN_ERROR
    );

    expect(error.severity).toBe('medium');
    expect(error.retryable).toBe(false);
    expect(error.context).toBeUndefined();
    expect(error.userMessage).toBeUndefined();
    expect(error.recoveryStrategy).toBe('none');
  });

  it('should get default user message when userMessage not provided', () => {
    const error = new ProfileError(
      'Test error',
      ProfileErrorCodes.NETWORK_CONNECTION_FAILED
    );

    const message = error.getUserMessage();
    expect(message).toBe('Error de conexión. Verifica tu internet e intenta nuevamente.');
  });

  it('should return custom user message when provided', () => {
    const customMessage = 'Custom error message';
    const error = new ProfileError(
      'Test error',
      ProfileErrorCodes.UNKNOWN_ERROR,
      'medium',
      false,
      undefined,
      customMessage
    );

    const message = error.getUserMessage();
    expect(message).toBe(customMessage);
  });

  it('should convert to user error format', () => {
    const context = { field: 'email' };
    const error = new ProfileError(
      'Invalid email',
      ProfileErrorCodes.INVALID_EMAIL_FORMAT,
      'low',
      false,
      context,
      undefined,
      'manual_intervention'
    );

    const userError = error.toUserError();

    expect(userError).toEqual({
      message: 'El formato del email no es válido. Ingresa un email correcto.',
      code: ProfileErrorCodes.INVALID_EMAIL_FORMAT,
      severity: 'low',
      retryable: false,
      recoveryStrategy: 'manual_intervention',
      context
    });
  });

  it('should capture stack trace', () => {
    const error = new ProfileError(
      'Test error',
      ProfileErrorCodes.UNKNOWN_ERROR
    );

    expect(error.stack).toBeDefined();
  });
});

describe('ProfileErrorFactory', () => {
  describe('invalidField', () => {
    it('should create invalid field error', () => {
      const error = ProfileErrorFactory.invalidField('username', 'invalid-value');

      expect(error.code).toBe(ProfileErrorCodes.REQUIRED_FIELD_MISSING);
      expect(error.severity).toBe('low');
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ field: 'username', value: 'invalid-value' });
      expect(error.recoveryStrategy).toBe('manual_intervention');
    });
  });

  describe('networkError', () => {
    it('should create network error', () => {
      const originalError = new Error('Connection timeout');
      const error = ProfileErrorFactory.networkError(originalError);

      expect(error.code).toBe(ProfileErrorCodes.NETWORK_CONNECTION_FAILED);
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ originalError: 'Connection timeout' });
      expect(error.recoveryStrategy).toBe('retry_with_backoff');
    });

    it('should handle network error without original error', () => {
      const error = ProfileErrorFactory.networkError();

      expect(error.code).toBe(ProfileErrorCodes.NETWORK_CONNECTION_FAILED);
      expect(error.context).toEqual({ originalError: undefined });
    });
  });

  describe('authenticationRequired', () => {
    it('should create authentication required error', () => {
      const error = ProfileErrorFactory.authenticationRequired();

      expect(error.code).toBe(ProfileErrorCodes.USER_NOT_AUTHENTICATED);
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(false);
      expect(error.recoveryStrategy).toBe('redirect_login');
    });
  });

  describe('sessionExpired', () => {
    it('should create session expired error', () => {
      const error = ProfileErrorFactory.sessionExpired();

      expect(error.code).toBe(ProfileErrorCodes.SESSION_EXPIRED);
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(false);
      expect(error.recoveryStrategy).toBe('redirect_login');
    });
  });

  describe('saveFailed', () => {
    it('should create save failed error', () => {
      const reason = 'Database connection lost';
      const error = ProfileErrorFactory.saveFailed(reason);

      expect(error.code).toBe(ProfileErrorCodes.PROFILE_SAVE_FAILED);
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ reason });
      expect(error.recoveryStrategy).toBe('retry');
    });
  });

  describe('loadFailed', () => {
    it('should create load failed error', () => {
      const reason = 'Network timeout';
      const error = ProfileErrorFactory.loadFailed(reason);

      expect(error.code).toBe(ProfileErrorCodes.PROFILE_LOAD_FAILED);
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ reason });
      expect(error.recoveryStrategy).toBe('retry');
    });
  });

  describe('validationFailed', () => {
    it('should create validation failed error', () => {
      const errors = { username: 'Required', email: 'Invalid format' };
      const error = ProfileErrorFactory.validationFailed(errors);

      expect(error.code).toBe(ProfileErrorCodes.INVALID_PROFILE_DATA);
      expect(error.severity).toBe('low');
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ validationErrors: errors });
      expect(error.recoveryStrategy).toBe('manual_intervention');
    });
  });

  describe('serviceUnavailable', () => {
    it('should create service unavailable error', () => {
      const error = ProfileErrorFactory.serviceUnavailable();

      expect(error.code).toBe(ProfileErrorCodes.SERVICE_UNAVAILABLE);
      expect(error.severity).toBe('high');
      expect(error.retryable).toBe(true);
      expect(error.recoveryStrategy).toBe('retry_with_backoff');
    });
  });

  describe('autoSaveFailed', () => {
    it('should create auto-save failed error', () => {
      const data = { username: 'test', email: 'test@example.com' };
      const error = ProfileErrorFactory.autoSaveFailed(data);

      expect(error.code).toBe(ProfileErrorCodes.AUTO_SAVE_FAILED);
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ data });
      expect(error.recoveryStrategy).toBe('graceful_degradation');
    });
  });

  describe('syncConflict', () => {
    it('should create sync conflict error', () => {
      const localData = { version: 1 };
      const serverData = { version: 2 };
      const error = ProfileErrorFactory.syncConflict(localData, serverData);

      expect(error.code).toBe(ProfileErrorCodes.SYNC_CONFLICT);
      expect(error.severity).toBe('medium');
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ localData, serverData });
      expect(error.recoveryStrategy).toBe('manual_intervention');
    });
  });
});

describe('ProfileErrorHandler', () => {
  let handler: ProfileErrorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = ProfileErrorHandler.getInstance();
    handler.clearHistory(); // Clear history between tests
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ProfileErrorHandler.getInstance();
      const instance2 = ProfileErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(profileErrorHandler).toBeInstanceOf(ProfileErrorHandler);
      expect(profileErrorHandler).toBe(ProfileErrorHandler.getInstance());
    });
  });

  describe('handleError', () => {
    it('should handle ProfileError directly', () => {
      const profileError = new ProfileError(
        'Test profile error',
        ProfileErrorCodes.PROFILE_SAVE_FAILED,
        'medium',
        true
      );

      const userError = handler.handleError(profileError);

      expect(userError).toEqual({
        message: profileError.getUserMessage(),
        code: ProfileErrorCodes.PROFILE_SAVE_FAILED,
        severity: 'medium',
        retryable: true,
        recoveryStrategy: 'none',
        context: undefined
      });

      expect(toast.warning).toHaveBeenCalledWith(
        'No se pudieron guardar los cambios del perfil. Intenta nuevamente.',
        { duration: 4000 }
      );
    });

    it('should categorize generic network error', () => {
      const networkError = new Error('fetch failed');
      const userError = handler.handleError(networkError);

      expect(userError.code).toBe(ProfileErrorCodes.NETWORK_CONNECTION_FAILED);
      expect(userError.severity).toBe('medium');
      expect(userError.retryable).toBe(true);
      expect(userError.recoveryStrategy).toBe('retry_with_backoff');
    });

    it('should categorize generic auth error', () => {
      const authError = new Error('unauthorized access');
      const userError = handler.handleError(authError);

      expect(userError.code).toBe(ProfileErrorCodes.USER_NOT_AUTHENTICATED);
      expect(userError.recoveryStrategy).toBe('redirect_login');
    });

    it('should categorize validation error', () => {
      const validationError = new Error('validation failed: required field');
      const userError = handler.handleError(validationError);

      expect(userError.code).toBe(ProfileErrorCodes.INVALID_PROFILE_DATA);
      expect(userError.recoveryStrategy).toBe('manual_intervention');
    });

    it('should categorize save error', () => {
      const saveError = new Error('save operation failed');
      const userError = handler.handleError(saveError);

      expect(userError.code).toBe(ProfileErrorCodes.PROFILE_SAVE_FAILED);
      expect(userError.recoveryStrategy).toBe('retry');
    });

    it('should categorize load error', () => {
      const loadError = new Error('failed to load data');
      const userError = handler.handleError(loadError);

      expect(userError.code).toBe(ProfileErrorCodes.PROFILE_LOAD_FAILED);
      expect(userError.recoveryStrategy).toBe('retry');
    });

    it('should categorize timeout error', () => {
      const timeoutError = new Error('request timeout exceeded');
      const userError = handler.handleError(timeoutError);

      expect(userError.code).toBe(ProfileErrorCodes.REQUEST_TIMEOUT);
      expect(userError.recoveryStrategy).toBe('retry');
    });

    it('should categorize rate limit error', () => {
      const rateLimitError = new Error('rate limit exceeded');
      const userError = handler.handleError(rateLimitError);

      expect(userError.code).toBe(ProfileErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(userError.recoveryStrategy).toBe('retry_with_backoff');
    });

    it('should categorize unknown error', () => {
      const unknownError = new Error('something went wrong');
      const userError = handler.handleError(unknownError);

      expect(userError.code).toBe(ProfileErrorCodes.UNKNOWN_ERROR);
      expect(userError.recoveryStrategy).toBe('retry');
    });

    it('should add context when handling errors', () => {
      const context = { operation: 'save_profile', userId: '123' };
      const error = new Error('test error');
      
      const userError = handler.handleError(error, context);

      expect(userError.context).toEqual(
        expect.objectContaining(context)
      );
    });
  });

  describe('Error history', () => {
    it('should add errors to history', () => {
      const error1 = new ProfileError('Error 1', ProfileErrorCodes.PROFILE_SAVE_FAILED);
      const error2 = new ProfileError('Error 2', ProfileErrorCodes.NETWORK_CONNECTION_FAILED);

      handler.handleError(error1);
      handler.handleError(error2);

      const history = handler.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].error).toBe(error2); // Most recent first
      expect(history[1].error).toBe(error1);
    });

    it('should limit history size', () => {
      // Add more errors than the max history size (50)
      for (let i = 0; i < 60; i++) {
        const error = new ProfileError(`Error ${i}`, ProfileErrorCodes.UNKNOWN_ERROR);
        handler.handleError(error);
      }

      const history = handler.getErrorHistory();
      expect(history).toHaveLength(50); // Should be limited to max size
    });

    it('should clear history', () => {
      const error = new ProfileError('Test error', ProfileErrorCodes.UNKNOWN_ERROR);
      handler.handleError(error);

      expect(handler.getErrorHistory()).toHaveLength(1);

      handler.clearHistory();
      expect(handler.getErrorHistory()).toHaveLength(0);
    });

    it('should detect recent similar errors', () => {
      const error1 = new ProfileError('Error 1', ProfileErrorCodes.PROFILE_SAVE_FAILED);
      const error2 = new ProfileError('Error 2', ProfileErrorCodes.PROFILE_SAVE_FAILED);

      handler.handleError(error1);
      
      const hasSimilar = handler.hasRecentSimilarError(error2, 10000); // 10 seconds
      expect(hasSimilar).toBe(true);
    });

    it('should not detect similar errors outside time window', () => {
      const error1 = new ProfileError('Error 1', ProfileErrorCodes.PROFILE_SAVE_FAILED);
      const error2 = new ProfileError('Error 2', ProfileErrorCodes.PROFILE_SAVE_FAILED);

      handler.handleError(error1);
      
      const hasSimilar = handler.hasRecentSimilarError(error2, 0); // No time window
      expect(hasSimilar).toBe(false);
    });
  });

  describe('User notifications', () => {
    it('should show info toast for low severity', () => {
      const error = new ProfileError(
        'Low severity error',
        ProfileErrorCodes.REQUIRED_FIELD_MISSING,
        'low'
      );

      handler.handleError(error);

      expect(toast.info).toHaveBeenCalledWith(
        error.getUserMessage(),
        { duration: 3000 }
      );
    });

    it('should show warning toast for medium severity', () => {
      const error = new ProfileError(
        'Medium severity error',
        ProfileErrorCodes.PROFILE_SAVE_FAILED,
        'medium'
      );

      handler.handleError(error);

      expect(toast.warning).toHaveBeenCalledWith(
        error.getUserMessage(),
        { duration: 4000 }
      );
    });

    it('should show error toast for high severity', () => {
      const error = new ProfileError(
        'High severity error',
        ProfileErrorCodes.USER_NOT_AUTHENTICATED,
        'high'
      );

      handler.handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        error.getUserMessage(),
        { duration: 6000 }
      );
    });

    it('should show critical error toast for critical severity', () => {
      const error = new ProfileError(
        'Critical error',
        ProfileErrorCodes.DATABASE_CONNECTION_FAILED,
        'critical'
      );

      handler.handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        error.getUserMessage(),
        {
          duration: 10000,
          style: {
            backgroundColor: '#fee2e2',
            borderColor: '#fca5a5',
            color: '#991b1b'
          }
        }
      );
    });
  });

  describe('Recovery actions', () => {
    it('should generate retry action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.PROFILE_SAVE_FAILED,
        'medium',
        true,
        undefined,
        undefined,
        'retry'
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Reintentar',
          primary: true,
          variant: 'primary'
        })
      );
    });

    it('should generate retry with backoff action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.NETWORK_CONNECTION_FAILED,
        'medium',
        true,
        undefined,
        undefined,
        'retry_with_backoff'
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Reintentar',
          primary: true,
          variant: 'primary'
        })
      );
    });

    it('should generate reload page action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.UNKNOWN_ERROR,
        'medium',
        false,
        undefined,
        undefined,
        'reload_page'
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Recargar Página',
          primary: true,
          variant: 'primary'
        })
      );
    });

    it('should generate redirect login action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.USER_NOT_AUTHENTICATED,
        'high',
        false,
        undefined,
        undefined,
        'redirect_login'
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Iniciar Sesión',
          primary: true,
          variant: 'primary'
        })
      );
    });

    it('should generate manual intervention action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.INVALID_PROFILE_DATA,
        'low',
        false,
        undefined,
        undefined,
        'manual_intervention'
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Revisar Datos',
          primary: true,
          variant: 'secondary'
        })
      );
    });

    it('should generate graceful degradation action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.AUTO_SAVE_FAILED,
        'medium',
        true,
        undefined,
        undefined,
        'graceful_degradation'
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Continuar',
          primary: true,
          variant: 'secondary'
        })
      );
    });

    it('should always include home action', () => {
      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.UNKNOWN_ERROR
      );

      const actions = handler.getRecoveryActions(error);

      expect(actions).toContainEqual(
        expect.objectContaining({
          label: 'Ir al Inicio',
          variant: 'ghost'
        })
      );
    });
  });

  describe('Logging', () => {
    const originalEnv = process.env.NODE_ENV;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('should log errors in development', () => {
      process.env.NODE_ENV = 'development';

      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.PROFILE_SAVE_FAILED
      );

      handler.handleError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ProfileErrorHandler]',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'ProfileError',
            message: 'Test error',
            code: ProfileErrorCodes.PROFILE_SAVE_FAILED
          })
        })
      );
    });

    it('should not log to console in production', () => {
      process.env.NODE_ENV = 'production';

      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.PROFILE_SAVE_FAILED,
        'low' // Low severity should not trigger monitoring
      );

      handler.handleError(error);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should include context in log data', () => {
      process.env.NODE_ENV = 'development';

      const error = new ProfileError(
        'Test error',
        ProfileErrorCodes.PROFILE_SAVE_FAILED
      );
      const context = { userId: '123', operation: 'save' };

      handler.handleError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ProfileErrorHandler]',
        expect.objectContaining({
          error: expect.objectContaining({
            context: expect.objectContaining(context)
          })
        })
      );
    });
  });

  describe('Default user messages', () => {
    it('should provide appropriate Spanish messages for all error codes', () => {
      const testCases: Array<{ code: ProfileErrorCode; expectedSubstring: string }> = [
        { code: ProfileErrorCodes.INVALID_PROFILE_DATA, expectedSubstring: 'datos del perfil' },
        { code: ProfileErrorCodes.REQUIRED_FIELD_MISSING, expectedSubstring: 'obligatorio' },
        { code: ProfileErrorCodes.INVALID_EMAIL_FORMAT, expectedSubstring: 'email' },
        { code: ProfileErrorCodes.INVALID_PHONE_FORMAT, expectedSubstring: 'teléfono' },
        { code: ProfileErrorCodes.INVALID_HOUSEHOLD_SIZE, expectedSubstring: 'miembros del hogar' },
        { code: ProfileErrorCodes.INVALID_BUDGET_AMOUNT, expectedSubstring: 'presupuesto' },
        { code: ProfileErrorCodes.USER_NOT_AUTHENTICATED, expectedSubstring: 'iniciar sesión' },
        { code: ProfileErrorCodes.SESSION_EXPIRED, expectedSubstring: 'sesión ha expirado' },
        { code: ProfileErrorCodes.INSUFFICIENT_PERMISSIONS, expectedSubstring: 'permisos' },
        { code: ProfileErrorCodes.PROFILE_ACCESS_DENIED, expectedSubstring: 'acceso' },
        { code: ProfileErrorCodes.PROFILE_SAVE_FAILED, expectedSubstring: 'guardar' },
        { code: ProfileErrorCodes.PROFILE_LOAD_FAILED, expectedSubstring: 'cargar' },
        { code: ProfileErrorCodes.NETWORK_CONNECTION_FAILED, expectedSubstring: 'conexión' },
        { code: ProfileErrorCodes.SERVICE_UNAVAILABLE, expectedSubstring: 'servicio' },
        { code: ProfileErrorCodes.AUTO_SAVE_FAILED, expectedSubstring: 'automáticamente' },
        { code: ProfileErrorCodes.SYNC_CONFLICT, expectedSubstring: 'sincronización' },
        { code: ProfileErrorCodes.UNKNOWN_ERROR, expectedSubstring: 'error inesperado' }
      ];

      testCases.forEach(({ code, expectedSubstring }) => {
        const error = new ProfileError('Test error', code);
        const message = error.getUserMessage();
        
        expect(message.toLowerCase()).toContain(expectedSubstring.toLowerCase());
      });
    });

    it('should handle context in user messages', () => {
      const error = new ProfileError(
        'Required field missing',
        ProfileErrorCodes.REQUIRED_FIELD_MISSING,
        'low',
        false,
        { field: 'username' }
      );

      const message = error.getUserMessage();
      expect(message).toContain('username');
    });
  });
});