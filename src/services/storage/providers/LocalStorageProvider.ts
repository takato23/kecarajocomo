/**
 * Local Storage Provider
 * Implementation for browser localStorage with encryption and compression support
 */

import {
  StorageItem,
  StorageMetadata,
  StorageQuery,
  StorageError,
} from '../types';

import { StorageProviderInterface } from './StorageProviderInterface';

interface LocalStorageConfig {
  prefix?: string;
  encrypt?: boolean;
  compress?: boolean;
}

interface StoredItem<T = any> {
  value: T;
  metadata: StorageMetadata;
}

export class LocalStorageProvider extends StorageProviderInterface {
  name = 'local';
  private config: LocalStorageConfig;

  constructor(config: LocalStorageConfig = {}) {
    super();
    this.config = {
      prefix: 'kcc_',
      encrypt: false,
      compress: false,
      ...config,
    };
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const fullKey = this.generateStorageKey(key, this.config.prefix);
      const item = localStorage.getItem(fullKey);
      
      if (!item) return null;

      let data = item;
      
      // Decrypt if needed
      if (this.config.encrypt) {
        data = await this.decrypt(data);
      }

      // Decompress if needed
      if (this.config.compress) {
        data = await this.decompress(data);
      }

      const stored: StoredItem<T> = this.deserialize(data);
      
      // Check expiration
      if (stored.metadata.expiresAt && new Date(stored.metadata.expiresAt) < new Date()) {
        await this.delete(key);
        return null;
      }

      return stored.value;
    } catch (error: unknown) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<void> {
    try {
      const fullKey = this.generateStorageKey(key, this.config.prefix);
      
      // Get existing metadata if updating
      const existing = await this.getWithMetadata<T>(key);
      const fullMetadata = existing
        ? this.updateMetadata(existing.metadata, metadata)
        : this.createMetadata(metadata);

      const stored: StoredItem<T> = {
        value,
        metadata: fullMetadata,
      };

      let data = this.serialize(stored);

      // Compress if needed
      if (this.config.compress) {
        data = await this.compress(data);
      }

      // Encrypt if needed
      if (this.config.encrypt) {
        data = await this.encrypt(data);
      }

      localStorage.setItem(fullKey, data);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageError(
          'LocalStorage quota exceeded',
          'QUOTA_EXCEEDED',
          'local'
        );
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.generateStorageKey(key, this.config.prefix);
    localStorage.removeItem(fullKey);
  }

  async query<T = any>(query: StorageQuery): Promise<StorageItem<T>[]> {
    const items: StorageItem<T>[] = [];
    const prefix = this.config.prefix || '';

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (!fullKey || !fullKey.startsWith(prefix)) continue;

      const key = fullKey.substring(prefix.length);
      
      try {
        const stored = await this.getWithMetadata<T>(key);
        if (!stored) continue;

        const item: StorageItem<T> = {
          key,
          value: stored.value,
          metadata: stored.metadata,
        };

        if (this.matchesQuery(item, query)) {
          items.push(item);
        }
      } catch (error: unknown) {
        console.error(`Error reading key ${key}:`, error);
      }
    }

    // Sort and paginate
    const sorted = this.sortItems(items, query);
    return this.paginate(sorted, query);
  }

  async clear(): Promise<void> {
    const prefix = this.config.prefix || '';
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async getSize(): Promise<{ used: number; limit?: number }> {
    let used = 0;
    const prefix = this.config.prefix || '';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          // Rough estimate: 2 bytes per character (UTF-16)
          used += (key.length + value.length) * 2;
        }
      }
    }

    // Most browsers have a 5-10MB limit for localStorage
    const limit = 5 * 1024 * 1024; // 5MB

    return { used, limit };
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.generateStorageKey(key, this.config.prefix);
    return localStorage.getItem(fullKey) !== null;
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    const prefix = this.config.prefix || '';

    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(prefix)) {
        keys.push(fullKey.substring(prefix.length));
      }
    }

    return keys;
  }

  // File operations (store as base64)
  async uploadFile(file: File | Blob, options: any): Promise<any> {
    const key = options.path || `file_${Date.now()}_${file.name || 'unnamed'}`;
    const base64 = await this.fileToBase64(file);
    
    const fileInfo = {
      id: key,
      name: file.name || 'unnamed',
      size: file.size,
      type: file.type,
      url: `local://${key}`,
      bucket: 'local',
      path: key,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store file data
    await this.set(`_file_${key}`, {
      data: base64,
      info: fileInfo,
    });

    return fileInfo;
  }

  async downloadFile(path: string): Promise<Blob> {
    const fileData = await this.get<{ data: string; info: any }>(`_file_${path}`);
    if (!fileData) {
      throw new StorageError('File not found', 'NOT_FOUND', 'local');
    }

    return this.base64ToBlob(fileData.data, fileData.info.type);
  }

  async deleteFile(path: string): Promise<void> {
    await this.delete(`_file_${path}`);
  }

  async getFileUrl(path: string): Promise<string> {
    const fileData = await this.get<{ data: string; info: any }>(`_file_${path}`);
    if (!fileData) {
      throw new StorageError('File not found', 'NOT_FOUND', 'local');
    }

    // Return data URL
    return fileData.data;
  }

  // Private helper methods

  private async getWithMetadata<T>(key: string): Promise<StoredItem<T> | null> {
    try {
      const fullKey = this.generateStorageKey(key, this.config.prefix);
      const item = localStorage.getItem(fullKey);
      
      if (!item) return null;

      let data = item;
      
      if (this.config.encrypt) {
        data = await this.decrypt(data);
      }

      if (this.config.compress) {
        data = await this.decompress(data);
      }

      return this.deserialize(data);
    } catch (error: unknown) {
      console.error('LocalStorage getWithMetadata error:', error);
      return null;
    }
  }

  private async encrypt(data: string): Promise<string> {
    // Simple base64 encoding for now
    // In production, use Web Crypto API
    return btoa(data);
  }

  private async decrypt(data: string): Promise<string> {
    // Simple base64 decoding for now
    // In production, use Web Crypto API
    return atob(data);
  }

  private async compress(data: string): Promise<string> {
    // Simple compression using LZ-string or similar
    // For now, return as-is
    return data;
  }

  private async decompress(data: string): Promise<string> {
    // Simple decompression using LZ-string or similar
    // For now, return as-is
    return data;
  }

  private async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type });
  }
}