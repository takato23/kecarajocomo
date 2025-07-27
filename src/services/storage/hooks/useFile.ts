/**
 * useFile Hook
 * React hook for file operations with the storage service
 */

import { useState, useCallback } from 'react';
import { logger } from '@/services/logger';

import { getStorageService } from '../UnifiedStorageService';
import {
  FileUploadOptions,
  FileInfo,
  UploadProgress,
  StorageError,
  ImageResizeOptions,
} from '../types';

export interface UseFileOptions {
  bucket?: string;
  maxSize?: number; // bytes
  acceptedTypes?: string[];
  autoResize?: ImageResizeOptions;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: StorageError) => void;
}

export interface UseFileReturn {
  // State
  isUploading: boolean;
  isDownloading: boolean;
  uploadProgress: UploadProgress | null;
  error: StorageError | null;
  
  // Operations
  upload: (file: File | Blob, options?: FileUploadOptions) => Promise<FileInfo>;
  uploadMultiple: (files: File[], options?: FileUploadOptions) => Promise<FileInfo[]>;
  download: (path: string) => Promise<Blob>;
  deleteFile: (path: string) => Promise<void>;
  getUrl: (path: string, options?: { download?: boolean; expiresIn?: number }) => Promise<string>;
  
  // Utilities
  validateFile: (file: File) => { valid: boolean; error?: string };
  previewImage: (file: File) => Promise<string>;
}

export function useFile(options: UseFileOptions = {}): UseFileReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<StorageError | null>(null);
  
  const storageService = getStorageService();

  const handleError = useCallback((err: any) => {
    const error = err instanceof StorageError ? err : new StorageError(
      err.message || 'File operation failed',
      'UNKNOWN'
    );
    setError(error);
    options.onError?.(error);
    throw error;
  }, [options]);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size ${formatFileSize(file.size)} exceeds maximum ${formatFileSize(options.maxSize)}`,
      };
    }

    // Check file type
    if (options.acceptedTypes && options.acceptedTypes.length > 0) {
      const isAccepted = options.acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Wildcard type (e.g., 'image/*')
          const category = type.slice(0, -2);
          return file.type.startsWith(category);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return {
          valid: false,
          error: `File type ${file.type} is not accepted`,
        };
      }
    }

    return { valid: true };
  }, [options]);

  const upload = useCallback(async (
    file: File | Blob,
    uploadOptions?: FileUploadOptions
  ): Promise<FileInfo> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Validate if it's a File (not Blob)
      if (file instanceof File) {
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new StorageError(validation.error!, 'INVALID_VALUE');
        }
      }

      const mergedOptions: FileUploadOptions = {
        bucket: options.bucket,
        maxSize: options.maxSize,
        resize: options.autoResize,
        ...uploadOptions,
        onProgress: (progress) => {
          setUploadProgress(progress);
          options.onProgress?.(progress);
          uploadOptions?.onProgress?.(progress);
        },
      };

      const result = await storageService.uploadFile(file, mergedOptions);
      
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });
      
      return result;
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [storageService, options, validateFile, handleError]);

  const uploadMultiple = useCallback(async (
    files: File[],
    uploadOptions?: FileUploadOptions
  ): Promise<FileInfo[]> => {
    const results: FileInfo[] = [];
    const errors: Array<{ file: File; error: Error }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await upload(file, {
          ...uploadOptions,
          onProgress: (progress) => {
            // Calculate overall progress
            const overallProgress = {
              loaded: (i * 100 + progress.percentage) / files.length,
              total: 100,
              percentage: (i * 100 + progress.percentage) / files.length,
            };
            options.onProgress?.(overallProgress);
            uploadOptions?.onProgress?.(overallProgress);
          },
        });
        
        results.push(result);
      } catch (error: unknown) {
        errors.push({ file, error: error as Error });
      }
    }

    if (errors.length > 0) {
      logger.error('Some files failed to upload:', 'useFile', errors);
      // You could throw here or return partial results
    }

    return results;
  }, [upload, options]);

  const download = useCallback(async (path: string): Promise<Blob> => {
    setIsDownloading(true);
    setError(null);

    try {
      const blob = await storageService.downloadFile(path);
      return blob;
    } catch (err: unknown) {
      throw handleError(err);
    } finally {
      setIsDownloading(false);
    }
  }, [storageService, handleError]);

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    setError(null);

    try {
      await storageService.deleteFile(path);
    } catch (err: unknown) {
      throw handleError(err);
    }
  }, [storageService, handleError]);

  const getUrl = useCallback(async (
    path: string,
    urlOptions?: { download?: boolean; expiresIn?: number }
  ): Promise<string> => {
    try {
      return await storageService.getFileUrl(path, urlOptions);
    } catch (err: unknown) {
      throw handleError(err);
    }
  }, [storageService, handleError]);

  const previewImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    // State
    isUploading,
    isDownloading,
    uploadProgress,
    error,
    
    // Operations
    upload,
    uploadMultiple,
    download,
    deleteFile,
    getUrl,
    
    // Utilities
    validateFile,
    previewImage,
  };
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}