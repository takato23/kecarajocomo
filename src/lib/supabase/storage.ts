/**
 * Supabase Storage utilities for handling file uploads
 */

import { supabase } from './client';

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

/**
 * Upload a file to Supabase Storage bucket
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false,
      contentType: options?.contentType || file.type,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fullPath: data.fullPath || data.path,
  };
}

/**
 * Upload pantry item photo
 */
export async function uploadPantryPhoto(
  userId: string,
  file: File,
  itemId?: string
): Promise<UploadResult> {
  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = itemId 
    ? `${itemId}_${timestamp}.${extension}`
    : `pantry_${timestamp}.${extension}`;
  
  const path = `pantry/${userId}/${filename}`;

  return uploadFile('pantry-images', path, file, {
    contentType: file.type,
    upsert: true,
  });
}

/**
 * Upload recipe photo
 */
export async function uploadRecipePhoto(
  userId: string,
  file: File,
  recipeId?: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = recipeId 
    ? `${recipeId}_${timestamp}.${extension}`
    : `recipe_${timestamp}.${extension}`;
  
  const path = `recipes/${userId}/${filename}`;

  return uploadFile('recipe-images', path, file, {
    contentType: file.type,
    upsert: true,
  });
}

/**
 * Upload receipt photo
 */
export async function uploadReceiptPhoto(
  userId: string,
  file: File
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `receipt_${timestamp}.${extension}`;
  
  const path = `receipts/${userId}/${filename}`;

  return uploadFile('receipts', path, file, {
    contentType: file.type,
    upsert: false,
  });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete pantry photo
 */
export async function deletePantryPhoto(path: string): Promise<void> {
  return deleteFile('pantry-images', path);
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Get public URL for public files
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Compress image before upload
 */
export function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate file type and size
 */
export function validateImageFile(
  file: File,
  maxSizeInMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
): string | null {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG y WebP.';
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return `El archivo es demasiado grande. Máximo ${maxSizeInMB}MB.`;
  }

  return null;
}

/**
 * Upload with progress tracking
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Note: Supabase doesn't support upload progress natively
  // This is a wrapper that simulates progress for UX
  
  if (onProgress) {
    onProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      // This is just for UX, real progress would need custom implementation
      const currentProgress = Math.min(90, Math.random() * 80 + 10);
      onProgress(currentProgress);
    }, 100);

    try {
      const result = await uploadFile(bucket, path, file);
      clearInterval(progressInterval);
      onProgress(100);
      return result;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  }

  return uploadFile(bucket, path, file);
}

/**
 * Batch upload multiple files
 */
export async function uploadMultiple(
  bucket: string,
  files: Array<{ path: string; file: File }>,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completed = 0;

  for (const { path, file } of files) {
    try {
      const result = await uploadFile(bucket, path, file);
      results.push(result);
      completed++;
      
      if (onProgress) {
        onProgress(completed, files.length);
      }
    } catch (error) {
      console.error(`Failed to upload ${path}:`, error);
      // Continue with other uploads
    }
  }

  return results;
}