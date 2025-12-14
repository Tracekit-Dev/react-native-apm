/**
 * TraceKit React Native SDK - Utility Functions
 * @package @tracekit/react-native
 */

import { Platform, Dimensions } from 'react-native';
import type { StackFrame, DeviceContext, AppContext } from './types';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a random hex string of specified length
 */
export function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate a W3C Trace ID (32 hex characters)
 */
export function generateTraceId(): string {
  return randomHex(32);
}

/**
 * Generate a W3C Span ID (16 hex characters)
 */
export function generateSpanId(): string {
  return randomHex(16);
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return randomHex(32);
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${randomHex(8)}`;
}

// ============================================================================
// Timestamp Utilities
// ============================================================================

/**
 * Get current ISO 8601 timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get timestamp in milliseconds
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Calculate duration between two ISO timestamps
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return new Date(endTime).getTime() - new Date(startTime).getTime();
}

// ============================================================================
// Stack Trace Parsing
// ============================================================================

/**
 * Parse JavaScript error stack trace into structured frames
 */
export function parseStackTrace(stack: string | undefined): StackFrame[] {
  if (!stack) return [];

  const frames: StackFrame[] = [];
  const lines = stack.split('\n');

  for (const line of lines) {
    const frame = parseStackFrame(line);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}

/**
 * Parse a single stack frame line
 */
function parseStackFrame(line: string): StackFrame | null {
  // Skip empty lines and the error message line
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('at ')) {
    // Try React Native format
    const rnMatch = trimmed.match(/^(.+)@(.+):(\d+):(\d+)$/);
    if (rnMatch) {
      return {
        function: rnMatch[1] || '<anonymous>',
        filename: rnMatch[2],
        lineno: parseInt(rnMatch[3], 10),
        colno: parseInt(rnMatch[4], 10),
        inApp: isInAppFrame(rnMatch[2]),
      };
    }
    return null;
  }

  // V8/Chrome format: "at functionName (filename:line:col)"
  const v8Match = trimmed.match(/^at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?$/);
  if (v8Match) {
    return {
      function: v8Match[1] || '<anonymous>',
      filename: v8Match[2],
      lineno: parseInt(v8Match[3], 10),
      colno: parseInt(v8Match[4], 10),
      inApp: isInAppFrame(v8Match[2]),
    };
  }

  // Simple format: "at filename:line:col"
  const simpleMatch = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
  if (simpleMatch) {
    return {
      function: '<anonymous>',
      filename: simpleMatch[1],
      lineno: parseInt(simpleMatch[2], 10),
      colno: parseInt(simpleMatch[3], 10),
      inApp: isInAppFrame(simpleMatch[1]),
    };
  }

  return null;
}

/**
 * Determine if a frame is from application code vs library code
 */
function isInAppFrame(filename: string): boolean {
  if (!filename) return false;

  // Exclude node_modules
  if (filename.includes('node_modules')) return false;

  // Exclude React Native internals
  if (filename.includes('ReactNative')) return false;
  if (filename.includes('react-native')) return false;

  // Exclude Expo internals
  if (filename.includes('expo-modules')) return false;

  // Exclude Metro bundler
  if (filename.includes('metro')) return false;

  // Exclude Hermes
  if (filename.includes('hermes')) return false;

  return true;
}

// ============================================================================
// Device Context
// ============================================================================

/**
 * Get basic device context (without native modules)
 */
export function getBasicDeviceContext(): DeviceContext {
  const { width, height, scale } = Dimensions.get('window');

  return {
    platform: Platform.OS as 'ios' | 'android' | 'web',
    osVersion: Platform.Version?.toString(),
    screen: {
      width,
      height,
      scale,
    },
  };
}

/**
 * Get basic app context (without native modules)
 */
export function getBasicAppContext(): AppContext {
  return {
    reactNativeVersion: Platform.constants?.reactNativeVersion
      ? `${Platform.constants.reactNativeVersion.major}.${Platform.constants.reactNativeVersion.minor}.${Platform.constants.reactNativeVersion.patch}`
      : undefined,
  };
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Parse URL into components
 */
export function parseUrl(url: string): {
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
} {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    };
  } catch {
    return {
      protocol: '',
      host: '',
      hostname: '',
      port: '',
      pathname: url,
      search: '',
      hash: '',
    };
  }
}

/**
 * Extract service name from URL
 */
export function extractServiceName(url: string): string {
  const { hostname } = parseUrl(url);

  // Handle Kubernetes service names (service.namespace.svc.cluster.local)
  if (hostname.includes('.svc.cluster.local')) {
    return hostname.split('.')[0];
  }

  // Handle internal DNS (service.internal)
  if (hostname.endsWith('.internal')) {
    return hostname.replace('.internal', '');
  }

  // Handle Docker Compose / simple hostnames (hostname:port)
  if (!hostname.includes('.') || hostname === 'localhost') {
    return hostname;
  }

  // Return full hostname for external services
  return hostname;
}

/**
 * Check if URL should be excluded from tracing
 */
export function shouldExcludeUrl(
  url: string,
  excludePatterns: (string | RegExp)[]
): boolean {
  for (const pattern of excludePatterns) {
    if (typeof pattern === 'string') {
      if (url.includes(pattern)) return true;
    } else {
      if (pattern.test(url)) return true;
    }
  }
  return false;
}

// ============================================================================
// Data Sanitization
// ============================================================================

/**
 * Sanitize sensitive data from headers
 */
export function sanitizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const sensitiveKeys = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'api-key',
    'apikey',
    'password',
    'secret',
    'token',
  ];

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
      sanitized[key] = '[Filtered]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Safely stringify an object (handles circular references)
 */
export function safeStringify(obj: unknown, maxDepth = 5): string {
  const seen = new WeakSet();

  function stringify(value: unknown, depth: number): unknown {
    if (depth > maxDepth) return '[Max Depth]';

    if (value === null) return null;
    if (value === undefined) return undefined;

    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (seen.has(value as object)) {
      return '[Circular]';
    }

    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map((item) => stringify(item, depth + 1));
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = stringify(val, depth + 1);
    }

    return result;
  }

  try {
    return JSON.stringify(stringify(obj, 0));
  } catch {
    return '[Unable to stringify]';
  }
}

// ============================================================================
// Sampling
// ============================================================================

/**
 * Determine if this event should be sampled
 */
export function shouldSample(sampleRate: number): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}

// ============================================================================
// Debounce/Throttle
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// Logger
// ============================================================================

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

/**
 * Create a logger instance
 */
export function createLogger(debug: boolean): Logger {
  const prefix = '[TraceKit]';

  if (!debug) {
    return {
      debug: () => {},
      info: () => {},
      warn: (...args) => console.warn(prefix, ...args),
      error: (...args) => console.error(prefix, ...args),
    };
  }

  return {
    debug: (...args) => console.debug(prefix, ...args),
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}
