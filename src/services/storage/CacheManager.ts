/**
 * Cache Manager
 * Handles caching with LRU eviction and TTL support
 */

import { CacheEntry } from './types';

interface CacheConfig {
  maxSize: number; // MB
  ttl: number; // milliseconds
  strategy: 'lru' | 'fifo' | 'lfu';
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU
  private config: CacheConfig;
  private currentSize = 0;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.currentSize -= entry.size;
      return null;
    }

    // Update access tracking
    entry.hits++;
    entry.lastAccessed = new Date();
    
    if (this.config.strategy === 'lru') {
      this.updateAccessOrder(key);
    }

    return entry.value as T;
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    const size = this.calculateSize(value);
    
    // Check if we need to evict items
    await this.ensureSpace(size);

    const expiresAt = this.config.ttl > 0
      ? new Date(Date.now() + this.config.ttl)
      : undefined;

    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      hits: 0,
      lastAccessed: new Date(),
      expiresAt,
    };

    // Remove old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.currentSize += size;
    
    if (this.config.strategy === 'lru') {
      this.updateAccessOrder(key);
    }
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.currentSize -= entry.size;
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.currentSize = 0;
  }

  async getSize(): Promise<number> {
    return this.currentSize;
  }

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Ensure cache size is within new limits
    if (config.maxSize && this.currentSize > config.maxSize * 1024 * 1024) {
      this.evictToSize(config.maxSize * 1024 * 1024);
    }
  }

  private calculateSize(value: any): number {
    // Rough estimate based on JSON string length
    return JSON.stringify(value).length * 2; // 2 bytes per character
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const maxSize = this.config.maxSize * 1024 * 1024; // Convert MB to bytes
    const targetSize = maxSize - requiredSize;
    
    if (this.currentSize > targetSize) {
      await this.evictToSize(targetSize);
    }
  }

  private async evictToSize(targetSize: number): Promise<void> {
    const evictedKeys: string[] = [];

    while (this.currentSize > targetSize && this.cache.size > 0) {
      const keyToEvict = this.selectEvictionCandidate();
      if (!keyToEvict) break;

      const entry = this.cache.get(keyToEvict);
      if (entry) {
        this.cache.delete(keyToEvict);
        this.removeFromAccessOrder(keyToEvict);
        this.currentSize -= entry.size;
        evictedKeys.push(keyToEvict);
      }
    }

    if (evictedKeys.length > 0) {
      // Emit eviction event if needed

    }
  }

  private selectEvictionCandidate(): string | null {
    switch (this.config.strategy) {
      case 'lru':
        return this.accessOrder[0] || null;
      
      case 'fifo':
        // First item in the map
        return this.cache.keys().next().value || null;
      
      case 'lfu':
        // Find item with lowest hit count
        let minHits = Infinity;
        let candidate: string | null = null;
        
        this.cache.forEach((entry, key) => {
          if (entry.hits < minHits) {
            minHits = entry.hits;
            candidate = key;
          }
        });
        
        return candidate;
      
      default:
        return null;
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}