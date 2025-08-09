/**
 * Sistema de caché optimizado con TTL, compresión, y métricas
 * Soporta múltiples estrategias de almacenamiento y invalidación inteligente
 */

import { logger } from '@/services/logger';
import { performanceMonitor } from '../performance/PerformanceMonitor';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size?: number;
  compressed?: boolean;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Max cache size in bytes
  maxEntries?: number; // Max number of entries
  compress?: boolean; // Enable compression for large values
  tags?: string[]; // Tags for cache invalidation
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  memoryUsage: number;
}

/**
 * Caché optimizado con múltiples estrategias
 */
export class OptimizedCache {
  private static instances = new Map<string, OptimizedCache>();
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    memoryUsage: 0,
  };

  private defaultOptions: Required<CacheOptions> = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 1000,
    compress: true,
    tags: [],
    storage: 'memory',
  };

  private options: Required<CacheOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private name: string,
    options: Partial<CacheOptions> = {}
  ) {
    this.options = { ...this.defaultOptions, ...options };
    this.loadFromPersistentStorage();
    this.startCleanupTimer();
  }

  static getInstance(name: string, options: Partial<CacheOptions> = {}): OptimizedCache {
    if (!OptimizedCache.instances.has(name)) {
      OptimizedCache.instances.set(name, new OptimizedCache(name, options));
    }
    return OptimizedCache.instances.get(name)!;
  }

  /**
   * Obtiene un valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Check TTL
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.evictions++;
        this.updateHitRate();
        return null;
      }

      // Update stats
      entry.hits++;
      this.stats.hits++;
      this.updateHitRate();

      // Decompress if needed
      let value = entry.value;
      if (entry.compressed && typeof value === 'string') {
        value = await this.decompress(value);
      }

      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('cache.get', duration, {
        cache: this.name,
        key,
        hit: 'true',
      });

      return value;
    } catch (error) {
      logger.error('Cache get error:', 'OptimizedCache', { key, error });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Almacena un valor en el caché
   */
  async set<T>(key: string, value: T, options: Partial<CacheOptions> = {}): Promise<void> {
    const startTime = performance.now();

    try {
      const mergedOptions = { ...this.options, ...options };
      let finalValue = value;
      let compressed = false;
      let size = this.estimateSize(value);

      // Compress large values
      if (mergedOptions.compress && size > 1024) {
        finalValue = await this.compress(value);
        compressed = true;
        size = this.estimateSize(finalValue);
      }

      const entry: CacheEntry<T> = {
        key,
        value: finalValue,
        timestamp: Date.now(),
        ttl: mergedOptions.ttl,
        hits: 0,
        size,
        compressed,
        tags: mergedOptions.tags,
      };

      // Check if we need to evict entries
      await this.ensureCapacity(size);

      this.cache.set(key, entry);
      this.stats.sets++;
      this.updateStats();

      // Persist if needed
      if (this.options.storage !== 'memory') {
        await this.persistEntry(key, entry);
      }

      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('cache.set', duration, {
        cache: this.name,
        key,
        size: size.toString(),
        compressed: compressed.toString(),
      });

      logger.debug('Cache set:', 'OptimizedCache', {
        cache: this.name,
        key,
        size,
        compressed,
        ttl: mergedOptions.ttl,
      });
    } catch (error) {
      logger.error('Cache set error:', 'OptimizedCache', { key, error });
    }
  }

  /**
   * Elimina una entrada del caché
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();

      // Remove from persistent storage
      if (this.options.storage !== 'memory') {
        this.removePersistentEntry(key);
      }
    }
    return deleted;
  }

  /**
   * Limpia entradas por tags
   */
  invalidateByTags(tags: string[]): number {
    let deleted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.stats.deletes += deleted;
      this.updateStats();
    }

    return deleted;
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.deletes += count;
    this.updateStats();

    // Clear persistent storage
    if (this.options.storage !== 'memory') {
      this.clearPersistentStorage();
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Obtiene todas las keys del caché
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Verifica si una key existe en el caché
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Obtiene el tamaño actual del caché
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Verifica si una entrada ha expirado
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Estima el tamaño de un valor en bytes
   */
  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // Assume UTF-16
    }
    if (typeof value === 'number') {
      return 8;
    }
    if (typeof value === 'boolean') {
      return 4;
    }
    if (value === null || value === undefined) {
      return 0;
    }
    
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024; // Default estimate
    }
  }

  /**
   * Comprime un valor usando técnicas simples
   */
  private async compress(value: any): Promise<string> {
    try {
      const json = JSON.stringify(value);
      
      // Simple compression using browser APIs if available
      if (typeof window !== 'undefined' && 'CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(json));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value: chunk, done: readerDone } = await reader.read();
          done = readerDone;
          if (chunk) chunks.push(chunk);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
      
      // Fallback: simple string compression
      return btoa(json);
    } catch (error) {
      logger.warn('Compression failed, storing uncompressed:', 'OptimizedCache', error);
      return JSON.stringify(value);
    }
  }

  /**
   * Descomprime un valor
   */
  private async decompress(compressedValue: string): Promise<any> {
    try {
      // Try decompression if CompressionStream was used
      if (typeof window !== 'undefined' && 'DecompressionStream' in window) {
        try {
          const compressed = Uint8Array.from(atob(compressedValue), c => c.charCodeAt(0));
          const stream = new DecompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          writer.write(compressed);
          writer.close();
          
          const chunks: Uint8Array[] = [];
          let done = false;
          
          while (!done) {
            const { value: chunk, done: readerDone } = await reader.read();
            done = readerDone;
            if (chunk) chunks.push(chunk);
          }
          
          const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
          }
          
          const json = new TextDecoder().decode(decompressed);
          return JSON.parse(json);
        } catch {
          // Fall through to simple base64 decode
        }
      }
      
      // Fallback: simple base64 decode
      const json = atob(compressedValue);
      return JSON.parse(json);
    } catch (error) {
      logger.error('Decompression failed:', 'OptimizedCache', error);
      return null;
    }
  }

  /**
   * Asegura que hay capacidad para un nuevo valor
   */
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Check max entries
    if (this.cache.size >= this.options.maxEntries) {
      this.evictLRU();
    }

    // Check max size
    if (this.stats.totalSize + newEntrySize > this.options.maxSize) {
      await this.evictBySize(newEntrySize);
    }
  }

  /**
   * Evita entradas usando LRU (Least Recently Used)
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Evita entradas hasta liberar espacio suficiente
   */
  private async evictBySize(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access pattern (least recently used and least hits first)
    entries.sort(([, a], [, b]) => {
      const aScore = a.hits / (Date.now() - a.timestamp);
      const bScore = b.hits / (Date.now() - b.timestamp);
      return aScore - bScore;
    });

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      freedSpace += entry.size || 0;
      this.cache.delete(key);
      this.stats.evictions++;
    }
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanupExpired(): void {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.evictions += cleaned;
      this.updateStats();
      logger.debug('Cleaned expired entries:', 'OptimizedCache', {
        cache: this.name,
        cleaned,
      });
    }
  }

  /**
   * Actualiza estadísticas calculadas
   */
  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + (entry.size || 0), 0);
    this.updateHitRate();
  }

  /**
   * Actualiza tasa de aciertos
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Inicia timer de limpieza automática
   */
  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  /**
   * Carga datos del almacenamiento persistente
   */
  private loadFromPersistentStorage(): void {
    if (this.options.storage === 'memory' || typeof window === 'undefined') return;

    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage;
      const cacheData = storage.getItem(`cache_${this.name}`);
      
      if (cacheData) {
        const entries: Array<[string, CacheEntry]> = JSON.parse(cacheData);
        for (const [key, entry] of entries) {
          if (!this.isExpired(entry)) {
            this.cache.set(key, entry);
          }
        }
        this.updateStats();
      }
    } catch (error) {
      logger.warn('Failed to load cache from storage:', 'OptimizedCache', error);
    }
  }

  /**
   * Persiste una entrada en almacenamiento
   */
  private async persistEntry(key: string, entry: CacheEntry): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage;
      const allEntries = Array.from(this.cache.entries());
      storage.setItem(`cache_${this.name}`, JSON.stringify(allEntries));
    } catch (error) {
      logger.warn('Failed to persist cache entry:', 'OptimizedCache', error);
    }
  }

  /**
   * Remueve una entrada del almacenamiento persistente
   */
  private removePersistentEntry(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage;
      const allEntries = Array.from(this.cache.entries());
      storage.setItem(`cache_${this.name}`, JSON.stringify(allEntries));
    } catch (error) {
      logger.warn('Failed to remove cache entry from storage:', 'OptimizedCache', error);
    }
  }

  /**
   * Limpia todo el almacenamiento persistente
   */
  private clearPersistentStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.options.storage === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(`cache_${this.name}`);
    } catch (error) {
      logger.warn('Failed to clear cache storage:', 'OptimizedCache', error);
    }
  }

  /**
   * Destruye el caché y libera recursos
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    OptimizedCache.instances.delete(this.name);
  }
}

// Instancias predefinidas para uso común
export const apiCache = OptimizedCache.getInstance('api', {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 500,
  storage: 'memory',
  tags: ['api'],
});

export const uiCache = OptimizedCache.getInstance('ui', {
  ttl: 30 * 60 * 1000, // 30 minutes
  maxEntries: 200,
  storage: 'localStorage',
  tags: ['ui'],
});

export const userDataCache = OptimizedCache.getInstance('userData', {
  ttl: 60 * 60 * 1000, // 1 hour
  maxEntries: 100,
  storage: 'localStorage',
  tags: ['user'],
});

// Helper functions
export function invalidateUserCache(): void {
  userDataCache.invalidateByTags(['user']);
}

export function invalidateApiCache(): void {
  apiCache.invalidateByTags(['api']);
}

export function getAllCacheStats(): Record<string, CacheStats> {
  const stats: Record<string, CacheStats> = {};
  for (const [name, cache] of OptimizedCache.instances.entries()) {
    stats[name] = cache.getStats();
  }
  return stats;
}