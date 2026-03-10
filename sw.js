const CACHE_NAME = 'moiettoi-v158';

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
  './js/template-loader.js',
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

// ===== PUSH NOTIFICATIONS (#15) =====
self.addEventListener('push', e => {
  let data = { title: 'Moi et Toi', body: 'You have a new notification' };
  if (e.data) {
    try { data = e.data.json(); } catch (_) { data.body = e.data.text(); }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Moi et Toi', {
      body: data.body || '',
      icon: data.icon || './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'met-push',
      renotify: true,
      data: data.url || './'
    })
  );
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ===== BACKGROUND SYNC (#16) =====
self.addEventListener('sync', e => {
  if (e.tag === 'met-offline-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'flush-offline-queue' });
        });
      })
    );
  }
});
