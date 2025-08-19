const CACHE_NAME = 'timer-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/components/Timer.jsx',
  '/src/components/HiitTimer.jsx',
  '/src/components/TabataTimer.jsx',
  '/src/components/Breathing44Timer.jsx',
  '/src/styles/globals.css',
  '/src/components/Timer.scss',
  '/src/components/HiitTimer.scss',
  '/src/components/TabataTimer.scss',
  '/src/components/Breathing44Timer.scss',
  '/src/styles/variables.scss',
  '/src/styles/mixins.scss'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});