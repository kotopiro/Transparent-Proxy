// worker/src/uv-handler.js
// Enhanced UV handler with YouTube-targeted improvements.
// IMPORTANT: This is a template. Tweak for your account limits/policies.

const HOST_PATTERNS = {
  youtube: [/^https?:\/\/(www\.)?youtube\.com/i, /^https?:\/\/(www\.)?youtube-nocookie\.com/i],
  ytimg: [/^https?:\/\/.*\.ytimg\.com/i],
  googlevideo: [/^https?:\/\/.*\.googlevideo\.com/i],
};

function matchesAny(url, patterns){
  return patterns.some(p => p.test(url));
}

// Patch CSP header safely: attempt to remove only directives that block framing or inline scripts needed.
// Strategy: parse CSP into directives map, remove frame-ancestors, allow 'unsafe-inline' for script-src if necessary.
function patchCSPHeader(cspValue){
  if(!cspValue) return null;
  // naive parse: split by ';'
  const directives = cspValue.split(';').map(s => s.trim()).filter(Boolean);
  const map = {};
  for(const d of directives){
    const [name, ...vals] = d.split(/\s+/);
    map[name] = vals;
  }
  // remove frame-ancestors to allow embedding
  if(map['frame-ancestors']) delete map['frame-ancestors'];
  // optionally relax script-src to allow inline scripts if they break, but prefer not to add unsafe-eval
  if(map['script-src'] && !map['script-src'].includes("'unsafe-inline'")){
    map['script-src'].push("'unsafe-inline'");
  }
  // rebuild
  const rebuilt = Object.entries(map).map(([k,v]) => [k, v.join(' ')].join(' ')).join('; ');
  return rebuilt || null;
}

async function streamResponse(upstream, responseInitHeaders){
  // upstream is a Fetch Response object
  // For streaming binary (video) we can return upstream.body with modified headers
  const headers = new Headers(upstream.headers);

  // delete blockers
  headers.delete('x-frame-options');
  headers.delete('frame-options');

  // Patch CSP if present
  const csp = headers.get('content-security-policy');
  if(csp){
    const patched = patchCSPHeader(csp);
    if(patched) headers.set('content-security-policy', patched);
    else headers.delete('content-security-policy');
  }

  // permissive CORS for dev — remove for prod or restrict
  headers.set('access-control-allow-origin', '*');

  // merge responseInitHeaders (priority)
  for(const [k,v] of Object.entries(responseInitHeaders || {})){
    headers.set(k, v);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}

export async function handleProxy(request, target, env){
  // Forward Range header for streaming support
  const reqHeaders = new Headers(request.headers);
  // Accept range if present from client
  const range = reqHeaders.get('range');
  if(range) {
    // keep
  }

  // Build fetch options
  const fetchInit = {
    method: request.method,
    headers: reqHeaders,
    redirect: 'follow',
    body: ['GET','HEAD'].includes(request.method) ? undefined : request.body
  };

  // Set a sane user-agent (some hosts block unknown agents)
  if(!reqHeaders.get('user-agent')){
    fetchInit.headers.set('user-agent', 'Mozilla/5.0 (compatible; TransparentProxy/1.0)');
  }

  try{
    const upstream = await fetch(target, fetchInit);

    // If upstream is 404/err -> pass through
    if(!upstream.ok && upstream.status !== 206){
      // still return the response to show errors
    }

    // handle content type
    const contentType = upstream.headers.get('content-type') || '';
    // if video (streaming) -> stream with Range support
    if(contentType.includes('video') || contentType.includes('audio') || upstream.status === 206){
      return await streamResponse(upstream, {});
    }

    // if image or binary, stream as-is
    if(contentType.includes('image') || contentType.includes('application/octet-stream')){
      return await streamResponse(upstream, {});
    }

    // if HTML -> rewrite: inject <base> and a small script to convert relative links to absolute via base
    if(contentType.includes('text/html')){
      let text = await upstream.text();

      // Inject <base href="..."> to make relative links resolve
      const baseTag = `<base href="${escapeHTML(target)}">`;

      // small script to rewrite DOM links that bypass base issues (if necessary)
      const helperScript = `
<script>
  // Transparent-Proxy injected script: rewrite relative src/href to absolute using base href
  (function(){
    try{
      const base = document.querySelector('base') ? document.querySelector('base').href : location.href;
      function toAbs(url){
        try { return new URL(url, base).href; } catch(e) { return url; }
      }
      const attrs = [['img','src'], ['script','src'], ['link','href'], ['a','href'], ['source','src']];
      for(const [tag, attr] of attrs){
        for(const el of document.getElementsByTagName(tag)){
          const v = el.getAttribute(attr);
          if(v && !/^(https?:|data:|\/\/)/i.test(v)){
            el.setAttribute(attr, toAbs(v));
          }
        }
      }
    }catch(e){ console.warn('injected rewrite failed', e); }
  })();
</script>`;

      // Place <base> right after <head>
      const newText = text.replace(/<head(?=[\s>])/i, `<head>${baseTag}`);
      // Inject helperScript before </head>
      const final = newText.replace(/<\/head>/i, helperScript + '</head>');

      // Build headers: clone upstream headers but update content-length
      const headers = new Headers(upstream.headers);
      headers.delete('x-frame-options');
      headers.delete('frame-options');

      const csp = headers.get('content-security-policy');
      if(csp){
        const patched = patchCSPHeader(csp);
        if(patched) headers.set('content-security-policy', patched);
        else headers.delete('content-security-policy');
      }

      // set cors for dev
      headers.set('access-control-allow-origin','*');
      headers.set('content-length', String(new TextEncoder().encode(final).length));
      // ensure text/html
      headers.set('content-type', 'text/html; charset=utf-8');

      return new Response(final, { status: upstream.status, statusText: upstream.statusText, headers });
    }

    // default: stream other types
    return await streamResponse(upstream, {});
  }catch(err){
    return new Response('Worker fetch failed: ' + String(err), { status: 502 });
  }
}

// helper
function escapeHTML(s){
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
