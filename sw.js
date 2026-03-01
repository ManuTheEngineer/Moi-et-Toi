const CACHE_NAME = 'moiettoi-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/icons/icon-192x192.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Outfit:wght@300;400;500;600&display=swap'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(names => Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : null))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
    if (nr && nr.status === 200) { const c = nr.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, c)); }
    return nr;
  })).catch(() => caches.match('/index.html')));
});
