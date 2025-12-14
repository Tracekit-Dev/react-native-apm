/**
 * TraceKit React Native SDK - React Hooks
 * @package @tracekit/react-native
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Span, User, AttributeValue, BreadcrumbLevel } from './types';
import { getClient } from './client';

// ============================================================================
// useTracekit Hook
// ============================================================================

/**
 * Main hook for accessing TraceKit functionality
 */
export function useTracekit() {
  const client = getClient();

  const captureException = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      return client.captureException(error, context);
    },
    [client]
  );

  const captureMessage = useCallback(
    (message: string, level?: BreadcrumbLevel, context?: Record<string, unknown>) => {
      return client.captureMessage(message, level, context);
    },
    [client]
  );

  const captureSnapshot = useCallback(
    async (name: string, data: Record<string, unknown>) => {
      return client.captureSnapshot(name, data);
    },
    [client]
  );

  const setUser = useCallback(
    (user: User | null) => {
      client.setUser(user);
    },
    [client]
  );

  const addBreadcrumb = useCallback(
    (breadcrumb: Parameters<typeof client.addBreadcrumb>[0]) => {
      client.addBreadcrumb(breadcrumb);
    },
    [client]
  );

  const setTag = useCallback(
    (key: string, value: string) => {
      client.setTag(key, value);
    },
    [client]
  );

  const setContext = useCallback(
    (name: string, context: Record<string, unknown> | null) => {
      client.setContext(name, context);
    },
    [client]
  );

  return {
    captureException,
    captureMessage,
    captureSnapshot,
    setUser,
    addBreadcrumb,
    setTag,
    setContext,
    client,
  };
}

// ============================================================================
// useSpan Hook
// ============================================================================

/**
 * Hook for creating and managing spans
 */
export function useSpan(
  name: string,
  options?: {
    autoStart?: boolean;
    autoEnd?: boolean;
    attributes?: Record<string, AttributeValue>;
    parentSpan?: Span | null;
  }
) {
  const client = getClient();
  const spanRef = useRef<Span | null>(null);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    if (spanRef.current) {
      console.warn('Span already started');
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
    (attributes?: Record<string, AttributeValue>, status?: 'OK' | 'ERROR') => {
      if (!spanRef.current) {
        console.warn('No span to end');
        return;
      }

      client.endSpan(spanRef.current, attributes, status);
      spanRef.current = null;
      setIsActive(false);
    },
    [client]
  );

  const addEvent = useCallback(
    (eventName: string, attributes?: Record<string, AttributeValue>) => {
      if (!spanRef.current) {
        console.warn('No active span');
        return;
      }

      spanRef.current.events.push({
        name: eventName,
        timestamp: new Date().toISOString(),
        attributes,
      });
    },
    []
  );

  const setAttributes = useCallback(
    (attributes: Record<string, AttributeValue>) => {
      if (!spanRef.current) {
        console.warn('No active span');
        return;
      }

      spanRef.current.attributes = {
        ...spanRef.current.attributes,
        ...attributes,
      };
    },
    []
  );

  // Auto-start on mount
  useEffect(() => {
    if (options?.autoStart) {
      start();
    }

    // Auto-end on unmount
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
    setAttributes,
  };
}

// ============================================================================
// useScreenTracking Hook
// ============================================================================

/**
 * Hook for tracking screen views
 */
export function useScreenTracking(
  screenName: string,
  params?: Record<string, unknown>
) {
  const client = getClient();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      client.trackScreen(screenName, params);
      tracked.current = true;
    }
  }, [client, screenName, params]);
}

// ============================================================================
// usePerformanceTracking Hook
// ============================================================================

/**
 * Hook for tracking component render performance
 */
export function usePerformanceTracking(componentName: string) {
  const client = getClient();
  const renderCount = useRef(0);
  const firstRenderTime = useRef<number | null>(null);

  useEffect(() => {
    renderCount.current += 1;

    if (firstRenderTime.current === null) {
      firstRenderTime.current = Date.now();
    }

    const span = client.startSpan(`component.render.${componentName}`, null, {
      'component.name': componentName,
      'component.render_count': renderCount.current,
    });

    // End span immediately (render is complete)
    client.endSpan(span);
  });

  return {
    renderCount: renderCount.current,
    firstRenderTime: firstRenderTime.current,
  };
}

// ============================================================================
// useAsyncTracking Hook
// ============================================================================

/**
 * Hook for tracking async operations
 */
export function useAsyncTracking<T>(
  operationName: string,
  asyncFn: () => Promise<T>,
  options?: {
    autoTrack?: boolean;
    attributes?: Record<string, AttributeValue>;
  }
) {
  const client = getClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    const span = client.startSpan(operationName, null, options?.attributes);

    try {
      const result = await asyncFn();
      setData(result);
      client.endSpan(span, { 'operation.success': true });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      client.endSpan(span, { 'operation.success': false }, 'ERROR');
      client.captureException(error, { operation: operationName });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client, operationName, asyncFn, options?.attributes]);

  // Auto-execute on mount
  useEffect(() => {
    if (options?.autoTrack) {
      execute().catch(() => {});
    }
  }, [options?.autoTrack, execute]);

  return {
    execute,
    loading,
    error,
    data,
  };
}

// ============================================================================
// useErrorBoundary Hook
// ============================================================================

/**
 * Hook for error boundary functionality
 */
export function useErrorBoundary() {
  const client = getClient();
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (err: Error, errorInfo?: { componentStack?: string }) => {
      setError(err);
      client.captureException(err, {
        componentStack: errorInfo?.componentStack,
        handled: true,
        mechanism: {
          type: 'error_boundary',
          handled: true,
        },
      });
    },
    [client]
  );

  return {
    error,
    resetError,
    handleError,
  };
}

// ============================================================================
// useTouchTracking Hook
// ============================================================================

/**
 * Hook for tracking touch interactions
 */
export function useTouchTracking(elementName: string) {
  const client = getClient();

  const trackPress = useCallback(() => {
    client.addBreadcrumb({
      type: 'ui',
      category: 'touch',
      message: `Pressed ${elementName}`,
      level: 'info',
      data: { element: elementName, action: 'press' },
    });
  }, [client, elementName]);

  const trackLongPress = useCallback(() => {
    client.addBreadcrumb({
      type: 'ui',
      category: 'touch',
      message: `Long pressed ${elementName}`,
      level: 'info',
      data: { element: elementName, action: 'longPress' },
    });
  }, [client, elementName]);

  return {
    trackPress,
    trackLongPress,
    // Props to spread on Pressable/TouchableOpacity
    touchProps: {
      onPress: trackPress,
      onLongPress: trackLongPress,
    },
  };
}

// ============================================================================
// useUser Hook
// ============================================================================

/**
 * Hook for managing user context
 */
export function useUser() {
  const client = getClient();
  const [user, setUserState] = useState<User | null>(client.getUser());

  const setUser = useCallback(
    (newUser: User | null) => {
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
    setUser,
    clearUser,
  };
}
