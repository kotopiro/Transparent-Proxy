import { handleProxy } from './uv-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // proxy route: /proxy/<encoded>
    if (url.pathname.startsWith('/proxy/')) {
      const enc = url.pathname.replace('/proxy/', '');
      const target = decodeURIComponent(enc);
      return await handleProxy(request, target, env);
    }

    // serve health
    return new Response('Transparent-Proxy Worker OK', { status: 200 });
  }
}
