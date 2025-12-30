/**
 * TraceKit React Native SDK - Transport Layer
 * @package @tracekit/react-native
 */

import type {
  TracekitConfig,
  TracePayload,
  ExceptionPayload,
  SnapshotPayload,
  Span,
  SpanEvent,
} from './types';
import { createLogger, type Logger } from './utils';

// ============================================================================
// Transport Interface
// ============================================================================

export interface Transport {
  send(payload: TracePayload | ExceptionPayload | SnapshotPayload): Promise<boolean>;
  sendBatch(payloads: (TracePayload | ExceptionPayload | SnapshotPayload)[]): Promise<boolean>;
  flush(): Promise<void>;
  close(): Promise<void>;
}

// ============================================================================
// HTTP Transport
// ============================================================================

export class HttpTransport implements Transport {
  private config: TracekitConfig;
  private logger: Logger;
  private queue: (TracePayload | ExceptionPayload | SnapshotPayload)[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private closed = false;

  constructor(config: TracekitConfig) {
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
    this.startFlushTimer();
  }

  private get endpoint(): string {
    const baseUrl = this.config.apiUrl ?? 'https://app.tracekit.dev';
    return `${baseUrl}/v1/traces`;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-SDK': '@tracekit/react-native',
      'X-SDK-Version': '1.0.0',
      ...this.config.customHeaders,
    };
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    const interval = this.config.flushInterval ?? 30000;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.logger.error('Auto-flush failed:', err);
      });
    }, interval);
  }

  async send(payload: TracePayload | ExceptionPayload | SnapshotPayload): Promise<boolean> {
    if (this.closed) {
      this.logger.warn('Transport is closed, cannot send');
      return false;
    }

    if (!this.config.enabled) {
      return true;
    }

    this.queue.push(payload);

    // Check if we should flush immediately
    const maxBatchSize = this.config.maxBatchSize ?? 50;
    if (this.queue.length >= maxBatchSize) {
      await this.flush();
    }

    return true;
  }

  async sendBatch(payloads: (TracePayload | ExceptionPayload | SnapshotPayload)[]): Promise<boolean> {
    if (this.closed) {
      this.logger.warn('Transport is closed, cannot send batch');
      return false;
    }

    if (!this.config.enabled) {
      return true;
    }

    this.queue.push(...payloads);

    // Check if we should flush immediately
    const maxBatchSize = this.config.maxBatchSize ?? 50;
    if (this.queue.length >= maxBatchSize) {
      await this.flush();
    }

    return true;
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      // Take items from queue
      const maxBatchSize = this.config.maxBatchSize ?? 50;
      const batch = this.queue.splice(0, maxBatchSize);

      if (batch.length === 0) {
        return;
      }

      this.logger.debug(`Flushing ${batch.length} items to TraceKit`);

      // Convert all payloads to traces format
      const traces: TracePayload[] = [];

      for (const item of batch) {
        if ('spans' in item) {
          traces.push(item as TracePayload);
        } else if ('exception' in item) {
          // Convert exception to trace with error span
          const exceptionPayload = item as ExceptionPayload;
          const errorSpan = this.convertExceptionToSpan(exceptionPayload);
          traces.push({
            spans: [errorSpan],
            serviceName: exceptionPayload.serviceName,
            resource: this.buildResourceFromContext(exceptionPayload),
            timestamp: exceptionPayload.timestamp,
          });
        } else if ('snapshot' in item) {
          // Convert snapshot to trace format
          const snapshotPayload = item as SnapshotPayload;
          traces.push({
            spans: [],
            serviceName: snapshotPayload.serviceName,
            resource: this.buildResourceFromSnapshot(snapshotPayload),
            timestamp: snapshotPayload.timestamp,
          });
        }
      }

      // Send all as traces to single endpoint
      if (traces.length > 0) {
        await this.sendToEndpoint(traces);
      }

      this.logger.debug('Flush complete');
    } catch (error) {
      this.logger.error('Flush failed:', error);
      // Don't re-queue on failure to avoid infinite loops
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendToEndpoint(traces: TracePayload[]): Promise<void> {
    const url = this.endpoint;
    const headers = this.headers;

    // Convert to OTLP JSON format
    const otlpPayload = this.convertToOTLPFormat(traces);

    try {
      this.logger.debug(`Sending ${traces.length} traces to ${url}`);
      this.logger.debug('Headers:', headers);
      this.logger.debug('OTLP Payload:', JSON.stringify(otlpPayload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(otlpPayload),
        mode: 'cors',
        credentials: 'omit',
      });

      this.logger.debug(`Response status: ${response.status}`);
      this.logger.debug(`Response ok: ${response.ok}`);

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        this.logger.error(`TraceKit API error (${response.status}):`, text);
      } else {
        const responseText = await response.text();
        this.logger.debug('Traces sent successfully. Response:', responseText);
      }
    } catch (error) {
      this.logger.error(`Network error sending to /v1/traces:`, error);
      this.logger.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url,
        headers,
      });
      throw error;
    }
  }

  /**
   * Convert an exception payload to a span with exception event
   * According to OTLP spec, exceptions are represented as span events
   */
  private convertExceptionToSpan(exceptionPayload: ExceptionPayload): Span {
    const now = new Date().toISOString();
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    // Create exception event with full stack trace
    const exceptionEvent: SpanEvent = {
      name: 'exception',
      timestamp: exceptionPayload.timestamp,
      attributes: {
        'exception.type': exceptionPayload.exception.type,
        'exception.message': exceptionPayload.exception.message,
        'exception.stacktrace': exceptionPayload.exception.stackTrace
          ? exceptionPayload.exception.stackTrace.map(f =>
              `${f.function || 'anonymous'} at ${f.filename}:${f.lineno || 0}`
            ).join('\n')
          : '',
        'exception.handled': exceptionPayload.exception.handled,
      },
    };

    // Add component stack for React errors
    if (exceptionPayload.exception.componentStack) {
      if (!exceptionEvent.attributes) {
        exceptionEvent.attributes = {};
      }
      exceptionEvent.attributes['exception.component_stack'] =
        exceptionPayload.exception.componentStack;
    }

    // Add mechanism if available
    if (exceptionPayload.exception.mechanism) {
      if (!exceptionEvent.attributes) {
        exceptionEvent.attributes = {};
      }
      exceptionEvent.attributes['exception.mechanism'] =
        JSON.stringify(exceptionPayload.exception.mechanism);
    }

    // Create error span
    const errorSpan: Span = {
      spanId,
      traceId,
      name: `Exception: ${exceptionPayload.exception.type}`,
      kind: 'INTERNAL',
      startTime: exceptionPayload.timestamp,
      endTime: exceptionPayload.timestamp, // Exception is instantaneous
      duration: 0,
      status: 'ERROR',
      attributes: {
        'error': true,
        'error.type': exceptionPayload.exception.type,
        'error.message': exceptionPayload.exception.message,
        'otel.status_code': 'ERROR',
        'otel.status_description': exceptionPayload.exception.message,
        // Add context attributes
        ...exceptionPayload.exception.context,
      },
      events: [exceptionEvent],
      links: [],
    };

    return errorSpan;
  }

  private generateTraceId(): string {
    // Generate 32-char hex string (128 bits)
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateSpanId(): string {
    // Generate 16-char hex string (64 bits)
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private convertToOTLPFormat(traces: TracePayload[]): any {
    // Group traces by service name
    const resourceSpans: any[] = [];

    for (const trace of traces) {
      // Convert spans to OTLP format
      const otlpSpans = trace.spans.map(span => ({
        traceId: span.traceId, // OTLP JSON uses hex strings, not base64
        spanId: span.spanId, // OTLP JSON uses hex strings, not base64
        parentSpanId: span.parentSpanId,
        name: span.name,
        kind: this.mapSpanKind(span.kind),
        startTimeUnixNano: this.isoToNano(span.startTime),
        endTimeUnixNano: span.endTime ? this.isoToNano(span.endTime) : undefined,
        attributes: this.convertAttributes(span.attributes),
        status: {
          code: span.status === 'OK' ? 1 : span.status === 'ERROR' ? 2 : 0,
        },
        events: span.events.map(event => ({
          name: event.name,
          timeUnixNano: this.isoToNano(event.timestamp),
          attributes: event.attributes ? this.convertAttributes(event.attributes) : [],
        })),
        links: span.links.map(link => ({
          traceId: link.traceId, // OTLP JSON uses hex strings
          spanId: link.spanId, // OTLP JSON uses hex strings
          attributes: link.attributes ? this.convertAttributes(link.attributes) : [],
        })),
      }));

      resourceSpans.push({
        resource: {
          attributes: this.convertResourceAttributes(trace.resource),
        },
        scopeSpans: [{
          spans: otlpSpans,
        }],
      });
    }

    return { resourceSpans };
  }

  private hexToBase64(hex: string): string {
    // Remove any dashes from UUID format
    const cleanHex = hex.replace(/-/g, '').toLowerCase();

    // Validate hex length - must be 32 chars (16 bytes) for traceId or 16 chars (8 bytes) for spanId
    if (cleanHex.length !== 32 && cleanHex.length !== 16) {
      this.logger.error(`Invalid hex length: ${cleanHex.length}, expected 32 or 16. Hex: ${cleanHex}`);
    }

    // Convert hex string directly to base64
    // OTLP uses standard base64 encoding of the raw bytes
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes: number[] = [];

    // Parse hex to bytes
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substring(i, i + 2), 16));
    }

    // Convert bytes to base64
    let base64 = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const byte1 = bytes[i];
      const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

      const encoded1 = byte1 >> 2;
      const encoded2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
      const encoded3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
      const encoded4 = byte3 & 0x3f;

      base64 += base64Chars.charAt(encoded1);
      base64 += base64Chars.charAt(encoded2);
      base64 += i + 1 < bytes.length ? base64Chars.charAt(encoded3) : '=';
      base64 += i + 2 < bytes.length ? base64Chars.charAt(encoded4) : '=';
    }

    return base64;
  }

  private isoToNano(isoString: string): string {
    const date = new Date(isoString);
    const nanos = date.getTime() * 1000000; // Convert ms to ns
    return nanos.toString();
  }

  private mapSpanKind(kind: string): number {
    const kindMap: Record<string, number> = {
      'INTERNAL': 1,
      'SERVER': 2,
      'CLIENT': 3,
      'PRODUCER': 4,
      'CONSUMER': 5,
    };
    return kindMap[kind] || 0;
  }

  private convertAttributes(attrs: Record<string, any>): any[] {
    return Object.entries(attrs).map(([key, value]) => ({
      key,
      value: this.convertAttributeValue(value),
    }));
  }

  private convertAttributeValue(value: any): any {
    if (typeof value === 'string') {
      return { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return { intValue: value.toString() };
      }
      return { doubleValue: value };
    } else if (typeof value === 'boolean') {
      return { boolValue: value };
    } else if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(v => this.convertAttributeValue(v)),
        },
      };
    }
    return { stringValue: String(value) };
  }

  /**
   * Build resource attributes from an exception payload
   */
  private buildResourceFromContext(payload: ExceptionPayload): TracePayload['resource'] {
    return {
      'service.name': payload.serviceName,
      'service.version': payload.app?.appVersion,
      'telemetry.sdk.name': '@tracekit/react-native',
      'telemetry.sdk.version': '1.0.0',
      'telemetry.sdk.language': 'javascript',
      'device.model': payload.device?.deviceModel,
      'os.name': payload.device?.platform,
      'os.version': payload.device?.osVersion,
    };
  }

  /**
   * Build resource attributes from a snapshot payload
   */
  private buildResourceFromSnapshot(payload: SnapshotPayload): TracePayload['resource'] {
    return {
      'service.name': payload.serviceName,
      'telemetry.sdk.name': '@tracekit/react-native',
      'telemetry.sdk.version': '1.0.0',
      'telemetry.sdk.language': 'javascript',
    };
  }

  private convertResourceAttributes(resource: any): any[] {
    // Safety check for undefined/null resource
    if (!resource || typeof resource !== 'object') {
      return [];
    }
    return Object.entries(resource).map(([key, value]) => ({
      key,
      value: this.convertAttributeValue(value),
    }));
  }

  async close(): Promise<void> {
    this.closed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flush();
  }
}

// ============================================================================
// Offline Transport (with queue persistence)
// ============================================================================

export class OfflineAwareTransport implements Transport {
  private httpTransport: HttpTransport;
  private config: TracekitConfig;
  private logger: Logger;
  private isOnline = true;
  private offlineQueue: (TracePayload | ExceptionPayload | SnapshotPayload)[] = [];
  private maxOfflineQueue: number;

  constructor(config: TracekitConfig) {
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
    this.httpTransport = new HttpTransport(config);
    this.maxOfflineQueue = config.maxQueueSize ?? 1000;
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    // Try to use NetInfo if available
    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      NetInfo.addEventListener((state: { isConnected: boolean | null }) => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? true;

        if (wasOffline && this.isOnline) {
          this.logger.debug('Network restored, flushing offline queue');
          this.flushOfflineQueue();
        }
      });
    } catch {
      // NetInfo not available, assume online
      this.logger.debug('NetInfo not available, assuming online');
      this.isOnline = true;
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    this.logger.debug(`Flushing ${this.offlineQueue.length} offline items`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      await this.httpTransport.send(item);
    }
  }

  async send(payload: TracePayload | ExceptionPayload | SnapshotPayload): Promise<boolean> {
    if (!this.isOnline) {
      // Queue for later
      if (this.offlineQueue.length < this.maxOfflineQueue) {
        this.offlineQueue.push(payload);
        this.logger.debug('Queued item for offline sending');
      } else {
        this.logger.warn('Offline queue full, dropping item');
      }
      return true;
    }

    return this.httpTransport.send(payload);
  }

  async sendBatch(payloads: (TracePayload | ExceptionPayload | SnapshotPayload)[]): Promise<boolean> {
    if (!this.isOnline) {
      // Queue for later
      for (const payload of payloads) {
        if (this.offlineQueue.length < this.maxOfflineQueue) {
          this.offlineQueue.push(payload);
        } else {
          this.logger.warn('Offline queue full, dropping items');
          break;
        }
      }
      return true;
    }

    return this.httpTransport.sendBatch(payloads);
  }

  async flush(): Promise<void> {
    if (this.isOnline) {
      await this.flushOfflineQueue();
    }
    await this.httpTransport.flush();
  }

  async close(): Promise<void> {
    await this.httpTransport.close();
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createTransport(config: TracekitConfig): Transport {
  // Use offline-aware transport by default
  return new OfflineAwareTransport(config);
}
