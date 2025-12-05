self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

function decodeProxyPath(path){
  const m = path.match(/^\/_proxy\/(.+)$/);
  if(!m) return null;
  try { return decodeURIComponent(m[1]); } catch(e){ return null; }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const target = decodeProxyPath(url.pathname);
  if(target){
    event.respondWith((async () => {
      try{
        const init = { method: event.request.method, headers: event.request.headers, redirect:'follow' };
        const resp = await fetch(target, init);

        // clone for reading
        const ct = resp.headers.get('content-type') || '';
        const headers = new Headers(resp.headers);
        headers.delete('x-frame-options');
        headers.delete('frame-options');
        headers.delete('content-security-policy');

        if(ct.includes('text/html')){
          // small HTML rewrite: inject base + small script to proxy relative links
          const text = await resp.text();
          const injected = text.replace(/<head[^>]*>/i, `$&<base href="${target}"><script>/* transparent-proxy injected */</script>`);
          headers.set('content-length', String(new TextEncoder().encode(injected).length));
          return new Response(injected, {status: resp.status, statusText: resp.statusText, headers});
        } else {
          return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers});
        }
      }catch(e){
        return new Response('Proxy fetch failed: '+e.message, { status: 502 });
      }
    })());
    return;
  }

  event.respondWith(fetch(event.request));
});

// support messages
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'flush-cache'){
    caches.keys().then(keys=> Promise.all(keys.map(k=>caches.delete(k))));
  }
});
