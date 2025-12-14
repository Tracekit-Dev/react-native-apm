/**
 * TraceKit React Native SDK
 * Zero-config distributed tracing and performance monitoring for React Native and Expo apps.
 *
 * @package @tracekit/react-native
 * @version 1.0.0
 * @license MIT
 *
 * @example Basic Usage
 * ```tsx
 * import * as Tracekit from '@tracekit/react-native';
 *
 * // Initialize
 * Tracekit.init({
 *   apiKey: 'your-api-key',
 *   serviceName: 'my-app',
 * });
 *
 * // Capture exceptions
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   Tracekit.captureException(error);
 * }
 *
 * // Track screens
 * Tracekit.trackScreen('HomeScreen');
 *
 * // Set user context
 * Tracekit.setUser({ id: '123', email: 'user@example.com' });
 * ```
 *
 * @example With React Provider
 * ```tsx
 * import { TracekitProvider, TracekitErrorBoundary } from '@tracekit/react-native';
 *
 * function App() {
 *   return (
 *     <TracekitProvider config={{ apiKey: 'your-api-key', serviceName: 'my-app' }}>
 *       <TracekitErrorBoundary>
 *         <MyApp />
 *       </TracekitErrorBoundary>
 *     </TracekitProvider>
 *   );
 * }
 * ```
 */

// ============================================================================
// Core Client
// ============================================================================

export { TracekitClient, getClient, init } from './client';

// ============================================================================
// Types
// ============================================================================

export type {
  // Configuration
  TracekitConfig,

  // Spans
  Span,
  SpanStatus,
  SpanKind,
  SpanContext,
  SpanEvent,
  SpanLink,
  AttributeValue,

  // Snapshots / Code Monitoring
  Snapshot,
  StackFrame,
  RequestContext,

  // Context
  DeviceContext,
  AppContext,
  User,

  // Errors
  ExceptionReport,

  // Breadcrumbs
  Breadcrumb,
  BreadcrumbType,
  BreadcrumbLevel,

  // Network
  NetworkRequest,

  // Navigation
  NavigationEvent,

  // Performance
  PerformanceMetrics,

  // Payloads
  TracePayload,
  ExceptionPayload,
  SnapshotPayload,

  // Callbacks
  BeforeSendCallback,
  OnErrorCallback,

  // Client interface
  TracekitClient as ITracekitClient,
} from './types';

// ============================================================================
// React Components
// ============================================================================

export {
  TracekitProvider,
  TracekitErrorBoundary,
  ScreenTracker,
  UserIdentifier,
  PerformanceProfiler,
  useTracekitContext,
  withTracekit,
} from './components';

// ============================================================================
// React Hooks
// ============================================================================

export {
  useTracekit,
  useSpan,
  useScreenTracking,
  usePerformanceTracking,
  useAsyncTracking,
  useErrorBoundary,
  useTouchTracking,
  useUser,
} from './hooks';

// ============================================================================
// Network Interceptor
// ============================================================================

export {
  NetworkInterceptor,
  installNetworkInterceptor,
  uninstallNetworkInterceptor,
} from './network';

// ============================================================================
// Transport
// ============================================================================

export {
  HttpTransport,
  OfflineAwareTransport,
  createTransport,
  type Transport,
} from './transport';

// ============================================================================
// Storage
// ============================================================================

export {
  StorageManager,
  StorageKeys,
  getStorageManager,
  setStorageManager,
  type StorageAdapter,
} from './storage';

// ============================================================================
// Utilities
// ============================================================================

export {
  generateTraceId,
  generateSpanId,
  generateEventId,
  generateSessionId,
  parseStackTrace,
  sanitizeHeaders,
  shouldExcludeUrl,
  createLogger,
} from './utils';

// ============================================================================
// Convenience Functions (delegating to singleton client)
// ============================================================================

import { getClient, init as initClient } from './client';
import type {
  User,
  Span,
  AttributeValue,
  BreadcrumbLevel,
  Breadcrumb,
  NetworkRequest,
  PerformanceMetrics,
  BeforeSendCallback,
  OnErrorCallback,
} from './types';

/**
 * Capture an exception and report to TraceKit
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string {
  return getClient().captureException(error, context);
}

/**
 * Capture a message and report to TraceKit
 */
export function captureMessage(
  message: string,
  level?: BreadcrumbLevel,
  context?: Record<string, unknown>
): string {
  return getClient().captureMessage(message, level, context);
}

/**
 * Capture a snapshot for code monitoring
 */
export function captureSnapshot(
  name: string,
  data: Record<string, unknown>
): Promise<void> {
  return getClient().captureSnapshot(name, data);
}

/**
 * Start a new span
 */
export function startSpan(
  name: string,
  parentSpan?: Span | null,
  attributes?: Record<string, AttributeValue>
): Span {
  return getClient().startSpan(name, parentSpan, attributes);
}

/**
 * End a span
 */
export function endSpan(
  span: Span,
  attributes?: Record<string, AttributeValue>,
  status?: 'OK' | 'ERROR' | 'UNSET'
): void {
  return getClient().endSpan(span, attributes, status);
}

/**
 * Set the current user
 */
export function setUser(user: User | null): void {
  return getClient().setUser(user);
}

/**
 * Add a breadcrumb
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  return getClient().addBreadcrumb(breadcrumb);
}

/**
 * Clear all breadcrumbs
 */
export function clearBreadcrumbs(): void {
  return getClient().clearBreadcrumbs();
}

/**
 * Set a tag
 */
export function setTag(key: string, value: string): void {
  return getClient().setTag(key, value);
}

/**
 * Set multiple tags
 */
export function setTags(tags: Record<string, string>): void {
  return getClient().setTags(tags);
}

/**
 * Set a context
 */
export function setContext(
  name: string,
  context: Record<string, unknown> | null
): void {
  return getClient().setContext(name, context);
}

/**
 * Set an extra value
 */
export function setExtra(key: string, value: unknown): void {
  return getClient().setExtra(key, value);
}

/**
 * Set multiple extra values
 */
export function setExtras(extras: Record<string, unknown>): void {
  return getClient().setExtras(extras);
}

/**
 * Track a screen view
 */
export function trackScreen(
  screenName: string,
  params?: Record<string, unknown>
): void {
  return getClient().trackScreen(screenName, params);
}

/**
 * Track a network request
 */
export function trackNetworkRequest(
  request: Omit<NetworkRequest, 'requestId'>
): void {
  return getClient().trackNetworkRequest(request);
}

/**
 * Record performance metrics
 */
export function recordPerformanceMetrics(
  metrics: Partial<PerformanceMetrics>
): void {
  return getClient().recordPerformanceMetrics(metrics);
}

/**
 * Register a beforeSend callback
 */
export function beforeSend(callback: BeforeSendCallback): void {
  return getClient().beforeSend(callback);
}

/**
 * Register an onError callback
 */
export function onError(callback: OnErrorCallback): void {
  return getClient().onError(callback);
}

/**
 * Flush pending data
 */
export function flush(): Promise<void> {
  return getClient().flush();
}

/**
 * Close the client
 */
export function close(): Promise<void> {
  return getClient().close();
}

// ============================================================================
// Default Export
// ============================================================================

const TraceKit = {
  init: initClient,
  getClient: getClient,
  captureException: captureException,
  captureMessage: captureMessage,
  captureSnapshot: captureSnapshot,
  startSpan: startSpan,
  endSpan: endSpan,
  setUser: setUser,
  addBreadcrumb: addBreadcrumb,
  clearBreadcrumbs: clearBreadcrumbs,
  setTag: setTag,
  setTags: setTags,
  setContext: setContext,
  setExtra: setExtra,
  setExtras: setExtras,
  trackScreen: trackScreen,
  trackNetworkRequest: trackNetworkRequest,
  recordPerformanceMetrics: recordPerformanceMetrics,
  beforeSend: beforeSend,
  onError: onError,
  flush: flush,
  close: close,
};

export default TraceKit;
