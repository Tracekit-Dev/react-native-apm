/**
 * TraceKit React Native SDK - Storage Adapter
 * @package @tracekit/react-native
 */

import { Platform } from 'react-native';

// ============================================================================
// Storage Interface
// ============================================================================

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_PREFIX = '@tracekit:';

export const StorageKeys = {
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
  APP_START_TIME: `${STORAGE_PREFIX}app_start_time`,
} as const;

// ============================================================================
// In-Memory Storage (Fallback)
// ============================================================================

class InMemoryStorage implements StorageAdapter {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map((key) => [key, this.store.get(key) ?? null]);
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      this.store.set(key, value);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.store.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// ============================================================================
// AsyncStorage Wrapper
// ============================================================================

class AsyncStorageWrapper implements StorageAdapter {
  private asyncStorage: any | null = null;
  private fallback: InMemoryStorage = new InMemoryStorage();
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import to avoid requiring the package if not installed
      // @ts-ignore - optional peer dependency
      const module = await import('@react-native-async-storage/async-storage');
      this.asyncStorage = module.default;
      this.initialized = true;
    } catch {
      // AsyncStorage not available, use in-memory fallback
      console.warn(
        '[TraceKit] @react-native-async-storage/async-storage not found, using in-memory storage'
      );
      this.initialized = true;
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.getItem(key);
    }
    return this.fallback.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.setItem(key, value);
    }
    return this.fallback.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.removeItem(key);
    }
    return this.fallback.removeItem(key);
  }

  async getAllKeys(): Promise<string[]> {
    await this.init();
    if (this.asyncStorage) {
      const keys = await this.asyncStorage.getAllKeys();
      return keys.filter((key: string) => key.startsWith(STORAGE_PREFIX));
    }
    return this.fallback.getAllKeys();
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    await this.init();
    if (this.asyncStorage) {
      const result = await this.asyncStorage.multiGet(keys);
      return result as [string, string | null][];
    }
    return this.fallback.multiGet(keys);
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.multiSet(keyValuePairs);
    }
    return this.fallback.multiSet(keyValuePairs);
  }

  async multiRemove(keys: string[]): Promise<void> {
    await this.init();
    if (this.asyncStorage) {
      return this.asyncStorage.multiRemove(keys);
    }
    return this.fallback.multiRemove(keys);
  }

  async clear(): Promise<void> {
    await this.init();
    const keys = await this.getAllKeys();
    await this.multiRemove(keys);
  }
}

// ============================================================================
// Storage Manager
// ============================================================================

export class StorageManager {
  private storage: StorageAdapter;
  private maxPendingItems: number;

  constructor(storage?: StorageAdapter, maxPendingItems = 1000) {
    this.storage = storage ?? new AsyncStorageWrapper();
    this.maxPendingItems = maxPendingItems;
  }

  // Session Management
  async getSessionId(): Promise<string | null> {
    return this.storage.getItem(StorageKeys.SESSION_ID);
  }

  async setSessionId(sessionId: string): Promise<void> {
    await this.storage.setItem(StorageKeys.SESSION_ID, sessionId);
  }

  // Device ID Management
  async getDeviceId(): Promise<string | null> {
    return this.storage.getItem(StorageKeys.DEVICE_ID);
  }

  async setDeviceId(deviceId: string): Promise<void> {
    await this.storage.setItem(StorageKeys.DEVICE_ID, deviceId);
  }

  async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await this.getDeviceId();
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await this.setDeviceId(deviceId);
    }
    return deviceId;
  }

  // User Management
  async getUser(): Promise<Record<string, unknown> | null> {
    const data = await this.storage.getItem(StorageKeys.USER);
    return data ? JSON.parse(data) : null;
  }

  async setUser(user: Record<string, unknown> | null): Promise<void> {
    if (user) {
      await this.storage.setItem(StorageKeys.USER, JSON.stringify(user));
    } else {
      await this.storage.removeItem(StorageKeys.USER);
    }
  }

  // Pending Data Management
  async getPendingSpans(): Promise<unknown[]> {
    const data = await this.storage.getItem(StorageKeys.PENDING_SPANS);
    return data ? JSON.parse(data) : [];
  }

  async addPendingSpan(span: unknown): Promise<void> {
    const spans = await this.getPendingSpans();
    spans.push(span);

    // Trim to max size
    while (spans.length > this.maxPendingItems) {
      spans.shift();
    }

    await this.storage.setItem(StorageKeys.PENDING_SPANS, JSON.stringify(spans));
  }

  async addPendingSpans(newSpans: unknown[]): Promise<void> {
    const spans = await this.getPendingSpans();
    spans.push(...newSpans);

    // Trim to max size
    while (spans.length > this.maxPendingItems) {
      spans.shift();
    }

    await this.storage.setItem(StorageKeys.PENDING_SPANS, JSON.stringify(spans));
  }

  async clearPendingSpans(): Promise<void> {
    await this.storage.removeItem(StorageKeys.PENDING_SPANS);
  }

  async getPendingExceptions(): Promise<unknown[]> {
    const data = await this.storage.getItem(StorageKeys.PENDING_EXCEPTIONS);
    return data ? JSON.parse(data) : [];
  }

  async addPendingException(exception: unknown): Promise<void> {
    const exceptions = await this.getPendingExceptions();
    exceptions.push(exception);

    // Trim to max size
    while (exceptions.length > this.maxPendingItems) {
      exceptions.shift();
    }

    await this.storage.setItem(
      StorageKeys.PENDING_EXCEPTIONS,
      JSON.stringify(exceptions)
    );
  }

  async clearPendingExceptions(): Promise<void> {
    await this.storage.removeItem(StorageKeys.PENDING_EXCEPTIONS);
  }

  async getPendingSnapshots(): Promise<unknown[]> {
    const data = await this.storage.getItem(StorageKeys.PENDING_SNAPSHOTS);
    return data ? JSON.parse(data) : [];
  }

  async addPendingSnapshot(snapshot: unknown): Promise<void> {
    const snapshots = await this.getPendingSnapshots();
    snapshots.push(snapshot);

    // Trim to max size
    while (snapshots.length > this.maxPendingItems) {
      snapshots.shift();
    }

    await this.storage.setItem(
      StorageKeys.PENDING_SNAPSHOTS,
      JSON.stringify(snapshots)
    );
  }

  async clearPendingSnapshots(): Promise<void> {
    await this.storage.removeItem(StorageKeys.PENDING_SNAPSHOTS);
  }

  // Breadcrumbs
  async getBreadcrumbs(): Promise<unknown[]> {
    const data = await this.storage.getItem(StorageKeys.BREADCRUMBS);
    return data ? JSON.parse(data) : [];
  }

  async addBreadcrumb(breadcrumb: unknown, maxBreadcrumbs = 100): Promise<void> {
    const breadcrumbs = await this.getBreadcrumbs();
    breadcrumbs.push(breadcrumb);

    // Trim to max size
    while (breadcrumbs.length > maxBreadcrumbs) {
      breadcrumbs.shift();
    }

    await this.storage.setItem(
      StorageKeys.BREADCRUMBS,
      JSON.stringify(breadcrumbs)
    );
  }

  async clearBreadcrumbs(): Promise<void> {
    await this.storage.removeItem(StorageKeys.BREADCRUMBS);
  }

  // Tags
  async getTags(): Promise<Record<string, string>> {
    const data = await this.storage.getItem(StorageKeys.TAGS);
    return data ? JSON.parse(data) : {};
  }

  async setTags(tags: Record<string, string>): Promise<void> {
    await this.storage.setItem(StorageKeys.TAGS, JSON.stringify(tags));
  }

  // Contexts
  async getContexts(): Promise<Record<string, Record<string, unknown>>> {
    const data = await this.storage.getItem(StorageKeys.CONTEXTS);
    return data ? JSON.parse(data) : {};
  }

  async setContexts(
    contexts: Record<string, Record<string, unknown>>
  ): Promise<void> {
    await this.storage.setItem(StorageKeys.CONTEXTS, JSON.stringify(contexts));
  }

  // Extras
  async getExtras(): Promise<Record<string, unknown>> {
    const data = await this.storage.getItem(StorageKeys.EXTRAS);
    return data ? JSON.parse(data) : {};
  }

  async setExtras(extras: Record<string, unknown>): Promise<void> {
    await this.storage.setItem(StorageKeys.EXTRAS, JSON.stringify(extras));
  }

  // Flush tracking
  async getLastFlushTime(): Promise<number | null> {
    const data = await this.storage.getItem(StorageKeys.LAST_FLUSH);
    return data ? parseInt(data, 10) : null;
  }

  async setLastFlushTime(timestamp: number): Promise<void> {
    await this.storage.setItem(StorageKeys.LAST_FLUSH, timestamp.toString());
  }

  // App start tracking
  async getAppStartTime(): Promise<number | null> {
    const data = await this.storage.getItem(StorageKeys.APP_START_TIME);
    return data ? parseInt(data, 10) : null;
  }

  async setAppStartTime(timestamp: number): Promise<void> {
    await this.storage.setItem(StorageKeys.APP_START_TIME, timestamp.toString());
  }

  // Clear all TraceKit data
  async clearAll(): Promise<void> {
    await this.storage.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let storageManager: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageManager) {
    storageManager = new StorageManager();
  }
  return storageManager;
}

export function setStorageManager(manager: StorageManager): void {
  storageManager = manager;
}
