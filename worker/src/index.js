import { handleUVRequest } from './uv-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If request path starts with /proxy/ (Cloudflare worker route)
    if (url.pathname.startsWith('/proxy/')) {
      // /proxy/<encoded>
      const encoded = url.pathname.replace('/proxy/', '');
      const target = decodeURIComponent(encoded);
      return await handleUVRequest(request, target);
    }

    // For everything else, pass through (Pages or static)
    return fetch(request);
  }
}
