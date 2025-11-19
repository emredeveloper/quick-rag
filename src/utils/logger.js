/**
 * Structured Logging with Pino
 * 
 * Centralized logging utility for the entire library
 */

import pino from 'pino';
import fs from 'fs';
import path from 'path';

/**
 * Create logger instance
 * 
 * @param {Object} options - Logger options
 * @param {string} options.level - Log level (trace, debug, info, warn, error, fatal)
 * @param {string} options.logFile - Optional log file path
 * @param {boolean} options.pretty - Pretty print for development
 * @returns {pino.Logger} Logger instance
 */
export function createLogger(options = {}) {
    const {
        level = process.env.LOG_LEVEL || 'info',
        logFile,
        pretty = process.env.NODE_ENV !== 'production'
    } = options;

    const streams = [];

    // Console output
    if (pretty) {
        streams.push({
            level,
            stream: pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname'
                }
            })
        });
    } else {
        streams.push({ level, stream: process.stdout });
    }

    // File output
    if (logFile) {
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        streams.push({
            level,
            stream: pino.destination(logFile)
        });
    }

    return pino(
        {
            level,
            base: {
                app: 'quick-rag'
            }
        },
        streams.length > 1 ? pino.multistream(streams) : streams[0].stream
    );
}

// Default logger instance
export const logger = createLogger();

/**
 * Create child logger with context
 * 
 * @param {string} component - Component name
 * @param {Object} context - Additional context
 * @returns {pino.Logger} Child logger
 */
export function createComponentLogger(component, context = {}) {
    return logger.child({ component, ...context });
}

/**
 * Log performance metrics
 * 
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in ms
 * @param {Object} metadata - Additional metadata
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
 * 
 * @param {Error} error - Error object
 * @param {string} operation - Operation that failed
 * @param {Object} context - Additional context
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
    }, `Error in ${operation}: ${error.message}`);
}

export default logger;
