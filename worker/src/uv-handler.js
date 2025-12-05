export async function handleProxy(request, target, env) {
  try{
    // Build upstream request
    const upstreamResp = await fetch(target, {
      method: request.method,
      headers: stripHopByHopHeaders(request.headers),
      redirect: 'follow',
      // body: streaming not supported in some wrangler versions - keep simple
    });

    // Clone headers & remove blocking ones
    const headers = new Headers(upstreamResp.headers);
    headers.delete('x-frame-options');
    headers.delete('frame-options');

    // CSP handling:
    // Instead of removing entire CSP (dangerous), attempt to patch frame-ancestors and default-src.
    const csp = headers.get('content-security-policy');
    if(csp) {
      const patched = patchCSPForEmbedding(csp);
      if(patched) headers.set('content-security-policy', patched);
      else headers.delete('content-security-policy');
    }

    // ensure CORS for dev/frontend
    headers.set('access-control-allow-origin','*');

    const ct = (headers.get('content-type') || '').toLowerCase();

    // YouTube-specific: if HTML, rewrite base + inject proxy helper for relative loads & media range proxying
    if(ct.includes('text/html')) {
      let text = await upstreamResp.text();

      // Inject <base> so relative URLs resolve
      text = text.replace(/<head([^>]*)>/i, `<head$1><base href="${escapeHtml(target)}">`);

      // Inject script that rewrites script/style tags src/href to go via the worker proxy
      const injector = `
<script>
(function(){
  // Simple runtime rewrites: for <link> and <script> elements, rewrite src/href to absolute and to proxy
  const workerBase = '${env && env.WORKER_BASE ? env.WORKER_BASE : ''}';
  function proxifyUrl(u){
    try{ const abs = new URL(u, location.href).href; return workerBase ? workerBase + '/proxy/' + encodeURIComponent(abs) : '/_proxy/' + encodeURIComponent(abs);}
    catch(e){ return u;}
  }
  const tags = document.querySelectorAll('script[src], link[href], img[src], source[src], video[src]');
  tags.forEach(t=>{
    if(t.tagName==='SCRIPT' && t.src){ t.src = proxifyUrl(t.src); }
    if(t.tagName==='LINK' && t.href){ t.href = proxifyUrl(t.href); }
    if(t.tagName==='IMG' && t.src){ t.src = proxifyUrl(t.src); }
    if(t.tagName==='SOURCE' && t.src){ t.src = proxifyUrl(t.src); }
  });
  // Patch fetch to route some video/manifest requests through proxy (simple heuristic)
  const origFetch = window.fetch;
  window.fetch = function(resource, init){
    try{
      const url = typeof resource === 'string' ? resource : resource.url;
      if(url && (url.includes('googlevideo.com') || url.includes('youtube.com') || url.match(/\\.m3u8/))) {
        const prox = workerBase ? workerBase + '/proxy/' + encodeURIComponent(new URL(url, location.href).href) : '/_proxy/' + encodeURIComponent(new URL(url, location.href).href);
        resource = prox;
      }
    }catch(e){}
    return origFetch(resource, init);
  };
})();
</script>`;

      // Append injector before </body>
      text = text.replace(/<\/body>/i, injector + '</body>');

      headers.delete('content-length'); // will be recalculated by platform
      return new Response(text, { status: upstreamResp.status, headers });
    }

    // For video segments and range requests, pass through with Range support
    if(request.headers.get('range') || ct.includes('video') || ct.includes('application/octet-stream')) {
      // Stream directly
      return new Response(upstreamResp.body, { status: upstreamResp.status, headers });
    }

    // Default: return as-is (binary streams will work)
    return new Response(upstreamResp.body, { status: upstreamResp.status, headers });
  } catch(e){
    return new Response('Worker fetch failed: ' + e.message, { status: 502 });
  }
}

// Helper functions

function stripHopByHopHeaders(headers){
  const out = new Headers(headers);
  const hop = ['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailers','transfer-encoding','upgrade'];
  hop.forEach(h => out.delete(h));
  return out;
}

function patchCSPForEmbedding(csp){
  // Very simple patch: remove frame-ancestors directive or set to *
  try{
    // if frame-ancestors present, replace its value
    if(/frame-ancestors/i.test(csp)){
      return csp.replace(/frame-ancestors[^;]*;/i, 'frame-ancestors *;');
    }
    // otherwise add permissive frame-ancestors
    return csp + '; frame-ancestors *;';
  }catch(e){
    return null;
  }
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
