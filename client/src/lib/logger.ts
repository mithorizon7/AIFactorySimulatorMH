// Frontend logging utility that matches backend structured logging

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  incidentId?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  component?: string;
  operation?: string;
  functionName?: string;
  functionArgs?: any;
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

class FrontendLogger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName = 'ai-factory-frontend', environment = import.meta.env.MODE || 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  /**
   * Generate a unique incident ID for tracking errors across systems
   */
  generateIncidentId(): string {
    return `INC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Core logging method that outputs structured logs
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const incidentId = context?.incidentId || (level === 'ERROR' || level === 'FATAL' ? this.generateIncidentId() : undefined);
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      incidentId,
      context: {
        ...context,
        service: this.serviceName,
        environment: this.environment,
        url: window.location.href,
        userAgent: navigator.userAgent,
        // Add stack trace for errors
        ...(error && { 
          stackTrace: error.stack,
          errorCode: error.name 
        })
      }
    };

    // Add detailed error information
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    // Output structured log (in development, use console methods with styling)
    if (this.environment === 'development') {
      const consoleMethod = level === 'ERROR' || level === 'FATAL' ? 'error' : 
                          level === 'WARN' ? 'warn' : 'log';
      console[consoleMethod](`[${level}] ${message}`, logEntry);
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
    
    return incidentId || '';
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  /**
   * Error level logging with full context
   */
  error(message: string, error?: Error, context?: LogContext): string {
    return this.log('ERROR', message, context, error);
  }

  /**
   * Fatal level logging for critical failures
   */
  fatal(message: string, error?: Error, context?: LogContext): string {
    return this.log('FATAL', message, context, error);
  }

  /**
   * Log API errors with context
   */
  logApiError(method: string, url: string, status: number, error: Error, requestBody?: any, context?: LogContext): string {
    return this.error(`API Error: ${method} ${url} ${status} - ${error.message}`, error, {
      ...context,
      operation: 'api_error',
      method,
      url,
      status,
      requestBody
    });
  }

  /**
   * Log component errors with context
   */
  logComponentError(componentName: string, error: Error, context?: LogContext): string {
    return this.error(`Component Error: ${componentName} - ${error.message}`, error, {
      ...context,
      operation: 'component_error',
      component: componentName
    });
  }

  /**
   * Log user interaction errors
   */
  logUserInteractionError(action: string, error: Error, context?: LogContext): string {
    return this.error(`User Interaction Error: ${action} - ${error.message}`, error, {
      ...context,
      operation: 'user_interaction_error',
      action
    });
  }

  /**
   * Log network/connectivity errors
   */
  logNetworkError(error: Error, context?: LogContext): string {
    return this.error(`Network Error: ${error.message}`, error, {
      ...context,
      operation: 'network_error'
    });
  }
}

// Export singleton logger instance
export const logger = new FrontendLogger();

// Custom error class for frontend
export class FrontendError extends Error {
  public readonly statusCode?: number;
  public readonly incidentId: string;

  constructor(
    message: string,
    statusCode?: number,
    incidentId?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.incidentId = incidentId || logger.generateIncidentId();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Utility to safely stringify objects with circular references
export function safeStringify(obj: any): string {
  const seen = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  });
}