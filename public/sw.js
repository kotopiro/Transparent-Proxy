// ========================================
// Service Worker - 完全版
// オフライン対応・キャッシュ戦略
// ========================================

const CACHE_VERSION = 'transparent-proxy-v2.0.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

// キャッシュするファイル
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/animations.css',
  '/assets/css/themes.css',
  '/assets/css/responsive.css',
  '/assets/js/particles.js',
  '/assets/js/tabs.js',
  '/assets/js/history.js',
  '/assets/js/settings.js',
  '/assets/js/shortcuts.js',
  '/assets/js/ui.js',
  '/assets/js/proxy.js',
  '/assets/js/app.js',
  '/assets/img/favicon.ico'
];

// キャッシュ最大サイズ
const CACHE_LIMITS = {
  [CACHE_DYNAMIC]: 50,
  [CACHE_IMAGES]: 100
};

// ========== インストール ==========
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ========== アクティベート ==========
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
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

// ========== フェッチ ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // プロキシリクエストはキャッシュしない
  if (url.pathname.startsWith('/proxy/')) {
    return event.respondWith(fetch(request));
  }
  
  // 画像
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }
  
  // CSS/JS
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }
  
  // HTML
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_DYNAMIC));
    return;
  }
  
  // その他
  event.respondWith(cacheFirst(request, CACHE_DYNAMIC));
});

// ========== キャッシュ戦略 ==========

// Cache First（キャッシュ優先）
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
      await limitCacheSize(cacheName);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('オフラインです', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network First（ネットワーク優先）
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      await limitCacheSize(cacheName);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response('オフラインです', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale While Revalidate（キャッシュを返しつつ更新）
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cached || fetchPromise;
}

// ========== キャッシュサイズ制限 ==========
async function limitCacheSize(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  if (!limit) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > limit) {
    console.log(`[SW] Cache limit exceeded for ${cacheName}, cleaning...`);
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName);
  }
}

// ========== メッセージハンドラ ==========
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// ========== プッシュ通知 ==========
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/assets/img/icon-192.png',
    badge: '/assets/img/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Transparent Proxy', options)
  );
});

// ========== 通知クリック ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker loaded');
