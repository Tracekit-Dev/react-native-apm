/**
 * TraceKit React Native SDK - Snapshot Client
 * @package @tracekit/react-native
 *
 * Manages breakpoint registration and snapshot capturing
 * with the same logic as @tracekit/node-apm
 */

import type { TracekitConfig } from './types';
import { createLogger, type Logger } from './utils';

// ============================================================================
// Types
// ============================================================================

export interface BreakpointConfig {
  id: string;
  service_name: string;
  file_path: string;
  function_name: string;
  label?: string;
  line_number: number;
  condition?: string;
  max_captures: number;
  capture_count: number;
  expire_at?: Date;
  enabled: boolean;
}

export interface SnapshotData {
  breakpoint_id?: string;
  service_name: string;
  file_path: string;
  function_name: string;
  label?: string;
  line_number: number;
  variables: Record<string, any>;
  stack_trace: string;
  trace_id?: string;
  span_id?: string;
  request_context?: Record<string, any>;
  captured_at: Date;
}

// ============================================================================
// Snapshot Client
// ============================================================================

export class SnapshotClient {
  private config: TracekitConfig;
  private logger: Logger;
  private breakpointsCache: Map<string, BreakpointConfig> = new Map();
  private registrationCache: Set<string> = new Set();
  private pollInterval?: any; // NodeJS.Timeout | number
  private lastFetch?: Date;
  private baseURL: string;

  constructor(config: TracekitConfig) {
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
    this.baseURL = config.apiUrl ?? 'https://app.tracekit.dev';
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Start background polling for active breakpoints
   */
  start(): void {
    if (!this.config.enableCodeMonitoring) {
      return;
    }

    this.logger.info(
      `📸 TraceKit Snapshot Client started for service: ${this.getServiceName()}`
    );

    // Immediate fetch
    this.fetchActiveBreakpoints();

    // Poll every 30 seconds
    this.pollInterval = setInterval(() => {
      this.fetchActiveBreakpoints();
    }, 30000);
  }

  /**
   * Stop background polling
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.logger.info('📸 TraceKit Snapshot Client stopped');
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Automatic capture with runtime detection
   *
   * This method:
   * 1. Auto-detects caller location from stack trace
   * 2. Auto-registers breakpoint on first call
   * 3. Checks if breakpoint is active
   * 4. Captures and sends snapshot if enabled
   */
  async checkAndCapture(
    label: string,
    variables: Record<string, any> = {}
  ): Promise<void> {
    if (!this.config.enableCodeMonitoring) {
      return;
    }

    // Get caller information from stack trace
    const stack = new Error().stack || '';
    const caller = this.parseStackTrace(stack);

    if (!caller) {
      this.logger.warn('⚠️  Could not detect caller location for snapshot');
      return;
    }

    const { file, line, functionName } = caller;

    // Check if location is registered
    const locationKey = `${functionName}:${label}`;

    if (!this.registrationCache.has(locationKey)) {
      // Auto-register breakpoint on first call
      const breakpoint = await this.autoRegisterBreakpoint({
        file_path: file,
        line_number: line,
        function_name: functionName,
        label,
      });

      if (breakpoint) {
        this.registrationCache.add(locationKey);
        this.breakpointsCache.set(locationKey, breakpoint);
        this.logger.debug(`📸 Auto-registered breakpoint: ${locationKey}`);
      } else {
        this.logger.warn(`⚠️  Failed to register breakpoint: ${locationKey}`);
        return;
      }
    }

    // Check cache for active breakpoint
    const breakpoint = this.breakpointsCache.get(locationKey);
    if (!breakpoint || !breakpoint.enabled) {
      this.logger.debug(`Breakpoint not active: ${locationKey}`);
      return;
    }

    // Check expiration
    if (breakpoint.expire_at && new Date() > breakpoint.expire_at) {
      this.logger.debug(`Breakpoint expired: ${locationKey}`);
      return;
    }

    // Check max captures
    if (breakpoint.max_captures > 0 && breakpoint.capture_count >= breakpoint.max_captures) {
      this.logger.debug(`Breakpoint max captures reached: ${locationKey}`);
      return;
    }

    // Create snapshot
    const snapshot: SnapshotData = {
      breakpoint_id: breakpoint.id,
      service_name: this.getServiceName(),
      file_path: file,
      function_name: functionName,
      label,
      line_number: line,
      variables: this.sanitizeVariables(variables),
      stack_trace: stack,
      captured_at: new Date(),
    };

    // Send snapshot
    await this.captureSnapshot(snapshot);
  }

  // ============================================================================
  // Breakpoint Management
  // ============================================================================

  /**
   * Fetch active breakpoints from backend
   * GET /sdk/snapshots/active/{serviceName}
   */
  private async fetchActiveBreakpoints(): Promise<void> {
    try {
      const serviceName = this.getServiceName();
      const url = `${this.baseURL}/sdk/snapshots/active/${encodeURIComponent(serviceName)}`;

      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { breakpoints?: BreakpointConfig[] };
      this.updateBreakpointCache(data.breakpoints || []);
      this.lastFetch = new Date();
    } catch (error) {
      this.logger.error('⚠️  Failed to fetch breakpoints:', error);
    }
  }

  /**
   * Update in-memory breakpoint cache
   */
  private updateBreakpointCache(breakpoints: BreakpointConfig[]): void {
    this.breakpointsCache.clear();

    for (const bp of breakpoints) {
      // Primary key: function + label
      if (bp.label && bp.function_name) {
        const labelKey = `${bp.function_name}:${bp.label}`;
        this.breakpointsCache.set(labelKey, bp);
      }

      // Secondary key: file + line
      const lineKey = `${bp.file_path}:${bp.line_number}`;
      this.breakpointsCache.set(lineKey, bp);
    }

    if (breakpoints.length > 0) {
      this.logger.debug(
        `📸 Updated breakpoint cache: ${breakpoints.length} active breakpoints`
      );
    }
  }

  /**
   * Auto-register a breakpoint on first snapshot call
   * POST /sdk/snapshots/auto-register
   */
  private async autoRegisterBreakpoint(data: {
    file_path: string;
    line_number: number;
    function_name: string;
    label: string;
  }): Promise<BreakpointConfig | null> {
    try {
      const response = await fetch(`${this.baseURL}/sdk/snapshots/auto-register`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_name: this.getServiceName(),
          ...data,
        }),
      });

      if (!response.ok) {
        this.logger.error('⚠️  Failed to auto-register breakpoint:', response.status);
        return null;
      }

      const result = (await response.json()) as BreakpointConfig;
      this.logger.info(`📸 Auto-registered breakpoint: ${data.function_name}:${data.label}`);
      return result;
    } catch (error) {
      this.logger.error('⚠️  Failed to auto-register breakpoint:', error);
      return null;
    }
  }

  // ============================================================================
  // Snapshot Capture
  // ============================================================================

  /**
   * Capture and send snapshot to backend
   * POST /sdk/snapshots/capture
   */
  private async captureSnapshot(snapshot: SnapshotData): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/sdk/snapshots/capture`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snapshot),
      });

      if (!response.ok) {
        this.logger.error('⚠️  Failed to capture snapshot:', response.status);
      } else {
        this.logger.info(`📸 Snapshot captured: ${snapshot.label || snapshot.file_path}`);
      }
    } catch (error) {
      this.logger.error('⚠️  Failed to capture snapshot:', error);
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Parse stack trace to extract caller information
   *
   * Stack trace format in React Native:
   * 0: Error
   * 1: at SnapshotClient.checkAndCapture (...)
   * 2: at TracekitClient.captureSnapshot (...) <- wrapper
   * 3: at <actual caller> <- THIS IS WHAT WE WANT
   */
  private parseStackTrace(stack: string): {
    file: string;
    line: number;
    functionName: string;
  } | null {
    const lines = stack.split('\n');

    // Debug: log the stack trace
    this.logger.debug('Stack trace lines:', lines);

    // Skip to line 3 to get the actual caller
    const callerLine = lines[3]?.trim();

    if (!callerLine) {
      this.logger.warn('No caller line found at index 3');
      return null;
    }

    this.logger.debug('Parsing caller line:', callerLine);

    // Parse format: "at FunctionName (file:line:col)" or "at file:line:col"
    // React Native format: "functionName@file:line:col"
    // Browser format: "at functionName (http://localhost:8801/bundle.js?query=params:123:45)"
    // Need to extract last :line:col before closing paren

    // Try Chrome/V8 format: "at functionName (url:line:col)"
    let match = callerLine.match(/at\s+([^\s]+)\s+\(.*?:(\d+):(\d+)\)$/);

    if (!match) {
      // Try simple format: "at url:line:col"
      match = callerLine.match(/at\s+.*?:(\d+):(\d+)$/);
      if (match) {
        // No function name in simple format
        return {
          file: 'unknown',
          line: parseInt(match[1], 10),
          functionName: 'anonymous',
        };
      }
    }

    if (!match) {
      // Try Firefox format: "functionName@url:line:col"
      match = callerLine.match(/([^@]+)@.*?:(\d+):(\d+)$/);
      if (match) {
        return {
          file: 'unknown',
          line: parseInt(match[2], 10),
          functionName: match[1].trim(),
        };
      }
    }

    if (!match) {
      this.logger.warn('Could not match caller line pattern:', callerLine);
      return null;
    }

    const functionName = match[1] || 'anonymous';
    const line = parseInt(match[2], 10);

    this.logger.debug('Parsed stack frame:', { functionName, line });

    return { file: 'browser-bundle', line, functionName };
  }

  /**
   * Sanitize variables for JSON serialization
   */
  private sanitizeVariables(variables: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(variables)) {
      try {
        JSON.stringify(value); // Test if serializable
        sanitized[key] = value;
      } catch {
        sanitized[key] = `[${typeof value}]`;
      }
    }

    return sanitized;
  }

  /**
   * Get service name from config
   */
  private getServiceName(): string {
    return this.config.serviceName || 'react-native-app';
  }
}
