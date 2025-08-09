/**
 * Supabase Storage Provider
 * Implementation for Supabase storage and database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger';

import {
  StorageItem,
  StorageMetadata,
  StorageQuery,
  FileUploadOptions,
  FileInfo,
  StorageError,
} from '../types';

import { StorageProviderInterface } from './StorageProviderInterface';

interface SupabaseConfig {
  url: string;
  key: string;
  bucket?: string;
  table?: string;
}

interface StorageRecord {
  id: string;
  key: string;
  value: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export class SupabaseStorageProvider extends StorageProviderInterface {
  name = 'supabase';
  private client: SupabaseClient;
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig) {
    super();
    this.config = {
      bucket: 'files',
      table: 'storage_items',
      ...config,
    };
    
    this.client = createClient(config.url, config.key);
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.config.table!)
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) return null;

      const metadata = this.parseMetadata(data.metadata);
      
      // Check expiration
      if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
        await this.delete(key);
        return null;
      }

      return data.value as T;
    } catch (error: unknown) {
      logger.error('Supabase get error:', 'SupabaseStorageProvider', error);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    metadata?: Partial<StorageMetadata>
  ): Promise<void> {
    try {
      // Check if exists
      const existing = await this.getRecord(key);
      
      const fullMetadata = existing
        ? this.updateMetadata(this.parseMetadata(existing.metadata), metadata)
        : this.createMetadata(metadata);

      const record: Partial<StorageRecord> = {
        key,
        value,
        metadata: this.serializeMetadata(fullMetadata),
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update
        const { error } = await this.client
          .from(this.config.table!)
          .update(record)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        record.id = this.generateId();
        record.created_at = new Date().toISOString();
        
        const { error } = await this.client
          .from(this.config.table!)
          .insert(record);

        if (error) throw error;
      }
    } catch (error: unknown) {
      throw this.handleError(error, 'set', key);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.config.table!)
        .delete()
        .eq('key', key);

      if (error) throw error;
    } catch (error: unknown) {
      throw this.handleError(error, 'delete', key);
    }
  }

  async query<T = any>(query: StorageQuery): Promise<StorageItem<T>[]> {
    try {
      let supabaseQuery = this.client
        .from(this.config.table!)
        .select('*');

      // Apply filters
      if (query.prefix) {
        supabaseQuery = supabaseQuery.ilike('key', `${query.prefix}%`);
      }

      if (query.after) {
        supabaseQuery = supabaseQuery.gte('created_at', query.after.toISOString());
      }

      if (query.before) {
        supabaseQuery = supabaseQuery.lte('created_at', query.before.toISOString());
      }

      // Apply ordering
      if (query.orderBy) {
        const column = this.mapOrderBy(query.orderBy);
        supabaseQuery = supabaseQuery.order(column, {
          ascending: query.order !== 'desc',
        });
      }

      // Apply pagination
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(
          query.offset,
          query.offset + (query.limit || 100) - 1
        );
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      return (data || []).map(record => ({
        key: record.key,
        value: record.value as T,
        metadata: this.parseMetadata(record.metadata),
      }));
    } catch (error: unknown) {
      throw this.handleError(error, 'query');
    }
  }

  async clear(): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.config.table!)
        .delete()
        .neq('id', ''); // Delete all

      if (error) throw error;
    } catch (error: unknown) {
      throw this.handleError(error, 'clear');
    }
  }

  async getSize(): Promise<{ used: number; limit?: number }> {
    try {
      // Get approximate size from row count
      const { count, error } = await this.client
        .from(this.config.table!)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      // Rough estimate: 1KB per item average
      const used = (count || 0) * 1024;

      return { used };
    } catch (error: unknown) {
      logger.error('Supabase getSize error:', 'SupabaseStorageProvider', error);
      return { used: 0 };
    }
  }

  async has(key: string): Promise<boolean> {
    const record = await this.getRecord(key);
    return record !== null;
  }

  async keys(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from(this.config.table!)
        .select('key');

      if (error) throw error;

      return (data || []).map(record => record.key);
    } catch (error: unknown) {
      logger.error('Supabase keys error:', 'SupabaseStorageProvider', error);
      return [];
    }
  }

  // File operations

  async uploadFile(file: File | Blob, options: FileUploadOptions = {}): Promise<FileInfo> {
    try {
      const bucket = options.bucket || this.config.bucket!;
      const fileName = options.fileName || `${Date.now()}_${file.name || 'file'}`;
      const path = options.path ? `${options.path}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          contentType: options.contentType || file.type,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL if requested
      let publicUrl: string | undefined;
      if (options.public) {
        const { data: urlData } = this.client.storage
          .from(bucket)
          .getPublicUrl(path);
        publicUrl = urlData.publicUrl;
      }

      // Create file info
      const fileInfo: FileInfo = {
        id: data.path,
        name: fileName,
        size: file.size,
        type: file.type,
        url: data.path,
        publicUrl,
        bucket,
        path: data.path,
        metadata: options.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store metadata in database
      await this.set(`_file_${data.path}`, fileInfo);

      return fileInfo;
    } catch (error: unknown) {
      throw this.handleError(error, 'uploadFile');
    }
  }

  async downloadFile(path: string): Promise<Blob> {
    try {
      const bucket = this.config.bucket!;
      
      const { data, error } = await this.client.storage
        .from(bucket)
        .download(path);

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      return data;
    } catch (error: unknown) {
      throw this.handleError(error, 'downloadFile', path);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const bucket = this.config.bucket!;
      
      const { error } = await this.client.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      // Remove metadata
      await this.delete(`_file_${path}`);
    } catch (error: unknown) {
      throw this.handleError(error, 'deleteFile', path);
    }
  }

  async getFileUrl(
    path: string,
    options?: { download?: boolean; expiresIn?: number }
  ): Promise<string> {
    try {
      const bucket = this.config.bucket!;

      if (options?.download || options?.expiresIn) {
        // Create signed URL
        const { data, error } = await this.client.storage
          .from(bucket)
          .createSignedUrl(path, options.expiresIn || 3600);

        if (error) throw error;
        if (!data) throw new Error('No URL returned');

        return data.signedUrl;
      } else {
        // Get public URL
        const { data } = this.client.storage
          .from(bucket)
          .getPublicUrl(path);

        return data.publicUrl;
      }
    } catch (error: unknown) {
      throw this.handleError(error, 'getFileUrl', path);
    }
  }

  async listFiles(
    prefix?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<FileInfo[]> {
    try {
      const bucket = this.config.bucket!;
      
      const { data, error } = await this.client.storage
        .from(bucket)
        .list(prefix, {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
        });

      if (error) throw error;

      // Map to FileInfo
      const files = await Promise.all(
        (data || []).map(async (file) => {
          const path = prefix ? `${prefix}/${file.name}` : file.name;
          const metadata = await this.get<FileInfo>(`_file_${path}`);
          
          return metadata || {
            id: file.id,
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'application/octet-stream',
            url: path,
            bucket,
            path,
            createdAt: new Date(file.created_at),
            updatedAt: new Date(file.updated_at),
          };
        })
      );

      return files;
    } catch (error: unknown) {
      throw this.handleError(error, 'listFiles');
    }
  }

  // Private helper methods

  private async getRecord(key: string): Promise<StorageRecord | null> {
    try {
      const { data, error } = await this.client
        .from(this.config.table!)
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  private parseMetadata(metadata: any): StorageMetadata {
    if (!metadata) return this.createMetadata();
    
    return {
      ...metadata,
      createdAt: new Date(metadata.createdAt || metadata.created_at),
      updatedAt: new Date(metadata.updatedAt || metadata.updated_at),
      expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : undefined,
    };
  }

  private serializeMetadata(metadata: StorageMetadata): any {
    return {
      ...metadata,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
      expiresAt: metadata.expiresAt?.toISOString(),
    };
  }

  private mapOrderBy(field: string): string {
    const mapping: Record<string, string> = {
      key: 'key',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      size: 'metadata->size',
    };
    return mapping[field] || field;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(error: any, operation: string, key?: string): Error {
    const message = error.message || `Supabase ${operation} failed`;
    let code: any = 'PROVIDER_ERROR';

    if (error.code === 'PGRST116') {
      code = 'NOT_FOUND';
    } else if (error.code === '42501') {
      code = 'PERMISSION_DENIED';
    } else if (message.includes('quota')) {
      code = 'QUOTA_EXCEEDED';
    }

    return new StorageError(
      key ? `${message} for key: ${key}` : message,
      code,
      'supabase',
      error
    );
  }
}