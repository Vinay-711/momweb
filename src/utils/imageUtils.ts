/**
 * Image Optimization Utilities for Padma's Floral
 * 
 * Provides responsive image resizing, modern format negotiation (WebP/AVIF),
 * and dynamic srcset generation for Unsplash and CDN image sources.
 */

export const DEFAULT_IMAGE_QUALITY = 75;
export const MOBILE_SLOW_IMAGE_QUALITY = 55;

export const PRODUCT_CARD_SIZES =
  '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px';

export const HERO_IMAGE_SIZES =
  '(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 750px';

export const DETAIL_MAIN_IMAGE_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px';

export const GALLERY_IMAGE_SIZES =
  '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px';

export const THUMBNAIL_SIZES = '80px';

/**
 * Checks whether client has requested Save-Data or is on 2G/3G mobile networks.
 */
export function isDataSaverOrSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  // @ts-expect-error - navigator.connection is experimental
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false;
  return Boolean(
    conn.saveData ||
    conn.effectiveType === 'slow-2g' ||
    conn.effectiveType === '2g' ||
    conn.effectiveType === '3g'
  );
}

/**
 * Optimizes an image URL by dynamically setting target width, quality, and format negotiation.
 * Adapts automatically to constrained mobile networks (2G/3G/Save-Data) by scaling down quality & dimensions.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  width = 600,
  quality = DEFAULT_IMAGE_QUALITY
): string {
  if (!url || typeof url !== 'string') {
    return '/images/products/jasmine-garland.jpg';
  }

  // Adjust for mobile slow connections or Save-Data
  let effectiveWidth = width;
  let effectiveQuality = quality;

  if (isDataSaverOrSlowConnection()) {
    effectiveQuality = Math.min(quality, MOBILE_SLOW_IMAGE_QUALITY);
    if (width > 400) {
      effectiveWidth = Math.round(width * 0.75);
    }
  }

  // Optimize Unsplash images
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', effectiveWidth.toString());
      parsed.searchParams.set('q', effectiveQuality.toString());
      return parsed.toString();
    } catch {
      // If URL parsing fails, fallback to regex replacement or original
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?auto=format&fit=crop&w=${effectiveWidth}&q=${effectiveQuality}`;
    }
  }

  // Return standard URL unmodified if from local assets or other origins
  return url;
}

/**
 * Generates an HTML srcset string from an image URL across multiple responsive widths.
 * Example: "image.jpg?w=320 320w, image.jpg?w=480 480w, image.jpg?w=768 768w"
 */
export function getResponsiveImageSrcSet(
  url: string | undefined | null,
  widths: number[] = [320, 480, 768, 1080]
): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('images.unsplash.com')) return '';

  return widths
    .map(w => `${getOptimizedImageUrl(url, w)} ${w}w`)
    .join(', ');
}
