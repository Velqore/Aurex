/**
 * Logging Utility
 * Centralized logging system with levels and production safety
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    return `[${timestamp}] ${entry.level} ${context} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context
    };

    const formattedMessage = this.formatMessage(entry);

    // In development, use console with colors
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.DEBUG:
          console.log(formattedMessage, data || '');
          break;
      }
    } else {
      // In production, only log to structured output (could integrate with external service)
      if (level === LogLevel.ERROR || level === LogLevel.WARN) {
        console.error(JSON.stringify(entry));
      }
    }
  }

  error(message: string, error?: Error | any, context?: string): void {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack
    }, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  // Security audit logging
  security(message: string, data?: any): void {
    this.log(LogLevel.WARN, `SECURITY: ${message}`, data, 'SECURITY');
  }

  // Authentication audit logging
  auth(message: string, data?: any): void {
    this.log(LogLevel.INFO, `AUTH: ${message}`, {
      ...data,
      // Sanitize sensitive data
      password: undefined,
      token: data?.token ? '***' : undefined
    }, 'AUTH');
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const logError = (message: string, error?: Error | any, context?: string) => 
  logger.error(message, error, context);

export const logWarn = (message: string, data?: any, context?: string) => 
  logger.warn(message, data, context);

export const logInfo = (message: string, data?: any, context?: string) => 
  logger.info(message, data, context);

export const logDebug = (message: string, data?: any, context?: string) => 
  logger.debug(message, data, context);

export const logSecurity = (message: string, data?: any) => 
  logger.security(message, data);

export const logAuth = (message: string, data?: any) => 
  logger.auth(message, data);

export default logger;
