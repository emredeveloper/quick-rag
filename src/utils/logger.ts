/**
 * Structured Logging with Pino
 * 
 * Centralized logging utility for the entire library
 */

import pino, { Logger, LoggerOptions } from 'pino';
import fs from 'fs';
import path from 'path';

export interface LoggerConfig {
    level?: string;
    logFile?: string;
    pretty?: boolean;
}

/**
 * Create logger instance
 */
export function createLogger(options: LoggerConfig = {}): Logger {
    const {
        level = process.env.LOG_LEVEL || 'info',
        logFile,
        pretty = process.env.NODE_ENV !== 'production'
    } = options;

    const streams: any[] = [];

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
 */
export function createComponentLogger(component: string, context: object = {}): Logger {
    return logger.child({ component, ...context });
}

/**
 * Log performance metrics
 */
export function logPerformance(operation: string, duration: number, metadata: object = {}): void {
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
export function logError(error: Error, operation: string, context: object = {}): void {
    logger.error({
        type: 'error',
        operation,
        error: {
            message: error.message,
            code: (error as any).code,
            stack: error.stack
        },
        ...context
    }, `Error in ${operation}: ${error.message}`);
}

export default logger;
