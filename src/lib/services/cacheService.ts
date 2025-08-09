import { logger } from '@/services/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  memoryEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<any>>;
  private stats = {
    hits: 0,
    misses: 0
  };
  
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_MEMORY_ENTRIES = 1000;
  private readonly DB_NAME = 'kecarajocomer_cache';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.memoryCache = new Map();
    this.initIndexedDB();
    
    // Schedule periodic cleanup
    setInterval(() => this.clearExpired(), 5 * 60 * 1000); // Every 5 minutes
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Initialize IndexedDB
  private async initIndexedDB() {
    if (typeof window === 'undefined') return;
    
    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        logger.error('Failed to open IndexedDB', 'cacheService');
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error: unknown) {
      logger.error('IndexedDB initialization error:', 'cacheService', error);
    }
  }

  // Memory cache methods
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (this.isExpired(memoryEntry)) {
        this.memoryCache.delete(key);
      } else {
        this.stats.hits++;
        return memoryEntry.data;
      }
    }
    
    // Try IndexedDB
    const dbEntry = await this.getFromIndexedDB<T>(key);
    if (dbEntry) {
      // Promote to memory cache
      this.memoryCache.set(key, dbEntry);
      this.stats.hits++;
      return dbEntry.data;
    }
    
    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };
    
    // Save to memory cache
    this.memoryCache.set(key, entry);
    
    // Enforce memory limit
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      this.evictOldest();
    }
    
    // Save to IndexedDB
    await this.saveToIndexedDB(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.deleteFromIndexedDB(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.clearIndexedDB();
    this.stats = { hits: 0, misses: 0 };
  }

  // IndexedDB methods
  private async getFromIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && !this.isExpired(result)) {
            resolve(result);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          resolve(null);
        };
      } catch (error: unknown) {
        logger.error('IndexedDB get error:', 'cacheService', error);
        resolve(null);
      }
    });
  }

  private async saveToIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.put({ key, ...entry });
        
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (error: unknown) {
        logger.error('IndexedDB save error:', 'cacheService', error);
        resolve();
      }
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (error: unknown) {
        logger.error('IndexedDB delete error:', 'cacheService', error);
        resolve();
      }
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (error: unknown) {
        logger.error('IndexedDB clear error:', 'cacheService', error);
        resolve();
      }
    });
  }

  // Utility methods
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  async clearExpired(): Promise<void> {
    // Clear expired from memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear expired from IndexedDB
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const expiredTime = Date.now() - this.DEFAULT_TTL;
      const range = IDBKeyRange.upperBound(expiredTime);
      
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    } catch (error: unknown) {
      logger.error('Failed to clear expired from IndexedDB:', 'cacheService', error);
    }
  }

  getCacheStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    return {
      memoryEntries: this.memoryCache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate
    };
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();