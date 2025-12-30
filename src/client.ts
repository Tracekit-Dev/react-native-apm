/**
 * TraceKit React Native SDK - Main Client
 * @package @tracekit/react-native
 */

import { Platform, AppState, type AppStateStatus } from 'react-native';
import type {
  TracekitConfig,
  TracekitClient as ITracekitClient,
  Span,
  SpanStatus,
  SpanKind,
  AttributeValue,
  User,
  Breadcrumb,
  BreadcrumbLevel,
  BreadcrumbType,
  ExceptionReport,
  DeviceContext,
  AppContext,
  PerformanceMetrics,
  NetworkRequest,
  BeforeSendCallback,
  OnErrorCallback,
  TracePayload,
  ExceptionPayload,
  SnapshotPayload,
  Snapshot,
} from './types';
import {
  generateTraceId,
  generateSpanId,
  generateEventId,
  generateSessionId,
  now,
  nowMs,
  calculateDuration,
  parseStackTrace,
  getBasicDeviceContext,
  getBasicAppContext,
  shouldSample,
  createLogger,
  type Logger,
} from './utils';
import { createTransport, type Transport } from './transport';
import { getStorageManager, type StorageManager } from './storage';
import { SnapshotClient } from './snapshot-client';

// ============================================================================
// TraceKit Client Implementation
// ============================================================================

export class TracekitClient implements ITracekitClient {
  private config: TracekitConfig | null = null;
  private transport: Transport | null = null;
  private storage: StorageManager;
  private logger: Logger;
  private initialized = false;
  private snapshotClient: SnapshotClient | null = null;

  // State
  private sessionId: string | null = null;
  private deviceId: string | null = null;
  private user: User | null = null;
  private tags: Record<string, string> = {};
  private contexts: Record<string, Record<string, unknown>> = {};
  private extras: Record<string, unknown> = {};
  private breadcrumbs: Breadcrumb[] = [];
  private activeSpans: Map<string, Span> = new Map();

  // Device/App context (cached)
  private deviceContext: DeviceContext | null = null;
  private appContext: AppContext | null = null;

  // Callbacks
  private beforeSendCallbacks: BeforeSendCallback[] = [];
  private onErrorCallbacks: OnErrorCallback[] = [];

  // Performance tracking
  private appStartTime: number = nowMs();
  private currentScreen: string | null = null;
  private screenStartTime: number | null = null;

  constructor() {
    this.storage = getStorageManager();
    this.logger = createLogger(false);
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  init(config: TracekitConfig): void {
    if (this.initialized) {
      this.logger.warn('TraceKit already initialized');
      return;
    }

    this.config = {
      enabled: true,
      sampleRate: 1.0,
      enableCrashReporting: true,
      enableNetworkTracing: true,
      enableNavigationTracing: true,
      enableTouchTracking: false,
      enableCodeMonitoring: false,
      flushInterval: 30000,
      maxBatchSize: 50,
      maxQueueSize: 1000,
      debug: false,
      excludeUrls: [],
      ...config,
    };

    this.logger = createLogger(this.config.debug ?? false);
    this.logger.info('Initializing TraceKit React Native SDK');

    // Validate config
    if (!this.config.apiKey) {
      this.logger.error('TraceKit API key is required');
      return;
    }

    // Create transport
    this.transport = createTransport(this.config);

    // Create snapshot client if code monitoring enabled
    if (this.config.enableCodeMonitoring) {
      this.snapshotClient = new SnapshotClient(this.config);
      this.snapshotClient.start();
    }

    // Initialize async components
    this.initializeAsync();

    // Setup global error handlers
    if (this.config.enableCrashReporting) {
      this.setupErrorHandlers();
    }

    // Setup app state listener
    this.setupAppStateListener();

    this.initialized = true;
    this.logger.info('TraceKit initialized successfully');
  }

  private async initializeAsync(): Promise<void> {
    try {
      // Get or create session ID
      this.sessionId = generateSessionId();

      // Get or create device ID
      this.deviceId = await this.storage.getOrCreateDeviceId();

      // Load persisted user
      const persistedUser = await this.storage.getUser();
      if (persistedUser) {
        this.user = persistedUser as unknown as User;
      }

      // Load persisted tags/contexts
      this.tags = await this.storage.getTags();
      this.contexts = await this.storage.getContexts();
      this.extras = await this.storage.getExtras();

      // Get device/app context
      this.deviceContext = await this.getDeviceContext();
      this.appContext = await this.getAppContext();

      // Record app start time
      await this.storage.setAppStartTime(this.appStartTime);

      // Flush any pending data from previous session
      await this.flushPendingData();

      this.logger.debug('Async initialization complete', {
        sessionId: this.sessionId,
        deviceId: this.deviceId,
      });
    } catch (error) {
      this.logger.error('Async initialization failed:', error);
    }
  }

  private async flushPendingData(): Promise<void> {
    try {
      const pendingSpans = await this.storage.getPendingSpans();
      const pendingExceptions = await this.storage.getPendingExceptions();
      const pendingSnapshots = await this.storage.getPendingSnapshots();

      if (pendingSpans.length > 0) {
        this.logger.debug(`Flushing ${pendingSpans.length} pending spans`);
        // Send pending spans...
        await this.storage.clearPendingSpans();
      }

      if (pendingExceptions.length > 0) {
        this.logger.debug(`Flushing ${pendingExceptions.length} pending exceptions`);
        // Send pending exceptions...
        await this.storage.clearPendingExceptions();
      }

      if (pendingSnapshots.length > 0) {
        this.logger.debug(`Flushing ${pendingSnapshots.length} pending snapshots`);
        // Send pending snapshots...
        await this.storage.clearPendingSnapshots();
      }
    } catch (error) {
      this.logger.error('Failed to flush pending data:', error);
    }
  }

  private setupErrorHandlers(): void {
    // Global JS error handler
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // Ignore errors from optional module resolution (these are expected)
      const isOptionalModuleError = error.message?.includes('Requiring unknown module') && 
        (error.message?.includes('expo-device') || 
         error.message?.includes('expo-application') || 
         error.message?.includes('expo-constants') ||
         error.message?.includes('@react-native-community/netinfo'));
      
      if (isOptionalModuleError) {
        this.logger.debug('Optional module not available:', error.message);
        // Don't treat this as an error - it's expected when optional deps aren't installed
        return;
      }

      this.logger.debug('Global error caught:', error.message, { isFatal });

      this.captureException(error, {
        handled: false,
        mechanism: {
          type: 'global_error_handler',
          handled: false,
          data: { isFatal },
        },
      });

      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Unhandled promise rejections
    const originalRejectionHandler = (global as any).onunhandledrejection;

    (global as any).onunhandledrejection = (event: { reason: unknown }) => {
      this.logger.debug('Unhandled promise rejection:', event.reason);

      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      this.captureException(error, {
        handled: false,
        mechanism: {
          type: 'unhandled_rejection',
          handled: false,
        },
      });

      if (originalRejectionHandler) {
        originalRejectionHandler(event);
      }
    };

    this.logger.debug('Error handlers installed');
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', (state: AppStateStatus) => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'app.lifecycle',
        message: `App state changed to ${state}`,
        level: 'info',
        data: { state },
      });

      if (state === 'background' || state === 'inactive') {
        // Flush data when app goes to background
        this.flush().catch((err) => {
          this.logger.error('Failed to flush on background:', err);
        });
      }
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): TracekitConfig | null {
    return this.config;
  }

  // ============================================================================
  // Context Helpers
  // ============================================================================

  /**
   * Safely try to require an optional module
   * Returns null if the module is not available
   */
  private safeRequire<T>(moduleName: string): T | null {
    try {
      // Use a variable to prevent Metro from statically analyzing this require
      const moduleId = moduleName;
      return require(moduleId);
    } catch {
      this.logger.debug(`Optional module not available: ${moduleName}`);
      return null;
    }
  }

  private async getDeviceContext(): Promise<DeviceContext> {
    const basic = getBasicDeviceContext();

    // Try to get additional info from Expo modules
    // Using safeRequire to gracefully handle missing optional dependencies
    const Device = this.safeRequire<any>('expo-device');
    
    if (Device) {
      return {
        ...basic,
        deviceModel: Device.modelName ?? undefined,
        deviceManufacturer: Device.manufacturer ?? undefined,
        deviceName: Device.deviceName ?? undefined,
        isDevice: Device.isDevice ?? undefined,
        osVersion: Device.osVersion ?? basic.osVersion,
      };
    }

    return basic;
  }

  private async getAppContext(): Promise<AppContext> {
    const basic = getBasicAppContext();

    // Try to get additional info from Expo modules
    // Using safeRequire to gracefully handle missing optional dependencies
    const Application = this.safeRequire<any>('expo-application');
    const ConstantsModule = this.safeRequire<any>('expo-constants');
    const Constants = ConstantsModule?.default ?? ConstantsModule;

    if (Application && Constants) {
      return {
        ...basic,
        appName: Application.applicationName ?? undefined,
        bundleId: Application.applicationId ?? undefined,
        appVersion: this.config?.appVersion ?? Application.nativeApplicationVersion ?? undefined,
        buildNumber: this.config?.buildNumber ?? Application.nativeBuildVersion ?? undefined,
        isExpoGo: Constants.appOwnership === 'expo',
        expoSdkVersion: Constants.expoConfig?.sdkVersion ?? undefined,
      };
    }

    return {
      ...basic,
      appVersion: this.config?.appVersion,
      buildNumber: this.config?.buildNumber,
    };
  }

  private getServiceName(): string {
    return this.config?.serviceName 
      ?? this.appContext?.bundleId 
      ?? 'react-native-app';
  }

  private getResourceAttributes(): TracePayload['resource'] {
    return {
      'service.name': this.getServiceName(),
      'service.version': this.appContext?.appVersion,
      'deployment.environment': this.config?.environment,
      'telemetry.sdk.name': '@tracekit/react-native',
      'telemetry.sdk.version': '1.0.0',
      'telemetry.sdk.language': 'javascript',
      'device.id': this.deviceId ?? undefined,
      'device.model': this.deviceContext?.deviceModel,
      'os.name': Platform.OS,
      'os.version': this.deviceContext?.osVersion,
      'session.id': this.sessionId ?? undefined,
    };
  }

  // ============================================================================
  // Span Operations
  // ============================================================================

  startSpan(
    name: string,
    parentSpan?: Span | null,
    attributes?: Record<string, AttributeValue>
  ): Span {
    const spanId = generateSpanId();
    const traceId = parentSpan?.traceId ?? generateTraceId();

    const span: Span = {
      spanId,
      traceId,
      parentSpanId: parentSpan?.spanId,
      name,
      kind: 'INTERNAL',
      startTime: now(),
      status: 'UNSET',
      attributes: {
        ...attributes,
      },
      events: [],
      links: [],
    };

    this.activeSpans.set(spanId, span);
    this.logger.debug(`Started span: ${name} (${spanId})`);

    return span;
  }

  endSpan(
    span: Span,
    attributes?: Record<string, AttributeValue>,
    status?: SpanStatus
  ): void {
    const endTime = now();

    span.endTime = endTime;
    span.duration = calculateDuration(span.startTime, endTime);
    span.status = status ?? 'OK';

    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }

    this.activeSpans.delete(span.spanId);
    this.logger.debug(`Ended span: ${span.name} (${span.duration}ms)`);

    // Send span
    if (this.config?.enabled && shouldSample(this.config.sampleRate ?? 1)) {
      this.sendSpan(span);
    }
  }

  private async sendSpan(span: Span): Promise<void> {
    const payload: TracePayload = {
      spans: [span],
      serviceName: this.getServiceName(),
      resource: this.getResourceAttributes(),
      timestamp: now(),
    };

    // Run beforeSend callbacks
    let finalPayload: TracePayload | null = payload;
    for (const callback of this.beforeSendCallbacks) {
      const result = callback(finalPayload);
      if (result === null) {
        this.logger.debug('Span dropped by beforeSend callback');
        return;
      }
      finalPayload = result as TracePayload;
    }

    try {
      await this.transport?.send(finalPayload);
    } catch (error) {
      this.logger.error('Failed to send span:', error);
      // Store for later
      await this.storage.addPendingSpan(finalPayload);
    }
  }

  // ============================================================================
  // Exception Operations
  // ============================================================================

  captureException(
    error: Error,
    context?: Record<string, unknown>
  ): string {
    const eventId = generateEventId();

    this.logger.debug(`Capturing exception: ${error.message}`);

    const report: ExceptionReport = {
      type: error.name || 'Error',
      message: error.message,
      stackTrace: parseStackTrace(error.stack),
      handled: (context?.handled as boolean) ?? true,
      mechanism: context?.mechanism as ExceptionReport['mechanism'],
      context: context,
    };

    // Add component stack if available (React errors)
    if (context?.componentStack) {
      report.componentStack = context.componentStack as string;
    }

    // Add breadcrumb
    this.addBreadcrumb({
      type: 'error',
      category: 'exception',
      message: error.message,
      level: 'error',
      data: {
        type: report.type,
      },
    });

    // Send exception
    if (this.config?.enabled) {
      this.sendException(report, eventId);
    }

    // Call onError callbacks
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(error, context);
      } catch (e) {
        this.logger.error('onError callback failed:', e);
      }
    }

    return eventId;
  }

  captureMessage(
    message: string,
    level: BreadcrumbLevel = 'info',
    context?: Record<string, unknown>
  ): string {
    const eventId = generateEventId();

    this.logger.debug(`Capturing message: ${message}`);

    const report: ExceptionReport = {
      type: 'Message',
      message,
      handled: true,
      context,
    };

    // Add breadcrumb
    this.addBreadcrumb({
      type: 'info',
      category: 'message',
      message,
      level,
      data: context,
    });

    // Send as exception with lower severity
    if (this.config?.enabled) {
      this.sendException(report, eventId);
    }

    return eventId;
  }

  private async sendException(report: ExceptionReport, eventId: string): Promise<void> {
    const payload: ExceptionPayload = {
      exception: report,
      breadcrumbs: [...this.breadcrumbs],
      user: this.user ?? undefined,
      device: this.deviceContext ?? getBasicDeviceContext(),
      app: this.appContext ?? getBasicAppContext(),
      tags: { ...this.tags },
      contexts: { ...this.contexts },
      serviceName: this.getServiceName(),
      timestamp: now(),
    };

    // Run beforeSend callbacks
    let finalPayload: ExceptionPayload | null = payload;
    for (const callback of this.beforeSendCallbacks) {
      const result = callback(finalPayload);
      if (result === null) {
        this.logger.debug('Exception dropped by beforeSend callback');
        return;
      }
      finalPayload = result as ExceptionPayload;
    }

    try {
      await this.transport?.send(finalPayload);
    } catch (error) {
      this.logger.error('Failed to send exception:', error);
      // Store for later
      await this.storage.addPendingException(finalPayload);
    }
  }

  // ============================================================================
  // Snapshot Operations (Code Monitoring)
  // ============================================================================

  async captureSnapshot(
    name: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.config?.enableCodeMonitoring) {
      return;
    }

    // Use the SnapshotClient which handles:
    // 1. Auto-registration of breakpoints
    // 2. Polling for active breakpoints
    // 3. Conditional snapshot capture based on breakpoint state
    if (this.snapshotClient) {
      await this.snapshotClient.checkAndCapture(name, data as Record<string, any>);
    } else {
      this.logger.warn('Snapshot client not initialized. Enable code monitoring in config.');
    }
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  setUser(user: User | null): void {
    this.user = user;
    this.storage.setUser(user as Record<string, unknown> | null).catch((err) => {
      this.logger.error('Failed to persist user:', err);
    });

    if (user) {
      this.addBreadcrumb({
        type: 'user',
        category: 'auth',
        message: `User identified: ${user.id}`,
        level: 'info',
        data: { userId: user.id },
      });
    }
  }

  getUser(): User | null {
    return this.user;
  }

  // ============================================================================
  // Breadcrumb Operations
  // ============================================================================

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep max 100 breadcrumbs
    while (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }

    this.logger.debug(`Breadcrumb: [${breadcrumb.category}] ${breadcrumb.message}`);
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  // ============================================================================
  // Context Operations
  // ============================================================================

  setTag(key: string, value: string): void {
    this.tags[key] = value;
    this.storage.setTags(this.tags).catch((err) => {
      this.logger.error('Failed to persist tags:', err);
    });
  }

  setTags(tags: Record<string, string>): void {
    this.tags = { ...this.tags, ...tags };
    this.storage.setTags(this.tags).catch((err) => {
      this.logger.error('Failed to persist tags:', err);
    });
  }

  setContext(name: string, context: Record<string, unknown> | null): void {
    if (context === null) {
      delete this.contexts[name];
    } else {
      this.contexts[name] = context;
    }
    this.storage.setContexts(this.contexts).catch((err) => {
      this.logger.error('Failed to persist contexts:', err);
    });
  }

  setExtra(key: string, value: unknown): void {
    this.extras[key] = value;
    this.storage.setExtras(this.extras).catch((err) => {
      this.logger.error('Failed to persist extras:', err);
    });
  }

  setExtras(extras: Record<string, unknown>): void {
    this.extras = { ...this.extras, ...extras };
    this.storage.setExtras(this.extras).catch((err) => {
      this.logger.error('Failed to persist extras:', err);
    });
  }

  // ============================================================================
  // Navigation Tracking
  // ============================================================================

  trackScreen(screenName: string, params?: Record<string, unknown>): void {
    const previousScreen = this.currentScreen;
    const timeOnPrevious = this.screenStartTime
      ? nowMs() - this.screenStartTime
      : undefined;

    this.currentScreen = screenName;
    this.screenStartTime = nowMs();

    this.addBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      message: `Navigated to ${screenName}`,
      level: 'info',
      data: {
        from: previousScreen,
        to: screenName,
        params,
        timeOnPreviousScreen: timeOnPrevious,
      },
    });

    // Create a span for screen view
    if (this.config?.enableNavigationTracing) {
      const span = this.startSpan(`screen.${screenName}`, null, {
        'screen.name': screenName,
        'screen.previous': previousScreen ?? undefined,
        'screen.params': params ? JSON.stringify(params) : undefined,
      });

      // End immediately (screen view is instantaneous)
      this.endSpan(span);
    }
  }

  // ============================================================================
  // Network Tracking
  // ============================================================================

  trackNetworkRequest(request: Omit<NetworkRequest, 'requestId'>): void {
    const requestId = generateEventId();

    this.addBreadcrumb({
      type: 'http',
      category: 'http',
      message: `${request.method} ${request.url}`,
      level: request.error ? 'error' : 'info',
      data: {
        method: request.method,
        url: request.url,
        statusCode: request.statusCode,
        duration: request.duration,
        error: request.error,
      },
    });

    // Create span for network request
    if (this.config?.enableNetworkTracing) {
      const span = this.startSpan(`HTTP ${request.method}`, null, {
        'http.method': request.method,
        'http.url': request.url,
        'http.status_code': request.statusCode ?? undefined,
        'http.request_body_size': request.requestBodySize ?? undefined,
        'http.response_body_size': request.responseBodySize ?? undefined,
      });

      span.kind = 'CLIENT';
      span.startTime = request.startTime;
      
      this.endSpan(
        span,
        { 'http.duration': request.duration },
        request.error ? 'ERROR' : 'OK'
      );
    }
  }

  // ============================================================================
  // Performance
  // ============================================================================

  recordPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.logger.debug('Recording performance metrics:', metrics);

    const span = this.startSpan('app.performance', null, {
      'perf.app_start_time': metrics.appStartTime,
      'perf.time_to_interactive': metrics.timeToInteractive,
      'perf.js_bundle_load_time': metrics.jsBundleLoadTime,
      'perf.native_module_init_time': metrics.nativeModuleInitTime,
      'perf.fps': metrics.frameRate?.fps,
      'perf.dropped_frames': metrics.frameRate?.droppedFrames,
      'perf.js_heap_size': metrics.memoryUsage?.jsHeapSize,
    });

    this.endSpan(span);
  }

  // ============================================================================
  // Hooks
  // ============================================================================

  beforeSend(callback: BeforeSendCallback): void {
    this.beforeSendCallbacks.push(callback);
  }

  onError(callback: OnErrorCallback): void {
    this.onErrorCallbacks.push(callback);
  }

  // ============================================================================
  // Flush & Close
  // ============================================================================

  async flush(): Promise<void> {
    this.logger.debug('Flushing TraceKit data');
    await this.transport?.flush();
  }

  async close(): Promise<void> {
    this.logger.info('Closing TraceKit client');

    // Stop snapshot client
    if (this.snapshotClient) {
      this.snapshotClient.stop();
    }

    await this.flush();
    await this.transport?.close();
    this.initialized = false;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let client: TracekitClient | null = null;

export function getClient(): TracekitClient {
  if (!client) {
    client = new TracekitClient();
  }
  return client;
}

export function init(config: TracekitConfig): TracekitClient {
  const c = getClient();
  c.init(config);
  return c;
}
