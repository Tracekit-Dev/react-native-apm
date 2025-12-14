# TraceKit APM for React Native

Zero-config distributed tracing and performance monitoring for React Native and Expo apps.

[![npm version](https://img.shields.io/npm/v/@tracekit/react-native.svg)](https://www.npmjs.com/package/@tracekit/react-native)
[![Downloads](https://img.shields.io/npm/dm/@tracekit/react-native.svg)](https://www.npmjs.com/package/@tracekit/react-native)
[![License](https://img.shields.io/npm/l/@tracekit/react-native.svg)](https://www.npmjs.com/package/@tracekit/react-native)

## Features

- **Zero Configuration** - Works out of the box with sensible defaults
- **Automatic Error Tracking** - Captures crashes and unhandled exceptions
- **Network Monitoring** - Auto-instruments fetch and XMLHttpRequest
- **Screen Tracking** - Track navigation and screen views
- **Code Monitoring** - Live debugging with snapshots (production-safe)
- **Performance Metrics** - Track app startup, render times, and more
- **Offline Support** - Queues events when offline, syncs when back online
- **React Hooks & Components** - Easy integration with functional components
- **Expo Support** - Enhanced integration with Expo modules
- **TypeScript First** - Full type definitions included
- **Low Overhead** - < 3% performance impact

## Installation

```bash
npm install @tracekit/react-native
# or
yarn add @tracekit/react-native
```

### Optional Dependencies

For enhanced functionality, install these optional packages:

```bash
# For persistent storage (recommended)
npm install @react-native-async-storage/async-storage

# For network state detection
npm install @react-native-community/netinfo

# For Expo apps (enhanced device/app info)
expo install expo-device expo-application expo-constants expo-battery expo-network
```

## Quick Start

### Basic Setup

```tsx
import * as Tracekit from '@tracekit/react-native';

// Initialize TraceKit
Tracekit.init({
  apiKey: 'your-api-key',
  serviceName: 'my-app',
});

// Now TraceKit automatically captures:
// - Unhandled exceptions
// - Network requests (fetch/XHR)
// - Console errors
```

### With React Provider (Recommended)

```tsx
import { TracekitProvider, TracekitErrorBoundary } from '@tracekit/react-native';

function App() {
  return (
    <TracekitProvider
      config={{
        apiKey: 'your-api-key',
        serviceName: 'my-app',
      }}
    >
      <TracekitErrorBoundary>
        <MyApp />
      </TracekitErrorBoundary>
    </TracekitProvider>
  );
}
```

### Expo Setup

```tsx
import { ExpoTracekitProvider } from '@tracekit/react-native/expo';

export default function App() {
  return (
    <ExpoTracekitProvider
      config={{
        apiKey: process.env.EXPO_PUBLIC_TRACEKIT_API_KEY!,
        serviceName: 'my-expo-app',
      }}
    >
      <MainApp />
    </ExpoTracekitProvider>
  );
}
```

Get your API key at [https://app.tracekit.dev](https://app.tracekit.dev)

## Configuration

```tsx
import * as Tracekit from '@tracekit/react-native';

Tracekit.init({
  // Required: Your TraceKit API key
  apiKey: process.env.TRACEKIT_API_KEY!,

  // Optional: Service name (default: app bundle ID)
  serviceName: 'my-service',

  // Optional: Base API URL (default: 'https://app.tracekit.dev')
  apiUrl: 'https://app.tracekit.dev',

  // Optional: TraceKit endpoint (default: 'https://app.tracekit.dev/v1/traces')
  // Note: If apiUrl is set, endpoint is automatically set to ${apiUrl}/v1/traces
  endpoint: 'https://app.tracekit.dev/v1/traces',

  // Optional: Enable/disable tracing (default: true)
  enabled: !__DEV__,

  // Optional: Sample rate 0.0-1.0 (default: 1.0 = 100%)
  sampleRate: 0.5,

  // Optional: Enable code monitoring / live debugging (default: false)
  enableCodeMonitoring: true,

  // Optional: Enable crash reporting (default: true)
  enableCrashReporting: true,

  // Optional: Enable network request tracing (default: true)
  enableNetworkTracing: true,

  // Optional: Enable navigation tracking (default: true)
  enableNavigationTracing: true,

  // Optional: Flush interval in ms (default: 30000)
  flushInterval: 30000,

  // Optional: Debug mode (default: false)
  debug: __DEV__,

  // Optional: URLs to exclude from network tracing
  excludeUrls: [
    /analytics/,
    'localhost:3000',
  ],

  // Optional: Environment name
  environment: 'production',

  // Optional: App version override
  appVersion: '1.0.0',

  // Optional: Build number override
  buildNumber: '42',
});
```

## Usage

### Capture Exceptions

```tsx
import * as Tracekit from '@tracekit/react-native';

// Capture an exception
try {
  await riskyOperation();
} catch (error) {
  Tracekit.captureException(error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
}

// Capture a message
Tracekit.captureMessage('User completed checkout', 'info', {
  orderId: order.id,
  total: order.total,
});
```

### User Context

```tsx
import * as Tracekit from '@tracekit/react-native';

// Set user on login
Tracekit.setUser({
  id: user.id,
  email: user.email,
  name: user.name,
});

// Clear on logout
Tracekit.setUser(null);
```

### Screen Tracking

```tsx
import * as Tracekit from '@tracekit/react-native';

// Manual tracking
Tracekit.trackScreen('HomeScreen', { userId: user.id });

// Or use the component
import { ScreenTracker } from '@tracekit/react-native';

function HomeScreen() {
  return (
    <ScreenTracker screenName="Home">
      <View>...</View>
    </ScreenTracker>
  );
}

// Or use the hook
import { useScreenTracking } from '@tracekit/react-native';

function ProfileScreen() {
  useScreenTracking('Profile', { userId: user.id });
  return <View>...</View>;
}
```

### React Navigation Integration

```tsx
import { useNavigationTracking } from '@tracekit/react-native/expo';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  const { navigationRef, onReady, onStateChange } = useNavigationTracking();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
    >
      <Navigator />
    </NavigationContainer>
  );
}
```

### Custom Spans

```tsx
import * as Tracekit from '@tracekit/react-native';

async function fetchUserData(userId: string) {
  const span = Tracekit.startSpan('fetchUserData', null, {
    'user.id': userId,
  });

  try {
    const user = await api.getUser(userId);
    Tracekit.endSpan(span, { 'user.found': true });
    return user;
  } catch (error) {
    Tracekit.endSpan(span, { 'user.found': false }, 'ERROR');
    throw error;
  }
}
```

### Using Hooks

```tsx
import { useSpan, useAsyncTracking } from '@tracekit/react-native';

function DataLoader() {
  // Track async operations
  const { execute, loading, error, data } = useAsyncTracking(
    'loadData',
    () => api.fetchData(),
    { autoTrack: true }
  );

  // Manual span management
  const { start, end, isActive } = useSpan('customOperation');

  const handlePress = async () => {
    start();
    try {
      await doSomething();
      end({ success: true });
    } catch (e) {
      end({ success: false }, 'ERROR');
    }
  };

  return <Button onPress={handlePress} title="Do Something" />;
}
```

### Breadcrumbs

```tsx
import * as Tracekit from '@tracekit/react-native';

// Add breadcrumbs for debugging context
Tracekit.addBreadcrumb({
  type: 'user',
  category: 'button',
  message: 'User clicked checkout',
  level: 'info',
  data: { cartItems: cart.items.length },
});

// Navigation breadcrumbs are added automatically
// Network request breadcrumbs are added automatically
```

### Tags and Context

```tsx
import * as Tracekit from '@tracekit/react-native';

// Set tags (indexed, searchable)
Tracekit.setTag('subscription.tier', 'premium');
Tracekit.setTags({
  'feature.flags': 'new_checkout',
  'experiment.group': 'B',
});

// Set context (additional structured data)
Tracekit.setContext('checkout', {
  cartId: cart.id,
  itemCount: cart.items.length,
  total: cart.total,
});

// Set extras (additional unstructured data)
Tracekit.setExtra('lastAction', 'viewedProduct');
```

### Code Monitoring (Live Debugging)

Capture snapshots of variable state at specific points:

```tsx
import * as Tracekit from '@tracekit/react-native';

async function processPayment(order: Order) {
  // Capture state before processing
  await Tracekit.captureSnapshot('payment-start', {
    orderId: order.id,
    amount: order.total,
    userId: order.userId,
  });

  const result = await paymentAPI.charge(order);

  // Capture state after processing
  await Tracekit.captureSnapshot('payment-complete', {
    orderId: order.id,
    paymentId: result.paymentId,
    success: result.success,
  });

  return result;
}
```

### Error Boundary

```tsx
import { TracekitErrorBoundary } from '@tracekit/react-native';

function App() {
  return (
    <TracekitErrorBoundary
      fallback={(error, resetError) => (
        <ErrorScreen error={error} onRetry={resetError} />
      )}
      onError={(error, errorInfo) => {
        console.log('Error caught:', error);
      }}
    >
      <MyApp />
    </TracekitErrorBoundary>
  );
}
```

### Performance Profiling

```tsx
import { PerformanceProfiler, usePerformanceTracking } from '@tracekit/react-native';

// As a component
function ExpensiveList() {
  return (
    <PerformanceProfiler id="ExpensiveList">
      <FlatList {...props} />
    </PerformanceProfiler>
  );
}

// As a hook
function MyComponent() {
  const { renderCount } = usePerformanceTracking('MyComponent');
  return <View>Rendered {renderCount} times</View>;
}
```

### Manual Flush

```tsx
import * as Tracekit from '@tracekit/react-native';
import { AppState } from 'react-native';

// Flush when app goes to background
AppState.addEventListener('change', async (state) => {
  if (state === 'background') {
    await Tracekit.flush();
  }
});

// Flush before critical operations
async function submitOrder() {
  await Tracekit.flush();
  // ... submit order
}
```

## Expo-Specific Features

### Enhanced Context

The Expo integration automatically captures:

- Device model, manufacturer, and name
- Battery level and charging state
- Network type and connectivity
- Expo SDK version and update channel
- App ownership (Expo Go vs standalone)

### Update Tracking

```tsx
import { useUpdateTracking } from '@tracekit/react-native/expo';

function App() {
  useUpdateTracking(); // Automatically tracks OTA updates
  return <MyApp />;
}
```

### Expo Router Integration

```tsx
// In app/_layout.tsx
import { useExpoRouterTracking } from '@tracekit/react-native/expo';

export default function RootLayout() {
  useExpoRouterTracking();
  return <Slot />;
}
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `init(config)` | Initialize TraceKit |
| `captureException(error, context?)` | Capture an exception |
| `captureMessage(message, level?, context?)` | Capture a message |
| `captureSnapshot(name, data)` | Capture a code snapshot |
| `startSpan(name, parent?, attributes?)` | Start a span |
| `endSpan(span, attributes?, status?)` | End a span |
| `setUser(user)` | Set user context |
| `addBreadcrumb(breadcrumb)` | Add a breadcrumb |
| `setTag(key, value)` | Set a tag |
| `setContext(name, context)` | Set a context |
| `trackScreen(name, params?)` | Track a screen view |
| `flush()` | Flush pending data |
| `close()` | Close the client |

### React Hooks

| Hook | Description |
|------|-------------|
| `useTracekit()` | Access TraceKit functions |
| `useSpan(name, options?)` | Manage a span |
| `useScreenTracking(name, params?)` | Track screen view |
| `usePerformanceTracking(name)` | Track component performance |
| `useAsyncTracking(name, fn, options?)` | Track async operations |
| `useErrorBoundary()` | Error boundary functionality |
| `useTouchTracking(name)` | Track touch interactions |
| `useUser()` | Manage user context |

### React Components

| Component | Description |
|-----------|-------------|
| `TracekitProvider` | Initialize and provide TraceKit |
| `TracekitErrorBoundary` | Catch and report errors |
| `ScreenTracker` | Track screen views |
| `UserIdentifier` | Set user context |
| `PerformanceProfiler` | Profile render performance |

## How It Works

### Data Collection & Batching

TraceKit doesn't send data immediately - it batches for efficiency:

```typescript
// Default batching behavior
{
  flushInterval: 30000,  // Auto-flush every 30 seconds
  maxBatchSize: 50,      // Or when 50 items are queued
  maxQueueSize: 1000     // Maximum offline queue size
}
```

**Flush triggers:**
- ⏱️ Timer-based: Every `flushInterval` milliseconds
- 📦 Size-based: When queue reaches `maxBatchSize`
- 📱 App lifecycle: When app goes to background
- 🔧 Manual: Calling `Tracekit.flush()`

### Storage Architecture

**TraceKit uses AsyncStorage ** for persistence:

- ✅ Stores session data, user context, breadcrumbs
- ✅ Queues events when offline, syncs when online
- ✅ Falls back to in-memory storage if AsyncStorage unavailable
- ✅ Works across iOS, Android, and Web

### Data Flow

```
User Action/Event
      ↓
SDK Captures (Span/Exception/Snapshot)
      ↓
Queued in Memory
      ↓
Batching (wait for flush trigger)
      ↓
Convert to OTLP JSON Format
      ↓
HTTP Transport → /v1/traces
      ↓
TraceKit Backend
```

### OTLP Protocol

All data is sent in OpenTelemetry Protocol (OTLP) JSON format:

- ✅ Industry-standard observability format
- ✅ Compatible with OpenTelemetry collectors
- ✅ Hex-encoded trace/span IDs (not base64)
- ✅ Nanosecond-precision timestamps

For detailed architecture documentation, see [ARCHITECTURE.md](https://github.com/tracekit-dev/react-native-apm/blob/main/examples/ARCHITECTURE.md).

## Requirements

- React Native 0.64+
- React 17+
- iOS 12+ / Android API 21+
- Expo SDK 48+ (for Expo features)

## Performance

TraceKit is designed for minimal performance impact:

- **< 3% overhead** on app startup
- **Async processing** - doesn't block UI thread
- **Batched uploads** - minimizes network requests
- **Offline queue** - handles connectivity issues
- **Configurable sampling** - reduce load in high-traffic apps

## Comparison with @tracekit/node-apm

TraceKit React Native provides **identical APIs** to the Node.js SDK:

| Feature | node-apm | react-native | Notes |
|---------|----------|--------------|-------|
| **Manual Spans** | `client.startSpan(...)` | `client.startSpan(...)` | ✅ Same API |
| **Error Tracking** | `client.captureException(...)` | `client.captureException(...)` | ✅ Same API |
| **Code Monitoring** | `client.captureSnapshot(...)` | `client.captureSnapshot(...)` | ✅ Same API |
| **Auto HTTP Tracing** | ✅ http/https/fetch | ✅ fetch/XMLHttpRequest | Different underlying modules |
| **Storage** | In-memory | AsyncStorage + fallback | Mobile needs persistence |
| **Middleware** | `app.use(middleware())` | N/A | React Native has no middleware |

**Example - node-apm:**
```javascript
app.post('/order', (req, res) => {
  client.captureSnapshot('order-processing', {
    orderId, amount: 99.99, items: ['item1', 'item2']
  });
  res.json({ orderId, status: 'processed' });
});
```

**Example - React Native (equivalent):**
```typescript
const handleOrder = async () => {
  await client?.captureSnapshot('order-processing', {
    orderId, amount: 99.99, items: ['item1', 'item2']
  });
  // ... process order
};
```

See the [example app](https://github.com/tracekit-dev/react-native-apm/tree/main/examples) for more patterns including nested spans and distributed tracing.

## Comparison with Sentry

| Feature | TraceKit | Sentry |
|---------|----------|--------|
| Pricing | Usage-based | Per-event |
| Setup | 1 line | Multiple steps |
| Code Monitoring | ✅ Built-in | ❌ Limited |
| Mobile-first | ✅ | Web-first |
| OpenTelemetry | ✅ Native | Partial |
| Bundle size | ~50KB | ~200KB |

## Troubleshooting

### Events not appearing

1. Check your API key is correct
2. Ensure `enabled: true` in config
3. Check network connectivity
4. Enable debug mode: `debug: true`
5. Verify endpoint is reachable

### Network requests not tracked

1. Ensure `enableNetworkTracing: true`
2. Check URL isn't in `excludeUrls`
3. Verify TraceKit is initialized before first request

### High memory usage

1. Reduce `maxQueueSize`
2. Lower `flushInterval`
3. Reduce `maxBatchSize`

## Support

- Documentation: [https://app.tracekit.dev/docs](https://app.tracekit.dev/docs)
- Issues: [https://github.com/Tracekit-Dev/react-native-apm/issues](https://github.com/Tracekit-Dev/react-native-apm/issues)
- Email: [support@tracekit.dev](mailto:support@tracekit.dev)

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built with ❤️ by the TraceKit team.
