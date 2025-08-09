/**
 * Centralized Logging Service
 * Provides structured logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private createLogEntry(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data
    };
  }

  private log(entry: LogEntry) {
    // In production, you would send this to a logging service
    // For now, we'll use console methods based on environment
    
    if (this.isProduction && entry.level === 'debug') {
      // Don't log debug messages in production
      return;
    }

    const logMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage, entry.data || '');
        }
        break;
      case 'info':
        console.info(logMessage, entry.data || '');
        break;
      case 'warn':
        console.warn(logMessage, entry.data || '');
        break;
      case 'error':
        console.error(logMessage, entry.data || '');
        break;
    }

    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
  }

  debug(message: string, context?: string, data?: any) {
    this.log(this.createLogEntry('debug', message, context, data));
  }

  info(message: string, context?: string, data?: any) {
    this.log(this.createLogEntry('info', message, context, data));
  }

  warn(message: string, context?: string, data?: any) {
    this.log(this.createLogEntry('warn', message, context, data));
  }

  error(message: string, context?: string, data?: any) {
    this.log(this.createLogEntry('error', message, context, data));
  }
}

// Export singleton instance
export const logger = new Logger();