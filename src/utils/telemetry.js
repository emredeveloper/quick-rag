/**
 * Telemetry and Event Tracking
 * 
 * Tracks events and usage patterns across the library
 */

/**
 * Event types
 */
export const EventType = {
    RAG_QUERY: 'rag.query',
    DOCUMENT_ADD: 'document.add',
    DOCUMENT_UPDATE: 'document.update',
    DOCUMENT_DELETE: 'document.delete',
    EMBEDDING_CREATE: 'embedding.create',
    SEARCH_EXECUTE: 'search.execute',
    ERROR_OCCURRED: 'error.occurred',
    MODEL_LOAD: 'model.load'
};

/**
 * Telemetry collector
 */
class TelemetryCollector {
    constructor() {
        this.events = [];
        this.sessionId = this._generateSessionId();
        this.startTime = Date.now();
    }

    /**
     * Track an event
     */
    track(eventType, properties = {}) {
        this.events.push({
            sessionId: this.sessionId,
            timestamp: Date.now(),
            eventType,
            properties
        });
    }

    /**
     * Track RAG query
     */
    trackQuery(query, model, resultCount, duration) {
        this.track(EventType.RAG_QUERY, {
            query: this._hashString(query), // Hash for privacy
            model,
            resultCount,
            duration
        });
    }

    /**
     * Track document operation
     */
    trackDocumentOp(operation, count) {
        this.track(operation, { count });
    }

    /**
     * Track error
     */
    trackError(error, context = {}) {
        this.track(EventType.ERROR_OCCURRED, {
            error: error.message,
            code: error.code,
            ...context
        });
    }

    /**
     * Get events by type
     */
    getEventsByType(eventType) {
        return this.events.filter(e => e.eventType === eventType);
    }

    /**
     * Get events in time range
     */
    getEventsInRange(startTime, endTime) {
        return this.events.filter(
            e => e.timestamp >= startTime && e.timestamp <= endTime
        );
    }

    /**
     * Get session summary
     */
    getSessionSummary() {
        const duration = Date.now() - this.startTime;
        const eventCounts = {};

        this.events.forEach(event => {
            eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
        });

        return {
            sessionId: this.sessionId,
            duration,
            totalEvents: this.events.length,
            eventCounts,
            startTime: this.startTime,
            endTime: Date.now()
        };
    }

    /**
     * Export events
     */
    export(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify({
                    session: this.getSessionSummary(),
                    events: this.events
                }, null, 2);

            case 'csv':
                return this._exportCSV();

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Clear all events
     */
    clear() {
        this.events = [];
        this.sessionId = this._generateSessionId();
        this.startTime = Date.now();
    }

    // Private helpers
    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    _exportCSV() {
        const headers = ['timestamp', 'eventType', 'properties'];
        const rows = this.events.map(e => [
            e.timestamp,
            e.eventType,
            JSON.stringify(e.properties)
        ]);

        return [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');
    }
}

// Global telemetry instance
export const telemetry = new TelemetryCollector();

export default telemetry;
