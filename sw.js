const CACHE_NAME = 'moiettoi-v140';

const ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/base.css',
  './css/dynamic-bg.css',
  './css/components.css',
  './css/nav.css',
  './css/modules.css',
  './js/app.js',
  './js/nav.js',
  './js/utils.js',
  './js/metrics.js',
  './js/modules-core.js',
  './js/modules-social.js',
  './js/modules-life.js',
  './js/dashboard.js',
  './js/modules-track.js',
  './js/modules-data.js',
  './js/weather.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
    .then(() => self.clients.claim())
  );
});

// Network-first: always try network, fall back to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
