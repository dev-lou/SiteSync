/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, prerendered, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `sitesync-cache-${version}`;

const ASSETS = [
  ...build, // the app itself
  ...files, // everything in static/
  ...prerendered, // prerendered pages
];

const sw = self as unknown as ServiceWorkerGlobalScope;

// Install: cache all static assets
sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS);
      // Force the waiting service worker to activate
      await sw.skipWaiting();
    })(),
  );
});

// Activate: clean up old caches
sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(async (key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
          return undefined;
        }),
      );
      // Take control of all clients immediately
      await sw.clients.claim();
    })(),
  );
});

// Fetch: cache-first for static assets, network-first for pages and API
sw.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET') return;
  if (url.origin !== sw.location.origin) return;

  // For static assets (build files), use cache-first
  if (ASSETS.includes(url.pathname as any)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For API and Convex calls, use network-first with offline fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/metrics')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For navigation (pages), use network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // For all other requests (fonts, images), use cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    // If both cache and network fail, return a fallback
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation, return a generic offline page
    if (request.mode === 'navigate') {
      return new Response(
        `<!doctype html>
        <html>
          <head><title>Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100dvh; margin: 0; background: #f8f9fa; }
            .card { text-align: center; padding: 2rem; }
            h1 { font-size: 1.5rem; color: #1f2937; }
            p { color: #6b7280; }
          </style></head>
          <body>
            <div class="card">
              <h1>You're Offline</h1>
              <p>SiteSync Pro needs an internet connection to load.<br>Please check your connection and try again.</p>
            </div>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } },
      );
    }

    return new Response('Offline', { status: 503 });
  }
}
