/**
 * TraceKit React Native SDK - Type Definitions
 * @package @tracekit/react-native
 */
interface TracekitConfig {
    /** Required: Your TraceKit API key */
    apiKey: string;
    /** Service name for this app (default: app bundle identifier) */
    serviceName?: string;
    /** TraceKit API base URL (default: 'https://app.tracekit.dev') */
    apiUrl?: string;
    /** TraceKit endpoint (default: 'https://app.tracekit.dev/v1/traces') */
    endpoint?: string;
    /** Enable/disable tracing (default: true) */
    enabled?: boolean;
    /** Sample rate 0.0-1.0 (default: 1.0 = 100%) */
    sampleRate?: number;
    /** Enable code monitoring / live debugging (default: false) */
    enableCodeMonitoring?: boolean;
    /** Enable automatic crash reporting (default: true) */
    enableCrashReporting?: boolean;
    /** Enable automatic network request tracing (default: true) */
    enableNetworkTracing?: boolean;
    /** Enable automatic navigation/screen tracking (default: true) */
    enableNavigationTracing?: boolean;
    /** Enable automatic touch/gesture tracking (default: false) */
    enableTouchTracking?: boolean;
    /** Flush interval in milliseconds (default: 30000) */
    flushInterval?: number;
    /** Maximum batch size before flush (default: 50) */
    maxBatchSize?: number;
    /** Maximum queue size (default: 1000) */
    maxQueueSize?: number;
    /** Debug mode - logs to console (default: false) */
    debug?: boolean;
    /** Custom headers to include with requests */
    customHeaders?: Record<string, string>;
    /** URLs to exclude from network tracing (regex patterns) */
    excludeUrls?: (string | RegExp)[];
    /** Environment name (e.g., 'production', 'staging', 'development') */
    environment?: string;
    /** App version override (default: auto-detected) */
    appVersion?: string;
    /** Build number override (default: auto-detected) */
    buildNumber?: string;
    /** Release name for grouping (default: appVersion-buildNumber) */
    release?: string;
}
type SpanStatus = 'OK' | 'ERROR' | 'UNSET';
type SpanKind = 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER';
interface SpanContext {
    traceId: string;
    spanId: string;
    traceFlags: number;
}
interface Span {
    /** Unique span identifier */
    spanId: string;
    /** Parent trace identifier */
    traceId: string;
    /** Parent span identifier (if any) */
    parentSpanId?: string;
    /** Operation name */
    name: string;
    /** Span kind */
    kind: SpanKind;
    /** Start timestamp (ISO 8601) */
    startTime: string;
    /** End timestamp (ISO 8601) */
    endTime?: string;
    /** Duration in milliseconds */
    duration?: number;
    /** Span status */
    status: SpanStatus;
    /** Custom attributes */
    attributes: Record<string, AttributeValue>;
    /** Events within the span */
    events: SpanEvent[];
    /** Links to other spans */
    links: SpanLink[];
}
interface SpanEvent {
    name: string;
    timestamp: string;
    attributes?: Record<string, AttributeValue>;
}
interface SpanLink {
    traceId: string;
    spanId: string;
    attributes?: Record<string, AttributeValue>;
}
type AttributeValue = string | number | boolean | string[] | number[] | boolean[] | null | undefined;
interface Snapshot {
    /** Unique snapshot identifier */
    id: string;
    /** Breakpoint/checkpoint name */
    name: string;
    /** Timestamp when captured */
    timestamp: string;
    /** Captured variable data */
    data: Record<string, unknown>;
    /** Stack trace at capture point */
    stackTrace?: StackFrame[];
    /** Associated span context */
    spanContext?: SpanContext;
    /** Request context (if in HTTP context) */
    requestContext?: RequestContext;
    /** Device/app context */
    deviceContext: DeviceContext;
}
interface StackFrame {
    filename: string;
    function: string;
    lineno?: number;
    colno?: number;
    inApp: boolean;
}
interface RequestContext {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
}
interface DeviceContext {
    /** Platform (ios, android, web) */
    platform: 'ios' | 'android' | 'web';
    /** OS version */
    osVersion?: string;
    /** Device model */
    deviceModel?: string;
    /** Device manufacturer */
    deviceManufacturer?: string;
    /** Device name */
    deviceName?: string;
    /** Is physical device (not simulator/emulator) */
    isDevice?: boolean;
    /** Screen dimensions */
    screen?: {
        width: number;
        height: number;
        scale: number;
    };
    /** Memory info */
    memory?: {
        totalMemory?: number;
        usedMemory?: number;
    };
    /** Battery info */
    battery?: {
        level?: number;
        isCharging?: boolean;
    };
    /** Network info */
    network?: {
        type?: string;
        isConnected?: boolean;
    };
}
interface AppContext {
    /** App name */
    appName?: string;
    /** Bundle identifier */
    bundleId?: string;
    /** App version */
    appVersion?: string;
    /** Build number */
    buildNumber?: string;
    /** Release identifier */
    release?: string;
    /** Environment */
    environment?: string;
    /** Is running in Expo Go */
    isExpoGo?: boolean;
    /** Expo SDK version */
    expoSdkVersion?: string;
    /** React Native version */
    reactNativeVersion?: string;
}
interface User {
    /** Unique user identifier */
    id: string;
    /** User email */
    email?: string;
    /** Display name */
    name?: string;
    /** Username */
    username?: string;
    /** Custom user data */
    data?: Record<string, AttributeValue>;
}
interface ExceptionReport {
    /** Exception type/class */
    type: string;
    /** Error message */
    message: string;
    /** Stack trace */
    stackTrace?: StackFrame[];
    /** Component stack (React) */
    componentStack?: string;
    /** Is handled exception */
    handled: boolean;
    /** Error mechanism */
    mechanism?: {
        type: string;
        handled: boolean;
        data?: Record<string, unknown>;
    };
    /** Custom context */
    context?: Record<string, unknown>;
}
type BreadcrumbType = 'navigation' | 'http' | 'ui' | 'user' | 'console' | 'error' | 'info' | 'debug' | 'query' | 'transaction';
type BreadcrumbLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';
interface Breadcrumb {
    /** Breadcrumb type */
    type: BreadcrumbType;
    /** Category (e.g., 'navigation', 'xhr', 'console') */
    category: string;
    /** Message/description */
    message?: string;
    /** Severity level */
    level: BreadcrumbLevel;
    /** Timestamp */
    timestamp: string;
    /** Additional data */
    data?: Record<string, unknown>;
}
interface NetworkRequest {
    /** Request ID */
    requestId: string;
    /** HTTP method */
    method: string;
    /** Request URL */
    url: string;
    /** Request headers */
    requestHeaders?: Record<string, string>;
    /** Request body size in bytes */
    requestBodySize?: number;
    /** Response status code */
    statusCode?: number;
    /** Response headers */
    responseHeaders?: Record<string, string>;
    /** Response body size in bytes */
    responseBodySize?: number;
    /** Start timestamp */
    startTime: string;
    /** End timestamp */
    endTime?: string;
    /** Duration in milliseconds */
    duration?: number;
    /** Error if request failed */
    error?: string;
    /** Associated span */
    spanId?: string;
}
interface NavigationEvent {
    /** Event type */
    type: 'screen_view' | 'screen_leave' | 'tab_change' | 'modal_open' | 'modal_close';
    /** Screen/route name */
    screenName: string;
    /** Previous screen name */
    previousScreenName?: string;
    /** Route params */
    params?: Record<string, unknown>;
    /** Timestamp */
    timestamp: string;
    /** Time spent on previous screen (ms) */
    timeOnPreviousScreen?: number;
}
interface PerformanceMetrics {
    /** App startup time (ms) */
    appStartTime?: number;
    /** Time to interactive (ms) */
    timeToInteractive?: number;
    /** JS bundle load time (ms) */
    jsBundleLoadTime?: number;
    /** Native module init time (ms) */
    nativeModuleInitTime?: number;
    /** Frame rate stats */
    frameRate?: {
        fps: number;
        droppedFrames: number;
        totalFrames: number;
    };
    /** Memory usage */
    memoryUsage?: {
        jsHeapSize?: number;
        nativeHeapSize?: number;
    };
}
interface TracePayload {
    /** Batch of spans */
    spans: Span[];
    /** Service name */
    serviceName: string;
    /** Resource attributes */
    resource: {
        'service.name': string;
        'service.version'?: string;
        'deployment.environment'?: string;
        'telemetry.sdk.name': string;
        'telemetry.sdk.version': string;
        'telemetry.sdk.language': string;
        'device.id'?: string;
        'device.model'?: string;
        'os.name'?: string;
        'os.version'?: string;
        [key: string]: AttributeValue;
    };
    /** Timestamp */
    timestamp: string;
}
interface SnapshotPayload {
    /** Snapshot data */
    snapshot: Snapshot;
    /** Service name */
    serviceName: string;
    /** Timestamp */
    timestamp: string;
}
interface ExceptionPayload {
    /** Exception report */
    exception: ExceptionReport;
    /** Associated breadcrumbs */
    breadcrumbs: Breadcrumb[];
    /** User context */
    user?: User;
    /** Device context */
    device: DeviceContext;
    /** App context */
    app: AppContext;
    /** Custom tags */
    tags?: Record<string, string>;
    /** Custom context */
    contexts?: Record<string, Record<string, unknown>>;
    /** Service name */
    serviceName: string;
    /** Timestamp */
    timestamp: string;
}
interface BeforeSendCallback {
    (event: TracePayload | ExceptionPayload): TracePayload | ExceptionPayload | null;
}
interface OnErrorCallback {
    (error: Error, hint?: Record<string, unknown>): void;
}
interface TracekitClient$1 {
    /** Initialize the client */
    init(config: TracekitConfig): void;
    /** Check if client is initialized */
    isInitialized(): boolean;
    /** Get current configuration */
    getConfig(): TracekitConfig | null;
    startSpan(name: string, parentSpan?: Span | null, attributes?: Record<string, AttributeValue>): Span;
    endSpan(span: Span, attributes?: Record<string, AttributeValue>, status?: SpanStatus): void;
    captureException(error: Error, context?: Record<string, unknown>): string;
    captureMessage(message: string, level?: BreadcrumbLevel, context?: Record<string, unknown>): string;
    captureSnapshot(name: string, data: Record<string, unknown>): Promise<void>;
    setUser(user: User | null): void;
    getUser(): User | null;
    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
    clearBreadcrumbs(): void;
    setTag(key: string, value: string): void;
    setTags(tags: Record<string, string>): void;
    setContext(name: string, context: Record<string, unknown> | null): void;
    setExtra(key: string, value: unknown): void;
    setExtras(extras: Record<string, unknown>): void;
    trackScreen(screenName: string, params?: Record<string, unknown>): void;
    trackNetworkRequest(request: Omit<NetworkRequest, 'requestId'>): void;
    recordPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void;
    flush(): Promise<void>;
    beforeSend(callback: BeforeSendCallback): void;
    onError(callback: OnErrorCallback): void;
    close(): Promise<void>;
}

/**
 * TraceKit React Native SDK - Main Client
 * @package @tracekit/react-native
 */

declare class TracekitClient implements TracekitClient$1 {
    private config;
    private transport;
    private storage;
    private logger;
    private initialized;
    private snapshotClient;
    private sessionId;
    private deviceId;
    private user;
    private tags;
    private contexts;
    private extras;
    private breadcrumbs;
    private activeSpans;
    private deviceContext;
    private appContext;
    private beforeSendCallbacks;
    private onErrorCallbacks;
    private appStartTime;
    private currentScreen;
    private screenStartTime;
    constructor();
    init(config: TracekitConfig): void;
    private initializeAsync;
    private flushPendingData;
    private setupErrorHandlers;
    private setupAppStateListener;
    isInitialized(): boolean;
    getConfig(): TracekitConfig | null;
    private getDeviceContext;
    private getAppContext;
    private getServiceName;
    private getResourceAttributes;
    startSpan(name: string, parentSpan?: Span | null, attributes?: Record<string, AttributeValue>): Span;
    endSpan(span: Span, attributes?: Record<string, AttributeValue>, status?: SpanStatus): void;
    private sendSpan;
    captureException(error: Error, context?: Record<string, unknown>): string;
    captureMessage(message: string, level?: BreadcrumbLevel, context?: Record<string, unknown>): string;
    private sendException;
    captureSnapshot(name: string, data: Record<string, unknown>): Promise<void>;
    setUser(user: User | null): void;
    getUser(): User | null;
    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
    clearBreadcrumbs(): void;
    setTag(key: string, value: string): void;
    setTags(tags: Record<string, string>): void;
    setContext(name: string, context: Record<string, unknown> | null): void;
    setExtra(key: string, value: unknown): void;
    setExtras(extras: Record<string, unknown>): void;
    trackScreen(screenName: string, params?: Record<string, unknown>): void;
    trackNetworkRequest(request: Omit<NetworkRequest, 'requestId'>): void;
    recordPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void;
    beforeSend(callback: BeforeSendCallback): void;
    onError(callback: OnErrorCallback): void;
    flush(): Promise<void>;
    close(): Promise<void>;
}
declare function getClient(): TracekitClient;
declare function init(config: TracekitConfig): TracekitClient;

export { type AttributeValue as A, type BreadcrumbLevel as B, type DeviceContext as D, type ExceptionPayload as E, type NetworkRequest as N, type OnErrorCallback as O, type PerformanceMetrics as P, type RequestContext as R, type Span as S, type TracekitConfig as T, type User as U, TracekitClient as a, type Breadcrumb as b, type TracePayload as c, type SnapshotPayload as d, type StackFrame as e, type BeforeSendCallback as f, getClient as g, type SpanStatus as h, init as i, type SpanKind as j, type SpanContext as k, type SpanEvent as l, type SpanLink as m, type Snapshot as n, type AppContext as o, type ExceptionReport as p, type BreadcrumbType as q, type NavigationEvent as r, type TracekitClient$1 as s };
