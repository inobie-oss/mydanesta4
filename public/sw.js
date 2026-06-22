const CACHE_NAME = 'dranfrean-v1';

// Static resources to pre-cache immediately on service worker install
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// On install, pre-cache the basic app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      return cache.addAll(PRECACHE_RESOURCES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// On activation, clear any outdated caches to keep client lightweight
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache bundle:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Intercept requests to serve cached static assets or fall back to cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle local HTTP/HTTPS requests
  if (!url.protocol.startsWith('http') || request.method !== 'GET') {
    return;
  }

  // Strategy for HTML/Pages: Network-First, fallback instantly to cached /index.html if offline
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response and save to cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve the cached index.html
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Strategy for Static Scripts, Fonts, and Styles: Stale-While-Revalidate
  // Serve from cache immediately for rapid loading, but fetch the latest in background
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Silent offline fail, the cache was already matched
        });

      return cachedResponse || fetchPromise;
    })
  );
});
