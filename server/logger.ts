import { randomUUID } from "crypto";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogContext {
  incidentId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  functionName?: string;
  url?: string;
  method?: string;
  stackTrace?: string;
  errorCode?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  incidentId?: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor(
    serviceName = "ai-factory-backend",
    environment = process.env.NODE_ENV || "development",
  ) {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  /**
   * Generate a unique incident ID for tracking errors across systems
   */
  generateIncidentId(): string {
    return `INC_${Date.now()}_${randomUUID().split("-")[0]}`;
  }

  /**
   * Core logging method that outputs structured JSON
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): string {
    const incidentId =
      context?.incidentId ||
      (level === "ERROR" || level === "FATAL"
        ? this.generateIncidentId()
        : undefined);

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      incidentId,
      context: {
        ...this.sanitizeContext(context),
        service: this.serviceName,
        environment: this.environment,
        pid: process.pid,
        // Add stack trace for errors
        ...(error && {
          stackTrace: error.stack,
          errorCode: error.name,
        }),
      },
    };

    // Add detailed error information
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Output structured JSON log
    console.log(JSON.stringify(logEntry));

    return incidentId || "";
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    const blocked = new Set([
      "requestBody",
      "responseBody",
      "body",
      "cookie",
      "cookies",
      "authorization",
      "password",
      "secret",
      "snapshot",
      "command",
      "commands",
      "functionArgs",
      "playerName",
      "userAgent",
      "ip",
    ]);
    return Object.fromEntries(
      Object.entries(context).filter(([key]) => !blocked.has(key)),
    );
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    this.log("DEBUG", message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.log("INFO", message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.log("WARN", message, context);
  }

  /**
   * Error level logging with full context and stack traces
   */
  error(message: string, error?: Error, context?: LogContext): string {
    return this.log("ERROR", message, context, error);
  }

  /**
   * Fatal level logging for critical system failures
   */
  fatal(message: string, error?: Error, context?: LogContext): string {
    return this.log("FATAL", message, context, error);
  }

  /**
   * Log API request details for tracking
   */
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void {
    this.info(`API Request: ${method} ${url} ${statusCode} in ${duration}ms`, {
      ...context,
      operation: "api_request",
      method,
      url,
      statusCode,
      duration,
    });
  }
}

// Export singleton logger instance
export const logger = new Logger();
