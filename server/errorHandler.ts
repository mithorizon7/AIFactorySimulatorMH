import { Request, Response, NextFunction } from 'express';
import { logger, LogContext } from './logger';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Custom application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly incidentId: string;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    incidentId?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.incidentId = incidentId || logger.generateIncidentId();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Extract request context for logging
 */
export function extractRequestContext(req: Request): LogContext {
  return {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    requestId: req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    requestBody: req.method !== 'GET' ? req.body : undefined
  };
}

/**
 * Async wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle different types of errors and return appropriate user-friendly messages
 */
function getErrorResponse(error: any): { statusCode: number; userMessage: string; errorType: string } {
  // Validation errors (Zod)
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    return {
      statusCode: 400,
      userMessage: 'The information provided is invalid. Please check your input and try again.',
      errorType: 'VALIDATION_ERROR'
    };
  }

  // Application errors with known status codes
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      userMessage: error.message,
      errorType: 'APPLICATION_ERROR'
    };
  }

  // Database errors
  if (error.code && (error.code.startsWith('P') || error.code.includes('DATABASE'))) {
    return {
      statusCode: 500,
      userMessage: 'We are experiencing technical difficulties. Please try again in a few moments.',
      errorType: 'DATABASE_ERROR'
    };
  }

  // Network/timeout errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return {
      statusCode: 503,
      userMessage: 'Service temporarily unavailable. Please try again later.',
      errorType: 'NETWORK_ERROR'
    };
  }

  // Permission/authorization errors
  if (error.statusCode === 401 || error.statusCode === 403) {
    return {
      statusCode: error.statusCode,
      userMessage: 'You do not have permission to access this resource.',
      errorType: 'AUTHORIZATION_ERROR'
    };
  }

  // Rate limiting errors
  if (error.statusCode === 429) {
    return {
      statusCode: 429,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      errorType: 'RATE_LIMIT_ERROR'
    };
  }

  // File/upload errors
  if (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_UNEXPECTED_FILE') {
    return {
      statusCode: 413,
      userMessage: 'The file you are trying to upload is too large or in an unsupported format.',
      errorType: 'FILE_ERROR'
    };
  }

  // Default to generic error for unknown errors
  return {
    statusCode: 500,
    userMessage: 'An unexpected error occurred. Our team has been notified and is working to resolve the issue.',
    errorType: 'INTERNAL_ERROR'
  };
}

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract request context
  const requestContext = extractRequestContext(req);
  
  // Get appropriate error response
  const { statusCode, userMessage, errorType } = getErrorResponse(err);
  
  // Generate incident ID if not already present
  let incidentId: string;
  if (err instanceof AppError && err.incidentId) {
    incidentId = err.incidentId;
  } else {
    incidentId = logger.generateIncidentId();
  }

  // Log the error with full context
  const logContext: LogContext = {
    ...requestContext,
    incidentId,
    operation: 'error_handler',
    functionName: 'globalErrorHandler',
    errorType,
    statusCode
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error(`Server Error: ${err.message}`, err, logContext);
  } else if (statusCode >= 400) {
    logger.warn(`Client Error: ${err.message}`, logContext);
  } else {
    logger.info(`Request Error: ${err.message}`, logContext);
  }

  // Send user-friendly error response
  res.status(statusCode).json({
    success: false,
    message: userMessage,
    incidentId,
    timestamp: new Date().toISOString(),
    // Include additional details for development
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        originalMessage: err.message,
        errorType,
        stack: err.stack
      }
    })
  });
}

/**
 * Handle 404 Not Found errors
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    true
  );
  
  const requestContext = extractRequestContext(req);
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    ...requestContext,
    operation: 'not_found',
    errorType: 'NOT_FOUND'
  });
  
  next(error);
}

/**
 * Wrapper for database operations with automatic error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  params?: any
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const incidentId = logger.logDatabaseError(operationName, error as Error, params);
    throw new AppError(
      `Database operation failed: ${operationName}`,
      500,
      true,
      incidentId
    );
  }
}

/**
 * Wrapper for business logic operations with automatic error handling
 */
export async function withBusinessLogicErrorHandling<T>(
  operation: () => Promise<T>,
  functionName: string,
  functionArgs?: any
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // If it's already an AppError, just re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    const incidentId = logger.logBusinessError(functionName, error as Error, functionArgs);
    throw new AppError(
      `Business logic error: ${functionName}`,
      500,
      true,
      incidentId
    );
  }
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    message: message || 'Operation completed successfully',
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Middleware to log all requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestContext = extractRequestContext(req);
  
  // Log the incoming request
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    ...requestContext,
    operation: 'incoming_request'
  });
  
  // Capture response details
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    
    logger.logApiRequest(
      req.method,
      req.url,
      res.statusCode,
      duration,
      {
        ...requestContext,
        responseSize: body ? body.length : 0
      }
    );
    
    return originalSend.call(this, body);
  };
  
  next();
}