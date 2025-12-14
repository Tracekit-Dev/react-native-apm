"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/expo/index.ts
var expo_exports = {};
__export(expo_exports, {
  ExpoTracekitProvider: () => ExpoTracekitProvider,
  createNavigationTracking: () => createNavigationTracking,
  getExpoAppContext: () => getExpoAppContext,
  getExpoDeviceContext: () => getExpoDeviceContext,
  initExpo: () => initExpo,
  useExpoRouterTracking: () => useExpoRouterTracking,
  useExpoTracekit: () => useExpoTracekit,
  useNavigationTracking: () => useNavigationTracking,
  useUpdateTracking: () => useUpdateTracking,
  withScreenTracking: () => withScreenTracking
});
module.exports = __toCommonJS(expo_exports);
var import_react = __toESM(require("react"));

// src/client.ts
var import_react_native3 = require("react-native");

// src/utils.ts
var import_react_native = require("react-native");
function randomHex(length) {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
function generateTraceId() {
  return randomHex(32);
}
function generateSpanId() {
  return randomHex(16);
}
function generateEventId() {
  return randomHex(32);
}
function generateSessionId() {
  return `${Date.now()}-${randomHex(8)}`;
}
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function nowMs() {
  return Date.now();
}
function calculateDuration(startTime, endTime) {
  return new Date(endTime).getTime() - new Date(startTime).getTime();
}
function parseStackTrace(stack) {
  if (!stack) return [];
  const frames = [];
  const lines = stack.split("\n");
  for (const line of lines) {
    const frame = parseStackFrame(line);
    if (frame) {
      frames.push(frame);
    }
  }
  return frames;
}
function parseStackFrame(line) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("at ")) {
    const rnMatch = trimmed.match(/^(.+)@(.+):(\d+):(\d+)$/);
    if (rnMatch) {
      return {
        function: rnMatch[1] || "<anonymous>",
        filename: rnMatch[2],
        lineno: parseInt(rnMatch[3], 10),
        colno: parseInt(rnMatch[4], 10),
        inApp: isInAppFrame(rnMatch[2])
      };
    }
    return null;
  }
  const v8Match = trimmed.match(/^at\s+(?:(.+?)\s+\()?(.+):(\d+):(\d+)\)?$/);
  if (v8Match) {
    return {
      function: v8Match[1] || "<anonymous>",
      filename: v8Match[2],
      lineno: parseInt(v8Match[3], 10),
      colno: parseInt(v8Match[4], 10),
      inApp: isInAppFrame(v8Match[2])
    };
  }
  const simpleMatch = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
  if (simpleMatch) {
    return {
      function: "<anonymous>",
      filename: simpleMatch[1],
      lineno: parseInt(simpleMatch[2], 10),
      colno: parseInt(simpleMatch[3], 10),
      inApp: isInAppFrame(simpleMatch[1])
    };
  }
  return null;
}
function isInAppFrame(filename) {
  if (!filename) return false;
  if (filename.includes("node_modules")) return false;
  if (filename.includes("ReactNative")) return false;
  if (filename.includes("react-native")) return false;
  if (filename.includes("expo-modules")) return false;
  if (filename.includes("metro")) return false;
  if (filename.includes("hermes")) return false;
  return true;
}
function getBasicDeviceContext() {
  const { width, height, scale } = import_react_native.Dimensions.get("window");
  return {
    platform: import_react_native.Platform.OS,
    osVersion: import_react_native.Platform.Version?.toString(),
    screen: {
      width,
      height,
      scale
    }
  };
}
function getBasicAppContext() {
  return {
    reactNativeVersion: import_react_native.Platform.constants?.reactNativeVersion ? `${import_react_native.Platform.constants.reactNativeVersion.major}.${import_react_native.Platform.constants.reactNativeVersion.minor}.${import_react_native.Platform.constants.reactNativeVersion.patch}` : void 0
  };
}
function shouldExcludeUrl(url, excludePatterns) {
  for (const pattern of excludePatterns) {
    if (typeof pattern === "string") {
      if (url.includes(pattern)) return true;
    } else {
      if (pattern.test(url)) return true;
    }
  }
  return false;
}
function sanitizeHeaders(headers) {
  const sensitiveKeys = [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "x-access-token",
    "api-key",
    "apikey",
    "password",
    "secret",
    "token"
  ];
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
      sanitized[key] = "[Filtered]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
function shouldSample(sampleRate) {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}
function createLogger(debug) {
  const prefix = "[TraceKit]";
  if (!debug) {
    return {
      debug: () => {
      },
      info: () => {
      },
      warn: (...args) => console.warn(prefix, ...args),
      error: (...args) => console.error(prefix, ...args)
    };
  }
  return {
    debug: (...args) => console.debug(prefix, ...args),
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args)
  };
}

// src/transport.ts
var HttpTransport = class {
  constructor(config) {
    this.queue = [];
    this.flushTimer = null;
    this.isFlushing = false;
    this.closed = false;
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
    this.startFlushTimer();
  }
  get endpoint() {
    const baseUrl = this.config.apiUrl ?? "https://app.tracekit.dev";
    return `${baseUrl}/v1/traces`;
  }
  get headers() {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-SDK": "@tracekit/react-native",
      "X-SDK-Version": "1.0.0",
      ...this.config.customHeaders
    };
  }
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    const interval = this.config.flushInterval ?? 3e4;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.logger.error("Auto-flush failed:", err);
      });
    }, interval);
  }
  async send(payload) {
    if (this.closed) {
      this.logger.warn("Transport is closed, cannot send");
      return false;
    }
    if (!this.config.enabled) {
      return true;
    }
    this.queue.push(payload);
    const maxBatchSize = this.config.maxBatchSize ?? 50;
    if (this.queue.length >= maxBatchSize) {
      await this.flush();
    }
    return true;
  }
  async sendBatch(payloads) {
    if (this.closed) {
      this.logger.warn("Transport is closed, cannot send batch");
      return false;
    }
    if (!this.config.enabled) {
      return true;
    }
    this.queue.push(...payloads);
    const maxBatchSize = this.config.maxBatchSize ?? 50;
    if (this.queue.length >= maxBatchSize) {
      await this.flush();
    }
    return true;
  }
  async flush() {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }
    this.isFlushing = true;
    try {
      const maxBatchSize = this.config.maxBatchSize ?? 50;
      const batch = this.queue.splice(0, maxBatchSize);
      if (batch.length === 0) {
        return;
      }
      this.logger.debug(`Flushing ${batch.length} items to TraceKit`);
      const traces = [];
      for (const item of batch) {
        if ("spans" in item) {
          traces.push(item);
        } else if ("exception" in item) {
          const exceptionPayload = item;
          const errorSpan = this.convertExceptionToSpan(exceptionPayload);
          traces.push({
            ...exceptionPayload,
            spans: [errorSpan]
          });
        } else if ("snapshot" in item) {
          const snapshotPayload = item;
          traces.push({
            ...snapshotPayload,
            spans: []
          });
        }
      }
      if (traces.length > 0) {
        await this.sendToEndpoint(traces);
      }
      this.logger.debug("Flush complete");
    } catch (error) {
      this.logger.error("Flush failed:", error);
    } finally {
      this.isFlushing = false;
    }
  }
  async sendToEndpoint(traces) {
    const url = this.endpoint;
    const headers = this.headers;
    const otlpPayload = this.convertToOTLPFormat(traces);
    try {
      this.logger.debug(`Sending ${traces.length} traces to ${url}`);
      this.logger.debug("Headers:", headers);
      this.logger.debug("OTLP Payload:", JSON.stringify(otlpPayload, null, 2));
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(otlpPayload),
        mode: "cors",
        credentials: "omit"
      });
      this.logger.debug(`Response status: ${response.status}`);
      this.logger.debug(`Response ok: ${response.ok}`);
      if (!response.ok) {
        const text = await response.text().catch(() => "Unknown error");
        this.logger.error(`TraceKit API error (${response.status}):`, text);
      } else {
        const responseText = await response.text();
        this.logger.debug("Traces sent successfully. Response:", responseText);
      }
    } catch (error) {
      this.logger.error(`Network error sending to /v1/traces:`, error);
      this.logger.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0,
        url,
        headers
      });
      throw error;
    }
  }
  /**
   * Convert an exception payload to a span with exception event
   * According to OTLP spec, exceptions are represented as span events
   */
  convertExceptionToSpan(exceptionPayload) {
    const now2 = (/* @__PURE__ */ new Date()).toISOString();
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const exceptionEvent = {
      name: "exception",
      timestamp: exceptionPayload.timestamp,
      attributes: {
        "exception.type": exceptionPayload.exception.type,
        "exception.message": exceptionPayload.exception.message,
        "exception.stacktrace": exceptionPayload.exception.stackTrace ? exceptionPayload.exception.stackTrace.map(
          (f) => `${f.function || "anonymous"} at ${f.filename}:${f.lineno || 0}`
        ).join("\n") : "",
        "exception.handled": exceptionPayload.exception.handled
      }
    };
    if (exceptionPayload.exception.componentStack) {
      if (!exceptionEvent.attributes) {
        exceptionEvent.attributes = {};
      }
      exceptionEvent.attributes["exception.component_stack"] = exceptionPayload.exception.componentStack;
    }
    if (exceptionPayload.exception.mechanism) {
      if (!exceptionEvent.attributes) {
        exceptionEvent.attributes = {};
      }
      exceptionEvent.attributes["exception.mechanism"] = JSON.stringify(exceptionPayload.exception.mechanism);
    }
    const errorSpan = {
      spanId,
      traceId,
      name: `Exception: ${exceptionPayload.exception.type}`,
      kind: "INTERNAL",
      startTime: exceptionPayload.timestamp,
      endTime: exceptionPayload.timestamp,
      // Exception is instantaneous
      duration: 0,
      status: "ERROR",
      attributes: {
        "error": true,
        "error.type": exceptionPayload.exception.type,
        "error.message": exceptionPayload.exception.message,
        "otel.status_code": "ERROR",
        "otel.status_description": exceptionPayload.exception.message,
        // Add context attributes
        ...exceptionPayload.exception.context
      },
      events: [exceptionEvent],
      links: []
    };
    return errorSpan;
  }
  generateTraceId() {
    return Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
  generateSpanId() {
    return Array.from(
      { length: 16 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
  convertToOTLPFormat(traces) {
    const resourceSpans = [];
    for (const trace of traces) {
      const otlpSpans = trace.spans.map((span) => ({
        traceId: span.traceId,
        // OTLP JSON uses hex strings, not base64
        spanId: span.spanId,
        // OTLP JSON uses hex strings, not base64
        parentSpanId: span.parentSpanId,
        name: span.name,
        kind: this.mapSpanKind(span.kind),
        startTimeUnixNano: this.isoToNano(span.startTime),
        endTimeUnixNano: span.endTime ? this.isoToNano(span.endTime) : void 0,
        attributes: this.convertAttributes(span.attributes),
        status: {
          code: span.status === "OK" ? 1 : span.status === "ERROR" ? 2 : 0
        },
        events: span.events.map((event) => ({
          name: event.name,
          timeUnixNano: this.isoToNano(event.timestamp),
          attributes: event.attributes ? this.convertAttributes(event.attributes) : []
        })),
        links: span.links.map((link) => ({
          traceId: link.traceId,
          // OTLP JSON uses hex strings
          spanId: link.spanId,
          // OTLP JSON uses hex strings
          attributes: link.attributes ? this.convertAttributes(link.attributes) : []
        }))
      }));
      resourceSpans.push({
        resource: {
          attributes: this.convertResourceAttributes(trace.resource)
        },
        scopeSpans: [{
          spans: otlpSpans
        }]
      });
    }
    return { resourceSpans };
  }
  hexToBase64(hex) {
    const cleanHex = hex.replace(/-/g, "").toLowerCase();
    if (cleanHex.length !== 32 && cleanHex.length !== 16) {
      this.logger.error(`Invalid hex length: ${cleanHex.length}, expected 32 or 16. Hex: ${cleanHex}`);
    }
    const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const bytes = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substring(i, i + 2), 16));
    }
    let base64 = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const byte1 = bytes[i];
      const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      const encoded1 = byte1 >> 2;
      const encoded2 = (byte1 & 3) << 4 | byte2 >> 4;
      const encoded3 = (byte2 & 15) << 2 | byte3 >> 6;
      const encoded4 = byte3 & 63;
      base64 += base64Chars.charAt(encoded1);
      base64 += base64Chars.charAt(encoded2);
      base64 += i + 1 < bytes.length ? base64Chars.charAt(encoded3) : "=";
      base64 += i + 2 < bytes.length ? base64Chars.charAt(encoded4) : "=";
    }
    return base64;
  }
  isoToNano(isoString) {
    const date = new Date(isoString);
    const nanos = date.getTime() * 1e6;
    return nanos.toString();
  }
  mapSpanKind(kind) {
    const kindMap = {
      "INTERNAL": 1,
      "SERVER": 2,
      "CLIENT": 3,
      "PRODUCER": 4,
      "CONSUMER": 5
    };
    return kindMap[kind] || 0;
  }
  convertAttributes(attrs) {
    return Object.entries(attrs).map(([key, value]) => ({
      key,
      value: this.convertAttributeValue(value)
    }));
  }
  convertAttributeValue(value) {
    if (typeof value === "string") {
      return { stringValue: value };
    } else if (typeof value === "number") {
      if (Number.isInteger(value)) {
        return { intValue: value.toString() };
      }
      return { doubleValue: value };
    } else if (typeof value === "boolean") {
      return { boolValue: value };
    } else if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map((v) => this.convertAttributeValue(v))
        }
      };
    }
    return { stringValue: String(value) };
  }
  convertResourceAttributes(resource) {
    return Object.entries(resource).map(([key, value]) => ({
      key,
      value: this.convertAttributeValue(value)
    }));
  }
  async close() {
    this.closed = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
};
var OfflineAwareTransport = class {
  constructor(config) {
    this.isOnline = true;
    this.offlineQueue = [];
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
    this.httpTransport = new HttpTransport(config);
    this.maxOfflineQueue = config.maxQueueSize ?? 1e3;
    this.setupNetworkListener();
  }
  setupNetworkListener() {
    try {
      const NetInfo = require("@react-native-community/netinfo").default;
      NetInfo.addEventListener((state) => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? true;
        if (wasOffline && this.isOnline) {
          this.logger.debug("Network restored, flushing offline queue");
          this.flushOfflineQueue();
        }
      });
    } catch {
      this.logger.debug("NetInfo not available, assuming online");
      this.isOnline = true;
    }
  }
  async flushOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    this.logger.debug(`Flushing ${this.offlineQueue.length} offline items`);
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    for (const item of queue) {
      await this.httpTransport.send(item);
    }
  }
  async send(payload) {
    if (!this.isOnline) {
      if (this.offlineQueue.length < this.maxOfflineQueue) {
        this.offlineQueue.push(payload);
        this.logger.debug("Queued item for offline sending");
      } else {
        this.logger.warn("Offline queue full, dropping item");
      }
      return true;
    }
    return this.httpTransport.send(payload);
  }
  async sendBatch(payloads) {
    if (!this.isOnline) {
      for (const payload of payloads) {
        if (this.offlineQueue.length < this.maxOfflineQueue) {
          this.offlineQueue.push(payload);
        } else {
          this.logger.warn("Offline queue full, dropping items");
          break;
        }
      }
      return true;
    }
    return this.httpTransport.sendBatch(payloads);
  }
  async flush() {
    if (this.isOnline) {
      await this.flushOfflineQueue();
    }
    await this.httpTransport.flush();
  }
  async close() {
    await this.httpTransport.close();
  }
};
function createTransport(config) {
  return new OfflineAwareTransport(config);
}

// src/storage.ts
var import_react_native2 = require("react-native");
var STORAGE_PREFIX = "@tracekit:";
var StorageKeys = {
  SESSION_ID: `${STORAGE_PREFIX}session_id`,
  DEVICE_ID: `${STORAGE_PREFIX}device_id`,
  USER: `${STORAGE_PREFIX}user`,
  PENDING_SPANS: `${STORAGE_PREFIX}pending_spans`,
  PENDING_EXCEPTIONS: `${STORAGE_PREFIX}pending_exceptions`,
  PENDING_SNAPSHOTS: `${STORAGE_PREFIX}pending_snapshots`,
  BREADCRUMBS: `${STORAGE_PREFIX}breadcrumbs`,
  TAGS: `${STORAGE_PREFIX}tags`,
  CONTEXTS: `${STORAGE_PREFIX}contexts`,
  EXTRAS: `${STORAGE_PREFIX}extras`,
  LAST_FLUSH: `${STORAGE_PREFIX}last_flush`,
  APP_START_TIME: `${STORAGE_PREFIX}app_start_time`
};
var InMemoryStorage = class {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  async getItem(key) {
    return this.store.get(key) ?? null;
  }
  async setItem(key, value) {
    this.store.set(key, value);
  }
  async removeItem(key) {
    this.store.delete(key);
  }
  async getAllKeys() {
    return Array.from(this.store.keys());
  }
  async multiGet(keys) {
    return keys.map((key) => [key, this.store.get(key) ?? null]);
  }
  async multiSet(keyValuePairs) {
    for (const [key, value] of keyValuePairs) {
      this.store.set(key, value);
    }
  }
  async multiRemove(keys) {
    for (const key of keys) {
      this.store.delete(key);
    }
  }
  async clear() {
    this.store.clear();
  }
};
var AsyncStorageWrapper = class {
  constructor() {
    this.asyncStorage = null;
    this.fallback = new InMemoryStorage();
    this.initialized = false;
  }
  async init() {
    if (this.initialized) return;
    try {
      const module2 = await import("@react-native-async-storage/async-storage");
      this.asyncStorage = module2.default;
      this.initialized = true;
    } catch {
      console.warn(
        "[TraceKit] @react-native-async-storage/async-storage not found, using in-memory storage"
      );
      this.initialized = true;
    }
  }
  async getItem(key) {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.getItem(key);
    }
    return this.fallback.getItem(key);
  }
  async setItem(key, value) {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.setItem(key, value);
    }
    return this.fallback.setItem(key, value);
  }
  async removeItem(key) {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.removeItem(key);
    }
    return this.fallback.removeItem(key);
  }
  async getAllKeys() {
    await this.init();
    if (this.asyncStorage) {
      const keys = await this.asyncStorage.getAllKeys();
      return keys.filter((key) => key.startsWith(STORAGE_PREFIX));
    }
    return this.fallback.getAllKeys();
  }
  async multiGet(keys) {
    await this.init();
    if (this.asyncStorage) {
      const result = await this.asyncStorage.multiGet(keys);
      return result;
    }
    return this.fallback.multiGet(keys);
  }
  async multiSet(keyValuePairs) {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.multiSet(keyValuePairs);
    }
    return this.fallback.multiSet(keyValuePairs);
  }
  async multiRemove(keys) {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.multiRemove(keys);
    }
    return this.fallback.multiRemove(keys);
  }
  async clear() {
    await this.init();
    const keys = await this.getAllKeys();
    await this.multiRemove(keys);
  }
};
var StorageManager = class {
  constructor(storage, maxPendingItems = 1e3) {
    this.storage = storage ?? new AsyncStorageWrapper();
    this.maxPendingItems = maxPendingItems;
  }
  // Session Management
  async getSessionId() {
    return this.storage.getItem(StorageKeys.SESSION_ID);
  }
  async setSessionId(sessionId) {
    await this.storage.setItem(StorageKeys.SESSION_ID, sessionId);
  }
  // Device ID Management
  async getDeviceId() {
    return this.storage.getItem(StorageKeys.DEVICE_ID);
  }
  async setDeviceId(deviceId) {
    await this.storage.setItem(StorageKeys.DEVICE_ID, deviceId);
  }
  async getOrCreateDeviceId() {
    let deviceId = await this.getDeviceId();
    if (!deviceId) {
      deviceId = `${import_react_native2.Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await this.setDeviceId(deviceId);
    }
    return deviceId;
  }
  // User Management
  async getUser() {
    const data = await this.storage.getItem(StorageKeys.USER);
    return data ? JSON.parse(data) : null;
  }
  async setUser(user) {
    if (user) {
      await this.storage.setItem(StorageKeys.USER, JSON.stringify(user));
    } else {
      await this.storage.removeItem(StorageKeys.USER);
    }
  }
  // Pending Data Management
  async getPendingSpans() {
    const data = await this.storage.getItem(StorageKeys.PENDING_SPANS);
    return data ? JSON.parse(data) : [];
  }
  async addPendingSpan(span) {
    const spans = await this.getPendingSpans();
    spans.push(span);
    while (spans.length > this.maxPendingItems) {
      spans.shift();
    }
    await this.storage.setItem(StorageKeys.PENDING_SPANS, JSON.stringify(spans));
  }
  async addPendingSpans(newSpans) {
    const spans = await this.getPendingSpans();
    spans.push(...newSpans);
    while (spans.length > this.maxPendingItems) {
      spans.shift();
    }
    await this.storage.setItem(StorageKeys.PENDING_SPANS, JSON.stringify(spans));
  }
  async clearPendingSpans() {
    await this.storage.removeItem(StorageKeys.PENDING_SPANS);
  }
  async getPendingExceptions() {
    const data = await this.storage.getItem(StorageKeys.PENDING_EXCEPTIONS);
    return data ? JSON.parse(data) : [];
  }
  async addPendingException(exception) {
    const exceptions = await this.getPendingExceptions();
    exceptions.push(exception);
    while (exceptions.length > this.maxPendingItems) {
      exceptions.shift();
    }
    await this.storage.setItem(
      StorageKeys.PENDING_EXCEPTIONS,
      JSON.stringify(exceptions)
    );
  }
  async clearPendingExceptions() {
    await this.storage.removeItem(StorageKeys.PENDING_EXCEPTIONS);
  }
  async getPendingSnapshots() {
    const data = await this.storage.getItem(StorageKeys.PENDING_SNAPSHOTS);
    return data ? JSON.parse(data) : [];
  }
  async addPendingSnapshot(snapshot) {
    const snapshots = await this.getPendingSnapshots();
    snapshots.push(snapshot);
    while (snapshots.length > this.maxPendingItems) {
      snapshots.shift();
    }
    await this.storage.setItem(
      StorageKeys.PENDING_SNAPSHOTS,
      JSON.stringify(snapshots)
    );
  }
  async clearPendingSnapshots() {
    await this.storage.removeItem(StorageKeys.PENDING_SNAPSHOTS);
  }
  // Breadcrumbs
  async getBreadcrumbs() {
    const data = await this.storage.getItem(StorageKeys.BREADCRUMBS);
    return data ? JSON.parse(data) : [];
  }
  async addBreadcrumb(breadcrumb, maxBreadcrumbs = 100) {
    const breadcrumbs = await this.getBreadcrumbs();
    breadcrumbs.push(breadcrumb);
    while (breadcrumbs.length > maxBreadcrumbs) {
      breadcrumbs.shift();
    }
    await this.storage.setItem(
      StorageKeys.BREADCRUMBS,
      JSON.stringify(breadcrumbs)
    );
  }
  async clearBreadcrumbs() {
    await this.storage.removeItem(StorageKeys.BREADCRUMBS);
  }
  // Tags
  async getTags() {
    const data = await this.storage.getItem(StorageKeys.TAGS);
    return data ? JSON.parse(data) : {};
  }
  async setTags(tags) {
    await this.storage.setItem(StorageKeys.TAGS, JSON.stringify(tags));
  }
  // Contexts
  async getContexts() {
    const data = await this.storage.getItem(StorageKeys.CONTEXTS);
    return data ? JSON.parse(data) : {};
  }
  async setContexts(contexts) {
    await this.storage.setItem(StorageKeys.CONTEXTS, JSON.stringify(contexts));
  }
  // Extras
  async getExtras() {
    const data = await this.storage.getItem(StorageKeys.EXTRAS);
    return data ? JSON.parse(data) : {};
  }
  async setExtras(extras) {
    await this.storage.setItem(StorageKeys.EXTRAS, JSON.stringify(extras));
  }
  // Flush tracking
  async getLastFlushTime() {
    const data = await this.storage.getItem(StorageKeys.LAST_FLUSH);
    return data ? parseInt(data, 10) : null;
  }
  async setLastFlushTime(timestamp) {
    await this.storage.setItem(StorageKeys.LAST_FLUSH, timestamp.toString());
  }
  // App start tracking
  async getAppStartTime() {
    const data = await this.storage.getItem(StorageKeys.APP_START_TIME);
    return data ? parseInt(data, 10) : null;
  }
  async setAppStartTime(timestamp) {
    await this.storage.setItem(StorageKeys.APP_START_TIME, timestamp.toString());
  }
  // Clear all TraceKit data
  async clearAll() {
    await this.storage.clear();
  }
};
var storageManager = null;
function getStorageManager() {
  if (!storageManager) {
    storageManager = new StorageManager();
  }
  return storageManager;
}

// src/snapshot-client.ts
var SnapshotClient = class {
  constructor(config) {
    this.breakpointsCache = /* @__PURE__ */ new Map();
    this.registrationCache = /* @__PURE__ */ new Set();
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
    this.baseURL = config.apiUrl ?? "https://app.tracekit.dev";
  }
  // ============================================================================
  // Lifecycle
  // ============================================================================
  /**
   * Start background polling for active breakpoints
   */
  start() {
    if (!this.config.enableCodeMonitoring) {
      return;
    }
    this.logger.info(
      `\u{1F4F8} TraceKit Snapshot Client started for service: ${this.getServiceName()}`
    );
    this.fetchActiveBreakpoints();
    this.pollInterval = setInterval(() => {
      this.fetchActiveBreakpoints();
    }, 3e4);
  }
  /**
   * Stop background polling
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = void 0;
    }
    this.logger.info("\u{1F4F8} TraceKit Snapshot Client stopped");
  }
  // ============================================================================
  // Public API
  // ============================================================================
  /**
   * Automatic capture with runtime detection
   *
   * This method:
   * 1. Auto-detects caller location from stack trace
   * 2. Auto-registers breakpoint on first call
   * 3. Checks if breakpoint is active
   * 4. Captures and sends snapshot if enabled
   */
  async checkAndCapture(label, variables = {}) {
    if (!this.config.enableCodeMonitoring) {
      return;
    }
    const stack = new Error().stack || "";
    const caller = this.parseStackTrace(stack);
    if (!caller) {
      this.logger.warn("\u26A0\uFE0F  Could not detect caller location for snapshot");
      return;
    }
    const { file, line, functionName } = caller;
    const locationKey = `${functionName}:${label}`;
    if (!this.registrationCache.has(locationKey)) {
      const breakpoint2 = await this.autoRegisterBreakpoint({
        file_path: file,
        line_number: line,
        function_name: functionName,
        label
      });
      if (breakpoint2) {
        this.registrationCache.add(locationKey);
        this.breakpointsCache.set(locationKey, breakpoint2);
        this.logger.debug(`\u{1F4F8} Auto-registered breakpoint: ${locationKey}`);
      } else {
        this.logger.warn(`\u26A0\uFE0F  Failed to register breakpoint: ${locationKey}`);
        return;
      }
    }
    const breakpoint = this.breakpointsCache.get(locationKey);
    if (!breakpoint || !breakpoint.enabled) {
      this.logger.debug(`Breakpoint not active: ${locationKey}`);
      return;
    }
    if (breakpoint.expire_at && /* @__PURE__ */ new Date() > breakpoint.expire_at) {
      this.logger.debug(`Breakpoint expired: ${locationKey}`);
      return;
    }
    if (breakpoint.max_captures > 0 && breakpoint.capture_count >= breakpoint.max_captures) {
      this.logger.debug(`Breakpoint max captures reached: ${locationKey}`);
      return;
    }
    const snapshot = {
      breakpoint_id: breakpoint.id,
      service_name: this.getServiceName(),
      file_path: file,
      function_name: functionName,
      label,
      line_number: line,
      variables: this.sanitizeVariables(variables),
      stack_trace: stack,
      captured_at: /* @__PURE__ */ new Date()
    };
    await this.captureSnapshot(snapshot);
  }
  // ============================================================================
  // Breakpoint Management
  // ============================================================================
  /**
   * Fetch active breakpoints from backend
   * GET /sdk/snapshots/active/{serviceName}
   */
  async fetchActiveBreakpoints() {
    try {
      const serviceName = this.getServiceName();
      const url = `${this.baseURL}/sdk/snapshots/active/${encodeURIComponent(serviceName)}`;
      const response = await fetch(url, {
        headers: {
          "X-API-Key": this.config.apiKey
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      this.updateBreakpointCache(data.breakpoints || []);
      this.lastFetch = /* @__PURE__ */ new Date();
    } catch (error) {
      this.logger.error("\u26A0\uFE0F  Failed to fetch breakpoints:", error);
    }
  }
  /**
   * Update in-memory breakpoint cache
   */
  updateBreakpointCache(breakpoints) {
    this.breakpointsCache.clear();
    for (const bp of breakpoints) {
      if (bp.label && bp.function_name) {
        const labelKey = `${bp.function_name}:${bp.label}`;
        this.breakpointsCache.set(labelKey, bp);
      }
      const lineKey = `${bp.file_path}:${bp.line_number}`;
      this.breakpointsCache.set(lineKey, bp);
    }
    if (breakpoints.length > 0) {
      this.logger.debug(
        `\u{1F4F8} Updated breakpoint cache: ${breakpoints.length} active breakpoints`
      );
    }
  }
  /**
   * Auto-register a breakpoint on first snapshot call
   * POST /sdk/snapshots/auto-register
   */
  async autoRegisterBreakpoint(data) {
    try {
      const response = await fetch(`${this.baseURL}/sdk/snapshots/auto-register`, {
        method: "POST",
        headers: {
          "X-API-Key": this.config.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_name: this.getServiceName(),
          ...data
        })
      });
      if (!response.ok) {
        this.logger.error("\u26A0\uFE0F  Failed to auto-register breakpoint:", response.status);
        return null;
      }
      const result = await response.json();
      this.logger.info(`\u{1F4F8} Auto-registered breakpoint: ${data.function_name}:${data.label}`);
      return result;
    } catch (error) {
      this.logger.error("\u26A0\uFE0F  Failed to auto-register breakpoint:", error);
      return null;
    }
  }
  // ============================================================================
  // Snapshot Capture
  // ============================================================================
  /**
   * Capture and send snapshot to backend
   * POST /sdk/snapshots/capture
   */
  async captureSnapshot(snapshot) {
    try {
      const response = await fetch(`${this.baseURL}/sdk/snapshots/capture`, {
        method: "POST",
        headers: {
          "X-API-Key": this.config.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(snapshot)
      });
      if (!response.ok) {
        this.logger.error("\u26A0\uFE0F  Failed to capture snapshot:", response.status);
      } else {
        this.logger.info(`\u{1F4F8} Snapshot captured: ${snapshot.label || snapshot.file_path}`);
      }
    } catch (error) {
      this.logger.error("\u26A0\uFE0F  Failed to capture snapshot:", error);
    }
  }
  // ============================================================================
  // Helpers
  // ============================================================================
  /**
   * Parse stack trace to extract caller information
   *
   * Stack trace format in React Native:
   * 0: Error
   * 1: at SnapshotClient.checkAndCapture (...)
   * 2: at TracekitClient.captureSnapshot (...) <- wrapper
   * 3: at <actual caller> <- THIS IS WHAT WE WANT
   */
  parseStackTrace(stack) {
    const lines = stack.split("\n");
    this.logger.debug("Stack trace lines:", lines);
    const callerLine = lines[3]?.trim();
    if (!callerLine) {
      this.logger.warn("No caller line found at index 3");
      return null;
    }
    this.logger.debug("Parsing caller line:", callerLine);
    let match = callerLine.match(/at\s+([^\s]+)\s+\(.*?:(\d+):(\d+)\)$/);
    if (!match) {
      match = callerLine.match(/at\s+.*?:(\d+):(\d+)$/);
      if (match) {
        return {
          file: "unknown",
          line: parseInt(match[1], 10),
          functionName: "anonymous"
        };
      }
    }
    if (!match) {
      match = callerLine.match(/([^@]+)@.*?:(\d+):(\d+)$/);
      if (match) {
        return {
          file: "unknown",
          line: parseInt(match[2], 10),
          functionName: match[1].trim()
        };
      }
    }
    if (!match) {
      this.logger.warn("Could not match caller line pattern:", callerLine);
      return null;
    }
    const functionName = match[1] || "anonymous";
    const line = parseInt(match[2], 10);
    this.logger.debug("Parsed stack frame:", { functionName, line });
    return { file: "browser-bundle", line, functionName };
  }
  /**
   * Sanitize variables for JSON serialization
   */
  sanitizeVariables(variables) {
    const sanitized = {};
    for (const [key, value] of Object.entries(variables)) {
      try {
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        sanitized[key] = `[${typeof value}]`;
      }
    }
    return sanitized;
  }
  /**
   * Get service name from config
   */
  getServiceName() {
    return this.config.serviceName || "react-native-app";
  }
};

// src/client.ts
var TracekitClient = class {
  constructor() {
    this.config = null;
    this.transport = null;
    this.initialized = false;
    this.snapshotClient = null;
    // State
    this.sessionId = null;
    this.deviceId = null;
    this.user = null;
    this.tags = {};
    this.contexts = {};
    this.extras = {};
    this.breadcrumbs = [];
    this.activeSpans = /* @__PURE__ */ new Map();
    // Device/App context (cached)
    this.deviceContext = null;
    this.appContext = null;
    // Callbacks
    this.beforeSendCallbacks = [];
    this.onErrorCallbacks = [];
    // Performance tracking
    this.appStartTime = nowMs();
    this.currentScreen = null;
    this.screenStartTime = null;
    this.storage = getStorageManager();
    this.logger = createLogger(false);
  }
  // ============================================================================
  // Initialization
  // ============================================================================
  init(config) {
    if (this.initialized) {
      this.logger.warn("TraceKit already initialized");
      return;
    }
    this.config = {
      enabled: true,
      sampleRate: 1,
      enableCrashReporting: true,
      enableNetworkTracing: true,
      enableNavigationTracing: true,
      enableTouchTracking: false,
      enableCodeMonitoring: false,
      flushInterval: 3e4,
      maxBatchSize: 50,
      maxQueueSize: 1e3,
      debug: false,
      excludeUrls: [],
      ...config
    };
    this.logger = createLogger(this.config.debug ?? false);
    this.logger.info("Initializing TraceKit React Native SDK");
    if (!this.config.apiKey) {
      this.logger.error("TraceKit API key is required");
      return;
    }
    this.transport = createTransport(this.config);
    if (this.config.enableCodeMonitoring) {
      this.snapshotClient = new SnapshotClient(this.config);
      this.snapshotClient.start();
    }
    this.initializeAsync();
    if (this.config.enableCrashReporting) {
      this.setupErrorHandlers();
    }
    this.setupAppStateListener();
    this.initialized = true;
    this.logger.info("TraceKit initialized successfully");
  }
  async initializeAsync() {
    try {
      this.sessionId = generateSessionId();
      this.deviceId = await this.storage.getOrCreateDeviceId();
      const persistedUser = await this.storage.getUser();
      if (persistedUser) {
        this.user = persistedUser;
      }
      this.tags = await this.storage.getTags();
      this.contexts = await this.storage.getContexts();
      this.extras = await this.storage.getExtras();
      this.deviceContext = await this.getDeviceContext();
      this.appContext = await this.getAppContext();
      await this.storage.setAppStartTime(this.appStartTime);
      await this.flushPendingData();
      this.logger.debug("Async initialization complete", {
        sessionId: this.sessionId,
        deviceId: this.deviceId
      });
    } catch (error) {
      this.logger.error("Async initialization failed:", error);
    }
  }
  async flushPendingData() {
    try {
      const pendingSpans = await this.storage.getPendingSpans();
      const pendingExceptions = await this.storage.getPendingExceptions();
      const pendingSnapshots = await this.storage.getPendingSnapshots();
      if (pendingSpans.length > 0) {
        this.logger.debug(`Flushing ${pendingSpans.length} pending spans`);
        await this.storage.clearPendingSpans();
      }
      if (pendingExceptions.length > 0) {
        this.logger.debug(`Flushing ${pendingExceptions.length} pending exceptions`);
        await this.storage.clearPendingExceptions();
      }
      if (pendingSnapshots.length > 0) {
        this.logger.debug(`Flushing ${pendingSnapshots.length} pending snapshots`);
        await this.storage.clearPendingSnapshots();
      }
    } catch (error) {
      this.logger.error("Failed to flush pending data:", error);
    }
  }
  setupErrorHandlers() {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.logger.debug("Global error caught:", error.message, { isFatal });
      this.captureException(error, {
        handled: false,
        mechanism: {
          type: "global_error_handler",
          handled: false,
          data: { isFatal }
        }
      });
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
    const originalRejectionHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      this.logger.debug("Unhandled promise rejection:", event.reason);
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.captureException(error, {
        handled: false,
        mechanism: {
          type: "unhandled_rejection",
          handled: false
        }
      });
      if (originalRejectionHandler) {
        originalRejectionHandler(event);
      }
    };
    this.logger.debug("Error handlers installed");
  }
  setupAppStateListener() {
    import_react_native3.AppState.addEventListener("change", (state) => {
      this.addBreadcrumb({
        type: "navigation",
        category: "app.lifecycle",
        message: `App state changed to ${state}`,
        level: "info",
        data: { state }
      });
      if (state === "background" || state === "inactive") {
        this.flush().catch((err) => {
          this.logger.error("Failed to flush on background:", err);
        });
      }
    });
  }
  isInitialized() {
    return this.initialized;
  }
  getConfig() {
    return this.config;
  }
  // ============================================================================
  // Context Helpers
  // ============================================================================
  async getDeviceContext() {
    const basic = getBasicDeviceContext();
    try {
      const Device = require("expo-device");
      return {
        ...basic,
        deviceModel: Device.modelName ?? void 0,
        deviceManufacturer: Device.manufacturer ?? void 0,
        deviceName: Device.deviceName ?? void 0,
        isDevice: Device.isDevice ?? void 0,
        osVersion: Device.osVersion ?? basic.osVersion
      };
    } catch {
    }
    return basic;
  }
  async getAppContext() {
    const basic = getBasicAppContext();
    try {
      const Application = require("expo-application");
      const Constants = require("expo-constants").default;
      return {
        ...basic,
        appName: Application.applicationName ?? void 0,
        bundleId: Application.applicationId ?? void 0,
        appVersion: this.config?.appVersion ?? Application.nativeApplicationVersion ?? void 0,
        buildNumber: this.config?.buildNumber ?? Application.nativeBuildVersion ?? void 0,
        isExpoGo: Constants.appOwnership === "expo",
        expoSdkVersion: Constants.expoConfig?.sdkVersion ?? void 0
      };
    } catch {
    }
    return {
      ...basic,
      appVersion: this.config?.appVersion,
      buildNumber: this.config?.buildNumber
    };
  }
  getServiceName() {
    return this.config?.serviceName ?? this.appContext?.bundleId ?? "react-native-app";
  }
  getResourceAttributes() {
    return {
      "service.name": this.getServiceName(),
      "service.version": this.appContext?.appVersion,
      "deployment.environment": this.config?.environment,
      "telemetry.sdk.name": "@tracekit/react-native",
      "telemetry.sdk.version": "1.0.0",
      "telemetry.sdk.language": "javascript",
      "device.id": this.deviceId ?? void 0,
      "device.model": this.deviceContext?.deviceModel,
      "os.name": import_react_native3.Platform.OS,
      "os.version": this.deviceContext?.osVersion,
      "session.id": this.sessionId ?? void 0
    };
  }
  // ============================================================================
  // Span Operations
  // ============================================================================
  startSpan(name, parentSpan, attributes) {
    const spanId = generateSpanId();
    const traceId = parentSpan?.traceId ?? generateTraceId();
    const span = {
      spanId,
      traceId,
      parentSpanId: parentSpan?.spanId,
      name,
      kind: "INTERNAL",
      startTime: now(),
      status: "UNSET",
      attributes: {
        ...attributes
      },
      events: [],
      links: []
    };
    this.activeSpans.set(spanId, span);
    this.logger.debug(`Started span: ${name} (${spanId})`);
    return span;
  }
  endSpan(span, attributes, status) {
    const endTime = now();
    span.endTime = endTime;
    span.duration = calculateDuration(span.startTime, endTime);
    span.status = status ?? "OK";
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }
    this.activeSpans.delete(span.spanId);
    this.logger.debug(`Ended span: ${span.name} (${span.duration}ms)`);
    if (this.config?.enabled && shouldSample(this.config.sampleRate ?? 1)) {
      this.sendSpan(span);
    }
  }
  async sendSpan(span) {
    const payload = {
      spans: [span],
      serviceName: this.getServiceName(),
      resource: this.getResourceAttributes(),
      timestamp: now()
    };
    let finalPayload = payload;
    for (const callback of this.beforeSendCallbacks) {
      const result = callback(finalPayload);
      if (result === null) {
        this.logger.debug("Span dropped by beforeSend callback");
        return;
      }
      finalPayload = result;
    }
    try {
      await this.transport?.send(finalPayload);
    } catch (error) {
      this.logger.error("Failed to send span:", error);
      await this.storage.addPendingSpan(finalPayload);
    }
  }
  // ============================================================================
  // Exception Operations
  // ============================================================================
  captureException(error, context) {
    const eventId = generateEventId();
    this.logger.debug(`Capturing exception: ${error.message}`);
    const report = {
      type: error.name || "Error",
      message: error.message,
      stackTrace: parseStackTrace(error.stack),
      handled: context?.handled ?? true,
      mechanism: context?.mechanism,
      context
    };
    if (context?.componentStack) {
      report.componentStack = context.componentStack;
    }
    this.addBreadcrumb({
      type: "error",
      category: "exception",
      message: error.message,
      level: "error",
      data: {
        type: report.type
      }
    });
    if (this.config?.enabled) {
      this.sendException(report, eventId);
    }
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(error, context);
      } catch (e) {
        this.logger.error("onError callback failed:", e);
      }
    }
    return eventId;
  }
  captureMessage(message, level = "info", context) {
    const eventId = generateEventId();
    this.logger.debug(`Capturing message: ${message}`);
    const report = {
      type: "Message",
      message,
      handled: true,
      context
    };
    this.addBreadcrumb({
      type: "info",
      category: "message",
      message,
      level,
      data: context
    });
    if (this.config?.enabled) {
      this.sendException(report, eventId);
    }
    return eventId;
  }
  async sendException(report, eventId) {
    const payload = {
      exception: report,
      breadcrumbs: [...this.breadcrumbs],
      user: this.user ?? void 0,
      device: this.deviceContext ?? getBasicDeviceContext(),
      app: this.appContext ?? getBasicAppContext(),
      tags: { ...this.tags },
      contexts: { ...this.contexts },
      serviceName: this.getServiceName(),
      timestamp: now()
    };
    let finalPayload = payload;
    for (const callback of this.beforeSendCallbacks) {
      const result = callback(finalPayload);
      if (result === null) {
        this.logger.debug("Exception dropped by beforeSend callback");
        return;
      }
      finalPayload = result;
    }
    try {
      await this.transport?.send(finalPayload);
    } catch (error) {
      this.logger.error("Failed to send exception:", error);
      await this.storage.addPendingException(finalPayload);
    }
  }
  // ============================================================================
  // Snapshot Operations (Code Monitoring)
  // ============================================================================
  async captureSnapshot(name, data) {
    if (!this.config?.enableCodeMonitoring) {
      return;
    }
    if (this.snapshotClient) {
      await this.snapshotClient.checkAndCapture(name, data);
    } else {
      this.logger.warn("Snapshot client not initialized. Enable code monitoring in config.");
    }
  }
  // ============================================================================
  // User Operations
  // ============================================================================
  setUser(user) {
    this.user = user;
    this.storage.setUser(user).catch((err) => {
      this.logger.error("Failed to persist user:", err);
    });
    if (user) {
      this.addBreadcrumb({
        type: "user",
        category: "auth",
        message: `User identified: ${user.id}`,
        level: "info",
        data: { userId: user.id }
      });
    }
  }
  getUser() {
    return this.user;
  }
  // ============================================================================
  // Breadcrumb Operations
  // ============================================================================
  addBreadcrumb(breadcrumb) {
    const fullBreadcrumb = {
      ...breadcrumb,
      timestamp: now()
    };
    this.breadcrumbs.push(fullBreadcrumb);
    while (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }
    this.logger.debug(`Breadcrumb: [${breadcrumb.category}] ${breadcrumb.message}`);
  }
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
  // ============================================================================
  // Context Operations
  // ============================================================================
  setTag(key, value) {
    this.tags[key] = value;
    this.storage.setTags(this.tags).catch((err) => {
      this.logger.error("Failed to persist tags:", err);
    });
  }
  setTags(tags) {
    this.tags = { ...this.tags, ...tags };
    this.storage.setTags(this.tags).catch((err) => {
      this.logger.error("Failed to persist tags:", err);
    });
  }
  setContext(name, context) {
    if (context === null) {
      delete this.contexts[name];
    } else {
      this.contexts[name] = context;
    }
    this.storage.setContexts(this.contexts).catch((err) => {
      this.logger.error("Failed to persist contexts:", err);
    });
  }
  setExtra(key, value) {
    this.extras[key] = value;
    this.storage.setExtras(this.extras).catch((err) => {
      this.logger.error("Failed to persist extras:", err);
    });
  }
  setExtras(extras) {
    this.extras = { ...this.extras, ...extras };
    this.storage.setExtras(this.extras).catch((err) => {
      this.logger.error("Failed to persist extras:", err);
    });
  }
  // ============================================================================
  // Navigation Tracking
  // ============================================================================
  trackScreen(screenName, params) {
    const previousScreen = this.currentScreen;
    const timeOnPrevious = this.screenStartTime ? nowMs() - this.screenStartTime : void 0;
    this.currentScreen = screenName;
    this.screenStartTime = nowMs();
    this.addBreadcrumb({
      type: "navigation",
      category: "navigation",
      message: `Navigated to ${screenName}`,
      level: "info",
      data: {
        from: previousScreen,
        to: screenName,
        params,
        timeOnPreviousScreen: timeOnPrevious
      }
    });
    if (this.config?.enableNavigationTracing) {
      const span = this.startSpan(`screen.${screenName}`, null, {
        "screen.name": screenName,
        "screen.previous": previousScreen ?? void 0,
        "screen.params": params ? JSON.stringify(params) : void 0
      });
      this.endSpan(span);
    }
  }
  // ============================================================================
  // Network Tracking
  // ============================================================================
  trackNetworkRequest(request) {
    const requestId = generateEventId();
    this.addBreadcrumb({
      type: "http",
      category: "http",
      message: `${request.method} ${request.url}`,
      level: request.error ? "error" : "info",
      data: {
        method: request.method,
        url: request.url,
        statusCode: request.statusCode,
        duration: request.duration,
        error: request.error
      }
    });
    if (this.config?.enableNetworkTracing) {
      const span = this.startSpan(`HTTP ${request.method}`, null, {
        "http.method": request.method,
        "http.url": request.url,
        "http.status_code": request.statusCode ?? void 0,
        "http.request_body_size": request.requestBodySize ?? void 0,
        "http.response_body_size": request.responseBodySize ?? void 0
      });
      span.kind = "CLIENT";
      span.startTime = request.startTime;
      this.endSpan(
        span,
        { "http.duration": request.duration },
        request.error ? "ERROR" : "OK"
      );
    }
  }
  // ============================================================================
  // Performance
  // ============================================================================
  recordPerformanceMetrics(metrics) {
    this.logger.debug("Recording performance metrics:", metrics);
    const span = this.startSpan("app.performance", null, {
      "perf.app_start_time": metrics.appStartTime,
      "perf.time_to_interactive": metrics.timeToInteractive,
      "perf.js_bundle_load_time": metrics.jsBundleLoadTime,
      "perf.native_module_init_time": metrics.nativeModuleInitTime,
      "perf.fps": metrics.frameRate?.fps,
      "perf.dropped_frames": metrics.frameRate?.droppedFrames,
      "perf.js_heap_size": metrics.memoryUsage?.jsHeapSize
    });
    this.endSpan(span);
  }
  // ============================================================================
  // Hooks
  // ============================================================================
  beforeSend(callback) {
    this.beforeSendCallbacks.push(callback);
  }
  onError(callback) {
    this.onErrorCallbacks.push(callback);
  }
  // ============================================================================
  // Flush & Close
  // ============================================================================
  async flush() {
    this.logger.debug("Flushing TraceKit data");
    await this.transport?.flush();
  }
  async close() {
    this.logger.info("Closing TraceKit client");
    if (this.snapshotClient) {
      this.snapshotClient.stop();
    }
    await this.flush();
    await this.transport?.close();
    this.initialized = false;
  }
};
var client = null;
function getClient() {
  if (!client) {
    client = new TracekitClient();
  }
  return client;
}
function init(config) {
  const c = getClient();
  c.init(config);
  return c;
}

// src/network.ts
var NetworkInterceptor = class {
  constructor(config) {
    this.originalFetch = null;
    this.originalXhrOpen = null;
    this.originalXhrSend = null;
    this.installed = false;
    this.config = config;
    this.logger = createLogger(config.debug ?? false);
  }
  install() {
    if (this.installed) {
      this.logger.warn("Network interceptor already installed");
      return;
    }
    this.logger.debug("Installing network interceptor");
    this.interceptFetch();
    this.interceptXHR();
    this.installed = true;
    this.logger.debug("Network interceptor installed");
  }
  uninstall() {
    if (!this.installed) {
      return;
    }
    this.logger.debug("Uninstalling network interceptor");
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    if (this.originalXhrOpen) {
      XMLHttpRequest.prototype.open = this.originalXhrOpen;
      this.originalXhrOpen = null;
    }
    if (this.originalXhrSend) {
      XMLHttpRequest.prototype.send = this.originalXhrSend;
      this.originalXhrSend = null;
    }
    this.installed = false;
    this.logger.debug("Network interceptor uninstalled");
  }
  // ============================================================================
  // Fetch Interceptor
  // ============================================================================
  interceptFetch() {
    if (typeof fetch === "undefined") {
      this.logger.debug("fetch not available, skipping");
      return;
    }
    if (global.__tracekitFetchIntercepted) {
      this.logger.debug("fetch already intercepted, skipping");
      this.originalFetch = global.__tracekitOriginalFetch;
      return;
    }
    const context = typeof window !== "undefined" ? window : global;
    this.originalFetch = fetch.bind(context);
    global.__tracekitOriginalFetch = this.originalFetch;
    global.__tracekitFetchIntercepted = true;
    const self = this;
    global.fetch = async function(input, init2) {
      const url = typeof input === "string" ? input : input.url ?? String(input);
      const method = init2?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET") ?? "GET";
      if (shouldExcludeUrl(url, self.config.excludeUrls ?? [])) {
        return self.originalFetch(input, init2);
      }
      if (url.includes("tracekit.dev")) {
        return self.originalFetch(input, init2);
      }
      const requestId = generateEventId();
      const startTime = now();
      const startMs = nowMs();
      const requestHeaders = {};
      if (init2?.headers) {
        if (init2.headers instanceof Headers) {
          init2.headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        } else if (Array.isArray(init2.headers)) {
          init2.headers.forEach(([key, value]) => {
            requestHeaders[key] = value;
          });
        } else {
          Object.assign(requestHeaders, init2.headers);
        }
      }
      let requestBodySize;
      if (init2?.body) {
        if (typeof init2.body === "string") {
          requestBodySize = init2.body.length;
        } else if (init2.body instanceof ArrayBuffer) {
          requestBodySize = init2.body.byteLength;
        }
      }
      try {
        const response = await self.originalFetch(input, init2);
        const endTime = now();
        const duration = nowMs() - startMs;
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        const contentLength = response.headers.get("content-length");
        const responseBodySize = contentLength ? parseInt(contentLength, 10) : void 0;
        const networkRequest = {
          method: method.toUpperCase(),
          url,
          requestHeaders: sanitizeHeaders(requestHeaders),
          requestBodySize,
          statusCode: response.status,
          responseHeaders: sanitizeHeaders(responseHeaders),
          responseBodySize,
          startTime,
          endTime,
          duration
        };
        getClient().trackNetworkRequest(networkRequest);
        return response;
      } catch (error) {
        const endTime = now();
        const duration = nowMs() - startMs;
        const networkRequest = {
          method: method.toUpperCase(),
          url,
          requestHeaders: sanitizeHeaders(requestHeaders),
          requestBodySize,
          startTime,
          endTime,
          duration,
          error: error instanceof Error ? error.message : String(error)
        };
        getClient().trackNetworkRequest(networkRequest);
        throw error;
      }
    };
  }
  // ============================================================================
  // XHR Interceptor
  // ============================================================================
  interceptXHR() {
    if (typeof XMLHttpRequest === "undefined") {
      this.logger.debug("XMLHttpRequest not available, skipping");
      return;
    }
    const self = this;
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, async = true, username, password) {
      this.__tracekit = {
        method,
        url: String(url),
        startTime: null,
        requestHeaders: {}
      };
      return self.originalXhrOpen.call(this, method, String(url), async, username, password);
    };
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      if (this.__tracekit) {
        this.__tracekit.requestHeaders[name] = value;
      }
      return originalSetRequestHeader.call(this, name, value);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const traceData = this.__tracekit;
      if (!traceData) {
        return self.originalXhrSend.call(this, body);
      }
      const url = traceData.url;
      if (shouldExcludeUrl(url, self.config.excludeUrls ?? [])) {
        return self.originalXhrSend.call(this, body);
      }
      if (url.includes("tracekit.dev")) {
        return self.originalXhrSend.call(this, body);
      }
      traceData.startTime = now();
      const startMs = nowMs();
      let requestBodySize;
      if (body) {
        if (typeof body === "string") {
          requestBodySize = body.length;
        } else if (body instanceof ArrayBuffer) {
          requestBodySize = body.byteLength;
        }
      }
      this.addEventListener("load", function() {
        const endTime = now();
        const duration = nowMs() - startMs;
        const responseHeadersStr = this.getAllResponseHeaders();
        const responseHeaders = {};
        if (responseHeadersStr) {
          responseHeadersStr.split("\r\n").forEach((line) => {
            const parts = line.split(": ");
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }
        const networkRequest = {
          method: traceData.method.toUpperCase(),
          url: traceData.url,
          requestHeaders: sanitizeHeaders(traceData.requestHeaders),
          requestBodySize,
          statusCode: this.status,
          responseHeaders: sanitizeHeaders(responseHeaders),
          responseBodySize: this.responseText?.length,
          startTime: traceData.startTime,
          endTime,
          duration
        };
        getClient().trackNetworkRequest(networkRequest);
      });
      this.addEventListener("error", function() {
        const endTime = now();
        const duration = nowMs() - startMs;
        const networkRequest = {
          method: traceData.method.toUpperCase(),
          url: traceData.url,
          requestHeaders: sanitizeHeaders(traceData.requestHeaders),
          requestBodySize,
          startTime: traceData.startTime,
          endTime,
          duration,
          error: "Network request failed"
        };
        getClient().trackNetworkRequest(networkRequest);
      });
      this.addEventListener("timeout", function() {
        const endTime = now();
        const duration = nowMs() - startMs;
        const networkRequest = {
          method: traceData.method.toUpperCase(),
          url: traceData.url,
          requestHeaders: sanitizeHeaders(traceData.requestHeaders),
          requestBodySize,
          startTime: traceData.startTime,
          endTime,
          duration,
          error: "Request timed out"
        };
        getClient().trackNetworkRequest(networkRequest);
      });
      return self.originalXhrSend.call(this, body);
    };
  }
};
var networkInterceptor = null;
function installNetworkInterceptor(config) {
  if (networkInterceptor) {
    return;
  }
  networkInterceptor = new NetworkInterceptor(config);
  networkInterceptor.install();
}

// src/expo/index.ts
async function getExpoDeviceContext() {
  const context = {
    platform: "ios"
    // Will be overwritten
  };
  try {
    const { Platform: Platform4, Dimensions: Dimensions2 } = await import("react-native");
    const { width, height, scale } = Dimensions2.get("window");
    context.platform = Platform4.OS;
    context.osVersion = Platform4.Version?.toString();
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
  const client2 = getClient();
  const previousPathRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
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
  }, [client2]);
}
function withScreenTracking(WrappedComponent, screenName) {
  return function ScreenTrackedComponent(props) {
    const client2 = getClient();
    (0, import_react.useEffect)(() => {
      client2.trackScreen(screenName);
    }, []);
    return import_react.default.createElement(WrappedComponent, props);
  };
}
function createNavigationTracking() {
  const client2 = getClient();
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
      client2.trackScreen(routeName);
      currentRouteName = routeName;
    }
  };
}
function useNavigationTracking() {
  const client2 = getClient();
  const navigationRef = (0, import_react.useRef)(null);
  const routeNameRef = (0, import_react.useRef)();
  const onReady = () => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
    if (routeNameRef.current) {
      client2.trackScreen(routeNameRef.current);
    }
  };
  const onStateChange = () => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
    if (currentRouteName && previousRouteName !== currentRouteName) {
      client2.trackScreen(currentRouteName);
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
  const client2 = getClient();
  (0, import_react.useEffect)(() => {
    const trackUpdates = async () => {
      try {
        const Updates = await import("expo-updates");
        if (Updates.updateId) {
          client2.setTag("update.id", Updates.updateId);
        }
        if (Updates.channel) {
          client2.setTag("update.channel", Updates.channel);
        }
        if (Updates.createdAt) {
          client2.setTag("update.created_at", Updates.createdAt.toISOString());
        }
        Updates.addListener((event) => {
          switch (event.type) {
            case Updates.UpdateEventType.UPDATE_AVAILABLE:
              client2.addBreadcrumb({
                type: "info",
                category: "expo.updates",
                message: "Update available",
                level: "info",
                data: { manifest: event.manifest }
              });
              break;
            case Updates.UpdateEventType.NO_UPDATE_AVAILABLE:
              client2.addBreadcrumb({
                type: "info",
                category: "expo.updates",
                message: "No update available",
                level: "info"
              });
              break;
            case Updates.UpdateEventType.ERROR:
              client2.addBreadcrumb({
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
  }, [client2]);
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
  const client2 = init(enhancedConfig);
  if (config.enableNetworkTracing !== false) {
    installNetworkInterceptor(enhancedConfig);
  }
  client2.setContext("device", deviceContext);
  client2.setContext("app", appContext);
  if (appContext.isExpoGo) {
    client2.setTag("expo.is_expo_go", "true");
  }
  if (appContext.expoSdkVersion) {
    client2.setTag("expo.sdk_version", appContext.expoSdkVersion);
  }
  logger.info("TraceKit Expo initialization complete");
  return client2;
}
var ExpoTracekitContext = (0, import_react.createContext)({
  client: null,
  isReady: false
});
function useExpoTracekit() {
  return (0, import_react.useContext)(ExpoTracekitContext);
}
function ExpoTracekitProvider({
  config,
  children,
  onReady,
  onError
}) {
  const [client2, setClient] = (0, import_react.useState)(null);
  const [isReady, setIsReady] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    initExpo(config).then((c) => {
      setClient(c);
      setIsReady(true);
      onReady?.(c);
    }).catch((error) => {
      onError?.(error);
    });
  }, [config, onReady, onError]);
  return import_react.default.createElement(
    ExpoTracekitContext.Provider,
    { value: { client: client2, isReady } },
    children
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
