/**
 * Storage utility functions
 */

/**
 * Create a storage key with namespace
 */
export function createStorageKey(namespace: string, ...parts: string[]): string {
  return [namespace, ...parts].filter(Boolean).join(':');
}

/**
 * Parse a storage key into its parts
 */
export function parseStorageKey(key: string): {
  namespace: string;
  parts: string[];
} {
  const segments = key.split(':');
  return {
    namespace: segments[0] || '',
    parts: segments.slice(1),
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate object size in bytes (rough estimate)
 */
export function calculateObjectSize(obj: any): number {
  const jsonString = JSON.stringify(obj);
  return new Blob([jsonString]).size;
}

/**
 * Create expiration date
 */
export function createExpirationDate(ttl: number | string): Date {
  const now = new Date();
  
  if (typeof ttl === 'number') {
    // TTL in milliseconds
    return new Date(now.getTime() + ttl);
  }
  
  // Parse string format: "1d", "2h", "30m", "60s"
  const match = ttl.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': // days
      now.setDate(now.getDate() + value);
      break;
    case 'h': // hours
      now.setHours(now.getHours() + value);
      break;
    case 'm': // minutes
      now.setMinutes(now.getMinutes() + value);
      break;
    case 's': // seconds
      now.setSeconds(now.getSeconds() + value);
      break;
  }
  
  return now;
}

/**
 * Check if a value is expired
 */
export function isExpired(expiresAt?: Date | string): boolean {
  if (!expiresAt) return false;
  
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration < new Date();
}

/**
 * Debounce function for storage operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Batch storage operations
 */
export class BatchOperations<T = any> {
  private operations: Array<() => Promise<T>> = [];
  private batchSize: number;
  private delay: number;
  
  constructor(batchSize = 10, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  add(operation: () => Promise<T>): void {
    this.operations.push(operation);
  }
  
  async execute(): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < this.operations.length; i += this.batchSize) {
      const batch = this.operations.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
      
      // Delay between batches
      if (i + this.batchSize < this.operations.length) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.operations = [];
    return results;
  }
  
  clear(): void {
    this.operations = [];
  }
  
  get size(): number {
    return this.operations.length;
  }
}