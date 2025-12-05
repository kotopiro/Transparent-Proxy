import { handleProxy } from './uv-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy route: /proxy/<encoded>
    if(url.pathname.startsWith('/proxy/')) {
      const enc = url.pathname.replace('/proxy/', '');
      const target = decodeURIComponent(enc);
      return await handleProxy(request, target, env);
    }

    // favicon proxy (optional)
    if(url.pathname.startsWith('/favicon-proxy')) {
      const q = url.searchParams.get('url');
      if(!q) return new Response('missing', {status:400});
      const target = new URL(q).origin + '/favicon.ico';
      const r = await fetch(target);
      const headers = new Headers(r.headers);
      headers.set('access-control-allow-origin','*');
      return new Response(r.body, {status:r.status, headers});
    }

    return new Response('Transparent-Proxy Worker OK', { status: 200 });
  }
}
