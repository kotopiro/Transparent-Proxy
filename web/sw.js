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

        // copy headers and remove frame/CSP blockers
        const headers = new Headers(resp.headers);
        headers.delete('x-frame-options');
        headers.delete('frame-options');
        headers.delete('content-security-policy');

        return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
      }catch(e){
        return new Response('Proxy fetch failed: '+e.message, { status: 502 });
      }
    })());
    return;
  }
  event.respondWith(fetch(event.request));
});
