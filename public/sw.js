const CACHE_NAME = 'timer-app-v2';

// Pre-cache only the app shell (guaranteed to exist)
const PRECACHE_URLS = [
  '/',
  '/manifest.json'
];

// Audio files to cache on first use
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const isAudio = AUDIO_EXTENSIONS.some(ext => url.pathname.endsWith(ext));

  if (isAudio) {
    // Audio files: cache-first (large files, rarely change)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  } else {
    // Everything else: network-first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
