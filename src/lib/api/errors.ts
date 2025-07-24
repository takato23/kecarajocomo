export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.message,
      status: this.status,
      code: this.code,
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export function handleApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error.status === 401) {
    return new AuthenticationError(error.message);
  }

  if (error.status === 403) {
    return new AuthorizationError(error.message);
  }

  if (error.status === 404) {
    return new NotFoundError(error.message || 'Resource');
  }

  if (error.status === 409) {
    return new ConflictError(error.message);
  }

  if (error.status === 429) {
    return new RateLimitError(error.message);
  }

  return new ApiError(
    error.message || 'An unexpected error occurred',
    error.status || 500
  );
}