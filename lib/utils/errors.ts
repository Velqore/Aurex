/**
 * Error Handling Utilities
 * Standardized error classes and handlers
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: any) {
    super(message, 400, true, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, 401, true, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: any) {
    super(message, 403, true, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: any) {
    super(message, 404, true, context);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: any) {
    super(message, 409, true, context);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', context?: any) {
    super(message, 429, true, context);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: any) {
    super(message, 500, true, context);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, context?: any) {
    super(message, 500, false, context);
    this.name = 'ConfigurationError';
  }
}

/**
 * Handle error and return appropriate response
 */
export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  details?: any;
} {
  // Handle known AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: process.env.NODE_ENV === 'development' ? error.context : undefined
    };
  }

  // Handle validation errors from libraries
  if (error instanceof Error && error.name === 'ValidationError') {
    return {
      message: error.message,
      statusCode: 400
    };
  }

  // Handle JWT errors
  if (error instanceof Error) {
    if (error.name === 'JsonWebTokenError') {
      return {
        message: 'Invalid token',
        statusCode: 401
      };
    }
    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Token expired',
        statusCode: 401
      };
    }
  }

  // Handle unknown errors
  return {
    message: 'Internal server error',
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' && error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : undefined
  };
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler<T>(
  handler: (req: any, ...args: any[]) => Promise<T>
) {
  return async (req: any, ...args: any[]): Promise<T> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      throw error; // Let Next.js error boundary handle it
    }
  };
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}`,
      { missing }
    );
  }
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ConfigurationError,
  handleError,
  asyncHandler,
  validateEnvVars
};
