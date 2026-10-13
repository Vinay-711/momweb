/**
 * seoConfig.ts — Centralized SEO constants and helpers for Padma's Floral
 *
 * All SEO-related values (site name, default descriptions, base URL, OG defaults)
 * are defined here so page-level SEO is consistent and easy to maintain.
 */

// ---------------------------------------------------------------------------
// Site-Wide Constants
// ---------------------------------------------------------------------------

/** Base URL for canonical links and OG tags. Set VITE_SITE_URL in .env for production. */
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://padmasfloral.com';

export const SITE_NAME = "Padma's Floral";
export const SITE_TAGLINE = 'Artisan Floral Boutique';

// Verified Real Business Constants (Strictly grounded in store configuration)
export const BUSINESS_ADDRESS = 'Ramanagara Town';
export const BUSINESS_CITY = 'Ramanagara';
export const BUSINESS_PINCODE = '562159';
export const BUSINESS_STATE = 'Karnataka';
export const BUSINESS_COUNTRY = 'IN';
export const BUSINESS_PHONE = '+91 9740030159';
export const BUSINESS_PHONE_RAW = '9740030159';
export const BUSINESS_WHATSAPP = '+91 7676117596';
export const BUSINESS_WHATSAPP_RAW = '7676117596';
export const BUSINESS_INSTAGRAM = '__vinxy_';
export const BUSINESS_INSTAGRAM_URL = 'https://www.instagram.com/__vinxy_/';
export const BUSINESS_EMAIL = 'padmasfloral@gmail.com';
export const BUSINESS_HOURS = '24/7';
export const GOOGLE_MAPS_SEARCH_URL =
  'https://www.google.com/maps/search/?api=1&query=Padma%27s+Floral+Ramanagara+Town+Karnataka';
export const GOOGLE_MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Padma%27s+Floral+Ramanagara+Town+Karnataka';

export const DEFAULT_TITLE = "Padma's Floral | All Types of Flower Decorations | Ramanagara & Bengaluru";
export const DEFAULT_DESCRIPTION =
  'All types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7. Order via call or WhatsApp at 7676117596.';

/** Default OG image — hero or brand image used when no page-specific image exists. */
export const DEFAULT_OG_IMAGE =
  'https://padmasfloral.com/images/products/flower-decorations.jpg';

export const DEFAULT_LOCALE = 'en_IN';
export const TWITTER_CARD_TYPE = 'summary_large_image' as const;

// ---------------------------------------------------------------------------
// Helper: Build Canonical URL
// ---------------------------------------------------------------------------

/**
 * Builds an absolute canonical URL from a relative path.
 * Strips trailing slashes for consistency (except root "/").
 */
export function canonicalUrl(path: string): string {
  const base = SITE_URL.replace(/\/+$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  // Don't add trailing slash — keep clean canonical
  return clean === '/' ? base : `${base}${clean}`;
}

// ---------------------------------------------------------------------------
// Helper: Truncate Description
// ---------------------------------------------------------------------------

/**
 * Truncates a description to a target character count, breaking at a word boundary.
 * Appends "…" if truncated. Ideal for meta descriptions (~155 chars).
 */
export function truncateDescription(text: string, maxLength = 155): string {
  if (!text) return DEFAULT_DESCRIPTION;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

// ---------------------------------------------------------------------------
// Helper: Build Page Title
// ---------------------------------------------------------------------------

/**
 * Builds a page title with consistent branding suffix.
 * If `pageTitle` is omitted, returns the default title.
 */
export function buildTitle(pageTitle?: string): string {
  if (!pageTitle) return DEFAULT_TITLE;
  return `${pageTitle} | ${SITE_NAME}`;
}

// ---------------------------------------------------------------------------
// Structured Data Helpers (JSON-LD)
// ---------------------------------------------------------------------------

export interface LocalBusinessData {
  name: string;
  phone: string;
  address?: string;
  city?: string;
  pincode?: string;
  url?: string;
  image?: string;
  description?: string;
}

/**
 * Generates LocalBusiness JSON-LD structured data.
 * Only includes fields with real values — does NOT fabricate hours, ratings, or reviews.
 */
export function buildLocalBusinessJsonLd(data: LocalBusinessData): object {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Florist',
    name: data.name,
    url: data.url || SITE_URL,
    telephone: data.phone || BUSINESS_PHONE,
    email: BUSINESS_EMAIL,
    image: data.image || DEFAULT_OG_IMAGE,
    description: data.description || DEFAULT_DESCRIPTION,
    hasMap: GOOGLE_MAPS_SEARCH_URL,
  };

  // Real physical location in Ramanagara
  schema.address = {
    '@type': 'PostalAddress',
    streetAddress: data.address || BUSINESS_ADDRESS,
    addressLocality: data.city || BUSINESS_CITY,
    addressRegion: BUSINESS_STATE,
    addressCountry: BUSINESS_COUNTRY,
    postalCode: data.pincode || BUSINESS_PINCODE,
  };

  // Geo coordinates for Ramanagara, Karnataka
  schema.geo = {
    '@type': 'GeoCoordinates',
    latitude: 12.7209,
    longitude: 77.2799,
  };

  // Real social media profile
  schema.sameAs = [
    BUSINESS_INSTAGRAM_URL,
  ];

  // Real verified business opening hours (24/7, Monday - Sunday)
  schema.openingHoursSpecification = [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
  ];

  // Areas actively served
  schema.areaServed = [
    { '@type': 'City', name: 'Ramanagara' },
    { '@type': 'City', name: 'Bengaluru' },
  ];

  // Price range indicator (non-fabricated — standard florist range indicator)
  schema.priceRange = '₹₹';

  return schema;
}

export interface ProductSchemaData {
  name: string;
  description: string;
  image: string;
  price: number;
  salePrice?: number | null;
  availability: boolean;
  url: string;
  sku?: string;
  category?: string;
}

/**
 * Generates Product JSON-LD structured data.
 * Does NOT include AggregateRating or Review — we never fabricate those.
 */
export function buildProductJsonLd(data: ProductSchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: truncateDescription(data.description, 300),
    image: data.image,
    url: data.url,
    ...(data.sku && { sku: data.sku }),
    ...(data.category && { category: data.category }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: data.salePrice ?? data.price,
      ...(data.salePrice && {
        priceSpecification: {
          '@type': 'PriceSpecification',
          price: data.salePrice,
          priceCurrency: 'INR',
        },
      }),
      availability: data.availability
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates BreadcrumbList JSON-LD structured data.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
