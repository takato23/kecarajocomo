/**
 * Gemini API Error Handler
 * Provides consistent error handling and user-friendly messages
 */

import { logger } from '@/lib/logger';

export enum GeminiErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GeminiError extends Error {
  code: GeminiErrorCode;
  details?: any;
  retryable: boolean;
  userMessage: string;
}

export class GeminiErrorHandler {
  /**
   * Handle errors and convert to user-friendly format
   */
  static handleError(error: unknown, context: string): GeminiError {
    logger.error(`Gemini error in ${context}:`, 'geminiErrorHandler', error);

    if (error instanceof Error) {
      // API Key errors
      if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        return this.createError(
          GeminiErrorCode.INVALID_API_KEY,
          'AI service configuration error. Please contact support.',
          error,
          false
        );
      }

      // Rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return this.createError(
          GeminiErrorCode.RATE_LIMIT_EXCEEDED,
          'Service is temporarily busy. Please try again in a few minutes.',
          error,
          true
        );
      }

      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return this.createError(
          GeminiErrorCode.TIMEOUT,
          'Request took too long. Please try again with simpler requirements.',
          error,
          true
        );
      }

      // Network errors
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return this.createError(
          GeminiErrorCode.NETWORK_ERROR,
          'Network connection error. Please check your connection and try again.',
          error,
          true
        );
      }

      // Parse errors
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        return this.createError(
          GeminiErrorCode.PARSE_ERROR,
          'Received invalid response from AI service. Please try again.',
          error,
          true
        );
      }

      // Validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return this.createError(
          GeminiErrorCode.VALIDATION_ERROR,
          'Invalid request data. Please check your inputs and try again.',
          error,
          false
        );
      }

      // Server errors
      if (error.message.includes('500') || error.message.includes('server')) {
        return this.createError(
          GeminiErrorCode.SERVER_ERROR,
          'AI service is temporarily unavailable. Please try again later.',
          error,
          true
        );
      }
    }

    // Unknown errors
    return this.createError(
      GeminiErrorCode.UNKNOWN_ERROR,
      'An unexpected error occurred. Please try again.',
      error as Error,
      true
    );
  }

  /**
   * Create a standardized error object
   */
  private static createError(
    code: GeminiErrorCode,
    userMessage: string,
    originalError: Error,
    retryable: boolean
  ): GeminiError {
    const error = new Error(originalError.message) as GeminiError;
    error.code = code;
    error.userMessage = userMessage;
    error.retryable = retryable;
    error.details = {
      originalMessage: originalError.message,
      stack: originalError.stack,
      timestamp: new Date().toISOString()
    };
    
    return error;
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: GeminiError, attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    
    switch (error.code) {
      case GeminiErrorCode.RATE_LIMIT_EXCEEDED:
        // Longer delay for rate limits
        return Math.min(baseDelay * Math.pow(3, attemptNumber), 60000); // Max 1 minute
      
      case GeminiErrorCode.TIMEOUT:
      case GeminiErrorCode.NETWORK_ERROR:
        // Standard exponential backoff
        return Math.min(baseDelay * Math.pow(2, attemptNumber), 30000); // Max 30 seconds
      
      case GeminiErrorCode.SERVER_ERROR:
        // Moderate delay for server errors
        return Math.min(baseDelay * Math.pow(2.5, attemptNumber), 45000); // Max 45 seconds
      
      default:
        // Quick retry for other errors
        return Math.min(baseDelay * attemptNumber, 5000); // Max 5 seconds
    }
  }

  /**
   * Log error with appropriate severity
   */
  static logError(error: GeminiError, context: string): void {
    const logData = {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      context,
      details: error.details
    };

    switch (error.code) {
      case GeminiErrorCode.INVALID_API_KEY:
      case GeminiErrorCode.SERVER_ERROR:
        logger.error('Critical Gemini error', 'geminiErrorHandler', logData);
        break;
      
      case GeminiErrorCode.RATE_LIMIT_EXCEEDED:
      case GeminiErrorCode.TIMEOUT:
        logger.warn('Gemini service issue', 'geminiErrorHandler', logData);
        break;
      
      default:
        logger.info('Gemini error occurred', 'geminiErrorHandler', logData);
    }
  }

  /**
   * Create user-friendly error response
   */
  static createErrorResponse(error: GeminiError): {
    success: false;
    error: string;
    code: string;
    retryable: boolean;
    retryDelay?: number;
  } {
    return {
      success: false,
      error: error.userMessage,
      code: error.code,
      retryable: error.retryable,
      retryDelay: error.retryable ? this.getRetryDelay(error, 1) : undefined
    };
  }
}