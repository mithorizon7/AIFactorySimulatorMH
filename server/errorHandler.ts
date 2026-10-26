import { Request, Response, NextFunction } from "express";
import { logger, LogContext } from "./logger";
import { ZodError } from "../shared/validation";
import { randomUUID } from "crypto";

type RequestWithId = Request & { requestId?: string };

export function getRequestId(req: Request): string {
  return (req as RequestWithId).requestId ?? "unknown";
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.get("X-Request-ID");
  const requestId =
    incoming && /^[A-Za-z0-9._:-]{1,128}$/.test(incoming)
      ? incoming
      : randomUUID();
  (req as RequestWithId).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

// Custom application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly incidentId: string;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    incidentId?: string,
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
    url: req.path,
    requestId: getRequestId(req),
  };
}

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
  type?: unknown;
};

function asErrorLike(error: unknown): ErrorLike {
  return typeof error === "object" && error !== null ? error : {};
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown thrown value");
}

/**
 * Handle different types of errors and return appropriate user-friendly messages
 */
function getErrorResponse(error: unknown): {
  statusCode: number;
  userMessage: string;
  errorType: string;
} {
  const errorLike = asErrorLike(error);
  if (errorLike.type === "encoding.unsupported") {
    return {
      statusCode: 415,
      userMessage: "Compressed request bodies are not supported.",
      errorType: "UNSUPPORTED_CONTENT_ENCODING",
    };
  }
  if (errorLike.type === "entity.parse.failed") {
    return {
      statusCode: 400,
      userMessage: "The request body is not valid JSON.",
      errorType: "INVALID_JSON",
    };
  }

  if (errorLike.type === "entity.too.large" || errorLike.status === 413) {
    return {
      statusCode: 413,
      userMessage: "The request body exceeds the 16 KB limit.",
      errorType: "PAYLOAD_TOO_LARGE",
    };
  }

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      userMessage:
        "The information provided is invalid. Please check your input and try again.",
      errorType: "VALIDATION_ERROR",
    };
  }

  // Application errors with known status codes
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      userMessage: error.message,
      errorType: "APPLICATION_ERROR",
    };
  }

  // Database errors
  if (
    typeof errorLike.code === "string" &&
    (errorLike.code.startsWith("P") || errorLike.code.includes("DATABASE"))
  ) {
    return {
      statusCode: 500,
      userMessage:
        "We are experiencing technical difficulties. Please try again in a few moments.",
      errorType: "DATABASE_ERROR",
    };
  }

  // Network/timeout errors
  if (
    errorLike.code === "ECONNREFUSED" ||
    errorLike.code === "ETIMEDOUT" ||
    errorLike.code === "ENOTFOUND"
  ) {
    return {
      statusCode: 503,
      userMessage: "Service temporarily unavailable. Please try again later.",
      errorType: "NETWORK_ERROR",
    };
  }

  // Permission/authorization errors
  if (errorLike.statusCode === 401 || errorLike.statusCode === 403) {
    return {
      statusCode: errorLike.statusCode,
      userMessage: "You do not have permission to access this resource.",
      errorType: "AUTHORIZATION_ERROR",
    };
  }

  // Rate limiting errors
  if (errorLike.statusCode === 429) {
    return {
      statusCode: 429,
      userMessage: "Too many requests. Please wait a moment and try again.",
      errorType: "RATE_LIMIT_ERROR",
    };
  }

  // File/upload errors
  if (
    errorLike.code === "LIMIT_FILE_SIZE" ||
    errorLike.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return {
      statusCode: 413,
      userMessage:
        "The file you are trying to upload is too large or in an unsupported format.",
      errorType: "FILE_ERROR",
    };
  }

  // Default to generic error for unknown errors
  return {
    statusCode: 500,
    userMessage: "An unexpected error occurred. Please try again.",
    errorType: "INTERNAL_ERROR",
  };
}

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
export function globalErrorHandler(
  thrown: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(thrown);
    return;
  }

  const error = normalizeError(thrown);
  // Extract request context
  const requestContext = extractRequestContext(req);

  // Get appropriate error response
  const { statusCode, userMessage, errorType } = getErrorResponse(thrown);

  // Generate incident ID if not already present
  let incidentId: string;
  if (thrown instanceof AppError && thrown.incidentId) {
    incidentId = thrown.incidentId;
  } else {
    incidentId = logger.generateIncidentId();
  }

  // Log the error with full context
  const logContext: LogContext = {
    ...requestContext,
    incidentId,
    operation: "error_handler",
    functionName: "globalErrorHandler",
    errorType,
    statusCode,
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error("Server request failed", new Error(errorType), logContext);
  } else if (statusCode >= 400) {
    logger.warn(`Client request failed: ${errorType}`, logContext);
  } else {
    logger.info(`Request failed: ${errorType}`, logContext);
  }

  // Send user-friendly error response
  res.status(statusCode).json({
    error: {
      code: errorType,
      message: userMessage,
      ...(req.app.get("env") === "development" && {
        details: { originalMessage: error.message },
      }),
    },
    meta: { requestId: getRequestId(req), incidentId },
  });
}

/**
 * Handle 404 Not Found errors
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const error = new AppError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    true,
  );

  const requestContext = extractRequestContext(req);
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    ...requestContext,
    operation: "not_found",
    errorType: "NOT_FOUND",
  });

  next(error);
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data: unknown, requestId: string) {
  return {
    data,
    meta: { requestId },
  };
}

/**
 * Middleware to log all requests
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const requestContext = extractRequestContext(req);

  // Log the incoming request
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    ...requestContext,
    operation: "incoming_request",
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.logApiRequest(req.method, req.path, res.statusCode, duration, {
      ...requestContext,
      responseSize: res.getHeader("Content-Length") ?? null,
    });
  });

  next();
}
