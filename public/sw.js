const CACHE_NAME = 'jobmeter-v1';
const RUNTIME_CACHE = 'jobmeter-runtime-v1';

// Cache only essential static assets
const STATIC_CACHE_URLS = [
  '/jobs',
  '/offline.html', // Create this page as fallback
];

// Install - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Don't fail the entire install if one resource fails
        return Promise.allSettled(
          STATIC_CACHE_URLS.map((url) => 
            cache.add(url).catch((err) => console.log('Cache failed for:', url))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - Network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome extensions and non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version or offline page
        return caches.match(event.request)
          .then((cached) => cached || caches.match('/offline.html'));
      })
  );
});
