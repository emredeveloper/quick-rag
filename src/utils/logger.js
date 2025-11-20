/**
 * Structured Logging with Pino
 * 
 * Centralized logging utility for the entire library
 */

// Simple logger fallback for environments without pino
let pino;
try {
  pino = (await import('pino')).default;
} catch {
  // Pino not installed, use console fallback
  pino = null;
}

/**
 * Create logger instance
 */
export function createLogger(options = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    pretty = process.env.NODE_ENV !== 'production'
  } = options;

  if (!pino) {
    // Console fallback
    return {
      trace: (...args) => console.log(...args),
      debug: (...args) => console.log(...args),
      info: (...args) => console.log(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => console.error(...args),
      fatal: (...args) => console.error(...args),
      child: () => logger
    };
  }

  return pino({ level, base: { app: 'quick-rag' } });
}

// Default logger instance
export const logger = createLogger();

/**
 * Create child logger with context
 */
export function createComponentLogger(component, context = {}) {
  return logger.child({ component, ...context });
}

/**
 * Log performance metrics
 */
export function logPerformance(operation, duration, metadata = {}) {
  logger.info({
    type: 'performance',
    operation,
    duration,
    ...metadata
  }, `${operation} completed in ${duration}ms`);
}

/**
 * Log error with context
 */
export function logError(error, operation, context = {}) {
  logger.error({
    type: 'error',
    operation,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    ...context
  }, `Error in ${operation}`);
}
