const CACHE_NAME = 'imar-hesaplayici-pro-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Service Worker yüklendiğinde
self.addEventListener('install', event => {
  console.log('Service Worker: Install v2.0.0');
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
  console.log('Service Worker: Activate v2.0.0');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
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
  // Sadece GET istekleri için cache kontrol et
  if (event.request.method !== 'GET') return;
  
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı response'u cache'e kaydet
        if (response.status === 200 && response.type === 'basic') {
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
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Eğer cache'de de yoksa offline sayfası göster
            return new Response(`
              <!DOCTYPE html>
              <html lang="tr">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - İmar Hesaplayıcısı</title>
                  <style>
                      body { 
                          font-family: 'Segoe UI', sans-serif; 
                          text-align: center; 
                          padding: 50px; 
                          background: #f3f4f6;
                      }
                      .offline-message {
                          background: white;
                          padding: 40px;
                          border-radius: 15px;
                          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                          max-width: 500px;
                          margin: 0 auto;
                      }
                      .emoji { font-size: 60px; margin-bottom: 20px; }
                      h1 { color: #1f2937; margin-bottom: 15px; }
                      p { color: #6b7280; margin-bottom: 20px; }
                      button { 
                          background: #2563eb; 
                          color: white; 
                          border: none; 
                          padding: 12px 24px; 
                          border-radius: 8px; 
                          cursor: pointer;
                          font-size: 16px;
                      }
                      button:hover { background: #1d4ed8; }
                  </style>
              </head>
              <body>
                  <div class="offline-message">
                      <div class="emoji">📱</div>
                      <h1>Çevrimdışı Mod</h1>
                      <p>İnternet bağlantınız yok, ancak İmar Hesaplayıcısı offline çalışmaya devam ediyor!</p>
                      <p>Hesaplamalarınız cihazınızda yapılacak ve bağlantı kurulduğunda senkronize edilecek.</p>
                      <button onclick="location.reload()">🔄 Tekrar Dene</button>
                  </div>
              </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
  );
});

// Background sync için
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-calculations') {
    console.log('Service Worker: Background sync for calculations');
    event.waitUntil(syncCalculations());
  }
});

// Offline hesaplamaları senkronize et
function syncCalculations() {
  return new Promise((resolve) => {
    // Burada offline yapılan hesaplamaları backend'e gönderebiliriz
    // Şimdilik sadece log yazdırıyoruz
    console.log('Offline calculations synced');
    resolve();
  });
}

// Push notifications için (gelecekte kullanılabilir)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'İmar hesaplamanız tamamlandı!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [
        {
          action: 'open',
          title: 'Aç',
          icon: '/icons/action-open.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'İmar Hesaplayıcısı', 
        options
      )
    );
  }
});

// Notification click eventi
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
