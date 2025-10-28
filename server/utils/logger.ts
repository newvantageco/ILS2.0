/**
 * Logger utility for structured logging across the application
 * Provides consistent log levels and formatting
 */

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error | string, meta?: Record<string, any>): void;
}

class ConsoleLogger implements Logger {
  private context: string;

  constructor(context: string = "App") {
    this.context = context;
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[${this.context}:DEBUG]`, message, meta || "");
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(`[${this.context}:INFO]`, message, meta || "");
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[${this.context}:WARN]`, message, meta || "");
  }

  error(message: string, error?: Error | string, meta?: Record<string, any>): void {
    console.error(`[${this.context}:ERROR]`, message, error || "", meta || "");
  }
}

export const createLogger = (context: string): Logger => {
  return new ConsoleLogger(context);
};

export const logger = createLogger("ILS");
