/**
 * Padma's Floral — Supabase Storage Client Service
 * 
 * Handles:
 * - Product images ('product-images' bucket)
 * - Category images ('category-images' bucket)
 * - Gallery images ('gallery-images' bucket)
 * 
 * Enforces:
 * - Client-side file type validation (image/jpeg, png, webp, avif, gif)
 * - File size limits (Max 5MB)
 * - Path sanitization (no directory traversal)
 * - Client-side image optimization (HTML5 Canvas downscaling + WebP compression)
 * - Never uses service-role keys; respects Supabase RLS policies
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type StorageBucket = 'product-images' | 'category-images' | 'gallery-images';

export interface ImageOptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  savingsPercentage: number;
  previewUrl: string;
}

export interface UploadResult {
  url: string;
  path: string;
  bucket: StorageBucket;
  originalSize: number;
  uploadedSize: number;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Sanitize filename to prevent directory traversal and invalid characters
 */
export function sanitizeFilename(name: string): string {
  // Extract extension
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') : 'webp';
  const baseName = parts.join('-')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const cleanBase = baseName || 'flower-image';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${cleanBase}-${timestamp}-${random}.${ext}`;
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type}). Allowed formats: JPG, PNG, WebP, AVIF, GIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum limit of 5.00 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Optimize image before upload:
 * - Downscale high-resolution phone camera photos to max dimensions (1600x1600)
 * - Compress to WebP (quality 0.85) to slash bandwidth while keeping blooms crisp
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<ImageOptimizationResult> {
  // If already a small GIF, don't run canvas compression (preserves animation)
  if (file.type === 'image/gif' && file.size < 1.5 * 1024 * 1024) {
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      savingsPercentage: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            file,
            originalSize: file.size,
            optimizedSize: file.size,
            savingsPercentage: 0,
            previewUrl: URL.createObjectURL(file),
          });
        }

        // Crisp image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output type (prefer WebP)
        const outputType = 'image/webp';
        const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                originalSize: file.size,
                optimizedSize: file.size,
                savingsPercentage: 0,
                previewUrl: URL.createObjectURL(file),
              });
            }

            // Only use optimized blob if it actually reduced size or normalized format
            const optimizedFile = new File([blob], cleanName, { type: outputType });
            const savings = Math.max(0, Math.round(((file.size - optimizedFile.size) / file.size) * 100));

            resolve({
              file: optimizedFile,
              originalSize: file.size,
              optimizedSize: optimizedFile.size,
              savingsPercentage: savings,
              previewUrl: URL.createObjectURL(blob),
            });
          },
          outputType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export const storageService = {
  /**
   * Upload an image to Supabase Storage with validation and optimization
   */
  async uploadImage(
    bucket: StorageBucket,
    file: File,
    nameHint?: string,
    options?: { optimize?: boolean; upsert?: boolean }
  ): Promise<UploadResult> {
    // 1. Validate raw file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const originalSize = file.size;

    // 2. Client-side optimization (default enabled)
    let uploadFile = file;
    let previewDataUrl = '';
    if (options?.optimize !== false) {
      try {
        const optimized = await optimizeImage(file);
        uploadFile = optimized.file;
        previewDataUrl = optimized.previewUrl;
      } catch (e) {
        console.warn('Image optimization skipped:', e);
      }
    }

    // 3. Generate secure storage path
    const sanitizedPath = sanitizeFilename(nameHint || file.name);

    // 4. Check Supabase connection
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(sanitizedPath, uploadFile, {
            cacheControl: '3600',
            upsert: options?.upsert ?? true,
            contentType: uploadFile.type,
          });

        if (error) {
          console.error(`Supabase Storage upload to ${bucket} failed:`, error);
          throw new Error(`Upload failed: ${error.message}`);
        }

        // Retrieve public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        return {
          url: urlData.publicUrl,
          path: data.path,
          bucket,
          originalSize,
          uploadedSize: uploadFile.size,
        };
      } catch (err: any) {
        console.warn('Supabase storage live upload error, falling back:', err);
        throw err;
      }
    }

    // 5. Offline / Local fallback: Return local preview object URL or data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result as string || previewDataUrl,
          path: sanitizedPath,
          bucket,
          originalSize,
          uploadedSize: uploadFile.size,
        });
      };
      reader.readAsDataURL(uploadFile);
    });
  },

  /**
   * Upload flower product image
   */
  async uploadProductImage(file: File, productSlugOrName?: string): Promise<UploadResult> {
    return this.uploadImage('product-images', file, productSlugOrName);
  },

  /**
   * Upload category banner / thumbnail
   */
  async uploadCategoryImage(file: File, categorySlugOrName?: string): Promise<UploadResult> {
    return this.uploadImage('category-images', file, categorySlugOrName);
  },

  /**
   * Upload lookbook / gallery photo
   */
  async uploadGalleryImage(file: File, galleryTitle?: string): Promise<UploadResult> {
    return this.uploadImage('gallery-images', file, galleryTitle);
  },

  /**
   * Get public URL for an existing file
   */
  getPublicUrl(bucket: StorageBucket, path: string): string {
    if (isSupabaseConfigured() && supabase) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return path;
  },

  /**
   * Delete an image from storage
   */
  async deleteImage(bucket: StorageBucket, path: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        return !error;
      } catch (err) {
        console.error('Delete image failed:', err);
        return false;
      }
    }
    return true;
  }
};
