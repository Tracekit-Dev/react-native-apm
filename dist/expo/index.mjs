import {
  createLogger,
  getClient,
  init,
  installNetworkInterceptor
} from "../chunk-JYJFBLWX.mjs";

// src/expo/index.ts
import React, { useEffect, useRef, createContext, useContext, useState } from "react";
async function getExpoDeviceContext() {
  const context = {
    platform: "ios"
    // Will be overwritten
  };
  try {
    const { Platform, Dimensions } = await import("react-native");
    const { width, height, scale } = Dimensions.get("window");
    context.platform = Platform.OS;
    context.osVersion = Platform.Version?.toString();
    context.screen = { width, height, scale };
  } catch {
  }
  try {
    const Device = await import("expo-device");
    context.deviceModel = Device.modelName ?? void 0;
    context.deviceManufacturer = Device.manufacturer ?? void 0;
    context.deviceName = Device.deviceName ?? void 0;
    context.isDevice = Device.isDevice ?? void 0;
    context.osVersion = Device.osVersion ?? context.osVersion;
    if (Device.totalMemory) {
      context.memory = {
        totalMemory: Device.totalMemory
      };
    }
  } catch {
  }
  try {
    const Battery = await import("expo-battery");
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();
    context.battery = {
      level: level >= 0 ? level : void 0,
      isCharging: state === Battery.BatteryState.CHARGING
    };
  } catch {
  }
  try {
    const Network = await import("expo-network");
    const networkState = await Network.getNetworkStateAsync();
    context.network = {
      type: networkState.type,
      isConnected: networkState.isConnected ?? void 0
    };
  } catch {
  }
  return context;
}
async function getExpoAppContext() {
  const context = {};
  try {
    const Application = await import("expo-application");
    context.appName = Application.applicationName ?? void 0;
    context.bundleId = Application.applicationId ?? void 0;
    context.appVersion = Application.nativeApplicationVersion ?? void 0;
    context.buildNumber = Application.nativeBuildVersion ?? void 0;
  } catch {
  }
  try {
    const Constants = (await import("expo-constants")).default;
    context.isExpoGo = Constants.appOwnership === "expo";
    context.expoSdkVersion = Constants.expoConfig?.sdkVersion ?? void 0;
    if (!context.appVersion) {
      context.appVersion = Constants.expoConfig?.version;
    }
  } catch {
  }
  try {
    const Updates = await import("expo-updates");
    if (Updates.channel) {
      context.environment = Updates.channel;
    }
  } catch {
  }
  return context;
}
function useExpoRouterTracking() {
  const client = getClient();
  const previousPathRef = useRef(null);
  useEffect(() => {
    let unsubscribe;
    const setupTracking = async () => {
      try {
        const { usePathname, useSegments } = await import("expo-router");
      } catch {
      }
    };
    setupTracking();
    return () => {
      unsubscribe?.();
    };
  }, [client]);
}
function withScreenTracking(WrappedComponent, screenName) {
  return function ScreenTrackedComponent(props) {
    const client = getClient();
    useEffect(() => {
      client.trackScreen(screenName);
    }, []);
    return React.createElement(WrappedComponent, props);
  };
}
function createNavigationTracking() {
  const client = getClient();
  let currentRouteName;
  return (state) => {
    if (!state) return;
    const getActiveRouteName = (state2) => {
      if (!state2.routes) return void 0;
      const route = state2.routes[state2.index];
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
function useNavigationTracking() {
  const client = getClient();
  const navigationRef = useRef(null);
  const routeNameRef = useRef();
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
    onStateChange
  };
}
function useUpdateTracking() {
  const client = getClient();
  useEffect(() => {
    const trackUpdates = async () => {
      try {
        const Updates = await import("expo-updates");
        if (Updates.updateId) {
          client.setTag("update.id", Updates.updateId);
        }
        if (Updates.channel) {
          client.setTag("update.channel", Updates.channel);
        }
        if (Updates.createdAt) {
          client.setTag("update.created_at", Updates.createdAt.toISOString());
        }
        Updates.addListener((event) => {
          switch (event.type) {
            case Updates.UpdateEventType.UPDATE_AVAILABLE:
              client.addBreadcrumb({
                type: "info",
                category: "expo.updates",
                message: "Update available",
                level: "info",
                data: { manifest: event.manifest }
              });
              break;
            case Updates.UpdateEventType.NO_UPDATE_AVAILABLE:
              client.addBreadcrumb({
                type: "info",
                category: "expo.updates",
                message: "No update available",
                level: "info"
              });
              break;
            case Updates.UpdateEventType.ERROR:
              client.addBreadcrumb({
                type: "error",
                category: "expo.updates",
                message: "Update error",
                level: "error",
                data: { error: event.message }
              });
              break;
          }
        });
      } catch {
      }
    };
    trackUpdates();
  }, [client]);
}
async function initExpo(config) {
  const logger = createLogger(config.debug ?? false);
  logger.info("Initializing TraceKit with Expo enhancements");
  const [deviceContext, appContext] = await Promise.all([
    getExpoDeviceContext(),
    getExpoAppContext()
  ]);
  const enhancedConfig = {
    ...config,
    serviceName: config.serviceName ?? appContext.bundleId ?? "expo-app",
    appVersion: config.appVersion ?? appContext.appVersion,
    buildNumber: config.buildNumber ?? appContext.buildNumber,
    environment: config.environment ?? appContext.environment
  };
  const client = init(enhancedConfig);
  if (config.enableNetworkTracing !== false) {
    installNetworkInterceptor(enhancedConfig);
  }
  client.setContext("device", deviceContext);
  client.setContext("app", appContext);
  if (appContext.isExpoGo) {
    client.setTag("expo.is_expo_go", "true");
  }
  if (appContext.expoSdkVersion) {
    client.setTag("expo.sdk_version", appContext.expoSdkVersion);
  }
  logger.info("TraceKit Expo initialization complete");
  return client;
}
var ExpoTracekitContext = createContext({
  client: null,
  isReady: false
});
function useExpoTracekit() {
  return useContext(ExpoTracekitContext);
}
function ExpoTracekitProvider({
  config,
  children,
  onReady,
  onError
}) {
  const [client, setClient] = useState(null);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    initExpo(config).then((c) => {
      setClient(c);
      setIsReady(true);
      onReady?.(c);
    }).catch((error) => {
      onError?.(error);
    });
  }, [config, onReady, onError]);
  return React.createElement(
    ExpoTracekitContext.Provider,
    { value: { client, isReady } },
    children
  );
}
export {
  ExpoTracekitProvider,
  createNavigationTracking,
  getExpoAppContext,
  getExpoDeviceContext,
  initExpo,
  useExpoRouterTracking,
  useExpoTracekit,
  useNavigationTracking,
  useUpdateTracking,
  withScreenTracking
};
