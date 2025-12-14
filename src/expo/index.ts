/**
 * TraceKit React Native SDK - Expo Integrations
 * @package @tracekit/react-native/expo
 */

import React, { useEffect, useRef, createContext, useContext, useState, type ReactNode } from 'react';
import type { TracekitConfig, DeviceContext, AppContext } from '../types';
import { TracekitClient, getClient, init as coreInit } from '../client';
import { installNetworkInterceptor } from '../network';
import { createLogger } from '../utils';

// ============================================================================
// Expo Device Context
// ============================================================================

/**
 * Get enhanced device context using Expo modules
 */
export async function getExpoDeviceContext(): Promise<DeviceContext> {
  const context: DeviceContext = {
    platform: 'ios', // Will be overwritten
  };

  try {
    const { Platform, Dimensions } = await import('react-native');
    const { width, height, scale } = Dimensions.get('window');

    context.platform = Platform.OS as 'ios' | 'android' | 'web';
    context.osVersion = Platform.Version?.toString();
    context.screen = { width, height, scale };
  } catch {
    // React Native not available
  }

  try {
    // @ts-ignore - optional expo dependency
    const Device = await import('expo-device');

    context.deviceModel = Device.modelName ?? undefined;
    context.deviceManufacturer = Device.manufacturer ?? undefined;
    context.deviceName = Device.deviceName ?? undefined;
    context.isDevice = Device.isDevice ?? undefined;
    context.osVersion = Device.osVersion ?? context.osVersion;

    // Memory info
    if (Device.totalMemory) {
      context.memory = {
        totalMemory: Device.totalMemory,
      };
    }
  } catch {
    // expo-device not available
  }

  try {
    // @ts-ignore - optional expo dependency
    const Battery = await import('expo-battery');
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();

    context.battery = {
      level: level >= 0 ? level : undefined,
      isCharging: state === Battery.BatteryState.CHARGING,
    };
  } catch {
    // expo-battery not available
  }

  try {
    // @ts-ignore - optional expo dependency
    const Network = await import('expo-network');
    const networkState = await Network.getNetworkStateAsync();

    context.network = {
      type: networkState.type,
      isConnected: networkState.isConnected ?? undefined,
    };
  } catch {
    // expo-network not available
  }

  return context;
}

/**
 * Get enhanced app context using Expo modules
 */
export async function getExpoAppContext(): Promise<AppContext> {
  const context: AppContext = {};

  try {
    // @ts-ignore - optional expo dependency
    const Application = await import('expo-application');

    context.appName = Application.applicationName ?? undefined;
    context.bundleId = Application.applicationId ?? undefined;
    context.appVersion = Application.nativeApplicationVersion ?? undefined;
    context.buildNumber = Application.nativeBuildVersion ?? undefined;
  } catch {
    // expo-application not available
  }

  try {
    // @ts-ignore - optional expo dependency
    const Constants = (await import('expo-constants')).default;

    context.isExpoGo = Constants.appOwnership === 'expo';
    context.expoSdkVersion = Constants.expoConfig?.sdkVersion ?? undefined;

    // Get version from expoConfig if not set
    if (!context.appVersion) {
      context.appVersion = Constants.expoConfig?.version;
    }
  } catch {
    // expo-constants not available
  }

  try {
    // @ts-ignore - optional expo dependency
    const Updates = await import('expo-updates');

    // Add update channel info if available
    if (Updates.channel) {
      context.environment = Updates.channel;
    }
  } catch {
    // expo-updates not available
  }

  return context;
}

// ============================================================================
// Expo Router Integration
// ============================================================================

/**
 * Hook for integrating with Expo Router navigation
 *
 * @example
 * ```tsx
 * // In your _layout.tsx
 * import { useExpoRouterTracking } from '@tracekit/react-native/expo';
 *
 * export default function RootLayout() {
 *   useExpoRouterTracking();
 *
 *   return <Slot />;
 * }
 * ```
 */
export function useExpoRouterTracking() {
  const client = getClient();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupTracking = async () => {
      try {
        // @ts-ignore - optional expo dependency
        const { usePathname, useSegments } = await import('expo-router');

        // Create a component that tracks navigation
        // Note: This is a simplified version. In practice, you'd need to
        // handle this differently based on your navigation structure.
      } catch {
        // expo-router not available
      }
    };

    setupTracking();

    return () => {
      unsubscribe?.();
    };
  }, [client]);
}

/**
 * HOC for tracking screen views in Expo Router
 *
 * @example
 * ```tsx
 * // In app/home.tsx
 * import { withScreenTracking } from '@tracekit/react-native/expo';
 *
 * function HomeScreen() {
 *   return <View>...</View>;
 * }
 *
 * export default withScreenTracking(HomeScreen, 'Home');
 * ```
 */
export function withScreenTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: string
): React.ComponentType<P> {
  return function ScreenTrackedComponent(props: P): React.ReactElement {
    const client = getClient();

    useEffect(() => {
      client.trackScreen(screenName);
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}

// ============================================================================
// React Navigation Integration
// ============================================================================

/**
 * Create a navigation state change handler for React Navigation
 *
 * @example
 * ```tsx
 * import { createNavigationTracking } from '@tracekit/react-native/expo';
 * import { NavigationContainer } from '@react-navigation/native';
 *
 * const onStateChange = createNavigationTracking();
 *
 * function App() {
 *   return (
 *     <NavigationContainer onStateChange={onStateChange}>
 *       <Navigator />
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function createNavigationTracking() {
  const client = getClient();
  let currentRouteName: string | undefined;

  return (state: any) => {
    if (!state) return;

    const getActiveRouteName = (state: any): string | undefined => {
      if (!state.routes) return undefined;

      const route = state.routes[state.index];
      if (route.state) {
        return getActiveRouteName(route.state);
      }
      return route.name;
    };

    const routeName = getActiveRouteName(state);

    if (routeName && routeName !== currentRouteName) {
      client.trackScreen(routeName);
      currentRouteName = routeName;
    }
  };
}

/**
 * Hook for React Navigation tracking
 *
 * @example
 * ```tsx
 * import { useNavigationTracking } from '@tracekit/react-native/expo';
 * import { NavigationContainer } from '@react-navigation/native';
 *
 * function App() {
 *   const { navigationRef, onReady, onStateChange } = useNavigationTracking();
 *
 *   return (
 *     <NavigationContainer
 *       ref={navigationRef}
 *       onReady={onReady}
 *       onStateChange={onStateChange}
 *     >
 *       <Navigator />
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function useNavigationTracking() {
  const client = getClient();
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string | undefined>();

  const onReady = () => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;

    if (routeNameRef.current) {
      client.trackScreen(routeNameRef.current);
    }
  };

  const onStateChange = () => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

    if (currentRouteName && previousRouteName !== currentRouteName) {
      client.trackScreen(currentRouteName);
    }

    routeNameRef.current = currentRouteName;
  };

  return {
    navigationRef,
    onReady,
    onStateChange,
  };
}

// ============================================================================
// Expo Updates Integration
// ============================================================================

/**
 * Track Expo OTA update events
 *
 * @example
 * ```tsx
 * import { useUpdateTracking } from '@tracekit/react-native/expo';
 *
 * function App() {
 *   useUpdateTracking();
 *   return <MyApp />;
 * }
 * ```
 */
export function useUpdateTracking() {
  const client = getClient();

  useEffect(() => {
    const trackUpdates = async () => {
      try {
        // @ts-ignore - optional expo dependency
        const Updates = await import('expo-updates');

        // Track current update info
        if (Updates.updateId) {
          client.setTag('update.id', Updates.updateId);
        }
        if (Updates.channel) {
          client.setTag('update.channel', Updates.channel);
        }
        if (Updates.createdAt) {
          client.setTag('update.created_at', Updates.createdAt.toISOString());
        }

        // Listen for update events
        Updates.addListener((event: any) => {
          switch (event.type) {
            case Updates.UpdateEventType.UPDATE_AVAILABLE:
              client.addBreadcrumb({
                type: 'info',
                category: 'expo.updates',
                message: 'Update available',
                level: 'info',
                data: { manifest: event.manifest },
              });
              break;

            case Updates.UpdateEventType.NO_UPDATE_AVAILABLE:
              client.addBreadcrumb({
                type: 'info',
                category: 'expo.updates',
                message: 'No update available',
                level: 'info',
              });
              break;

            case Updates.UpdateEventType.ERROR:
              client.addBreadcrumb({
                type: 'error',
                category: 'expo.updates',
                message: 'Update error',
                level: 'error',
                data: { error: event.message },
              });
              break;
          }
        });
      } catch {
        // expo-updates not available
      }
    };

    trackUpdates();
  }, [client]);
}

// ============================================================================
// Enhanced Init for Expo
// ============================================================================

/**
 * Initialize TraceKit with Expo-specific enhancements
 *
 * @example
 * ```tsx
 * import { initExpo } from '@tracekit/react-native/expo';
 *
 * initExpo({
 *   apiKey: process.env.EXPO_PUBLIC_TRACEKIT_API_KEY,
 *   serviceName: 'my-expo-app',
 * });
 * ```
 */
export async function initExpo(config: TracekitConfig) {
  const logger = createLogger(config.debug ?? false);
  logger.info('Initializing TraceKit with Expo enhancements');

  // Get enhanced context
  const [deviceContext, appContext] = await Promise.all([
    getExpoDeviceContext(),
    getExpoAppContext(),
  ]);

  // Merge app context into config
  const enhancedConfig: TracekitConfig = {
    ...config,
    serviceName: config.serviceName ?? appContext.bundleId ?? 'expo-app',
    appVersion: config.appVersion ?? appContext.appVersion,
    buildNumber: config.buildNumber ?? appContext.buildNumber,
    environment: config.environment ?? appContext.environment,
  };

  // Initialize core client
  const client = coreInit(enhancedConfig);

  // Install network interceptor
  if (config.enableNetworkTracing !== false) {
    installNetworkInterceptor(enhancedConfig);
  }

  // Set device context
  client.setContext('device', deviceContext as unknown as Record<string, unknown>);
  client.setContext('app', appContext as unknown as Record<string, unknown>);

  // Add Expo-specific tags
  if (appContext.isExpoGo) {
    client.setTag('expo.is_expo_go', 'true');
  }
  if (appContext.expoSdkVersion) {
    client.setTag('expo.sdk_version', appContext.expoSdkVersion);
  }

  logger.info('TraceKit Expo initialization complete');

  return client;
}

// ============================================================================
// Expo Provider
// ============================================================================

interface ExpoTracekitContextValue {
  client: TracekitClient | null;
  isReady: boolean;
}

const ExpoTracekitContext = createContext<ExpoTracekitContextValue>({
  client: null,
  isReady: false,
});

export function useExpoTracekit() {
  return useContext(ExpoTracekitContext);
}

interface ExpoTracekitProviderProps {
  config: TracekitConfig;
  children: ReactNode;
  onReady?: (client: TracekitClient) => void;
  onError?: (error: Error) => void;
}

/**
 * Enhanced TraceKit provider for Expo apps
 *
 * @example
 * ```tsx
 * import { ExpoTracekitProvider } from '@tracekit/react-native/expo';
 *
 * export default function App() {
 *   return (
 *     <ExpoTracekitProvider
 *       config={{
 *         apiKey: process.env.EXPO_PUBLIC_TRACEKIT_API_KEY!,
 *         serviceName: 'my-app',
 *       }}
 *     >
 *       <MainApp />
 *     </ExpoTracekitProvider>
 *   );
 * }
 * ```
 */
export function ExpoTracekitProvider({
  config,
  children,
  onReady,
  onError,
}: ExpoTracekitProviderProps): React.ReactElement {
  const [client, setClient] = useState<TracekitClient | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initExpo(config)
      .then((c) => {
        setClient(c);
        setIsReady(true);
        onReady?.(c);
      })
      .catch((error) => {
        onError?.(error);
      });
  }, [config, onReady, onError]);

  return React.createElement(
    ExpoTracekitContext.Provider,
    { value: { client, isReady } },
    children
  );
}
