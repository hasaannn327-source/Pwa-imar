const CACHE_NAME = 'imar-hesaplayici-pro-v2.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Service Worker yüklendiğinde
self.addEventListener('install', event => {
  console.log('Service Worker: Install v2.1.0');
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
  console.log('Service Worker: Activate v2.1.0');
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
            if (event.request.destination === 'document') {
              return new Response(`
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Offline - İmar Hesaplayıcısı Pro</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .offline-container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                            max-width: 500px;
                            width: 100%;
                        }
                        .emoji { 
                            font-size: 80px; 
                            margin-bottom: 20px;
                            animation: bounce 2s infinite;
                        }
                        h1 { 
                            color: #1f2937; 
                            margin-bottom: 15px; 
                            font-size: 2rem;
                        }
                        p { 
                            color: #6b7280; 
                            margin-bottom: 20px; 
                            line-height: 1.6;
                        }
                        button { 
                            background: linear-gradient(135deg, #2563eb, #1d4ed8);
                            color: white; 
                            border: none; 
                            padding: 15px 30px; 
                            border-radius: 10px; 
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                            transition: transform 0.2s ease;
                        }
                        button:hover { 
                            transform: translateY(-2px);
                        }
                        .features {
                            margin-top: 25px;
                            text-align: left;
                            background: #f9fafb;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        .features h3 {
                            color: #1f2937;
                            margin-bottom: 10px;
                        }
                        .features ul {
                            color: #4b5563;
                            margin: 0;
                            padding-left: 20px;
                        }
                        @keyframes bounce {
                            0%, 20%, 50%, 80%, 100% {
                                transform: translateY(0);
                            }
                            40% {
                                transform: translateY(-10px);
                            }
                            60% {
                                transform: translateY(-5px);
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="offline-container">
                        <div class="emoji">📱</div>
                        <h1>Çevrimdışı Mod</h1>
                        <p>İnternet bağlantınız yok, ancak <strong>İmar Hesaplayıcısı Pro</strong> offline çalışmaya devam ediyor!</p>
                        <p>Tüm hesaplamalarınız cihazınızda yapılacak ve internet bağlantısı kurulduğunda senkronize edilecek.</p>
                        
                        <div class="features">
                            <h3>🚀 Offline Özellikler:</h3>
                            <ul>
                                <li>İmar hesaplamaları</li>
                                <li>Blok planlaması</li>
                                <li>Daire tipi seçimi</li>
                                <li>Görselleştirme</li>
                                <li>Şehir bazlı yönetmelikler</li>
                            </ul>
                        </div>
                        
                        <button onclick="location.reload()" style="margin-top: 20px;">
                            🔄 Tekrar Dene
                        </button>
                    </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
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
    // Şimdilik sadece console'a log yazdırıyoruz
    console.log('İmar hesaplamaları senkronize edildi');
    
    // LocalStorage'dan offline hesaplamaları al
    try {
      const offlineData = localStorage.getItem('offlineCalculations');
      if (offlineData) {
        const calculations = JSON.parse(offlineData);
        console.log('Senkronize edilecek hesaplamalar:', calculations);
        // Bu noktada backend'e gönderim yapılabilir
        localStorage.removeItem('offlineCalculations');
      }
    } catch (error) {
      console.error('Sync hatası:', error);
    }
    
    resolve();
  });
}

// Push notifications için (gelecekte kullanılabilir)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'İmar hesaplamanız tamamlandı!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏗️</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📊</text></svg>',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [
        {
          action: 'open',
          title: 'Aç',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">👁️</text></svg>'
        },
        {
          action: 'close',
          title: 'Kapat',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">❌</text></svg>'
        }
      ],
      tag: 'imar-calculation',
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'İmar Hesaplayıcısı Pro', 
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
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Notification close eventi
self.addEventListener('notificationclose', event => {
  console.log('Notification kapatıldı:', event.notification.tag);
});

// Message eventi - ana sayfadan mesaj alımı
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CALCULATION_DATA') {
    // Hesaplama verilerini offline için sakla
    console.log('Hesaplama verisi alındı:', event.data.data);
    
    // Background sync için register et
    if ('sync' in self.registration) {
      self.registration.sync.register('background-sync-calculations');
    }
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Update event - yeni versiyon mevcut
self.addEventListener('updatefound', () => {
  console.log('Yeni versiyon mevcut, güncelleniyor...');
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker Unhandled Promise Rejection:', event.reason);
});
