/**
 * Base error class for Gemini-related errors
 */
export class GeminiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GeminiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class GeminiRateLimitError extends GeminiError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'GeminiRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when token limits are exceeded
 */
export class GeminiTokenLimitError extends GeminiError {
  public tokenCount?: number;
  public tokenLimit?: number;

  constructor(message: string, tokenCount?: number, tokenLimit?: number) {
    super(message, 'TOKEN_LIMIT_EXCEEDED');
    this.name = 'GeminiTokenLimitError';
    this.tokenCount = tokenCount;
    this.tokenLimit = tokenLimit;
  }
}

/**
 * Error thrown when JSON parsing fails
 */
export class GeminiParseError extends GeminiError {
  public rawResponse?: string;

  constructor(message: string, rawResponse?: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'GeminiParseError';
    this.rawResponse = rawResponse;
  }
}

/**
 * Error thrown when validation fails
 */
export class GeminiValidationError extends GeminiError {
  public validationErrors?: string[];

  constructor(message: string, validationErrors?: string[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'GeminiValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Error thrown when the service is unavailable
 */
export class GeminiServiceError extends GeminiError {
  constructor(message: string) {
    super(message, 'SERVICE_ERROR');
    this.name = 'GeminiServiceError';
  }
}