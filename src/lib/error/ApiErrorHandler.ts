/**
 * Sistema avanzado de manejo de errores para APIs
 * Incluye retry automático, circuit breaker, y reportes detallados
 */

import { errorReportingService } from './ErrorReporting';
import { logger } from '@/services/logger';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  endpoint?: string;
  method?: string;
  retryable?: boolean;
  timestamp?: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

export interface ApiErrorHandlerConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  enableReporting: boolean;
  enableMetrics: boolean;
}

// Estado del circuit breaker para cada endpoint
interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  state: 'closed' | 'open' | 'half-open';
  nextAttempt: Date | null;
}

/**
 * Manejador avanzado de errores de API con circuit breaker y retry automático
 */
export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private config: ApiErrorHandlerConfig;

  private readonly defaultConfig: ApiErrorHandlerConfig = {
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringWindow: 60000, // 1 minute
    },
    enableReporting: true,
    enableMetrics: true,
  };

  constructor(config: Partial<ApiErrorHandlerConfig> = {}) {
    this.config = {
      ...this.defaultConfig,
      ...config,
      retry: { ...this.defaultConfig.retry, ...config.retry },
      circuitBreaker: { ...this.defaultConfig.circuitBreaker, ...config.circuitBreaker },
    };
  }

  static getInstance(config?: Partial<ApiErrorHandlerConfig>): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler(config);
    }
    return ApiErrorHandler.instance;
  }

  /**
   * Envuelve una función de API con manejo de errores, retry y circuit breaker
   */
  async withErrorHandling<T>(
    apiFunction: () => Promise<T>,
    endpoint: string,
    options: {
      method?: string;
      customRetry?: Partial<RetryConfig>;
      skipCircuitBreaker?: boolean;
      context?: Record<string, any>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', customRetry, skipCircuitBreaker = false, context = {} } = options;
    
    // Check circuit breaker
    if (!skipCircuitBreaker && this.isCircuitOpen(endpoint)) {
      const error = this.createApiError(
        'Circuit breaker is open',
        503,
        'CIRCUIT_BREAKER_OPEN',
        endpoint,
        method
      );
      await this.reportError(error, { ...context, circuitBreakerOpen: true });
      throw error;
    }

    const retryConfig = { ...this.config.retry, ...customRetry };
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await apiFunction();
        
        // Success - reset circuit breaker if it was in recovery
        this.recordSuccess(endpoint);
        
        return result;
      } catch (error) {
        const apiError = this.normalizeError(error, endpoint, method);
        lastError = apiError;

        // Record failure
        this.recordFailure(endpoint);

        // Report error (only on final attempt to avoid spam)
        if (attempt === retryConfig.maxAttempts) {
          await this.reportError(apiError, {
            ...context,
            totalAttempts: attempt,
            endpoint,
            method,
          });
        }

        // Check if error is retryable
        if (!this.isRetryable(apiError, retryConfig)) {
          throw apiError;
        }

        // If not the last attempt, wait before retry
        if (attempt < retryConfig.maxAttempts) {
          const delay = this.calculateDelay(attempt, retryConfig);
          logger.info(
            `Retrying API call in ${delay}ms (attempt ${attempt}/${retryConfig.maxAttempts})`,
            'ApiErrorHandler',
            { endpoint, method, delay, attempt }
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Simplifica el uso para fetch requests
   */
  async fetch(
    url: string,
    options: RequestInit & {
      customRetry?: Partial<RetryConfig>;
      skipCircuitBreaker?: boolean;
      context?: Record<string, any>;
    } = {}
  ): Promise<Response> {
    const { customRetry, skipCircuitBreaker, context, ...fetchOptions } = options;
    const method = fetchOptions.method || 'GET';

    return this.withErrorHandling(
      async () => {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          throw this.createApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            'HTTP_ERROR',
            url,
            method
          );
        }
        
        return response;
      },
      url,
      { method, customRetry, skipCircuitBreaker, context }
    );
  }

  /**
   * Helper para hacer requests JSON con manejo de errores
   */
  async fetchJson<T>(
    url: string,
    options: RequestInit & {
      customRetry?: Partial<RetryConfig>;
      skipCircuitBreaker?: boolean;
      context?: Record<string, any>;
    } = {}
  ): Promise<T> {
    const response = await this.fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    try {
      return await response.json();
    } catch (error) {
      throw this.createApiError(
        'Failed to parse JSON response',
        response.status,
        'JSON_PARSE_ERROR',
        url,
        options.method || 'GET'
      );
    }
  }

  /**
   * Normaliza diferentes tipos de errores a ApiError
   */
  private normalizeError(error: any, endpoint: string, method: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    let status = 0;
    let message = 'Unknown error';
    let code = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      message = error.message;
      if ('status' in error) {
        status = error.status;
      }
      if ('code' in error) {
        code = error.code;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    return this.createApiError(message, status, code, endpoint, method);
  }

  /**
   * Crea un ApiError normalizado
   */
  private createApiError(
    message: string,
    status: number,
    code: string,
    endpoint: string,
    method: string
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.name = 'ApiError';
    error.status = status;
    error.code = code;
    error.endpoint = endpoint;
    error.method = method;
    error.timestamp = new Date();
    error.retryable = this.config.retry.retryableStatusCodes.includes(status);
    
    return error;
  }

  /**
   * Determina si un error es retryable
   */
  private isRetryable(error: ApiError, retryConfig: RetryConfig): boolean {
    if (error.status && retryConfig.retryableStatusCodes.includes(error.status)) {
      return true;
    }
    
    // Network errors are generally retryable
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return true;
    }
    
    return false;
  }

  /**
   * Calcula el delay para el siguiente retry con exponential backoff
   */
  private calculateDelay(attempt: number, retryConfig: RetryConfig): number {
    const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, retryConfig.maxDelay);
  }

  /**
   * Circuit breaker logic
   */
  private getCircuitBreakerState(endpoint: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, {
        failures: 0,
        lastFailure: null,
        state: 'closed',
        nextAttempt: null,
      });
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  private isCircuitOpen(endpoint: string): boolean {
    const state = this.getCircuitBreakerState(endpoint);
    
    if (state.state === 'open') {
      if (state.nextAttempt && new Date() >= state.nextAttempt) {
        state.state = 'half-open';
        logger.info('Circuit breaker moving to half-open state', 'ApiErrorHandler', { endpoint });
        return false;
      }
      return true;
    }
    
    return false;
  }

  private recordFailure(endpoint: string): void {
    const state = this.getCircuitBreakerState(endpoint);
    state.failures++;
    state.lastFailure = new Date();

    if (state.failures >= this.config.circuitBreaker.failureThreshold) {
      state.state = 'open';
      state.nextAttempt = new Date(Date.now() + this.config.circuitBreaker.recoveryTimeout);
      
      logger.warn('Circuit breaker opened', 'ApiErrorHandler', {
        endpoint,
        failures: state.failures,
        threshold: this.config.circuitBreaker.failureThreshold,
        recoveryTimeout: this.config.circuitBreaker.recoveryTimeout,
      });
    }
  }

  private recordSuccess(endpoint: string): void {
    const state = this.getCircuitBreakerState(endpoint);
    
    if (state.state === 'half-open') {
      state.state = 'closed';
      state.failures = 0;
      state.lastFailure = null;
      state.nextAttempt = null;
      
      logger.info('Circuit breaker closed after successful recovery', 'ApiErrorHandler', { endpoint });
    } else if (state.failures > 0) {
      // Gradual recovery - reduce failures on success
      state.failures = Math.max(0, state.failures - 1);
    }
  }

  /**
   * Reporta errores al sistema de monitoreo
   */
  private async reportError(error: ApiError, context: Record<string, any> = {}): Promise<void> {
    if (!this.config.enableReporting) {
      return;
    }

    try {
      await errorReportingService.reportError(error, {
        component: 'ApiErrorHandler',
        custom: {
          endpoint: error.endpoint,
          method: error.method,
          status: error.status,
          code: error.code,
          retryable: error.retryable,
          timestamp: error.timestamp,
          ...context,
        },
      });
    } catch (reportingError) {
      logger.error('Failed to report API error:', 'ApiErrorHandler', reportingError);
    }
  }

  /**
   * Helper para sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene métricas del circuit breaker
   */
  getCircuitBreakerMetrics(): Record<string, CircuitBreakerState> {
    const metrics: Record<string, CircuitBreakerState> = {};
    for (const [endpoint, state] of this.circuitBreakers.entries()) {
      metrics[endpoint] = { ...state };
    }
    return metrics;
  }

  /**
   * Reset manual del circuit breaker
   */
  resetCircuitBreaker(endpoint?: string): void {
    if (endpoint) {
      this.circuitBreakers.delete(endpoint);
      logger.info('Circuit breaker reset for endpoint', 'ApiErrorHandler', { endpoint });
    } else {
      this.circuitBreakers.clear();
      logger.info('All circuit breakers reset', 'ApiErrorHandler');
    }
  }

  /**
   * Actualiza configuración
   */
  updateConfig(config: Partial<ApiErrorHandlerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      retry: { ...this.config.retry, ...config.retry },
      circuitBreaker: { ...this.config.circuitBreaker, ...config.circuitBreaker },
    };
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance();

// Export helper functions
export const withApiErrorHandling = apiErrorHandler.withErrorHandling.bind(apiErrorHandler);
export const fetchWithErrorHandling = apiErrorHandler.fetch.bind(apiErrorHandler);
export const fetchJsonWithErrorHandling = apiErrorHandler.fetchJson.bind(apiErrorHandler);