const CACHE_NAME = 'imar-hesaplayici-v2.0.1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './js/main.js',
  './js/state.js',
  './js/calc.js',
  './js/ui.js',
  './js/events.js',
  './js/pwa.js',
  './js/theme.js'
];

// Install Event
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Caching failed:', error);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const dest = event.request.destination;

  // Strategy selection
  if (dest === 'document') {
    // Network-first with timeout fallback
    event.respondWith(networkFirst(event.request, 3000));
    return;
  }
  if (dest === 'script' || dest === 'style') {
    // Stale-while-revalidate for CSS/JS
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  if (dest === 'image' || dest === 'font') {
    // Cache-first for icons/fonts
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Default: try cache, then network
  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkFirst(request, timeoutMs = 3000) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ]);
    if (response && response.ok) {
      cache.put(request, response.clone());
      return response;
    }
    throw new Error('network failed');
  } catch (e) {
    const cached = await cache.match(request);
    return cached || cache.match('./index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// Message Event
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification Permission
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Background Sync (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise(resolve => {
    console.log('[SW] Background sync completed');
    resolve();
  });
}
