/// <reference lib="webworker" />

const CACHE_NAME = 'kasa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install — pre-cache essential assets
self.addEventListener('install', (event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// Fetch — network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const e = event as FetchEvent;
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and API routes (always network)
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // For navigation and static assets — network first, fallback to cache
  e.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })))
  );
});
