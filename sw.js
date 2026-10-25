/* Waqas Aziz portfolio PWA service worker.
   v16: HTML is network-first (no stale pages), static CSS/JS is
   stale-while-revalidate, images are cache-first only when small
   (large case photos stay out of the cache) with a capped image cache. */
const CACHE = 'waqas-aziz-v16';
const IMAGE_CACHE = 'waqas-aziz-images-v16';
const MAX_IMAGE_CACHE_ENTRIES = 60;
const MAX_CACHED_IMAGE_BYTES = 400 * 1024;
const CORE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/js/config.js',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== IMAGE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function trimImageCache() {
  caches.open(IMAGE_CACHE).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length > MAX_IMAGE_CACHE_ENTRIES) {
        return Promise.all(keys.slice(0, keys.length - MAX_IMAGE_CACHE_ENTRIES).map((k) => cache.delete(k)));
      }
      return null;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pages: network first, so visitors never see a stale page.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((hit) => hit || caches.match('/'))
        )
    );
    return;
  }

  // Images: cache first, but never cache large photos, and cap entries.
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request, { cacheName: IMAGE_CACHE }).then((hit) => {
        if (hit) return hit;
        return fetch(event.request).then((res) => {
          if (res && res.ok) {
            const len = res.headers.get('content-length');
            if (!len || Number(len) <= MAX_CACHED_IMAGE_BYTES) {
              const copy = res.clone();
              caches.open(IMAGE_CACHE).then((cache) =>
                cache.put(event.request, copy).then(trimImageCache)
              );
            }
          }
          return res;
        });
      })
    );
    return;
  }

  // CSS, JS and other same-origin static files: stale-while-revalidate.
  event.respondWith(
    caches.match(event.request).then((hit) => {
      const update = fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => null);
      if (hit) return hit;
      return update.then((res) => res || Promise.reject('offline'));
    })
  );
});
