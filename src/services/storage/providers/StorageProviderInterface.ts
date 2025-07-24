/**
 * Storage Provider Interface
 * Common interface for all storage providers
 */

import {
  StorageItem,
  StorageMetadata,
  StorageQuery,
  FileUploadOptions,
  FileInfo,
} from '../types';

export abstract class StorageProviderInterface {
  abstract name: string;

  /**
   * Get item from storage
   */
  abstract get<T = any>(key: string): Promise<T | null>;

  /**
   * Set item in storage
   */
  abstract set<T = any>(
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<void>;

  /**
   * Delete item from storage
   */
  abstract delete(key: string): Promise<void>;

  /**
   * Query items from storage
   */
  abstract query<T = any>(query: StorageQuery): Promise<StorageItem<T>[]>;

  /**
   * Clear all storage
   */
  abstract clear(): Promise<void>;

  /**
   * Get storage size
   */
  abstract getSize(): Promise<{ used: number; limit?: number }>;

  /**
   * Check if key exists
   */
  abstract has(key: string): Promise<boolean>;

  /**
   * Get all keys
   */
  abstract keys(): Promise<string[]>;

  // File operations (optional for providers that support it)

  /**
   * Upload file
   */
  async uploadFile(file: File | Blob, options: FileUploadOptions): Promise<FileInfo> {
    throw new Error(`File upload not supported by ${this.name} provider`);
  }

  /**
   * Download file
   */
  async downloadFile(path: string): Promise<Blob> {
    throw new Error(`File download not supported by ${this.name} provider`);
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void> {
    throw new Error(`File deletion not supported by ${this.name} provider`);
  }

  /**
   * Get file URL
   */
  async getFileUrl(path: string, options?: { download?: boolean; expiresIn?: number }): Promise<string> {
    throw new Error(`File URL generation not supported by ${this.name} provider`);
  }

  /**
   * List files
   */
  async listFiles(prefix?: string, options?: { limit?: number; offset?: number }): Promise<FileInfo[]> {
    throw new Error(`File listing not supported by ${this.name} provider`);
  }

  // Helper methods

  /**
   * Generate storage key with metadata
   */
  protected generateStorageKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}${key}` : key;
  }

  /**
   * Create metadata
   */
  protected createMetadata(partial?: Partial<StorageMetadata>): StorageMetadata {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
  }

  /**
   * Update metadata
   */
  protected updateMetadata(existing: StorageMetadata, updates?: Partial<StorageMetadata>): StorageMetadata {
    return {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * Serialize value for storage
   */
  protected serialize<T>(value: T): string {
    return JSON.stringify(value);
  }

  /**
   * Deserialize value from storage
   */
  protected deserialize<T>(value: string): T {
    try {
      return JSON.parse(value);
    } catch {
      // Return as-is if not valid JSON
      return value as unknown as T;
    }
  }

  /**
   * Match query against item
   */
  protected matchesQuery(item: StorageItem, query: StorageQuery): boolean {
    if (query.prefix && !item.key.startsWith(query.prefix)) {
      return false;
    }

    if (query.tags && item.metadata?.tags) {
      const hasAllTags = query.tags.every(tag => 
        item.metadata!.tags!.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    if (query.after && item.metadata?.createdAt) {
      if (item.metadata.createdAt < query.after) return false;
    }

    if (query.before && item.metadata?.createdAt) {
      if (item.metadata.createdAt > query.before) return false;
    }

    return true;
  }

  /**
   * Sort items based on query
   */
  protected sortItems<T>(items: StorageItem<T>[], query: StorageQuery): StorageItem<T>[] {
    if (!query.orderBy) return items;

    return items.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (query.orderBy) {
        case 'key':
          aVal = a.key;
          bVal = b.key;
          break;
        case 'createdAt':
          aVal = a.metadata?.createdAt?.getTime() || 0;
          bVal = b.metadata?.createdAt?.getTime() || 0;
          break;
        case 'updatedAt':
          aVal = a.metadata?.updatedAt?.getTime() || 0;
          bVal = b.metadata?.updatedAt?.getTime() || 0;
          break;
        default:
          return 0;
      }

      if (query.order === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }

  /**
   * Apply pagination to items
   */
  protected paginate<T>(items: StorageItem<T>[], query: StorageQuery): StorageItem<T>[] {
    const offset = query.offset || 0;
    const limit = query.limit || items.length;
    
    return items.slice(offset, offset + limit);
  }
}