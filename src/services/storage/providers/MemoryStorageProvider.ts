/**
 * Memory Storage Provider
 * In-memory storage implementation for testing and temporary data
 */

import {
  StorageItem,
  StorageMetadata,
  StorageQuery,
} from '../types';

import { StorageProviderInterface } from './StorageProviderInterface';

export class MemoryStorageProvider extends StorageProviderInterface {
  name = 'memory';
  private storage: Map<string, StorageItem> = new Map();

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.storage.get(key);
    if (!item) return null;

    // Check expiration
    if (item.metadata?.expiresAt && new Date(item.metadata.expiresAt) < new Date()) {
      this.storage.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T = any>(
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<void> {
    const existing = this.storage.get(key);
    
    const fullMetadata = existing
      ? this.updateMetadata(existing.metadata!, metadata)
      : this.createMetadata(metadata);

    this.storage.set(key, {
      key,
      value,
      metadata: fullMetadata,
    });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async query<T = any>(query: StorageQuery): Promise<StorageItem<T>[]> {
    const items = Array.from(this.storage.values())
      .filter(item => this.matchesQuery(item, query));

    const sorted = this.sortItems(items, query);
    return this.paginate(sorted, query) as StorageItem<T>[];
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getSize(): Promise<{ used: number; limit?: number }> {
    // Rough estimate of memory usage
    let used = 0;
    
    this.storage.forEach((item) => {
      // Estimate based on JSON string length
      used += JSON.stringify(item).length * 2; // 2 bytes per character
    });

    return { used };
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}