const CACHE_NAME = 'transparent-proxy-v2';
const urlsToCache = ['/', '/index.html', '/style.css', '/app.js', '/favicon.svg'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(names => 
        Promise.all(names.map(n => n !== CACHE_NAME && caches.delete(n)))
    ));
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
