// uv-handler.js - simple edge proxy that strips blocking headers
export async function handleUVRequest(request, target) {
  try{
    const upstream = await fetch(target, {
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
      body: request.body
    });

    const headers = new Headers(upstream.headers);
    headers.delete('x-frame-options');
    headers.delete('frame-options');
    headers.delete('content-security-policy');

    // Optionally set CORS permissive for development
    headers.set('access-control-allow-origin', '*');

    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  }catch(e){
    return new Response('Worker fetch failed: ' + e.message, { status: 502 });
  }
}
