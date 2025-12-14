/**
 * TraceKit React Native SDK - React Components
 * @package @tracekit/react-native
 */

import React, {
  Component,
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
  type ErrorInfo,
} from 'react';
import type { TracekitConfig, User } from './types';
import { TracekitClient, getClient, init } from './client';
import { installNetworkInterceptor, uninstallNetworkInterceptor } from './network';

// ============================================================================
// Context
// ============================================================================

interface TracekitContextValue {
  client: TracekitClient;
  isInitialized: boolean;
}

const TracekitContext = createContext<TracekitContextValue | null>(null);

/**
 * Hook to access TraceKit context
 */
export function useTracekitContext(): TracekitContextValue {
  const context = useContext(TracekitContext);
  if (!context) {
    throw new Error('useTracekitContext must be used within TracekitProvider');
  }
  return context;
}

// ============================================================================
// TracekitProvider
// ============================================================================

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
export function TracekitProvider({
  config,
  children,
  onReady,
  onError,
}: TracekitProviderProps) {
  const client = useMemo(() => {
    try {
      const c = init(config);

      // Install network interceptor if enabled
      if (config.enableNetworkTracing !== false) {
        installNetworkInterceptor(config);
      }

      return c;
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return getClient();
    }
  }, [config, onError]);

  useEffect(() => {
    if (client.isInitialized()) {
      onReady?.();
    }

    return () => {
      // Cleanup on unmount
      uninstallNetworkInterceptor();
    };
  }, [client, onReady]);

  const value = useMemo(
    () => ({
      client,
      isInitialized: client.isInitialized(),
    }),
    [client]
  );

  return (
    <TracekitContext.Provider value={value}>
      {children}
    </TracekitContext.Provider>
  );
}

// ============================================================================
// ErrorBoundary
// ============================================================================

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
export class TracekitErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to TraceKit
    const client = getClient();
    client.captureException(error, {
      componentStack: errorInfo.componentStack,
      handled: true,
      mechanism: {
        type: 'react_error_boundary',
        handled: true,
      },
    });

    // Call custom handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback, showErrorDetails } = this.props;

      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.resetError);
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          showDetails={showErrorDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Default Error Fallback
// ============================================================================

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
  showDetails?: boolean;
}

function DefaultErrorFallback({
  error,
  resetError,
  showDetails,
}: DefaultErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        We're sorry, but something unexpected happened.
      </Text>

      {showDetails && __DEV__ && (
        <View style={styles.detailsContainer}>
          <Text style={styles.errorName}>{error.name}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {error.stack && (
            <Text style={styles.errorStack} numberOfLines={10}>
              {error.stack}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  errorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 10,
  },
  errorStack: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============================================================================
// withTracekit HOC
// ============================================================================

/**
 * Higher-order component to inject TraceKit client
 */
export function withTracekit<P extends object>(
  WrappedComponent: React.ComponentType<P & { tracekit: TracekitClient }>
) {
  return function WithTracekitComponent(props: P) {
    const { client } = useTracekitContext();
    return <WrappedComponent {...props} tracekit={client} />;
  };
}

// ============================================================================
// ScreenTracker Component
// ============================================================================

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
export function ScreenTracker({
  screenName,
  params,
  children,
}: ScreenTrackerProps) {
  const client = getClient();

  useEffect(() => {
    client.trackScreen(screenName, params);
  }, [client, screenName, params]);

  return <>{children}</>;
}

// ============================================================================
// UserIdentifier Component
// ============================================================================

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
export function UserIdentifier({ user, children }: UserIdentifierProps) {
  const client = getClient();

  useEffect(() => {
    client.setUser(user);
  }, [client, user]);

  return <>{children}</>;
}

// ============================================================================
// PerformanceProfiler Component
// ============================================================================

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
export function PerformanceProfiler({
  id,
  children,
  onRender,
}: PerformanceProfilerProps) {
  const client = getClient();

  const handleRender = (
    profileId: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    // Report to TraceKit
    const span = client.startSpan(`render.${profileId}`, null, {
      'render.id': profileId,
      'render.phase': phase,
      'render.actual_duration': actualDuration,
      'render.base_duration': baseDuration,
    });
    client.endSpan(span);

    // Call custom handler
    onRender?.({
      id: profileId,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    });
  };

  return (
    <React.Profiler id={id} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
}
