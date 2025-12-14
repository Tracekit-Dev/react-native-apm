/**
 * TraceKit React Native SDK - Network Interceptor
 * @package @tracekit/react-native
 */

import type { TracekitConfig, NetworkRequest } from './types';
import { getClient } from './client';
import {
  generateEventId,
  now,
  nowMs,
  shouldExcludeUrl,
  sanitizeHeaders,
  createLogger,
  type Logger,
} from './utils';

// ============================================================================
// Network Interceptor
// ============================================================================

export class NetworkInterceptor {
  private config: TracekitConfig;
  private logger: Logger;
  private originalFetch: typeof fetch | null = null;
  private originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
  private installed = false;

  constructor(config: TracekitConfig) {
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
  }

  install(): void {
    if (this.installed) {
      this.logger.warn('Network interceptor already installed');
      return;
    }

    this.logger.debug('Installing network interceptor');

    this.interceptFetch();
    this.interceptXHR();

    this.installed = true;
    this.logger.debug('Network interceptor installed');
  }

  uninstall(): void {
    if (!this.installed) {
      return;
    }

    this.logger.debug('Uninstalling network interceptor');

    // Restore original fetch
    if (this.originalFetch) {
      (global as any).fetch = this.originalFetch;
      this.originalFetch = null;
    }

    // Restore original XHR
    if (this.originalXhrOpen) {
      XMLHttpRequest.prototype.open = this.originalXhrOpen;
      this.originalXhrOpen = null;
    }

    if (this.originalXhrSend) {
      XMLHttpRequest.prototype.send = this.originalXhrSend;
      this.originalXhrSend = null;
    }

    this.installed = false;
    this.logger.debug('Network interceptor uninstalled');
  }

  // ============================================================================
  // Fetch Interceptor
  // ============================================================================

  private interceptFetch(): void {
    if (typeof fetch === 'undefined') {
      this.logger.debug('fetch not available, skipping');
      return;
    }

    // @ts-ignore - Check if already intercepted
    if ((global as any).__tracekitFetchIntercepted) {
      this.logger.debug('fetch already intercepted, skipping');
      // @ts-ignore - Get the original fetch from global
      this.originalFetch = (global as any).__tracekitOriginalFetch;
      return;
    }

    // @ts-ignore - window is available in web environment
    const context = typeof window !== 'undefined' ? window : global;
    this.originalFetch = fetch.bind(context);

    // Store original fetch globally so it persists across hot reloads
    // @ts-ignore
    (global as any).__tracekitOriginalFetch = this.originalFetch;
    // @ts-ignore
    (global as any).__tracekitFetchIntercepted = true;

    const self = this;

    (global as any).fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
      const method = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET') ?? 'GET';

      // Check if should be excluded
      if (shouldExcludeUrl(url, self.config.excludeUrls ?? [])) {
        return self.originalFetch!(input, init);
      }

      // Skip TraceKit's own requests
      if (url.includes('tracekit.dev')) {
        return self.originalFetch!(input, init);
      }

      const requestId = generateEventId();
      const startTime = now();
      const startMs = nowMs();

      // Track request headers
      const requestHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value: string, key: string) => {
            requestHeaders[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          (init.headers as string[][]).forEach(([key, value]) => {
            requestHeaders[key] = value;
          });
        } else {
          Object.assign(requestHeaders, init.headers);
        }
      }

      // Calculate request body size
      let requestBodySize: number | undefined;
      if (init?.body) {
        if (typeof init.body === 'string') {
          requestBodySize = init.body.length;
        } else if (init.body instanceof ArrayBuffer) {
          requestBodySize = init.body.byteLength;
        }
      }

      try {
        const response = await self.originalFetch!(input, init);
        const endTime = now();
        const duration = nowMs() - startMs;

        // Get response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value: string, key: string) => {
          responseHeaders[key] = value;
        });

        // Get response body size from Content-Length header
        const contentLength = response.headers.get('content-length');
        const responseBodySize = contentLength ? parseInt(contentLength, 10) : undefined;

        // Track the request
        const networkRequest: Omit<NetworkRequest, 'requestId'> = {
          method: method.toUpperCase(),
          url,
          requestHeaders: sanitizeHeaders(requestHeaders),
          requestBodySize,
          statusCode: response.status,
          responseHeaders: sanitizeHeaders(responseHeaders),
          responseBodySize,
          startTime,
          endTime,
          duration,
        };

        getClient().trackNetworkRequest(networkRequest);

        return response;
      } catch (error) {
        const endTime = now();
        const duration = nowMs() - startMs;

        // Track failed request
        const networkRequest: Omit<NetworkRequest, 'requestId'> = {
          method: method.toUpperCase(),
          url,
          requestHeaders: sanitizeHeaders(requestHeaders),
          requestBodySize,
          startTime,
          endTime,
          duration,
          error: error instanceof Error ? error.message : String(error),
        };

        getClient().trackNetworkRequest(networkRequest);

        throw error;
      }
    };
  }

  // ============================================================================
  // XHR Interceptor
  // ============================================================================

  private interceptXHR(): void {
    if (typeof XMLHttpRequest === 'undefined') {
      this.logger.debug('XMLHttpRequest not available, skipping');
      return;
    }

    const self = this;

    // Store original methods
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;

    // Intercept open
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      // Store request info on the XHR object
      (this as any).__tracekit = {
        method,
        url: String(url),
        startTime: null,
        requestHeaders: {},
      };

      return self.originalXhrOpen!.call(this, method, String(url), async, username, password);
    };

    // Intercept setRequestHeader
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
      if ((this as any).__tracekit) {
        (this as any).__tracekit.requestHeaders[name] = value;
      }
      return originalSetRequestHeader.call(this, name, value);
    };

    // Intercept send
    XMLHttpRequest.prototype.send = function (body?: Document | string | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array> | null) {
      const traceData = (this as any).__tracekit;

      if (!traceData) {
        return self.originalXhrSend!.call(this, body);
      }

      const url = traceData.url;

      // Check if should be excluded
      if (shouldExcludeUrl(url, self.config.excludeUrls ?? [])) {
        return self.originalXhrSend!.call(this, body);
      }

      // Skip TraceKit's own requests
      if (url.includes('tracekit.dev')) {
        return self.originalXhrSend!.call(this, body);
      }

      traceData.startTime = now();
      const startMs = nowMs();

      // Calculate request body size
      let requestBodySize: number | undefined;
      if (body) {
        if (typeof body === 'string') {
          requestBodySize = body.length;
        } else if (body instanceof ArrayBuffer) {
          requestBodySize = body.byteLength;
        }
      }

      // Add event listeners
      this.addEventListener('load', function () {
        const endTime = now();
        const duration = nowMs() - startMs;

        // Get response headers
        const responseHeadersStr = this.getAllResponseHeaders();
        const responseHeaders: Record<string, string> = {};
        if (responseHeadersStr) {
          responseHeadersStr.split('\r\n').forEach((line) => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }

        const networkRequest: Omit<NetworkRequest, 'requestId'> = {
          method: traceData.method.toUpperCase(),
          url: traceData.url,
          requestHeaders: sanitizeHeaders(traceData.requestHeaders),
          requestBodySize,
          statusCode: this.status,
          responseHeaders: sanitizeHeaders(responseHeaders),
          responseBodySize: this.responseText?.length,
          startTime: traceData.startTime,
          endTime,
          duration,
        };

        getClient().trackNetworkRequest(networkRequest);
      });

      this.addEventListener('error', function () {
        const endTime = now();
        const duration = nowMs() - startMs;

        const networkRequest: Omit<NetworkRequest, 'requestId'> = {
          method: traceData.method.toUpperCase(),
          url: traceData.url,
          requestHeaders: sanitizeHeaders(traceData.requestHeaders),
          requestBodySize,
          startTime: traceData.startTime,
          endTime,
          duration,
          error: 'Network request failed',
        };

        getClient().trackNetworkRequest(networkRequest);
      });

      this.addEventListener('timeout', function () {
        const endTime = now();
        const duration = nowMs() - startMs;

        const networkRequest: Omit<NetworkRequest, 'requestId'> = {
          method: traceData.method.toUpperCase(),
          url: traceData.url,
          requestHeaders: sanitizeHeaders(traceData.requestHeaders),
          requestBodySize,
          startTime: traceData.startTime,
          endTime,
          duration,
          error: 'Request timed out',
        };

        getClient().trackNetworkRequest(networkRequest);
      });

      return self.originalXhrSend!.call(this, body);
    };
  }
}

// ============================================================================
// Singleton
// ============================================================================

let networkInterceptor: NetworkInterceptor | null = null;

export function installNetworkInterceptor(config: TracekitConfig): void {
  if (networkInterceptor) {
    return;
  }

  networkInterceptor = new NetworkInterceptor(config);
  networkInterceptor.install();
}

export function uninstallNetworkInterceptor(): void {
  if (networkInterceptor) {
    networkInterceptor.uninstall();
    networkInterceptor = null;
  }
}
