import { T as TracekitConfig, U as User, a as TracekitClient, B as BreadcrumbLevel, b as Breadcrumb, A as AttributeValue, S as Span, c as TracePayload, E as ExceptionPayload, d as SnapshotPayload, e as StackFrame, i as init, g as getClient, N as NetworkRequest, P as PerformanceMetrics, f as BeforeSendCallback, O as OnErrorCallback } from './client-BmgNZ17x.js';
export { o as AppContext, q as BreadcrumbType, D as DeviceContext, p as ExceptionReport, s as ITracekitClient, r as NavigationEvent, R as RequestContext, n as Snapshot, k as SpanContext, l as SpanEvent, j as SpanKind, m as SpanLink, h as SpanStatus } from './client-BmgNZ17x.js';
import React, { ReactNode, Component, ErrorInfo } from 'react';

/**
 * TraceKit React Native SDK - React Components
 * @package @tracekit/react-native
 */

interface TracekitContextValue {
    client: TracekitClient;
    isInitialized: boolean;
}
/**
 * Hook to access TraceKit context
 */
declare function useTracekitContext(): TracekitContextValue;
interface TracekitProviderProps {
    config: TracekitConfig;
    children: ReactNode;
    /** Called when TraceKit is initialized */
    onReady?: () => void;
    /** Called when an error occurs during initialization */
    onError?: (error: Error) => void;
}
/**
 * Provider component for TraceKit
 *
 * @example
 * ```tsx
 * import { TracekitProvider } from '@tracekit/react-native';
 *
 * function App() {
 *   return (
 *     <TracekitProvider
 *       config={{
 *         apiKey: 'your-api-key',
 *         serviceName: 'my-app',
 *       }}
 *     >
 *       <MyApp />
 *     </TracekitProvider>
 *   );
 * }
 * ```
 */
declare function TracekitProvider({ config, children, onReady, onError, }: TracekitProviderProps): React.JSX.Element;
interface ErrorBoundaryProps {
    children: ReactNode;
    /** Fallback UI to render when an error occurs */
    fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Whether to show error details in fallback (dev only) */
    showErrorDetails?: boolean;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
/**
 * Error boundary component that captures errors and reports to TraceKit
 *
 * @example
 * ```tsx
 * import { TracekitErrorBoundary } from '@tracekit/react-native';
 *
 * function App() {
 *   return (
 *     <TracekitErrorBoundary
 *       fallback={<ErrorScreen />}
 *       onError={(error) => console.log('Error caught:', error)}
 *     >
 *       <MyApp />
 *     </TracekitErrorBoundary>
 *   );
 * }
 * ```
 */
declare class TracekitErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    resetError: () => void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
/**
 * Higher-order component to inject TraceKit client
 */
declare function withTracekit<P extends object>(WrappedComponent: React.ComponentType<P & {
    tracekit: TracekitClient;
}>): (props: P) => React.JSX.Element;
interface ScreenTrackerProps {
    screenName: string;
    params?: Record<string, unknown>;
    children: ReactNode;
}
/**
 * Component that tracks screen views
 *
 * @example
 * ```tsx
 * import { ScreenTracker } from '@tracekit/react-native';
 *
 * function HomeScreen() {
 *   return (
 *     <ScreenTracker screenName="Home">
 *       <View>
 *         <Text>Home Screen</Text>
 *       </View>
 *     </ScreenTracker>
 *   );
 * }
 * ```
 */
declare function ScreenTracker({ screenName, params, children, }: ScreenTrackerProps): React.JSX.Element;
interface UserIdentifierProps {
    user: User | null;
    children: ReactNode;
}
/**
 * Component that sets user context
 *
 * @example
 * ```tsx
 * import { UserIdentifier } from '@tracekit/react-native';
 *
 * function AuthenticatedApp({ user }) {
 *   return (
 *     <UserIdentifier user={user}>
 *       <MainApp />
 *     </UserIdentifier>
 *   );
 * }
 * ```
 */
declare function UserIdentifier({ user, children }: UserIdentifierProps): React.JSX.Element;
interface PerformanceProfilerProps {
    id: string;
    children: ReactNode;
    /** Called when a render is committed */
    onRender?: (metrics: {
        id: string;
        phase: 'mount' | 'update' | 'nested-update';
        actualDuration: number;
        baseDuration: number;
        startTime: number;
        commitTime: number;
    }) => void;
}
/**
 * Component that profiles render performance and reports to TraceKit
 *
 * @example
 * ```tsx
 * import { PerformanceProfiler } from '@tracekit/react-native';
 *
 * function ExpensiveComponent() {
 *   return (
 *     <PerformanceProfiler id="ExpensiveComponent">
 *       <HeavyContent />
 *     </PerformanceProfiler>
 *   );
 * }
 * ```
 */
declare function PerformanceProfiler({ id, children, onRender, }: PerformanceProfilerProps): React.JSX.Element;

/**
 * Main hook for accessing TraceKit functionality
 */
declare function useTracekit(): {
    captureException: (error: Error, context?: Record<string, unknown>) => string;
    captureMessage: (message: string, level?: BreadcrumbLevel, context?: Record<string, unknown>) => string;
    captureSnapshot: (name: string, data: Record<string, unknown>) => Promise<void>;
    setUser: (user: User | null) => void;
    addBreadcrumb: (breadcrumb: Parameters<(breadcrumb: Omit<Breadcrumb, "timestamp">) => void>[0]) => void;
    setTag: (key: string, value: string) => void;
    setContext: (name: string, context: Record<string, unknown> | null) => void;
    client: TracekitClient;
};
/**
 * Hook for creating and managing spans
 */
declare function useSpan(name: string, options?: {
    autoStart?: boolean;
    autoEnd?: boolean;
    attributes?: Record<string, AttributeValue>;
    parentSpan?: Span | null;
}): {
    span: Span | null;
    isActive: boolean;
    start: () => Span;
    end: (attributes?: Record<string, AttributeValue>, status?: "OK" | "ERROR") => void;
    addEvent: (eventName: string, attributes?: Record<string, AttributeValue>) => void;
    setAttributes: (attributes: Record<string, AttributeValue>) => void;
};
/**
 * Hook for tracking screen views
 */
declare function useScreenTracking(screenName: string, params?: Record<string, unknown>): void;
/**
 * Hook for tracking component render performance
 */
declare function usePerformanceTracking(componentName: string): {
    renderCount: number;
    firstRenderTime: number | null;
};
/**
 * Hook for tracking async operations
 */
declare function useAsyncTracking<T>(operationName: string, asyncFn: () => Promise<T>, options?: {
    autoTrack?: boolean;
    attributes?: Record<string, AttributeValue>;
}): {
    execute: () => Promise<T>;
    loading: boolean;
    error: Error | null;
    data: T | null;
};
/**
 * Hook for error boundary functionality
 */
declare function useErrorBoundary(): {
    error: Error | null;
    resetError: () => void;
    handleError: (err: Error, errorInfo?: {
        componentStack?: string;
    }) => void;
};
/**
 * Hook for tracking touch interactions
 */
declare function useTouchTracking(elementName: string): {
    trackPress: () => void;
    trackLongPress: () => void;
    touchProps: {
        onPress: () => void;
        onLongPress: () => void;
    };
};
/**
 * Hook for managing user context
 */
declare function useUser(): {
    user: User | null;
    setUser: (newUser: User | null) => void;
    clearUser: () => void;
};

/**
 * TraceKit React Native SDK - Network Interceptor
 * @package @tracekit/react-native
 */

declare class NetworkInterceptor {
    private config;
    private logger;
    private originalFetch;
    private originalXhrOpen;
    private originalXhrSend;
    private installed;
    constructor(config: TracekitConfig);
    install(): void;
    uninstall(): void;
    private interceptFetch;
    private interceptXHR;
}
declare function installNetworkInterceptor(config: TracekitConfig): void;
declare function uninstallNetworkInterceptor(): void;

/**
 * TraceKit React Native SDK - Transport Layer
 * @package @tracekit/react-native
 */

interface Transport {
    send(payload: TracePayload | ExceptionPayload | SnapshotPayload): Promise<boolean>;
    sendBatch(payloads: (TracePayload | ExceptionPayload | SnapshotPayload)[]): Promise<boolean>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
declare class HttpTransport implements Transport {
    private config;
    private logger;
    private queue;
    private flushTimer;
    private isFlushing;
    private closed;
    constructor(config: TracekitConfig);
    private get endpoint();
    private get headers();
    private startFlushTimer;
    send(payload: TracePayload | ExceptionPayload | SnapshotPayload): Promise<boolean>;
    sendBatch(payloads: (TracePayload | ExceptionPayload | SnapshotPayload)[]): Promise<boolean>;
    flush(): Promise<void>;
    private sendToEndpoint;
    /**
     * Convert an exception payload to a span with exception event
     * According to OTLP spec, exceptions are represented as span events
     */
    private convertExceptionToSpan;
    private generateTraceId;
    private generateSpanId;
    private convertToOTLPFormat;
    private hexToBase64;
    private isoToNano;
    private mapSpanKind;
    private convertAttributes;
    private convertAttributeValue;
    private convertResourceAttributes;
    close(): Promise<void>;
}
declare class OfflineAwareTransport implements Transport {
    private httpTransport;
    private config;
    private logger;
    private isOnline;
    private offlineQueue;
    private maxOfflineQueue;
    constructor(config: TracekitConfig);
    private setupNetworkListener;
    private flushOfflineQueue;
    send(payload: TracePayload | ExceptionPayload | SnapshotPayload): Promise<boolean>;
    sendBatch(payloads: (TracePayload | ExceptionPayload | SnapshotPayload)[]): Promise<boolean>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
declare function createTransport(config: TracekitConfig): Transport;

/**
 * TraceKit React Native SDK - Storage Adapter
 * @package @tracekit/react-native
 */
interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    clear(): Promise<void>;
}
declare const StorageKeys: {
    readonly SESSION_ID: "@tracekit:session_id";
    readonly DEVICE_ID: "@tracekit:device_id";
    readonly USER: "@tracekit:user";
    readonly PENDING_SPANS: "@tracekit:pending_spans";
    readonly PENDING_EXCEPTIONS: "@tracekit:pending_exceptions";
    readonly PENDING_SNAPSHOTS: "@tracekit:pending_snapshots";
    readonly BREADCRUMBS: "@tracekit:breadcrumbs";
    readonly TAGS: "@tracekit:tags";
    readonly CONTEXTS: "@tracekit:contexts";
    readonly EXTRAS: "@tracekit:extras";
    readonly LAST_FLUSH: "@tracekit:last_flush";
    readonly APP_START_TIME: "@tracekit:app_start_time";
};
declare class StorageManager {
    private storage;
    private maxPendingItems;
    constructor(storage?: StorageAdapter, maxPendingItems?: number);
    getSessionId(): Promise<string | null>;
    setSessionId(sessionId: string): Promise<void>;
    getDeviceId(): Promise<string | null>;
    setDeviceId(deviceId: string): Promise<void>;
    getOrCreateDeviceId(): Promise<string>;
    getUser(): Promise<Record<string, unknown> | null>;
    setUser(user: Record<string, unknown> | null): Promise<void>;
    getPendingSpans(): Promise<unknown[]>;
    addPendingSpan(span: unknown): Promise<void>;
    addPendingSpans(newSpans: unknown[]): Promise<void>;
    clearPendingSpans(): Promise<void>;
    getPendingExceptions(): Promise<unknown[]>;
    addPendingException(exception: unknown): Promise<void>;
    clearPendingExceptions(): Promise<void>;
    getPendingSnapshots(): Promise<unknown[]>;
    addPendingSnapshot(snapshot: unknown): Promise<void>;
    clearPendingSnapshots(): Promise<void>;
    getBreadcrumbs(): Promise<unknown[]>;
    addBreadcrumb(breadcrumb: unknown, maxBreadcrumbs?: number): Promise<void>;
    clearBreadcrumbs(): Promise<void>;
    getTags(): Promise<Record<string, string>>;
    setTags(tags: Record<string, string>): Promise<void>;
    getContexts(): Promise<Record<string, Record<string, unknown>>>;
    setContexts(contexts: Record<string, Record<string, unknown>>): Promise<void>;
    getExtras(): Promise<Record<string, unknown>>;
    setExtras(extras: Record<string, unknown>): Promise<void>;
    getLastFlushTime(): Promise<number | null>;
    setLastFlushTime(timestamp: number): Promise<void>;
    getAppStartTime(): Promise<number | null>;
    setAppStartTime(timestamp: number): Promise<void>;
    clearAll(): Promise<void>;
}
declare function getStorageManager(): StorageManager;
declare function setStorageManager(manager: StorageManager): void;

/**
 * TraceKit React Native SDK - Utility Functions
 * @package @tracekit/react-native
 */

/**
 * Generate a W3C Trace ID (32 hex characters)
 */
declare function generateTraceId(): string;
/**
 * Generate a W3C Span ID (16 hex characters)
 */
declare function generateSpanId(): string;
/**
 * Generate a unique event ID
 */
declare function generateEventId(): string;
/**
 * Generate a session ID
 */
declare function generateSessionId(): string;
/**
 * Parse JavaScript error stack trace into structured frames
 */
declare function parseStackTrace(stack: string | undefined): StackFrame[];
/**
 * Check if URL should be excluded from tracing
 */
declare function shouldExcludeUrl(url: string, excludePatterns: (string | RegExp)[]): boolean;
/**
 * Sanitize sensitive data from headers
 */
declare function sanitizeHeaders(headers: Record<string, string>): Record<string, string>;
interface Logger {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}
/**
 * Create a logger instance
 */
declare function createLogger(debug: boolean): Logger;

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

/**
 * Capture an exception and report to TraceKit
 */
declare function captureException(error: Error, context?: Record<string, unknown>): string;
/**
 * Capture a message and report to TraceKit
 */
declare function captureMessage(message: string, level?: BreadcrumbLevel, context?: Record<string, unknown>): string;
/**
 * Capture a snapshot for code monitoring
 */
declare function captureSnapshot(name: string, data: Record<string, unknown>): Promise<void>;
/**
 * Start a new span
 */
declare function startSpan(name: string, parentSpan?: Span | null, attributes?: Record<string, AttributeValue>): Span;
/**
 * End a span
 */
declare function endSpan(span: Span, attributes?: Record<string, AttributeValue>, status?: 'OK' | 'ERROR' | 'UNSET'): void;
/**
 * Set the current user
 */
declare function setUser(user: User | null): void;
/**
 * Add a breadcrumb
 */
declare function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
/**
 * Clear all breadcrumbs
 */
declare function clearBreadcrumbs(): void;
/**
 * Set a tag
 */
declare function setTag(key: string, value: string): void;
/**
 * Set multiple tags
 */
declare function setTags(tags: Record<string, string>): void;
/**
 * Set a context
 */
declare function setContext(name: string, context: Record<string, unknown> | null): void;
/**
 * Set an extra value
 */
declare function setExtra(key: string, value: unknown): void;
/**
 * Set multiple extra values
 */
declare function setExtras(extras: Record<string, unknown>): void;
/**
 * Track a screen view
 */
declare function trackScreen(screenName: string, params?: Record<string, unknown>): void;
/**
 * Track a network request
 */
declare function trackNetworkRequest(request: Omit<NetworkRequest, 'requestId'>): void;
/**
 * Record performance metrics
 */
declare function recordPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void;
/**
 * Register a beforeSend callback
 */
declare function beforeSend(callback: BeforeSendCallback): void;
/**
 * Register an onError callback
 */
declare function onError(callback: OnErrorCallback): void;
/**
 * Flush pending data
 */
declare function flush(): Promise<void>;
/**
 * Close the client
 */
declare function close(): Promise<void>;
declare const TraceKit: {
    init: typeof init;
    getClient: typeof getClient;
    captureException: typeof captureException;
    captureMessage: typeof captureMessage;
    captureSnapshot: typeof captureSnapshot;
    startSpan: typeof startSpan;
    endSpan: typeof endSpan;
    setUser: typeof setUser;
    addBreadcrumb: typeof addBreadcrumb;
    clearBreadcrumbs: typeof clearBreadcrumbs;
    setTag: typeof setTag;
    setTags: typeof setTags;
    setContext: typeof setContext;
    setExtra: typeof setExtra;
    setExtras: typeof setExtras;
    trackScreen: typeof trackScreen;
    trackNetworkRequest: typeof trackNetworkRequest;
    recordPerformanceMetrics: typeof recordPerformanceMetrics;
    beforeSend: typeof beforeSend;
    onError: typeof onError;
    flush: typeof flush;
    close: typeof close;
};

export { AttributeValue, BeforeSendCallback, Breadcrumb, BreadcrumbLevel, ExceptionPayload, HttpTransport, NetworkInterceptor, NetworkRequest, OfflineAwareTransport, OnErrorCallback, PerformanceMetrics, PerformanceProfiler, ScreenTracker, SnapshotPayload, Span, StackFrame, type StorageAdapter, StorageKeys, StorageManager, TracePayload, TracekitClient, TracekitConfig, TracekitErrorBoundary, TracekitProvider, type Transport, User, UserIdentifier, addBreadcrumb, beforeSend, captureException, captureMessage, captureSnapshot, clearBreadcrumbs, close, createLogger, createTransport, TraceKit as default, endSpan, flush, generateEventId, generateSessionId, generateSpanId, generateTraceId, getClient, getStorageManager, init, installNetworkInterceptor, onError, parseStackTrace, recordPerformanceMetrics, sanitizeHeaders, setContext, setExtra, setExtras, setStorageManager, setTag, setTags, setUser, shouldExcludeUrl, startSpan, trackNetworkRequest, trackScreen, uninstallNetworkInterceptor, useAsyncTracking, useErrorBoundary, usePerformanceTracking, useScreenTracking, useSpan, useTouchTracking, useTracekit, useTracekitContext, useUser, withTracekit };
