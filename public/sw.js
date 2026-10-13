/**
 * Padma's Floral Atelier — Progressive Web App Service Worker
 * Version: 1.0.0
 * 
 * Strategies:
 * 1. Navigation requests: Network-first with cached App Shell fallback for instant offline loading.
 * 2. Static Assets (CSS, JS, WebFonts, SVGs): Stale-While-Revalidate for maximum responsiveness.
 * 3. Product & Catalog Images: Cache-first with network fallback.
 * 4. API & Order Mutations: Strictly Network-Only (no phantom offline order submissions).
 */

const CACHE_VERSION = 'padma-floral-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Core Application Shell assets precached on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event — Precache essential application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests (e.g. POST order creation, mutations)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Never cache sensitive authentication or live order placement API endpoints
  if (
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/rest/v1/orders') ||
    url.pathname.includes('/rpc/create_order')
  ) {
    return;
  }

  // 3. Navigation requests (HTML pages): Network-First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const indexShell = await caches.match('/index.html');
          if (indexShell) return indexShell;
          return caches.match('/');
        })
    );
    return;
  }

  // 4. Product images & photographic assets: Cache-First, fallback to network
  if (
    request.destination === 'image' ||
    url.hostname.includes('unsplash.com') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              // Limit image cache to 80 items
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback to local flower SVG icon if image fails offline
          return caches.match('/favicon.svg');
        });
      })
    );
    return;
  }

  // 5. Scripts, Stylesheets, Google Fonts: Stale-While-Revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Dynamic cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for message from client to skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
