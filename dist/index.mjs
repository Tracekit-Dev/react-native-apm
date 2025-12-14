import {
  HttpTransport,
  NetworkInterceptor,
  OfflineAwareTransport,
  StorageKeys,
  StorageManager,
  TracekitClient,
  createLogger,
  createTransport,
  generateEventId,
  generateSessionId,
  generateSpanId,
  generateTraceId,
  getClient,
  getStorageManager,
  init,
  installNetworkInterceptor,
  parseStackTrace,
  sanitizeHeaders,
  setStorageManager,
  shouldExcludeUrl,
  uninstallNetworkInterceptor
} from "./chunk-JYJFBLWX.mjs";

// src/components.tsx
import React, {
  Component,
  createContext,
  useContext,
  useEffect,
  useMemo
} from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
var TracekitContext = createContext(null);
function useTracekitContext() {
  const context = useContext(TracekitContext);
  if (!context) {
    throw new Error("useTracekitContext must be used within TracekitProvider");
  }
  return context;
}
function TracekitProvider({
  config,
  children,
  onReady,
  onError: onError2
}) {
  const client = useMemo(() => {
    try {
      const c = init(config);
      if (config.enableNetworkTracing !== false) {
        installNetworkInterceptor(config);
      }
      return c;
    } catch (error) {
      onError2?.(error instanceof Error ? error : new Error(String(error)));
      return getClient();
    }
  }, [config, onError2]);
  useEffect(() => {
    if (client.isInitialized()) {
      onReady?.();
    }
    return () => {
      uninstallNetworkInterceptor();
    };
  }, [client, onReady]);
  const value = useMemo(
    () => ({
      client,
      isInitialized: client.isInitialized()
    }),
    [client]
  );
  return /* @__PURE__ */ React.createElement(TracekitContext.Provider, { value }, children);
}
var TracekitErrorBoundary = class extends Component {
  constructor(props) {
    super(props);
    this.resetError = () => {
      this.setState({ hasError: false, error: null });
    };
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    const client = getClient();
    client.captureException(error, {
      componentStack: errorInfo.componentStack,
      handled: true,
      mechanism: {
        type: "react_error_boundary",
        handled: true
      }
    });
    this.props.onError?.(error, errorInfo);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback, showErrorDetails } = this.props;
      if (typeof fallback === "function") {
        return fallback(this.state.error, this.resetError);
      }
      if (fallback) {
        return fallback;
      }
      return /* @__PURE__ */ React.createElement(
        DefaultErrorFallback,
        {
          error: this.state.error,
          resetError: this.resetError,
          showDetails: showErrorDetails
        }
      );
    }
    return this.props.children;
  }
};
function DefaultErrorFallback({
  error,
  resetError,
  showDetails
}) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Something went wrong"), /* @__PURE__ */ React.createElement(Text, { style: styles.message }, "We're sorry, but something unexpected happened."), showDetails && __DEV__ && /* @__PURE__ */ React.createElement(View, { style: styles.detailsContainer }, /* @__PURE__ */ React.createElement(Text, { style: styles.errorName }, error.name), /* @__PURE__ */ React.createElement(Text, { style: styles.errorMessage }, error.message), error.stack && /* @__PURE__ */ React.createElement(Text, { style: styles.errorStack, numberOfLines: 10 }, error.stack)), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.button, onPress: resetError }, /* @__PURE__ */ React.createElement(Text, { style: styles.buttonText }, "Try Again")));
}
var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 10
  },
  message: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20
  },
  detailsContainer: {
    width: "100%",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dee2e6"
  },
  errorName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 5
  },
  errorMessage: {
    fontSize: 14,
    color: "#212529",
    marginBottom: 10
  },
  errorStack: {
    fontSize: 10,
    color: "#6c757d",
    fontFamily: "monospace"
  },
  button: {
    backgroundColor: "#007bff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});
function withTracekit(WrappedComponent) {
  return function WithTracekitComponent(props) {
    const { client } = useTracekitContext();
    return /* @__PURE__ */ React.createElement(WrappedComponent, { ...props, tracekit: client });
  };
}
function ScreenTracker({
  screenName,
  params,
  children
}) {
  const client = getClient();
  useEffect(() => {
    client.trackScreen(screenName, params);
  }, [client, screenName, params]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
}
function UserIdentifier({ user, children }) {
  const client = getClient();
  useEffect(() => {
    client.setUser(user);
  }, [client, user]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
}
function PerformanceProfiler({
  id,
  children,
  onRender
}) {
  const client = getClient();
  const handleRender = (profileId, phase, actualDuration, baseDuration, startTime, commitTime) => {
    const span = client.startSpan(`render.${profileId}`, null, {
      "render.id": profileId,
      "render.phase": phase,
      "render.actual_duration": actualDuration,
      "render.base_duration": baseDuration
    });
    client.endSpan(span);
    onRender?.({
      id: profileId,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime
    });
  };
  return /* @__PURE__ */ React.createElement(React.Profiler, { id, onRender: handleRender }, children);
}

// src/hooks.ts
import { useCallback, useEffect as useEffect2, useRef, useState } from "react";
function useTracekit() {
  const client = getClient();
  const captureException2 = useCallback(
    (error, context) => {
      return client.captureException(error, context);
    },
    [client]
  );
  const captureMessage2 = useCallback(
    (message, level, context) => {
      return client.captureMessage(message, level, context);
    },
    [client]
  );
  const captureSnapshot2 = useCallback(
    async (name, data) => {
      return client.captureSnapshot(name, data);
    },
    [client]
  );
  const setUser2 = useCallback(
    (user) => {
      client.setUser(user);
    },
    [client]
  );
  const addBreadcrumb2 = useCallback(
    (breadcrumb) => {
      client.addBreadcrumb(breadcrumb);
    },
    [client]
  );
  const setTag2 = useCallback(
    (key, value) => {
      client.setTag(key, value);
    },
    [client]
  );
  const setContext2 = useCallback(
    (name, context) => {
      client.setContext(name, context);
    },
    [client]
  );
  return {
    captureException: captureException2,
    captureMessage: captureMessage2,
    captureSnapshot: captureSnapshot2,
    setUser: setUser2,
    addBreadcrumb: addBreadcrumb2,
    setTag: setTag2,
    setContext: setContext2,
    client
  };
}
function useSpan(name, options) {
  const client = getClient();
  const spanRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const start = useCallback(() => {
    if (spanRef.current) {
      console.warn("Span already started");
      return spanRef.current;
    }
    spanRef.current = client.startSpan(
      name,
      options?.parentSpan,
      options?.attributes
    );
    setIsActive(true);
    return spanRef.current;
  }, [client, name, options?.parentSpan, options?.attributes]);
  const end = useCallback(
    (attributes, status) => {
      if (!spanRef.current) {
        console.warn("No span to end");
        return;
      }
      client.endSpan(spanRef.current, attributes, status);
      spanRef.current = null;
      setIsActive(false);
    },
    [client]
  );
  const addEvent = useCallback(
    (eventName, attributes) => {
      if (!spanRef.current) {
        console.warn("No active span");
        return;
      }
      spanRef.current.events.push({
        name: eventName,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        attributes
      });
    },
    []
  );
  const setAttributes = useCallback(
    (attributes) => {
      if (!spanRef.current) {
        console.warn("No active span");
        return;
      }
      spanRef.current.attributes = {
        ...spanRef.current.attributes,
        ...attributes
      };
    },
    []
  );
  useEffect2(() => {
    if (options?.autoStart) {
      start();
    }
    return () => {
      if (options?.autoEnd && spanRef.current) {
        end();
      }
    };
  }, [options?.autoStart, options?.autoEnd, start, end]);
  return {
    span: spanRef.current,
    isActive,
    start,
    end,
    addEvent,
    setAttributes
  };
}
function useScreenTracking(screenName, params) {
  const client = getClient();
  const tracked = useRef(false);
  useEffect2(() => {
    if (!tracked.current) {
      client.trackScreen(screenName, params);
      tracked.current = true;
    }
  }, [client, screenName, params]);
}
function usePerformanceTracking(componentName) {
  const client = getClient();
  const renderCount = useRef(0);
  const firstRenderTime = useRef(null);
  useEffect2(() => {
    renderCount.current += 1;
    if (firstRenderTime.current === null) {
      firstRenderTime.current = Date.now();
    }
    const span = client.startSpan(`component.render.${componentName}`, null, {
      "component.name": componentName,
      "component.render_count": renderCount.current
    });
    client.endSpan(span);
  });
  return {
    renderCount: renderCount.current,
    firstRenderTime: firstRenderTime.current
  };
}
function useAsyncTracking(operationName, asyncFn, options) {
  const client = getClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    const span = client.startSpan(operationName, null, options?.attributes);
    try {
      const result = await asyncFn();
      setData(result);
      client.endSpan(span, { "operation.success": true });
      return result;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error(String(err));
      setError(error2);
      client.endSpan(span, { "operation.success": false }, "ERROR");
      client.captureException(error2, { operation: operationName });
      throw error2;
    } finally {
      setLoading(false);
    }
  }, [client, operationName, asyncFn, options?.attributes]);
  useEffect2(() => {
    if (options?.autoTrack) {
      execute().catch(() => {
      });
    }
  }, [options?.autoTrack, execute]);
  return {
    execute,
    loading,
    error,
    data
  };
}
function useErrorBoundary() {
  const client = getClient();
  const [error, setError] = useState(null);
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  const handleError = useCallback(
    (err, errorInfo) => {
      setError(err);
      client.captureException(err, {
        componentStack: errorInfo?.componentStack,
        handled: true,
        mechanism: {
          type: "error_boundary",
          handled: true
        }
      });
    },
    [client]
  );
  return {
    error,
    resetError,
    handleError
  };
}
function useTouchTracking(elementName) {
  const client = getClient();
  const trackPress = useCallback(() => {
    client.addBreadcrumb({
      type: "ui",
      category: "touch",
      message: `Pressed ${elementName}`,
      level: "info",
      data: { element: elementName, action: "press" }
    });
  }, [client, elementName]);
  const trackLongPress = useCallback(() => {
    client.addBreadcrumb({
      type: "ui",
      category: "touch",
      message: `Long pressed ${elementName}`,
      level: "info",
      data: { element: elementName, action: "longPress" }
    });
  }, [client, elementName]);
  return {
    trackPress,
    trackLongPress,
    // Props to spread on Pressable/TouchableOpacity
    touchProps: {
      onPress: trackPress,
      onLongPress: trackLongPress
    }
  };
}
function useUser() {
  const client = getClient();
  const [user, setUserState] = useState(client.getUser());
  const setUser2 = useCallback(
    (newUser) => {
      client.setUser(newUser);
      setUserState(newUser);
    },
    [client]
  );
  const clearUser = useCallback(() => {
    client.setUser(null);
    setUserState(null);
  }, [client]);
  return {
    user,
    setUser: setUser2,
    clearUser
  };
}

// src/index.ts
function captureException(error, context) {
  return getClient().captureException(error, context);
}
function captureMessage(message, level, context) {
  return getClient().captureMessage(message, level, context);
}
function captureSnapshot(name, data) {
  return getClient().captureSnapshot(name, data);
}
function startSpan(name, parentSpan, attributes) {
  return getClient().startSpan(name, parentSpan, attributes);
}
function endSpan(span, attributes, status) {
  return getClient().endSpan(span, attributes, status);
}
function setUser(user) {
  return getClient().setUser(user);
}
function addBreadcrumb(breadcrumb) {
  return getClient().addBreadcrumb(breadcrumb);
}
function clearBreadcrumbs() {
  return getClient().clearBreadcrumbs();
}
function setTag(key, value) {
  return getClient().setTag(key, value);
}
function setTags(tags) {
  return getClient().setTags(tags);
}
function setContext(name, context) {
  return getClient().setContext(name, context);
}
function setExtra(key, value) {
  return getClient().setExtra(key, value);
}
function setExtras(extras) {
  return getClient().setExtras(extras);
}
function trackScreen(screenName, params) {
  return getClient().trackScreen(screenName, params);
}
function trackNetworkRequest(request) {
  return getClient().trackNetworkRequest(request);
}
function recordPerformanceMetrics(metrics) {
  return getClient().recordPerformanceMetrics(metrics);
}
function beforeSend(callback) {
  return getClient().beforeSend(callback);
}
function onError(callback) {
  return getClient().onError(callback);
}
function flush() {
  return getClient().flush();
}
function close() {
  return getClient().close();
}
var TraceKit = {
  init,
  getClient,
  captureException,
  captureMessage,
  captureSnapshot,
  startSpan,
  endSpan,
  setUser,
  addBreadcrumb,
  clearBreadcrumbs,
  setTag,
  setTags,
  setContext,
  setExtra,
  setExtras,
  trackScreen,
  trackNetworkRequest,
  recordPerformanceMetrics,
  beforeSend,
  onError,
  flush,
  close
};
var index_default = TraceKit;
export {
  HttpTransport,
  NetworkInterceptor,
  OfflineAwareTransport,
  PerformanceProfiler,
  ScreenTracker,
  StorageKeys,
  StorageManager,
  TracekitClient,
  TracekitErrorBoundary,
  TracekitProvider,
  UserIdentifier,
  addBreadcrumb,
  beforeSend,
  captureException,
  captureMessage,
  captureSnapshot,
  clearBreadcrumbs,
  close,
  createLogger,
  createTransport,
  index_default as default,
  endSpan,
  flush,
  generateEventId,
  generateSessionId,
  generateSpanId,
  generateTraceId,
  getClient,
  getStorageManager,
  init,
  installNetworkInterceptor,
  onError,
  parseStackTrace,
  recordPerformanceMetrics,
  sanitizeHeaders,
  setContext,
  setExtra,
  setExtras,
  setStorageManager,
  setTag,
  setTags,
  setUser,
  shouldExcludeUrl,
  startSpan,
  trackNetworkRequest,
  trackScreen,
  uninstallNetworkInterceptor,
  useAsyncTracking,
  useErrorBoundary,
  usePerformanceTracking,
  useScreenTracking,
  useSpan,
  useTouchTracking,
  useTracekit,
  useTracekitContext,
  useUser,
  withTracekit
};
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
