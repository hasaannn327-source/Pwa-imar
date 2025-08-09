const CACHE_NAME = 'imar-hesaplayici-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Service Worker yüklendiğinde
self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker aktif olduğunda
self.addEventListener('activate', event => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch eventi - offline çalışma için
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching');
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı response'u cache'e kaydet
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Network başarısız olursa cache'den döndür
        return caches.match(event.request);
      })
  );
});
