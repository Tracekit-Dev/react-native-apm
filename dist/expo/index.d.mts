import React, { ReactNode } from 'react';
import { D as DeviceContext, o as AppContext, T as TracekitConfig, a as TracekitClient } from '../client-BmgNZ17x.mjs';

/**
 * TraceKit React Native SDK - Expo Integrations
 * @package @tracekit/react-native/expo
 */

/**
 * Get enhanced device context using Expo modules
 */
declare function getExpoDeviceContext(): Promise<DeviceContext>;
/**
 * Get enhanced app context using Expo modules
 */
declare function getExpoAppContext(): Promise<AppContext>;
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
declare function useExpoRouterTracking(): void;
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
declare function withScreenTracking<P extends object>(WrappedComponent: React.ComponentType<P>, screenName: string): React.ComponentType<P>;
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
declare function createNavigationTracking(): (state: any) => void;
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
declare function useNavigationTracking(): {
    navigationRef: React.MutableRefObject<any>;
    onReady: () => void;
    onStateChange: () => void;
};
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
declare function useUpdateTracking(): void;
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
declare function initExpo(config: TracekitConfig): Promise<TracekitClient>;
interface ExpoTracekitContextValue {
    client: TracekitClient | null;
    isReady: boolean;
}
declare function useExpoTracekit(): ExpoTracekitContextValue;
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
declare function ExpoTracekitProvider({ config, children, onReady, onError, }: ExpoTracekitProviderProps): React.ReactElement;

export { ExpoTracekitProvider, createNavigationTracking, getExpoAppContext, getExpoDeviceContext, initExpo, useExpoRouterTracking, useExpoTracekit, useNavigationTracking, useUpdateTracking, withScreenTracking };
