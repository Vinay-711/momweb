import { useEffect, useRef } from 'react';
import {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_LOCALE,
  SITE_NAME,
  TWITTER_CARD_TYPE,
  canonicalUrl,
} from '../utils/seoConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageMetaOptions {
  /** Page title — displayed in browser tab. */
  title: string;
  /** Meta description for search engine snippets (aim for ~155 chars). */
  description: string;
  /** Absolute or relative path for canonical URL. */
  canonicalPath?: string;
  /** Open Graph image URL. */
  ogImage?: string;
  /** Open Graph page type (default: "website"). */
  ogType?: 'website' | 'article' | 'product';
  /** Robots directive — e.g. "noindex, nofollow" for private pages. */
  robots?: string;
  /** Extra keywords (optional). */
  keywords?: string;
}

// ---------------------------------------------------------------------------
// Helper: Upsert a <meta> tag by attribute
// ---------------------------------------------------------------------------

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string): void {
  const selector = `meta[${attrName}="${attrValue}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attrName: 'name' | 'property', attrValue: string): void {
  const selector = `meta[${attrName}="${attrValue}"]`;
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.remove();
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook that manages <head> meta tags for SEO.
 * Sets title, description, OG, Twitter, canonical, and robots tags.
 * Restores defaults on unmount (navigation away).
 */
export function usePageMeta(options: PageMetaOptions): void {
  const prevTitle = useRef(document.title);

  useEffect(() => {
    // Save previous title for cleanup
    prevTitle.current = document.title;

    // 1. Title
    document.title = options.title;

    // 2. Description
    upsertMeta('name', 'description', options.description);

    // 3. Robots
    if (options.robots) {
      upsertMeta('name', 'robots', options.robots);
    } else {
      // Default: allow indexing
      upsertMeta('name', 'robots', 'index, follow');
    }

    // 4. Keywords (optional)
    if (options.keywords) {
      upsertMeta('name', 'keywords', options.keywords);
    }

    // 5. Canonical
    const canonical = options.canonicalPath
      ? canonicalUrl(options.canonicalPath)
      : canonicalUrl(window.location.pathname);
    upsertLink('canonical', canonical);

    // 6. Open Graph
    const ogImage = options.ogImage || DEFAULT_OG_IMAGE;
    upsertMeta('property', 'og:title', options.title);
    upsertMeta('property', 'og:description', options.description);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', options.ogType || 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', DEFAULT_LOCALE);

    // 7. Twitter Card
    upsertMeta('name', 'twitter:card', TWITTER_CARD_TYPE);
    upsertMeta('name', 'twitter:title', options.title);
    upsertMeta('name', 'twitter:description', options.description);
    upsertMeta('name', 'twitter:image', ogImage);

    // Cleanup: Restore defaults when this page unmounts
    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION);
      upsertMeta('name', 'robots', 'index, follow');
      removeMeta('name', 'keywords');
      upsertLink('canonical', canonicalUrl('/'));
      upsertMeta('property', 'og:title', DEFAULT_TITLE);
      upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE);
      upsertMeta('property', 'og:url', canonicalUrl('/'));
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('name', 'twitter:title', DEFAULT_TITLE);
      upsertMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
      upsertMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);
    };
  }, [options.title, options.description, options.canonicalPath, options.ogImage, options.ogType, options.robots, options.keywords]);
}
